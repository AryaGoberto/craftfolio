"use client";

import { Font } from "@react-pdf/renderer";
import type { FontFamilyPreset } from "@/lib/schemas/resume";

let hyphenationRegistered = false;
const registeredPresets = new Set<FontFamilyPreset>();

export const PDF_REGISTERED_FAMILIES = {
  INTER: "Inter",
  ROBOTO: "Roboto",
  CMU_SERIF: "CMU Serif",
  MERRIWEATHER: "Merriweather",
} as const;

const ALL_PRESETS: FontFamilyPreset[] = ["inter", "roboto", "serif", "georgia"];

function registerFontPreset(preset: FontFamilyPreset, fontBase: string): void {
  if (registeredPresets.has(preset)) return;

  switch (preset) {
    case "inter":
      Font.register({
        family: PDF_REGISTERED_FAMILIES.INTER,
        fonts: [
          { src: `${fontBase}/Inter-Regular.ttf`, fontWeight: 400, fontStyle: "normal" },
          { src: `${fontBase}/Inter-Bold.ttf`, fontWeight: 700, fontStyle: "normal" },
          { src: `${fontBase}/Inter-Italic.ttf`, fontWeight: 400, fontStyle: "italic" },
          { src: `${fontBase}/Inter-BoldItalic.ttf`, fontWeight: 700, fontStyle: "italic" },
        ],
      });
      break;
    case "roboto":
      Font.register({
        family: PDF_REGISTERED_FAMILIES.ROBOTO,
        fonts: [
          { src: `${fontBase}/Roboto-Regular.ttf`, fontWeight: 400, fontStyle: "normal" },
          { src: `${fontBase}/Roboto-Bold.ttf`, fontWeight: 700, fontStyle: "normal" },
          { src: `${fontBase}/Roboto-Italic.ttf`, fontWeight: 400, fontStyle: "italic" },
          { src: `${fontBase}/Roboto-BoldItalic.ttf`, fontWeight: 700, fontStyle: "italic" },
        ],
      });
      break;
    case "serif":
      // Uses New Computer Modern 10pt Book (weight 450) for regular/italic so body text
      // has crisp, solid Overleaf stroke weight instead of spindly 300-DPI phototypesetter hairlines.
      Font.register({
        family: PDF_REGISTERED_FAMILIES.CMU_SERIF,
        fonts: [
          { src: `${fontBase}/NewCM10-Book.otf`, fontWeight: 400, fontStyle: "normal" },
          { src: `${fontBase}/NewCM10-Bold.otf`, fontWeight: 700, fontStyle: "normal" },
          { src: `${fontBase}/NewCM10-BookItalic.otf`, fontWeight: 400, fontStyle: "italic" },
          { src: `${fontBase}/NewCM10-BoldItalic.otf`, fontWeight: 700, fontStyle: "italic" },
        ],
      });
      break;
    case "georgia":
      Font.register({
        family: PDF_REGISTERED_FAMILIES.MERRIWEATHER,
        fonts: [
          { src: `${fontBase}/Merriweather-Regular.ttf`, fontWeight: 400, fontStyle: "normal" },
          { src: `${fontBase}/Merriweather-Bold.ttf`, fontWeight: 700, fontStyle: "normal" },
          { src: `${fontBase}/Merriweather-Italic.ttf`, fontWeight: 400, fontStyle: "italic" },
          { src: `${fontBase}/Merriweather-BoldItalic.ttf`, fontWeight: 700, fontStyle: "italic" },
        ],
      });
      break;
  }

  registeredPresets.add(preset);
}

/**
 * Registers only the requested PDF font preset on demand (reducing memory & font I/O).
 * If omitted, registers all presets for backward compatibility.
 */
export function registerPdfFonts(fontFamily?: FontFamilyPreset): void {
  const fontBase =
    typeof window === "undefined"
      ? `${process.cwd()}/public/fonts`
      : "/fonts";

  const targets = fontFamily ? [fontFamily] : ALL_PRESETS;
  for (const preset of targets) {
    registerFontPreset(preset, fontBase);
  }

  if (!hyphenationRegistered) {
    // Nonaktifkan pemenggalan kata otomatis (-) agar teks ATS utuh
    Font.registerHyphenationCallback((word) => [word]);
    hyphenationRegistered = true;
  }
}
