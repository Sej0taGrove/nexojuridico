"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Calendar,
  Clock,
  FilePlus,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  XCircle,
  PauseCircle,
  PlayCircle,
  Send,
  Inbox,
  Ban,
  type LucideIcon,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { KpiCard } from "@/components/shared/KpiCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import type {
  ActivityEvent,
  ActivityEventType,
  AdminStatsResponse,
} from "@/lib/admin/types";

const PIE_COLORS = [
  "#013565",
  "#034F8C",
  "#336FA1",
  "#6699BD",
  "#99C0D9",
  "#CCE0EC",
  "#012A52",
  "#011F3D",
  "#001428",
];

const ACTIVITY_STYLES: Record<
  ActivityEventType,
  { icon: LucideIcon; iconClass: string }
> = {
  lawyer_approved: {
    icon: CheckCircle2,
    iconClass: "bg-success-50 text-success-700",
  },
  lawyer_rejected: {
    icon: XCircle,
    iconClass: "bg-danger-50 text-danger-700",
  },
  lawyer_suspended: {
    icon: PauseCircle,
    iconClass: "bg-warning-50 text-warning-700",
  },
  lawyer_reactivated: {
    icon: PlayCircle,
    iconClass: "bg-navy-50 text-navy-700",
  },
  case_published: { icon: Send, iconClass: "bg-navy-50 text-navy-700" },
  case_accepted: {
    icon: Inbox,
    iconClass: "bg-success-50 text-success-700",
  },
  case_closed: { icon: Ban, iconClass: "bg-gray-100 text-gray-700" },
  case_orphan: {
    icon: AlertCircle,
    iconClass: "bg-danger-50 text-danger-700",
  },
};

async function fetchStats(): Promise<AdminStatsResponse> {
  const res = await fetch("/api/admin/stats", { credentials: "include" });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "Error cargando métricas");
  }
  return json.data as AdminStatsResponse;
}

function formatTime(minutes: number): string {
  if (minutes <= 0) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h < 24) return `${h}h ${m}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
  });
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d}d`;
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
  });
}

function ActivityRow({ event }: { event: ActivityEvent }) {
  const style = ACTIVITY_STYLES[event.type];
  const Icon = style.icon;
  return (
    <li className="flex items-start gap-3 py-3">
      <span
        aria-hidden
        className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${style.iconClass}`}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-700">{event.message}</p>
        <p className="text-xs text-gray-500">{relativeTime(event.timestamp)}</p>
      </div>
    </li>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchStats,
  });

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1440px] p-6 md:p-8">
        <LoadingSkeleton variant="card" count={3} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-[1440px] p-6 md:p-8">
        <div className="rounded-xl border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">
          {error instanceof Error
            ? error.message
            : "No pudimos cargar las métricas."}
        </div>
      </div>
    );
  }

  const k = data.kpis;
  const trendData = data.charts.trend30Days.map((d) => ({
    label: shortDate(d.date),
    publicados: d.published,
    tomados: d.taken,
  }));
  const pieData = data.charts.bySpecialty.map((s) => ({
    name: s.name.replace("Derecho ", ""),
    value: s.count,
  }));

  return (
    <div className="mx-auto w-full max-w-[1440px] p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
          Dashboard
        </h1>
        <p className="mt-2 text-base text-gray-500">
          Resumen del marketplace — Estudio Vignes
        </p>
      </header>

      {/* KPIs row 1 */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          icon={FilePlus}
          label="Casos hoy"
          value={k.casesToday}
          hint="Publicados desde 00:00"
        />
        <KpiCard
          icon={Calendar}
          label="Casos esta semana"
          value={k.casesWeek}
          hint="Últimos 7 días"
        />
        <KpiCard
          icon={UserCheck}
          label="Abogados activos"
          value={k.activeLawyers}
          hint="Aprobados y activos"
        />
      </div>

      {/* KPIs row 2 */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          icon={TrendingUp}
          label="Tasa de toma"
          value={`${k.takeRate}%`}
          hint="Casos tomados sobre publicados"
        />
        <KpiCard
          icon={AlertCircle}
          label="Casos huérfanos"
          value={k.orphanCount}
          tone={k.orphanCount > 0 ? "danger" : "default"}
          hint="En cola más de 7 días"
        />
        <KpiCard
          icon={Clock}
          label="Tiempo promedio match"
          value={formatTime(k.avgMatchMinutes)}
          hint="Desde publicación a aceptación"
        />
      </div>

      {/* Charts */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-navy-900">
            Casos por especialidad
          </h2>
          {pieData.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">
              Aún no hay casos publicados.
            </p>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {pieData.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={PIE_COLORS[idx % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #E5E9EE",
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy-900">
              Tendencia últimos 30 días
            </h2>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="size-2 rounded-full bg-navy-600"
                />
                Publicados
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="size-2 rounded-full bg-success-500"
                />
                Tomados
              </span>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
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
                  dataKey="publicados"
                  stroke="#013565"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="tomados"
                  stroke="#12B76A"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Recent activity */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-navy-900">
            Actividad reciente
          </h2>
        </div>
        {data.recentActivity.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-gray-500">
            Sin actividad reciente.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 px-6">
            {data.recentActivity.map((e) => (
              <ActivityRow key={e.id} event={e} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
