/**
 * Memastikan URL eksternal memiliki protokol yang valid untuk anotasi hyperlink PDF.
 * Mengembalikan string kosong jika input kosong atau memakai protokol berbahaya (mis. javascript:).
 */
export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) {
    return "";
  }

  if (
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.startsWith("mailto:")
  ) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

/**
 * Mengubah alamat email menjadi href mailto: yang valid.
 */
export function toMailtoHref(email: string): string {
  const trimmed = email.trim();
  if (!trimmed) return "";
  return trimmed.toLowerCase().startsWith("mailto:")
    ? trimmed
    : `mailto:${trimmed}`;
}
