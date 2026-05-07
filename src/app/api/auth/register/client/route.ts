import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api/response";
import { AuthError, registerClient } from "@/server/services/auth.service";
import { registerClientSchema } from "@/server/validators/auth.schema";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Body inválido", 400);
  }

  const parsed = registerClientSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return fail(first?.message ?? "Datos inválidos", 400);
  }

  try {
    const user = await registerClient(parsed.data);
    return ok({ user }, 201);
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    console.error("[api/auth/register/client]", err);
    return fail("Error interno", 500);
  }
}
