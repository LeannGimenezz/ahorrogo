from datetime import datetime
from hashlib import sha256
from typing import Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from supabase import AsyncClient

from app.api.deps import get_db, get_current_user
from app.models.schemas import (
    DepositToVaultRequest,
    DepositResponse,
    ReceiveInfoResponse,
    SwapQuoteRequest,
    SwapQuoteResponse,
    SwapExecuteRequest,
    SwapExecuteResponse,
    SendFundsRequest,
    SendFundsResponse,
    P2PProtectedCreateRequest,
    RentalGuaranteeCreateRequest,
    TimeLockGoalCreateRequest,
    ContractSummaryResponse,
    ContractActionResponse,
    ScheduleReleaseRequest,
    ScheduleReleaseResponse,
    MotivationResponse,
    VaultStatus,
    ActivityType,
    PenguinMood,
)
from app.services.vault_contract_service import get_vault_contract, VaultType
from app.services import transfer_service
from app.services import business_contract_service


router = APIRouter(prefix="/business", tags=["business"])


def _fake_tx_hash(*chunks: str) -> str:
    value = "|".join(chunks) + "|" + datetime.utcnow().isoformat()
    return "0x" + sha256(value.encode()).hexdigest()


async def _get_owned_vault(db: AsyncClient, vault_id: str, user_id: str) -> Dict[str, Any]:
    result = await db.table("vaults").select("*").eq("id", vault_id).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Vault not found")
    return result.data[0]


@router.post("/deposit", response_model=DepositResponse)
async def deposit_to_vault(
    payload: DepositToVaultRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db),
    x_private_key: Optional[str] = Header(default=None, alias="x-private-key"),
):
    vault = await _get_owned_vault(db, payload.vault_id, current_user["id"])

    if vault["status"] != VaultStatus.ACTIVE.value:
        raise HTTPException(status_code=400, detail="Vault no está activo")

    tx_hash = payload.tx_hash
    if x_private_key and vault.get("on_chain_id") is not None:
        try:
            contract = get_vault_contract(private_key=x_private_key)
            result = contract.deposit(int(vault["on_chain_id"]), payload.amount)
            tx_hash = result.tx_hash
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Error on-chain deposit: {str(exc)}")

    if not tx_hash:
        tx_hash = _fake_tx_hash("deposit", payload.vault_id, str(payload.amount), payload.payment_method.value)

    current_amount = float(vault["current"])
    target_amount = float(vault["target"])
    new_balance = current_amount + payload.amount
    progress = min(new_balance / target_amount, 1.0) if target_amount > 0 else 0
    new_status = VaultStatus.COMPLETED.value if new_balance >= target_amount else VaultStatus.ACTIVE.value

    await db.table("vaults").update({"current": new_balance, "status": new_status}).eq("id", payload.vault_id).execute()

    await db.table("activities").insert(
        {
            "vault_id": payload.vault_id,
            "activity_type": ActivityType.DEPOSIT.value,
            "amount": payload.amount,
            "tx_hash": tx_hash,
            "metadata": {"payment_method": payload.payment_method.value},
        }
    ).execute()

    # XP simple para mantener compatibilidad con frontend
    xp_earned = max(10, int(payload.amount * 0.5))
    new_xp = int(current_user.get("xp", 0)) + xp_earned
    new_level = current_user.get("level", 1)

    return DepositResponse(
        success=True,
        xp_earned=xp_earned,
        new_xp=new_xp,
        new_level=new_level,
        streak=current_user.get("streak", 0),
        streak_incremented=True,
        vault_progress=progress,
        mood=PenguinMood.HAPPY,
        tx_hash=tx_hash,
        new_balance=new_balance,
    )


