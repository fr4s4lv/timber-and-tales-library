import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "@/lib/library/pdf";
import type { EngineProps, TocEntry } from "./types";

type RenderTask = { promise: Promise<void>; cancel: () => void };

async function renderPage(
  pdf: PDFDocumentProxy,
  n: number,
  canvas: HTMLCanvasElement,
  maxW: number,
  maxH: number,
): Promise<RenderTask | null> {
  const page = await pdf.getPage(n);
  const base = page.getViewport({ scale: 1 });
  const scale = Math.min(maxW / base.width, maxH / base.height);
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const viewport = page.getViewport({ scale: scale * dpr });
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
  canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;
  const task = page.render({ canvas, viewport }) as unknown as RenderTask;
  return task;
}

async function buildOutline(pdf: PDFDocumentProxy): Promise<TocEntry[]> {
  const outline = await pdf.getOutline().catch(() => null);
  if (!outline) return [];
  type Node = { title: string; dest: unknown; items?: Node[] };
  const walk = async (items: Node[]): Promise<TocEntry[]> => {
    const out: TocEntry[] = [];
    for (const it of items) {
      let page: number | null = null;
      try {
        let dest = it.dest as unknown;
        if (typeof dest === "string") dest = await pdf.getDestination(dest);
        if (Array.isArray(dest) && dest[0]) {
          const ref = dest[0];
          page = typeof ref === "number" ? ref + 1 : (await pdf.getPageIndex(ref)) + 1;
        }
      } catch {
        page = null;
      }
      const subitems = it.items?.length ? await walk(it.items) : undefined;
      if (page != null || subitems?.length)
        out.push({ label: it.title.trim() || "—", target: page ?? subitems?.[0]?.target ?? 1, subitems });
    }
    return out;
  };
  return walk(outline as Node[]);
}

function LazyPage({
  pdf,
  n,
  width,
  ratio,
}: {
  pdf: PDFDocumentProxy;
  n: number;
  width: number;
  ratio: number;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = wrap.current!;
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting), { rootMargin: "900px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!visible || !canvas.current) return;
    let task: RenderTask | null = null;
    let alive = true;
    void renderPage(pdf, n, canvas.current, width, width * 4).then((t) => {
      if (!alive) return t?.cancel();
      task = t;
      task?.promise.catch(() => undefined);
    });
    return () => {
      alive = false;
      task?.cancel();
    };
  }, [visible, pdf, n, width]);
  return (
    <div
      ref={wrap}
      data-page={n}
      className="pdf-page mx-auto mb-4 overflow-hidden"
      style={{ width, minHeight: width * ratio }}
    >
      {visible ? <canvas ref={canvas} className="block" /> : null}
    </div>
  );
}

