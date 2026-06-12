import { Sparkles } from "lucide-react";
import { requireSession } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/service";
import { isPrankster } from "@/lib/easter-egg";
import { copy } from "@/lib/copy";
import { Card, CardContent } from "@/components/ui/card";
import { AvatarUpload } from "@/components/avatar-upload";
import { ProfileNameForm } from "@/components/profile-name-form";
import {
  EasterEggPanel,
  type PrankMember,
} from "@/components/easter-egg-panel";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const session = await requireSession();
  const profile = session.profile;
  const prankster = isPrankster(session.email);

  // 🃏 Compañeros de grupo a los que puede embromar.
  let prankMembers: PrankMember[] = [];
  if (prankster) {
    const service = createServiceClient();
    const { data: myMems } = await service
      .from("memberships")
      .select("league_id")
      .eq("user_id", session.userId);
    const leagueIds = [...new Set((myMems ?? []).map((m) => m.league_id))];
    if (leagueIds.length > 0) {
      const { data: coMems } = await service
        .from("memberships")
        .select("user_id")
        .in("league_id", leagueIds);
      const ids = [...new Set((coMems ?? []).map((m) => m.user_id))].filter(
        (id) => id !== session.userId,
      );
      if (ids.length > 0) {
        const { data: profiles } = await service
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", ids)
          .order("display_name");
        prankMembers = (profiles ?? []).map((p) => ({
          id: p.id,
          name: p.display_name || "Jugador",
          avatarUrl: p.avatar_url,
        }));
      }
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{copy.perfil.title}</h1>
        {prankster && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-black">
            <Sparkles className="h-3.5 w-3.5" />
            {copy.easterEgg.badge}
          </span>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          <AvatarUpload
            currentUrl={profile?.avatar_url ?? null}
            name={profile?.display_name ?? ""}
          />
          <ProfileNameForm initialName={profile?.display_name ?? ""} />
        </CardContent>
      </Card>

      {prankster && <EasterEggPanel members={prankMembers} />}
    </div>
  );
}
