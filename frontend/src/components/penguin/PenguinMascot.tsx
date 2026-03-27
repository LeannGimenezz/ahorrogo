import { motion } from 'framer-motion';
import { PenguinIllustration, type PenguinMood, type PenguinSize } from './PenguinIllustration';

interface PenguinMascotProps {
  mood?: PenguinMood;
  size?: PenguinSize;
  className?: string;
  message?: string;
  showMessage?: boolean;
}

const MOOD_MESSAGES: Record<PenguinMood, string> = {
  idle: '',
  happy: 'Genial',
  celebrate: '¡Lo lograste!',
  thinking: 'Hmm...',
  guide: 'Vamos por acá',
  sleep: 'Zzz...',
  wave: '¡Hola!',
  encourage: '¡Vos podés!',
};

const moodGlowClass: Record<PenguinMood, string> = {
  idle: 'from-secondary/20 to-primary/20',
  happy: 'from-primary/35 to-secondary/30',
  celebrate: 'from-primary/40 via-secondary/30 to-tertiary/35',
  thinking: 'from-secondary/25 to-surface-container-high/40',
  guide: 'from-secondary/30 to-primary/25',
  sleep: 'from-surface-container-high/35 to-surface-container/35',
  wave: 'from-primary/32 to-tertiary/28',
  encourage: 'from-primary/35 to-secondary/34',
};

export function PenguinMascot({
  mood = 'idle',
  size = 'md',
  className = '',
  message,
  showMessage = false,
}: PenguinMascotProps) {
  const displayMessage = message || MOOD_MESSAGES[mood];

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      {showMessage && displayMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gradient-to-br from-surface-container-high to-surface-container px-3 py-1.5 rounded-xl border border-outline-variant/35 shadow-[0_10px_20px_rgba(5,10,22,0.45)] whitespace-nowrap"
        >
          <p className="text-on-surface text-xs font-semibold tracking-wide">{displayMessage}</p>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-surface-container rotate-45 border-r border-b border-outline-variant/30" />
        </motion.div>
      )}

      <motion.div
        animate={{ opacity: [0.2, 0.45, 0.2], scale: [0.9, 1.04, 0.9] }}
        transition={{ duration: 2.2, repeat: Infinity }}
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${moodGlowClass[mood]} blur-xl`}
      />

      {mood === 'celebrate' && (
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-[-12%] rounded-full border border-primary/25"
        />
      )}

      <PenguinIllustration mood={mood} size={size} />
    </div>
  );
}

export function FloatingPenguin({
  mood = 'idle',
  position = 'bottom-right',
  size = 'lg',
}: {
  mood?: PenguinMood;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: PenguinSize;
}) {
  const positionClasses = {
    'bottom-right': 'bottom-24 -right-4',
    'bottom-left': 'bottom-24 -left-4',
    'top-right': 'top-20 -right-4',
    'top-left': 'top-20 -left-4',
  };

  return (
    <div className={`fixed pointer-events-none z-10 ${positionClasses[position]}`}>
      <PenguinMascot mood={mood} size={size} />
    </div>
  );
}

export function GuidePenguin({
  message,
  step,
  totalSteps,
}: {
  message: string;
  step: number;
  totalSteps: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="flex items-end gap-3 mb-6"
    >
      <PenguinMascot mood="guide" size="lg" showMessage message={message} />
      <div className="flex gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${i < step ? 'bg-primary' : 'bg-surface-container'}`}
          />
        ))}
      </div>
    </motion.div>
  );
}
