import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, RefreshCw, Search, Settings, Square } from 'lucide-react';
import { useTabsStore } from '@/store/useTabsStore';
import { Input } from '@/components/ui/Input';
import { IconButton } from '@/components/ui/IconButton';

const resolveAddress = (value: string) => {
  const input = value.trim();
  if (!input) return 'https://www.google.com';
  if (/^https?:\/\//i.test(input)) return input;
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(input)) return `https://${input}`;
  return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
};

export const TopNavigationBar = () => {
  const { tabs, activeTabId, addTab } = useTabsStore();
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null;

  useEffect(() => {
    if (activeTab) setAddress(activeTab.url);
  }, [activeTab?.id, activeTab?.url]);

  useEffect(() => {
    const browser = window.untozBrowser;
    if (!browser) return;
    return browser.onNavigationState((state) => {
      setIsLoading(state.isLoading);
      if (state.url) setAddress(state.url);
    });
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (modifier && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        window.untozBrowser?.reload();
      }
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        window.untozBrowser?.back();
      }
      if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault();
        window.untozBrowser?.forward();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const url = resolveAddress(address);
    if (!activeTabId) addTab(url, 'Nova Aba');
    window.untozBrowser?.navigate(url);
  };

  const handleNewTab = () => {
    const newTabUrl = 'https://www.google.com';
    addTab(newTabUrl, 'Nova Aba');
    window.untozBrowser?.navigate(newTabUrl);
  };

  return (
    <nav className="flex w-full items-center gap-2 px-3 py-2.5">
      <div className="flex items-center gap-2 shrink-0">
        <div className="h-7 w-7 flex items-center justify-center bg-primary/20 rounded-lg">
          <span className="text-primary text-sm font-bold">U</span>
        </div>
        <span className="text-foreground/90 font-semibold text-base whitespace-nowrap">Untoz</span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <IconButton onClick={() => window.untozBrowser?.back()} aria-label="Voltar" variant="ghost" size="sm" disabled={!activeTab} className="p-1.5">
          <ArrowLeft className="h-4 w-4" />
        </IconButton>
        <IconButton onClick={() => window.untozBrowser?.forward()} aria-label="Avançar" variant="ghost" size="sm" disabled={!activeTab} className="p-1.5">
          <ArrowRight className="h-4 w-4" />
        </IconButton>
        <IconButton onClick={() => (isLoading ? window.untozBrowser?.stop() : window.untozBrowser?.reload())} aria-label={isLoading ? 'Parar' : 'Atualizar'} variant="ghost" size="sm" className="p-1.5">
          {isLoading ? <Square className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
        </IconButton>
      </div>

      <form onSubmit={handleSearch} className="flex-1 min-w-0">
        <Input ref={inputRef} type="text" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Pesquisar ou digitar endereço..." className="pl-10 pr-4 text-sm" aria-label="Barra de endereço">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
        </Input>
      </form>

      {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}

      <IconButton onClick={handleNewTab} aria-label="Nova aba" variant="ghost" size="sm" className="p-1.5">+</IconButton>

      <IconButton aria-label="Perfil" variant="ghost" size="sm" className="p-1.5">
        <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm font-bold">U</div>
      </IconButton>

      <IconButton aria-label="Configurações" variant="ghost" size="sm" className="p-1.5">
        <Settings className="h-3.5 w-3.5" />
      </IconButton>
    </nav>
  );
};
