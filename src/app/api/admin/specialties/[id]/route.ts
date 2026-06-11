import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/api/response";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

const PatchSchema = z.object({
  isActive: z.boolean(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let auth;
  try {
    auth = await getAuthUser();
  } catch (err) {
    if (err instanceof UnauthorizedError) return fail(err.message, 401);
    throw err;
  }
  if (auth.role !== "admin") return fail("Acceso denegado", 403);

  const { id } = await params;
  const specialtyId = Number(id);
  if (!Number.isInteger(specialtyId) || specialtyId <= 0) {
    return fail("ID inválido", 400);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Body inválido", 400);
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return fail(first?.message ?? "Datos inválidos", 400);
  }

  const specialty = await prisma.specialty.update({
    where: { id: specialtyId },
    data: { isActive: parsed.data.isActive },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      isActive: true,
    },
  });

  return ok({ specialty });
}
