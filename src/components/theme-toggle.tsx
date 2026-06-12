"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { copy } from "@/lib/copy";

type Mode = "system" | "light" | "dark";
const ORDER: Mode[] = ["system", "light", "dark"];

// ── Store externo: el tema vive en localStorage + el atributo data-theme ──────
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function getSnapshot(): Mode {
  const t = localStorage.getItem("theme");
  return t === "light" || t === "dark" ? t : "system";
}

function setMode(mode: Mode) {
  const root = document.documentElement;
  if (mode === "system") {
    localStorage.removeItem("theme");
    root.removeAttribute("data-theme");
  } else {
    localStorage.setItem("theme", mode);
    root.setAttribute("data-theme", mode);
  }
  listeners.forEach((l) => l());
}

const ICON = { system: Monitor, light: Sun, dark: Moon };

export function ThemeToggle() {
  // En el server y en la 1ª pintura asumimos "system"; el script inline ya aplicó
  // el color real, así que solo puede cambiar el ícono, sin flash de la página.
  const mode = useSyncExternalStore(subscribe, getSnapshot, () => "system" as Mode);
  const Icon = ICON[mode];

  function cycle() {
    setMode(ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length]);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      title={copy.theme[mode]}
      aria-label={copy.theme[mode]}
      className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-primary-soft/60 hover:text-fg"
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
}
