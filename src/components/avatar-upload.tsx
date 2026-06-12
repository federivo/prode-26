"use client";

import { useActionState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { uploadAvatar, type ActionState } from "@/app/actions";
import { copy } from "@/lib/copy";
import { Avatar } from "@/components/avatar";

export function AvatarUpload({
  currentUrl,
  name,
}: {
  currentUrl: string | null;
  name: string;
}) {
  const [state, action, pending] = useActionState<
    ActionState & { url?: string },
    FormData
  >(uploadAvatar, {});
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const preview = state.url ?? currentUrl;

  return (
    <form ref={formRef} action={action} className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="group relative rounded-full"
        aria-label={copy.perfil.changePhoto}
      >
        <Avatar
          url={preview}
          name={name}
          size={96}
          className="ring-2 ring-primary/30 ring-offset-2 ring-offset-surface transition group-hover:ring-primary/60"
        />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100">
          {pending ? (
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </span>
      </button>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
      >
        {pending ? copy.perfil.uploading : copy.perfil.changePhoto}
      </button>

      <input
        ref={inputRef}
        type="file"
        name="file"
        accept="image/*"
        className="hidden"
        onChange={() => formRef.current?.requestSubmit()}
      />
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
