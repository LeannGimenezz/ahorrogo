# Vault Service con Integración Tropykus — AhorroGO Backend
# ==========================================================

"""
Servicio de bóvedas de ahorro con integración blockchain real.

Permite:
- Crear vaults de ahorro
- Depositar fondos (integra con Tropykus para yield)
- Retirar fondos
- Consultar balances y yield generado
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from decimal import Decimal

from supabase import AsyncClient

from app.services.blockchain_service import blockchain_service, UnitConverter
from app.services.tropykus_service import (
    tropykus_service,
    TropykusAddresses,
    DepositResult,
    WithdrawResult,
    TransactionError,
    InsufficientFundsError
)
from app.config import get_settings

settings = get_settings()


# ============================================================================
# CONSTANTES
# ============================================================================

# Estado de vaults
VAULT_STATUS_ACTIVE = "active"
VAULT_STATUS_COMPLETED = "completed"
VAULT_STATUS_CANCELLED = "cancelled"

# Tipos de vault
VAULT_TYPE_SAVINGS = "savings"
VAULT_TYPE_RENTAL = "rental"
VAULT_TYPE_P2P = "p2p"

# Mercado default para depósitos (RBTC para mayor compatibilidad)
DEFAULT_TROPYKUS_MARKET = "krbtc"

# APY estimado de Tropykus (para cálculos de yield)
# Este valor se actualiza dinámicamente desde el protocolo
ESTIMATED_APY = 0.05  # 5% APY default


# ============================================================================
# EXCEPCIONES
# ============================================================================

class VaultError(Exception):
    """Error base del servicio de vault."""
    pass


class VaultNotFoundError(VaultError):
    """Vault no encontrado."""
    pass


class InsufficientFundsVaultError(VaultError):
    """Fondos insuficientes para la operación."""
    pass


class VaultLockedError(VaultError):
    """Vault bloqueado, no se puede retirar."""
    pass


class BlockchainTransactionError(VaultError):
    """Error en transacción blockchain."""
    def __init__(self, message: str, tx_hash: str = None, block_error: str = None):
        super().__init__(message)
        self.tx_hash = tx_hash
        self.block_error = block_error


# ============================================================================
# FUNCIONES DE UTILIDAD
# ============================================================================

def calculate_progress(current: float, target: float) -> float:
    """Calcula el progreso del vault (0.0 a 1.0)."""
    if target <= 0:
        return 0.0
    return min(current / target, 1.0)


def calculate_yield_estimate(
    principal: float,
    days_elapsed: int,
    apy: float = ESTIMATED_APY
) -> float:
    """
    Estima el yield generado por un vault.
    
    Args:
        principal: Monto principal depositado
        days_elapsed: Días transcurridos
        apy: APY como decimal (default 5%)
    
    Returns:
        Yield estimado generado
    """
    if principal <= 0 or days_elapsed <= 0:
        return 0.0
    
    # Cálculo de interés simple: P * r * t
    # donde r = APY / 365 (por día)
    daily_rate = apy / 365
    yield_amount = principal * daily_rate * days_elapsed
    return round(yield_amount, 2)


def check_vault_completion(current: float, target: float) -> bool:
    """Verifica si el vault alcanzó su meta."""
    return current >= target


def validate_withdrawal(
    vault: Dict[str, Any],
    amount: float
) -> None:
    """
    Valida que un retiro sea válido.
    
    Raises:
        VaultLockedError: Si el vault tiene lock activo
        VaultNotFoundError: Si el vault está cancelado
    """
    if vault["status"] == VAULT_STATUS_CANCELLED:
        raise VaultNotFoundError("Vault cancelado")
    
    if vault["locked"]:
        unlock_date = vault.get("unlock_date")
        if unlock_date:
            if isinstance(unlock_date, str):
                unlock_date = datetime.fromisoformat(unlock_date.replace("Z", "+00:00"))
            if datetime.utcnow() < unlock_date:
                raise VaultLockedError(
                    f"Vault bloqueado hasta {unlock_date.strftime('%Y-%m-%d')}"
                )
    
    if vault["status"] == VAULT_STATUS_COMPLETED:
        raise VaultNotFoundError("Vault ya completado")


# ============================================================================
# SERVICIO DE VAULT CON BLOCKCHAIN
# ============================================================================

class VaultService:
    """
    Servicio completo de vaults con integración blockchain.
    
    Gestiona:
    - CRUD de vaults
    - Depósitos (con integración Tropykus)
    - Retiros
    - Consulta de yield
    - Sincronización on-chain
    """
    
    def __init__(self, tropykus_svc=None):
        """
        Inicializa el servicio.
        
        Args:
            tropykus_svc: Instancia de TropykusService (opcional, usa default)
        """
        self.tropykus = tropykus_svc or tropykus_service
    
    # ─── CRUD Básico ─────────────────────────────────────────────────────
    
    async def get_by_id(
        self,
        db: AsyncClient,
        vault_id: str
    ) -> Optional[Dict[str, Any]]:
        """Obtiene un vault por ID."""
        result = await db.table("vaults").select("*").eq("id", vault_id).execute()
        if result.data:
            vault = result.data[0]
            vault["progress"] = calculate_progress(vault["current"], vault["target"])
            return vault
        return None
    
    async def get_by_user(
        self,
        db: AsyncClient,
        user_id: str
    ) -> List[Dict[str, Any]]:
        """Obtiene todos los vaults de un usuario."""
        result = await db.table("vaults").select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .execute()
        
        vaults = []
        for vault in result.data:
            vault["progress"] = calculate_progress(vault["current"], vault["target"])
            vaults.append(vault)
        
        return vaults

    async def get_by_name(
        self,
        db: AsyncClient,
        user_id: str,
        name: str
    ) -> Optional[Dict[str, Any]]:
        """Obtiene un vault por nombre dentro de un usuario."""
        result = await db.table("vaults").select("*").eq("user_id", user_id).eq("name", name).limit(1).execute()
        if result.data:
            vault = result.data[0]
            vault["progress"] = calculate_progress(vault["current"], vault["target"])
            return vault
        return None
    
    async def get_by_address(
        self,
        db: AsyncClient,
        address: str
    ) -> List[Dict[str, Any]]:
        """Obtiene vaults por dirección de wallet (no por user_id interno)."""
        # Primero obtener el usuario por address
        user_result = await db.table("users").select("id").eq("address", address).execute()
        if not user_result.data:
            return []
        
        user_id = user_result.data[0]["id"]
        return await self.get_by_user(db, user_id)
    
    async def create(
        self,
        db: AsyncClient,
        vault_data: Dict[str, Any],
        user_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Crea un nuevo vault.
        
        Args:
            db: Cliente de Supabase
            vault_data: Datos del vault (name, icon, target, vault_type, etc.)
            user_address: Dirección del wallet del usuario
        
        Returns:
            Vault creado con ID
        """
        # Resolver user_id (prioriza user_address, fallback a user_id en payload)
        if user_address:
            user_result = await db.table("users").select("id").eq("address", user_address).execute()
            if not user_result.data:
                raise VaultError("Usuario no encontrado")
            user_id = user_result.data[0]["id"]
        else:
            user_id = vault_data.get("user_id")
            if not user_id:
                raise VaultError("user_id requerido cuando no se provee user_address")
        
        # Verificar que no exista un vault con el mismo nombre
        existing = await db.table("vaults").select("id")\
            .eq("user_id", user_id)\
            .eq("name", vault_data["name"])\
            .execute()
        
        if existing.data:
            raise VaultError(f"Ya existe un vault con el nombre '{vault_data['name']}'")
        
        # Preparar datos del vault
        vault_record = {
            "user_id": user_id,
            "name": vault_data["name"],
            "icon": vault_data.get("icon", "🏠"),
            "target": vault_data["target"],
            "current": 0,
            "vault_type": vault_data.get("vault_type", VAULT_TYPE_SAVINGS),
            "beneficiary": vault_data.get("beneficiary"),
            "locked": vault_data.get("locked", False),
            "unlock_date": vault_data.get("unlock_date"),
            "status": VAULT_STATUS_ACTIVE,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = await db.table("vaults").insert(vault_record).execute()
        
        vault = result.data[0]
        vault["progress"] = 0.0
        
        return vault
    
    async def update(
        self,
        db: AsyncClient,
        vault_id: str,
        data: Dict[str, Any],
        user_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """Actualiza un vault (solo nombre e icono)."""
        # Verificar propiedad
        vault = await self.get_by_id(db, vault_id)
        if not vault:
            raise VaultNotFoundError("Vault no encontrado")
        
        if user_address and not await self._verify_ownership(db, vault, user_address):
            raise VaultError("No tienes permisos sobre este vault")
        
        allowed_fields = ["name", "icon"]
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        if not update_data:
            return vault
        
        result = await db.table("vaults").update(update_data).eq("id", vault_id).execute()
        
        updated = result.data[0]
        updated["progress"] = calculate_progress(updated["current"], updated["target"])
        
        return updated
    
    async def delete(
        self,
        db: AsyncClient,
        vault_id: str,
        user_address: Optional[str] = None
    ) -> bool:
        """Elimina un vault (solo si está cancelado o no tiene lock)."""
        vault = await self.get_by_id(db, vault_id)
        if not vault:
            raise VaultNotFoundError("Vault no encontrado")
        
        if user_address and not await self._verify_ownership(db, vault, user_address):
            raise VaultError("No tienes permisos sobre este vault")
        
        if vault["locked"] and vault["status"] == VAULT_STATUS_ACTIVE:
            raise VaultLockedError("No se puede eliminar un vault con lock activo")
        
        await db.table("vaults").delete().eq("id", vault_id).execute()
        return True

    async def update_current(
        self,
        db: AsyncClient,
        vault_id: str,
        current: float,
        status: str
    ) -> Dict[str, Any]:
        """Actualiza balance actual y estado del vault."""
        payload = {
            "current": current,
            "status": status,
            "updated_at": datetime.utcnow().isoformat(),
        }
        result = await db.table("vaults").update(payload).eq("id", vault_id).execute()
        if not result.data:
            raise VaultNotFoundError("Vault no encontrado")
        updated = result.data[0]
        updated["progress"] = calculate_progress(updated["current"], updated["target"])
        return updated
    
    # ─── Depósitos con Blockchain ───────────────────────────────────────
    
    async def deposit(
        self,
        db: AsyncClient,
        vault_id: str,
        amount: float,
        tx_hash: str,
        user_address: str,
        wallet_private_key: str = None
    ) -> Dict[str, Any]:
        """
        Registra un depósito en un vault.
        
        Este método:
        1. Verifica la transacción en blockchain
        2. Registra el depósito en la base de datos
        3. Calcula XP y streak
        4. Verifica si se completó la meta
        
        Args:
            db: Cliente de Supabase
            vault_id: ID del vault
            amount: Monto del depósito
            tx_hash: Hash de la transacción en blockchain
            user_address: Dirección del wallet
            wallet_private_key: Clave privada para interactuar con blockchain (opcional)
        
        Returns:
            Dict con success, xp_earned, new_xp, new_level, vault_progress, mood
        """
        if amount <= 0:
            raise VaultError("El monto debe ser mayor a 0")
        
        # Verificar vault
        vault = await self.get_by_id(db, vault_id)
        if not vault:
            raise VaultNotFoundError("Vault no encontrado")
        
        if not await self._verify_ownership(db, vault, user_address):
            raise VaultError("No tienes permisos sobre este vault")
        
        if vault["status"] != VAULT_STATUS_ACTIVE:
            raise VaultError(f"No se puede depositar en un vault {vault['status']}")
        
        # Verificar si el tx_hash ya fue procesado (idempotencia)
        existing_tx = await db.table("activities").select("id")\
            .eq("tx_hash", tx_hash)\
            .eq("activity_type", "deposit")\
            .execute()
        
        if existing_tx.data:
            raise VaultError("Esta transacción ya fue procesada")
        
        # Verificar transacción en blockchain (si tenemos el servicio)
        if wallet_private_key:
            try:
                # Configurar wallet para verificación
                self.tropykus.set_wallet(wallet_private_key)
                
                # Verificar que la transacción fue exitosa
                receipt = await blockchain_service.get_transaction_receipt(tx_hash)
                if not receipt:
                    raise BlockchainTransactionError(
                        "Transacción no encontrada en blockchain",
                        tx_hash=tx_hash
                    )
                
                if receipt["status"] != 1:
                    raise BlockchainTransactionError(
                        "Transacción falló en blockchain",
                        tx_hash=tx_hash
                    )
                
            except TransactionError as e:
                raise BlockchainTransactionError(
                    f"Error en transacción blockchain: {str(e)}",
                    tx_hash=tx_hash
                )
        
        # Calcular nuevo balance
        new_current = vault["current"] + amount
        new_status = None
        if check_vault_completion(new_current, vault["target"]):
            new_status = VAULT_STATUS_COMPLETED
        
        # Registrar actividad
        activity_data = {
            "vault_id": vault_id,
            "activity_type": "deposit",
            "amount": amount,
            "tx_hash": tx_hash,
            "metadata": {"blockchain_verified": wallet_private_key is not None}
        }
        
        await db.table("activities").insert(activity_data).execute()
        
        # Actualizar vault
        update_data = {
            "current": new_current,
            "updated_at": datetime.utcnow().isoformat()
        }
        if new_status:
            update_data["status"] = new_status
        
        await db.table("vaults").update(update_data).eq("id", vault_id).execute()
        
        # Actualizar XP y streak del usuario
        xp_result = await self._update_user_xp(
            db,
            vault["user_id"],
            amount,
            new_status == VAULT_STATUS_COMPLETED
        )
        
        # Obtener estado actualizado del vault
        updated_vault = await self.get_by_id(db, vault_id)
        
        return {
            "success": True,
            "vault_id": vault_id,
            "amount_deposited": amount,
            "new_balance": new_current,
            "vault_progress": updated_vault["progress"],
            "vault_completed": new_status == VAULT_STATUS_COMPLETED,
            "xp_earned": xp_result["xp_earned"],
            "new_xp": xp_result["new_xp"],
            "new_level": xp_result["new_level"],
            "streak": xp_result["streak"],
            "streak_incremented": xp_result["streak_incremented"],
            "mood": xp_result["mood"],
            "tx_hash": tx_hash
        }
    
    # ─── Depósito Directo a Tropykus ────────────────────────────────────
    
    async def deposit_to_tropykus(
        self,
        amount: float,
        user_address: str,
        private_key: str,
        market: str = DEFAULT_TROPYKUS_MARKET
    ) -> Dict[str, Any]:
        """
        Deposita fondos directamente en Tropykus Protocol.
        
        Este método:
        1. Configura la wallet del usuario
        2. Ejecuta el depósito en el mercado chosen (krbtc por defecto)
        3. Retorna el resultado de la transacción
        
        Args:
            amount: Cantidad a depositar (en RBTC o DOC según el market)
            user_address: Dirección del usuario (para verificación)
            private_key: Clave privada para firmar la transacción
            market: Mercado de Tropykus ("krbtc", "kdoc", "krdoc")
        
        Returns:
            Dict con tx_hash, amount, ktoken_amount, etc.
        
        Raises:
            InsufficientFundsVaultError: Si no hay fondos suficientes
            BlockchainTransactionError: Si la transacción falla
        """
        # Validaciones
        if amount <= 0:
            raise VaultError("El monto debe ser mayor a 0")
        
        if not blockchain_service.is_valid_address(user_address):
            raise VaultError("Dirección de wallet inválida")
        
        # Configurar wallet
        self.tropykus.set_wallet(private_key)
        
        # Verificar balance en blockchain
        balance = await blockchain_service.get_rbtc_balance(user_address)
        if balance < amount:
            raise InsufficientFundsVaultError(
                f"Fondos insuficientes. Balance: {balance:.8f} RBTC, Requerido: {amount:.8f} RBTC"
            )
        
        # Ejecutar depósito según el mercado
        try:
            if market == "krbtc":
                result = await self.tropykus.deposit_rbtc(amount, user_address)
            elif market in ["kdoc", "krdoc"]:
                result = await self.tropykus.deposit_doc(amount, user_address)
            else:
                raise VaultError(f"Market desconocido: {market}")
            
            return {
                "success": result.success,
                "tx_hash": result.tx_hash,
                "amount": result.underlying_amount,
                "ktoken_amount": result.ktoken_amount,
                "exchange_rate": result.exchange_rate,
                "market": market,
                "gas_used": result.gas_used,
                "blockchain_verified": True
            }
            
        except InsufficientFundsError as e:
            raise InsufficientFundsVaultError(str(e))
        except TransactionError as e:
            raise BlockchainTransactionError(
                str(e),
                tx_hash=e.tx_hash,
                block_error=e.error_code
            )
    
    # ─── Consulta de Yield ─────────────────────────────────────────────
    
    async def get_yield(
        self,
        db: AsyncClient,
        vault_id: str,
        user_address: str
    ) -> Dict[str, Any]:
        """
        Obtiene el yield generado por un vault.
        
        Consulta el balance en Tropykus y calcula el yield estimado.
        """
        vault = await self.get_by_id(db, vault_id)
        if not vault:
            raise VaultNotFoundError("Vault no encontrado")
        
        if not await self._verify_ownership(db, vault, user_address):
            raise VaultError("No tienes permisos sobre este vault")
        
        # Obtener información de mercado de Tropykus
        yield_info = await self.tropykus.get_market_info(DEFAULT_TROPYKUS_MARKET)
        
        # Calcular yield basado en el tiempo transcurrido
        created_at = vault.get("created_at")
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        
        days_elapsed = (datetime.utcnow() - created_at).days if created_at else 0
        
        # Yield estimado vs yield real de Tropykus
        estimated_yield = calculate_yield_estimate(
            vault["current"],
            days_elapsed,
            yield_info.supply_rate
        )
        
        return {
            "vault_id": vault_id,
            "current_balance": vault["current"],
            "days_elapsed": days_elapsed,
            "market_apr": yield_info.supply_rate,  # APR del mercado
            "market_apy": yield_info.supply_rate * 365 if yield_info.supply_rate else 0,
            "estimated_yield": estimated_yield,
            "estimated_yield_usd": estimated_yield,  # Asumimos 1:1 con USD por ahora
            "total_deposited": vault["current"],
            "yield_percentage": (estimated_yield / vault["current"] * 100) if vault["current"] > 0 else 0
        }
    
    async def sync_with_blockchain(
        self,
        db: AsyncClient,
        vault_id: str,
        user_address: str,
        private_key: str
    ) -> Dict[str, Any]:
        """
        Sincroniza el vault local con el balance real en Tropykus.
        
        Útil para:
        - Verificar que el balance on-chain coincide con el local
        - Recuperar de inconsistencias
        - Actualizar después de intervenciones externas
        """
        vault = await self.get_by_id(db, vault_id)
        if not vault:
            raise VaultNotFoundError("Vault no encontrado")
        
        if not await self._verify_ownership(db, vault, user_address):
            raise VaultError("No tienes permisos sobre este vault")
        
        # Obtener balance real de Tropykus
        self.tropykus.set_wallet(private_key)
        
        onchain_balance = await self.tropykus.get_supply_balance(
            user_address,
            DEFAULT_TROPYKUS_MARKET
        )
        
        # Comparar con balance local
        local_balance = vault["current"]
        discrepancy = abs(onchain_balance - local_balance)
        
        # Si hay diferencia > 0.01, actualizar
        if discrepancy > 0.01:
            await db.table("vaults").update({
                "current": onchain_balance,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", vault_id).execute()
            
            # Registrar como ajuste
            await db.table("activities").insert({
                "vault_id": vault_id,
                "activity_type": "yield",
                "amount": onchain_balance - local_balance,
                "metadata": {
                    "type": "blockchain_sync",
                    "previous_balance": local_balance,
                    "new_balance": onchain_balance
                }
            }).execute()
            
            return {
                "synced": True,
                "previous_balance": local_balance,
                "new_balance": onchain_balance,
                "adjustment": onchain_balance - local_balance
            }
        
        return {
            "synced": True,
            "balance": local_balance,
            "no_adjustment_needed": True
        }
    
    # ─── Transferencias P2P ─────────────────────────────────────────────
    
    async def transfer(
        self,
        db: AsyncClient,
        vault_id: str,
        recipient_alias: str,
        amount: float,
        sender_address: str
    ) -> Dict[str, Any]:
        """
        Crea una transferencia P2P pendiente.
        
        El flujo es:
        1. Crear registro pending en transfers
        2. El receptor confirma o expira
        """
        vault = await self.get_by_id(db, vault_id)
        if not vault:
            raise VaultNotFoundError("Vault no encontrado")
        
        if not await self._verify_ownership(db, vault, sender_address):
            raise VaultError("No tienes permisos sobre este vault")
        
        if vault["current"] < amount:
            raise InsufficientFundsVaultError(
                f"Balance insuficiente. Disponible: {vault['current']}"
            )
        
        # Buscar receptor por alias
        recipient = await db.table("users").select("id, address").eq("alias", recipient_alias).execute()
        if not recipient.data:
            raise VaultError(f"Usuario '{recipient_alias}' no encontrado")
        
        recipient_id = recipient.data[0]["id"]
        recipient_address = recipient.data[0]["address"]
        
        # Crear transferencia pendiente
        from datetime import timedelta
        expires_at = datetime.utcnow() + timedelta(hours=24)
        
        transfer_data = {
            "from_vault_id": vault_id,
            "to_alias": recipient_alias,
            "amount": amount,
            "status": "pending",
            "expires_at": expires_at.isoformat()
        }
        
        result = await db.table("transfers").insert(transfer_data).execute()
        
        # Bloquear fondos en el vault (reducir current temporalmente)
        # En producción, esto debería ser un mecanismo más sofisticado
        new_balance = vault["current"] - amount
        await db.table("vaults").update({
            "current": new_balance,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", vault_id).execute()
        
        return {
            "transfer_id": result.data[0]["id"],
            "status": "pending",
            "amount": amount,
            "recipient_alias": recipient_alias,
            "recipient_address": recipient_address,
            "expires_at": expires_at.isoformat()
        }
    
    async def confirm_transfer(
        self,
        db: AsyncClient,
        transfer_id: str,
        recipient_address: str
    ) -> Dict[str, Any]:
        """
        Confirma una transferencia P2P (para el receptor).
        
        El receptor llama a este método para aceptar los fondos.
        """
        # Obtener transferencia
        result = await db.table("transfers").select("*").eq("id", transfer_id).execute()
        if not result.data:
            raise VaultError("Transferencia no encontrada")
        
        transfer = result.data[0]
        
        if transfer["status"] != "pending":
            raise VaultError(f"Transferencia ya no está pendiente (estado: {transfer['status']})")
        
        # Verificar que el que confirma es el destinatario
        recipient = await db.table("users").select("id, alias").eq("address", recipient_address).execute()
        if not recipient.data:
            raise VaultError("Usuario no encontrado")
        
        if recipient.data[0]["alias"] != transfer["to_alias"]:
            raise VaultError("Esta transferencia no es para ti")
        
        # Verificar que no expiró
        expires_at = datetime.fromisoformat(transfer["expires_at"].replace("Z", "+00:00"))
        if datetime.utcnow() > expires_at:
            # Expiró, cancelar
            await self._cancel_transfer(db, transfer)
            raise VaultError("Transferencia expirada")
        
        # Obtener vault del receptor (crear si no existe)
        recipient_id = recipient.data[0]["id"]
        vault_result = await db.table("vaults").select("*")\
            .eq("user_id", recipient_id)\
            .eq("name", f"Transfer from {transfer['to_alias']}")\
            .execute()
        
        if vault_result.data:
            # Usar vault existente
            recipient_vault = vault_result.data[0]
        else:
            # Crear vault temporal para la transferencia
            recipient_vault = await self.create(
                db,
                {
                    "name": f"Transfer from {transfer['to_alias']}",
                    "icon": "📩",
                    "target": transfer["amount"],
                    "vault_type": VAULT_TYPE_P2P
                },
                recipient_address
            )
        
        # Actualizar balances
        # Receptor recibe los fondos
        await db.table("vaults").update({
            "current": recipient_vault["current"] + transfer["amount"],
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", recipient_vault["id"]).execute()
        
        # Marcar transferencia como confirmada
        await db.table("transfers").update({
            "status": "confirmed",
            "confirmed_at": datetime.utcnow().isoformat()
        }).eq("id", transfer_id).execute()
        
        # Registrar actividad para el receptor
        await db.table("activities").insert({
            "vault_id": recipient_vault["id"],
            "activity_type": "transfer",
            "amount": transfer["amount"],
            "metadata": {
                "transfer_id": transfer_id,
                "from_alias": transfer["to_alias"]
            }
        }).execute()
        
        return {
            "success": True,
            "amount_received": transfer["amount"],
            "recipient_vault_id": recipient_vault["id"],
            "new_balance": recipient_vault["current"] + transfer["amount"]
        }
    
    async def cancel_transfer(
        self,
        db: AsyncClient,
        transfer_id: str,
        sender_address: str
    ) -> Dict[str, Any]:
        """Cancela una transferencia P2P (para el emisor)."""
        result = await db.table("transfers").select("*").eq("id", transfer_id).execute()
        if not result.data:
            raise VaultError("Transferencia no encontrada")
        
        transfer = result.data[0]
        
        if transfer["status"] != "pending":
            raise VaultError(f"Transferencia ya no está pendiente (estado: {transfer['status']})")
        
        # Verificar emisor
        vault_result = await db.table("vaults").select("user_id").eq("id", transfer["from_vault_id"]).execute()
        if not vault_result.data:
            raise VaultError("Vault emisor no encontrado")
        
        user_result = await db.table("users").select("address").eq("id", vault_result.data[0]["user_id"]).execute()
        if not user_result.data or user_result.data[0]["address"] != sender_address:
            raise VaultError("No tienes permisos para cancelar esta transferencia")
        
        return await self._cancel_transfer(db, transfer)
    
    async def _cancel_transfer(
        self,
        db: AsyncClient,
        transfer: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Cancela una transferencia y devuelve los fondos al emisor."""
        # Devolver fondos al vault emisor
        vault_result = await db.table("vaults").select("current").eq("id", transfer["from_vault_id"]).execute()
        if vault_result.data:
            current = vault_result.data[0]["current"]
            await db.table("vaults").update({
                "current": current + transfer["amount"],
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", transfer["from_vault_id"]).execute()
        
        # Marcar como cancelada
        await db.table("transfers").update({
            "status": "cancelled"
        }).eq("id", transfer["id"]).execute()
        
        return {
            "success": True,
            "amount_returned": transfer["amount"],
            "vault_id": transfer["from_vault_id"]
        }
    
    # ─── Helpers Internos ───────────────────────────────────────────────
    
    async def _verify_ownership(
        self,
        db: AsyncClient,
        vault: Dict[str, Any],
        user_address: str
    ) -> bool:
        """Verifica que el usuario es dueño del vault."""
        user_result = await db.table("users").select("id").eq("address", user_address).execute()
        if not user_result.data:
            return False
        return user_result.data[0]["id"] == vault["user_id"]
    
    async def _update_user_xp(
        self,
        db: AsyncClient,
        user_id: str,
        deposit_amount: float,
        goal_completed: bool = False
    ) -> Dict[str, Any]:
        """
        Actualiza XP y streak de un usuario después de un depósito.
        
        Returns:
            Dict con xp_earned, new_xp, new_level, streak, streak_incremented, mood
        """
        from app.services.xp_service import calculate_xp_for_deposit, calculate_level, determine_mood
        
        # Obtener usuario actual
        user_result = await db.table("users").select("*").eq("id", user_id).execute()
        if not user_result.data:
            return {"error": "Usuario no encontrado"}
        
        user = user_result.data[0]
        current_xp = user.get("xp", 0)
        current_streak = user.get("streak", 0)
        last_deposit = user.get("last_deposit_at")
        
        # Calcular XP ganado
        xp_earned = calculate_xp_for_deposit(deposit_amount)
        if goal_completed:
            xp_earned += 100  # Bonus por completar meta
        
        new_xp = current_xp + xp_earned
        new_level = calculate_level(new_xp)
        
        # Calcular streak
        from app.services.xp_service import calculate_streak
        new_streak, streak_incremented = calculate_streak(
            last_deposit,
            datetime.utcnow()
        )
        
        # Determinar mood
        mood = determine_mood(new_streak, datetime.utcnow(), new_xp)
        
        # Actualizar usuario
        update_data = {
            "xp": new_xp,
            "level": new_level,
            "streak": new_streak if streak_incremented else current_streak,
            "last_deposit_at": datetime.utcnow().isoformat()
        }
        
        await db.table("users").update(update_data).eq("id", user_id).execute()
        
        return {
            "xp_earned": xp_earned,
            "new_xp": new_xp,
            "new_level": new_level,
            "streak": new_streak,
            "streak_incremented": streak_incremented,
            "mood": mood
        }


# ============================================================================
# INSTANCIA GLOBAL
# ============================================================================

vault_service = VaultService()
