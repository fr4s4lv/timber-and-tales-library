import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useT } from "@/lib/i18n";
import { createCollection, setBookInCollection, useCollections } from "@/lib/library/collections";
import type { BookMeta } from "@/lib/library/types";

interface Props {
  book: BookMeta | null;
  onOpenChange: (open: boolean) => void;
}

export function CollectionPicker({ book, onOpenChange }: Props) {
  const t = useT();
  const collections = useCollections();
  const [name, setName] = useState("");

  return (
    <Dialog open={!!book} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{t("collections.pickerTitle")}</DialogTitle>
          <DialogDescription>{t("collections.pickerDescription", { title: book?.title ?? "" })}</DialogDescription>
        </DialogHeader>
        {book ? (
          <div className="space-y-3">
            {collections.length ? (
              <ul className="max-h-64 space-y-0.5 overflow-y-auto">
                {collections.map((c) => {
                  const checked = c.bookIds.includes(book.id);
                  return (
                    <li key={c.id}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => setBookInCollection(c.id, book.id, v === true)}
                          className="size-5"
                        />
                        <span className="flex-1 truncate font-semibold">{c.name}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t("collections.none")}</p>
            )}
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const c = createCollection(name, book.id);
                if (c) {
                  setName("");
                  toast.success(t("collections.added", { name: c.name }));
                }
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
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-10 rounded-lg px-4 text-sm font-semibold hover:bg-muted"
              >
                {t("common.done")}
              </button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
