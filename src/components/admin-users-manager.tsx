"use client";

import { useActionState, useState, useTransition } from "react";
import { Check, Trash2, UserPlus } from "lucide-react";
import {
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
  type ActionState,
} from "@/app/actions";
import { copy } from "@/lib/copy";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  avatarUrl: string | null;
}

export function AdminUsersManager({
  users,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <CreateUserForm />
      <div className="flex flex-col gap-2">
        {users.map((u) => (
          <UserRow key={u.id} user={u} isSelf={u.id === currentUserId} />
        ))}
      </div>
    </div>
  );
}

function CreateUserForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    adminCreateUser,
    {},
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="h-4 w-4 text-primary" />
          {copy.admin.createUser}
        </CardTitle>
        <CardDescription>{copy.admin.usersDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="email">{copy.admin.emailLabel}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder={copy.admin.emailPlaceholder}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="display_name">{copy.admin.nameLabel}</Label>
            <Input
              id="display_name"
              name="display_name"
              required
              maxLength={40}
              placeholder={copy.admin.namePlaceholder}
            />
          </div>
          <Button type="submit" disabled={pending} className="shrink-0">
            {pending ? copy.admin.creating : copy.admin.create}
          </Button>
        </form>
        {state.error && <p className="mt-2 text-sm text-danger">{state.error}</p>}
        {state.ok && (
          <p className="mt-2 flex items-center gap-1 text-sm text-primary">
            <Check className="h-4 w-4" /> {copy.admin.userCreated}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function UserRow({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  const [name, setName] = useState(user.displayName);
  const [isAdmin, setIsAdmin] = useState(user.isAdmin);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = name !== user.displayName || isAdmin !== user.isAdmin;

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await adminUpdateUser(user.id, name, isAdmin);
      if (res.error) setError(res.error);
      else {
        setSavedAt(true);
        setTimeout(() => setSavedAt(false), 1500);
      }
    });
  }

  function remove() {
    if (!confirm(copy.admin.confirmDelete(user.displayName || user.email))) return;
    setError(null);
    startTransition(async () => {
      const res = await adminDeleteUser(user.id);
      if (res.error) setError(res.error);
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <div className="flex items-center gap-3">
        <Avatar url={user.avatarUrl} name={name || "?"} size={40} />
        <div className="min-w-0 flex-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            className="h-8"
          />
          <p className="mt-1 truncate text-xs text-muted">
            {user.email || copy.admin.noEmail}
            {isSelf && ` · ${copy.admin.you}`}
          </p>
        </div>

        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-muted">
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          {copy.admin.adminFlag}
        </label>

        <Button
          size="sm"
          variant="secondary"
          onClick={save}
          disabled={pending || !dirty}
          className="shrink-0"
        >
          {savedAt ? <Check className="h-4 w-4" /> : copy.admin.save}
        </Button>

        <button
          type="button"
          onClick={remove}
          disabled={pending || isSelf}
          title={copy.admin.deleteUser}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-danger/10 hover:text-danger disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
