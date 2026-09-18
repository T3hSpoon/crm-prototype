import { useEffect, useState } from "react";
import { applyTheme, getInitialTheme, storeTheme, type Theme } from "@/shared/utils/theme";

/**
 * App-wide light/dark theme state. Applies/persists via theme.ts's pure
 * functions — this hook is just the React state wiring. Initializes
 * synchronously (useState initializer, not an effect) so the correct theme
 * class is present before first paint, avoiding a light-mode flash on a
 * dark-preferring system.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (next: Theme) => {
    storeTheme(next);
    setThemeState(next);
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return { theme, setTheme, toggleTheme };
}
