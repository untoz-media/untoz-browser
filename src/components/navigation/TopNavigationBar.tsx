import { useState } from 'react';
import { useTabsStore } from '@/store/useTabsStore';
import { Search, Settings } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { IconButton } from '@/components/ui/IconButton';

export const TopNavigationBar = () => {
  const { tabs, activeTabId, addTab, updateTab } = useTabsStore();
  const [searchQuery, setSearchQuery] = useState('');

  const activeTab = tabs.find(t => t.id === activeTabId) ?? null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const url = /^https?:\/\//i.test(searchQuery)
      ? searchQuery
      : `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

    if (activeTab) {
      updateTab(activeTab.id, { url, title: url });
    } else {
      addTab(url, 'Nova Aba');
    }
    setSearchQuery('');
  };

  return (
    <nav className={`
      flex items-center space-x-2 bg-background/90 backdrop-blur-xl border-b border-border/10
      px-3 py-2.5
      transition-all duration-300
    `}>
      {/* Brand */}
      <div className="flex-shrink-0 flex items-center space-x-2 rtl:space-x-reverse">
        <div className="h-7 w-7 flex items-center justify-center bg-primary/20 rounded-lg">
          <span className="text-primary text-sm font-bold">U</span>
        </div>
        <span className="text-foreground/90 font-semibold text-base whitespace-nowrap">
          Untoz
        </span>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
        <IconButton
          aria-label="Voltar"
          variant="ghost"
          size="sm"
          disabled={!activeTab}
          className="p-1.5 hover:bg-accent/5 hover:backdrop-brightness-105 transition-all duration-200"
        >
          〈
        </IconButton>
        <IconButton
          aria-label="Avançar"
          variant="ghost"
          size="sm"
          disabled={!activeTab}
          className="p-1.5 hover:bg-accent/5 hover:backdrop-brightness-105 transition-all duration-200"
        >
          〉
        </IconButton>
        <IconButton
          aria-label="Atualizar"
          variant="ghost"
          size="sm"
          className="p-1.5 hover:bg-accent/5 hover:backdrop-brightness-105 transition-all duration-200"
        >
          ⟳
        </IconButton>
        <IconButton
          aria-label="Página inicial"
          variant="ghost"
          size="sm"
          className="p-1.5 hover:bg-accent/5 hover:backdrop-brightness-105 transition-all duration-200"
        >
          ↺
        </IconButton>
      </div>

      {/* Address bar */}
      <form onSubmit={handleSearch} className="flex-1 mx-4">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar ou digitar endereço..."
          className="pl-10 pr-4 text-sm"
        >
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40">
            <Search />
          </span>
        </Input>
      </form>

      {/* New Tab button */}
      <IconButton
        onClick={() => {
          addTab('https://www.untoz.com', 'Nova Aba');
        }}
        aria-label="Nova aba"
        variant="ghost"
        size="sm"
        className="p-1.5 hover:bg-accent/5 hover:backdrop-brightness-105 transition-all duration-200"
      >
        +
      </IconButton>

      {/* Profile placeholder */}
      <div className="relative">
        <IconButton
          aria-label="Perfil"
          variant="ghost"
          size="sm"
          className="p-1.5 hover:bg-accent/5 hover:backdrop-brightness-105 transition-all duration-200"
        >
          <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm font-bold">
            U
          </div>
        </IconButton>
      </div>

      {/* Settings button */}
      <IconButton
        aria-label="Configurações"
        variant="ghost"
        size="sm"
        className="p-1.5 hover:bg-accent/5 hover:backdrop-brightness-105 transition-all duration-200"
      >
        <Settings className="h-3.5 w-3.5" />
      </IconButton>
    </nav>
  );
};