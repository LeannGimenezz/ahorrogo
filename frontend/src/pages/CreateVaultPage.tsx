import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TopAppBar } from '../components/layout/TopAppBar';
import { BottomNav } from '../components/layout/BottomNav';
import { PenguinMascot } from '../components/penguin/PenguinMascot';
import { CoinDetailsModal, type CoinOption } from '../components/ui/CoinDetailsModal';

// Vault types with icons and descriptions
const VAULT_TYPES = [
  {
    id: 'savings',
    icon: 'shopping_cart',
    title: 'Compra Protegida',
    description: 'Ahorra para una compra importante con bloqueo en blockchain',
    examples: 'MacBook, iPhone, Viaje',
    yield: '4.5%',
    lockType: 'Fecha fija',
  },
  {
    id: 'rental',
    icon: 'home',
    title: 'Garantía de Alquiler',
    description: 'Colateral verificable con rendimiento para el inquilino',
    examples: 'Depósito de garantía',
    yield: '3.5%',
    lockType: 'Mensual',
  },
  {
    id: 'p2p',
    icon: 'handshake',
    title: 'Venta Protegida',
    description: 'Escrow descentralizado con liberación condicional',
    examples: 'Venta de auto, bici, electrónicos',
    yield: '4.0%',
    lockType: 'Condicional',
  },
  {
    id: 'finance',
    icon: 'account_balance',
    title: 'Finanzas Personales',
    description: 'Gestión de ahorros con liberaciones por porcentaje',
    examples: 'Fondo emergencia, Ahorro mensual',
    yield: '4.6%',
    lockType: 'Tramos',
  },
];


const INVESTMENT_COINS: CoinOption[] = [
  {
    id: 'doc',
    name: 'Dollar on Chain',
    symbol: 'DOC',
    type: 'Stablecoin',
    apyRange: '3.8% - 4.8%',
    risk: 'Bajo',
    liquidity: 'Alta',
    description: 'Stablecoin orientada a preservar valor en dólares y reducir volatilidad.',
    why: 'Ideal para objetivos conservadores como garantía de alquiler o compras planificadas.',
  },
  {
    id: 'usdrif',
    name: 'USD RIF',
    symbol: 'USDRIF',
    type: 'Rendimiento',
    apyRange: '4.6% - 5.6%',
    risk: 'Medio',
    liquidity: 'Media',
    description: 'Activo estable del ecosistema Rootstock con oportunidades de rendimiento más alto.',
    why: 'Conveniente para metas con horizonte medio/largo donde priorizás crecimiento.',
  },
  {
    id: 'rbtc',
    name: 'Rootstock BTC',
    symbol: 'RBTC',
    type: 'Bitcoin',
    apyRange: '2.0% - 4.0%',
    risk: 'Medio',
    liquidity: 'Alta',
    description: 'Exposición a Bitcoin en Rootstock, útil para perfiles con tolerancia a variación de precio.',
    why: 'Útil si querés combinar ahorro con exposición al activo base del ecosistema.',
  },
];

// Penguin messages for each step
const STEP_MESSAGES = {
  1: '¿Qué querés ahorrar?',
  2: 'Configurá tu objetivo',
  3: '¡Excelente elección!',
};

