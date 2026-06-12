"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { setDisplayName, type ActionState } from "@/app/actions";
import { copy } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function OnboardingPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    setDisplayName,
    {},
  );

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="stagger w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="bg-gilded sheen mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-primary-fg shadow-[var(--shadow-gold)]">
            <Sparkles className="h-7 w-7" strokeWidth={2.25} />
          </span>
          <p className="text-gilded text-xs font-semibold uppercase tracking-[0.22em]">
            Un último paso
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">
              {copy.onboarding.title}
            </CardTitle>
            <CardDescription>{copy.onboarding.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="display_name">{copy.onboarding.nameLabel}</Label>
                <Input
                  id="display_name"
                  name="display_name"
                  required
                  autoFocus
                  maxLength={40}
                  placeholder={copy.onboarding.namePlaceholder}
                />
              </div>
              <Button type="submit" size="lg" disabled={pending}>
                {copy.onboarding.submit}
              </Button>
              {state.error && <p className="text-sm text-danger">{state.error}</p>}
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
