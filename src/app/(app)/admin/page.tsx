import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Pencil, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/session";
import { copy } from "@/lib/copy";
import { formatKickoff } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminSync } from "@/components/admin-sync";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireSession();
  if (!session.profile?.is_app_admin) redirect("/groups");

  const supabase = await createClient();
  const [{ count }, { data: sync }] = await Promise.all([
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase.from("sync_state").select("last_synced_at").eq("id", true).maybeSingle(),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold tracking-tight">{copy.admin.title}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{copy.nav.matches}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">{copy.admin.matchCount(count ?? 0)}</dt>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{copy.admin.lastSync}:</dt>
              <dd>
                {sync?.last_synced_at
                  ? formatKickoff(sync.last_synced_at)
                  : copy.admin.never}
              </dd>
            </div>
          </dl>
          <AdminSync />
        </CardContent>
      </Card>

      <Link
        href="/admin/predictions"
        className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:bg-primary-soft/40"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Pencil className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{copy.admin.editPredictions}</span>
          <span className="block text-sm text-muted">
            {copy.admin.editPredictionsDesc}
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
      </Link>

      <Link
        href="/admin/users"
        className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:bg-primary-soft/40"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Users className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{copy.admin.users}</span>
          <span className="block text-sm text-muted">{copy.admin.usersDesc}</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
      </Link>
    </div>
  );
}
