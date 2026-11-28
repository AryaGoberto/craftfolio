"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import {
  COLOR_SCHEME_CHANGE_EVENT,
  COLOR_SCHEME_STORAGE_KEY,
  DEFAULT_COLOR_SCHEME,
  getNextColorScheme,
  isValidColorScheme,
  resolveInitialColorScheme,
  type ColorScheme,
} from "@/lib/color-scheme";

function readClientColorScheme(): ColorScheme {
  try {
    const saved = window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
    if (isValidColorScheme(saved)) {
      return saved;
    }
    const datasetScheme = document.documentElement.dataset.colorScheme;
    if (isValidColorScheme(datasetScheme)) {
      return datasetScheme;
    }
    const prefersDark =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    return resolveInitialColorScheme(saved, prefersDark);
  } catch {
    return DEFAULT_COLOR_SCHEME;
  }
}

function subscribeToColorScheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(COLOR_SCHEME_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(COLOR_SCHEME_CHANGE_EVENT, callback);
  };
}

function getServerColorScheme(): ColorScheme {
  return DEFAULT_COLOR_SCHEME;
}

interface ColorSchemeToggleProps {
  size?: "sm" | "md";
}

export function ColorSchemeToggle({ size = "md" }: ColorSchemeToggleProps) {
  const scheme = useSyncExternalStore(
    subscribeToColorScheme,
    readClientColorScheme,
    getServerColorScheme
  );

  useEffect(() => {
    document.documentElement.dataset.colorScheme = scheme;
  }, [scheme]);

  const handleToggle = () => {
    const next = getNextColorScheme(scheme);
    document.documentElement.dataset.colorScheme = next;
    try {
      window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, next);
    } catch {
      // Ignore storage errors in restricted browsing contexts.
    }
    window.dispatchEvent(new Event(COLOR_SCHEME_CHANGE_EVENT));
  };

  const isDark = scheme === "dark";
  const label = isDark ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap";
  const dimensions = size === "sm" ? "h-7 w-7" : "h-8 w-8";

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center ${dimensions} rounded-md text-ui-text-secondary hover:text-ui-text hover:bg-ui-subtle transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus`}
    >
      {isDark ? (
        <Sun className="w-3.5 h-3.5" aria-hidden="true" />
      ) : (
        <Moon className="w-3.5 h-3.5" aria-hidden="true" />
      )}
    </button>
  );
}
