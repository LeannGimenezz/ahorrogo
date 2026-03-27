import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TopAppBar } from '../components/layout/TopAppBar';
import { BottomNav } from '../components/layout/BottomNav';
import { PenguinMascot } from '../components/penguin/PenguinMascot';

export function SendPage() {
  const [step, setStep] = useState<'input' | 'confirm' | 'processing' | 'success'>('input');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  
  const walletBalance = 12450; // Mock
  
  // Recent recipients
  const recentRecipients = [
    { alias: 'maria.bexo', address: '0x8a2B...cD3e' },
    { alias: 'carlos.bexo', address: '0x5f7A...e9B2' },
    { alias: 'ana.bexo', address: '0x1c4D...f8A6' },
  ];
  
  const handleSend = async () => {
    setStep('processing');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStep('success');
    setTimeout(() => {
      setStep('input');
      setAddress('');
      setAmount('');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopAppBar showBack title="Send" />
      
      <main className="pt-20 px-5 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {step === 'success' ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center text-center py-16 space-y-6"
            >
              {/* Penguin Celebration */}
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
              >
                <PenguinMascot 
                  mood="celebrate" 
                  size="xl" 
                  showMessage 
                  message="¡Enviado!"
                />
              </motion.div>
              
              <div>
                <p className="text-white font-bold text-2xl mb-2">Sent Successfully!</p>
                <p className="text-primary font-semibold text-lg">
                  ${parseFloat(amount).toLocaleString()} DOC
                </p>
                <p className="text-on-surface-variant/60 text-sm mt-2">
                  to {address}
                </p>
              </div>
            </motion.div>
          ) : step === 'processing' ? (
            <motion.div 
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center py-16 space-y-4"
            >
              <div className="w-16 h-16">
                <span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span>
              </div>
              <p className="text-white font-semibold text-lg">Processing transaction...</p>
            </motion.div>
          ) : (
            <motion.div 
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Address Input */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <label className="text-on-surface-variant/60 text-[11px] font-bold uppercase tracking-widest">
                  Recipient
                </label>
                <div className="flex items-center bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10 focus-within:border-primary/50 transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant/40 mr-2">account_circle</span>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Address or Beexo alias"
                    className="flex-1 bg-transparent text-white outline-none placeholder:text-on-surface-variant/30"
                  />
                  <button className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors">
                    <span className="material-symbols-outlined">qr_code_scanner</span>
                  </button>
                </div>
              </motion.div>

              {/* Recent Recipients */}
              {address === '' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  <p className="text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-widest">Recent</p>
                  <div className="space-y-2">
                    {recentRecipients.map((r) => (
                      <button
                        key={r.alias}
                        onClick={() => setAddress(r.alias)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors border border-outline-variant/10"
                      >
                        <div className="w-10 h-10 bg-primary/15 rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: 'FILL 1' }}>person</span>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-white font-semibold">{r.alias}</p>
                          <p className="text-on-surface-variant/60 text-xs font-mono">{r.address}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Amount Input */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="space-y-2"
              >
                <label className="text-on-surface-variant/60 text-[11px] font-bold uppercase tracking-widest">
                  Amount
                </label>
                <div className="flex items-center bg-surface-container-low rounded-2xl px-5 py-4 border border-outline-variant/10">
                  <span className="text-primary font-bold text-2xl mr-2">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-transparent text-white text-2xl font-bold outline-none placeholder:text-on-surface-variant/30"
                  />
                  <span className="text-on-surface-variant/60 text-sm font-medium">DOC</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant/60">Balance: ${walletBalance.toLocaleString()}</span>
                  <button 
                    onClick={() => setAmount(String(walletBalance))}
                    className="text-primary font-bold hover:underline"
                  >
                    MAX
                  </button>
                </div>
              </motion.div>

              {/* Network Fee */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10"
              >
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant/60">Network Fee</span>
                  <span className="text-primary font-bold">~$0.01 RBTC</span>
                </div>
              </motion.div>

              {/* Send Button */}
               <motion.button
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.15 }}
                 onClick={handleSend}
                 disabled={!address || !amount || parseFloat(amount) <= 0}
                 className={`
                   w-full py-4 rounded-2xl font-headline font-bold uppercase text-sm flex items-center justify-center gap-2 transition-all
                   ${address && amount && parseFloat(amount) > 0
                     ? 'bg-primary text-on-primary active:scale-[0.98]'
                     : 'bg-surface-container text-on-surface-variant/30 cursor-not-allowed'
                   }
                 `}
               >
                 <span className="material-symbols-outlined">send</span>
                 Send
               </motion.button>
               
               {/* Penguin Encouragement */}
               {address && amount && parseFloat(amount) > 0 && (
                 <motion.div
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="flex justify-center pt-2"
                 >
                   <PenguinMascot 
                     mood="encourage" 
                     size="sm"
                     message="¡Listo para enviar!"
                   />
                 </motion.div>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <BottomNav />
    </div>
  );
}