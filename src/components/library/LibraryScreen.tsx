import { useNavigate } from "@tanstack/react-router";
import { ArrowDownUp, Check, Paintbrush, Pencil, Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { Bookcase } from "@/components/bookcase/Bookcase";
import { Shelves } from "@/components/bookcase/Shelves";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeviceClass } from "@/hooks/use-device-class";
import { finishCssVars, getFinish, getVariant } from "@/lib/bookcase/catalog";
import { ACCEPT_ATTR, SUPPORTED_LABELS } from "@/lib/library/formats";
import { removeBook, updateBook, useLibrary } from "@/lib/library/store";
import type { BookMeta } from "@/lib/library/types";
import { useSettings } from "@/lib/settings";
import { StylePanel } from "./StylePanel";

type Filter = "all" | "favorites" | "reading";
type Sort = "recent" | "title" | "author" | "added";

export function LibraryScreen() {
  const navigate = useNavigate();
  const settings = useSettings();
  const { books, ready } = useLibrary();
  const device = useDeviceClass();
  const perShelf = settings.booksPerShelf[device];
  const variant = getVariant(settings.style, settings.variant[settings.style]);
  const finish = getFinish(settings.style, settings.finish[settings.style]);

  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [editing, setEditing] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [minRows, setMinRows] = useState(4);
  const fileInput = useRef<HTMLInputElement>(null);
  const interiorRef = useRef<HTMLDivElement>(null);

  // fill the visible bookcase with shelves, like the first iBooks
  useEffect(() => {
    const el = interiorRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const pad = w >= 600 ? 56 : 28;
      const gap = w >= 600 ? 22 : 14;
      const cell = (w - pad - gap * (perShelf - 1)) / perShelf;
      const rowH = cell * 1.5 + (w >= 600 ? 68 : 50);
      setMinRows(Math.max(2, Math.ceil(h / Math.max(60, rowH))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [perShelf]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = books.filter((b) => {
      if (filter === "favorites" && !b.favorite) return false;
      if (filter === "reading" && !((b.progress?.fraction ?? 0) > 0 && (b.progress?.fraction ?? 0) < 0.995))
        return false;
      if (q && !`${b.title} ${b.author}`.toLowerCase().includes(q)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title, "it");
      if (sort === "author") return (a.author || "~").localeCompare(b.author || "~", "it");
      if (sort === "added") return b.addedAt - a.addedAt;
      return (b.lastOpenedAt ?? b.addedAt) - (a.lastOpenedAt ?? a.addedAt);
    });
    return list;
  }, [books, filter, sort, query]);

  const runImport = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const id = toast.loading(files.length === 1 ? `Importo ${files[0]?.name ?? "file"}…` : `Importo ${files.length} file…`);
    const { importFiles } = await import("@/lib/library/import");
    const res = await importFiles(files, (done, total, name) => {
      if (total > 1 && name) toast.loading(`Importo ${done + 1} di ${total}: ${name}`, { id });
    });
    toast.dismiss(id);
    if (res.imported.length) {
      toast.success(
        res.imported.length === 1
          ? `«${res.imported[0]?.title}» è sullo scaffale`
          : `${res.imported.length} libri aggiunti alla libreria`,
      );
    }
    for (const f of res.failed) {
      toast.error(`Non importato: ${f.name}`, { description: f.reason, duration: 9000 });
    }
  }, []);

  const openBook = (b: BookMeta) => {
    void navigate({ to: "/leggi/$bookId", params: { bookId: b.id }, viewTransition: true });
  };
  const toggleFavorite = (b: BookMeta) => void updateBook(b.id, { favorite: !b.favorite });
  const deleteBook = (b: BookMeta) => {
    if (window.confirm(`Eliminare «${b.title}» dalla libreria? Il file verrà rimosso da questo dispositivo.`)) {
      void removeBook(b.id);
      toast(`«${b.title}» eliminato`);
    }
  };

  const shellVars = finishCssVars(finish) as CSSProperties;
  const empty = ready && books.length === 0;
  const noMatches = ready && books.length > 0 && visible.length === 0;

  return (
    <div
      className="bookcase-shell fixed inset-0 flex flex-col"
      data-tone={finish.tone}
      style={shellVars}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void runImport(Array.from(e.dataTransfer.files));
      }}
    >
      <header className="toolbar-surface safe-top relative z-20 flex-none">
        <div className="flex h-14 items-center gap-2 px-3 sm:px-5">
          {searching ? (
            <div className="flex flex-1 items-center gap-2">
              <Search className="size-4 opacity-70" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cerca titolo o autore"
                className="h-9 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:opacity-60"
              />
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => {
                  setQuery("");
                  setSearching(false);
                }}
                aria-label="Chiudi ricerca"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <>
              <h1 className="flex-1 truncate font-display text-[1.65rem] font-semibold tracking-wide">
                Librarium
              </h1>
              <button type="button" className="toolbar-btn" onClick={() => setSearching(true)} aria-label="Cerca">
                <Search className="size-4" />
              </button>
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => setStyleOpen(true)}
                aria-label="Stile della libreria"
              >
                <Paintbrush className="size-4" />
                <span className="hidden sm:inline">Stile</span>
              </button>
              {books.length > 0 ? (
                <button
                  type="button"
                  className="toolbar-btn"
                  data-active={editing}
                  onClick={() => setEditing((e) => !e)}
                  aria-label={editing ? "Fine modifica" : "Modifica"}
                >
                  {editing ? <Check className="size-4" /> : <Pencil className="size-4" />}
                  <span className="hidden sm:inline">{editing ? "Fine" : "Modifica"}</span>
                </button>
              ) : null}
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => fileInput.current?.click()}
                aria-label="Importa libri"
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">Importa</span>
              </button>
            </>
          )}
        </div>
        {books.length > 0 ? (
          <div className="flex items-center justify-between gap-2 px-3 pb-2.5 sm:px-5">
            <div className="segmented" role="tablist">
              {(
                [
                  ["all", "Tutti"],
                  ["reading", "In lettura"],
                  ["favorites", "Preferiti"],
                ] as [Filter, string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={filter === id}
                  data-active={filter === id}
                  onClick={() => setFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="toolbar-btn" aria-label="Ordina">
                <ArrowDownUp className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ordina per</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sort} onValueChange={(v) => setSort(v as Sort)}>
                  <DropdownMenuRadioItem value="recent">Letti di recente</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="added">Aggiunti di recente</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="title">Titolo</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="author">Autore</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </header>

      <Bookcase ref={interiorRef} style={settings.style} variant={variant} finish={finish}>
        <Shelves
          books={visible}
          perShelf={perShelf}
          minRows={minRows}
          editing={editing}
          onOpen={openBook}
          onToggleFavorite={toggleFavorite}
          onDelete={deleteBook}
        />
      </Bookcase>

      {empty ? (
        <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center px-6">
          <div className="plaque pointer-events-auto w-full max-w-sm px-6 py-6 text-center">
            <div className="mb-3 flex justify-between">
              <span className="plaque-screw" />
              <span className="plaque-screw" />
            </div>
            <h2 className="font-display text-3xl font-semibold">La tua libreria è vuota</h2>
            <p className="mt-2 text-sm opacity-80">
              Importa i tuoi ebook: restano solo su questo dispositivo. Puoi anche trascinarli qui.
            </p>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground shadow-lg transition hover:brightness-110"
            >
              <Plus className="size-4" /> Importa libri
            </button>
            <p className="mt-4 text-[11px] leading-relaxed opacity-70">{SUPPORTED_LABELS.join(" · ")}</p>
            <div className="mt-3 flex justify-between">
              <span className="plaque-screw" />
              <span className="plaque-screw" />
            </div>
          </div>
        </div>
      ) : null}

      {noMatches ? (
        <div className="pointer-events-none absolute inset-x-0 top-40 z-30 grid place-items-center px-6">
          <div className="plaque px-5 py-3 text-center text-sm font-semibold">
            {query ? `Nessun libro per «${query}»` : filter === "favorites" ? "Nessun preferito" : "Nessun libro in lettura"}
          </div>
        </div>
      ) : null}

      {dragging ? (
        <div className="pointer-events-none absolute inset-3 z-40 grid place-items-center rounded-2xl border-4 border-dashed border-gilt bg-chrome/60">
          <p className="font-display text-3xl font-semibold text-chrome-foreground">Rilascia per importare</p>
        </div>
      ) : null}

      <input
        ref={fileInput}
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          void runImport(files);
        }}
      />
      <StylePanel open={styleOpen} onOpenChange={setStyleOpen} device={device} />
    </div>
  );
}
