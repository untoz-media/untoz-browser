import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  'aria-label': string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = 'ghost',
      size = 'md',
      'aria-label': ariaLabel,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    // Base classes
    const baseClasses = 'inline-flex items-center justify-center rounded-full transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    // Variant classes
    const variantClasses = {
      default: 'bg-primary/20 text-primary hover:bg-primary/30 focus-visible:ring-primary/30',
      ghost: 'hover:bg-background/50 hover:border-border/10 focus-visible:ring-border/20',
      outline: 'border border-border/20 hover:bg-background/50 hover:border-border/10 focus-visible:ring-border/20',
    };

    // Size classes
    const sizeClasses = {
      sm: 'h-8 w-8 p-1',
      md: 'h-9 w-9 p-1.5',
      lg: 'h-10 w-10 p-2',
    };

    return (
      <button
        type="button"
        ref={ref}
        aria-label={ariaLabel}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
);

IconButton.displayName = 'IconButton';

export { IconButton };