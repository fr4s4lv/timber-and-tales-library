import { useEffect, useRef } from "react";
import { readerColors, type EngineProps, type ReaderPrefs, type TocEntry } from "./types";

const FONT_STACK: Record<Exclude<ReaderPrefs["font"], "original">, string> = {
  literata: "'Literata', Georgia, serif",
  cormorant: "'Cormorant Garamond', Georgia, serif",
  sans: "'Karla', system-ui, sans-serif",
};

function buildCss(prefs: ReaderPrefs) {
  const c = readerColors(prefs.theme);
  const font = prefs.font !== "original" ? FONT_STACK[prefs.font] : null;
  return `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Karla:wght@400;600&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400&display=swap');
@namespace epub "http://www.idpf.org/2007/ops";
html { color-scheme: ${c.dark ? "dark" : "light"}; font-size: ${prefs.fontScale}% !important; }
html, body { background: ${c.bg} !important; color: ${c.fg} !important; }
${prefs.theme !== "paper" ? `body *:not(img):not(svg):not(svg *) { color: inherit !important; background-color: transparent !important; }` : ""}
${font ? `body, body p, body div, body span, body li, body blockquote, body td, body h1, body h2, body h3, body h4, body h5, body h6 { font-family: ${font} !important; }` : ""}
p, li, blockquote, dd {
  line-height: ${prefs.lineHeight} !important;
  text-align: ${prefs.justify ? "justify" : "start"};
  -webkit-hyphens: auto; hyphens: auto;
  widows: 2; orphans: 2;
}
[align="left"] { text-align: left; } [align="right"] { text-align: right; } [align="center"] { text-align: center; }
a:link, a:visited { color: ${c.link} !important; }
img, svg, video { max-width: 100%; }
${c.dark ? "img { filter: brightness(0.88); }" : ""}
pre { white-space: pre-wrap !important; }
aside[epub|type~="endnote"], aside[epub|type~="footnote"], aside[epub|type~="note"], aside[epub|type~="rearnote"] { display: none; }
`;
}

type FoliateViewEl = HTMLElement & {
  book: FoliateBook;
  isFixedLayout: boolean;
  renderer: HTMLElement & { setStyles?: (s: string) => void; next: () => void };
  lastLocation?: { range?: Range };
  open: (f: File) => Promise<void>;
  init: (o: { lastLocation?: string; showTextStart?: boolean }) => Promise<void>;
  close: () => void;
  goTo: (t: string | number) => Promise<unknown>;
  goToFraction: (f: number) => Promise<void>;
  goLeft: () => void;
  goRight: () => void;
  next: () => void;
  prev: () => void;
};

function mapToc(items: FoliateTocItem[] | undefined): TocEntry[] {
  return (items ?? []).map((i) => ({
    label: (i.label ?? "").trim() || "—",
    target: i.href,
    subitems: i.subitems?.length ? mapToc(i.subitems) : undefined,
  }));
}

export default function FoliateView(props: EngineProps) {
  const { blob, fileName, initial, prefs, handleRef } = props;
  const host = useRef<HTMLDivElement>(null);
  const viewRef = useRef<FoliateViewEl | null>(null);
  const cb = useRef(props);
  cb.current = props;
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  useEffect(() => {
    let disposed = false;
    let view: FoliateViewEl | null = null;
    const onKey = (e: KeyboardEvent) => {
      if (!view) return;
      if (e.key === "ArrowLeft") view.goLeft();
      else if (e.key === "ArrowRight") view.goRight();
      else if (e.key === "PageDown" || e.key === " ") view.next();
      else if (e.key === "PageUp") view.prev();
    };

    (async () => {
      try {
        await import("foliate-js/view.js");
        const CFI = await import("foliate-js/epubcfi.js");
        if (disposed) return;
        view = document.createElement("foliate-view") as FoliateViewEl;
        viewRef.current = view;
        host.current!.append(view);

        view.addEventListener("load", (e: Event) => {
          const { doc } = (e as CustomEvent<{ doc: Document }>).detail;
          doc.addEventListener("keydown", onKey);
          doc.addEventListener("click", (ev: MouseEvent) => {
            if ((ev.target as Element | null)?.closest?.("a[href]")) return;
            const sel = doc.getSelection();
            if (sel && !sel.isCollapsed) return;
            if (prefsRef.current.flow === "scrolled") return cb.current.onTap("center");
            const frame = doc.defaultView?.frameElement as HTMLElement | null;
            const left = frame?.getBoundingClientRect().left ?? 0;
            const x = left + ev.clientX;
            const w = window.innerWidth;
            cb.current.onTap(x < w * 0.3 ? "left" : x > w * 0.7 ? "right" : "center");
          });
        });

        view.addEventListener("relocate", (e: Event) => {
          const d = (e as CustomEvent).detail as {
            fraction: number;
            cfi: string;
            tocItem?: { label?: string; href?: string };
            range?: Range;
          };
          const start = d.cfi ? CFI.collapse(d.cfi) : undefined;
          const end = d.cfi ? CFI.collapse(d.cfi, true) : undefined;
          cb.current.onRelocate({
            fraction: d.fraction ?? 0,
            cfi: start,
            label: d.tocItem?.label?.trim(),
            tocTarget: d.tocItem?.href,
            contains: (bm) => {
              if (!bm.cfi || !start || !end) return false;
              try {
                return CFI.compare(bm.cfi, start) >= 0 && CFI.compare(bm.cfi, end) <= 0;
              } catch {
                return false;
              }
            },
          });
        });

        await view.open(new File([blob], fileName, { type: blob.type }));
        if (disposed) return;
        const r = view.renderer;
        r.setAttribute("flow", view.isFixedLayout ? "paginated" : prefsRef.current.flow);
        r.setAttribute("animated", "");
        r.setAttribute("margin", "56px");
        r.setAttribute("gap", "6%");
        r.setAttribute("max-inline-size", "680px");
        r.setAttribute("max-column-count", "2");
        r.setStyles?.(buildCss(prefsRef.current));

        handleRef.current = {
          next: () => view?.goRight(),
          prev: () => view?.goLeft(),
          goTo: (t) => void view?.goTo(t),
          goToFraction: (f) => void view?.goToFraction(f),
          excerpt: async () => (view?.lastLocation?.range?.toString() ?? "").replace(/\s+/g, " ").trim().slice(0, 160),
        };
        cb.current.onReady({ toc: mapToc(view.book.toc), fixedLayout: view.isFixedLayout });
        window.addEventListener("keydown", onKey);

        let start = initial?.cfi;
        try {
          await view.init({ lastLocation: start, showTextStart: !start });
        } catch {
          start = undefined;
          await view.init({ showTextStart: true });
        }
      } catch (err) {
        console.error(err);
        cb.current.onError("Non è stato possibile aprire questo libro. Il file potrebbe essere danneggiato.");
      }
    })();

    return () => {
      disposed = true;
      window.removeEventListener("keydown", onKey);
      handleRef.current = null;
      try {
        view?.close();
      } catch {
        /* already closed */
      }
      view?.remove();
      viewRef.current = null;
    };
    // the book is opened once per file
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blob, fileName]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view?.renderer) return;
    if (!view.isFixedLayout && view.renderer.getAttribute("flow") !== prefs.flow) {
      view.renderer.setAttribute("flow", prefs.flow);
    }
    view.renderer.setStyles?.(buildCss(prefs));
  }, [prefs]);

  return <div ref={host} className="absolute inset-0" />;
}
