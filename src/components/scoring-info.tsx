import { Target, Trophy, Crosshair, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/copy";

const TIERS = [
  { icon: Target, label: copy.scoring.exact, pts: copy.scoring.exactPts, top: true },
  {
    icon: Crosshair,
    label: copy.scoring.outcomeOneSide,
    pts: copy.scoring.outcomeOneSidePts,
    top: false,
  },
  { icon: Trophy, label: copy.scoring.outcome, pts: copy.scoring.outcomePts, top: false },
  { icon: Hash, label: copy.scoring.oneSide, pts: copy.scoring.oneSidePts, top: false },
];

export function ScoringInfo() {
  return (
    <div className="gilded-edge relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
      <h3 className="mb-4 font-display text-base font-semibold tracking-tight">
        {copy.scoring.title}
      </h3>
      <ul className="flex flex-col gap-1">
        {TIERS.map((t) => (
          <li
            key={t.label}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2",
              t.top && "bg-primary-soft/50 ring-1 ring-primary/25",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                t.top ? "bg-gilded text-primary-fg" : "bg-surface-2 text-muted",
              )}
            >
              <t.icon className="h-4 w-4" />
            </span>
            <span className="text-sm text-fg/90">{t.label}</span>
            <span
              className={cn(
                "field-num ml-auto shrink-0 font-display text-base font-semibold",
                t.top && "text-gilded",
              )}
            >
              {t.pts}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
