import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

interface DialogTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
}

interface DialogHeaderProps {
  className?: string;
  children: React.ReactNode;
}

interface DialogTitleProps {
  className?: string;
  children: React.ReactNode;
}

interface DialogDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  ({
    open,
    onOpenChange,
    title,
    description,
    children,
    className = '',
  }, ref) => {
    const mounted = useRef(false);

    useEffect(() => {
      mounted.current = open;

      return () => {
        mounted.current = false;
      };
    }, [open]);

    // Handle Escape key
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onOpenChange(false);
        }
      };

      if (open) {
        window.addEventListener('keydown', handleKeyDown);
      } else {
        window.removeEventListener('keydown', handleKeyDown);
      }

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [open, onOpenChange]);

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onOpenChange(false);
      }
    };

    if (!mounted) return null;

    return (
      <div
        ref={ref}
        className={`fixed inset-0 z-50 flex items-end justify-center px-4 py-6 sm:mx-auto sm:h-full sm:items-center ${className}`}
        onClick={handleBackdropClick}
      >
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

        {/* Dialog Panel */}
        <div
          className={`fixed left-1/2 bottom-[calc(100%-1.5rem)] transform -translate-x-1/2 w-full max-w-md max-h-[calc(100%-3.5rem)] overflow-y-auto
           bg-popover p-6 rounded-xl shadow-xl ring-1 ring-black ring-opacity-5
           duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out
           data-[state=enter]:fade-in-0 data-[state=enter]:zoom-in-95
           data-[state=leave]:fade-out-0 data-[state=leave]:zoom-out-95`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-description"
        >
          {/* Header */}
          {title && (
            <div className="mb-4">
              <h2 id="dialog-title" className="text-lg font-semibold leading-none text-foreground">
                {title}
              </h2>
              {description && (
                <p id="dialog-description" className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          )}

          {/* Content */}
          <div className="space-y-4">{children}</div>

          {/* Footer */}
          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
            {/* Default close button - can be overridden by children */}
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }
);

Dialog.displayName = 'Dialog';

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({
    children,
    className = '',
    ...props
  }, ref) => {
    return (
      <button
        ref={ref}
        className={`${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

DialogTrigger.displayName = 'DialogTrigger';

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({
    className = '',
    children,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={`popup w-full max-w-xs origin-top-right rounded-md border bg-popover p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=enter]:fade-in-0 data-[state=enter]:zoom-in-95 data-[state=leave]:fade-out-0 data-[state=leave]:zoom-out-95 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DialogContent.displayName = 'DialogContent';

const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({
    className = '',
    children,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex flex-col space-y-2 text-center sm:text-left ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DialogHeader.displayName = 'DialogHeader';

const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({
    className = '',
    children,
    ...props
  }, ref) => {
    return (
      <h2
        ref={ref}
        className={`${className} text-lg font-semibold leading-none text-foreground`}>
        {children}
      </h2>
    );
  }
);

DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({
    className = '',
    children,
    ...props
  }, ref) => {
    return (
      <p
        ref={ref}
        className={`${className} mt-1 text-sm text-muted-foreground`}>
        {children}
      </p>
    );
  }
);

DialogDescription.displayName = 'DialogDescription';

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  type DialogProps,
  type DialogTriggerProps,
  type DialogContentProps,
  type DialogHeaderProps,
  type DialogTitleProps,
  type DialogDescriptionProps
};