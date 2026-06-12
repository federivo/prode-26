"use client";

import { useState, useTransition } from "react";
import { adminSetPredictionsOpen } from "@/app/actions";
import { copy } from "@/lib/copy";

export function AdminOpenToggle({
  matchId,
  initialOpen,
}: {
  matchId: string;
  initialOpen: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(next: boolean) {
    setOpen(next); // optimista
    setError(null);
    startTransition(async () => {
      const res = await adminSetPredictionsOpen(matchId, next);
      if (res.error) {
        setOpen(!next); // revertir
        setError(res.error);
      }
    });
  }

  return (
    <div className="gilded-edge overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={open}
          disabled={pending}
          onChange={(e) => toggle(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
        />
        <span>
          <span className="block text-sm font-medium">
            {copy.admin.openForPlayers}
          </span>
          <span className="block text-xs text-muted">
            {copy.admin.openForPlayersHint}
          </span>
        </span>
      </label>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
