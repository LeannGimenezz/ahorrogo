import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from datetime import datetime


class TestVaultsEndpoints:
    def test_create_vault_validation(self, client, auth_headers):
        with patch("app.api.deps.get_current_user") as mock_auth:
            mock_auth.return_value = {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE7",
                "alias": "juan.bexo",
            }
            
            with patch("app.services.vault_service.get_by_name") as mock_get_by_name:
                mock_get_by_name.return_value = None
                
                with patch("app.services.vault_service.create") as mock_create:
                    mock_create.return_value = {
                        "id": "550e8400-e29b-41d4-a716-446655440001",
                        "user_id": "550e8400-e29b-41d4-a716-446655440000",
                        "name": "Casa",
                        "icon": "🏠",
                        "target": 10000.00,
                        "current": 0,
                        "vault_type": "savings",
                        "beneficiary": None,
                        "locked": False,
                        "unlock_date": None,
                        "status": "active",
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow(),
                    }
                    
                    response = client.post(
                        "/api/v1/vaults",
                        json={
                            "name": "Casa",
                            "icon": "🏠",
                            "target": 10000.00,
                            "vault_type": "savings",
                        },
                        headers=auth_headers
                    )
                    
                    assert response.status_code == 201
                    data = response.json()
                    assert data["name"] == "Casa"
                    assert data["target"] == 10000.00
                    assert data["current"] == 0
                    assert data["status"] == "active"


class TestVaultProgress:
    def test_vault_progress_calculation(self):
        from app.models.schemas import VaultResponse, VaultStatus, VaultType
        
        vault = VaultResponse(
            id="test-id",
            user_id="user-id",
            name="Test",
            icon="🏠",
            target=10000.0,
            current=4200.0,
            vault_type=VaultType.SAVINGS,
            beneficiary=None,
            locked=False,
            unlock_date=None,
            status=VaultStatus.ACTIVE,
            progress=0,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        
        assert vault.progress == 0.42

    def test_vault_progress_completed(self):
        from app.models.schemas import VaultResponse, VaultStatus, VaultType
        
        vault = VaultResponse(
            id="test-id",
            user_id="user-id",
            name="Test",
            icon="🏠",
            target=10000.0,
            current=10500.0,
            vault_type=VaultType.SAVINGS,
            beneficiary=None,
            locked=False,
            unlock_date=None,
            status=VaultStatus.COMPLETED,
            progress=0,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        
        assert vault.progress == 1.0

    def test_vault_progress_zero_target(self):
        from app.models.schemas import VaultResponse, VaultStatus, VaultType
        
        vault = VaultResponse(
            id="test-id",
            user_id="user-id",
            name="Test",
            icon="🏠",
            target=0.0,
            current=100.0,
            vault_type=VaultType.SAVINGS,
            beneficiary=None,
            locked=False,
            unlock_date=None,
            status=VaultStatus.ACTIVE,
            progress=0,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        
        assert vault.progress == 0


class TestVaultService:
    def test_get_total_saved(self):
        from app.services.vault_service import vault_service
