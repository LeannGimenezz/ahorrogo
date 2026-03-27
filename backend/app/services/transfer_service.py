from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from supabase import AsyncClient
from app.models.schemas import TransferStatus, TRANSFER_EXPIRY_HOURS


async def create_transfer(
    db: AsyncClient,
    from_vault_id: str,
    to_alias: str,
    amount: float
) -> Dict[str, Any]:
    expires_at = datetime.utcnow() + timedelta(hours=TRANSFER_EXPIRY_HOURS)
    
    transfer_data = {
        "from_vault_id": from_vault_id,
        "to_alias": to_alias,
        "amount": amount,
        "status": TransferStatus.PENDING.value,
        "expires_at": expires_at.isoformat(),
    }
    
    result = await db.table("transfers").insert(transfer_data).execute()
    return result.data[0]


async def get_by_id(db: AsyncClient, transfer_id: str) -> Optional[Dict[str, Any]]:
    result = await db.table("transfers").select("*").eq("id", transfer_id).execute()
    if result.data:
        return result.data[0]
    return None


async def get_by_from_vault(db: AsyncClient, vault_id: str) -> List[Dict[str, Any]]:
    result = await db.table("transfers").select("*").eq("from_vault_id", vault_id).order("created_at", desc=True).execute()
    return result.data


async def update_status(db: AsyncClient, transfer_id: str, status: str, confirmed_at: datetime = None) -> Dict[str, Any]:
    update_data = {"status": status}
    if confirmed_at:
        update_data["confirmed_at"] = confirmed_at.isoformat()
    
    result = await db.table("transfers").update(update_data).eq("id", transfer_id).execute()
    return result.data[0] if result.data else None


async def expire_transfers(db: AsyncClient) -> int:
    result = await db.table("transfers").update({"status": TransferStatus.EXPIRED.value}).lt(
        "expires_at", datetime.utcnow().isoformat()
    ).eq("status", TransferStatus.PENDING.value).execute()
    return len(result.data)


async def confirm_transfer(db: AsyncClient, transfer_id: str) -> Dict[str, Any]:
    return await update_status(db, transfer_id, TransferStatus.CONFIRMED.value, datetime.utcnow())


async def cancel_transfer(db: AsyncClient, transfer_id: str) -> Dict[str, Any]:
    return await update_status(db, transfer_id, TransferStatus.CANCELLED.value)
