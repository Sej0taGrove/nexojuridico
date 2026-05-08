import { cookies } from "next/headers";

import {
  ACCESS_TOKEN_COOKIE,
  verifyAccessToken,
  type AccessTokenPayload,
} from "@/lib/auth/jwt";

export class UnauthorizedError extends Error {
  constructor(message = "No autenticado") {
    super(message);
  }
}

// Lee el JWT desde la cookie y devuelve el payload. Lanza UnauthorizedError
// si no hay token o si es inválido. Pensado para route handlers de Next.js 16
// (cookies() es async en v16).
export async function getAuthUser(): Promise<AccessTokenPayload> {
  const store = await cookies();
  const token = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) throw new UnauthorizedError();
  try {
    return await verifyAccessToken(token);
  } catch {
    throw new UnauthorizedError("Token inválido");
  }
}
