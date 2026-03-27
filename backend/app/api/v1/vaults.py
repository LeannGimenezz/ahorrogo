from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Header
from supabase import AsyncClient
import logging
from app.api.deps import get_db, get_current_user
from app.services.vault_service import vault_service
from app.services import user_service, xp_service, notification_service
from app.services.vault_contract_service import get_vault_contract, VaultType
from app.services.tropykus_service import tropykus_service
from app.models.schemas import (
    VaultResponse, VaultCreate, VaultUpdate, VaultsListResponse,
    VaultWithActivities, DepositRequest, DepositResponse, YieldResponse,
    WithdrawRequest, WithdrawResponse, WithdrawCheckResponse,
    VaultStatus, ActivityType, ActivityResponse, PenguinMood
)
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter()


@router.get("", response_model=VaultsListResponse)
async def list_vaults(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db)
):
    vaults = await vault_service.get_by_user(db, current_user["id"])
    
    vault_responses = []
    total_saved = 0.0
    total_target = 0.0
    
    for vault in vaults:
        total_saved += vault["current"]
        total_target += vault["target"]
        
        progress = vault["current"] / vault["target"] if vault["target"] > 0 else 0
        
        vault_responses.append(VaultResponse(
            id=vault["id"],
            user_id=vault["user_id"],
            name=vault["name"],
            icon=vault["icon"],
            target=vault["target"],
            current=vault["current"],
            vault_type=vault["vault_type"],
            beneficiary=vault.get("beneficiary"),
            locked=vault.get("locked", False),
            unlock_date=vault.get("unlock_date"),
            status=vault["status"],
            progress=progress,
            created_at=vault["created_at"],
            updated_at=vault["updated_at"],
        ))
    
    return VaultsListResponse(
        vaults=vault_responses,
        total_saved=total_saved,
        total_target=total_target,
    )


@router.post("", response_model=VaultResponse, status_code=status.HTTP_201_CREATED)
async def create_vault(
    vault_data: VaultCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db),
    x_private_key: Optional[str] = Header(None, alias="x-private-key")
):
    """
    Crea un nuevo vault.
    
    Si se proporciona x-private-key, también crea el vault on-chain en el contrato.
    Si no, solo crea en la base de datos.
    """
    existing = await vault_service.get_by_name(db, current_user["id"], vault_data.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya tienes un vault con ese nombre",
        )
    
    if vault_data.locked and not vault_data.unlock_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vaults bloqueados requieren unlock_date",
        )
    
    if vault_data.unlock_date:
        min_date = datetime.now(vault_data.unlock_date.tzinfo) if vault_data.unlock_date.tzinfo else datetime.utcnow()
        if vault_data.unlock_date < min_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unlock date debe ser al menos 30 días en el futuro",
            )
    
    vault_dict = {
        "user_id": current_user["id"],
        "name": vault_data.name,
        "icon": vault_data.icon,
        "target": vault_data.target,
        "vault_type": vault_data.vault_type.value,
        "beneficiary": vault_data.beneficiary,
        "locked": vault_data.locked,
        "unlock_date": vault_data.unlock_date.isoformat() if vault_data.unlock_date else None,
        "status": VaultStatus.ACTIVE.value,
        "current": 0,
    }
    
    vault = await vault_service.create(db, vault_dict, current_user["address"])
    
    # Create on-chain if private key provided
    on_chain_id = None
    if x_private_key and settings.vault_contract_address:
        try:
            contract = get_vault_contract(private_key=x_private_key)
            
            # Convert unlock_date to unix timestamp if present
            unlock_timestamp = 0
            if vault_data.unlock_date:
                unlock_timestamp = int(vault_data.unlock_date.timestamp())
            
            result = contract.create_vault(
                name=vault_data.name,
                icon=vault_data.icon,
                target=vault_data.target,
                vault_type=VaultType(vault_data.vault_type.value),
                beneficiary=vault_data.beneficiary,
                locked=vault_data.locked,
                unlock_date=unlock_timestamp
            )
            
            on_chain_id = result.vault_id
            
            # Update vault with on_chain_id
            try:
                await db.table("vaults").update({"on_chain_id": on_chain_id}).eq("id", vault["id"]).execute()
                vault["on_chain_id"] = on_chain_id
            except Exception:
                pass
            
            logger.info(f"Vault created on-chain: vault_id={vault['id']}, on_chain_id={on_chain_id}, tx_hash={result.tx_hash}")
            
        except Exception as e:
            # Log error but don't fail - vault was created in DB
            logger.warning(f"Failed to create vault on-chain: {e}")
    
    return VaultResponse(
        id=vault["id"],
        user_id=vault["user_id"],
        name=vault["name"],
        icon=vault["icon"],
        target=vault["target"],
        current=vault["current"],
        vault_type=vault["vault_type"],
        beneficiary=vault.get("beneficiary"),
        locked=vault.get("locked", False),
        unlock_date=vault.get("unlock_date"),
        status=vault["status"],
        progress=0,
        created_at=vault["created_at"],
        updated_at=vault["updated_at"],
    )


