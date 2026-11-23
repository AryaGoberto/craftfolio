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

  Font.register({
    family: PDF_REGISTERED_FAMILIES.INTER,
    fonts: [
      { src: "/fonts/Inter-Regular.ttf", fontWeight: 400, fontStyle: "normal" },
      { src: "/fonts/Inter-Bold.ttf", fontWeight: 700, fontStyle: "normal" },
      { src: "/fonts/Inter-Italic.ttf", fontWeight: 400, fontStyle: "italic" },
      { src: "/fonts/Inter-BoldItalic.ttf", fontWeight: 700, fontStyle: "italic" },
    ],
  });

  Font.register({
    family: PDF_REGISTERED_FAMILIES.ROBOTO,
    fonts: [
      { src: "/fonts/Roboto-Regular.ttf", fontWeight: 400, fontStyle: "normal" },
      { src: "/fonts/Roboto-Bold.ttf", fontWeight: 700, fontStyle: "normal" },
      { src: "/fonts/Roboto-Italic.ttf", fontWeight: 400, fontStyle: "italic" },
      { src: "/fonts/Roboto-BoldItalic.ttf", fontWeight: 700, fontStyle: "italic" },
    ],
  });

  Font.register({
    family: PDF_REGISTERED_FAMILIES.EB_GARAMOND,
    fonts: [
      { src: "/fonts/EBGaramond-Regular.ttf", fontWeight: 400, fontStyle: "normal" },
      { src: "/fonts/EBGaramond-Bold.ttf", fontWeight: 700, fontStyle: "normal" },
      { src: "/fonts/EBGaramond-Italic.ttf", fontWeight: 400, fontStyle: "italic" },
      { src: "/fonts/EBGaramond-BoldItalic.ttf", fontWeight: 700, fontStyle: "italic" },
    ],
  });

  Font.register({
    family: PDF_REGISTERED_FAMILIES.MERRIWEATHER,
    fonts: [
      { src: "/fonts/Merriweather-Regular.ttf", fontWeight: 400, fontStyle: "normal" },
      { src: "/fonts/Merriweather-Bold.ttf", fontWeight: 700, fontStyle: "normal" },
      { src: "/fonts/Merriweather-Italic.ttf", fontWeight: 400, fontStyle: "italic" },
      { src: "/fonts/Merriweather-BoldItalic.ttf", fontWeight: 700, fontStyle: "italic" },
    ],
  });

  // Nonaktifkan pemenggalan kata otomatis (-) agar teks ATS utuh
  Font.registerHyphenationCallback((word) => [word]);

  fontsRegistered = true;
}
