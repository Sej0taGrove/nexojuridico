import { cookies } from "next/headers";

import { fail, ok } from "@/lib/api/response";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/jwt";
import { getUserById, verifyToken } from "@/server/services/auth.service";

export async function GET() {
  const store = await cookies();
  const token = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return fail("No autenticado", 401);

  try {
    const payload = await verifyToken(token);
    const user = await getUserById(payload.userId);
    if (!user) return fail("Usuario no encontrado", 401);
    return ok({ user });
  } catch {
    return fail("Token inválido", 401);
  }
}
