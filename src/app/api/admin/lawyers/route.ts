import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { UserRole, ValidationStatus } from "@prisma/client";

import { fail, ok } from "@/lib/api/response";
import type { AdminLawyerListItem } from "@/lib/admin/types";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUSES: readonly ValidationStatus[] = [
  ValidationStatus.pending,
  ValidationStatus.approved,
  ValidationStatus.rejected,
  ValidationStatus.suspended,
];

function parseStatus(input: string | null): ValidationStatus | null {
  if (!input) return null;
  return ALLOWED_STATUSES.find((s) => s === input) ?? null;
}

export async function GET(req: NextRequest) {
  let auth;
  try {
    auth = await getAuthUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) return fail(e.message, 401);
    throw e;
  }
  if (auth.role !== UserRole.admin) return fail("Acceso denegado", 403);

  const { searchParams } = req.nextUrl;
  const status = parseStatus(searchParams.get("status"));
  const search = searchParams.get("search")?.trim() ?? "";

  const userWhere: Prisma.UserWhereInput = {
    tenantId: auth.tenantId,
    role: UserRole.lawyer,
    deletedAt: null,
  };

  if (search) {
    userWhere.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { rut: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const where: Prisma.LawyerProfileWhereInput = { user: userWhere };
  if (status) where.validationStatus = status;

  // Counts por tab (siempre, para mostrarlos arriba)
  const [pending, approved, rejected, suspended, lawyers] = await Promise.all([
    prisma.lawyerProfile.count({
      where: { user: userWhere, validationStatus: ValidationStatus.pending },
    }),
    prisma.lawyerProfile.count({
      where: { user: userWhere, validationStatus: ValidationStatus.approved },
    }),
    prisma.lawyerProfile.count({
      where: { user: userWhere, validationStatus: ValidationStatus.rejected },
    }),
    prisma.lawyerProfile.count({
      where: { user: userWhere, validationStatus: ValidationStatus.suspended },
    }),
    prisma.lawyerProfile.findMany({
      where,
      orderBy: { user: { createdAt: "desc" } },
      take: 200,
      select: {
        userId: true,
        validationStatus: true,
        validatedAt: true,
        certificatesUrl: true,
        casesTakenCount: true,
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
      },
    }),
  ]);

  const items: AdminLawyerListItem[] = lawyers.map((l) => ({
    id: l.userId,
    firstName: l.user.firstName,
    lastName: l.user.lastName,
    email: l.user.email,
    rut: l.user.rut,
    phone: l.user.phone,
    validationStatus: l.validationStatus,
    createdAt: l.user.createdAt.toISOString(),
    validatedAt: l.validatedAt?.toISOString() ?? null,
    hasCertificates: Boolean(l.certificatesUrl),
    specialties: l.specialties.map((s) => s.specialty),
    casesTakenCount: l.casesTakenCount,
  }));

  return ok({
    counts: { pending, approved, rejected, suspended },
    lawyers: items,
  });
}
