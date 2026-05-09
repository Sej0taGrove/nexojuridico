import { fail, ok } from "@/lib/api/response";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";
import { unreadCountForUser } from "@/server/services/notification.service";

export async function GET() {
  let auth;
  try {
    auth = await getAuthUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) return fail(e.message, 401);
    throw e;
  }

  try {
    const count = await unreadCountForUser(auth.userId);
    return ok({ count });
  } catch (err) {
    console.error("[api/notifications/unread-count]", err);
    return fail("No se pudo obtener el contador", 500);
  }
}
