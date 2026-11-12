import noceV from "@/assets/wood-noce.jpg";
import noceH from "@/assets/wood-noce-h.jpg";
import wengeV from "@/assets/wood-wenge.jpg";
import wengeH from "@/assets/wood-wenge-h.jpg";
import moganoV from "@/assets/wood-mogano.jpg";
import moganoH from "@/assets/wood-mogano-h.jpg";
import ciliegioV from "@/assets/wood-ciliegio.jpg";
import ciliegioH from "@/assets/wood-ciliegio-h.jpg";
import rovereV from "@/assets/wood-rovere.jpg";
import rovereH from "@/assets/wood-rovere-h.jpg";
import faggioV from "@/assets/wood-faggio.jpg";
import faggioH from "@/assets/wood-faggio-h.jpg";
import betullaV from "@/assets/wood-betulla.jpg";
import betullaH from "@/assets/wood-betulla-h.jpg";
import palissandroV from "@/assets/wood-palissandro.jpg";
import palissandroH from "@/assets/wood-palissandro-h.jpg";
import castagnoV from "@/assets/wood-castagno.jpg";
import castagnoH from "@/assets/wood-castagno-h.jpg";
import modernoV from "@/assets/wood-moderno.jpg";
import modernoH from "@/assets/wood-moderno-h.jpg";
import type { MessageKey } from "@/lib/i18n/it";

export type ShelfStyle = "antico" | "classico" | "moderno";

export interface Finish {
  id: string;
  /** CSS colour token used under (or instead of) the grain */
  color: string;
  /** vertical / horizontal grain textures; absent for solid tints */
  texV?: string;
  texH?: string;
  /** contrast of chrome drawn on top of this finish */
  tone: "dark" | "light";
}

export interface Variant {
  id: string;
  gilt?: boolean;
}

export interface StyleDef {
  id: ShelfStyle;
  variants: Variant[];
  finishes: Finish[];
}

const wood = (id: string, texV: string, texH: string, tone: Finish["tone"] = "dark"): Finish => ({
  id,
  color: `var(--wood-${id})`,
  texV,
  texH,
  tone,
});

const WOODS: Finish[] = [
  wood("noce", noceV, noceH),
  wood("wenge", wengeV, wengeH),
  wood("mogano", moganoV, moganoH),
  wood("ciliegio", ciliegioV, ciliegioH),
  wood("rovere", rovereV, rovereH),
  wood("faggio", faggioV, faggioH),
  wood("betulla", betullaV, betullaH, "light"),
  wood("palissandro", palissandroV, palissandroH),
  wood("castagno", castagnoV, castagnoH),
];

const MODERN_FINISHES: Finish[] = [
  { id: "tortora", color: "var(--tint-tortora)", tone: "light" },
  { id: "bianco", color: "var(--tint-bianco)", tone: "light" },
  { id: "grigio-chiaro", color: "var(--tint-grigio-chiaro)", tone: "light" },
  { id: "grigio-scuro", color: "var(--tint-grigio-scuro)", tone: "dark" },
  { id: "ocra", color: "var(--tint-ocra)", tone: "light" },
  { ...wood("moderno", modernoV, modernoH, "light"), id: "legno-moderno" },
];

export const STYLES: StyleDef[] = [
  {
    id: "classico",
    variants: [
      { id: "ionico" },
      { id: "dorato", gilt: true },
      { id: "rinascimentale" },
      { id: "barocco", gilt: true },
      { id: "liberty" },
    ],
    finishes: WOODS,
  },
  {
    id: "antico",
    variants: [{ id: "biblioteca" }, { id: "tortile" }, { id: "intarsiato", gilt: true }],
    finishes: WOODS,
  },
  {
    id: "moderno",
    variants: [{ id: "cornice" }, { id: "minimal" }, { id: "sospese" }, { id: "scandinavo" }, { id: "industriale" }],
    finishes: MODERN_FINISHES,
  },
];

export const styleLabelKey = (id: ShelfStyle) => `style.${id}` as MessageKey;
export const styleDescKey = (id: ShelfStyle) => `style.${id}.desc` as MessageKey;
export const variantLabelKey = (id: string) => `variant.${id}` as MessageKey;
export const variantDescKey = (id: string) => `variant.${id}.desc` as MessageKey;
export const finishLabelKey = (id: string) => `finish.${id}` as MessageKey;

export function getStyle(id: ShelfStyle): StyleDef {
  return STYLES.find((s) => s.id === id) ?? STYLES[0]!;
}

export function getVariant(style: ShelfStyle, variantId: string | undefined): Variant {
  const s = getStyle(style);
  return s.variants.find((v) => v.id === variantId) ?? s.variants[0]!;
}

export function getFinish(style: ShelfStyle, finishId: string | undefined): Finish {
  const s = getStyle(style);
  return s.finishes.find((f) => f.id === finishId) ?? s.finishes[0]!;
}

export function finishCssVars(finish: Finish): Record<string, string> {
  return {
    "--wood-color": finish.color,
    "--wood-v": finish.texV ? `url(${finish.texV})` : "none",
    "--wood-h": finish.texH ? `url(${finish.texH})` : "none",
  };
}
