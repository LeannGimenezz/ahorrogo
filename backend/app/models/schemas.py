from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum


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


class TransferStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


XP_PER_LEVEL = [0, 100, 300, 600, 1000]

ACCESSORIES_BY_LEVEL = {
    1: [],
    2: ["beanie"],
    3: ["beanie", "scarf"],
    4: ["beanie", "scarf", "gloves"],
    5: ["beanie", "scarf", "gloves", "crown"],
}

GOAL_ACCESSORIES = {
    "celular": "phone",
    "vacaciones": "sunglasses",
    "casa": "house",
    "auto": "car",
    "viaje": "airplane",
    "carrera": "graduation_cap",
}

XP_PER_DEPOSIT = 10
XP_COMPLETION_BONUS = 100
STREAK_RESET_DAYS = 60
TRANSFER_EXPIRY_HOURS = 24


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

    model_config = ConfigDict(from_attributes=True)


class UserByAddressResponse(BaseModel):
    address: str
    alias: str
    has_active_guarantee: bool = False


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


class VaultUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    icon: Optional[str] = None


class VaultResponse(VaultBase):
    id: str
    user_id: str
    current: float = 0
    status: VaultStatus = VaultStatus.ACTIVE
    progress: float = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @property
    def progress(self) -> float:
        if self.target == 0:
            return 0
        return min(self.current / self.target, 1.0)


class VaultWithActivities(VaultResponse):
    activities: List["ActivityResponse"] = []


class ActivityBase(BaseModel):
    activity_type: ActivityType
    amount: float
    tx_hash: Optional[str] = None


class ActivityCreate(ActivityBase):
    vault_id: str


class ActivityResponse(ActivityBase):
    id: str
    vault_id: str
    block_number: Optional[int] = None
    metadata: Optional[dict] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DepositRequest(BaseModel):
    amount: float = Field(..., gt=0)
    tx_hash: Optional[str] = None  # Optional: si no se hace on-chain


class DepositResponse(BaseModel):
    success: bool
    xp_earned: int
    new_xp: int
    new_level: int
    streak: int
    streak_incremented: bool
    vault_progress: float
    mood: PenguinMood
    tx_hash: Optional[str] = None  # Hash de tx on-chain
    new_balance: float = 0


class WithdrawRequest(BaseModel):
    amount: float = Field(..., gt=0)


class WithdrawResponse(BaseModel):
    success: bool
    amount: float
    new_balance: float
    tx_hash: Optional[str] = None
    xp_earned: int = 0


class WithdrawCheckResponse(BaseModel):
    can_withdraw: bool
    reason: Optional[str] = None
    locked: bool
    unlock_date: Optional[datetime] = None
    days_remaining: Optional[int] = None
    balance: float


class YieldResponse(BaseModel):
    vault_id: str
    yield_earned: float
    current_balance: float
    apy_estimate: float
    apy_source: str = "tropykus"  # tropykus o default


class VaultCreateOnChain(BaseModel):
    name: str = Field(..., max_length=100)
    icon: str = Field(default="🏠")
    target: float = Field(..., gt=0)
    vault_type: VaultType
    beneficiary: Optional[str] = None
    locked: bool = False
    unlock_date: Optional[datetime] = None
    initial_deposit: float = Field(default=0, ge=0)  # Depósito inicial opcional


class VaultSyncResponse(BaseModel):
    db_vault: dict
    on_chain_vault: Optional[dict] = None
    sync_status: str  # synced, out_of_sync, not_on_chain
    differences: Optional[dict] = None


class TransferCreate(BaseModel):
    vault_id: str
    recipient_alias: str
    amount: float = Field(..., gt=0)


class TransferResponse(BaseModel):
    id: str
    status: TransferStatus
    from_vault: VaultResponse
    to_alias: str
    amount: float
    expires_at: datetime
    confirmed_at: Optional[datetime] = None
    created_at: datetime


class TransferCreateResponse(BaseModel):
    id: str
    status: str
    expires_at: datetime


class TransferConfirmResponse(BaseModel):
    success: bool
    new_balance: float


class TransferCancelResponse(BaseModel):
    success: bool
    amount_returned: float


class BlockchainEvent(BaseModel):
    event: str
    tx_hash: str
    user_address: str
    amount: float
    vault_id: Optional[str] = None
    block_number: int
    timestamp: int


class BlockchainWebhookResponse(BaseModel):
    processed: bool
    xp_earned: Optional[int] = None
    new_level: Optional[int] = None


class NotificationResponse(BaseModel):
    id: str
    title: str
    body: Optional[str] = None
    type: str
    read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]


class NotificationReadResponse(BaseModel):
    success: bool


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


class VaultsListResponse(BaseModel):
    vaults: List[VaultResponse]
    total_saved: float
    total_target: float


class AuthVerifyRequest(BaseModel):
    address: str
    signature: str
    message: str


class AuthVerifyResponse(BaseModel):
    user: UserResponse
    token: str


class UserBalanceResponse(BaseModel):
    """Response model for user's total balance across all vaults."""
    total: float
    available: float
    locked: float
    yield_this_month: float
    yield_percentage: float  # Current APY from Tropykus


VaultWithActivities.model_rebuild()
