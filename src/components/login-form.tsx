"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/site";
import { copy } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function LoginForm() {
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
  );
}
