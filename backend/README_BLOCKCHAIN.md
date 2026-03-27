# AhorroGO — Integración Blockchain Completa

Este documento describe la integración blockchain del backend con RSK, Tropykus y el contrato Vault propio.

## Índice

1. [Arquitectura](#1-arquitectura)
2. [RSK Network](#2-rsk-network)
3. [Tropykus Protocol](#3-tropykus-protocol)
4. [Smart Contract Vault](#4-smart-contract-vault)
5. [Backend Services](#5-backend-services)
6. [Endpoints API](#6-endpoints-api)
7. [Deployment](#7-deployment)
8. [Quick Start](#8-quick-start)

---

## 1. Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AHORROGO BLOCKCHAIN STACK                         │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                         FRONTEND                                 │   │
│  │                                                                    │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐    │   │
│  │  │ xo-connect  │  │   Backend   │  │   Vault Contract   │    │   │
│  │  │  (Wallet)   │──│    API      │──│    (On-chain)      │    │   │
│  │  └─────────────┘  └──────┬──────┘  └──────────┬──────────┘    │   │
│  └──────────────────────────┼─────────────────────┼────────────────┘   │
│                             │                     │                       │
│                             ▼                     ▼                       │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                         BACKEND (FastAPI)                        │   │
│  │                                                                   │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │   │
│  │  │ vault_service   │  │ tropykus_service │  │ blockchain_   │  │   │
│  │  │                 │  │                  │  │ service       │  │   │
│  │  │ - deposit()     │  │ - deposit_rbtc() │  │               │  │   │
│  │  │ - withdraw()    │  │ - get_balance()  │  │ - RPC calls   │  │   │
│  │  │ - get_yield()   │  │ - get_market()   │  │ - tx receipts │  │   │
│  │  └────────┬─────────┘  └────────┬─────────┘  └───────┬───────┘  │   │
│  │           │                      │                    │          │   │
│  │           └──────────────────────┼────────────────────┘          │   │
│  │                                  │                                   │   │
│  └──────────────────────────────────┼───────────────────────────────────┘   │
│                                     │                                        │
└─────────────────────────────────────┼────────────────────────────────────────┘
                                      │
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                           RSK NETWORK                                      │
│                                                                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │    RSK Node     │  │   Tropykus     │  │  AhorroGOVault │            │
│  │  (RPC Public)   │  │   Protocol     │  │   (Own Contract)│            │
│  │                 │  │                 │  │                 │            │
│  │ testnet:        │  │ kRBTC:          │  │ Deployed at:    │            │
│  │ public-node.     │  │ 0x636b...       │  │ 0x...           │            │
│  │ testnet.rsk.co  │  │                 │  │                 │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                            │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 2. RSK Network

### Configuración

| Parámetro | Testnet | Mainnet |
|-----------|---------|---------|
| Chain ID | 31 | 30 |
| RPC URL | https://public-node.testnet.rsk.co | https://public-node.rsk.co |
| Explorer | blockscout.com/... | blockscout.com/... |
| Faucet | faucet.rootstock.io | N/A |

### Variables de Entorno

```bash
RSK_RPC_URL=https://public-node.testnet.rsk.co
RSK_CHAIN_ID=31
```

---

## 3. Tropykus Protocol

### Contratos (RSK Testnet)

| Contrato | Dirección | Propósito |
|----------|-----------|-----------|
| Comptroller | `0x7de1ade0c4482ceab96faff408cc9dcc9015b448` | Gestión mercados |
| kRBTC | `0x636b2c156d09cee9516f9afec7a4605e1f43dec1` | Lending RBTC |
| kDOC | `0xe7b4770af8152fc1a0e13d08e70a8c9a70f4d9d9` | Lending DOC |
| kRDOC | `0x0981eb51a91e6f89063c963438cadf16c2e44962` | Receipt DOC |

### Servicios

**Archivo**: `app/services/tropykus_service.py`

```python
from app.services.tropykus_service import tropykus_service

# Configurar wallet
tropykus_service.set_wallet(private_key)

# Depositar RBTC para yield
result = await tropykus_service.deposit_rbtc(amount=0.1, sender_address=address)

# Obtener balance depositado
balance = await tropykus_service.get_supply_balance(address, "krbtc")

# Obtener info de mercado (APY)
info = await tropykus_service.get_market_info("krbtc")
print(f"Supply APY: {info.supply_rate * 100:.2f}%")
```

---

## 4. Smart Contract Vault

### Archivo

`contracts/AhorroGOVault.sol`

### Características

- Depósitos en RBTC
- Time-lock opcional
- Metas configurables
- Múltiples tipos (Savings, Rental, P2P)
- Beneficiarios para rentals
- Eventos on-chain

### Funciones Principales

```solidity
// Crear vault
function createVault(
    string name,
    string icon,
    uint256 target,
    VaultType vaultType,
    address beneficiary,
    bool locked,
    uint256 unlockDate
) external returns (uint256 vaultId)

// Depositar (payable)
function deposit(uint256 vaultId) external payable returns (uint256 newBalance)

// Retirar
function withdraw(uint256 vaultId, uint256 amount) external returns (bool success)

// Consultar
function getVault(uint256 vaultId) external view returns (Vault memory)
function getProgress(uint256 vaultId) external view returns (uint256)  // basis points
function isUnlocked(uint256 vaultId) external view returns (bool)
```

### Eventos

```
VaultCreated(vaultId, owner, name, target, vaultType)
DepositMade(vaultId, depositor, amount, newBalance, timestamp)
WithdrawalMade(vaultId, withdrawer, amount, timestamp)
VaultCompleted(vaultId, owner, finalBalance, timestamp)
```

---

## 5. Backend Services

### Estructura de Archivos

```
backend/app/services/
├── blockchain_service.py      # Conexión RPC general
├── tropykus_service.py        # Integración Tropykus
├── vault_service.py           # Lógica de negocio
├── vault_contract_service.py  # Contrato Vault on-chain
├── xp_service.py             # Gamificación
└── notification_service.py    # Notificaciones
```

### Servicios Principales

#### VaultService (`vault_service.py`)

```python
from app.services.vault_service import vault_service

# Registrar depósito (post blockchain)
result = await vault_service.deposit(
    db=db,
    vault_id="uuid",
    amount=100.0,
    tx_hash="0x...",
    user_address="0x..."
)

# Depositar directamente a Tropykus
result = await vault_service.deposit_to_tropykus(
    amount=0.01,
    user_address="0x...",
    private_key="0x...",
    market="krbtc"
)

# Obtener yield
yield_info = await vault_service.get_yield(db, vault_id, user_address)
```

#### VaultContractService (`vault_contract_service.py`)

```python
from app.services.vault_contract_service import VaultContractService

# Crear contrato
contract = VaultContractService(
    contract_address="0x...",
    private_key="0x..."
)

# Crear vault on-chain
result = await contract.create_vault(
    name="Casa",
    icon="🏠",
    target=10.0,  # RBTC
    vault_type=VaultType.SAVINGS
)

# Depositar
result = await contract.deposit(vault_id=0, amount=1.0)

# Consultar
vault = await contract.get_vault(0)
print(f"Progreso: {vault.progress_percent}%")
```

---

## 6. Endpoints API

### Blockchain (lectura pública)

```
GET  /api/v1/blockchain/network              # Info de red
GET  /api/v1/blockchain/balance/{address}   # Balance RBTC
GET  /api/v1/blockchain/tx/{hash}          # Estado de tx
GET  /api/v1/blockchain/markets             # Mercados Tropykus
GET  /api/v1/blockchain/supply-balance/{address}  # Balance en Tropykus
```

### Vault Contract

```
GET  /api/v1/blockchain/vault/counter       # Total de vaults
GET  /api/v1/blockchain/vault/{id}           # Info de vault
GET  /api/v1/blockchain/vaults/user/{addr}  # Vaults de usuario
```

### Transacciones (requieren auth + private key)

```
POST /api/v1/blockchain/vault/create        # Crear vault on-chain
POST /api/v1/blockchain/vault/deposit        # Depositar a vault
POST /api/v1/blockchain/vault/withdraw      # Retirar de vault
POST /api/v1/blockchain/deposit             # Depositar a Tropykus
```

### Health

```
GET  /api/v1/blockchain/health              # Health check completo
```

---

## 7. Deployment

### Paso 1: Compilar Contrato

```bash
cd contracts
npm install
npx hardhat compile
```

### Paso 2: Configurar .env

```bash
cp .env.example .env
# Editar con tu PRIVATE_KEY y RPC URLs
```

### Paso 3: Desplegar

```bash
# Testnet
npx hardhat run scripts/deploy.js --network rsktestnet

# Mainnet
npx hardhat run scripts/deploy.js --network rskmainnet
```

### Paso 4: Configurar Backend

Actualizar `app/config.py` o `.env`:

```bash
VAULT_CONTRACT_ADDRESS=0x...  # Del deployment
RSK_RPC_URL=https://public-node.testnet.rsk.co
RSK_CHAIN_ID=31
```

---

## 8. Quick Start

### 1. Levantar Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Editar .env
uvicorn app.main:app --reload
```

### 2. Verificar Conexión

```bash
curl http://localhost:8000/api/v1/blockchain/health
```

### 3. Crear Vault

```bash
curl -X POST http://localhost:8000/api/v1/blockchain/vault/create \
  -H "Authorization: Bearer <token>" \
  -H "x-private-key: 0x..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Casa",
    "icon": "🏠",
    "target": 10.0
  }'
```

### 4. Depositar

```bash
curl -X POST http://localhost:8000/api/v1/blockchain/vault/deposit \
  -H "Authorization: Bearer <token>" \
  -H "x-private-key: 0x..." \
  -H "Content-Type: application/json" \
  -d '{
    "vault_id": 0,
    "amount": 1.0
  }'
```

---

## Recursos

- [RSK Docs](https://dev.rootstock.io)
- [Tropykus Docs](https://docs.tropykus.com)
- [Tropykus GitHub](https://github.com/Tropykus)
- [RSK Faucet](https://faucet.rootstock.io)
- [Blockscout](https://blockscout.com)
