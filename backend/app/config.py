from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List, Optional


class Settings(BaseSettings):
    # Supabase (opcional para blockchain-only mode)
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    
    # JWT
    jwt_secret_key: str = "ahorrogo_jwt_secret_key_2024"
    jwt_algorithm: str = "HS256"
    jwt_expiration_days: int = 7
    
    # RSK Blockchain
    rsk_rpc_url: str = "https://public-node.testnet.rsk.co"
    rsk_chain_id: int = 31  # 30 = Mainnet, 31 = Testnet
    
    # Wallet para transacciones on-chain
    private_key: str = ""  # Sin prefijo 0x
    deployer_address: str = ""
    
    # Tropykus Protocol Addresses (RSK Testnet)
    tropykus_comptroller: str = "0x7de1ade0c4482ceab96faff408cc9dcc9015b448"
    tropykus_krbtc: str = "0x636b2c156d09cee9516f9afec7a4605e1f43dec1"
    tropykus_kdoc: str = "0xe7b4770af8152fc1a0e13d08e70a8c9a70f4d9d9"
    tropykus_krdoc: str = "0x0981eb51a91e6f89063c963438cadf16c2e44962"
    
    # Custom Vault Contract (desplegado por AhorroGO)
    vault_contract_address: str = ""
    
    # Database
    database_url: str = "sqlite:///./ahorrogo.db"
    
    # App
    app_env: str = "development"
    debug: bool = True
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:5173,https://ahorrogo.app"
    
    # Security
    webhook_secret: str = ""  # Para validar webhooks externos
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "allow"  # Permitir campos extra del .env
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    @property
    def is_testnet(self) -> bool:
        return self.rsk_chain_id == 31
    
    @property
    def is_mainnet(self) -> bool:
        return self.rsk_chain_id == 30


@lru_cache
def get_settings() -> Settings:
    return Settings()
