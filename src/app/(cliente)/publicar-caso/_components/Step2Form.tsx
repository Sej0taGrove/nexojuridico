"use client";

import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  SITUATION_OPTIONS,
  type CreateCaseResponses,
} from "@/server/validators/case.schema";
import { SITUATION_LABELS } from "@/lib/cases/title";

const SITUATION_DESCRIPTIONS: Record<string, string> = {
  conflicto: "Tengo un conflicto activo con otra parte",
  consulta: "Necesito asesoría general sobre un tema legal",
  tramite: "Necesito ayuda con un trámite o gestión",
  otro: "Otra situación distinta a las anteriores",
};

export type Step2Values = CreateCaseResponses;

export function Step2Form({
  specialtyName,
  values,
  onChange,
  onBack,
  onNext,
}: {
  specialtyName: string;
  values: Partial<Step2Values>;
  onChange: (next: Partial<Step2Values>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const description = values.description ?? "";
  const descriptionLength = description.trim().length;

  const isValid =
    !!values.situation &&
    !!values.occurredAt &&
    typeof values.hasDocuments === "boolean" &&
    descriptionLength >= 50;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-navy-900 md:text-3xl">
          Cuéntanos sobre tu caso de {specialtyName}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Tus respuestas ayudarán a clasificar y priorizar el caso.
        </p>
      </header>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        {/* Situación */}
        <div className="mb-6">
          <Label className="mb-3 block text-sm font-semibold text-gray-700">
            ¿Cuál es tu situación?
          </Label>
          <RadioGroup
            value={values.situation ?? ""}
            onValueChange={(v) =>
              onChange({ situation: v as Step2Values["situation"] })
            }
            className="flex flex-col gap-3"
          >
            {SITUATION_OPTIONS.map((opt) => (
              <Label
                key={opt}
                htmlFor={`situacion-${opt}`}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 has-[:checked]:border-navy-600 has-[:checked]:bg-navy-50"
              >
                <RadioGroupItem id={`situacion-${opt}`} value={opt} />
                <div className="flex flex-col">
                  <span className="text-base font-medium text-navy-900">
                    {SITUATION_LABELS[opt]}
                  </span>
                  <span className="text-xs text-gray-500">
                    {SITUATION_DESCRIPTIONS[opt]}
                  </span>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </div>

        {/* Fecha */}
        <div className="mb-6">
          <Label
            htmlFor="occurredAt"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            ¿Cuándo ocurrió?
          </Label>
          <div className="relative">
            <Calendar
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500"
            />
            <input
              id="occurredAt"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={values.occurredAt ?? ""}
              onChange={(e) => onChange({ occurredAt: e.target.value })}
              className="h-11 w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 text-base text-gray-900 transition-colors placeholder:text-gray-400 hover:border-gray-400 focus-visible:border-navy-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/20"
            />
          </div>
        </div>

        {/* Documentación */}
        <div className="mb-6 flex items-start justify-between gap-6 border-t border-gray-200 pt-6">
          <div>
            <Label className="block text-sm font-semibold text-gray-700">
              ¿Tienes documentación relacionada?
            </Label>
            <p className="mt-1 text-xs text-gray-500">
              Contratos, correos, fotos u otros documentos relevantes.
            </p>
          </div>
          <RadioGroup
            value={
              values.hasDocuments == null
                ? ""
                : values.hasDocuments
                  ? "yes"
                  : "no"
            }
            onValueChange={(v) => onChange({ hasDocuments: v === "yes" })}
            className="flex shrink-0 gap-2"
          >
            <Label
              htmlFor="docs-yes"
              className="cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 has-[[data-state=checked]]:border-navy-600 has-[[data-state=checked]]:bg-navy-50 has-[[data-state=checked]]:text-navy-700"
            >
              <RadioGroupItem id="docs-yes" value="yes" className="sr-only" />
              Sí
            </Label>
            <Label
              htmlFor="docs-no"
              className="cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 has-[[data-state=checked]]:border-navy-600 has-[[data-state=checked]]:bg-navy-50 has-[[data-state=checked]]:text-navy-700"
            >
              <RadioGroupItem id="docs-no" value="no" className="sr-only" />
              No
            </Label>
          </RadioGroup>
        </div>

        {/* Descripción */}
        <div>
          <Label
            htmlFor="description"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Describe brevemente tu situación
          </Label>
          <Textarea
            id="description"
            rows={5}
            value={description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Cuenta los hechos en tus propias palabras. Evita compartir números de cuenta, contraseñas u otra información sensible."
            className="resize-none"
          />
          <div className="mt-1.5 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Mínimo 50 caracteres.
            </p>
            <p
              className={`text-xs font-medium ${
                descriptionLength >= 50 ? "text-success-700" : "text-gray-400"
              }`}
            >
              {descriptionLength} / 50
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="lg" onClick={onBack}>
          <ArrowLeft className="size-4" aria-hidden />
          Atrás
        </Button>
        <Button size="lg" onClick={onNext} disabled={!isValid}>
          Continuar
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
