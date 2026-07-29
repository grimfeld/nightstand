import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookCover } from "@/components/BookCover";
import { backlog, finish, freeSlots, promote, type Book, type Patch } from "@/lib/domain";
import { coverSrc } from "@/lib/pb";

type Filter = "ALL" | "WANTED" | "OWNED_UNREAD" | "READ" | "STUDIED" | "ABANDONED" | "GONE";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "Everything" },
  { value: "WANTED", label: "Wanted" },
  { value: "OWNED_UNREAD", label: "Owned but unread" },
  { value: "READ", label: "Read" },
  { value: "STUDIED", label: "Studied" },
  { value: "ABANDONED", label: "Abandoned" },
  { value: "GONE", label: "Gone" },
];

const matches = (b: Book, f: Filter) => {
  switch (f) {
    case "ALL": return true;
    case "WANTED": return b.acquisition === "WANTED";
    case "OWNED_UNREAD": return b.acquisition === "OWNED" && b.engagement === "UNREAD";
    case "READ": return b.engagement === "READ";
    case "STUDIED": return b.studied;
    case "ABANDONED": return b.engagement === "ABANDONED";
    case "GONE": return b.acquisition === "GONE";
  }
};

export function Backlog({
  books,
  onApply,
  onPhoto,
  onOpen,
}: {
  books: Book[];
  onApply: (id: string, patch: Patch) => void;
  onPhoto: (id: string, file: File) => void;
  onOpen: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  const free = freeSlots(books);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return backlog(books)
      .filter((b) => matches(b, filter))
      .filter((b) =>
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.genre.toLowerCase().includes(q) ||
        b.reason.toLowerCase().includes(q),
      )
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [books, query, filter]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Title, author, or why you added it"
            className="pl-8"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <SelectTrigger className="w-[150px] shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="px-1 text-xs text-muted-foreground">
        {rows.length} {rows.length === 1 ? "book" : "books"}
      </p>

      <ul className="space-y-2">
        {rows.map((book) => (
          <li key={book.id} className="flex gap-3 rounded-lg border bg-card p-3">
            <BookCover
              url={coverSrc(book)}
              title={book.title}
              className="h-14 w-10"
              onPhoto={book.cover_url ? undefined : (file) => onPhoto(book.id, file)}
            />

            <button
              type="button"
              onClick={() => onOpen(book.id)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="truncate text-sm leading-tight font-medium">{book.title}</p>
              <p className="truncate text-xs text-muted-foreground">{book.author}</p>
              {book.reason && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground italic">
                  {book.reason}
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-[10px]">{book.acquisition}</Badge>
                <Badge variant="outline" className="text-[10px]">{book.engagement}</Badge>
                {book.studied && <Badge className="text-[10px]">studied</Badge>}
              </div>
            </button>

            <div className="flex shrink-0 flex-col justify-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={free.length === 0}
                title={free.length === 0 ? "The nightstand is full" : undefined}
                onClick={() => onApply(book.id, promote(free[0]))}
              >
                Slot it
              </Button>
              {book.engagement !== "READ" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-xs text-muted-foreground"
                  onClick={() => onApply(book.id, finish())}
                >
                  <Check className="size-3" /> Read it
                </Button>
              )}
            </div>
          </li>
        ))}

        {rows.length === 0 && (
          <li className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nothing here.
          </li>
        )}
      </ul>
    </div>
  );
}
