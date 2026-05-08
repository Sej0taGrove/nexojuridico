import type { CaseStatus, UrgencyLevel, ValidationStatus } from "@prisma/client";

export type ActivityEventType =
  | "lawyer_approved"
  | "lawyer_rejected"
  | "lawyer_suspended"
  | "lawyer_reactivated"
  | "case_published"
  | "case_accepted"
  | "case_closed"
  | "case_orphan";

export type ActivityEvent = {
  id: string;
  type: ActivityEventType;
  message: string;
  timestamp: string;
};

export type AdminStatsResponse = {
  kpis: {
    casesToday: number;
    casesWeek: number;
    activeLawyers: number;
    takeRate: number;
    orphanCount: number;
    avgMatchMinutes: number;
  };
  charts: {
    bySpecialty: { id: number; code: string; name: string; count: number }[];
    trend30Days: { date: string; published: number; taken: number }[];
  };
  recentActivity: ActivityEvent[];
};

export type AdminLawyerListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  rut: string | null;
  phone: string | null;
  validationStatus: ValidationStatus;
  createdAt: string;
  validatedAt: string | null;
  hasCertificates: boolean;
  specialties: { id: number; code: string; name: string }[];
  casesTakenCount: number;
};

export type AdminLawyerDetail = AdminLawyerListItem & {
  bio: string | null;
  yearsExperience: number | null;
  feeRange: string | null;
  barNumber: string | null;
  certificatesUrl: string | null;
  rejectionReason: string | null;
  ratingAvg: number | null;
  casesWonCount: number;
  isAvailable: boolean;
  coverage: { region: string; comuna: string | null }[];
  recentCases: {
    caseId: string;
    title: string;
    specialtyName: string;
    status: CaseStatus;
    urgency: UrgencyLevel | null;
    assignedAt: string;
  }[];
};

export type AdminCaseListItem = {
  id: string;
  title: string;
  status: CaseStatus;
  urgency: UrgencyLevel | null;
  region: string | null;
  comuna: string | null;
  createdAt: string;
  publishedAt: string | null;
  assignedAt: string | null;
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
  specialty: { id: number; code: string; name: string };
  assignedLawyer: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
};

export type AdminCaseDetail = AdminCaseListItem & {
  summary: string | null;
  responses: Record<string, unknown>;
  closedAt: string | null;
  client: AdminCaseListItem["client"] & {
    email: string;
    phone: string | null;
    rut: string | null;
    region: string | null;
    comuna: string | null;
  };
  statusHistory: {
    id: number;
    fromStatus: CaseStatus | null;
    toStatus: CaseStatus;
    reason: string | null;
    changedAt: string;
    changedBy: { firstName: string; lastName: string; role: string };
  }[];
};

export type OrphanCaseListItem = AdminCaseListItem & {
  daysInQueue: number;
};

export type OrphanCasesResponse = {
  cases: OrphanCaseListItem[];
  stats: {
    total: number;
    avgDaysInQueue: number;
    urgentCount: number;
    bySpecialty: { name: string; count: number }[];
  };
};
