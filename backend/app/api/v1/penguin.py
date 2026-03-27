from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import AsyncClient
from app.api.deps import get_db, get_current_user
from app.services import vault_service, user_service, xp_service
from app.models.schemas import PenguinResponse, VaultResponse, PenguinMood

router = APIRouter()


@router.get("", response_model=PenguinResponse)
async def get_penguin_state(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncClient = Depends(get_db)
):
    vaults = await vault_service.get_by_user(db, current_user["id"])
    
    total_saved = sum(vault["current"] for vault in vaults)
    completed_count = sum(1 for vault in vaults if vault["status"] == "completed")
    
    completed_goal_names = [vault["name"] for vault in vaults if vault["status"] == "completed"]
    accessories = xp_service.calculate_accessories(current_user["level"], completed_goal_names)
    
    mood_str = current_user.get("mood", "idle") if isinstance(current_user.get("mood"), str) else "idle"
    try:
        mood = PenguinMood(mood_str)
    except ValueError:
        mood = PenguinMood.IDLE
    
    yield_result = await db.table("penguin_states").select("total_yield_earned").eq("user_id", current_user["id"]).execute()
    yield_earned = yield_result.data[0]["total_yield_earned"] if yield_result.data else 0.0
    
    vault_responses = []
    for vault in vaults:
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
    
    return PenguinResponse(
        xp=current_user["xp"],
        level=current_user["level"],
        mood=mood,
        streak=current_user["streak"],
        accessories=accessories,
        total_saved=total_saved,
        yield_earned=yield_earned,
        goals=vault_responses,
    )
