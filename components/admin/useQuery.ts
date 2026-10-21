"use client";

import { useEffect, useState } from "react";

/** Reads one ?param from the URL after mount (avoids a Suspense boundary for useSearchParams). */
export function useQuery(name: string) {
  const [v, setV] = useState<string | null>(null);
  useEffect(() => setV(new URLSearchParams(location.search).get(name)), [name]);
  return v;
}
