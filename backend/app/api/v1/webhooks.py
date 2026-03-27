from fastapi import APIRouter, Depends, HTTPException, status
from supabase import AsyncClient
from app.api.deps import get_db, get_current_user
from app.services import vault_service, user_service, xp_service
from app.models.schemas import (
    BlockchainEvent, BlockchainWebhookResponse, DepositResponse,
    VaultStatus, ActivityType, PenguinMood
)
from datetime import datetime

router = APIRouter()


@router.post("/blockchain", response_model=BlockchainWebhookResponse)
async def process_blockchain_event(
    event: BlockchainEvent,
    current_user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_db)
):
    if event.event == "DepositCompleted":
        if not event.vault_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="vault_id required for DepositCompleted event",
            )
        
        vault = await vault_service.get_by_id(db, event.vault_id)
        if not vault:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vault not found",
            )
        
        if vault["user_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized",
            )
        
        existing_tx = await db.table("activities").select("id").eq("tx_hash", event.tx_hash).execute()
        if existing_tx.data:
            return BlockchainWebhookResponse(processed=True, xp_earned=0, new_level=current_user["level"])
        
        new_current = vault["current"] + event.amount
        completed = new_current >= vault["target"]
        new_status = VaultStatus.COMPLETED.value if completed else VaultStatus.ACTIVE.value
        
        await vault_service.update_current(db, event.vault_id, new_current, new_status)
        
        activity_data = {
            "vault_id": event.vault_id,
            "activity_type": ActivityType.DEPOSIT.value,
            "amount": event.amount,
            "tx_hash": event.tx_hash,
            "block_number": event.block_number,
        }
        await db.table("activities").insert(activity_data).execute()
        
        xp_deposit = xp_service.calculate_xp_from_deposit(event.amount)
        xp_bonus = xp_service.calculate_completion_bonus(completed)
        total_xp_earned = xp_deposit + xp_bonus
        
        new_xp = current_user["xp"] + total_xp_earned
        new_level = xp_service.calculate_level(new_xp)
        
        now = datetime.utcnow()
        new_streak, _ = xp_service.calculate_streak(
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
        
        return BlockchainWebhookResponse(
            processed=True,
            xp_earned=total_xp_earned,
            new_level=new_level,
        )
    
    return BlockchainWebhookResponse(processed=False)
