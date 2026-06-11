"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { syncMatches } from "@/lib/football-data";
import { copy } from "@/lib/copy";

export interface ActionState {
  error?: string;
  ok?: boolean;
}

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user.id;
}

// ── Nombre para mostrar ───────────────────────────────────────────────────────
const nameSchema = z.string().trim().min(2, "Poné al menos 2 letras.").max(40);

export async function setDisplayName(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = nameSchema.safeParse(formData.get("display_name"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Nombre inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data })
    .eq("id", userId);
  if (error) return { error: "No pudimos guardar tu nombre. Probá de nuevo." };

  redirect("/groups");
}

// ── Grupos ────────────────────────────────────────────────────────────────────
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sin caracteres ambiguos

function generateInviteCode(len = 6): string {
  const bytes = new Uint8Array(len);
  globalThis.crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

const groupNameSchema = z.string().trim().min(2, "Poné un nombre al grupo.").max(50);

export async function createGroup(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = groupNameSchema.safeParse(formData.get("name"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Nombre inválido." };
  }

  const supabase = await createClient();
  let leagueId: string | null = null;

  // Reintenta si el código aleatorio colisiona (poco probable).
  for (let attempt = 0; attempt < 5 && !leagueId; attempt++) {
    const code = generateInviteCode();
    const { data, error } = await supabase
      .from("leagues")
      .insert({ name: parsed.data, invite_code: code, created_by: userId })
      .select("id")
      .single();
    if (!error && data) {
      leagueId = data.id;
    } else if (error && !error.message.includes("invite_code")) {
      return { error: "No pudimos crear el grupo. Probá de nuevo." };
    }
  }
  if (!leagueId) return { error: "No pudimos crear el grupo. Probá de nuevo." };

  const { error: memberErr } = await supabase
    .from("memberships")
    .insert({ user_id: userId, league_id: leagueId, role: "admin" });
  if (memberErr) return { error: "El grupo se creó pero no pudimos sumarte. Probá recargar." };

  revalidatePath("/groups");
  redirect("/groups");
}

const joinCodeSchema = z
  .string()
  .trim()
  .min(4, "Código inválido.")
  .transform((s) => s.toUpperCase());

export async function joinGroup(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = joinCodeSchema.safeParse(formData.get("invite_code"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Código inválido." };
  }

  // El grupo no es visible vía RLS para no-miembros: resolvemos el código con
  // service-role solo para obtener el id. La membresía se inserta como el usuario.
  const service = createServiceClient();
  const { data: league } = await service
    .from("leagues")
    .select("id")
    .eq("invite_code", parsed.data)
    .maybeSingle();
  if (!league) return { error: copy.groups.invalidCode };

  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .insert({ user_id: userId, league_id: league.id, role: "member" });

  if (error) {
    if (error.code === "23505") return { error: copy.groups.alreadyMember };
    return { error: "No pudimos sumarte al grupo. Probá de nuevo." };
  }

  revalidatePath("/groups");
  redirect("/groups");
}

// ── Pronósticos ───────────────────────────────────────────────────────────────
const predictionSchema = z.object({
  match_id: z.string().uuid(),
  home_score: z.coerce.number().int().min(0).max(99),
  away_score: z.coerce.number().int().min(0).max(99),
});

export async function savePrediction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = predictionSchema.safeParse({
    match_id: formData.get("match_id"),
    home_score: formData.get("home_score"),
    away_score: formData.get("away_score"),
  });
  if (!parsed.success) return { error: "Resultado inválido." };

  const supabase = await createClient();
  // RLS rechaza si el partido ya arrancó (candado en la DB).
  const { error } = await supabase.from("predictions").upsert(
    {
      user_id: userId,
      match_id: parsed.data.match_id,
      home_score: parsed.data.home_score,
      away_score: parsed.data.away_score,
    },
    { onConflict: "user_id,match_id" },
  );

  if (error) {
    return { error: "El partido ya empezó: el pronóstico está cerrado." };
  }

  revalidatePath("/matches");
  return { ok: true };
}

// ── Sesión ────────────────────────────────────────────────────────────────────
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export async function syncNow(): Promise<ActionState & { count?: number }> {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_app_admin")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.is_app_admin) return { error: copy.admin.notAdmin };

  try {
    const result = await syncMatches();
    revalidatePath("/matches");
    revalidatePath("/admin");
    return { ok: true, count: result.total };
  } catch {
    return { error: "Falló la sincronización. Revisá la API key." };
  }
}
