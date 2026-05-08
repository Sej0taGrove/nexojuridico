import { CaseStatus, UserRole, ValidationStatus } from "@prisma/client";

import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";

const CLOSED: readonly CaseStatus[] = [
  CaseStatus.cerrado_ganado,
  CaseStatus.cerrado_perdido,
];

const ACTIVE: readonly CaseStatus[] = [
  CaseStatus.asignado,
  CaseStatus.en_negociacion,
];

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildLast30Days(now: Date): string[] {
  const out: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(isoDay(d));
  }
  return out;
}

export async function GET() {
  let auth;
  try {
    auth = await getAuthUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) return fail(e.message, 401);
    throw e;
  }
  if (auth.role !== UserRole.lawyer) return fail("Acceso denegado", 403);

  const profile = await prisma.lawyerProfile.findUnique({
    where: { userId: auth.userId },
    select: {
      validationStatus: true,
      casesTakenCount: true,
      casesWonCount: true,
    },
  });
  if (!profile) return fail("Perfil de abogado no encontrado", 404);
  if (profile.validationStatus !== ValidationStatus.approved) {
    return fail("Tu cuenta aún no está aprobada", 403);
  }

  const now = new Date();
  const since30 = new Date(now);
  since30.setUTCDate(since30.getUTCDate() - 30);

  const assignments = await prisma.caseAssignment.findMany({
    where: { lawyerId: auth.userId },
    orderBy: { assignedAt: "desc" },
    select: {
      id: true,
      assignedAt: true,
      isActive: true,
      case: {
        select: {
          id: true,
          title: true,
          status: true,
          urgency: true,
          createdAt: true,
          publishedAt: true,
          specialty: { select: { id: true, code: true, name: true } },
          client: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
    },
  });

  const totalTaken = assignments.length;

  // Tasa de conversión: ganados / total cerrados * 100
  let closedCount = 0;
  let wonCount = 0;
  for (const a of assignments) {
    if (CLOSED.includes(a.case.status)) {
      closedCount += 1;
      if (a.case.status === CaseStatus.cerrado_ganado) wonCount += 1;
    }
  }
  const conversionRate = closedCount > 0 ? (wonCount / closedCount) * 100 : 0;

  // Tiempo promedio respuesta: ms entre case.publishedAt (fallback createdAt) y
  // assignment.assignedAt.
  let totalResponseMs = 0;
  let respCount = 0;
  for (const a of assignments) {
    const start = a.case.publishedAt ?? a.case.createdAt;
    const ms = a.assignedAt.getTime() - start.getTime();
    if (ms >= 0) {
      totalResponseMs += ms;
      respCount += 1;
    }
  }
  const avgResponseMinutes =
    respCount > 0 ? Math.round(totalResponseMs / respCount / 60_000) : 0;

  // Casos activos: assignment activo + status en ACTIVE
  const activeCases = assignments.filter(
    (a) => a.isActive && ACTIVE.includes(a.case.status),
  ).length;

  // Casos por especialidad
  const bySpecialtyMap = new Map<string, { name: string; count: number }>();
  for (const a of assignments) {
    const key = a.case.specialty.code;
    const cur = bySpecialtyMap.get(key);
    if (cur) cur.count += 1;
    else
      bySpecialtyMap.set(key, {
        name: a.case.specialty.name,
        count: 1,
      });
  }
  const bySpecialty = Array.from(bySpecialtyMap, ([code, v]) => ({
    code,
    name: v.name,
    count: v.count,
  })).sort((a, b) => b.count - a.count);

  // Casos tomados últimos 30 días, agrupados por día
  const days = buildLast30Days(now);
  const countByDay = new Map<string, number>();
  for (const d of days) countByDay.set(d, 0);
  for (const a of assignments) {
    if (a.assignedAt < since30) continue;
    const key = isoDay(a.assignedAt);
    if (countByDay.has(key)) {
      countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
    }
  }
  const last30Days = days.map((d) => ({
    date: d,
    count: countByDay.get(d) ?? 0,
  }));

  // Casos recientes (5 últimos por assignedAt desc)
  const recent = assignments.slice(0, 5).map((a) => ({
    id: a.case.id,
    title: a.case.title,
    status: a.case.status,
    urgency: a.case.urgency,
    specialty: a.case.specialty,
    assignedAt: a.assignedAt.toISOString(),
    client: {
      firstName: a.case.client.firstName,
      lastName: a.case.client.lastName,
    },
  }));

  return ok({
    kpis: {
      totalTaken,
      conversionRate: Math.round(conversionRate * 10) / 10,
      avgResponseMinutes,
      activeCases,
      wonCount,
      closedCount,
    },
    charts: {
      bySpecialty,
      last30Days,
    },
    recent,
  });
}
