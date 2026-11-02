"use client";
import { useCallback, useEffect, useState } from "react";
import type { GiveHamperState } from "@/lib/give-hamper";

export function useGiveHamper() {
  const [state, setState] = useState<GiveHamperState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/give-hamper", { cache: "no-store" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Could not load your Give Hamper. Please retry.");
      setState(body as GiveHamperState);
      setError(null);
    } catch (failure) {
      setError((failure as Error).message);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return { state, setState, error, refresh };
}
