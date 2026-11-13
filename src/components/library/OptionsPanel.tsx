import { Check, HardDrive } from "lucide-react";
import type { CSSProperties } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useT } from "@/lib/i18n";
import { LANGS, LANG_NAMES, type Lang } from "@/lib/i18n/languages";
import type { MessageKey } from "@/lib/i18n/it";
import { PAPERS, getPaper, type PaperId } from "@/lib/reader/papers";
import { updateReader, updateSettings, useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function paperSwatchStyle(id: PaperId): CSSProperties {
  const p = getPaper(id);
  return {
    "--sw-bg": `var(--paper-${id}-bg)`,
    "--sw-fg": `var(--paper-${id}-fg)`,
    "--sw-tex": p.texture ? `url(${p.texture})` : "none",
  } as CSSProperties;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{children}</h3>
  );
}

export function OptionsPanel({ open, onOpenChange }: Props) {
  const t = useT();
  const settings = useSettings();
  const setLang = (language: Lang) => updateSettings((s) => ({ ...s, language }));
  const setPaper = (paper: PaperId) => updateReader({ paper, theme: "paper" });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        overlayClassName="bg-foreground/15"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-sm"
      >
        <SheetHeader className="border-b px-5 pt-5 pb-4 text-left">
          <SheetTitle className="font-display text-2xl">{t("options.title")}</SheetTitle>
          <SheetDescription>{t("options.subtitle")}</SheetDescription>
        </SheetHeader>

        <div className="space-y-7 px-5 py-5">
          <section>
            <SectionTitle>{t("options.language")}</SectionTitle>
            <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label={t("options.language")}>
              {LANGS.map((l) => {
                const active = settings.language === l;
                return (
                  <button
                    key={l}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    lang={l}
                    onClick={() => setLang(l)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition",
                      active ? "border-primary bg-accent text-primary" : "hover:bg-muted",
                    )}
                  >
                    <span className="flex-1">{LANG_NAMES[l]}</span>
                    {active ? <Check className="size-4" /> : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <SectionTitle>{t("options.paper")}</SectionTitle>
            <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label={t("options.paper")}>
              {PAPERS.map((id) => {
                const active = settings.reader.paper === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setPaper(id)}
                    className="group text-center"
                  >
                    <span
                      className={cn(
                        "paper-swatch mx-auto grid aspect-[3/4] w-full place-items-center rounded-lg border-2 font-reading text-xl shadow-sm transition",
                        active ? "border-primary ring-2 ring-primary/30" : "border-border group-hover:scale-[1.03]",
                      )}
                      style={paperSwatchStyle(id)}
                    >
                      Aa
                    </span>
                    <span className={cn("mt-1 block text-xs", active ? "font-bold text-primary" : "text-muted-foreground")}>
                      {t(`paper.${id}` as MessageKey)}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{t("options.paperHint")}</p>
          </section>

          <section>
            <SectionTitle>{t("options.storage")}</SectionTitle>
            <p className="flex gap-2 text-sm text-muted-foreground">
              <HardDrive className="mt-0.5 size-4 flex-none" />
              {t("options.storageBody")}
            </p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
