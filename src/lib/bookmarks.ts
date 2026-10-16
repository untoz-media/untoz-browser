import { isHttpUrl } from '@/lib/navigation';

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  createdAt: number;
}

export function addBookmark(list: Bookmark[], bookmark: Bookmark): Bookmark[] {
  if (!isHttpUrl(bookmark.url)) return list;
  if (list.some((item) => item.url === bookmark.url)) return list;
  return [bookmark, ...list];
}

export function removeBookmark(list: Bookmark[], id: string): Bookmark[] {
  return list.filter((item) => item.id !== id);
}
