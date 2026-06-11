"use client";

import { useActionState } from "react";
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
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{copy.onboarding.title}</CardTitle>
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
            <Button type="submit" disabled={pending}>
              {copy.onboarding.submit}
            </Button>
            {state.error && <p className="text-sm text-danger">{state.error}</p>}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
