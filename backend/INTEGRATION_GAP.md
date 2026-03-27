# AhorroGO Backend — Integration Gap Analysis
# ===================================================

## Comparación: Frontend (README.md) vs Backend Actual

### 1. ENDPOINTS ACTUALES ✅

| Router | Endpoint | Método | Descripción | Estado |
|--------|----------|--------|-------------|--------|
| `/vaults` | GET / | GET | Lista vaults del usuario | ✅ |
| `/vaults` | POST / | POST | Crea nuevo vault | ✅ |
| `/vaults/{id}` | GET | GET | Detalle de vault | ✅ |
| `/vaults/{id}` | PUT | PUT | Actualiza vault | ✅ |
| `/vaults/{id}` | DELETE | DELETE | Elimina vault | ✅ |
| `/vaults/{id}/deposit` | POST | POST | Registra depósito | ✅ |
| `/vaults/{id}/yield` | GET | GET | Yield del vault | ✅ (hardcodeado) |
| `/blockchain/network` | GET | Info de red RSK | ✅ |
| `/blockchain/balance/{addr}` | GET | Balance RBTC | ✅ |
| `/blockchain/vault/counter` | GET | Contador vaults on-chain | ✅ |
| `/blockchain/vault/{id}` | GET | Info vault on-chain | ✅ |
| `/blockchain/vault/create` | POST | Crear vault on-chain | ✅ |
| `/blockchain/vault/deposit` | POST | Depositar on-chain | ✅ |
| `/blockchain/vault/withdraw` | POST | Retirar on-chain | ✅ |
| `/blockchain/markets` | GET | Mercados Topykus | ✅ |
| `/users` | CRUD | Usuarios | ✅ |
| `/penguin` | CRUD | Estado pingüino | ✅ |
| `/transfers` | CRUD | Transferencias P2P | ✅ |
| `/notifications` | CRUD | Notificaciones | ✅ |

---

### 2. ENDPOINTS FALTANTES 🔴

| Endpoint | Método | Descripción | Prioridad |
|----------|--------|-------------|-----------|
| `/vaults/{id}/withdraw` | POST | Retirar fondos de vault | **ALTA** |
| `/vaults/{id}/withdraw/check` | GET | Verificar si puede retirar | **ALTA** |
| `/users/me/balance` | GET | Balance total (available + locked) | MEDIA |
| `/blockchain/vault/{id}/set-beneficiary` | POST | Setear beneficiario on-chain | MEDIA |
| `/vaults/{id}/sync` | POST | Sincronizar estado on-chain con DB | MEDIA |
| `/vaults/{id}/activities` | GET | Actividades paginadas | BAJA |

---

### 3. PROBLEMAS DE INTEGRACIÓN ⚠️

#### 3.1 Base de datos vs Blockchain (CRÍTICO)

**Problema:**
- Los endpoints actuales (`/vaults/*`) guardan en Supabase
- Pero NO sincronizan con el smart contract on-chain
- El usuario crea un vault en DB pero no existe on-chain

**Solución:**
```python
# Opción A: Sincronizar automáticamente
@router.post("/vaults")
async def create_vault(vault_data: VaultCreate, ...):
    # 1. Crear en DB
    vault = await vault_service.create(db, vault_dict)
    
    # 2. Crear on-chain (si hay private key)
    if x_private_key:
        vault_contract = get_vault_contract(private_key=x_private_key)
        result = vault_contract.create_vault(
            name=vault_data.name,
            icon=vault_data.icon,
            target=vault_data.target,
            vault_type=VaultType(vault_data.vault_type),
        )
        # Guardar vault_id on-chain en DB
        await vault_service.update(db, vault["id"], {"on_chain_id": result.vault_id})
    
    return vault
```

#### 3.2 Auth: Supabase vs Private Key

**Problema:**
- `/vaults/*` usa Supabase auth (`get_current_user`)
- `/blockchain/*` usa `x-private-key` header
- Frontend necesita ambos

**Solución:**
```python
# Nuevo endpoint híbrido
@router.post("/vaults/{vault_id}/deposit-onchain")
async def deposit_onchain(
    vault_id: str,
    deposit: DepositRequest,
    current_user: Dict = Depends(get_current_user),
    x_private_key: str = Header(..., alias="x-private-key")
):
    # 1. Verificar ownership en DB
    vault = await vault_service.get_by_id(db, vault_id)
    if vault["user_id"] != current_user["id"]:
        raise HTTPException(403, "Not authorized")
    
    # 2. Ejecutar on-chain
    contract = get_vault_contract(private_key=x_private_key)
    result = contract.deposit(vault_id, deposit.amount)
    
    # 3. Actualizar DB
    await vault_service.update_current(db, vault_id, vault["current"] + deposit.amount)
    
    return {"success": True, "tx_hash": result.tx_hash}
```

#### 3.3 Withdraw Falta Completamente

**Problema:** No existe endpoint para retirar fondos.

