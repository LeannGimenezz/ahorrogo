import { motion, AnimatePresence } from 'framer-motion';
import type { Easing, Variants } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

// Properly typed easing values
const easeOut: Easing = 'easeOut';
const easeIn: Easing = 'easeIn';

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: easeIn,
    },
  },
};

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Staggered entrance for list items
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: easeOut,
    },
  },
};

// Scale in animation for modals/components
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.9,
    transition: {
      duration: 0.2,
    },
  },
};

// Pulse animation for highlights
export const pulseHighlight: Variants = {
  initial: { boxShadow: '0 0 0 0 rgba(120, 160, 131, 0)' },
  animate: {
    boxShadow: [
      '0 0 0 0 rgba(120, 160, 131, 0.4)',
      '0 0 0 10px rgba(120, 160, 131, 0)',
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
    },
  },
};