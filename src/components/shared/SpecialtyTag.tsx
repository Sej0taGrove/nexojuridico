import { cn } from "@/lib/utils";

export function SpecialtyTag({
  specialty,
  className,
}: {
  specialty: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-navy-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-navy-700",
        className,
      )}
    >
      {specialty}
    </span>
  );
}