**Solución:**
```python
@router.post("/vaults/{vault_id}/withdraw")
async def withdraw_from_vault(
    vault_id: str,
    withdraw: WithdrawRequest,
    current_user: Dict = Depends(get_current_user),
    x_private_key: str = Header(..., alias="x-private-key"),
    db: AsyncClient = Depends(get_db)
):
    vault = await vault_service.get_by_id(db, vault_id)
    
    # 1. Verificar ownership
    if vault["user_id"] != current_user["id"]:
        raise HTTPException(403, "Not authorized")
    
    # 2. Verificar que no esté bloqueado
    if vault.get("locked"):
        unlock_date = vault.get("unlock_date")
        if unlock_date and datetime.fromisoformat(unlock_date) > datetime.utcnow():
            raise HTTPException(400, f"Vault locked until {unlock_date}")
    
    # 3. Verificar balance suficiente
    if withdraw.amount > vault["current"]:
        raise HTTPException(400, "Insufficient balance")
    
    # 4. Ejecutar withdraw on-chain
    contract = get_vault_contract(private_key=x_private_key)
    result = contract.withdraw(vault["on_chain_id"], withdraw.amount)
    
    # 5. Actualizar DB
    new_balance = vault["current"] - withdraw.amount
    await vault_service.update_current(db, vault_id, new_balance)
    
    # 6. Registrar actividad
    await db.table("activities").insert({
        "vault_id": vault_id,
        "activity_type": "withdraw",
        "amount": withdraw.amount,
        "tx_hash": result.tx_hash,
    }).execute()
    
    return {"success": True, "new_balance": new_balance, "tx_hash": result.tx_hash}
```

#### 3.4 Yield Hardcodeado

**Problema:**
```python
yield_earned = vault["current"] * 0.052  # Hardcodeado 5.2%
```

**Solución:**
```python
@router.get("/{vault_id}/yield")
async def get_vault_yield(...):
    vault = await vault_service.get_by_id(db, vault_id)
    
    # Obtener APY real de Topykus
    from app.services.tropykus_service import tropykus_service
    market_info = tropykus_service.get_market_info("krbtc")
    
    # Calcular yield basado en tiempo
    days_elapsed = (datetime.utcnow() - vault["created_at"]).days
    apy = market_info.supply_rate
    yield_earned = vault["current"] * (apy * days_elapsed / 365)
    
    return YieldResponse(
        vault_id=vault_id,
        yield_earned=round(yield_earned, 2),
        current_balance=round(vault["current"] + yield_earned, 2),
        apy_estimate=apy,
    )
```

---

### 4. MODELOS DE DATOS FRONTEND

```typescript
// Del README.md - Vault Card Props
interface Vault {
  id: string;
  name: string;
  icon: string;           // emoji
  current: number;        // en USD o RBTC
  target: number;         // en USD o RBTC
  locked: boolean;
  unlockDate?: Date;
  type: 'savings' | 'rental' | 'p2p';
  beneficiary?: string;   // para rental
}

// Activity
interface Activity {
  id: string;
  vault_id: string;
  type: 'deposit' | 'withdraw' | 'yield' | 'transfer' | 'locked' | 'unlocked';
  amount: number;
  tx_hash?: string;
  created_at: Date;
}

// Balance (HOME)
interface BalanceData {
  total: number;          // $12,450.00
  yield_this_month: number;
  yield_percentage: number;
  available: number;      // No locked
  locked: number;         // En vaults con candado
}
```

---

### 5. FLUJO DE DATOS RECOMENDADO

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  CREATE VAULT                                               │    │
│  │  1. POST /vaults (DB) → crea vault en Supabase           │    │
│  │  2. POST /blockchain/vault/create (on-chain) → crea en RSK│    │
│  │  3. PUT /vaults/{id} → guarda on_chain_id en DB          │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  DEPOSIT                                                    │    │
│  │  1. POST /blockchain/vault/deposit (on-chain)            │    │
│  │  2. POST /vaults/{id}/deposit (DB) actualiza balance    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  WITHDRAW                                                   │    │
│  │  1. GET /vaults/{id}/withdraw/check (DB) verifica lock   │    │
│  │  2. POST /blockchain/vault/withdraw (on-chain)           │    │
│  │  3. POST /vaults/{id}/withdraw (DB) actualiza balance     │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  SYNC (al abrir app)                                        │    │
│  │  1. GET /vaults (DB) → lista de vaults                    │    │
│  │  2. GET /blockchain/vault/{id} (on-chain) para cada vault │    │
│  │  3. Comparar y actualizar DB si hay diferencias           │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 6. RESUMEN DE ACCIONES

| Acción | Endpoint | Crear |\| Modificar |
|--------|----------|-------|--------------|
| Retirar de vault | `POST /vaults/{id}/withdraw` | **CREAR** | vaults.py |
| Verificar retiro | `GET /vaults/{id}/withdraw/check` | **CREAR** | vaults.py |
| Balance usuario | `GET /users/me/balance` | **CREAR** | users.py |
| Sincronizar vault | `POST /vaults/{id}/sync` | **CREAR** | vaults.py |
| Yield dinámico | `GET /vaults/{id}/yield` | **MODIFICAR** | vaults.py |
| Crear vault con blockchain | `POST /vaults` | **MODIFICAR** | vaults.py |
| Depositar con blockchain | `POST /vaults/{id}/deposit` | **MODIFICAR** | vaults.py |

---

### 7. PRIORIDADES

1. **CRÍTICO** (hoy):
   - [ ] `POST /vaults/{id}/withdraw` - Retirar fondos
   - [ ] Integrar blockchain en `POST /vaults` (crear on-chain)
   - [ ] Integrar blockchain en `POST /vaults/{id}/deposit` (depositar on-chain)

2. **ALTA** (esta semana):
   - [ ] `GET /vaults/{id}/withdraw/check` - Verificar lock
   - [ ] `GET /users/me/balance` - Balance total
   - [ ] Yield dinámico desde Topykus

3. **MEDIA** (siguiente semana):
   - [ ] `POST /vaults/{id}/sync` - Sincronizar on-chain → DB
   - [ ] Setear beneficiario on-chain
   - [ ] Webhooks para eventos blockchain

---

*Documento generado para AhorroGO — Hackathon Rootstock + Beexo Connect*
*Fecha: Marzo 2025*