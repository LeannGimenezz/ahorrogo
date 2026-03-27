import { motion } from 'framer-motion';
import type { Easing } from 'framer-motion';

type PenguinMood = 
  | 'idle'      // Standing, gentle breathing
  | 'happy'     // Excited, jumping slightly
  | 'celebrate' // Big celebration, bouncing
  | 'thinking'  // Head tilted, scratching
  | 'guide'     // Pointing/directing attention
  | 'sleep'     // Sleeping, for inactive states
  | 'wave'      // Waving hello
  | 'encourage'; // Thumbs up, encouraging

type PenguinSize = 'sm' | 'md' | 'lg' | 'xl';

interface PenguinMascotProps {
  mood?: PenguinMood;
  size?: PenguinSize;
  className?: string;
  message?: string;
  showMessage?: boolean;
}

const PENGUIN_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8TtEkhRR316KhDUmq7ykO2eQWvxAEFRMBq9HKSHQAUFjk-ZHuZlNjyEHEFOJQODoviDTYEQII1GIEkrcNqznI7xrDhKIHTh_ROBIxtHot5_PcT44Az2wQIE_8Btu_VJNreakKBiHBixVJz3NYEQkPZGwD-BQgmPQVMBJjr5rXtUuT8Q-T4n2s71TdJVK7JtokRIRabpVHA3ohK09uZVkjs4LG8F1ijPz3BVYcLqt79MgMPBjZko99pt29XDodw6_B9C0DNkfECC0';

const SIZES: Record<PenguinSize, { container: string; img: string }> = {
  sm: { container: 'w-12 h-12', img: 'w-10 h-10' },
  md: { container: 'w-20 h-20', img: 'w-16 h-16' },
  lg: { container: 'w-32 h-32', img: 'w-24 h-24' },
  xl: { container: 'w-48 h-48', img: 'w-40 h-40' },
};

// Properly type the easing value
const easeInOut: Easing = 'easeInOut';

const moodVariants = {
  idle: {
    initial: { y: 0 },
    animate: {
      y: [0, -3, 0],
      transition: { duration: 2, repeat: Infinity, ease: easeInOut },
    },
  },
  happy: {
    initial: { y: 0, scale: 1 },
    animate: {
      y: [0, -8, 0, -4, 0],
      scale: [1, 1.05, 1, 1.02, 1],
      transition: { duration: 1.5, repeat: Infinity, ease: easeInOut },
    },
  },
  celebrate: {
    initial: { y: 0, scale: 1, rotate: 0 },
    animate: {
      y: [0, -15, 0, -10, 0],
      scale: [1, 1.1, 1, 1.05, 1],
      rotate: [0, -5, 5, -3, 0],
      transition: { duration: 2, repeat: Infinity, ease: easeInOut},
    },
  },
  thinking: {
    initial: { rotate: 0, x: 0 },
    animate: {
      rotate: [-5, 5, -5],
      x: [-2, 2, -2],
      transition: { duration: 3, repeat: Infinity, ease: easeInOut },
    },
  },
  guide: {
    initial: { x: 0, rotate: 0 },
    animate: {
      x: [0, 10, 0],
      rotate: [0, 10, 0],
      transition: { duration: 1.5, repeat: Infinity, ease: easeInOut },
    },
  },
  sleep: {
    initial: { opacity: 1 },
    animate: {
      opacity: [1, 0.7, 1],
      transition: { duration: 3, repeat: Infinity, ease: easeInOut },
    },
  },
  wave: {
    initial: { rotate: 0 },
    animate: {
      rotate: [0, 15, -10, 15, 0],
      transition: { duration: 1.5, repeat: Infinity, ease: easeInOut },
    },
  },
  encourage: {
    initial: { y: 0, scale: 1 },
    animate: {
      y: [0, -5, 0],
      scale: [1, 1.08, 1],
      transition: { duration: 1, repeat: Infinity, ease: easeInOut },
    },
  },
};

const MOOD_MESSAGES: Record<PenguinMood, string> = {
  idle: '',
  happy: 'Genial!',
  celebrate: 'Lo lograste!',
  thinking: 'Hmm...',
  guide: 'Por aca!',
  sleep: 'Zzz...',
  wave: 'Hola!',
  encourage: 'Vamos!',
};

export function PenguinMascot({ 
  mood = 'idle', 
  size = 'md',
  className = '',
  message,
  showMessage = false,
}: PenguinMascotProps) {
  const variants = moodVariants[mood];
  const defaultMessage = MOOD_MESSAGES[mood];
  const displayMessage = message || defaultMessage;
  const sizeConfig = SIZES[size];

  return (
    <div className={'relative inline-flex flex-col items-center ' + className}>
      {/* Speech Bubble */}
      {showMessage && displayMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 bg-surface-container-high px-3 py-1.5 rounded-xl border border-outline-variant/20 shadow-lg whitespace-nowrap"
        >
          <p className="text-white text-xs font-semibold">{displayMessage}</p>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-surface-container-high rotate-45 border-r border-b border-outline-variant/20" />
        </motion.div>
      )}

      {/* Glow Effect */}
      {mood !== 'sleep' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          className={'absolute inset-0 bg-primary/20 rounded-full blur-xl ' + sizeConfig.container}
        />
      )}

      {/* Penguin */}
      <motion.div
        initial={variants.initial}
        animate={variants.animate}
        className={'relative ' + sizeConfig.container}
      >
        <img
          src={PENGUIN_IMAGE}
          alt="Penguin Mascot"
          className={'object-contain drop-shadow-xl ' + sizeConfig.img}
        />

        {/* Sleep Zzz */}
        {mood === 'sleep' && (
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], y: [-10, -20] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            className="absolute -top-2 right-0 text-on-surface-variant/50 text-sm font-bold"
          >
            zzz
          </motion.div>
        )}

        {/* Thinking Dots */}
        {mood === 'thinking' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-1"
          >
            <span className="w-1.5 h-1.5 bg-on-surface-variant/50 rounded-full" />
            <span className="w-1.5 h-1.5 bg-on-surface-variant/50 rounded-full" />
            <span className="w-1.5 h-1.5 bg-on-surface-variant/50 rounded-full" />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// Floating Penguin for backgrounds/corners
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
    <div className={'fixed pointer-events-none z-10 ' + positionClasses[position]}>
      <PenguinMascot mood={mood} size={size} />
    </div>
  );
}

// Guide Penguin that shows up during onboarding or important actions
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
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex items-end gap-3 mb-6"
    >
      <PenguinMascot mood="guide" size="lg" showMessage message={message} />
      <div className="flex gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={'w-2 h-2 rounded-full transition-colors ' + (i < step ? 'bg-primary' : 'bg-surface-container')}
          />
        ))}
      </div>
    </motion.div>
  );
}