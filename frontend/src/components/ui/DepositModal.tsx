import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { PenguinMascot } from '../penguin/PenguinMascot';
import { businessService } from '../../services';

// XP reward config
const XP_PER_DEPOSIT = {
  base: 10,
  perDollar: 0.5,
  bonusThresholds: [
    { threshold: 100, bonus: 5 },
    { threshold: 500, bonus: 25 },
    { threshold: 1000, bonus: 50 },
  ],
};

function calculateXpReward(amount: number): number {
  let xp = XP_PER_DEPOSIT.base;
  xp += Math.floor(amount * XP_PER_DEPOSIT.perDollar);
  for (const bonus of XP_PER_DEPOSIT.bonusThresholds) {
    if (amount >= bonus.threshold) {
      xp += bonus.bonus;
    }
  }
  return Math.min(xp, 500);
}

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'amount' | 'vault' | 'method' | 'processing' | 'success'>('amount');
  const [selectedMethod, setSelectedMethod] = useState<'beexo' | 'card' | 'bank' | 'crypto'>('beexo');
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);
  const [xpGained, setXpGained] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const { addXp, vaults } = useAppStore();
  const activeVaults = vaults.filter(v => v.status === 'active');
  const walletBalance = 12500.00;
  
  const selectedVault = activeVaults.find(v => v.id === selectedVaultId);
  
  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount);
    if (!depositAmount || depositAmount <= 0) {
      setError('Ingresá un monto válido.');
      return;
    }

    const fallbackVaultId = selectedVaultId ?? activeVaults[0]?.id;
    if (!fallbackVaultId) {
      setError('No hay bóvedas activas disponibles para depositar.');
      return;
    }

    setStep('processing');
    setError(null);

    try {
      const response = await businessService.depositToVault({
        vault_id: fallbackVaultId,
        amount: depositAmount,
        payment_method: selectedMethod,
      });

      const xp = response.xp_earned ?? calculateXpReward(depositAmount);
      setXpGained(xp);
      addXp(xp);
      setStep('success');

      setTimeout(() => {
        setStep('amount');
        setAmount('');
        setSelectedVaultId(null);
        onClose();
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo procesar el depósito.');
      setStep('method');
    }
  };

  const handleClose = () => {
    if (step === 'amount' || step === 'vault') {
      setStep('amount');
      setAmount('');
      setSelectedVaultId(null);
      onClose();
    }
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
            onClick={handleClose}
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
                    <h2 className="font-headline text-lg font-bold text-white">Depositar</h2>
                    <p className="text-on-surface-variant/60 text-xs">
                      {step === 'vault' ? 'Elegí destino' : step === 'method' ? 'Medio de pago' : 'Agregar fondos vía Beexo'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
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
                  <div className="mb-4">
                    <PenguinMascot mood="celebrate" size="lg" showMessage message={`+${xpGained} XP!`} />
                  </div>
                  
                  <p className="text-white font-bold text-xl mb-1">¡Depósito exitoso!</p>
                  <p className="text-primary font-semibold mb-1">
                    +${parseFloat(amount).toLocaleString()} depositados
                  </p>
                  {selectedVault && (
                    <p className="text-on-surface-variant/60 text-sm">
                      en {selectedVault.name}
                    </p>
                  )}
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 bg-primary/15 rounded-full px-4 py-2 mt-3"
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
                  <p className="text-white font-semibold">Procesando depósito...</p>
                </div>
              ) : (
                <>
                  {/* Amount Input */}
                  {step === 'amount' && (
                    <>
                      <div className="bg-surface-container rounded-2xl p-4">
                        <p className="text-on-surface-variant/60 text-xs mb-1">Balance actual</p>
                        <p className="text-white font-bold text-lg">${walletBalance.toLocaleString()}</p>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-on-surface-variant/60 text-[11px] font-bold uppercase tracking-widest">
                          Monto a depositar
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
                        onClick={() => { setError(null); setStep('vault'); }}
                        disabled={!amount || parseFloat(amount) <= 0}
                        className={`
                          w-full py-4 rounded-2xl font-headline font-bold uppercase text-sm transition-all
                          ${amount && parseFloat(amount) > 0
                            ? 'bg-primary text-on-primary active:scale-[0.98]'
                            : 'bg-surface-container text-on-surface-variant/30 cursor-not-allowed'
                          }
                        `}
                      >
                        Continuar
                      </button>
                    </>
                  )}

                  {/* Vault Selection */}
                  {step === 'vault' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-on-surface-variant/60 text-[11px] font-bold uppercase tracking-widest">
                          Destino del depósito
                        </label>
                        
                        {/* General Balance Option */}
                        <button
                          onClick={() => setSelectedVaultId(null)}
                          className={`
                            w-full flex items-center justify-between p-4 rounded-2xl border transition-all
                            ${selectedVaultId === null
                              ? 'bg-primary/10 border-primary/30'
                              : 'bg-surface-container border-outline-variant/10 hover:border-outline-variant/30'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedVaultId === null ? 'bg-primary' : 'bg-surface-container-high'}`}>
                              <span className={`material-symbols-outlined ${selectedVaultId === null ? 'text-on-primary' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: 'FILL 1' }}>
                                account_balance_wallet
                              </span>
                            </div>
                            <div className="text-left">
                              <p className={`font-semibold ${selectedVaultId === null ? 'text-white' : 'text-on-surface-variant'}`}>Balance General</p>
                              <p className="text-on-surface-variant/60 text-xs">Sin restricciones</p>
                            </div>
                          </div>
                          {selectedVaultId === null && (
                            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: 'FILL 1' }}>check_circle</span>
                          )}
                        </button>

                        {/* Vault Options */}
                        {activeVaults.map((vault) => {
                          const remaining = Math.max(0, vault.target - vault.current);
                          const progress = vault.target > 0 ? Math.round((vault.current / vault.target) * 100) : 0;
                          const isSelected = selectedVaultId === vault.id;

                          return (
                            <button
                              key={vault.id}
                              onClick={() => setSelectedVaultId(vault.id)}
                              className={`
                                w-full flex items-center justify-between p-4 rounded-2xl border transition-all
                                ${isSelected
                                  ? 'bg-primary/10 border-primary/30'
                                  : 'bg-surface-container border-outline-variant/10 hover:border-outline-variant/30'
                                }
                              `}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-primary' : 'bg-surface-container-high'}`}>
                                  <span className={`material-symbols-outlined ${isSelected ? 'text-on-primary' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: 'FILL 1' }}>
                                    savings
                                  </span>
                                </div>
                                <div className="text-left">
                                  <p className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-on-surface-variant'}`}>{vault.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <div className="w-16 h-1.5 bg-surface-variant/50 rounded-full overflow-hidden">
                                      <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                                    </div>
                                    <span className="text-on-surface-variant/50 text-[10px]">{progress}%</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                {remaining > 0 ? (
                                  <p className="text-primary text-xs font-bold">Faltan ${remaining.toLocaleString()}</p>
                                ) : (
                                  <span className="bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">Completo</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {error && (
                        <div className="bg-error/10 border border-error/30 rounded-2xl p-3">
                          <p className="text-error text-xs">{error}</p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => { setError(null); setStep('amount'); }}
                          className="flex-1 py-4 rounded-2xl font-headline font-bold uppercase text-sm text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors"
                        >
                          Volver
                        </button>
                        <button
                          onClick={() => { setError(null); setStep('method'); }}
                          className="flex-1 py-4 rounded-2xl font-headline font-bold uppercase text-sm bg-primary text-on-primary active:scale-[0.98] transition-transform"
                        >
                          Continuar
                        </button>
                      </div>
                    </>
                  )}

                  {/* Method Selection */}
                  {step === 'method' && (
                    <>
                      {/* Selected Vault Summary */}
                      <div className="bg-surface-container rounded-2xl p-3 flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: 'FILL 1' }}>
                          {selectedVault ? 'savings' : 'account_balance_wallet'}
                        </span>
                        <div>
                          <p className="text-on-surface-variant/60 text-[10px]">Depositando en</p>
                          <p className="text-white font-semibold text-sm">{selectedVault?.name || 'Balance General'}</p>
                        </div>
                        <p className="text-primary font-bold ml-auto">${parseFloat(amount).toLocaleString()}</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-on-surface-variant/60 text-[11px] font-bold uppercase tracking-widest">
                          Medio de pago
                        </label>
                        
                        {[
                          { id: 'beexo', icon: 'account_balance_wallet', label: 'Balance Beexo', fee: 'Gratis' },
                          { id: 'card', icon: 'credit_card', label: 'Tarjeta de Crédito/Débito', fee: '2.9%' },
                          { id: 'bank', icon: 'account_balance', label: 'Transferencia Bancaria', fee: 'Gratis' },
                          { id: 'crypto', icon: 'currency_bitcoin', label: 'Crypto (RBTC/DOC)', fee: 'Gratis' },
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
                            <span className={`text-xs font-bold ${method.fee === 'Gratis' ? 'text-primary' : 'text-on-surface-variant/60'}`}>
                              {method.fee}
                            </span>
                          </button>
                        ))}
                      </div>

                      {error && (
                        <div className="bg-error/10 border border-error/30 rounded-2xl p-3">
                          <p className="text-error text-xs">{error}</p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => { setError(null); setStep('vault'); }}
                          className="flex-1 py-4 rounded-2xl font-headline font-bold uppercase text-sm text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors"
                        >
                          Volver
                        </button>
                        <button
                          onClick={handleDeposit}
                          className="flex-1 py-4 rounded-2xl font-headline font-bold uppercase text-sm bg-primary text-on-primary active:scale-[0.98] transition-transform"
                        >
                          Depositar ${amount}
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