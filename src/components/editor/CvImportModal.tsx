"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileJson,
  FileText,
  FileUp,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { extractResumeFileText } from "@/lib/cv-file-extractor";
import { postAuthenticatedAiJson } from "@/lib/ai/client-fetch";
import { emitFoldyEvent } from "@/lib/foldy-events";
import { useFoldyPrefs } from "@/lib/foldy-prefs";
import type { ResumeDocument } from "@/lib/schemas/resume";
import { useResumeStore } from "@/store/use-resume-store";
import { FoldyMascot } from "@/components/mascot/FoldyMascot";

export type ImportTabMode = "file" | "paste" | "json";

const MAX_JSON_FILE_BYTES = 2 * 1024 * 1024;

const IMPORT_TABS: Array<{ id: ImportTabMode; label: string; tabId: string; panelId: string }> = [
  {
    id: "file",
    label: "Unggah CV",
    tabId: "import-tab-file",
    panelId: "import-panel-file",
  },
  {
    id: "paste",
    label: "Tempel Teks",
    tabId: "import-tab-paste",
    panelId: "import-panel-paste",
  },
  {
    id: "json",
    label: "Backup JSON (.json)",
    tabId: "import-tab-json",
    panelId: "import-panel-json",
  },
];

interface CvImportModalProps {
  open: boolean;
  onClose: () => void;
  /** Dipanggil setelah CV berhasil diimpor (baik via AI maupun JSON), mis. untuk redirect ke /editor. */
  onImported?: () => void;
  initialMode?: ImportTabMode;
}

function isPointerOutsideDialog(
  e: React.PointerEvent<HTMLDialogElement>,
  dialog: HTMLDialogElement
): boolean {
  const rect = dialog.getBoundingClientRect();
  return (
    e.clientX < rect.left ||
    e.clientX > rect.right ||
    e.clientY < rect.top ||
    e.clientY > rect.bottom
  );
}