@router.get("/receive", response_model=ReceiveInfoResponse)
async def get_receive_info(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db),
):
    profile = await business_contract_service.get_receive_profile(db, current_user["id"])
    if not profile:
        profile = await business_contract_service.upsert_receive_profile(
            db=db,
            user_id=current_user["id"],
            beexo_alias=current_user["alias"],
            wallet_address=current_user["address"],
            cvu=f"0000003100{current_user['id'].replace('-', '')[:12]}",
        )

    return ReceiveInfoResponse(
        beexo_alias=profile["beexo_alias"],
        wallet_address=profile["wallet_address"],
        cvu=profile.get("cvu"),
        qr_payload=profile["qr_payload"],
    )


@router.post("/swap/quote", response_model=SwapQuoteResponse)
async def get_swap_quote(payload: SwapQuoteRequest):
    quote = business_contract_service.estimate_quote(payload.from_token, payload.to_token, payload.amount)
    return SwapQuoteResponse(
        from_token=payload.from_token.upper(),
        to_token=payload.to_token.upper(),
        amount=payload.amount,
        rate=quote["rate"],
        estimated_received=quote["estimated_received"],
        slippage=quote["slippage"],
    )


@router.post("/swap/execute", response_model=SwapExecuteResponse)
async def execute_swap(
    payload: SwapExecuteRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db),
    x_private_key: Optional[str] = Header(default=None, alias="x-private-key"),
):
    quote = business_contract_service.estimate_quote(payload.from_token, payload.to_token, payload.amount)
    tx_hash = _fake_tx_hash("swap", payload.from_token, payload.to_token, str(payload.amount))
    status = "confirmed" if x_private_key else "pending"

    swap = await business_contract_service.create_swap_transaction(
        db=db,
        user_id=current_user["id"],
        from_token=payload.from_token,
        to_token=payload.to_token,
        amount=payload.amount,
        quoted_rate=quote["rate"],
        estimated_received=quote["estimated_received"],
        tx_hash=tx_hash,
        status=status,
        metadata={"accept_slippage": payload.accept_slippage},
    )

    return SwapExecuteResponse(
        success=True,
        swap_id=swap["id"],
        tx_hash=swap.get("tx_hash"),
        status=swap["status"],
        estimated_received=float(swap["estimated_received"]),
    )


@router.post("/send", response_model=SendFundsResponse)
async def send_funds(
    payload: SendFundsRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db),
):
    vault = await _get_owned_vault(db, payload.vault_id, current_user["id"])

    if float(vault["current"]) < payload.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    recipient = payload.recipient_alias or payload.recipient_address
    if not recipient:
        raise HTTPException(status_code=400, detail="recipient_alias or recipient_address is required")

    transfer = await transfer_service.create_transfer(
        db,
        from_vault_id=payload.vault_id,
        to_alias=recipient,
        amount=payload.amount,
    )

    new_balance = float(vault["current"]) - payload.amount
    await db.table("vaults").update({"current": new_balance}).eq("id", payload.vault_id).execute()

    await db.table("activities").insert(
        {
            "vault_id": payload.vault_id,
            "activity_type": ActivityType.TRANSFER.value,
            "amount": payload.amount,
            "tx_hash": _fake_tx_hash("send", payload.vault_id, recipient, str(payload.amount)),
            "metadata": {"recipient": recipient, "note": payload.note},
        }
    ).execute()

    return SendFundsResponse(
        success=True,
        transfer_id=transfer["id"],
        status=transfer["status"],
        amount=payload.amount,
        recipient=recipient,
    )


@router.post("/contracts/p2p-protected", response_model=ContractSummaryResponse)
async def create_p2p_protected_contract(
    payload: P2PProtectedCreateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db),
):
    vault = await _get_owned_vault(db, payload.vault_id, current_user["id"])
    if float(vault["current"]) < payload.amount:
        raise HTTPException(status_code=400, detail="Vault balance is lower than requested amount")

    summary = {
        "title": "Compra Protegida P2P",
        "item_description": payload.item_description,
        "amount": payload.amount,
        "seller_address": payload.seller_address,
        "flow": "Bloqueo de fondos y liberación por cumplimiento de ambas partes",
    }

    contract = await business_contract_service.create_business_contract(
        db=db,
        contract_type="p2p_protected",
        owner_user_id=current_user["id"],
        counterparty_address=payload.seller_address,
        vault_id=payload.vault_id,
        amount=payload.amount,
        release_date=payload.release_date,
        guarantee_months=None,
        on_chain_vault_id=vault.get("on_chain_id"),
        summary=summary,
    )

    return ContractSummaryResponse(
        contract_id=contract["id"],
        contract_type=contract["contract_type"],
        status=contract["status"],
        on_chain_vault_id=contract.get("on_chain_vault_id"),
        summary=contract["summary"],
    )


