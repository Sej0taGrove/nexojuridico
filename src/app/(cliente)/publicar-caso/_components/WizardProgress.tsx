import { Progress } from "@/components/ui/progress";

const STEP_LABELS = [
  "Selección de especialidad",
  "Detalles del caso",
  "Datos de contacto",
  "Resumen y publicación",
] as const;

export function WizardProgress({ step }: { step: 1 | 2 | 3 | 4 }) {
  const pct = (step / 4) * 100;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-wider text-gray-600">
          Paso {step} de 4
        </span>
        <span className="text-xs text-gray-500">{STEP_LABELS[step - 1]}</span>
      </div>
      <Progress
        value={pct}
        className="h-2 bg-gray-200 [&>div]:bg-navy-600"
      />
    </div>
  );
}
