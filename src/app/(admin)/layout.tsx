import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layout/AdminShell";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let auth;
  try {
    auth = await getAuthUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) redirect("/login");
    throw e;
  }
  if (auth.role !== "admin") redirect("/login");

  return (
    <QueryProvider>
      <AdminShell>{children}</AdminShell>
    </QueryProvider>
  );
}