@router.post("/contracts/rental-guarantee", response_model=ContractSummaryResponse)
async def create_rental_guarantee_contract(
    payload: RentalGuaranteeCreateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db),
    x_private_key: Optional[str] = Header(default=None, alias="x-private-key"),
):
    vault = await _get_owned_vault(db, payload.vault_id, current_user["id"])
    on_chain_vault_id = vault.get("on_chain_id")

    approval_tx = None
    if x_private_key and on_chain_vault_id is not None:
        try:
            contract = get_vault_contract(private_key=x_private_key)
            tx = contract.set_beneficiary(int(on_chain_vault_id), payload.owner_address)
            approval_tx = tx.get("tx_hash")
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Error setting beneficiary on-chain: {str(exc)}")

    summary = {
        "title": "Garantía de Alquiler Activa",
        "owner_address": payload.owner_address,
        "months": payload.guarantee_months,
        "amount": payload.amount,
        "flow": "Garantía bloqueada en DOC y liberación de intereses al inquilino",
    }

    contract_record = await business_contract_service.create_business_contract(
        db=db,
        contract_type="rental_guarantee",
        owner_user_id=current_user["id"],
        counterparty_address=payload.owner_address,
        vault_id=payload.vault_id,
        amount=payload.amount,
        release_date=business_contract_service.default_release_date(payload.guarantee_months),
        guarantee_months=payload.guarantee_months,
        on_chain_vault_id=on_chain_vault_id,
        summary=summary,
        metadata={"approval_tx_hash": approval_tx},
    )

    return ContractSummaryResponse(
        contract_id=contract_record["id"],
        contract_type=contract_record["contract_type"],
        status=contract_record["status"],
        on_chain_vault_id=contract_record.get("on_chain_vault_id"),
        summary=contract_record["summary"],
    )


@router.post("/contracts/timelock-goal", response_model=ContractSummaryResponse)
async def create_timelock_goal_contract(
    payload: TimeLockGoalCreateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db),
    x_private_key: Optional[str] = Header(default=None, alias="x-private-key"),
):
    vault_payload = {
        "user_id": current_user["id"],
        "name": payload.name,
        "icon": payload.icon,
        "target": payload.target,
        "current": payload.initial_deposit,
        "vault_type": "savings",
        "locked": True,
        "unlock_date": payload.unlock_date.isoformat(),
        "status": VaultStatus.ACTIVE.value,
    }
    vault_result = await db.table("vaults").insert(vault_payload).execute()
    db_vault = vault_result.data[0]

    on_chain_vault_id = None
    if x_private_key:
        try:
            contract = get_vault_contract(private_key=x_private_key)
            chain_result = contract.create_vault(
                name=payload.name,
                icon=payload.icon,
                target=payload.target,
                vault_type=VaultType.SAVINGS,
                beneficiary=None,
                locked=True,
                unlock_date=int(payload.unlock_date.timestamp()),
            )
            on_chain_vault_id = chain_result.vault_id
            # Compatibilidad: algunos esquemas legacy aún no tienen columna on_chain_id.
            try:
                await db.table("vaults").update({"on_chain_id": on_chain_vault_id}).eq("id", db_vault["id"]).execute()
            except Exception:
                pass
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Error creating on-chain time-lock vault: {str(exc)}")

    summary = {
        "title": "Meta con Candado",
        "goal_name": payload.name,
        "target": payload.target,
        "unlock_date": payload.unlock_date.isoformat(),
        "initial_deposit": payload.initial_deposit,
        "flow": "Bloqueo conductual hasta fecha pactada con rendimiento en DeFi",
    }

    contract_record = await business_contract_service.create_business_contract(
        db=db,
        contract_type="timelock_goal",
        owner_user_id=current_user["id"],
        counterparty_address=None,
        vault_id=db_vault["id"],
        amount=payload.target,
        release_date=payload.unlock_date,
        guarantee_months=None,
        on_chain_vault_id=on_chain_vault_id,
        summary=summary,
    )

    return ContractSummaryResponse(
        contract_id=contract_record["id"],
        contract_type=contract_record["contract_type"],
        status=contract_record["status"],
        on_chain_vault_id=contract_record.get("on_chain_vault_id"),
        summary=contract_record["summary"],
    )


