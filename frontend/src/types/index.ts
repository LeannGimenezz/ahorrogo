// === VAULT TYPES ===
export type VaultType = 'savings' | 'rental' | 'p2p';
export type VaultStatus = 'active' | 'completed' | 'cancelled';

// Unified Vault type - compatible with both API and internal use
export interface Vault {
  id: string;
  user_id?: string;
  name: string;
  icon: string;
  target: number;
  current: number;
  vaultType: VaultType;
  vault_type?: VaultType; // API uses snake_case
  beneficiary?: string;
  locked: boolean;
  unlockDate?: string;
  unlock_date?: string; // API uses snake_case
  status: VaultStatus;
  progress?: number;
  on_chain_id?: number | null;
  createdAt: string;
  created_at?: string; // API uses snake_case
  updatedAt?: string;
  updated_at?: string; // API uses snake_case
}

export interface Activity {
  id: string;
  activityType: 'deposit' | 'withdraw' | 'yield' | 'transfer';
  amount: number;
  txHash?: string;
  createdAt: string;
}

// === USER TYPES ===
// Unified User type - compatible with both API and internal use
export interface User {
  id: string;
  address: string;
  alias: string;
  xp: number;
  level: number;
  streak: number;
  lastDepositAt?: string;
  last_deposit_at?: string; // API uses snake_case
  createdAt: string;
  created_at?: string; // API uses snake_case
}

// === PENGUIN TYPES ===
export type PenguinMood = 'idle' | 'happy' | 'celebrating' | 'waiting';

export interface PenguinState {
  xp: number;
  level: number;
  mood: PenguinMood;
  streak: number;
  accessories: string[];
  totalSaved: number;
  yieldEarned: number;
}

// === XP/LEVEL SYSTEM ===
export const XP_PER_LEVEL = [0, 100, 300, 600, 1000];
export const LEVEL_NAMES = ['', 'Newcomer', 'Beginner', 'Saver', 'Champion', 'Legend'];
export const LEVEL_ACCESSORIES: Record<number, string[]> = {
  1: [],
  2: ['beanie'],
  3: ['beanie', 'scarf'],
  4: ['beanie', 'scarf', 'gloves'],
  5: ['beanie', 'scarf', 'gloves', 'crown'],
};

// === VAULT TYPE CONFIG ===
export const VAULT_TYPE_CONFIG: Record<VaultType, { label: string; icon: string; description: string }> = {
  savings: { label: 'Compra', icon: 'shopping_cart', description: 'Time-lock clásico para compras importantes.' },
  rental: { label: 'Alquiler', icon: 'home', description: 'Garantía activa con desbloqueo mensual.' },
  p2p: { label: 'Regalo / P2P', icon: 'card_giftcard', description: 'Transferencia programada e irrevocable.' },
};