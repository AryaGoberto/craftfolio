"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";
import type { FoldyMood } from "@/lib/foldy-coach";
import { setFoldyVisibility, useFoldyPrefs } from "@/lib/foldy-prefs";
import { FoldyMascot } from "@/components/mascot/FoldyMascot";

interface ReactionItem {
  mood: FoldyMood;
  message: string;
}

const HERO_REACTIONS: ReactionItem[] = [
  {
    mood: "cursor",
    message: "Hai! Aku Foldy — siap bantu rapikan CV ATS kamu tanpa ribet LaTeX.",
  },
  {
    mood: "happy",
    message: "Yeay! Layout satu kolom & teks 100% selectable sudah otomatis aman.",
  },
  {
    mood: "ai",
    message: "AI Gemini juga siap memoles bullet pengalaman kerjamu biar lebih terukur.",
  },
  {
    mood: "crafty",
    message: "Punya banyak lamaran? Sembunyikan item tertentu tanpa hapus Master Profile.",
  },
  {
    mood: "eureka",
    message: "Aha! Cocokkan CV dengan Job Description langsung di editor dalam hitungan detik.",
  },
];

export function LandingFoldyHero() {
  const prefs = useFoldyPrefs();
  const [reactionIdx, setReactionIdx] = useState(0);
  const [ctaHovered, setCtaHovered] = useState(false);

  const activeReaction = HERO_REACTIONS[reactionIdx];
  const displayMood: FoldyMood = ctaHovered ? "wink" : activeReaction.mood;
  const displayMessage = ctaHovered
    ? "Yuk mulai sekarang — gratis, tanpa wajib daftar akun!"
    : activeReaction.message;

  const cycleReaction = () => {
    setReactionIdx((prev) => (prev + 1) % HERO_REACTIONS.length);
  };

  return (
    <div className="mt-8 flex flex-col items-center">
      {/* Primary Hero CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
        <Link
          href="/editor"
          onMouseEnter={() => setCtaHovered(true)}
          onMouseLeave={() => setCtaHovered(false)}
          onFocus={() => setCtaHovered(true)}
          onBlur={() => setCtaHovered(false)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md bg-ui-primary text-white text-[13.5px] font-medium hover:bg-ui-primary-hover transition-colors"
        >
          Buat CV Sekarang — Gratis
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
        <Link
          href="/templates"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md bg-ui-card border border-ui-border text-ui-text text-[13.5px] font-medium hover:bg-ui-subtle transition-colors"
        >
          Lihat 4 Template ATS
        </Link>
      </div>

      {/* Editorial Foldy Companion Strip (zero floating widget, pauses off-screen) */}
      {prefs.visibility === "hidden" ? (
        <button
          type="button"
          onClick={() => setFoldyVisibility("full")}
          className="mt-5 inline-flex items-center gap-1.5 text-[11.5px] text-ui-text-muted hover:text-ui-link transition-colors"
        >
          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          Tampilkan maskot Foldy
        </button>
      ) : (
        <div className="mt-6 inline-flex flex-col sm:flex-row items-center gap-3 px-4 py-2.5 rounded-xl bg-ui-card border border-ui-border shadow-2xs max-w-xl text-center sm:text-left">
          <div className="w-14 h-14 rounded-lg bg-ui-panel border border-ui-divider flex items-center justify-center shrink-0">
            <FoldyMascot
              mood={displayMood}
              size="md"
              engine={prefs.visibility === "quiet" ? "ambient" : "interactive"}
              interactiveClick
              showShadow
              onClick={cycleReaction}
              ariaLabel="Klik Foldy untuk melihat ekspresi lainnya"
            />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ui-link">
                Foldy · ATS Coach
              </span>
              <span className="text-[10.5px] text-ui-text-muted">
                · Klik Foldy untuk reaksi
              </span>
            </div>
            <p className="text-[12.5px] text-ui-text-secondary leading-snug">
              {displayMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
