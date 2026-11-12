// Reading typefaces. Google families are fetched only when the font is used.
export interface ReadingFont {
  id: string;
  label: string;
  stack: string;
  /** Google Fonts css2 family spec, e.g. "Lora:ital,wght@0,400;0,600;1,400" */
  google?: string;
  kind: "serif" | "sans" | "mono" | "original";
}

export const READING_FONTS: ReadingFont[] = [
  { id: "original", label: "", stack: "", kind: "original" },
  { id: "literata", label: "Literata", stack: "'Literata', Georgia, serif", google: "Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400", kind: "serif" },
  { id: "garamond", label: "EB Garamond", stack: "'EB Garamond', Garamond, Georgia, serif", google: "EB+Garamond:ital,wght@0,400;0,600;1,400", kind: "serif" },
  { id: "cormorant", label: "Cormorant", stack: "'Cormorant Garamond', Georgia, serif", google: "Cormorant+Garamond:ital,wght@0,500;0,600;1,500", kind: "serif" },
  { id: "baskerville", label: "Baskerville", stack: "'Libre Baskerville', Baskerville, Georgia, serif", google: "Libre+Baskerville:ital,wght@0,400;0,700;1,400", kind: "serif" },
  { id: "crimson", label: "Crimson Pro", stack: "'Crimson Pro', Georgia, serif", google: "Crimson+Pro:ital,wght@0,400;0,600;1,400", kind: "serif" },
  { id: "lora", label: "Lora", stack: "'Lora', Georgia, serif", google: "Lora:ital,wght@0,400;0,600;1,400", kind: "serif" },
  { id: "merriweather", label: "Merriweather", stack: "'Merriweather', Georgia, serif", google: "Merriweather:ital,wght@0,400;0,700;1,400", kind: "serif" },
  { id: "spectral", label: "Spectral", stack: "'Spectral', Georgia, serif", google: "Spectral:ital,wght@0,400;0,600;1,400", kind: "serif" },
  { id: "alegreya", label: "Alegreya", stack: "'Alegreya', Georgia, serif", google: "Alegreya:ital,wght@0,400;0,600;1,400", kind: "serif" },
  { id: "ptserif", label: "PT Serif", stack: "'PT Serif', Georgia, serif", google: "PT+Serif:ital,wght@0,400;0,700;1,400", kind: "serif" },
  { id: "sourceserif", label: "Source Serif", stack: "'Source Serif 4', Georgia, serif", google: "Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400", kind: "serif" },
  { id: "georgia", label: "Georgia", stack: "Georgia, 'Times New Roman', serif", kind: "serif" },
  { id: "palatino", label: "Palatino", stack: "Palatino, 'Palatino Linotype', 'Book Antiqua', serif", kind: "serif" },
  { id: "iowan", label: "Iowan", stack: "'Iowan Old Style', 'Palatino Linotype', Georgia, serif", kind: "serif" },
  { id: "sans", label: "Karla", stack: "'Karla', system-ui, sans-serif", google: "Karla:ital,wght@0,400;0,600;1,400", kind: "sans" },
  { id: "system", label: "San Francisco", stack: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', system-ui, sans-serif", kind: "sans" },
  { id: "atkinson", label: "Atkinson", stack: "'Atkinson Hyperlegible', system-ui, sans-serif", google: "Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400", kind: "sans" },
  { id: "lexend", label: "Lexend", stack: "'Lexend', system-ui, sans-serif", google: "Lexend:wght@300;400;600", kind: "sans" },
  { id: "nunito", label: "Nunito", stack: "'Nunito', system-ui, sans-serif", google: "Nunito:ital,wght@0,400;0,600;1,400", kind: "sans" },
  { id: "mono", label: "IBM Plex Mono", stack: "'IBM Plex Mono', ui-monospace, monospace", google: "IBM+Plex+Mono:ital,wght@0,400;0,600;1,400", kind: "mono" },
];

export function getReadingFont(id: string | undefined): ReadingFont {
  return READING_FONTS.find((f) => f.id === id) ?? READING_FONTS[0]!;
}

export function googleFontsHref(families: (string | undefined)[]): string | null {
  const list = families.filter(Boolean) as string[];
  if (!list.length) return null;
  return `https://fonts.googleapis.com/css2?${list.map((f) => `family=${f}`).join("&")}&display=swap`;
}

/** One stylesheet for previews in the settings panel. */
export const ALL_READING_FONTS_HREF = googleFontsHref(READING_FONTS.map((f) => f.google))!;

export const FONT_SCALE = { min: 50, max: 300, step: 5 } as const;
export const LINE_HEIGHT = { min: 1, max: 2.4, step: 0.1 } as const;
export const SIDE_MARGIN = { min: 0, max: 14, step: 1 } as const;
