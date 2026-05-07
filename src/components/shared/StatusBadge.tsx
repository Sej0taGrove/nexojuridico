import type { CaseStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

type StatusKey = `${CaseStatus}`;

const STYLES: Record<StatusKey, { label: string; className: string }> = {
  borrador: {
    label: "Borrador",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  en_cola: {
    label: "En cola",
    className: "bg-info-50 text-info-700 border-info-100",
  },
  asignado: {
    label: "Asignado",
    className: "bg-navy-50 text-navy-700 border-navy-100",
  },
  en_negociacion: {
    label: "En negociación",
    className: "bg-warning-50 text-warning-700 border-warning-100",
  },
  cerrado_ganado: {
    label: "Cerrado ganado",
    className: "bg-success-50 text-success-700 border-success-100",
  },
  cerrado_perdido: {
    label: "Cerrado perdido",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
  cancelado: {
    label: "Cancelado",
    className: "bg-gray-100 text-gray-500 border-gray-200",
  },
  huerfano: {
    label: "Huérfano",
    className: "bg-danger-50 text-danger-700 border-danger-100",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: StatusKey;
  className?: string;
}) {
  const style = STYLES[status];
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
