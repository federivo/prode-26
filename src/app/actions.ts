"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { syncMatches } from "@/lib/football-data";
import { joinByCode } from "@/lib/join";
import { scorePrediction } from "@/lib/scoring";
import { copy } from "@/lib/copy";

async function requireAdmin(): Promise<string | null> {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("is_app_admin")
    .eq("id", userId)
    .maybeSingle();
  return data?.is_app_admin ? userId : null;
}

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

  // Si el partido ya terminó (caso de un partido "abierto" para migrar), le
  // calculamos los puntos en el momento para que la tabla se actualice ya.
  const service = createServiceClient();
  const { data: match } = await service
    .from("matches")
    .select("stage, status, home_score, away_score, winner")
    .eq("id", parsed.data.match_id)
    .maybeSingle();
  if (match && match.status === "FINISHED" && match.home_score !== null) {
    const points = scorePrediction(
      { homeScore: parsed.data.home_score, awayScore: parsed.data.away_score },
      {
        stage: match.stage,
        homeScore: match.home_score,
        awayScore: match.away_score!,
        winner: match.winner,
      },
    );
    await service
      .from("predictions")
      .update({ points_awarded: points })
      .eq("user_id", userId)
      .eq("match_id", parsed.data.match_id);
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

// ── Admin: editar pronósticos (migración / correcciones) ──────────────────────
const adminEntrySchema = z.object({
  user_id: z.string().uuid(),
  home_score: z.coerce.number().int().min(0).max(99),
  away_score: z.coerce.number().int().min(0).max(99),
});

/**
 * El admin carga/edita los pronósticos de cualquier usuario para un partido,
 * salteando el candado de kickoff (para migrar resultados ya jugados). Recalcula
 * los puntos si el partido ya terminó. Usa service-role (auth/escritura confiable).
 */
export async function adminSavePredictions(
  matchId: string,
  rawEntries: unknown,
): Promise<ActionState & { saved?: number }> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: copy.admin.notAdmin };

  if (!z.string().uuid().safeParse(matchId).success) {
    return { error: "Partido inválido." };
  }
  const parsed = z.array(adminEntrySchema).safeParse(rawEntries);
  if (!parsed.success) return { error: "Datos inválidos." };
  if (parsed.data.length === 0) return { ok: true, saved: 0 };

  const service = createServiceClient();
  const { data: match } = await service
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();
  if (!match) return { error: "Partido no encontrado." };

  const finished = match.status === "FINISHED" && match.home_score !== null;

  const rows = parsed.data.map((e) => ({
    user_id: e.user_id,
    match_id: matchId,
    home_score: e.home_score,
    away_score: e.away_score,
    points_awarded: finished
      ? scorePrediction(
          { homeScore: e.home_score, awayScore: e.away_score },
          {
            stage: match.stage,
            homeScore: match.home_score!,
            awayScore: match.away_score!,
            winner: match.winner,
          },
        )
      : null,
  }));

  const { error } = await service
    .from("predictions")
    .upsert(rows, { onConflict: "user_id,match_id" });
  if (error) return { error: "No se pudieron guardar los pronósticos." };

  revalidatePath("/admin/predictions");
  revalidatePath("/matches");
  return { ok: true, saved: rows.length };
}

/** Abre/cierra un partido para que los jugadores carguen su pronóstico. */
export async function adminSetPredictionsOpen(
  matchId: string,
  open: boolean,
): Promise<ActionState> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: copy.admin.notAdmin };
  if (!z.string().uuid().safeParse(matchId).success) {
    return { error: "Partido inválido." };
  }

  const service = createServiceClient();
  const { error } = await service
    .from("matches")
    .update({ predictions_open: open })
    .eq("id", matchId);
  if (error) return { error: "No se pudo actualizar." };

  revalidatePath("/admin/predictions");
  revalidatePath("/matches");
  return { ok: true };
}

// ── Admin: gestión de usuarios ────────────────────────────────────────────────
const emailSchema = z.string().trim().email("Mail inválido.");

export async function adminCreateUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: copy.admin.notAdmin };

  const email = emailSchema.safeParse(formData.get("email"));
  const name = nameSchema.safeParse(formData.get("display_name"));
  if (!email.success) return { error: email.error.issues[0]?.message };
  if (!name.success) return { error: "El nombre necesita al menos 2 letras." };

  const service = createServiceClient();
  const { data, error } = await service.auth.admin.createUser({
    email: email.data,
    email_confirm: true, // así puede entrar con magic link sin confirmar
  });
  if (error || !data.user) {
    const dup = error?.message?.toLowerCase().includes("already");
    return { error: dup ? "Ya existe un usuario con ese mail." : "No se pudo crear el usuario." };
  }

  // El trigger crea el profile; le ponemos el nombre.
  await service
    .from("profiles")
    .upsert({ id: data.user.id, display_name: name.data }, { onConflict: "id" });

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function adminUpdateUser(
  userId: string,
  displayName: string,
  isAdmin: boolean,
): Promise<ActionState> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: copy.admin.notAdmin };

  const name = nameSchema.safeParse(displayName);
  if (!name.success) return { error: "El nombre necesita al menos 2 letras." };
  if (!z.string().uuid().safeParse(userId).success) {
    return { error: "Usuario inválido." };
  }

  const service = createServiceClient();
  const { error } = await service
    .from("profiles")
    .update({ display_name: name.data, is_app_admin: !!isAdmin })
    .eq("id", userId);
  if (error) return { error: "No se pudieron guardar los cambios." };

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function adminDeleteUser(userId: string): Promise<ActionState> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: copy.admin.notAdmin };
  if (userId === adminId) return { error: "No podés borrarte a vos mismo." };
  if (!z.string().uuid().safeParse(userId).success) {
    return { error: "Usuario inválido." };
  }

  const service = createServiceClient();
  // Borra el auth user; profiles/predictions/memberships caen por FK on delete cascade.
  const { error } = await service.auth.admin.deleteUser(userId);
  if (error) return { error: "No se pudo borrar el usuario." };

  revalidatePath("/admin/users");
  return { ok: true };
}
