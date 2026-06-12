"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Sparkles } from "lucide-react";
import { prankSetAvatar } from "@/app/actions";
import { copy } from "@/lib/copy";
import { Avatar } from "@/components/avatar";

export interface PrankMember {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export function EasterEggPanel({ members }: { members: PrankMember[] }) {
  return (
    <div className="rounded-2xl border border-accent/50 bg-accent/10 p-4">
      <div className="mb-3 flex items-start gap-2">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
        <div>
          <h3 className="font-semibold">{copy.easterEgg.title}</h3>
          <p className="text-sm text-muted">{copy.easterEgg.desc}</p>
        </div>
      </div>

      {members.length === 0 ? (
        <p className="text-sm text-muted">{copy.easterEgg.empty}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <PrankRow key={m.id} member={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function PrankRow({ member }: { member: PrankMember }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      const res = await prankSetAvatar(member.id, fd);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-2.5">
      <Avatar url={member.avatarUrl} name={member.name} size={36} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {member.name}
      </span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1.5 text-sm font-medium text-black transition hover:brightness-105 disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
        {pending ? copy.easterEgg.changing : copy.easterEgg.change}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
