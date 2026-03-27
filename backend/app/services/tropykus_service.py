# Tropykus Service — Integración Real con Tropykus Protocol en RSK
# =============================================================================

"""
Servicio para interactuar con el protocolo Tropykus sobre RSK.

CONTRATOS PRINCIPALES (RSK Testnet):
- Comptroller: 0x7de1ade0c4482ceab96faff408cc9dcc9015b448
- kRBTC (CRBTC): 0x636b2c156d09cee9516f9afec7a4605e1f43dec1
- kDOC: 0xe7b4770af8152fc1a0e13d08e70a8c9a70f4d9d9
- kRDOC: 0x0981eb51a91e6f89063c963438cadf16c2e44962

RECURSOS:
- Docs: https://docs.tropykus.com
- GitHub: https://github.com/Tropykus
"""

from decimal import Decimal
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

from web3 import Web3
from eth_account import Account

from app.config import get_settings

settings = get_settings()


# ============================================================================
# CONTRATOS Y DIRECCIONES (RSK Testnet)
# ============================================================================

class TropykusAddresses:
    """Direcciones de contratos en RSK Testnet."""
    
    MAINNET = 30
    TESTNET = 31
    
    COMPTROLLER_MAINNET = "0x962308Fef8EdfAdD705384840e7701f8F39ed0c0"
    COMPTROLLER_TESTNET = "0x7de1ade0c4482ceab96faff408cc9dcc9015b448"
    
    KRBTC_MAINNET = "0x0aeadb9d4c6a80462a47e87e76e487fa8b9a37d7"
    KRBTC_TESTNET = "0x636b2c156d09cee9516f9afec7a4605e1f43dec1"
    
    KDOC_MAINNET = "0x544eb90e766b405134b3b3f62b6b4c23fcd5fda2"
    KDOC_TESTNET = "0xe7b4770af8152fc1a0e13d08e70a8c9a70f4d9d9"
    
    KRDOC_MAINNET = "0x405062731d8656af5950ef952be9fa110878036b"
    KRDOC_TESTNET = "0x0981eb51a91e6f89063c963438cadf16c2e44962"
    
    @classmethod
    def get_comptroller(cls, chain_id: int = None) -> str:
        chain_id = chain_id or settings.rsk_chain_id
        return cls.COMPTROLLER_TESTNET if chain_id == cls.TESTNET else cls.COMPTROLLER_MAINNET
    
    @classmethod
    def get_krbtc(cls, chain_id: int = None) -> str:
        chain_id = chain_id or settings.rsk_chain_id
        return cls.KRBTC_TESTNET if chain_id == cls.TESTNET else cls.KRBTC_MAINNET
    
    @classmethod
    def get_kdoc(cls, chain_id: int = None) -> str:
        chain_id = chain_id or settings.rsk_chain_id
        return cls.KDOC_TESTNET if chain_id == cls.TESTNET else cls.KDOC_MAINNET
    
    @classmethod
    def get_krdoc(cls, chain_id: int = None) -> str:
        chain_id = chain_id or settings.rsk_chain_id
        return cls.KRDOC_TESTNET if chain_id == cls.TESTNET else cls.KRDOC_MAINNET


# ============================================================================
# ABIs DE CONTRATOS
# ============================================================================

