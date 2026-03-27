from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from supabase import AsyncClient
from app.api.deps import get_db, get_current_user
from app.services import notification_service
from app.models.schemas import NotificationResponse, NotificationListResponse, NotificationReadResponse

router = APIRouter()


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    unread_only: bool = Query(False, description="Filter to unread notifications only"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db)
):
    notifications = await notification_service.get_by_user(db, current_user["id"], unread_only)
    
    notification_responses = []
    for notif in notifications:
        notification_responses.append(NotificationResponse(
            id=notif["id"],
            title=notif["title"],
            body=notif.get("body"),
            type=notif["notification_type"],
            read=notif["read"],
            created_at=notif["created_at"],
        ))
    
    return NotificationListResponse(notifications=notification_responses)


@router.put("/{notification_id}/read", response_model=NotificationReadResponse)
async def mark_notification_read(
    notification_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db)
):
    notif = await db.table("notifications").select("id, user_id").eq("id", notification_id).execute()
    
    if not notif.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    
    if notif.data[0]["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this notification",
        )
    
    await notification_service.mark_as_read(db, notification_id)
    
    return NotificationReadResponse(success=True)
