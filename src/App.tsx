import { useState } from 'react';
import { isHttpUrl, isInternalUrl } from '@/lib/navigation';
import { useBrowserBridge } from '@/hooks/useBrowserBridge';
import { useTabsStore } from '@/store/useTabsStore';
import { useUiStore } from '@/store/useUiStore';
import { TopNavigationBar } from '@/components/navigation/TopNavigationBar';
import { Sidebar } from '@/components/navigation/Sidebar';
import { LibraryPanel } from '@/components/panels/LibraryPanel';
import { Tabs } from '@/components/ui/Tabs';
import { WebView } from '@/components/ui/WebView';
import { Home } from '@/pages/Home';

export const App = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { tabs, activeTabId } = useTabsStore();
  const section = useUiStore((state) => state.section);
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null;
  const showingWeb = !section && !!activeTab && isHttpUrl(activeTab.url);
  useBrowserBridge(showingWeb);

  return (
    <div className="min-h-screen h-screen flex flex-col bg-background">
      <header className="bg-background/90 backdrop-blur-xl border-b border-border/10 backdrop-brightness-95">
        <TopNavigationBar />
      </header>

      <main className="flex-1 flex min-h-0">
        <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="border-b border-border/10 bg-background/80 backdrop-blur-lg">
            <Tabs tabs={tabs} activeTabId={activeTabId} />
          </div>

          <div className="flex-1 overflow-hidden relative">
            <WebView visible={showingWeb} />
            {section ? (
              <LibraryPanel section={section} />
            ) : activeTab && isInternalUrl(activeTab.url) ? (
              <Home embedded />
            ) : !activeTab ? (
              <div className="flex flex-col items-center justify-center h-full text-foreground/40">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary text-lg font-medium">
                    U
                  </div>
                  <p className="text-sm font-medium">Nenhuma aba ativa</p>
                  <p className="text-xs text-foreground/30">Clique no + para abrir uma nova aba</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <footer className="bg-background/90 backdrop-blur-xl border-t border-border/10 backdrop-brightness-95">
        <div className="px-4 py-2">
          <div className="text-center text-xs text-foreground/40">
            © {new Date().getFullYear()} Untoz Browser. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
