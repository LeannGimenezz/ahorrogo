import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { businessService } from '../../services';

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOKENS = [
  { id: 'rbtc', name: 'RBTC', icon: '฿', balance: 0.05 },
  { id: 'doc', name: 'DOC', icon: '$', balance: 12500 },
  { id: 'rif', name: 'RIF', icon: 'R', balance: 1500 },
];

export function SwapModal({ isOpen, onClose }: SwapModalProps) {
  const [fromToken, setFromToken] = useState('doc');
  const [toToken, setToToken] = useState('rbtc');
  const [fromAmount, setFromAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(0.000004);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  
  const fromTokenData = TOKENS.find(t => t.id === fromToken)!;
  const toTokenData = TOKENS.find(t => t.id === toToken)!;
  const toAmount = fromAmount ? (parseFloat(fromAmount) * exchangeRate).toFixed(8) : '0';

  useEffect(() => {
    if (!isOpen) return;
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;

    businessService
      .getSwapQuote({
        from_token: fromToken.toUpperCase(),
        to_token: toToken.toUpperCase(),
        amount: parseFloat(fromAmount),
      })
      .then((quote) => {
        setExchangeRate(quote.rate);
        setQuoteError(null);
      })
      .catch((err) => {
        setQuoteError(err instanceof Error ? err.message : 'No se pudo cotizar el swap');
      });
  }, [isOpen, fromToken, toToken, fromAmount]);
  
  const handleSwap = async () => {
    setIsProcessing(true);
    try {
      await businessService.executeSwap({
        from_token: fromToken.toUpperCase(),
        to_token: toToken.toUpperCase(),
        amount: parseFloat(fromAmount),
      });
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setFromAmount('');
        onClose();
      }, 2000);
    } catch (err) {
      setIsProcessing(false);
      setQuoteError(err instanceof Error ? err.message : 'No se pudo ejecutar el swap');
    }
  };

  const handleFlip = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount('');
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
            <div className="bg-surface-container-highest rounded-t-3xl md:rounded-3xl p-6 space-y-4 shadow-2xl border-t border-outline-variant/10">
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-tertiary/20 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: 'FILL 1' }}>
                      swap_horiz
                    </span>
                  </div>
                  <div>
                    <h2 className="font-headline text-lg font-bold text-white">Swap</h2>
                    <p className="text-on-surface-variant/60 text-xs">Powered by Tropykus</p>
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
              {isSuccess ? (
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
                  <p className="text-white font-bold text-xl mb-1">Swap Successful!</p>
                  <p className="text-primary font-semibold">
                    {fromAmount} {fromTokenData.name} → {toAmount} {toTokenData.name}
                  </p>
                </motion.div>
              ) : isProcessing ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4">
                    <span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span>
                  </div>
                  <p className="text-white font-semibold">Processing swap...</p>
                </div>
              ) : (
                <>
                  {/* From Token */}
                  <div className="space-y-2">
                    <label className="text-on-surface-variant/60 text-[11px] font-bold uppercase tracking-widest">From</label>
                    <div className="bg-surface-container rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <input
                          type="number"
                          value={fromAmount}
                          onChange={(e) => setFromAmount(e.target.value)}
                          placeholder="0.00"
                          className="flex-1 bg-transparent text-white text-2xl font-bold outline-none placeholder:text-on-surface-variant/30"
                        />
                        <button className="flex items-center gap-2 bg-primary/15 text-primary px-3 py-2 rounded-xl font-bold">
                          <span className="text-lg">{fromTokenData.icon}</span>
                          <span>{fromTokenData.name}</span>
                          <span className="material-symbols-outlined text-sm">expand_more</span>
                        </button>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-on-surface-variant/60">Balance: {fromTokenData.balance.toLocaleString()} {fromTokenData.name}</span>
                        <button 
                          onClick={() => setFromAmount(String(fromTokenData.balance))}
                          className="text-primary font-bold hover:underline"
                        >
                          MAX
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Flip Button */}
                  <div className="flex justify-center -my-2 relative z-10">
                    <button
                      onClick={handleFlip}
                      className="w-10 h-10 bg-surface-container-highest rounded-full flex items-center justify-center border-4 border-background shadow-lg hover:scale-110 transition-transform"
                    >
                      <span className="material-symbols-outlined text-primary">swap_vert</span>
                    </button>
                  </div>

                  {/* To Token */}
                  <div className="space-y-2">
                    <label className="text-on-surface-variant/60 text-[11px] font-bold uppercase tracking-widest">To</label>
                    <div className="bg-surface-container rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="flex-1 text-white text-2xl font-bold">{toAmount}</p>
                        <button className="flex items-center gap-2 bg-surface-container-high px-3 py-2 rounded-xl font-bold text-on-surface-variant">
                          <span className="text-lg">{toTokenData.icon}</span>
                          <span>{toTokenData.name}</span>
                          <span className="material-symbols-outlined text-sm">expand_more</span>
                        </button>
                      </div>
                      <p className="text-xs text-on-surface-variant/60">Balance: {toTokenData.balance.toLocaleString()} {toTokenData.name}</p>
                    </div>
                  </div>

                  {/* Rate Info */}
                  <div className="bg-surface-container rounded-2xl p-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant/60">Rate</span>
                      <span className="text-white font-semibold">1 {fromTokenData.name} = {exchangeRate} {toTokenData.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-2">
                      <span className="text-on-surface-variant/60">Fee</span>
                      <span className="text-primary font-bold">~0.1%</span>
                    </div>
                  </div>

                  {quoteError && (
                    <div className="bg-error/10 border border-error/30 rounded-2xl p-3">
                      <p className="text-error text-xs">{quoteError}</p>
                    </div>
                  )}

                  {/* Swap Button */}
                  <button
                    onClick={handleSwap}
                    disabled={!fromAmount || parseFloat(fromAmount) <= 0}
                    className={`
                      w-full py-4 rounded-2xl font-headline font-bold uppercase text-sm transition-all
                      ${fromAmount && parseFloat(fromAmount) > 0
                        ? 'bg-primary text-on-primary active:scale-[0.98]'
                        : 'bg-surface-container text-on-surface-variant/30 cursor-not-allowed'
                      }
                    `}
                  >
                    Swap
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
