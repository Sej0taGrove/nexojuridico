import type { NextRequest } from "next/server";
import { UserRole, ValidationStatus } from "@prisma/client";
import { z } from "zod";

import { fail, ok } from "@/lib/api/response";
import type { AdminLawyerDetail } from "@/lib/admin/types";
import { writeAuditLog, type AuditAction } from "@/lib/audit";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/server/services/notification.service";

const PatchSchema = z.object({
  action: z.enum(["approve", "reject", "suspend", "reactivate"]),
  rejectionReason: z.string().trim().max(500).optional(),
});

const ALLOWED_TRANSITIONS: Record<
  ValidationStatus,
  Array<z.infer<typeof PatchSchema>["action"]>
> = {
  pending: ["approve", "reject"],
  approved: ["suspend"],
  rejected: ["approve"],
  suspended: ["reactivate"],
};

const NEXT_STATUS: Record<
  z.infer<typeof PatchSchema>["action"],
  ValidationStatus
> = {
  approve: ValidationStatus.approved,
  reject: ValidationStatus.rejected,
  suspend: ValidationStatus.suspended,
  reactivate: ValidationStatus.approved,
};

const ACTION_TO_AUDIT: Record<
  z.infer<typeof PatchSchema>["action"],
  AuditAction
> = {
  approve: "approve_lawyer",
  reject: "reject_lawyer",
  suspend: "suspend_lawyer",
  reactivate: "reactivate_lawyer",
};

async function loadDetail(
  tenantId: string,
  lawyerId: string,
): Promise<AdminLawyerDetail | null> {
  const profile = await prisma.lawyerProfile.findFirst({
    where: {
      userId: lawyerId,
      user: {
        tenantId,
        role: UserRole.lawyer,
        deletedAt: null,
      },
    },
    select: {
      userId: true,
      validationStatus: true,
      validatedAt: true,
      rejectionReason: true,
      bio: true,
      yearsExperience: true,
      feeRange: true,
      barNumber: true,
      certificatesUrl: true,
      ratingAvg: true,
      casesTakenCount: true,
      casesWonCount: true,
      isAvailable: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          rut: true,
          phone: true,
          createdAt: true,
        },
      },
      specialties: {
        select: {
          specialty: { select: { id: true, code: true, name: true } },
        },
      },
      coverage: {
        select: { region: true, comuna: true },
      },
    },
  });

  if (!profile) return null;

  const recentAssignments = await prisma.caseAssignment.findMany({
    where: {
      lawyerId,
      case: { tenantId, deletedAt: null },
    },
    orderBy: { assignedAt: "desc" },
    take: 10,
    select: {
      assignedAt: true,
      case: {
        select: {
          id: true,
          title: true,
          status: true,
          urgency: true,
          specialty: { select: { name: true } },
        },
      },
    },
  });

  return {
    id: profile.userId,
    firstName: profile.user.firstName,
    lastName: profile.user.lastName,
    email: profile.user.email,
    rut: profile.user.rut,
    phone: profile.user.phone,
    validationStatus: profile.validationStatus,
    createdAt: profile.user.createdAt.toISOString(),
    validatedAt: profile.validatedAt?.toISOString() ?? null,
    hasCertificates: Boolean(profile.certificatesUrl),
    specialties: profile.specialties.map((s) => s.specialty),
    casesTakenCount: profile.casesTakenCount,
    bio: profile.bio,
    yearsExperience: profile.yearsExperience,
    feeRange: profile.feeRange,
    barNumber: profile.barNumber,
    certificatesUrl: profile.certificatesUrl,
    rejectionReason: profile.rejectionReason,
    ratingAvg: profile.ratingAvg,
    casesWonCount: profile.casesWonCount,
    isAvailable: profile.isAvailable,
    coverage: profile.coverage,
    recentCases: recentAssignments.map((a) => ({
      caseId: a.case.id,
      title: a.case.title,
      specialtyName: a.case.specialty.name,
      status: a.case.status,
      urgency: a.case.urgency,
      assignedAt: a.assignedAt.toISOString(),
    })),
  };
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
  if (auth.role !== UserRole.admin) return fail("Acceso denegado", 403);

  const { id } = await params;
  const detail = await loadDetail(auth.tenantId, id);
  if (!detail) return fail("Abogado no encontrado", 404);
  return ok({ lawyer: detail });
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
  if (auth.role !== UserRole.admin) return fail("Acceso denegado", 403);

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return fail("Acción inválida", 400);
  const { action, rejectionReason } = parsed.data;

  if (action === "reject" && !rejectionReason) {
    return fail("Debes indicar el motivo del rechazo", 400);
  }

  const profile = await prisma.lawyerProfile.findFirst({
    where: {
      userId: id,
      user: {
        tenantId: auth.tenantId,
        role: UserRole.lawyer,
        deletedAt: null,
      },
    },
    select: {
      userId: true,
      validationStatus: true,
      user: { select: { firstName: true, lastName: true } },
    },
  });
  if (!profile) return fail("Abogado no encontrado", 404);

  if (!ALLOWED_TRANSITIONS[profile.validationStatus].includes(action)) {
    return fail(
      `No se puede ${action} un abogado con estado ${profile.validationStatus}`,
      409,
    );
  }

  const next = NEXT_STATUS[action];
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.lawyerProfile.update({
      where: { userId: profile.userId },
      data: {
        validationStatus: next,
        validatedAt:
          action === "approve" || action === "reactivate" ? now : null,
        validatedBy:
          action === "approve" || action === "reactivate"
            ? auth.userId
            : null,
        rejectionReason: action === "reject" ? rejectionReason : null,
      },
    });

    await writeAuditLog(
      {
        tenantId: auth.tenantId,
        actorId: auth.userId,
        action: ACTION_TO_AUDIT[action],
        entityType: "lawyer",
        entityId: profile.userId,
        metadata: {
          name: `${profile.user.firstName} ${profile.user.lastName}`,
          previousStatus: profile.validationStatus,
          nextStatus: next,
          ...(rejectionReason ? { rejectionReason } : {}),
        },
      },
      tx,
    );
  });

  // Notificar al abogado cuando es aprobado o reactivado.
  if (action === "approve" || action === "reactivate") {
    const isReactivation = action === "reactivate";
    await createNotification({
      userId: profile.userId,
      type: "lawyer_approved",
      title: isReactivation
        ? "Tu cuenta ha sido reactivada"
        : "Tu cuenta ha sido aprobada",
      message: isReactivation
        ? "Tu cuenta de abogado fue reactivada. Ya puedes ver casos nuevamente en el feed."
        : "Tu cuenta de abogado fue aprobada. Ya puedes ver y aceptar casos en el feed.",
      link: "/feed",
    });
  }

  const detail = await loadDetail(auth.tenantId, id);
  return ok({ lawyer: detail });
}
