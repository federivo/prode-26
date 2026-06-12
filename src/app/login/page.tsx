"use client";

import { useState } from "react";
import { Trophy, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/site";
import { copy } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const TIERS = [
  { label: copy.scoring.exact, pts: copy.scoring.exactPts },
  { label: copy.scoring.outcome, pts: copy.scoring.outcomePts },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${getSiteUrl()}/auth/callback` },
    });
    setStatus(error ? "error" : "sent");
  }

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

        <Card>
          <CardContent className="pt-5">
            {status === "sent" ? (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <MailCheck className="h-6 w-6" />
                </span>
                <p className="text-sm font-medium text-fg">{copy.login.sent}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">{copy.login.emailLabel}</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder={copy.login.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted">{copy.login.emailHelp}</p>
                </div>
                <Button type="submit" size="lg" disabled={status === "sending"}>
                  {status === "sending" ? copy.login.sending : copy.login.submit}
                </Button>
                {status === "error" && (
                  <p className="text-sm text-danger">{copy.login.error}</p>
                )}
              </form>
            )}
          </CardContent>
        </Card>

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
