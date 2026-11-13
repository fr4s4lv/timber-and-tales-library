import { Check, Smartphone, Tablet } from "lucide-react";
import type { CSSProperties } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import {
  STYLES,
  finishCssVars,
  finishLabelKey,
  getFinish,
  getStyle,
  getVariant,
  styleDescKey,
  styleLabelKey,
  variantDescKey,
  variantLabelKey,
  type ShelfStyle,
} from "@/lib/bookcase/catalog";
import { useT } from "@/lib/i18n";
import { BOOKS_PER_SHELF_RANGE, type DeviceClass } from "@/lib/bookcase/shelf";
import { updateSettings, useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  device: DeviceClass;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{children}</h3>
  );
}

export function StylePanel({ open, onOpenChange, device }: Props) {
  const settings = useSettings();
  const t = useT();
  const styleDef = getStyle(settings.style);
  const variant = getVariant(settings.style, settings.variant[settings.style]);
  const finish = getFinish(settings.style, settings.finish[settings.style]);

  const setStyle = (style: ShelfStyle) => updateSettings((s) => ({ ...s, style }));
  const setVariant = (id: string) =>
    updateSettings((s) => ({ ...s, variant: { ...s.variant, [s.style]: id } }));
  const setFinish = (id: string) => updateSettings((s) => ({ ...s, finish: { ...s.finish, [s.style]: id } }));
  const setPerShelf = (d: DeviceClass, n: number) =>
    updateSettings((s) => ({ ...s, booksPerShelf: { ...s.booksPerShelf, [d]: n } }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        overlayClassName="bg-foreground/15"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-sm"
      >
        <SheetHeader className="border-b px-5 pt-5 pb-4 text-left">
          <SheetTitle className="font-display text-2xl">{t("style.title")}</SheetTitle>
          <SheetDescription>{t("style.subtitle")}</SheetDescription>
        </SheetHeader>

        <div className="space-y-7 px-5 py-5">
          <section>
            <SectionTitle>{t("style.section.style")}</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {STYLES.map((s) => {
                const f = getFinish(s.id, settings.finish[s.id]);
                const active = s.id === settings.style;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id)}
                    className={cn(
                      "overflow-hidden rounded-lg border-2 text-left transition",
                      active ? "border-primary shadow-md" : "border-transparent hover:border-border",
                    )}
                  >
                    <div className="swatch h-14" style={finishCssVars(f) as CSSProperties} />
                    <div className="bg-card px-2 py-1.5">
                      <p className="font-display text-base font-semibold leading-none">{t(styleLabelKey(s.id))}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t(styleDescKey(styleDef.id))}</p>
          </section>

          <section>
            <SectionTitle>{t("style.section.variant")}</SectionTitle>
            <div className="space-y-1.5">
              {styleDef.variants.map((v) => {
                const active = v.id === variant.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVariant(v.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition",
                      active ? "border-primary bg-accent" : "hover:bg-muted",
                    )}
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{t(variantLabelKey(v.id))}</p>
                      <p className="text-xs text-muted-foreground">{t(variantDescKey(v.id))}</p>
                    </div>
                    {active ? <Check className="size-4 text-primary" /> : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <SectionTitle>{settings.style === "moderno" ? t("style.section.finish") : t("style.section.wood")}</SectionTitle>
            <div className="grid grid-cols-3 gap-3">
              {styleDef.finishes.map((f) => {
                const active = f.id === finish.id;
                return (
                  <button key={f.id} type="button" onClick={() => setFinish(f.id)} className="group text-center">
                    <div
                      className={cn(
                        "swatch mx-auto aspect-square w-full rounded-xl border-2 shadow-sm transition",
                        active ? "border-primary ring-2 ring-primary/30" : "border-border group-hover:scale-[1.03]",
                      )}
                      style={finishCssVars(f) as CSSProperties}
                    />
                    <p className={cn("mt-1 text-xs", active ? "font-bold text-primary" : "text-muted-foreground")}>
                      {t(finishLabelKey(f.id))}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <SectionTitle>{t("style.section.perShelf")}</SectionTitle>
            <div className="space-y-4">
              {(["phone", "tablet"] as DeviceClass[]).map((d) => {
                const r = BOOKS_PER_SHELF_RANGE[d];
                const value = settings.booksPerShelf[d];
                const Icon = d === "phone" ? Smartphone : Tablet;
                return (
                  <div
                    key={d}
                    className={cn("rounded-lg border px-3 py-3", d === device ? "border-primary bg-accent/60" : "")}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <Icon className="size-4 text-muted-foreground" />
                      <p className="flex-1 text-sm font-semibold">
                        {d === "phone" ? t("style.onPhone") : t("style.onTablet")}
                        {d === device ? (
                          <span className="ml-2 text-xs font-normal text-primary">{t("common.thisDevice")}</span>
                        ) : null}
                      </p>
                      <span className="font-display text-2xl font-semibold tabular-nums leading-none">{value}</span>
                    </div>
                    <Slider
                      min={r.min}
                      max={r.max}
                      step={1}
                      value={[value]}
                      onValueChange={([n]) => setPerShelf(d, n ?? value)}
                      aria-label={d === "phone" ? t("style.perShelfPhoneAria") : t("style.perShelfTabletAria")}
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                      <span>{r.min}</span>
                      <span>{r.max}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
