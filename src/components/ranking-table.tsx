import Link from "next/link";
import { ChevronRight, Crown } from "lucide-react";
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

export function RankingTable({
  rows,
  currentUserId,
  groupId,
}: {
  rows: RankingRow[];
  currentUserId: string;
  groupId: string;
}) {
  if (rows.length === 0 || rows.every((r) => r.points === 0)) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
        {copy.ranking.empty}
      </p>
    );
  }

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const [first, second, third] = podium;

  return (
    <div className="flex flex-col gap-6">
      {/* Podio */}
      <div className="flex items-end justify-center gap-2.5 pt-7 sm:gap-4">
        {second && (
          <PodiumPlace
            row={second}
            pos={2}
            groupId={groupId}
            isYou={second.userId === currentUserId}
          />
        )}
        {first && (
          <PodiumPlace
            row={first}
            pos={1}
            groupId={groupId}
            isYou={first.userId === currentUserId}
          />
        )}
        {third && (
          <PodiumPlace
            row={third}
            pos={3}
            groupId={groupId}
            isYou={third.userId === currentUserId}
          />
        )}
      </div>

      {/* Del 4º en adelante */}
      {rest.length > 0 && (
        <div className="stagger flex flex-col gap-2">
          {rest.map((row, i) => (
            <RankRow
              key={row.userId}
              row={row}
              pos={i + 4}
              groupId={groupId}
              isYou={row.userId === currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const PODIUM = {
  1: {
    avatar: 76,
    ring: "ring-gold",
    plinth: "h-24 bg-gilded text-primary-fg",
    points: "text-gilded",
  },
  2: {
    avatar: 60,
    ring: "ring-silver",
    plinth: "h-16 bg-surface-2 text-fg",
    points: "text-fg",
  },
  3: {
    avatar: 60,
    ring: "ring-bronze",
    plinth: "h-12 bg-surface-2 text-fg",
    points: "text-fg",
  },
} as const;

function PodiumPlace({
  row,
  pos,
  groupId,
  isYou,
}: {
  row: RankingRow;
  pos: 1 | 2 | 3;
  groupId: string;
  isYou: boolean;
}) {
  const s = PODIUM[pos];
  return (
    <Link
      href={`/groups/${groupId}/players/${row.userId}`}
      className="flex w-1/3 max-w-[8.5rem] flex-col items-center gap-2"
    >
      <div className="relative">
        {pos === 1 && (
          <Crown className="float-crown absolute -top-6 left-1/2 h-6 w-6 -translate-x-1/2 fill-gold/30 text-gold" />
        )}
        <Avatar
          url={row.avatarUrl}
          name={row.name}
          size={s.avatar}
          className={cn(
            "ring-2 ring-offset-2 ring-offset-bg",
            s.ring,
            pos === 1 && "shadow-[var(--shadow-gold)]",
          )}
        />
      </div>

      <div className="flex w-full flex-col items-center text-center">
        <p className="flex max-w-full items-center gap-1 truncate text-sm font-semibold tracking-tight">
          <span className="truncate">{row.name}</span>
        </p>
        {isYou && (
          <span className="text-[0.7rem] font-medium text-muted">
            ({copy.ranking.you})
          </span>
        )}
        <p className={cn("field-num font-display text-2xl font-semibold", s.points)}>
          {row.points}
        </p>
        <p className="text-[0.7rem] text-muted">
          {copy.ranking.exact}: {row.exact}
        </p>
      </div>

      <div
        className={cn(
          "flex w-full items-start justify-center rounded-t-xl border border-b-0 border-border pt-1.5 font-display text-lg font-bold",
          s.plinth,
        )}
      >
        {pos}
      </div>
    </Link>
  );
}

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
  return (
    <Link
      href={`/groups/${groupId}/players/${row.userId}`}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-[var(--shadow-soft)] transition hover:border-primary/40 hover:bg-primary-soft/25",
        isYou && "border-primary/45 bg-primary-soft/40",
      )}
    >
      <span className="field-num w-6 shrink-0 text-center text-base font-bold text-muted">
        {pos}
      </span>

      <Avatar url={row.avatarUrl} name={row.name} size={42} />

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
        <span className="field-num font-display text-xl font-semibold">
          {row.points}
        </span>
        <span className="ml-1 text-xs text-muted">
          {row.points === 1 ? "pt" : "pts"}
        </span>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
    </Link>
  );
}
