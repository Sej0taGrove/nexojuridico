"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  History,
  Mail,
  MapPin,
  Phone,
  Scale,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SpecialtyTag } from "@/components/shared/SpecialtyTag";
import { SITUATION_LABELS } from "@/lib/cases/title";
import type { CaseDetail } from "@/lib/cases/types";

import { StatusTimeline } from "./_components/StatusTimeline";

async function fetchCase(id: string): Promise<CaseDetail> {
  const res = await fetch(`/api/cases/${id}`, { credentials: "include" });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "No se pudo cargar el caso");
  }
  return json.data.case;
}

async function cancelCase(id: string) {
  const res = await fetch(`/api/cases/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action: "cancel" }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "No se pudo cancelar el caso");
  }
  return json.data.case;
}

const HISTORY_ACTOR_LABEL: Record<string, string> = {
  client: "Tú",
  lawyer: "Abogado",
  admin: "Administración",
};

const CANCELLABLE_STATUSES = ["borrador", "en_cola"] as const;

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function describeResponse(key: string, value: unknown): string {
  if (key === "situation" && typeof value === "string") {
    return SITUATION_LABELS[value] ?? value;
  }
  if (key === "occurredAt" && typeof value === "string") {
    return new Date(value).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return typeof value === "string" ? value : JSON.stringify(value);
}

const RESPONSE_LABELS: Record<string, string> = {
  situation: "Situación",
  occurredAt: "Fecha del hecho",
  hasDocuments: "Documentación disponible",
  description: "Descripción",
  preferredContact: "Método de contacto preferido",
};

export default function MisCasosDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const { data: caseData, isLoading, error } = useQuery({
    queryKey: ["cases", "detail", id],
    queryFn: () => fetchCase(id),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelCase(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cases"] });
      toast.success("Caso cancelado");
      router.push("/mis-casos");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Error desconocido");
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1200px] p-6 md:p-8">
        <LoadingSkeleton variant="card" count={3} />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="mx-auto w-full max-w-[1200px] p-6 md:p-8">
        <div className="rounded-xl border border-danger-100 bg-danger-50 p-6 text-sm text-danger-700">
          {error instanceof Error ? error.message : "No se pudo cargar el caso"}
          .{" "}
          <Link
            href="/mis-casos"
            className="font-medium text-navy-700 underline"
          >
            Volver a mis casos
          </Link>
        </div>
      </div>
    );
  }

  const c = caseData;
  const activeAssignment = c.assignments.find((a) => a.isActive);
  const canCancel = (CANCELLABLE_STATUSES as readonly string[]).includes(
    c.status,
  );

  const responseEntries = Object.entries(c.responses ?? {}).filter(
    ([k]) => k in RESPONSE_LABELS,
  );

  return (
    <div className="mx-auto w-full max-w-[1200px] p-6 md:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <SpecialtyTag specialty={c.specialty.name} />
            <StatusBadge status={c.status} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
            {c.title}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Caso #{c.id.slice(0, 8).toUpperCase()} · Creado el{" "}
            {formatDateTime(c.createdAt)}
          </p>
        </div>
        {canCancel ? (
          <Button
            variant="destructive"
            size="lg"
            onClick={() => {
              if (
                confirm(
                  "¿Confirmas que quieres cancelar este caso? Esta acción no se puede deshacer.",
                )
              ) {
                cancelMutation.mutate();
              }
            }}
            disabled={cancelMutation.isPending}
          >
            <XCircle className="size-4" aria-hidden />
            {cancelMutation.isPending ? "Cancelando..." : "Cancelar caso"}
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Columna izquierda 70% */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          <StatusTimeline status={c.status} />

          {/* Detalles del formulario */}
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <header className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-navy-900">
                <Scale className="size-4 text-gray-400" aria-hidden />
                Detalles del formulario
              </h2>
            </header>
            <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
              {responseEntries.map(([key, value]) => {
                const isLong = key === "description";
                return (
                  <div
                    key={key}
                    className={`flex flex-col gap-1 ${isLong ? "md:col-span-2" : ""}`}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {RESPONSE_LABELS[key]}
                    </span>
                    {isLong ? (
                      <p className="whitespace-pre-line rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
                        {describeResponse(key, value)}
                      </p>
                    ) : (
                      <span className="text-base text-navy-900">
                        {describeResponse(key, value)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Historial */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-navy-900">
              <History className="size-4 text-gray-400" aria-hidden />
              Historial de actividad
            </h2>
            {c.statusHistory.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aún no hay actividad registrada.
              </p>
            ) : (
              <ol className="relative flex flex-col gap-4">
                <span
                  aria-hidden
                  className="absolute bottom-2 left-3 top-2 w-0.5 bg-gray-100"
                />
                {c.statusHistory.map((h) => (
                  <li key={h.id} className="relative z-10 flex gap-4">
                    <span
                      aria-hidden
                      className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-navy-200 bg-navy-50"
                    >
                      <span className="size-2 rounded-full bg-navy-600" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-navy-900">
                        {h.fromStatus
                          ? `Estado: ${h.fromStatus} → ${h.toStatus}`
                          : `Caso publicado (${h.toStatus})`}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Por:{" "}
                        {HISTORY_ACTOR_LABEL[h.changedByUser.role] ??
                          "Sistema"}{" "}
                        · {formatDateTime(h.createdAt)}
                      </p>
                      {h.reason ? (
                        <p className="mt-2 rounded border border-gray-100 bg-gray-50 p-2 text-sm text-gray-600">
                          {h.reason}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* Columna derecha 30% */}
        <aside className="flex flex-col gap-6 lg:col-span-4">
          {/* Tiempo en cola / abogado asignado */}
          {activeAssignment ? (
            <section className="overflow-hidden rounded-xl border border-success-100 bg-white shadow-sm">
              <div aria-hidden className="h-1 w-full bg-success-500" />
              <div className="flex flex-col gap-3 p-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-success-700">
                  Abogado asignado
                </span>
                <p className="text-lg font-semibold text-navy-900">
                  {activeAssignment.lawyer.firstName}{" "}
                  {activeAssignment.lawyer.lastName}
                </p>
                {activeAssignment.lawyer.lawyerProfile?.bio ? (
                  <p className="text-sm text-gray-600">
                    {activeAssignment.lawyer.lawyerProfile.bio}
                  </p>
                ) : null}
                <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
                  <a
                    href={`mailto:${activeAssignment.lawyer.email}`}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-navy-700"
                  >
                    <Mail className="size-4" aria-hidden />
                    {activeAssignment.lawyer.email}
                  </a>
                  {activeAssignment.lawyer.phone ? (
                    <a
                      href={`tel:${activeAssignment.lawyer.phone}`}
                      className="flex items-center gap-2 text-sm text-gray-700 hover:text-navy-700"
                    >
                      <Phone className="size-4" aria-hidden />
                      {activeAssignment.lawyer.phone}
                    </a>
                  ) : null}
                </div>
              </div>
            </section>
          ) : (
            <section className="overflow-hidden rounded-xl border border-warning-100 bg-white shadow-sm">
              <div aria-hidden className="h-1 w-full bg-warning-500" />
              <div className="flex flex-col items-center gap-2 p-6 text-center">
                <CalendarClock
                  aria-hidden
                  className="size-8 text-warning-500"
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  En cola de revisión
                </span>
                <p className="text-sm text-gray-600">
                  Tu caso está siendo evaluado por nuestra red de abogados
                  validados.
                </p>
              </div>
            </section>
          )}

          {/* Info del caso */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-navy-900">
              Información del caso
            </h3>
            <dl className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <MapPin
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-gray-400"
                />
                <div>
                  <dt className="text-xs uppercase tracking-wider text-gray-500">
                    Ubicación
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {c.comuna ?? "—"}
                    {c.region ? `, ${c.region}` : ""}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Scale
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-gray-400"
                />
                <div>
                  <dt className="text-xs uppercase tracking-wider text-gray-500">
                    Especialidad
                  </dt>
                  <dd className="text-sm text-gray-900">{c.specialty.name}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarClock
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-gray-400"
                />
                <div>
                  <dt className="text-xs uppercase tracking-wider text-gray-500">
                    Publicado
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {c.publishedAt ? formatDateTime(c.publishedAt) : "—"}
                  </dd>
                </div>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
