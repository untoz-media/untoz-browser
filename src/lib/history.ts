import { isHttpUrl } from '@/lib/navigation';

export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  visitedAt: number;
}

export const HISTORY_LIMIT = 200;

export function recordVisit(list: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  if (!isHttpUrl(entry.url)) return list;
  const [latest, ...rest] = list;
  if (latest && latest.url === entry.url) {
    return [{ ...latest, title: entry.title || latest.title, visitedAt: entry.visitedAt }, ...rest];
  }
  return [entry, ...list].slice(0, HISTORY_LIMIT);
}

export function clearHistory(): HistoryEntry[] {
  return [];
}
