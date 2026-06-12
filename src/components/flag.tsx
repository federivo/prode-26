import Image from "next/image";
import { Globe } from "lucide-react";
import { flagCode } from "@/lib/flags";
import { cn } from "@/lib/utils";

/**
 * Bandera de un país como medallón circular. Usa imágenes (flagcdn) porque el
 * emoji de bandera no se renderiza en Windows ni en varios navegadores. Si el
 * equipo está sin definir o no lo conocemos, muestra un globo.
 */
export function Flag({
  name,
  size = 28,
  className,
}: {
  name: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const code = flagCode(name);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2 ring-1 ring-inset ring-border/70",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {code ? (
        <Image
          src={`https://flagcdn.com/${code}.svg`}
          alt={name ?? ""}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          unoptimized
        />
      ) : (
        <Globe
          aria-hidden
          className="text-muted"
          style={{ width: size * 0.52, height: size * 0.52 }}
          strokeWidth={1.75}
        />
      )}
    </span>
  );
}
