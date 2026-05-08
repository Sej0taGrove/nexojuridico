"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Lock, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { SpecialtyTag } from "@/components/shared/SpecialtyTag";
import { UrgencyBadge } from "@/components/shared/UrgencyBadge";
import { SITUATION_LABELS } from "@/lib/cases/title";
import {
  relativeTime,
  type AcceptedCaseDetail,
  type FeedCaseDetail,
} from "@/lib/cases/lawyer";

async function fetchPreview(id: string): Promise<FeedCaseDetail> {
  const res = await fetch(`/api/feed/${id}`, { credentials: "include" });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "No se pudo cargar el caso");
  }
  return json.data.case as FeedCaseDetail;
}

async function acceptCase(id: string): Promise<AcceptedCaseDetail> {
  const res = await fetch(`/api/cases/${id}/accept`, {
    method: "POST",
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "No se pudo aceptar el caso");
  }
  return json.data.case as AcceptedCaseDetail;
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

export default function FeedDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["feed", "detail", id],
    queryFn: () => fetchPreview(id),
  });

  const acceptMutation = useMutation({
    mutationFn: () => acceptCase(id),
    onSuccess: () => {
      toast.success("Caso aceptado");
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["lawyer-cases"] });
      router.push(`/mis-casos-abogado/${id}`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
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
              <Link href="/feed">
                <ArrowLeft className="size-4" aria-hidden />
                Volver al feed
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

  const urgencyTitle =
    c.urgency === "alta"
      ? "Por qué es URGENTE"
      : c.urgency === "media"
        ? "Por qué es PRIORIDAD MEDIA"
        : c.urgency === "baja"
          ? "Por qué es SIN PRISA"
          : "Sobre la urgencia";

  return (
    <div className="mx-auto w-full max-w-[1200px] p-6 md:p-8">
      <Link
        href="/feed"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-navy-700"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Feed
      </Link>

      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
          {c.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {c.urgency ? <UrgencyBadge level={c.urgency} /> : null}
          <SpecialtyTag specialty={c.specialty.name} />
        </div>
      </header>

      <div
        role="status"
        className="mb-6 flex items-start gap-3 rounded-xl border border-warning-100 bg-warning-50 p-4 text-warning-700"
      >
        <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
        <p className="text-sm leading-relaxed">
          Estás viendo este caso en modo preview. Los datos completos del
          cliente se desbloquean al aceptar el caso.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Columna izquierda 60% */}
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
                  Urgencia
                </dt>
                <dd className="mt-1 text-sm text-gray-700">
                  {c.urgency ? c.urgency.toUpperCase() : "—"}
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

          <section className="rounded-xl border border-info-100 bg-info-50/50 p-6">
            <h2 className="mb-2 text-base font-semibold text-info-700">
              {urgencyTitle}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700">
              {c.urgencyExplanation}
            </p>
          </section>
        </div>

        {/* Columna derecha 40% */}
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
                  {c.client.firstName}{" "}
                  <span className="text-gray-400">(apellido oculto)</span>
                </p>
                {c.client.comuna ? (
                  <p className="text-sm text-gray-500">{c.client.comuna}</p>
                ) : null}
              </div>
            </div>

            <ul className="flex flex-col gap-2 border-t border-gray-100 pt-4">
              {[
                { label: "Apellido" },
                { label: "Email" },
                { label: "Teléfono" },
                { label: "RUT" },
              ].map((f) => (
                <li
                  key={f.label}
                  className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-500"
                >
                  <Lock
                    className="size-3.5 text-gray-400"
                    aria-hidden
                  />
                  <span className="font-medium text-gray-600">
                    {f.label}:
                  </span>
                  <span className="text-gray-400">••••••••</span>
                </li>
              ))}
            </ul>

            <p className="text-xs italic text-gray-500">
              Estos datos se desbloquean al aceptar el caso.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                size="lg"
                className="w-full"
                onClick={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending}
              >
                {acceptMutation.isPending ? "Aceptando…" : "Aceptar caso"}
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="w-full"
              >
                <Link href="/feed">Rechazar / no me interesa</Link>
              </Button>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                Al aceptar te comprometes a contactar al cliente en las
                próximas 48 horas.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
