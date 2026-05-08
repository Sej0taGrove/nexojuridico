"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Inbox } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { SpecialtyTag } from "@/components/shared/SpecialtyTag";
import { UrgencyBadge } from "@/components/shared/UrgencyBadge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CHILE_REGIONS } from "@/lib/constants/regions";
import { SPECIALTIES } from "@/lib/constants/specialties";
import { relativeTime, type FeedCaseCard } from "@/lib/cases/lawyer";

const ALL = "__all__";

type FeedResponse = { cases: FeedCaseCard[]; total: number };

async function fetchFeed(params: URLSearchParams): Promise<FeedResponse> {
  const res = await fetch(`/api/feed?${params.toString()}`, {
    credentials: "include",
  });
  const json = (await res.json()) as
    | { success: true; data: FeedResponse }
    | { success: false; error: string };
  if (!res.ok || !json.success) {
    throw new Error(("error" in json && json.error) || "Error cargando feed");
  }
  return json.data;
}

export default function FeedPage() {
  const [available, setAvailable] = useState(true);
  const [specialtyId, setSpecialtyId] = useState<string>(ALL);
  const [urgency, setUrgency] = useState<string>(ALL);
  const [region, setRegion] = useState<string>(ALL);
  const [sort, setSort] = useState<"recent" | "urgent">("recent");

  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    if (specialtyId !== ALL) p.set("specialtyId", specialtyId);
    if (urgency !== ALL) p.set("urgency", urgency);
    if (region !== ALL) p.set("region", region);
    p.set("sort", sort);
    return p;
  }, [specialtyId, urgency, region, sort]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["feed", queryParams.toString()],
    queryFn: () => fetchFeed(queryParams),
  });

  const cases = data?.cases ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="mx-auto w-full max-w-[1200px] p-6 md:p-8">
      <header className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
              Feed de casos
            </h1>
            <p className="mt-2 text-base text-gray-500">
              Casos disponibles para tu especialidad
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
            <span className="text-sm font-medium text-gray-700">
              Disponibilidad:{" "}
              <span
                className={
                  available ? "text-success-700" : "text-gray-400"
                }
              >
                {available ? "Activa" : "Pausada"}
              </span>
            </span>
            <Switch
              checked={available}
              onCheckedChange={setAvailable}
              aria-label="Disponibilidad"
            />
          </label>
        </div>
      </header>

      {/* Filtros */}
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:flex md:flex-wrap md:items-center">
          <Select value={specialtyId} onValueChange={setSpecialtyId}>
            <SelectTrigger className="w-full md:w-[220px]">
              <SelectValue placeholder="Todas las especialidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas las especialidades</SelectItem>
              {SPECIALTIES.map((s) => (
                <SelectItem key={s.code} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={urgency} onValueChange={setUrgency}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Todas las urgencias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas las urgencias</SelectItem>
              <SelectItem value="alta">Urgente</SelectItem>
              <SelectItem value="media">Prioridad media</SelectItem>
              <SelectItem value="baja">Sin prisa</SelectItem>
            </SelectContent>
          </Select>

          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-full md:w-[220px]">
              <SelectValue placeholder="Toda la región" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Toda la región</SelectItem>
              {CHILE_REGIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Select
          value={sort}
          onValueChange={(v) => setSort(v as "recent" | "urgent")}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Más recientes</SelectItem>
            <SelectItem value="urgent">Más urgentes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Counter */}
      <p className="mb-4 text-sm text-gray-500">
        {isLoading
          ? "Cargando casos…"
          : `${total} ${total === 1 ? "caso disponible" : "casos disponibles"}`}
      </p>

      {/* Lista */}
      {isLoading ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : error ? (
        <div className="rounded-xl border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">
          No pudimos cargar el feed. Intenta recargar la página.
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white">
          <EmptyState
            icon={Inbox}
            title="No hay casos disponibles para tus especialidades"
            description="Revisa más tarde o ajusta los filtros para ver más resultados."
          />
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {cases.map((c) => (
            <li key={c.id}>
              <Link
                href={`/feed/${c.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {c.urgency ? <UrgencyBadge level={c.urgency} /> : null}
                  <SpecialtyTag specialty={c.specialty.name} />
                  <span className="ml-auto text-xs text-gray-400">
                    {relativeTime(c.publishedAt ?? c.createdAt)}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-navy-900">
                  {c.title}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  <span className="font-medium text-gray-700">
                    {c.client.firstName}
                  </span>
                  {c.comuna ? (
                    <span className="text-gray-500"> · {c.comuna}</span>
                  ) : null}
                </p>
                {c.summaryPreview ? (
                  <p className="mt-3 line-clamp-2 text-sm text-gray-500">
                    {c.summaryPreview}
                  </p>
                ) : null}
                <div className="mt-4 flex items-center justify-end border-t border-gray-100 pt-3">
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-navy-600">
                    Ver detalle
                    <ArrowRight className="size-4" aria-hidden />
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
