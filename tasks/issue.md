# ISSUE-004: ATS X-Ray Mode Berbasis Ekstraksi Blob PDF Asli (`pdfjs-dist`)

| Atribut | Detail |
| :--- | :--- |
| **Referensi Plan** | `tasks/todo.md` — Phase 2, **Task 4** |
| **Branch Git** | `feat/pdf-xray-parser` |
| **Target Eksekutor** | Junior Developer / AI Coding Model Ringan |
| **Estimasi Scope** | Small (4 file) |

---

## 1. Tujuan Singkat

Meningkatkan tab **ATS X-Ray Mode** (`src/components/preview/AtsXRayView.tsx`) agar mengekstrak teks langsung dari **biner/blob PDF asli** hasil render `@react-pdf/renderer` menggunakan `pdfjs-dist` (bukan sekadar menyusun teks dari state JSON). Jika proses ekstraksi sedang berjalan atau gagal di environment non-worker, UI menampilkan fallback ke `extractLinearResumeText(doc)`.

---

## 2. Daftar File yang Diubah / Dibuat

| Aksi | Path File | Ringkasan |
| :--- | :--- | :--- |
| **Ubah** | `package.json` | Install `pdfjs-dist` |
| **Buat** | `src/lib/pdf-text-extractor.ts` | Fungsi `extractTextFromPdfBuffer(data)` berbasis `pdfjs-dist` |
| **Ubah** | `src/components/preview/AtsXRayView.tsx` | Generate blob PDF di `useEffect`, ekstrak teks per halaman, tampilkan badge status & fallback |
| **Buat** | `src/lib/__tests__/pdf-text-extractor.test.ts` | Unit test ekstraksi teks dari buffer PDF asli |

> **Batasan (Out of Scope):**
> - **JANGAN** menghapus atau mengubah fungsi `extractLinearResumeText(doc)` di `AtsXRayView.tsx` karena fungsi tersebut tetap dipakai sebagai fallback dan diuji di `ats-linter.test.ts`.
> - **JANGAN** melakukan static import `@react-pdf/renderer` atau `PdfDocument` di level atas `AtsXRayView.tsx` (gunakan dynamic `import()` di dalam `useEffect` agar SSR Next.js dan Vitest tidak error).

---

## 3. Langkah Implementasi

### Langkah 1 — Install `pdfjs-dist`
```bash
npm install pdfjs-dist
```

### Langkah 2 — Buat `src/lib/pdf-text-extractor.ts`
Gunakan build legacy `pdfjs-dist/legacy/build/pdf.mjs` agar kompatibel di browser maupun Node (Vitest). Kelompokkan item teks berdasarkan koordinat Y (`transform[5]`) agar baris yang berada di tinggi yang sama digabung dengan spasi, dan baris berbeda dipisah dengan `\n`:

```typescript
export interface ExtractedPdfContent {
  pageCount: number;
  pages: string[];
  fullText: string;
}

export async function extractTextFromPdfBuffer(
  data: ArrayBuffer | Uint8Array
): Promise<ExtractedPdfContent> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Di browser, arahkan workerSrc ke CDN unpkg yang sesuai versi pdfjs
  if (typeof window !== "undefined" && "GlobalWorkerOptions" in pdfjs) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;
  }

  const uint8 = data instanceof Uint8Array ? data : new Uint8Array(data);
  const loadingTask = pdfjs.getDocument({
    data: uint8,
    useSystemFonts: true,
    isEvalSupported: false,
    disableFontFace: true,
  });

  const pdfDoc = await loadingTask.promise;
  const pages: string[] = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const content = await page.getTextContent();

    const rows: Array<{ y: number; items: Array<{ x: number; str: string }> }> = [];
    const Y_TOLERANCE = 3;

    for (const rawItem of content.items) {
      if (!("str" in rawItem) || !rawItem.str.trim()) continue;
      const x = Number(rawItem.transform?.[4] ?? 0);
      const y = Number(rawItem.transform?.[5] ?? 0);

      let row = rows.find((r) => Math.abs(r.y - y) <= Y_TOLERANCE);
      if (!row) {
        row = { y, items: [] };
        rows.push(row);
      }
      row.items.push({ x, str: rawItem.str });
    }

    // Urutkan baris dari atas ke bawah (Y besar ke kecil), dan kata dari kiri ke kanan (X kecil ke besar)
    rows.sort((a, b) => b.y - a.y);
    const pageLines = rows.map((row) =>
      row.items
        .sort((a, b) => a.x - b.x)
        .map((i) => i.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
    );

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
}
```

