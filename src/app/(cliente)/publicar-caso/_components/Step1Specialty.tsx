"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SPECIALTIES } from "@/lib/constants/specialties";
import { cn } from "@/lib/utils";

export function Step1Specialty({
  selectedId,
  onSelect,
  onCancel,
  onNext,
}: {
  selectedId: number | null;
  onSelect: (id: number) => void;
  onCancel: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-navy-900 md:text-3xl">
          ¿Cuál es la naturaleza de tu problema legal?
        </h1>
        <p className="text-base text-gray-600">
          Selecciona el área del derecho que mejor describa tu situación para
          conectarte con los especialistas adecuados.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {SPECIALTIES.map((spec) => {
          const Icon = spec.icon;
          const selected = selectedId === spec.id;
          return (
            <button
              key={spec.id}
              type="button"
              onClick={() => onSelect(spec.id)}
              aria-pressed={selected}
              className={cn(
                "relative flex flex-col items-center justify-center gap-4 rounded-lg border bg-white p-6 text-center transition-all duration-150 outline-none",
                "focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2",
                selected
                  ? "border-2 border-navy-600 bg-navy-50 shadow-sm"
                  : "border-gray-200 hover:border-navy-300 hover:shadow-sm",
              )}
            >
              {selected ? (
                <CheckCircle2
                  className="absolute right-3 top-3 size-5 text-navy-600"
                  aria-hidden
                />
              ) : null}
              <span
                aria-hidden
                className={cn(
                  "flex size-12 items-center justify-center rounded-full border",
                  selected
                    ? "border-navy-100 bg-white text-navy-600 shadow-sm"
                    : "border-gray-100 bg-gray-50 text-gray-500",
                )}
              >
                <Icon className="size-6" />
              </span>
              <span
                className={cn(
                  "text-sm font-semibold",
                  selected ? "text-navy-900" : "text-gray-700",
                )}
              >
                {spec.name}
              </span>
              <span className="text-xs text-gray-500">
                {spec.shortDescription}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
        <Button variant="ghost" size="lg" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          size="lg"
          onClick={onNext}
          disabled={selectedId == null}
        >
          Continuar
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
