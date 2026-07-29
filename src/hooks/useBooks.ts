import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createBook, deleteBook, listBooks, patchBook, uploadPhoto } from "@/lib/pb";
import type { Book, BookDraft, Patch } from "@/lib/domain";

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setBooks(await listBooks());
      setError(null);
    } catch (e) {
      // Online-only by design, so a dead connection is a first-class state
      // rather than an edge case.
      setError(e instanceof Error ? e.message : "Could not reach PocketBase");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const apply = useCallback(async (id: string, patch: Patch) => {
    const previous = books;
    setBooks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    try {
      const saved = await patchBook(id, patch);
      setBooks((bs) => bs.map((b) => (b.id === id ? saved : b)));
    } catch (e) {
      setBooks(previous);
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }, [books]);

  const add = useCallback(async (draft: BookDraft) => {
    try {
      const saved = await createBook(draft);
      setBooks((bs) => [...bs, saved]);
      return saved;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add book");
      return null;
    }
  }, []);

  const setPhoto = useCallback(async (id: string, file: File) => {
    // No optimistic update: the server names the file, so there is nothing to
    // show until the upload comes back.
    try {
      const saved = await uploadPhoto(id, file);
      setBooks((bs) => bs.map((b) => (b.id === id ? saved : b)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Photo upload failed");
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    const previous = books;
    setBooks((bs) => bs.filter((b) => b.id !== id));
    try {
      await deleteBook(id);
    } catch (e) {
      setBooks(previous);
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }, [books]);

  return { books, loading, error, refresh, apply, add, remove, setPhoto };
}
