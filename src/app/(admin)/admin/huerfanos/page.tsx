"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Ban,
  Clock,
  Flame,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { SpecialtyTag } from "@/components/shared/SpecialtyTag";
import { UrgencyBadge } from "@/components/shared/UrgencyBadge";
import { SPECIALTIES } from "@/lib/constants/specialties";
import type { OrphanCasesResponse } from "@/lib/admin/types";

type SortBy = "days" | "urgency";
type UrgencyFilter = "all" | "alta" | "media" | "baja";
type SpecialtyFilter = "all" | string; // code

async function fetchOrphans(
  specialty: SpecialtyFilter,
  urgency: UrgencyFilter,
  sort: SortBy,
): Promise<OrphanCasesResponse> {
  const url = new URL("/api/admin/orphan-cases", window.location.origin);
  if (specialty !== "all") {
    const specObj = SPECIALTIES.find((s) => s.code === specialty);
    if (specObj) url.searchParams.set("specialtyId", String(specObj.id));
  }
  if (urgency !== "all") url.searchParams.set("urgency", urgency);
  url.searchParams.set("sort", sort);
  const res = await fetch(url.toString(), { credentials: "include" });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "Error cargando huérfanos");
  }
  return json.data as OrphanCasesResponse;
}

async function closeCase(id: string, reason: string): Promise<void> {
  const res = await fetch(`/api/admin/cases/${id}/close`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ reason }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "No se pudo cerrar el caso");
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
  });
}

