import { Sliders } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";

export default function AdminReglasPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
          Reglas de matchmaking
        </h1>
        <p className="mt-2 text-base text-gray-500">
          Define cómo se distribuyen los casos a los abogados.
        </p>
      </header>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <EmptyState
          icon={Sliders}
          title="En construcción"
          description="Próximamente podrás configurar pesos de urgencia, cobertura geográfica y reglas de prioridad para asignar casos automáticamente."
        />
      </div>
    </div>
  );
}
