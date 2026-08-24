import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({
    title,
    description,
    variant = 'default',
    onOpenChange,
    className = '',
    children,
  }, ref) => {
    const [open, setOpen] = useState(true);
    const hideTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (!open) {
        if (onOpenChange) onOpenChange(false);
        return;
      }

      // Auto-dismiss after 5 seconds
      hideTimeout.current = setTimeout(() => {
        setOpen(false);
      }, 5000);

      return () => {
        if (hideTimeout.current) clearTimeout(hideTimeout.current);
      };
    }, [open, onOpenChange]);

    const handleClose = () => {
      setOpen(false);
    };

    if (!open) return null;

    return (
      <div
        ref={ref}
        className={`fixed right-4 top-4 z-50 flex flex-col-reverse sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 sm:space-x-4 ${className}`}
        role="alert"
      >
        {/* Toast Container */}
        <div
          className={`flex w-full max-w-xs items-center gap-4 rounded-border border p-4 shadow-lg 
                   ${variant === 'destructive'
                     ? 'border-destructive/50 bg-destructive text-destructive-foreground'
                     : 'border-background/50 bg-background text-foreground'}
                   backdrop-blur-sm`}
        >
          {/* Icon */}
          <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center">
            {variant === 'destructive' ? (
              <svg className="h-4 w-4 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3 3 0 014.438 0 3.42 3.42 0 001.946.806 3 3 0 014.438 0 3.42 3.42 0 001.946.806 3 3 0 014.438 0V16a3 3 0 01-3 3H6a3 3 0 01-3-3V4.697z" />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="space-y-1">
            <h3 className="font-medium text-sm">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="ml-auto flex h-4 w-4 items-center justify-center rounded-sm hover:bg-accent/20"
            aria-label="Fechar notificação"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    )
  }
);

Toast.displayName = 'Toast';

export { Toast };
