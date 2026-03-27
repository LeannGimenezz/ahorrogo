import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TopAppBar } from '../components/layout/TopAppBar';
import { BottomNav } from '../components/layout/BottomNav';
import { PenguinMascot } from '../components/penguin/PenguinMascot';
import { VaultDetailsModal, type VaultDetailData } from '../components/ui/VaultDetailsModal';
import { useAppStore } from '../store/useAppStore';
import { generateMotivation } from '../types';

const USE_CASE_LABELS: Record<string, string> = {
  'compra-p2p': 'Compra Protegida P2P',
  'garantia-alquiler': 'Garantía de Alquiler Activa',
  'metas-candado': 'Meta con Candado',
  'finanzas-personales': 'Finanzas Personales',
  'venta-protegida': 'Venta Protegida',
};

export function VaultsPage() {
  const navigate = useNavigate();
  const { vaults, penguin } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [selectedVault, setSelectedVault] = useState<VaultDetailData | null>(null);

  // Map store vaults to VaultDetailData
  const vaultDetails: VaultDetailData[] = vaults.map(v => ({
    id: v.id,
    name: v.name,
    current: v.current,
    target: v.target,
    percentage: v.target > 0 ? Math.round((v.current / v.target) * 100) : 0,
    typeLabel: USE_CASE_LABELS[v.useCase || 'metas-candado'] || 'Meta con Candado',
    investedCoin: v.investedCoin || 'DOC',
    apy: v.apy || '4.5%',
    useCase: v.useCase || 'metas-candado',
    ownerAddress: v.ownerAddress,
    guaranteeMonths: v.guaranteeMonths,
    beneficiary: v.beneficiary,
    contractAddress: v.contractAddress,
    sellerAddress: v.sellerAddress,
    releaseCondition: v.releaseCondition,
    releaseSchedule: v.releaseSchedule,
  }));

  const filteredVaults = vaultDetails.filter((vault) => {
    if (filter === 'completed') return vault.percentage >= 100;
    if (filter === 'active') return vault.percentage < 100;
    return true;
  });

  const totalLocked = vaultDetails.reduce((sum, v) => sum + v.current, 0);
  const activeCount = vaultDetails.filter((v) => v.percentage < 100).length;
  const motivation = generateMotivation(vaults, penguin.streak);

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopAppBar title="Mi Bóveda" />

      <VaultDetailsModal
        isOpen={selectedVault !== null}
        vault={selectedVault}
        onClose={() => setSelectedVault(null)}
      />

      <main className="pt-20 px-5 max-w-lg mx-auto space-y-6">
        {/* Summary Card */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden"
        >
          <div className="bg-gradient-to-br from-surface-container-high to-surface-container rounded-3xl p-6 border border-outline-variant/10 shadow-xl shadow-black/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-widest mb-1">Total Bloqueado</p>
                <h2 className="text-4xl font-headline font-extrabold text-white tracking-tight">${totalLocked.toLocaleString()}</h2>
              </div>
              <div className="bg-primary/15 text-primary text-xs font-bold px-3 py-1.5 rounded-full">{activeCount} activos</div>
            </div>

            <div className="flex items-center gap-2 bg-surface-variant/30 rounded-xl px-4 py-2">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: 'FILL 1' }}>
                trending_up
              </span>
              <span className="text-on-surface-variant text-sm">Rendimiento promedio</span>
              <span className="text-primary font-bold ml-auto">4.6% APY</span>
            </div>

            <div className="absolute -right-2 -bottom-2 opacity-90">
              <PenguinMascot mood={activeCount > 0 ? 'happy' : 'guide'} size="md" />
            </div>
          </div>
        </motion.section>

        {/* AI Motivation Card */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="bg-gradient-to-r from-tertiary/10 to-primary/10 rounded-2xl p-4 border border-tertiary/20 flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <PenguinMascot mood="encourage" size="sm" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: 'FILL 1' }}>auto_awesome</span>
                <p className="text-tertiary text-[10px] font-bold uppercase tracking-widest">Motivación IA</p>
              </div>
              <p className="text-white text-sm font-medium leading-relaxed">{motivation}</p>
            </div>
          </div>
        </motion.section>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2"
        >
          {(['active', 'completed', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${
                filter === f ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {f === 'active' ? 'Activos' : f === 'completed' ? 'Completados' : 'Todos'}
            </button>
          ))}
        </motion.div>

        {/* Vault Cards */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-3"
        >
          {filteredVaults.length > 0 ? (
            filteredVaults.map((vault, index) => (
              <motion.button
                key={vault.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                onClick={() => setSelectedVault(vault)}
                className="w-full text-left bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10 hover:border-outline-variant/30 transition-colors active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${vault.percentage >= 100 ? 'bg-primary/15' : 'bg-surface-container'}`}>
                      <span
                        className={`material-symbols-outlined text-lg ${vault.percentage >= 100 ? 'text-primary' : 'text-on-surface-variant'}`}
                        style={{ fontVariationSettings: 'FILL 1' }}
                      >
                        {vault.percentage >= 100 ? 'check_circle' : 'savings'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{vault.name}</h3>
                      <p className="text-on-surface-variant/60 text-xs">{vault.typeLabel}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${vault.percentage >= 100 ? 'bg-primary/15 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                    {vault.percentage}%
                  </span>
                </div>

                <div className="relative h-2 bg-surface-variant/50 rounded-full overflow-hidden mb-2">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${vault.percentage}%` }} />
                </div>

                <div className="flex justify-between text-xs mb-2">
                  <span className="text-on-surface-variant/60">${vault.current.toLocaleString()}</span>
                  <span className="text-on-surface-variant">de ${vault.target.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-secondary font-semibold">{vault.investedCoin} · {vault.apy} APY</span>
                  <span className="text-[11px] text-primary font-bold">Ver detalles →</span>
                </div>
              </motion.button>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-surface-container-low rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-on-surface-variant/50 text-3xl">savings</span>
              </div>
              <p className="text-on-surface-variant/60">No hay vaults en esta categoría</p>
            </div>
          )}
        </motion.section>

        {/* Create Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          onClick={() => navigate('/create')}
          className="w-full py-4 rounded-2xl bg-primary text-on-primary font-headline font-bold uppercase text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: 'FILL 1' }}>add_circle</span>
          Crear Nuevo Vault
        </motion.button>
      </main>

      <BottomNav />
    </div>
  );
}
