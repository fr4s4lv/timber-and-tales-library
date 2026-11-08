import { createFileRoute } from "@tanstack/react-router";
import { ReaderScreen } from "@/components/reader/ReaderScreen";

export const Route = createFileRoute("/leggi/$bookId")({
  head: () => ({
    meta: [
      { title: "Lettura — Librarium" },
      { name: "description", content: "Leggi il tuo ebook con indice, segnalibri e pagine orizzontali o verticali." },
      { property: "og:title", content: "Lettura — Librarium" },
      { property: "og:description", content: "Il lettore di ebook di Librarium." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReaderRoute,
});

function ReaderRoute() {
  const { bookId } = Route.useParams();
  return <ReaderScreen key={bookId} bookId={bookId} />;
}
