import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { joinByCode } from "@/lib/join";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Completa el login del magic link: canjea el código por una sesión. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const siteUrl = getSiteUrl();

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/login`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${siteUrl}/login`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user!.id)
    .maybeSingle();

  // ¿Venía de un link de invitación? Lo sumamos al grupo.
  const pending = request.cookies.get("pending_invite")?.value;
  let joinedLeagueId: string | undefined;
  if (pending) {
    const result = await joinByCode(pending);
    joinedLeagueId = result.leagueId;
  }

  // Si todavía no tiene nombre, primero el onboarding (ya quedó sumado al grupo).
  let dest = "/groups";
  if (!profile?.display_name) dest = "/onboarding";
  else if (joinedLeagueId) dest = `/groups/${joinedLeagueId}/ranking`;

  const res = NextResponse.redirect(`${siteUrl}${dest}`);
  if (pending) res.cookies.delete("pending_invite");
  return res;
}
