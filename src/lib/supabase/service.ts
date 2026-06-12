import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Placeholder tipo "<tu-service-role-key>" en un .env recién copiado.
const PLACEHOLDER = /^<.*>$/;

/**
 * ¿Está configurada la service-role key con un valor real (no el placeholder
 * del .env de ejemplo)? Permite degradar con elegancia en dev local sin la key:
 * la sync perezosa se saltea en vez de romper /partidos con "Invalid API key".
 */
export function isServiceConfigured(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return !!key && !PLACEHOLDER.test(key);
}

/**
 * Cliente con service-role key. SOLO para código server-only (sync de partidos,
 * scoring). Saltea RLS — nunca exponer al browser ni usar con datos del usuario.
 */
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
