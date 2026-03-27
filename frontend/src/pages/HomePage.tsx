import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TopAppBar } from '../components/layout/TopAppBar';
import { BottomNav } from '../components/layout/BottomNav';
import { DepositModal } from '../components/ui/DepositModal';
import { ReceiveModal } from '../components/ui/ReceiveModal';
import { SwapModal } from '../components/ui/SwapModal';
import { SendModal } from '../components/ui/SendModal';
import { PenguinMascot } from '../components/penguin/PenguinMascot';
import { useAppStore } from '../store/useAppStore';

// Mock data for recent movements (home shows 3)
const RECENT_MOVEMENTS = [
  { id: '1', name: 'Apple Store Online', amount: -1299.00, icon: 'shopping_bag', date: 'Hoy', category: 'Compras' },
  { id: '2', name: 'Salary Deposit', amount: 4500.00, icon: 'payments', date: 'Ayer', category: 'Ingresos' },
  { id: '3', name: 'Vault Yield', amount: 31.40, icon: 'trending_up', date: 'Mar 25', category: 'Yield' },
];

// Quick action buttons configuration
const QUICK_ACTIONS = [
  { id: 'deposit', icon: 'add', label: 'DEPOSIT', color: 'bg-primary', description: 'Add funds' },
  { id: 'receive', icon: 'qr_code', label: 'RECEIVE', color: 'bg-secondary', description: 'Get paid' },
  { id: 'swap', icon: 'swap_horiz', label: 'SWAP', color: 'bg-tertiary', description: 'Exchange' },
  { id: 'send', icon: 'send', label: 'SEND', color: 'bg-surface-container-high', description: 'Transfer' },
] as const;