export function CvImportModal({
  open,
  onClose,
  onImported,
  initialMode = "file",
}: CvImportModalProps) {
  const addParsedDocument = useResumeStore((s) => s.addParsedDocument);
  const importResumeJson = useResumeStore((s) => s.importResumeJson);
  const documents = useResumeStore((s) => s.documents);
  const activeDocumentId = useResumeStore((s) => s.activeDocumentId);
  const authUser = useResumeStore((s) => s.authUser);
  const aiQuota = useResumeStore((s) => s.aiQuota);
  const openAuthModal = useResumeStore((s) => s.openAuthModal);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressedOutsideRef = useRef(false);
  const isClosingRef = useRef(false);
  const tabRefs = useRef<Record<ImportTabMode, HTMLButtonElement | null>>({
    file: null,
    paste: null,
    json: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<ImportTabMode>(initialMode);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [rawText, setRawText] = useState<string>("");
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isReadingJson, setIsReadingJson] = useState(false);
  const [isParsingAi, setIsParsingAi] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [parsedDoc, setParsedDoc] = useState<ResumeDocument | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const foldyPrefs = useFoldyPrefs();

  const preferredLanguage = documents[activeDocumentId]?.language ?? "en";

  const resetAll = useCallback(() => {
    setSelectedFileName("");
    setRawText("");
    setParsedDoc(null);
    setWarnings([]);
    setErrorMessage(null);
    setIsReadingFile(false);
    setIsReadingJson(false);
  }, []);

  const finishClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    resetAll();
    onClose();
  }, [onClose, resetAll]);

  const handleClose = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog?.open) {
      dialog.returnValue = "";
      dialog.close();
    }
    finishClose();
  }, [finishClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      isClosingRef.current = false;
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleNativeClose = () => {
    const dialog = dialogRef.current;
    if (dialog) {
      dialog.returnValue = "";
    }
    finishClose();
  };

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    handleClose();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || "closedBy" in HTMLDialogElement.prototype) return;
    pressedOutsideRef.current =
      e.target === dialog && isPointerOutsideDialog(e, dialog);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || "closedBy" in HTMLDialogElement.prototype) return;
    const shouldDismiss =
      pressedOutsideRef.current &&
      e.target === dialog &&
      isPointerOutsideDialog(e, dialog);
    pressedOutsideRef.current = false;
    if (shouldDismiss) {
      handleClose();
    }
  };

  const selectTab = (mode: ImportTabMode, moveFocus = false) => {
    setInputMode(mode);
    setErrorMessage(null);
    if (moveFocus) {
      tabRefs.current[mode]?.focus();
    }
  };

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    let nextIdx: number | null = null;
    if (e.key === "ArrowRight") {
      nextIdx = (idx + 1) % IMPORT_TABS.length;
    } else if (e.key === "ArrowLeft") {
      nextIdx = (idx - 1 + IMPORT_TABS.length) % IMPORT_TABS.length;
    } else if (e.key === "Home") {
      nextIdx = 0;
    } else if (e.key === "End") {
      nextIdx = IMPORT_TABS.length - 1;
    }

    if (nextIdx !== null) {
      e.preventDefault();
      selectTab(IMPORT_TABS[nextIdx].id, true);
    }
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
          : "Gagal membaca isi file. Pastikan file PDF/DOCX/TXT berisi teks."
      );
    } finally {
      setIsReadingFile(false);
      e.target.value = "";
    }
  };

  const handleJsonFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    if (file.size > MAX_JSON_FILE_BYTES) {
      setErrorMessage("Ukuran file JSON melebihi batas maksimal (2 MB).");
      e.target.value = "";
      return;
    }

    setIsReadingJson(true);
    try {
      const text = await file.text();
      const res = importResumeJson(text);
      if (!res.ok) {
        setErrorMessage(
          res.error || "File bukan backup JSON Craftfolio yang valid."
        );
        return;
      }
      handleClose();
      emitFoldyEvent({ type: "cv-imported" });
      onImported?.();
    } catch {
      setErrorMessage("Gagal membaca file .json yang dipilih.");
    } finally {
      setIsReadingJson(false);
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
      setErrorMessage(
        "Teks CV terlalu pendek untuk diekstrak (minimal 30 karakter)."
      );
      return;
    }

    setErrorMessage(null);
    setIsParsingAi(true);
    emitFoldyEvent({ type: "ai-start", docId: activeDocumentId });

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
      setErrorMessage(
        "Gagal menghubungi server AI. Periksa koneksi lalu coba lagi."
      );
    } finally {
      setIsParsingAi(false);
      emitFoldyEvent({ type: "ai-end", docId: activeDocumentId });
    }
  };

  const handleConfirmCreate = () => {
    if (!parsedDoc) return;
    addParsedDocument(parsedDoc);
    emitFoldyEvent({ type: "cv-imported", docId: parsedDoc.id });
    handleClose();
    onImported?.();
  };

  const activeTabMeta =
    IMPORT_TABS.find((t) => t.id === inputMode) ?? IMPORT_TABS[0];

  const extraSectionBadges = parsedDoc
    ? [
        parsedDoc.sections.certifications.items.length > 0
          ? {
              key: "certifications",
              label: parsedDoc.sections.certifications.title,
              count: parsedDoc.sections.certifications.items.length,
              isCustom: false,
            }
          : null,
        parsedDoc.sections.awards.items.length > 0
          ? {
              key: "awards",
              label: parsedDoc.sections.awards.title,
              count: parsedDoc.sections.awards.items.length,
              isCustom: false,
            }
          : null,
        parsedDoc.sections.volunteering.items.length > 0
          ? {
              key: "volunteering",
              label: parsedDoc.sections.volunteering.title,
              count: parsedDoc.sections.volunteering.items.length,
              isCustom: false,
            }
          : null,
        parsedDoc.sections.languages.items.length > 0
          ? {
              key: "languages",
              label: parsedDoc.sections.languages.title,
              count: parsedDoc.sections.languages.items.length,
              isCustom: false,
            }
          : null,
        ...parsedDoc.sections.customSections.map((cs) => ({
          key: `custom:${cs.id}`,
          label: cs.title,
          count: cs.items.length,
          isCustom: true,
        })),
      ].filter((x): x is NonNullable<typeof x> => x !== null)
    : [];

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="cv-import-title"
      onCancel={handleCancel}
      onClose={handleNativeClose}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      {...({ closedby: "any" } as Record<string, string>)}
      className="craftfolio-dialog m-auto w-[calc(100%-2rem)] max-w-2xl max-h-[88vh] p-0 bg-ui-card border border-ui-border rounded-lg shadow-xl text-ui-text overflow-hidden"
    >
      <div className="flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-ui-border flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {foldyPrefs.visibility !== "hidden" && (
              <div className="w-9 h-9 rounded-lg bg-ui-panel border border-ui-divider flex items-center justify-center shrink-0">
                <FoldyMascot
                  mood={
                    isParsingAi ? "ai" : parsedDoc ? "happy" : "crafty"
                  }
                  size="xs"
                  engine="ambient"
                  interactiveClick
                  ariaLabel="Status impor CV oleh Foldy"
                />
              </div>
            )}
            <div className="min-w-0">
              <h1
                id="cv-import-title"
                className="text-[14px] font-semibold text-ui-text"
              >
                Import File CV
              </h1>
              <p className="text-[11px] text-ui-text-secondary">
                Unggah CV lama (PDF, Word, Teks) untuk diekstrak otomatis dengan AI, atau impor file backup .json Craftfolio.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup modal Import File CV"
            title="Tutup (Esc)"
            className="p-1 text-ui-text-secondary hover:text-ui-text rounded hover:bg-ui-subtle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!parsedDoc ? (
            <>
              {/* Accessible Single-Row Tablist */}
              <div
                role="tablist"
                aria-label="Metode impor CV"
                className="flex items-center overflow-x-auto bg-ui-subtle p-0.5 rounded-md border border-ui-border text-[12px]"
              >
                {IMPORT_TABS.map((tab, idx) => {
                  const selected = inputMode === tab.id;
                  return (
                    <button
                      key={tab.id}
                      ref={(el) => {
                        tabRefs.current[tab.id] = el;
                      }}
                      type="button"
                      role="tab"
                      id={tab.tabId}
                      aria-selected={selected}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => selectTab(tab.id)}
                      onKeyDown={(e) => handleTabKeyDown(e, idx)}
                      className={`relative flex-none px-3 py-1.5 rounded font-medium whitespace-nowrap transition-colors ${
                        selected
                          ? "bg-ui-card text-ui-text border-b-2 border-ui-primary"
                          : "text-ui-text-secondary hover:text-ui-text border-b-2 border-transparent"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div
                role="tabpanel"
                id={activeTabMeta.panelId}
                aria-labelledby={activeTabMeta.tabId}
                className="space-y-4"
              >
                {inputMode === "file" && (
                  <div className="border border-dashed border-ui-border-strong bg-ui-panel rounded-lg p-5 text-center space-y-2.5">
                    <div className="w-9 h-9 rounded-full bg-ui-card border border-ui-border mx-auto flex items-center justify-center text-ui-link">
                      {isReadingFile ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileUp className="w-4 h-4" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[12.5px] font-medium text-ui-text">
                        {selectedFileName
                          ? selectedFileName
                          : "Pilih file CV (.pdf, .docx, atau .txt)"}
                      </p>
                      <p className="text-[11px] text-ui-text-secondary">
                        Teks diekstrak di browser Anda sebelum dipetakan oleh Gemini AI ke struktur form (termasuk sub-header kustom).
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isReadingFile || isParsingAi}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-ui-card border border-ui-border hover:bg-ui-subtle text-[12px] font-medium text-ui-text"
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

                {inputMode === "json" && (
                  <div className="border border-dashed border-ui-border-strong bg-ui-panel rounded-lg p-6 text-center space-y-3">
                    <div className="w-9 h-9 rounded-full bg-ui-card border border-ui-border mx-auto flex items-center justify-center text-ui-link">
                      {isReadingJson ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileJson className="w-4 h-4" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[13px] font-medium text-ui-text">
                        Unggah File Backup JSON Craftfolio (.json)
                      </p>
                      <p className="text-[11.5px] text-ui-text-secondary">
                        Impor instan tanpa AI dan tidak mengurangi kuota harian.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isReadingJson}
                      onClick={() => jsonInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-ui-primary hover:bg-ui-primary-hover disabled:opacity-50 text-white text-[12px] font-medium transition-colors"
                    >
                      <FileJson className="w-3.5 h-3.5" />
                      {isReadingJson ? "Membaca JSON..." : "Pilih File .json"}
                    </button>
                    <input
                      ref={jsonInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleJsonFileChange}
                      className="hidden"
                    />
                  </div>
                )}

                {inputMode !== "json" &&
                  (inputMode === "paste" || rawText.length > 0) && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-ui-text-secondary">
                        <label
                          htmlFor="cv-import-raw-text"
                          className="font-medium"
                        >
                          Pratinjau Teks CV yang Akan Dipetakan
                        </label>
                        <span className="font-mono">
                          {rawText.length} karakter
                        </span>
                      </div>
                      <textarea
                        id="cv-import-raw-text"
                        rows={7}
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder="Tempel seluruh teks dari CV lama Anda di sini..."
                        className="w-full p-2.5 text-[12px] text-ui-text bg-ui-panel border border-ui-border rounded-md focus:outline-none focus:ring-1 focus:ring-ui-focus placeholder:text-ui-text-placeholder"
                      />
                    </div>
                  )}

                {errorMessage && (
                  <div
                    role="alert"
                    className="px-3 py-2.5 rounded-md bg-ui-error-bg border border-ui-error-border text-[11.5px] text-ui-error-text"
                  >
                    {errorMessage}
                  </div>
                )}

                {inputMode !== "json" && (
                  <>
                    <p className="text-[11px] leading-relaxed text-ui-text-muted">
                      Catatan privasi: teks CV yang Anda unggah atau tempel akan diproses sementara melalui Google Gemini API semata-mata untuk memetakan struktur CV Anda.
                    </p>

                    {!authUser && (
                      <div className="flex items-center justify-between gap-3 p-3 bg-ui-subtle border border-ui-border rounded-lg text-[12px]">
                        <div className="flex items-center gap-2 text-ui-text">
                          <Sparkles className="w-4 h-4 text-ui-link shrink-0" />
                          <span>
                            Fitur ekstraksi AI memerlukan akun Craftfolio (gratis).
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            openAuthModal(
                              "Masuk atau buat akun gratis untuk menggunakan fitur Import CV dengan AI Gemini."
                            )
                          }
                          className="px-2.5 py-1 bg-ui-primary hover:bg-ui-primary-hover text-white text-[11px] font-medium rounded transition-colors shrink-0"
                        >
                          Masuk Akun
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-ui-success-bg border border-ui-success-border text-[12px] text-ui-success-text">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-ui-success" />
                  Struktur CV berhasil diekstrak oleh Gemini AI. Silakan tinjau sebelum dibuat:
                </span>
                <span className="text-[10.5px] font-mono">AI Extracted</span>
              </div>

              {warnings.length > 0 && (
                <div className="p-3 rounded-lg bg-ui-warning-bg border border-ui-warning-border space-y-1.5 text-[11.5px] text-ui-warning-text">
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
              <div className="rounded-lg border border-ui-border bg-ui-panel p-3.5 space-y-3 text-[12px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[10.5px] uppercase tracking-wider text-ui-text-muted font-medium">
                      Nama Lengkap
                    </span>
                    <p className="font-semibold text-ui-text">
                      {parsedDoc.basics.fullName || "— (Kosong)"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10.5px] uppercase tracking-wider text-ui-text-muted font-medium">
                      Kontak &amp; Bahasa
                    </span>
                    <p className="text-ui-text truncate">
                      {parsedDoc.basics.email || "Tanpa email"} ·{" "}
                      {parsedDoc.language === "id" ? "Indonesia" : "English"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-ui-border">
                  <div className="bg-ui-card border border-ui-border rounded p-2">
                    <span className="text-[10.5px] text-ui-text-secondary">
                      Pengalaman
                    </span>
                    <p className="text-[14px] font-semibold text-ui-text tabular-nums">
                      {parsedDoc.sections.experience.items.length}
                    </p>
                  </div>
                  <div className="bg-ui-card border border-ui-border rounded p-2">
                    <span className="text-[10.5px] text-ui-text-secondary">
                      Pendidikan
                    </span>
                    <p className="text-[14px] font-semibold text-ui-text tabular-nums">
                      {parsedDoc.sections.education.items.length}
                    </p>
                  </div>
                  <div className="bg-ui-card border border-ui-border rounded p-2">
                    <span className="text-[10.5px] text-ui-text-secondary">
                      Proyek
                    </span>
                    <p className="text-[14px] font-semibold text-ui-text tabular-nums">
                      {parsedDoc.sections.projects.items.length}
                    </p>
                  </div>
                  <div className="bg-ui-card border border-ui-border rounded p-2">
                    <span className="text-[10.5px] text-ui-text-secondary">
                      Keahlian
                    </span>
                    <p className="text-[14px] font-semibold text-ui-text tabular-nums">
                      {parsedDoc.sections.skills.items.length}
                    </p>
                  </div>
                </div>

                {extraSectionBadges.length > 0 && (
                  <div className="pt-2 border-t border-ui-border space-y-1.5">
                    <span className="text-[10.5px] uppercase tracking-wider text-ui-text-muted font-medium">
                      Bagian Tambahan &amp; Kustom Terdeteksi
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {extraSectionBadges.map((badge) => (
                        <span
                          key={badge.key}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-ui-card border border-ui-border text-[11px] font-medium text-ui-text"
                        >
                          <span>{badge.label}</span>
                          <span className="text-ui-text-muted font-mono tabular-nums">
                            ({badge.count})
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {parsedDoc.sections.experience.items.length > 0 && (
                  <div className="pt-2 border-t border-ui-border space-y-1">
                    <span className="text-[10.5px] uppercase tracking-wider text-ui-text-muted font-medium">
                      Cuplikan Pengalaman Terdeteksi
                    </span>
                    <ul className="space-y-1 text-[11.5px] text-ui-text">
                      {parsedDoc.sections.experience.items
                        .slice(0, 3)
                        .map((exp) => (
                          <li key={exp.id} className="truncate">
                            <span className="font-medium">
                              {exp.position || "Posisi"}
                            </span>{" "}
                            — {exp.company || "Perusahaan"} (
                            {[exp.startDate, exp.endDate]
                              .filter(Boolean)
                              .join(" – ") || "Tanggal belum lengkap"}
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
        <div className="px-4 py-3 border-t border-ui-border bg-ui-panel flex items-center justify-between gap-2 shrink-0">
          {!parsedDoc ? (
            <>
              <span className="text-[11px] text-ui-text-muted">
                {inputMode === "json"
                  ? "Dokumen yang sudah ada tidak akan tertimpa."
                  : authUser && aiQuota
                    ? `Sisa Import CV: ${aiQuota.import.remaining}/${aiQuota.import.limit} hari ini · Reset 00.00 WIB`
                    : "Dokumen yang sudah ada tidak akan tertimpa."}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-8 px-3 rounded-md border border-ui-border bg-ui-card hover:bg-ui-subtle text-[12px] font-medium text-ui-text-secondary"
                >
                  Batal
                </button>
                {inputMode !== "json" && (
                  <button
                    type="button"
                    onClick={handleParseWithGemini}
                    disabled={
                      isReadingFile ||
                      isParsingAi ||
                      rawText.trim().length < 30 ||
                      Boolean(
                        authUser && aiQuota && aiQuota.import.remaining <= 0
                      )
                    }
                    className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-ui-primary hover:bg-ui-primary-hover disabled:opacity-50 text-white text-[12px] font-medium"
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
                )}
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setParsedDoc(null)}
                className="h-8 px-3 rounded-md border border-ui-border bg-ui-card hover:bg-ui-subtle text-[12px] font-medium text-ui-text-secondary"
              >
                ← Ubah Teks Sumber
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-md bg-ui-primary hover:bg-ui-primary-hover text-white text-[12px] font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Konfirmasi &amp; Buat CV
              </button>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}

export { CvImportModal as ImportFileModal };
