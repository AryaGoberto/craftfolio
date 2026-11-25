"use client";

import { Font } from "@react-pdf/renderer";

let fontsRegistered = false;

export const PDF_REGISTERED_FAMILIES = {
  INTER: "Inter",
  ROBOTO: "Roboto",
  CMU_SERIF: "CMU Serif",
  MERRIWEATHER: "Merriweather",
} as const;

export function registerPdfFonts(): void {
  if (fontsRegistered) return;

  const fontBase =
    typeof window === "undefined"
      ? `${process.cwd()}/public/fonts`
      : "/fonts";

  Font.register({
    family: PDF_REGISTERED_FAMILIES.INTER,
    fonts: [
      { src: `${fontBase}/Inter-Regular.ttf`, fontWeight: 400, fontStyle: "normal" },
      { src: `${fontBase}/Inter-Bold.ttf`, fontWeight: 700, fontStyle: "normal" },
      { src: `${fontBase}/Inter-Italic.ttf`, fontWeight: 400, fontStyle: "italic" },
      { src: `${fontBase}/Inter-BoldItalic.ttf`, fontWeight: 700, fontStyle: "italic" },
    ],
  });

  Font.register({
    family: PDF_REGISTERED_FAMILIES.ROBOTO,
    fonts: [
      { src: `${fontBase}/Roboto-Regular.ttf`, fontWeight: 400, fontStyle: "normal" },
      { src: `${fontBase}/Roboto-Bold.ttf`, fontWeight: 700, fontStyle: "normal" },
      { src: `${fontBase}/Roboto-Italic.ttf`, fontWeight: 400, fontStyle: "italic" },
      { src: `${fontBase}/Roboto-BoldItalic.ttf`, fontWeight: 700, fontStyle: "italic" },
    ],
  });

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

  Font.register({
    family: PDF_REGISTERED_FAMILIES.MERRIWEATHER,
    fonts: [
      { src: `${fontBase}/Merriweather-Regular.ttf`, fontWeight: 400, fontStyle: "normal" },
      { src: `${fontBase}/Merriweather-Bold.ttf`, fontWeight: 700, fontStyle: "normal" },
      { src: `${fontBase}/Merriweather-Italic.ttf`, fontWeight: 400, fontStyle: "italic" },
      { src: `${fontBase}/Merriweather-BoldItalic.ttf`, fontWeight: 700, fontStyle: "italic" },
    ],
  });

  // Nonaktifkan pemenggalan kata otomatis (-) agar teks ATS utuh
  Font.registerHyphenationCallback((word) => [word]);

  fontsRegistered = true;
}
