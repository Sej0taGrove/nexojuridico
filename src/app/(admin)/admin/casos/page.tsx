"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CaseStatus, UrgencyLevel } from "@prisma/client";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { SpecialtyTag } from "@/components/shared/SpecialtyTag";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UrgencyBadge } from "@/components/shared/UrgencyBadge";
import { SPECIALTIES } from "@/lib/constants/specialties";
import type { AdminCaseListItem } from "@/lib/admin/types";
import { FolderOpen } from "lucide-react";

type ListResponse = {
  cases: AdminCaseListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type StatusFilter = "all" | `${CaseStatus}`;
type UrgencyFilter = "all" | `${UrgencyLevel}`;
type SpecialtyFilter = "all" | string;

async function fetchCases(
  page: number,
  status: StatusFilter,
  urgency: UrgencyFilter,
  specialty: SpecialtyFilter,
  search: string,
): Promise<ListResponse> {
  const url = new URL("/api/admin/cases", window.location.origin);
  url.searchParams.set("page", String(page));
  if (status !== "all") url.searchParams.set("status", status);
  if (urgency !== "all") url.searchParams.set("urgency", urgency);
  if (specialty !== "all") {
    const sp = SPECIALTIES.find((s) => s.code === specialty);
    if (sp) url.searchParams.set("specialtyId", String(sp.id));
  }
  if (search) url.searchParams.set("search", search);
  const res = await fetch(url.toString(), { credentials: "include" });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "Error cargando casos");
  }
  return json.data as ListResponse;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos los estados" },
  { value: "borrador", label: "Borrador" },
  { value: "en_cola", label: "En cola" },
  { value: "asignado", label: "Asignado" },
  { value: "en_negociacion", label: "En negociación" },
  { value: "cerrado_ganado", label: "Cerrado ganado" },
  { value: "cerrado_perdido", label: "Cerrado perdido" },
  { value: "cancelado", label: "Cancelado" },
  { value: "huerfano", label: "Huérfano" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminCasosPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [urgency, setUrgency] = useState<UrgencyFilter>("all");
  const [specialty, setSpecialty] = useState<SpecialtyFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Cuando cambian filtros, vuelve a la página 1
  useEffect(() => {
    setPage(1);
  }, [status, urgency, specialty]);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "admin",
      "cases",
      page,
      status,
      urgency,
      specialty,
      debouncedSearch,
    ],
    queryFn: () =>
      fetchCases(page, status, urgency, specialty, debouncedSearch),
  });

  const specialtyOptions = useMemo(
    () => [
      { value: "all", label: "Todas las especialidades" },
      ...SPECIALTIES.map((s) => ({ value: s.code, label: s.name })),
    ],
    [],
  );

  const cases = data?.cases ?? [];
  const pagination = data?.pagination;

  return (
    <div className="mx-auto w-full max-w-[1440px] p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
          Todos los casos
        </h1>
        <p className="mt-2 text-base text-gray-500">
          {pagination
            ? `${pagination.total} casos en total`
            : "Cargando…"}
        </p>
      </header>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex max-w-md flex-1 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2">
          <Search className="size-4 text-gray-400" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o cliente..."
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={urgency}
          onChange={(e) => setUrgency(e.target.value as UrgencyFilter)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
        >
          <option value="all">Todas las urgencias</option>
          <option value="alta">Urgente</option>
          <option value="media">Prioridad media</option>
          <option value="baja">Sin prisa</option>
        </select>
        <select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
        >
          {specialtyOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton variant="row" count={8} />
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-danger-700">
            {error instanceof Error
              ? error.message
              : "Error cargando casos."}
          </div>
        ) : cases.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No hay casos con estos filtros"
            description="Limpia los filtros o cambia el rango para ver más resultados."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Caso</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Especialidad</th>
                  <th className="px-4 py-3 font-semibold">Urgencia</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Abogado</th>
                  <th className="px-4 py-3 font-semibold">Creado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cases.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      window.location.href = `/admin/casos/${c.id}`;
                    }}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {c.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/casos/${c.id}`}
                        className="font-medium text-navy-900 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {c.client.firstName} {c.client.lastName}
                    </td>
                    <td className="px-4 py-3">
                      <SpecialtyTag specialty={c.specialty.name} />
                    </td>
                    <td className="px-4 py-3">
                      {c.urgency ? <UrgencyBadge level={c.urgency} /> : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {c.assignedLawyer
                        ? `${c.assignedLawyer.firstName} ${c.assignedLawyer.lastName}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Paginación */}
      {pagination && pagination.totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Página {pagination.page} de {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="size-4" aria-hidden />
              Anterior
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
