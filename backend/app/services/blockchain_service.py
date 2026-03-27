# Blockchain Service — Servicio de Blockchain para AhorroGO
# ============================================================

"""
Servicio para interactuar con la blockchain RSK.

Incluye:
- Conexión con nodos RSK
- Consulta de transacciones y bloques
- Integración con Tropykus Protocol
- Utilities para conversión de unidades
"""

from typing import Optional, Dict, Any, List
from decimal import Decimal

from web3 import Web3

from app.config import get_settings

settings = get_settings()


# ============================================================================
# CONFIGURACIÓN DE REDES
# ============================================================================

class NetworkConfig:
    """Configuración de redes blockchain."""
    
    RSK_MAINNET = {
        "chain_id": 30,
        "rpc_url": "https://public-node.rsk.co",
        "explorer_url": "https://rootstock.blockscout.com",
        "symbol": "RBTC",
        "decimals": 18
    }
    
    RSK_TESTNET = {
        "chain_id": 31,
        "rpc_url": "https://public-node.testnet.rsk.co",
        "explorer_url": "https://explorer.testnet.rootstock.io",
        "symbol": "tRBTC",
        "decimals": 18
    }
    
    @classmethod
    def get_config(cls, chain_id: int = None) -> Dict[str, Any]:
        if chain_id is None:
            chain_id = settings.rsk_chain_id
        
        if chain_id == 30:
            return cls.RSK_MAINNET
        elif chain_id == 31:
            return cls.RSK_TESTNET
        else:
            raise ValueError(f"Unknown chain_id: {chain_id}")


# ============================================================================
# CONVERSIÓN DE UNIDADES
# ============================================================================

class UnitConverter:
    """Conversión de unidades common en blockchain."""
    
    # RSK/RBTC usa 18 decimales (como Ethereum)
    DECIMALS_RBTC = 18
    
    # DOC (Dollar on Chain) usa 18 decimales
    DECIMALS_DOC = 18
    
    @staticmethod
    def rbtc_to_wei(amount: float) -> int:
        """Convierte RBTC a Wei (18 decimales)."""
        return Web3.to_wei(amount, 'ether')
    
    @staticmethod
    def wei_to_rbtc(wei_amount: int) -> float:
        """Convierte Wei a RBTC."""
        return float(Web3.from_wei(wei_amount, 'ether'))
    
    @staticmethod
    def doc_to_units(amount: float, decimals: int = 18) -> int:
        """Convierte DOC a unidades."""
        return Web3.to_wei(amount, 'ether')
    
    @staticmethod
    def units_to_doc(units: int, decimals: int = 18) -> float:
        """Convierte unidades a DOC."""
        return float(Web3.from_wei(units, 'ether'))
    
    @staticmethod
    def format_currency(amount: float, decimals: int = 2) -> str:
        """Formatea un monto como moneda (2 decimales)."""
        return f"${amount:,.{decimals}f}"
    
    @staticmethod
    def parse_currency(value: str) -> float:
        """Parsea un string de moneda a float."""
        # Remover $, comas, espacios
        cleaned = value.replace("$", "").replace(",", "").strip()
        return float(cleaned)


# ============================================================================
# SERVICIO BLOCKCHAIN
# ============================================================================

