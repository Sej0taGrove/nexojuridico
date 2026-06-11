import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/api/response";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_RULES = {
  urgencyWeight: 40,
  coverageWeight: 30,
  specialtyWeight: 30,
  autoAssign: true,
} as const;

const rulesSchema = z
  .object({
    urgencyWeight: z.number().min(0).max(100),
    coverageWeight: z.number().min(0).max(100),
    specialtyWeight: z.number().min(0).max(100),
    autoAssign: z.boolean(),
  })
  .refine(
    (data) => data.urgencyWeight + data.coverageWeight + data.specialtyWeight > 0,
    {
      message: "Al menos un peso debe ser mayor que cero",
      path: ["urgencyWeight"],
    },
  );

function parseRules(settings: unknown): z.infer<typeof rulesSchema> {
  if (!settings || typeof settings !== "object") return DEFAULT_RULES;
  const candidate = (settings as Record<string, unknown>).matchmakingRules;
  if (!candidate || typeof candidate !== "object") return DEFAULT_RULES;
  const parsed = rulesSchema.safeParse(candidate);
  return parsed.success ? parsed.data : DEFAULT_RULES;
}

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
    select: { settings: true },
  });
  if (!tenant) return fail("Tenant no encontrado", 404);

  return ok({ rules: parseRules(tenant.settings) });
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

  const parsed = rulesSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return fail(first?.message ?? "Datos inválidos", 400);
  }

  const existingSettings = (
    await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
      select: { settings: true },
    })
  )?.settings;

  const tenant = await prisma.tenant.update({
    where: { id: auth.tenantId },
    data: {
      settings: {
        ...(typeof existingSettings === "object" && existingSettings !== null ? existingSettings : {}),
        matchmakingRules: parsed.data,
      },
    },
    select: { settings: true },
  });

  return ok({ rules: parseRules(tenant.settings) });
}
