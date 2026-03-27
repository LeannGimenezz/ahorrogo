from datetime import datetime, timedelta
from typing import Optional


STREAK_RESET_DAYS = 60


def check_and_reset_streak(last_deposit_at: Optional[datetime]) -> tuple[int, bool]:
    if not last_deposit_at:
        return 0, True
    
    days_diff = (datetime.utcnow() - last_deposit_at).days
    
    if days_diff > STREAK_RESET_DAYS:
        return 0, True
    
    return -1, False


def increment_streak(current_streak: int, last_deposit_at: Optional[datetime], current_deposit_at: datetime) -> tuple[int, bool]:
    if not last_deposit_at:
        return 1, True
    
    if (current_deposit_at.year > last_deposit_at.year) or \
       (current_deposit_at.year == last_deposit_at.year and current_deposit_at.month > last_deposit_at.month):
        return current_streak + 1, True
    
    return current_streak, False


def get_streak_display(streak: int) -> str:
    if streak == 0:
        return ""
    return f"🔥 {streak} month{'s' if streak > 1 else ''}"
