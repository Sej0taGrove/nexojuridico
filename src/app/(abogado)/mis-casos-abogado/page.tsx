"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Briefcase } from "lucide-react";
import type { CaseStatus, UrgencyLevel } from "@prisma/client";

import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { SpecialtyTag } from "@/components/shared/SpecialtyTag";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UrgencyBadge } from "@/components/shared/UrgencyBadge";
import { relativeTime } from "@/lib/cases/lawyer";

type LawyerCaseListItem = {
  id: string;
  assignmentId: number;
  assignedAt: string;
  isActive: boolean;
  isClosed: boolean;
  isCurrentlyActive: boolean;
  title: string;
  summary: string | null;
  status: CaseStatus;
  urgency: UrgencyLevel | null;
  region: string | null;
  comuna: string | null;
  createdAt: string;
  publishedAt: string | null;
  specialty: { id: number; code: string; name: string };
  client: { id: string; firstName: string; lastName: string };
};

async function fetchMyCases(): Promise<LawyerCaseListItem[]> {
  const res = await fetch("/api/lawyer/cases", { credentials: "include" });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "Error cargando casos");
  }
  return json.data.cases;
}

export default function MisCasosAbogadoPage() {
  const { data: cases, isLoading, error } = useQuery({
    queryKey: ["lawyer-cases"],
    queryFn: fetchMyCases,
  });

  return (
    <div className="mx-auto w-full max-w-[1200px] p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
          Mis casos
        </h1>
        <p className="mt-2 text-base text-gray-500">
          Casos que has aceptado, ordenados por fecha de asignación.
        </p>
      </header>

      {isLoading ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : error ? (
        <div className="rounded-xl border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">
          No pudimos cargar tus casos. Intenta recargar.
        </div>
      ) : !cases || cases.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white">
          <EmptyState
            icon={Briefcase}
            title="Aún no has aceptado casos"
            description="Cuando aceptes un caso desde el feed aparecerá aquí con todos los datos del cliente."
          />
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {cases.map((c) => (
            <li key={c.assignmentId}>
              <Link
                href={`/mis-casos-abogado/${c.id}`}
                className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {c.urgency ? <UrgencyBadge level={c.urgency} /> : null}
                  <SpecialtyTag specialty={c.specialty.name} />
                  <span className="ml-auto">
                    <StatusBadge status={c.status} />
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-navy-900">
                  {c.title}
                </h2>
                <p className="mt-1 text-sm text-gray-700">
                  Cliente:{" "}
                  <span className="font-medium">
                    {c.client.firstName} {c.client.lastName}
                  </span>
                </p>
                {c.summary ? (
                  <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                    {c.summary}
                  </p>
                ) : null}
                <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4 text-xs">
                  <span className="text-gray-400">
                    Aceptado {relativeTime(c.assignedAt)}
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
