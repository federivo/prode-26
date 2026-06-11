"use client";

import { useActionState } from "react";
import { PlusCircle, LogIn } from "lucide-react";
import { createGroup, joinGroup, type ActionState } from "@/app/actions";
import { copy } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export function CreateGroupForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createGroup,
    {},
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PlusCircle className="h-4 w-4 text-primary" />
          {copy.groups.createTitle}
        </CardTitle>
        <CardDescription>{copy.groups.createSubtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">{copy.groups.nameLabel}</Label>
            <Input
              id="name"
              name="name"
              required
              maxLength={50}
              placeholder={copy.groups.namePlaceholder}
            />
          </div>
          <Button type="submit" disabled={pending}>
            {copy.groups.createSubmit}
          </Button>
          {state.error && <p className="text-sm text-danger">{state.error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}

export function JoinGroupForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    joinGroup,
    {},
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <LogIn className="h-4 w-4 text-primary" />
          {copy.groups.joinTitle}
        </CardTitle>
        <CardDescription>{copy.groups.joinSubtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite_code">{copy.groups.codeLabel}</Label>
            <Input
              id="invite_code"
              name="invite_code"
              required
              autoCapitalize="characters"
              className="uppercase tracking-widest"
              placeholder={copy.groups.codePlaceholder}
            />
          </div>
          <Button type="submit" variant="secondary" disabled={pending}>
            {copy.groups.joinSubmit}
          </Button>
          {state.error && <p className="text-sm text-danger">{state.error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
