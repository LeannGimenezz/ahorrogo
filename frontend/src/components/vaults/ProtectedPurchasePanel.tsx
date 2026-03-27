import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenguinMascot } from '../penguin/PenguinMascot';

interface ProtectedPurchasePanelProps {
  vault: {
    id: string;
    name: string;
    current: number;
    target: number;
    contractAddress?: string;
    sellerAddress?: string;
    releaseCondition?: string;
  };
}

export function ProtectedPurchasePanel({ vault }: ProtectedPurchasePanelProps) {
  const [step, setStep] = useState<'details' | 'qr' | 'confirmed'>('details');
  const isLocked = !!vault.contractAddress;
  const progress = Math.round((vault.current / vault.target) * 100);
  const isReady = progress >= 100;

  const handleTransfer = () => {
    setStep('confirmed');
  };

  return (
    <div className="space-y-4">
      {/* Contract Status */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold ${
        isLocked
          ? 'bg-primary/15 text-primary border border-primary/30'
          : 'bg-tertiary/15 text-tertiary border border-tertiary/30'
      }`}>
        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: 'FILL 1' }}>
          {isLocked ? 'verified' : 'pending'}
        </span>
        {isLocked ? 'Smart Contract Activo' : 'Pendiente de Bloqueo'}
      </div>

      <AnimatePresence mode="wait">
        {step === 'confirmed' ? (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6"
          >
            <PenguinMascot mood="celebrate" size="lg" showMessage message="¡Transferencia exitosa!" />
            <p className="text-white font-bold text-lg mt-4">Pago completado</p>
            <p className="text-on-surface-variant/60 text-sm mt-1">
              Los fondos fueron transferidos al vendedor de forma segura
            </p>
            <div className="mt-4 bg-surface-container rounded-2xl p-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant/60">Monto transferido</span>
                <span className="text-white font-bold">${vault.current.toLocaleString()} DOC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant/60">Destinatario</span>
                <span className="text-secondary font-mono text-xs">{vault.sellerAddress || 'vendedor.bexo'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant/60">Tx Hash</span>
                <span className="text-secondary font-mono text-xs">0x4e2d...a91f</span>
              </div>
            </div>
          </motion.div>
        ) : step === 'qr' ? (
          <motion.div
            key="qr"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            <h4 className="text-white font-bold text-sm text-center">Escanear para Transferir</h4>

            {/* QR Code */}
            <div className="flex flex-col items-center py-4">
              <div className="w-40 h-40 bg-white rounded-2xl p-3 shadow-lg">
                <div className="w-full h-full bg-gradient-to-br from-surface-container to-surface-container-high rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-surface-variant text-4xl">qr_code_2</span>
                </div>
              </div>
              <p className="text-on-surface-variant/60 text-xs mt-3">
                El vendedor escanea este QR para recibir los fondos
              </p>
            </div>

            {/* Transfer Details */}
            <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant/70">Monto</span>
                <span className="text-primary font-bold">${vault.current.toLocaleString()} DOC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant/70">Vendedor</span>
                <span className="text-white font-mono text-xs">{vault.sellerAddress || 'No definido'}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('details')}
                className="flex-1 py-3 rounded-2xl font-headline font-bold uppercase text-sm text-on-surface-variant bg-surface-container"
              >
                Volver
              </button>
              <button
                onClick={handleTransfer}
                className="flex-1 py-3 rounded-2xl font-headline font-bold uppercase text-sm bg-primary text-on-primary active:scale-[0.98] transition-transform"
              >
                Confirmar Pago
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            {/* Savings Progress */}
            <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-on-surface-variant/60 text-xs">Progreso del ahorro</span>
                <span className="text-primary font-bold text-sm">{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-surface-variant/50 overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-surface-container-low p-2">
                  <p className="text-on-surface-variant/60 text-[10px] uppercase font-bold">Ahorrado</p>
                  <p className="text-white font-bold">${vault.current.toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-surface-container-low p-2">
                  <p className="text-on-surface-variant/60 text-[10px] uppercase font-bold">Objetivo</p>
                  <p className="text-white font-bold">${vault.target.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Smart Contract Info */}
            {isLocked && (
              <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/20">
                <p className="text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-widest mb-2">Smart Contract</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant/70">Address</span>
                    <span className="text-secondary font-mono text-xs truncate ml-4">{vault.contractAddress}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant/70">Red</span>
                    <span className="text-white font-semibold">RSK Testnet</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant/70">Estado</span>
                    <span className="text-primary font-semibold">Activo</span>
                  </div>
                </div>
              </div>
            )}

            {/* Release Condition */}
            {vault.releaseCondition && (
              <div className="bg-tertiary/10 border border-tertiary/30 rounded-2xl p-4">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-tertiary flex-shrink-0" style={{ fontVariationSettings: 'FILL 1' }}>gavel</span>
                  <div>
                    <p className="text-white font-semibold text-sm">Condición de liberación</p>
                    <p className="text-on-surface-variant/60 text-xs mt-1">{vault.releaseCondition}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => isReady && setStep('qr')}
                disabled={!isReady}
                className={`py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  isReady
                    ? 'bg-primary text-on-primary active:scale-[0.97]'
                    : 'bg-surface-container text-on-surface-variant/30 cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: 'FILL 1' }}>qr_code</span>
                Transferir QR
              </button>
              <button className="py-3 rounded-xl bg-surface-container-low text-white font-bold text-sm border border-outline-variant/20 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: 'FILL 1' }}>description</span>
                Ver Prueba
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
