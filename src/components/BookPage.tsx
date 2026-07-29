import { useState } from "react";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { coverSrc } from "@/lib/pb";
import {
  ACQUISITION,
  ENGAGEMENT,
  onNightstand,
  type Acquisition,
  type Book,
  type Engagement,
  type Patch,
} from "@/lib/domain";

interface Props {
  book: Book;
  onApply: (id: string, patch: Patch) => void;
  onPhoto: (id: string, file: File) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

/** Everything the edit form touches, kept as strings so inputs stay simple. */
interface Form {
  title: string;
  author: string;
  publisher: string;
  genre: string;
  year: string;
  pages: string;
  acquisition: Acquisition;
  engagement: Engagement;
  studied: boolean;
  reason: string;
  added_on: string;
  acquired_on: string;
  started_on: string;
  finished_on: string;
}

const toForm = (b: Book): Form => ({
  title: b.title,
  author: b.author,
  publisher: b.publisher,
  genre: b.genre,
  year: b.year ? String(b.year) : "",
  pages: b.pages ? String(b.pages) : "",
  acquisition: b.acquisition,
  engagement: b.engagement,
  studied: b.studied,
  reason: b.reason,
  added_on: b.added_on,
  acquired_on: b.acquired_on,
  started_on: b.started_on,
  finished_on: b.finished_on,
});

const toPatch = (f: Form): Patch => ({
  title: f.title.trim() || "Untitled",
  author: f.author.trim(),
  publisher: f.publisher.trim(),
  genre: f.genre.trim(),
  year: Number(f.year) || 0,
  pages: Number(f.pages) || 0,
  acquisition: f.acquisition,
  engagement: f.engagement,
  studied: f.studied,
  reason: f.reason.trim(),
  added_on: f.added_on,
  acquired_on: f.acquired_on,
  started_on: f.started_on,
  finished_on: f.finished_on,
});

export function BookPage({ book, onApply, onPhoto, onDelete, onBack }: Props) {
  const [form, setForm] = useState<Form | null>(null);
  const [confirming, setConfirming] = useState(false);
  const editing = form !== null;

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const save = () => {
    if (!form) return;
    onApply(book.id, toPatch(form));
    setForm(null);
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
          <ArrowLeft className="size-4" />
        </Button>
        {!editing && (
          <Button variant="ghost" size="sm" className="gap-1 text-xs"
            onClick={() => setForm(toForm(book))}>
            <Pencil className="size-3" /> Edit
          </Button>
        )}
      </header>

      <div className="flex gap-4">
        {/* On its own page the cover is always retakeable, even over a real
            cover — this is where a bad Open Library scan gets replaced. */}
        <BookCover
          url={coverSrc(book)}
          title={book.title}
          className="h-44 w-30"
          onPhoto={(file) => onPhoto(book.id, file)}
        />
        <div className="min-w-0 flex-1 space-y-1.5 self-center">
          <h2 className="text-lg leading-tight font-semibold">{book.title}</h2>
          <p className="text-sm text-muted-foreground">{book.author}</p>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-[10px]">{book.acquisition}</Badge>
            <Badge variant="outline" className="text-[10px]">{book.engagement}</Badge>
            {book.studied && <Badge className="text-[10px]">studied</Badge>}
            {onNightstand(book) && (
              <Badge variant="secondary" className="text-[10px]">slot {book.slot}</Badge>
            )}
          </div>
        </div>
      </div>

      {editing ? (
        <EditForm form={form} set={set} onSave={save} onCancel={() => setForm(null)} />
      ) : (
        <Details book={book} />
      )}

      {!editing && (
        <div className="border-t pt-4">
          {confirming ? (
            <div className="flex items-center gap-2">
              <Button variant="destructive" size="sm" className="h-8 text-xs"
                onClick={() => { onDelete(book.id); onBack(); }}>
                Yes, delete it
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs"
                onClick={() => setConfirming(false)}>
                Keep it
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm"
              className="h-8 gap-1 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => setConfirming(true)}>
              <Trash2 className="size-3" /> Delete this book
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function Details({ book }: { book: Book }) {
  const rows: [string, string][] = [
    ["Publisher", book.publisher],
    ["Genre", book.genre],
    ["First published", book.year ? String(book.year) : ""],
    ["Pages", book.pages ? String(book.pages) : ""],
    ["Added", book.added_on],
    ["Acquired", book.acquired_on],
    ["Started", book.started_on],
    ["Finished", book.finished_on],
  ];

  return (
    <div className="space-y-4">
      {book.reason && (
        <div className="rounded-lg border bg-muted/40 p-3">
          <p className="text-xs font-medium text-muted-foreground">Why it's on the list</p>
          <p className="mt-1 text-sm italic">{book.reason}</p>
        </div>
      )}

      <dl className="divide-y rounded-lg border">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 px-3 py-2">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="truncate text-sm">{value || "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function EditForm({
  form,
  set,
  onSave,
  onCancel,
}: {
  form: Form;
  set: <K extends keyof Form>(key: K, value: Form[K]) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const text = (key: keyof Form, label: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input id={key} value={form[key] as string}
        onChange={(e) => set(key, e.target.value)} />
    </div>
  );

  const date = (key: keyof Form, label: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input id={key} type="date" value={form[key] as string}
        onChange={(e) => set(key, e.target.value)} />
    </div>
  );

  return (
    <div className="space-y-4">
      {text("title", "Title")}
      {text("author", "Author")}
      {text("publisher", "Publisher")}
      {text("genre", "Genre")}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="year">First published</Label>
          <Input id="year" type="number" inputMode="numeric" value={form.year}
            onChange={(e) => set("year", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pages">Pages</Label>
          <Input id="pages" type="number" inputMode="numeric" value={form.pages}
            onChange={(e) => set("pages", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="edit-acq">Acquisition</Label>
          <Select value={form.acquisition} onValueChange={(v) => set("acquisition", v as Acquisition)}>
            <SelectTrigger id="edit-acq" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ACQUISITION.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-eng">Engagement</Label>
          <Select value={form.engagement} onValueChange={(v) => set("engagement", v as Engagement)}>
            <SelectTrigger id="edit-eng" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ENGAGEMENT.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.studied}
          onChange={(e) => set("studied", e.target.checked)} className="size-4" />
        Studied
      </label>

      <div className="space-y-1.5">
        <Label htmlFor="edit-reason">Why it's on the list</Label>
        <Textarea id="edit-reason" rows={3} value={form.reason}
          onChange={(e) => set("reason", e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {date("added_on", "Added")}
        {date("acquired_on", "Acquired")}
        {date("started_on", "Started")}
        {date("finished_on", "Finished")}
      </div>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={onSave}>Save</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
