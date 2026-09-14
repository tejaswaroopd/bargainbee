import React from 'react';
import { cn } from '../../utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'dark' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const VARIANTS = {
  primary: 'bg-bee-yellow text-bee-black font-semibold hover:bg-bee-yellow-dark focus:ring-bee-yellow',
  secondary: 'bg-white text-bee-black font-semibold border border-gray-200 hover:border-bee-yellow hover:bg-bee-yellow-light focus:ring-bee-yellow',
  dark: 'bg-bee-black text-white font-semibold hover:bg-bee-black-soft focus:ring-bee-black',
  ghost: 'bg-transparent text-bee-gray font-medium hover:bg-gray-100 focus:ring-gray-300',
  danger: 'bg-red-500 text-white font-semibold hover:bg-red-600 focus:ring-red-500',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-input transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
