import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { CaseStatus, UrgencyLevel, UserRole } from "@prisma/client";

import { fail, ok } from "@/lib/api/response";
import type {
  AdminCaseListItem,
  OrphanCasesResponse,
  OrphanCaseListItem,
} from "@/lib/admin/types";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_URGENCY: readonly UrgencyLevel[] = [
  UrgencyLevel.alta,
  UrgencyLevel.media,
  UrgencyLevel.baja,
];

function parseUrgency(input: string | null): UrgencyLevel | null {
  if (!input) return null;
  return ALLOWED_URGENCY.find((u) => u === input) ?? null;
}

export async function GET(req: NextRequest) {
  let auth;
  try {
    auth = await getAuthUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) return fail(e.message, 401);
    throw e;
  }
  if (auth.role !== UserRole.admin) return fail("Acceso denegado", 403);

  const { searchParams } = req.nextUrl;
  const specialtyParam = searchParams.get("specialtyId");
  const specialtyId = specialtyParam ? Number(specialtyParam) : NaN;
  const urgency = parseUrgency(searchParams.get("urgency"));
  const sortParam = searchParams.get("sort"); // "urgency" | "days"

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const where: Prisma.CaseWhereInput = {
    tenantId: auth.tenantId,
    deletedAt: null,
    OR: [
      { status: CaseStatus.huerfano },
      { status: CaseStatus.en_cola, createdAt: { lt: sevenDaysAgo } }
    ]
  };
  if (Number.isFinite(specialtyId)) where.specialtyId = specialtyId;
  if (urgency) where.urgency = urgency;

  const cases = await prisma.case.findMany({
    where,
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      status: true,
      urgency: true,
      region: true,
      comuna: true,
      createdAt: true,
      publishedAt: true,
      assignedAt: true,
      specialty: { select: { id: true, code: true, name: true } },
      client: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  const now = Date.now();
  let items: OrphanCaseListItem[] = cases.map((c) => {
    const base: AdminCaseListItem = {
      id: c.id,
      title: c.title,
      status: c.status,
      urgency: c.urgency,
      region: c.region,
      comuna: c.comuna,
      createdAt: c.createdAt.toISOString(),
      publishedAt: c.publishedAt?.toISOString() ?? null,
      assignedAt: c.assignedAt?.toISOString() ?? null,
      client: c.client,
      specialty: c.specialty,
      assignedLawyer: null,
    };
    const daysInQueue = Math.floor(
      (now - c.createdAt.getTime()) / (24 * 60 * 60 * 1000),
    );
    return { ...base, daysInQueue };
  });

  // Ordenar
  if (sortParam === "urgency") {
    const order: Record<UrgencyLevel, number> = { alta: 0, media: 1, baja: 2 };
    items = items.sort((a, b) => {
      const ua = a.urgency ? order[a.urgency] : 3;
      const ub = b.urgency ? order[b.urgency] : 3;
      if (ua !== ub) return ua - ub;
      return b.daysInQueue - a.daysInQueue;
    });
  } else {
    // default: por días en cola desc
    items = items.sort((a, b) => b.daysInQueue - a.daysInQueue);
  }

  // Stats sidebar — sobre el conjunto SIN filtros (vista global del admin)
  const allOrphans = await prisma.case.findMany({
    where: {
      tenantId: auth.tenantId,
      deletedAt: null,
      OR: [
        { status: CaseStatus.huerfano },
        { status: CaseStatus.en_cola, createdAt: { lt: sevenDaysAgo } }
      ]
    },
    select: {
      createdAt: true,
      urgency: true,
      specialty: { select: { name: true } },
    },
  });

  const total = allOrphans.length;
  const urgentCount = allOrphans.filter((o) => o.urgency === "alta").length;
  const avgDaysInQueue =
    total > 0
      ? Math.round(
          allOrphans.reduce(
            (acc, o) =>
              acc + (now - o.createdAt.getTime()) / (24 * 60 * 60 * 1000),
            0,
          ) / total,
        )
      : 0;

  const specialtyMap = new Map<string, number>();
  for (const o of allOrphans) {
    const k = o.specialty.name;
    specialtyMap.set(k, (specialtyMap.get(k) ?? 0) + 1);
  }
  const bySpecialty = Array.from(specialtyMap, ([name, count]) => ({
    name,
    count,
  })).sort((a, b) => b.count - a.count);

  const response: OrphanCasesResponse = {
    cases: items,
    stats: { total, avgDaysInQueue, urgentCount, bySpecialty },
  };

  return ok(response);
}
