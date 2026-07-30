/**
 * The one search the add dialog calls: Open Library and Google Books queried
 * in parallel, Open Library first in the results because its work-level keys
 * are what the dedupe model wants. Either source failing is fine as long as
 * one answers; both failing is a real error.
 */

import { searchWorks, type WorkHit } from "./openlibrary";
import { searchVolumes } from "./googlebooks";

const fingerprint = (h: WorkHit) =>
  `${h.title.toLowerCase().trim()}|${h.author.toLowerCase().trim()}`;

export async function searchBooks(query: string, signal?: AbortSignal): Promise<WorkHit[]> {
  const [ol, gb] = await Promise.allSettled([
    searchWorks(query, signal),
    searchVolumes(query, signal),
  ]);

  if (ol.status === "rejected" && gb.status === "rejected") throw ol.reason;

  const primary = ol.status === "fulfilled" ? ol.value : [];
  const seen = new Set(primary.map(fingerprint));
  const extra =
    gb.status === "fulfilled" ? gb.value.filter((h) => !seen.has(fingerprint(h))) : [];

  return [...primary, ...extra].slice(0, 10);
}

export type { WorkHit };
