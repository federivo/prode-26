import { Target, Trophy } from "lucide-react";
import { copy } from "@/lib/copy";

export function ScoringInfo() {
  return (
    <div className="rounded-2xl border border-border bg-primary-soft/40 p-4">
      <h3 className="mb-3 text-sm font-semibold">{copy.scoring.title}</h3>
      <ul className="flex flex-col gap-2 text-sm">
        <li className="flex items-center gap-2">
          <Target className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-muted">{copy.scoring.exact}</span>
          <span className="ml-auto font-semibold">{copy.scoring.exactPts}</span>
        </li>
        <li className="flex items-center gap-2">
          <Trophy className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-muted">{copy.scoring.outcome}</span>
          <span className="ml-auto font-semibold">{copy.scoring.outcomePts}</span>
        </li>
      </ul>
      <p className="mt-3 text-xs text-muted">{copy.scoring.weighted}</p>
    </div>
  );
}
