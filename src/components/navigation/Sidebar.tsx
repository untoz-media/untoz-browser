import { motion } from 'framer-motion';
import {
  Home,
  Bookmark,
  History,
  Download,
  Briefcase,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar = ({ collapsed, onToggleCollapse }: SidebarProps) => {
  const menuItems = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'bookmarks', label: 'Marcadores', icon: Bookmark },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'downloads', label: 'Downloads', icon: Download },
    { id: 'workspaces', label: 'Espaços de Trabalho', icon: Briefcase },
    { id: 'untoz', label: 'Untoz', icon: null }, // custom
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <motion.aside
      initial={{ x: '-100%' }}
      animate={{ x: collapsed ? '-100%' : 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`
        w-64
        bg-background/95
        backdrop-blur-xl
        border-r
        border-border/20
        flex-shrink-0
        ${!collapsed ? 'block' : 'hidden'}
        md:block
        shadow-md
        transition-all
        duration-300
      `}
    >
      <div className="flex h-14 items-center justify-between px-4 border-b border-border/10">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 flex items-center justify-center bg-primary/20 rounded-lg">
            <span className="text-primary text-sm font-bold">U</span>
          </div>
          <span className={collapsed ? 'hidden' : 'text-foreground/90 font-semibold text-lg whitespace-nowrap'}>
            Untoz
          </span>
        </div>
        <button
          onClick={onToggleCollapse}
          aria-label="Alternar sidebar"
          className="p-2 rounded hover:bg-accent/10 hover:backdrop-brightness-105 transition-colors duration-200"
        >
          {collapsed ? (
            <span className="text-foreground/60">›</span>
          ) : (
            <span className="text-foreground/60">‹</span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-6">
        <menu className="space-y-1">
          {menuItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ x: -4, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -4, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className={`
                flex items-center px-3 py-2.5 rounded-md
                ${!collapsed && 'hover:bg-accent/5 hover:backdrop-brightness-105 transition-all duration-200'}
                cursor-default select-none
              `}
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                {item.id === 'untoz' ? (
                  <div className="h-6 w-6 bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm font-bold">
                    U
                  </div>
                ) : (
                  <item.icon className="h-4 w-4 text-foreground/60" />
                )}
              </div>
              {!collapsed && (
                <span className="ml-3 text-sm font-medium text-foreground/90 truncate max-w-[100px]">{item.label}</span>
              )}
            </motion.div>
          ))}
        </menu>
      </div>

      <div className="pt-4 px-4 border-t border-border/10">
        <p className="text-xs text-foreground/40 text-center">v1.0.0</p>
      </div>
    </motion.aside>
  );
};