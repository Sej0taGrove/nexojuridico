import type { UserRole } from "@prisma/client";

export const CLIENT_HOME = "/dashboard";
export const LAWYER_HOME = "/feed";
export const ADMIN_HOME = "/admin";

export function homeForRole(role: UserRole | string | undefined): string {
  if (role === "client") return CLIENT_HOME;
  if (role === "lawyer") return LAWYER_HOME;
  if (role === "admin") return ADMIN_HOME;
  return "/";
}
