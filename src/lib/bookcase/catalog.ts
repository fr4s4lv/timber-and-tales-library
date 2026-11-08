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
import modernoV from "@/assets/wood-moderno.jpg";
import modernoH from "@/assets/wood-moderno-h.jpg";

export type ShelfStyle = "antico" | "classico" | "moderno";

export interface Finish {
  id: string;
  label: string;
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
  label: string;
  description: string;
  gilt?: boolean;
}

export interface StyleDef {
  id: ShelfStyle;
  label: string;
  description: string;
  variants: Variant[];
  finishes: Finish[];
}

const WOODS: Finish[] = [
  { id: "noce", label: "Noce", color: "var(--wood-noce)", texV: noceV, texH: noceH, tone: "dark" },
  { id: "wenge", label: "Wengé", color: "var(--wood-wenge)", texV: wengeV, texH: wengeH, tone: "dark" },
  {
    id: "mogano",
    label: "Mogano rosso",
    color: "var(--wood-mogano)",
    texV: moganoV,
    texH: moganoH,
    tone: "dark",
  },
  {
    id: "ciliegio",
    label: "Ciliegio",
    color: "var(--wood-ciliegio)",
    texV: ciliegioV,
    texH: ciliegioH,
    tone: "dark",
  },
  { id: "rovere", label: "Rovere", color: "var(--wood-rovere)", texV: rovereV, texH: rovereH, tone: "dark" },
];

const MODERN_FINISHES: Finish[] = [
  { id: "tortora", label: "Tortora", color: "var(--tint-tortora)", tone: "light" },
  { id: "bianco", label: "Bianco", color: "var(--tint-bianco)", tone: "light" },
  { id: "grigio-chiaro", label: "Grigio chiaro", color: "var(--tint-grigio-chiaro)", tone: "light" },
  { id: "grigio-scuro", label: "Grigio scuro", color: "var(--tint-grigio-scuro)", tone: "dark" },
  { id: "ocra", label: "Ocra", color: "var(--tint-ocra)", tone: "light" },
  {
    id: "legno-moderno",
    label: "Legno moderno",
    color: "var(--wood-moderno)",
    texV: modernoV,
    texH: modernoH,
    tone: "light",
  },
];

export const STYLES: StyleDef[] = [
  {
    id: "classico",
    label: "Classico",
    description: "Colonne scanalate con capitelli ionici e architrave",
    variants: [
      { id: "ionico", label: "Ionico", description: "Architrave, fregio e cornice a dentelli" },
      { id: "frontone", label: "Con frontone", description: "Timpano triangolare sopra la cornice" },
      { id: "dorato", label: "Ionico dorato", description: "Volute e modanature in foglia d'oro", gilt: true },
    ],
    finishes: WOODS,
  },
  {
    id: "antico",
    label: "Antico",
    description: "Biblioteca d'epoca con intagli e fregi",
    variants: [
      { id: "biblioteca", label: "Biblioteca", description: "Lesene a pannello e fregio a rosette" },
      { id: "tortile", label: "Colonne tortili", description: "Colonne a tortiglione e cimasa ad arco" },
      { id: "intarsiato", label: "Intarsiato", description: "Ovoli e filetti dorati", gilt: true },
    ],
    finishes: WOODS,
  },
  {
    id: "moderno",
    label: "Moderno",
    description: "Linee pulite e tinte unite",
    variants: [
      { id: "cornice", label: "Con cornice", description: "Struttura a giorno con telaio pieno" },
      { id: "minimal", label: "Minimal", description: "Ripiani sottili, fianchi leggeri" },
      { id: "sospese", label: "Mensole sospese", description: "Mensole a muro senza struttura" },
    ],
    finishes: MODERN_FINISHES,
  },
];

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
