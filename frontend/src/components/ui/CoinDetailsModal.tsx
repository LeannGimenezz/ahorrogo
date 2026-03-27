import { AnimatePresence, motion } from 'framer-motion';

export interface CoinOption {
  id: 'doc' | 'usdrif' | 'rbtc';
  name: string;
  symbol: string;
  type: 'Stablecoin' | 'Bitcoin' | 'Rendimiento';
  apyRange: string;
  risk: 'Bajo' | 'Medio';
  liquidity: 'Alta' | 'Media';
  description: string;
  why: string;
}

interface CoinDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: CoinOption[];
  selectedCoinId?: CoinOption['id'];
}

function riskClass(risk: CoinOption['risk']) {
  return risk === 'Bajo' ? 'text-primary bg-primary/15' : 'text-secondary bg-secondary/15';
}

export function CoinDetailsModal({ isOpen, onClose, coins, selectedCoinId }: CoinDetailsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="fixed inset-x-4 top-[8%] bottom-[6%] z-[71] max-w-lg mx-auto"
          >
            <div className="h-full rounded-3xl bg-surface-container-highest border border-outline-variant/30 shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-outline-variant/25 flex items-center justify-between">
                <div>
                  <h2 className="font-headline text-xl font-extrabold text-white">Monedas para invertir</h2>
                  <p className="text-on-surface-variant/70 text-xs">Detalle de estabilidad, riesgo y rendimiento</p>
                </div>
                <button onClick={onClose} className="w-9 h-9 rounded-full surface-card flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant">close</span>
                </button>
              </div>

              <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-88px)]">
                {coins.map((coin) => {
                  const isSelected = coin.id === selectedCoinId;
                  return (
                    <article
                      key={coin.id}
                      className={`rounded-2xl p-4 border ${
                        isSelected ? 'border-primary/45 bg-primary/10' : 'border-outline-variant/25 bg-surface-container'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <div>
                          <h3 className="text-white font-bold text-lg">{coin.name}</h3>
                          <p className="text-on-surface-variant/70 text-xs">{coin.symbol} · {coin.type}</p>
                        </div>
                        {isSelected && (
                          <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-1 rounded-full">Seleccionada</span>
                        )}
                      </div>

                      <p className="text-on-surface-variant/90 text-sm mb-3">{coin.description}</p>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="rounded-xl bg-surface-container-low p-2">
                          <p className="text-on-surface-variant/60 text-[10px] uppercase font-bold">APY</p>
                          <p className="text-primary font-semibold text-sm">{coin.apyRange}</p>
                        </div>
                        <div className="rounded-xl bg-surface-container-low p-2">
                          <p className="text-on-surface-variant/60 text-[10px] uppercase font-bold">Riesgo</p>
                          <p className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${riskClass(coin.risk)}`}>{coin.risk}</p>
                        </div>
                        <div className="rounded-xl bg-surface-container-low p-2">
                          <p className="text-on-surface-variant/60 text-[10px] uppercase font-bold">Liquidez</p>
                          <p className="text-secondary font-semibold text-sm">{coin.liquidity}</p>
                        </div>
                      </div>

                      <div className="rounded-xl bg-surface-container-low/70 p-3 border border-outline-variant/20">
                        <p className="text-on-surface-variant/60 text-[10px] uppercase font-bold mb-1">¿Cuándo usarla?</p>
                        <p className="text-white text-sm">{coin.why}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
