"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Mail, Phone, FileText, MapPin } from "lucide-react";

import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { SpecialtyTag } from "@/components/shared/SpecialtyTag";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UrgencyBadge } from "@/components/shared/UrgencyBadge";
import type { AdminCaseDetail } from "@/lib/admin/types";

async function fetchCase(id: string): Promise<AdminCaseDetail> {
  const res = await fetch(`/api/admin/cases/${id}`, { credentials: "include" });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "Caso no encontrado");
  }
  return json.data.case as AdminCaseDetail;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function renderResponseValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map((x) => String(x)).join(", ");
  return JSON.stringify(v);
}

export default function AdminCaseDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "case", id],
    queryFn: () => fetchCase(id),
  });

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1200px] p-6 md:p-8">
        <LoadingSkeleton variant="card" count={2} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-[1200px] p-6 md:p-8">
        <div className="rounded-xl border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">
          {error instanceof Error ? error.message : "Caso no encontrado."}
        </div>
        <Link
          href="/admin/casos"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-600 hover:underline"
        >
          <ArrowLeft className="size-4" /> Volver
        </Link>
      </div>
    );
  }

  const c = data;
  const responseEntries = Object.entries(c.responses);

  return (
    <div className="mx-auto w-full max-w-[1200px] p-6 md:p-8">
      <Link
        href="/admin/casos"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-navy-700"
      >
        <ArrowLeft className="size-4" /> Volver al listado
      </Link>

      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <SpecialtyTag specialty={c.specialty.name} />
          {c.urgency ? <UrgencyBadge level={c.urgency} /> : null}
          <StatusBadge status={c.status} />
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
          {c.title}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          #{c.id.slice(0, 8)} · Creado {formatDate(c.createdAt)}
          {c.publishedAt
            ? ` · Publicado ${formatDate(c.publishedAt)}`
            : ""}
          {c.assignedAt
            ? ` · Asignado ${formatDate(c.assignedAt)}`
            : ""}
          {c.closedAt ? ` · Cerrado ${formatDate(c.closedAt)}` : ""}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {c.summary ? (
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-navy-900">
                Resumen del caso
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                {c.summary}
              </p>
            </section>
          ) : null}

          {/* Respuestas */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-navy-900">
              Respuestas del formulario
            </h2>
            {responseEntries.length === 0 ? (
              <p className="text-sm text-gray-500">Sin respuestas.</p>
            ) : (
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                {responseEntries.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                      {k}
                    </dt>
                    <dd className="mt-1 break-words text-gray-900">
                      {renderResponseValue(v)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          {/* Historial de estados */}
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-navy-900">
                Historial de estados
              </h2>
            </div>
            {c.statusHistory.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-500">Sin cambios registrados.</p>
            ) : (
              <ul className="divide-y divide-gray-100 px-6">
                {c.statusHistory.map((h) => (
                  <li key={h.id} className="py-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {h.fromStatus ? (
                        <>
                          <StatusBadge status={h.fromStatus} />
                          <span className="text-gray-400">→</span>
                        </>
                      ) : null}
                      <StatusBadge status={h.toStatus} />
                      <span className="text-xs text-gray-500">
                        {formatDateTime(h.changedAt)} ·{" "}
                        {h.changedBy.firstName} {h.changedBy.lastName}{" "}
                        ({h.changedBy.role})
                      </span>
                    </div>
                    {h.reason ? (
                      <p className="mt-1 text-sm text-gray-600">{h.reason}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Sidebar derecho */}
        <aside className="flex flex-col gap-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-navy-900">
              Cliente
            </h2>
            <p className="font-medium text-navy-900">
              {c.client.firstName} {c.client.lastName}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 size-4 text-gray-400" aria-hidden />
                {c.client.email}
              </li>
              {c.client.phone ? (
                <li className="flex items-start gap-2">
                  <Phone
                    className="mt-0.5 size-4 text-gray-400"
                    aria-hidden
                  />
                  {c.client.phone}
                </li>
              ) : null}
              {c.client.rut ? (
                <li className="flex items-start gap-2 font-mono">
                  <FileText
                    className="mt-0.5 size-4 text-gray-400"
                    aria-hidden
                  />
                  {c.client.rut}
                </li>
              ) : null}
              {c.client.region || c.client.comuna ? (
                <li className="flex items-start gap-2">
                  <MapPin
                    className="mt-0.5 size-4 text-gray-400"
                    aria-hidden
                  />
                  {[c.client.comuna, c.client.region]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </li>
              ) : null}
            </ul>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-navy-900">
              Abogado asignado
            </h2>
            {c.assignedLawyer ? (
              <Link
                href={`/admin/abogados/${c.assignedLawyer.id}`}
                className="font-medium text-navy-700 hover:underline"
              >
                {c.assignedLawyer.firstName} {c.assignedLawyer.lastName}
              </Link>
            ) : (
              <p className="text-sm text-gray-500">Sin asignación activa.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
