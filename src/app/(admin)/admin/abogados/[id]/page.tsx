"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ValidationStatus } from "@prisma/client";
import {
  ArrowLeft,
  Award,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Phone,
  Star,
  XCircle,
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
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { SpecialtyTag } from "@/components/shared/SpecialtyTag";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UrgencyBadge } from "@/components/shared/UrgencyBadge";
import type { AdminLawyerDetail } from "@/lib/admin/types";

type Action = "approve" | "reject" | "suspend" | "reactivate";

async function fetchLawyer(id: string): Promise<AdminLawyerDetail> {
  const res = await fetch(`/api/admin/lawyers/${id}`, {
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "Abogado no encontrado");
  }
  return json.data.lawyer as AdminLawyerDetail;
}

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
    throw new Error(json.error ?? "Error al actualizar");
  }
}

const STATUS_LABELS: Record<ValidationStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  suspended: "Suspendido",
};

const STATUS_STYLES: Record<ValidationStatus, string> = {
  pending: "bg-warning-50 text-warning-700 border-warning-100",
  approved: "bg-success-50 text-success-700 border-success-100",
  rejected: "bg-danger-50 text-danger-700 border-danger-100",
  suspended: "bg-gray-100 text-gray-700 border-gray-200",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function AdminLawyerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmAction, setConfirmAction] = useState<Action | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "lawyer", id],
    queryFn: () => fetchLawyer(id),
  });

  const mutation = useMutation({
    mutationFn: (vars: {
      action: Action;
      rejectionReason?: string;
    }) => patchLawyer(id, vars.action, vars.rejectionReason),
    onSuccess: (_d, vars) => {
      toast.success(
        vars.action === "approve"
          ? "Abogado aprobado"
          : vars.action === "reject"
            ? "Abogado rechazado"
            : vars.action === "suspend"
              ? "Abogado suspendido"
              : "Abogado reactivado",
      );
      qc.invalidateQueries({ queryKey: ["admin", "lawyer", id] });
      qc.invalidateQueries({ queryKey: ["admin", "lawyers"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Error en la operación");
    },
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
          {error instanceof Error ? error.message : "Abogado no encontrado."}
        </div>
        <Link
          href="/admin/abogados"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-600 hover:underline"
        >
          <ArrowLeft className="size-4" /> Volver
        </Link>
      </div>
    );
  }

  const l = data;
  const conversionRate =
    l.casesTakenCount > 0
      ? Math.round((l.casesWonCount / l.casesTakenCount) * 1000) / 10
      : 0;

  return (
    <div className="mx-auto w-full max-w-[1200px] p-6 md:p-8">
      <Link
        href="/admin/abogados"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-navy-700"
      >
        <ArrowLeft className="size-4" /> Volver al listado
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
            {l.firstName} {l.lastName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${STATUS_STYLES[l.validationStatus]}`}
            >
              {STATUS_LABELS[l.validationStatus]}
            </span>
            <span>Solicitud: {formatDate(l.createdAt)}</span>
            {l.validatedAt ? (
              <span>Validado: {formatDate(l.validatedAt)}</span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(l.validationStatus === ValidationStatus.pending ||
            l.validationStatus === ValidationStatus.rejected) && (
            <button
              type="button"
              onClick={() => setConfirmAction("approve")}
              disabled={mutation.isPending}
              className="rounded-md bg-success-500 px-4 py-2 text-sm font-semibold text-white hover:bg-success-700 disabled:opacity-50"
            >
              Aprobar
            </button>
          )}
          {l.validationStatus === ValidationStatus.pending && (
            <button
              type="button"
              onClick={() => {
                setShowRejectModal(true);
                setRejectReason("");
              }}
              disabled={mutation.isPending}
              className="rounded-md border border-danger-500 px-4 py-2 text-sm font-semibold text-danger-700 hover:bg-danger-50 disabled:opacity-50"
            >
              Rechazar
            </button>
          )}
          {l.validationStatus === ValidationStatus.approved && (
            <button
              type="button"
              onClick={() => setConfirmAction("suspend")}
              disabled={mutation.isPending}
              className="rounded-md border border-warning-500 px-4 py-2 text-sm font-semibold text-warning-700 hover:bg-warning-50 disabled:opacity-50"
            >
              Suspender
            </button>
          )}
          {l.validationStatus === ValidationStatus.suspended && (
            <button
              type="button"
              onClick={() => setConfirmAction("reactivate")}
              disabled={mutation.isPending}
              className="rounded-md bg-navy-600 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-50"
            >
              Reactivar
            </button>
          )}
        </div>
      </header>

      {l.rejectionReason ? (
        <div className="mb-6 rounded-xl border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">
          <p className="font-semibold">Motivo de rechazo:</p>
          <p className="mt-1">{l.rejectionReason}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Datos personales */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-navy-900">
              Datos personales
            </h2>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 size-4 text-gray-400" aria-hidden />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Email
                  </dt>
                  <dd className="text-gray-900">{l.email}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 text-gray-400" aria-hidden />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Teléfono
                  </dt>
                  <dd className="text-gray-900">{l.phone ?? "—"}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText
                  className="mt-0.5 size-4 text-gray-400"
                  aria-hidden
                />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    RUT
                  </dt>
                  <dd className="font-mono text-gray-900">
                    {l.rut ?? "—"}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Award className="mt-0.5 size-4 text-gray-400" aria-hidden />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    N° colegiatura
                  </dt>
                  <dd className="text-gray-900">{l.barNumber ?? "—"}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Briefcase
                  className="mt-0.5 size-4 text-gray-400"
                  aria-hidden
                />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Años experiencia
                  </dt>
                  <dd className="text-gray-900">
                    {l.yearsExperience ?? "—"}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Star className="mt-0.5 size-4 text-gray-400" aria-hidden />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tarifas
                  </dt>
                  <dd className="text-gray-900">{l.feeRange ?? "—"}</dd>
                </div>
              </div>
            </dl>
            {l.bio ? (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Biografía
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-700">
                  {l.bio}
                </p>
              </div>
            ) : null}
          </section>

          {/* Especialidades */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-navy-900">
              Especialidades
            </h2>
            {l.specialties.length === 0 ? (
              <p className="text-sm text-gray-500">
                Sin especialidades configuradas.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {l.specialties.map((s) => (
                  <SpecialtyTag key={s.id} specialty={s.name} />
                ))}
              </div>
            )}
          </section>

          {/* Documentos */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-navy-900">
              Documentos
            </h2>
            {(() => {
              if (!l.certificatesUrl) {
                return <p className="text-sm text-gray-500">No disponible.</p>;
              }
              try {
                const certs = JSON.parse(l.certificatesUrl);
                if (Array.isArray(certs) && certs.length > 0) {
                  return (
                    <div className="flex flex-col gap-2">
                      {certs.map((cert: any, idx: number) => (
                        <a
                          key={idx}
                          href={cert.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-navy-700 hover:bg-gray-50 max-w-sm"
                        >
                          <FileText className="size-4 text-navy-500 shrink-0" aria-hidden />
                          <span className="truncate">{cert.name}</span>
                          <ExternalLink className="ml-auto size-3 shrink-0" aria-hidden />
                        </a>
                      ))}
                    </div>
                  );
                }
                return <p className="text-sm text-gray-500">Formato inválido.</p>;
              } catch {
                return (
                  <a
                    href={l.certificatesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-navy-700 hover:bg-gray-50"
                  >
                    <FileText className="size-4 shrink-0" aria-hidden />
                    Ver certificados
                    <ExternalLink className="size-3 shrink-0" aria-hidden />
                  </a>
                );
              }
            })()}
          </section>

          {/* Casos recientes */}
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-navy-900">
                Casos recientes
              </h2>
            </div>
            {l.recentCases.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-500">
                Sin casos asignados aún.
              </p>
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
                      <th className="px-4 py-3 font-semibold">Estado</th>
                      <th className="px-4 py-3 font-semibold">Asignado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {l.recentCases.map((c) => (
                      <tr key={c.caseId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-navy-900">
                          <Link
                            href={`/admin/casos/${c.caseId}`}
                            className="hover:underline"
                          >
                            {c.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {c.specialtyName}
                        </td>
                        <td className="px-4 py-3">
                          {c.urgency ? (
                            <UrgencyBadge level={c.urgency} />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {formatDate(c.assignedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar derecho: métricas */}
        <aside className="flex flex-col gap-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-navy-900">
              Métricas
            </h2>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Casos tomados
                </dt>
                <dd className="mt-1 text-2xl font-bold text-navy-900">
                  {l.casesTakenCount}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Casos ganados
                </dt>
                <dd className="mt-1 text-2xl font-bold text-success-700">
                  {l.casesWonCount}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tasa de conversión
                </dt>
                <dd className="mt-1 text-2xl font-bold text-navy-900">
                  {conversionRate}%
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Rating promedio
                </dt>
                <dd className="mt-1 text-2xl font-bold text-navy-900">
                  {l.ratingAvg !== null
                    ? `${l.ratingAvg.toFixed(1)} / 5`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Disponible
                </dt>
                <dd className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium">
                  {l.isAvailable ? (
                    <>
                      <CheckCircle2
                        className="size-4 text-success-500"
                        aria-hidden
                      />
                      Sí
                    </>
                  ) : (
                    <>
                      <XCircle
                        className="size-4 text-gray-400"
                        aria-hidden
                      />
                      No
                    </>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {l.coverage.length > 0 ? (
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-navy-900">
                <MapPin className="size-4" aria-hidden /> Cobertura
              </h2>
              <ul className="space-y-1.5 text-sm text-gray-700">
                {l.coverage.map((c, i) => (
                  <li key={i}>
                    {c.region}
                    {c.comuna ? ` — ${c.comuna}` : " (toda la región)"}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>

      {/* Modal rechazo */}
      <Dialog
        open={showRejectModal}
        onOpenChange={(o) => {
          if (!o) {
            setShowRejectModal(false);
            setRejectReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar abogado</DialogTitle>
            <DialogDescription>
              Indica el motivo del rechazo para {l.firstName} {l.lastName}.
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
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500">
              {rejectReason.length}/500
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
              onClick={() => {
                if (rejectReason.trim().length < 5) {
                  toast.error("Indica un motivo (mínimo 5 caracteres)");
                  return;
                }
                mutation.mutate(
                  { action: "reject", rejectionReason: rejectReason.trim() },
                  {
                    onSuccess: () => {
                      setShowRejectModal(false);
                      setRejectReason("");
                    },
                  },
                );
              }}
              disabled={mutation.isPending}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-danger-500 px-5 text-sm font-semibold text-white hover:bg-danger-700 disabled:opacity-50"
            >
              Confirmar rechazo
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm aprobar/suspender/reactivar */}
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(o) => {
          if (!o) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "approve"
                ? "¿Aprobar a este abogado?"
                : confirmAction === "suspend"
                  ? "¿Suspender a este abogado?"
                  : "¿Reactivar a este abogado?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "approve"
                ? `${l.firstName} ${l.lastName} podrá tomar casos inmediatamente.`
                : confirmAction === "suspend"
                  ? `${l.firstName} ${l.lastName} no podrá tomar nuevos casos. Sus casos activos no se cerrarán.`
                  : `${l.firstName} ${l.lastName} volverá a poder tomar casos.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmAction) return;
                mutation.mutate(
                  { action: confirmAction },
                  { onSuccess: () => setConfirmAction(null) },
                );
              }}
              disabled={mutation.isPending}
              className={
                confirmAction === "approve"
                  ? "bg-success-500 hover:bg-success-700"
                  : confirmAction === "reactivate"
                    ? "bg-navy-600 hover:bg-navy-700"
                    : "bg-warning-500 hover:bg-warning-700"
              }
            >
              {confirmAction === "approve"
                ? "Aprobar"
                : confirmAction === "suspend"
                  ? "Suspender"
                  : "Reactivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