@router.get("/{vault_id}", response_model=VaultWithActivities)
async def get_vault(
    vault_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db)
):
    vault = await vault_service.get_by_id(db, vault_id)
    if not vault:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vault not found",
        )
    
    if vault["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this vault",
        )
    
    activities_result = await db.table("activities").select("*").eq("vault_id", vault_id).order("created_at", desc=True).execute()
    activities = []
    for activity in activities_result.data:
        activities.append(ActivityResponse(
            id=activity["id"],
            vault_id=activity["vault_id"],
            activity_type=activity["activity_type"],
            amount=activity["amount"],
            tx_hash=activity.get("tx_hash"),
            block_number=activity.get("block_number"),
            metadata=activity.get("metadata"),
            created_at=activity["created_at"],
        ))
    
    progress = vault["current"] / vault["target"] if vault["target"] > 0 else 0
    
    return VaultWithActivities(
        id=vault["id"],
        user_id=vault["user_id"],
        name=vault["name"],
        icon=vault["icon"],
        target=vault["target"],
        current=vault["current"],
        vault_type=vault["vault_type"],
        beneficiary=vault.get("beneficiary"),
        locked=vault.get("locked", False),
        unlock_date=vault.get("unlock_date"),
        status=vault["status"],
        progress=progress,
        created_at=vault["created_at"],
        updated_at=vault["updated_at"],
        activities=activities,
    )


@router.put("/{vault_id}", response_model=VaultResponse)
async def update_vault(
    vault_id: str,
    update_data: VaultUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db)
):
    vault = await vault_service.get_by_id(db, vault_id)
    if not vault:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vault not found",
        )
    
    if vault["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this vault",
        )
    
    update_dict = {}
    if update_data.name:
        update_dict["name"] = update_data.name
    if update_data.icon:
        update_dict["icon"] = update_data.icon
    
    if update_dict:
        vault = await vault_service.update(db, vault_id, update_dict, current_user["address"])
    
    progress = vault["current"] / vault["target"] if vault["target"] > 0 else 0
    
    return VaultResponse(
        id=vault["id"],
        user_id=vault["user_id"],
        name=vault["name"],
        icon=vault["icon"],
        target=vault["target"],
        current=vault["current"],
        vault_type=vault["vault_type"],
        beneficiary=vault.get("beneficiary"),
        locked=vault.get("locked", False),
        unlock_date=vault.get("unlock_date"),
        status=vault["status"],
        progress=progress,
        created_at=vault["created_at"],
        updated_at=vault["updated_at"],
    )


@router.delete("/{vault_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vault(
    vault_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db)
):
    vault = await vault_service.get_by_id(db, vault_id)
    if not vault:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vault not found",
        )
    
    if vault["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this vault",
        )
    
    if vault.get("locked") and vault["status"] != VaultStatus.COMPLETED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel vault with active lock",
        )
    
    await vault_service.delete(db, vault_id, current_user["address"])


