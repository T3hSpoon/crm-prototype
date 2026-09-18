export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

/**
 * Resolves the theme to use on first load: an explicit user choice
 * previously saved to localStorage takes priority; otherwise falls back to
 * the OS/browser's `prefers-color-scheme`. Never throws — a disabled or
 * unavailable localStorage (private browsing, some embedded contexts) falls
 * through to the system-preference check.
 */
export function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage unavailable — fall through to system preference.
  }
  const prefersDark =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

/** Toggles the `.dark` class on the document root — Tailwind's `@custom-variant dark (&:is(.dark *))` convention. */
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/** Persists the user's explicit choice. Swallows a disabled/unavailable localStorage rather than throwing. */
export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Non-fatal — theme still applies for this session via applyTheme().
  }
}
