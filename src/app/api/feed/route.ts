import { NextRequest } from "next/server";
import {
  CaseStatus,
  Prisma,
  UrgencyLevel,
  UserRole,
  ValidationStatus,
} from "@prisma/client";

import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";
import {
  truncate,
  type FeedCaseCard,
} from "@/lib/cases/lawyer";

const URGENCY_VALUES = new Set<UrgencyLevel>([
  UrgencyLevel.alta,
  UrgencyLevel.media,
  UrgencyLevel.baja,
]);

type SortKey = "recent" | "urgent";

function parseSort(input: string | null): SortKey {
  if (input === "urgent") return "urgent";
  return "recent";
}

function parseInt32(input: string | null, def: number, min: number, max: number) {
  const n = input ? Number.parseInt(input, 10) : def;
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

export async function GET(req: NextRequest) {
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
      specialties: { select: { specialtyId: true } },
    },
  });

  if (!profile) return fail("Perfil de abogado no encontrado", 404);
  if (profile.validationStatus !== ValidationStatus.approved) {
    return fail("Tu cuenta aún no está aprobada", 403);
  }

  const lawyerSpecialtyIds = profile.specialties.map((s) => s.specialtyId);
  if (lawyerSpecialtyIds.length === 0) {
    return ok({ cases: [], total: 0 });
  }

  const url = req.nextUrl;
  const specialtyParam = url.searchParams.get("specialtyId");
  const urgencyParam = url.searchParams.get("urgency");
  const regionParam = url.searchParams.get("region");
  const sort = parseSort(url.searchParams.get("sort"));
  const limit = parseInt32(url.searchParams.get("limit"), 20, 1, 100);
  const offset = parseInt32(url.searchParams.get("offset"), 0, 0, 10_000);

  // Filtro por especialidad: debe ser una de las del abogado
  let specialtyFilter: number[] = lawyerSpecialtyIds;
  if (specialtyParam) {
    const reqSpec = Number.parseInt(specialtyParam, 10);
    if (!Number.isInteger(reqSpec) || !lawyerSpecialtyIds.includes(reqSpec)) {
      return fail("Especialidad inválida o no autorizada", 400);
    }
    specialtyFilter = [reqSpec];
  }

  const where: Prisma.CaseWhereInput = {
    tenantId: auth.tenantId,
    status: CaseStatus.en_cola,
    deletedAt: null,
    specialtyId: { in: specialtyFilter },
  };
  if (urgencyParam) {
    if (!URGENCY_VALUES.has(urgencyParam as UrgencyLevel)) {
      return fail("Urgencia inválida", 400);
    }
    where.urgency = urgencyParam as UrgencyLevel;
  }
  if (regionParam) {
    where.region = regionParam;
  }

  const orderBy: Prisma.CaseOrderByWithRelationInput[] =
    sort === "urgent"
      ? [{ urgencyScore: "desc" }, { createdAt: "desc" }]
      : [{ createdAt: "desc" }];

  const [rows, total] = await Promise.all([
    prisma.case.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      select: {
        id: true,
        title: true,
        summary: true,
        status: true,
        urgency: true,
        region: true,
        comuna: true,
        createdAt: true,
        publishedAt: true,
        specialty: { select: { id: true, code: true, name: true } },
        client: { select: { firstName: true } },
      },
    }),
    prisma.case.count({ where }),
  ]);

  const cases: FeedCaseCard[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    summaryPreview: truncate(r.summary, 200),
    status: r.status,
    urgency: r.urgency,
    region: r.region,
    comuna: r.comuna,
    createdAt: r.createdAt.toISOString(),
    publishedAt: r.publishedAt?.toISOString() ?? null,
    specialty: r.specialty,
    client: { firstName: r.client.firstName, comuna: r.comuna },
  }));

  return ok({ cases, total });
}
