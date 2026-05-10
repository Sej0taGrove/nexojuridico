import type { CaseStatus } from "@prisma/client";
import {
  CheckCircle2,
  Handshake,
  Inbox,
  ShieldCheck,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Step = {
  key: CaseStatus;
  label: string;
  icon: LucideIcon;
};

const STEPS: readonly Step[] = [
  { key: "en_cola", label: "En cola", icon: Inbox },
  { key: "asignado", label: "Asignado", icon: UserPlus },
  { key: "en_negociacion", label: "Negociación", icon: Handshake },
  { key: "cerrado_ganado", label: "Cerrado", icon: CheckCircle2 },
] as const;

const FINAL_STATUSES: CaseStatus[] = [
  "cerrado_ganado",
  "cerrado_perdido",
  "cancelado",
  "huerfano",
];

function currentIndex(status: CaseStatus): number {
  if (status === "borrador" || status === "en_cola") return 0;
  if (status === "asignado") return 1;
  if (status === "en_negociacion") return 2;
  if (FINAL_STATUSES.includes(status)) return 3;
  return 0;
}

export function StatusTimeline({ status }: { status: CaseStatus }) {
  const idx = currentIndex(status);
  const isCanceled = status === "cancelado" || status === "huerfano";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold text-navy-900">
        Estado del caso
      </h2>
      <div className="relative">
        <div
          aria-hidden
          className="absolute left-5 right-5 top-5 h-0.5 bg-gray-100"
        />
        <div
          aria-hidden
          className={cn(
            "absolute left-5 top-5 h-0.5 transition-all",
            isCanceled ? "bg-gray-300" : "bg-navy-600",
          )}
          style={{
            width: `calc(${(idx / Math.max(1, STEPS.length - 1)) * 100}% - ${
              idx === 0 ? "0px" : "1.25rem"
            })`,
          }}
        />
        <ol className="relative z-10 grid grid-cols-4 gap-2">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const done = i < idx;
            const current = i === idx && !isCanceled;
            return (
              <li
                key={step.key}
                className="flex flex-col items-center gap-2 text-center"
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full border-2 bg-white shadow-sm",
                    done && "border-navy-600 bg-navy-600 text-white",
                    current &&
                      "border-navy-600 text-navy-600 shadow-[0_0_0_4px_rgba(1,53,101,0.1)]",
                    !done && !current && "border-gray-200 text-gray-400",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    done && "text-navy-900",
                    current && "font-bold text-navy-600",
                    !done && !current && "text-gray-400",
                  )}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      {isCanceled ? (
        <p className="mt-4 flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
          <ShieldCheck className="size-4" aria-hidden />
          Este caso fue {status === "cancelado" ? "cancelado" : "marcado como huérfano"}.
        </p>
      ) : null}
    </div>
  );
}
