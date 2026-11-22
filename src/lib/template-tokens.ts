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
    paddingXPt: 30,
    bodySizePt: 9.5,
    headingSizePt: 10.5,
    nameSizePt: 20,
    lineHeight: 1.22,
    sectionGapPt: 8,
    itemGapPt: 5,
    bulletGapPt: 2,
  },
  normal: {
    paddingYPt: 36,
    paddingXPt: 38,
    bodySizePt: 10,
    headingSizePt: 11,
    nameSizePt: 22,
    lineHeight: 1.3,
    sectionGapPt: 12,
    itemGapPt: 8,
    bulletGapPt: 3,
  },
  relaxed: {
    paddingYPt: 44,
    paddingXPt: 46,
    bodySizePt: 10.5,
    headingSizePt: 11.5,
    nameSizePt: 24,
    lineHeight: 1.38,
    sectionGapPt: 16,
    itemGapPt: 11,
    bulletGapPt: 4,
  },
};

export const HTML_FONT_FAMILIES: Record<FontFamilyPreset, string> = {
  inter: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  roboto: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  serif: "var(--font-garamond), Georgia, 'Times New Roman', serif",
  georgia: "var(--font-merriweather), Georgia, serif",
};

export const PDF_FONT_FAMILIES: Record<FontFamilyPreset, string> = {
  inter: "Helvetica",
  roboto: "Helvetica",
  serif: "Times-Roman",
  georgia: "Times-Roman",
};
