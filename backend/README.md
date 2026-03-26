# AhorroGO — Backend Documentation

## Stack: FastAPI + Supabase + PostgreSQL

**Versión**: 1.0  
**Fecha**: Marzo 2025  
**Stack**: Python 3.11+ / FastAPI / SQLAlchemy 2.0 / Supabase / Pydantic v2

---

## 1. Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND AHORROGO                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    FASTAPI (Python)                      │   │
│  │                                                           │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │   │
│  │  │  Auth   │  │  Users  │  │ Vaults  │  │ Webhooks │  │   │
│  │  │ (Beexo) │  │         │  │         │  │         │  │   │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  │   │
│  │       └─────────────┴────────────┴─────────────┘        │   │
│  │                         │                                │   │
│  │                    ┌────┴────┐                         │   │
│  │                    │ Services │                         │   │
│  │                    │  Layer   │                         │   │
│  │                    └────┬────┘                         │   │
│  └──────────────────────────┼──────────────────────────────┘   │
│                             │                                     │
│         ┌───────────────────┼───────────────────┐               │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │  Supabase   │    │  RSK Node   │    │  Tropykus   │       │
│  │  PostgreSQL │    │   (RPC)     │    │  Protocol   │       │
│  └─────────────┘    └─────────────┘    └─────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.1 Decisiones Arquitectónicas

| Decisión | Alternativa | Justificación |
|----------|-------------|---------------|
| **FastAPI** | Node.js, Next.js | Python nativo para equipo backend |
| **Supabase** | Firebase, PlanetScale | PostgreSQL nativo, RLS, Realtime |
| **SQLAlchemy 2.0** | Raw SQL, Eloquent | type-safe, async ready |
| **Pydantic v2** | Marshmallow, attrs | Native FastAPI integration |

---

## 2. Estructura del Proyecto

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Environment variables
│   ├── database.py             # Supabase connection
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py            # Dependencies (auth, db session)
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py      # Main router (includes all endpoints)
│   │       ├── users.py       # /users endpoints
│   │       ├── vaults.py      # /vaults endpoints
│   │       ├── penguin.py     # /penguin endpoints
│   │       ├── transfers.py   # /transfers endpoints
│   │       ├── webhooks.py    # /webhooks endpoints
│   │       └── notifications.py
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py        # Signature verification
│   │   ├── auth.py           # Beexo auth flow
│   │   └── signatures.py      # Message signing utils
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── user_service.py
│   │   ├── vault_service.py
│   │   ├── xp_service.py     # XP/Level calculations
│   │   ├── streak_service.py
│   │   ├── transfer_service.py
│   │   ├── notification_service.py
│   │   └── blockchain_service.py
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py        # Pydantic models
│   │
│   └── utils/
│       ├── __init__.py
│       └── helpers.py
│
├── migrations/                 # Supabase migrations
│   └── 001_initial_schema.sql
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_users.py
│   ├── test_vaults.py
│   ├── test_xp.py
│   └── test_webhooks.py
│
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## 3. API Endpoints

### Base URL
```
/api/v1
```

### 3.1 Autenticación

```
POST /api/v1/auth/verify
─────────────────────────
Verifica signature de Beexo y crea/retorna usuario.

Request:
{
  "address": "0x1234...",
  "signature": "0xabcd...",
  "message": "Sign this to authenticate with AhorroGO"
}

Response 200:
{
  "user": {
    "id": "uuid",
    "address": "0x1234...",
    "alias": "juan.bexo",
    "xp": 350,
    "level": 3,
    "streak": 5,
    "last_deposit_at": "2025-03-15T10:30:00Z",
    "created_at": "2025-01-01T00:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}

Response 401:
{
  "detail": "Invalid signature"
}
```

### 3.2 Usuarios

