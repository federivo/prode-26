import Image from "next/image";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({
  url,
  name,
  size = 40,
  className,
}: {
  url: string | null | undefined;
  name: string;
  size?: number;
  className?: string;
}) {
  const dim = { width: size, height: size };
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft font-semibold text-primary",
        className,
      )}
      style={dim}
    >
      {url ? (
        <Image
          src={url}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          unoptimized
        />
      ) : (
        <span style={{ fontSize: size * 0.4 }}>{initials(name) || "?"}</span>
      )}
    </span>
  );
}
