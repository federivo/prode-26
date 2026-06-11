import { NextResponse, type NextRequest } from "next/server";
import { syncMatches } from "@/lib/football-data";

export const dynamic = "force-dynamic";

/**
 * Endpoint de sincronización para un pinger externo gratuito
 * (GitHub Actions / cron-job.org). Protegido con CRON_SECRET.
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://tu-sitio/api/cron/sync
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await syncMatches();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
