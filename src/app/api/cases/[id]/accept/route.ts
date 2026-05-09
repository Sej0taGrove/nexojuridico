import { NextRequest } from "next/server";
import { CaseStatus, UserRole, ValidationStatus } from "@prisma/client";

import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";
import {
  explainUrgency,
  readOccurredAt,
  truncate,
  type AcceptedCaseDetail,
} from "@/lib/cases/lawyer";
import { createNotification } from "@/server/services/notification.service";

export async function POST(
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

  const lawyerSpecialtyIds = profile.specialties.map((s) => s.specialtyId);
  const { id } = await params;

  // Pre-check de existencia y especialidad — la atomicidad real va en la
  // transacción de abajo (updateMany condicional).
  const pre = await prisma.case.findFirst({
    where: { id, tenantId: auth.tenantId, deletedAt: null },
    select: { id: true, status: true, specialtyId: true },
  });
  if (!pre) return fail("Caso no encontrado", 404);
  if (!lawyerSpecialtyIds.includes(pre.specialtyId)) {
    return fail("Caso no disponible para tu especialidad", 403);
  }
  if (pre.status !== CaseStatus.en_cola) {
    return fail("Este caso ya no está disponible", 409);
  }

  const now = new Date();

  // Transacción atómica: solo el primer abogado en pasar el filtro
  // status=en_cola gana. El segundo recibe count=0 → 409.
  const acceptedCase = await prisma.$transaction(async (tx) => {
    const updateResult = await tx.case.updateMany({
      where: {
        id,
        tenantId: auth.tenantId,
        status: CaseStatus.en_cola,
        deletedAt: null,
      },
      data: {
        status: CaseStatus.asignado,
        assignedAt: now,
      },
    });

    if (updateResult.count === 0) {
      return null;
    }

    const assignment = await tx.caseAssignment.create({
      data: {
        caseId: id,
        lawyerId: auth.userId,
        assignedAt: now,
        isActive: true,
      },
    });

    await tx.caseStatusHistory.create({
      data: {
        caseId: id,
        fromStatus: CaseStatus.en_cola,
        toStatus: CaseStatus.asignado,
        changedBy: auth.userId,
        reason: "Caso aceptado por el abogado",
      },
    });

    await tx.lawyerProfile.update({
      where: { userId: auth.userId },
      data: { casesTakenCount: { increment: 1 } },
    });

    const detail = await tx.case.findUnique({
      where: { id },
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
      },
    });

    return { detail, assignment };
  });

  if (!acceptedCase || !acceptedCase.detail) {
    return fail("Este caso ya fue aceptado por otro abogado", 409);
  }

  const c = acceptedCase.detail;

  // Notificar al cliente. No bloquea la respuesta si falla (el servicio loguea).
  await createNotification({
    userId: c.client.id,
    type: "case_accepted",
    title: "Un abogado aceptó tu caso",
    message: `Un abogado especialista en ${c.specialty.name} aceptó tu caso "${c.title}".`,
    link: `/mis-casos/${c.id}`,
    metadata: { caseId: c.id, specialtyCode: c.specialty.code },
  });

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
      id: acceptedCase.assignment.id,
      assignedAt: acceptedCase.assignment.assignedAt.toISOString(),
    },
    caseStatus: c.status,
  };

  return ok({ case: result }, 201);
}
