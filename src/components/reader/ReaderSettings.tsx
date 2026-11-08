import { ArrowDownToLine, ArrowRightToLine, Minus, Plus } from "lucide-react";
import type { CSSProperties } from "react";
import { Switch } from "@/components/ui/switch";
import { updateReader, type ReaderFont, type ReaderTheme } from "@/lib/settings";
import { cn } from "@/lib/utils";
import type { ReaderPrefs } from "./types";

const THEMES: { id: ReaderTheme; label: string }[] = [
  { id: "paper", label: "Carta" },
  { id: "sepia", label: "Seppia" },
  { id: "gray", label: "Grigio" },
  { id: "night", label: "Notte" },
];
const FONTS: { id: ReaderFont; label: string; className: string }[] = [
  { id: "original", label: "Originale", className: "font-sans" },
  { id: "literata", label: "Literata", className: "font-reading" },
  { id: "cormorant", label: "Garamond", className: "font-display text-base" },
  { id: "sans", label: "Karla", className: "font-sans" },
];
const SPACING = [
  { v: 1.3, label: "Compatta" },
  { v: 1.5, label: "Normale" },
  { v: 1.8, label: "Ampia" },
];

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{children}</p>;
}

export function ReaderSettings({ prefs, fixedLayout }: { prefs: ReaderPrefs; fixedLayout: boolean }) {
  return (
    <div className="space-y-5">
      <div>
        <Label>Scorrimento</Label>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["paginated", "Pagine", ArrowRightToLine],
              ["scrolled", "Verticale", ArrowDownToLine],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => updateReader({ flow: id })}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-semibold transition",
                prefs.flow === id ? "border-primary bg-accent text-primary" : "hover:bg-muted",
              )}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>
        {fixedLayout ? (
          <p className="mt-1.5 text-xs text-muted-foreground">
            Questo libro ha pagine fisse: in modalità verticale scorrono una sotto l'altra quando possibile.
          </p>
        ) : null}
      </div>

      {!fixedLayout ? (
        <>
          <div>
            <Label>Dimensione testo</Label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Testo più piccolo"
                onClick={() => updateReader({ fontScale: Math.max(70, prefs.fontScale - 10) })}
                className="grid size-10 place-items-center rounded-lg border hover:bg-muted"
              >
                <Minus className="size-4" />
              </button>
              <div className="flex-1 text-center font-display text-xl font-semibold tabular-nums">
                {prefs.fontScale}%
              </div>
              <button
                type="button"
                aria-label="Testo più grande"
                onClick={() => updateReader({ fontScale: Math.min(220, prefs.fontScale + 10) })}
                className="grid size-10 place-items-center rounded-lg border hover:bg-muted"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          <div>
            <Label>Carattere</Label>
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => updateReader({ font: f.id })}
                  className={cn(
                    "rounded-lg border py-2 text-sm transition",
                    f.className,
                    prefs.font === f.id ? "border-primary bg-accent text-primary" : "hover:bg-muted",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Interlinea</Label>
            <div className="grid grid-cols-3 gap-2">
              {SPACING.map((s) => (
                <button
                  key={s.v}
                  type="button"
                  onClick={() => updateReader({ lineHeight: s.v })}
                  className={cn(
                    "rounded-lg border py-2 text-xs font-semibold transition",
                    prefs.lineHeight === s.v ? "border-primary bg-accent text-primary" : "hover:bg-muted",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between text-sm font-semibold">
            Testo giustificato
            <Switch checked={prefs.justify} onCheckedChange={(v) => updateReader({ justify: v })} />
          </label>
        </>
      ) : null}

      <div>
        <Label>Tema</Label>
        <div className="grid grid-cols-4 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => updateReader({ theme: t.id })}
              className="text-center"
              aria-label={`Tema ${t.label}`}
            >
              <span
                className={cn(
                  "theme-dot mx-auto grid size-11 place-items-center rounded-full border-2 font-reading text-base font-semibold",
                  prefs.theme === t.id ? "border-primary ring-2 ring-primary/30" : "border-border",
                )}
                style={{ "--dot-bg": `var(--reader-${t.id}-bg)`, "--dot-fg": `var(--reader-${t.id}-fg)` } as CSSProperties}
              >
                Aa
              </span>
              <span className="mt-1 block text-[11px] text-muted-foreground">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