export default function PdfView(props: EngineProps) {
  const { blob, initial, prefs, handleRef } = props;
  const cb = useRef(props);
  cb.current = props;
  const container = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [ratio, setRatio] = useState(1.414);
  const [page, setPage] = useState(Math.max(1, initial?.page ?? 1));
  const [dir, setDir] = useState<1 | -1>(1);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const total = pdf?.numPages ?? 0;
  const pageRef = useRef(page);
  pageRef.current = page;

  useEffect(() => {
    let alive = true;
    let doc: PDFDocumentProxy | null = null;
    (async () => {
      try {
        const { openPdf } = await import("@/lib/library/pdf");
        doc = await openPdf(blob);
        if (!alive) return void doc.destroy();
        const p1 = await doc.getPage(1);
        const vp = p1.getViewport({ scale: 1 });
        setRatio(vp.height / vp.width);
        setPdf(doc);
        setPage((p) => Math.min(p, doc!.numPages));
        cb.current.onReady({ toc: await buildOutline(doc), fixedLayout: true, totalPages: doc.numPages });
      } catch (e) {
        console.error(e);
        cb.current.onError("Non è stato possibile aprire questo PDF.");
      }
    })();
    return () => {
      alive = false;
      void doc?.destroy();
    };
  }, [blob]);

  useEffect(() => {
    const el = container.current!;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const goToPage = useCallback(
    (n: number, smooth = true) => {
      if (!total) return;
      const p = Math.min(total, Math.max(1, Math.round(n)));
      setDir(p >= pageRef.current ? 1 : -1);
      setPage(p);
      if (prefs.flow === "scrolled") {
        const el = scroller.current?.querySelector<HTMLElement>(`[data-page="${p}"]`);
        el?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
      }
    },
    [total, prefs.flow],
  );

  // report location
  useEffect(() => {
    if (!total) return;
    cb.current.onRelocate({
      fraction: total > 1 ? (page - 1) / (total - 1) : 1,
      page,
      totalPages: total,
      label: `Pagina ${page} di ${total}`,
      contains: (bm) => bm.page === page,
    });
  }, [page, total]);

  useEffect(() => {
    handleRef.current = {
      next: () => goToPage(pageRef.current + 1),
      prev: () => goToPage(pageRef.current - 1),
      goTo: (t) => goToPage(typeof t === "number" ? t : parseInt(String(t), 10) || 1),
      goToFraction: (f) => goToPage(1 + f * (Math.max(1, total) - 1)),
      excerpt: async () => {
        if (!pdf) return "";
        const pg = await pdf.getPage(pageRef.current);
        const tc = await pg.getTextContent();
        return (tc.items as { str?: string }[])
          .map((i) => i.str ?? "")
          .join(" ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 160);
      },
    };
  }, [goToPage, total, pdf, handleRef]);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") goToPage(pageRef.current + 1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") goToPage(pageRef.current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goToPage]);

  // paginated render
  useEffect(() => {
    if (!pdf || prefs.flow !== "paginated" || !canvas.current || !size.w) return;
    let task: RenderTask | null = null;
    let alive = true;
    void renderPage(pdf, page, canvas.current, size.w - 24, size.h - 120).then((t) => {
      if (!alive) return t?.cancel();
      task = t;
      task?.promise.catch(() => undefined);
    });
    return () => {
      alive = false;
      task?.cancel();
    };
  }, [pdf, page, prefs.flow, size]);

  // scrolled: jump to stored page once, then track the page in view
  const jumped = useRef(false);
  useEffect(() => {
    if (!pdf || prefs.flow !== "scrolled") return;
    const sc = scroller.current;
    if (!sc) return;
    requestAnimationFrame(() => {
      sc.querySelector<HTMLElement>(`[data-page="${pageRef.current}"]`)?.scrollIntoView({ block: "start" });
      jumped.current = true;
    });
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!jumped.current) return;
        const mid = sc.scrollTop + sc.clientHeight / 3;
        const pages = sc.querySelectorAll<HTMLElement>("[data-page]");
        for (const el of Array.from(pages)) {
          if (el.offsetTop + el.offsetHeight > mid) {
            const n = Number(el.dataset["page"]);
            if (n !== pageRef.current) setPage(n);
            break;
          }
        }
      });
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    return () => sc.removeEventListener("scroll", onScroll);
  }, [pdf, prefs.flow, size.w]);

  // swipe + tap (paginated)
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    touch.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = touch.current;
    touch.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goToPage(pageRef.current + 1);
      else goToPage(pageRef.current - 1);
      return;
    }
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const w = window.innerWidth;
      const zone = e.clientX < w * 0.3 ? "left" : e.clientX > w * 0.7 ? "right" : "center";
      if (zone === "left") goToPage(pageRef.current - 1);
      else if (zone === "right") goToPage(pageRef.current + 1);
      else cb.current.onTap("center");
    }
  };

  const colW = Math.min(size.w - 24, 920);

  return (
    <div ref={container} className="absolute inset-0">
      {prefs.flow === "paginated" ? (
        <div
          className="flex h-full w-full touch-pan-y items-center justify-center select-none"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          <div
            key={page}
            className={`pdf-page animate-in fade-in-0 duration-300 ${dir > 0 ? "slide-in-from-right-8" : "slide-in-from-left-8"}`}
          >
            <canvas ref={canvas} className="block" />
          </div>
        </div>
      ) : (
        <div
          ref={scroller}
          className="h-full overflow-y-auto px-3 pt-16 pb-24"
          onClick={() => cb.current.onTap("center")}
        >
          {pdf && colW > 0
            ? Array.from({ length: total }, (_, i) => (
                <LazyPage key={i} pdf={pdf} n={i + 1} width={colW} ratio={ratio} />
              ))
            : null}
        </div>
      )}
    </div>
  );
}
