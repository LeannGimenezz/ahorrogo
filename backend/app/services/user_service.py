from typing import Optional, Dict, Any, List
from datetime import datetime
from supabase import AsyncClient
from app.models.schemas import UserResponse, UserCreate, XP_PER_LEVEL, ACCESSORIES_BY_LEVEL, GOAL_ACCESSORIES


async def get_by_address(db: AsyncClient, address: str) -> Optional[Dict[str, Any]]:
    result = await db.table("users").select("*").eq("address", address.lower()).execute()
    if result.data:
        return result.data[0]
    return None


async def get_by_id(db: AsyncClient, user_id: str) -> Optional[Dict[str, Any]]:
    result = await db.table("users").select("*").eq("id", user_id).execute()
    if result.data:
        return result.data[0]
    return None


async def get_by_alias(db: AsyncClient, alias: str) -> Optional[Dict[str, Any]]:
    result = await db.table("users").select("*").eq("alias", alias).execute()
    if result.data:
        return result.data[0]
    return None


async def create(db: AsyncClient, address: str, alias: str) -> Dict[str, Any]:
    user_data = {
        "address": address.lower(),
        "alias": alias,
        "xp": 0,
        "level": 1,
        "streak": 0,
    }
    result = await db.table("users").insert(user_data).execute()
    return result.data[0]


async def update_xp_streak(
    db: AsyncClient,
    user_id: str,
    xp: int,
    level: int,
    streak: int,
    last_deposit_at: datetime
) -> Dict[str, Any]:
    result = await db.table("users").update({
        "xp": xp,
        "level": level,
        "streak": streak,
        "last_deposit_at": last_deposit_at.isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("id", user_id).execute()
    return result.data[0] if result.data else None


async def update(db: AsyncClient, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    data["updated_at"] = datetime.utcnow().isoformat()
    result = await db.table("users").update(data).eq("id", user_id).execute()
    return result.data[0] if result.data else None


def calculate_level(xp: int) -> int:
    for level in range(5, 0, -1):
        if xp >= XP_PER_LEVEL[level - 1]:
            return level
    return 1


def calculate_accessories(level: int, completed_goal_names: List[str] = None) -> List[str]:
    completed_goal_names = completed_goal_names or []
    accessories = list(ACCESSORIES_BY_LEVEL.get(level, []))
    
    for goal_name in completed_goal_names:
        accessory = GOAL_ACCESSORIES.get(goal_name.lower())
        if accessory and accessory not in accessories:
            accessories.append(accessory)
    
    return accessories


async def get_or_create(db: AsyncClient, address: str, alias: str = None) -> Dict[str, Any]:
    user = await get_by_address(db, address)
    if not user:
        if not alias:
            alias = f"user.{address[:8]}"
        user = await create(db, address, alias)
    return user


async def has_active_guarantee(db: AsyncClient, address: str) -> bool:
    result = await db.table("vaults").select("id").eq("user_id", (
        await get_by_address(db, address)
    )["id"] if await get_by_address(db, address) else None).eq("locked", True).eq("status", "active").execute()
    return len(result.data) > 0
