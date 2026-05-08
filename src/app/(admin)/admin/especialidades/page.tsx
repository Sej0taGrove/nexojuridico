import { Layers } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";

export default function AdminEspecialidadesPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
          Especialidades
        </h1>
        <p className="mt-2 text-base text-gray-500">
          Gestión del catálogo de especialidades y plantillas de formulario.
        </p>
      </header>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <EmptyState
          icon={Layers}
          title="En construcción"
          description="Aquí podrás activar/desactivar especialidades y editar las plantillas dinámicas de formulario por especialidad."
        />
      </div>
    </div>
  );
}
