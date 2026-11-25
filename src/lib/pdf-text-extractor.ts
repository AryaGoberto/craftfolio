export interface ExtractedPdfContent {
  pageCount: number;
  pages: string[];
  fullText: string;
}

export async function extractTextFromPdfBuffer(
  data: ArrayBuffer | Uint8Array
): Promise<ExtractedPdfContent> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  if (typeof window !== "undefined" && "GlobalWorkerOptions" in pdfjs) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }

  const uint8 = data instanceof Uint8Array ? data : new Uint8Array(data);
  const loadingTask = pdfjs.getDocument({
    data: uint8,
    useSystemFonts: true,
    disableFontFace: true,
  });

  try {
    const pdfDoc = await loadingTask.promise;
    const pages: string[] = [];

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const content = await page.getTextContent();

      const rows: Array<{
        y: number;
        items: Array<{ x: number; width: number; str: string }>;
      }> = [];
      const Y_TOLERANCE = 3;

      for (const rawItem of content.items) {
        if (!("str" in rawItem) || !rawItem.str.trim()) continue;
        const x = Number(rawItem.transform?.[4] ?? 0);
        const y = Number(rawItem.transform?.[5] ?? 0);
        const width = Number(rawItem.width ?? 0);

        let row = rows.find((r) => Math.abs(r.y - y) <= Y_TOLERANCE);
        if (!row) {
          row = { y, items: [] };
          rows.push(row);
        }
        row.items.push({ x, width, str: rawItem.str });
      }

      rows.sort((a, b) => b.y - a.y);
      const pageLines = rows.map((row) => {
        const sorted = row.items.sort((a, b) => a.x - b.x);
        let line = "";
        for (let idx = 0; idx < sorted.length; idx++) {
          const curr = sorted[idx];
          if (idx === 0) {
            line = curr.str;
            continue;
          }
          const prev = sorted[idx - 1];
          const gap = curr.x - (prev.x + prev.width);
          const needsSpace = prev.width <= 0 || gap > 1.5;
          line += (needsSpace ? " " : "") + curr.str;
        }
        return line.replace(/\s+/g, " ").trim();
      });

      pages.push(pageLines.join("\n"));
    }

    return {
      pageCount: pdfDoc.numPages,
      pages,
      fullText: pages
        .map((p, idx) =>
          pdfDoc.numPages > 1 ? `--- HALAMAN ${idx + 1} ---\n${p}` : p
        )
        .join("\n\n")
        .trim(),
    };
  } finally {
    await loadingTask.destroy();
  }
}
