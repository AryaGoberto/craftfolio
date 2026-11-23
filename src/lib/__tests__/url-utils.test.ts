import { describe, expect, it } from "vitest";
import { normalizeUrl, toMailtoHref } from "@/lib/url-utils";

describe("normalizeUrl", () => {
  it("prepends https:// when protocol is missing", () => {
    expect(normalizeUrl("github.com/AryaGoberto")).toBe(
      "https://github.com/AryaGoberto"
    );
    expect(normalizeUrl("  linkedin.com/in/rakapratama  ")).toBe(
      "https://linkedin.com/in/rakapratama"
    );
  });

  it("preserves existing http://, https://, and mailto: protocols", () => {
    expect(normalizeUrl("https://example.com/path")).toBe(
      "https://example.com/path"
    );
    expect(normalizeUrl("http://example.com")).toBe("http://example.com");
    expect(normalizeUrl("mailto:raka@email.com")).toBe("mailto:raka@email.com");
  });

  it("returns empty string for blank inputs and blocks dangerous protocols", () => {
    expect(normalizeUrl("   ")).toBe("");
    expect(normalizeUrl("javascript:alert(1)")).toBe("");
    expect(normalizeUrl("JAVASCRIPT:void(0)")).toBe("");
    expect(normalizeUrl("DATA:text/html,<h1>x</h1>")).toBe("");
  });
});

describe("toMailtoHref", () => {
  it("prepends mailto: for plain email addresses", () => {
    expect(toMailtoHref("raka@email.com")).toBe("mailto:raka@email.com");
    expect(toMailtoHref("  raka@email.com  ")).toBe("mailto:raka@email.com");
  });

  it("does not duplicate mailto: prefix", () => {
    expect(toMailtoHref("mailto:raka@email.com")).toBe("mailto:raka@email.com");
  });

  it("returns empty string for blank input", () => {
    expect(toMailtoHref("   ")).toBe("");
  });
});
