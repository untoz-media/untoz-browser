import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex flex-col rounded-lg border border-background bg-background/50 backdrop-blur-sm shadow-sm ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
);

Card.displayName = 'Card';

export { Card };