class BlockchainService:
    """
    Servicio principal para operaciones de blockchain.
    
    Funcionalidades:
    - Consulta de estado de blockchain
    - Lectura de contratos
    - Conversion de unidades
    - Verificación de direcciones
    """
    
    def __init__(
        self,
        rpc_url: str = None,
        chain_id: int = None
    ):
        self.rpc_url = rpc_url or settings.rsk_rpc_url
        self.chain_id = chain_id or settings.rsk_chain_id
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self.config = NetworkConfig.get_config(self.chain_id)
    
    # ─── Estado de Red ──────────────────────────────────────────────────
    
    def get_block_number(self) -> int:
        """Obtiene el número del bloque actual."""
        return self.w3.eth.block_number
    
    def get_gas_price(self) -> int:
        """Obtiene el gas price actual en Wei."""
        return self.w3.eth.gas_price
    
    def get_network_info(self) -> Dict[str, Any]:
        """Obtiene información de la red."""
        return {
            "chain_id": self.chain_id,
            "block_number": self.get_block_number(),
            "gas_price": self.get_gas_price(),
            "rpc_url": self.rpc_url,
            "symbol": self.config["symbol"]
        }
    
    # ─── Async Wrappers ──────────────────────────────────────────────────
    
    async def get_block_number_async(self) -> int:
        """Async wrapper para get_block_number."""
        return self.get_block_number()
    
    async def get_gas_price_async(self) -> int:
        """Async wrapper para get_gas_price."""
        return self.get_gas_price()
    
    async def get_network_info_async(self) -> Dict[str, Any]:
        """Async wrapper para get_network_info."""
        return self.get_network_info()
    
    # ─── Transacciones ──────────────────────────────────────────────────
    
    def get_transaction_receipt(self, tx_hash: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene el recibo de una transacción.
        
        Returns:
            Dict con hash, block_number, status, confirmations, gas_used, logs
            o None si no existe
        """
        try:
            receipt = self.w3.eth.get_transaction_receipt(tx_hash)
            if receipt:
                return {
                    "hash": receipt['transactionHash'].hex() if isinstance(receipt['transactionHash'], bytes) else receipt['transactionHash'],
                    "block_number": receipt['blockNumber'],
                    "status": receipt['status'],  # 1 = success, 0 = failure
                    "gas_used": receipt['gasUsed'],
                    "from": receipt['from'],
                    "to": receipt['to'],
                    "contract_address": receipt.get('contractAddress'),
                    "logs": [
                        {
                            "address": log['address'],
                            "topics": [t.hex() if isinstance(t, bytes) else t for t in log['topics']],
                            "data": log['data'].hex() if isinstance(log['data'], bytes) else log['data']
                        }
                        for log in receipt['logs']
                    ]
                }
            return None
        except Exception as e:
            return None
    
    async def get_transaction_receipt_async(self, tx_hash: str) -> Optional[Dict[str, Any]]:
        """Async wrapper para get_transaction_receipt."""
        return self.get_transaction_receipt(tx_hash)
    
    def wait_for_confirmation(
        self,
        tx_hash: str,
        timeout: int = 120,
        confirmations: int = 1
    ) -> Dict[str, Any]:
        """
        Espera hasta que una transacción tenga suficientes confirmaciones.
        
        Args:
            tx_hash: Hash de la transacción
            timeout: Timeout en segundos
            confirmations: Número de confirmaciones requeridas
        
        Returns:
            Receipt de la transacción
        """
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=timeout)
        
        return {
            "hash": receipt['transactionHash'].hex() if isinstance(receipt['transactionHash'], bytes) else receipt['transactionHash'],
            "block_number": receipt['blockNumber'],
            "status": receipt['status'],
            "gas_used": receipt['gasUsed']
        }
    
    async def wait_for_confirmation_async(
        self,
        tx_hash: str,
        timeout: int = 120,
        confirmations: int = 1
    ) -> Dict[str, Any]:
        """Async wrapper para wait_for_confirmation."""
        return self.wait_for_confirmation(tx_hash, timeout, confirmations)
    
    async def is_transaction_confirmed(self, tx_hash: str) -> bool:
        """Verifica si una transacción está confirmada."""
        receipt = self.get_transaction_receipt(tx_hash)
        return receipt is not None and receipt["status"] == 1
    
    # ─── Direcciones ────────────────────────────────────────────────────
    
    def is_valid_address(self, address: str) -> bool:
        """Verifica si una dirección es válida (formato EVM)."""
        return Web3.is_address(address)
    
    def checksum_address(self, address: str) -> str:
        """Convierte una dirección a formato checksummed."""
        return Web3.to_checksum_address(address)
    
    def get_code(self, address: str) -> str:
        """Obtiene el código de un contrato en una dirección."""
        return self.w3.eth.get_code(address).hex()
    
    async def get_code_async(self, address: str) -> str:
        """Async wrapper para get_code."""
        return self.get_code(address)
    
    def is_contract(self, address: str) -> bool:
        """Verifica si una dirección es un contrato (tiene código)."""
        code = self.get_code(address)
        return code != "0x" and code != "0x00"
    
    async def is_contract_async(self, address: str) -> bool:
        """Async wrapper para is_contract."""
        return self.is_contract(address)
    
    # ─── Balances ──────────────────────────────────────────────────────
    
    def get_rbtc_balance(self, address: str) -> float:
        """
        Obtiene el balance de RBTC de una dirección.
        
        Returns:
            Balance en RBTC (no en Wei)
        """
        address = Web3.to_checksum_address(address)
        balance_wei = self.w3.eth.get_balance(address)
        return float(Web3.from_wei(balance_wei, 'ether'))
    
    async def get_rbtc_balance_async(self, address: str) -> float:
        """Async wrapper para get_rbtc_balance."""
        return self.get_rbtc_balance(address)
    
    def get_token_balance(
        self,
        token_address: str,
        owner_address: str,
        abi: List = None
    ) -> int:
        """
        Obtiene el balance de un token ERC20.
        
        Args:
            token_address: Dirección del contrato del token
            owner_address: Dirección del propietario
            abi: ABI del token (si no se provee, usa ERC20 básico)
        
        Returns:
            Balance en unidades del token (sin decimales)
        """
        if abi is None:
            abi = [
                {
                    "inputs": [{"name": "account", "type": "address"}],
                    "name": "balanceOf",
                    "outputs": [{"name": "", "type": "uint256"}],
                    "stateMutability": "view",
                    "type": "function"
                }
            ]
        
        contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(token_address),
            abi=abi
        )
        balance = contract.functions.balanceOf(Web3.to_checksum_address(owner_address)).call()
        return balance
    
    async def get_token_balance_async(
        self,
        token_address: str,
        owner_address: str,
        abi: List = None
    ) -> int:
        """Async wrapper para get_token_balance."""
        return self.get_token_balance(token_address, owner_address, abi)
    
    # ─── Estimates ──────────────────────────────────────────────────────
    
    def estimate_gas(
        self,
        from_address: str,
        to_address: str,
        value: int = 0,
        data: str = None
    ) -> int:
        """Estima el gas necesario para una transacción."""
        try:
            tx = {
                "from": Web3.to_checksum_address(from_address),
                "to": Web3.to_checksum_address(to_address),
                "value": value
            }
            if data:
                tx["data"] = data
            return self.w3.eth.estimate_gas(tx)
        except Exception:
            return 200000  # Gas default
    
    async def estimate_gas_async(
        self,
        from_address: str,
        to_address: str,
        value: int = 0,
        data: str = None
    ) -> int:
        """Async wrapper para estimate_gas."""
        return self.estimate_gas(from_address, to_address, value, data)
    
    def estimate_tx_cost(
        self,
        from_address: str,
        to_address: str,
        value: int = 0,
        data: str = None
    ) -> Dict[str, Any]:
        """
        Estima el costo total de una transacción.
        
        Returns:
            Dict con gas_estimate, gas_price, total_cost_rbtc, total_cost_usd
        """
        gas_price = self.get_gas_price()
        gas_estimate = self.estimate_gas(from_address, to_address, value, data)
        
        total_wei = gas_estimate * gas_price
        total_rbtc = float(Web3.from_wei(total_wei, 'ether'))
        
        # Estimación de USD (RBTC ≈ BTC, usar precio de BTC como proxy)
        # En producción, integrar con oracle de precios
        rbtc_price_usd = 50000  # Placeholder
        total_usd = total_rbtc * rbtc_price_usd
        
        return {
            "gas_estimate": gas_estimate,
            "gas_price_wei": gas_price,
            "gas_price_gwei": float(Web3.from_wei(gas_price, 'gwei')),
            "total_cost_wei": total_wei,
            "total_cost_rbtc": total_rbtc,
            "total_cost_usd_estimate": total_usd
        }
    
    async def estimate_tx_cost_async(
        self,
        from_address: str,
        to_address: str,
        value: int = 0,
        data: str = None
    ) -> Dict[str, Any]:
        """Async wrapper para estimate_tx_cost."""
        return self.estimate_tx_cost(from_address, to_address, value, data)
    
    # ─── URLs de Explorer ──────────────────────────────────────────────
    
    def get_explorer_tx_url(self, tx_hash: str) -> str:
        """Genera URL de transacción en el explorer."""
        return f"{self.config['explorer_url']}/tx/{tx_hash}"
    
    def get_explorer_address_url(self, address: str) -> str:
        """Genera URL de dirección en el explorer."""
        return f"{self.config['explorer_url']}/address/{address}"
    
    def get_explorer_block_url(self, block_number: int) -> str:
        """Genera URL de bloque en el explorer."""
        return f"{self.config['explorer_url']}/block/{block_number}"


# ============================================================================
# INSTANCIA GLOBAL
# ============================================================================

blockchain_service = BlockchainService()


# ============================================================================
# FUNCIONES DE CONVENIENCIA (async wrappers)
# ============================================================================

async def get_transaction_receipt(tx_hash: str) -> Optional[Dict[str, Any]]:
    """Obtiene receipt de transacción."""
    return blockchain_service.get_transaction_receipt(tx_hash)


async def get_rbtc_balance(address: str) -> float:
    """Obtiene balance RBTC."""
    return blockchain_service.get_rbtc_balance(address)


async def is_valid_address(address: str) -> bool:
    """Valida dirección."""
    return blockchain_service.is_valid_address(address)


async def is_contract(address: str) -> bool:
    """Verifica si es contrato."""
    return blockchain_service.is_contract(address)