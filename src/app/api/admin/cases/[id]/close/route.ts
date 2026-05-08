import type { NextRequest } from "next/server";
import { CaseStatus, UserRole } from "@prisma/client";
import { z } from "zod";

import { fail, ok } from "@/lib/api/response";
import { writeAuditLog } from "@/lib/audit";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  reason: z.string().trim().min(5).max(500).optional(),
});

const CLOSEABLE_STATUSES: readonly CaseStatus[] = [
  CaseStatus.en_cola,
  CaseStatus.huerfano,
];

export async function POST(
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
  if (auth.role !== UserRole.admin) return fail("Acceso denegado", 403);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return fail("Datos inválidos", 400);
  const reason = parsed.data.reason ?? "Cerrado por administrador";

  const target = await prisma.case.findFirst({
    where: { id, tenantId: auth.tenantId, deletedAt: null },
    select: { id: true, status: true, title: true },
  });
  if (!target) return fail("Caso no encontrado", 404);
  if (!CLOSEABLE_STATUSES.includes(target.status)) {
    return fail(
      `No se puede cerrar un caso con estado ${target.status}`,
      409,
    );
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const updated = await tx.case.updateMany({
      where: {
        id,
        tenantId: auth.tenantId,
        status: { in: [...CLOSEABLE_STATUSES] },
        deletedAt: null,
      },
      data: {
        status: CaseStatus.cancelado,
        closedAt: now,
      },
    });
    if (updated.count === 0) {
      throw new Error("El caso ya cambió de estado");
    }

    await tx.caseStatusHistory.create({
      data: {
        caseId: id,
        fromStatus: target.status,
        toStatus: CaseStatus.cancelado,
        changedBy: auth.userId,
        reason: `Cerrado por admin: ${reason}`,
      },
    });

    await writeAuditLog(
      {
        tenantId: auth.tenantId,
        actorId: auth.userId,
        action: "close_orphan_case",
        entityType: "case",
        entityId: id,
        metadata: {
          title: target.title,
          previousStatus: target.status,
          reason,
        },
      },
      tx,
    );
  });

  return ok({ id, status: CaseStatus.cancelado });
}