```
GET /api/v1/users/me
───────────────────
Obtiene usuario actual (del JWT).

Headers:
  Authorization: Bearer <token>

Response 200:
{
  "id": "uuid",
  "address": "0x1234...",
  "alias": "juan.bexo",
  "xp": 350,
  "level": 3,
  "streak": 5,
  "last_deposit_at": "2025-03-15T10:30:00Z",
  "created_at": "2025-01-01T00:00:00Z"
}


GET /api/v1/users/{address}
──────────────────────────
Obtiene usuario por address (para verificar rental guarantees).

Response 200:
{
  "address": "0x1234...",
  "alias": "juan.bexo",
  "has_active_guarantee": true
}
```

### 3.3 Vaults

```
GET /api/v1/vaults
──────────────────
Lista todos los vaults del usuario actual.

Response 200:
{
  "vaults": [
    {
      "id": "uuid",
      "name": "Casa",
      "icon": "🏠",
      "target": 10000.00,
      "current": 4200.00,
      "vault_type": "savings",
      "locked": true,
      "unlock_date": "2025-12-15T00:00:00Z",
      "status": "active",
      "progress": 0.42,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total_saved": 12450.00,
  "total_target": 25000.00
}


POST /api/v1/vaults
──────────────────
Crea un nuevo vault.

Request:
{
  "name": "Casa en Mendoza",
  "icon": "🏠",
  "target": 10000.00,
  "vault_type": "savings",
  "locked": true,
  "unlock_date": "2025-12-15T00:00:00Z",
  "beneficiary": null
}

Response 201:
{
  "id": "uuid",
  "name": "Casa en Mendoza",
  "icon": "🏠",
  "target": 10000.00,
  "current": 0,
  "vault_type": "savings",
  "locked": true,
  "unlock_date": "2025-12-15T00:00:00Z",
  "status": "active",
  "progress": 0,
  "created_at": "2025-03-26T00:00:00Z"
}


GET /api/v1/vaults/{vault_id}
──────────────────────────────
Obtiene detalle de un vault con actividades.

Response 200:
{
  "id": "uuid",
  "name": "Casa",
  "icon": "🏠",
  "target": 10000.00,
  "current": 4200.00,
  "vault_type": "savings",
  "locked": true,
  "unlock_date": "2025-12-15T00:00:00Z",
  "status": "active",
  "progress": 0.42,
  "activities": [
    {
      "id": "uuid",
      "activity_type": "deposit",
      "amount": 500.00,
      "tx_hash": "0xabcd...",
      "created_at": "2025-03-15T10:30:00Z"
    }
  ],
  "created_at": "2025-01-01T00:00:00Z"
}


PUT /api/v1/vaults/{vault_id}
──────────────────────────────
Actualiza nombre/icon de un vault.

Request:
{
  "name": "Casa",
  "icon": "🏠"
}

Response 200:
VaultResponse


DELETE /api/v1/vaults/{vault_id}
───────────────────────────────
Cancela un vault (solo si no está locked o si está completed).

Response 204: No content

Response 400:
{
  "detail": "Cannot cancel vault with active lock"
}
```

### 3.4 Depósitos

```
POST /api/v1/vaults/{vault_id}/deposit
──────────────────────────────────────
Registra un depósito post-confirmación blockchain.

Request:
{
  "amount": 500.00,
  "tx_hash": "0xabcd1234..."
}

Response 200:
{
  "success": true,
  "xp_earned": 50,
  "new_xp": 350,
  "new_level": 3,
  "streak": 5,
  "streak_incremented": false,
  "vault_progress": 0.42,
  "mood": "happy"
}


GET /api/v1/vaults/{vault_id}/yield
──────────────────────────────────────
Obtiene yield generado por un vault.

Response 200:
{
  "vault_id": "uuid",
  "yield_earned": 89.50,
  "current_balance": 4289.50,
  "apy_estimate": 0.052
}
```

### 3.5 Penguins (Gamificación)

```
GET /api/v1/penguin
───────────────────
Obtiene estado completo del penguin.

Response 200:
{
  "xp": 350,
  "level": 3,
  "mood": "happy",
  "streak": 5,
  "accessories": ["phone", "sunglasses"],
  "total_saved": 12450.00,
  "yield_earned": 245.50,
  "goals": [
    {
      "id": "uuid",
      "name": "Casa",
      "icon": "🏠",
      "target": 10000.00,
      "current": 4200.00,
      "status": "active"
    }
  ]
}
```

