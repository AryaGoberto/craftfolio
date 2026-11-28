export type ColorScheme = "light" | "dark";

export const COLOR_SCHEME_STORAGE_KEY = "craftfolio-color-scheme";
export const COLOR_SCHEME_CHANGE_EVENT = "craftfolio-color-scheme-change";
export const DEFAULT_COLOR_SCHEME: ColorScheme = "light";

export function isValidColorScheme(value: unknown): value is ColorScheme {
  return value === "light" || value === "dark";
}

export function resolveInitialColorScheme(
  stored: unknown,
  prefersDark: boolean
): ColorScheme {
  if (isValidColorScheme(stored)) {
    return stored;
  }
  return prefersDark ? "dark" : "light";
}

export function getNextColorScheme(current: ColorScheme): ColorScheme {
  return current === "dark" ? "light" : "dark";
}

/**
 * Synchronous bootstrap snippet run before first paint so users with Dark Mode
 * enabled do not see a flash of Light Mode on reload.
 */
export const COLOR_SCHEME_INIT_SCRIPT = `(function(){try{var k="${COLOR_SCHEME_STORAGE_KEY}";var s=window.localStorage.getItem(k);var d=s==="dark"||(s!=="light"&&window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.colorScheme=d?"dark":"light";}catch(e){document.documentElement.dataset.colorScheme="light";}})();`;
