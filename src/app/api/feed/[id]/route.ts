import { NextRequest } from "next/server";
import { CaseStatus, UserRole, ValidationStatus } from "@prisma/client";

import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";
import {
  explainUrgency,
  readOccurredAt,
  truncate,
  type FeedCaseDetail,
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
    select: {
      validationStatus: true,
      specialties: { select: { specialtyId: true } },
    },
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
      specialtyId: true,
      createdAt: true,
      publishedAt: true,
      specialty: { select: { id: true, code: true, name: true } },
      client: { select: { firstName: true } },
    },
  });

  if (!c) return fail("Caso no encontrado", 404);

  // Solo casos cuya especialidad coincida con las del abogado
  const lawyerSpecialtyIds = profile.specialties.map((s) => s.specialtyId);
  if (!lawyerSpecialtyIds.includes(c.specialtyId)) {
    return fail("Caso no disponible para tu especialidad", 403);
  }

  if (c.status !== CaseStatus.en_cola) {
    return fail("Este caso ya no está disponible", 409);
  }

  const occurredAt = readOccurredAt(c.responses);
  const detail: FeedCaseDetail = {
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
    client: { firstName: c.client.firstName, comuna: c.comuna },
    responses: (c.responses ?? {}) as Record<string, unknown>,
    occurredAt,
    urgencyExplanation: explainUrgency(occurredAt, c.urgency),
  };

  return ok({ case: detail });
}
