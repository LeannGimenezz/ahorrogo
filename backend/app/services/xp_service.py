from typing import List, Optional
from datetime import datetime, timedelta
from app.models.schemas import (
    XP_PER_LEVEL,
    XP_PER_DEPOSIT,
    XP_COMPLETION_BONUS,
    STREAK_RESET_DAYS,
    ACCESSORIES_BY_LEVEL,
    GOAL_ACCESSORIES,
    PenguinMood,
)


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


def calculate_streak(
    last_deposit_at: Optional[datetime],
    current_deposit_at: datetime,
    current_streak: int = 0
) -> tuple[int, bool]:
    if not last_deposit_at:
        return 1, True
    
    days_diff = (current_deposit_at - last_deposit_at).days
    
    if days_diff > STREAK_RESET_DAYS:
        return 1, False
    
    last_month = last_deposit_at.month
    last_year = last_deposit_at.year
    current_month = current_deposit_at.month
    current_year = current_deposit_at.year
    
    if (current_year > last_year) or (current_month > last_month):
        return current_streak + 1, True
    
    return current_streak, False


def determine_mood(
    streak: int,
    last_deposit_at: Optional[datetime],
    xp: int
) -> PenguinMood:
    if not last_deposit_at:
        return PenguinMood.IDLE
    
    days_since = (datetime.utcnow() - last_deposit_at).days
    
    if days_since > 30:
        return PenguinMood.WAITING
    
    if streak >= 6:
        return PenguinMood.HAPPY
    
    return PenguinMood.IDLE


def calculate_xp_from_deposit(amount: float) -> int:
    return int(amount / XP_PER_DEPOSIT)


def calculate_completion_bonus(completed: bool) -> int:
    return XP_COMPLETION_BONUS if completed else 0


def get_level_title(level: int) -> str:
    titles = {
        1: "Newcomer",
        2: "Beginner",
        3: "Saver",
        4: "Champion",
        5: "Legend",
    }
    return titles.get(level, "Unknown")


def get_xp_progress(xp: int) -> tuple[int, int]:
    level = calculate_level(xp)
    if level >= 5:
        return xp - XP_PER_LEVEL[4], XP_PER_LEVEL[4] - XP_PER_LEVEL[4]
    
    current_level_xp = XP_PER_LEVEL[level - 1]
    next_level_xp = XP_PER_LEVEL[level]
    progress = xp - current_level_xp
    needed = next_level_xp - current_level_xp
    
    return progress, needed
