import { BookOpen, Check, Heart, Library, Pencil, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useT } from "@/lib/i18n";
import {
  collectionCount,
  createCollection,
  deleteCollection,
  renameCollection,
  useCollections,
} from "@/lib/library/collections";
import type { BookMeta } from "@/lib/library/types";
import { cn } from "@/lib/utils";

export type LibraryFilter = "all" | "reading" | "favorites" | `col:${string}`;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  books: BookMeta[];
  filter: LibraryFilter;
  onSelect: (f: LibraryFilter) => void;
}

export function isReading(b: BookMeta) {
  const f = b.progress?.fraction ?? 0;
  return f > 0 && f < 0.995;
}

export function CollectionsPanel({ open, onOpenChange, books, filter, onSelect }: Props) {
  const t = useT();
  const collections = useCollections();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const ids = useMemo(() => new Set(books.map((b) => b.id)), [books]);

  const countLabel = (n: number) => (n === 1 ? t("collections.countOne") : t("collections.count", { n }));
  const pick = (f: LibraryFilter) => {
    onSelect(f);
    onOpenChange(false);
  };

  const builtIns: { id: LibraryFilter; label: string; n: number; Icon: typeof Library }[] = [
    { id: "all", label: t("collections.allBooks"), n: books.length, Icon: Library },
    { id: "reading", label: t("library.filter.reading"), n: books.filter(isReading).length, Icon: BookOpen },
    { id: "favorites", label: t("library.filter.favorites"), n: books.filter((b) => b.favorite).length, Icon: Heart },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" overlayClassName="bg-foreground/15" className="flex w-[88vw] flex-col gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="border-b px-5 pt-5 pb-4 text-left">
          <SheetTitle className="font-display text-2xl">{t("collections.title")}</SheetTitle>
          <SheetDescription>{t("collections.description")}</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {builtIns.map(({ id, label, n, Icon }) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => pick(id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-muted",
                    filter === id && "bg-accent text-primary",
                  )}
                >
                  <Icon className="size-4 opacity-70" />
                  <span className="flex-1 font-semibold">{label}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{n}</span>
                </button>
              </li>
            ))}
          </ul>

          <section>
            <h3 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {t("collections.mine")}
            </h3>
            {collections.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">{t("collections.none")}</p>
            ) : (
              <ul className="space-y-0.5">
                {collections.map((c) => {
                  const f = `col:${c.id}` as const;
                  if (editingId === c.id) {
                    return (
                      <li key={c.id}>
                        <form
                          className="flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1.5"
                          onSubmit={(e) => {
                            e.preventDefault();
                            renameCollection(c.id, editName);
                            setEditingId(null);
                          }}
                        >
                          <input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            aria-label={t("common.rename")}
                            className="h-9 min-w-0 flex-1 rounded-md border bg-card px-2 text-base outline-none focus:border-primary"
                          />
                          <button type="submit" className="grid size-9 place-items-center rounded-md text-primary hover:bg-accent" aria-label={t("common.save")}>
                            <Check className="size-4" />
                          </button>
                          <button
                            type="button"
                            className="grid size-9 place-items-center rounded-md hover:bg-accent"
                            onClick={() => setEditingId(null)}
                            aria-label={t("common.cancel")}
                          >
                            <X className="size-4" />
                          </button>
                        </form>
                      </li>
                    );
                  }
                  return (
                    <li key={c.id} className="group flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => pick(f)}
                        className={cn(
                          "flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-muted",
                          filter === f && "bg-accent text-primary",
                        )}
                      >
                        <span className="grid size-4 place-items-center">
                          <span className="block h-3.5 w-2.5 rounded-[1px] bg-primary/70 shadow-sm" />
                        </span>
                        <span className="min-w-0 flex-1 truncate font-semibold">{c.name}</span>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {countLabel(collectionCount(c, ids))}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="grid size-9 flex-none place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                        onClick={() => {
                          setEditingId(c.id);
                          setEditName(c.name);
                        }}
                        aria-label={`${t("common.rename")} ${c.name}`}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        className="grid size-9 flex-none place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                        onClick={() => {
                          if (window.confirm(t("collections.confirmDelete", { name: c.name }))) {
                            deleteCollection(c.id);
                            if (filter === f) onSelect("all");
                          }
                        }}
                        aria-label={`${t("common.delete")} ${c.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <form
              className="mt-3 flex items-center gap-2 px-1"
              onSubmit={(e) => {
                e.preventDefault();
                const c = createCollection(name);
                if (c) setName("");
              }}
            >
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("collections.namePlaceholder")}
                aria-label={t("collections.new")}
                className="h-10 min-w-0 flex-1 rounded-lg border bg-card px-3 text-base outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={!name.trim()}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
              >
                <Plus className="size-4" /> {t("collections.create")}
              </button>
            </form>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
