import React, { useState, useRef, useEffect } from 'react';

interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  shortcut?: string;
}

interface ContextMenuProps {
  anchorX: number;
  anchorY: number;
  items: ContextMenuItem[];
  className?: string;
  onClose?: () => void;
}

const ContextMenu = React.forwardRef<HTMLDivElement, ContextMenuProps>(
  ({
    anchorX,
    anchorY,
    items,
    className = '',
    onClose,
  }, ref) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    // Set position on mount
    useEffect(() => {
      setPosition({ x: anchorX, y: anchorY });
    }, [anchorX, anchorY]);

    // Handle clicks outside to close
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          onClose?.();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Handle Escape key
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose?.();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
      <div
        ref={ref}
        className={`fixed z-50 left-[${position.x}px] top-[${position.y}px] max-w-xs w-full origin-top-left ${className}`}
      >
        <div className="rounded-md bg-popover p-1 shadow-lg backdrop-blur-md ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {items.map((item, index) => {
              const isDisabled = item.disabled || false;
              return (
                <div
                  key={item.label}
                  onClick={!isDisabled ? item.onClick : undefined}
                  onMouseDown={(e) => {
                    if (isDisabled) e.preventDefault();
                  }}
                  className={`
                    flex cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm
                    outline-none focus:bg-accent focus:text-accent-foreground
                    ${isDisabled
                      ? 'pointer-events-none opacity-50'
                      : 'hover:bg-accent hover:text-accent-foreground'
                    }
                  `}
                  role="menuitem"
                  tabindex={-1}
                >
                  {item.icon && (
                    <div className="flex-shrink-0 h-5 w-5 flex items-center justify-center">
                      {item.icon}
                    </div>
                  )}
                  <div className="flex-1 flex-1 pl-0">{item.label}</div>
                  {item.shortcut && (
                    <div className="flex-shrink-0 text-xs text-muted-foreground">
                      <kbd className="bg-accent/20 px-1 py-0.5 rounded">{item.shortcut}</kbd>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

ContextMenu.displayName = 'ContextMenu';

export { ContextMenu };
export type { ContextMenuItem, ContextMenuProps };
