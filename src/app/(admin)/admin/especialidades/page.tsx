"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Switch } from "@/components/ui/switch";

type SpecialtyItem = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

async function fetchSpecialties(): Promise<SpecialtyItem[]> {
  const res = await fetch("/api/admin/specialties", {
    method: "GET",
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "No se pudieron cargar las especialidades");
  }
  return json.data.specialties as SpecialtyItem[];
}

async function patchSpecialty(id: number, isActive: boolean) {
  const res = await fetch("/api/admin/specialties", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ id, isActive }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "No se pudo actualizar la especialidad");
  }
  return json.data.specialty as SpecialtyItem;
}

export default function AdminEspecialidadesPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "specialties"],
    queryFn: fetchSpecialties,
  });

  const mutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      patchSpecialty(id, isActive),
    onSuccess: () => {
      toast.success("Especialidad actualizada");
      qc.invalidateQueries({ queryKey: ["admin", "specialties"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "No se pudo actualizar la especialidad");
    },
  });

  return (
    <div className="mx-auto w-full max-w-[1200px] p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
          Especialidades
        </h1>
        <p className="mt-2 text-base text-gray-500">
          Activa o desactiva las especialidades disponibles en el marketplace.
        </p>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {isLoading ? (
          <LoadingSkeleton variant="row" count={4} />
        ) : error ? (
          <div className="rounded-xl border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">
            {error instanceof Error
              ? error.message
              : "No se pudieron cargar las especialidades."}
          </div>
        ) : data?.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No hay especialidades"
            description="No se encontró ninguna especialidad para este estudio."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Código</th>
                  <th className="px-4 py-3 font-semibold">Especialidad</th>
                  <th className="px-4 py-3 font-semibold">Descripción</th>
                  <th className="px-4 py-3 font-semibold text-right">Activo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.map((specialty) => (
                  <tr key={specialty.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 font-medium text-navy-900">
                      {specialty.code}
                    </td>
                    <td className="px-4 py-4 text-gray-700">
                      {specialty.name}
                    </td>
                    <td className="px-4 py-4 text-gray-500">
                      {specialty.description ?? "Sin descripción"}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Switch
                        checked={specialty.isActive}
                        onCheckedChange={(checked) =>
                          mutation.mutate({ id: specialty.id, isActive: checked })
                        }
                        disabled={mutation.isPending}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
