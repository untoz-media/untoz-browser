export const SEARCH_ENGINES = {
  duckduckgo: { label: "DuckDuckGo", queryURL: "https://duckduckgo.com/?q=" },
  google: { label: "Google", queryURL: "https://www.google.com/search?q=" },
  bing: { label: "Bing", queryURL: "https://www.bing.com/search?q=" },
  brave: {
    label: "Brave Search",
    queryURL: "https://search.brave.com/search?q=",
  },
} as const;
export type SearchEngine = keyof typeof SEARCH_ENGINES;
