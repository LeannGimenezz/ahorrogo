# Blockchain Endpoints — Rutas de prueba e integración
# ==================================================

"""
Endpoints REST para probar la integración con RSK, Tropykus y Vault Contract.

Útiles para:
- Verificar conexión con la red RSK
- Probar depósitos en Tropykus
- Interactuar con el contrato Vault
- Consultar balances y yields
- Debug de transacciones
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Header, Path
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from supabase import AsyncClient

from app.api.deps import get_db, get_current_user
from app.services.blockchain_service import (
    blockchain_service,
    UnitConverter,
    NetworkConfig
)
from app.services.tropykus_service import (
    tropykus_service,
    TropykusAddresses,
    MarketInfo
)
from app.services.vault_service import vault_service
from app.services.vault_contract_service import (
    VaultContractService,
    VaultType,
    get_vault_contract
)
from app.api.deps import get_db
from app.config import get_settings

settings = get_settings()

router = APIRouter(prefix="/blockchain", tags=["blockchain"])


# ============================================================================
# SCHEMAS
# ============================================================================

class NetworkInfoResponse(BaseModel):
    chain_id: int
    block_number: int
    gas_price_wei: int
    gas_price_gwei: float
    rpc_url: str
    symbol: str
    is_testnet: bool


class BalanceResponse(BaseModel):
    address: str
    balance_rbtc: float
    balance_wei: int
    formatted: str


class TransactionReceiptResponse(BaseModel):
    hash: str
    block_number: Optional[int]
    status: Optional[int]
    confirmations: Optional[int]
    gas_used: Optional[int]
    from_address: Optional[str]
    to_address: Optional[str]
    explorer_url: str


class MarketInfoResponse(BaseModel):
    address: str
    name: str
    symbol: str
    total_supply: float
    total_borrow: float
    supply_apy: float
    borrow_apy: float
    exchange_rate: float
    cash: float
    decimals: int


class DepositToTropykusRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Cantidad a depositar en RBTC")
    market: str = Field(default="krbtc", description="Mercado: krbtc, kdoc, krdoc")


class DepositToTropykusResponse(BaseModel):
    success: bool
    tx_hash: str
    amount: float
    ktoken_amount: float
    market: str
    gas_used: int
    explorer_url: str


class SupplyBalanceResponse(BaseModel):
    address: str
    market: str
    balance: float
    formatted: str


# ============================================================================
# SCHEMAS - VAULT CONTRACT
# ============================================================================

class CreateVaultRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Nombre del vault")
    icon: str = Field(default="🏠", description="Emoji para el vault")
    target: float = Field(..., gt=0, description="Meta en RBTC")
    vault_type: int = Field(default=0, ge=0, le=2, description="0=Savings, 1=Rental, 2=P2P")
    beneficiary: Optional[str] = Field(None, description="Dirección del beneficiario (para rental)")
    locked: bool = Field(default=False, description="Si el vault tiene time-lock")
    unlock_date: Optional[int] = Field(None, description="Timestamp de desbloqueo (si locked)")


class VaultInfoResponse(BaseModel):
    vault_id: int
    owner: str
    name: str
    icon: str
    target_rbtc: float
    current_rbtc: float
    vault_type: str
    beneficiary: str
    locked: bool
    unlock_date: int
    status: str
    progress_percent: float
    is_unlocked: bool
    time_remaining_seconds: int
    created_at: int
    updated_at: int


class VaultDepositRequest(BaseModel):
    vault_id: int = Field(..., ge=0, description="ID del vault")
    amount: float = Field(..., gt=0, description="Cantidad a depositar en RBTC")


class VaultWithdrawRequest(BaseModel):
    vault_id: int = Field(..., ge=0, description="ID del vault")
    amount: float = Field(..., gt=0, description="Cantidad a retirar en RBTC")


class VaultTxResponse(BaseModel):
    success: bool
    vault_id: int
    tx_hash: str
    gas_used: int
    explorer_url: str
    details: Optional[Dict[str, Any]] = None


class SetBeneficiaryRequest(BaseModel):
    """Request schema for setting beneficiary on a rental vault."""
    beneficiary: str = Field(..., description="Beneficiary address (wallet address)")


class SetBeneficiaryResponse(BaseModel):
    """Response schema for set_beneficiary endpoint."""
    success: bool
    tx_hash: Optional[str] = None
    vault_id: str
    beneficiary: str


# ============================================================================
# HELPERS
# ============================================================================

def get_contract_with_key(private_key: str) -> VaultContractService:
    """Obtiene servicio de vault contract configurado."""
    return get_vault_contract(private_key=private_key)


# ============================================================================
# ENDPOINTS PÚBLICOS (lectura)
# ============================================================================

@router.get("/network", response_model=NetworkInfoResponse)
async def get_network_info():
    """
    Obtiene información de la red RSK conectada.
    
    Útil para verificar que el nodo RPC está funcionando.
    """
    info = await blockchain_service.get_network_info()
    return NetworkInfoResponse(
        chain_id=info["chain_id"],
        block_number=info["block_number"],
        gas_price_wei=info["gas_price"],
        gas_price_gwei=float(UnitConverter.wei_to_rbtc(info["gas_price"]) * 1e9),
        rpc_url=info["rpc_url"],
        symbol=info["symbol"],
        is_testnet=settings.is_testnet
    )


@router.get("/balance/{address}", response_model=BalanceResponse)
async def get_address_balance(address: str):
    """
    Obtiene el balance de RBTC de una dirección.
    
    No requiere autenticación (solo lectura de blockchain).
    """
    if not blockchain_service.is_valid_address(address):
        raise HTTPException(400, "Dirección inválida")
    
    try:
        balance_rbtc = await blockchain_service.get_rbtc_balance(address)
        return BalanceResponse(
            address=address,
            balance_rbtc=balance_rbtc,
            balance_wei=int(balance_rbtc * 1e18),
            formatted=f"{balance_rbtc:.8f} RBTC"
        )
    except Exception as e:
        raise HTTPException(500, f"Error consultando balance: {str(e)}")


@router.get("/tx/{tx_hash}", response_model=TransactionReceiptResponse)
async def get_transaction_status(tx_hash: str):
    """
    Obtiene el estado de una transacción.
    
    Útil para verificar confirmaciones.
    """
    receipt = await blockchain_service.get_transaction_receipt(tx_hash)
    
    if not receipt:
        raise HTTPException(404, "Transacción no encontrada")
    
    return TransactionReceiptResponse(
        hash=receipt["hash"],
        block_number=receipt.get("block_number"),
        status=receipt.get("status"),
        confirmations=receipt.get("confirmations"),
        gas_used=receipt.get("gas_used"),
        from_address=receipt.get("from"),
        to_address=receipt.get("to"),
        explorer_url=blockchain_service.get_explorer_tx_url(tx_hash)
    )


@router.get("/markets", response_model=List[MarketInfoResponse])
async def get_all_markets():
    """
    Obtiene información de todos los mercados de Tropykus.
    
    Muestra APY, total supplied, etc.
    """
    try:
        markets = await tropykus_service.get_all_markets()
        return [
            MarketInfoResponse(
                address=m.address,
                name=m.name,
                symbol=m.symbol,
                total_supply=m.total_supply,
                total_borrow=m.total_borrow,
                supply_apy=round(m.supply_rate * 100, 2),
                borrow_apy=round(m.borrow_rate * 100, 2),
                exchange_rate=m.exchange_rate,
                cash=m.cash,
                decimals=m.decimals
            )
            for m in markets
        ]
    except Exception as e:
        raise HTTPException(500, f"Error consultando mercados: {str(e)}")


@router.get("/markets/{market}", response_model=MarketInfoResponse)
async def get_market_info(market: str = Path(..., description="krbtc, kdoc, o krdoc")):
    """
    Obtiene información de un mercado específico.
    """
    valid_markets = ["krbtc", "kdoc", "krdoc"]
    if market not in valid_markets:
        raise HTTPException(400, f"Market inválido. Opciones: {valid_markets}")
    
    try:
        info = await tropykus_service.get_market_info(market)
        return MarketInfoResponse(
            address=info.address,
            name=info.name,
            symbol=info.symbol,
            total_supply=info.total_supply,
            total_borrow=info.total_borrow,
            supply_apy=round(info.supply_rate * 100, 2),
            borrow_apy=round(info.borrow_rate * 100, 2),
            exchange_rate=info.exchange_rate,
            cash=info.cash,
            decimals=info.decimals
        )
    except Exception as e:
        raise HTTPException(500, f"Error consultando mercado: {str(e)}")


@router.get("/supply-balance/{address}", response_model=SupplyBalanceResponse)
async def get_supply_balance(
    address: str,
    market: str = Query(default="krbtc", description="krbtc, kdoc, o krdoc")
):
    """
    Obtiene el balance depositado en Tropykus para un address.
    
    No requiere autenticación (solo lectura).
    """
    if not blockchain_service.is_valid_address(address):
        raise HTTPException(400, "Dirección inválida")
    
    try:
        balance = await tropykus_service.get_supply_balance(address, market)
        return SupplyBalanceResponse(
            address=address,
            market=market,
            balance=balance,
            formatted=f"{balance:.8f} RBTC"
        )
    except Exception as e:
        raise HTTPException(500, f"Error consultando balance: {str(e)}")


# ============================================================================
# ENDPOINTS DE VAULT CONTRACT
# ============================================================================

@router.get("/vault/counter")
async def get_vault_counter():
    """
    Obtiene el número total de vaults creados.
    
    Útil para saber cuántos vaults existen en el contrato.
    """
    if not settings.vault_contract_address:
        raise HTTPException(503, "Vault contract no configurado")
    
    try:
        contract = get_vault_contract()
        counter = contract.get_vault_counter()
        return {"total_vaults": counter}
    except Exception as e:
        raise HTTPException(500, f"Error: {str(e)}")


@router.get("/vault/{vault_id}", response_model=VaultInfoResponse)
async def get_vault_info(vault_id: int):
    """
    Obtiene información de un vault específico.
    
    No requiere autenticación (solo lectura).
    """
    if not settings.vault_contract_address:
        raise HTTPException(503, "Vault contract no configurado")
    
    try:
        contract = get_vault_contract()
        vault = contract.get_vault(vault_id)
        
        if not vault:
            raise HTTPException(404, "Vault no encontrado")
        
        return VaultInfoResponse(**vault.to_dict())
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error: {str(e)}")


@router.get("/vaults/user/{address}")
async def get_user_vaults(address: str):
    """
    Obtiene todos los vault IDs de un usuario.
    
    Útil para luego consultar cada vault individualmente.
    """
    if not settings.vault_contract_address:
        raise HTTPException(503, "Vault contract no configurado")
    
    if not blockchain_service.is_valid_address(address):
        raise HTTPException(400, "Dirección inválida")
    
    try:
        contract = get_vault_contract()
        vault_ids = contract.get_user_vaults(address)
        return {"address": address, "vault_ids": vault_ids}
    except Exception as e:
        raise HTTPException(500, f"Error: {str(e)}")


# ============================================================================
# ENDPOINTS PRIVADOS (requieren auth y private key)
# ============================================================================

class PrivateKeyHeader(BaseModel):
    """Schema para extraer private key del header."""
    private_key: str = Field(..., description="Clave privada para firmar transacciones")


@router.post("/vault/create", response_model=VaultTxResponse)
async def create_vault_onchain(
    request: CreateVaultRequest,
    current_user: Dict = Depends(get_current_user),
    x_private_key: str = Header(..., alias="x-private-key", description="Private key para firmar")
):
    """
    Crea un nuevo vault en el contrato on-chain.
    
    ⚠️  IMPORTANTE: La private key se usa solo para firmar la transacción.
    En producción, esto debería hacerse desde el frontend con la wallet del usuario.
    """
    if not settings.vault_contract_address:
        raise HTTPException(503, "Vault contract no configurado")
    
    try:
        contract = get_contract_with_key(x_private_key)
        
        result = contract.create_vault(
            name=request.name,
            icon=request.icon,
            target=request.target,
            vault_type=VaultType(request.vault_type),
            beneficiary=request.beneficiary,
            locked=request.locked,
            unlock_date=request.unlock_date or 0
        )
        
        return VaultTxResponse(
            success=True,
            vault_id=result.vault_id,
            tx_hash=result.tx_hash,
            gas_used=result.gas_used,
            explorer_url=blockchain_service.get_explorer_tx_url(result.tx_hash),
            details={
                "name": request.name,
                "target": request.target,
                "vault_type": request.vault_type,
                "locked": request.locked
            }
        )
        
    except Exception as e:
        raise HTTPException(400, f"Error creando vault: {str(e)}")


@router.post("/vault/deposit", response_model=VaultTxResponse)
async def deposit_to_vault(
    request: VaultDepositRequest,
    current_user: Dict = Depends(get_current_user),
    x_private_key: str = Header(..., alias="x-private-key")
):
    """
    Deposita fondos directamente en un vault del contrato.
    
    ⚠️  IMPORTANTE: Requiere la private key para firmar.
    """
    if not settings.vault_contract_address:
        raise HTTPException(503, "Vault contract no configurado")
    
    try:
        contract = get_contract_with_key(x_private_key)
        
        result = contract.deposit(
            vault_id=request.vault_id,
            amount=request.amount
        )
        
        return VaultTxResponse(
            success=True,
            vault_id=result.vault_id,
            tx_hash=result.tx_hash,
            gas_used=result.gas_used,
            explorer_url=blockchain_service.get_explorer_tx_url(result.tx_hash),
            details={
                "amount": result.amount,
                "new_balance": result.new_balance
            }
        )
        
    except Exception as e:
        raise HTTPException(400, f"Error depositando: {str(e)}")


@router.post("/vault/withdraw", response_model=VaultTxResponse)
async def withdraw_from_vault(
    request: VaultWithdrawRequest,
    current_user: Dict = Depends(get_current_user),
    x_private_key: str = Header(..., alias="x-private-key")
):
    """
    Retira fondos de un vault.
    
    ⚠️  IMPORTANTE: No funciona si el vault está bloqueado (time-lock activo).
    """
    if not settings.vault_contract_address:
        raise HTTPException(503, "Vault contract no configurado")
    
    try:
        contract = get_contract_with_key(x_private_key)
        
        result = contract.withdraw(
            vault_id=request.vault_id,
            amount=request.amount
        )
        
        return VaultTxResponse(
            success=True,
            vault_id=result.vault_id,
            tx_hash=result.tx_hash,
            gas_used=result.gas_used,
            explorer_url=blockchain_service.get_explorer_tx_url(result.tx_hash),
            details={
                "amount": result.amount
            }
        )
        
    except Exception as e:
        raise HTTPException(400, f"Error retirando: {str(e)}")


@router.post("/vault/{vault_id}/set-beneficiary", response_model=SetBeneficiaryResponse)
async def set_beneficiary(
    vault_id: int,
    request: SetBeneficiaryRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    x_private_key: str = Header(..., alias="x-private-key"),
    db: AsyncClient = Depends(get_db)
):
    """
    Establece el beneficiario de un vault de tipo rental.
    
    Este endpoint:
    1. Verifica que el vault existe y pertenece al usuario
    2. Verifica que el vault es de tipo "rental"
    3. Actualiza el beneficiario en el contrato on-chain
    4. Actualiza el beneficiario en la base de datos
    
    ⚠️  IMPORTANTE: Requiere la private key para firmar la transacción.
    """
    if not settings.vault_contract_address:
        raise HTTPException(503, "Vault contract no configurado")
    
    # Validar dirección del beneficiario
    if not blockchain_service.is_valid_address(request.beneficiary):
        raise HTTPException(400, "Dirección de beneficiario inválida")
    
    try:
        # 1. Obtener vault de la base de datos
        vault = await vault_service.get_by_id(db, str(vault_id))
        
        if not vault:
            raise HTTPException(404, "Vault no encontrado")
        
        # Verificar que pertenece al usuario
        if vault.get("user_id") != current_user.get("id"):
            raise HTTPException(403, "No tienes permisos sobre este vault")
        
        # 2. Verificar que es un vault de tipo rental
        vault_type = vault.get("vault_type", "").lower()
        if vault_type != "rental":
            raise HTTPException(400, "Solo los vaults de tipo 'rental' pueden tener beneficiario")
        
        # 3. Verificar que el vault está desplegado on-chain
        on_chain_id = vault.get("on_chain_id")
        if on_chain_id is None:
            raise HTTPException(400, "El vault no está desplegado en blockchain")
        
        # 4. Llamar al contrato
        contract = get_contract_with_key(x_private_key)
        
        result = contract.set_beneficiary(
            vault_id=on_chain_id,
            beneficiary=request.beneficiary
        )
        
        # 5. Actualizar la base de datos
        await vault_service.update(
            db,
            str(vault_id),
            {"beneficiary": request.beneficiary},
            current_user["address"]
        )
        
        return SetBeneficiaryResponse(
            success=True,
            tx_hash=result["tx_hash"],
            vault_id=str(vault_id),
            beneficiary=request.beneficiary
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(500, f"Error estableciendo beneficiario: {str(e)}")


@router.post("/deposit", response_model=DepositToTropykusResponse)
async def deposit_to_tropykus(
    request: DepositToTropykusRequest,
    current_user: Dict = Depends(get_current_user),
    x_private_key: str = Header(..., alias="x-private-key")
):
    """
    Deposita fondos directamente en Tropykus Protocol.
    
    ⚠️  ADVERTENCIA: Este endpoint requiere la clave privada del usuario.
    
    En producción, esto debería hacerse desde el frontend con xo-connect
    para que el usuario firme la transacción con su wallet.
    """
    try:
        # Configurar wallet
        tropykus_service.set_wallet(x_private_key)
        
        # Ejecutar depósito según el mercado
        if request.market == "krbtc":
            result = await tropykus_service.deposit_rbtc(request.amount, current_user["address"])
        elif request.market in ["kdoc", "krdoc"]:
            result = await tropykus_service.deposit_doc(request.amount, current_user["address"])
        else:
            raise HTTPException(400, f"Market desconocido: {request.market}")
        
        return DepositToTropykusResponse(
            success=result.success,
            tx_hash=result.tx_hash,
            amount=result.underlying_amount,
            ktoken_amount=result.ktoken_amount,
            market=request.market,
            gas_used=result.gas_used,
            explorer_url=blockchain_service.get_explorer_tx_url(result.tx_hash)
        )
        
    except Exception as e:
        raise HTTPException(400, str(e))


@router.get("/estimate-gas")
async def estimate_gas_cost(
    from_address: str,
    to_address: str,
    value: float = Query(default=0, ge=0)
):
    """
    Estima el costo de gas para una transacción.
    
    Útil para mostrar al usuario el costo antes de confirmar.
    """
    if not blockchain_service.is_valid_address(from_address):
        raise HTTPException(400, "Dirección from inválida")
    if not blockchain_service.is_valid_address(to_address):
        raise HTTPException(400, "Dirección to inválida")
    
    value_wei = int(value * 1e18) if value > 0 else 0
    
    try:
        estimate = await blockchain_service.estimate_tx_cost(
            from_address=from_address,
            to_address=to_address,
            value=value_wei
        )
        
        return {
            "from": from_address,
            "to": to_address,
            "value": value,
            "gas_estimate": estimate["gas_estimate"],
            "gas_price_gwei": estimate["gas_price_gwei"],
            "total_cost_rbtc": estimate["total_cost_rbtc"],
            "total_cost_usd_estimate": estimate["total_cost_usd_estimate"],
            "is_testnet": settings.is_testnet
        }
        
    except Exception as e:
        raise HTTPException(500, f"Error estimando gas: {str(e)}")


# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get("/health")
async def blockchain_health():
    """
    Verifica salud de las conexiones blockchain.
    """
    results = {
        "rsk_node": False,
        "tropykus": False,
        "vault_contract": False,
        "chain_id": settings.rsk_chain_id,
        "is_testnet": settings.is_testnet,
        "contract_address": settings.vault_contract_address or "not configured",
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Verificar nodo RSK
    try:
        block = await blockchain_service.get_block_number()
        results["rsk_node"] = True
        results["latest_block"] = block
    except Exception as e:
        results["rsk_node_error"] = str(e)
    
    # Verificar Tropykus
    try:
        markets = await tropykus_service.get_all_markets()
        results["tropykus"] = True
        results["markets_count"] = len(markets)
    except Exception as e:
        results["tropykus_error"] = str(e)
    
    # Verificar Vault Contract
    if settings.vault_contract_address:
        try:
            contract = get_vault_contract()
            counter = contract.get_vault_counter()
            results["vault_contract"] = True
            results["vault_counter"] = counter
        except Exception as e:
            results["vault_contract_error"] = str(e)
    
    return results
