"use client";

import {
  ArrowLeft,
  Info,
  Loader2,
  MapPin,
  Scale,
  Send,
  ShieldCheck,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SITUATION_LABELS } from "@/lib/cases/title";
import type { CreateCaseInput } from "@/server/validators/case.schema";

const CONTACT_LABEL: Record<CreateCaseInput["preferredContact"], string> = {
  email: "Email",
  phone: "Teléfono",
  whatsapp: "WhatsApp",
};

export function Step4Summary({
  specialtyName,
  data,
  onBack,
  onSubmit,
  isSubmitting,
}: {
  specialtyName: string;
  data: CreateCaseInput;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
          Resumen de tu caso
        </h1>
        <p className="mt-2 text-base text-gray-600">
          Revisa la información antes de publicarla. Los abogados verán estos
          detalles para decidir si pueden ayudarte.
        </p>
      </header>

      {/* Banner informativo */}
      <div className="flex items-start gap-3 rounded-xl border border-info-100 bg-info-50 p-4">
        <Info aria-hidden className="mt-0.5 size-5 shrink-0 text-info-700" />
        <div>
          <h2 className="text-sm font-semibold text-info-700">
            Próximos pasos
          </h2>
          <p className="mt-1 text-sm text-gray-700">
            Tu caso será revisado por abogados especialistas en {specialtyName}.
            Te notificaremos cuando un profesional lo acepte.
          </p>
        </div>
      </div>

      {/* Cards de clasificación */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
          <Scale className="size-5 text-gray-400" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Especialidad
          </span>
          <span className="text-sm font-semibold text-navy-900">
            {specialtyName}
          </span>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
          <MapPin className="size-5 text-gray-400" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Ubicación
          </span>
          <span className="text-sm font-semibold text-navy-900">
            {data.comuna}, {data.region}
          </span>
        </div>
      </div>

      {/* Detalles de las respuestas */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <h2 className="text-lg font-semibold text-navy-900">
            Detalles del caso
          </h2>
        </header>
        <div className="flex flex-col gap-4 p-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Situación
            </h3>
            <p className="mt-1 text-sm text-gray-900">
              {SITUATION_LABELS[data.responses.situation]}
            </p>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Fecha del hecho
            </h3>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(data.responses.occurredAt).toLocaleDateString(
                "es-CL",
                {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                },
              )}
            </p>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Documentación disponible
            </h3>
            <p className="mt-1 text-sm text-gray-900">
              {data.responses.hasDocuments ? (
                data.responses.documents && data.responses.documents.length > 0 ? (
                  <ul className="mt-2 flex flex-col gap-2">
                    {data.responses.documents.map((doc, idx) => (
                      <li key={idx} className="flex items-center gap-2 rounded-md bg-gray-50 p-2 text-sm border border-gray-100">
                        <FileText className="size-4 text-navy-500 shrink-0" />
                        <a href={doc.url} target="_blank" rel="noreferrer" className="truncate text-navy-600 hover:underline" title={doc.name}>
                          {doc.name}
                        </a>
                        <span className="text-xs text-gray-400">({(doc.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  "Sí (Sin archivos adjuntos)"
                )
              ) : (
                "No"
              )}
            </p>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Descripción
            </h3>
            <p className="mt-1 whitespace-pre-line text-sm text-gray-900">
              {data.responses.description}
            </p>
          </div>
        </div>
      </section>

      {/* Datos de contacto */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <h2 className="text-lg font-semibold text-navy-900">
            Datos de contacto
          </h2>
        </header>
        <dl className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Región
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{data.region}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Comuna
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{data.comuna}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Teléfono
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{data.phone}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Método preferido
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {CONTACT_LABEL[data.preferredContact]}
            </dd>
          </div>
        </dl>
      </section>

      {/* Banner privacidad */}
      <div className="flex items-center gap-3 rounded-xl border border-success-100 bg-success-50 p-4">
        <ShieldCheck
          aria-hidden
          className="size-5 shrink-0 text-success-700"
        />
        <p className="text-sm text-gray-800">
          Tus datos de contacto <strong>solo serán visibles</strong> para
          abogados que hayan sido validados por NexoJurídico.
        </p>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
        <Button
          variant="ghost"
          size="lg"
          onClick={onBack}
          disabled={isSubmitting}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Atrás
        </Button>
        <Button size="lg" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Publicando...
            </>
          ) : (
            <>
              Publicar caso
              <Send className="size-4" aria-hidden />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
