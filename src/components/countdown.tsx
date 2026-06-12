"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Cuenta regresiva HH:MM:SS que aparece solo cuando faltan ≤ 24 h para el
 * inicio. Se pone en rojo en la última hora. Es un componente cliente: depende
 * de la hora actual y tiquea cada segundo. Para no montar 100 intervalos en la
 * lista, solo arranca el reloj si el partido ya está dentro de la ventana de 24h.
 */
export function Countdown({ kickoff }: { kickoff: string }) {
  const target = new Date(kickoff).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // Solo arrancamos el reloj si el partido ya está dentro de la ventana de
    // 24 h (evita montar 100 intervalos en la lista). El primer tic llega en
    // ≤ 1 s; hasta entonces `now` es null y no se muestra nada.
    const ms = target - Date.now();
    if (ms <= 0 || ms > DAY_MS) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  // SSR y primer render: nada (evita desajuste de hidratación; la hora es cliente).
  if (now === null) return null;

  const ms = target - now;
  if (ms <= 0 || ms > DAY_MS) return null;

  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const urgent = ms < HOUR_MS;

  return (
    <span
      role="timer"
      aria-label={`Faltan ${pad(h)}:${pad(m)}:${pad(s)} para el partido`}
      className={cn(
        "field-num inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold tabular-nums",
        urgent
          ? "bg-danger/12 text-danger ring-1 ring-danger/30"
          : "bg-primary-soft/60 text-fg ring-1 ring-primary/25",
      )}
    >
      <Clock className={cn("h-3 w-3", urgent && "dot-live")} />
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}
