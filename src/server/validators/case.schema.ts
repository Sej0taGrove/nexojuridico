import { z } from "zod";

import { CHILE_REGIONS } from "@/lib/constants/regions";

export const documentSchema = z.object({
  url: z.string().url(),
  name: z.string(),
  size: z.number(),
  type: z.string(),
});


export const SITUATION_OPTIONS = [
  "conflicto",
  "consulta",
  "tramite",
  "otro",
] as const;

export const PREFERRED_CONTACT = ["email", "phone", "whatsapp"] as const;

const dateString = z
  .string()
  .min(1, { message: "La fecha es requerida" })
  .refine((s) => !Number.isNaN(new Date(s).getTime()), {
    message: "Fecha inválida",
  })
  .refine((s) => new Date(s).getTime() <= Date.now(), {
    message: "La fecha no puede ser futura",
  });

export const createCaseResponsesSchema = z.object({
  situation: z.enum(SITUATION_OPTIONS, {
    message: "Selecciona una situación",
  }),
  occurredAt: dateString,
  hasDocuments: z.boolean(),
  description: z
    .string()
    .trim()
    .min(50, { message: "Mínimo 50 caracteres" })
    .max(4000, { message: "Máximo 4000 caracteres" }),
  documents: z.array(documentSchema).optional(),
});

export type CreateCaseResponses = z.infer<typeof createCaseResponsesSchema>;

const PHONE_REGEX = /^\+?56\s?9\s?\d{4}\s?\d{4}$/;

export const phoneSchema = z
  .string()
  .trim()
  .regex(PHONE_REGEX, {
    message: "Formato inválido. Usa +56 9 XXXX XXXX",
  });

export const createCaseSchema = z.object({
  specialtyId: z.number().int().positive({ message: "Especialidad requerida" }),
  responses: createCaseResponsesSchema,
  region: z.enum(CHILE_REGIONS, { message: "Región inválida" }),
  comuna: z
    .string()
    .trim()
    .min(2, { message: "Comuna requerida" })
    .max(80, { message: "Máximo 80 caracteres" }),
  preferredContact: z.enum(PREFERRED_CONTACT, {
    message: "Método de contacto inválido",
  }),
  phone: phoneSchema,
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;

export const cancelCaseSchema = z.object({
  action: z.literal("cancel"),
  reason: z.string().trim().max(500).optional(),
});
