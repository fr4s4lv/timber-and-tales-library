declare module "foliate-js/view.js" {
  export const makeBook: (file: File) => Promise<FoliateBook>;
}
declare module "foliate-js/epubcfi.js" {
  export const collapse: (cfi: string, toEnd?: boolean) => string;
  export const compare: (a: string, b: string) => number;
}
declare module "mammoth/mammoth.browser.js";
declare module "*.mjs?url" {
  const url: string;
  export default url;
}

interface FoliateTocItem {
  label: string;
  href: string;
  subitems?: FoliateTocItem[];
}

interface FoliateBook {
  metadata?: {
    title?: string | Record<string, string>;
    author?: unknown;
    language?: string | string[];
  };
  toc?: FoliateTocItem[];
  sections: { linear?: string; createDocument?: () => Promise<Document> }[];
  rendition?: { layout?: string };
  dir?: string;
  getCover?: () => Promise<Blob | null> | Blob | null;
}
