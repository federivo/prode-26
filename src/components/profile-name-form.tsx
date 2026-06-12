"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { updateProfileName, type ActionState } from "@/app/actions";
import { copy } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function ProfileNameForm({ initialName }: { initialName: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    updateProfileName,
    {},
  );
  const saved = state.ok && !pending;

  return (
    <form action={action} className="flex flex-col gap-1.5">
      <Label htmlFor="display_name">{copy.perfil.nameLabel}</Label>
      <div className="flex gap-2">
        <Input
          id="display_name"
          name="display_name"
          required
          maxLength={40}
          defaultValue={initialName}
        />
        <Button type="submit" disabled={pending} className="shrink-0">
          {saved ? <Check className="h-4 w-4" /> : copy.perfil.save}
        </Button>
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
