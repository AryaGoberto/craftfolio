"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  FileUp,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { extractResumeFileText } from "@/lib/cv-file-extractor";
import { postAuthenticatedAiJson } from "@/lib/ai/client-fetch";
import type { ResumeDocument } from "@/lib/schemas/resume";
import { useResumeStore } from "@/store/use-resume-store";

interface CvImportModalProps {
  open: boolean;
  onClose: () => void;
}

export function CvImportModal({ open, onClose }: CvImportModalProps) {
  const addParsedDocument = useResumeStore((s) => s.addParsedDocument);
  const documents = useResumeStore((s) => s.documents);
  const activeDocumentId = useResumeStore((s) => s.activeDocumentId);
  const authUser = useResumeStore((s) => s.authUser);
  const aiQuota = useResumeStore((s) => s.aiQuota);
  const openAuthModal = useResumeStore((s) => s.openAuthModal);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<"file" | "paste">("file");
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [rawText, setRawText] = useState<string>("");
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isParsingAi, setIsParsingAi] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [parsedDoc, setParsedDoc] = useState<ResumeDocument | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  if (!open) return null;

  const preferredLanguage = documents[activeDocumentId]?.language ?? "en";

  const resetAll = () => {
    setSelectedFileName("");
    setRawText("");
    setParsedDoc(null);
    setWarnings([]);
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setParsedDoc(null);
    setIsReadingFile(true);
    setSelectedFileName(file.name);

    try {
      const text = await extractResumeFileText(file);
      setRawText(text);
    } catch (err) {
      setRawText("");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Gagal membaca isi file. Pastikan file PDF/DOCX berisi teks."
      );
    } finally {
      setIsReadingFile(false);
      e.target.value = "";
    }
  };

  const handleParseWithGemini = async () => {
    if (!authUser) {
      openAuthModal(
        "Masuk atau buat akun gratis untuk menggunakan fitur ekstraksi CV otomatis dengan asisten AI Gemini."
      );
      return;
    }

    const trimmed = rawText.trim();
    if (trimmed.length < 30) {
      setErrorMessage("Teks CV terlalu pendek untuk diekstrak (minimal 30 karakter).");
      return;
    }

    setErrorMessage(null);
    setIsParsingAi(true);

    try {
      const { ok, status, data } = await postAuthenticatedAiJson<{
        document?: ResumeDocument;
        warnings?: string[];
      }>("/api/ai/parse-cv", {
        rawText: trimmed,
        preferredLanguage,
      });

      if (status === 401) {
        openAuthModal(
          data.error ||
            "Masuk ke akun Craftfolio terlebih dahulu untuk menggunakan fitur Import CV."
        );
        return;
      }

      if (!ok || !data.document) {
        setErrorMessage(
          data.error ||
            "Gagal memetakan teks CV ke format Craftfolio. Silakan coba lagi."
        );
        return;
      }

      setParsedDoc(data.document);
      setWarnings(data.warnings ?? []);
    } catch {
      setErrorMessage("Gagal menghubungi server AI. Periksa koneksi lalu coba lagi.");
    } finally {
      setIsParsingAi(false);
    }
  };

  const handleConfirmCreate = () => {
    if (!parsedDoc) return;
    addParsedDocument(parsedDoc);
    handleClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cv-import-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white border border-[#E4E4E7] rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#E4E4E7] flex items-center justify-between gap-3 shrink-0">
          <div>
            <h2
              id="cv-import-title"
              className="text-[14px] font-semibold text-[#09090B]"
            >
              Import CV Lama (PDF / DOCX → Form)
            </h2>
            <p className="text-[11px] text-[#52525B]">
              Ekstrak isi CV lama Anda ke dokumen baru dengan peninjauan ulang sebelum disimpan.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup modal Import CV"
            className="p-1 text-[#52525B] hover:text-[#09090B] rounded hover:bg-[#F4F4F5]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!parsedDoc ? (
            <>
              {/* Mode Switch */}
              <div className="inline-flex bg-[#F4F4F5] p-0.5 rounded-md border border-[#E4E4E7] text-[12px]">
                <button
                  type="button"
                  onClick={() => setInputMode("file")}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    inputMode === "file"
                      ? "bg-white text-[#09090B] shadow-xs"
                      : "text-[#52525B] hover:text-[#09090B]"
                  }`}
                >
                  Unggah PDF / DOCX
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("paste")}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    inputMode === "paste"
                      ? "bg-white text-[#09090B] shadow-xs"
                      : "text-[#52525B] hover:text-[#09090B]"
                  }`}
                >
                  Tempel Teks CV
                </button>
              </div>

              {inputMode === "file" && (
                <div className="border border-dashed border-[#D4D4D8] bg-[#FAFAFA] rounded-lg p-5 text-center space-y-2.5">
                  <div className="w-9 h-9 rounded-full bg-white border border-[#E4E4E7] mx-auto flex items-center justify-center text-[#18181B]">
                    {isReadingFile ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileUp className="w-4 h-4" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[12.5px] font-medium text-[#09090B]">
                      {selectedFileName
                        ? selectedFileName
                        : "Pilih file CV (.pdf, .docx, atau .txt)"}
                    </p>
                    <p className="text-[11px] text-[#52525B]">
                      Teks diekstrak di browser Anda sebelum dipetakan oleh Gemini AI ke struktur form.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isReadingFile || isParsingAi}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-white border border-[#E4E4E7] hover:bg-[#F4F4F5] text-[12px] font-medium text-[#09090B]"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {selectedFileName ? "Ganti File" : "Pilih File CV"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}

              {(inputMode === "paste" || rawText.length > 0) && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-[#52525B]">
                    <label htmlFor="cv-import-raw-text" className="font-medium">
                      Pratinjau Teks CV yang Akan Dipetakan
                    </label>
                    <span className="font-mono">{rawText.length} karakter</span>
                  </div>
                  <textarea
                    id="cv-import-raw-text"
                    rows={7}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Tempel seluruh teks dari CV lama Anda di sini..."
                    className="w-full p-2.5 text-[12px] text-[#09090B] bg-[#FAFAFA] border border-[#E4E4E7] rounded-md focus:outline-none focus:ring-1 focus:ring-[#18181B] placeholder:text-[#A1A1AA]"
                  />
                </div>
              )}

              {errorMessage && (
                <div className="px-3 py-2.5 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-[11.5px] text-[#B91C1C]">
                  {errorMessage}
                </div>
              )}

              {!authUser && (
                <div className="flex items-center justify-between gap-3 p-3 bg-[#F4F4F5] border border-[#E4E4E7] rounded-lg text-[12px]">
                  <div className="flex items-center gap-2 text-[#09090B]">
                    <Sparkles className="w-4 h-4 text-[#18181B] shrink-0" />
                    <span>Fitur ekstraksi AI memerlukan akun Craftfolio (gratis).</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      openAuthModal(
                        "Masuk atau buat akun gratis untuk menggunakan fitur Import CV dengan AI Gemini."
                      )
                    }
                    className="px-2.5 py-1 bg-[#18181B] hover:bg-[#27272A] text-white text-[11px] font-medium rounded transition-colors shrink-0"
                  >
                    Masuk Akun
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[12px] text-[#065F46]">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  Struktur CV berhasil diekstrak oleh Gemini AI. Silakan tinjau sebelum dibuat:
                </span>
                <span className="text-[10.5px] font-mono">AI Extracted</span>
              </div>

              {warnings.length > 0 && (
                <div className="p-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] space-y-1.5 text-[11.5px] text-[#92400E]">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Field yang perlu ditinjau / dilengkapi:
                  </p>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Structured Summary Preview */}
              <div className="rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] p-3.5 space-y-3 text-[12px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[10.5px] uppercase tracking-wider text-[#71717A] font-medium">
                      Nama Lengkap
                    </span>
                    <p className="font-semibold text-[#09090B]">
                      {parsedDoc.basics.fullName || "— (Kosong)"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10.5px] uppercase tracking-wider text-[#71717A] font-medium">
                      Kontak &amp; Bahasa
                    </span>
                    <p className="text-[#09090B] truncate">
                      {parsedDoc.basics.email || "Tanpa email"} ·{" "}
                      {parsedDoc.language === "id" ? "Indonesia" : "English"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#E4E4E7]">
                  <div className="bg-white border border-[#E4E4E7] rounded p-2">
                    <span className="text-[10.5px] text-[#52525B]">Pengalaman</span>
                    <p className="text-[14px] font-semibold text-[#09090B] tabular-nums">
                      {parsedDoc.sections.experience.items.length}
                    </p>
                  </div>
                  <div className="bg-white border border-[#E4E4E7] rounded p-2">
                    <span className="text-[10.5px] text-[#52525B]">Pendidikan</span>
                    <p className="text-[14px] font-semibold text-[#09090B] tabular-nums">
                      {parsedDoc.sections.education.items.length}
                    </p>
                  </div>
                  <div className="bg-white border border-[#E4E4E7] rounded p-2">
                    <span className="text-[10.5px] text-[#52525B]">Proyek</span>
                    <p className="text-[14px] font-semibold text-[#09090B] tabular-nums">
                      {parsedDoc.sections.projects.items.length}
                    </p>
                  </div>
                  <div className="bg-white border border-[#E4E4E7] rounded p-2">
                    <span className="text-[10.5px] text-[#52525B]">Keahlian</span>
                    <p className="text-[14px] font-semibold text-[#09090B] tabular-nums">
                      {parsedDoc.sections.skills.items.length}
                    </p>
                  </div>
                </div>

                {parsedDoc.sections.experience.items.length > 0 && (
                  <div className="pt-2 border-t border-[#E4E4E7] space-y-1">
                    <span className="text-[10.5px] uppercase tracking-wider text-[#71717A] font-medium">
                      Cuplikan Pengalaman Terdeteksi
                    </span>
                    <ul className="space-y-1 text-[11.5px] text-[#18181B]">
                      {parsedDoc.sections.experience.items.slice(0, 3).map((exp) => (
                        <li key={exp.id} className="truncate">
                          <span className="font-medium">
                            {exp.position || "Posisi"}
                          </span>{" "}
                          — {exp.company || "Perusahaan"} (
                          {[exp.startDate, exp.endDate].filter(Boolean).join(" – ") ||
                            "Tanggal belum lengkap"}
                          )
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#E4E4E7] bg-[#FAFAFA] flex items-center justify-between gap-2 shrink-0">
          {!parsedDoc ? (
            <>
              <span className="text-[11px] text-[#71717A]">
                {authUser && aiQuota
                  ? `Sisa Import CV: ${aiQuota.import.remaining}/${aiQuota.import.limit} hari ini · Reset 00.00 WIB`
                  : "Dokumen yang sudah ada tidak akan tertimpa."}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-8 px-3 rounded-md border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5] text-[12px] font-medium text-[#52525B]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleParseWithGemini}
                  disabled={
                    isReadingFile ||
                    isParsingAi ||
                    rawText.trim().length < 30 ||
                    Boolean(authUser && aiQuota && aiQuota.import.remaining <= 0)
                  }
                  className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-[#18181B] hover:bg-[#27272A] disabled:opacity-50 text-white text-[12px] font-medium"
                >
                  {isParsingAi ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isParsingAi ? "Memetakan CV..." : "Ekstrak dengan AI"}
                  </span>
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setParsedDoc(null)}
                className="h-8 px-3 rounded-md border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5] text-[12px] font-medium text-[#52525B]"
              >
                ← Ubah Teks Sumber
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-md bg-[#18181B] hover:bg-[#27272A] text-white text-[12px] font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Konfirmasi &amp; Buat CV
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
