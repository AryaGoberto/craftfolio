import { describe, expect, it } from "vitest";
import {
  DEFAULT_COLOR_SCHEME,
  getNextColorScheme,
  isValidColorScheme,
  resolveInitialColorScheme,
} from "../color-scheme";

describe("color-scheme", () => {
  it("validates supported color schemes", () => {
    expect(isValidColorScheme("light")).toBe(true);
    expect(isValidColorScheme("dark")).toBe(true);
    expect(isValidColorScheme("cobalt")).toBe(false);
    expect(isValidColorScheme(null)).toBe(false);
  });

  it("prioritizes explicit stored preference over OS media query", () => {
    expect(resolveInitialColorScheme("light", true)).toBe("light");
    expect(resolveInitialColorScheme("dark", false)).toBe("dark");
  });

  it("falls back to OS preference when no stored scheme exists", () => {
    expect(resolveInitialColorScheme(null, true)).toBe("dark");
    expect(resolveInitialColorScheme(null, false)).toBe(DEFAULT_COLOR_SCHEME);
    expect(resolveInitialColorScheme("invalid", false)).toBe("light");
  });

  it("toggles cleanly between light and dark", () => {
    expect(getNextColorScheme("light")).toBe("dark");
    expect(getNextColorScheme("dark")).toBe("light");
  });
});
