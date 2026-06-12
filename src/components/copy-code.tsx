"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { copy as t } from "@/lib/copy";

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* sin clipboard: no pasa nada */
    }
  }

  return (
    <button
      onClick={handleCopy}
      title={t.groups.copyCode}
      className="field-num inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-sm font-semibold tracking-widest text-fg transition hover:border-primary/40 hover:bg-primary-soft/40"
    >
      {code}
      {copied ? (
        <Check className="h-3.5 w-3.5 text-accent" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted" />
      )}
    </button>
  );
}