### Langkah 3 — Update `src/components/preview/AtsXRayView.tsx`
1. Pertahankan `export function extractLinearResumeText(doc: ResumeDocument): string` tanpa mengubah perilakunya.
2. Pada komponen `AtsXRayView({ doc })`:
   - Gunakan `useState` untuk menyimpan `pdfText: string | null`, `pdfPageCount: number | null`, `isExtracting: boolean`, dan `source: "pdf" | "fallback"`.
   - Di dalam `useEffect` (dengan debounce ~250ms terhadap perubahan `doc`):
     - Lakukan dynamic import `@react-pdf/renderer`, `@/components/pdf/PdfDocument`, dan `@/lib/pdf-text-extractor`.
     - Buat blob PDF: `const blob = await pdf(<ResumePdfDocument doc={doc} />).toBlob()`.
     - Ekstrak teks: `const extracted = await extractTextFromPdfBuffer(await blob.arrayBuffer())`.
     - Simpan `extracted.fullText`, `extracted.pageCount`, dan `source = "pdf"`.
     - Jika terjadi error (mis. worker gagal dimuat), fallback ke `extractLinearResumeText(doc)` dan `source = "fallback"`.
   - Tampilkan badge status di kanan atas:
     - Saat loading: `"Mengekstrak PDF..."`
     - Saat `source === "pdf"`: `"PDF Binary Parsed · X Halaman"` (`bg-[#ECFDF5] text-[#10B981]`)
     - Saat fallback: `"Linear Simulation"` (`bg-[#F4F4F5] text-[#52525B]`)

### Langkah 4 — Buat Unit Test `src/lib/__tests__/pdf-text-extractor.test.ts`
Buat PDF sederhana di memori menggunakan `Document`, `Page`, `Text`, dan `renderToBuffer` dari `@react-pdf/renderer`, lalu panggil `extractTextFromPdfBuffer(buffer)` dan pastikan:
- `pageCount` sesuai jumlah `<Page>` (uji 1 halaman dan 2 halaman).
- `fullText` memuat teks dari PDF dalam urutan baris dari atas ke bawah.

---

## 4. Kriteria Penerimaan (*Acceptance Criteria*)

- [x] `src/lib/pdf-text-extractor.ts` mengekstrak teks linear per halaman dari `ArrayBuffer`/`Uint8Array` PDF menggunakan `pdfjs-dist` dengan worker lokal *same-origin* (`public/pdf.worker.min.mjs`) dan cleanup `loadingTask.destroy()` di `try/finally`.
- [x] `AtsXRayView.tsx` menampilkan teks hasil ekstraksi file PDF asli beserta indikator jumlah halaman, dengan fallback ke `extractLinearResumeText(doc)`.
- [x] Unit test baru di `src/lib/__tests__/pdf-text-extractor.test.ts` lulus bersama seluruh test yang sudah ada (3 test files, 39 tests passed, termasuk X-sort baris horizontal & error path).

---

## 5. Verifikasi & GitHub Flow

- [x] `npm test` — 3 test files, 39 tests passed.
- [x] `npx tsc --noEmit && npm run lint` — 0 error, 0 warning.
- [x] `npm run build` — exit code 0.

```bash
npm test
npx tsc --noEmit && npm run lint
npm run build
```

Setelah ketiganya lulus (`exit code 0`), update checkbox Task 4 di `tasks/issue.md`, `tasks/todo.md`, `tasks/plan.md`, dan `agents-md/FEATURES.md`, lalu commit & push ke `feat/pdf-xray-parser`.
