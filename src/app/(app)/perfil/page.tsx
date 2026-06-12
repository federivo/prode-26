import { requireSession } from "@/lib/session";
import { copy } from "@/lib/copy";
import { Card, CardContent } from "@/components/ui/card";
import { AvatarUpload } from "@/components/avatar-upload";
import { ProfileNameForm } from "@/components/profile-name-form";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const session = await requireSession();
  const profile = session.profile;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold tracking-tight">{copy.perfil.title}</h1>

      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          <AvatarUpload
            currentUrl={profile?.avatar_url ?? null}
            name={profile?.display_name ?? ""}
          />
          <ProfileNameForm initialName={profile?.display_name ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}
