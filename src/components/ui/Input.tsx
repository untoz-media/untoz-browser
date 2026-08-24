import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'underline';
  size?: 'sm' | 'md' | 'lg';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = 'text',
      placeholder = '',
      ...props
    },
    ref
  ) => {
    // Base classes - refined for premium look
    const baseClasses = 'flex h-9 w-full rounded-xl border border-input bg-background/50 backdrop-blur-sm px-4 py-2 text-sm font-medium placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50';

    // Size classes
    const sizeClasses = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-9 px-4 text-sm',
      lg: 'h-10 px-4 py-2 text-base',
    };

    return (
      <input
        type={type}
        placeholder={placeholder}
        ref={ref}
        className={`${baseClasses} ${sizeClasses[size] || ''} ${props.className ?? ''}`}
        {...props}
      />
    )
  }
);

Input.displayName = 'Input';

export { Input };