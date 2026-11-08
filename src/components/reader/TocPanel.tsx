import { Bookmark as BookmarkIcon, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Bookmark } from "@/lib/library/types";
import { cn } from "@/lib/utils";
import type { TocEntry } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  tab: "toc" | "bookmarks";
  onTabChange: (t: "toc" | "bookmarks") => void;
  title: string;
  toc: TocEntry[];
  current?: string | number | undefined;
  bookmarks: Bookmark[];
  onSelect: (target: string | number) => void;
  onSelectBookmark: (b: Bookmark) => void;
  onDeleteBookmark: (b: Bookmark) => void;
}

function TocList({
  items,
  depth,
  current,
  onSelect,
}: {
  items: TocEntry[];
  depth: number;
  current?: string | number | undefined;
  onSelect: (t: string | number) => void;
}) {
  return (
    <ul>
      {items.map((it, i) => {
        const active = current !== undefined && it.target === current;
        return (
          <li key={`${depth}-${i}`}>
            <button
              type="button"
              onClick={() => onSelect(it.target)}
              className={cn(
                "flex w-full items-baseline gap-2 rounded-md py-2 pr-2 text-left transition hover:bg-muted",
                depth === 0 ? "font-display text-[1.08rem] font-semibold" : "text-sm",
                active && "bg-accent text-primary",
              )}
              style={{ paddingLeft: 10 + depth * 16 }}
            >
              <span className="flex-1">{it.label}</span>
              {typeof it.target === "number" ? (
                <span className="text-xs tabular-nums text-muted-foreground">{it.target}</span>
              ) : null}
            </button>
            {it.subitems?.length ? (
              <TocList items={it.subitems} depth={depth + 1} current={current} onSelect={onSelect} />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function TocPanel(p: Props) {
  return (
    <Sheet open={p.open} onOpenChange={p.onOpenChange}>
      <SheetContent side="left" className="flex w-[88vw] flex-col gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="border-b px-5 pt-5 pb-3 text-left">
          <SheetTitle className="line-clamp-2 pr-6 font-display text-xl leading-tight">{p.title}</SheetTitle>
          <SheetDescription className="sr-only">Indice e segnalibri del libro</SheetDescription>
        </SheetHeader>
        <Tabs
          value={p.tab}
          onValueChange={(v) => p.onTabChange(v as "toc" | "bookmarks")}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="mx-5 mt-3 grid grid-cols-2">
            <TabsTrigger value="toc">Indice</TabsTrigger>
            <TabsTrigger value="bookmarks">Segnalibri ({p.bookmarks.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="toc" className="min-h-0 flex-1 overflow-y-auto px-3 pb-8">
            {p.toc.length ? (
              <TocList items={p.toc} depth={0} current={p.current} onSelect={p.onSelect} />
            ) : (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">Questo libro non ha un indice.</p>
            )}
          </TabsContent>
          <TabsContent value="bookmarks" className="min-h-0 flex-1 overflow-y-auto px-3 pb-8">
            {p.bookmarks.length ? (
              <ul className="space-y-1">
                {[...p.bookmarks]
                  .sort((a, b) => a.fraction - b.fraction)
                  .map((b) => (
                    <li key={b.id} className="group flex items-start gap-2 rounded-md hover:bg-muted">
                      <button type="button" onClick={() => p.onSelectBookmark(b)} className="flex flex-1 gap-3 py-2.5 pl-2 text-left">
                        <BookmarkIcon className="mt-0.5 size-4 flex-none fill-primary text-primary" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{b.label}</span>
                          {b.excerpt ? (
                            <span className="mt-0.5 line-clamp-2 block font-reading text-xs text-muted-foreground italic">
                              «{b.excerpt}»
                            </span>
                          ) : null}
                          <span className="mt-1 block text-[11px] text-muted-foreground">
                            {Math.round(b.fraction * 100)}% ·{" "}
                            {new Date(b.createdAt).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => p.onDeleteBookmark(b)}
                        aria-label="Elimina segnalibro"
                        className="mt-2 mr-1 grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-background hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
              </ul>
            ) : (
              <div className="px-4 py-10 text-center">
                <BookmarkIcon className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Nessun segnalibro. Tocca il nastro in alto a destra per segnare la pagina.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
