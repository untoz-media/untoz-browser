import React, { useState } from "react";

interface DropdownProps {
  children: React.ReactNode;
  trigger: React.ReactNode | ((state: { open: boolean }) => React.ReactNode);
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
  collisionPadding?: number;
  className?: string;
}

interface DropdownTriggerProps {
  className?: string;
  children: React.ReactNode;
  open: boolean;
}

interface DropdownContentProps {
  className?: string;
  children: React.ReactNode;
  align: "start" | "center" | "end";
  sideOffset: number;
  alignOffset: number;
  collisionPadding: number;
}

const DropdownRoot = React.forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      children,
      trigger,
      align = "start",
      sideOffset = 4,
      alignOffset = 0,
      collisionPadding = 4,
      className = "",
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false);

    return (
      <div ref={ref} className={`relative inline-block text-left ${className}`}>
        <div
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onClick={(e) => {
            e.preventDefault();
            setOpen(!open);
          }}
        >
          {typeof trigger === "function" ? trigger({ open }) : trigger}
        </div>

        {open && (
          <div
            className={`absolute z-50 mt-2 w-56 origin-top-left rounded-md bg-popover p-1 shadow-lg backdrop-blur-md 
                      ring-1 ring-black ring-opacity-5 focus:outline-none 
                      ${["left", "center", "right"].includes(align) ? `transform-${align}` : ""}`}
            style={{
              left: alignOffset,
              top: `calc(100% + ${sideOffset}px)`,
              padding: collisionPadding,
            }}
          >
            <div
              className="py-1"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="menu-button"
            >
              {children}
            </div>
          </div>
        )}
      </div>
    );
  },
);

DropdownRoot.displayName = "Dropdown";

interface DropdownTriggerProps {
  children: React.ReactNode;
  open: boolean;
}

const DropdownTrigger = React.forwardRef<HTMLDivElement, DropdownTriggerProps>(
  ({ children, className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium 
                 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 
                 disabled:pointer-events-none disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </div>
  ),
);

DropdownTrigger.displayName = "DropdownTrigger";

interface DropdownContentProps {
  children: React.ReactNode;
}

const DropdownContent = React.forwardRef<HTMLDivElement, DropdownContentProps>(
  ({ children, className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`relative z-50 mx-auto max-w-xs w-full origin-top-left rounded-md bg-popover p-1 shadow-lg backdrop-blur-md 
               ring-1 ring-black ring-opacity-5 focus:outline-none 
               data-[state=open]:animate-in data-[state=closed]:animate-out 
               data-[state=enter]:fade-in-0 data-[state=leave]:fade-out-0 
               data-[state=enter]:zoom-in-95 data-[state=leave]:zoom-out-95 
               ${className}`}
      role="menu"
      aria-orientation="vertical"
      tabIndex={-1}
      {...props}
    >
      {children}
    </div>
  ),
);

DropdownContent.displayName = "DropdownContent";

const Dropdown = Object.assign(DropdownRoot, {
  Trigger: DropdownTrigger,
  Content: DropdownContent,
});

export { Dropdown };
