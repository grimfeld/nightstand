/**
 * Open Library lookup. We search works rather than editions: identity in this
 * app is the work, and an edition only ever supplies cover art and page count.
 */

export interface WorkHit {
  work_key: string;
  title: string;
  author: string;
  publisher: string;
  genre: string;
  year: number;
  pages: number;
  cover_url: string;
}

interface SearchDoc {
  key?: string;
  title?: string;
  author_name?: string[];
  publisher?: string[];
  subject?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  cover_i?: number;
}

const FIELDS =
  "key,title,author_name,publisher,subject,first_publish_year,number_of_pages_median,cover_i";

export const coverUrl = (id: number, size: "S" | "M" | "L" = "M") =>
  `https://covers.openlibrary.org/b/id/${id}-${size}.jpg`;

export async function searchWorks(query: string, signal?: AbortSignal): Promise<WorkHit[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", q);
  url.searchParams.set("fields", FIELDS);
  url.searchParams.set("limit", "8");

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Open Library returned ${res.status}`);

  const { docs = [] } = (await res.json()) as { docs?: SearchDoc[] };

  return docs
    .filter((d): d is SearchDoc & { key: string } => Boolean(d.key))
    .map((d) => ({
      work_key: d.key,
      title: d.title ?? "Untitled",
      author: d.author_name?.[0] ?? "Unknown",
      publisher: d.publisher?.[0] ?? "",
      // Subject lists run to hundreds of entries; the first few are the ones
      // humans would call the genre.
      genre: (d.subject ?? []).slice(0, 3).join(", "),
      year: d.first_publish_year ?? 0,
      pages: d.number_of_pages_median ?? 0,
      cover_url: d.cover_i ? coverUrl(d.cover_i) : "",
    }));
}
