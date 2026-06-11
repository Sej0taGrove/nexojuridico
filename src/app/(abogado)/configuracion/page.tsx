"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Settings } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

type LawyerProfileResponse = {
  profile: {
    isAvailable: boolean;
    bio: string | null;
    yearsExperience: number | null;
    feeRange: string | null;
    barNumber: string | null;
    certificatesUrl: string | null;
  };
};

async function fetchLawyerProfile(): Promise<LawyerProfileResponse> {
  const res = await fetch("/api/lawyer/profile", {
    method: "GET",
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "No se pudo cargar el perfil");
  }
  return json.data as LawyerProfileResponse;
}

async function patchAvailability(isAvailable: boolean): Promise<LawyerProfileResponse> {
  const res = await fetch("/api/lawyer/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ isAvailable }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "No se pudo actualizar la disponibilidad");
  }
  return json.data as LawyerProfileResponse;
}

export default function ConfiguracionPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["lawyer", "profile"],
    queryFn: fetchLawyerProfile,
  });

  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (data) {
      setAvailable(data.profile.isAvailable);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (value: boolean) => patchAvailability(value),
    onSuccess: (response) => {
      toast.success("Disponibilidad actualizada");
      setAvailable(response.profile.isAvailable);
    },
    onError: (err: Error) => {
      toast.error(err.message || "No se pudo guardar la configuración");
    },
  });

  return (
    <div className="mx-auto w-full max-w-[840px] p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
          Configuración
        </h1>
        <p className="mt-2 text-base text-gray-500">
          Ajusta tu disponibilidad y datos de perfil profesional.
        </p>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        {isLoading ? (
          <LoadingSkeleton variant="row" count={4} />
        ) : error ? (
          <div className="rounded-xl border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">
            {error instanceof Error ? error.message : "No se pudo cargar la configuración."}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-start gap-4 rounded-3xl border border-gray-200 bg-gray-50 p-6">
              <Settings className="size-10 text-gray-400" aria-hidden />
              <div>
                <h2 className="text-xl font-semibold text-navy-900">
                  Disponibilidad
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Activa este interruptor cuando estés disponible para recibir nuevos casos.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-sm font-semibold text-gray-700">Estado de disponibilidad</p>
                <p className="mt-1 text-sm text-gray-500">
                  Si está activado, el estudio puede asignarte casos en tu especialidad.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Switch
                  checked={available}
                  onCheckedChange={setAvailable}
                  disabled={mutation.isPending}
                />
                <span className="text-sm font-medium text-gray-700">
                  {available ? "Disponible" : "No disponible"}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => mutation.mutate(available)}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
              <h3 className="text-lg font-semibold text-navy-900">Tu perfil profesional</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Años de experiencia</p>
                  <p className="mt-2 text-base font-medium text-gray-800">
                    {data?.profile.yearsExperience ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rango de honorarios</p>
                  <p className="mt-2 text-base font-medium text-gray-800">
                    {data?.profile.feeRange ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Matrícula profesional</p>
                  <p className="mt-2 text-base font-medium text-gray-800">
                    {data?.profile.barNumber ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Documento de certificación</p>
                  <p className="mt-2 text-base font-medium text-gray-800">
                    {data?.profile.certificatesUrl ? (
                      <a
                        href={data.profile.certificatesUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-600 hover:underline"
                      >
                        Ver comprobante
                      </a>
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-sm text-gray-500">Descripción</p>
                <p className="mt-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-700">
                  {data?.profile.bio ?? "No se ha agregado una descripción."}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
