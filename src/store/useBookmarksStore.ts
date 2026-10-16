import { create } from 'zustand';
import { addBookmark, removeBookmark, type Bookmark } from '@/lib/bookmarks';
import { createTabId } from '@/lib/tabs';
import { browserStorage, readJson, writeJson } from '@/lib/storage';

const STORAGE_KEY = 'untoz.bookmarks';

interface BookmarksStore {
  bookmarks: Bookmark[];
  addBookmark: (url: string, title: string) => void;
  removeBookmark: (id: string) => void;
}

function persist(bookmarks: Bookmark[]) {
  writeJson(browserStorage(), STORAGE_KEY, bookmarks);
}

export const useBookmarksStore = create<BookmarksStore>((set) => ({
  bookmarks: readJson<Bookmark[]>(browserStorage(), STORAGE_KEY, []),
  addBookmark: (url, title) => {
    set((state) => {
      const bookmarks = addBookmark(state.bookmarks, {
        id: createTabId(),
        url,
        title: title || url,
        createdAt: Date.now(),
      });
      persist(bookmarks);
      return { bookmarks };
    });
  },
  removeBookmark: (id) => {
    set((state) => {
      const bookmarks = removeBookmark(state.bookmarks, id);
      persist(bookmarks);
      return { bookmarks };
    });
  },
}));
