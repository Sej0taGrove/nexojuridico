import { CaseStatus, UserRole, ValidationStatus } from "@prisma/client";

import { fail, ok } from "@/lib/api/response";
import type { ActivityEvent } from "@/lib/admin/types";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

const PUBLISHED_STATUSES: readonly CaseStatus[] = [
  CaseStatus.en_cola,
  CaseStatus.asignado,
  CaseStatus.en_negociacion,
  CaseStatus.cerrado_ganado,
  CaseStatus.cerrado_perdido,
  CaseStatus.cancelado,
  CaseStatus.huerfano,
];

const TAKEN_STATUSES: readonly CaseStatus[] = [
  CaseStatus.asignado,
  CaseStatus.en_negociacion,
  CaseStatus.cerrado_ganado,
  CaseStatus.cerrado_perdido,
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
  if (auth.role !== UserRole.admin) return fail("Acceso denegado", 403);

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setUTCHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const tenantWhere = { tenantId: auth.tenantId, deletedAt: null };

  // Ejecutamos secuencialmente para no saturar el límite de conexiones de Neon Serverless (EMAXCONNSESSION)
  const casesToday = await prisma.case.count({
    where: {
      ...tenantWhere,
      createdAt: { gte: startOfToday },
      status: { not: CaseStatus.borrador },
    },
  });

  const casesWeek = await prisma.case.count({
    where: {
      ...tenantWhere,
      createdAt: { gte: sevenDaysAgo },
      status: { not: CaseStatus.borrador },
    },
  });

  const activeLawyers = await prisma.lawyerProfile.count({
    where: {
      validationStatus: ValidationStatus.approved,
      user: { tenantId: auth.tenantId, deletedAt: null, isActive: true },
    },
  });

  const publishedTotal = await prisma.case.count({
    where: { ...tenantWhere, status: { in: [...PUBLISHED_STATUSES] } },
  });

  const takenTotal = await prisma.case.count({
    where: { ...tenantWhere, status: { in: [...TAKEN_STATUSES] } },
  });

  const orphanCount = await prisma.case.count({
    where: {
      ...tenantWhere,
      OR: [
        { status: CaseStatus.huerfano },
        { status: CaseStatus.en_cola, createdAt: { lt: sevenDaysAgo } }
      ]
    },
  });

  const assignmentsForMatch = await prisma.caseAssignment.findMany({
    where: { case: tenantWhere },
    select: {
      assignedAt: true,
      case: { select: { createdAt: true, publishedAt: true } },
    },
  });

  const casesBySpecialty = await prisma.case.groupBy({
    by: ["specialtyId"],
    where: { ...tenantWhere, status: { not: CaseStatus.borrador } },
    _count: { _all: true },
  });

  const publishedRecent = await prisma.case.findMany({
    where: {
      ...tenantWhere,
      publishedAt: { gte: thirtyDaysAgo },
    },
    select: { publishedAt: true },
  });

  const takenRecent = await prisma.caseAssignment.findMany({
    where: {
      case: tenantWhere,
      assignedAt: { gte: thirtyDaysAgo },
    },
    select: { assignedAt: true },
  });

  const takeRate =
    publishedTotal > 0 ? (takenTotal / publishedTotal) * 100 : 0;

  let totalMatchMs = 0;
  let matchCount = 0;
  for (const a of assignmentsForMatch) {
    const start = a.case.publishedAt ?? a.case.createdAt;
    const ms = a.assignedAt.getTime() - start.getTime();
    if (ms >= 0) {
      totalMatchMs += ms;
      matchCount += 1;
    }
  }
  const avgMatchMinutes =
    matchCount > 0 ? Math.round(totalMatchMs / matchCount / 60_000) : 0;

  // Charts: especialidades
  const specialtyIds = casesBySpecialty.map((g) => g.specialtyId);
  const specialties =
    specialtyIds.length > 0
      ? await prisma.specialty.findMany({
          where: { id: { in: specialtyIds } },
          select: { id: true, code: true, name: true },
        })
      : [];
  const specialtyMap = new Map(specialties.map((s) => [s.id, s]));
  const bySpecialty = casesBySpecialty
    .map((g) => {
      const sp = specialtyMap.get(g.specialtyId);
      return {
        id: g.specialtyId,
        code: sp?.code ?? `id-${g.specialtyId}`,
        name: sp?.name ?? "Sin especialidad",
        count: g._count._all,
      };
    })
    .sort((a, b) => b.count - a.count);

  // Charts: tendencia 30 días
  const days = buildLast30Days(now);
  const publishedByDay = new Map<string, number>(days.map((d) => [d, 0]));
  const takenByDay = new Map<string, number>(days.map((d) => [d, 0]));
  for (const c of publishedRecent) {
    if (!c.publishedAt) continue;
    const key = isoDay(c.publishedAt);
    if (publishedByDay.has(key)) {
      publishedByDay.set(key, (publishedByDay.get(key) ?? 0) + 1);
    }
  }
  for (const a of takenRecent) {
    const key = isoDay(a.assignedAt);
    if (takenByDay.has(key)) {
      takenByDay.set(key, (takenByDay.get(key) ?? 0) + 1);
    }
  }
  const trend30Days = days.map((d) => ({
    date: d,
    published: publishedByDay.get(d) ?? 0,
    taken: takenByDay.get(d) ?? 0,
  }));

  // Actividad reciente: mezclar audit_logs (acciones admin) + status_history
  const [auditEvents, statusEvents] = await Promise.all([
    prisma.auditLog.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true,
        createdAt: true,
      },
    }),
    prisma.caseStatusHistory.findMany({
      where: { case: tenantWhere },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        toStatus: true,
        fromStatus: true,
        createdAt: true,
        case: { select: { id: true, title: true } },
      },
    }),
  ]);

  const activity: ActivityEvent[] = [];

  for (const e of auditEvents) {
    const meta = (e.metadata ?? {}) as Record<string, unknown>;
    const name = typeof meta.name === "string" ? meta.name : null;
    const title = typeof meta.title === "string" ? meta.title : null;
    if (e.action === "approve_lawyer") {
      activity.push({
        id: `audit-${e.id}`,
        type: "lawyer_approved",
        message: name
          ? `Abogado ${name} aprobado`
          : "Abogado aprobado",
        timestamp: e.createdAt.toISOString(),
      });
    } else if (e.action === "reject_lawyer") {
      activity.push({
        id: `audit-${e.id}`,
        type: "lawyer_rejected",
        message: name
          ? `Abogado ${name} rechazado`
          : "Abogado rechazado",
        timestamp: e.createdAt.toISOString(),
      });
    } else if (e.action === "suspend_lawyer") {
      activity.push({
        id: `audit-${e.id}`,
        type: "lawyer_suspended",
        message: name
          ? `Abogado ${name} suspendido`
          : "Abogado suspendido",
        timestamp: e.createdAt.toISOString(),
      });
    } else if (e.action === "reactivate_lawyer") {
      activity.push({
        id: `audit-${e.id}`,
        type: "lawyer_reactivated",
        message: name
          ? `Abogado ${name} reactivado`
          : "Abogado reactivado",
        timestamp: e.createdAt.toISOString(),
      });
    } else if (e.action === "close_orphan_case") {
      activity.push({
        id: `audit-${e.id}`,
        type: "case_closed",
        message: title
          ? `Caso cerrado: ${title}`
          : "Caso huérfano cerrado",
        timestamp: e.createdAt.toISOString(),
      });
    }
  }

  for (const s of statusEvents) {
    if (s.toStatus === CaseStatus.en_cola && s.fromStatus === CaseStatus.borrador) {
      activity.push({
        id: `status-${s.id}`,
        type: "case_published",
        message: `Caso publicado: ${s.case.title}`,
        timestamp: s.createdAt.toISOString(),
      });
    } else if (s.toStatus === CaseStatus.asignado) {
      activity.push({
        id: `status-${s.id}`,
        type: "case_accepted",
        message: `Caso aceptado: ${s.case.title}`,
        timestamp: s.createdAt.toISOString(),
      });
    }
  }

  activity.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const recentActivity = activity.slice(0, 10);

  return ok({
    kpis: {
      casesToday,
      casesWeek,
      activeLawyers,
      takeRate: Math.round(takeRate * 10) / 10,
      orphanCount,
      avgMatchMinutes,
    },
    charts: {
      bySpecialty,
      trend30Days,
    },
    recentActivity,
  });
}
