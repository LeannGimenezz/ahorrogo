import { motion } from 'framer-motion';

export type PenguinMood =
  | 'idle'
  | 'happy'
  | 'celebrate'
  | 'thinking'
  | 'guide'
  | 'sleep'
  | 'wave'
  | 'encourage';

export type PenguinSize = 'sm' | 'md' | 'lg' | 'xl';

interface PenguinIllustrationProps {
  mood?: PenguinMood;
  size?: PenguinSize;
  className?: string;
}

const sizeMap: Record<PenguinSize, string> = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-28 h-28',
  xl: 'w-40 h-40',
};

const moodAnimation = {
  idle: { y: [0, -2, 0], transition: { duration: 2.2, repeat: Infinity } },
  happy: { y: [0, -8, 0], scale: [1, 1.06, 1], transition: { duration: 1, repeat: Infinity } },
  celebrate: { y: [0, -12, 0], rotate: [0, -7, 7, 0], transition: { duration: 0.9, repeat: Infinity } },
  thinking: { rotate: [0, -4, 3, 0], transition: { duration: 1.4, repeat: Infinity } },
  guide: { x: [0, 5, 0], transition: { duration: 1, repeat: Infinity } },
  sleep: { opacity: [1, 0.82, 1], transition: { duration: 2.6, repeat: Infinity } },
  wave: { rotate: [0, 10, -8, 10, 0], transition: { duration: 1.05, repeat: Infinity } },
  encourage: { y: [0, -5, 0], scale: [1, 1.07, 1], transition: { duration: 0.9, repeat: Infinity } },
} as const;

const sparkleConfig = [
  { top: '10%', left: '14%', delay: 0 },
  { top: '6%', right: '14%', delay: 0.22 },
  { top: '30%', right: '2%', delay: 0.38 },
] as const;

export function PenguinIllustration({
  mood = 'idle',
  size = 'md',
  className = '',
}: PenguinIllustrationProps) {
  const beakColor = mood === 'celebrate' ? '#ffd87a' : '#f8c35a';
  const cheekOpacity = mood === 'happy' || mood === 'celebrate' ? 0.5 : 0.28;
  const eyeScale = mood === 'sleep' ? 0.22 : mood === 'thinking' ? 0.82 : 1;
  const hasSparkles = mood === 'celebrate' || mood === 'happy' || mood === 'wave';

  return (
    <motion.div animate={moodAnimation[mood] as any} className={`${sizeMap[size]} ${className} relative`}>
      <motion.div
        animate={{ opacity: [0.2, 0.42, 0.2], scale: [0.92, 1.05, 0.92] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        className="absolute inset-1 rounded-full bg-gradient-to-br from-primary/35 via-secondary/20 to-tertiary/30 blur-md"
      />

      {hasSparkles && (
        <>
          {sparkleConfig.map((sparkle, index) => (
            <motion.span
              key={index}
              className="absolute z-20 w-1.5 h-1.5 rounded-full bg-primary"
              style={sparkle}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.25, 0.5], y: [0, -5, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: sparkle.delay }}
            />
          ))}
        </>
      )}

      <svg viewBox="0 0 220 240" className="relative z-10 w-full h-full drop-shadow-[0_10px_24px_rgba(4,8,20,0.52)]" aria-label="Pingüino AhorroGO">
        <defs>
          <linearGradient id="cuteBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b599e" />
            <stop offset="45%" stopColor="#243a6e" />
            <stop offset="100%" stopColor="#152446" />
          </linearGradient>
          <linearGradient id="cuteBelly" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#dceaff" />
          </linearGradient>
          <radialGradient id="faceGlow" cx="50%" cy="25%" r="70%">
            <stop offset="0%" stopColor="#7aa9ff" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#7aa9ff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="110" cy="214" rx="54" ry="14" fill="rgba(7,17,34,0.5)" />

        {/* body: más redondito para look tierno */}
        <ellipse cx="110" cy="130" rx="74" ry="82" fill="url(#cuteBody)" />
        <ellipse cx="110" cy="140" rx="48" ry="56" fill="url(#cuteBelly)" />

        {/* cabeza más grande para estética kawaii */}
        <circle cx="110" cy="86" r="58" fill="url(#cuteBody)" />
        <circle cx="110" cy="86" r="53" fill="url(#faceGlow)" />
        <ellipse cx="110" cy="98" rx="43" ry="36" fill="url(#cuteBelly)" />

        {/* alitas suaves */}
        <ellipse cx="48" cy="132" rx="15" ry="34" fill="#1a2c54" />
        <ellipse cx="172" cy="132" rx="15" ry="34" fill="#1a2c54" />

        {/* ojos grandes = más tierno */}
        <ellipse cx="90" cy="82" rx="12" ry="13" fill="#ffffff" />
        <ellipse cx="130" cy="82" rx="12" ry="13" fill="#ffffff" />
        <ellipse cx="90" cy="84" rx={5.4 * eyeScale} ry={6.8 * eyeScale} fill="#101a36" />
        <ellipse cx="130" cy="84" rx={5.4 * eyeScale} ry={6.8 * eyeScale} fill="#101a36" />
        <circle cx="92" cy="81" r="1.8" fill="#eaffff" />
        <circle cx="132" cy="81" r="1.8" fill="#eaffff" />

        {/* pico pequeño y redondeado */}
        <path d="M 110 92 L 98 101 L 122 101 Z" fill={beakColor} />

        {/* mejillas rosadas para ternura */}
        <circle cx="78" cy="101" r="8.5" fill={`rgba(255, 132, 179, ${cheekOpacity})`} />
        <circle cx="142" cy="101" r="8.5" fill={`rgba(255, 132, 179, ${cheekOpacity})`} />

        {/* sonrisa */}
        <path d="M 94 112 Q 110 125 126 112" fill="none" stroke="#7588b6" strokeWidth="3" strokeLinecap="round" />

        {/* patitas pequeñas */}
        <ellipse cx="88" cy="203" rx="14" ry="6" fill="#f8c35a" />
        <ellipse cx="132" cy="203" rx="14" ry="6" fill="#f8c35a" />
      </svg>

      {mood === 'thinking' && (
        <div className="absolute -top-2 right-1 z-30 text-xs font-semibold text-on-surface-variant">...</div>
      )}

      {mood === 'sleep' && (
        <motion.div
          className="absolute -top-1 right-1 z-30 text-xs font-bold text-on-surface-variant/80"
          animate={{ y: [0, -6, 0], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          zzz
        </motion.div>
      )}
    </motion.div>
  );
}