export function CreateVaultPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedCoinId, setSelectedCoinId] = useState<CoinOption['id']>('doc');
  const [showCoinDetails, setShowCoinDetails] = useState(false);

  // Rental-specific fields
  const [ownerAddress, setOwnerAddress] = useState('');
  const [guaranteeMonths, setGuaranteeMonths] = useState(6);

  // Protected sale fields
  const [sellerAddress, setSellerAddress] = useState('');
  const [releaseCondition, setReleaseCondition] = useState('Entrega confirmada por ambas partes');

  // Finance management fields
  const [releaseTramos, setReleaseTramos] = useState([
    { id: 'r1', label: 'Primer tramo', percentage: 33 },
    { id: 'r2', label: 'Segundo tramo', percentage: 33 },
    { id: 'r3', label: 'Tramo final', percentage: 34 },
  ]);

  const selectedVaultType = VAULT_TYPES.find(t => t.id === selectedType);
  const selectedCoin = INVESTMENT_COINS.find((coin) => coin.id === selectedCoinId);

  const getDuration = () => {
    if (selectedType === 'rental') {
      return guaranteeMonths;
    }
    if (!unlockDate) return 0;
    const target2 = new Date(unlockDate);
    const now = new Date();
    const months = Math.max(0, Math.round((target2.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    return months;
  };

  const duration = getDuration();

  const estimatedYield = target && duration 
    ? (parseFloat(target) * 0.045 * (duration / 12)).toFixed(2) 
    : '0.00';

  const platformFee = target 
    ? (parseFloat(target) * 0.005).toFixed(2) 
    : '0.00';

  const handleCreate = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setIsSuccess(true);
    
    setTimeout(() => {
      navigate('/vaults');
    }, 2000);
  };

  const canProceedStep2 = () => {
    const hasBase = name.length >= 3 && target && parseFloat(target) > 0;
    if (!hasBase) return false;

    if (selectedType === 'rental') {
      return ownerAddress.length >= 3 && guaranteeMonths > 0;
    }
    if (selectedType === 'p2p') {
      return !!unlockDate;
    }
    if (selectedType === 'finance') {
      const totalPct = releaseTramos.reduce((s, t) => s + t.percentage, 0);
      return totalPct === 100;
    }
    return !!unlockDate;
  };

  const getPenguinMood = () => {
    if (isSuccess) return 'celebrate';
    if (isProcessing) return 'thinking';
    if (step === 3) return 'happy';
    return 'guide';
  };

  const getPenguinMessage = () => {
    if (isSuccess) return '¡Vault creado!';
    if (isProcessing) return 'Creando...';
    return STEP_MESSAGES[step];
  };

  const updateTramoPercentage = (id: string, pct: number) => {
    setReleaseTramos(prev => prev.map(t => t.id === id ? { ...t, percentage: pct } : t));
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopAppBar showBack title="Crear Vault" />

      <CoinDetailsModal
        isOpen={showCoinDetails}
        onClose={() => setShowCoinDetails(false)}
        coins={INVESTMENT_COINS}
        selectedCoinId={selectedCoinId}
      />
      
      <main className="pt-20 px-5 max-w-lg mx-auto">
        
        {/* Penguin Guide */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-4"
        >
          <PenguinMascot 
            mood={getPenguinMood()} 
            size="lg" 
            showMessage 
            message={getPenguinMessage()} 
          />
        </motion.div>

        {/* Progress Steps */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 mb-6"
        >
          {[
            { num: 1, label: 'Tipo' },
            { num: 2, label: 'Config' },
            { num: 3, label: 'Confirm' },
          ].map((s, index) => (
            <div key={s.num} className="flex items-center">
              <div className="flex items-center gap-2">
                <motion.div 
                  initial={{ scale: step >= s.num ? 0.8 : 1 }}
                  animate={{ scale: step >= s.num ? 1 : 0.9 }}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                    ${step >= s.num 
                      ? 'bg-primary text-on-primary' 
                      : 'bg-surface-container-low text-on-surface-variant/50'
                    }
                  `}
                >
                  {step > s.num ? (
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: 'FILL 1' }}>check</span>
                  ) : s.num}
                </motion.div>
                <span className={`
                  text-xs font-semibold hidden sm:block transition-colors
                  ${step >= s.num ? 'text-primary' : 'text-on-surface-variant/50'}
                `}>
                  {s.label}
                </span>
              </div>
              {index < 2 && (
                <div className={`
                  w-8 h-0.5 mx-1 transition-colors
                  ${step > s.num ? 'bg-primary' : 'bg-surface-container'}
                `} />
              )}
            </div>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Step 1: Vault Type Selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="mb-4">
                <h2 className="text-white text-xl font-headline font-bold mb-2">¿Para qué querés ahorrar?</h2>
                <p className="text-on-surface-variant/60 text-sm">Seleccioná el tipo de vault que querés crear</p>
              </div>

              <div className="space-y-3">
                {VAULT_TYPES.map((type, index) => (
                  <motion.button
                    key={type.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedType(type.id)}
                    className={`
                      w-full flex items-start gap-4 p-4 rounded-2xl border transition-all text-left
                      ${selectedType === type.id 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'bg-surface-container-low border-outline-variant/10 hover:border-outline-variant/30'
                      }
                    `}
                  >
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center transition-colors
                      ${selectedType === type.id ? 'bg-primary' : 'bg-surface-container'}
                    `}>
                      <span 
                        className={"material-symbols-outlined text-xl " + (selectedType === type.id ? 'text-on-primary' : 'text-on-surface-variant')}
                        style={{ fontVariationSettings: 'FILL 1' }}
                      >
                        {type.icon}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold">{type.title}</h3>
                        <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {type.yield} APY
                        </span>
                      </div>
                      <p className="text-on-surface-variant/60 text-xs mb-1">{type.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-on-surface-variant/40 text-[10px]">{type.examples}</span>
                        <span className="text-on-surface-variant/30 text-[10px]">·</span>
                        <span className="text-secondary text-[10px] font-semibold">{type.lockType}</span>
                      </div>
                    </div>
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center transition-colors
                      ${selectedType === type.id ? 'bg-primary' : 'bg-surface-container'}
                    `}>
                      {selectedType === type.id && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="material-symbols-outlined text-on-primary text-sm" 
                          style={{ fontVariationSettings: 'FILL 1' }}
                        >
                          check
                        </motion.span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={() => selectedType && setStep(2)}
                disabled={!selectedType}
                className={`
                  w-full py-4 rounded-2xl font-headline font-bold uppercase text-sm mt-6 transition-all
                  ${selectedType 
                    ? 'bg-primary text-on-primary active:scale-[0.98]' 
                    : 'bg-surface-container text-on-surface-variant/30 cursor-not-allowed'
                  }
                `}
              >
                Continuar
              </motion.button>
            </motion.div>
          )}

          {/* Step 2: Configuration */}
          {step === 2 && selectedVaultType && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="mb-4">
                <h2 className="text-white text-xl font-headline font-bold mb-2">Configurá tu vault</h2>
                <p className="text-on-surface-variant/60 text-sm">Definí los detalles de tu {selectedVaultType.title.toLowerCase()}</p>
              </div>

              {/* Selected Type Summary */}
              <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-primary" style={{ fontVariationSettings: 'FILL 1' }}>
                      {selectedVaultType.icon}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{selectedVaultType.title}</p>
                    <p className="text-on-surface-variant/60 text-xs">{selectedVaultType.yield} APY - {selectedVaultType.lockType}</p>
                  </div>
                </div>
              </div>

              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-on-surface-variant/60 text-[11px] font-bold uppercase tracking-widest">
                  Nombre del vault
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={selectedType === 'rental' ? 'ej, Garantía Depto Palermo' : selectedType === 'p2p' ? 'ej, Venta Bici' : selectedType === 'finance' ? 'ej, Fondo Emergencia' : 'ej, MacBook Pro 2026'}
                  className="w-full bg-surface-container-low rounded-2xl px-4 py-3 text-white outline-none border border-outline-variant/10 focus:border-primary/50 placeholder:text-on-surface-variant/30"
                  maxLength={30}
                />
                <p className="text-on-surface-variant/40 text-xs">{name.length}/30 caracteres</p>
              </div>

              {/* Target Amount */}
              <div className="space-y-2">
                <label className="text-on-surface-variant/60 text-[11px] font-bold uppercase tracking-widest">
                  {selectedType === 'rental' ? 'Monto de garantía' : selectedType === 'p2p' ? 'Precio de venta' : 'Monto objetivo'}
                </label>
                <div className="flex items-center bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10 focus-within:border-primary/50">
                  <span className="text-primary font-bold text-2xl mr-2">$</span>
                  <input
                    type="number"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-transparent text-white text-2xl font-bold outline-none placeholder:text-on-surface-variant/30"
                  />
                  <span className="text-on-surface-variant/60 text-sm">DOC</span>
                </div>
              </div>

              {/* ========== RENTAL-SPECIFIC FIELDS ========== */}
              {selectedType === 'rental' && (
                <>
                  <div className="space-y-2">
                    <label className="text-on-surface-variant/60 text-[11px] font-bold uppercase tracking-widest">
                      Wallet del propietario
                    </label>
                    <div className="flex items-center bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10 focus-within:border-primary/50">
                      <span className="material-symbols-outlined text-on-surface-variant/40 mr-2">person</span>
                      <input
                        type="text"
                        value={ownerAddress}
                        onChange={(e) => setOwnerAddress(e.target.value)}
                        placeholder="propietario.bexo o 0x..."
                        className="flex-1 bg-transparent text-white outline-none placeholder:text-on-surface-variant/30 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-on-surface-variant/60 text-[11px] font-bold uppercase tracking-widest">
                      Meses de garantía: <span className="text-primary">{guaranteeMonths}</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={24}
                      value={guaranteeMonths}
                      onChange={(e) => setGuaranteeMonths(parseInt(e.target.value))}
                      className="w-full accent-primary h-2 bg-surface-variant rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-on-surface-variant/50">
                      <span>1 mes</span>
                      <span>12 meses</span>
                      <span>24 meses</span>
                    </div>
                  </div>

                  <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: 'FILL 1' }}>event</span>
                      <div>
                        <p className="text-on-surface-variant/60 text-[10px] uppercase font-bold">Fecha de liberación</p>
                        <p className="text-white font-semibold text-sm">
                          {(() => {
                            const d = new Date();
                            d.setMonth(d.getMonth() + guaranteeMonths);
                            return d.toLocaleDateString('es-AR', { month: 'long', day: 'numeric', year: 'numeric' });
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ========== PROTECTED SALE FIELDS ========== */}
              {selectedType === 'p2p' && (
                <>
                  <div className="space-y-2">
                    <label className="text-on-surface-variant/60 text-[11px] font-bold uppercase tracking-widest">
                      Wallet del vendedor (opcional)
                    </label>
                    <div className="flex items-center bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10 focus-within:border-primary/50">
                      <span className="material-symbols-outlined text-on-surface-variant/40 mr-2">storefront</span>
                      <input
                        type="text"
                        value={sellerAddress}
                        onChange={(e) => setSellerAddress(e.target.value)}
                        placeholder="vendedor.bexo o 0x..."
                        className="flex-1 bg-transparent text-white outline-none placeholder:text-on-surface-variant/30 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-on-surface-variant/60 text-[11px] font-bold uppercase tracking-widest">
                      Condición de liberación
                    </label>
                    <input
                      type="text"
                      value={releaseCondition}
                      onChange={(e) => setReleaseCondition(e.target.value)}
                      placeholder="ej. Entrega confirmada por ambas partes"
                      className="w-full bg-surface-container-low rounded-2xl px-4 py-3 text-white outline-none border border-outline-variant/10 focus:border-primary/50 placeholder:text-on-surface-variant/30 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-on-surface-variant/60 text-[11px] font-bold uppercase tracking-widest">
                      Fecha límite
                    </label>
                    <input
                      type="date"
                      value={unlockDate}
                      onChange={(e) => setUnlockDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-surface-container-low rounded-2xl px-4 py-3 text-white outline-none border border-outline-variant/10 focus:border-primary/50"
                    />
                  </div>

                  <div className="bg-tertiary/10 border border-tertiary/30 rounded-2xl p-4">
                    <div className="flex gap-3">
                      <span className="material-symbols-outlined text-tertiary flex-shrink-0" style={{ fontVariationSettings: 'FILL 1' }}>gavel</span>
                      <div>
                        <p className="text-white font-semibold text-sm">Escrow descentralizado</p>
                        <p className="text-on-surface-variant/60 text-xs mt-1">
                          Los fondos se bloquean hasta que ambas partes confirmen la transacción.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ========== FINANCE MANAGEMENT FIELDS ========== */}
              {selectedType === 'finance' && (
                <>
                  <div className="space-y-2">
                    <label className="text-on-surface-variant/60 text-[11px] font-bold uppercase tracking-widest">
                      Fecha de cierre
                    </label>
                    <input
                      type="date"
                      value={unlockDate}
                      onChange={(e) => setUnlockDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-surface-container-low rounded-2xl px-4 py-3 text-white outline-none border border-outline-variant/10 focus:border-primary/50"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-on-surface-variant/60 text-[11px] font-bold uppercase tracking-widest">
                        Tramos de liberación
                      </label>
                      <span className={`text-xs font-bold ${releaseTramos.reduce((s, t) => s + t.percentage, 0) === 100 ? 'text-primary' : 'text-error'}`}>
                        {releaseTramos.reduce((s, t) => s + t.percentage, 0)}%
                      </span>
                    </div>

                    {releaseTramos.map((tramo, i) => {
                      const colors = ['text-primary', 'text-secondary', 'text-tertiary'];
                      return (
                        <div key={tramo.id} className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white text-sm font-semibold">{tramo.label}</span>
                            <span className={`text-sm font-bold ${colors[i % colors.length]}`}>{tramo.percentage}%</span>
                          </div>
                          <input
                            type="range"
                            min={5}
                            max={80}
                            value={tramo.percentage}
                            onChange={(e) => updateTramoPercentage(tramo.id, parseInt(e.target.value))}
                            className="w-full accent-primary h-1.5 bg-surface-variant rounded-full appearance-none cursor-pointer"
                          />
                          {target && (
                            <p className="text-on-surface-variant/50 text-xs mt-1">
                              ${Math.round(parseFloat(target) * (tramo.percentage / 100)).toLocaleString()} DOC
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ========== DEFAULT: SAVINGS ========== */}
              {(selectedType === 'savings') && (
                <div className="space-y-2">
                  <label className="text-on-surface-variant/60 text-[11px] font-bold uppercase tracking-widest">
                    Fecha de desbloqueo
                  </label>
                  <input
                    type="date"
                    value={unlockDate}
                    onChange={(e) => setUnlockDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-surface-container-low rounded-2xl px-4 py-3 text-white outline-none border border-outline-variant/10 focus:border-primary/50"
                  />
                  {duration > 0 && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-primary text-xs font-semibold"
                    >
                      {duration} meses hasta el desbloqueo
                    </motion.p>
                  )}
                </div>
              )}

              {/* Investment coin */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-on-surface-variant/60 text-[11px] font-bold uppercase tracking-widest">
                    Moneda de inversión
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCoinDetails(true)}
                    className="text-xs font-bold text-secondary hover:text-primary transition-colors"
                  >
                    Ver detalles
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {INVESTMENT_COINS.map((coin) => {
                    const isActive = coin.id === selectedCoinId;
                    return (
                      <button
                        key={coin.id}
                        type="button"
                        onClick={() => setSelectedCoinId(coin.id)}
                        className={`rounded-xl px-3 py-2 border text-left transition-colors ${
                          isActive
                            ? 'bg-primary/15 border-primary/40 text-primary'
                            : 'bg-surface-container-low border-outline-variant/15 text-on-surface-variant'
                        }`}
                      >
                        <p className="text-sm font-bold">{coin.symbol}</p>
                        <p className="text-[10px] opacity-80">{coin.apyRange}</p>
                      </button>
                    );
                  })}
                </div>

                {selectedCoin && (
                  <p className="text-xs text-on-surface-variant/70">{selectedCoin.description}</p>
                )}
              </div>

              {/* Navigation */}
              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 rounded-2xl font-headline font-bold uppercase text-sm text-on-surface-variant bg-surface-container-low hover:bg-surface-container transition-colors"
                >
                  Volver
                </motion.button>
                <motion.button
                  whileHover={{ scale: canProceedStep2() ? 1.02 : 1 }}
                  whileTap={{ scale: canProceedStep2() ? 0.98 : 1 }}
                  onClick={() => canProceedStep2() && setStep(3)}
                  disabled={!canProceedStep2()}
                  className={`
                    flex-1 py-4 rounded-2xl font-headline font-bold uppercase text-sm transition-all
                    ${canProceedStep2() 
                      ? 'bg-primary text-on-primary active:scale-[0.98]' 
                      : 'bg-surface-container text-on-surface-variant/30 cursor-not-allowed'
                    }
                  `}
                >
                  Continuar
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Summary */}
          {step === 3 && selectedVaultType && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {/* Success State */}
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="w-24 h-24 mx-auto mb-6"
                  >
                    <PenguinMascot mood="celebrate" size="xl" />
                  </motion.div>
                  <h2 className="text-white text-2xl font-headline font-bold mb-2">¡Vault Creado!</h2>
                  <p className="text-on-surface-variant/60">Tu vault está activo y generando rendimiento.</p>
                </motion.div>
              ) : isProcessing ? (
                <div className="text-center py-12">
                  <div className="mb-4">
                    <PenguinMascot mood="thinking" size="xl" showMessage message="Creando..." />
                  </div>
                  <p className="text-white font-semibold mt-4">Creando tu vault...</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <h2 className="text-white text-xl font-headline font-bold mb-2">Revisá tu vault</h2>
                    <p className="text-on-surface-variant/60 text-sm">Asegurate de que todo esté correcto antes de confirmar</p>
                  </div>

                  {/* Vault Preview Card */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-surface-container-high to-surface-container rounded-3xl p-5 border border-outline-variant/10"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-primary" style={{ fontVariationSettings: 'FILL 1' }}>
                          {selectedVaultType.icon}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">{name}</h3>
                        <p className="text-on-surface-variant/60 text-xs">{selectedVaultType.title}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-on-surface-variant/60">Monto objetivo</span>
                        <span className="text-white font-bold">${parseFloat(target).toLocaleString()}</span>
                      </div>

                      {selectedType === 'rental' ? (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-on-surface-variant/60">Propietario</span>
                            <span className="text-white font-mono text-xs">{ownerAddress}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-on-surface-variant/60">Meses de garantía</span>
                            <span className="text-white font-bold">{guaranteeMonths} meses</span>
                          </div>
                        </>
                      ) : selectedType === 'p2p' ? (
                        <>
                          {sellerAddress && (
                            <div className="flex justify-between items-center">
                              <span className="text-on-surface-variant/60">Vendedor</span>
                              <span className="text-white font-mono text-xs">{sellerAddress}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-on-surface-variant/60">Condición</span>
                            <span className="text-white text-xs text-right max-w-[60%]">{releaseCondition}</span>
                          </div>
                        </>
                      ) : selectedType === 'finance' ? (
                        <div className="space-y-1">
                          <span className="text-on-surface-variant/60 text-sm">Tramos de liberación:</span>
                          {releaseTramos.map((t) => (
                            <div key={t.id} className="flex justify-between text-sm pl-2">
                              <span className="text-on-surface-variant/50">{t.label}</span>
                              <span className="text-primary font-bold">{t.percentage}% (${Math.round(parseFloat(target) * (t.percentage / 100)).toLocaleString()})</span>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {(selectedType !== 'rental') && unlockDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-on-surface-variant/60">{selectedType === 'p2p' ? 'Fecha límite' : 'Fecha de desbloqueo'}</span>
                          <span className="text-white font-bold">{new Date(unlockDate).toLocaleDateString('es-AR', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-on-surface-variant/60">Duración</span>
                        <span className="text-white font-bold">{duration} meses</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-on-surface-variant/60">Rendimiento anual</span>
                        <span className="text-primary font-bold">{selectedVaultType.yield}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-on-surface-variant/60">Moneda seleccionada</span>
                        <span className="text-secondary font-bold">{selectedCoin?.symbol ?? 'DOC'}</span>
                      </div>
                      <div className="border-t border-outline-variant/20 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-on-surface-variant/60">Ganancias estimadas</span>
                          <span className="text-primary font-bold">+${estimatedYield}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Warning */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-error/10 border border-error/30 rounded-2xl p-4"
                  >
                    <div className="flex gap-3">
                      <span className="material-symbols-outlined text-error flex-shrink-0" style={{ fontVariationSettings: 'FILL 1' }}>warning</span>
                      <div>
                        <p className="text-white font-semibold text-sm">Importante</p>
                        <p className="text-on-surface-variant/60 text-xs mt-1">
                          {selectedType === 'rental'
                            ? 'La garantía quedará bloqueada y el propietario recibirá prueba criptográfica del colateral.'
                            : selectedType === 'p2p'
                            ? 'Los fondos se bloquean en escrow hasta que ambas partes confirmen la transacción.'
                            : 'Una vez bloqueado, no podrás retirar tus fondos hasta la fecha de desbloqueo.'
                          }
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Fee */}
                  <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10">
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant/60">Comisión de plataforma</span>
                      <span className="text-white font-semibold">${platformFee}</span>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex gap-3 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep(2)}
                      className="flex-1 py-4 rounded-2xl font-headline font-bold uppercase text-sm text-on-surface-variant bg-surface-container-low hover:bg-surface-container transition-colors"
                    >
                      Volver
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCreate}
                      className="flex-1 py-4 rounded-2xl font-headline font-bold uppercase text-sm bg-primary text-on-primary active:scale-[0.98] transition-transform"
                    >
                      Crear Vault
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}