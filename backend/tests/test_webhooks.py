import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from datetime import datetime


class TestBlockchainWebhook:
    def test_webhook_deposit_completed(self, client, auth_headers):
        with patch("app.api.deps.get_current_user") as mock_auth:
            mock_auth.return_value = {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE7",
                "alias": "juan.bexo",
                "xp": 300,
                "level": 3,
                "streak": 5,
            }
            
            with patch("app.services.vault_service.get_by_id") as mock_get_vault:
                mock_get_vault.return_value = {
                    "id": "550e8400-e29b-41d4-a716-446655440001",
                    "user_id": "550e8400-e29b-41d4-a716-446655440000",
                    "name": "Casa",
                    "current": 4000.0,
                    "target": 10000.0,
                    "status": "active",
                }
                
                with patch("app.db.table") as mock_table:
                    mock_query = MagicMock()
                    mock_query.select.return_value = mock_query
                    mock_query.execute.return_value = MagicMock(data=[])
                    mock_table.return_value = mock_query
                    
                    mock_insert = MagicMock()
                    mock_insert.insert.return_value = mock_insert
                    mock_insert.execute.return_value = MagicMock(data=[{"id": "activity-id"}])
                    mock_table.return_value = mock_insert
                    
                    with patch("app.services.vault_service.update_current") as mock_update_vault:
                        mock_update_vault.return_value = {
                            "id": "550e8400-e29b-41d4-a716-446655440001",
                            "current": 4500.0,
                        }
                        
                        with patch("app.services.user_service.update_xp_streak") as mock_update_user:
                            mock_update_user.return_value = {
                                "xp": 350,
                                "level": 3,
                            }
                            
                            with patch("app.services.notification_service.create_notification"):
                                response = client.post(
                                    "/api/v1/webhooks/blockchain",
                                    json={
                                        "event": "DepositCompleted",
                                        "tx_hash": "0xabcd1234...",
                                        "user_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE7",
                                        "amount": 500.0,
                                        "vault_id": "550e8400-e29b-41d4-a716-446655440001",
                                        "block_number": 12345678,
                                        "timestamp": 1712000000,
                                    },
                                    headers=auth_headers
                                )
                                
                                assert response.status_code == 200
                                data = response.json()
                                assert data["processed"] == True


class TestBlockchainService:
    def test_is_valid_address(self):
        from app.core.security import is_valid_address
        
        assert is_valid_address("0x742d35Cc6634C0532925a3b844Bc9e7595f42bE7") == True
        assert is_valid_address("0x742d35Cc6634C0532925a3b844Bc9e7595f42bE7".lower()) == True
        assert is_valid_address("invalid") == False
        assert is_valid_address("0x") == False

    def test_get_address_checksum(self):
        from app.core.security import get_address_checksum
        
        address = "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE7"
        checksum = get_address_checksum(address.lower())
        assert checksum == address
