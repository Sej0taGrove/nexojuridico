import {
  Briefcase,
  Building2,
  Calculator,
  Home,
  PiggyBank,
  Plane,
  Scale,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";

export type SpecialtyCode =
  | "laboral"
  | "familia"
  | "civil"
  | "penal"
  | "comercial"
  | "tributario"
  | "inmobiliario"
  | "migratorio"
  | "previsional";

export type Specialty = {
  id: number;
  code: SpecialtyCode;
  name: string;
  description: string;
  shortDescription: string;
  icon: LucideIcon;
};

// Espejo de prisma/seed.ts. Si cambia el seed, actualizar aquí también.
export const SPECIALTIES: readonly Specialty[] = [
  {
    id: 1,
    code: "laboral",
    name: "Derecho Laboral",
    description:
      "Despidos, finiquitos, accidentes laborales, acoso, derechos del trabajador.",
    shortDescription:
      "Despidos, finiquitos, accidentes del trabajo y contratos.",
    icon: Briefcase,
  },
  {
    id: 2,
    code: "familia",
    name: "Derecho de Familia",
    description:
      "Divorcios, alimentos, tuición, violencia intrafamiliar, adopción.",
    shortDescription:
      "Divorcios, alimentos, cuidado personal y violencia intrafamiliar.",
    icon: Users,
  },
  {
    id: 3,
    code: "civil",
    name: "Derecho Civil",
    description:
      "Contratos, responsabilidad civil, arrendamientos, herencias.",
    shortDescription:
      "Contratos, responsabilidad civil, herencias y arrendamientos.",
    icon: Scale,
  },
  {
    id: 4,
    code: "penal",
    name: "Derecho Penal",
    description: "Defensa penal, querellas, libertad condicional, delitos.",
    shortDescription: "Defensa penal, querellas y delitos económicos.",
    icon: Shield,
  },
  {
    id: 5,
    code: "comercial",
    name: "Derecho Comercial",
    description:
      "Sociedades, quiebras, propiedad intelectual, contratos mercantiles.",
    shortDescription:
      "Sociedades, contratos mercantiles y conflictos societarios.",
    icon: Building2,
  },
  {
    id: 6,
    code: "tributario",
    name: "Derecho Tributario",
    description: "Defensa ante el SII, planificación tributaria, multas.",
    shortDescription: "Defensa ante el SII, planificación e impuestos.",
    icon: Calculator,
  },
  {
    id: 7,
    code: "inmobiliario",
    name: "Derecho Inmobiliario",
    description:
      "Compraventa, regularización, trámites en Conservador de Bienes Raíces.",
    shortDescription:
      "Compraventa, arriendos comerciales y conflictos de propiedad.",
    icon: Home,
  },
  {
    id: 8,
    code: "migratorio",
    name: "Derecho Migratorio",
    description: "Visas, residencias, expulsiones, regularización migratoria.",
    shortDescription:
      "Visas, residencias, nacionalización y trámites ante extranjería.",
    icon: Plane,
  },
  {
    id: 9,
    code: "previsional",
    name: "Derecho Previsional",
    description: "Pensiones, AFP, invalidez, sistema previsional.",
    shortDescription: "Pensiones, invalidez, AFP y reclamos previsionales.",
    icon: PiggyBank,
  },
] as const;

export const SPECIALTY_CODES = [
  "laboral",
  "familia",
  "civil",
  "penal",
  "comercial",
  "tributario",
  "inmobiliario",
  "migratorio",
  "previsional",
] as const satisfies readonly SpecialtyCode[];
