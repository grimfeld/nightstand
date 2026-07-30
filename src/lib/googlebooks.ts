/**
 * Google Books lookup — the French-coverage fallback. Open Library owns the
 * work-level model this app is built on; Google only knows editions, so a hit
 * is keyed `gb:<volumeId>` to stay unique without pretending to be a work.
 *
 * Anonymous access is quota-limited (and sometimes closed entirely), so an
 * API key can be supplied via VITE_GBOOKS_KEY. Every failure here is treated
 * as "no extra results", never as an error worth surfacing.
 */

import type { WorkHit } from "./openlibrary";

interface Volume {
  id?: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    pageCount?: number;
    categories?: string[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
}

const key: string | undefined = import.meta.env.VITE_GBOOKS_KEY;

const cover = (v: Volume): string => {
  const raw = v.volumeInfo?.imageLinks?.thumbnail ?? v.volumeInfo?.imageLinks?.smallThumbnail;
  if (!raw) return "";
  // The API hands out http URLs with a page-curl effect baked in.
  return raw.replace(/^http:/, "https:").replace(/&edge=curl/, "");
};

export async function searchVolumes(query: string, signal?: AbortSignal): Promise<WorkHit[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", q);
  url.searchParams.set("maxResults", "8");
  url.searchParams.set("printType", "books");
  if (key) url.searchParams.set("key", key);

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Google Books returned ${res.status}`);

  const { items = [] } = (await res.json()) as { items?: Volume[] };

  return items
    .filter((v): v is Volume & { id: string } => Boolean(v.id && v.volumeInfo?.title))
    .map((v) => ({
      work_key: `gb:${v.id}`,
      title: v.volumeInfo?.title ?? "Untitled",
      author: v.volumeInfo?.authors?.[0] ?? "Unknown",
      publisher: v.volumeInfo?.publisher ?? "",
      genre: (v.volumeInfo?.categories ?? []).slice(0, 3).join(", "),
      year: Number(v.volumeInfo?.publishedDate?.slice(0, 4)) || 0,
      pages: v.volumeInfo?.pageCount ?? 0,
      cover_url: cover(v),
    }));
}
