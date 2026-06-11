import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { League, MembershipRole, Profile } from "@/lib/supabase/types";

/** Usuario + profile actuales, o null si no hay sesión. */
export async function getSession(): Promise<{
  userId: string;
  email: string | null;
  profile: Profile | null;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { userId: user.id, email: user.email ?? null, profile };
}

/** Exige sesión; redirige a /login si no hay. Devuelve userId + profile. */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Grupos del usuario actual, con su rol en cada uno. */
export async function getMyGroups(): Promise<
  (League & { role: MembershipRole })[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("role, leagues(*)")
    .order("joined_at", { ascending: true });

  return (data ?? [])
    .filter((m) => m.leagues)
    .map((m) => ({
      ...(m.leagues as unknown as League),
      role: m.role as MembershipRole,
    }));
}
