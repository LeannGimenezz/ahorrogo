import type { ReactNode, MouseEvent } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  children,
  onClick,
  className = '',
}: ButtonProps) {
  const baseStyles = 'font-headline font-bold uppercase tracking-tight rounded-xl transition-all duration-200 flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-primary text-on-primary hover:brightness-110 active:scale-[0.98] shadow-[0_10px_30px_rgba(120,160,131,0.2)]',
    secondary: 'bg-secondary text-on-secondary hover:brightness-110 active:scale-[0.98]',
    ghost: 'bg-transparent text-primary hover:bg-surface-container-high active:scale-[0.98]',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <span className="animate-spin">⏳</span>
      ) : children}
    </motion.button>
  );
}