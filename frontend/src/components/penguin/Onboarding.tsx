// Onboarding - First-time user guidance with Penguin
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenguinMascot } from './PenguinMascot';
import { useAppStore } from '../../store/useAppStore';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  mascotMood: 'wave' | 'guide' | 'happy' | 'celebrate';
  mascotMessage: string;
  highlight?: string; // CSS selector to highlight
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a AhorroGO!',
    description: 'Soy Pingüi, tu compañero de ahorro. Te guiaré para que alcances tus metas financieras.',
    mascotMood: 'wave',
    mascotMessage: '¡Hola! Soy Pingüi',
  },
  {
    id: 'vaults',
    title: 'Tus Vaults',
    description: 'Un Vault es como una alcancía digital. Puedes crear varios para diferentes metas: casa, auto, vacaciones...',
    mascotMood: 'guide',
    mascotMessage: 'Crea tu primer Vault',
  },
  {
    id: 'deposit',
    title: 'Deposita y Crece',
    description: 'Cada vez que depositas, ganas XP y subes de nivel. ¡Mira cómo crece tu pingüino!',
    mascotMood: 'happy',
    mascotMessage: 'Gana XP en cada depósito',
  },
  {
    id: 'gamification',
    title: 'Sube de Nivel',
    description: 'Desbloquea accesorios para tu pingüino: gorro, bufanda, guantes y hasta una corona.',
    mascotMood: 'celebrate',
    mascotMessage: 'Desbloquea accesorios',
  },
  {
    id: 'complete',
    title: '¡Listo para Ahorrar!',
    description: 'Ya estás listo para crear tu primer Vault y empezar a ahorrar. ¿Qué meta quieres alcanzar?',
    mascotMood: 'celebrate',
    mascotMessage: '¡A ahorrar!',
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

const ONBOARDING_COMPLETED_KEY = 'ahorrogo_onboarding_completed';

export function isOnboardingCompleted(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
}

export function completeOnboarding(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
}

export function resetOnboarding(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { penguin } = useAppStore();
  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding();
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    onComplete();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 25 }}
          className="max-w-sm w-full bg-surface-container rounded-3xl p-6 border border-outline-variant/10 shadow-2xl"
        >
          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mb-6">
            {ONBOARDING_STEPS.map((_, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8 }}
                animate={{ 
                  scale: index === currentStep ? 1.2 : 1,
                  backgroundColor: index <= currentStep ? '#78A083' : '#262626'
                }}
                className="w-2 h-2 rounded-full"
              />
            ))}
          </div>

          {/* Mascot */}
          <motion.div
            key={step.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-6"
          >
            <PenguinMascot 
              mood={step.mascotMood} 
              size="xl" 
              showMessage 
              message={step.mascotMessage}
            />
          </motion.div>

          {/* Content */}
          <motion.div
            key={`content-${step.id}`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <h2 className="text-xl font-headline font-bold text-white mb-2">
              {step.title}
            </h2>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
              {step.description}
            </p>
          </motion.div>

          {/* Level Progress (show after step 3) */}
          {currentStep >= 3 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-surface-container-low rounded-xl p-3 mb-4"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-on-surface-variant text-xs">Nivel {penguin.level}</span>
                <span className="text-primary text-xs font-bold">{penguin.xp} XP</span>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(penguin.xp % 300) / 3}%` }}
                  transition={{ delay: 0.3 }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
              <div className="flex justify-center gap-1 mt-2">
                {penguin.accessories.map((acc, i) => (
                  <span key={i} className="text-lg">{acc === 'beanie' ? '🧢' : acc === 'scarf' ? '🧣' : acc === 'gloves' ? '🧤' : '👑'}</span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!isFirstStep && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex-1 py-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-on-surface-variant font-semibold active:scale-[0.98] transition-transform"
              >
                Anterior
              </motion.button>
            )}
            <motion.button
              onClick={handleNext}
              className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-bold active:scale-[0.98] transition-transform"
            >
              {isLastStep ? '¡Empezar!' : 'Siguiente'}
            </motion.button>
          </div>

          {/* Skip */}
          {!isLastStep && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={handleSkip}
              className="w-full mt-4 text-on-surface-variant/50 text-xs hover:text-on-surface-variant transition-colors"
            >
              Saltar tutorial
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default Onboarding;