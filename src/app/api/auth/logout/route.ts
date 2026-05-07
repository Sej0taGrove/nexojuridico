import { cookies } from "next/headers";

import { ok } from "@/lib/api/response";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/jwt";
import { logout } from "@/server/services/auth.service";

export async function POST() {
  await logout();
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
  return ok({ ok: true });
}
