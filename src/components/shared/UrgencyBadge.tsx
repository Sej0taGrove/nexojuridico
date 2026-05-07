import type { UrgencyLevel } from "@prisma/client";
import { cn } from "@/lib/utils";

type UrgencyKey = `${UrgencyLevel}`;

const STYLES: Record<UrgencyKey, { label: string; className: string }> = {
  alta: {
    label: "Urgente",
    className: "bg-danger-50 text-danger-700 border-danger-100",
  },
  media: {
    label: "Prioridad media",
    className: "bg-warning-50 text-warning-700 border-warning-100",
  },
  baja: {
    label: "Sin prisa",
    className: "bg-success-50 text-success-700 border-success-100",
  },
};

export function UrgencyBadge({
  level,
  className,
}: {
  level: UrgencyKey;
  className?: string;
}) {
  const style = STYLES[level];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider",
        style.className,
        className,
      )}
    >
      {style.label}
    </span>
  );
}
