"use client";

import { useRouter } from "next/navigation";
import { copy } from "@/lib/copy";

export interface MatchOption {
  id: string;
  label: string;
}

export function AdminMatchPicker({
  options,
  selected,
}: {
  options: MatchOption[];
  selected: string | null;
}) {
  const router = useRouter();
  return (
    <select
      value={selected ?? ""}
      onChange={(e) => router.push(`/admin/predictions?match=${e.target.value}`)}
      className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <option value="" disabled>
        {copy.admin.pickMatch}
      </option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
