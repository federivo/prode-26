"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { ScoringInfo } from "@/components/scoring-info";
import { copy } from "@/lib/copy";

/**
 * Botón de ayuda del header que abre un flyout con la tarjeta "Cómo se puntúa".
 * Vive dentro del contenedor `relative` del header: el panel se ancla a la
 * derecha de ese contenedor, así queda pegado al botón en desktop y bien
 * adentro del viewport en mobile.
 */
export function ScoringHelp() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Cerrar al navegar a otra página: ajuste de estado en render comparando con
  // el pathname anterior (patrón recomendado por React, sin efecto).
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Mientras está abierto: cerrar al tocar afuera o con Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="scoring-help-panel"
        title={copy.scoring.title}
        aria-label={copy.scoring.title}
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-primary-soft/60 hover:text-fg"
      >
        <HelpCircle className="h-[18px] w-[18px]" />
      </button>

      {open && (
        <div
          ref={panelRef}
          id="scoring-help-panel"
          role="dialog"
          aria-label={copy.scoring.title}
          className="animate-rise absolute right-4 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))]"
        >
          <ScoringInfo />
        </div>
      )}
    </>
  );
}
