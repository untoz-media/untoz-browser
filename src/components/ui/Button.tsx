import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  block?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<
  HTMLElement,
  ButtonProps
>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      leftIcon,
      rightIcon,
      block = false,
      asChild = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    // Base classes
    const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    // Variant classes
    const variantClasses = {
      primary: 'bg-primary/10 text-primary hover:bg-primary/20 hover:border-border/10 focus-visible:ring-primary/20',
      secondary: 'bg-secondary/10 text-secondary hover:bg-secondary/20 hover:border-border/10 focus-visible:ring-secondary/20',
      outline: 'border border-border/20 hover:bg-background/50 hover:border-border/10 focus-visible:ring-border/20',
      ghost: 'hover:bg-background/50 hover:border-border/10 focus-visible:ring-border/20',
    };

    // Size classes
    const sizeClasses = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-9 px-4 text-sm',
      lg: 'h-10 px-5 text-base',
    };

    const Component = asChild ? 'span' : 'button';

    return (
      <Component
        type={asChild ? undefined : 'button'}
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${block ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {icon && (
          <>
            {leftIcon && <span className="mx-1" />}
            <span className="flex-shrink-0">{icon}</span>
            {leftIcon || rightIcon ? <span className="mx-1" /> : null}
          </>
        )}
        <span className="flex-1">{children}</span>
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </Component>
    )
  }
);

Button.displayName = 'Button';

export { Button };