### 3.6 Transfers (P2P)

```
POST /api/v1/transfers
──────────────────────
Crea una transferencia P2P pendiente.

Request:
{
  "vault_id": "uuid",
  "recipient_alias": "maria.bexo",
  "amount": 450.00
}

Response 201:
{
  "id": "uuid",
  "status": "pending",
  "expires_at": "2025-03-27T00:00:00Z"
}


GET /api/v1/transfers/{transfer_id}
───────────────────────────────────
Obtiene estado de transferencia.

Response 200:
{
  "id": "uuid",
  "status": "pending",
  "from_vault": VaultResponse,
  "to_alias": "maria.bexo",
  "amount": 450.00,
  "expires_at": "2025-03-27T00:00:00Z"
}


POST /api/v1/transfers/{transfer_id}/confirm
───────────────────────────────────────────
Confirma recepción de transferencia (para el receptor).

Response 200:
{
  "success": true,
  "new_balance": 450.00
}


POST /api/v1/transfers/{transfer_id}/cancel
───────────────────────────────────────────
Cancela transferencia (para el emisor).

Response 200:
{
  "success": true,
  "amount_returned": 450.00
}
```

### 3.7 Webhooks

```
POST /api/v1/webhooks/blockchain
───────────────────────────────
Recibe eventos de blockchain.

Request:
{
  "event": "DepositCompleted",
  "tx_hash": "0xabcd...",
  "user_address": "0x1234...",
  "amount": 500.00,
  "vault_id": "uuid",
  "block_number": 12345678,
  "timestamp": 1712000000
}

Response 200:
{
  "processed": true,
  "xp_earned": 50,
  "new_level": 3
}
```

### 3.8 Notificaciones

```
GET /api/v1/notifications
────────────────────────
Lista notificaciones del usuario.

Query params:
  - unread_only: bool = false

Response 200:
{
  "notifications": [
    {
      "id": "uuid",
      "title": "¡Meta alcanzada!",
      "body": "Llegaste al 100% de tu vault Casa",
      "type": "goal_completed",
      "read": false,
      "created_at": "2025-03-20T00:00:00Z"
    }
  ]
}


PUT /api/v1/notifications/{id}/read
─────────────────────────────────
Marca notificación como leída.

Response 200:
{
  "success": true
}
```

---

## 4. Modelos de Datos

### 4.1 Enums

```python
class VaultType(str, Enum):
    SAVINGS = "savings"
    RENTAL = "rental"
    P2P = "p2p"

class VaultStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ActivityType(str, Enum):
    DEPOSIT = "deposit"
    WITHDRAW = "withdraw"
    YIELD = "yield"
    TRANSFER = "transfer"

class PenguinMood(str, Enum):
    IDLE = "idle"
    HAPPY = "happy"
    CELEBRATING = "celebrating"
    WAITING = "waiting"
```

### 4.2 Pydantic Schemas

```python
# User
class UserBase(BaseModel):
    address: str
    alias: str

class UserCreate(UserBase):
    signature: str
    message: str

class UserResponse(UserBase):
    id: str
    xp: int = 0
    level: int = 1
    streak: int = 0
    last_deposit_at: Optional[datetime] = None
    created_at: datetime

# Vault
class VaultBase(BaseModel):
    name: str = Field(..., max_length=100)
    icon: str = Field(default="🏠")
    target: float = Field(..., gt=0)
    vault_type: VaultType
    beneficiary: Optional[str] = None
    locked: bool = False
    unlock_date: Optional[datetime] = None

class VaultCreate(VaultBase):
    pass

class VaultResponse(VaultBase):
    id: str
    user_id: str
    current: float = 0
    status: VaultStatus = VaultStatus.ACTIVE
    progress: float  # computed
    created_at: datetime

# Deposit
class DepositRequest(BaseModel):
    amount: float = Field(..., gt=0)
    tx_hash: str

class DepositResponse(BaseModel):
    success: bool
    xp_earned: int
    new_xp: int
    new_level: int
    streak: int
    streak_incremented: bool
    vault_progress: float
    mood: PenguinMood
```

