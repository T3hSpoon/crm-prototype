import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getInitialTheme, applyTheme, storeTheme } from "./theme";

/**
 * This project's Vitest runs with `environment: "node"` (no jsdom — unit
 * tests target pure business logic, not DOM/component behavior, per
 * PROJECT.md's Phase 5 decision). `theme.ts`'s functions are thin DOM/
 * localStorage wrappers, so rather than add a jsdom dependency just for
 * this file, stub the minimal `document`/`localStorage`/`window.matchMedia`
 * surface these functions actually touch.
 */

function makeFakeClassList() {
  const classes = new Set<string>();
  return {
    add: (c: string) => classes.add(c),
    remove: (c: string) => classes.delete(c),
    toggle: (c: string, force?: boolean) => {
      const shouldHave = force ?? !classes.has(c);
      if (shouldHave) classes.add(c);
      else classes.delete(c);
    },
    contains: (c: string) => classes.has(c),
  };
}

function makeFakeLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    clear: () => store.clear(),
  };
}

describe("theme utilities", () => {
  let classList: ReturnType<typeof makeFakeClassList>;
  let fakeLocalStorage: ReturnType<typeof makeFakeLocalStorage>;

  beforeEach(() => {
    classList = makeFakeClassList();
    fakeLocalStorage = makeFakeLocalStorage();
    vi.stubGlobal("document", { documentElement: { classList } });
    vi.stubGlobal("localStorage", fakeLocalStorage);
    vi.stubGlobal("window", { matchMedia: undefined });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("getInitialTheme", () => {
    it("returns the stored theme when localStorage has a valid explicit value", () => {
      fakeLocalStorage.setItem("theme", "dark");
      expect(getInitialTheme()).toBe("dark");

      fakeLocalStorage.setItem("theme", "light");
      expect(getInitialTheme()).toBe("light");
    });

    it("falls back to prefers-color-scheme when nothing is stored", () => {
      vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
      expect(getInitialTheme()).toBe("dark");
    });

    it("falls back to light when nothing is stored and the system has no dark preference", () => {
      vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
      expect(getInitialTheme()).toBe("light");
    });

    it("ignores a garbage stored value and falls back to system preference", () => {
      fakeLocalStorage.setItem("theme", "not-a-real-theme");
      vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
      expect(getInitialTheme()).toBe("light");
    });

    it("falls back to light without throwing when localStorage.getItem throws (private-browsing style failure)", () => {
      vi.stubGlobal("localStorage", {
        getItem: () => {
          throw new Error("access denied");
        },
      });
      vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
      expect(getInitialTheme()).toBe("light");
    });
  });

  describe("applyTheme", () => {
    it("adds the dark class to the document root when theme is dark", () => {
      applyTheme("dark");
      expect(classList.contains("dark")).toBe(true);
    });

    it("removes the dark class from the document root when theme is light", () => {
      classList.add("dark");
      applyTheme("light");
      expect(classList.contains("dark")).toBe(false);
    });
  });

  describe("storeTheme", () => {
    it("persists the theme to localStorage under the 'theme' key", () => {
      storeTheme("dark");
      expect(fakeLocalStorage.getItem("theme")).toBe("dark");
    });

    it("does not throw when localStorage.setItem is unavailable", () => {
      vi.stubGlobal("localStorage", {
        setItem: () => {
          throw new Error("quota exceeded");
        },
      });
      expect(() => storeTheme("dark")).not.toThrow();
    });
  });
});
