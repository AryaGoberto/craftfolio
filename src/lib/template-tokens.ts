import type {
  DensityPreset,
  FontFamilyPreset,
  PaperSize,
} from "@/lib/schemas/resume";

export const PAPER_DIMENSIONS: Record<
  PaperSize,
  {
    widthPx: number;
    heightPx: number;
    widthPt: number;
    heightPt: number;
    label: string;
  }
> = {
  A4: {
    widthPx: 794,
    heightPx: 1123,
    widthPt: 595.28,
    heightPt: 841.89,
    label: "A4",
  },
  LETTER: {
    widthPx: 816,
    heightPx: 1056,
    widthPt: 612,
    heightPt: 792,
    label: "Letter",
  },
};

export interface DensityTokens {
  paddingYPt: number;
  paddingXPt: number;
  bodySizePt: number;
  headingSizePt: number;
  nameSizePt: number;
  lineHeight: number;
  sectionGapPt: number;
  itemGapPt: number;
  bulletGapPt: number;
}

export const DENSITY_TOKENS: Record<DensityPreset, DensityTokens> = {
  compact: {
    paddingYPt: 28,
    paddingXPt: 29,
    bodySizePt: 10,
    headingSizePt: 11,
    nameSizePt: 21,
    lineHeight: 1.2,
    sectionGapPt: 8,
    itemGapPt: 5,
    bulletGapPt: 2,
  },
  normal: {
    paddingYPt: 36,
    paddingXPt: 36,
    bodySizePt: 10.9,
    headingSizePt: 12,
    nameSizePt: 22.8,
    lineHeight: 1.25,
    sectionGapPt: 11,
    itemGapPt: 7,
    bulletGapPt: 2.5,
  },
  relaxed: {
    paddingYPt: 43,
    paddingXPt: 43,
    bodySizePt: 11.2,
    headingSizePt: 12.5,
    nameSizePt: 24,
    lineHeight: 1.32,
    sectionGapPt: 14,
    itemGapPt: 10,
    bulletGapPt: 3.5,
  },
};

export const HTML_FONT_FAMILIES: Record<FontFamilyPreset, string> = {
  inter: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  roboto: "var(--font-roboto), ui-sans-serif, system-ui, sans-serif",
  serif: "'CMU Serif', Georgia, 'Times New Roman', serif",
  georgia: "var(--font-merriweather), Georgia, serif",
};

export const PDF_FONT_FAMILIES: Record<FontFamilyPreset, string> = {
  inter: "Inter",
  roboto: "Roboto",
  serif: "CMU Serif",
  georgia: "Merriweather",
};
