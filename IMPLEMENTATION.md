# AhorroGO — Documentación de Implementación

> Sistema de ahorro gamificado con integración blockchain RSK/Topykus

---

## 📋 Tabla de Contenidos

1. [Visión General](#1-visión-general)
2. [Arquitectura](#2-arquitectura)
3. [Backend](#3-backend)
4. [Frontend](#4-frontend)
5. [Integración Blockchain](#5-integración-blockchain)
6. [Gamificación](#6-gamificación)
7. [Setup y Ejecución](#7-setup-y-ejecución)
8. [API Reference](#8-api-reference)
9. [Variables de Entorno](#9-variables-de-entorno)

---

## 1. Visión General

**AhorroGO** es una aplicación de ahorro gamificada que permite a los usuarios:
- Crear "Vaults" (bóvedas) para metas específicas de ahorro
- Depositar fondos con bloqueo temporal (time-locks)
- Ganar yield a través de Topykus en RSK
- Subir de nivel y desbloquear accesorios para su mascota pingüino (Pingüi)
- Realizar transferencias P2P y transacciones on-chain

### Tech Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 19, TypeScript, Vite, Zustand, Framer Motion |
| Backend | FastAPI (Python), Pydantic, SQLAlchemy |
| Blockchain | RSK Testnet, web3.py, Solidity |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |

---

## 2. Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA AHORROGO                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐    │
│  │   Frontend  │ ───▶ │    API      │ ───▶ │  Blockchain │    │
│  │   (React)   │      │  (FastAPI)  │      │    (RSK)    │    │
│  └─────────────┘      └─────────────┘      └─────────────┘    │
│        │                    │                    │             │
│        ▼                    ▼                    ▼             │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐    │
│  │   Zustand   │      │  Supabase   │      │  Topykus    │    │
│  │   (Store)   │      │  (Postgres) │      │  (Lending)  │    │
│  └─────────────┘      └─────────────┘      └─────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Estructura de Proyecto

```
ahorrogo/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/v1/           # Endpoints API
│   │   │   ├── blockchain.py
│   │   │   ├── vaults.py
│   │   │   ├── users.py
│   │   │   └── router.py
│   │   ├── services/         # Lógica de negocio
│   │   │   ├── vault_contract_service.py
│   │   │   ├── blockchain_service.py
│   │   │   ├── tropykus_service.py
│   │   │   └── vault_service.py
│   │   ├── models/           # Modelos SQLAlchemy
│   │   ├── models/schemas.py  # Schemas Pydantic
│   │   └── config.py          # Configuración
│   ├── contracts/            # Smart contracts Solidity
│   │   └── AhorroGOVault.sol
│   ├── .env                  # Variables de entorno
│   └── requirements.txt       # Dependencias Python
│
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── penguin/      # Componentes Pingüi
│   │   │   │   ├── PenguinMascot.tsx
│   │   │   │   ├── Penguin.tsx
│   │   │   │   └── Onboarding.tsx
│   │   │   ├── ui/           # Componentes UI
│   │   │   ├── layout/       # Layout (TopAppBar, BottomNav)
│   │   │   └── auth/         # Autenticación
│   │   ├── pages/           # Páginas
│   │   │   ├── HomePage.tsx
│   │   │   ├── VaultsPage.tsx
│   │   │   ├── CreateVaultPage.tsx
│   │   │   ├── MovementsPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   └── SendPage.tsx
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # Servicios API
│   │   ├── store/          # Zustand store
│   │   ├── types/          # Tipos TypeScript
│   │   ├── config/         # Configuración
│   │   └── App.tsx         # Componente principal
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
│
└── IMPLEMENTATION.md         # Este documento
```

---

## 3. Backend

### 3.1 Stack Tecnológico

- **Framework**: FastAPI (async)
- **Database ORM**: SQLAlchemy con asyncpg
- **Blockchain**: web3.py
- **Authentication**: JWT tokens
- **Validation**: Pydantic v2

### 3.2 Servicios Principales

#### `vault_contract_service.py`
Gestiona la interacción con el smart contract `AhorroGOVault`:

```python
# Funcionalidades principales:
- create_vault(name, target, vault_type, beneficiary, lock_date)
- deposit(vault_id, amount)
- withdraw(vault_id, amount)
- get_vault_info(vault_id)
- set_beneficiary(vault_id, beneficiary)
- get_balance(vault_id)
```

#### `blockchain_service.py`
Provee utilidades de red RSK:

```python
# Funcionalidades:
- get_network_info() -> chain_id, block_number, gas_price
- get_wallet_balance(address) -> balance en RBTC/DOC
- get_transaction_receipt(tx_hash) -> status, block, gas_used
- estimate_gas(transaction) -> gas_estimate
```

#### `tropykus_service.py`
Integración con el protocolo de lending Topykus:

```python
# Funcionalidades:
- get_markets() -> lista de markets (kRBTC, kDOC, etc.)
- get_supply_rate(market) -> APY de supply
- get_borrow_rate(market) -> APY de borrow
- supply(market, amount) -> supply a mercado
- withdraw(market, amount) -> withdraw de mercado
```

### 3.3 Endpoints API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/vaults` | Listar todos los vaults del usuario |
| `POST` | `/vaults` | Crear nuevo vault |
| `GET` | `/vaults/{id}` | Obtener vault por ID |
| `PUT` | `/vaults/{id}` | Actualizar vault |
| `DELETE` | `/vaults/{id}` | Eliminar vault |
| `POST` | `/vaults/{id}/deposit` | Depositar en vault |
| `POST` | `/vaults/{id}/withdraw` | Retirar de vault |
| `GET` | `/vaults/{id}/withdraw/check` | Verificar si se puede retirar |
| `POST` | `/vaults/{id}/deposit-onchain` | Depositar on-chain |
| `POST` | `/vaults/{id}/sync` | Sincronizar vault con blockchain |
| `GET` | `/users/me` | Obtener usuario actual |
| `GET` | `/users/me/balance` | Obtener balance del usuario |
| `GET` | `/blockchain/network` | Info de red RSK |
| `GET` | `/blockchain/markets` | Listar markets Topykus |
| `POST` | `/blockchain/vault/{id}/set-beneficiary` | Establecer beneficiario |

### 3.4 Smart Contract

**Ubicación**: `backend/contracts/AhorroGOVault.sol`

```solidity
// Funcionalidades del contrato:
- createVault() -> Crea nuevo vault
- deposit() -> Deposita fondos (solo owner o beneficiario)
- withdraw() -> Retira fondos (respetando lock)
- setBeneficiary() -> Establece beneficiario para P2P
- getVaultInfo() -> Retorna info del vault
- getVaultBalance() -> Balance actual del vault
```

**Dirección desplegada (RSK Testnet)**:
```
Vault: 0x3d8A54bA8AB5089cd8a1862Fc4aBf3703aD7E60e
```

---

## 4. Frontend

### 4.1 Stack Tecnológico

- **Framework**: React 19
- **Lenguaje**: TypeScript (strict mode)
- **Build Tool**: Vite
- **State Management**: Zustand con persist
- **Animaciones**: Framer Motion
- **Estilos**: Tailwind CSS
- **Iconos**: Material Symbols

### 4.2 Páginas

| Página | Descripción |
|--------|-------------|
| `HomePage` | Dashboard principal con balance, vault principal, acciones rápidas |
| `VaultsPage` | Lista de todos los vaults con filtros |
| `CreateVaultPage` | Wizard de 3 pasos para crear vault |
| `MovementsPage` | Historial de movimientos/transacciones |
| `ProfilePage` | Perfil con XP, nivel, accesorios |
| `SendPage` | Enviar fondos a otras direcciones |

### 4.3 Componentes Pingüi

El pingüino (Pingüi) es la mascota de la app que aparece en todas las páginas:

#### `PenguinMascot.tsx`
Componente principal con 8 moods:

| Mood | Descripción | Uso |
|------|-------------|-----|
| `idle` | Respirando suavemente | Estado por defecto |
| `happy` | Saltando de emoción | Después de deposits |
| `celebrate` | Celebración grande | Logro de metas |
| `thinking` | Pensativo | Procesando |
| `guide` | Señalando | Onboarding, guías |
| `sleep` | Durmiendo | Estado inactivo |
| `wave` | Saludando | Bienvenida |
| `encourage` | Dando ánimos | Durante acciones |

#### `Onboarding.tsx`
Tutorial de bienvenida para nuevos usuarios (5 pasos):
1. Bienvenida de Pingüi
2. Explicación de vaults
3. Sistema de XP
4. Desbloqueo de accesorios
5. Llamado a acción

### 4.4 Sistema de Gamificación

#### XP y Niveles

```typescript
const XP_PER_LEVEL = [0, 100, 300, 600, 1000];
const LEVEL_NAMES = ['', 'Newcomer', 'Beginner', 'Saver', 'Champion', 'Legend'];
```

#### Recompensas XP

```typescript
// En DepositModal:
const XP_PER_DEPOSIT = {
  base: 10,           // XP base por depósito
  perDollar: 0.5,     // XP adicional por cada dólar
  bonusThresholds: [  // Bonos por depósitos grandes
    { threshold: 100, bonus: 5 },
    { threshold: 500, bonus: 25 },
    { threshold: 1000, bonus: 50 },
  ],
};
```

#### Accesorios por Nivel

| Nivel | Accesorios |
|-------|------------|
| 1 | (ninguno) |
| 2 | 🧢 Gorro (Beanie) |
| 3 | 🧢 + 🧣 Bufanda (Scarf) |
| 4 | 🧢 + 🧣 + 🧤 Guantes (Gloves) |
| 5 | 🧢 + 🧣 + 🧤 + 👑 Corona (Crown) |

---

## 5. Integración Blockchain

### 5.1 Redes Soportadas

| Red | Chain ID | RPC URL |
|-----|----------|---------|
| RSK Testnet | 31 | `https://public-node.testnet.rsk.co` |
| RSK Mainnet | 30 | `https://public-node.rsk.co` |

### 5.2 Topykus Markets

Protocolo de lending en RSK:

| Asset | Símbolo | Supply APY |
|-------|---------|-------------|
| RBTC | rBTC | 3.53% |
| DOC | DOC | 0.79% |
| kRBTC | kRBTC | ~3.5% |
| kDOC | kDOC | ~0.8% |

### 5.3 Wallet

- **Dirección del usuario**: `0xF5fae80a7165E8e998814aBc0F81027A33f94134`
- **Private Key**: Derivada desde seed phrase (Trust Wallet → derivación BIP39)

---

## 6. Gamificación

### 6.1 Flujo de XP

```
Usuario deposita fondos
        ↓
   +10 XP base
        ↓
   +0.5 XP por dólar depositado
        ↓
   +Bono si supera umbrales (100, 500, 1000)
        ↓
   Se actualiza total XP
        ↓
   ¿Subió de nivel?
   └─→ SÍ: Animación de celebración + desbloquear accessory
   └─→ NO: Mostrar progreso al siguiente nivel
```

### 6.2 UI de Progreso

```tsx
// En ProfilePage:
// - Barra de progreso XP
// - Nivel actual con nombre
// - Accesorios desbloqueados
// - Preview del próximo accessory
// - Racha de días (streak)
```

---

## 7. Setup y Ejecución

### 7.1 Prerrequisitos

- Python 3.10+
- Node.js 18+
- npm o yarn
- Git

### 7.2 Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate     # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Ejecutar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 7.3 Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Ejecutar en desarrollo
npm run dev

# Build producción
npm run build
```

### 7.4 Scripts de Inicio

En la raíz del proyecto:

```bash
# Iniciar ambos (PowerShell)
.\start.ps1

# Iniciar ambos (Batch)
.\start.bat

# Detener servicios
.\stop.ps1
# o
.\stop.bat
```

---

## 8. API Reference

### 8.1 Autenticación

```
POST /api/v1/users/verify
Body: { address, signature, message }
Response: { user: UserResponse, token }
```

### 8.2 Vaults

```
GET /api/v1/vaults
Response: { vaults: VaultResponse[], total_saved, total_target }

POST /api/v1/vaults
Body: { name, icon, target, vault_type, beneficiary?, locked?, unlock_date? }
Response: VaultResponse

POST /api/v1/vaults/{id}/deposit
Body: { amount, tx_hash? }
Response: { success, xp_earned, new_xp, new_level, ... }

POST /api/v1/vaults/{id}/withdraw
Body: { amount }
Response: { success, amount, new_balance, xp_earned }
```

### 8.3 Blockchain

```
GET /api/v1/blockchain/network
Response: { chain_id, block_number, gas_price_gwei, rpc_url, symbol }

GET /api/v1/blockchain/markets
Response: MarketInfoResponse[]
```

---

## 9. Variables de Entorno

### Backend (.env)

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# JWT
JWT_SECRET=your-secret-key

# Blockchain
PRIVATE_KEY=your-private-key-with-0x-prefix
RSK_RPC_URL=https://public-node.testnet.rsk.co

# Smart Contract
VAULT_CONTRACT_ADDRESS=0x3d8A54bA8AB5089cd8a1862Fc4aBf3703aD7E60e
```

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_RPC_URL=https://public-node.testnet.rsk.co
VITE_CHAIN_ID=31
```

---

## 🔄 Estado Actual

### ✅ Completado

- [x] Backend FastAPI con endpoints REST
- [x] Integración web3.py con RSK
- [x] Smart Contract desplegado
- [x] Integración Topykus
- [x] Frontend React con todas las páginas
- [x] Sistema de gamificación (XP, niveles, accesorios)
- [x] Componente Pingüi en todas las páginas
- [x] Onboarding para nuevos usuarios
- [x] Build passando sin errores TypeScript

### ⏳ Pendiente

- [ ] Testing completo E2E
- [ ] Integración con Beexo wallet (cuando esté disponible)
- [ ] Despliegue a producción

---

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

---

*Documento generado el 27 de Marzo de 2026*
