import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api/response";
import { getAuthUser } from "@/lib/auth/server";
import { changePasswordSchema } from "@/server/validators/auth.schema";
import { changePassword } from "@/server/services/auth.service";

export async function PATCH(req: NextRequest) {
  let payload;
  try {
    payload = await getAuthUser();
  } catch (err) {
    return fail("No autenticado", 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Body inválido", 400);
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return fail(first?.message ?? "Datos inválidos", 400);
  }

  try {
    await changePassword(
      payload.userId,
      parsed.data.currentPassword,
      parsed.data.password,
    );
    return ok({ message: "Contraseña actualizada" });
  } catch (err) {
    if (err instanceof Error) return fail(err.message, err instanceof Error ? 400 : 500);
    console.error("[api/auth/password]", err);
    return fail("Error interno", 500);
  }
}
