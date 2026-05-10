import type { CaseStatus, UrgencyLevel } from "@prisma/client";

const DAYS_HIGH = 30;

export function explainUrgency(
  occurredAt: Date | string | null | undefined,
  level: UrgencyLevel | null | undefined,
): string {
  if (!level) return "Sin urgencia calculada todavía.";
  if (!occurredAt) {
    if (level === "alta") return "El cliente lo marcó como urgente.";
    if (level === "media") return "Prioridad intermedia.";
    return "Sin prisa.";
  }
  const date =
    typeof occurredAt === "string" ? new Date(occurredAt) : occurredAt;
  const days = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)),
  );

  if (level === "alta") {
    return `El hecho ocurrió hace ${days} días. Cuando un caso es reciente (≤ ${DAYS_HIGH} días) suele haber plazos legales activos por cumplir, por lo que requiere atención inmediata.`;
  }
  if (level === "media") {
    return `El hecho ocurrió hace ${days} días. Aún hay margen para actuar pero los plazos podrían acercarse — conviene contactar al cliente esta semana.`;
  }
  return `El hecho ocurrió hace ${days} días. No hay urgencia inmediata, pero el cliente igualmente espera respuesta.`;
}

export function relativeTime(iso: string | Date): string {
  const ms =
    Date.now() - (typeof iso === "string" ? new Date(iso).getTime() : iso.getTime());
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "hace instantes";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `hace ${weeks} sem`;
  const months = Math.floor(days / 30);
  return `hace ${months} mes${months === 1 ? "" : "es"}`;
}

// Datos parciales del cliente que se muestran a abogados ANTES de aceptar.
// NUNCA debe incluir lastName, email, phone, ni rut.
export type FeedClient = {
  firstName: string;
  comuna: string | null;
};

// Card del feed: lo mínimo para escanear y decidir si entrar al detalle.
export type FeedCaseCard = {
  id: string;
  title: string;
  summaryPreview: string;
  status: CaseStatus;
  urgency: UrgencyLevel | null;
  region: string | null;
  comuna: string | null;
  createdAt: string;
  publishedAt: string | null;
  specialty: { id: number; code: string; name: string };
  client: FeedClient;
};

// Detalle preview (antes de aceptar): mismos datos parciales del cliente,
// pero ya con descripción y respuestas completas del formulario.
export type FeedCaseDetail = FeedCaseCard & {
  responses: Record<string, unknown>;
  occurredAt: string | null;
  urgencyExplanation: string;
};

// Datos completos del cliente — solo después de aceptar el caso.
export type AcceptedClient = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  rut: string | null;
  comuna: string | null;
  region: string | null;
};

export type AcceptedCaseDetail = Omit<FeedCaseDetail, "client"> & {
  client: AcceptedClient;
  assignment: {
    id: number;
    assignedAt: string;
  };
  caseStatus: CaseStatus;
};

export function truncate(text: string | null | undefined, max = 200): string {
  if (!text) return "";
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

// Lee `responses.occurredAt` del caso de forma segura.
export function readOccurredAt(responses: unknown): string | null {
  if (!responses || typeof responses !== "object") return null;
  const occ = (responses as Record<string, unknown>)["occurredAt"];
  if (typeof occ === "string") return occ;
  if (occ instanceof Date) return occ.toISOString();
  return null;
}