@router.post("/contracts/{contract_id}/approve", response_model=ContractActionResponse)
async def approve_contract(
    contract_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db),
):
    contract = await business_contract_service.get_business_contract(db, contract_id)
    if not contract or contract["owner_user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Contract not found")

    tx_hash = _fake_tx_hash("approve", contract_id, current_user["id"])
    updated = await business_contract_service.update_business_contract(
        db,
        contract_id,
        {"status": "approved", "approval_tx_hash": tx_hash},
    )

    return ContractActionResponse(success=True, contract_id=contract_id, status=updated["status"], tx_hash=tx_hash)


@router.post("/contracts/{contract_id}/release", response_model=ContractActionResponse)
async def release_contract(
    contract_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db),
):
    contract = await business_contract_service.get_business_contract(db, contract_id)
    if not contract or contract["owner_user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Contract not found")

    tx_hash = _fake_tx_hash("release", contract_id, current_user["id"])
    updated = await business_contract_service.update_business_contract(
        db,
        contract_id,
        {"status": "released", "release_tx_hash": tx_hash},
    )

    return ContractActionResponse(success=True, contract_id=contract_id, status=updated["status"], tx_hash=tx_hash)


@router.post("/contracts/{contract_id}/release-rules", response_model=ScheduleReleaseResponse)
async def schedule_release_rules(
    contract_id: str,
    payload: ScheduleReleaseRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db),
):
    contract = await business_contract_service.get_business_contract(db, contract_id)
    if not contract or contract["owner_user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Contract not found")

    total = round(sum(rule.percentage for rule in payload.rules), 2)
    if total > 100:
        raise HTTPException(status_code=400, detail="Total percentage cannot exceed 100%")

    rules_payload = [rule.model_dump() for rule in payload.rules]
    await business_contract_service.create_release_rules(db, contract_id, rules_payload)
    await business_contract_service.update_business_contract(db, contract_id, {"contract_type": "scheduled_release"})

    return ScheduleReleaseResponse(
        success=True,
        contract_id=contract_id,
        total_percentage=total,
        rules_count=len(payload.rules),
    )


@router.get("/contracts", response_model=list[ContractSummaryResponse])
async def list_contracts(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db),
):
    rows = await business_contract_service.list_contracts_by_user(db, current_user["id"])
    return [
        ContractSummaryResponse(
            contract_id=row["id"],
            contract_type=row["contract_type"],
            status=row["status"],
            on_chain_vault_id=row.get("on_chain_vault_id"),
            summary=row.get("summary") or {},
        )
        for row in rows
    ]


@router.get("/vaults/{vault_id}/motivation", response_model=MotivationResponse)
async def get_vault_motivation(
    vault_id: str,
    weekly_extra: float = 0,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db),
):
    vault = await _get_owned_vault(db, vault_id, current_user["id"])
    motivation = business_contract_service.build_motivation_message(
        current=float(vault["current"]),
        target=float(vault["target"]),
        weekly_extra=weekly_extra,
    )
    return MotivationResponse(**motivation)
