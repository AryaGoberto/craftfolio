const ALLOWED_URL_PROTOCOLS = new Set(["https:", "http:", "mailto:"]);
const HAS_SCHEME_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;
const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/g;

/**
 * Memastikan URL eksternal memiliki protokol yang valid (strict allowlist: https, http, mailto)
 * untuk anotasi hyperlink HTML dan PDF.
 * Mengembalikan string kosong jika input kosong, tidak valid, atau memakai protokol berbahaya.
 */
export function normalizeUrl(raw: string): string {
  const cleaned = raw.replace(CONTROL_CHARS_REGEX, "").trim();
  if (!cleaned) return "";

  const candidate = HAS_SCHEME_REGEX.test(cleaned)
    ? cleaned
    : `https://${cleaned}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return "";
  }

  if (!ALLOWED_URL_PROTOCOLS.has(parsed.protocol)) {
    return "";
  }

  if (parsed.protocol === "mailto:") {
    const emailPart = cleaned.slice("mailto:".length).trim();
    return toMailtoHref(emailPart);
  }

  if (!parsed.hostname) {
    return "";
  }

  return candidate;
}

/**
 * Mengubah alamat email menjadi href mailto: yang valid dan aman dari injeksi parameter/header.
 */
export function toMailtoHref(email: string): string {
  const stripped = email.replace(CONTROL_CHARS_REGEX, "").trim();
  if (!stripped) return "";

  const withoutScheme = stripped.toLowerCase().startsWith("mailto:")
    ? stripped.slice("mailto:".length).trim()
    : stripped;

  // Tolak spasi, tanda tanya (injeksi ?bcc= / ?body=), atau format bukan email dasar
  if (
    !withoutScheme ||
    /[\s?#]/.test(withoutScheme) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(withoutScheme)
  ) {
    return "";
  }

  return `mailto:${withoutScheme}`;
}
