import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api/response";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/server/validators/auth.schema";

export async function PATCH(req: NextRequest) {
  let payload;
  try {
    payload = await getAuthUser();
  } catch (err) {
    if (err instanceof UnauthorizedError) return fail(err.message, 401);
    throw err;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Body inválido", 400);
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return fail(first?.message ?? "Datos inválidos", 400);
  }

  try {
    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone || null,
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        rut: true,
      },
    });
    return ok({ user });
  } catch (err) {
    console.error("[api/auth/profile]", err);
    return fail("No se pudo actualizar el perfil", 500);
  }
}
