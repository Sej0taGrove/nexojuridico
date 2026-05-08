import { NextRequest } from "next/server";
import { CaseStatus, UserRole, ValidationStatus } from "@prisma/client";
import { z } from "zod";

import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";

// Transiciones permitidas (solo el abogado asignado activo).
const ALLOWED_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  borrador: [],
  en_cola: [],
  asignado: [CaseStatus.en_negociacion],
  en_negociacion: [CaseStatus.cerrado_ganado, CaseStatus.cerrado_perdido],
  cerrado_ganado: [],
  cerrado_perdido: [],
  cancelado: [],
  huerfano: [],
};

const TARGET_STATUSES = new Set<CaseStatus>([
  CaseStatus.en_negociacion,
  CaseStatus.cerrado_ganado,
  CaseStatus.cerrado_perdido,
]);

const patchSchema = z.object({
  status: z.enum([
    CaseStatus.en_negociacion,
    CaseStatus.cerrado_ganado,
    CaseStatus.cerrado_perdido,
  ]),
  reason: z.string().trim().min(1).max(500).optional(),
});

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
  if (auth.role !== UserRole.lawyer) return fail("Acceso denegado", 403);

  const profile = await prisma.lawyerProfile.findUnique({
    where: { userId: auth.userId },
    select: { validationStatus: true },
  });
  if (!profile) return fail("Perfil de abogado no encontrado", 404);
  if (profile.validationStatus !== ValidationStatus.approved) {
    return fail("Tu cuenta aún no está aprobada", 403);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Body inválido", 400);
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return fail(first?.message ?? "Datos inválidos", 400);
  }

  const target = parsed.data.status;
  if (!TARGET_STATUSES.has(target)) {
    return fail("Estado destino inválido", 400);
  }

  const { id } = await params;

  const c = await prisma.case.findFirst({
    where: { id, tenantId: auth.tenantId, deletedAt: null },
    select: {
      id: true,
      status: true,
      assignments: {
        where: { lawyerId: auth.userId, isActive: true },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!c) return fail("Caso no encontrado", 404);
  if (c.assignments.length === 0) {
    return fail("Solo el abogado asignado puede cambiar el estado", 403);
  }

  const allowed = ALLOWED_TRANSITIONS[c.status] ?? [];
  if (!allowed.includes(target)) {
    return fail(
      `No puedes pasar de "${c.status}" a "${target}"`,
      409,
    );
  }

  const isClosing =
    target === CaseStatus.cerrado_ganado ||
    target === CaseStatus.cerrado_perdido;
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.case.update({
      where: { id },
      data: {
        status: target,
        ...(isClosing ? { closedAt: now } : {}),
      },
    });

    await tx.caseStatusHistory.create({
      data: {
        caseId: id,
        fromStatus: c.status,
        toStatus: target,
        changedBy: auth.userId,
        reason: parsed.data.reason ?? null,
      },
    });

    if (target === CaseStatus.cerrado_ganado) {
      await tx.lawyerProfile.update({
        where: { userId: auth.userId },
        data: { casesWonCount: { increment: 1 } },
      });
    }

    if (isClosing) {
      // El caso queda cerrado: liberar asignaciones activas.
      await tx.caseAssignment.updateMany({
        where: { caseId: id, isActive: true },
        data: { isActive: false, releasedAt: now },
      });
    }
  });

  return ok({ id, status: target });
}
