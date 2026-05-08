"use client";

import Link from "next/link";
import { use } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Mail,
  MapPin,
  Phone,
  User as UserIcon,
} from "lucide-react";
import type { CaseStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { SpecialtyTag } from "@/components/shared/SpecialtyTag";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UrgencyBadge } from "@/components/shared/UrgencyBadge";
import { SITUATION_LABELS } from "@/lib/cases/title";
import { relativeTime, type AcceptedCaseDetail } from "@/lib/cases/lawyer";

async function fetchAcceptedCase(id: string): Promise<AcceptedCaseDetail> {
  const res = await fetch(`/api/lawyer/cases/${id}`, {
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "No se pudo cargar el caso");
  }
  return json.data.case as AcceptedCaseDetail;
}

async function changeStatus(input: {
  id: string;
  status: CaseStatus;
}): Promise<void> {
  const res = await fetch(`/api/cases/${input.id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status: input.status }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "No se pudo cambiar el estado");
  }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function readResponse(
  responses: Record<string, unknown>,
  key: string,
): string | null {
  const v = responses[key];
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v.length > 0 ? v : null;
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (typeof v === "number") return String(v);
  return null;
}

function nextStatusOptions(status: CaseStatus): {
  value: CaseStatus;
  label: string;
}[] {
  if (status === "asignado") {
    return [{ value: "en_negociacion", label: "Marcar en negociación" }];
  }
  if (status === "en_negociacion") {
    return [
      { value: "cerrado_ganado", label: "Cerrar caso ganado" },
      { value: "cerrado_perdido", label: "Cerrar caso perdido" },
    ];
  }
  return [];
}

export default function MisCasosAbogadoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["lawyer-cases", id],
    queryFn: () => fetchAcceptedCase(id),
  });

  const statusMutation = useMutation({
    mutationFn: changeStatus,
    onSuccess: (_void, vars) => {
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey: ["lawyer-cases"] });
      qc.invalidateQueries({ queryKey: ["lawyer-cases", vars.id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1200px] p-6 md:p-8">
        <LoadingSkeleton variant="card" count={3} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-[1200px] p-6 md:p-8">
        <div className="rounded-xl border border-danger-100 bg-danger-50 p-6 text-sm text-danger-700">
          {error instanceof Error
            ? error.message
            : "No se pudo cargar el caso."}
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link href="/mis-casos-abogado">
                <ArrowLeft className="size-4" aria-hidden />
                Volver a mis casos
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const c = data;
  const r = c.responses;
  const situationKey = readResponse(r, "situation");
  const situation = situationKey
    ? SITUATION_LABELS[situationKey] ?? situationKey
    : "—";
  const occurredAt = readResponse(r, "occurredAt");
  const hasDocs = readResponse(r, "hasDocuments");
  const description = readResponse(r, "description");
  const transitions = nextStatusOptions(c.caseStatus);
  const isClosed =
    c.caseStatus === "cerrado_ganado" || c.caseStatus === "cerrado_perdido";

  async function copyContact() {
    const lines = [
      `${c.client.firstName} ${c.client.lastName}`,
      c.client.email,
      c.client.phone ?? "",
      c.client.rut ?? "",
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast.success("Datos de contacto copiados");
    } catch {
      toast.error("No se pudo copiar al portapapeles");
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] p-6 md:p-8">
      <Link
        href="/mis-casos-abogado"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-navy-700"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Mis casos
      </Link>

      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
          {c.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {c.urgency ? <UrgencyBadge level={c.urgency} /> : null}
          <SpecialtyTag specialty={c.specialty.name} />
          <StatusBadge status={c.caseStatus} />
        </div>
      </header>

      {!isClosed ? (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-xl border border-success-100 bg-success-50 p-4 text-success-700"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p className="text-sm leading-relaxed">
            Has aceptado este caso. Contacta al cliente lo antes posible.
          </p>
        </div>
      ) : (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-700">
          <Check className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p className="text-sm leading-relaxed">
            Este caso está cerrado. Los datos quedan disponibles como
            referencia.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Columna izquierda */}
        <div className="flex flex-col gap-6 lg:col-span-3">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-navy-900">
              Información del caso
            </h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Especialidad
                </dt>
                <dd className="mt-1 text-sm text-gray-700">
                  {c.specialty.name}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Aceptado
                </dt>
                <dd className="mt-1 text-sm text-gray-700">
                  {relativeTime(c.assignment.assignedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Publicado
                </dt>
                <dd className="mt-1 text-sm text-gray-700">
                  {relativeTime(c.publishedAt ?? c.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Región
                </dt>
                <dd className="mt-1 flex items-center gap-1.5 text-sm text-gray-700">
                  <MapPin className="size-4 text-gray-400" aria-hidden />
                  {c.region ?? "—"}
                  {c.comuna ? (
                    <span className="text-gray-500"> · {c.comuna}</span>
                  ) : null}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-navy-900">
              Descripción del caso
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
              {description ?? c.summaryPreview ?? "Sin descripción."}
            </p>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-navy-900">
              Respuestas del formulario
            </h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Situación
                </dt>
                <dd className="mt-1 text-sm text-gray-700">{situation}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Fecha del hecho
                </dt>
                <dd className="mt-1 text-sm text-gray-700">
                  {formatDate(occurredAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Documentación
                </dt>
                <dd className="mt-1 text-sm text-gray-700">
                  {hasDocs ?? "—"}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        {/* Columna derecha */}
        <aside className="lg:col-span-2">
          <div className="sticky top-24 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-navy-900">
              Datos del cliente
            </h2>

            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex size-12 items-center justify-center rounded-full bg-navy-100 text-base font-semibold text-navy-700"
              >
                {c.client.firstName.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-base font-semibold text-navy-900">
                  {c.client.firstName} {c.client.lastName}
                </p>
                {c.client.comuna ? (
                  <p className="text-sm text-gray-500">{c.client.comuna}</p>
                ) : null}
              </div>
            </div>

            <ul className="flex flex-col gap-2 border-t border-gray-100 pt-4 text-sm">
              <li className="flex items-center gap-2 text-gray-700">
                <UserIcon className="size-4 text-gray-400" aria-hidden />
                <span className="font-medium text-gray-600">RUT:</span>
                <span>{c.client.rut ?? "—"}</span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <Mail className="size-4 text-gray-400" aria-hidden />
                <a
                  href={`mailto:${c.client.email}`}
                  className="font-medium text-navy-600 hover:underline"
                >
                  {c.client.email}
                </a>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <Phone className="size-4 text-gray-400" aria-hidden />
                <a
                  href={`tel:${c.client.phone ?? ""}`}
                  className="font-medium text-navy-600 hover:underline"
                >
                  {c.client.phone ?? "—"}
                </a>
              </li>
            </ul>

            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={copyContact}
            >
              <Copy className="size-4" aria-hidden />
              Copiar datos de contacto
            </Button>

            {transitions.length > 0 ? (
              <div className="border-t border-gray-100 pt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                  Cambiar estado
                </p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full justify-between"
                      disabled={statusMutation.isPending}
                    >
                      <span>Acciones del caso</span>
                      <ChevronDown className="size-4" aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {transitions.map((t) => (
                      <DropdownMenuItem
                        key={t.value}
                        onSelect={() =>
                          statusMutation.mutate({
                            id: c.id,
                            status: t.value,
                          })
                        }
                      >
                        {t.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
