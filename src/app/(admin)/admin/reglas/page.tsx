"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Sliders } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

type RulesConfig = {
  urgencyWeight: number;
  coverageWeight: number;
  specialtyWeight: number;
  autoAssign: boolean;
};

async function fetchRules(): Promise<RulesConfig> {
  const res = await fetch("/api/admin/rules", {
    method: "GET",
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "No se pudieron cargar las reglas");
  }
  return json.data.rules as RulesConfig;
}

async function patchRules(values: RulesConfig): Promise<RulesConfig> {
  const res = await fetch("/api/admin/rules", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(values),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "No se pudieron guardar las reglas");
  }
  return json.data.rules as RulesConfig;
}

export default function AdminReglasPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "rules"],
    queryFn: fetchRules,
  });

  const [values, setValues] = useState<RulesConfig>({
    urgencyWeight: 40,
    coverageWeight: 30,
    specialtyWeight: 30,
    autoAssign: true,
  });

  useEffect(() => {
    if (data) {
      setValues(data);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (payload: RulesConfig) => patchRules(payload),
    onSuccess: (updated) => {
      toast.success("Reglas actualizadas");
      setValues(updated);
    },
    onError: (err: Error) => {
      toast.error(err.message || "No se pudieron guardar las reglas");
    },
  });

  const handleChange = (field: keyof RulesConfig, value: number | boolean) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const sum = values.urgencyWeight + values.coverageWeight + values.specialtyWeight;

  return (
    <div className="mx-auto w-full max-w-[1200px] p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
          Reglas de matchmaking
        </h1>
        <p className="mt-2 text-base text-gray-500">
          Ajusta los pesos de urgencia, cobertura y especialidad para la asignación de casos.
        </p>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {isLoading ? (
          <LoadingSkeleton variant="row" count={6} />
        ) : error ? (
          <div className="rounded-xl border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">
            {error instanceof Error
              ? error.message
              : "No se pudieron cargar las reglas."}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { label: "Urgencia", value: values.urgencyWeight, field: "urgencyWeight" as const },
                { label: "Cobertura", value: values.coverageWeight, field: "coverageWeight" as const },
                { label: "Especialidad", value: values.specialtyWeight, field: "specialtyWeight" as const },
              ].map((item) => (
                <div key={item.field} className="rounded-3xl border border-gray-200 p-5">
                  <p className="text-sm font-semibold text-gray-700">{item.label}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.value}
                      onChange={(event) =>
                        handleChange(item.field, Number(event.target.value))
                      }
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-navy-500 focus:outline-none"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Asignación automática</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Si está activado, el sistema intentará asignar casos automáticamente según estos pesos.
                  </p>
                </div>
                <Switch
                  checked={values.autoAssign}
                  onCheckedChange={(value) => handleChange("autoAssign", value)}
                  disabled={mutation.isPending}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-warning-100 bg-warning-50 p-5 text-sm text-warning-800">
              <p className="font-semibold">Resumen</p>
              <p className="mt-2">
                El total de pesos debe ser mayor que cero. Actualmente suma <strong>{sum}%</strong>.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => mutation.mutate(values)}
                disabled={mutation.isPending || sum <= 0}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Guardando...
                  </>
                ) : (
                  "Guardar reglas"
                )}
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
