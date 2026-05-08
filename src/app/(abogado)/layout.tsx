import { redirect } from "next/navigation";
import { ValidationStatus } from "@prisma/client";

import { LawyerShell } from "@/components/layout/LawyerShell";
import { PendingValidationScreen } from "@/components/layout/PendingValidationScreen";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { getAuthUser, UnauthorizedError } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

export default async function AbogadoLayout({
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
  if (auth.role !== "lawyer") redirect("/login");

  const profile = await prisma.lawyerProfile.findUnique({
    where: { userId: auth.userId },
    select: {
      validationStatus: true,
      rejectionReason: true,
      user: { select: { firstName: true } },
    },
  });

  if (!profile) redirect("/login");

  if (profile.validationStatus !== ValidationStatus.approved) {
    return (
      <PendingValidationScreen
        firstName={profile.user.firstName}
        status={profile.validationStatus}
        rejectionReason={profile.rejectionReason}
      />
    );
  }

  return (
    <QueryProvider>
      <LawyerShell>{children}</LawyerShell>
    </QueryProvider>
  );
}
