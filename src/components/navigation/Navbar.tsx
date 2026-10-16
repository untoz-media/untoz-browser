import React from "react";

interface NavbarProps {
  className?: string;
  children?: React.ReactNode;
}

const Navbar = ({ className = "", children, ...props }: NavbarProps) => {
  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between px-4 py-2 bg-background/50 backdrop-blur-md border-b border-border/50 sm:px-6 lg:px-8 ${className}`}
      {...props}
    >
      <div className="flex-shrink-0 flex items-center">
        {/* Brand/Logo */}
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">U</span>
          </div>
          <span className="text-xl font-bold text-white">Untoz Browser</span>
        </div>
      </div>

      <div className="hidden md:flex-1 flex items-center justify-center">
        {/* Navigation Links */}
        <div className="flex space-x-4">
          <a
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Início
          </a>
          <a
            href="/features"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Recursos
          </a>
          <a
            href="/community"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Comunidade
          </a>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Actions */}
        {children}
      </div>
    </nav>
  );
};

Navbar.displayName = "Navbar";

export { Navbar };
