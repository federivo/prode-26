import "server-only";
import { createServiceClient, isServiceConfigured } from "@/lib/supabase/service";
import type { Match } from "@/lib/supabase/types";

/**
 * Partidos en curso (IN_PLAY). Usa service-role para que también funcione en la
 * home deslogueada (sin sesión, RLS no deja leer matches con el cliente anon).
 */
export async function getLiveMatches(): Promise<Match[]> {
  if (!isServiceConfigured()) return [];
  try {
    const service = createServiceClient();
    const { data } = await service
      .from("matches")
      .select("*")
      .eq("status", "IN_PLAY")
      .order("kickoff", { ascending: true });
    return data ?? [];
  } catch {
    return [];
  }
}
