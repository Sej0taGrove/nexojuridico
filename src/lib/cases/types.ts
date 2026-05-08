import type { CaseStatus, UrgencyLevel } from "@prisma/client";

type AssignmentBase = {
  id: number;
  assignedAt: string;
};

type LawyerBase = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

export type CaseListItem = {
  id: string;
  title: string;
  summary: string | null;
  status: CaseStatus;
  urgency: UrgencyLevel | null;
  region: string | null;
  comuna: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  specialty: { id: number; code: string; name: string };
  assignments: Array<AssignmentBase & { lawyer: LawyerBase }>;
};

export type CaseStatusHistoryItem = {
  id: number;
  fromStatus: CaseStatus | null;
  toStatus: CaseStatus;
  reason: string | null;
  createdAt: string;
  changedByUser: {
    id: string;
    firstName: string;
    lastName: string;
    role: "client" | "lawyer" | "admin";
  };
};

type DetailLawyer = LawyerBase & {
  email: string;
  phone: string | null;
  lawyerProfile: {
    bio: string | null;
    yearsExperience: number | null;
    ratingAvg: number | null;
    casesTakenCount: number;
  } | null;
};

export type CaseDetail = Omit<CaseListItem, "assignments"> & {
  responses: Record<string, unknown>;
  urgencyScore: number | null;
  assignedAt: string | null;
  closedAt: string | null;
  assignments: Array<
    AssignmentBase & {
      releasedAt: string | null;
      isActive: boolean;
      lawyer: DetailLawyer;
    }
  >;
  statusHistory: CaseStatusHistoryItem[];
};
