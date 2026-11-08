import { describe, expect, it } from "vitest";
import { BOOKS_PER_SHELF_RANGE, clampBooksPerShelf, deviceClassFor, toShelfRows } from "@/lib/bookcase/shelf";
import { getStyle } from "@/lib/bookcase/catalog";
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
    const woods = ["Noce", "Wengé", "Mogano rosso", "Ciliegio", "Rovere"];
    expect(getStyle("classico").finishes.map((f) => f.label)).toEqual(woods);
    expect(getStyle("antico").finishes.map((f) => f.label)).toEqual(woods);
  });

  it("offers the requested tints for modern", () => {
    expect(getStyle("moderno").finishes.map((f) => f.label)).toEqual([
      "Tortora",
      "Bianco",
      "Grigio chiaro",
      "Grigio scuro",
      "Ocra",
      "Legno moderno",
    ]);
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
