import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { copy } from "@/lib/copy";

export interface JoinResult {
  leagueId?: string;
  error?: string;
  needsAuth?: boolean;
}

/**
 * Suma al usuario actual al grupo del código dado. Lo usan tanto el form de
 * "unirme con código" como el link de invitación (/join/[code]).
 * Si ya es miembro, devuelve el leagueId igual (idempotente).
 */
export async function joinByCode(rawCode: string): Promise<JoinResult> {
  const code = rawCode.trim().toUpperCase();
  if (code.length < 4) return { error: copy.groups.invalidCode };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { needsAuth: true };

  // El grupo no es visible vía RLS para no-miembros: resolvemos el código con
  // service-role solo para obtener el id. La membresía se inserta como el usuario.
  const service = createServiceClient();
  const { data: league } = await service
    .from("leagues")
    .select("id")
    .eq("invite_code", code)
    .maybeSingle();
  if (!league) return { error: copy.groups.invalidCode };

  // ¿Ya es miembro? Lo mandamos derecho a la tabla.
  const { data: existing } = await supabase
    .from("memberships")
    .select("id")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return { leagueId: league.id };

  const { error } = await supabase
    .from("memberships")
    .insert({ user_id: user.id, league_id: league.id, role: "member" });
  if (error) {
    if (error.code === "23505") return { leagueId: league.id }; // ya estaba
    return { error: "No pudimos sumarte al grupo. Probá de nuevo." };
  }

  return { leagueId: league.id };
}
