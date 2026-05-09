import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "case_accepted"
  | "lawyer_approved"
  | "case_orphan_warning";

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Prisma.InputJsonValue;
};

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// Crea una notificación. Acepta una transacción opcional para que el
// caller pueda atomizar "acción + notificación" (ej. aceptar caso).
// No lanza si falla — las notificaciones nunca deben tumbar la acción
// principal; logueamos el error y seguimos.
export async function createNotification(
  input: CreateNotificationInput,
  tx?: Tx,
): Promise<void> {
  const client = (tx ?? prisma) as unknown as PrismaClient;
  try {
    await client.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link ?? null,
        metadata: input.metadata,
      },
    });
  } catch (err) {
    console.error("[notification.create]", err);
  }
}

export type NotificationDTO = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  metadata: unknown;
  readAt: string | null;
  createdAt: string;
};

export async function listNotificationsForUser(
  userId: string,
  limit = 50,
): Promise<NotificationDTO[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((n) => ({
    id: n.id.toString(),
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link,
    metadata: n.metadata as unknown,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  }));
}

export async function unreadCountForUser(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

export async function markAsRead(
  userId: string,
  notificationId: bigint,
): Promise<boolean> {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count > 0;
}

// TODO: cron diario que llame a esta función para todos los casos
// con createdAt > 7 días sin asignar. La función está lista; falta el scheduler.
export async function notifyOrphanCase(
  adminUserId: string,
  caseId: string,
  caseTitle: string,
  daysOld: number,
): Promise<void> {
  await createNotification({
    userId: adminUserId,
    type: "case_orphan_warning",
    title: "Caso sin tomar hace más de 7 días",
    message: `El caso "${caseTitle}" lleva ${daysOld} días sin que ningún abogado lo acepte.`,
    link: `/admin/casos/${caseId}`,
    metadata: { caseId, daysOld },
  });
}
