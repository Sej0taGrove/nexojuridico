"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PendingValidationScreen({
  firstName,
  status,
  rejectionReason,
}: {
  firstName: string;
  status: "pending" | "rejected" | "suspended";
  rejectionReason?: string | null;
}) {
  const router = useRouter();

  const titles: Record<typeof status, string> = {
    pending: "Tu cuenta está pendiente de validación",
    rejected: "Tu solicitud fue rechazada",
    suspended: "Tu cuenta está suspendida",
  };
  const descriptions: Record<typeof status, string> = {
    pending:
      "Estamos revisando tu perfil. Recibirás un email cuando el administrador apruebe tu cuenta y puedas comenzar a recibir casos.",
    rejected:
      rejectionReason ||
      "Tu solicitud fue rechazada. Si crees que es un error, contáctanos.",
    suspended:
      "Tu cuenta fue suspendida. Contacta a soporte para más información.",
  };

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="flex h-16 items-center border-b border-gray-200 bg-white px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold text-navy-900"
        >
          NexoJurídico
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <span
            aria-hidden
            className="flex size-14 items-center justify-center rounded-full bg-warning-50 text-warning-700"
          >
            <Clock className="size-7" />
          </span>

          <div>
            <p className="text-sm font-medium text-gray-500">
              Hola{firstName ? `, ${firstName}` : ""}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy-900">
              {titles[status]}
            </h1>
          </div>

          <p className="text-sm leading-relaxed text-gray-600">
            {descriptions[status]}
          </p>

          <Button
            onClick={handleLogout}
            variant="outline"
            size="lg"
            className="w-full"
          >
            <LogOut className="size-4" aria-hidden />
            Cerrar sesión
          </Button>
        </div>
      </main>
    </div>
  );
}
