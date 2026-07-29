import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Fingerprint } from "lucide-react";
import { authenticate, checkStatus } from "@tauri-apps/plugin-biometric";
import { Button } from "@/components/ui/button";
import { pb } from "@/lib/pb";

/**
 * Fingerprint/face lock over a restored session. Sits *outside* AuthGate on
 * purpose: a fresh password login is its own proof of presence, so only a
 * session revived from storage gets re-challenged.
 */
export function BiometricGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"checking" | "locked" | "open">("checking");

  const unlock = useCallback(async () => {
    let available: boolean;
    try {
      available = (await checkStatus()).isAvailable;
    } catch {
      // Desktop: the plugin is never registered, so there is nothing to unlock.
      setState("open");
      return;
    }
    if (!available) {
      setState("open");
      return;
    }
    try {
      await authenticate("Unlock Nightstand", { allowDeviceCredential: true });
      setState("open");
    } catch {
      setState("locked");
    }
  }, []);

  useEffect(() => {
    if (pb.authStore.isValid) void unlock();
    else setState("open");
  }, [unlock]);

  if (state === "open") return <>{children}</>;
  if (state === "checking") return null;

  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="space-y-4 text-center">
        <Fingerprint className="mx-auto size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Nightstand is locked.</p>
        <Button onClick={() => void unlock()}>Unlock</Button>
      </div>
    </div>
  );
}
