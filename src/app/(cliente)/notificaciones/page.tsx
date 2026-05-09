"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Gavel, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { cn } from "@/lib/utils";

type NotificationDTO = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  metadata: unknown;
  readAt: string | null;
  createdAt: string;
};

async function fetchNotifications(): Promise<NotificationDTO[]> {
  const res = await fetch("/api/notifications", { credentials: "include" });
  const json = (await res.json()) as
    | { success: true; data: { notifications: NotificationDTO[] } }
    | { success: false; error: string };
  if (!res.ok || !json.success) {
    throw new Error(("error" in json && json.error) || "Error cargando");
  }
  return json.data.notifications;
}

async function patchRead(id: string): Promise<void> {
  const res = await fetch(`/api/notifications/${id}/read`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!res.ok) throw new Error("No se pudo marcar como leída");
}

function iconFor(type: string) {
  if (type === "case_accepted") return Gavel;
  if (type === "lawyer_approved") return ShieldCheck;
  return Bell;
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "hace instantes";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function NotificacionesPage() {
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: fetchNotifications,
  });

  const readMutation = useMutation({
    mutationFn: patchRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => {
      toast.error("No se pudo marcar como leída");
    },
  });

  return (
    <div className="mx-auto w-full max-w-[820px] p-4 sm:p-6 md:p-8">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-navy-900 md:text-3xl">
          Notificaciones
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Avisos sobre tus casos y tu cuenta
        </p>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton variant="row" count={4} />
          </div>
        ) : error ? (
          <div className="m-6 rounded-md border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">
            No pudimos cargar tus notificaciones. Intenta recargar.
          </div>
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No tienes notificaciones"
            description="Te avisaremos por aquí cuando un abogado acepte tu caso o haya novedades."
          />
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.map((n) => {
              const Icon = iconFor(n.type);
              const unread = n.readAt === null;
              const Wrapper: React.ElementType = n.link ? Link : "div";
              const wrapperProps = n.link
                ? { href: n.link }
                : ({} as Record<string, never>);
              return (
                <li key={n.id}>
                  <Wrapper
                    {...wrapperProps}
                    onClick={() => {
                      if (unread) readMutation.mutate(n.id);
                    }}
                    className={cn(
                      "flex w-full items-start gap-4 px-4 py-4 transition-colors sm:px-6",
                      n.link
                        ? "cursor-pointer hover:bg-gray-50"
                        : "",
                      unread ? "bg-navy-50/40" : "",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full",
                        unread
                          ? "bg-navy-100 text-navy-700"
                          : "bg-gray-100 text-gray-500",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm",
                            unread
                              ? "font-semibold text-navy-900"
                              : "font-medium text-gray-700",
                          )}
                        >
                          {n.title}
                        </p>
                        <span className="text-xs text-gray-400">
                          {formatRelative(n.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{n.message}</p>
                    </div>
                    {unread ? (
                      <span
                        aria-label="No leída"
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-navy-600"
                      />
                    ) : (
                      <CheckCheck
                        aria-label="Leída"
                        className="mt-1 size-4 shrink-0 text-gray-300"
                      />
                    )}
                  </Wrapper>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