export function HomePage() {
  const navigate = useNavigate();
  const { penguin, vaults } = useAppStore();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showVaultDeposit, setShowVaultDeposit] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [greeting, setGreeting] = useState('¡Hola!');
  
  useEffect(() => {
    // Hide welcome after 3 seconds
    const timer = setTimeout(() => setShowWelcome(false), 3000);
    return () => clearTimeout(timer);
  }, []);
  
  // Determine greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('¡Buenos días!');
    else if (hour < 18) setGreeting('¡Buenas tardes!');
    else setGreeting('¡Buenas noches!');
  }, []);
  
  // Calculate values from real store data
  const availableBalance = vaults.reduce((sum, v) => sum + v.current, 0);
  const monthlyYieldPercentage = penguin.yieldEarned > 0 ? ((penguin.yieldEarned / (availableBalance || 1)) * 100) : 5.2;
  
  // Main vault — first active vault or placeholder
  const firstVault = vaults.find(v => v.status === 'active');
  const mainVault = firstVault ? {
    id: firstVault.id,
    name: firstVault.name,
    current: firstVault.current,
    target: firstVault.target,
    percentage: firstVault.target > 0 ? Math.min(Math.round((firstVault.current / firstVault.target) * 100), 100) : 0,
  } : {
    id: '',
    name: 'Sin vaults activos',
    current: 0,
    target: 0,
    percentage: 0,
  };
  
  // Stats computed from real data
  const stats = {
    activeAssets: availableBalance,
    pendingDeals: vaults.filter(v => v.vaultType === 'p2p' || v.vaultType === 'rental').reduce((sum, v) => sum + v.current, 0),
  };

  const closeModal = () => setActiveModal(null);

  const progressWidth = mainVault.percentage + '%';

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopAppBar />
      
      {/* Modals */}
      <DepositModal isOpen={activeModal === 'deposit'} onClose={closeModal} />
      <ReceiveModal isOpen={activeModal === 'receive'} onClose={closeModal} />
      <SwapModal isOpen={activeModal === 'swap'} onClose={closeModal} />
      <SendModal isOpen={activeModal === 'send'} onClose={closeModal} />
      
      {/* Vault Deposit Modal */}
      <DepositModal 
        isOpen={showVaultDeposit} 
        onClose={() => setShowVaultDeposit(false)} 
      />
      
      {/* Main Content */}
      <main className="pt-20 px-5 max-w-lg mx-auto space-y-6">
        
        {/* Welcome Pengium */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center gap-4 py-4"
            >
              <PenguinMascot mood="wave" size="lg" showMessage message={greeting} />
              <div className="flex-1">
                <p className="text-white font-headline font-bold text-lg">{greeting}</p>
                <p className="text-on-surface-variant/60 text-sm">Listo para ahorrar hoy</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Balance Section */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: showWelcome ? 0.5 : 0 }}
          className="py-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <p className="text-on-surface-variant/70 text-[11px] font-semibold uppercase tracking-[0.2em]">
              Available Balance
            </p>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: (showWelcome ? 0.7 : 0.2), type: 'spring' }}
            >
              <PenguinMascot mood="happy" size="sm" />
            </motion.div>
          </div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (showWelcome ? 0.6 : 0.1) }}
              className="text-[42px] font-headline font-extrabold text-white tracking-tight leading-none"
            >
              ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </motion.h1>
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: (showWelcome ? 0.8 : 0.3) }}
              className="inline-flex items-center gap-1 bg-primary/15 text-primary text-[11px] font-bold px-2.5 py-1 rounded-full border border-primary/20"
            >
              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: 'FILL 1' }}>trending_up</span>
              +{monthlyYieldPercentage}% month
            </motion.span>
          </div>
        </motion.section>
        
        {/* Quick Action Buttons */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (showWelcome ? 0.9 : 0.05) }}
          className="grid grid-cols-4 gap-2"
        >
          {QUICK_ACTIONS.map((action, index) => (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (showWelcome ? 1 + index * 0.05 : 0.1 + index * 0.05) }}
              onClick={() => setActiveModal(action.id)}
              className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/10 active:scale-[0.96] transition-all duration-150 hover:bg-surface-container hover:border-outline-variant/20"
            >
              <div className={"w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-transform group-active:scale-95 " + action.color}>
                <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: 'FILL 1' }}>
                  {action.icon}
                </span>
              </div>
              <span className="text-on-surface-variant/80 text-[9px] font-bold uppercase tracking-wider">
                {action.label}
              </span>
            </motion.button>
          ))}
        </motion.section>
        
        {/* Main Vault Card */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (showWelcome ? 1.2 : 0.1) }}
          className="relative"
        >
          <div className="bg-gradient-to-br from-surface-container-high to-surface-container rounded-3xl p-5 border border-outline-variant/5 overflow-hidden shadow-xl shadow-black/20">
            {/* Subtle glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Header */}
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-widest mb-1">Main Vault</p>
                <h3 className="font-headline text-lg font-bold text-white">{mainVault.name}</h3>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowVaultDeposit(true)}
                className="flex items-center gap-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-full px-3 py-1.5 transition-all"
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: 'FILL 1' }}>add</span>
                <span className="text-[10px] font-bold uppercase tracking-wide">Add</span>
              </motion.button>
            </div>
            
            {/* Progress Bar */}
            <div className="relative h-8 bg-surface-variant/50 rounded-full overflow-hidden mb-4">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: progressWidth }}
                transition={{ delay: (showWelcome ? 1.4 : 0.3), duration: 0.8, ease: 'easeOut' }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary rounded-full"
              />
              <div className="absolute inset-0 flex items-center px-4">
                <span className="text-white text-sm font-bold drop-shadow-sm">{mainVault.percentage}%</span>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex justify-between items-end relative z-10">
              <div>
                <p className="text-white font-bold text-xl">${mainVault.current.toLocaleString()}</p>
                <p className="text-on-surface-variant/60 text-xs">of ${mainVault.target.toLocaleString()} goal</p>
              </div>
            </div>
            
            {/* Penguin peeking with celebration when near goal */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (showWelcome ? 1.5 : 0.4) }}
              className="absolute -right-2 -bottom-2 w-20 h-20 opacity-90"
            >
              <PenguinMascot mood={mainVault.percentage >= 80 ? 'celebrate' : 'encourage'} size="lg" />
            </motion.div>
          </div>
        </motion.section>
        
        {/* Stats Grid */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (showWelcome ? 1.4 : 0.15) }}
          className="grid grid-cols-2 gap-3"
        >
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (showWelcome ? 1.5 : 0.2) }}
            className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: 'FILL 1' }}>show_chart</span>
              <p className="text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-widest">
                Active Assets
              </p>
            </div>
            <p className="text-white text-2xl font-headline font-extrabold">
              ${stats.activeAssets.toLocaleString()}
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (showWelcome ? 1.5 : 0.2) }}
            className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: 'FILL 1' }}>schedule</span>
              <p className="text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-widest">
                Pending Deals
              </p>
            </div>
            <p className="text-white text-2xl font-headline font-extrabold">
              ${stats.pendingDeals.toLocaleString()}
            </p>
          </motion.div>
        </motion.section>
        
        {/* Recent Movements */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (showWelcome ? 1.6 : 0.2) }}
          className="space-y-3"
        >
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-on-surface-variant/70 text-[11px] font-bold uppercase tracking-[0.15em]">
              Recent Movements
            </h2>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/movements')}
              className="text-primary text-[11px] font-bold uppercase tracking-wide transition-transform"
            >
              See all
            </motion.button>
          </div>
          
          {/* Movement Items */}
          <div className="space-y-2">
            {RECENT_MOVEMENTS.map((movement, index) => (
              <motion.div 
                key={movement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (showWelcome ? 1.7 : 0.3) + index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 bg-surface-container-low rounded-2xl p-4 border border-outline-variant/5 cursor-pointer"
              >
                {/* Icon */}
                <div className={"w-11 h-11 rounded-xl flex items-center justify-center " + (movement.amount >= 0 ? 'bg-primary/15' : 'bg-error/15')}>
                  <span 
                    className={"material-symbols-outlined text-lg " + (movement.amount >= 0 ? 'text-primary' : 'text-error')}
                    style={{ fontVariationSettings: 'FILL 1' }}
                  >
                    {movement.icon}
                  </span>
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{movement.name}</p>
                  <p className="text-on-surface-variant/50 text-xs">{movement.category} - {movement.date}</p>
                </div>
                
                {/* Amount */}
                <div className="text-right">
                  <p className={"font-headline font-bold " + (movement.amount >= 0 ? 'text-primary' : 'text-error')}>
                    {movement.amount >= 0 ? '+' : ''}{movement.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
        
      </main>
      
      <BottomNav />
    </div>
  );
}