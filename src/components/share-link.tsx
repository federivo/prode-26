"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { getSiteUrl } from "@/lib/site";
import { copy } from "@/lib/copy";

/** Botón que copia el link de invitación /join/CODIGO al portapapeles. */
export function ShareLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${getSiteUrl()}/join/${code}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* sin clipboard: no pasa nada */
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1 text-sm font-medium text-primary-fg transition hover:brightness-105"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
      {copied ? copy.groups.linkCopied : copy.groups.shareLink}
    </button>
  );
}
