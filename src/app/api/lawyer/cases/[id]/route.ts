import { NextRequest } from "next/server";
import { UserRole, ValidationStatus } from "@prisma/client";

import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";
import {
  explainUrgency,
  readOccurredAt,
  truncate,
  type AcceptedCaseDetail,
} from "@/lib/cases/lawyer";

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
  if (auth.role !== UserRole.lawyer) return fail("Acceso denegado", 403);

  const profile = await prisma.lawyerProfile.findUnique({
    where: { userId: auth.userId },
    select: { validationStatus: true },
  });
  if (!profile) return fail("Perfil de abogado no encontrado", 404);
  if (profile.validationStatus !== ValidationStatus.approved) {
    return fail("Tu cuenta aún no está aprobada", 403);
  }

  const { id } = await params;

  const c = await prisma.case.findFirst({
    where: { id, tenantId: auth.tenantId, deletedAt: null },
    select: {
      id: true,
      title: true,
      summary: true,
      responses: true,
      status: true,
      urgency: true,
      region: true,
      comuna: true,
      createdAt: true,
      publishedAt: true,
      assignedAt: true,
      specialty: { select: { id: true, code: true, name: true } },
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          rut: true,
        },
      },
      assignments: {
        where: { lawyerId: auth.userId },
        orderBy: { assignedAt: "desc" },
        take: 1,
        select: { id: true, assignedAt: true, isActive: true },
      },
    },
  });

  if (!c) return fail("Caso no encontrado", 404);
  if (c.assignments.length === 0) {
    return fail("No tienes acceso a este caso", 403);
  }

  const assignment = c.assignments[0];
  const occurredAt = readOccurredAt(c.responses);

  const result: AcceptedCaseDetail = {
    id: c.id,
    title: c.title,
    summaryPreview: truncate(c.summary, 1_000),
    status: c.status,
    urgency: c.urgency,
    region: c.region,
    comuna: c.comuna,
    createdAt: c.createdAt.toISOString(),
    publishedAt: c.publishedAt?.toISOString() ?? null,
    specialty: c.specialty,
    responses: (c.responses ?? {}) as Record<string, unknown>,
    occurredAt,
    urgencyExplanation: explainUrgency(occurredAt, c.urgency),
    client: {
      id: c.client.id,
      firstName: c.client.firstName,
      lastName: c.client.lastName,
      email: c.client.email,
      phone: c.client.phone,
      rut: c.client.rut,
      comuna: c.comuna,
      region: c.region,
    },
    assignment: {
      id: assignment.id,
      assignedAt: assignment.assignedAt.toISOString(),
    },
    caseStatus: c.status,
  };

  return ok({ case: result });
}
