"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FilePlus, FolderOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SpecialtyTag } from "@/components/shared/SpecialtyTag";
import type { CaseListItem } from "@/lib/cases/types";

async function fetchCases(): Promise<CaseListItem[]> {
  const res = await fetch("/api/cases", { credentials: "include" });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "Error cargando casos");
  }
  return json.data.cases;
}

export default function MisCasosPage() {
  const { data: cases, isLoading, error } = useQuery({
    queryKey: ["cases", "list"],
    queryFn: fetchCases,
  });

  return (
    <div className="mx-auto w-full max-w-[1200px] p-6 md:p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
            Mis casos
          </h1>
          <p className="mt-2 text-base text-gray-500">
            Todos los casos que has publicado, ordenados por fecha de creación.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/publicar-caso">
            <FilePlus className="size-4" aria-hidden />
            Publicar caso
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : error ? (
        <div className="rounded-xl border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">
          No pudimos cargar tus casos. Intenta recargar.
        </div>
      ) : !cases || cases.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white">
          <EmptyState
            icon={FolderOpen}
            title="Aún no tienes casos publicados"
            description="Publica tu primer caso y conéctate con abogados validados."
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
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {cases.map((c) => (
            <li key={c.id}>
              <Link
                href={`/mis-casos/${c.id}`}
                className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <SpecialtyTag specialty={c.specialty.name} />
                  <StatusBadge status={c.status} />
                </div>
                <h2 className="text-lg font-semibold text-navy-900">
                  {c.title}
                </h2>
                {c.summary ? (
                  <p className="mt-1 line-clamp-3 text-sm text-gray-500">
                    {c.summary}
                  </p>
                ) : null}
                <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4 text-xs">
                  <span className="text-gray-400">
                    {new Date(c.createdAt).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="font-medium text-navy-600">
                    Ver detalle →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
