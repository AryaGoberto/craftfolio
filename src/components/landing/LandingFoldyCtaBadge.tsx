"use client";

import { useFoldyPrefs } from "@/lib/foldy-prefs";
import { FoldyMascot } from "@/components/mascot/FoldyMascot";

export function LandingFoldyCtaBadge() {
  const prefs = useFoldyPrefs();
  if (prefs.visibility === "hidden") return null;

  return (
    <div className="mb-4 flex justify-center">
      <FoldyMascot
        mood="happy"
        size="md"
        engine="ambient"
        interactiveClick
        showShadow
        ariaLabel="Foldy menyemangati untuk mulai membuat CV"
      />
    </div>
  );
}
