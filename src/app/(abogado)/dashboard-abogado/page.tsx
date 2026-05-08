"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Briefcase, Clock, Inbox, Target } from "lucide-react";
import type { CaseStatus, UrgencyLevel } from "@prisma/client";

import { KpiCard } from "@/components/shared/KpiCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { SpecialtyTag } from "@/components/shared/SpecialtyTag";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UrgencyBadge } from "@/components/shared/UrgencyBadge";

type StatsResponse = {
  kpis: {
    totalTaken: number;
    conversionRate: number;
    avgResponseMinutes: number;
    activeCases: number;
    wonCount: number;
    closedCount: number;
  };
  charts: {
    bySpecialty: { code: string; name: string; count: number }[];
    last30Days: { date: string; count: number }[];
  };
  recent: {
    id: string;
    title: string;
    status: CaseStatus;
    urgency: UrgencyLevel | null;
    specialty: { id: number; code: string; name: string };
    assignedAt: string;
    client: { firstName: string; lastName: string };
  }[];
};

async function fetchStats(): Promise<StatsResponse> {
  const res = await fetch("/api/lawyer/stats", { credentials: "include" });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "Error cargando métricas");
  }
  return json.data;
}

function formatResponseTime(minutes: number): string {
  if (minutes <= 0) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
  });
}

export default function DashboardAbogadoPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["lawyer-stats"],
    queryFn: fetchStats,
  });

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1440px] p-6 md:p-8">
        <LoadingSkeleton variant="card" count={2} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-[1440px] p-6 md:p-8">
        <div className="rounded-xl border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">
          {error instanceof Error
            ? error.message
            : "No pudimos cargar tus métricas."}
        </div>
      </div>
    );
  }

  const k = data.kpis;
  const chartData = data.charts.last30Days.map((d) => ({
    label: shortDate(d.date),
    count: d.count,
  }));
  const specialtyData = data.charts.bySpecialty.map((s) => ({
    name: s.name.replace("Derecho ", ""),
    count: s.count,
  }));

  return (
    <div className="mx-auto w-full max-w-[1440px] p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
          Tu dashboard
        </h1>
        <p className="mt-2 text-base text-gray-500">
          Métricas de tu desempeño.
        </p>
      </header>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Briefcase}
          label="Casos tomados"
          value={String(k.totalTaken)}
          hint="Total histórico"
        />
        <KpiCard
          icon={Target}
          label="Tasa de conversión"
          value={`${k.conversionRate}%`}
          hint={
            k.closedCount > 0
              ? `${k.wonCount} ganados de ${k.closedCount} cerrados`
              : "Sin casos cerrados aún"
          }
        />
        <KpiCard
          icon={Clock}
          label="Tiempo promedio respuesta"
          value={formatResponseTime(k.avgResponseMinutes)}
          hint="Desde publicación a aceptación"
        />
        <KpiCard
          icon={Inbox}
          label="Casos activos"
          value={String(k.activeCases)}
          hint="Asignados o en negociación"
        />
      </div>

      {/* Charts */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-navy-900">
            Casos por especialidad
          </h2>
          {specialtyData.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">
              Aún no tienes casos para mostrar.
            </p>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={specialtyData}
                  margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E5E9EE"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#6B7585", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "#E5E9EE" }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#6B7585", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "#E5E9EE" }}
                  />
                  <Tooltip
                    cursor={{ fill: "#E6EEF5" }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #E5E9EE",
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#013565"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-navy-900">
            Casos tomados últimos 30 días
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E9EE" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#6B7585", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#E5E9EE" }}
                  interval="preserveStartEnd"
                  minTickGap={32}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#6B7585", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#E5E9EE" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #E5E9EE",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#013565"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Tabla casos recientes */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-navy-900">
            Mis casos recientes
          </h2>
        </div>
        {data.recent.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-gray-500">
            Sin casos recientes.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Caso</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Especialidad</th>
                  <th className="px-4 py-3 font-semibold">Urgencia</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.recent.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-navy-900">
                      {c.title}
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
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(c.assignedAt).toLocaleDateString("es-CL", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