@router.post("/{vault_id}/deposit", response_model=DepositResponse)
async def register_deposit(
    vault_id: str,
    deposit: DepositRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db)
):
    vault = await vault_service.get_by_id(db, vault_id)
    if not vault:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vault not found",
        )
    
    if vault["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to deposit to this vault",
        )
    
    if vault["status"] != VaultStatus.ACTIVE.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vault no está activo",
        )
    
    existing_tx = await db.table("activities").select("id").eq("tx_hash", deposit.tx_hash).execute()
    if existing_tx.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta transacción ya fue procesada",
        )
    
    new_current = vault["current"] + deposit.amount
    completed = new_current >= vault["target"]
    new_status = VaultStatus.COMPLETED.value if completed else VaultStatus.ACTIVE.value
    
    await vault_service.update_current(db, vault_id, new_current, new_status)
    
    activity_data = {
        "vault_id": vault_id,
        "activity_type": ActivityType.DEPOSIT.value,
        "amount": deposit.amount,
        "tx_hash": deposit.tx_hash,
    }
    await db.table("activities").insert(activity_data).execute()
    
    xp_deposit = xp_service.calculate_xp_from_deposit(deposit.amount)
    xp_bonus = xp_service.calculate_completion_bonus(completed)
    total_xp_earned = xp_deposit + xp_bonus
    
    old_level = current_user["level"]
    new_xp = current_user["xp"] + total_xp_earned
    new_level = xp_service.calculate_level(new_xp)
    
    now = datetime.utcnow()
    new_streak, streak_incremented = xp_service.calculate_streak(
        current_user.get("last_deposit_at"),
        now,
        current_user["streak"],
    )
    
    await user_service.update_xp_streak(
        db,
        current_user["id"],
        new_xp,
        new_level,
        new_streak,
        now,
    )
    
    mood = xp_service.determine_mood(new_streak, now, new_xp)
    
    if completed:
        await notification_service.create_notification(
            db,
            current_user["id"],
            "¡Meta alcanzada!",
            "goal_completed",
            f"Llegaste al 100% de tu vault {vault['name']}",
        )
    
    await db.table("penguin_states").upsert({
        "user_id": current_user["id"],
        "mood": mood.value,
        "updated_at": datetime.utcnow().isoformat(),
    }).execute()
    
    progress = new_current / vault["target"] if vault["target"] > 0 else 0
    
    return DepositResponse(
        success=True,
        xp_earned=total_xp_earned,
        new_xp=new_xp,
        new_level=new_level,
        streak=new_streak,
        streak_incremented=streak_incremented,
        vault_progress=progress,
        mood=mood,
        new_balance=new_current,
        tx_hash=deposit.tx_hash,
    )


@router.get("/{vault_id}/yield", response_model=YieldResponse)
async def get_vault_yield(
    vault_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db)
):
    vault = await vault_service.get_by_id(db, vault_id)
    if not vault:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vault not found",
        )
    
    if vault["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this vault",
        )
    
    # Obtener APY real de Topykus
    try:
        market_info = tropykus_service.get_market_info("krbtc")
        apy = market_info.supply_rate
        apy_source = "tropykus"
    except Exception:
        apy = 0.052  # Fallback a 5.2%
        apy_source = "default"
    
    # Calcular yield basado en tiempo
    created_at = vault.get("created_at")
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    
    days_elapsed = (datetime.utcnow() - created_at).days if created_at else 0
    yield_earned = vault["current"] * (apy * days_elapsed / 365)
    current_balance = vault["current"] + yield_earned
    
    return YieldResponse(
        vault_id=vault_id,
        yield_earned=round(yield_earned, 2),
        current_balance=round(current_balance, 2),
        apy_estimate=apy,
        apy_source=apy_source,
    )


# ============================================================================
# WITHDRAW ENDPOINTS
# ============================================================================

