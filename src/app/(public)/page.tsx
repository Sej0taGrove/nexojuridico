import Link from "next/link";
import { FilePen, MessageCircle, SearchCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HowItWorksStep } from "@/components/shared/HowItWorksStep";
import { SpecialtyCard } from "@/components/shared/SpecialtyCard";
import { SPECIALTIES } from "@/lib/constants/specialties";

const HOW_IT_WORKS = [
  {
    icon: FilePen,
    title: "Publica tu caso",
    description:
      "Describe tu situación legal de forma confidencial en pocos minutos.",
  },
  {
    icon: SearchCheck,
    title: "El sistema lo clasifica",
    description:
      "Identificamos la especialidad y la urgencia, y lo derivamos al abogado más adecuado.",
  },
  {
    icon: MessageCircle,
    title: "Un abogado te contacta",
    description:
      "Recibe asesoría directa de un profesional validado, listo para tomar tu caso.",
  },
] as const;

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto flex w-full max-w-[1200px] flex-col items-center px-6 py-20 text-center md:py-24">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-navy-800 md:text-5xl lg:text-6xl">
          Encuentra el abogado correcto para tu caso
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-gray-600">
          Conectamos automáticamente tu necesidad legal con un especialista
          validado. Publica tu caso y recibe asesoría profesional en horas.
        </p>
        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <Button asChild variant="default" className="h-11 px-6 text-base">
            <Link href="/registro/cliente">Soy ciudadano</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 px-6 text-base">
            <Link href="/registro/abogado">Soy abogado</Link>
          </Button>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-navy-800 md:text-4xl">
              Cómo funciona
            </h2>
            <p className="mt-3 text-base text-gray-600">
              Un proceso simple y transparente para resolver tu problema legal.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <HowItWorksStep
                key={step.title}
                icon={step.icon}
                step={i + 1}
                title={step.title}
                description={step.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Especialidades */}
      <section id="especialidades" className="py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-navy-800 md:text-4xl">
              Especialidades
            </h2>
            <p className="mt-3 text-base text-gray-600">
              Encuentra expertos validados en las nueve áreas del derecho que
              cubrimos en Chile.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SPECIALTIES.map((specialty) => (
              <SpecialtyCard
                key={specialty.code}
                icon={specialty.icon}
                name={specialty.name}
                description={specialty.shortDescription}
                href="/registro/cliente"
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Abogados */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-[1200px] rounded-2xl bg-navy-900 px-8 py-12 shadow-lg md:px-16 md:py-16">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                ¿Eres abogado? Amplía tu cartera de clientes
              </h2>
              <p className="mt-4 text-base text-navy-100">
                Únete a nuestra red de profesionales validados. Recibe casos
                pre-filtrados según tu especialidad y enfócate en lo que mejor
                haces: ejercer el derecho.
              </p>
            </div>

            <Button
              asChild
              variant="default"
              className="h-11 shrink-0 bg-white px-6 text-base text-navy-900 hover:bg-gray-100"
            >
              <Link href="/registro/abogado">Únete como abogado</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
