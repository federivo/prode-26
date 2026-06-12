"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { setAvatarUrl } from "@/app/actions";
import { copy } from "@/lib/copy";
import { Avatar } from "@/components/avatar";

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB

export function AvatarUpload({
  userId,
  currentUrl,
  name,
}: {
  userId: string;
  currentUrl: string | null;
  name: string;
}) {
  const [preview, setPreview] = useState(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError(copy.perfil.notImage);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(copy.perfil.tooBig);
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const path = `${userId}/avatar`;

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setError(copy.perfil.uploadError);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${data.publicUrl}?v=${Date.now()}`; // cache-bust
    const res = await setAvatarUrl(url);
    if (res.error) {
      setError(res.error);
    } else {
      setPreview(url);
      router.refresh();
    }
    setUploading(false);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="group relative rounded-full"
        aria-label={copy.perfil.changePhoto}
      >
        <Avatar url={preview} name={name} size={96} />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100">
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </span>
      </button>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
      >
        {uploading ? copy.perfil.uploading : copy.perfil.changePhoto}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
