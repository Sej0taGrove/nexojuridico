import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/api/response";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let auth;
  try {
    auth = await getAuthUser();
  } catch (err) {
    if (err instanceof UnauthorizedError) return fail(err.message, 401);
    throw err;
  }
  if (auth.role !== "admin") return fail("Acceso denegado", 403);

  const specialties = await prisma.specialty.findMany({
    orderBy: { displayOrder: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      isActive: true,
    },
  });

  return ok({ specialties });
}

const PatchSchema = z.object({
  id: z.number().int().positive(),
  isActive: z.boolean(),
});

export async function PATCH(req: NextRequest) {
  let auth;
  try {
    auth = await getAuthUser();
  } catch (err) {
    if (err instanceof UnauthorizedError) return fail(err.message, 401);
    throw err;
  }
  if (auth.role !== "admin") return fail("Acceso denegado", 403);

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
    where: { id: parsed.data.id },
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
