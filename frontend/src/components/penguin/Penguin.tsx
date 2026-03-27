import { motion } from 'framer-motion';
import type { Easing } from 'framer-motion';
import type { PenguinMood } from '../../types';

interface PenguinProps {
  mood: PenguinMood;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Los estados del penguin según el spec
const PENGUIN_IMAGES: Record<PenguinMood, string> = {
  idle: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBN4Tu_uDqC3o0SHPMJ62zksYNatEfQWr7ByDbiVMzDCXAp-OIVYz4qM3eHe9c0LHDILA_Xj9VbettyZQemux4fPKRA9OpYDdDYzT13NvWfjBDxOcqUob6vwP2M0tiwaCQZR0LKWMGUCOFjKraaWZLwRop6K8yh5k2Y_FEaBiG6SErzIGaBlTfmny8kukATJ1A60RPOY8DzWiMdlrDG-BXwdUp8Xi4W5rzauMK3rzmerLGjdmPOSCwZJOXonElDZ5UX-MAD4LXXN1g',
  happy: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcEjaNoZ0CPg8zz2itTdxfcv-6mSy9LesUKgqHiEJx8TvtHbsBl1hLyfQMgrDorRncNIW9ab40QO2cybVkusY7_wFv0S84NSRtk8_z7dFngdyhp1DFreGaLpSckoFsYhM6R2qg9-6iVB2rf7iBs2ulZhZ26Q96TSnn5G7dLydeqHhbd8VGGRX_6OEE6miGmutGmDCd2ChmKeCaQhZ5EJkbDSLjxukkdeWwy54yWDJGpmnsPv7AmnJuOMXmcIR5d4cEpwBbKlGKHug',
  celebrating: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcEjaNoZ0CPg8zz2itTdxfcv-6mSy9LesUKgqHiEJx8TvtHbsBl1hLyfQMgrDorRncNIW9ab40QO2cybVkusY7_wFv0S84NSRtk8_z7dFngdyhp1DFreGaLpSckoFsYhM6R2qg9-6iVB2rf7iBs2ulZhZ26Q96TSnn5G7dLydeqHhbd8VGGRX_6OEE6miGmutGmDCd2ChmKeCaQhZ5EJkbDSLjxukkdeWwy54yWDJGpmnsPv7AmnJuOMXmcIR5d4cEpwBbKlGKHug',
  waiting: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvxVpVSOFCuYjPNx9M8JbqAHy4hZgcvhqqtfmru8Z_95Y8XxZ11i-z3wgjxBKHpqGL00DuzuQrOy2qYfSvHsqwjl53j4xlKF7CNoCCkjDWGB7AU0377c7QHJj9KhOug2Bdnb_bQyzIoh2XQuyRI70EMydh09p7z759tIN3HA-ojnUwB5qLCV6wjKz05jhg7YmfI-vTkFmS6n_B3dc3Mx54V053_FSlMbAWsgX_PrIcQzvpmp7CT2uUHqflVfdB8Au23-D5eQ6VdN8',
};

const SIZES = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-28 h-28',
};

// Properly typed easing
const easeInOut: Easing = 'easeInOut';

export function Penguin({ mood, size = 'md', className = '' }: PenguinProps) {
  const sizeClass = SIZES[size];
  
  // Animation according to mood
  const animations: Record<PenguinMood, { y?: number[]; scale?: number[]; rotate?: number[]; opacity?: number[]; transition?: { duration: number; repeat?: number; ease?: Easing } }> = {
    idle: {
      y: [0, -8, 0],
      transition: { duration: 2, repeat: Infinity, ease: easeInOut }
    },
    happy: {
      y: [0, -20, 0],
      scale: [1, 1.1, 1],
      transition: { duration: 0.5 }
    },
    celebrating: {
      rotate: [0, 180, 360],
      scale: [1, 1.3, 1],
      transition: { duration: 0.6 }
    },
    waiting: {
      opacity: [1, 0.5, 1],
      transition: { duration: 2, repeat: Infinity }
    },
  };
  
  return (
    <motion.div
      className={`relative ${sizeClass} ${className}`}
      animate={animations[mood]}
    >
      <img
        src={PENGUIN_IMAGES[mood]}
        alt={`Penguin ${mood}`}
        className="w-full h-full object-contain"
      />
    </motion.div>
  );
}