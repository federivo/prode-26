import Link from "next/link";
import { Trophy, LogOut } from "lucide-react";
import { signOut } from "@/app/actions";
import { copy } from "@/lib/copy";
import { Avatar } from "@/components/avatar";
import { ThemeToggle } from "@/components/theme-toggle";

export function Nav({
  displayName,
  isAdmin,
  avatarUrl,
}: {
  displayName: string;
  isAdmin: boolean;
  avatarUrl: string | null;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-1 px-4">
        <Link href="/groups" className="mr-2 flex items-center gap-2 font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-fg">
            <Trophy className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">Prode 26</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <NavLink href="/matches">{copy.nav.matches}</NavLink>
          <NavLink href="/groups">{copy.nav.groups}</NavLink>
          {isAdmin && <NavLink href="/admin">{copy.nav.admin}</NavLink>}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/perfil"
            className="flex items-center gap-2 rounded-full transition hover:opacity-80"
            title={copy.perfil.title}
          >
            <span className="hidden text-sm text-muted sm:inline">{displayName}</span>
            <Avatar url={avatarUrl} name={displayName} size={32} />
          </Link>
          <ThemeToggle />
          <form action={signOut}>
            <button
              type="submit"
              title={copy.nav.logout}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-primary-soft hover:text-fg"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-1.5 font-medium text-muted transition hover:bg-primary-soft hover:text-fg"
    >
      {children}
    </Link>
  );
}
