import type { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api/response";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";
import { markAsRead } from "@/server/services/notification.service";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let auth;
  try {
    auth = await getAuthUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) return fail(e.message, 401);
    throw e;
  }

  const { id } = await params;
  let asBigInt: bigint;
  try {
    asBigInt = BigInt(id);
  } catch {
    return fail("ID inválido", 400);
  }

  try {
    const updated = await markAsRead(auth.userId, asBigInt);
    return ok({ updated });
  } catch (err) {
    console.error("[api/notifications/:id/read]", err);
    return fail("No se pudo marcar como leída", 500);
  }
}
