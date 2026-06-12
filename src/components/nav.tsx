"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, LogOut, CalendarDays, Users, Shield } from "lucide-react";
import { signOut } from "@/app/actions";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/avatar";
import { ThemeToggle } from "@/components/theme-toggle";

const BASE_TABS = [
  { href: "/matches", label: copy.nav.matches, icon: CalendarDays },
  { href: "/groups", label: copy.nav.groups, icon: Users },
];

export function Nav({
  displayName,
  isAdmin,
  avatarUrl,
}: {
  displayName: string;
  isAdmin: boolean;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();
  const tabs = isAdmin
    ? [...BASE_TABS, { href: "/admin", label: copy.nav.admin, icon: Shield }]
    : BASE_TABS;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-2xl items-center gap-1.5 px-4">
        <Link
          href="/groups"
          className="mr-1 flex shrink-0 items-center gap-2.5"
          aria-label={copy.appName}
        >
          <span className="bg-gilded sheen flex h-9 w-9 items-center justify-center rounded-xl text-primary-fg shadow-[var(--shadow-gold)]">
            <Trophy className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </span>
          <span className="text-gilded hidden font-display text-lg font-semibold tracking-tight sm:inline">
            Prode 26
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium tracking-tight transition",
                  active
                    ? "bg-primary-soft/70 text-fg shadow-[inset_0_0_0_1px_var(--color-border)]"
                    : "text-muted hover:bg-primary-soft/40 hover:text-fg",
                )}
              >
                <Icon className="hidden h-4 w-4 sm:block" strokeWidth={2.25} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <Link
            href="/perfil"
            className="flex items-center gap-2 rounded-full pr-0.5 transition hover:opacity-80"
            title={copy.perfil.title}
          >
            <span className="hidden max-w-[12ch] truncate text-sm font-medium text-muted sm:inline">
              {displayName}
            </span>
            <Avatar
              url={avatarUrl}
              name={displayName}
              size={34}
              className="ring-1 ring-border"
            />
          </Link>
          <ThemeToggle />
          <form action={signOut}>
            <button
              type="submit"
              title={copy.nav.logout}
              aria-label={copy.nav.logout}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-primary-soft/60 hover:text-fg"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
