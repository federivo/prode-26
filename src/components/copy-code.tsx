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
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg px-2.5 py-1 font-mono text-sm font-semibold tracking-widest transition hover:bg-primary-soft"
    >
      {code}
      {copied ? (
        <Check className="h-3.5 w-3.5 text-primary" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted" />
      )}
    </button>
  );
}
