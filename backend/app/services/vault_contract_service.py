# Vault Contract Service — Interacción con AhorroGOVault en RSK
# ======================================================================
"""
Servicio para interactuar con el contrato AhorroGOVault desplegado en RSK.

Permite:
- Crear vaults on-chain
- Depositar y retirar
- Consultar estado de vaults
- Verificar lock y progreso

Uso:
    service = VaultContractService()
    
    # Crear vault
    result = service.create_vault(
        name="Casa",
        icon="🏠",
        target=10.0,  # 10 RBTC
        vault_type=VaultType.SAVINGS
    )
    
    # Depositar
    result = service.deposit(vault_id=0, amount=1.0)
    
    # Consultar
    vault = service.get_vault(0)
"""

from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import IntEnum
import time

from web3 import Web3
from eth_account import Account
from eth_account.signers.local import LocalAccount

from app.config import get_settings

settings = get_settings()


# ============================================================================
# ENUMS (deben coincidir con el contrato Solidity)
# ============================================================================

class VaultStatus(IntEnum):
    """Estado del vault (debe coincidir con Solidity enum)"""
    ACTIVE = 0
    COMPLETED = 1
    CANCELLED = 2


class VaultType(IntEnum):
    """Tipo de vault (debe coincidir con Solidity enum)"""
    SAVINGS = 0
    RENTAL = 1
    P2P = 2


# ============================================================================
# ABI DEL CONTRATO
# ============================================================================

VAULT_ABI = [
    # Views
    {
        "inputs": [{"name": "vaultId", "type": "uint256"}],
        "name": "getVault",
        "outputs": [{
            "components": [
                {"name": "owner", "type": "address"},
                {"name": "name", "type": "string"},
                {"name": "icon", "type": "string"},
                {"name": "target", "type": "uint256"},
                {"name": "current", "type": "uint256"},
                {"name": "vaultType", "type": "uint8"},
                {"name": "beneficiary", "type": "address"},
                {"name": "locked", "type": "bool"},
                {"name": "unlockDate", "type": "uint256"},
                {"name": "status", "type": "uint8"},
                {"name": "createdAt", "type": "uint256"},
                {"name": "updatedAt", "type": "uint256"}
            ],
            "name": "",
            "type": "tuple"
        }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "user", "type": "address"}],
        "name": "getUserVaults",
        "outputs": [{"name": "", "type": "uint256[]"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "vaultId", "type": "uint256"}],
        "name": "getProgress",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "vaultId", "type": "uint256"}],
        "name": "isUnlocked",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "vaultId", "type": "uint256"}],
        "name": "getTimeRemaining",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "vaultId", "type": "uint256"}, {"name": "apy", "type": "uint256"}],
        "name": "calculateEstimatedYield",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "vaultCounter",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "tropykusAddress",
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    # Write functions
    {
        "inputs": [
            {"name": "name", "type": "string"},
            {"name": "icon", "type": "string"},
            {"name": "target", "type": "uint256"},
            {"name": "vaultType", "type": "uint8"},
            {"name": "beneficiary", "type": "address"},
            {"name": "locked", "type": "bool"},
            {"name": "unlockDate", "type": "uint256"}
        ],
        "name": "createVault",
        "outputs": [{"name": "vaultId", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "vaultId", "type": "uint256"}],
        "name": "deposit",
        "outputs": [{"name": "newBalance", "type": "uint256"}],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{"name": "vaultId", "type": "uint256"}, {"name": "amount", "type": "uint256"}],
        "name": "withdraw",
        "outputs": [{"name": "success", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "vaultId", "type": "uint256"}],
        "name": "cancelVault",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
{
        "inputs": [{"name": "_tropykusAddress", "type": "address"}],
        "name": "setTropykusAddress",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "vaultId", "type": "uint256"},
            {"name": "beneficiary", "type": "address"}
        ],
        "name": "setBeneficiary",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    # Events
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "vaultId", "type": "uint256"},
            {"indexed": True, "name": "owner", "type": "address"},
            {"indexed": False, "name": "name", "type": "string"},
            {"indexed": False, "name": "target", "type": "uint256"},
            {"indexed": False, "name": "vaultType", "type": "uint8"}
        ],
        "name": "VaultCreated",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "vaultId", "type": "uint256"},
            {"indexed": True, "name": "depositor", "type": "address"},
            {"indexed": False, "name": "amount", "type": "uint256"},
            {"indexed": False, "name": "newBalance", "type": "uint256"},
            {"indexed": False, "name": "timestamp", "type": "uint256"}
        ],
        "name": "DepositMade",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "vaultId", "type": "uint256"},
            {"indexed": True, "name": "withdrawer", "type": "address"},
            {"indexed": False, "name": "amount", "type": "uint256"},
            {"indexed": False, "name": "timestamp", "type": "uint256"}
        ],
        "name": "WithdrawalMade",
        "type": "event"
    }
]


