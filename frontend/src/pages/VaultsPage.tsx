import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TopAppBar } from '../components/layout/TopAppBar';
import { BottomNav } from '../components/layout/BottomNav';
import { PenguinMascot } from '../components/penguin/PenguinMascot';

export function VaultsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  
  // Mock data - in production this would come from the store
  const mockVaults = [
    { id: '1', name: 'Emergency Fund', current: 8500, target: 10000, percentage: 85, status: 'active', type: 'savings' },
    { id: '2', name: 'Vacation 2025', current: 2500, target: 5000, percentage: 50, status: 'active', type: 'savings' },
    { id: '3', name: 'MacBook Pro', current: 1200, target: 3000, percentage: 40, status: 'active', type: 'savings' },
    { id: '4', name: 'Rental Deposit', current: 5000, target: 5000, percentage: 100, status: 'completed', type: 'rental' },
  ];
  
  const totalLocked = mockVaults
    .filter(v => v.status === 'active')
    .reduce((sum, v) => sum + v.current, 0);
  
  const filteredVaults = mockVaults.filter(v => {
    if (filter === 'active') return v.status === 'active';
    if (filter === 'completed') return v.status === 'completed';
    return true;
  });

  const activeCount = mockVaults.filter(v => v.status === 'active').length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopAppBar title="Mi Bóveda" />
      
      <main className="pt-20 px-5 max-w-lg mx-auto space-y-6">
        
        {/* Summary Card */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden"
        >
          <div className="bg-gradient-to-br from-surface-container-high to-surface-container rounded-3xl p-6 border border-outline-variant/5 shadow-xl shadow-black/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-widest mb-1">Total Bloqueado</p>
                <h2 className="text-4xl font-headline font-extrabold text-white tracking-tight">
                  ${totalLocked.toLocaleString()}
                </h2>
              </div>
              <div className="bg-primary/15 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                {activeCount} activos
              </div>
            </div>
            
            {/* Yield Info */}
            <div className="flex items-center gap-2 bg-surface-variant/30 rounded-xl px-4 py-2">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: 'FILL 1' }}>trending_up</span>
              <span className="text-on-surface-variant text-sm">Generando</span>
              <span className="text-primary font-bold ml-auto">4.5% APY</span>
            </div>
            
            {/* Penguin Mascot */}
            <div className="absolute -right-2 -bottom-2 opacity-90">
              <PenguinMascot 
                mood={activeCount > 0 ? 'happy' : 'guide'} 
                size="md"
                message={activeCount > 0 ? '¡Sigue así!' : 'Crea tu vault'}
              />
            </div>
          </div>
        </motion.section>

        {/* Filter Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-2"
        >
          {(['active', 'completed', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize
                ${filter === f 
                  ? 'bg-primary text-on-primary' 
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }
              `}
            >
              {f === 'active' ? 'Activos' : f === 'completed' ? 'Completados' : 'Todos'}
            </button>
          ))}
        </motion.div>

        {/* Vaults List */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {filteredVaults.length > 0 ? (
            filteredVaults.map((vault, index) => (
              <motion.div
                key={vault.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.05 }}
                className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10 hover:border-outline-variant/30 transition-colors cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      vault.status === 'completed' ? 'bg-primary/15' : 'bg-surface-container'
                    }`}>
                      <span className={`material-symbols-outlined text-lg ${vault.status === 'completed' ? 'text-primary' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: 'FILL 1' }}>
                        {vault.status === 'completed' ? 'check_circle' : 'savings'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{vault.name}</h3>
                      <p className="text-on-surface-variant/60 text-xs capitalize">{vault.type}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    vault.status === 'completed' ? 'bg-primary/15 text-primary' : 'bg-surface-container text-on-surface-variant'
                  }`}>
                    {vault.percentage}%
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="relative h-2 bg-surface-variant/50 rounded-full overflow-hidden mb-2">
                  <div 
                    className={`absolute inset-y-0 left-0 rounded-full ${
                      vault.status === 'completed' ? 'bg-primary' : 'bg-gradient-to-r from-primary to-secondary'
                    }`}
                    style={{ width: `${vault.percentage}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant/60">${vault.current.toLocaleString()}</span>
                  <span className="text-on-surface-variant">de ${vault.target.toLocaleString()}</span>
                </div>
              </motion.div>
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

        {/* Create New Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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