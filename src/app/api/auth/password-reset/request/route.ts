import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api/response";
import { passwordResetRequestSchema } from "@/server/validators/auth.schema";
import { createPasswordResetToken } from "@/server/services/auth.service";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Body inválido", 400);
  }

  const parsed = passwordResetRequestSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return fail(first?.message ?? "Datos inválidos", 400);
  }

  try {
    const token = await createPasswordResetToken(parsed.data.email);
    const response: { message: string; devToken?: string } = {
      message:
        "Si el email existe, recibirás instrucciones para restablecer tu contraseña.",
    };

    // FIXME: Agregar servicio de envío de correos (Resend, SendGrid, etc).
    // Por ahora siempre devolvemos el devToken para poder testear en Vercel.
    if (token) {
      response.devToken = token;
    }

    return ok(response);
  } catch (err) {
    console.error("[api/auth/password-reset/request]", err);
    return fail("Error interno", 500);
  }
}
