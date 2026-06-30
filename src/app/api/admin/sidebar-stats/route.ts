import { CaseStatus, UserRole } from "@prisma/client";

import { fail, ok } from "@/lib/api/response";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let auth;
  try {
    auth = await getAuthUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) return fail(e.message, 401);
    throw e;
  }
  if (auth.role !== UserRole.admin) return fail("Acceso denegado", 403);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const orphanCount = await prisma.case.count({
    where: {
      tenantId: auth.tenantId,
      deletedAt: null,
      OR: [
        { status: CaseStatus.huerfano },
        { status: CaseStatus.en_cola, createdAt: { lt: sevenDaysAgo } }
      ]
    },
  });

  return ok({ orphanCount });
}
