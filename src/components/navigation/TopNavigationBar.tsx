import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Bookmark, Home, Loader2, RefreshCw, Search, Settings, Square } from 'lucide-react';
import { NEW_TAB_URL, isHttpUrl, isInternalUrl, resolveAddress } from '@/lib/navigation';
import { useBookmarksStore } from '@/store/useBookmarksStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTabsStore } from '@/store/useTabsStore';
import { useUiStore } from '@/store/useUiStore';
import { Input } from '@/components/ui/Input';
import { IconButton } from '@/components/ui/IconButton';

export const TopNavigationBar = () => {
  const { tabs, activeTabId, addTab, removeTab, updateTab } = useTabsStore();
  const bookmarks = useBookmarksStore((state) => state.bookmarks);
  const addBookmark = useBookmarksStore((state) => state.addBookmark);
  const removeBookmark = useBookmarksStore((state) => state.removeBookmark);
  const homepage = useSettingsStore((state) => state.homepage);
  const searchEngine = useSettingsStore((state) => state.searchEngine);
  const toggleSection = useUiStore((state) => state.toggleSection);
  const closeSection = useUiStore((state) => state.closeSection);
  const [address, setAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null;
  const currentBookmark = activeTab ? bookmarks.find((item) => item.url === activeTab.url) : undefined;

  useEffect(() => {
    if (document.activeElement === inputRef.current) return;
    if (!activeTab || isInternalUrl(activeTab.url)) {
      setAddress('');
      return;
    }
    setAddress(activeTab.url);
  }, [activeTab]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (modifier && key === 'l') {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (modifier && key === 't') {
        event.preventDefault();
        closeSection();
        addTab(NEW_TAB_URL, 'Nova aba');
      }
      if (modifier && key === 'w' && activeTabId) {
        event.preventDefault();
        removeTab(activeTabId);
      }
      if (modifier && key === 'r' && activeTabId) {
        event.preventDefault();
        window.untozBrowser?.reload(activeTabId);
      }
      if (event.altKey && event.key === 'ArrowLeft' && activeTabId) {
        event.preventDefault();
        window.untozBrowser?.back(activeTabId);
      }
      if (event.altKey && event.key === 'ArrowRight' && activeTabId) {
        event.preventDefault();
        window.untozBrowser?.forward(activeTabId);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [activeTabId, addTab, closeSection, removeTab]);

  const openAddress = (value: string) => {
    const resolved = resolveAddress(value, searchEngine);
    if (!resolved) {
      setAddressError('Endereço bloqueado');
      return;
    }
    setAddressError('');
    closeSection();
    if (!activeTabId) {
      addTab(resolved, isInternalUrl(resolved) ? 'Nova aba' : 'Nova aba');
      return;
    }
    if (resolved === activeTab?.url && isHttpUrl(resolved)) {
      window.untozBrowser?.reload(activeTabId);
      return;
    }
    updateTab(activeTabId, {
      url: resolved,
      title: isInternalUrl(resolved) ? 'Nova aba' : activeTab?.title || 'Nova aba',
      isLoading: isHttpUrl(resolved),
    });
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    openAddress(address);
  };

  const toggleBookmark = () => {
    if (!activeTab || !isHttpUrl(activeTab.url)) return;
    if (currentBookmark) {
      removeBookmark(currentBookmark.id);
      return;
    }
    addBookmark(activeTab.url, activeTab.title || activeTab.url);
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
        <IconButton
          onClick={() => activeTabId && window.untozBrowser?.back(activeTabId)}
          aria-label="Voltar"
          variant="ghost"
          size="sm"
          disabled={!activeTab?.canGoBack}
          className="p-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
        </IconButton>
        <IconButton
          onClick={() => activeTabId && window.untozBrowser?.forward(activeTabId)}
          aria-label="Avançar"
          variant="ghost"
          size="sm"
          disabled={!activeTab?.canGoForward}
          className="p-1.5"
        >
          <ArrowRight className="h-4 w-4" />
        </IconButton>
        <IconButton
          onClick={() =>
            activeTabId &&
            (activeTab?.isLoading ? window.untozBrowser?.stop(activeTabId) : window.untozBrowser?.reload(activeTabId))
          }
          aria-label={activeTab?.isLoading ? 'Parar' : 'Atualizar'}
          variant="ghost"
          size="sm"
          disabled={!activeTab || !isHttpUrl(activeTab.url)}
          className="p-1.5"
        >
          {activeTab?.isLoading ? <Square className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
        </IconButton>
        <IconButton onClick={() => openAddress(homepage)} aria-label="Página inicial" variant="ghost" size="sm" className="p-1.5">
          <Home className="h-4 w-4" />
        </IconButton>
      </div>

      <form onSubmit={handleSearch} className="flex-1 min-w-0">
        <Input
          ref={inputRef}
          type="text"
          value={address}
          onChange={(event) => {
            setAddress(event.target.value);
            if (addressError) setAddressError('');
          }}
          placeholder="Pesquisar ou digitar endereço..."
          className="pl-10 pr-4 text-sm"
          id="address-bar"
          name="address"
          aria-label="Barra de endereço"
          aria-invalid={addressError ? true : undefined}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        >
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
        </Input>
      </form>

      {addressError && (
        <span className="text-xs text-red-300 shrink-0" role="alert">
          {addressError}
        </span>
      )}
      {activeTab?.isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}

      <button
        type="button"
        onClick={toggleBookmark}
        title={currentBookmark ? 'Remover marcador' : 'Adicionar marcador'}
        aria-label={currentBookmark ? 'Remover marcador' : 'Adicionar marcador'}
        aria-pressed={Boolean(currentBookmark)}
        disabled={!activeTab || !isHttpUrl(activeTab.url)}
        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-foreground/80 hover:bg-background/50 disabled:opacity-50"
      >
        <Bookmark className={`h-3.5 w-3.5 ${currentBookmark ? 'fill-current text-primary' : ''}`} />
        Marcador
      </button>

      <IconButton onClick={() => addTab(NEW_TAB_URL, 'Nova aba')} aria-label="Nova aba" variant="ghost" size="sm" className="p-1.5">
        +
      </IconButton>

      <IconButton aria-label="Perfil" variant="ghost" size="sm" className="p-1.5">
        <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm font-bold">U</div>
      </IconButton>

      <IconButton
        onClick={() => toggleSection('settings')}
        aria-label="Configurações"
        variant="ghost"
        size="sm"
        className="p-1.5"
      >
        <Settings className="h-3.5 w-3.5" />
      </IconButton>
    </nav>
  );
};
