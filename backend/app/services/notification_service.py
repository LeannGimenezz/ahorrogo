from typing import Optional, Dict, Any, List
from datetime import datetime
from supabase import AsyncClient


async def create_notification(
    db: AsyncClient,
    user_id: str,
    title: str,
    notification_type: str,
    body: str = None
) -> Dict[str, Any]:
    notification_data = {
        "user_id": user_id,
        "title": title,
        "body": body,
        "notification_type": notification_type,
        "read": False,
    }
    
    result = await db.table("notifications").insert(notification_data).execute()
    return result.data[0]


async def get_by_user(
    db: AsyncClient,
    user_id: str,
    unread_only: bool = False
) -> List[Dict[str, Any]]:
    query = db.table("notifications").select("*").eq("user_id", user_id).order("created_at", desc=True)
    
    if unread_only:
        query = query.eq("read", False)
    
    result = query.execute()
    return result.data


async def mark_as_read(db: AsyncClient, notification_id: str) -> Dict[str, Any]:
    result = await db.table("notifications").update({"read": True}).eq("id", notification_id).execute()
    return result.data[0] if result.data else None


async def mark_all_as_read(db: AsyncClient, user_id: str) -> int:
    result = await db.table("notifications").update({"read": True}).eq("user_id", user_id).eq("read", False).execute()
    return len(result.data)


async def get_unread_count(db: AsyncClient, user_id: str) -> int:
    result = await db.table("notifications").select("id", count="exact").eq("user_id", user_id).eq("read", False).execute()
    return result.count if hasattr(result, 'count') else len(result.data)


async def delete_old_notifications(db: AsyncClient, days: int = 30) -> int:
    cutoff = datetime.utcnow() - timedelta(days=days)
    result = await db.table("notifications").delete().lt("created_at", cutoff.isoformat()).execute()
    return len(result.data)


from datetime import timedelta
