import { useEffect, useState } from "react";
import { checkPermissions } from "@tauri-apps/plugin-barcode-scanner";

/** True where the barcode-scanner plugin exists — i.e. on mobile. On desktop
 *  the invoke rejects and the scan button simply never appears. */
export function useScannerAvailable(): boolean {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    checkPermissions()
      .then(() => mounted && setAvailable(true))
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return available;
}