# ============================================================================
# RESULT DATA CLASSES
# ============================================================================

@dataclass
class VaultInfo:
    """Información de un vault."""
    vault_id: int
    owner: str
    name: str
    icon: str
    target: float  # En RBTC
    current: float  # En RBTC
    vault_type: VaultType
    beneficiary: str
    locked: bool
    unlock_date: int  # Unix timestamp
    status: VaultStatus
    created_at: int  # Unix timestamp
    updated_at: int
    
    @property
    def progress_percent(self) -> float:
        """Progreso en porcentaje (0-100)."""
        if self.target == 0:
            return 0.0
        return min((self.current / self.target) * 100, 100.0)
    
    @property
    def is_unlocked(self) -> bool:
        """Si el vault está desbloqueado para retiro."""
        if not self.locked:
            return True
        return time.time() >= self.unlock_date
    
    @property
    def time_remaining_seconds(self) -> int:
        """Segundos restantes hasta desbloqueo."""
        if not self.locked:
            return 0
        remaining = self.unlock_date - int(time.time())
        return max(remaining, 0)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convierte a diccionario."""
        return {
            "vault_id": self.vault_id,
            "owner": self.owner,
            "name": self.name,
            "icon": self.icon,
            "target_rbtc": self.target,
            "current_rbtc": self.current,
            "vault_type": self.vault_type.name,
            "beneficiary": self.beneficiary,
            "locked": self.locked,
            "unlock_date": self.unlock_date,
            "status": self.status.name,
            "progress_percent": self.progress_percent,
            "is_unlocked": self.is_unlocked,
            "time_remaining_seconds": self.time_remaining_seconds,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }


@dataclass
class VaultCreationResult:
    """Resultado de creación de vault."""
    success: bool
    vault_id: int
    tx_hash: str
    gas_used: int


@dataclass
class DepositResult:
    """Resultado de depósito."""
    success: bool
    vault_id: int
    amount: float  # En RBTC
    new_balance: float
    tx_hash: str
    gas_used: int


@dataclass
class WithdrawResult:
    """Resultado de retiro."""
    success: bool
    vault_id: int
    amount: float
    tx_hash: str
    gas_used: int


# ============================================================================
# VAULT CONTRACT SERVICE
# ============================================================================

class VaultContractService:
    """
    Servicio para interactuar con el contrato AhorroGOVault desplegado.
    """
    
    DECIMALS = 18  # RBTC usa 18 decimales
    
    def __init__(
        self,
        contract_address: str = None,
        rpc_url: str = None,
        private_key: str = None
    ):
        """
        Inicializa el servicio.
        
        Args:
            contract_address: Dirección del contrato desplegado
            rpc_url: URL del nodo RPC (default: config)
            private_key: Clave privada para firmar transacciones
        """
        self.contract_address = contract_address or settings.vault_contract_address
        self.rpc_url = rpc_url or settings.rsk_rpc_url
        self.private_key = private_key or settings.private_key
        
        # Conexión Web3
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        
        # Wallet
        self.account: Optional[LocalAccount] = None
        if self.private_key:
            # Asegurar formato correcto
            pk = self.private_key
            if pk.startswith('0x'):
                pk = pk[2:]
            self.account = Account.from_key(pk)
        
        # Contrato
        self._contract = None
    
    @property
    def contract(self):
        """Obtiene instancia del contrato."""
        if self._contract is None:
            if not self.contract_address:
                raise ValueError("Contract address not configured")
            self._contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(self.contract_address),
                abi=VAULT_ABI
            )
        return self._contract
    
    # ─── Conversión de Unidades ─────────────────────────────────────────
    
    def _to_wei(self, amount: float) -> int:
        """Convierte RBTC a wei."""
        return self.w3.to_wei(amount, 'ether')
    
    def _from_wei(self, wei_amount: int) -> float:
        """Convierte wei a RBTC."""
        return float(Web3.from_wei(wei_amount, 'ether'))
    
    # ─── Consultas (View Functions) ───────────────────────────────────────
    
    def get_vault(self, vault_id: int) -> Optional[VaultInfo]:
        """
        Obtiene información de un vault.
        
        Args:
            vault_id: ID del vault
        
        Returns:
            VaultInfo o None si no existe
        """
        try:
            vault_data = self.contract.functions.getVault(vault_id).call()
            
            return VaultInfo(
                vault_id=vault_id,
                owner=vault_data[0],
                name=vault_data[1],
                icon=vault_data[2],
                target=self._from_wei(vault_data[3]),
                current=self._from_wei(vault_data[4]),
                vault_type=VaultType(int(vault_data[5])),
                beneficiary=vault_data[6],
                locked=vault_data[7],
                unlock_date=vault_data[8],
                status=VaultStatus(int(vault_data[9])),
                created_at=vault_data[10],
                updated_at=vault_data[11]
            )
        except Exception as e:
            print(f"Error getting vault {vault_id}: {e}")
            return None
    
    def get_user_vaults(self, user_address: str) -> List[int]:
        """Obtiene los IDs de todos los vaults de un usuario."""
        address = Web3.to_checksum_address(user_address)
        return list(self.contract.functions.getUserVaults(address).call())
    
    def get_progress(self, vault_id: int) -> float:
        """Obtiene el progreso del vault (0-100)."""
        progress_bp = self.contract.functions.getProgress(vault_id).call()
        return progress_bp / 100  # Basis points a porcentaje
    
    def is_unlocked(self, vault_id: int) -> bool:
        """Verifica si el vault está desbloqueado."""
        return self.contract.functions.isUnlocked(vault_id).call()
    
    def get_time_remaining(self, vault_id: int) -> int:
        """Obtiene segundos restantes hasta desbloqueo."""
        return self.contract.functions.getTimeRemaining(vault_id).call()
    
    def calculate_yield(self, vault_id: int, apy_percent: float) -> float:
        """
        Calcula yield estimado para un vault.
        
        Args:
            vault_id: ID del vault
            apy_percent: APY en porcentaje (ej: 5.0 para 5%)
        
        Returns:
            Yield estimado en RBTC
        """
        apy_basis_points = int(apy_percent * 100)  # 5% -> 500
        yield_wei = self.contract.functions.calculateEstimatedYield(vault_id, apy_basis_points).call()
        return self._from_wei(yield_wei)
    
    def get_vault_counter(self) -> int:
        """Obtiene el total de vaults creados."""
        return self.contract.functions.vaultCounter().call()
    
    def get_tropykus_address(self) -> str:
        """Obtiene la dirección de Tropykus configurada."""
        return self.contract.functions.tropykusAddress().call()
    
    # ─── Transacciones ──────────────────────────────────────────────────
    
    def _send_transaction(self, func, value: int = 0, gas_limit: int = 500000) -> Dict[str, Any]:
        """Ejecuta una transacción y retorna el resultado."""
        if not self.account:
            raise ValueError("Wallet not configured for transactions")
        
        try:
            # Construir transacción
            txn = func.build_transaction({
                'from': self.account.address,
                'value': value,
                'gas': gas_limit,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'chainId': settings.rsk_chain_id
            })
            
            # Firmar y enviar
            signed_txn = self.w3.eth.account.sign_transaction(txn, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            
            # Esperar confirmación
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            return {
                "success": receipt['status'] == 1,
                "tx_hash": tx_hash.hex(),
                "gas_used": receipt['gasUsed'],
                "status": receipt['status']
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def create_vault(
        self,
        name: str,
        icon: str,
        target: float,
        vault_type: VaultType = VaultType.SAVINGS,
        beneficiary: str = None,
        locked: bool = False,
        unlock_date: int = 0
    ) -> VaultCreationResult:
        """
        Crea un nuevo vault en el contrato.
        
        Args:
            name: Nombre del vault
            icon: Emoji del vault
            target: Meta en RBTC
            vault_type: Tipo de vault
            beneficiary: Dirección del beneficiario (para rental)
            locked: Si tiene time-lock
            unlock_date: Unix timestamp de desbloqueo
        
        Returns:
            VaultCreationResult con tx_hash y vault_id
        """
        if not self.account:
            raise ValueError("Wallet required for creating vault")
        
        target_wei = self._to_wei(target)
        beneficiary_addr = Web3.to_checksum_address(beneficiary) if beneficiary else "0x0000000000000000000000000000000000000000"
        
        func = self.contract.functions.createVault(
            name,
            icon,
            target_wei,
            int(vault_type),
            beneficiary_addr,
            locked,
            unlock_date
        )
        
        result = self._send_transaction(func)
        
        if result["success"]:
            # Obtener vault_id del counter
            vault_id = self.get_vault_counter() - 1
            
            return VaultCreationResult(
                success=True,
                vault_id=vault_id,
                tx_hash=result["tx_hash"],
                gas_used=result["gas_used"]
            )
        
        raise Exception(f"Failed to create vault: {result.get('error')}")
    
    def deposit(self, vault_id: int, amount: float) -> DepositResult:
        """
        Deposita fondos en un vault.
        
        Args:
            vault_id: ID del vault
            amount: Cantidad en RBTC
        
        Returns:
            DepositResult con nuevo balance
        """
        if not self.account:
            raise ValueError("Wallet required for deposits")
        
        amount_wei = self._to_wei(amount)
        
        func = self.contract.functions.deposit(vault_id)
        result = self._send_transaction(func, value=amount_wei)
        
        if result["success"]:
            # Obtener vault actualizado para nuevo balance
            vault = self.get_vault(vault_id)
            new_balance = vault.current if vault else 0
            
            return DepositResult(
                success=True,
                vault_id=vault_id,
                amount=amount,
                new_balance=new_balance,
                tx_hash=result["tx_hash"],
                gas_used=result["gas_used"]
            )
        
        raise Exception(f"Failed to deposit: {result.get('error')}")
    
    def withdraw(self, vault_id: int, amount: float) -> WithdrawResult:
        """
        Retira fondos de un vault.
        
        Args:
            vault_id: ID del vault
            amount: Cantidad en RBTC
        
        Returns:
            WithdrawResult
        """
        if not self.account:
            raise ValueError("Wallet required for withdrawals")
        
        amount_wei = self._to_wei(amount)
        
        func = self.contract.functions.withdraw(vault_id, amount_wei)
        result = self._send_transaction(func)
        
        if result["success"]:
            return WithdrawResult(
                success=True,
                vault_id=vault_id,
                amount=amount,
                tx_hash=result["tx_hash"],
                gas_used=result["gas_used"]
            )
        
        raise Exception(f"Failed to withdraw: {result.get('error')}")
    
    def cancel_vault(self, vault_id: int) -> Dict[str, Any]:
        """Cancela un vault."""
        if not self.account:
            raise ValueError("Wallet required to cancel vault")
        
        func = self.contract.functions.cancelVault(vault_id)
        return self._send_transaction(func)
    
    def set_tropykus_address(self, address: str) -> Dict[str, Any]:
        """Configura la dirección de Tropykus (solo owner)."""
        if not self.account:
            raise ValueError("Wallet required")
        
        addr = Web3.to_checksum_address(address)
        func = self.contract.functions.setTropykusAddress(addr)
        return self._send_transaction(func)
    
    def set_beneficiary(self, vault_id: int, beneficiary: str) -> Dict[str, Any]:
        """
        Establece el beneficiario de un vault (solo para vaults tipo rental).
        
        Args:
            vault_id: ID del vault
            beneficiary: Dirección del beneficiario
        
        Returns:
            Dict con success, tx_hash, gas_used
        """
        if not self.account:
            raise ValueError("Wallet required for setting beneficiary")
        
        # Validar dirección del beneficiario
        beneficiary_addr = Web3.to_checksum_address(beneficiary)
        
        # Construir y enviar transacción
        func = self.contract.functions.setBeneficiary(vault_id, beneficiary_addr)
        result = self._send_transaction(func, gas_limit=200000)
        
        if result["success"]:
            return {
                "success": True,
                "tx_hash": result["tx_hash"],
                "gas_used": result["gas_used"],
                "vault_id": vault_id,
                "beneficiary": beneficiary_addr
            }
        
        raise Exception(f"Failed to set beneficiary: {result.get('error')}")
    
    # ─── Utilidades ──────────────────────────────────────────────────────
    
    def get_balance(self, address: str = None) -> float:
        """Obtiene el balance de RBTC de una dirección."""
        addr = address or (self.account.address if self.account else None)
        if not addr:
            raise ValueError("No address specified")
        
        address = Web3.to_checksum_address(addr)
        balance_wei = self.w3.eth.get_balance(address)
        return self._from_wei(balance_wei)


# ============================================================================
# FUNCIÓN DE CONVENIENCIA
# ============================================================================

def get_vault_contract(
    contract_address: str = None,
    private_key: str = None
) -> VaultContractService:
    """
    Factory function para crear VaultContractService.
    
    Usa settings por defecto si no se especifican parámetros.
    """
    return VaultContractService(
        contract_address=contract_address or settings.vault_contract_address,
        rpc_url=settings.rsk_rpc_url,
        private_key=private_key or settings.private_key
    )