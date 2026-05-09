"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  PlayCircle,
  Search,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { ValidationStatus } from "@prisma/client";

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
import type { AdminLawyerListItem } from "@/lib/admin/types";
import { Inbox, Users } from "lucide-react";

type ListResponse = {
  counts: { pending: number; approved: number; rejected: number; suspended: number };
  lawyers: AdminLawyerListItem[];
};

type Tab = `${ValidationStatus}`;

const TABS: { key: Tab; label: string }[] = [
  { key: "pending", label: "Pendientes" },
  { key: "approved", label: "Aprobados" },
  { key: "rejected", label: "Rechazados" },
  { key: "suspended", label: "Suspendidos" },
];

async function fetchLawyers(
  status: Tab,
  search: string,
): Promise<ListResponse> {
  const url = new URL("/api/admin/lawyers", window.location.origin);
  url.searchParams.set("status", status);
  if (search) url.searchParams.set("search", search);
  const res = await fetch(url.toString(), { credentials: "include" });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "Error cargando abogados");
  }
  return json.data as ListResponse;
}

type Action = "approve" | "reject" | "suspend" | "reactivate";

async function patchLawyer(
  id: string,
  action: Action,
  rejectionReason?: string,
): Promise<void> {
  const res = await fetch(`/api/admin/lawyers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action, rejectionReason }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "No se pudo actualizar el abogado");
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export default function AdminAbogadosPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rejectModal, setRejectModal] = useState<AdminLawyerListItem | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    lawyer: AdminLawyerListItem;
    action: Action;
  } | null>(null);

  // Debounce simple
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "lawyers", tab, debouncedSearch],
    queryFn: () => fetchLawyers(tab, debouncedSearch),
  });

  const mutation = useMutation({
    mutationFn: (vars: {
      id: string;
      action: Action;
      rejectionReason?: string;
    }) => patchLawyer(vars.id, vars.action, vars.rejectionReason),
    onSuccess: (_data, vars) => {
      toast.success(
        vars.action === "approve"
          ? "Abogado aprobado"
          : vars.action === "reject"
            ? "Abogado rechazado"
            : vars.action === "suspend"
              ? "Abogado suspendido"
              : "Abogado reactivado",
      );
      qc.invalidateQueries({ queryKey: ["admin", "lawyers"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Error en la operación");
    },
  });

  const handleApprove = (lawyer: AdminLawyerListItem) => {
    mutation.mutate({ id: lawyer.id, action: "approve" });
  };
  const handleReject = (lawyer: AdminLawyerListItem) => {
    setRejectModal(lawyer);
    setRejectReason("");
  };
  const submitReject = () => {
    if (!rejectModal) return;
    if (rejectReason.trim().length < 5) {
      toast.error("Indica un motivo (mínimo 5 caracteres)");
      return;
    }
    mutation.mutate(
      {
        id: rejectModal.id,
        action: "reject",
        rejectionReason: rejectReason.trim(),
      },
      {
        onSuccess: () => {
          setRejectModal(null);
          setRejectReason("");
        },
      },
    );
  };
  const handleAction = (lawyer: AdminLawyerListItem, action: Action) => {
    setConfirmAction({ lawyer, action });
  };
  const submitConfirm = () => {
    if (!confirmAction) return;
    mutation.mutate(
      {
        id: confirmAction.lawyer.id,
        action: confirmAction.action,
      },
      {
        onSuccess: () => setConfirmAction(null),
      },
    );
  };

  const counts = data?.counts;
  const lawyers = data?.lawyers ?? [];

  return (
    <div className="mx-auto w-full max-w-[1440px] p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
          Validación de abogados
        </h1>
        <p className="mt-2 text-base text-gray-500">
          {counts?.pending ?? 0} solicitudes pendientes de revisión
        </p>
      </header>

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-gray-200">
        {TABS.map((t) => {
          const count = counts ? counts[t.key] : 0;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`relative -mb-px flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "border-b-2 border-navy-600 text-navy-700"
                  : "border-b-2 border-transparent text-gray-500 hover:text-navy-700"
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  active
                    ? "bg-navy-100 text-navy-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mb-6 flex max-w-md items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2">
        <Search className="size-4 text-gray-400" aria-hidden />
        <input
          type="search"
          placeholder="Buscar por nombre, RUT o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
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
              : "Error cargando abogados."}
          </div>
        ) : lawyers.length === 0 ? (
          <EmptyState
            icon={tab === "pending" ? Inbox : Users}
            title={
              tab === "pending"
                ? "No hay solicitudes pendientes"
                : tab === "approved"
                  ? "No hay abogados aprobados"
                  : tab === "rejected"
                    ? "No hay abogados rechazados"
                    : "No hay abogados suspendidos"
            }
            description={
              tab === "pending"
                ? "Cuando lleguen solicitudes nuevas aparecerán aquí para validar."
                : "Ajusta el buscador o cambia de pestaña para ver otros estados."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Abogado</th>
                  <th className="px-4 py-3 font-semibold">RUT</th>
                  <th className="px-4 py-3 font-semibold">Especialidades</th>
                  <th className="px-4 py-3 font-semibold">Solicitud</th>
                  <th className="px-4 py-3 font-semibold">Documentos</th>
                  <th className="px-4 py-3 font-semibold text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {lawyers.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-sm font-semibold text-navy-700"
                        >
                          {initials(l.firstName, l.lastName)}
                        </span>
                        <div>
                          <p className="font-medium text-navy-900">
                            {l.firstName} {l.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{l.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">
                      {l.rut ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {l.specialties.length === 0 ? (
                          <span className="text-xs text-gray-400">
                            Sin especialidades
                          </span>
                        ) : (
                          l.specialties.map((s) => (
                            <SpecialtyTag key={s.id} specialty={s.name} />
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(l.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {l.hasCertificates ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-success-700">
                          <CheckCircle2
                            className="size-4"
                            aria-hidden
                          />
                          Cargados
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-warning-700">
                          <AlertTriangle
                            className="size-4"
                            aria-hidden
                          />
                          Faltan
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {l.validationStatus === ValidationStatus.pending ||
                        l.validationStatus === ValidationStatus.rejected ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(l)}
                              disabled={mutation.isPending}
                              className="rounded-md bg-success-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-success-700 disabled:opacity-50"
                            >
                              Aprobar
                            </button>
                            {l.validationStatus ===
                            ValidationStatus.pending ? (
                              <button
                                type="button"
                                onClick={() => handleReject(l)}
                                disabled={mutation.isPending}
                                className="rounded-md border border-danger-500 px-3 py-1.5 text-xs font-semibold text-danger-700 transition-colors hover:bg-danger-50 disabled:opacity-50"
                              >
                                Rechazar
                              </button>
                            ) : null}
                          </>
                        ) : null}
                        {l.validationStatus === ValidationStatus.approved ? (
                          <button
                            type="button"
                            onClick={() => handleAction(l, "suspend")}
                            disabled={mutation.isPending}
                            className="rounded-md border border-warning-500 px-3 py-1.5 text-xs font-semibold text-warning-700 transition-colors hover:bg-warning-50 disabled:opacity-50"
                          >
                            Suspender
                          </button>
                        ) : null}
                        {l.validationStatus === ValidationStatus.suspended ? (
                          <button
                            type="button"
                            onClick={() => handleAction(l, "reactivate")}
                            disabled={mutation.isPending}
                            className="inline-flex items-center gap-1 rounded-md bg-navy-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy-700 disabled:opacity-50"
                          >
                            <PlayCircle className="size-3.5" aria-hidden />
                            Reactivar
                          </button>
                        ) : null}
                        <Link
                          href={`/admin/abogados/${l.id}`}
                          className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-navy-600 transition-colors hover:bg-navy-50"
                        >
                          Ver detalle
                          <ExternalLink className="size-3" aria-hidden />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal: rechazo con motivo */}
      <Dialog
        open={rejectModal !== null}
        onOpenChange={(o) => {
          if (!o) {
            setRejectModal(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar abogado</DialogTitle>
            <DialogDescription>
              {rejectModal
                ? `Indica el motivo del rechazo para ${rejectModal.firstName} ${rejectModal.lastName}. Esta información quedará registrada.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Motivo
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Ej: Documentación insuficiente, certificado vencido..."
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500">
              {rejectReason.length}/500 caracteres
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </DialogClose>
            <button
              type="button"
              onClick={submitReject}
              disabled={mutation.isPending}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-danger-500 px-5 text-sm font-semibold text-white hover:bg-danger-700 disabled:opacity-50"
            >
              Confirmar rechazo
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm: suspender / reactivar */}
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(o) => {
          if (!o) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                  confirmAction?.action === "suspend"
                    ? "bg-warning-50 text-warning-700"
                    : "bg-success-50 text-success-700"
                }`}
              >
                <ShieldAlert className="size-5" />
              </span>
              <div>
                <AlertDialogTitle>
                  {confirmAction?.action === "suspend"
                    ? "Suspender abogado"
                    : "Reactivar abogado"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {confirmAction?.action === "suspend"
                    ? `${confirmAction.lawyer.firstName} ${confirmAction.lawyer.lastName} no podrá tomar nuevos casos. Sus casos activos no se cerrarán.`
                    : confirmAction
                      ? `${confirmAction.lawyer.firstName} ${confirmAction.lawyer.lastName} volverá a poder tomar casos.`
                      : ""}
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitConfirm}
              disabled={mutation.isPending}
              className={
                confirmAction?.action === "reactivate"
                  ? "bg-navy-600 hover:bg-navy-700"
                  : "bg-warning-500 hover:bg-warning-700"
              }
            >
              {confirmAction?.action === "suspend"
                ? "Suspender"
                : "Reactivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
