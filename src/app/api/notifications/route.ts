import { fail, ok } from "@/lib/api/response";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";
import { listNotificationsForUser } from "@/server/services/notification.service";

export async function GET() {
  let auth;
  try {
    auth = await getAuthUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) return fail(e.message, 401);
    throw e;
  }

  try {
    const notifications = await listNotificationsForUser(auth.userId);
    return ok({ notifications });
  } catch (err) {
    console.error("[api/notifications]", err);
    return fail("No se pudieron cargar las notificaciones", 500);
  }
}
