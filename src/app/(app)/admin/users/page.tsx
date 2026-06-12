import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSession } from "@/lib/session";
import { copy } from "@/lib/copy";
import {
  AdminUsersManager,
  type AdminUser,
} from "@/components/admin-users-manager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await requireSession();
  if (!session.profile?.is_app_admin) redirect("/groups");

  const service = createServiceClient();

  const { data: authData } = await service.auth.admin.listUsers({
    perPage: 1000,
  });
  const emailById = new Map(
    (authData?.users ?? []).map((u) => [u.id, u.email ?? ""]),
  );

  const { data: profiles } = await service
    .from("profiles")
    .select("id, display_name, is_app_admin, avatar_url")
    .order("display_name");

  const users: AdminUser[] = (profiles ?? []).map((p) => ({
    id: p.id,
    email: emailById.get(p.id) ?? "",
    displayName: p.display_name,
    isAdmin: p.is_app_admin,
    avatarUrl: p.avatar_url,
  }));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/admin"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted transition hover:text-fg"
        >
          <ChevronLeft className="h-4 w-4" />
          {copy.admin.title}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{copy.admin.users}</h1>
      </div>

      <AdminUsersManager users={users} currentUserId={session.userId} />
    </div>
  );
}
