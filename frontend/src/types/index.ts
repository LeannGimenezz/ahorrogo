// === VAULT TYPES ===
export type VaultType = 'savings' | 'rental' | 'p2p' | 'finance';
export type VaultStatus = 'active' | 'completed' | 'cancelled';
export type VaultUseCase = 'compra-p2p' | 'garantia-alquiler' | 'metas-candado' | 'finanzas-personales' | 'venta-protegida';

export interface ReleaseScheduleItem {
  id: string;
  percentage: number;
  amount: number;
  date: string;
  released: boolean;
  label: string;
}

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
  contractAddress?: string;
  // Rental guarantee fields
  ownerAddress?: string;
  guaranteeMonths?: number;
  // Finance management fields
  releaseSchedule?: ReleaseScheduleItem[];
  // Protected sale fields
  sellerAddress?: string;
  releaseCondition?: string;
  // Use case tracking
  useCase?: VaultUseCase;
  investedCoin?: string;
  apy?: string;
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
export type PenguinMood = 'idle' | 'happy' | 'celebrating' | 'waiting' | 'encourage' | 'thinking' | 'guide' | 'celebrate' | 'wave';

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
  finance: { label: 'Finanzas', icon: 'account_balance', description: 'Gestión con liberaciones programadas por porcentaje.' },
};

// === AI MOTIVATION HELPERS ===
export function generateMotivation(vaults: Vault[], streak: number): string {
  if (!vaults.length) return '¡Creá tu primer vault para empezar a ahorrar! 🎯';

  const closest = vaults
    .filter(v => v.status === 'active' && v.current < v.target)
    .sort((a, b) => (b.current / b.target) - (a.current / a.target))[0];

  if (!closest) return '¡Todos tus vaults están completos! Sos un campeón 🏆';

  const remaining = closest.target - closest.current;
  const progress = Math.round((closest.current / closest.target) * 100);

  if (progress >= 80) {
    return `¡Tu vault "${closest.name}" está al ${progress}%! Solo te faltan $${remaining.toLocaleString()}. ¡Ya casi lo lográs! 🚀`;
  }

  if (streak >= 3) {
    return `¡Llevás ${streak} meses de racha! Un depósito hoy a "${closest.name}" te da +50 XP bonus 🔥`;
  }

  const weeksToGoal = Math.ceil(remaining / 200);
  return `Si invertís $200 más esta semana en "${closest.name}", vas a completar tu meta ${weeksToGoal > 1 ? `${weeksToGoal} semanas` : '1 semana'} antes 📈`;
}