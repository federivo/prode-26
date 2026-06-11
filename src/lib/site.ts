/**
 * URL pública del sitio, sin barra final. Se usa para los links del magic link
 * y el callback de auth. En el browser cae a window.location.origin si falta.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (raw) return raw.replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}
