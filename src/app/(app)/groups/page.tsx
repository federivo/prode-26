import Link from "next/link";
import { Users, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMyGroups } from "@/lib/session";
import { copy } from "@/lib/copy";
import { Card } from "@/components/ui/card";
import { CreateGroupForm, JoinGroupForm } from "@/components/group-forms";
import { CopyCode } from "@/components/copy-code";
import { ShareLink } from "@/components/share-link";
import { ScoringInfo } from "@/components/scoring-info";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const groups = await getMyGroups();

  // Conteo de miembros por grupo (RLS deja ver las membresías de mis grupos).
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("memberships")
    .select("league_id");
  const counts = new Map<string, number>();
  for (const m of memberships ?? []) {
    counts.set(m.league_id, (counts.get(m.league_id) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{copy.groups.title}</h1>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
          {copy.groups.empty}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((g) => (
            <Card key={g.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-semibold">{g.name}</h2>
                    {g.role === "admin" && (
                      <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                        {copy.groups.adminBadge}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
                    <Users className="h-3.5 w-3.5" />
                    {copy.groups.members(counts.get(g.id) ?? 1)}
                  </p>
                </div>
                <Link
                  href={`/groups/${g.id}/ranking`}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-fg transition hover:brightness-105"
                >
                  {copy.groups.viewRanking}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-sm text-muted">
                <span>{copy.groups.inviteCode}:</span>
                <CopyCode code={g.invite_code} />
                <ShareLink code={g.invite_code} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <CreateGroupForm />
        <JoinGroupForm />
      </div>

      <ScoringInfo />
    </div>
  );
}
