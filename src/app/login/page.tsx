import { Trophy } from "lucide-react";
import { syncIfStale } from "@/lib/football-data";
import { getLiveMatches } from "@/lib/live-matches";
import { copy } from "@/lib/copy";
import { LoginForm } from "@/components/login-form";
import { LiveMatchBanner } from "@/components/live-match-banner";

export const dynamic = "force-dynamic";

const TIERS = [
  { label: copy.scoring.exact, pts: copy.scoring.exactPts },
  { label: copy.scoring.outcome, pts: copy.scoring.outcomePts },
];

export default async function LoginPage() {
  // Aunque no haya sesión, mostramos los partidos en vivo (sync por service-role).
  await syncIfStale();
  const liveMatches = await getLiveMatches();

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="stagger w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="bg-gilded sheen mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-primary-fg shadow-[var(--shadow-gold)]">
            <Trophy className="h-8 w-8" strokeWidth={2.25} />
          </span>
          <p className="text-gilded text-xs font-semibold uppercase tracking-[0.22em]">
            Mundial FIFA 2026
          </p>
          <h1 className="text-gilded font-display text-4xl font-semibold tracking-tight">
            {copy.appName}
          </h1>
          {/* La explicación del login (entrá con tu mail, te llega un link). */}
          <p className="mt-2 text-sm text-muted">{copy.login.subtitle}</p>
        </div>

        {liveMatches.length > 0 && (
          <div className="mb-5">
            <LiveMatchBanner matches={liveMatches} />
          </div>
        )}

        <LoginForm />

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
          {TIERS.map((t, i) => (
            <span key={t.label} className="flex items-center gap-2">
              {i > 0 && <span className="text-border">·</span>}
              <span>{t.label}</span>
              <span className="field-num font-semibold text-fg">{t.pts}</span>
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