@router.get("/{vault_id}/withdraw/check", response_model=WithdrawCheckResponse)
async def check_withdraw(
    vault_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db)
):
    """
    Verifica si se puede retirar de un vault.
    
    Returns:
        can_withdraw: True si se puede retirar
        reason: Razón si no se puede retirar
        locked: Si tiene candado
        unlock_date: Fecha de desbloqueo
        days_remaining: Días restantes
        balance: Balance actual
    """
    vault = await vault_service.get_by_id(db, vault_id)
    if not vault:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vault not found")
    
    if vault["user_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    locked = vault.get("locked", False)
    unlock_date = vault.get("unlock_date")
    balance = vault.get("current", 0)
    
    # Verificar si está bloqueado
    can_withdraw = True
    reason = None
    days_remaining = None
    
    if locked and unlock_date:
        if isinstance(unlock_date, str):
            unlock_date = datetime.fromisoformat(unlock_date.replace("Z", "+00:00"))
        
        now = datetime.utcnow()
        if now < unlock_date:
            can_withdraw = False
            days_remaining = (unlock_date - now).days
            reason = f"Vault bloqueado por {days_remaining} días más"
    
    return WithdrawCheckResponse(
        can_withdraw=can_withdraw,
        reason=reason,
        locked=locked,
        unlock_date=unlock_date,
        days_remaining=days_remaining,
        balance=balance,
    )


@router.post("/{vault_id}/withdraw", response_model=WithdrawResponse)
async def withdraw_from_vault(
    vault_id: str,
    withdraw: WithdrawRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db),
    x_private_key: Optional[str] = Header(None, alias="x-private-key")
):
    """
    Retira fondos de un vault.
    
    Si se proporciona x-private-key, hace el retiro on-chain.
    Si no, solo actualiza la base de datos.
    """
    vault = await vault_service.get_by_id(db, vault_id)
    if not vault:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vault not found")
    
    if vault["user_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    # Verificar que el vault no esté bloqueado
    if vault.get("locked"):
        unlock_date = vault.get("unlock_date")
        if unlock_date:
            if isinstance(unlock_date, str):
                unlock_date = datetime.fromisoformat(unlock_date.replace("Z", "+00:00"))
            if datetime.utcnow() < unlock_date:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Vault bloqueado hasta {unlock_date.strftime('%Y-%m-%d')}"
                )
    
    # Verificar balance suficiente
    if withdraw.amount > vault["current"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Balance insuficiente. Disponible: {vault['current']}"
        )
    
    tx_hash = None
    on_chain_vault_id = vault.get("on_chain_id")
    
    # Si hay private key y vault on-chain, hacer retiro on-chain
    if x_private_key and on_chain_vault_id:
        try:
            contract = get_vault_contract(private_key=x_private_key)
            result = contract.withdraw(
                vault_id=on_chain_vault_id,
                amount=withdraw.amount
            )
            tx_hash = result.tx_hash
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error en blockchain: {str(e)}"
            )
    
    # Actualizar balance en DB
    new_balance = vault["current"] - withdraw.amount
    new_status = VaultStatus.COMPLETED.value if new_balance <= 0 else vault["status"]
    
    await vault_service.update_current(db, vault_id, new_balance, new_status)
    
    # Registrar actividad
    await db.table("activities").insert({
        "vault_id": vault_id,
        "activity_type": ActivityType.WITHDRAW.value,
        "amount": withdraw.amount,
        "tx_hash": tx_hash,
    }).execute()
    
    # Calcular XP (negativo por retiro, pero mínimo 0)
    xp_earned = max(0, -int(withdraw.amount * 10))  # -10 XP por cada USD retirado
    
    return WithdrawResponse(
        success=True,
        amount=withdraw.amount,
        new_balance=new_balance,
        tx_hash=tx_hash,
        xp_earned=xp_earned,
    )


# ============================================================================
# BLOCKCHAIN INTEGRATION
# ============================================================================