export default function AdminHuerfanosPage() {
  const qc = useQueryClient();
  const [specialty, setSpecialty] = useState<SpecialtyFilter>("all");
  const [urgency, setUrgency] = useState<UrgencyFilter>("all");
  const [sort, setSort] = useState<SortBy>("days");

  const [closeTarget, setCloseTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [closeReason, setCloseReason] = useState("");
  const [reassignTarget, setReassignTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "orphans", specialty, urgency, sort],
    queryFn: () => fetchOrphans(specialty, urgency, sort),
  });

  const closeMutation = useMutation({
    mutationFn: (vars: { id: string; reason: string }) =>
      closeCase(vars.id, vars.reason),
    onSuccess: () => {
      toast.success("Caso cerrado");
      qc.invalidateQueries({ queryKey: ["admin", "orphans"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      qc.invalidateQueries({ queryKey: ["admin", "sidebar-stats"] });
      setCloseTarget(null);
      setCloseReason("");
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Error cerrando el caso");
    },
  });

  const stats = data?.stats;
  const cases = data?.cases ?? [];

  const specialtyOptions = useMemo(
    () => [
      { value: "all", label: "Todas las especialidades" },
      ...SPECIALTIES.map((s) => ({ value: s.code, label: s.name })),
    ],
    [],
  );

  return (
    <div className="mx-auto w-full max-w-[1440px] p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
          Casos huérfanos
        </h1>
        <p className="mt-2 text-base text-gray-500">
          Casos sin tomar después de 7 días en cola
        </p>
      </header>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-warning-100 bg-warning-50 p-4">
        <AlertTriangle
          className="mt-0.5 size-5 shrink-0 text-warning-700"
          aria-hidden
        />
        <div>
          <p className="text-sm font-semibold text-warning-700">
            Estos casos requieren intervención manual
          </p>
          <p className="text-sm text-warning-700/80">
            Considera reasignar o cerrar si ya no son viables.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {/* Filtros */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
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
              value={sort}
              onChange={(e) => setSort(e.target.value as SortBy)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
            >
              <option value="days">Ordenar por días en cola</option>
              <option value="urgency">Ordenar por urgencia</option>
            </select>
          </div>

          {/* Tabla */}
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            {isLoading ? (
              <div className="p-6">
                <LoadingSkeleton variant="row" count={5} />
              </div>
            ) : error ? (
              <div className="p-6 text-sm text-danger-700">
                {error instanceof Error
                  ? error.message
                  : "Error cargando huérfanos."}
              </div>
            ) : cases.length === 0 ? (
              <EmptyState
                icon={AlertTriangle}
                title="No hay casos huérfanos"
                description="Ningún caso lleva más de 7 días sin ser tomado con estos filtros."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Caso</th>
                      <th className="px-4 py-3 font-semibold">
                        Especialidad
                      </th>
                      <th className="px-4 py-3 font-semibold">Urgencia</th>
                      <th className="px-4 py-3 font-semibold">Días en cola</th>
                      <th className="px-4 py-3 font-semibold">Cliente</th>
                      <th className="px-4 py-3 font-semibold text-right">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cases.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-navy-900">
                            {c.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            #{c.id.slice(0, 8)} · {formatDate(c.createdAt)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <SpecialtyTag specialty={c.specialty.name} />
                        </td>
                        <td className="px-4 py-3">
                          {c.urgency ? (
                            <UrgencyBadge level={c.urgency} />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-sm font-semibold ${
                              c.daysInQueue >= 14
                                ? "text-danger-700"
                                : "text-gray-700"
                            }`}
                          >
                            {c.daysInQueue} días
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <p>
                            {c.client.firstName} {c.client.lastName[0] ?? ""}.
                          </p>
                          <p className="text-xs text-gray-500">
                            {c.comuna ?? c.region ?? "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setReassignTarget({
                                  id: c.id,
                                  title: c.title,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-md border border-navy-200 bg-navy-50 px-3 py-1.5 text-xs font-semibold text-navy-700 hover:bg-navy-100"
                            >
                              <RotateCw className="size-3" aria-hidden />
                              Reasignar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCloseTarget({ id: c.id, title: c.title });
                                setCloseReason("");
                              }}
                              className="inline-flex items-center gap-1 rounded-md bg-danger-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-danger-700"
                            >
                              <Ban className="size-3" aria-hidden />
                              Cerrar caso
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar stats */}
        <aside className="flex flex-col gap-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-navy-900">
              Resumen de impacto
            </h2>
            <dl className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-md bg-danger-50 text-danger-700"
                >
                  <AlertTriangle className="size-4" />
                </span>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Total huérfanos
                  </dt>
                  <dd className="text-2xl font-bold text-navy-900">
                    {stats?.total ?? 0}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-md bg-navy-50 text-navy-700"
                >
                  <Clock className="size-4" />
                </span>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Promedio días en cola
                  </dt>
                  <dd className="text-2xl font-bold text-navy-900">
                    {stats?.avgDaysInQueue ?? 0}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-md bg-warning-50 text-warning-700"
                >
                  <Flame className="size-4" />
                </span>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Urgentes
                  </dt>
                  <dd className="text-2xl font-bold text-navy-900">
                    {stats?.urgentCount ?? 0}
                  </dd>
                </div>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-navy-900">
              Especialidades más afectadas
            </h2>
            {!stats || stats.bySpecialty.length === 0 ? (
              <p className="text-sm text-gray-500">Sin datos.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {stats.bySpecialty.map((s, i) => (
                  <li
                    key={s.name}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2 text-gray-700">
                      <span className="text-xs text-gray-400">
                        #{i + 1}
                      </span>
                      {s.name}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                      {s.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {/* Cerrar caso (alert) */}
      <AlertDialog
        open={closeTarget !== null}
        onOpenChange={(o) => {
          if (!o) {
            setCloseTarget(null);
            setCloseReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar este caso huérfano?</AlertDialogTitle>
            <AlertDialogDescription>
              {closeTarget
                ? `"${closeTarget.title}" pasará a estado cancelado y dejará de aparecer en el feed. Esta acción quedará registrada en el log de auditoría.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Motivo (opcional)
            </label>
            <textarea
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Ej: Cliente ya no es contactable"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!closeTarget) return;
                closeMutation.mutate({
                  id: closeTarget.id,
                  reason:
                    closeReason.trim().length >= 5
                      ? closeReason.trim()
                      : "Cerrado por administrador",
                });
              }}
              disabled={closeMutation.isPending}
            >
              Cerrar caso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reasignar (placeholder) */}
      <Dialog
        open={reassignTarget !== null}
        onOpenChange={(o) => {
          if (!o) setReassignTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reasignar caso</DialogTitle>
            <DialogDescription>
              {reassignTarget
                ? `"${reassignTarget.title}"`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-info-100 bg-info-50 p-4 text-sm text-info-700">
            <p className="font-semibold">Próximamente</p>
            <p className="mt-1">
              Aquí podrás re-rutar el caso a un abogado específico de la
              especialidad. La reasignación manual no está habilitada en esta
              versión.
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
