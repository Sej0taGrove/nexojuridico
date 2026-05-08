import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Tone = "default" | "danger" | "success" | "warning";

const TONE_STYLES: Record<Tone, { icon: string; value: string }> = {
  default: {
    icon: "bg-navy-50 text-navy-700",
    value: "text-navy-900",
  },
  danger: {
    icon: "bg-danger-50 text-danger-700",
    value: "text-danger-700",
  },
  success: {
    icon: "bg-success-50 text-success-700",
    value: "text-navy-900",
  },
  warning: {
    icon: "bg-warning-50 text-warning-700",
    value: "text-navy-900",
  },
};

export function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: Tone;
  className?: string;
}) {
  const styles = TONE_STYLES[tone];
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-6 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={cn(
            "flex size-10 items-center justify-center rounded-md",
            styles.icon,
          )}
        >
          <Icon className="size-5" />
        </span>
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
          {label}
        </p>
      </div>
      <p
        className={cn(
          "mt-4 text-3xl font-bold tracking-tight",
          styles.value,
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}
