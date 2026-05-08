import type { UrgencyLevel } from "@prisma/client";

const DAYS_HIGH = 30;
const DAYS_MEDIUM = 90;

export function calculateUrgency(occurredAt: Date | string): UrgencyLevel {
  const date = typeof occurredAt === "string" ? new Date(occurredAt) : occurredAt;
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= DAYS_HIGH) return "alta";
  if (days <= DAYS_MEDIUM) return "media";
  return "baja";
}

export function urgencyScore(level: UrgencyLevel): number {
  if (level === "alta") return 90;
  if (level === "media") return 60;
  return 30;
}
