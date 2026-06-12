import { Target, Trophy, Crosshair, Hash } from "lucide-react";
import { copy } from "@/lib/copy";

const TIERS = [
  { icon: Target, label: copy.scoring.exact, pts: copy.scoring.exactPts },
  {
    icon: Crosshair,
    label: copy.scoring.outcomeOneSide,
    pts: copy.scoring.outcomeOneSidePts,
  },
  { icon: Trophy, label: copy.scoring.outcome, pts: copy.scoring.outcomePts },
  { icon: Hash, label: copy.scoring.oneSide, pts: copy.scoring.oneSidePts },
];

export function ScoringInfo() {
  return (
    <div className="rounded-2xl border border-border bg-primary-soft/40 p-4">
      <h3 className="mb-3 text-sm font-semibold">{copy.scoring.title}</h3>
      <ul className="flex flex-col gap-2 text-sm">
        {TIERS.map((t) => (
          <li key={t.label} className="flex items-center gap-2">
            <t.icon className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-muted">{t.label}</span>
            <span className="ml-auto shrink-0 font-semibold">{t.pts}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
