import pergamena from "@/assets/paper/pergamena.jpg";
import antica from "@/assets/paper/antica.jpg";
import papiro from "@/assets/paper/papiro.jpg";
import washi from "@/assets/paper/washi.jpg";
import cotone from "@/assets/paper/cotone.jpg";

export const PAPERS = ["bianca", "avorio", "pergamena", "antica", "papiro", "riso", "cotone"] as const;
export type PaperId = (typeof PAPERS)[number];

export interface Paper {
  id: PaperId;
  /** grain image; absent for smooth paper */
  texture?: string;
}

const TEXTURES: Partial<Record<PaperId, string>> = { pergamena, antica, papiro, riso: washi, cotone };

export function getPaper(id: string | undefined): Paper {
  const pid = (PAPERS as readonly string[]).includes(id ?? "") ? (id as PaperId) : "bianca";
  const texture = TEXTURES[pid];
  return texture ? { id: pid, texture } : { id: pid };
}

export function isPaperId(x: unknown): x is PaperId {
  return typeof x === "string" && (PAPERS as readonly string[]).includes(x);
}
