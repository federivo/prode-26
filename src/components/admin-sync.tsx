"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { syncNow } from "@/app/actions";
import { copy } from "@/lib/copy";
import { Button } from "@/components/ui/button";

export function AdminSync() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await syncNow();
      if (res.error) setError(res.error);
      else setMessage(copy.admin.syncDone(res.count ?? 0));
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleClick} disabled={pending}>
        <RefreshCw className={pending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        {pending ? copy.admin.syncing : copy.admin.syncNow}
      </Button>
      {message && <p className="text-sm text-primary">{message}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
