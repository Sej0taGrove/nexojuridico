"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Settings } from "lucide-react";

type TenantData = {
  id: string;
  slug: string;
  name: string;
  contactEmail: string | null;
  plan: string | null;
};

async function fetchTenant(): Promise<TenantData> {
  const res = await fetch("/api/admin/tenant", {
    method: "GET",
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "No se pudieron cargar los datos del estudio");
  }
  return json.data.tenant as TenantData;
}

async function patchTenant(payload: {
  contactEmail?: string;
  plan?: string;
}) {
  const res = await fetch("/api/admin/tenant", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "No se pudieron guardar los datos del estudio");
  }
  return json.data.tenant as TenantData;
}

export default function AdminConfiguracionPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "tenant"],
    queryFn: fetchTenant,
  });

  const [contactEmail, setContactEmail] = useState("");
  const [plan, setPlan] = useState("");

  useEffect(() => {
    if (data) {
      setContactEmail(data.contactEmail ?? "");
      setPlan(data.plan ?? "");
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: patchTenant,
    onSuccess: (tenant) => {
      toast.success("Datos del estudio actualizados");
      setContactEmail(tenant.contactEmail ?? "");
      setPlan(tenant.plan ?? "");
    },
    onError: (err: Error) => {
      toast.error(err.message || "No se pudieron guardar los datos del estudio");
    },
  });

  return (
    <div className="mx-auto w-full max-w-[1200px] p-6 md:p-8">
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <Settings className="size-6 text-navy-700" aria-hidden />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
              Configuración del estudio
            </h1>
            <p className="mt-2 text-base text-gray-500">
              Actualiza el email de contacto y el plan del tenant.
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {isLoading ? (
          <LoadingSkeleton variant="row" count={4} />
        ) : error ? (
          <div className="rounded-xl border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">
            {error instanceof Error
              ? error.message
              : "No se pudieron cargar los datos del estudio."}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-gray-700">Nombre del estudio</p>
                <p className="mt-2 text-base text-gray-900">{data?.name}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Slug del studio</p>
                <p className="mt-2 text-base text-gray-900">{data?.slug}</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-gray-700" htmlFor="contactEmail">
                  Email de contacto
                </label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  placeholder="contacto@estudio.cl"
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700" htmlFor="plan">
                  Plan
                </label>
                <Input
                  id="plan"
                  value={plan}
                  onChange={(event) => setPlan(event.target.value)}
                  placeholder="estandar"
                  className="mt-2"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => mutation.mutate({ contactEmail, plan })}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
