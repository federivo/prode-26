"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { getSiteUrl } from "@/lib/site";
import { copy } from "@/lib/copy";

/** Botón que copia (o comparte) el link de invitación /join/CODIGO. */
export function ShareLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${getSiteUrl()}/join/${code}`;

  async function handleShare() {
    // En mobile, usa el menú nativo de compartir si está disponible.
    if (navigator.share) {
      try {
        await navigator.share({ title: copy.appName, url });
        return;
      } catch {
        /* canceló el share: seguimos con el copy */
      }
    }
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
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1 text-sm font-medium text-primary-fg transition hover:brightness-105"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
      {copied ? copy.groups.linkCopied : copy.groups.shareLink}
    </button>
  );
}
