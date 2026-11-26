"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { BulletPoint, BuiltinSectionKey } from "@/lib/schemas/resume";
import { useResumeStore } from "@/store/use-resume-store";

interface BulletListEditorProps {
  sectionKey: BuiltinSectionKey | `custom:${string}`;
  itemId: string;
  bullets: BulletPoint[];
  roleContext?: {
    companyOrProject?: string;
    roleOrPosition?: string;
  };
}

interface BulletSuggestionState {
  bulletId: string;
  originalText: string;
  improvedText: string;
  reasoning: string;
  missingMetricsHint: string | null;
  inventedMetricsDetected: string[];
}

export function BulletListEditor({
  sectionKey,
  itemId,
  bullets,
  roleContext,
}: BulletListEditorProps) {
  const documents = useResumeStore((s) => s.documents);
  const activeDocumentId = useResumeStore((s) => s.activeDocumentId);
  const authUser = useResumeStore((s) => s.authUser);
  const openAuthModal = useResumeStore((s) => s.openAuthModal);
  const addBullet = useResumeStore((s) => s.addBullet);
  const updateBullet = useResumeStore((s) => s.updateBullet);
  const removeBullet = useResumeStore((s) => s.removeBullet);
  const toggleBulletVisibility = useResumeStore(
    (s) => s.toggleBulletVisibility
  );

  const [loadingBulletId, setLoadingBulletId] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<BulletSuggestionState | null>(
    null
  );
  const [aiError, setAiError] = useState<{
    bulletId: string;
    message: string;
  } | null>(null);

  const activeLanguage = documents[activeDocumentId]?.language ?? "en";

  const handleEnhance = async (bullet: BulletPoint) => {
    if (!authUser) {
      openAuthModal(
        "Masuk atau buat akun gratis untuk menggunakan fitur perbaikan kalimat dengan asisten AI Gemini."
      );
      return;
    }

    const trimmed = bullet.text.trim();
    if (trimmed.length < 3) {
      setAiError({
        bulletId: bullet.id,
        message: "Tulis minimal beberapa kata terlebih dahulu sebelum meminta saran AI.",
      });
      return;
    }

    setLoadingBulletId(bullet.id);
    setAiError(null);

    try {
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulletText: trimmed,
          language: activeLanguage,
          tone: "impact",
          roleContext: {
            ...roleContext,
            sectionKey,
          },
        }),
      });

      const data = (await res.json()) as {
        improvedText?: string;
        reasoning?: string;
        missingMetricsHint?: string | null;
        inventedMetricsDetected?: string[];
        error?: string;
      };

      if (!res.ok || !data.improvedText) {
        setAiError({
          bulletId: bullet.id,
          message:
            data.error ||
            "Saran AI belum dapat diproses saat ini. Anda tetap bisa menyunting teks secara manual.",
        });
        return;
      }

      setSuggestion({
        bulletId: bullet.id,
        originalText: bullet.text,
        improvedText: data.improvedText,
        reasoning:
          data.reasoning ||
          "Struktur kalimat disesuaikan ke pola Action -> Context -> Result.",
        missingMetricsHint: data.missingMetricsHint ?? null,
        inventedMetricsDetected: data.inventedMetricsDetected ?? [],
      });
    } catch {
      setAiError({
        bulletId: bullet.id,
        message: "Gagal menghubungi server AI. Periksa koneksi lalu coba lagi.",
      });
    } finally {
      setLoadingBulletId(null);
    }
  };

  const handleApplySuggestion = () => {
    if (!suggestion) return;
    updateBullet(
      sectionKey,
      itemId,
      suggestion.bulletId,
      suggestion.improvedText
    );
    setSuggestion(null);
  };

  return (
    <div className="mt-2.5 space-y-2">
      {bullets.map((b) => {
        const isLoading = loadingBulletId === b.id;
        const activeSuggestion =
          suggestion?.bulletId === b.id ? suggestion : null;
        const bulletError = aiError?.bulletId === b.id ? aiError.message : null;

        return (
          <div key={b.id} className="space-y-1.5">
            <div
              className={`flex items-start gap-1.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-md px-2 py-1.5 ${
                b.isVisible ? "" : "opacity-40"
              }`}
            >
              <span className="text-[#52525B] text-[13px] leading-[22px] select-none">
                •
              </span>
              <textarea
                rows={2}
                value={b.text}
                onChange={(e) => {
                  updateBullet(sectionKey, itemId, b.id, e.target.value);
                  if (activeSuggestion) setSuggestion(null);
                }}
                placeholder="Tulis pencapaian dengan kata kerja aktif & dampak terukur..."
                className="flex-1 bg-transparent text-[12px] text-[#09090B] leading-snug resize-none focus:outline-none placeholder:text-[#A1A1AA]"
              />
              <button
                type="button"
                onClick={() => handleEnhance(b)}
                disabled={isLoading || loadingBulletId !== null}
                title={
                  authUser
                    ? "Perbaiki dengan AI (Gemini)"
                    : "Masuk untuk perbaiki dengan AI (Gemini)"
                }
                aria-label="Perbaiki poin ini dengan AI"
                className="p-1 text-[#52525B] hover:text-[#09090B] rounded hover:bg-[#F4F4F5] disabled:opacity-50 transition-colors relative group/ai"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => toggleBulletVisibility(sectionKey, itemId, b.id)}
                title={b.isVisible ? "Sembunyikan poin" : "Tampilkan poin"}
                className="p-1 text-[#52525B] hover:text-[#09090B] rounded hover:bg-[#F4F4F5]"
              >
                {b.isVisible ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeSuggestion) setSuggestion(null);
                  removeBullet(sectionKey, itemId, b.id);
                }}
                title="Hapus poin"
                className="p-1 text-[#A1A1AA] hover:text-[#EF4444] rounded hover:bg-[#F4F4F5]"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {bulletError && (
              <div
                role="status"
                className="flex items-start justify-between gap-2 px-2.5 py-2 rounded-md bg-[#FFFBEB] border border-[#FDE68A] text-[11px] text-[#92400E]"
              >
                <span>{bulletError}</span>
                <button
                  type="button"
                  onClick={() => setAiError(null)}
                  aria-label="Tutup pesan AI"
                  className="shrink-0 text-[#92400E]/70 hover:text-[#92400E]"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {activeSuggestion && (
              <div className="rounded-lg border border-[#E4E4E7] bg-white p-3 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F4F4F5] text-[#09090B] text-[10.5px] font-medium">
                    <Sparkles className="w-3 h-3" />
                    Saran AI · Gemini (Perlu Konfirmasi)
                  </span>
                  <button
                    type="button"
                    onClick={() => setSuggestion(null)}
                    aria-label="Tutup pratinjau saran AI"
                    className="p-0.5 text-[#71717A] hover:text-[#09090B]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5 text-[11.5px]">
                  <div className="p-2 rounded bg-[#FAFAFA] border border-[#F4F4F5] text-[#52525B]">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#71717A] mb-0.5">
                      Teks Asli
                    </p>
                    <p className="leading-snug">{activeSuggestion.originalText}</p>
                  </div>

                  <div className="p-2 rounded bg-[#F8F9FA] border border-[#18181B]/20 text-[#09090B]">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#09090B] mb-0.5">
                      Saran Perbaikan
                    </p>
                    <p className="leading-snug font-medium">
                      {activeSuggestion.improvedText}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-[#52525B] leading-snug">
                  {activeSuggestion.reasoning}
                </p>

                {activeSuggestion.missingMetricsHint && (
                  <div className="flex items-start gap-1.5 px-2 py-1.5 rounded bg-[#FFFBEB] border border-[#FDE68A] text-[10.5px] text-[#92400E] leading-snug">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{activeSuggestion.missingMetricsHint}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setSuggestion(null)}
                    className="h-7 px-2.5 rounded-md border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5] text-[11px] font-medium text-[#52525B]"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEnhance(b)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-[#E4E4E7] bg-[#FAFAFA] hover:bg-[#F4F4F5] text-[11px] font-medium text-[#09090B]"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Coba Ulang
                  </button>
                  <button
                    type="button"
                    onClick={handleApplySuggestion}
                    className="inline-flex items-center gap-1 h-7 px-3 rounded-md bg-[#18181B] hover:bg-[#27272A] text-white text-[11px] font-medium"
                  >
                    <Check className="w-3 h-3" />
                    Terapkan
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => addBullet(sectionKey, itemId)}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#52525B] hover:text-[#09090B] pt-0.5"
      >
        <Plus className="w-3 h-3" />
        Tambah Poin
      </button>
    </div>
  );
}
