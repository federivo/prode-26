"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { syncMatches } from "@/lib/football-data";
import { joinByCode } from "@/lib/join";
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
  // upsert (no update) por si la fila de profile no existe todavía.
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, display_name: parsed.data }, { onConflict: "id" });
  if (error) return { error: "No pudimos guardar tu nombre. Probá de nuevo." };

  redirect("/groups");
}

/** Igual que setDisplayName pero se queda en /perfil (no redirige). */
export async function updateProfileName(
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
    .upsert({ id: userId, display_name: parsed.data }, { onConflict: "id" });
  if (error) return { error: "No pudimos guardar tu nombre. Probá de nuevo." };

  revalidatePath("/perfil");
  revalidatePath("/groups");
  return { ok: true };
}

/**
 * Sube el avatar desde el servidor (la subida desde el browser no llevaba la
 * sesión a Storage). Usa service-role para escribir, pero la ruta se deriva del
 * usuario autenticado, así que cada uno solo escribe su propia carpeta.
 */
const AVATAR_MAX = 3 * 1024 * 1024; // 3 MB

export async function uploadAvatar(
  _prev: ActionState & { url?: string },
  formData: FormData,
): Promise<ActionState & { url?: string }> {
  const userId = await requireUserId();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Elegí una imagen." };
  }
  if (!file.type.startsWith("image/")) return { error: copy.perfil.notImage };
  if (file.size > AVATAR_MAX) return { error: copy.perfil.tooBig };

  const service = createServiceClient();
  const path = `${userId}/avatar`;
  const bytes = await file.arrayBuffer();

  const { error: upErr } = await service.storage
    .from("avatars")
    .upload(path, bytes, { upsert: true, contentType: file.type });
  if (upErr) return { error: copy.perfil.uploadError };

  const { data } = service.storage.from("avatars").getPublicUrl(path);
  const url = `${data.publicUrl}?v=${Date.now()}`; // cache-bust

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", userId);
  if (error) return { error: copy.perfil.uploadError };

  revalidatePath("/perfil");
  revalidatePath("/groups");
  return { ok: true, url };
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

const joinCodeSchema = z.string().trim().min(4, "Código inválido.");

export async function joinGroup(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUserId();
  const parsed = joinCodeSchema.safeParse(formData.get("invite_code"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Código inválido." };
  }

  const result = await joinByCode(parsed.data);
  if (result.error) return { error: result.error };

  revalidatePath("/groups");
  redirect(result.leagueId ? `/groups/${result.leagueId}/ranking` : "/groups");
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