---

## 5. Lógica de Negocio

### 5.1 Sistema de XP/Levels

```
┌─────────────────────────────────────────────────────────────────┐
│                    XP & LEVEL SYSTEM                            │
│                                                                 │
│  XP PER LEVEL                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Level 1:  0 XP    → Newcomer                          │   │
│  │  Level 2:  100 XP  → Beginner                         │   │
│  │  Level 3:  300 XP  → Saver                            │   │
│  │  Level 4:  600 XP  → Champion                         │   │
│  │  Level 5:  1000 XP → Legend                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  XP EARNING                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Deposit:     1 XP per $10 deposited                   │   │
│  │  Completion:  +100 XP bonus when goal reached          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ACCESSORIES BY LEVEL                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Level 1:  []                                           │   │
│  │  Level 2:  [beanie]                                     │   │
│  │  Level 3:  [beanie, scarf]                              │   │
│  │  Level 4:  [beanie, scarf, gloves]                       │   │
│  │  Level 5:  [beanie, scarf, gloves, crown]               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ACCESSORIES BY COMPLETED GOAL                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  "celular" → phone                                      │   │
│  │  "vacaciones" → sunglasses                              │   │
│  │  "casa" → house                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Sistema de Streaks

```
┌─────────────────────────────────────────────────────────────────┐
│                      STREAK SYSTEM                               │
│                                                                 │
│  REGLAS                                                          │
│  ────────────────────────────────────────────────────────────── │
│  • Un streak cuenta depósitos mensuales consecutivos            │
│  • Resetea si pasan más de 60 días sin depositar               │
│  • Se incrementa al depositar en un nuevo mes                   │
│                                                                 │
│  MOOD MAPPING                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  No deposits yet  →  idle                               │   │
│  │  30+ days idle     →  waiting                            │   │
│  │  1-5 month streak  →  idle                               │   │
│  │  6+ month streak   →  happy                              │   │
│  │  Goal completed    →  celebrating                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Vault Types

```
┌─────────────────────────────────────────────────────────────────┐
│                      VAULT TYPES                                 │
│                                                                 │
│  SAVINGS (Ahorro Propio)                                         │
│  ────────────────────────────────────────────────────────────── │
│  • Para comprar lo que quieras                                   │
│  • Time-lock opcional                                           │
│  • Beneficiario: nadie                                          │
│  • Yield: 100% tuyo (4-6% APY via Tropykus)                     │
│                                                                 │
│  RENTAL (Garantía de Alquiler)                                   │
│  ────────────────────────────────────────────────────────────── │
│  • Para alquilar sin depósitos enormes                           │
│  • Lock: siempre activo hasta fin de contrato                   │
│  • Beneficiario: el propietario del inmueble                    │
│  • El propietario puede verificar fondos via alias              │
│                                                                 │
│  P2P (Compra Protegida)                                          │
│  ────────────────────────────────────────────────────────────── │
│  • Transferencias entre usuarios                                │
│  • Escrow automático                                            │
│  • Timeout de 24 horas para confirmar                           │
│  • Si expira, fondos vuelven al emisor                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Autenticación (Beexo Signature)

### 6.1 Flujo de Auth

```
1. [FRONTEND] Solicita signature al usuario via xo-connect
                    │
                    ▼
2. [BEEXO] Usuario firma mensaje "Sign this to authenticate with AhorroGO"
                    │
                    ▼
3. [FRONTEND] Envía { address, signature, message } a /api/v1/auth/verify
                    │
                    ▼
4. [BACKEND] Verifica signature con eth_account.recover_message
                    │
                    ▼
5. [BACKEND] Busca/Crea usuario en Supabase
                    │
                    ▼
