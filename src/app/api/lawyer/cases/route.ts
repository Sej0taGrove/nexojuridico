import { CaseStatus, UserRole, ValidationStatus } from "@prisma/client";

import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";

const ACTIVE_STATUSES: readonly CaseStatus[] = [
  CaseStatus.asignado,
  CaseStatus.en_negociacion,
];

const CLOSED_STATUSES: readonly CaseStatus[] = [
  CaseStatus.cerrado_ganado,
  CaseStatus.cerrado_perdido,
];

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
    select: { validationStatus: true },
  });
  if (!profile) return fail("Perfil de abogado no encontrado", 404);
  if (profile.validationStatus !== ValidationStatus.approved) {
    return fail("Tu cuenta aún no está aprobada", 403);
  }

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
          summary: true,
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
            },
          },
        },
      },
    },
  });

  const cases = assignments
    .filter((a) => a.case)
    .map((a) => ({
      assignmentId: a.id,
      assignedAt: a.assignedAt.toISOString(),
      isActive: a.isActive,
      id: a.case.id,
      title: a.case.title,
      summary: a.case.summary,
      status: a.case.status,
      urgency: a.case.urgency,
      region: a.case.region,
      comuna: a.case.comuna,
      createdAt: a.case.createdAt.toISOString(),
      publishedAt: a.case.publishedAt?.toISOString() ?? null,
      specialty: a.case.specialty,
      client: {
        id: a.case.client.id,
        firstName: a.case.client.firstName,
        lastName: a.case.client.lastName,
      },
      isClosed: CLOSED_STATUSES.includes(a.case.status),
      isCurrentlyActive:
        a.isActive && ACTIVE_STATUSES.includes(a.case.status),
    }));

  return ok({ cases });
}
