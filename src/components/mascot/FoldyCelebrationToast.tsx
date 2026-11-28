"use client";

import { X } from "lucide-react";
import type { FoldyMood } from "@/lib/foldy-coach";
import { FoldyMascot } from "./FoldyMascot";

export interface FoldyCelebrationState {
  id: number;
  mood: FoldyMood;
  title: string;
  description: string;
}

interface FoldyCelebrationToastProps {
  celebration: FoldyCelebrationState | null;
  onDismiss: () => void;
}

export function FoldyCelebrationToast({
  celebration,
  onDismiss,
}: FoldyCelebrationToastProps) {
  if (!celebration) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-40 max-w-xs w-[calc(100vw-2rem)] bg-ui-card border border-ui-border rounded-lg shadow-xl p-3 flex items-center gap-3"
    >
      <div className="w-11 h-11 rounded-lg bg-ui-primary-soft border border-ui-border flex items-center justify-center shrink-0">
        <FoldyMascot
          mood={celebration.mood}
          size="sm"
          engine="ambient"
          burstKey={celebration.id}
          ariaLabel="Reaksi Foldy"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold text-ui-text leading-snug">
          {celebration.title}
        </p>
        <p className="text-[11.5px] text-ui-text-secondary leading-snug mt-0.5">
          {celebration.description}
        </p>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Tutup notifikasi Foldy"
        className="p-1 text-ui-text-muted hover:text-ui-text rounded hover:bg-ui-subtle shrink-0 self-start"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
