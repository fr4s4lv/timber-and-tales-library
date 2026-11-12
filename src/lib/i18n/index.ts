import { useCallback } from "react";
import { getSettings, useSettings } from "@/lib/settings";
import { it, type Dict, type MessageKey } from "./it";
import { LANG_LOCALE, type Lang } from "./languages";
import { en } from "./locales/en";
import { fr } from "./locales/fr";
import { de } from "./locales/de";
import { es } from "./locales/es";
import { pt } from "./locales/pt";
import { nl } from "./locales/nl";
import { sv } from "./locales/sv";
import { ru } from "./locales/ru";
import { zh } from "./locales/zh";
import { ja } from "./locales/ja";

export type { MessageKey } from "./it";

const DICTS: Record<Lang, Partial<Dict>> = { it, en, fr, de, es, pt, nl, sv, ru, zh, ja };

export type Vars = Record<string, string | number>;

export function translate(lang: Lang, key: MessageKey, vars?: Vars): string {
  const raw = DICTS[lang]?.[key] ?? it[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** Non-reactive: for toasts, errors and code outside React. */
export function t(key: MessageKey, vars?: Vars): string {
  return translate(getSettings().language, key, vars);
}

/** Reactive translator: components re-render when the language changes. */
export function useT() {
  const lang = useSettings().language;
  return useCallback((key: MessageKey, vars?: Vars) => translate(lang, key, vars), [lang]);
}

export function useLocale(): string {
  return LANG_LOCALE[useSettings().language];
}

export function currentLocale(): string {
  return LANG_LOCALE[getSettings().language];
}
