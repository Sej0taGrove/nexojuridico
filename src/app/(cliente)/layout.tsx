import { ClientShell } from "@/components/layout/ClientShell";
import { QueryProvider } from "@/components/providers/QueryProvider";

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <ClientShell>{children}</ClientShell>
    </QueryProvider>
  );
}
