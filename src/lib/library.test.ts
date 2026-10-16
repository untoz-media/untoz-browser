import { describe, expect, it } from 'vitest';
import { addBookmark, removeBookmark } from './bookmarks';
import { HISTORY_LIMIT, clearHistory, recordVisit } from './history';
import { sanitizeSettings } from './settings';
import { readJson, writeJson, type KeyValueStorage } from './storage';

function memory(): KeyValueStorage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

describe('bookmarks', () => {
  it('stores http bookmarks once and ignores non-web urls', () => {
    const first = addBookmark([], {
      id: '1',
      url: 'https://www.untoz.com',
      title: 'Untoz',
      createdAt: 1,
    });
    const duplicate = addBookmark(first, {
      id: '2',
      url: 'https://www.untoz.com',
      title: 'Outro',
      createdAt: 2,
    });
    const blocked = addBookmark(duplicate, {
      id: '3',
      url: 'file:///tmp/notes.txt',
      title: 'Segredo',
      createdAt: 3,
    });
    expect(blocked).toHaveLength(1);
    expect(removeBookmark(blocked, '1')).toEqual([]);
  });
});

describe('history', () => {
  it('updates a consecutive visit and ignores non-web urls', () => {
    const first = recordVisit([], {
      id: '1',
      url: 'https://example.com',
      title: 'Example',
      visitedAt: 10,
    });
    const again = recordVisit(first, {
      id: '2',
      url: 'https://example.com',
      title: 'Example atualizado',
      visitedAt: 20,
    });
    const blocked = recordVisit(again, {
      id: '3',
      url: 'javascript:alert(1)',
      title: 'Nope',
      visitedAt: 30,
    });
    expect(blocked).toEqual([
      { id: '1', url: 'https://example.com', title: 'Example atualizado', visitedAt: 20 },
    ]);
    expect(clearHistory()).toEqual([]);
  });

  it('caps the list', () => {
    let list = [] as ReturnType<typeof recordVisit>;
    for (let index = 0; index < HISTORY_LIMIT + 5; index += 1) {
      list = recordVisit(list, {
        id: String(index),
        url: `https://example.com/${index}`,
        title: String(index),
        visitedAt: index,
      });
    }
    expect(list).toHaveLength(HISTORY_LIMIT);
    expect(list[0]?.url).toBe(`https://example.com/${HISTORY_LIMIT + 4}`);
  });
});

describe('settings', () => {
  it('keeps a valid homepage and falls back when the value is unsafe', () => {
    expect(
      sanitizeSettings({ homepage: 'https://docs.untoz.com', searchEngine: 'duckduckgo' })
    ).toEqual({
      homepage: 'https://docs.untoz.com',
      searchEngine: 'duckduckgo',
    });
    expect(sanitizeSettings({ homepage: 'javascript:alert(1)', searchEngine: 'nope' })).toEqual({
      homepage: 'https://www.untoz.com',
      searchEngine: 'google',
    });
  });
});

describe('storage', () => {
  it('round-trips json and recovers from corrupt data', () => {
    const storage = memory();
    writeJson(storage, 'untoz.settings', { homepage: 'https://www.untoz.com' });
    expect(readJson(storage, 'untoz.settings', { homepage: '' }).homepage).toBe('https://www.untoz.com');
    storage.setItem('untoz.settings', '{');
    expect(readJson(storage, 'untoz.settings', { homepage: 'fallback' })).toEqual({
      homepage: 'fallback',
    });
  });
});
