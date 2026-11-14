import { describe, expect, it } from "vitest";
import { BOOKS_PER_SHELF_RANGE, clampBooksPerShelf, deviceClassFor, toShelfRows } from "@/lib/bookcase/shelf";
import { finishLabelKey, getStyle } from "@/lib/bookcase/catalog";
import { translate } from "@/lib/i18n";
import { detectFormat } from "@/lib/library/formats";

describe("books per shelf", () => {
  it("treats an iPhone as phone and an iPad as tablet", () => {
    expect(deviceClassFor(390, 844, 390)).toBe("phone");
    expect(deviceClassFor(844, 390, 844)).toBe("phone"); // iPhone in landscape
    expect(deviceClassFor(820, 1180, 820)).toBe("tablet");
  });

  it("keeps separate ranges for iPhone and iPad", () => {
    expect(BOOKS_PER_SHELF_RANGE.phone).toMatchObject({ min: 2, max: 6 });
    expect(BOOKS_PER_SHELF_RANGE.tablet).toMatchObject({ min: 3, max: 12 });
    expect(clampBooksPerShelf("phone", 9)).toBe(6);
    expect(clampBooksPerShelf("tablet", 9)).toBe(9);
    expect(clampBooksPerShelf("tablet", 1)).toBe(3);
  });

  it("puts the chosen number of books on each shelf", () => {
    const rows = toShelfRows([1, 2, 3, 4, 5, 6, 7], 3, 4);
    expect(rows.map((r) => r.length)).toEqual([3, 3, 1, 0]);
  });
});

describe("bookcase styles", () => {
  it("offers the requested woods for classic and antique", () => {
    const woods = ["Noce", "Wengé", "Mogano rosso", "Ciliegio", "Rovere", "Faggio", "Betulla", "Palissandro", "Castagno"];
    const label = (id: string) => translate("it", finishLabelKey(id));
    expect(getStyle("classico").finishes.map((f) => label(f.id))).toEqual(woods);
    expect(getStyle("antico").finishes.map((f) => label(f.id))).toEqual(woods);
  });

  it("offers the requested tints for modern", () => {
    expect(getStyle("moderno").finishes.map((f) => translate("it", finishLabelKey(f.id)))).toEqual([
      "Tortora",
      "Bianco",
      "Grigio chiaro",
      "Grigio scuro",
      "Ocra",
      "Legno moderno",
    ]);
  });
});

describe("classic variants", () => {
  it("has Renaissance, Baroque and Liberty and no pediment variant", () => {
    const ids = getStyle("classico").variants.map((v) => v.id);
    expect(ids).toEqual(expect.arrayContaining(["rinascimentale", "barocco", "liberty"]));
    expect(ids).not.toContain("frontone");
  });
});

describe("ebook formats", () => {
  it("opens common ebook formats", () => {
    for (const name of ["a.epub", "a.mobi", "a.azw3", "a.fb2", "a.fb2.zip", "a.cbz", "a.pdf", "a.txt", "a.docx"]) {
      expect(detectFormat(name).supported).toBe(true);
    }
  });

  it("explains formats that cannot be opened", () => {
    const kfx = detectFormat("Libro.KFX");
    expect(kfx.supported).toBe(false);
    expect(detectFormat("x.cbr").supported).toBe(false);
  });
});
