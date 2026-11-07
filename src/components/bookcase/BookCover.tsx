import { Heart, Trash2, X } from "lucide-react";
import type { CSSProperties } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useCoverUrl } from "@/lib/library/store";
import type { BookMeta } from "@/lib/library/types";

function hashIndex(s: string, n: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % n;
}

function FallbackCover({ book }: { book: BookMeta }) {
  return (
    <div className={`book-fallback cover-${hashIndex(book.title, 7)}`}>
      <div className="book-fallback-frame px-[8%] py-[10%] text-center">
        <p className="line-clamp-4 font-display text-[clamp(10px,2.6cqw,18px)] font-semibold leading-tight">
          {book.title}
        </p>
      </div>
      <p className="line-clamp-2 text-center font-display text-[clamp(8px,1.8cqw,13px)] italic opacity-85">
        {book.author || book.formatLabel}
      </p>
    </div>
  );
}

interface Props {
  book: BookMeta;
  editing: boolean;
  onOpen: (book: BookMeta) => void;
  onToggleFavorite: (book: BookMeta) => void;
  onDelete: (book: BookMeta) => void;
}

export function BookCover({ book, editing, onOpen, onToggleFavorite, onDelete }: Props) {
  const url = useCoverUrl(book.id, book.hasCover);
  const ratio = Math.min(1.62, Math.max(1.25, book.coverRatio ?? 1.5));
  const pct = Math.round((book.progress?.fraction ?? 0) * 100);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="relative" style={{ containerType: "inline-size" } as CSSProperties}>
          <button
            type="button"
            className="book"
            data-edit={editing}
            style={{ aspectRatio: `1 / ${ratio}` }}
            onClick={() => (editing ? undefined : onOpen(book))}
            aria-label={`Apri ${book.title}`}
            title={book.author ? `${book.title} — ${book.author}` : book.title}
          >
            {url ? <img src={url} alt="" draggable={false} /> : <FallbackCover book={book} />}
            {!book.lastOpenedAt ? <span className="book-ribbon">Nuovo</span> : null}
            {pct > 0 && pct < 100 ? (
              <span className="book-progress">
                <span style={{ width: `${pct}%` }} />
              </span>
            ) : null}
          </button>
          {book.favorite && !editing ? (
            <Heart className="pointer-events-none absolute right-1 bottom-2 z-10 size-3.5 fill-gilt text-gilt drop-shadow sm:size-4" />
          ) : null}
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => onDelete(book)}
                aria-label={`Elimina ${book.title}`}
                className="absolute -top-2 -left-2 z-10 grid size-6 place-items-center rounded-full bg-destructive text-destructive-foreground shadow-md"
              >
                <X className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onToggleFavorite(book)}
                aria-label={book.favorite ? "Togli dai preferiti" : "Aggiungi ai preferiti"}
                className="absolute -top-2 -right-2 z-10 grid size-6 place-items-center rounded-full bg-card text-primary shadow-md"
              >
                <Heart className={book.favorite ? "size-3.5 fill-primary" : "size-3.5"} />
              </button>
            </>
          ) : null}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <div className="px-2 py-1.5">
          <p className="line-clamp-2 font-display text-base font-semibold leading-tight">{book.title}</p>
          <p className="text-xs text-muted-foreground">
            {[book.author, book.formatLabel].filter(Boolean).join(" · ")}
          </p>
        </div>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => onOpen(book)}>Leggi</ContextMenuItem>
        <ContextMenuItem onSelect={() => onToggleFavorite(book)}>
          <Heart className="size-4" /> {book.favorite ? "Togli dai preferiti" : "Aggiungi ai preferiti"}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive focus:text-destructive" onSelect={() => onDelete(book)}>
          <Trash2 className="size-4" /> Elimina dalla libreria
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
