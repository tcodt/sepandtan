import { cn } from "@/lib/utils";

export function ColorSwatch({
  hex,
  className,
}: {
  hex: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block size-7 shrink-0 rounded-lg border border-border shadow-sm",
        className,
      )}
      style={{ backgroundColor: hex }}
      title={hex}
      aria-hidden
    />
  );
}
