"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { adminSetMatchResult, adminClearMatchResult } from "@/app/actions";
import { copy } from "@/lib/copy";
import { Button } from "@/components/ui/button";

export function AdminResultForm({
  matchId,
  initialHome,
  initialAway,
  finished,
  manual,
}: {
  matchId: string;
  initialHome: number | null;
  initialAway: number | null;
  finished: boolean;
  manual: boolean;
}) {
  const [home, setHome] = useState(initialHome === null ? "" : String(initialHome));
  const [away, setAway] = useState(initialAway === null ? "" : String(initialAway));
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function save() {
    setMessage(null);
    setError(null);
    if (home === "" || away === "") {
      setError("Cargá los dos marcadores.");
      return;
    }
    startTransition(async () => {
      const res = await adminSetMatchResult(matchId, Number(home), Number(away));
      if (res.error) setError(res.error);
      else setMessage(copy.admin.resultSaved);
    });
  }

  function clear() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await adminClearMatchResult(matchId);
      if (res.error) setError(res.error);
      else {
        setHome("");
        setAway("");
      }
    });
  }

  const source = finished
    ? manual
      ? copy.admin.resultFromManual
      : copy.admin.resultFromApi
    : null;

  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <p className="mb-1 text-sm font-medium">{copy.admin.resultTitle}</p>
      <p className="mb-3 text-xs text-muted">{copy.admin.resultHint}</p>

      <div className="flex items-center gap-2">
        <Score value={home} onChange={setHome} />
        <span className="text-muted">-</span>
        <Score value={away} onChange={setAway} />
        <Button onClick={save} disabled={pending} className="ml-1 shrink-0">
          {copy.admin.saveResult}
        </Button>
        {manual && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            disabled={pending}
            className="shrink-0"
          >
            {copy.admin.clearResult}
          </Button>
        )}
      </div>

      {source && <p className="mt-2 text-xs text-muted">{source}</p>}
      {message && (
        <p className="mt-2 flex items-center gap-1 text-sm text-primary">
          <Check className="h-4 w-4" />
          {message}
        </p>
      )}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}

function Score({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      max={99}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="field-num h-9 w-12 rounded-lg border border-border bg-surface text-center text-base font-semibold text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    />
  );
}
