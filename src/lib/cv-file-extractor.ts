import { extractTextFromPdfBuffer } from "@/lib/pdf-text-extractor";

const MAX_IMPORT_TEXT_CHARS = 35_000;

function decodeXmlEntities(xml: string): string {
  return xml
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    );
}

/**
 * Decompresses raw DEFLATE bytes using standard Web Streams (`DecompressionStream`),
 * compatible with modern browsers as well as Node 20+ runtimes.
 */
async function inflateRawBytes(compressed: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("deflate-raw");
  const writer = ds.writable.getWriter();
  const copy = new Uint8Array(compressed.byteLength);
  copy.set(compressed);
  void writer.write(copy).then(() => writer.close());

  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      totalLength += value.length;
    }
  }

  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

/**
 * Extracts `word/document.xml` (plus optional `word/header*.xml`) from a `.docx` ZIP archive
 * via Central Directory scanning so Data Descriptors (flag bit 3) work reliably too.
 */
export async function extractTextFromDocxBuffer(
  data: ArrayBuffer | Uint8Array
): Promise<string> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // Locate End of Central Directory (PK\x05\x06) near end of buffer
  const minEocdOffset = Math.max(0, bytes.length - 65_557);
  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= minEocdOffset; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error("File DOCX tidak valid (arsip ZIP tidak ditemukan).");
  }

  const centralDirOffset = view.getUint32(eocdOffset + 16, true);
  const entryCount = view.getUint16(eocdOffset + 10, true);
  const decoder = new TextDecoder("utf-8");

  const xmlTexts: string[] = [];
  let cursor = centralDirOffset;

  for (let idx = 0; idx < entryCount && cursor + 46 <= bytes.length; idx++) {
    if (view.getUint32(cursor, true) !== 0x02014b50) break;

    const method = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const fileNameLen = view.getUint16(cursor + 28, true);
    const extraLen = view.getUint16(cursor + 30, true);
    const commentLen = view.getUint16(cursor + 32, true);
    const localHeaderOffset = view.getUint32(cursor + 42, true);

    const entryName = decoder.decode(
      bytes.subarray(cursor + 46, cursor + 46 + fileNameLen)
    );
    cursor += 46 + fileNameLen + extraLen + commentLen;

    const isRelevantXml =
      entryName === "word/document.xml" ||
      /^word\/header\d*\.xml$/.test(entryName);
    if (!isRelevantXml) continue;

    if (
      localHeaderOffset + 30 > bytes.length ||
      view.getUint32(localHeaderOffset, true) !== 0x04034b50
    ) {
      continue;
    }

    const localNameLen = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
    const payloadStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const payloadEnd = payloadStart + compressedSize;

    if (payloadEnd > bytes.length) continue;
    const rawPayload = bytes.subarray(payloadStart, payloadEnd);

    let inflated: Uint8Array;
    if (method === 0) {
      inflated = rawPayload;
    } else if (method === 8) {
      inflated = await inflateRawBytes(rawPayload);
    } else {
      continue;
    }

    xmlTexts.push(decoder.decode(inflated));
  }

  if (xmlTexts.length === 0) {
    throw new Error("Konten word/document.xml tidak ditemukan di dalam DOCX.");
  }

  const plainText = xmlTexts
    .map((xml) =>
      decodeXmlEntities(
        xml
          .replace(/<w:tab[^>]*\/>/g, "\t")
          .replace(/<w:br[^>]*\/>/g, "\n")
          .replace(/<\/w:p>/g, "\n")
          .replace(/<\/w:tr>/g, "\n")
          .replace(/<\/w:tc>/g, "  ")
          .replace(/<[^>]+>/g, "")
      )
    )
    .join("\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!plainText) {
    throw new Error("Tidak ada teks yang terbaca dari file DOCX.");
  }

  return plainText.slice(0, MAX_IMPORT_TEXT_CHARS);
}

/**
 * Extracts raw plain text in browser from an uploaded `.pdf`, `.docx`, or `.txt` file.
 */
export async function extractResumeFileText(file: File): Promise<string> {
  const lowerName = file.name.toLowerCase();

  if (file.type === "application/pdf" || lowerName.endsWith(".pdf")) {
    const buffer = await file.arrayBuffer();
    const extracted = await extractTextFromPdfBuffer(buffer);
    const cleaned = extracted.fullText.trim();
    if (!cleaned) {
      throw new Error(
        "File PDF ini tidak memiliki teks yang bisa diekstrak (kemungkinan berupa hasil scan gambar)."
      );
    }
    return cleaned.slice(0, MAX_IMPORT_TEXT_CHARS);
  }

  if (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerName.endsWith(".docx")
  ) {
    const buffer = await file.arrayBuffer();
    return extractTextFromDocxBuffer(buffer);
  }

  if (
    file.type.startsWith("text/") ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md")
  ) {
    const text = (await file.text()).trim();
    if (!text) {
      throw new Error("File teks kosong.");
    }
    return text.slice(0, MAX_IMPORT_TEXT_CHARS);
  }

  throw new Error(
    "Format file belum didukung. Gunakan file PDF (.pdf), Word (.docx), atau teks (.txt)."
  );
}
