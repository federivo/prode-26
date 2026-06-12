import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { joinByCode } from "@/lib/join";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * Link de invitación compartible: /join/CODIGO
 *  - Sin sesión: guarda el código en una cookie y manda a login. Tras entrar,
 *    /auth/callback completa la unión.
 *  - Con sesión: suma al usuario y lo lleva a la tabla del grupo.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const siteUrl = getSiteUrl();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const res = NextResponse.redirect(`${siteUrl}/login`);
    res.cookies.set("pending_invite", code, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 30, // 30 min
    });
    return res;
  }

  const result = await joinByCode(code);
  const dest = result.leagueId
    ? `/groups/${result.leagueId}/ranking`
    : "/groups";
  return NextResponse.redirect(`${siteUrl}${dest}`);
}