6. [BACKEND] Genera JWT con { sub: address, exp: 7 days }
                    │
                    ▼
7. [FRONTEND] Almacena JWT, usa en headers Authorization: Bearer <token>
```

### 6.2 Implementación

```python
# app/core/security.py

from web3 import Web3
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

AUTH_MESSAGE = "Sign this to authenticate with AhorroGO"
security = HTTPBearer()

async def verify_beexo_signature(
    address: str,
    signature: str,
    message: str = AUTH_MESSAGE
) -> bool:
    """Verifica que la firma es válida para la address dada."""
    try:
        recovered = w3.eth.account.recover_message(
            text=message,
            signature=signature
        )
        return recovered.lower() == address.lower()
    except Exception:
        return False

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db=Depends(get_db)
) -> User:
    """Dependency que obtiene el usuario actual del JWT."""
    token = credentials.credentials
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        address = payload.get("sub")
        
        if not address:
            raise HTTPException(401, "Invalid token")
        
        user = await user_service.get_by_address(db, address)
        if not user:
            raise HTTPException(401, "User not found")
        
        return user
        
    except jwt.JWTError:
        raise HTTPException(401, "Invalid token")
```

---

## 7. Base de Datos (Supabase/PostgreSQL)

### 7.1 Schema Principal

```sql
-- Users
create table public.users (
    id uuid primary key default gen_random_uuid(),
    address text unique not null,
    alias text not null,
    xp integer default 0,
    level integer default 1,
    streak integer default 0,
    last_deposit_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Vaults
create table public.vaults (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    name text not null,
    icon text not null default '🏠',
    target numeric(18, 2) not null,
    current numeric(18, 2) default 0,
    vault_type text not null,
    beneficiary text,
    locked boolean default false,
    unlock_date timestamptz,
    status text default 'active',
    contract_address text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Activities
create table public.activities (
    id uuid primary key default gen_random_uuid(),
    vault_id uuid not null references public.vaults(id) on delete cascade,
    activity_type text not null,
    amount numeric(18, 2) not null,
    tx_hash text,
    block_number integer,
    metadata jsonb,
    created_at timestamptz default now()
);

-- Transfers (P2P)
create table public.transfers (
    id uuid primary key default gen_random_uuid(),
    from_vault_id uuid not null references public.vaults(id),
    to_alias text not null,
    amount numeric(18, 2) not null,
    status text default 'pending',
    expires_at timestamptz not null,
    confirmed_at timestamptz,
    created_at timestamptz default now()
);

-- Penguin State
create table public.penguin_states (
    user_id uuid primary key references public.users(id) on delete cascade,
    mood text default 'idle',
    accessories jsonb default '[]',
    total_yield_earned numeric(18, 2) default 0,
    updated_at timestamptz default now()
);

-- Notifications
create table public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    title text not null,
    body text,
    notification_type text not null,
    read boolean default false,
    created_at timestamptz default now()
);
```

### 7.2 Row Level Security (RLS)

```sql
-- Habilitar RLS
alter table public.users enable row level security;
alter table public.vaults enable row level security;
alter table public.activities enable row level security;
alter table public.transfers enable row level security;
alter table public.penguin_states enable row level security;
alter table public.notifications enable row level security;

-- Policy ejemplo para vaults
create policy "vaults_select_own"
    on public.vaults for select
    using (
        user_id in (
            select id from public.users 
            where address = current_setting('app.current_address', true)
        )
    );
```

---

## 8. Environment Variables

```bash
# .env.example

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET_KEY=your-super-secret-key-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DAYS=7

# Blockchain (RSK)
RSK_RPC_URL=https://public-node.rsk.co
RSK_CHAIN_ID=30
TROPYKUS_CONTRACT_ADDRESS=0x...

# Smart Contract
VAULT_CONTRACT_ADDRESS=0x...

# App
APP_ENV=development
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:5173,https://ahorrogo.app
```

---

## 9. Quick Start

### 9.1 Instalación

```bash
# Clonar y entrar al directorio
cd backend

# Crear virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Instalar dependencias
pip install -r requirements.txt

# Copiar y configurar environment
cp .env.example .env
# Editar .env con tus credenciales
```

### 9.2 Ejecutar Local

```bash
# Con virtual environment activo
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# API disponible en http://localhost:8000
# Docs en http://localhost:8000/docs
# Redoc en http://localhost:8000/redoc
```

### 9.3 Ejecutar con Docker

```bash
# Build y run
docker-compose up --build

# API disponible en http://localhost:8000
```

### 9.4 Run Tests

```bash
# Todos los tests
pytest

# Con coverage
pytest --cov=app tests/

# Tests específicos
pytest tests/test_vaults.py -v
```

---

## 10. Testing

```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def auth_headers():
    # Generar headers con token válido
    return {"Authorization": "Bearer test_token"}
```

```python
# tests/test_vaults.py
def test_create_vault(client, auth_headers):
    response = client.post(
        "/api/v1/vaults",
        json={
            "name": "Casa",
            "icon": "🏠",
            "target": 10000.00,
            "vault_type": "savings"
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Casa"

def test_deposit_updates_xp(client, auth_headers):
    # Crear vault
    vault_response = client.post(
        "/api/v1/vaults",
        json={...},
        headers=auth_headers
    )
    vault_id = vault_response.json()["id"]
    
    # Depositar
    deposit_response = client.post(
        f"/api/v1/vaults/{vault_id}/deposit",
        json={"amount": 500.00, "tx_hash": "0xabc"},
        headers=auth_headers
    )
    
    assert deposit_response.json()["xp_earned"] == 50  # $500 / $10 = 50 XP
```

---

## 11. API Integration Checklist

```
□  POST   /api/v1/auth/verify              — Verificar signature Beexo
□  GET    /api/v1/users/me                 — Obtener usuario actual
□  GET    /api/v1/users/{address}          — Buscar usuario por address
□  GET    /api/v1/vaults                   — Listar vaults
□  POST   /api/v1/vaults                   — Crear vault
□  GET    /api/v1/vaults/{id}              — Detalle vault
□  PUT    /api/v1/vaults/{id}              — Actualizar vault
□  DELETE /api/v1/vaults/{id}             — Cancelar vault
□  POST   /api/v1/vaults/{id}/deposit      — Registrar depósito
□  GET    /api/v1/vaults/{id}/yield        — Obtener yield
□  GET    /api/v1/penguin                  — Estado penguin
□  POST   /api/v1/transfers               — Crear transferencia
□  GET    /api/v1/transfers/{id}          — Estado transferencia
□  POST   /api/v1/transfers/{id}/confirm  — Confirmar transferencia
□  POST   /api/v1/transfers/{id}/cancel   — Cancelar transferencia
□  POST   /api/v1/webhooks/blockchain     — Webhook blockchain
□  GET    /api/v1/notifications           — Listar notificaciones
□  PUT    /api/v1/notifications/{id}/read — Marcar leída
```

---

## 12. Integración con Frontend

### 12.1 Configuración del Cliente

```typescript
// lib/api.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token')
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })
  
  if (!response.ok) {
    throw new Error(await response.text())
  }
  
  return response.json()
}
```

### 12.2 Ejemplo de Uso

```typescript
// hooks/useVaults.ts
export function useVaults() {
  const [vaults, setVaults] = useState<Vault[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWithAuth('/api/v1/vaults')
      .then(data => setVaults(data.vaults))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { vaults, loading }
}

// hooks/useDeposit.ts
export function useDeposit() {
  const deposit = async (vaultId: string, amount: number, txHash: string) => {
    return fetchWithAuth(`/api/v1/vaults/${vaultId}/deposit`, {
      method: 'POST',
      body: JSON.stringify({ amount, tx_hash: txHash }),
    })
  }

  return { deposit }
}
```

---

*Documentación creada para AhorroGO MVP — Hackathon Rootstock + Beexo Connect*
