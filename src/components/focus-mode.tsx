"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  RotateCcw,
  Star,
  Trophy,
} from "lucide-react";
import { savePrediction } from "@/app/actions";
import type { Match } from "@/lib/supabase/types";
import { copy } from "@/lib/copy";
import { cn, formatKickoff } from "@/lib/utils";
import { Flag } from "@/components/flag";

type Score = { home: number | null; away: number | null };

const GOALS = Array.from({ length: 11 }, (_, n) => n);

export function FocusMode({
  matches,
  initialPredictions,
}: {
  matches: Match[];
  initialPredictions: Record<string, { home: number; away: number }>;
}) {
  const [picks, setPicks] = useState<Record<string, Score>>(() => {
    const map: Record<string, Score> = {};
    for (const [id, p] of Object.entries(initialPredictions)) {
      map[id] = { home: p.home, away: p.away };
    }
    return map;
  });
  // Último marcador guardado con éxito por partido ("2-1"): mientras el pick
  // actual coincida se muestra el check; al tocar otro chip vuelve a guardar.
  const [savedKeys, setSavedKeys] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(initialPredictions).map(([id, p]) => [
        id,
        `${p.home}-${p.away}`,
      ]),
    ),
  );
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  // Arranca en el primer partido sin pronóstico; si están todos, en el primero.
  const [index, setIndex] = useState(() => {
    const i = matches.findIndex((m) => !initialPredictions[m.id]);
    return i === -1 ? 0 : i;
  });
  const [, startTransition] = useTransition();

  const total = matches.length;
  const done = index >= total;
  // Cuenta pronósticos guardados de verdad (no picks locales que pudieron fallar).
  const predicted = matches.filter((m) => savedKeys[m.id]).length;

  if (total === 0) {
    return (
      <FocusShell>
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
          {copy.focus.empty}
        </p>
      </FocusShell>
    );
  }

  const save = (matchId: string, home: number, away: number) => {
    setSaving((s) => ({ ...s, [matchId]: true }));
    startTransition(async () => {
      const formData = new FormData();
      formData.set("match_id", matchId);
      formData.set("home_score", String(home));
      formData.set("away_score", String(away));
      const result = await savePrediction({}, formData);
      setSaving((s) => ({ ...s, [matchId]: false }));
      if (result.ok) {
        setSavedKeys((s) => ({ ...s, [matchId]: `${home}-${away}` }));
      } else {
        setError(result.error ?? null);
      }
    });
  };

  const pick = (matchId: string, side: "home" | "away", value: number) => {
    setError(null);
    const next: Score = {
      ...(picks[matchId] ?? { home: null, away: null }),
      [side]: value,
    };
    setPicks((p) => ({ ...p, [matchId]: next }));
    if (next.home !== null && next.away !== null) {
      save(matchId, next.home, next.away);
    }
  };

  const goTo = (i: number) => {
    setError(null);
    setIndex(i);
  };

  if (done) {
    return (
      <FocusShell>
        <div className="animate-rise gilded-edge flex flex-col items-center gap-3 rounded-2xl border border-primary/45 bg-surface p-8 text-center shadow-[var(--shadow-soft)]">
          <span className="bg-gilded sheen flex h-14 w-14 items-center justify-center rounded-full shadow-[var(--shadow-gold)]">
            <Trophy className="h-7 w-7" strokeWidth={2} />
          </span>
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            {copy.focus.doneTitle}
          </h2>
          <p className="text-sm text-muted">{copy.focus.doneSubtitle}</p>
          <p className="field-num text-sm font-semibold text-fg">
            {predicted}/{total}
          </p>
          <div className="mt-2 flex flex-col items-center gap-2.5 sm:flex-row">
            <Link
              href="/matches"
              className="bg-gilded sheen inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-5 text-sm font-semibold tracking-tight text-primary-fg shadow-[var(--shadow-gold)] active:translate-y-px"
            >
              <LayoutList className="h-4 w-4" strokeWidth={2.25} />
              {copy.focus.backToList}
            </Link>
            <button
              type="button"
              onClick={() => goTo(0)}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-5 text-sm font-semibold tracking-tight text-fg transition hover:bg-primary-soft/70"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2.25} />
              {copy.focus.startOver}
            </button>
          </div>
        </div>
      </FocusShell>
    );
  }

  const match = matches[index];
  const current = picks[match.id] ?? { home: null, away: null };
  const filled = current.home !== null && current.away !== null;
  const isSaving = !!saving[match.id];
  const justSaved =
    !isSaving &&
    filled &&
    savedKeys[match.id] === `${current.home}-${current.away}`;
  const isFinal = match.stage === "FINAL";
  const knockout = match.stage !== "GROUP";
  const isLast = index === total - 1;

  return (
    <FocusShell>
      {/* Progreso: posición en el mazo + cuántos ya tienen pronóstico */}
      <div>
        <div className="flex items-center justify-between text-xs font-medium text-muted">
          <span>{copy.focus.progress(index + 1, total)}</span>
          <span className="field-num flex items-center gap-1">
            <Check className="h-3 w-3" strokeWidth={2.5} />
            {predicted}/{total}
          </span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="bg-gilded h-full rounded-full transition-all duration-300"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <article
        key={match.id}
        className={cn(
          "animate-rise gilded-edge relative overflow-hidden rounded-2xl border bg-surface p-5 shadow-[var(--shadow-soft)]",
          isFinal ? "border-primary/45" : "border-border",
        )}
      >
        {isFinal && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-20 h-32 bg-primary/10 blur-2xl"
          />
        )}

        <div className="relative mb-5 flex items-start justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.08em]",
              knockout
                ? "bg-primary-soft/60 text-fg ring-1 ring-primary/35"
                : "bg-surface-2 text-muted",
            )}
          >
            {isFinal && <Star className="h-3 w-3 fill-primary text-primary" />}
            {isFinal ? "La Final" : (copy.stages[match.stage] ?? match.stage)}
          </span>
          <span className="field-num text-xs font-medium capitalize text-muted">
            {formatKickoff(match.kickoff)}
          </span>
        </div>

        <div className="relative flex flex-col gap-5">
          <TeamPicker
            name={match.home_team}
            value={current.home}
            onPick={(n) => pick(match.id, "home", n)}
          />
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="font-display text-sm font-medium italic text-muted">
              {copy.common.vs}
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <TeamPicker
            name={match.away_team}
            value={current.away}
            onPick={(n) => pick(match.id, "away", n)}
          />
        </div>

        {/* Estado del guardado automático */}
        <div className="relative mt-5 flex h-5 items-center justify-center text-xs font-medium">
          {error ? (
            <p className="text-danger">{error}</p>
          ) : isSaving ? (
            <span className="text-muted">{copy.focus.saving}</span>
          ) : justSaved ? (
            <span className="flex items-center gap-1 text-accent">
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              {copy.focus.saved}
            </span>
          ) : (
            <span className="text-muted">{copy.focus.tapToPick}</span>
          )}
        </div>
      </article>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="inline-flex h-11 flex-1 items-center justify-center gap-1 rounded-full border border-border bg-surface text-sm font-semibold tracking-tight text-fg transition hover:bg-primary-soft/70 disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
          {copy.focus.back}
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          className="bg-gilded sheen inline-flex h-11 flex-1 items-center justify-center gap-1 rounded-full text-sm font-semibold tracking-tight text-primary-fg shadow-[var(--shadow-gold)] active:translate-y-px"
        >
          {isLast ? copy.focus.finish : copy.focus.next}
          <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </FocusShell>
  );
}

function FocusShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-gilded text-xs font-semibold uppercase tracking-[0.18em]">
            Mundial 2026
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            {copy.focus.title}
          </h1>
          <p className="mt-1.5 text-sm text-muted">{copy.focus.subtitle}</p>
        </div>
        <Link
          href="/matches"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-xs font-semibold tracking-tight text-fg transition hover:bg-primary-soft/70"
        >
          <LayoutList className="h-3.5 w-3.5" strokeWidth={2.25} />
          {copy.focus.exit}
        </Link>
      </header>
      {children}
    </div>
  );
}

function TeamPicker({
  name,
  value,
  onPick,
}: {
  name: string | null;
  value: number | null;
  onPick: (n: number) => void;
}) {
  const label = name ?? "A definir";
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2.5">
        <Flag name={name} size={30} />
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-base font-semibold tracking-tight",
            !name && "text-muted",
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "field-num font-display text-3xl font-semibold leading-none",
            value === null ? "text-muted/50" : "text-fg",
          )}
        >
          {value ?? "–"}
        </span>
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {GOALS.map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`Goles de ${label}: ${n}`}
            aria-pressed={value === n}
            onClick={() => onPick(n)}
            className={cn(
              "field-num h-10 rounded-xl text-sm font-semibold transition active:scale-90",
              value === n
                ? "bg-gilded sheen text-primary-fg shadow-[var(--shadow-gold)]"
                : "bg-surface-2 text-muted hover:bg-primary-soft/70 hover:text-fg",
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
