import { NextRequest } from "next/server";
import { CaseStatus, UserRole } from "@prisma/client";

import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";
import { cancelCaseSchema } from "@/server/validators/case.schema";

const CANCELLABLE_STATUSES: readonly CaseStatus[] = [
  CaseStatus.borrador,
  CaseStatus.en_cola,
];

async function loadCaseForUser(caseId: string, userId: string) {
  return prisma.case.findFirst({
    where: { id: caseId, deletedAt: null },
    select: {
      id: true,
      tenantId: true,
      clientId: true,
      title: true,
      summary: true,
      responses: true,
      status: true,
      urgency: true,
      urgencyScore: true,
      region: true,
      comuna: true,
      createdAt: true,
      updatedAt: true,
      publishedAt: true,
      assignedAt: true,
      closedAt: true,
      specialty: { select: { id: true, code: true, name: true } },
      assignments: {
        orderBy: { assignedAt: "desc" },
        select: {
          id: true,
          assignedAt: true,
          releasedAt: true,
          isActive: true,
          lawyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              email: true,
              phone: true,
              lawyerProfile: {
                select: {
                  bio: true,
                  yearsExperience: true,
                  ratingAvg: true,
                  casesTakenCount: true,
                },
              },
            },
          },
        },
      },
      statusHistory: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          fromStatus: true,
          toStatus: true,
          reason: true,
          createdAt: true,
          changedByUser: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
      },
    },
  }).then((c) => {
    if (!c) return { status: "not-found" as const, case: null };
    if (c.clientId !== userId) return { status: "forbidden" as const, case: null };
    return { status: "ok" as const, case: c };
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let auth;
  try {
    auth = await getAuthUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) return fail(e.message, 401);
    throw e;
  }
  if (auth.role !== UserRole.client) return fail("Acceso denegado", 403);

  const { id } = await params;
  const result = await loadCaseForUser(id, auth.userId);

  if (result.status === "not-found") return fail("Caso no encontrado", 404);
  if (result.status === "forbidden") return fail("Acceso denegado", 403);

  return ok({ case: result.case });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let auth;
  try {
    auth = await getAuthUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) return fail(e.message, 401);
    throw e;
  }
  if (auth.role !== UserRole.client) return fail("Acceso denegado", 403);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Body inválido", 400);
  }

  const parsed = cancelCaseSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return fail(first?.message ?? "Acción inválida", 400);
  }

  const { id } = await params;
  const existing = await prisma.case.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, clientId: true, status: true },
  });
  if (!existing) return fail("Caso no encontrado", 404);
  if (existing.clientId !== auth.userId) return fail("Acceso denegado", 403);
  if (!CANCELLABLE_STATUSES.includes(existing.status)) {
    return fail(
      "Este caso ya no se puede cancelar en su estado actual",
      409,
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const c = await tx.case.update({
      where: { id },
      data: { status: CaseStatus.cancelado, closedAt: new Date() },
    });
    await tx.caseStatusHistory.create({
      data: {
        caseId: id,
        fromStatus: existing.status,
        toStatus: CaseStatus.cancelado,
        changedBy: auth.userId,
        reason: parsed.data.reason ?? "Cancelado por el ciudadano",
      },
    });
    return c;
  });

  return ok({ case: updated });
}
