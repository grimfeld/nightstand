import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import {
  Format,
  cancel,
  checkPermissions,
  requestPermissions,
  scan,
} from "@tauri-apps/plugin-barcode-scanner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Full-screen ISBN scan. The camera preview renders *behind* the webview, so
 * while this is mounted the `scanning` class on <html> strips every background
 * (see index.css) and the caller must hide the rest of the app. What remains
 * on screen is this component: a viewfinder cut out of a dimmed backdrop.
 */
export function BarcodeScanner({
  onScan,
  onCancel,
}: {
  onScan: (isbn: string) => void;
  onCancel: () => void;
}) {
  // The scan promise survives re-renders; refs keep the latest callbacks
  // without restarting the camera.
  const onScanRef = useRef(onScan);
  const onCancelRef = useRef(onCancel);
  onScanRef.current = onScan;
  onCancelRef.current = onCancel;

  useEffect(() => {
    let active = true;
    document.documentElement.classList.add("scanning");

    (async () => {
      try {
        let permission = await checkPermissions();
        if (permission !== "granted") permission = await requestPermissions();
        if (permission !== "granted") {
          toast.error("Camera permission was denied.");
          onCancelRef.current();
          return;
        }

        // Book barcodes are Bookland EAN-13 (978/979 prefix) = the ISBN-13.
        const result = await scan({ windowed: true, formats: [Format.EAN13] });
        if (active) onScanRef.current(result.content);
      } catch {
        // Either the user backed out or the scan was cancelled by unmount.
        if (active) onCancelRef.current();
      }
    })();

    return () => {
      active = false;
      document.documentElement.classList.remove("scanning");
      void cancel().catch(() => {});
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50">
      {/* Viewfinder: the box stays transparent, the shadow dims everything else. */}
      <div className="absolute top-1/2 left-1/2 h-40 w-72 -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-white/80 shadow-[0_0_0_200vmax_rgba(0,0,0,0.55)]" />
      <p className="absolute right-0 bottom-32 left-0 text-center text-sm text-white/90">
        Point at the barcode on the back of the book
      </p>
      <Button
        variant="secondary"
        size="icon"
        onClick={onCancel}
        aria-label="Cancel scan"
        className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 rounded-full"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
