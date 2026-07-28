import { AlertTriangle, BookOpen, Check, ShoppingCart, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookCover } from "@/components/BookCover";
import {
  SLOT_COUNT,
  abandon,
  acquire,
  evict,
  finish,
  freeSlots,
  isBuySignal,
  isStale,
  nightstand,
  slotAge,
  start,
  type Book,
  type Patch,
} from "@/lib/domain";

interface Props {
  books: Book[];
  onApply: (id: string, patch: Patch) => void;
  onFillSlot: () => void;
}

export function Nightstand({ books, onApply, onFillSlot }: Props) {
  const occupied = nightstand(books);
  const free = freeSlots(books);

  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          Nightstand
        </h2>
        <span className="text-sm tabular-nums text-muted-foreground">
          {occupied.length}/{SLOT_COUNT}
          {free.length === 0 && <span className="ml-2 font-medium text-foreground">full</span>}
        </span>
      </header>

      <ul className="space-y-2">
        {occupied.map((book) => (
          <SlotCard key={book.id} book={book} onApply={onApply} />
        ))}

        {free.map((slot) => (
          <li key={slot}>
            <button
              onClick={onFillSlot}
              className="flex h-[68px] w-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              Slot {slot} — empty
            </button>
          </li>
        ))}
      </ul>

      {free.length === 0 && (
        <p className="px-1 text-xs text-muted-foreground">
          Every slot is taken. Finish something or abandon it — those are the only two ways
          to make room.
        </p>
      )}
    </div>
  );
}

function SlotCard({ book, onApply }: { book: Book; onApply: Props["onApply"] }) {
  const age = slotAge(book);
  const stale = isStale(book);
  const reading = book.engagement === "READING";

  return (
    <li className="rounded-lg border bg-card p-3">
      <div className="flex gap-3">
        <BookCover url={book.cover_url} title={book.title} className="h-14 w-10" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm leading-tight font-medium">{book.title}</p>
          <p className="truncate text-xs text-muted-foreground">{book.author}</p>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {isBuySignal(book) && (
              <Badge variant="default" className="gap-1 text-[10px]">
                <ShoppingCart className="size-2.5" />
                buy this
              </Badge>
            )}
            {reading && (
              <Badge variant="secondary" className="text-[10px]">
                reading
              </Badge>
            )}
            {age !== null && (
              <span
                className={
                  stale
                    ? "flex items-center gap-1 text-[11px] font-medium text-destructive"
                    : "text-[11px] text-muted-foreground"
                }
              >
                {stale && <AlertTriangle className="size-3" />}
                {age}d in this slot
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {isBuySignal(book) && (
          <Button size="sm" variant="outline" className="h-7 text-xs"
            onClick={() => onApply(book.id, acquire("OWNED"))}>
            Got it
          </Button>
        )}
        {!reading && book.acquisition !== "WANTED" && (
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs"
            onClick={() => onApply(book.id, start())}>
            <BookOpen className="size-3" /> Start
          </Button>
        )}
        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs"
          onClick={() => onApply(book.id, finish())}>
          <Check className="size-3" /> Finish
        </Button>
        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-muted-foreground"
          onClick={() => onApply(book.id, abandon())}>
          <X className="size-3" /> Abandon
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground"
          onClick={() => onApply(book.id, evict())}>
          Back to backlog
        </Button>
      </div>
    </li>
  );
}
