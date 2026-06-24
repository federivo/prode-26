import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/copy";
import { Avatar } from "@/components/avatar";
import { AutoRefresh } from "@/components/auto-refresh";
import { Last5Strip } from "@/components/last5-strip";
import type { RankingRow } from "@/lib/ranking";

export type { RankingRow };

export function RankingTable({
  rows,
  currentUserId,
  groupId,
}: {
  rows: RankingRow[];
  currentUserId: string;
  groupId: string;
}) {
  // Hay partidos empezados si alguna fila tiene celdas en la franja.
  const started = (rows[0]?.last5.length ?? 0) > 0;

  if (rows.length === 0 || (!started && rows.every((r) => r.points === 0))) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
        {copy.ranking.empty}
      </p>
    );
  }

  const hasLive = rows.some((r) => r.last5.some((c) => c.live));

  return (
    <div className="stagger flex flex-col gap-2">
      {rows.map((row, i) => (
        <RankRow
          key={row.userId}
          row={row}
          pos={i + 1}
          groupId={groupId}
          isYou={row.userId === currentUserId}
        />
      ))}

      {/* Mientras haya algo en vivo, recalcula el provisorio solo. */}
      {hasLive && <AutoRefresh seconds={45} />}
    </div>
  );
}

// Anillo "medalla" para el top 3, conservando el aire de podio en la lista.
const MEDAL_RING: Record<number, string> = {
  1: "ring-gold",
  2: "ring-silver",
  3: "ring-bronze",
};

function RankRow({
  row,
  pos,
  groupId,
  isYou,
}: {
  row: RankingRow;
  pos: number;
  groupId: string;
  isYou: boolean;
}) {
  const ring = MEDAL_RING[pos];
  const top = pos === 1;

  return (
    <Link
      href={`/groups/${groupId}/players/${row.userId}`}
      className={cn(
        "block rounded-2xl border border-border bg-surface p-3 shadow-[var(--shadow-soft)] transition hover:border-primary/40 hover:bg-primary-soft/25",
        isYou && "border-primary/45 bg-primary-soft/40",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "field-num w-6 shrink-0 text-center text-base font-bold",
            top ? "text-gilded" : "text-muted",
          )}
        >
          {pos}
        </span>

        <Avatar
          url={row.avatarUrl}
          name={row.name}
          size={42}
          className={cn(ring && "ring-2 ring-offset-2 ring-offset-bg", ring)}
        />

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold tracking-tight">
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

        <div className="shrink-0 text-right">
          <div>
            <span
              className={cn(
                "field-num font-display text-xl font-semibold",
                top && "text-gilded",
              )}
            >
              {row.points}
            </span>
            <span className="ml-1 text-xs text-muted">
              {row.points === 1 ? "pt" : "pts"}
            </span>
          </div>
          {row.livePoints > 0 && (
            <span className="flex items-center justify-end gap-1 text-[0.7rem] font-semibold text-danger">
              <span className="dot-live h-1 w-1 rounded-full bg-danger" />
              {copy.ranking.liveNote(row.livePoints)}
            </span>
          )}
        </div>

        <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
      </div>

      <Last5Strip cells={row.last5} />
    </Link>
  );
}
