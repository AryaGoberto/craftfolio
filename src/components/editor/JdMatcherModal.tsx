"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  HelpCircle,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { BuiltinSectionKey, ResumeDocument } from "@/lib/schemas/resume";
import {
  matchJobDescription,
  type HiddenMatchSource,
} from "@/lib/jd-matcher";
import type { FoldyMood } from "@/lib/foldy-coach";
import { emitFoldyEvent } from "@/lib/foldy-events";
import { useFoldyPrefs } from "@/lib/foldy-prefs";
import { useResumeStore } from "@/store/use-resume-store";
import { FoldyMascot } from "@/components/mascot/FoldyMascot";

interface JdMatcherModalProps {
  open: boolean;
  onClose: () => void;
  doc: ResumeDocument;
}

const SAMPLE_JD = `We are looking for a Frontend Engineer proficient in React, Next.js, TypeScript, and Tailwind CSS.
Experience with Docker, Playwright testing, PostgreSQL, REST API, Core Web Vitals optimization, and CI/CD pipelines is highly valued. Familiarity with Kubernetes or AWS is a plus.`;

export function JdMatcherModal({ open, onClose, doc }: JdMatcherModalProps) {
  const [jdText, setJdText] = useState("");
  const [duplicatedNotice, setDuplicatedNotice] = useState(false);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highMatchNotifiedRef = useRef<string>("");
  const foldyPrefs = useFoldyPrefs();

  const duplicateDocument = useResumeStore((s) => s.duplicateDocument);
  const reorderSections = useResumeStore((s) => s.reorderSections);
  const toggleSectionVisibility = useResumeStore(
    (s) => s.toggleSectionVisibility
  );
  const toggleItemVisibility = useResumeStore((s) => s.toggleItemVisibility);
  const toggleBulletVisibility = useResumeStore(
    (s) => s.toggleBulletVisibility
  );

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  const result = useMemo(
    () => matchJobDescription(doc, jdText),
    [doc, jdText]
  );

  const matchRatio =
    result.keywords.length > 0
      ? result.matchedActive.length / result.keywords.length
      : 0;

  useEffect(() => {
    if (!open || result.keywords.length < 4 || matchRatio < 0.75) return;
    const signature = `${doc.id}:${result.keywords.length}:${result.matchedActive.length}`;
    if (highMatchNotifiedRef.current === signature) return;
    highMatchNotifiedRef.current = signature;
    emitFoldyEvent({
      type: "jd-high-match",
      docId: doc.id,
      detail: `${result.matchedActive.length}/${result.keywords.length} kata kunci JD sudah aktif di CV-mu!`,
    });
  }, [open, doc.id, matchRatio, result.keywords.length, result.matchedActive.length]);

  const jdFoldyMood: FoldyMood =
    result.keywords.length === 0
      ? "idle"
      : matchRatio >= 0.75
        ? "happy"
        : result.matchedHiddenInMaster.length > 0
          ? "eureka"
          : "crafty";

  if (!open) return null;

  const isSectionCurrentlyVisible = (
    sectionKey: HiddenMatchSource["sectionKey"]
  ): boolean => {
    if (sectionKey === "summary") return doc.basics.summary.isVisible;
    if (sectionKey.startsWith("custom:")) {
      const id = sectionKey.replace("custom:", "");
      return (
        doc.sections.customSections.find((c) => c.id === id)?.isVisible ?? false
      );
    }
    return doc.sections[sectionKey as BuiltinSectionKey].isVisible;
  };

  const handleRevealSource = (source: HiddenMatchSource) => {
    if (source.targetType === "section") {
      if (!doc.config.sectionOrder.includes(source.sectionKey)) {
        reorderSections([...doc.config.sectionOrder, source.sectionKey]);
      }
      if (!isSectionCurrentlyVisible(source.sectionKey)) {
        toggleSectionVisibility(source.sectionKey);
      }
      return;
    }
    if (source.sectionKey === "summary") return;

    const itemSectionKey = source.sectionKey as
      | BuiltinSectionKey
      | `custom:${string}`;
    if (source.targetType === "item" && source.itemId) {
      toggleItemVisibility(itemSectionKey, source.itemId);
    } else if (
      source.targetType === "bullet" &&
      source.itemId &&
      source.bulletId
    ) {
      toggleBulletVisibility(itemSectionKey, source.itemId, source.bulletId);
    }
  };

  const handleDuplicate = () => {
    duplicateDocument(doc.id);
    setDuplicatedNotice(true);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setDuplicatedNotice(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-ui-card border border-ui-border rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-ui-border flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {foldyPrefs.visibility !== "hidden" && (
              <div className="w-9 h-9 rounded-lg bg-ui-panel border border-ui-divider flex items-center justify-center shrink-0">
                <FoldyMascot
                  mood={jdFoldyMood}
                  size="xs"
                  engine="ambient"
                  interactiveClick
                  ariaLabel="Reaksi Foldy pada JD Matcher"
                />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-[14px] font-semibold text-ui-text">
                JD Keyword Matcher & Master Profile
              </h2>
              <p className="text-[11px] text-ui-text-secondary">
                Bandingkan kata kunci lowongan dengan CV aktif dan item tersembunyi di Master Profile Anda.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal JD Matcher"
            className="p-1 text-ui-text-secondary hover:text-ui-text rounded hover:bg-ui-subtle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Input & Tailoring Controls */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="jd-matcher-input"
                className="text-[11px] font-medium text-ui-text-secondary"
              >
                Tempel Teks Job Description (ID / EN)
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setJdText(SAMPLE_JD)}
                  className="inline-flex items-center gap-1 h-7 px-2 rounded border border-ui-border bg-ui-panel hover:bg-ui-subtle text-[11px] font-medium text-ui-text-secondary hover:text-ui-text"
                >
                  <Sparkles className="w-3 h-3" />
                  Contoh JD
                </button>
                {jdText.trim() && (
                  <button
                    type="button"
                    onClick={() => setJdText("")}
                    className="inline-flex items-center gap-1 h-7 px-2 rounded border border-ui-border bg-ui-card hover:bg-ui-subtle text-[11px] font-medium text-ui-text-secondary"
                  >
                    <Trash2 className="w-3 h-3" />
                    Kosongkan
                  </button>
                )}
              </div>
            </div>

            <textarea
              id="jd-matcher-input"
              rows={5}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Tempel kualifikasi atau deskripsi lowongan kerja di sini untuk mengekstrak kata kunci teknis..."
              className="w-full p-2.5 text-[12.5px] text-ui-text bg-ui-panel border border-ui-border rounded-md focus:outline-none focus:ring-1 focus:ring-ui-focus placeholder:text-ui-text-placeholder"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleDuplicate}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-ui-card border border-ui-border hover:bg-ui-subtle text-[12px] font-medium text-ui-text transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-ui-text-secondary" />
                Duplikasi CV untuk Lowongan Ini
              </button>
              {duplicatedNotice && (
                <span className="text-[11px] font-medium text-ui-success">
                  Salinan CV baru dibuat & sedang aktif.
                </span>
              )}
            </div>
          </div>

          {/* Results */}
          {result.keywords.length === 0 ? (
            <div className="border border-dashed border-ui-border rounded-lg p-6 text-center text-[12px] text-ui-text-secondary">
              Tempel teks lowongan kerja di atas untuk mulai mencocokkan kata kunci dengan CV Anda.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Strip */}
              <div className="px-3.5 py-2.5 rounded-lg bg-ui-panel border border-ui-border flex flex-wrap items-center justify-between gap-2 text-[12px]">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-ui-success font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {result.matchedActive.length} Aktif di CV
                  </span>
                  <span className="inline-flex items-center gap-1 text-ui-warning font-medium">
                    <EyeOff className="w-3.5 h-3.5" />
                    {result.matchedHiddenInMaster.length} Tersembunyi di Master
                  </span>
                  <span className="inline-flex items-center gap-1 text-ui-text-secondary font-medium">
                    <HelpCircle className="w-3.5 h-3.5" />
                    {result.missing.length} Belum Ada
                  </span>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-ui-text-secondary">
                  {result.matchedActive.length} / {result.keywords.length} kata kunci aktif
                </span>
              </div>

              {/* 1. Hidden in Master Profile */}
              {result.matchedHiddenInMaster.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[12px] font-semibold text-ui-text">
                    Ada di Master Profile (Tersembunyi)
                  </h3>
                  <div className="space-y-2">
                    {result.matchedHiddenInMaster.map((entry) => (
                      <div
                        key={entry.keyword}
                        className="p-3 rounded-lg border border-ui-warning-border bg-ui-warning-bg flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[12.5px] font-semibold text-ui-text">
                            {entry.keyword}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-ui-card border border-ui-warning-border text-ui-warning-text text-[10px] font-semibold uppercase">
                            Tersembunyi
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {entry.sources.map((src, idx) => (
                            <div
                              key={`${src.sectionKey}-${src.itemId ?? ""}-${src.bulletId ?? ""}-${idx}`}
                              className="flex items-center justify-between gap-2 text-[11.5px] bg-ui-card border border-ui-border rounded-md px-2.5 py-1.5"
                            >
                              <span className="text-ui-text-secondary truncate">
                                Ditemukan di:{" "}
                                <strong className="text-ui-text font-medium">
                                  {src.label}
                                </strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRevealSource(src)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-ui-primary text-white text-[11px] font-medium hover:bg-ui-primary-hover shrink-0"
                              >
                                <Eye className="w-3 h-3" />
                                Tampilkan
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Matched Active */}
              {result.matchedActive.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[12px] font-semibold text-ui-text">
                    Sudah Tertulis di CV Aktif ({result.matchedActive.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matchedActive.map((kw) => (
                      <span
                        key={kw}
                        className="px-2.5 py-1 rounded-md bg-ui-success-bg text-ui-success text-[11.5px] font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Missing */}
              {result.missing.length > 0 && (
                <div className="space-y-2">
                  <div>
                    <h3 className="text-[12px] font-semibold text-ui-text">
                      Belum Ditemukan di CV ({result.missing.length})
                    </h3>
                    <p className="text-[11px] text-ui-text-secondary">
                      Tambahkan ke CV hanya jika Anda benar-benar menguasai atau pernah menggunakannya.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missing.map((kw) => (
                      <span
                        key={kw}
                        className="px-2.5 py-1 rounded-md bg-ui-subtle border border-ui-border text-ui-text-secondary text-[11.5px] font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-ui-text-placeholder pt-2 border-t border-ui-divider">
                Catatan: Hasil ini merupakan pencocokan kata kunci deterministik di browser Anda, bukan prediksi kelulusan mutlak dari sistem ATS tertentu.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
