import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { businessService } from '../../services';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiveModal({ isOpen, onClose }: ReceiveModalProps) {
  const [copied, setCopied] = useState(false);
  const [fullAddress, setFullAddress] = useState('0x...');
  const [beexoAlias, setBeexoAlias] = useState('tunombre.bexo');
  const [cvu, setCvu] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    businessService
      .getReceiveInfo()
      .then((info) => {
        setFullAddress(info.wallet_address);
        setBeexoAlias(info.beexo_alias);
        setCvu(info.cvu ?? null);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'No se pudo cargar información de recepción');
      });
  }, [isOpen]);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(fullAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <div className="bg-surface-container-highest rounded-t-3xl md:rounded-3xl p-6 space-y-5 shadow-2xl border-t border-outline-variant/10">
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: 'FILL 1' }}>
                      qr_code
                    </span>
                  </div>
                  <div>
                    <h2 className="font-headline text-lg font-bold text-white">Receive</h2>
                    <p className="text-on-surface-variant/60 text-xs">Share your address or QR</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">close</span>
                </button>
              </div>

              {/* QR Code Placeholder */}
              <div className="flex flex-col items-center py-4">
                <div className="w-48 h-48 bg-white rounded-2xl p-4 shadow-lg">
                  {/* Placeholder QR - in production use a real QR library */}
                  <div className="w-full h-full bg-gradient-to-br from-surface-container to-surface-container-high rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <span className="material-symbols-outlined text-surface-variant text-4xl">qr_code_2</span>
                      <p className="text-on-surface-variant/40 text-[10px] mt-1">QR Code</p>
                    </div>
                  </div>
                </div>
                <p className="text-on-surface-variant/60 text-xs mt-3">Scan with Beexo or any wallet</p>
              </div>

              {/* Beexo Alias */}
              <div className="bg-surface-container rounded-2xl p-4">
                <p className="text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-widest mb-2">Your Beexo Alias</p>
                <div className="flex items-center justify-between">
                  <p className="text-white font-bold text-lg">{beexoAlias}</p>
                  <span className="bg-primary/15 text-primary text-[10px] font-bold px-2 py-1 rounded-full">EASY</span>
                </div>
              </div>

              {/* Full Address */}
              <div className="space-y-2">
                <p className="text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-widest">Full Address</p>
                <div className="flex items-center gap-2 bg-surface-container rounded-2xl px-4 py-3">
                  <p className="flex-1 text-on-surface-variant font-mono text-xs truncate">{fullAddress}</p>
                  <button
                    onClick={handleCopy}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all
                      ${copied 
                        ? 'bg-primary/20 text-primary' 
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-outline-variant/20'
                      }
                    `}
                  >
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: 'FILL 1' }}>
                      {copied ? 'check' : 'content_copy'}
                    </span>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {cvu && (
                <div className="space-y-2">
                  <p className="text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-widest">CVU</p>
                  <div className="bg-surface-container rounded-2xl px-4 py-3">
                    <p className="text-white font-mono text-sm">{cvu}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-error/10 border border-error/30 rounded-2xl p-3">
                  <p className="text-error text-xs">{error}</p>
                </div>
              )}

              {/* Networks */}
              <div className="bg-surface-container rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: 'FILL 1' }}>check_circle</span>
                  <div>
                    <p className="text-white font-semibold text-sm">Supported Networks</p>
                    <p className="text-on-surface-variant/60 text-xs">Rootstock (RBTC), DOC, RIF</p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-full py-4 rounded-2xl font-headline font-bold uppercase text-sm text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
