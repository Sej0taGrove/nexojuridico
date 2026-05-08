import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { CaseStatus, UrgencyLevel, UserRole } from "@prisma/client";

import { fail, ok } from "@/lib/api/response";
import type { AdminCaseListItem } from "@/lib/admin/types";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUSES = Object.values(CaseStatus) as readonly CaseStatus[];
const ALLOWED_URGENCIES: readonly UrgencyLevel[] = [
  UrgencyLevel.alta,
  UrgencyLevel.media,
  UrgencyLevel.baja,
];

function parseStatus(input: string | null): CaseStatus | null {
  if (!input) return null;
  return ALLOWED_STATUSES.find((s) => s === input) ?? null;
}
function parseUrgency(input: string | null): UrgencyLevel | null {
  if (!input) return null;
  return ALLOWED_URGENCIES.find((u) => u === input) ?? null;
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
  const status = parseStatus(searchParams.get("status"));
  const urgency = parseUrgency(searchParams.get("urgency"));
  const specialtyParam = searchParams.get("specialtyId");
  const specialtyId = specialtyParam ? Number(specialtyParam) : NaN;
  const search = searchParams.get("search")?.trim() ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number(searchParams.get("limit") ?? "25") || 25),
  );

  const where: Prisma.CaseWhereInput = {
    tenantId: auth.tenantId,
    deletedAt: null,
  };
  if (status) where.status = status;
  if (urgency) where.urgency = urgency;
  if (Number.isFinite(specialtyId)) where.specialtyId = specialtyId;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      {
        client: {
          is: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
  }

  const [total, cases] = await Promise.all([
    prisma.case.count({ where }),
    prisma.case.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
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
        assignments: {
          where: { isActive: true },
          orderBy: { assignedAt: "desc" },
          take: 1,
          select: {
            lawyer: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    }),
  ]);

  const items: AdminCaseListItem[] = cases.map((c) => ({
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
    assignedLawyer: c.assignments[0]?.lawyer ?? null,
  }));

  return ok({
    cases: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
