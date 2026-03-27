import pytest
from datetime import datetime


class TestXPCalculations:
    def test_xp_per_level_thresholds(self):
        from app.models.schemas import XP_PER_LEVEL
        
        assert XP_PER_LEVEL == [0, 100, 300, 600, 1000]

    def test_level_1_to_5_xp_requirements(self):
        from app.services.xp_service import calculate_level
        
        assert calculate_level(0) == 1
        assert calculate_level(99) == 1
        assert calculate_level(100) == 2
        assert calculate_level(299) == 2
        assert calculate_level(300) == 3
        assert calculate_level(599) == 3
        assert calculate_level(600) == 4
        assert calculate_level(999) == 4
        assert calculate_level(1000) == 5
        assert calculate_level(5000) == 5

    def test_xp_earning_rate(self):
        from app.services.xp_service import calculate_xp_from_deposit
        
        assert calculate_xp_from_deposit(10) == 1
        assert calculate_xp_from_deposit(100) == 10
        assert calculate_xp_from_deposit(1000) == 100
        assert calculate_xp_from_deposit(1) == 0

    def test_completion_bonus(self):
        from app.services.xp_service import calculate_completion_bonus
        
        assert calculate_completion_bonus(False) == 0
        assert calculate_completion_bonus(True) == 100

    def test_total_xp_calculation(self):
        from app.services.xp_service import calculate_xp_from_deposit, calculate_completion_bonus
        
        deposit_amount = 500
        xp_from_deposit = calculate_xp_from_deposit(deposit_amount)
        xp_bonus = calculate_completion_bonus(True)
        
        assert xp_from_deposit == 50
        assert xp_bonus == 100
        assert xp_from_deposit + xp_bonus == 150


class TestStreakSystem:
    def test_streak_initialization(self):
        from app.services.xp_service import calculate_streak
        
        now = datetime.utcnow()
        streak, incremented = calculate_streak(None, now)
        
        assert streak == 1
        assert incremented == True

    def test_streak_monthly_increment(self):
        from app.services.xp_service import calculate_streak
        
        last_deposit = datetime(2025, 2, 15)
        current = datetime(2025, 3, 15)
        streak, incremented = calculate_streak(last_deposit, current, 5)
        
        assert streak == 6
        assert incremented == True

    def test_streak_same_month_no_increment(self):
        from app.services.xp_service import calculate_streak
        
        last_deposit = datetime(2025, 3, 1)
        current = datetime(2025, 3, 15)
        streak, incremented = calculate_streak(last_deposit, current, 5)
        
        assert streak == 5
        assert incremented == False

    def test_streak_reset_after_60_days(self):
        from app.services.xp_service import calculate_streak
        
        last_deposit = datetime(2025, 1, 1)
        current = datetime(2025, 3, 15)
        streak, incremented = calculate_streak(last_deposit, current, 10)
        
        assert streak == 1
        assert incremented == False


class TestMoodDetermination:
    def test_mood_idle_no_deposits(self):
        from app.services.xp_service import determine_mood
        from app.models.schemas import PenguinMood
        
        mood = determine_mood(0, None, 0)
        assert mood == PenguinMood.IDLE

    def test_mood_idle_low_streak(self):
        from app.services.xp_service import determine_mood
        from app.models.schemas import PenguinMood
        
        mood = determine_mood(3, datetime.utcnow(), 100)
        assert mood == PenguinMood.IDLE

    def test_mood_happy_high_streak(self):
        from app.services.xp_service import determine_mood
        from app.models.schemas import PenguinMood
        
        mood = determine_mood(6, datetime.utcnow(), 500)
        assert mood == PenguinMood.HAPPY

    def test_mood_waiting_after_30_days(self):
        from app.services.xp_service import determine_mood
        from app.models.schemas import PenguinMood
        
        old_date = datetime(2025, 1, 1)
        mood = determine_mood(5, old_date, 300)
        assert mood == PenguinMood.WAITING


class TestAccessorySystem:
    def test_level_1_accessories(self):
        from app.services.xp_service import calculate_accessories
        
        accessories = calculate_accessories(1)
        assert accessories == []

    def test_level_2_accessories(self):
        from app.services.xp_service import calculate_accessories
        
        accessories = calculate_accessories(2)
        assert "beanie" in accessories

    def test_level_3_accessories(self):
        from app.services.xp_service import calculate_accessories
        
        accessories = calculate_accessories(3)
        assert "beanie" in accessories
        assert "scarf" in accessories

    def test_level_5_accessories(self):
        from app.services.xp_service import calculate_accessories
        
        accessories = calculate_accessories(5)
        assert "beanie" in accessories
        assert "scarf" in accessories
        assert "gloves" in accessories
        assert "crown" in accessories

    def test_goal_based_accessories(self):
        from app.services.xp_service import calculate_accessories
        
        accessories = calculate_accessories(3, ["casa", "celular", "vacaciones"])
        assert "phone" in accessories
        assert "house" in accessories
        assert "sunglasses" in accessories

    def test_accessories_no_duplicates(self):
        from app.services.xp_service import calculate_accessories
        
        accessories = calculate_accessories(3, ["casa", "casa", "celular"])
        assert accessories.count("house") == 1
        assert accessories.count("phone") == 1
