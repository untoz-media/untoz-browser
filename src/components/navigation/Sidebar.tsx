import { motion } from 'framer-motion';
import { Bookmark, Briefcase, Download, History, Home, Settings, type LucideIcon } from 'lucide-react';
import { DEFAULT_HOMEPAGE, NEW_TAB_URL } from '@/lib/navigation';
import { useTabsStore } from '@/store/useTabsStore';
import { useUiStore, type LibrarySection } from '@/store/useUiStore';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface MenuItem {
  id: 'home' | 'untoz' | LibrarySection;
  label: string;
  icon: LucideIcon | null;
}

const menuItems: MenuItem[] = [
  { id: 'home', label: 'Início', icon: Home },
  { id: 'bookmarks', label: 'Marcadores', icon: Bookmark },
  { id: 'history', label: 'Histórico', icon: History },
  { id: 'downloads', label: 'Downloads', icon: Download },
  { id: 'workspaces', label: 'Espaços de Trabalho', icon: Briefcase },
  { id: 'untoz', label: 'Untoz', icon: null },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export const Sidebar = ({ collapsed, onToggleCollapse }: SidebarProps) => {
  const { activeTabId, addTab, updateTab } = useTabsStore();
  const section = useUiStore((state) => state.section);
  const closeSection = useUiStore((state) => state.closeSection);
  const toggleSection = useUiStore((state) => state.toggleSection);

  const openUrl = (url: string, title: string) => {
    closeSection();
    if (!activeTabId) {
      addTab(url, title);
      return;
    }
    updateTab(activeTabId, { url, title, isLoading: url !== NEW_TAB_URL });
  };

  const selectItem = (item: MenuItem) => {
    if (item.id === 'home') {
      openUrl(NEW_TAB_URL, 'Nova aba');
      return;
    }
    if (item.id === 'untoz') {
      openUrl(DEFAULT_HOMEPAGE, 'Untoz');
      return;
    }
    toggleSection(item.id);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex h-full flex-col overflow-hidden bg-background/95 backdrop-blur-xl border-r border-border/20 flex-shrink-0 shadow-md"
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
          type="button"
          onClick={onToggleCollapse}
          aria-label="Alternar sidebar"
          className="p-2 rounded hover:bg-accent/10 hover:backdrop-brightness-105 transition-colors duration-200"
        >
          <span className="text-foreground/60">{collapsed ? '›' : '‹'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-6">
        <menu className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const selected = item.id === section;
            return (
              <motion.div
                key={item.id}
                initial={{ x: -4, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -4, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              >
                <button
                  type="button"
                  onClick={() => selectItem(item)}
                  aria-current={selected ? 'page' : undefined}
                  className={`
                    flex w-full items-center px-3 py-2.5 rounded-md text-left
                    ${!collapsed ? 'hover:bg-accent/5 hover:backdrop-brightness-105 transition-all duration-200' : ''}
                    ${selected ? 'bg-primary/15 text-primary' : ''}
                  `}
                >
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                    {Icon ? (
                      <Icon className="h-4 w-4 text-foreground/60" />
                    ) : (
                      <div className="h-6 w-6 bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm font-bold">
                        U
                      </div>
                    )}
                  </div>
                  {!collapsed && (
                    <span className="ml-3 text-sm font-medium text-foreground/90 truncate max-w-[140px]">{item.label}</span>
                  )}
                </button>
              </motion.div>
            );
          })}
        </menu>
      </div>

      <div className="pt-4 px-4 border-t border-border/10">
        <p className="text-xs text-foreground/40 text-center">v1.0.0</p>
      </div>
    </motion.aside>
  );
};
