# AhorroGO — Especificación Técnica Completa del MVP

## "The Stoic Neon" — Gamified Savings on Bitcoin

**Versión**: 1.0  
**Fecha**: Marzo 2025  
**Stack**: FastAPI + Supabase + React + RSK + Tropykus + Beexo Connect

---

## Tabla de Contenidos

1. [Visión General](#1-visión-general)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Frontend — Especificación UI/UX](#3-frontend--especificación-uiux)
4. [Backend — FastAPI](#4-backend--fastapi)
5. [Base de Datos — Supabase/PostgreSQL](#5-base-de-datos--supabasepostgresql)
6. [Lógica de Negocio](#6-lógica-de-negocio)
7. [Integraciones Blockchain](#7-integraciones-blockchain)
8. [Flujos de Usuario](#8-flujos-de-usuario)
9. [Apéndice: Contratos y Direcciones](#9-apéndice-contratos-y-direcciones)

---

## 1. Visión General

### 1.1 Qué Es AhorroGO

**AhorroGO** es una aplicación de finanzas descentralizadas (DeFi) diseñada para el mercado latinoamericano. Permite a los usuarios ahorrar en dólares digitales (DOC) mientras generan rendimientos automáticamente, todo con una experiencia gamificada que convierte el ahorro en un hábito divertido.

La aplicación resuelve tres dolores principales:
- **Inflación**: El peso/dólar local pierde valor constantemente
- **Fricción DeFi**: Las herramientas actuales son complejas para usuarios no técnicos
- **Falta de disciplina**: Los usuarios rompen sus "chanchitos" ante el primer impulso de consumo

### 1.2 Propuesta de Valor

| Para el Usuario | Para el Ecosistema |
|-----------------|-------------------|
| Ahorro en dólares sin esfuerzo técnico | Onboarding de nuevos usuarios a DeFi |
| Rendimientos automáticos (4-6% APY) | Liquidez para protocolos DeFi |
| Gamificación que forma hábitos | Adopción de Bitcoin/Rootstock |

### 1.3 Stack Tecnológico

```
┌─────────────────────────────────────────────────────────────────┐
│                         STACK COMPLETO                            │
│                                                                 │
│  FRONTEND                    BACKEND                         │
│  ├── React 18              ├── FastAPI (Python)            │
│  ├── Vite                   ├── Supabase Client             │
│  ├── Tailwind CSS           └── Supabase DB (PostgreSQL)    │
│  ├── Framer Motion                                      │
│  ├── Zustand                BLOCKCHAIN                      │
│  └── xo-connect (Beexo)    ├── Rootstock (RSK)            │
│                             ├── Tropykus Protocol            │
│                             └── Smart Contracts (Solidity)   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.4 Roles en el Equipo

| Rol | Responsabilidad |
|-----|-----------------|
| **Frontend** | UI/UX, integración xo-connect, Zustand |
| **Backend** | FastAPI, lógica de negocio, webhooks |
| **Infra** | Supabase, deploy, DB migrations |
| **Blockchain** | Smart contracts, integración Tropykus |

---

## 2. Arquitectura del Sistema

### 2.1 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA AHORROGO                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    FRONTEND (React)                       │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐ │   │
│  │  │  HOME   │  │ VAULTS  │  │ CREATE  │  │ PROFILE │ │   │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘ │   │
│  │       └─────────────┴────────────┴─────────────┘        │   │
│  │                         │                                │   │
│  │                    ┌────┴────┐                         │   │
│  │                    │ Zustand │  ← Estado local         │   │
│  │                    └────┬────┘                         │   │
│  └──────────────────────────┼────────────────────────────────┘   │
│                             │                                     │
│         ┌───────────────────┼───────────────────┐               │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │ xo-connect │    │  Supabase   │    │  ethers.js  │       │
│  │  (Wallet)  │    │   Client    │    │ (RSK RPC)   │       │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘       │
│         │                   │                   │               │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    BACKEND (FastAPI)                     │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐       │   │
│  │  │   Auth     │  │  Webhooks  │  │    API     │       │   │
│  │  │  (Beexo)  │  │ (Blockchain)│  │  REST      │       │   │
│  │  └────────────┘  └────────────┘  └──────┬─────┘       │   │
│  │                                          │               │   │
│  │                  ┌───────────────────────┘               │   │
│  │                  │                                       │   │
│  │                  ▼                                       │   │
│  │         ┌─────────────────┐                           │   │
│  │         │   Supabase DB    │                           │   │
│  │         │  (PostgreSQL)    │                           │   │
│  │         └─────────────────┘                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                     │
│                             │ Events (polling/webhook)           │
│                             ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    BLOCKCHAIN (RSK)                       │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │   │
│  │  │ AhorroVault │    │  Tropykus   │    │    DOC      │ │   │
│  │  │  (Smart    │    │  (cDOC)    │    │ (Stablecoin)│ │   │
│  │  │  Contract) │    │             │    │             │ │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Flujo de Datos Principal

```
1. [USER] Abre app → xo-connect conecta wallet
                │
                ▼
2. [FRONTEND] Solicita signature al usuario
                │
                ▼
3. [BEEXO] Firma con clave privada → Retorna address/alias
                │
                ▼
4. [FRONTEND] Llama GET /api/v1/user/me (con address)
                │
                ▼
5. [FASTAPI] Verifica signature → Busca/Crea usuario en Supabase
                │
                ▼
6. [SUPABASE] Retorna usuario + vaults + penguin state
                │
                ▼
7. [FRONTEND] Renderiza UI con Zustand
                │
                ▼
8. [USER] Deposita $50 a "Casa"
                │
                ▼
9. [FRONTEND] Envía tx via xo-connect → Smart Contract
                │
                ▼
10. [RSK] Ejecuta deposit() → Mint cDOC en Tropykus
                │   Emit evento DepositCompleted
                ▼
11. [FRONTEND] Recibe tx hash → Polls backend
                │
                ▼
12. [FASTAPI] Recibe webhook → Actualiza XP, streak, vault
                │
                ▼
13. [SUPABASE] Realtime → FRONTEND recibe update
                │
                ▼
14. [FRONTEND] Actualiza Zustand → Muestra animación happy
```

### 2.3 Decisiones Arquitectónicas

| Decisión | Alternativa Considerada | Justificación |
|----------|------------------------|--------------|
| **Backend en FastAPI** | Node.js, Next.js | Python es nativo para el equipo backend |
| **Supabase para DB** | Firebase, PlanetScale | PostgreSQL nativo, RLS, Realtime built-in |
| **Zustand para estado** | Redux, Context API | Boilerplate mínimo, persistencia fácil |
| **xo-connect para wallet** | Web3Modal, WalletConnect | Nativo de Beexo, mejor UX |
| **Polling para eventos** | WebSockets desde blockchain | Más simple, suficiente para MVP |

---

## 3. Frontend — Especificación UI/UX

### 3.1 Sistema de Diseño: "The Stoic Neon"

#### Paleta de Colores

| Token | Hex | Uso |
|-------|-----|-----|
| `surface` | `#0e0e0e` | Background principal (OLED black) |
| `surface-container-low` | `#131313` | Grupos secundarios |
| `surface-container-high` | `#201f1f` | Cards principales |
| `surface-container-highest` | `#262626` | Elementos elevados |
| `primary` | `#9cff93` | Crecimiento, savings, CTAs |
| `primary-container` | `#00fc40` | Gradiente objetivo |
| `secondary` | `#c97cff` | Vaults, locks, lógica |
| `on-primary` | `#006413` | Texto sobre verde |
| `on-secondary` | `#350056` | Texto sobre púrpura |

#### Tipografía

| Familia | Uso | Google Font |
|---------|-----|-------------|
| **Plus Jakarta Sans** | Display, headlines | `Plus+Jakarta+Sans` |
| **Manrope** | Body, labels | `Manrope` |

| Estilo | Size | Weight | Uso |
|--------|------|--------|-----|
| `display-lg` | 3.5rem | 700 | Balance principal |
| `headline-lg` | 2rem | 700 | Títulos de sección |
| `body-lg` | 1rem | 400 | Texto principal |
| `label-md` | 0.75rem | 400 | Micro-copy |

#### Espaciado (8pt Grid)

| Token | Valor | Uso |
|-------|-------|-----|
| `spacing-2` | 8px | Gaps inline |
| `spacing-4` | 16px | Padding de cards |
| `spacing-8` | 32px | Separación de secciones |

#### Sombras y Elevación

**Regla**: No usar sombras tradicionales. Usar tonalidad de color para jerarquía.

| Nivel | Background | Uso |
|-------|-----------|-----|
| 0 | `#0e0e0e` | Base |
| 1 | `#131313` | Listas secundarias |
| 2 | `#201f1f` | Cards interactivas |
| 3 | `#262626` | Modals, overlays |

#### Glassmorphism

```css
/* Para overlays y elementos flotantes */
background: rgba(38, 38, 38, 0.6);
backdrop-filter: blur(12px);
```

### 3.2 Componentes Core

#### Button

```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

// Primary: gradient primary + on-primary text
// Secondary: secondary bg + on-secondary text
// Ghost: transparent bg + primary text
```

#### VaultCard

```tsx
interface VaultCardProps {
  vault: {
    id: string;
    name: string;
    icon: string; // emoji
    current: number;
    target: number;
    locked: boolean;
    unlockDate?: Date;
    vaultType: 'savings' | 'rental' | 'p2p';
    beneficiary?: string;
  };
  variant: 'compact' | 'expanded';
  onPress: () => void;
}
```

#### ProgressBar (Dual-Dimension)

```tsx
interface ProgressBarProps {
  value: number; // 0-100 (porcentaje de dinero)
  timeProgress?: number; // 0-100 (porcentaje temporal)
  showLabel?: boolean;
  animated?: boolean;
}

// El primer bar representa el progreso del ahorro (verde)
// El segundo (opcional) representa el tiempo transcurrido (púrpura, 2px)
```

#### PenguinWidget

```tsx
interface PenguinWidgetProps {
  state: 'idle' | 'happy' | 'celebrating' | 'waiting';
  accessories?: string[];
  level: number;
  interaction?: 'pointing' | 'idle';
  partial?: boolean; // Para que "pique" de los cards
}
```

#### Input

```tsx
interface InputProps {
  type: 'text' | 'number' | 'currency';
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  prefix?: string; // '$'
  suffix?: string; // 'USD'
}
```

### 3.3 Pantallas

#### Home Screen

```
┌─────────────────────────────────────┐
│ [≡]                         [🔔][👤]│
├─────────────────────────────────────┤
│                                     │
│   TU PATRIMONIO DIGITAL            │
│                                     │
│   ████████████████████████████████│
│   █                               █│
│   █    $12,450.00 USD             █│
│   █                               █│
│   ████████████████████████████████│
│                                     │
│   +$245.50 este mes      ↗ 5.2%   │
│                                     │
├─────────────────────────────────────┤
│                                     │
│   🔐 TUS VAULTS (3)    [Ver todas]│
│                                     │
│   ┌─────────────────────────────┐  │
│   │ 🏠 Casa          $4,200     │  │
│   │ ██████████░░░░░░░░  42%   │  │
│   │ 180 días restantes          │  │
│   └─────────────────────────────┘  │
│                                     │
│   ┌─────────────────────────────┐  │
│   │ 🚗 Auto          $1,800    │  │
│   │ ██████░░░░░░░░░░░░  18%  │  │
│   └─────────────────────────────┘  │
│                                     │
│          🐧 (partial, pointing)   │
│                                     │
│   ┌─────────────────────────────┐  │
│   │   [+ DEPOSITAR A VAULT]    │  │
│   └─────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│    🏠      🔐       +       👤    │
│   Home   Vaults   Create   Profile  │
└─────────────────────────────────────┘
```

#### Vault Detail

```
┌─────────────────────────────────────┐
│ [←]                         [⋮][📤]│
├─────────────────────────────────────┤
│                                     │
│   🏠 CASA                          │
│                                     │
│   ████████████████████████████████│
│   █    $4,200 / $10,000          █│
│   ████████████████████████████████│
│                                     │
│   ████████████░░░░░░░░░░  42%   │
│   ████░░░░░░░░░░░░░░░░░░░░░░░░ │
│   180 días restantes               │
│                                     │
├─────────────────────────────────────┤
│                                     │
│   DETALLES DEL CANDADO             │
│   ─────────────────────────────    │
│   🔒 Lock activo hasta: Dic 2025   │
│   ⏰ Tiempo restante: 6 meses      │
│   📈 Yield: +$89.50 este año      │
│                                     │
├─────────────────────────────────────┤
│                                     │
│   ACTIVIDAD RECIENTE               │
│   ─────────────────────────────    │
│                                     │
│   📅 Mar 15, 2025                 │
│   +$500 depositados                │
│   Yield: +$2.15                    │
│                                     │
│   📅 Feb 15, 2025                  │
│   +$500 depositados                │
│                                     │
├─────────────────────────────────────┤
│                                     │
│   [+ AGREGAR FONDOS]  [TRANSFERIR] │
│                                     │
└─────────────────────────────────────┘
```

#### Create Vault Flow (3 pasos)

**Paso 1**: Elegir tipo (Ahorro propio / Garantía de alquiler)

**Paso 2**: Configurar
- Nombre del vault
- Icono (emoji)
- Meta de ahorro ($)
- Fecha estimada (opcional)
- Activar candado (toggle)

**Paso 3**: Confirmar
- Resumen
- Warning si hay candado
- CTA "Crear Vault"

### 3.4 Animaciones

```css
/* Idle bounce (cada 3s) */
@keyframes penguin-idle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* Happy jump (post-deposit) */
@keyframes penguin-happy {
  0% { transform: translateY(0) scale(1); }
  30% { transform: translateY(-20px) scale(1.1); }
  100% { transform: translateY(0) scale(1) rotate(0); }
}

/* Celebrating (goal completed) */
@keyframes penguin-celebrating {
  0% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.3) rotate(180deg); }
  100% { transform: scale(1) rotate(360deg); }
}

/* Confetti */
@keyframes confetti {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(400px) rotate(720deg); opacity: 0; }
}
```

### 3.5 Reglas de UX

| Regla | Descripción |
|-------|-------------|
| **Max 3-4 touches** | Cualquier acción principal en máximo 4 toques |
| **No jerga blockchain** | El usuario no debe saber que está en blockchain |
| **Celebrar cada depósito** | Feedback inmediato con animación |
| **Penguin siempre presente** | Guía al usuario y genera conexión emocional |
| **No borders** | Separar con cambios de color, no con líneas |

---

## 4. Backend — FastAPI

### 4.1 Stack

```
FastAPI
├── Python 3.11+
├── SQLAlchemy 2.0 (ORM)
├── Supabase Python Client
├── Pydantic v2 (validation)
├── python-jose (JWT)
├── httpx (async HTTP)
└── ethers (blockchain reads)
```

### 4.2 Estructura del Proyecto

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry
│   ├── config.py               # Settings
│   ├── database.py             # Supabase connection
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py            # Dependencies (auth, db session)
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py      # Main router
│   │       ├── users.py       # /users endpoints
│   │       ├── vaults.py      # /vaults endpoints
│   │       ├── penguin.py     # /penguin endpoints
│   │       └── webhooks.py    # /webhooks endpoints
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py        # Signature verification
│   │   ├── auth.py           # Beexo auth
│   │   └── signatures.py      # Message signing
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── user_service.py
│   │   ├── vault_service.py
│   │   ├── xp_service.py     # XP/Level calculations
│   │   ├── streak_service.py
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
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_users.py
│   ├── test_vaults.py
│   └── test_xp.py
│
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

### 4.3 Modelos Pydantic (Request/Response)

```python
# app/models/schemas.py

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

# ─── Enums ────────────────────────────────────────────────────────

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

# ─── User ───────────────────────────────────────────────────────

class UserBase(BaseModel):
    address: str = Field(..., description="Beexo wallet address")
    alias: str = Field(..., description="User alias e.g., juan.bexo")

class UserCreate(UserBase):
    signature: str = Field(..., description="Signature from Beexo")
    message: str = Field(..., description="Message that was signed")

class UserResponse(UserBase):
    id: str
    xp: int = 0
    level: int = 1
    streak: int = 0
    last_deposit_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ─── Vault ───────────────────────────────────────────────────────

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
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @property
    def progress(self) -> float:
        if self.target == 0:
            return 0
        return min(self.current / self.target, 1.0)

class VaultWithActivities(VaultResponse):
    activities: List["ActivityResponse"] = []

# ─── Activity ───────────────────────────────────────────────────

class ActivityBase(BaseModel):
    activity_type: ActivityType
    amount: float
    tx_hash: Optional[str] = None

class ActivityCreate(ActivityBase):
    vault_id: str

class ActivityResponse(ActivityBase):
    id: str
    vault_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# ─── Penguin ────────────────────────────────────────────────────

class PenguinState(BaseModel):
    xp: int
    level: int
    mood: PenguinMood
    streak: int
    accessories: List[str] = []
    total_saved: float
    yield_earned: float
    goals_completed: int

class PenguinResponse(BaseModel):
    xp: int
    level: int
    mood: PenguinMood
    streak: int
    accessories: List[str]
    total_saved: float
    yield_earned: float
    goals: List[VaultResponse]

# ─── Deposit ────────────────────────────────────────────────────

class DepositRequest(BaseModel):
    vault_id: str
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

# ─── Transfer (P2P) ────────────────────────────────────────────

class TransferCreate(BaseModel):
    vault_id: str
    recipient_alias: str
    amount: float = Field(..., gt=0)

class TransferResponse(BaseModel):
    id: str
    status: str  # pending, confirmed, cancelled
    expires_at: datetime

# ─── Webhook ────────────────────────────────────────────────────

class BlockchainEvent(BaseModel):
    event: str  # "DepositCompleted", "WithdrawCompleted"
    tx_hash: str
    user_address: str
    amount: float
    vault_id: Optional[int] = None
    block_number: int
    timestamp: int

# ─── Notification ──────────────────────────────────────────────

class NotificationResponse(BaseModel):
    id: str
    title: str
    body: Optional[str] = None
    type: str
    read: bool
    created_at: datetime

# ─── Yield ────────────────────────────────────────────────────

class YieldResponse(BaseModel):
    vault_id: str
    yield_earned: float
    current_balance: float
    apy_estimate: float

# ─── Update forward references ──────────────────────────────────

VaultWithActivities.model_rebuild()
```

### 4.4 Endpoints API

#### Autenticación

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
  "user": UserResponse,
  "token": "jwt_token_here"
}

Response 401:
{
  "detail": "Invalid signature"
}
```

#### Usuarios

```
GET /api/v1/users/me
────────────────────
Obtiene usuario actual (del JWT).

Headers:
  Authorization: Bearer <token>

Response 200:
UserResponse

Response 404:
{
  "detail": "User not found"
}


GET /api/v1/users/{address}
───────────────────────────
Obtiene usuario por address (para verificar propietarios de rental).

Response 200:
{
  "address": "0x1234...",
  "alias": "juan.bexo",
  "has_active_guarantee": true
}
```

#### Vaults

```
GET /api/v1/vaults
──────────────────
Lista todos los vaults del usuario actual.

Response 200:
{
  "vaults": [VaultResponse, ...],
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
VaultResponse


GET /api/v1/vaults/{vault_id}
───────────────────────────────
Obtiene detalle de un vault.

Response 200:
VaultWithActivities


PUT /api/v1/vaults/{vault_id}
───────────────────────────────
Actualiza un vault (solo nombre/icon).

Request:
{
  "name": "Casa",
  "icon": "🏠"
}

Response 200:
VaultResponse


DELETE /api/v1/vaults/{vault_id}
────────────────────────────────
Cancela un vault (solo si no está locked o si está completed).

Response 204: No content

Response 400:
{
  "detail": "Cannot cancel vault with active lock"
}
```

#### Depósitos

```
POST /api/v1/vaults/{vault_id}/deposit
─────────────────────────────────────
Registra un depósito (llamado después de confirmación en blockchain).

Request:
{
  "amount": 500.00,
  "tx_hash": "0xabcd1234..."
}

Response 200:
DepositResponse:
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
```

#### Penguins (Gamificación)

```
GET /api/v1/penguin
───────────────────
Obtiene estado completo del penguin.

Response 200:
PenguinResponse:
{
  "xp": 350,
  "level": 3,
  "mood": "happy",
  "streak": 5,
  "accessories": ["phone", "sunglasses"],
  "total_saved": 12450.00,
  "yield_earned": 245.50,
  "goals": [VaultResponse, ...]
}
```

#### Transfers (P2P)

```
POST /api/v1/transfers
───────────────────────
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
  "status": "pending" | "confirmed" | "cancelled" | "expired",
  "from_vault": VaultResponse,
  "to_alias": "maria.bexo",
  "amount": 450.00
}


POST /api/v1/transfers/{transfer_id}/confirm
────────────────────────────────────────────
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

#### Yield

```
GET /api/v1/vaults/{vault_id}/yield
──────────────────────────────────
Obtiene yield generado por un vault.

Response 200:
{
  "vault_id": "uuid",
  "yield_earned": 89.50,
  "current_balance": 4289.50,
  "apy_estimate": 0.052
}
```

#### Webhooks

```
POST /api/v1/webhooks/blockchain
───────────────────────────────
Recibe eventos de blockchain (o llamado por frontend post-tx).

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

#### Notificaciones

```
GET /api/v1/notifications
─────────────────────────
Lista notificaciones del usuario.

Query params:
  - unread_only: bool = false

Response 200:
{
  "notifications": [NotificationResponse, ...]
}


PUT /api/v1/notifications/{id}/read
──────────────────────────────────
Marca notificación como leída.

Response 200:
{
  "success": true
}
```

### 4.5 Lógica de Auth (Beexo Signature)

```python
# app/core/security.py

import hashlib
import hmac
from web3 import Web3
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

# Mensaje que espera Beexo para firmar
AUTH_MESSAGE = "Sign this to authenticate with AhorroGO"
AUTH_MESSAGE_HASH = Web3.keccak(text=AUTH_MESSAGE).hex()

async def verify_beexo_signature(
    address: str,
    signature: str,
    message: str = AUTH_MESSAGE
) -> bool:
    """
    Verifica que la firma es válida para la address dada.
    Usa eth_account persönliche_sign verification.
    """
    # El mensaje firmado debe ser el AUTH_MESSAGE_HASH
    expected_hash = Web3.keccak(text=message).hex()
    
    # Recrear la dirección del firmante
    # Esto depende de la implementación específica de Beexo
    # Por lo general: recover_address_from_message(message, signature)
    
    # Ejemplo conceptual (ajustar según docs de Beexo):
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
        # Decodificar JWT
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        address = payload.get("sub")
        
        if not address:
            raise HTTPException(401, "Invalid token")
        
        # Obtener usuario de DB
        user = await user_service.get_by_address(db, address)
        if not user:
            raise HTTPException(401, "User not found")
        
        return user
        
    except jwt.JWTError:
        raise HTTPException(401, "Invalid token")
```

### 4.6 Ejemplo de Servicio

```python
# app/services/xp_service.py

from app.models.schemas import XP_PER_LEVEL, ACCESSORIES_BY_LEVEL

# Constantes de gamificación
XP_PER_DEPOSIT = 10  # 1 XP por cada $10
XP_COMPLETION_BONUS = 100  # Bonus por completar meta
STREAK_RESET_DAYS = 60  # Días sin depósito para resetear streak

def calculate_level(xp: int) -> int:
    """Calcula nivel (1-5) basado en XP total."""
    for level in range(5, 0, -1):
        if xp >= XP_PER_LEVEL[level - 1]:
            return level
    return 1

def calculate_accessories(level: int, completed_goal_names: list) -> list:
    """Calcula accesorios desbloqueados."""
    accessories = list(ACCESSORIES_BY_LEVEL.get(level, []))
    
    # Accesorios por meta completada
    GOAL_ACCESSORIES = {
        "celular": "phone",
        "vacaciones": "sunglasses",
        "casa": "house",
    }
    
    for goal_name in completed_goal_names:
        accessory = GOAL_ACCESSORIES.get(goal_name.lower())
        if accessory and accessory not in accessories:
            accessories.append(accessory)
    
    return accessories

def calculate_streak(
    last_deposit_at: Optional[datetime],
    current_deposit_at: datetime
) -> tuple[int, bool]:
    """
    Calcula streak actualizado.
    Retorna (nuevo_streak, incremento).
    """
    if not last_deposit_at:
        return 1, True  # Primer depósito
    
    days_diff = (current_deposit_at - last_deposit_at).days
    
    if days_diff > STREAK_RESET_DAYS:
        return 1, False  # Streak reseteado
    
    # Check si es nuevo mes
    last_month = last_deposit_at.month
    last_year = last_deposit_at.year
    current_month = current_deposit_at.month
    current_year = current_deposit_at.year
    
    if (current_year > last_year) or (current_month > last_month):
        return current_streak + 1, True  # Incremento de mes
    
    return current_streak, False  # Mismo mes, no cambia

def determine_mood(
    streak: int,
    last_deposit_at: Optional[datetime],
    xp: int
) -> str:
    """Determina el mood del penguin basado en estado."""
    if not last_deposit_at:
        return "idle"
    
    days_since = (datetime.utcnow() - last_deposit_at).days
    
    if days_since > 30:
        return "waiting"  # Aburrido, hace mucho que no deposita
    
    if streak >= 6:
        return "happy"  # Fire alto, está tranquilo
    
    return "idle"
```

---

## 5. Base de Datos — Supabase/PostgreSQL

### 5.1 Schema Completo

```sql
-- ================================================================
-- AHORROGO — Supabase PostgreSQL Schema
-- ================================================================

-- ─── Users ─────────────────────────────────────────────────────

create table public.users (
    id uuid primary key default gen_random_uuid(),
    address text unique not null,  -- Beexo wallet address (checksummed)
    alias text not null,          -- e.g., 'juan.bexo'
    xp integer default 0,
    level integer default 1 constraint level_range check (level between 1 and 5),
    streak integer default 0 constraint streak_non_negative check (streak >= 0),
    last_deposit_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Índice para búsqueda por address (auth más rápido)
create unique index idx_users_address on public.users(address);
create index idx_users_alias on public.users(alias);

-- ─── Vaults ────────────────────────────────────────────────────

create table public.vaults (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    name text not null constraint name_length check (length(name) <= 100),
    icon text not null default '🏠',
    target numeric(18, 2) not null constraint target_positive check (target > 0),
    current numeric(18, 2) default 0 constraint current_non_negative check (current >= 0),
    vault_type text not null constraint vault_type_enum check (
        vault_type in ('savings', 'rental', 'p2p')
    ),
    beneficiary text,  -- Para rental: alias del propietario
    locked boolean default false,
    unlock_date timestamptz,
    status text default 'active' constraint status_enum check (
        status in ('active', 'completed', 'cancelled')
    ),
    contract_address text,  -- Address del vault en blockchain (para audits)
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    
    constraint vault_target_current check (current <= target + (target * 0.01))  -- 1% tolerancia
);

create index idx_vaults_user_id on public.vaults(user_id);
create index idx_vaults_status on public.vaults(status);
create index idx_vaults_type on public.vaults(vault_type);

-- ─── Activities ───────────────────────────────────────────────

create table public.activities (
    id uuid primary key default gen_random_uuid(),
    vault_id uuid not null references public.vaults(id) on delete cascade,
    activity_type text not null constraint activity_type_enum check (
        activity_type in ('deposit', 'withdraw', 'yield', 'transfer')
    ),
    amount numeric(18, 2) not null,
    tx_hash text,  -- Blockchain transaction hash
    block_number integer,
    metadata jsonb,  -- Datos extra (e.g., recipient_alias para transfers)
    created_at timestamptz default now()
);

create index idx_activities_vault_id on public.activities(vault_id);
create index idx_activities_type on public.activities(activity_type);
create index idx_activities_created on public.activities(created_at desc);
create index idx_activities_tx_hash on public.activities(tx_hash) where tx_hash is not null;

-- ─── Transfers (P2P) ───────────────────────────────────────────

create table public.transfers (
    id uuid primary key default gen_random_uuid(),
    from_vault_id uuid not null references public.vaults(id),
    to_alias text not null,  -- Alias del beneficiario
    amount numeric(18, 2) not null constraint transfer_amount check (amount > 0),
    status text default 'pending' constraint transfer_status check (
        status in ('pending', 'confirmed', 'cancelled', 'expired')
    ),
    expires_at timestamptz not null,
    confirmed_at timestamptz,
    created_at timestamptz default now()
);

create index idx_transfers_from_vault on public.transfers(from_vault_id);
create index idx_transfers_status on public.transfers(status);
create index idx_transfers_expires on public.transfers(expires_at);

-- ─── Penguin State (denormalized) ─────────────────────────────

create table public.penguin_states (
    user_id uuid primary key references public.users(id) on delete cascade,
    mood text default 'idle' constraint mood_enum check (
        mood in ('idle', 'happy', 'celebrating', 'waiting')
    ),
    accessories jsonb default '[]',
    total_yield_earned numeric(18, 2) default 0,
    updated_at timestamptz default now()
);

-- ─── Notifications ────────────────────────────────────────────

create table public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    title text not null,
    body text,
    notification_type text not null,
    read boolean default false,
    created_at timestamptz default now()
);

create index idx_notifications_user_id on public.notifications(user_id);
create index idx_notifications_unread on public.notifications(user_id, read) where not read;
create index idx_notifications_created on public.notifications(created_at desc);

-- ─── Audit Log ────────────────────────────────────────────────

create table public.audit_log (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.users(id),
    action text not null,
    entity_type text,  -- 'vault', 'user', 'transfer'
    entity_id uuid,
    metadata jsonb,
    created_at timestamptz default now()
);

create index idx_audit_user on public.audit_log(user_id);
create index idx_audit_entity on public.audit_log(entity_type, entity_id);

-- ================================================================
-- TRIGGERS AUTO-UPDATE
-- ================================================================

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_updated_at
    before update on public.users
    for each row execute function public.handle_updated_at();

create trigger set_updated_at
    before update on public.vaults
    for each row execute function public.handle_updated_at();

create trigger set_penguin_updated_at
    before update on public.penguin_states
    for each row execute function public.handle_updated_at();

-- ================================================================
-- FUNCTIONS
-- ================================================================

-- Calculate level from XP
create or replace function public.calculate_level(p_xp integer)
returns integer as $$
begin
    if p_xp >= 1000 then return 5;
    elsif p_xp >= 600 then return 4;
    elsif p_xp >= 300 then return 3;
    elsif p_xp >= 100 then return 2;
    else return 1;
    end if;
end;
$$ language plpgsql immutable;

-- Get total saved across all vaults
create or replace function public.get_total_saved(p_user_id uuid)
returns numeric(18, 2) as $$
declare
    v_total numeric(18, 2);
begin
    select coalesce(sum(current), 0) into v_total
    from public.vaults
    where user_id = p_user_id and status = 'active';
    
    return v_total;
end;
$$ language plpgsql;

-- Get completed goals count
create or replace function public.get_completed_goals_count(p_user_id uuid)
returns integer as $$
declare
    v_count integer;
begin
    select count(*) into v_count
    from public.vaults
    where user_id = p_user_id and status = 'completed';
    
    return v_count;
end;
$$ language plpgsql;

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

alter table public.users enable row level security;
alter table public.vaults enable row level security;
alter table public.activities enable row level security;
alter table public.transfers enable row level security;
alter table public.penguin_states enable row level security;
alter table public.notifications enable row level security;

-- Users: users can only see their own row
create policy "users_select_own"
    on public.users for select
    using (address = current_setting('app.current_address', true));

create policy "users_update_own"
    on public.users for update
    using (address = current_setting('app.current_address', true));

-- Vaults: users can only see their own vaults
create policy "vaults_select_own"
    on public.vaults for select
    using (
        user_id in (
            select id from public.users 
            where address = current_setting('app.current_address', true)
        )
    );

create policy "vaults_insert_own"
    on public.vaults for insert
    with check (
        user_id in (
            select id from public.users 
            where address = current_setting('app.current_address', true)
        )
    );

create policy "vaults_update_own"
    on public.vaults for update
    using (
        user_id in (
            select id from public.users 
            where address = current_setting('app.current_address', true)
        )
    );

-- Activities: follow vault access
create policy "activities_select_own"
    on public.activities for select
    using (
        vault_id in (
            select id from public.vaults 
            where user_id in (
                select id from public.users 
                where address = current_setting('app.current_address', true)
            )
        )
    );

create policy "activities_insert_own"
    on public.activities for insert
    with check (
        vault_id in (
            select id from public.vaults 
            where user_id in (
                select id from public.users 
                where address = current_setting('app.current_address', true)
            )
        )
    );

-- Notifications: users can only see their own
create policy "notifications_select_own"
    on public.notifications for select
    using (
        user_id in (
            select id from public.users 
            where address = current_setting('app.current_address', true)
        )
    );

create policy "notifications_update_own"
    on public.notifications for update
    using (
        user_id in (
            select id from public.users 
            where address = current_setting('app.current_address', true)
        )
    );

-- Penguin states: follow user
create policy "penguin_select_own"
    on public.penguin_states for select
    using (
        user_id in (
            select id from public.users 
            where address = current_setting('app.current_address', true)
        )
    );

create policy "penguin_update_own"
    on public.penguin_states for update
    using (
        user_id in (
            select id from public.users 
            where address = current_setting('app.current_address', true)
        )
    );

-- ================================================================
-- REALTIME
-- ================================================================

-- Enable realtime for relevant tables
alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.penguin_states;
alter publication supabase_realtime add table public.vaults;

-- ================================================================
-- SEED DATA (opcional, para desarrollo)
-- ================================================================

-- Insert test user
insert into public.users (address, alias) values
    ('0x742d35Cc6634C0532925a3b844Bc9e7595f42bE7', 'juan.bexo'),
    ('0x8ba1f109551bD432803012645Ac136def546B523', 'maria.bexo');
```

### 5.2 Constantes de Gamificación ( código)

```python
# app/core/constants.py

# XP thresholds for each level
XP_PER_LEVEL = {
    1: 0,      # Level 1: 0-99 XP
    2: 100,    # Level 2: 100-299 XP
    3: 300,    # Level 3: 300-599 XP
    4: 600,    # Level 4: 600-999 XP
    5: 1000,   # Level 5: 1000+ XP
}

# Accessories unlocked at each level
ACCESSORIES_BY_LEVEL = {
    1: [],           # Ninguno
    2: ["basic_outfit"],
    3: ["phone"],
    4: ["sunglasses", "hat"],
    5: ["aura", "crown"]
}

# Accessories unlocked by completing goals
GOAL_ACCESSORIES = {
    "celular": "phone",
    "vacaciones": "sunglasses",
    "casa": "house",
    "auto": "car",
    "viaje": "airplane",
    "carrera": "graduation_cap"
}

# XP rewards
XP_PER_DEPOSIT = 10  # 1 XP per $10 deposited
XP_COMPLETION_BONUS = 100  # Bonus XP when completing a goal
XP_YIELD_PERCENT = 0.01  # 1 XP per $1 of yield earned

# Streak rules
STREAK_RESET_DAYS = 60  # Days without deposit to reset streak

# Yield (Tropykus APY)
TROPYKUS_APY = 0.052  # 5.2% APY

# Transfer rules
TRANSFER_EXPIRY_HOURS = 24  # P2P transfers expire after 24 hours
```

---

## 6. Lógica de Negocio

### 6.1 Reglas de Negocio Principales

#### Vaults

| Regla | Descripción |
|-------|-------------|
| **Creación** | Cualquier usuario puede crear vaults ilimitados |
| **Target mínimo** | $10 USD (para evitar dust) |
| **Target máximo** | $1,000,000 USD |
| **Lock** | Solo se puede activar al crear, no se puede desactivar |
| **Unlock date** | Debe ser al menos 30 días en el futuro |
| **Cancelación** | Solo si status = 'active' Y locked = false |

#### Depósitos

| Regla | Descripción |
|-------|-------------|
| **Monto mínimo** | $1 USD |
| **Monto máximo** | Sin límite |
| **Frecuencia** | Sin límite |
| **Confirmación** | Requiere tx_hash válido de RSK |

#### XP y Nivel

| Acción | XP |
|--------|-----|
| Depósito | $10 = 1 XP |
| Meta completada | +100 XP bonus |
| Yield recibido | $1 = 1 XP |

#### Streaks

| Regla | Descripción |
|-------|-------------|
| **Incremento** | Un nuevo depósito en un nuevo mes calendario |
| **Reset** | Si pasan 60+ días sin depósitos |
| **Visualización** | 🔥 + número de meses |

### 6.2 Flujo: Crear Vault

```python
async def create_vault(user: User, data: VaultCreate, db: Session) -> Vault:
    """
    1. Validar que el nombre no existe para este usuario
    2. Validar unlock_date si locked = True
    3. Crear vault en DB
    4. Inicializar penguin_state si no existe
    5. Return vault
    """
    # 1. Validación de nombre único
    existing = await vault_service.get_by_name(db, user.id, data.name)
    if existing:
        raise HTTPException(400, "Ya tienes un vault con ese nombre")
    
    # 2. Validar unlock_date
    if data.locked and not data.unlock_date:
        raise HTTPException(400, "Vaults bloqueados requieren unlock_date")
    
    if data.unlock_date:
        min_date = datetime.utcnow() + timedelta(days=30)
        if data.unlock_date < min_date:
            raise HTTPException(400, "Unlock date debe ser al menos 30 días en el futuro")
    
    # 3. Crear vault
    vault = Vault(
        user_id=user.id,
        name=data.name,
        icon=data.icon,
        target=data.target,
        vault_type=data.vault_type.value,
        beneficiary=data.beneficiary,
        locked=data.locked,
        unlock_date=data.unlock_date,
        status=VaultStatus.ACTIVE.value
    )
    db.add(vault)
    
    # 4. Inicializar penguin_state si no existe
    penguin = await penguin_service.get_or_create(db, user.id)
    
    # 5. Commit y return
    await db.commit()
    await db.refresh(vault)
    
    return vault
```

### 6.3 Flujo: Registrar Depósito

```python
async def process_deposit(
    vault_id: str,
    amount: Decimal,
    tx_hash: str,
    db: Session
) -> DepositResponse:
    """
    1. Verificar que vault existe y está activo
    2. Verificar que tx_hash no fue procesado antes (idempotencia)
    3. Actualizar vault.current
    4. Si current >= target, marcar como completed
    5. Calcular XP ganado
    6. Actualizar usuario (XP, streak)
    7. Crear actividad
    8. Actualizar penguin mood
    9. Return con todo actualizado
    """
    # 1. Obtener vault
    vault = await vault_service.get(db, vault_id)
    if not vault:
        raise HTTPException(404, "Vault not found")
    
    if vault.status != VaultStatus.ACTIVE:
        raise HTTPException(400, "Vault no está activo")
    
    # 2. Idempotencia por tx_hash
    existing = await activity_service.get_by_tx_hash(db, tx_hash)
    if existing:
        raise HTTPException(400, "Esta transacción ya fue procesada")
    
    # 3. Actualizar vault
    vault.current += float(amount)
    
    # 4. Check completion
    completed = False
    if vault.current >= vault.target:
        vault.status = VaultStatus.COMPLETED
        completed = True
    
    # 5. Calcular XP
    xp_deposit = int(float(amount) / 10)  # 1 XP per $10
    xp_bonus = XP_COMPLETION_BONUS if completed else 0
    total_xp = xp_deposit + xp_bonus
    
    # 6. Obtener usuario y actualizar XP/streak
    user = await user_service.get(db, vault.user_id)
    old_level = user.level
    
    user.xp += total_xp
    user.level = calculate_level(user.xp)
    
    # Actualizar streak
    new_streak, incremented = calculate_streak(
        user.last_deposit_at,
        datetime.utcnow()
    )
    user.streak = new_streak
    user.last_deposit_at = datetime.utcnow()
    
    # 7. Crear actividad
    activity = Activity(
        vault_id=vault_id,
        activity_type=ActivityType.DEPOSIT.value,
        amount=float(amount),
        tx_hash=tx_hash
    )
    db.add(activity)
    
    # 8. Actualizar penguin
    mood = determine_mood(user.streak, user.last_deposit_at, user.xp)
    await penguin_service.update_mood(db, user.id, mood)
    
    # 9. Commit
    await db.commit()
    
    return DepositResponse(
        success=True,
        xp_earned=total_xp,
        new_xp=user.xp,
        new_level=user.level,
        streak=user.streak,
        streak_incremented=incremented,
        vault_progress=vault.current / vault.target if vault.target > 0 else 0,
        mood=mood
    )
```

### 6.4 Flujo: Garantía de Alquiler

```python
async def verify_rental_guarantee(
    tenant_address: str,
    amount: Decimal,
    owner_alias: str,
    db: Session
) -> dict:
    """
    Para verificación de garantía de alquiler:
    1. Buscar vault activo del tenant con ese amount o mayor
    2. Verificar que el beneficiary = owner_alias
    3. Verificar que está locked
    4. Return con datos de verificación
    """
    # 1. Buscar vault
    vault = await vault_service.get_active_by_user_and_amount(
        db, tenant_address, float(amount)
    )
    
    if not vault:
        return {
            "verified": False,
            "reason": "No existe vault activo con ese monto"
        }
    
    # 2. Verificar beneficiary
    if vault.beneficiary != owner_alias:
        return {
            "verified": False,
            "reason": "El vault no está a nombre del propietario indicado"
        }
    
    # 3. Verificar lock
    if not vault.locked:
        return {
            "verified": False,
            "reason": "El vault no está bloqueado"
        }
    
    return {
        "verified": True,
        "vault_id": vault.id,
        "amount": vault.current,
        "unlock_date": vault.unlock_date,
        "message": "Garantía verificada correctamente"
    }
```

---

## 7. Integraciones Blockchain

### 7.1 Rootstock (RSK)

**Red**: Testnet  
**ChainId**: `0x1f13` (7799 en decimal)  
**RPC**: `https://public-node.testnet.rsk.co`  
**Explorer**: `https://explorer.testnet.rootstock.io`

```python
# app/services/blockchain_service.py

from ethers import ethers

# Conexión a RSK
RSK_RPC = "https://public-node.testnet.rsk.co"
rsk_provider = ethers.providers.JsonRpcProvider(RSK_RPC)

# Funciones helper
async def get_transaction_receipt(tx_hash: str) -> dict:
    """Obtiene receipt de una transacción."""
    return await rsk_provider.get_transaction_receipt(tx_hash)

async def get_block_number() -> int:
    """Obtiene block number actual."""
    return await rsk_provider.get_block_number()

async def is_valid_address(address: str) -> bool:
    """Valida que una dirección sea válida."""
    return ethers.utils.is_address(address)
```

### 7.2 Contrato AhorroVault (Interface)

```solidity
// contracts/interfaces/IAhorroVault.sol

interface IAhorroVault {
    // Tipos
    enum GoalType { celular, vacaciones, casa, auto, viaje, carrera }
    enum VaultStatus { AVAILABLE, LOCKED, RENTAL_GUARANTEE, P2P_PENDING, COMPLETED }
    
    // Structs
    struct VaultInfo {
        uint256 id;
        address owner;
        GoalType goalType;
        uint256 target;
        uint256 current;
        uint256 lockedUntil;
        address beneficiary;  // Para rental
        VaultStatus status;
    }
    
    // Events
    event DepositCompleted(
        address indexed user,
        uint256 indexed vaultId,
        uint256 amount,
        GoalType goalType,
        uint256 timestamp
    );
    
    event WithdrawCompleted(
        address indexed user,
        uint256 indexed vaultId,
        uint256 amount,
        uint256 timestamp
    );
    
    event VaultCreated(
        uint256 indexed vaultId,
        address indexed owner,
        GoalType goalType,
        uint256 target,
        uint256 lockedUntil
    );
    
    // Funciones
    function createVault(
        GoalType goalType,
        uint256 target,
        uint256 lockedUntil,
        address beneficiary
    ) external returns (uint256);
    
    function deposit(uint256 vaultId, uint256 amount) external;
    
    function withdraw(uint256 vaultId, uint256 amount) external;
    
    function getVault(uint256 vaultId) external view returns (VaultInfo memory);
    
    function getUserVaults(address user) external view returns (uint256[] memory);
    
    function getVaultCount(address user) external view returns (uint256);
}
```

### 7.3 Tropykus Protocol

**Contratos en RSK Testnet** (verificar en docs oficiales):

```
DOC Token:           0x... (Dollar on Chain)
cDOC (Compound DOC): 0x... (cToken wrapper)
Comptroller:          0x... (controls collateral factors)
```

```python
# app/services/tropykus_service.py

from ethers import ethers

# Direcciones Tropykus Testnet (VERIFICAR CON DOCS OFICIALES)
DOC_ADDRESS = "0x..."  # Dollar on Chain
CDOC_ADDRESS = "0x..."  # cDOC (Compound DOC)

# ABI mínimo para cDOC
CDOC_ABI = [
    {
        "name": "mint",
        "inputs": [{"name": "mintAmount", "type": "uint256"}],
        "outputs": [{"name": "", "type": "uint256"}]
    },
    {
        "name": "redeem",
        "inputs": [{"name": "redeemAmount", "type": "uint256"}],
        "outputs": [{"name": "", "type": "uint256"}]
    },
    {
        "name": "balanceOf",
        "inputs": [{"name": "account", "type": "address"}],
        "outputs": [{"name": "", "type": "uint256"}]
    },
    {
        "name": "underlying",
        "inputs": [],
        "outputs": [{"name": "", "type": "address"}]
    },
    {
        "name": "exchangeRateCurrent",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256"}]
    }
]

class TropykusService:
    def __init__(self, rpc_url: str = RSK_RPC):
        self.provider = ethers.providers.JsonRpcProvider(rpc_url)
        self.cdoc = ethers.Contract(CDOC_ADDRESS, CDOC_ABI, self.provider)
    
    async def get_deposit_balance(self, address: str) -> float:
        """Obtiene balance de cDOC para una address."""
        balance = await self.cdoc.balanceOf(address)
        return ethers.utils.format_units(balance, 18)
    
    async def get_underlying_balance(self, address: str) -> float:
        """Obtiene balance de DOC subyacente (incluye yield)."""
        cdoc_balance = await self.cdoc.balanceOf(address)
        exchange_rate = await self.cdoc.exchangeRateCurrent()
        underlying = cdoc_balance * exchange_rate / 1e18
        return ethers.utils.format_units(underlying, 18)
    
    async def calculate_yield(self, address: str, principal: float) -> float:
        """Calcula yield generado desde último depósito."""
        current = await self.get_underlying_balance(address)
        return current - principal
```

### 7.4 xo-connect (Beexo SDK)

```typescript
// frontend/src/lib/xo-connect.ts

import { XOConnectProvider } from 'xo-connect';

// Configuración con soporte RSK
export const createXOProvider = () => {
  return new XOConnectProvider({
    rpcs: {
      // RSK Mainnet
      '0x1e': 'https://public-node.rsk.co',
      // RSK Testnet  
      '0x1f13': 'https://public-node.testnet.rsk.co',
    },
    defaultChainId: '0x1f13', // Testnet por defecto para MVP
    debug: true, // Panel de debug en desarrollo
  });
};

// Función helper para conectar wallet
export const connectWallet = async () => {
  const provider = createXOProvider();
  
  try {
    // Request connection (esto abre Beexo wallet)
    const accounts = await provider.request({
      method: 'eth_requestAccounts',
      params: []
    });
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No se pudo conectar');
    }
    
    return {
      address: accounts[0],
      provider,
    };
  } catch (error) {
    console.error('Error conectando wallet:', error);
    throw error;
  }
};

// Función para obtener provider de ethers.js
export const getEthersProvider = (xoProvider: XOConnectProvider) => {
  return new ethers.providers.Web3Provider(xoProvider);
};
```

### 7.5 Secuencia: Depósito Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                 DEPÓSITO: FLUJO COMPLETO                          │
│                                                                 │
│  FRONTEND                      BACKEND              BLOCKCHAIN     │
│  ─────────                     ───────              ────────────     │
│                                                                 │
│  1. User selecciona        │                      │                 │
│     vault y toca           │                      │                 │
│     [DEPOSITAR]           │                      │                 │
│         │                 │                      │                 │
│         │                 │                      │                 │
│         ▼                 │                      │                 │
│  2. Modal pide monto     │                      │                 │
│     User ingresa $500     │                      │                 │
│         │                 │                      │                 │
│         │                 │                      │                 │
│         ▼                 │                      │                 │
│  3. User toca             │                      │                 │
│     [CONFIRMAR]          │                      │                 │
│         │                 │                      │                 │
│         │                 │                      │                 │
│         ▼                 │                      │                 │
│  4. xo-connect           │                      │                 │
│     solicita firma ──────> BEEXO WALLET          │                 │
│         │                 │                      │                 │
│         │                 │                      │                 │
│  5. User firma           │                      │                 │
│     en Beexo             │                      │                 │
│         │                 │                      │                 │
│         │                 │                      │                 │
│         ▼                 │                      │                 │
│  6. Tx enviada ──────────────────────────────────> RSK          │
│     deposit(vaultId,      │                      │                 │
│         │                 │                      │    Contract    │
│         │                 │                      │    ejecuta:     │
│         │                 │                      │    - transfer   │
│         │                 │                      │    - approve    │
│         │                 │                      │    - mint cDOC  │
│         │                 │                      │    - emit event │
│         │                 │                      │                 │
│         �────────────────────── tx_hash ─────────│                 │
│         │                 │                      │                 │
│         │                 │                      │                 │
│         ▼                 │                      │                 │
│  7. UI muestra           │                      │                 │
│     "Enviando..."        │                      │                 │
│         │                 │                      │                 │
│         │                 │                      │                 │
│         ▼                 │                      │                 │
│  8. Tx confirmada        │                      │                 │
│     (block + receipt)     │                      │                 │
│         │                 │                      │                 │
│         │                 │                      │                 │
│         ▼                 ▼                      │                 │
│  9. POST /api/v1/       │                      │                 │
│     vaults/{id}/deposit  │                      │                 │
│     {tx_hash, amount}   │                      │                 │
│         │                 │                      │                 │
│         │                 ▼                      │                 │
│         │         10. Verificar tx_hash        │                 │
│         │            ya no existe               │                 │
│         │                 │                      │                 │
│         │                 ▼                      │                 │
│         │         11. Actualizar DB:           │                 │
│         │            - vault.current          │                 │
│         │            - user.xp, level         │                 │
│         │            - user.streak            │                 │
│         │            - activity log            │                 │
│         │            - penguin.mood           │                 │
│         │                 │                      │                 │
│         │                 ▼                      │                 │
│         │         12. Supabase Realtime ──────> FRONTEND       │
│         │            Notifica update            │                 │
│         │                 │                      │                 │
│         │                 │                      │                 │
│         ▼                 ▼                      │                 │
│  13. UI actualiza        │                      │                 │
│      - Balance sube      │                      │                 │
│      - XP sube           │                      │                 │
│      - Penguin salta 🎉   │                      │                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Flujos de Usuario

### 8.1 Flujo: Registro/Login

```
1. User abre app
       │
       ▼
2. Splash screen (1-2s)
       │
       ▼
3. Si no hay sesión:
   - xo-connect.request({method: 'eth_requestAccounts'})
   - Beexo wallet se abre
   - User firma mensaje
   - Backend verifica signature
   - Crea/busca usuario en Supabase
   - Retorna JWT
       │
       ▼
4. Home screen con datos del usuario
```

### 8.2 Flujo: Crear Vault

```
1. User toca [+] en bottom nav
       │
       ▼
2. Step 1: Elegir tipo
   - Ahorro propio (default)
   - Garantía de alquiler
       │
       ▼
3. Step 2: Configurar
   - Nombre (input)
   - Icono (selector de emojis)
   - Meta ($) (input con sugerencias)
   - Fecha objetivo (date picker, opcional)
   - Candado (toggle, default OFF)
       │
       ▼
4. Step 3: Confirmar
   - Resumen del vault
   - Warning si candado activo
   - [CREAR VAULT]
       │
       ▼
5. Success animation
   - Penguin celebra
   - Confetti
   - Vault aparece en lista
```

### 8.3 Flujo: Depositar

```
1. User toca vault en Home
       │
       ▼
2. Vault Detail screen
   - Progress bars
   - Actividad reciente
   - [AGREGAR FONDOS]
       │
       ▼
3. Deposit modal (Step 1)
   - Input monto ($)
   - Quick amounts ($50, $100, $250, $500)
   - Disponible shown
       │
       ▼
4. [CONTINUAR]
       │
       ▼
5. Confirm modal (Step 2)
   - Resumen (vault, monto, fee, XP a ganar)
   - [CONFIRMAR]
       │
       ▼
6. Beexo firma transacción
       │
       ▼
7. Procesando overlay
   - Tx hash
   - Progress bar
       │
       ▼
8. Tx confirmada
   - Success animation
   - Penguin salta
   - +XP floats up
       │
       ▼
9. Vuelve a Vault Detail
   - Progress actualizado
```

### 8.4 Flujo: Garantía de Alquiler

```
1. Owner quiere verificar garantía de tenant
       │
       ▼
2. Owner ingresa alias del tenant
       │
       ▼
3. Backend busca vault activo del tenant
       │
       ▼
4. Si existe vault con:
   - beneficiary = owner_alias
   - locked = true
   - current >= monto del alquiler
       │
       ▼
5. Owner ve:
   ✓ "El tenant tiene $X garantizados"
   ✓ "Fondos bloqueados hasta [fecha]"
   ✓ "Los yield van al tenant"
       │
       ▼
6. Owner puede aceptar o rechazar contrato
```

---

## 9. Apéndice: Contratos y Direcciones

### 9.1 Direcciones en RSK Testnet

| Contrato | Dirección | Notas |
|----------|------------|-------|
| DOC Token | `0x...` | Verificar en faucet/testnet docs |
| cDOC | `0x...` | Verificar en Tropykus docs |
| AhorroVault | `0x...` | Desplegar con Hardhat |

### 9.2 Variables de Entorno Requeridas

```bash
# Backend
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
JWT_SECRET=xxx

# Blockchain
RSK_RPC_URL=https://public-node.testnet.rsk.co
AHORRO_VAULT_ADDRESS=0x...
TROPYKUS_DOC_ADDRESS=0x...
TROPYKUS_CDOC_ADDRESS=0x...

# App
FRONTEND_URL=http://localhost:5173
```

### 9.3 Links de Referencia

| Recurso | URL |
|---------|-----|
| Docs RSK | https://dev.rootstock.io |
| Faucet RSK | https://faucet.rootstock.io |
| Explorer Testnet | https://explorer.testnet.rootstock.io |
| Docs Tropykus | https://github.com/Tropykus/tropykusjs |
| Docs xo-connect | https://www.npmjs.com/package/xo-connect |
| Docs Supabase | https://supabase.com/docs |

---

## 10. Checklist de Implementación

### 10.1 Backend (FastAPI)

- [ ] Setup proyecto FastAPI
- [ ] Configurar Supabase client
- [ ] Implementar auth con Beexo signatures
- [ ] CRUD de users
- [ ] CRUD de vaults
- [ ] Endpoint de depósito
- [ ] Lógica de XP/Level
- [ ] Lógica de streaks
- [ ] Endpoint de penguin state
- [ ] Endpoint de yield
- [ ] Transfers P2P
- [ ] Webhook handler
- [ ] Tests unitarios

### 10.2 Frontend (React)

- [ ] Setup Vite + React + TS
- [ ] Configurar Tailwind
- [ ] Integrar xo-connect
- [ ] Setup Zustand store
- [ ] Integrar Supabase client
- [ ] Components: Button, Input, VaultCard, ProgressBar
- [ ] Components: PenguinWidget, StreakBadge
- [ ] Screens: Home, Vaults, VaultDetail, CreateVault
- [ ] Modals: Deposit, Transfer
- [ ] Animaciones con Framer Motion
- [ ] Responsive design
- [ ] Tests E2E (Playwright)

### 10.3 Blockchain (Smart Contracts)

- [ ] Setup Hardhat con RSK
- [ ] Implementar AhorroVault.sol
- [ ] Tests del contrato
- [ ] Deploy a testnet
- [ ] Verificar en explorer

### 10.4 Base de Datos (Supabase)

- [ ] Crear proyecto Supabase
- [ ] Ejecutar migrations
- [ ] Configurar RLS policies
- [ ] Enable Realtime
- [ ] Seed data opcional

---

*Documento generado para AhorroGO MVP — "The Stoic Neon"*  
*Última actualización: Marzo 2025*
