"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CHILE_REGIONS, type ChileRegion } from "@/lib/constants/regions";
import {
  PREFERRED_CONTACT,
  type CreateCaseInput,
} from "@/server/validators/case.schema";

type ContactValues = Pick<
  CreateCaseInput,
  "region" | "comuna" | "preferredContact" | "phone"
>;

const PHONE_REGEX = /^\+?56\s?9\s?\d{4}\s?\d{4}$/;

const CONTACT_LABELS: Record<(typeof PREFERRED_CONTACT)[number], string> = {
  email: "Email",
  phone: "Teléfono",
  whatsapp: "WhatsApp",
};

export function Step3Contact({
  user,
  values,
  onChange,
  onBack,
  onNext,
}: {
  user: { firstName: string; lastName: string; email: string } | null;
  values: Partial<ContactValues>;
  onChange: (next: Partial<ContactValues>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const phoneValue = values.phone ?? "";
  const phoneIsValid = PHONE_REGEX.test(phoneValue.trim());

  const isValid =
    !!values.region &&
    !!values.comuna &&
    values.comuna.trim().length >= 2 &&
    !!values.preferredContact &&
    phoneIsValid;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-navy-900 md:text-3xl">
          Datos de contacto
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Confirma cómo prefieres que te contacten los abogados validados.
        </p>
      </header>

      <div className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        {/* Datos pre-llenados (read-only) */}
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Tus datos personales
          </p>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-gray-500">Nombre</dt>
              <dd className="text-sm font-medium text-gray-900">
                {user ? `${user.firstName} ${user.lastName}` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Email</dt>
              <dd className="text-sm font-medium text-gray-900">
                {user?.email ?? "—"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Región + comuna */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label
              htmlFor="region"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Región
            </Label>
            <Select
              value={values.region ?? ""}
              onValueChange={(v) =>
                onChange({ region: v as ChileRegion })
              }
            >
              <SelectTrigger id="region" className="h-11">
                <SelectValue placeholder="Selecciona tu región" />
              </SelectTrigger>
              <SelectContent>
                {CHILE_REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label
              htmlFor="comuna"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Comuna
            </Label>
            <Input
              id="comuna"
              className="h-11 px-3.5 text-base"
              placeholder="Ej: Las Condes"
              value={values.comuna ?? ""}
              onChange={(e) => onChange({ comuna: e.target.value })}
            />
          </div>
        </div>

        {/* Teléfono */}
        <div>
          <Label
            htmlFor="phone"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Teléfono
          </Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className="h-11 px-3.5 text-base"
            placeholder="+56 9 XXXX XXXX"
            value={phoneValue}
            onChange={(e) => onChange({ phone: e.target.value })}
          />
          <p
            className={`mt-1.5 text-xs ${
              phoneValue.length === 0 || phoneIsValid
                ? "text-gray-500"
                : "text-danger-600"
            }`}
          >
            {phoneValue.length === 0 || phoneIsValid
              ? "Formato esperado: +56 9 XXXX XXXX"
              : "Formato inválido. Usa +56 9 XXXX XXXX"}
          </p>
        </div>

        {/* Método de contacto */}
        <div>
          <Label className="mb-2 block text-sm font-semibold text-gray-700">
            Método de contacto preferido
          </Label>
          <RadioGroup
            value={values.preferredContact ?? ""}
            onValueChange={(v) =>
              onChange({
                preferredContact: v as ContactValues["preferredContact"],
              })
            }
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            {PREFERRED_CONTACT.map((opt) => (
              <Label
                key={opt}
                htmlFor={`contact-${opt}`}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 has-[:checked]:border-navy-600 has-[:checked]:bg-navy-50 has-[:checked]:text-navy-700"
              >
                <RadioGroupItem id={`contact-${opt}`} value={opt} />
                {CONTACT_LABELS[opt]}
              </Label>
            ))}
          </RadioGroup>
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
