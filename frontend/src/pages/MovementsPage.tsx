import { motion } from 'framer-motion';
import { TopAppBar } from '../components/layout/TopAppBar';
import { BottomNav } from '../components/layout/BottomNav';
import { PenguinMascot } from '../components/penguin/PenguinMascot';

// Extended movements list (15 items)
const ALL_MOVEMENTS = [
  { id: '1', name: 'Apple Store Online', amount: -1299.00, icon: 'shopping_bag', date: 'Mar 27, 2026', category: 'Compras', status: 'completed' },
  { id: '2', name: 'Salary Deposit', amount: 4500.00, icon: 'payments', date: 'Mar 26, 2026', category: 'Ingresos', status: 'completed' },
  { id: '3', name: 'Vault Yield', amount: 31.40, icon: 'trending_up', date: 'Mar 25, 2026', category: 'Yield', status: 'completed' },
  { id: '4', name: 'Netflix Subscription', amount: -15.99, icon: 'subscriptions', date: 'Mar 24, 2026', category: 'Entretenimiento', status: 'completed' },
  { id: '5', name: 'Emergency Fund Deposit', amount: -500.00, icon: 'savings', date: 'Mar 23, 2026', category: 'Ahorros', status: 'completed' },
  { id: '6', name: 'P2P Payment from maria.bexo', amount: 150.00, icon: 'person', date: 'Mar 22, 2026', category: 'P2P', status: 'completed' },
  { id: '7', name: 'Grocery Store', amount: -89.50, icon: 'shopping_cart', date: 'Mar 21, 2026', category: 'Compras', status: 'completed' },
  { id: '8', name: 'RIF Token Swap', amount: 0, icon: 'swap_horiz', date: 'Mar 20, 2026', category: 'Swap', status: 'completed' },
  { id: '9', name: 'Vacation Fund Deposit', amount: -200.00, icon: 'flight', date: 'Mar 19, 2026', category: 'Ahorros', status: 'completed' },
  { id: '10', name: 'Freelance Payment', amount: 800.00, icon: 'work', date: 'Mar 18, 2026', category: 'Ingresos', status: 'completed' },
  { id: '11', name: 'Coffee Shop', amount: -5.50, icon: 'coffee', date: 'Mar 17, 2026', category: 'Compras', status: 'completed' },
  { id: '12', name: 'Yield from Emergency Fund', amount: 12.75, icon: 'trending_up', date: 'Mar 16, 2026', category: 'Yield', status: 'completed' },
  { id: '13', name: 'Electric Bill', amount: -120.00, icon: 'bolt', date: 'Mar 15, 2026', category: 'Servicios', status: 'completed' },
  { id: '14', name: 'Birthday Gift to ana.bexo', amount: -50.00, icon: 'card_giftcard', date: 'Mar 14, 2026', category: 'P2P', status: 'completed' },
  { id: '15', name: 'Rental Deposit', amount: -1000.00, icon: 'home', date: 'Mar 10, 2026', category: 'Alquiler', status: 'completed' },
];

// Filter categories
const CATEGORIES = ['All', 'Ingresos', 'Compras', 'Ahorros', 'Yield', 'P2P', 'Swap', 'Servicios'];

export function MovementsPage() {
  // Get penguin mood based on activity
  const getPenguinMood = () => {
    const lastMovement = ALL_MOVEMENTS[0];
    if (lastMovement.amount > 0 && lastMovement.category === 'Yield') return 'celebrate';
    if (lastMovement.amount > 0) return 'happy';
    if (lastMovement.category === 'Ahorros') return 'encourage';
    return 'idle';
  };
  
  const getPenguinMessage = () => {
    const totalIncome = ALL_MOVEMENTS.filter(m => m.amount > 0).reduce((sum, m) => sum + m.amount, 0);
    const totalExpenses = ALL_MOVEMENTS.filter(m => m.amount < 0).reduce((sum, m) => sum + Math.abs(m.amount), 0);
    
    if (totalIncome > totalExpenses * 1.5) {
      return '¡Excelente balance!';
    }
    return 'Sigue ahorrando';
  };
  
  return (
    <div className="min-h-screen bg-background pb-24">
      <TopAppBar showBack title="All Movements" />
      
      <main className="pt-20 px-5 max-w-lg mx-auto space-y-5">
        
        {/* Summary Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: 'FILL 1' }}>arrow_downward</span>
              <p className="text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-widest">Income</p>
            </div>
            <p className="text-primary text-xl font-headline font-bold">
              +$5,494.15
            </p>
          </div>
          <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-error text-lg" style={{ fontVariationSettings: 'FILL 1' }}>arrow_upward</span>
              <p className="text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-widest">Expenses</p>
            </div>
            <p className="text-error text-xl font-headline font-bold">
              -$3,280.99
            </p>
          </div>
        </motion.div>

        {/* Penguin Mascot */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center py-2"
        >
          <PenguinMascot 
            mood={getPenguinMood()} 
            size="md" 
            showMessage 
            message={getPenguinMessage()}
          />
        </motion.div>

        {/* Filter Chips */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 hide-scrollbar"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`
                px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all
                ${cat === 'All' 
                  ? 'bg-primary text-on-primary' 
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Movements List */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          {ALL_MOVEMENTS.map((movement, index) => (
            <motion.div 
              key={movement.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + index * 0.03 }}
              className="flex items-center gap-3 bg-surface-container-low rounded-2xl p-4 border border-outline-variant/5 active:scale-[0.98] transition-transform cursor-pointer"
            >
              {/* Icon */}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                movement.amount >= 0 ? 'bg-primary/15' : 'bg-error/15'
              }`}>
                <span 
                  className={`material-symbols-outlined text-lg ${movement.amount >= 0 ? 'text-primary' : 'text-error'}`}
                  style={{ fontVariationSettings: 'FILL 1' }}
                >
                  {movement.icon}
                </span>
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{movement.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-on-surface-variant/50 text-xs">{movement.category}</span>
                  <span className="text-on-surface-variant/30">•</span>
                  <span className="text-on-surface-variant/50 text-xs">{movement.date}</span>
                </div>
              </div>
              
              {/* Amount */}
              <div className="text-right">
                {movement.amount !== 0 ? (
                  <p className={`font-headline font-bold ${movement.amount >= 0 ? 'text-primary' : 'text-error'}`}>
                    {movement.amount >= 0 ? '+' : ''}{movement.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </p>
                ) : (
                  <p className="text-on-surface-variant/60 text-xs">Swap</p>
                )}
              </div>
            </motion.div>
          ))}
        </motion.section>

        {/* Load More */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full py-3 rounded-2xl bg-surface-container-low text-on-surface-variant font-semibold text-sm border border-outline-variant/10 active:scale-[0.98] transition-transform"
        >
          Load More
        </motion.button>

      </main>
      
      <BottomNav />
    </div>
  );
}