import type { CSSProperties } from "react";
import { toShelfRows } from "@/lib/bookcase/shelf";
import type { BookMeta } from "@/lib/library/types";
import { BookCover } from "./BookCover";

interface Props {
  books: BookMeta[];
  perShelf: number;
  minRows: number;
  editing: boolean;
  onOpen: (b: BookMeta) => void;
  onToggleFavorite: (b: BookMeta) => void;
  onDelete: (b: BookMeta) => void;
}

export function Shelves({ books, perShelf, minRows, editing, onOpen, onToggleFavorite, onDelete }: Props) {
  const rows = toShelfRows(books, perShelf, minRows);
  return (
    <div className="pb-6">
      {rows.map((row, i) => (
        <div className="bc-row" key={i}>
          <div className="bc-books" style={{ "--per-shelf": perShelf } as CSSProperties}>
            {row.map((book) => (
              <BookCover
                key={book.id}
                book={book}
                editing={editing}
                onOpen={onOpen}
                onToggleFavorite={onToggleFavorite}
                onDelete={onDelete}
              />
            ))}
            {row.length === 0 ? <div aria-hidden className="invisible" style={{ aspectRatio: "1 / 1.5" }} /> : null}
          </div>
          <div className="bc-plank" aria-hidden>
            <div className="bc-plank-top" />
            <div className="bc-plank-front" />
          </div>
        </div>
      ))}
    </div>
  );
}
