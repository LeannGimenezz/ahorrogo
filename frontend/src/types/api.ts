// API Response Types - Matching backend schemas

// === USER TYPES ===
export interface UserResponse {
  id: string;
  address: string;
  alias: string;
  xp: number;
  level: number;
  streak: number;
  last_deposit_at: string | null;
  created_at: string;
}

export interface UserBalanceResponse {
  total: number;
  available: number;
  locked: number;
  yield_this_month: number;
  yield_percentage: number;
}

export interface AuthVerifyRequest {
  address: string;
  signature: string;
  message: string;
}

export interface AuthVerifyResponse {
  user: UserResponse;
  token: string;
}

// === VAULT TYPES ===
export type VaultType = 'savings' | 'rental' | 'p2p';
export type VaultStatus = 'active' | 'completed' | 'cancelled';

export interface VaultResponse {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  target: number;
  current: number;
  vault_type: VaultType;
  beneficiary: string | null;
  locked: boolean;
  unlock_date: string | null;
  status: VaultStatus;
  progress: number;
  created_at: string;
  updated_at: string;
  on_chain_id?: number | null;
}

export interface VaultsListResponse {
  vaults: VaultResponse[];
  total_saved: number;
  total_target: number;
}

export interface VaultWithActivities extends VaultResponse {
  activities: ActivityResponse[];
}

export interface VaultCreate {
  name: string;
  icon: string;
  target: number;
  vault_type: VaultType;
  beneficiary?: string;
  locked?: boolean;
  unlock_date?: string;
}

export interface VaultUpdate {
  name?: string;
  icon?: string;
}

// === ACTIVITY TYPES ===
export type ActivityType = 'deposit' | 'withdraw' | 'yield' | 'transfer';

export interface ActivityResponse {
  id: string;
  vault_id: string;
  activity_type: ActivityType;
  amount: number;
  tx_hash: string | null;
  block_number: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// === DEPOSIT/WITHDRAW TYPES ===
export interface DepositRequest {
  amount: number;
  tx_hash?: string;
}

export interface DepositResponse {
  success: boolean;
  xp_earned: number;
  new_xp: number;
  new_level: number;
  streak: number;
  streak_incremented: boolean;
  vault_progress: number;
  mood: string;
  tx_hash: string | null;
  new_balance: number;
}

export interface WithdrawRequest {
  amount: number;
}

export interface WithdrawResponse {
  success: boolean;
  amount: number;
  new_balance: number;
  tx_hash: string | null;
  xp_earned: number;
}

export interface WithdrawCheckResponse {
  can_withdraw: boolean;
  reason: string | null;
  locked: boolean;
  unlock_date: string | null;
  days_remaining: number | null;
  balance: number;
}

// === YIELD TYPES ===
export interface YieldResponse {
  vault_id: string;
  yield_earned: number;
  current_balance: number;
  apy_estimate: number;
  apy_source: string;
}

// === PENGUIN TYPES ===
export type PenguinMood = 'idle' | 'happy' | 'celebrating' | 'waiting';

export interface PenguinResponse {
  xp: number;
  level: number;
  mood: PenguinMood;
  streak: number;
  accessories: string[];
  total_saved: number;
  yield_earned: number;
  goals: VaultResponse[];
}

// === BLOCKCHAIN TYPES ===
export interface NetworkInfoResponse {
  chain_id: number;
  block_number: number;
  gas_price_wei: number;
  gas_price_gwei: number;
  rpc_url: string;
  symbol: string;
  is_testnet: boolean;
}

export interface MarketInfoResponse {
  address: string;
  name: string;
  symbol: string;
  total_supply: number;
  total_borrow: number;
  supply_apy: number;
  borrow_apy: number;
  exchange_rate: number;
  cash: number;
  decimals: number;
}

export interface VaultTxResponse {
  success: boolean;
  vault_id: number;
  tx_hash: string;
  gas_used: number;
  explorer_url: string;
  details?: Record<string, unknown>;
}

// === ERROR TYPES ===
export interface ApiErrorResponse {
  detail: string;
  status_code: number;
}