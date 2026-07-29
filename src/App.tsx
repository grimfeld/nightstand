import { useState } from "react";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { AuthGate } from "@/components/AuthGate";
import { BiometricGate } from "@/components/BiometricGate";
import { AddBookDialog } from "@/components/AddBookDialog";
import { Backlog } from "@/components/Backlog";
import { BookPage } from "@/components/BookPage";
import { Nightstand } from "@/components/Nightstand";
import { useBooks } from "@/hooks/useBooks";
import { backlog } from "@/lib/domain";

function Shell() {
  const { books, loading, error, refresh, apply, add, remove, setPhoto } = useBooks();
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState("nightstand");

  // Navigation is one book deep, so a nullable id is the whole router.
  const [openId, setOpenId] = useState<string | null>(null);
  const open = books.find((b) => b.id === openId);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-24">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Nightstand</h1>
        <Button variant="ghost" size="icon" onClick={() => void refresh()} aria-label="Refresh">
          <RefreshCw className="size-4" />
        </Button>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <p className="font-medium">Can't reach the server.</p>
          <p className="mt-0.5 text-muted-foreground">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center py-24">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : open ? (
        <BookPage
          book={open}
          onApply={apply}
          onPhoto={setPhoto}
          onDelete={remove}
          onBack={() => setOpenId(null)}
        />
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="nightstand">Nightstand</TabsTrigger>
            <TabsTrigger value="backlog">Backlog ({backlog(books).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="nightstand">
            <Nightstand
              books={books}
              onApply={apply}
              onPhoto={setPhoto}
              onOpen={setOpenId}
              onFillSlot={() => setTab("backlog")}
            />
          </TabsContent>

          <TabsContent value="backlog">
            <Backlog books={books} onApply={apply} onPhoto={setPhoto} onOpen={setOpenId} />
          </TabsContent>
        </Tabs>
      )}

      {!open && (
        <Button
          size="lg"
          onClick={() => setAdding(true)}
          className="fixed right-[max(1rem,calc(50%-15rem))] bottom-[max(1.25rem,env(safe-area-inset-bottom))] size-14 rounded-full shadow-lg"
          aria-label="Add a book"
        >
          <Plus className="size-6" />
        </Button>
      )}

      <AddBookDialog open={adding} onOpenChange={setAdding} existing={books} onAdd={add} />
    </div>
  );
}

export default function App() {
  return (
    <BiometricGate>
      <AuthGate>
        <Shell />
        <Toaster position="top-center" />
      </AuthGate>
    </BiometricGate>
  );
}
