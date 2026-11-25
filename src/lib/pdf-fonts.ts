"use client";

import { Font } from "@react-pdf/renderer";

let fontsRegistered = false;

export const PDF_REGISTERED_FAMILIES = {
  INTER: "Inter",
  ROBOTO: "Roboto",
  EB_GARAMOND: "EB Garamond",
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

  Font.register({
    family: PDF_REGISTERED_FAMILIES.EB_GARAMOND,
    fonts: [
      { src: `${fontBase}/EBGaramond-Regular.ttf`, fontWeight: 400, fontStyle: "normal" },
      { src: `${fontBase}/EBGaramond-Bold.ttf`, fontWeight: 700, fontStyle: "normal" },
      { src: `${fontBase}/EBGaramond-Italic.ttf`, fontWeight: 400, fontStyle: "italic" },
      { src: `${fontBase}/EBGaramond-BoldItalic.ttf`, fontWeight: 700, fontStyle: "italic" },
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
