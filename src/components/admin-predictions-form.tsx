"use client";

import { useState, useTransition } from "react";
import { Check, Save } from "lucide-react";
import { adminSavePredictions } from "@/app/actions";
import { copy } from "@/lib/copy";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";

export interface AdminUserRow {
  id: string;
  name: string;
  avatarUrl: string | null;
  home: string;
  away: string;
  points: number | null;
}

export function AdminPredictionsForm({
  matchId,
  finished,
  users,
}: {
  matchId: string;
  finished: boolean;
  users: AdminUserRow[];
}) {
  const [rows, setRows] = useState<AdminUserRow[]>(users);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update(id: string, field: "home" | "away", value: string) {
    setRows((rs) =>
      rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  }

  function handleSave() {
    setMessage(null);
    setError(null);
    // Solo las filas con ambos marcadores cargados.
    const entries = rows
      .filter((r) => r.home !== "" && r.away !== "")
      .map((r) => ({
        user_id: r.id,
        home_score: Number(r.home),
        away_score: Number(r.away),
      }));

    startTransition(async () => {
      const res = await adminSavePredictions(matchId, entries);
      if (res.error) setError(res.error);
      else setMessage(copy.admin.predictionsSaved(res.saved ?? 0));
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-3 border-b border-border p-3 last:border-0"
          >
            <Avatar url={r.avatarUrl} name={r.name} size={32} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {r.name}
            </span>
            {finished && r.points !== null && (
              <span className="field-num rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                {r.points} {copy.admin.pointsCol}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <ScoreInput
                value={r.home}
                onChange={(v) => update(r.id, "home", v)}
              />
              <span className="text-muted">-</span>
              <ScoreInput
                value={r.away}
                onChange={(v) => update(r.id, "away", v)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={pending}>
          {pending ? (
            copy.admin.savingPredictions
          ) : (
            <>
              <Save className="h-4 w-4" />
              {copy.admin.savePredictions}
            </>
          )}
        </Button>
        {message && (
          <span className="flex items-center gap-1 text-sm text-primary">
            <Check className="h-4 w-4" />
            {message}
          </span>
        )}
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    </div>
  );
}

function ScoreInput({
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