@router.post("/{vault_id}/deposit-onchain", response_model=DepositResponse)
async def deposit_onchain(
    vault_id: str,
    deposit: DepositRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db),
    x_private_key: str = Header(..., alias="x-private-key")
):
    """
    Deposita fondos en un vault directamente on-chain.
    
    Este endpoint requiere x-private-key para firmar la transacción.
    Actualiza tanto el contrato on-chain como la base de datos.
    """
    vault = await vault_service.get_by_id(db, vault_id)
    if not vault:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vault not found")
    
    if vault["user_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    if vault["status"] != VaultStatus.ACTIVE.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vault no está activo")
    
    on_chain_vault_id = vault.get("on_chain_id")
    if not on_chain_vault_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vault no existe on-chain. Use POST /blockchain/vault/create primero."
        )
    
    # Hacer depósito on-chain
    try:
        contract = get_vault_contract(private_key=x_private_key)
        result = contract.deposit(
            vault_id=on_chain_vault_id,
            amount=deposit.amount
        )
        tx_hash = result.tx_hash
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en blockchain: {str(e)}"
        )
    
    # Actualizar balance en DB
    new_current = vault["current"] + deposit.amount
    completed = new_current >= vault["target"]
    new_status = VaultStatus.COMPLETED.value if completed else VaultStatus.ACTIVE.value
    
    await vault_service.update_current(db, vault_id, new_current, new_status)
    
    # Registrar actividad
    await db.table("activities").insert({
        "vault_id": vault_id,
        "activity_type": ActivityType.DEPOSIT.value,
        "amount": deposit.amount,
        "tx_hash": tx_hash,
    }).execute()
    
    # Actualizar XP
    xp_deposit = xp_service.calculate_xp_from_deposit(deposit.amount)
    xp_bonus = xp_service.calculate_completion_bonus(completed)
    total_xp_earned = xp_deposit + xp_bonus
    
    old_level = current_user["level"]
    new_xp = current_user["xp"] + total_xp_earned
    new_level = xp_service.calculate_level(new_xp)
    
    now = datetime.utcnow()
    new_streak, streak_incremented = xp_service.calculate_streak(
        current_user.get("last_deposit_at"),
        now,
        current_user["streak"],
    )
    
    await user_service.update_xp_streak(
        db,
        current_user["id"],
        new_xp,
        new_level,
        new_streak,
        now,
    )
    
    mood = xp_service.determine_mood(new_streak, now, new_xp)
    progress = new_current / vault["target"] if vault["target"] > 0 else 0
    
    return DepositResponse(
        success=True,
        xp_earned=total_xp_earned,
        new_xp=new_xp,
        new_level=new_level,
        streak=new_streak,
        streak_incremented=streak_incremented,
        vault_progress=progress,
        mood=mood,
        new_balance=new_current,
        tx_hash=tx_hash,
    )


@router.post("/{vault_id}/sync")
async def sync_vault_with_blockchain(
    vault_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db)
):
    """
    Sincroniza el estado de un vault entre la DB y el contrato on-chain.
    
    Útil si el usuario hizo operaciones directamente en el contrato
    sin pasar por el backend.
    """
    vault = await vault_service.get_by_id(db, vault_id)
    if not vault:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vault not found")
    
    if vault["user_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    on_chain_vault_id = vault.get("on_chain_id")
    
    if not on_chain_vault_id:
        return {
            "db_vault": vault,
            "on_chain_vault": None,
            "sync_status": "not_on_chain",
            "differences": None,
        }
    
    # Obtener estado on-chain
    try:
        contract = get_vault_contract()
        on_chain_vault = contract.get_vault(on_chain_vault_id)
        
        # Comparar
        differences = {}
        db_amount = vault["current"]
        on_chain_amount = on_chain_vault.current
        
        if abs(db_amount - on_chain_amount) > 0.0001:  # Tolerancia para floats
            differences["current"] = {
                "db": db_amount,
                "on_chain": on_chain_amount,
            }
        
        # Si hay diferencias, actualizar DB
        if differences:
            await vault_service.update_current(db, vault_id, on_chain_amount, vault["status"])
            sync_status = "updated"
        else:
            sync_status = "synced"
        
        return {
            "db_vault": vault,
            "on_chain_vault": {
                "id": on_chain_vault_id,
                "owner": on_chain_vault.owner,
                "name": on_chain_vault.name,
                "current": on_chain_vault.current,
                "target": on_chain_vault.target,
                "locked": on_chain_vault.locked,
                "status": on_chain_vault.status.name,
            },
            "sync_status": sync_status,
            "differences": differences if differences else None,
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sincronizando con blockchain: {str(e)}"
        )
