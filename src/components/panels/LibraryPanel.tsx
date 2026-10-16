import { useState } from 'react';
import { SEARCH_ENGINES, isHttpUrl, type SearchEngineId } from '@/lib/navigation';
import { useBookmarksStore } from '@/store/useBookmarksStore';
import { useHistoryStore } from '@/store/useHistoryStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTabsStore } from '@/store/useTabsStore';
import { useUiStore, type LibrarySection } from '@/store/useUiStore';
import { Button } from '@/components/ui/Button';

const titles: Record<LibrarySection, string> = {
  bookmarks: 'Marcadores',
  history: 'Histórico',
  downloads: 'Downloads',
  workspaces: 'Espaços de Trabalho',
  settings: 'Configurações',
};

export const LibraryPanel = ({ section }: { section: LibrarySection }) => {
  const closeSection = useUiStore((state) => state.closeSection);
  const { activeTabId, addTab, updateTab } = useTabsStore();
  const bookmarks = useBookmarksStore((state) => state.bookmarks);
  const removeBookmark = useBookmarksStore((state) => state.removeBookmark);
  const entries = useHistoryStore((state) => state.entries);
  const clearHistory = useHistoryStore((state) => state.clearHistory);
  const homepage = useSettingsStore((state) => state.homepage);
  const searchEngine = useSettingsStore((state) => state.searchEngine);
  const setHomepage = useSettingsStore((state) => state.setHomepage);
  const setSearchEngine = useSettingsStore((state) => state.setSearchEngine);
  const [homepageDraft, setHomepageDraft] = useState(homepage);
  const [homepageError, setHomepageError] = useState('');
  const [homepageSaved, setHomepageSaved] = useState(false);

  const openUrl = (url: string, title: string) => {
    if (!isHttpUrl(url)) return;
    closeSection();
    if (!activeTabId) {
      addTab(url, title);
      return;
    }
    updateTab(activeTabId, { url, title, isLoading: true });
  };

  return (
    <section className="h-full overflow-y-auto bg-background px-6 py-6 text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">{titles[section]}</h1>
          <Button variant="ghost" size="sm" onClick={closeSection}>
            Voltar
          </Button>
        </div>
        <p className="text-sm text-foreground/60">
          Marcadores, histórico e configurações ficam somente neste computador.
        </p>

        {section === 'bookmarks' && (
          <div className="space-y-2">
            {bookmarks.length === 0 && <p className="text-sm text-foreground/50">Nenhum marcador ainda.</p>}
            {bookmarks.map((bookmark) => (
              <div key={bookmark.id} className="flex items-center gap-3 rounded-xl border border-border/20 px-3 py-2">
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openUrl(bookmark.url, bookmark.title)}>
                  <span className="block truncate text-sm font-medium">{bookmark.title}</span>
                  <span className="block truncate text-xs text-foreground/50">{bookmark.url}</span>
                </button>
                <Button variant="ghost" size="sm" onClick={() => removeBookmark(bookmark.id)}>
                  Remover
                </Button>
              </div>
            ))}
          </div>
        )}

        {section === 'history' && (
          <div className="space-y-3">
            <div>
              <Button variant="outline" size="sm" onClick={clearHistory} disabled={entries.length === 0}>
                Limpar histórico
              </Button>
            </div>
            {entries.length === 0 && <p className="text-sm text-foreground/50">O histórico está vazio.</p>}
            {entries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className="block w-full rounded-xl border border-border/20 px-3 py-2 text-left hover:bg-background-hover"
                onClick={() => openUrl(entry.url, entry.title)}
              >
                <span className="block truncate text-sm font-medium">{entry.title}</span>
                <span className="block truncate text-xs text-foreground/50">{entry.url}</span>
              </button>
            ))}
          </div>
        )}

        {section === 'downloads' && (
          <p className="text-sm text-foreground/70">O gerenciador de downloads ainda não está disponível nesta versão.</p>
        )}

        {section === 'workspaces' && (
          <p className="text-sm text-foreground/70">Espaços de trabalho ainda não estão disponíveis nesta versão.</p>
        )}

        {section === 'settings' && (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const saved = setHomepage(homepageDraft.trim());
              setHomepageSaved(saved);
              setHomepageError(saved ? '' : 'Use um endereço http ou https.');
              if (saved) setHomepageDraft(homepageDraft.trim());
            }}
          >
            <label className="block space-y-2 text-sm">
              <span>Página inicial</span>
              <input
                value={homepageDraft}
                onChange={(event) => setHomepageDraft(event.target.value)}
                className="h-9 w-full rounded-xl border border-input bg-background/50 px-3"
                id="homepage"
                name="homepage"
                aria-label="Página inicial"
                spellCheck={false}
              />
            </label>
            {homepageError && (
              <p className="text-sm text-red-300" role="alert">
                {homepageError}
              </p>
            )}
            {homepageSaved && !homepageError && (
              <p className="text-sm text-foreground/70" role="status">
                Página inicial salva neste computador.
              </p>
            )}
            <div className="space-y-2 text-sm">
              <span id="search-engine-label">Motor de busca</span>
              <div className="flex flex-wrap gap-2" role="group" aria-labelledby="search-engine-label">
                {(Object.keys(SEARCH_ENGINES) as SearchEngineId[]).map((engine) => (
                  <button
                    key={engine}
                    type="button"
                    aria-pressed={searchEngine === engine}
                    onClick={() => setSearchEngine(engine)}
                    className={`rounded-xl border px-3 py-1.5 ${
                      searchEngine === engine
                        ? 'border-primary bg-primary/20 text-primary'
                        : 'border-border/30 text-foreground/70 hover:bg-background-hover'
                    }`}
                  >
                    {engine}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" variant="primary" size="sm">
              Salvar página inicial
            </Button>
          </form>
        )}
      </div>
    </section>
  );
};
