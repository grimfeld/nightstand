/**
 * The domain, exactly as defined in CONTEXT.md. Everything here is pure — no
 * PocketBase, no React — so the Nightstand rules can be reasoned about (and
 * tested) without a server.
 */

export const SLOT_COUNT = 5;

export const ACQUISITION = ["WANTED", "OWNED", "BORROWED", "GONE"] as const;
export type Acquisition = (typeof ACQUISITION)[number];

export const ENGAGEMENT = ["UNREAD", "READING", "READ", "ABANDONED"] as const;
export type Engagement = (typeof ENGAGEMENT)[number];

/** An ISO date, `YYYY-MM-DD`. Empty string means "not yet". */
export type Day = string;

export interface Book {
  id: string;
  owner: string;
  title: string;
  author: string;
  /** Open Library *work* key, e.g. `/works/OL27448W`. Identity for dedupe. */
  work_key: string;
  cover_url: string;
  pages: number;
  year: number;

  acquisition: Acquisition;
  engagement: Engagement;
  /** Self-declared, and deliberately orthogonal to engagement. */
  studied: boolean;
  /** Why this book is on the list at all. Captured once, at add time. */
  reason: string;

  /**
   * 1..SLOT_COUNT while on the Nightstand. In the Backlog it is 0 or null —
   * PocketBase coerces empty numbers to 0, so both are treated as "no slot"
   * rather than pretending a distinction the storage won't preserve.
   */
  slot: number | null;

  added_on: Day;
  acquired_on: Day;
  slotted_on: Day;
  started_on: Day;
  finished_on: Day;
}

/** Fields the app writes. `id`/`owner` are PocketBase's business. */
export type BookDraft = Omit<Book, "id" | "owner">;

export const today = (): Day => new Date().toISOString().slice(0, 10);

export const daysSince = (d: Day): number | null => {
  if (!d) return null;
  const ms = Date.now() - new Date(`${d}T00:00:00`).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
};

// ---------------------------------------------------------------------------
// Nightstand
// ---------------------------------------------------------------------------

export const onNightstand = (b: Book) => b.slot !== null && b.slot > 0;

export const nightstand = (books: Book[]): Book[] =>
  books.filter(onNightstand).sort((a, b) => a.slot! - b.slot!);

export const backlog = (books: Book[]): Book[] => books.filter((b) => !onNightstand(b));

/** Slot numbers with nobody in them, ascending. */
export function freeSlots(books: Book[]): number[] {
  const taken = new Set(books.filter(onNightstand).map((b) => b.slot!));
  const free: number[] = [];
  for (let s = 1; s <= SLOT_COUNT; s++) if (!taken.has(s)) free.push(s);
  return free;
}

export const isFull = (books: Book[]) => freeSlots(books).length === 0;

/**
 * How long this book has been squatting its slot. Reading time if it has been
 * started, otherwise time since it was slotted. This is the whole reason we
 * don't track page progress — it detects the one pathology the cap creates.
 */
export function slotAge(b: Book): number | null {
  if (!onNightstand(b)) return null;
  return daysSince(b.started_on || b.slotted_on);
}

/** A slot held this long without finishing is a decision you're avoiding. */
export const STALE_AFTER_DAYS = 60;

export const isStale = (b: Book): boolean => {
  const age = slotAge(b);
  return age !== null && age >= STALE_AFTER_DAYS;
};

/** A Wanted book holding a slot IS the instruction to buy it. */
export const isBuySignal = (b: Book) => onNightstand(b) && b.acquisition === "WANTED";

// ---------------------------------------------------------------------------
// Transitions. Each returns the fields to patch, never a whole record, so
// concurrent edits to untouched fields don't get clobbered.
// ---------------------------------------------------------------------------

export type Patch = Partial<BookDraft>;

export const promote = (slot: number): Patch => ({ slot, slotted_on: today() });

/** Take a book off the Nightstand without judging it read or abandoned. */
export const evict = (): Patch => ({ slot: 0, slotted_on: "" });

export const start = (): Patch => ({ engagement: "READING", started_on: today() });

/** Finishing frees the slot. */
export const finish = (): Patch => ({
  engagement: "READ",
  finished_on: today(),
  slot: 0,
  slotted_on: "",
});

/** Abandoning also frees the slot — that is the point of it. */
export const abandon = (): Patch => ({
  engagement: "ABANDONED",
  slot: 0,
  slotted_on: "",
});

export const acquire = (how: Extract<Acquisition, "OWNED" | "BORROWED">): Patch => ({
  acquisition: how,
  acquired_on: today(),
});

export const release = (): Patch => ({ acquisition: "GONE" });

export const setStudied = (studied: boolean): Patch => ({ studied });

// ---------------------------------------------------------------------------
// Views over the data that need no extra fields
// ---------------------------------------------------------------------------

export const shelfOfShame = (books: Book[]): Book[] =>
  books
    .filter((b) => b.acquisition === "OWNED" && b.engagement === "UNREAD")
    .sort((a, b) => (a.acquired_on || "9999").localeCompare(b.acquired_on || "9999"));

export const finishedIn = (books: Book[], year: number): Book[] =>
  books.filter((b) => b.finished_on.startsWith(String(year)));

export const studied = (books: Book[]): Book[] => books.filter((b) => b.studied);

export const shoppingList = (books: Book[]): Book[] => nightstand(books).filter(isBuySignal);
