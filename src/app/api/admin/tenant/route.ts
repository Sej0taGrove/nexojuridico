import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/api/response";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

const patchTenantSchema = z
  .object({
    contactEmail: z.string().email({ message: "Ingresa un email válido" }).optional(),
    plan: z.string().min(1).optional(),
  })
  .refine((data) => data.contactEmail || data.plan, {
    message: "Debes enviar al menos un campo a actualizar",
    path: ["contactEmail"],
  });

export async function GET() {
  let auth;
  try {
    auth = await getAuthUser();
  } catch (err) {
    if (err instanceof UnauthorizedError) return fail(err.message, 401);
    throw err;
  }
  if (auth.role !== "admin") return fail("Acceso denegado", 403);

  const tenant = await prisma.tenant.findUnique({
    where: { id: auth.tenantId },
    select: {
      id: true,
      slug: true,
      name: true,
      contactEmail: true,
      plan: true,
      settings: true,
    },
  });
  if (!tenant) return fail("Tenant no encontrado", 404);

  return ok({ tenant });
}

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

  const parsed = patchTenantSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return fail(first?.message ?? "Datos inválidos", 400);
  }

  const data: { contactEmail?: string; plan?: string } = {};
  if (parsed.data.contactEmail) data.contactEmail = parsed.data.contactEmail.toLowerCase();
  if (parsed.data.plan) data.plan = parsed.data.plan;

  const tenant = await prisma.tenant.update({
    where: { id: auth.tenantId },
    data,
    select: {
      id: true,
      slug: true,
      name: true,
      contactEmail: true,
      plan: true,
      settings: true,
    },
  });

  return ok({ tenant });
}
