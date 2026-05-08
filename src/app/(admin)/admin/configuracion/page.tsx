import { Settings } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";

export default function AdminConfiguracionPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
          Configuración
        </h1>
        <p className="mt-2 text-base text-gray-500">
          Ajustes generales del estudio.
        </p>
      </header>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <EmptyState
          icon={Settings}
          title="En construcción"
          description="Aquí podrás ajustar la información del estudio, integraciones, plantillas de notificaciones y más."
        />
      </div>
    </div>
  );
}
