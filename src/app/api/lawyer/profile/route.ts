import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/api/response";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  isAvailable: z.boolean(),
});

export async function GET() {
  let auth;
  try {
    auth = await getAuthUser();
  } catch (err) {
    if (err instanceof UnauthorizedError) return fail(err.message, 401);
    throw err;
  }
  if (auth.role !== "lawyer") return fail("Acceso denegado", 403);

  const profile = await prisma.lawyerProfile.findUnique({
    where: { userId: auth.userId },
    select: {
      isAvailable: true,
      bio: true,
      yearsExperience: true,
      feeRange: true,
      barNumber: true,
      certificatesUrl: true,
    },
  });

  if (!profile) return fail("Perfil no encontrado", 404);
  return ok({ profile });
}

export async function PATCH(req: NextRequest) {
  let auth;
  try {
    auth = await getAuthUser();
  } catch (err) {
    if (err instanceof UnauthorizedError) return fail(err.message, 401);
    throw err;
  }
  if (auth.role !== "lawyer") return fail("Acceso denegado", 403);

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

  const profile = await prisma.lawyerProfile.update({
    where: { userId: auth.userId },
    data: { isAvailable: parsed.data.isAvailable },
    select: {
      isAvailable: true,
      bio: true,
      yearsExperience: true,
      feeRange: true,
      barNumber: true,
      certificatesUrl: true,
    },
  });

  return ok({ profile });
}
