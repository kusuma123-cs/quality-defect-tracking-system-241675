"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Defect } from "@/lib/types";
import { ensureStorageInitialized, getDefects } from "@/lib/storage";

/**
 * Local event name for cross-component store updates.
 * This avoids needing a backend or external state library.
 */
const EVENT_NAME = "qdt:storage-updated";

// PUBLIC_INTERFACE
export function notifyStoreUpdated(): void {
  /** Notify all listeners that the local defect store has been updated. */
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT_NAME));
}

// PUBLIC_INTERFACE
export function useDefectsStore(): { defects: Defect[]; refresh: () => void } {
  /** Subscribe to local defect store changes and expose a refresh() method. */
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    ensureStorageInitialized();
    const onUpdate = () => refresh();
    window.addEventListener(EVENT_NAME, onUpdate);
    // Also react to changes from other tabs
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [refresh]);

  const defects = useMemo(() => {
    // version used to force recalculation
    void version;
    return getDefects();
  }, [version]);

  return { defects, refresh };
}
