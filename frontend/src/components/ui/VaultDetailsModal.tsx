import { AnimatePresence, motion } from 'framer-motion';

export type VaultUseCaseId = 'compra-p2p' | 'garantia-alquiler' | 'metas-candado';

export interface VaultDetailData {
  id: string;
  name: string;
  typeLabel: string;
  current: number;
  target: number;
  percentage: number;
  investedCoin: string;
  apy: string;
  useCase: VaultUseCaseId;
}

interface VaultDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vault: VaultDetailData | null;
}

const useCaseContent: Record<VaultUseCaseId, { title: string; pain: string; flow: string; value: string }> = {
  'compra-p2p': {
    title: 'Compra Protegida P2P (El ahorro que se vuelve pago)',
    pain: 'Ir con efectivo para compras de marketplace expone al usuario a riesgo físico y estafas.',
    flow: 'En el encuentro con el vendedor, el usuario transfiere la titularidad del vault por QR a la Beexo Wallet del vendedor. Cero efectivo en la calle.',
    value: 'Pago seguro, trazable y directo desde fondos ahorrados.',
  },
  'garantia-alquiler': {
    title: 'Garantía de Alquiler Activa (Ahorro como colateral)',
    pain: 'La garantía tradicional queda inmovilizada y pierde valor por inflación o spread cambiario.',
    flow: 'El inquilino bloquea la garantía en DOC y el propietario recibe prueba criptográfica del colateral. Los intereses mensuales se liberan al inquilino.',
    value: 'Colateral verificable + rendimiento útil para expensas/servicios.',
  },
  'metas-candado': {
    title: 'Metas con Candado (Bloqueo conductual)',
    pain: 'Sin disciplina, el usuario retira ante el primer impulso y rompe su progreso.',
    flow: 'El usuario configura un time-lock en su meta. El contrato bloquea retiros hasta la fecha pactada mientras los fondos siguen rindiendo en DeFi.',
    value: 'Disciplina financiera programable + interés compuesto protegido.',
  },
};

export function VaultDetailsModal({ isOpen, onClose, vault }: VaultDetailsModalProps) {
  if (!vault) return null;

  const useCase = useCaseContent[vault.useCase];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            className="fixed inset-x-4 top-[6%] bottom-[5%] z-[81] max-w-lg mx-auto"
          >
            <div className="h-full rounded-3xl bg-surface-container-highest border border-outline-variant/30 shadow-2xl overflow-hidden">
              <header className="p-5 border-b border-outline-variant/25 flex justify-between items-center">
                <div>
                  <h2 className="font-headline text-xl font-extrabold text-white">Detalle del Vault</h2>
                  <p className="text-on-surface-variant/70 text-xs">Resumen financiero + caso de uso</p>
                </div>
                <button onClick={onClose} className="w-9 h-9 rounded-full surface-card flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant">close</span>
                </button>
              </header>

              <main className="p-4 h-[calc(100%-88px)] overflow-y-auto space-y-4">
                <section className="rounded-2xl bg-gradient-to-br from-surface-container-high to-surface-container p-4 border border-outline-variant/20">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-white text-lg font-bold">{vault.name}</h3>
                      <p className="text-on-surface-variant/70 text-xs">{vault.typeLabel}</p>
                    </div>
                    <span className="bg-primary/15 text-primary text-[10px] font-bold px-2 py-1 rounded-full">{vault.apy} APY</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="rounded-xl bg-surface-container-low/80 p-3">
                      <p className="text-on-surface-variant/60 text-[10px] uppercase font-bold">Saldo</p>
                      <p className="text-white font-bold">${vault.current.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl bg-surface-container-low/80 p-3">
                      <p className="text-on-surface-variant/60 text-[10px] uppercase font-bold">Objetivo</p>
                      <p className="text-white font-bold">${vault.target.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant/70">Progreso</span>
                    <span className="text-primary font-bold">{vault.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-variant/50 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: `${vault.percentage}%` }} />
                  </div>

                  <div className="mt-3 rounded-xl bg-surface-container-low/80 p-3 border border-outline-variant/20 flex justify-between items-center">
                    <p className="text-on-surface-variant/70 text-xs">Moneda de inversión</p>
                    <p className="text-secondary font-bold">{vault.investedCoin}</p>
                  </div>
                </section>

                <section className="rounded-2xl bg-surface-container p-4 border border-outline-variant/20 space-y-3">
                  <h4 className="text-white font-bold">Caso de uso activo</h4>
                  <div className="space-y-2">
                    <p className="text-primary text-sm font-semibold">{useCase.title}</p>
                    <div className="rounded-xl bg-surface-container-low p-3 border border-outline-variant/20">
                      <p className="text-on-surface-variant/60 text-[10px] uppercase font-bold mb-1">El dolor</p>
                      <p className="text-white text-sm">{useCase.pain}</p>
                    </div>
                    <div className="rounded-xl bg-surface-container-low p-3 border border-outline-variant/20">
                      <p className="text-on-surface-variant/60 text-[10px] uppercase font-bold mb-1">Flujo en AhorroGO</p>
                      <p className="text-white text-sm">{useCase.flow}</p>
                    </div>
                    <div className="rounded-xl bg-primary/10 p-3 border border-primary/30">
                      <p className="text-primary text-[10px] uppercase font-bold mb-1">Valor generado</p>
                      <p className="text-white text-sm">{useCase.value}</p>
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button className="rounded-xl bg-surface-container-low py-3 text-sm text-white font-semibold border border-outline-variant/20">Transferir por QR</button>
                  <button className="rounded-xl bg-surface-container-low py-3 text-sm text-white font-semibold border border-outline-variant/20">Ver prueba</button>
                  <button className="rounded-xl bg-primary py-3 text-sm text-on-primary font-bold">Configurar candado</button>
                </section>
              </main>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
