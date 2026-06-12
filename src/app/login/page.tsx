"use client";

import { useState } from "react";
import { Trophy, Mail, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/site";
import { copy } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

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
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-fg shadow-sm">
            <Trophy className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{copy.appName}</h1>
          <p className="mt-1 text-sm text-muted">{copy.tagline}</p>
        </div>

        <Card>
          <CardContent className="pt-5">
            {status === "sent" ? (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <MailCheck className="h-6 w-6" />
                </span>
                <p className="text-sm text-fg">{copy.login.sent}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex items-start gap-2.5">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h2 className="text-sm font-semibold">{copy.login.title}</h2>
                    <p className="mt-0.5 text-sm text-muted">
                      {copy.login.subtitle}
                    </p>
                  </div>
                </div>

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

                <Button type="submit" disabled={status === "sending"}>
                  {status === "sending" ? copy.login.sending : copy.login.submit}
                </Button>
                {status === "error" && (
                  <p className="text-sm text-danger">{copy.login.error}</p>
                )}
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted">
          {copy.scoring.exact}: {copy.scoring.exactPts} · {copy.scoring.outcome}:{" "}
          {copy.scoring.outcomePts}
        </p>
      </div>
    </main>
  );
}
