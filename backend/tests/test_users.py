import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from datetime import datetime


class TestUsersEndpoints:
    def test_health_check(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    @patch("app.api.deps.get_current_user")
    @patch("app.services.user_service.get_by_address")
    def test_get_current_user(self, mock_get_by_address, mock_get_current_user, client, sample_user):
        mock_get_current_user.return_value = sample_user
        
        token = "test_token"
        response = client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["address"] == sample_user["address"]
        assert data["alias"] == sample_user["alias"]
        assert data["xp"] == sample_user["xp"]
        assert data["level"] == sample_user["level"]


class TestXPService:
    def test_calculate_level(self):
        from app.services.xp_service import calculate_level
        
        assert calculate_level(0) == 1
        assert calculate_level(50) == 1
        assert calculate_level(100) == 2
        assert calculate_level(250) == 2
        assert calculate_level(300) == 3
        assert calculate_level(550) == 3
        assert calculate_level(600) == 4
        assert calculate_level(900) == 4
        assert calculate_level(1000) == 5
        assert calculate_level(1500) == 5

    def test_calculate_xp_from_deposit(self):
        from app.services.xp_service import calculate_xp_from_deposit
        
        assert calculate_xp_from_deposit(10) == 1
        assert calculate_xp_from_deposit(100) == 10
        assert calculate_xp_from_deposit(500) == 50
        assert calculate_xp_from_deposit(1000) == 100

    def test_calculate_completion_bonus(self):
        from app.services.xp_service import calculate_completion_bonus
        
        assert calculate_completion_bonus(False) == 0
        assert calculate_completion_bonus(True) == 100

    def test_calculate_streak_first_deposit(self):
        from app.services.xp_service import calculate_streak
        
        now = datetime.utcnow()
        streak, incremented = calculate_streak(None, now)
        assert streak == 1
        assert incremented == True

    def test_calculate_streak_same_month(self):
        from app.services.xp_service import calculate_streak
        
        last_month = datetime(2025, 3, 1)
        current = datetime(2025, 3, 15)
        streak, incremented = calculate_streak(last_month, current, 5)
        assert streak == 5
        assert incremented == False

    def test_calculate_streak_new_month(self):
        from app.services.xp_service import calculate_streak
        
        last_month = datetime(2025, 2, 1)
        current = datetime(2025, 3, 15)
        streak, incremented = calculate_streak(last_month, current, 5)
        assert streak == 6
        assert incremented == True

    def test_determine_mood_idle(self):
        from app.services.xp_service import determine_mood
        from app.models.schemas import PenguinMood
        
        mood = determine_mood(3, datetime.utcnow(), 300)
        assert mood == PenguinMood.IDLE

    def test_determine_mood_happy(self):
        from app.services.xp_service import determine_mood
        from app.models.schemas import PenguinMood
        
        mood = determine_mood(6, datetime.utcnow(), 300)
        assert mood == PenguinMood.HAPPY

    def test_determine_mood_waiting(self):
        from app.services.xp_service import determine_mood
        from app.models.schemas import PenguinMood
        
        old_date = datetime(2025, 1, 1)
        mood = determine_mood(5, old_date, 300)
        assert mood == PenguinMood.WAITING

    def test_determine_mood_no_deposits(self):
        from app.services.xp_service import determine_mood
        from app.models.schemas import PenguinMood
        
        mood = determine_mood(0, None, 0)
        assert mood == PenguinMood.IDLE


class TestAccessories:
    def test_calculate_accessories_level_1(self):
        from app.services.xp_service import calculate_accessories
        
        accessories = calculate_accessories(1)
        assert accessories == []

    def test_calculate_accessories_level_3(self):
        from app.services.xp_service import calculate_accessories
        
        accessories = calculate_accessories(3)
        assert "beanie" in accessories
        assert "scarf" in accessories

    def test_calculate_accessories_with_goals(self):
        from app.services.xp_service import calculate_accessories
        
        accessories = calculate_accessories(3, ["casa", "celular"])
        assert "phone" in accessories
        assert "house" in accessories
