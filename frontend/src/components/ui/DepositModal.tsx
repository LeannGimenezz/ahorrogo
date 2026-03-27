import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { PenguinMascot } from '../penguin/PenguinMascot';

// XP奖励配置
const XP_PER_DEPOSIT = {
  base: 10,// 基础XP
  perDollar: 0.5, // 每美元额外XP
  bonusThresholds: [
    { threshold: 100, bonus: 5 },
    { threshold: 500, bonus: 25 },
    { threshold: 1000, bonus: 50 },
  ],
};

function calculateXpReward(amount: number): number {
  let xp = XP_PER_DEPOSIT.base;
  xp += Math.floor(amount * XP_PER_DEPOSIT.perDollar);
  // Add bonus for larger deposits
  for (const bonus of XP_PER_DEPOSIT.bonusThresholds) {
    if (amount >= bonus.threshold) {
      xp += bonus.bonus;
    }
  }
  return Math.min(xp, 500);// Cap at 500 XP per deposit
}

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'amount' | 'method' | 'processing' | 'success'>('amount');
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'bank' | 'crypto'>('card');
  const [xpGained, setXpGained] = useState(0);
  
  const { addXp } = useAppStore();
  
  const walletBalance = 12500.00; // Mock
  
  const handleDeposit = async () => {
    setStep('processing');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Calculate and add XP
    const depositAmount = parseFloat(amount);
    const xp = calculateXpReward(depositAmount);
    setXpGained(xp);
    addXp(xp);
    
    setStep('success');
    setTimeout(() => {
      setStep('amount');
      setAmount('');
      onClose();
    }, 2500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={step === 'amount' ? onClose : undefined}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 bottom-0 z-50 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md"
          >
            <div className="bg-surface-container-highest rounded-t-3xl md:rounded-3xl p-6 space-y-5 shadow-2xl border-t border-outline-variant/10">
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: 'FILL 1' }}>
                      add_circle
                    </span>
                  </div>
                  <div>
                    <h2 className="font-headline text-lg font-bold text-white">Deposit</h2>
                    <p className="text-on-surface-variant/60 text-xs">Add funds via Beexo</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">close</span>
                </button>
              </div>

              {/* Success State */}
              {step === 'success' ? (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-center py-6"
                >
                  {/* Penguin Celebration */}
                  <div className="mb-4">
                    <PenguinMascot mood="celebrate" size="lg" showMessage message={`+${xpGained} XP!`} />
                  </div>
                  
                  <p className="text-white font-bold text-xl mb-1">Deposit Successful!</p>
                  <p className="text-primary font-semibold mb-3">
                    +${parseFloat(amount).toLocaleString()} added to your vault
                  </p>
                  
                  {/* XP Badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 bg-primary/15 rounded-full px-4 py-2"
                  >
                    <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: 'FILL 1' }}>star</span>
                    <span className="text-primary font-bold text-sm">+{xpGained} XP</span>
                  </motion.div>
                </motion.div>
              ) : step === 'processing' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4">
                    <span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span>
                  </div>
                  <p className="text-white font-semibold">Processing deposit...</p>
                </div>
              ) : (
                <>
                  {/* Amount Input */}
                  {step === 'amount' && (
                    <>
                      <div className="bg-surface-container rounded-2xl p-4">
                        <p className="text-on-surface-variant/60 text-xs mb-1">Current Balance</p>
                        <p className="text-white font-bold text-lg">${walletBalance.toLocaleString()}</p>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-on-surface-variant/60 text-[11px] font-bold uppercase tracking-widest">
                          Amount to deposit
                        </label>
                        <div className="flex items-center bg-surface-container rounded-2xl px-5 py-4 border border-outline-variant/10 focus-within:border-primary/50 transition-colors">
                          <span className="text-primary font-bold text-2xl mr-2">$</span>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="flex-1 bg-transparent text-white text-2xl font-bold outline-none placeholder:text-on-surface-variant/30"
                          />
                          <button 
                            onClick={() => setAmount('100')}
                            className="text-xs text-primary font-bold bg-primary/15 px-2.5 py-1 rounded-full hover:bg-primary/25 transition-colors"
                          >
                            MAX
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => setStep('method')}
                        disabled={!amount || parseFloat(amount) <= 0}
                        className={`
                          w-full py-4 rounded-2xl font-headline font-bold uppercase text-sm transition-all
                          ${amount && parseFloat(amount) > 0
                            ? 'bg-primary text-on-primary active:scale-[0.98]'
                            : 'bg-surface-container text-on-surface-variant/30 cursor-not-allowed'
                          }
                        `}
                      >
                        Continue
                      </button>
                    </>
                  )}

                  {/* Method Selection */}
                  {step === 'method' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-on-surface-variant/60 text-[11px] font-bold uppercase tracking-widest">
                          Payment Method
                        </label>
                        
                        {[
                          { id: 'card', icon: 'credit_card', label: 'Credit/Debit Card', fee: '2.9%' },
                          { id: 'bank', icon: 'account_balance', label: 'Bank Transfer', fee: 'Free' },
                          { id: 'crypto', icon: 'currency_bitcoin', label: 'Crypto (RBTC/DOC)', fee: 'Free' },
                        ].map((method) => (
                          <button
                            key={method.id}
                            onClick={() => setSelectedMethod(method.id as typeof selectedMethod)}
                            className={`
                              w-full flex items-center justify-between p-4 rounded-2xl border transition-all
                              ${selectedMethod === method.id 
                                ? 'bg-primary/10 border-primary/30' 
                                : 'bg-surface-container border-outline-variant/10 hover:border-outline-variant/30'
                              }
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <span 
                                className={`material-symbols-outlined ${selectedMethod === method.id ? 'text-primary' : 'text-on-surface-variant'}`}
                                style={{ fontVariationSettings: 'FILL 1' }}
                              >
                                {method.icon}
                              </span>
                              <span className={`font-semibold ${selectedMethod === method.id ? 'text-white' : 'text-on-surface-variant'}`}>
                                {method.label}
                              </span>
                            </div>
                            <span className={`text-xs font-bold ${method.fee === 'Free' ? 'text-primary' : 'text-on-surface-variant/60'}`}>
                              {method.fee}
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setStep('amount')}
                          className="flex-1 py-4 rounded-2xl font-headline font-bold uppercase text-sm text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleDeposit}
                          className="flex-1 py-4 rounded-2xl font-headline font-bold uppercase text-sm bg-primary text-on-primary active:scale-[0.98] transition-transform"
                        >
                          Deposit ${amount}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}