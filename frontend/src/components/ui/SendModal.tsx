import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SendModal({ isOpen, onClose }: SendModalProps) {
  const [step, setStep] = useState<'recipient' | 'amount' | 'confirm' | 'processing' | 'success'>('recipient');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  
  const walletBalance = 12500; // Mock
  
  const handleSend = async () => {
    setStep('processing');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStep('success');
    setTimeout(() => {
      setStep('recipient');
      setRecipient('');
      setAmount('');
      setNote('');
      onClose();
    }, 2000);
  };

  // Mock recent recipients
  const recentRecipients = [
    { alias: 'maria.bexo', address: '0x8a2B...cD3e' },
    { alias: 'carlos.bexo', address: '0x5f7A...e9B2' },
    { alias: 'ana.bexo', address: '0x1c4D...f8A6' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
                  <div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: 'FILL 1' }}>
                      send
                    </span>
                  </div>
                  <div>
                    <h2 className="font-headline text-lg font-bold text-white">Send</h2>
                    <p className="text-on-surface-variant/60 text-xs">Transfer to any address</p>
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
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: 'FILL 1' }}>
                      check_circle
                    </span>
                  </div>
                  <p className="text-white font-bold text-xl mb-1">Sent Successfully!</p>
                  <p className="text-primary font-semibold">
                    ${parseFloat(amount).toLocaleString()} sent to {recipient}
                  </p>
                </motion.div>
              ) : step === 'processing' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4">
                    <span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span>
                  </div>
                  <p className="text-white font-semibold">Sending...</p>
                </div>
              ) : (
                <>
                  {/* Step 1: Recipient */}
                  {step === 'recipient' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-on-surface-variant/60 text-[11px] font-bold uppercase tracking-widest">
                          Recipient
                        </label>
                        <div className="flex items-center bg-surface-container rounded-2xl px-4 py-3 border border-outline-variant/10 focus-within:border-primary/50 transition-colors">
                          <span className="material-symbols-outlined text-on-surface-variant/40 mr-2">account_circle</span>
                          <input
                            type="text"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            placeholder="Address or Beexo alias"
                            className="flex-1 bg-transparent text-white outline-none placeholder:text-on-surface-variant/30"
                          />
                          <button className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors">
                            <span className="material-symbols-outlined">qr_code_scanner</span>
                          </button>
                        </div>
                      </div>

                      {/* Recent Recipients */}
                      <div className="space-y-2">
                        <p className="text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-widest">Recent</p>
                        <div className="space-y-2">
                          {recentRecipients.map((r) => (
                            <button
                              key={r.alias}
                              onClick={() => setRecipient(r.alias)}
                              className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors"
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
                      </div>

                      <button
                        onClick={() => setStep('amount')}
                        disabled={!recipient}
                        className={`
                          w-full py-4 rounded-2xl font-headline font-bold uppercase text-sm transition-all
                          ${recipient 
                            ? 'bg-primary text-on-primary active:scale-[0.98]'
                            : 'bg-surface-container text-on-surface-variant/30 cursor-not-allowed'
                          }
                        `}
                      >
                        Continue
                      </button>
                    </>
                  )}

                  {/* Step 2: Amount */}
                  {step === 'amount' && (
                    <>
                      <div className="bg-surface-container rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: 'FILL 1' }}>person</span>
                          <p className="text-white font-semibold">{recipient}</p>
                        </div>
                        <p className="text-on-surface-variant/60 text-xs">Sending to</p>
                      </div>

                      <div className="space-y-3">
                        <label className="text-on-surface-variant/60 text-[11px] font-bold uppercase tracking-widest">Amount</label>
                        <div className="flex items-center bg-surface-container rounded-2xl px-5 py-4 border border-outline-variant/10">
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
                      </div>

                      {/* Note */}
                      <div className="space-y-2">
                        <label className="text-on-surface-variant/60 text-[11px] font-bold uppercase tracking-widest">Note (optional)</label>
                        <input
                          type="text"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="What's this for?"
                          className="w-full bg-surface-container rounded-2xl px-4 py-3 text-white outline-none border border-outline-variant/10 focus:border-primary/50 placeholder:text-on-surface-variant/30"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setStep('recipient')}
                          className="flex-1 py-4 rounded-2xl font-headline font-bold uppercase text-sm text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleSend}
                          disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > walletBalance}
                          className={`
                            flex-1 py-4 rounded-2xl font-headline font-bold uppercase text-sm transition-all
                            ${amount && parseFloat(amount) > 0 && parseFloat(amount) <= walletBalance
                              ? 'bg-primary text-on-primary active:scale-[0.98]'
                              : 'bg-surface-container text-on-surface-variant/30 cursor-not-allowed'
                            }
                          `}
                        >
                          Send
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