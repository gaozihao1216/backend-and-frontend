export type PageDisplayMode = "static" | "dynamic" | "compare";

const STORAGE_KEY = "ugc-level-platform.page-display-mode.v1";

const isPageDisplayMode = (value: string | null): value is PageDisplayMode =>
  value === "static" || value === "dynamic" || value === "compare";

export const readStoredPageDisplayMode = (): PageDisplayMode => {
  if (typeof window === "undefined") {
    return "static";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isPageDisplayMode(stored) ? stored : "static";
};

export const persistPageDisplayMode = (mode: PageDisplayMode) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, mode);
};

export const readPageDisplayModeFromSearch = (search: string): PageDisplayMode | null => {
  const value = new URLSearchParams(search).get("uiMode");
  return isPageDisplayMode(value) ? value : null;
};

export const pageDisplayModeLabels: Record<PageDisplayMode, string> = {
  static: "静态页面",
  dynamic: "动态嵌套",
  compare: "对比",
};
