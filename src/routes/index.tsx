import { createFileRoute } from "@tanstack/react-router";
import { LibraryScreen } from "@/components/library/LibraryScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Librarium — la tua libreria di ebook" },
      {
        name: "description",
        content:
          "Libreria di ebook a scaffali in stile classico, antico o moderno. Leggi EPUB, Kindle, PDF e altri formati con indice e segnalibri.",
      },
      { property: "og:title", content: "Librarium — la tua libreria di ebook" },
      {
        property: "og:description",
        content: "Scaffali in legno, colonne ioniche e un lettore con indice e segnalibri.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LibraryScreen,
});
