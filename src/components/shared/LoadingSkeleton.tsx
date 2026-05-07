import { cn } from "@/lib/utils";

type Variant = "card" | "row" | "text";

const VARIANT_CLASSES: Record<Variant, string> = {
  card: "h-32 w-full rounded-xl",
  row: "h-12 w-full rounded-md",
  text: "h-4 w-2/3 rounded",
};

export function LoadingSkeleton({
  variant = "text",
  count = 1,
  className,
}: {
  variant?: Variant;
  count?: number;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse bg-gray-100",
            VARIANT_CLASSES[variant],
            className,
          )}
        />
      ))}
    </div>
  );
}
