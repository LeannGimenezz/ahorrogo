import { motion } from 'framer-motion';
import { ProgressBar } from './ProgressBar';
import type { Vault } from '../../types';

interface VaultCardProps {
  vault: Vault;
  variant?: 'compact' | 'expanded';
  onClick?: () => void;
}

export function VaultCard({ vault, variant = 'compact', onClick }: VaultCardProps) {
  const progress = (vault.current / vault.target) * 100;
  const monthsRemaining = vault.unlockDate
    ? Math.max(0, Math.ceil((new Date(vault.unlockDate).getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)))
    : undefined;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        bg-surface-container-high rounded-xl p-6
        hover:bg-surface-bright transition-colors cursor-pointer
        ${variant === 'expanded' ? 'space-y-6' : 'space-y-4'}
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-surface-variant text-secondary text-[10px] font-bold uppercase tracking-wider">
              {vault.vaultType === 'savings' ? 'Tech' : vault.vaultType.toUpperCase()}
            </span>
            {vault.locked && (
              <span className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold">
                🔒 Locked
              </span>
            )}
          </div>
          <h3 className="text-xl font-headline font-bold text-on-surface flex items-center gap-2">
            {vault.icon} {vault.name}
          </h3>
        </div>
        {vault.locked && (
          <span className="material-symbols-outlined text-secondary neon-glow-secondary text-2xl" style={{ fontVariationSettings: 'FILL 1' }}>
            lock
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-primary text-2xl font-headline font-bold">
              ${vault.current.toLocaleString()}
            </span>
            <span className="text-on-surface-variant font-medium"> / ${vault.target.toLocaleString()}</span>
          </div>
          <span className="text-on-surface-variant text-xs font-bold">{Math.round(progress)}%</span>
        </div>
        <ProgressBar value={progress} />
      </div>

      {/* Time remaining (for locked vaults) */}
      {vault.locked && monthsRemaining !== undefined && monthsRemaining > 0 && (
        <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase">
          <span className="material-symbols-outlined text-sm">schedule</span>
          {monthsRemaining} meses restantes
        </div>
      )}

      {/* Yield badge */}
      {vault.current > 0 && (
        <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-[10px] font-bold w-fit">
          <span className="material-symbols-outlined text-sm">trending_up</span>
          +${Math.round(vault.current * 0.05).toLocaleString()} Yield
        </div>
      )}
    </motion.div>
  );
}