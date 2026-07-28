import PocketBase, { type RecordModel } from "pocketbase";
import type { Book, BookDraft, Patch } from "./domain";

const url = import.meta.env.VITE_PB_URL;
if (!url) {
  throw new Error(
    "VITE_PB_URL is unset. Copy .env.example to .env and point it at your PocketBase instance.",
  );
}

export const pb = new PocketBase(url);

// One user, one device at a time — nothing to gain from PocketBase's
// auto-cancellation of superseded requests, and it makes StrictMode noisy.
pb.autoCancellation(false);

const books = () => pb.collection("books");

const toBook = (r: RecordModel): Book => r as unknown as Book;

export async function listBooks(): Promise<Book[]> {
  const records = await books().getFullList({ sort: "slot,title" });
  return records.map(toBook);
}

export async function createBook(draft: BookDraft): Promise<Book> {
  return toBook(await books().create({ ...draft, owner: pb.authStore.record?.id }));
}

export async function patchBook(id: string, patch: Patch): Promise<Book> {
  return toBook(await books().update(id, patch));
}

export async function deleteBook(id: string): Promise<void> {
  await books().delete(id);
}

/** Work-level dedupe, so "do I already own this?" survives a different edition. */
export async function findByWorkKey(workKey: string): Promise<Book | null> {
  if (!workKey) return null;
  try {
    return toBook(await books().getFirstListItem(pb.filter("work_key = {:k}", { k: workKey })));
  } catch {
    return null;
  }
}

export const login = (email: string, password: string) =>
  pb.collection("users").authWithPassword(email, password);

export const logout = () => pb.authStore.clear();
