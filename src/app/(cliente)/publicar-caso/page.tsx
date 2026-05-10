"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { SPECIALTIES } from "@/lib/constants/specialties";
import {
  createCaseSchema,
  type CreateCaseInput,
  type CreateCaseResponses,
} from "@/server/validators/case.schema";

import { WizardProgress } from "./_components/WizardProgress";
import { Step1Specialty } from "./_components/Step1Specialty";
import { Step2Form } from "./_components/Step2Form";
import { Step3Contact } from "./_components/Step3Contact";
import { Step4Summary } from "./_components/Step4Summary";

type Step = 1 | 2 | 3 | 4;

type DraftState = {
  specialtyId: number | null;
  responses: Partial<CreateCaseResponses>;
  region: string;
  comuna: string;
  preferredContact: CreateCaseInput["preferredContact"] | null;
  phone: string;
};

const INITIAL: DraftState = {
  specialtyId: null,
  responses: {},
  region: "",
  comuna: "",
  preferredContact: null,
  phone: "",
};

async function postCase(input: CreateCaseInput) {
  const res = await fetch("/api/cases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "No se pudo publicar el caso");
  }
  return json.data.case as { id: string };
}

export default function PublicarCasoPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<DraftState>(INITIAL);

  const specialty = useMemo(
    () => SPECIALTIES.find((s) => s.id === draft.specialtyId) ?? null,
    [draft.specialtyId],
  );

  useEffect(() => {
    if (user?.phone) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft((s) => (s.phone ? s : { ...s, phone: user.phone ?? "" }));
    }
  }, [user?.phone, setDraft]);

  const mutation = useMutation({
    mutationFn: postCase,
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["cases"] });
      toast.success("Caso publicado", {
        description: "Lo enviamos a la cola de abogados validados.",
      });
      router.push(`/mis-casos/${created.id}`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Error desconocido");
    },
  });

  function publish() {
    if (!draft.specialtyId || !draft.preferredContact) return;
    const candidate = {
      specialtyId: draft.specialtyId,
      responses: draft.responses,
      region: draft.region,
      comuna: draft.comuna,
      preferredContact: draft.preferredContact,
      phone: draft.phone,
    };
    const parsed = createCaseSchema.safeParse(candidate);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos incompletos");
      return;
    }
    mutation.mutate(parsed.data);
  }

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8 md:py-12">
      <div className="mb-8">
        <WizardProgress step={step} />
      </div>

      {step === 1 ? (
        <Step1Specialty
          selectedId={draft.specialtyId}
          onSelect={(id) =>
            setDraft((s) => ({ ...s, specialtyId: id }))
          }
          onCancel={() => router.push("/dashboard")}
          onNext={() => setStep(2)}
        />
      ) : null}

      {step === 2 && specialty ? (
        <Step2Form
          specialtyName={specialty.name}
          values={draft.responses}
          onChange={(next) =>
            setDraft((s) => ({
              ...s,
              responses: { ...s.responses, ...next },
            }))
          }
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      ) : null}

      {step === 3 ? (
        <Step3Contact
          user={
            user
              ? {
                  firstName: user.firstName,
                  lastName: user.lastName,
                  email: user.email,
                }
              : null
          }
          values={{
            region: draft.region as CreateCaseInput["region"] | undefined,
            comuna: draft.comuna,
            preferredContact: draft.preferredContact ?? undefined,
            phone: draft.phone,
          }}
          onChange={(next) =>
            setDraft((s) => ({
              ...s,
              region: next.region ?? s.region,
              comuna: next.comuna ?? s.comuna,
              preferredContact:
                next.preferredContact ?? s.preferredContact,
              phone: next.phone ?? s.phone,
            }))
          }
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      ) : null}

      {step === 4 && specialty && draft.preferredContact ? (
        <Step4Summary
          specialtyName={specialty.name}
          data={{
            specialtyId: specialty.id,
            responses: draft.responses as CreateCaseResponses,
            region: draft.region as CreateCaseInput["region"],
            comuna: draft.comuna,
            preferredContact: draft.preferredContact,
            phone: draft.phone,
          }}
          onBack={() => setStep(3)}
          onSubmit={publish}
          isSubmitting={mutation.isPending}
        />
      ) : null}
    </div>
  );
}
