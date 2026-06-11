import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { Nav } from "@/components/nav";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  if (!session.profile?.display_name) redirect("/onboarding");

  return (
    <>
      <Nav
        displayName={session.profile.display_name}
        isAdmin={session.profile.is_app_admin}
      />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
