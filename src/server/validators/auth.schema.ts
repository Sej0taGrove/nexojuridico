import { z } from "zod";

import { isValidRut } from "@/lib/validators/rut";
import { SPECIALTY_CODES } from "@/lib/constants/specialties";

// -- Constantes compartidas ---------------------------------------------------

export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
export const PASSWORD_MESSAGE =
  "Mínimo 8 caracteres, con al menos 1 mayúscula y 1 número";

// Teléfono chileno: +56 9 1234 5678 (con o sin espacios). Opcional en cliente.
export const CL_PHONE_REGEX = /^\+?56\s?9\s?\d{4}\s?\d{4}$/;
export const CL_PHONE_MESSAGE =
  "Formato esperado: +56 9 1234 5678";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ACCEPTED_DOC_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

const documentFileSchema = z
  .instanceof(File, { message: "Adjunta un archivo" })
  .refine((file) => file.size <= MAX_FILE_SIZE, {
    message: "El archivo no puede superar los 5 MB",
  })
  .refine(
    (file) =>
      (ACCEPTED_DOC_TYPES as readonly string[]).includes(file.type),
    { message: "Formato no permitido. Usa PDF, JPG o PNG" },
  );

// -- Login --------------------------------------------------------------------

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El email es requerido" })
    .email({ message: "Ingresa un email válido" }),
  password: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
  remember: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;

// -- Registro: Cliente --------------------------------------------------------

export const registerClientSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, { message: "Mínimo 2 caracteres" })
      .max(80, { message: "Máximo 80 caracteres" }),
    lastName: z
      .string()
      .trim()
      .min(2, { message: "Mínimo 2 caracteres" })
      .max(80, { message: "Máximo 80 caracteres" }),
    rut: z
      .string()
      .min(1, { message: "El RUT es requerido" })
      .refine(isValidRut, { message: "RUT inválido" }),
    email: z
      .string()
      .min(1, { message: "El email es requerido" })
      .email({ message: "Ingresa un email válido" }),
    phone: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || CL_PHONE_REGEX.test(v), {
        message: CL_PHONE_MESSAGE,
      }),
    password: z
      .string()
      .regex(PASSWORD_REGEX, { message: PASSWORD_MESSAGE }),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      message: "Debes aceptar los Términos y Condiciones",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

export type RegisterClientInput = z.infer<typeof registerClientSchema>;

// -- Registro: Abogado -------------------------------------------------------

export const registerLawyerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, { message: "Mínimo 2 caracteres" })
      .max(80, { message: "Máximo 80 caracteres" }),
    lastName: z
      .string()
      .trim()
      .min(2, { message: "Mínimo 2 caracteres" })
      .max(80, { message: "Máximo 80 caracteres" }),
    rut: z
      .string()
      .min(1, { message: "El RUT es requerido" })
      .refine(isValidRut, { message: "RUT inválido" }),
    phone: z
      .string()
      .trim()
      .min(1, { message: "El teléfono es requerido" })
      .regex(CL_PHONE_REGEX, { message: CL_PHONE_MESSAGE }),
    email: z
      .string()
      .min(1, { message: "El email es requerido" })
      .email({ message: "Ingresa un email válido" }),
    barNumber: z
      .string()
      .trim()
      .min(1, { message: "El número de colegiatura es requerido" })
      .regex(/^[A-Za-z0-9-]+$/, {
        message: "Solo letras, números y guiones",
      }),
    specialties: z
      .array(z.enum(SPECIALTY_CODES))
      .min(1, { message: "Selecciona al menos una especialidad" }),
    titleCert: documentFileSchema,
    barCert: documentFileSchema,
    password: z
      .string()
      .regex(PASSWORD_REGEX, { message: PASSWORD_MESSAGE }),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      message: "Debes aceptar los Términos y Condiciones",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

export type RegisterLawyerInput = z.infer<typeof registerLawyerSchema>;

// Variante para la API: el cliente sube los archivos por separado en una
// fase posterior. La API de registro recibe solo datos JSON.
export const registerLawyerApiSchema = z
  .object({
    firstName: z.string().trim().min(2).max(80),
    lastName: z.string().trim().min(2).max(80),
    rut: z.string().min(1).refine(isValidRut, { message: "RUT inválido" }),
    phone: z.string().trim().regex(CL_PHONE_REGEX, { message: CL_PHONE_MESSAGE }),
    email: z.string().min(1).email(),
    barNumber: z
      .string()
      .trim()
      .min(1)
      .regex(/^[A-Za-z0-9-]+$/, { message: "Solo letras, números y guiones" }),
    specialties: z.array(z.enum(SPECIALTY_CODES)).min(1),
    password: z
      .string()
      .regex(PASSWORD_REGEX, { message: PASSWORD_MESSAGE }),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      message: "Debes aceptar los Términos y Condiciones",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

export type RegisterLawyerApiInput = z.infer<typeof registerLawyerApiSchema>;

// -- Editar perfil ------------------------------------------------------------

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, { message: "Mínimo 2 caracteres" })
    .max(80, { message: "Máximo 80 caracteres" }),
  lastName: z
    .string()
    .trim()
    .min(2, { message: "Mínimo 2 caracteres" })
    .max(80, { message: "Máximo 80 caracteres" }),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || CL_PHONE_REGEX.test(v), {
      message: CL_PHONE_MESSAGE,
    }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
