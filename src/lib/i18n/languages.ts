export const LANGS = ["it", "en", "fr", "de", "es", "pt", "nl", "sv", "ru", "zh", "ja"] as const;
export type Lang = (typeof LANGS)[number];

/** Each language written in itself, so anyone can find their own. */
export const LANG_NAMES: Record<Lang, string> = {
  it: "Italiano",
  en: "English",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  pt: "Português",
  nl: "Nederlands",
  sv: "Svenska",
  ru: "Русский",
  zh: "中文",
  ja: "日本語",
};

/** BCP-47 tag used for sorting, dates and the page `lang` attribute. */
export const LANG_LOCALE: Record<Lang, string> = {
  it: "it-IT",
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
  pt: "pt-PT",
  nl: "nl-NL",
  sv: "sv-SE",
  ru: "ru-RU",
  zh: "zh-CN",
  ja: "ja-JP",
};

export function isLang(x: unknown): x is Lang {
  return typeof x === "string" && (LANGS as readonly string[]).includes(x);
}

export function browserLang(): Lang {
  if (typeof navigator === "undefined") return "it";
  for (const l of navigator.languages ?? [navigator.language]) {
    const base = l?.slice(0, 2).toLowerCase();
    if (isLang(base)) return base;
  }
  return "it";
}
