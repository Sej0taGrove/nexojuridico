import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "approve_lawyer"
  | "reject_lawyer"
  | "suspend_lawyer"
  | "reactivate_lawyer"
  | "close_orphan_case"
  | "reassign_case"
  | "publish_case"
  | "accept_case"
  | "change_case_status";

export type AuditEntityType = "lawyer" | "case" | "user";

export type WriteAuditLogInput = {
  tenantId: string;
  actorId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
};

type TxClient = Prisma.TransactionClient | PrismaClient;

export async function writeAuditLog(
  input: WriteAuditLogInput,
  tx: TxClient = prisma,
): Promise<void> {
  await tx.auditLog.create({
    data: {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      ipAddress: input.ipAddress ?? null,
    },
  });
}
