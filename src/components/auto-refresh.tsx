"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Refresca los Server Components cada N segundos (sin perder el estado de los
 * Client Components). Se monta solo cuando hay algo en vivo, así no refresca de
 * gusto. router.refresh re-ejecuta syncIfStale + vuelve a traer el marcador.
 */
export function AutoRefresh({ seconds = 45 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
