import { motion } from 'framer-motion';
import { TopAppBar } from '../components/layout/TopAppBar';
import { BottomNav } from '../components/layout/BottomNav';
import { useAppStore } from '../store/useAppStore';
import { PenguinMascot } from '../components/penguin/PenguinMascot';
import { LEVEL_NAMES } from '../types';

export function ProfilePage() {
  const { user, penguin } = useAppStore();
  
  // Mock stats for display
  const stats = {
    totalSaved: 12450,
    totalYield: 245.50,
    streak: 5,
  };
  
  const settingsItems = [
    { icon: 'notifications', label: 'Notifications', badge: '3' },
    { icon: 'security', label: 'Security' },
    { icon: 'account_balance_wallet', label: 'Wallet Connection' },
    { icon: 'help', label: 'Help & Support' },
    { icon: 'info', label: 'About AhorroGO' },
  ];

  const xpProgress = (penguin.xp / 600) * 100;

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopAppBar title="Profile" />
      
      <main className="pt-20 px-5 max-w-lg mx-auto space-y-6">
        
{/* Profile Header */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          {/* Penguin Avatar with Accessories */}
          <div className="relative inline-block mb-4">
            <div className="w-28 h-28 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full p-1.5">
              <div className="w-full h-full bg-surface-container-high rounded-full flex items-center justify-center overflow-hidden">
                <PenguinMascot mood="happy" size="lg" />
              </div>
            </div>
            {/* Level Badge */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap shadow-lg">
              Lvl {penguin.level} {LEVEL_NAMES[penguin.level]}
            </div>
            {/* Accessories Display */}
            {penguin.accessories.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute -top-2 right-0 flex gap-0.5"
              >
                {penguin.accessories.map((acc, i) => (
                  <span key={i} className="text-lg drop-shadow-lg">
                    {acc === 'beanie' ? '🧢' : acc === 'scarf' ? '🧣' : acc === 'gloves' ? '🧤' : ' 👑'}
                  </span>
                ))}
              </motion.div>
            )}
          </div>
          
          {/* Name */}
          <h1 className="font-headline text-2xl font-bold text-white mb-1">
            {user?.alias || 'Your Name'}
          </h1>
          <p className="text-on-surface-variant/60 font-mono text-sm">
            {user?.address || '0x7a3B...9F2e'}
          </p>
        </motion.section>

        {/* XP Progress */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: 'FILL 1' }}>star</span>
              <span className="text-white font-semibold">Experience</span>
            </div>
            <span className="text-primary font-bold">{penguin.xp} / 600 XP</span>
          </div>
          <div className="relative h-3 bg-surface-variant/50 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary rounded-full"
            />
          </div>
          <p className="text-on-surface-variant/60 text-xs mt-2 text-right">
            {600 - penguin.xp} XP to next level
          </p>
        </motion.section>

        {/* Next Unlock */}
        {penguin.level < 5 && (
          <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-4 border border-primary/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">
                  {penguin.level === 1 ? '🧢' : penguin.level === 2 ? '🧣' : penguin.level === 3 ? '🧤' : '👑'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">Next Unlock</p>
                <p className="text-on-surface-variant/60 text-xs">
                  {penguin.level === 1 && 'Unlock Beanie atLevel 2'}
                  {penguin.level === 2 && 'Unlock Scarf at Level 3'}
                  {penguin.level === 3 && 'Unlock Gloves at Level 4'}
                  {penguin.level === 4 && 'Unlock Crown at Level 5'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <PenguinMascot mood="encourage" size="sm" />
              </div>
            </div>
          </motion.section>
        )}

        {/* Stats Grid */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="bg-surface-container-low rounded-2xl p-4 text-center border border-outline-variant/10">
            <div className="flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: 'FILL 1' }}>local_fire_department</span>
            </div>
            <p className="text-white text-xl font-bold">{stats.streak}</p>
            <p className="text-on-surface-variant/60 text-[10px] uppercase tracking-wider">Streak</p>
          </div>
          
          <div className="bg-surface-container-low rounded-2xl p-4 text-center border border-outline-variant/10">
            <div className="flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: 'FILL 1' }}>savings</span>
            </div>
            <p className="text-white text-xl font-bold">${stats.totalSaved.toLocaleString()}</p>
            <p className="text-on-surface-variant/60 text-[10px] uppercase tracking-wider">Saved</p>
          </div>
          
          <div className="bg-surface-container-low rounded-2xl p-4 text-center border border-outline-variant/10">
            <div className="flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: 'FILL 1' }}>trending_up</span>
            </div>
            <p className="text-white text-xl font-bold">${stats.totalYield}</p>
            <p className="text-on-surface-variant/60 text-[10px] uppercase tracking-wider">Yield</p>
          </div>
        </motion.section>

        {/* Settings */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-2"
        >
          <h2 className="text-on-surface-variant/60 text-[11px] font-bold uppercase tracking-[0.15em] px-2">
            Settings
          </h2>
          <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10">
            {settingsItems.map((item) => (
              <button 
                key={item.label}
                className="w-full flex items-center justify-between p-4 hover:bg-surface-container transition-colors active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant/70">{item.icon}</span>
                  <span className="text-white font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  <span className="material-symbols-outlined text-on-surface-variant/50">chevron_right</span>
                </div>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Disconnect Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full py-3 rounded-2xl border border-error/30 text-error font-semibold active:scale-[0.98] transition-transform"
        >
          Disconnect Wallet
        </motion.button>

      </main>
      
      <BottomNav />
    </div>
  );
}