"use client";

import { useActionState, useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { savePrediction, type ActionState } from "@/app/actions";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";

const clamp = (n: number) => Math.max(0, Math.min(99, n));

export function PredictionInput({
  matchId,
  initialHome,
  initialAway,
}: {
  matchId: string;
  initialHome: number | null;
  initialAway: number | null;
}) {
  const [home, setHome] = useState<number | null>(initialHome);
  const [away, setAway] = useState<number | null>(initialAway);
  // Marcador del último guardado exitoso ("2-1"). El check se muestra mientras
  // el marcador actual coincide; al editar deja de coincidir y vuelve "Guardar".
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const [state, action, pending] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await savePrediction(prev, formData);
      if (result.ok) {
        setSavedKey(
          `${formData.get("home_score")}-${formData.get("away_score")}`,
        );
      }
      return result;
    },
    {},
  );

  const filled = home !== null && away !== null;
  const justSaved = !pending && filled && savedKey === `${home}-${away}`;

  return (
    <form action={action} className="flex w-full flex-col items-center gap-2.5">
      <input type="hidden" name="match_id" value={matchId} />

      <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-surface-2/60 px-2.5 py-2">
        <Stepper
          name="home_score"
          value={home}
          onChange={setHome}
          ariaLabel="Goles del local"
        />
        <span className="px-1 font-display text-2xl leading-none text-muted">
          –
        </span>
        <Stepper
          name="away_score"
          value={away}
          onChange={setAway}
          ariaLabel="Goles del visitante"
        />
      </div>

      <button
        type="submit"
        disabled={pending || !filled}
        className={cn(
          "inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-5 text-sm font-semibold tracking-tight transition disabled:opacity-50",
          justSaved
            ? "bg-primary-soft/70 text-fg"
            : "bg-gilded sheen text-primary-fg shadow-[var(--shadow-gold)] active:translate-y-px",
        )}
      >
        {pending ? (
          copy.matches.saving
        ) : justSaved ? (
          <>
            <Check className="h-4 w-4" strokeWidth={2.5} />
            {copy.matches.saved}
          </>
        ) : (
          copy.matches.save
        )}
      </button>

      {state.error && <p className="text-xs text-danger">{state.error}</p>}
    </form>
  );
}

function Stepper({
  name,
  value,
  onChange,
  ariaLabel,
}: {
  name: string;
  value: number | null;
  onChange: (v: number | null) => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        tabIndex={-1}
        aria-label={`${ariaLabel}: subir`}
        onClick={() => onChange(clamp((value ?? -1) + 1))}
        className="flex h-7 w-12 items-center justify-center rounded-lg text-muted transition hover:bg-primary-soft/70 hover:text-fg active:scale-90"
      >
        <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
      </button>

      <input
        type="number"
        name={name}
        inputMode="numeric"
        min={0}
        max={99}
        required
        aria-label={ariaLabel}
        value={value ?? ""}
        onChange={(e) =>
          onChange(
            e.target.value === ""
              ? null
              : clamp(parseInt(e.target.value, 10) || 0),
          )
        }
        className="field-num h-10 w-12 rounded-lg bg-transparent text-center font-display text-3xl font-semibold text-fg [appearance:textfield] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      <button
        type="button"
        tabIndex={-1}
        aria-label={`${ariaLabel}: bajar`}
        onClick={() => onChange(clamp((value ?? 0) - 1))}
        className="flex h-7 w-12 items-center justify-center rounded-lg text-muted transition hover:bg-primary-soft/70 hover:text-fg active:scale-90"
      >
        <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}
