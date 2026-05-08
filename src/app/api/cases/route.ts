import { NextRequest } from "next/server";
import { CaseStatus, UserRole } from "@prisma/client";

import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";
import { calculateUrgency, urgencyScore } from "@/lib/cases/urgency";
import { deriveCaseSummary, deriveCaseTitle } from "@/lib/cases/title";
import { createCaseSchema } from "@/server/validators/case.schema";

// GET /api/cases — lista de casos del usuario autenticado (rol cliente).
export async function GET() {
  let auth;
  try {
    auth = await getAuthUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) return fail(e.message, 401);
    throw e;
  }
  if (auth.role !== UserRole.client) return fail("Acceso denegado", 403);

  const cases = await prisma.case.findMany({
    where: { clientId: auth.userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      summary: true,
      status: true,
      urgency: true,
      region: true,
      comuna: true,
      createdAt: true,
      updatedAt: true,
      publishedAt: true,
      specialty: { select: { id: true, code: true, name: true } },
      assignments: {
        where: { isActive: true },
        select: {
          id: true,
          assignedAt: true,
          lawyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  return ok({ cases });
}

// POST /api/cases — crea un caso nuevo, status inicial en_cola.
export async function POST(req: NextRequest) {
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

  const parsed = createCaseSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return fail(first?.message ?? "Datos inválidos", 400);
  }

  const data = parsed.data;

  // Resolvemos especialidad + plantilla activa más reciente.
  const specialty = await prisma.specialty.findUnique({
    where: { id: data.specialtyId },
    select: { id: true, name: true, isActive: true },
  });
  if (!specialty || !specialty.isActive) {
    return fail("Especialidad inválida", 400);
  }

  const template = await prisma.caseFormTemplate.findFirst({
    where: { specialtyId: specialty.id, isActive: true },
    orderBy: { version: "desc" },
    select: { id: true },
  });
  if (!template) {
    return fail(
      "No hay plantilla activa para esta especialidad. Contacta a soporte.",
      500,
    );
  }

  const urgency = calculateUrgency(data.responses.occurredAt);
  const title = deriveCaseTitle({
    situation: data.responses.situation,
    specialtyName: specialty.name,
  });
  const summary = deriveCaseSummary(data.responses.description);

  const created = await prisma.$transaction(async (tx) => {
    const newCase = await tx.case.create({
      data: {
        tenantId: auth.tenantId,
        clientId: auth.userId,
        specialtyId: specialty.id,
        templateId: template.id,
        title,
        summary,
        responses: {
          ...data.responses,
          preferredContact: data.preferredContact,
          phone: data.phone,
        },
        urgency,
        urgencyScore: urgencyScore(urgency),
        region: data.region,
        comuna: data.comuna,
        status: CaseStatus.en_cola,
        publishedAt: new Date(),
      },
    });

    await tx.caseStatusHistory.create({
      data: {
        caseId: newCase.id,
        fromStatus: null,
        toStatus: CaseStatus.en_cola,
        changedBy: auth.userId,
        reason: "Caso publicado por el ciudadano",
      },
    });

    return newCase;
  });

  return ok({ case: created }, 201);
}
