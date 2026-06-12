"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { savePrediction, type ActionState } from "@/app/actions";
import { copy } from "@/lib/copy";

export function PredictionInput({
  matchId,
  initialHome,
  initialAway,
}: {
  matchId: string;
  initialHome: number | null;
  initialAway: number | null;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    savePrediction,
    {},
  );

  // El check aparece cuando el último guardado fue exitoso. Al reenviar queda
  // pendiente y vuelve a confirmar.
  const saved = state.ok && !pending;

  return (
    <form action={action} className="flex flex-col items-center gap-1">
      <input type="hidden" name="match_id" value={matchId} />
      <div className="flex items-center gap-1.5">
        <ScoreBox name="home_score" defaultValue={initialHome} />
        <span className="text-muted">-</span>
        <ScoreBox name="away_score" defaultValue={initialAway} />
        <button
          type="submit"
          disabled={pending}
          className="ml-1 flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-fg transition hover:brightness-105 disabled:opacity-50"
        >
          {saved ? <Check className="h-4 w-4" /> : copy.matches.save}
        </button>
      </div>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
    </form>
  );
}

function ScoreBox({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: number | null;
}) {
  return (
    <input
      type="number"
      name={name}
      min={0}
      max={99}
      required
      defaultValue={defaultValue ?? ""}
      className="field-num h-9 w-12 rounded-lg border border-border bg-surface text-center text-base font-semibold text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    />
  );
}
