import { NextRequest } from "next/server";
import { cookies } from "next/headers";

import { fail, ok } from "@/lib/api/response";
import { AuthError, login } from "@/server/services/auth.service";
import { loginSchema } from "@/server/validators/auth.schema";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
} from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Body inválido", 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return fail(first?.message ?? "Datos inválidos", 400);
  }

  try {
    const { token, refreshToken, user } = await login(
      parsed.data.email,
      parsed.data.password,
    );

    const store = await cookies();
    const isProd = process.env.NODE_ENV === "production";

    store.set({
      name: ACCESS_TOKEN_COOKIE,
      value: token,
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });
    store.set({
      name: REFRESH_TOKEN_COOKIE,
      value: refreshToken,
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    return ok({ user });
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    console.error("[api/auth/login]", err);
    return fail("Error interno", 500);
  }
}
