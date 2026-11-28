"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  Loader2,
  RefreshCw,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { postAuthenticatedAiJson } from "@/lib/ai/client-fetch";
import { emitFoldyEvent } from "@/lib/foldy-events";
import { useResumeStore } from "@/store/use-resume-store";

type SummaryAiMode = "polish" | "generate";

interface SummarySuggestionState {
  mode: SummaryAiMode;
  originalText: string;
  improvedSummary: string;
  reasoning: string;
  missingMetricsHint: string | null;
  inventedMetricsDetected: string[];
}

export function SummaryEditor() {
  const documents = useResumeStore((s) => s.documents);
  const activeDocumentId = useResumeStore((s) => s.activeDocumentId);
  const updateSummary = useResumeStore((s) => s.updateSummary);
  const authUser = useResumeStore((s) => s.authUser);
  const aiQuota = useResumeStore((s) => s.aiQuota);
  const openAuthModal = useResumeStore((s) => s.openAuthModal);

  const [loadingMode, setLoadingMode] = useState<SummaryAiMode | null>(null);
  const [suggestion, setSuggestion] = useState<SummarySuggestionState | null>(
    null
  );
  const [aiError, setAiError] = useState<string | null>(null);

  const doc = documents[activeDocumentId];
  if (!doc) return null;

  const summaryText = doc.basics.summary.text;
  const wordCount = summaryText.trim()
    ? summaryText.trim().split(/\s+/).length
    : 0;

  const buildCvContext = () => ({
    headline: doc.basics.headline?.trim() || undefined,
    targetRole: doc.targetRole?.trim() || undefined,
    experience: doc.sections.experience.items
      .filter((e) => e.isVisible && (e.company.trim() || e.position.trim()))
      .slice(0, 6)
      .map((e) => ({
        company: e.company.trim() || undefined,
        position: e.position.trim() || undefined,
        startDate: e.startDate.trim() || undefined,
        endDate: e.endDate.trim() || undefined,
        bullets: e.bullets
          .filter((b) => b.isVisible && b.text.trim())
          .slice(0, 4)
          .map((b) => b.text.trim()),
      })),
    education: doc.sections.education.items
      .filter((e) => e.isVisible && (e.institution.trim() || e.degree.trim()))
      .slice(0, 3)
      .map((e) => ({
        institution: e.institution.trim() || undefined,
        degree: e.degree.trim() || undefined,
        gpa: e.gpa?.trim() || undefined,
      })),
    projects: doc.sections.projects.items
      .filter((p) => p.isVisible && p.name.trim())
      .slice(0, 4)
      .map((p) => ({
        name: p.name.trim() || undefined,
        techStack: p.techStack?.trim() || undefined,
      })),
    skills: doc.sections.skills.items
      .filter((s) => s.isVisible && (s.category.trim() || s.skills.trim()))
      .slice(0, 6)
      .map((s) => ({
        category: s.category.trim() || undefined,
        skills: s.skills.trim() || undefined,
      })),
  });

  const handleRunAi = async (mode: SummaryAiMode) => {
    if (!authUser) {
      openAuthModal(
        "Masuk atau buat akun gratis untuk menggunakan asisten AI Gemini pada Ringkasan Profesional."
      );
      return;
    }

    const trimmed = summaryText.trim();
    if (mode === "polish" && trimmed.length < 15) {
      setAiError(
        "Tulis minimal beberapa kata ringkasan terlebih dahulu, atau gunakan tombol 'Buat dari Isi CV'."
      );
      return;
    }

    setLoadingMode(mode);
    setAiError(null);
    emitFoldyEvent({ type: "ai-start", docId: activeDocumentId });

    try {
      const { ok, status, data } = await postAuthenticatedAiJson<{
        improvedSummary?: string;
        reasoning?: string;
        missingMetricsHint?: string | null;
        inventedMetricsDetected?: string[];
      }>("/api/ai/enhance-summary", {
        mode,
        summaryText: trimmed,
        language: doc.language,
        cvContext: buildCvContext(),
      });

      if (status === 401) {
        openAuthModal(
          data.error ||
            "Masuk ke akun Craftfolio terlebih dahulu untuk menggunakan fitur AI."
        );
        return;
      }

      if (!ok || !data.improvedSummary) {
        setAiError(
          data.error ||
            "Saran AI untuk ringkasan belum dapat diproses saat ini. Anda tetap bisa menulis manual."
        );
        return;
      }

      setSuggestion({
        mode,
        originalText: summaryText,
        improvedSummary: data.improvedSummary,
        reasoning:
          data.reasoning ||
          "Ringkasan dirapikan agar lebih padat, profesional, dan ATS-friendly.",
        missingMetricsHint: data.missingMetricsHint ?? null,
        inventedMetricsDetected: data.inventedMetricsDetected ?? [],
      });
    } catch {
      setAiError("Gagal menghubungi server AI. Periksa koneksi lalu coba lagi.");
    } finally {
      setLoadingMode(null);
      emitFoldyEvent({ type: "ai-end", docId: activeDocumentId });
    }
  };

  const handleApplySuggestion = () => {
    if (!suggestion) return;
    updateSummary({ text: suggestion.improvedSummary, isVisible: true });
    setSuggestion(null);
    emitFoldyEvent({
      type: "ai-applied",
      docId: activeDocumentId,
      detail: "Ringkasan profil hasil polesan AI berhasil diterapkan!",
    });
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-[11px] font-medium text-ui-text-secondary">
          Ringkasan Profil (rekomendasi 30–60 kata · saat ini {wordCount} kata)
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          {authUser && aiQuota && (
            <span
              className={`text-[10.5px] font-medium px-2 py-0.5 rounded-full border ${
                aiQuota.enhance.remaining === 0
                  ? "bg-ui-error-bg border-ui-error-border text-ui-error-text"
                  : "bg-ui-subtle border-ui-border text-ui-text-secondary"
              }`}
              title="Batas harian perbaikan kalimat AI (reset pukul 00.00 WIB)"
            >
              Sisa AI: {aiQuota.enhance.remaining}/{aiQuota.enhance.limit}
            </span>
          )}
          <button
            type="button"
            disabled={
              loadingMode !== null ||
              Boolean(authUser && aiQuota && aiQuota.enhance.remaining <= 0)
            }
            onClick={() => void handleRunAi("polish")}
            title={
              !authUser
                ? "Masuk untuk memperbaiki ringkasan dengan Gemini AI"
                : aiQuota && aiQuota.enhance.remaining <= 0
                  ? "Kuota AI harian habis (reset 00.00 WIB)"
                  : "Perbaiki dan padatkan teks ringkasan dengan Gemini AI"
            }
            className="inline-flex items-center gap-1 h-7 px-2 rounded-md border border-ui-border bg-ui-card hover:bg-ui-subtle disabled:opacity-50 text-[11px] font-medium text-ui-text transition-colors"
          >
            {loadingMode === "polish" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            <span>Perbaiki AI</span>
          </button>
          <button
            type="button"
            disabled={
              loadingMode !== null ||
              Boolean(authUser && aiQuota && aiQuota.enhance.remaining <= 0)
            }
            onClick={() => void handleRunAi("generate")}
            title={
              !authUser
                ? "Masuk untuk membuat draf ringkasan dari isi CV dengan Gemini AI"
                : aiQuota && aiQuota.enhance.remaining <= 0
                  ? "Kuota AI harian habis (reset 00.00 WIB)"
                  : "Buat draf ringkasan otomatis dari Pengalaman, Pendidikan & Keahlian di CV Anda"
            }
            className="inline-flex items-center gap-1 h-7 px-2 rounded-md bg-ui-primary hover:bg-ui-primary-hover disabled:opacity-50 text-[11px] font-medium text-white transition-colors"
          >
            {loadingMode === "generate" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Wand2 className="w-3 h-3" />
            )}
            <span>Buat dari Isi CV</span>
          </button>
        </div>
      </div>

      <textarea
        rows={4}
        value={summaryText}
        onChange={(e) => {
          updateSummary({ text: e.target.value });
          if (suggestion) setSuggestion(null);
        }}
        placeholder="Tulis ringkasan singkat (2–3 kalimat) mengenai profil profesional, keahlian utama, dan fokus karier Anda..."
        className="w-full p-2.5 text-[13px] text-ui-text bg-ui-card border border-ui-border rounded-md focus:outline-none focus:ring-1 focus:ring-ui-focus placeholder:text-ui-text-placeholder"
      />

      {aiError && (
        <div
          role="status"
          className="flex items-start justify-between gap-2 px-2.5 py-2 rounded-md bg-ui-warning-bg border border-ui-warning-border text-[11px] text-ui-warning-text"
        >
          <span>{aiError}</span>
          <button
            type="button"
            onClick={() => setAiError(null)}
            aria-label="Tutup pesan AI"
            className="shrink-0 text-ui-warning-text/75 hover:text-ui-warning-text"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {suggestion && (
        <div className="rounded-lg border border-ui-border bg-ui-card p-3 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-ui-subtle text-ui-text text-[10.5px] font-medium">
              <Sparkles className="w-3 h-3" />
              {suggestion.mode === "generate"
                ? "Draf AI dari Isi CV · Gemini (Perlu Konfirmasi)"
                : "Saran AI · Gemini (Perlu Konfirmasi)"}
            </span>
            <button
              type="button"
              onClick={() => setSuggestion(null)}
              aria-label="Tutup pratinjau saran ringkasan AI"
              className="p-0.5 text-ui-text-muted hover:text-ui-text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-[11.5px]">
            {suggestion.originalText.trim() && (
              <div className="p-2 rounded bg-ui-panel border border-ui-divider text-ui-text-secondary">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ui-text-muted mb-0.5">
                  Teks Asli
                </p>
                <p className="leading-snug">{suggestion.originalText}</p>
              </div>
            )}

            <div className="p-2 rounded bg-ui-primary-soft/60 border border-ui-primary/25 text-ui-text">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ui-link-soft-text mb-0.5">
                Saran Ringkasan AI
              </p>
              <p className="leading-snug font-medium">
                {suggestion.improvedSummary}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-ui-text-secondary leading-snug">
            {suggestion.reasoning}
          </p>

          {suggestion.inventedMetricsDetected.length > 0 && (
            <div className="flex items-start gap-1.5 p-2 rounded bg-ui-error-bg border border-ui-error-border text-[11px] text-ui-error-text">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Angka baru terdeteksi (
                {suggestion.inventedMetricsDetected.join(", ")}) yang tidak ada
                di data CV Anda. Periksa atau ubah manual setelah menerapkan.
              </span>
            </div>
          )}

          {suggestion.missingMetricsHint &&
            suggestion.inventedMetricsDetected.length === 0 && (
              <p className="text-[11px] text-ui-text-secondary bg-ui-panel border border-ui-border rounded px-2 py-1.5">
                💡 {suggestion.missingMetricsHint}
              </p>
            )}

          <div className="flex items-center justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => void handleRunAi(suggestion.mode)}
              disabled={loadingMode !== null}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-ui-border bg-ui-card hover:bg-ui-subtle text-[11px] font-medium text-ui-text-secondary disabled:opacity-50"
            >
              <RefreshCw className="w-3 h-3" />
              Coba Lagi
            </button>
            <button
              type="button"
              onClick={() => setSuggestion(null)}
              className="h-7 px-2.5 rounded-md border border-ui-border bg-ui-card hover:bg-ui-subtle text-[11px] font-medium text-ui-text-secondary"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApplySuggestion}
              className="inline-flex items-center gap-1 h-7 px-3 rounded-md bg-ui-primary hover:bg-ui-primary-hover text-white text-[11px] font-medium"
            >
              <Check className="w-3 h-3" />
              Terapkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
