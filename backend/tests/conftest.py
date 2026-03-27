import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from app.main import app
from app.core.auth import create_access_token


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_headers():
    token = create_access_token({"sub": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE7"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_user():
    return {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE7",
        "alias": "juan.bexo",
        "xp": 350,
        "level": 3,
        "streak": 5,
        "last_deposit_at": "2025-03-15T10:30:00Z",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }


@pytest.fixture
def sample_vault():
    return {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Casa",
        "icon": "🏠",
        "target": 10000.00,
        "current": 4200.00,
        "vault_type": "savings",
        "beneficiary": None,
        "locked": True,
        "unlock_date": "2025-12-15T00:00:00Z",
        "status": "active",
        "contract_address": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }


@pytest.fixture
def mock_db():
    db = AsyncMock()
    return db


@pytest.fixture
def mock_supabase_response(data=None):
    response = MagicMock()
    response.data = data or []
    return response