CRBTC_ABI = [
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOfUnderlying",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "mint",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{"name": "redeemTokens", "type": "uint256"}],
        "name": "redeem",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "underlyingAmount", "type": "uint256"}],
        "name": "redeemUnderlying",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "exchangeRateCurrent",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "supplyRatePerBlock",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "borrowRatePerBlock",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalBorrows",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getCash",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "getAccountSnapshot",
        "outputs": [
            {"name": "error", "type": "uint256"},
            {"name": "kTokenBalance", "type": "uint256"},
            {"name": "borrowBalance", "type": "uint256"},
            {"name": "exchangeRateMantissa", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

CERC20_ABI = CRBTC_ABI + [
    {
        "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "owner", "type": "address"}, {"name": "spender", "type": "address"}],
        "name": "allowance",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
]

COMPTROLLER_ABI = [
    {
        "inputs": [{"name": "kTokens", "type": "address[]"}],
        "name": "enterMarkets",
        "outputs": [{"name": "", "type": "uint256[]"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "kTokenAddress", "type": "address"}],
        "name": "exitMarket",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "getAssetsIn",
        "outputs": [{"name": "", "type": "address[]"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "getAccountLiquidity",
        "outputs": [
            {"name": "", "type": "uint256"},
            {"name": "", "type": "uint256"},
            {"name": "", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getAllMarkets",
        "outputs": [{"name": "", "type": "address[]"}],
        "stateMutability": "view",
        "type": "function"
    }
]

ERC20_ABI = [
    {
        "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    }
]


# ============================================================================
# ERRORES Y RESULTADOS
# ============================================================================

class TropykusError(Exception):
    """Error base del servicio Tropykus."""
    pass


class TransactionError(TropykusError):
    """Error en una transacción blockchain."""
    def __init__(self, message: str, tx_hash: str = None):
        super().__init__(message)
        self.tx_hash = tx_hash


class ValidationError(TropykusError):
    """Error de validación."""
    pass


class InsufficientFundsError(TransactionError):
    """Fondos insuficientes."""
    pass


@dataclass
class MarketInfo:
    """Información de un mercado de Tropykus."""
    address: str
    name: str
    symbol: str
    total_supply: float
    total_borrow: float
    supply_rate: float
    borrow_rate: float
    exchange_rate: float
    cash: float
    decimals: int


@dataclass
class DepositResult:
    """Resultado de un depósito."""
    success: bool
    tx_hash: str
    ktoken_amount: float
    underlying_amount: float
    exchange_rate: float
    gas_used: int


@dataclass
class WithdrawResult:
    """Resultado de un retiro."""
    success: bool
    tx_hash: str
    underlying_amount: float
    gas_used: int


# ============================================================================
# SERVICIO TROPYKUS
# ============================================================================

class TropykusService:
    """Servicio para interactuar con el protocolo Tropykus."""
    
    def __init__(
        self,
        rpc_url: str = None,
        chain_id: int = None,
        private_key: str = None
    ):
        self.rpc_url = rpc_url or settings.rsk_rpc_url
        self.chain_id = chain_id or settings.rsk_chain_id
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        
        self.account = None
        if private_key:
            pk = private_key[2:] if private_key.startswith('0x') else private_key
            self.account = Account.from_key(pk)
        
        self._comptroller = None
        self._krbtc = None
        self._kdoc = None
        self._krdoc = None
    
    @property
    def comptroller(self):
        if self._comptroller is None:
            address = TropykusAddresses.get_comptroller(self.chain_id)
            self._comptroller = self.w3.eth.contract(
                address=Web3.to_checksum_address(address),
                abi=COMPTROLLER_ABI
            )
        return self._comptroller
    
    @property
    def krbtc(self):
        if self._krbtc is None:
            address = TropykusAddresses.get_krbtc(self.chain_id)
            self._krbtc = self.w3.eth.contract(
                address=Web3.to_checksum_address(address),
                abi=CRBTC_ABI
            )
        return self._krbtc
    
    @property
    def kdoc(self):
        if self._kdoc is None:
            address = TropykusAddresses.get_kdoc(self.chain_id)
            self._kdoc = self.w3.eth.contract(
                address=Web3.to_checksum_address(address),
                abi=CERC20_ABI
            )
        return self._kdoc
    
    @property
    def krdoc(self):
        if self._krdoc is None:
            address = TropykusAddresses.get_krdoc(self.chain_id)
            self._krdoc = self.w3.eth.contract(
                address=Web3.to_checksum_address(address),
                abi=CERC20_ABI
            )
        return self._krdoc
    
    def set_wallet(self, private_key: str):
        """Configura la wallet para firmar transacciones."""
        pk = private_key[2:] if private_key.startswith('0x') else private_key
        self.account = Account.from_key(pk)
    
    def get_contract(self, market: str = "krbtc"):
        """Obtiene el contrato según el mercado."""
        return getattr(self, market)
    
    # ─── Información de Mercados ──────────────────────────────────────────
    
    def get_market_info(self, market: str = "krbtc") -> MarketInfo:
        """Obtiene información de un mercado."""
        contract = self.get_contract(market)
        decimals = 8 if market == "krbtc" else 18
        
        try:
            # Leer datos del contrato
            symbol = contract.functions.symbol().call()
            total_supply_raw = contract.functions.totalSupply().call()
            total_borrow_raw = contract.functions.totalBorrows().call()
            cash_raw = contract.functions.getCash().call()
            supply_rate_raw = contract.functions.supplyRatePerBlock().call()
            borrow_rate_raw = contract.functions.borrowRatePerBlock().call()
            
            # Calcular APY (RSK ≈ 1 bloque cada 15 segundos ≈ 2_100_000 bloques/año)
            blocks_per_year = 2_100_000
            supply_apy = (1 + supply_rate_raw / 1e18 * blocks_per_year) ** 1 - 1
            borrow_apy = (1 + borrow_rate_raw / 1e18 * blocks_per_year) ** 1 - 1
            
            # Exchange rate
            try:
                exchange_rate_raw = contract.functions.exchangeRateCurrent().call()
            except:
                exchange_rate_raw = contract.functions.exchangeRateCurrent().call()
            
            return MarketInfo(
                address=contract.address,
                name=symbol,
                symbol=symbol,
                total_supply=float(Web3.from_wei(total_supply_raw, 'ether')),
                total_borrow=float(Web3.from_wei(total_borrow_raw, 'ether')),
                supply_rate=supply_apy,
                borrow_rate=borrow_apy,
                exchange_rate=float(Web3.from_wei(exchange_rate_raw, 'ether')),
                cash=float(Web3.from_wei(cash_raw, 'ether')),
                decimals=decimals
            )
        except Exception as e:
            raise TropykusError(f"Error getting market info: {e}")
    
    def get_all_markets(self) -> List[MarketInfo]:
        """Obtiene información de todos los mercados."""
        markets = ["krbtc", "kdoc", "krdoc"]
        result = []
        for m in markets:
            try:
                result.append(self.get_market_info(m))
            except:
                pass
        return result
    
    # ─── Consulta de Balances ──────────────────────────────────────────────
    
    def get_supply_balance(self, address: str, market: str = "krbtc") -> float:
        """Obtiene el balance depositado de un usuario."""
        contract = self.get_contract(market)
        address = Web3.to_checksum_address(address)
        
        try:
            balance_raw = contract.functions.balanceOfUnderlying(address).call()
            return float(Web3.from_wei(balance_raw, 'ether'))
        except:
            return 0.0
    
    def get_borrow_balance(self, address: str, market: str = "krbtc") -> float:
        """Obtiene el balance prestado de un usuario."""
        contract = self.get_contract(market)
        address = Web3.to_checksum_address(address)
        
        try:
            # borrowBalanceCurrent requiere llamada de transacción
            # Usamos balanceOf como proxy
            balance_raw = contract.functions.balanceOf(address).call()
            return float(Web3.from_wei(balance_raw, 'ether'))
        except:
            return 0.0
    
    def get_account_snapshot(self, address: str, market: str = "krbtc") -> Dict[str, Any]:
        """Obtiene snapshot de la cuenta en un mercado."""
        contract = self.get_contract(market)
        address = Web3.to_checksum_address(address)
        
        try:
            error, ktoken_balance, borrow_balance, exchange_rate = contract.functions.getAccountSnapshot(address).call()
            return {
                "error_code": error,
                "ktoken_balance": float(Web3.from_wei(ktoken_balance, 'ether')),
                "borrow_balance": float(Web3.from_wei(borrow_balance, 'ether')),
                "exchange_rate": float(Web3.from_wei(exchange_rate, 'ether'))
            }
        except:
            return {"error_code": 1, "ktoken_balance": 0, "borrow_balance": 0, "exchange_rate": 0}
    
    def get_account_liquidity(self, address: str) -> Dict[str, float]:
        """Obtiene la liquidez de una cuenta."""
        address = Web3.to_checksum_address(address)
        
        try:
            err, liquidity, shortfall = self.comptroller.functions.getAccountLiquidity(address).call()
            return {
                "error": err,
                "liquidity": float(Web3.from_wei(liquidity, 'ether')),
                "shortfall": float(Web3.from_wei(shortfall, 'ether'))
            }
        except:
            return {"error": 1, "liquidity": 0, "shortfall": 0}
    
    # ─── Depósitos ─────────────────────────────────────────────────────────
    
    def deposit_rbtc(self, amount: float) -> DepositResult:
        """Deposita RBTC en el mercado kRBTC."""
        if not self.account:
            raise ValidationError("No wallet configured")
        
        # Verificar balance
        balance = self.w3.eth.get_balance(self.account.address)
        amount_wei = Web3.to_wei(amount, 'ether')
        
        if balance < amount_wei:
            raise InsufficientFundsError(
                f"Insufficient RBTC. Have: {Web3.from_wei(balance, 'ether')}, Need: {amount}"
            )
        
        # Construir transacción
        try:
            txn = self.krbtc.functions.mint().build_transaction({
                'from': self.account.address,
                'value': amount_wei,
                'gas': 500000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'chainId': self.chain_id
            })
            
            # Firmar y enviar
            signed = self.w3.eth.account.sign_transaction(txn, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            
            # Esperar confirmación
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            # Obtener exchange rate
            try:
                exchange_rate = float(Web3.from_wei(
                    self.krbtc.functions.exchangeRateCurrent().call(), 'ether'
                ))
            except:
                exchange_rate = 1.0
            
            return DepositResult(
                success=receipt['status'] == 1,
                tx_hash=tx_hash.hex(),
                ktoken_amount=amount,  # Simplificado
                underlying_amount=amount,
                exchange_rate=exchange_rate,
                gas_used=receipt['gasUsed']
            )
            
        except Exception as e:
            raise TransactionError(f"Deposit failed: {e}")
    
    def deposit_doc(self, amount: float) -> DepositResult:
        """Deposita DOC en el mercado kDOC."""
        if not self.account:
            raise ValidationError("No wallet configured")
        
        amount_wei = Web3.to_wei(amount, 'ether')
        
        try:
            txn = self.kdoc.functions.mint(amount_wei).build_transaction({
                'from': self.account.address,
                'gas': 300000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'chainId': self.chain_id
            })
            
            signed = self.w3.eth.account.sign_transaction(txn, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            try:
                exchange_rate = float(Web3.from_wei(
                    self.kdoc.functions.exchangeRateCurrent().call(), 'ether'
                ))
            except:
                exchange_rate = 1.0
            
            return DepositResult(
                success=receipt['status'] == 1,
                tx_hash=tx_hash.hex(),
                ktoken_amount=amount,
                underlying_amount=amount,
                exchange_rate=exchange_rate,
                gas_used=receipt['gasUsed']
            )
            
        except Exception as e:
            raise TransactionError(f"DOC deposit failed: {e}")
    
    # ─── Retiros ───────────────────────────────────────────────────────────
    
    def withdraw_rbtc(self, amount: float) -> WithdrawResult:
        """Retira RBTC del mercado kRBTC."""
        if not self.account:
            raise ValidationError("No wallet configured")
        
        amount_wei = Web3.to_wei(amount, 'ether')
        
        try:
            txn = self.krbtc.functions.redeemUnderlying(amount_wei).build_transaction({
                'from': self.account.address,
                'gas': 300000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'chainId': self.chain_id
            })
            
            signed = self.w3.eth.account.sign_transaction(txn, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            return WithdrawResult(
                success=receipt['status'] == 1,
                tx_hash=tx_hash.hex(),
                underlying_amount=amount,
                gas_used=receipt['gasUsed']
            )
            
        except Exception as e:
            raise TransactionError(f"Withdrawal failed: {e}")
    
    def withdraw_doc(self, amount: float) -> WithdrawResult:
        """Retira DOC del mercado kDOC."""
        if not self.account:
            raise ValidationError("No wallet configured")
        
        amount_wei = Web3.to_wei(amount, 'ether')
        
        try:
            txn = self.kdoc.functions.redeemUnderlying(amount_wei).build_transaction({
                'from': self.account.address,
                'gas': 300000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'chainId': self.chain_id
            })
            
            signed = self.w3.eth.account.sign_transaction(txn, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            return WithdrawResult(
                success=receipt['status'] == 1,
                tx_hash=tx_hash.hex(),
                underlying_amount=amount,
                gas_used=receipt['gasUsed']
            )
            
        except Exception as e:
            raise TransactionError(f"DOC withdrawal failed: {e}")
    
    # ─── Gestión de Colateral ─────────────────────────────────────────────
    
    def enter_market(self, market: str = "krbtc") -> str:
        """Entra en un mercado para usarlo como colateral."""
        if not self.account:
            raise ValidationError("No wallet configured")
        
        contract = self.get_contract(market)
        
        try:
            txn = self.comptroller.functions.enterMarkets([contract.address]).build_transaction({
                'from': self.account.address,
                'gas': 300000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'chainId': self.chain_id
            })
            
            signed = self.w3.eth.account.sign_transaction(txn, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            return tx_hash.hex()
            
        except Exception as e:
            raise TransactionError(f"Failed to enter market: {e}")
    
    def exit_market(self, market: str = "krbtc") -> str:
        """Sale de un mercado."""
        if not self.account:
            raise ValidationError("No wallet configured")
        
        contract = self.get_contract(market)
        
        try:
            txn = self.comptroller.functions.exitMarket(contract.address).build_transaction({
                'from': self.account.address,
                'gas': 300000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'chainId': self.chain_id
            })
            
            signed = self.w3.eth.account.sign_transaction(txn, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            return tx_hash.hex()
            
        except Exception as e:
            raise TransactionError(f"Failed to exit market: {e}")


# ============================================================================
# INSTANCIA GLOBAL
# ============================================================================

tropykus_service = TropykusService()


# ============================================================================
# FUNCIONES DE CONVENIENCIA (ASYNC WRAPPERS)
# ============================================================================

async def get_supply_balance(address: str, market: str = "krbtc") -> float:
    """Async wrapper para get_supply_balance."""
    return tropykus_service.get_supply_balance(address, market)


async def get_all_markets() -> List[MarketInfo]:
    """Async wrapper para get_all_markets."""
    return tropykus_service.get_all_markets()


async def get_market_info(market: str = "krbtc") -> MarketInfo:
    """Async wrapper para get_market_info."""
    return tropykus_service.get_market_info(market)


async def get_yield_info(market: str = "krbtc") -> Dict[str, Any]:
    """Obtiene información de yield de un mercado."""
    info = tropykus_service.get_market_info(market)
    return {
        "market": market,
        "supply_apy": f"{info.supply_rate * 100:.2f}%",
        "borrow_apy": f"{info.borrow_rate * 100:.2f}%",
        "total_supply": info.total_supply,
        "total_borrow": info.total_borrow
    }


async def get_all_yield_info() -> Dict[str, Any]:
    """Obtiene información de yield de todos los mercados."""
    markets = tropykus_service.get_all_markets()
    return {
        market.symbol: {
            "supply_apy": f"{market.supply_rate * 100:.2f}%",
            "total_supply": market.total_supply
        }
        for market in markets
    }