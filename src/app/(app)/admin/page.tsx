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
    <div className="stagger flex flex-col gap-6">
      <header>
        <p className="text-gilded text-xs font-semibold uppercase tracking-[0.18em]">
          Panel
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          {copy.admin.title}
        </h1>
      </header>

      <Card className="gilded-edge overflow-hidden">
        <CardHeader>
          <CardTitle className="font-display text-lg">{copy.nav.matches}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="flex flex-col gap-2 rounded-xl bg-surface-2/60 p-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted">{copy.admin.matchCount(count ?? 0)}</dt>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">{copy.admin.lastSync}:</dt>
              <dd className="field-num font-medium">
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
        className="gilded-edge group flex items-center gap-3.5 overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)] transition hover:border-primary/40 hover:bg-primary-soft/25"
      >
        <span className="bg-gilded flex h-10 w-10 items-center justify-center rounded-xl text-primary-fg">
          <Pencil className="h-4.5 w-4.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold tracking-tight">
            {copy.admin.editPredictions}
          </span>
          <span className="mt-0.5 block text-sm text-muted">
            {copy.admin.editPredictionsDesc}
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </Link>

      <Link
        href="/admin/users"
        className="gilded-edge group flex items-center gap-3.5 overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)] transition hover:border-primary/40 hover:bg-primary-soft/25"
      >
        <span className="bg-gilded flex h-10 w-10 items-center justify-center rounded-xl text-primary-fg">
          <Users className="h-4.5 w-4.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold tracking-tight">
            {copy.admin.users}
          </span>
          <span className="mt-0.5 block text-sm text-muted">
            {copy.admin.usersDesc}
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </Link>
    </div>
  );
}
