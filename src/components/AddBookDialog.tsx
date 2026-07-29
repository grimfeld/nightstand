import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookCover } from "@/components/BookCover";
import { searchWorks, type WorkHit } from "@/lib/openlibrary";
import { ACQUISITION, today, type Acquisition, type Book, type BookDraft } from "@/lib/domain";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing: Book[];
  onAdd: (draft: BookDraft) => Promise<Book | null>;
}

export function AddBookDialog({ open, onOpenChange, existing, onAdd }: Props) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<WorkHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<WorkHit | null>(null);
  const [reason, setReason] = useState("");
  const [acquisition, setAcquisition] = useState<Acquisition>("WANTED");
  const [saving, setSaving] = useState(false);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  const reset = () => {
    setQuery("");
    setHits([]);
    setPicked(null);
    setReason("");
    setAcquisition("WANTED");
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  // Debounced search. Aborting in the cleanup means the last keystroke wins even
  // when an earlier request is slower to come back.
  useEffect(() => {
    if (picked || query.trim().length < 3) {
      setHits([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        setHits(await searchWorks(query, controller.signal));
      } catch (e) {
        if (!controller.signal.aborted) {
          toast.error(e instanceof Error ? e.message : "Open Library lookup failed");
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, picked]);

  const pick = (hit: WorkHit) => {
    const dup = existing.find((b) => b.work_key === hit.work_key);
    if (dup) {
      // The single most useful thing this app does in a bookshop.
      toast.warning(`Already on your list — ${dup.acquisition.toLowerCase()}, ${dup.engagement.toLowerCase()}`);
      return;
    }
    setPicked(hit);
    setTimeout(() => reasonRef.current?.focus(), 50);
  };

  const save = async () => {
    if (!picked) return;
    setSaving(true);
    const draft: BookDraft = {
      title: picked.title,
      author: picked.author,
      publisher: picked.publisher,
      genre: picked.genre,
      work_key: picked.work_key,
      cover_url: picked.cover_url,
      pages: picked.pages,
      year: picked.year,
      acquisition,
      engagement: "UNREAD",
      studied: false,
      reason: reason.trim(),
      slot: 0,
      added_on: today(),
      acquired_on: acquisition === "OWNED" || acquisition === "BORROWED" ? today() : "",
      slotted_on: "",
      started_on: "",
      finished_on: "",
    };
    const saved = await onAdd(draft);
    setSaving(false);
    if (saved) {
      toast.success(`Added ${saved.title}`);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a book</DialogTitle>
          <DialogDescription>
            {picked
              ? "Now the only part that matters: why is this on your list?"
              : "Search Open Library — author, cover and page count fill themselves in."}
          </DialogDescription>
        </DialogHeader>

        {!picked ? (
          <div className="space-y-3">
            <div className="relative">
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Seeing like a state…"
              />
              {searching && (
                <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            <ul className="space-y-1.5">
              {hits.map((hit) => (
                <li key={hit.work_key}>
                  <button
                    onClick={() => pick(hit)}
                    className="flex w-full gap-3 rounded-lg border p-2 text-left transition-colors hover:bg-accent"
                  >
                    <BookCover url={hit.cover_url} title={hit.title} className="h-12 w-8" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{hit.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {hit.author}
                        {hit.year ? `, ${hit.year}` : ""}
                        {hit.pages ? ` · ${hit.pages}pp` : ""}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
              {!searching && query.trim().length >= 3 && hits.length === 0 && (
                <li className="py-6 text-center text-sm text-muted-foreground">
                  Nothing found.
                </li>
              )}
            </ul>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-3 rounded-lg border bg-muted/40 p-2">
              <BookCover url={picked.cover_url} title={picked.title} className="h-14 w-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{picked.title}</p>
                <p className="truncate text-xs text-muted-foreground">{picked.author}</p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 self-start text-xs"
                onClick={() => setPicked(null)}>
                Change
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reason">Why do you want it?</Label>
              <Textarea
                id="reason"
                ref={reasonRef}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Who recommended it, or what made you want it. Future you will not remember."
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="acq">Do you have it?</Label>
              <Select value={acquisition} onValueChange={(v) => setAcquisition(v as Acquisition)}>
                <SelectTrigger id="acq"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACQUISITION.filter((a) => a !== "GONE").map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={save} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Add to backlog
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
