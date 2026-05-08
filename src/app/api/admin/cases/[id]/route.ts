import type { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";

import { fail, ok } from "@/lib/api/response";
import type { AdminCaseDetail } from "@/lib/admin/types";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

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
  if (auth.role !== UserRole.admin) return fail("Acceso denegado", 403);

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
      closedAt: true,
      specialty: { select: { id: true, code: true, name: true } },
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          rut: true,
          clientProfile: {
            select: { region: true, comuna: true },
          },
        },
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
      statusHistory: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          fromStatus: true,
          toStatus: true,
          reason: true,
          createdAt: true,
          changedByUser: {
            select: { firstName: true, lastName: true, role: true },
          },
        },
      },
    },
  });

  if (!c) return fail("Caso no encontrado", 404);

  const detail: AdminCaseDetail = {
    id: c.id,
    title: c.title,
    summary: c.summary,
    responses: (c.responses ?? {}) as Record<string, unknown>,
    status: c.status,
    urgency: c.urgency,
    region: c.region,
    comuna: c.comuna,
    createdAt: c.createdAt.toISOString(),
    publishedAt: c.publishedAt?.toISOString() ?? null,
    assignedAt: c.assignedAt?.toISOString() ?? null,
    closedAt: c.closedAt?.toISOString() ?? null,
    specialty: c.specialty,
    client: {
      id: c.client.id,
      firstName: c.client.firstName,
      lastName: c.client.lastName,
      email: c.client.email,
      phone: c.client.phone,
      rut: c.client.rut,
      region: c.client.clientProfile?.region ?? c.region,
      comuna: c.client.clientProfile?.comuna ?? c.comuna,
    },
    assignedLawyer: c.assignments[0]?.lawyer ?? null,
    statusHistory: c.statusHistory.map((h) => ({
      id: h.id,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      reason: h.reason,
      changedAt: h.createdAt.toISOString(),
      changedBy: {
        firstName: h.changedByUser.firstName,
        lastName: h.changedByUser.lastName,
        role: h.changedByUser.role,
      },
    })),
  };

  return ok({ case: detail });
}
