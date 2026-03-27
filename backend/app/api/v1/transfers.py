from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import AsyncClient
from app.api.deps import get_db, get_current_user
from app.services import transfer_service, vault_service, user_service
from app.models.schemas import (
    TransferCreate, TransferResponse, TransferCreateResponse,
    TransferConfirmResponse, TransferCancelResponse, VaultResponse,
    TransferStatus, VaultStatus
)

router = APIRouter()


@router.post("", response_model=TransferCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_transfer(
    transfer_data: TransferCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db)
):
    vault = await vault_service.get_by_id(db, transfer_data.vault_id)
    if not vault:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vault not found",
        )
    
    if vault["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create transfer from this vault",
        )
    
    if vault["status"] != VaultStatus.ACTIVE.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot transfer from an inactive vault",
        )
    
    if vault["current"] < transfer_data.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient funds",
        )
    
    recipient = await user_service.get_by_alias(db, transfer_data.recipient_alias)
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient not found",
        )
    
    transfer = await transfer_service.create_transfer(
        db,
        transfer_data.vault_id,
        transfer_data.recipient_alias,
        transfer_data.amount,
    )
    
    return TransferCreateResponse(
        id=transfer["id"],
        status=transfer["status"],
        expires_at=transfer["expires_at"],
    )


@router.get("/{transfer_id}", response_model=TransferResponse)
async def get_transfer(
    transfer_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db)
):
    transfer = await transfer_service.get_by_id(db, transfer_id)
    if not transfer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transfer not found",
        )
    
    vault = await vault_service.get_by_id(db, transfer["from_vault_id"])
    if not vault or vault["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this transfer",
        )
    
    progress = vault["current"] / vault["target"] if vault["target"] > 0 else 0
    
    return TransferResponse(
        id=transfer["id"],
        status=transfer["status"],
        from_vault=VaultResponse(
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
        ),
        to_alias=transfer["to_alias"],
        amount=transfer["amount"],
        expires_at=transfer["expires_at"],
        confirmed_at=transfer.get("confirmed_at"),
        created_at=transfer["created_at"],
    )


@router.post("/{transfer_id}/confirm", response_model=TransferConfirmResponse)
async def confirm_transfer(
    transfer_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db)
):
    transfer = await transfer_service.get_by_id(db, transfer_id)
    if not transfer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transfer not found",
        )
    
    if transfer["status"] != TransferStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transfer is not pending",
        )
    
    if transfer["to_alias"] != current_user["alias"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to confirm this transfer",
        )
    
    await transfer_service.confirm_transfer(db, transfer_id)
    
    recipient_vaults_result = await db.table("vaults").select("*").eq("user_id", current_user["id"]).eq("status", VaultStatus.ACTIVE.value).execute()
    recipient_vault = recipient_vaults_result.data[0] if recipient_vaults_result.data else None
    
    new_balance = transfer["amount"]
    if recipient_vault:
        new_balance = recipient_vault["current"] + transfer["amount"]
        await vault_service.update_current(db, recipient_vault["id"], new_balance)
    
    return TransferConfirmResponse(
        success=True,
        new_balance=new_balance,
    )


@router.post("/{transfer_id}/cancel", response_model=TransferCancelResponse)
async def cancel_transfer(
    transfer_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db)
):
    transfer = await transfer_service.get_by_id(db, transfer_id)
    if not transfer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transfer not found",
        )
    
    vault = await vault_service.get_by_id(db, transfer["from_vault_id"])
    if not vault or vault["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this transfer",
        )
    
    if transfer["status"] != TransferStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transfer is not pending",
        )
    
    await transfer_service.cancel_transfer(db, transfer_id)
    
    new_balance = vault["current"] + transfer["amount"]
    await vault_service.update_current(db, vault["id"], new_balance)
    
    return TransferCancelResponse(
        success=True,
        amount_returned=transfer["amount"],
    )
