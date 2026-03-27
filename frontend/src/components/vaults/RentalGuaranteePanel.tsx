import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenguinMascot } from '../penguin/PenguinMascot';

interface RentalGuaranteePanelProps {
  vault: {
    id: string;
    name: string;
    current: number;
    target: number;
    ownerAddress?: string;
    guaranteeMonths?: number;
    beneficiary?: string;
    contractAddress?: string;
  };
}

export function RentalGuaranteePanel({ vault }: RentalGuaranteePanelProps) {
  const [step, setStep] = useState<'form' | 'summary' | 'confirmed'>('form');
  const [ownerAddress, setOwnerAddress] = useState(vault.ownerAddress || '');
  const [guaranteeMonths, setGuaranteeMonths] = useState(vault.guaranteeMonths || 6);
  const [amount, setAmount] = useState(vault.current.toString());

  const releaseDate = new Date();
  releaseDate.setMonth(releaseDate.getMonth() + guaranteeMonths);
  const releaseDateStr = releaseDate.toLocaleDateString('es-AR', { month: 'long', day: 'numeric', year: 'numeric' });

  const isLocked = !!vault.contractAddress;

  const handleConfirm = () => {
    setStep('confirmed');
  };

  return (
    <div className="space-y-4">
      {/* Status Badge */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold ${
        isLocked
          ? 'bg-primary/15 text-primary border border-primary/30'
          : 'bg-tertiary/15 text-tertiary border border-tertiary/30'
      }`}>
        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: 'FILL 1' }}>
          {isLocked ? 'verified' : 'lock_open'}
        </span>
        {isLocked ? 'Garantía Bloqueada en Blockchain' : 'Garantía Pendiente de Bloqueo'}
      </div>

      <AnimatePresence mode="wait">
        {step === 'confirmed' ? (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6"
          >
            <PenguinMascot mood="celebrate" size="lg" showMessage message="¡Garantía bloqueada!" />
            <p className="text-white font-bold text-lg mt-4">Garantía confirmada</p>
            <p className="text-on-surface-variant/60 text-sm mt-1">
              Se envió el resumen a ambas partes
            </p>

            {/* Confirmation Receipt */}
            <div className="mt-4 bg-surface-container rounded-2xl p-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant/60">Monto bloqueado</span>
                <span className="text-white font-bold">${parseFloat(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant/60">Liberación</span>
                <span className="text-primary font-bold">{releaseDateStr}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant/60">Tx Hash</span>
                <span className="text-secondary font-mono text-xs">0x8f3a...c72b</span>
              </div>
            </div>
          </motion.div>
        ) : step === 'summary' ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            <h4 className="text-white font-bold text-sm">Resumen de Garantía</h4>

            {/* Tenant Card */}
            <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/20">
              <p className="text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-widest mb-2">Inquilino</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant/70">Wallet</span>
                  <span className="text-white font-mono text-xs">tunombre.bexo</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant/70">Monto garantía</span>
                  <span className="text-white font-bold">${parseFloat(amount).toLocaleString()} DOC</span>
                </div>
              </div>
            </div>

            {/* Owner Card */}
            <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/20">
              <p className="text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-widest mb-2">Propietario</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant/70">Wallet</span>
                  <span className="text-white font-mono text-xs">{ownerAddress || 'No definido'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant/70">Recibirá prueba</span>
                  <span className="text-primary font-semibold">Criptográfica</span>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant/70">Meses de bloqueo</span>
                  <span className="text-primary font-bold">{guaranteeMonths} meses</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant/70">Fecha de liberación</span>
                  <span className="text-primary font-bold">{releaseDateStr}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant/70">Yield para inquilino</span>
                  <span className="text-secondary font-bold">~3.7% APY</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('form')}
                className="flex-1 py-3 rounded-2xl font-headline font-bold uppercase text-sm text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors"
              >
                Volver
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 rounded-2xl font-headline font-bold uppercase text-sm bg-primary text-on-primary active:scale-[0.98] transition-transform"
              >
                Confirmar y Bloquear
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            <h4 className="text-white font-bold text-sm">Configurar Garantía</h4>

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-widest">
                Monto de garantía
              </label>
              <div className="flex items-center bg-surface-container rounded-xl px-4 py-3 border border-outline-variant/10 focus-within:border-primary/50">
                <span className="text-primary font-bold text-lg mr-2">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-white text-lg font-bold outline-none placeholder:text-on-surface-variant/30"
                />
                <span className="text-on-surface-variant/60 text-sm">DOC</span>
              </div>
            </div>

            {/* Owner Address */}
            <div className="space-y-2">
              <label className="text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-widest">
                Wallet del propietario
              </label>
              <div className="flex items-center bg-surface-container rounded-xl px-4 py-3 border border-outline-variant/10 focus-within:border-primary/50">
                <span className="material-symbols-outlined text-on-surface-variant/40 mr-2 text-lg">person</span>
                <input
                  type="text"
                  value={ownerAddress}
                  onChange={(e) => setOwnerAddress(e.target.value)}
                  placeholder="propietario.bexo o 0x..."
                  className="flex-1 bg-transparent text-white outline-none placeholder:text-on-surface-variant/30 text-sm"
                />
              </div>
            </div>

            {/* Guarantee Months */}
            <div className="space-y-2">
              <label className="text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-widest">
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

            {/* Release Date Preview */}
            <div className="bg-surface-container rounded-xl p-3 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: 'FILL 1' }}>event</span>
              <div>
                <p className="text-on-surface-variant/60 text-[10px] uppercase font-bold">Fecha de liberación</p>
                <p className="text-white font-semibold text-sm">{releaseDateStr}</p>
              </div>
            </div>

            <button
              onClick={() => setStep('summary')}
              disabled={!ownerAddress || !amount || parseFloat(amount) <= 0}
              className={`w-full py-3 rounded-2xl font-headline font-bold uppercase text-sm transition-all ${
                ownerAddress && amount && parseFloat(amount) > 0
                  ? 'bg-primary text-on-primary active:scale-[0.98]'
                  : 'bg-surface-container text-on-surface-variant/30 cursor-not-allowed'
              }`}
            >
              Generar Aprobación
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
