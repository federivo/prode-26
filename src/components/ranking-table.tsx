import { cn } from "@/lib/utils";
import { copy } from "@/lib/copy";
import { Avatar } from "@/components/avatar";

export interface RankingRow {
  userId: string;
  name: string;
  avatarUrl: string | null;
  points: number;
  exact: number;
}

const MEDAL_RING: Record<number, string> = {
  1: "ring-gold",
  2: "ring-silver",
  3: "ring-bronze",
};

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
    <div className="flex flex-col gap-2">
      {rows.map((row, i) => {
        const pos = i + 1;
        const isYou = row.userId === currentUserId;
        const ring = MEDAL_RING[pos];
        return (
          <div
            key={row.userId}
            className={cn(
              "flex items-center gap-3 rounded-2xl border border-border bg-surface p-3",
              isYou && "border-primary/40 bg-primary-soft/50",
            )}
          >
            {/* Posición */}
            <span
              className={cn(
                "field-num w-6 shrink-0 text-center text-lg font-bold",
                pos <= 3 ? "text-fg" : "text-muted",
              )}
            >
              {pos}
            </span>

            {/* Avatar prominente, con aro de medalla para el podio */}
            <Avatar
              url={row.avatarUrl}
              name={row.name}
              size={pos === 1 ? 52 : 44}
              className={cn(ring && "ring-2 ring-offset-2 ring-offset-surface", ring)}
            />

            {/* Nombre + exactos */}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {row.name}
                {isYou && (
                  <span className="ml-1.5 text-xs font-normal text-muted">
                    ({copy.ranking.you})
                  </span>
                )}
              </p>
              <p className="text-xs text-muted">
                {copy.ranking.exact}: {row.exact}
              </p>
            </div>

            {/* Puntos */}
            <div className="shrink-0 text-right">
              <span className="field-num text-xl font-bold">{row.points}</span>
              <span className="ml-1 text-xs text-muted">
                {row.points === 1 ? "pt" : "pts"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
