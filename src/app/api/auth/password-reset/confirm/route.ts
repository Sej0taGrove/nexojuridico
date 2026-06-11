import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api/response";
import { passwordResetConfirmSchema } from "@/server/validators/auth.schema";
import { resetPassword } from "@/server/services/auth.service";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Body inválido", 400);
  }

  const parsed = passwordResetConfirmSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return fail(first?.message ?? "Datos inválidos", 400);
  }

  try {
    await resetPassword(parsed.data.token, parsed.data.password);
    return ok({ message: "Contraseña actualizada con éxito" });
  } catch (err) {
    if (err instanceof Error) return fail(err.message, 400);
    console.error("[api/auth/password-reset/confirm]", err);
    return fail("Error interno", 500);
  }
}
