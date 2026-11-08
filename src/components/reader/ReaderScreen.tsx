import { useNavigate } from "@tanstack/react-router";
import { Bookmark as BookmarkIcon, ChevronLeft, List, Loader2, Type } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { getBookFile } from "@/lib/library/db";
import { getBookSync, initLibrary, updateBook, useLibrary } from "@/lib/library/store";
import type { Bookmark } from "@/lib/library/types";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { ReaderSettings } from "./ReaderSettings";
import { TocPanel } from "./TocPanel";
import type { EngineReady, Location, ReaderHandle, TapZone } from "./types";

const FoliateView = lazy(() => import("./FoliateView"));
const PdfView = lazy(() => import("./PdfView"));

export function ReaderScreen({ bookId }: { bookId: string }) {
  const navigate = useNavigate();
  const { books, ready } = useLibrary();
  const book = books.find((b) => b.id === bookId);
  const prefs = useSettings().reader;

  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [engine, setEngine] = useState<EngineReady | null>(null);
  const [loc, setLoc] = useState<Location | null>(null);
  const [chrome, setChrome] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [tab, setTab] = useState<"toc" | "bookmarks">("toc");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scrub, setScrub] = useState<number | null>(null);
  const handle = useRef<ReaderHandle | null>(null);
  const [initial] = useState(() => getBookSync(bookId)?.progress);
  const initialRef = useRef(initial);

  useEffect(() => {
    let alive = true;
    (async () => {
      await initLibrary();
      const meta = getBookSync(bookId);
      if (!meta) return alive && setError("Questo libro non è più nella tua libreria.");
      initialRef.current = meta.progress;
      const file = await getBookFile(bookId);
      if (!alive) return;
      if (!file) return setError("Il file di questo libro non si trova più su questo dispositivo.");
      setBlob(file);
      void updateBook(bookId, { lastOpenedAt: Date.now() });
    })();
    return () => {
      alive = false;
    };
  }, [bookId]);

  // hide chrome a moment after opening, like a real book
  useEffect(() => {
    if (!engine) return;
    const t = setTimeout(() => setChrome(false), 2200);
    return () => clearTimeout(t);
  }, [engine]);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRelocate = useCallback(
    (l: Location) => {
      setLoc(l);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void updateBook(bookId, {
          progress: { fraction: l.fraction, cfi: l.cfi, page: l.page, label: l.label },
        });
      }, 400);
    },
    [bookId],
  );

  const onTap = useCallback((z: TapZone) => {
    if (z === "left") handle.current?.prev();
    else if (z === "right") handle.current?.next();
    else setChrome((c) => !c);
  }, []);

  const goBack = () => void navigate({ to: "/", viewTransition: true });

  const bookmarks = book?.bookmarks ?? [];
  const current = loc ? bookmarks.find((b) => loc.contains(b)) : undefined;

  const toggleBookmark = async () => {
    if (!loc) return;
    if (current) {
      await updateBook(bookId, (b) => ({ bookmarks: b.bookmarks.filter((x) => x.id !== current.id) }));
      toast("Segnalibro rimosso");
      return;
    }
    const excerpt = await handle.current?.excerpt().catch(() => "");
    const bm: Bookmark = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      label: loc.page ? `Pagina ${loc.page}` : loc.label || `Posizione ${Math.round(loc.fraction * 100)}%`,
      excerpt: excerpt || undefined,
      fraction: loc.fraction,
      cfi: loc.cfi,
      page: loc.page,
    };
    await updateBook(bookId, (b) => ({ bookmarks: [...b.bookmarks, bm] }));
    toast.success("Pagina segnata");
  };

  const pct = Math.round((loc?.fraction ?? 0) * 100);
  const sliderMax = loc?.totalPages ? loc.totalPages : 1000;
  const sliderValue = scrub ?? (loc?.totalPages ? (loc.page ?? 1) : (loc?.fraction ?? 0) * 1000);

  if (ready && !book && !error) {
    return <ReaderMessage message="Questo libro non è più nella tua libreria." onBack={goBack} />;
  }
  if (error) return <ReaderMessage message={error} onBack={goBack} />;

  const Engine = book?.engine === "pdf" ? PdfView : FoliateView;

  return (
    <div className="reader fixed inset-0 overflow-hidden" data-theme={prefs.theme}>
      <div className="absolute inset-0">
        {blob && book ? (
          <Suspense fallback={null}>
            <Engine
              blob={blob}
              fileName={book.fileName}
              initial={initialRef.current}
              prefs={prefs}
              handleRef={handle}
              onReady={setEngine}
              onRelocate={onRelocate}
              onTap={onTap}
              onError={setError}
            />
          </Suspense>
        ) : null}
      </div>

      {!engine ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="flex flex-col items-center gap-3 opacity-70">
            <Loader2 className="size-6 animate-spin" />
            <p className="font-display text-lg">{book?.title ?? "Apertura…"}</p>
          </div>
        </div>
      ) : null}

      {/* top bar */}
      <header
        className={cn(
          "reader-bar safe-top absolute inset-x-0 top-0 z-20 border-b",
          chrome ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0",
        )}
      >
        <div className="flex h-14 items-center gap-1 px-2">
          <button type="button" className="reader-btn pr-3" onClick={goBack} aria-label="Torna alla libreria">
            <ChevronLeft className="size-5" />
            <span className="hidden text-sm font-semibold sm:inline">Libreria</span>
          </button>
          <button
            type="button"
            className="reader-btn"
            aria-label="Indice"
            onClick={() => {
              setTab("toc");
              setPanelOpen(true);
            }}
          >
            <List className="size-5" />
          </button>
          <div className="min-w-0 flex-1 px-2 text-center">
            <p className="truncate font-display text-lg font-semibold leading-tight">{book?.title}</p>
            {book?.author ? <p className="truncate text-[11px] opacity-60">{book.author}</p> : null}
          </div>
          <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
            <PopoverTrigger className="reader-btn" aria-label="Impostazioni di lettura">
              <Type className="size-5" />
            </PopoverTrigger>
            <PopoverContent align="end" className="max-h-[75vh] w-80 overflow-y-auto">
              <ReaderSettings prefs={prefs} fixedLayout={!!engine?.fixedLayout} />
            </PopoverContent>
          </Popover>
          <button
            type="button"
            className="reader-btn"
            onClick={() => void toggleBookmark()}
            aria-label={current ? "Rimuovi segnalibro" : "Aggiungi segnalibro"}
            aria-pressed={!!current}
          >
            <BookmarkIcon className={cn("size-5", current && "bookmark-ribbon fill-current")} />
          </button>
        </div>
      </header>

      {/* ribbon visible even when chrome is hidden */}
      {current && !chrome ? (
        <BookmarkIcon className="bookmark-ribbon pointer-events-none absolute top-0 right-5 z-10 size-7 fill-current" />
      ) : null}

      {/* bottom bar */}
      <footer
        className={cn(
          "reader-bar safe-bottom absolute inset-x-0 bottom-0 z-20 border-t",
          chrome ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0",
        )}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-5 pt-3 pb-3">
          <Slider
            min={loc?.totalPages ? 1 : 0}
            max={sliderMax}
            step={1}
            value={[sliderValue]}
            onValueChange={([v]) => setScrub(v)}
            onValueCommit={([v]) => {
              setScrub(null);
              if (loc?.totalPages) handle.current?.goTo(v);
              else handle.current?.goToFraction(v / 1000);
            }}
            aria-label="Posizione nel libro"
          />
          <div className="flex items-center justify-between gap-3 text-xs opacity-75">
            <span className="truncate">{loc?.page ? (loc.label ?? "") : (loc?.label ?? "")}</span>
            <span className="flex-none tabular-nums">
              {scrub != null
                ? loc?.totalPages
                  ? `Pagina ${scrub}`
                  : `${Math.round(scrub / 10)}%`
                : loc?.totalPages
                  ? `${pct}%`
                  : `${pct}% letto`}
            </span>
          </div>
        </div>
      </footer>

      <TocPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        tab={tab}
        onTabChange={setTab}
        title={book?.title ?? ""}
        toc={engine?.toc ?? []}
        current={loc?.page ?? loc?.tocTarget}
        bookmarks={bookmarks}
        onSelect={(t) => {
          handle.current?.goTo(t);
          setPanelOpen(false);
          setChrome(false);
        }}
        onSelectBookmark={(b) => {
          if (b.page) handle.current?.goTo(b.page);
          else if (b.cfi) handle.current?.goTo(b.cfi);
          else handle.current?.goToFraction(b.fraction);
          setPanelOpen(false);
          setChrome(false);
        }}
        onDeleteBookmark={(b) =>
          void updateBook(bookId, (m) => ({ bookmarks: m.bookmarks.filter((x) => x.id !== b.id) }))
        }
      />
    </div>
  );
}

function ReaderMessage({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="reader fixed inset-0 grid place-items-center px-6" data-theme="paper">
      <div className="max-w-sm text-center">
        <p className="font-display text-2xl font-semibold">{message}</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground"
        >
          <ChevronLeft className="size-4" /> Torna alla libreria
        </button>
      </div>
    </div>
  );
}
