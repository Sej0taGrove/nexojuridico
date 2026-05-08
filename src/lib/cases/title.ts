// Etiquetas legibles para las situaciones genéricas del wizard. Mantener
// sincronizado con SITUATION_OPTIONS en src/server/validators/case.schema.ts.
const SITUATION_LABELS: Record<string, string> = {
  conflicto: "Conflicto en curso",
  consulta: "Consulta general",
  tramite: "Trámite o gestión",
  otro: "Otra situación",
};

export function deriveCaseTitle(input: {
  situation: string;
  specialtyName: string;
}): string {
  const base = SITUATION_LABELS[input.situation] ?? "Caso legal";
  return `${base} — ${input.specialtyName}`;
}

export function deriveCaseSummary(description: string, max = 240): string {
  const trimmed = description.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export { SITUATION_LABELS };
