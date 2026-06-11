import { Trophy } from "lucide-react";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";

export interface RankingRow {
  userId: string;
  name: string;
  points: number;
  exact: number;
}

export function RankingTable({
  rows,
  currentUserId,
}: {
  rows: RankingRow[];
  currentUserId: string;
}) {
  if (rows.length === 0 || rows.every((r) => r.points === 0)) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
        {copy.ranking.empty}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            <th className="w-12 px-4 py-2.5 font-medium">{copy.ranking.position}</th>
            <th className="px-2 py-2.5 font-medium">{copy.ranking.player}</th>
            <th className="px-3 py-2.5 text-right font-medium">{copy.ranking.exact}</th>
            <th className="px-4 py-2.5 text-right font-medium">{copy.ranking.points}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const pos = i + 1;
            const isYou = row.userId === currentUserId;
            return (
              <tr
                key={row.userId}
                className={cn(
                  "border-b border-border last:border-0",
                  isYou && "bg-primary-soft/60",
                )}
              >
                <td className="px-4 py-3">
                  <PositionBadge pos={pos} />
                </td>
                <td className="px-2 py-3 font-medium">
                  {row.name}
                  {isYou && (
                    <span className="ml-1.5 text-xs text-muted">({copy.ranking.you})</span>
                  )}
                </td>
                <td className="field-num px-3 py-3 text-right text-muted">{row.exact}</td>
                <td className="field-num px-4 py-3 text-right font-bold">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PositionBadge({ pos }: { pos: number }) {
  const medal =
    pos === 1
      ? "bg-gold text-black"
      : pos === 2
        ? "bg-silver text-black"
        : pos === 3
          ? "bg-bronze text-white"
          : "text-muted";

  if (pos <= 3) {
    return (
      <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full", medal)}>
        {pos === 1 ? <Trophy className="h-3.5 w-3.5" /> : pos}
      </span>
    );
  }
  return <span className="pl-1.5 font-medium">{pos}</span>;
}
