"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Clock,
  FilePlus,
  FolderOpen,
  Gavel,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UrgencyBadge } from "@/components/shared/UrgencyBadge";
import { SpecialtyTag } from "@/components/shared/SpecialtyTag";
import { useAuth } from "@/hooks/useAuth";
import type { CaseListItem } from "@/lib/cases/types";

async function fetchCases(): Promise<CaseListItem[]> {
  const res = await fetch("/api/cases", { credentials: "include" });
  const json = (await res.json()) as
    | { success: true; data: { cases: CaseListItem[] } }
    | { success: false; error: string };
  if (!res.ok || !json.success) {
    throw new Error(("error" in json && json.error) || "Error cargando casos");
  }
  return json.data.cases;
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

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: cases, isLoading, error } = useQuery({
    queryKey: ["cases", "list"],
    queryFn: fetchCases,
  });

  const firstName = user?.firstName ?? "";
  const activeCases = cases?.filter(
    (c) =>
      c.status !== "cerrado_ganado" &&
      c.status !== "cerrado_perdido" &&
      c.status !== "cancelado",
  );

  return (
    <div className="mx-auto w-full max-w-[1440px] p-6 md:p-8">
      {/* Saludo */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
          Hola{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-2 text-base text-gray-500">
          Aquí está el estado de tus casos
        </p>
      </header>

      {/* CTA + grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* CTA destacada */}
          <section
            className="relative overflow-hidden rounded-xl bg-navy-600 p-6 shadow-sm md:p-8"
            aria-label="Publicar un nuevo caso"
          >
            <Gavel
              aria-hidden
              className="pointer-events-none absolute -bottom-4 -right-4 size-32 text-navy-500/20"
            />
            <div className="relative flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-md text-white">
                <h2 className="text-xl font-bold md:text-2xl">
                  ¿Tienes un nuevo problema legal?
                </h2>
                <p className="mt-2 text-sm text-navy-100 md:text-base">
                  Cuéntanos tu situación y te conectaremos con un abogado
                  especialista validado.
                </p>
              </div>
              <Button
                asChild
                size="lg"
                className="shrink-0 bg-white text-navy-700 hover:bg-gray-50"
              >
                <Link href="/publicar-caso">
                  Publicar caso
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </section>

          {/* Mis casos activos */}
          <section className="flex flex-col gap-4">
            <div className="flex items-end justify-between">
              <h2 className="text-xl font-semibold text-navy-900">
                Mis casos activos
              </h2>
              {cases && cases.length > 0 ? (
                <Link
                  href="/mis-casos"
                  className="text-sm font-medium text-navy-600 transition-colors hover:text-navy-800"
                >
                  Ver todos
                </Link>
              ) : null}
            </div>

            {isLoading ? (
              <LoadingSkeleton variant="card" count={2} />
            ) : error ? (
              <div className="rounded-xl border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">
                No pudimos cargar tus casos. Intenta recargar la página.
              </div>
            ) : activeCases && activeCases.length > 0 ? (
              <ul className="flex flex-col gap-4">
                {activeCases.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/mis-casos/${c.id}`}
                      className="block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {c.urgency ? <UrgencyBadge level={c.urgency} /> : null}
                          <SpecialtyTag specialty={c.specialty.name} />
                        </div>
                        <StatusBadge status={c.status} />
                      </div>
                      <h3 className="text-lg font-semibold text-navy-900">
                        {c.title}
                      </h3>
                      {c.summary ? (
                        <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                          {c.summary}
                        </p>
                      ) : null}
                      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                        <span className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Clock className="size-3.5" aria-hidden />
                          Actualizado {formatRelative(c.updatedAt)}
                        </span>
                        {c.assignments[0] ? (
                          <span className="text-xs text-gray-600">
                            Abogado: {c.assignments[0].lawyer.firstName}{" "}
                            {c.assignments[0].lawyer.lastName}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-navy-600">
                            Ver detalles →
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white">
                <EmptyState
                  icon={FolderOpen}
                  title="Aún no tienes casos publicados"
                  description="Publica tu primer caso y conéctate con abogados especialistas validados."
                  action={
                    <Button asChild size="lg">
                      <Link href="/publicar-caso">
                        <FilePlus className="size-4" aria-hidden />
                        Publicar tu primer caso
                      </Link>
                    </Button>
                  }
                />
              </div>
            )}
          </section>
        </div>

        {/* Actividad reciente */}
        <aside className="lg:col-span-4">
          <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold text-navy-900">
              Actividad reciente
            </h2>
            {isLoading ? (
              <LoadingSkeleton variant="row" count={3} />
            ) : !cases || cases.length === 0 ? (
              <p className="text-sm text-gray-500">
                Cuando publiques un caso verás aquí su actividad.
              </p>
            ) : (
              <ol className="relative flex flex-col gap-6 border-l-2 border-gray-100 pl-4">
                {cases.slice(0, 5).map((c, i) => (
                  <li key={c.id} className="relative">
                    <span
                      aria-hidden
                      className={`absolute -left-[21px] top-1 size-3 rounded-full border-2 bg-white ${
                        i === 0 ? "border-navy-600" : "border-gray-300"
                      }`}
                    />
                    <p className="text-xs text-gray-400">
                      {formatRelative(c.createdAt)}
                    </p>
                    <p className="mt-1 text-sm font-medium text-navy-900">
                      Caso publicado
                    </p>
                    <p className="mt-1 text-sm text-gray-500">{c.title}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
