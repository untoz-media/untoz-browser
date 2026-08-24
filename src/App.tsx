import { useState } from 'react';
import { useTabsStore } from '@/store/useTabsStore';
import { TopNavigationBar } from '@/components/navigation/TopNavigationBar';
import { Sidebar } from '@/components/navigation/Sidebar';
import { Tabs } from '@/components/ui/Tabs';
import { WebView } from '@/components/ui/WebView';

export const App = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { tabs, activeTabId } = useTabsStore();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header with Top Navigation Bar */}
      <header className={`
        bg-background/90 backdrop-blur-xl border-b border-border/10
        backdrop-brightness-95
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex-shrink-0 flex items-center space-x-2">
              <div className="h-7 w-7 flex items-center justify-center bg-primary/20 rounded-lg">
                <span className="text-primary text-sm font-bold">U</span>
              </div>
              <span className="text-foreground/90 font-semibold text-base whitespace-nowrap">
                Untoz
              </span>
            </div>

            {/* Top Navigation Bar */}
            <TopNavigationBar />
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className={`
            border-b border-border/10
            bg-background/80 backdrop-blur-lg
          `}>
            <Tabs tabs={tabs} activeTabId={activeTabId} />
          </div>

          {/* Web view */}
          <div className="flex-1 overflow-hidden">
            {activeTabId ? (
              <WebView url={tabs.find(t => t.id === activeTabId)?.url ?? ''} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-foreground/40">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary text-lg font-medium">
                    U
                  </div>
                  <p className="text-sm font-medium">Nenhuma aba ativa</p>
                  <p className="text-xs text-foreground/30">Clique no + para abrir uma nova aba</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`
        bg-background/90 backdrop-blur-xl border-t border-border/10
        backdrop-brightness-95
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="text-center text-xs text-foreground/40">
            © {new Date().getFullYear()} Untoz Browser. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;