/**
 * NexoJurídico — Seed inicial
 * -----------------------------------------------------------------------------
 * Inserta los datos mínimos para arrancar el MVP del piloto:
 *   1. Tenant inicial: "Estudio Jurídico Vignes" (slug: vignes)
 *   2. Catálogo de 9 especialidades legales (§4 del PROJECT.md)
 *   3. Usuario administrador: admin@nexojuridico.cl
 *
 * Idempotente: usa upsert. Se puede correr múltiples veces sin duplicar datos.
 *
 * Ejecutar con:  npx prisma db seed
 * -----------------------------------------------------------------------------
 */

import { PrismaClient, UserRole, ValidationStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

// Prisma 7+ requiere un driver adapter para instanciar PrismaClient.
// Patrón obligatorio en TODO el proyecto (seed, src/lib/prisma.ts, etc.).
// Ver: docs/prisma.md
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// =============================================================================
// ⚠️ SEGURIDAD — credencial temporal
// =============================================================================
// El password "ChangeMe123!" es SOLO para el primer arranque del entorno
// piloto. DEBE rotarse antes de exponer la app a usuarios reales:
//   - Iniciar sesión con admin@nexojuridico.cl / ChangeMe123!
//   - Cambiar el password desde la pantalla de perfil (D-13)
//   - O ejecutar un script de rotación que actualice users.password_hash
// NUNCA dejar este password en producción.
// =============================================================================
const ADMIN_EMAIL = 'admin@nexojuridico.cl';
const ADMIN_TEMP_PASSWORD = 'ChangeMe123!';

const TENANT_SLUG = 'vignes';

const SPECIALTIES = [
  {
    code: 'laboral',
    name: 'Derecho Laboral',
    description: 'Despidos, finiquitos, accidentes laborales, acoso, derechos del trabajador.',
    icon: 'briefcase',
    displayOrder: 1,
  },
  {
    code: 'familia',
    name: 'Derecho de Familia',
    description: 'Divorcios, alimentos, tuición, violencia intrafamiliar, adopción.',
    icon: 'users',
    displayOrder: 2,
  },
  {
    code: 'civil',
    name: 'Derecho Civil',
    description: 'Contratos, responsabilidad civil, arrendamientos, herencias.',
    icon: 'file-text',
    displayOrder: 3,
  },
  {
    code: 'penal',
    name: 'Derecho Penal',
    description: 'Defensa penal, querellas, libertad condicional, delitos.',
    icon: 'shield',
    displayOrder: 4,
  },
  {
    code: 'comercial',
    name: 'Derecho Comercial',
    description: 'Sociedades, quiebras, propiedad intelectual, contratos mercantiles.',
    icon: 'building-2',
    displayOrder: 5,
  },
  {
    code: 'tributario',
    name: 'Derecho Tributario',
    description: 'Defensa ante el SII, planificación tributaria, multas.',
    icon: 'calculator',
    displayOrder: 6,
  },
  {
    code: 'inmobiliario',
    name: 'Derecho Inmobiliario',
    description: 'Compraventa, regularización, trámites en Conservador de Bienes Raíces.',
    icon: 'home',
    displayOrder: 7,
  },
  {
    code: 'migratorio',
    name: 'Derecho Migratorio',
    description: 'Visas, residencias, expulsiones, regularización migratoria.',
    icon: 'plane',
    displayOrder: 8,
  },
  {
    code: 'previsional',
    name: 'Derecho Previsional',
    description: 'Pensiones, AFP, invalidez, sistema previsional.',
    icon: 'piggy-bank',
    displayOrder: 9,
  },
];

async function seedTenant() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: TENANT_SLUG },
    update: {},
    create: {
      slug: TENANT_SLUG,
      name: 'Estudio Jurídico Vignes',
      contactEmail: 'contacto@vignes.cl',
      isActive: true,
      plan: 'pilot',
    },
  });
  console.log(`✓ Tenant: ${tenant.name} (${tenant.slug})`);
  return tenant;
}

async function seedSpecialties() {
  for (const spec of SPECIALTIES) {
    await prisma.specialty.upsert({
      where: { code: spec.code },
      update: {
        name: spec.name,
        description: spec.description,
        icon: spec.icon,
        displayOrder: spec.displayOrder,
      },
      create: {
        code: spec.code,
        name: spec.name,
        description: spec.description,
        icon: spec.icon,
        displayOrder: spec.displayOrder,
        isActive: true,
      },
    });
  }
  console.log(`✓ Especialidades: ${SPECIALTIES.length}`);
}

// =============================================================================
// CASE_FORM_TEMPLATES — plantilla genérica v1 por especialidad
// =============================================================================
// El MVP del wizard de publicación usa preguntas genéricas (situation,
// occurredAt, hasDocuments, description). Cada especialidad necesita al menos
// una plantilla activa para satisfacer la FK obligatoria Case.templateId.
// Cuando se agreguen plantillas específicas por especialidad, esta v1 queda
// como fallback histórico.
const GENERIC_TEMPLATE_SCHEMA = {
  version: 1,
  questions: [
    {
      key: 'situation',
      label: '¿Cuál es tu situación?',
      type: 'radio',
      options: ['conflicto', 'consulta', 'tramite', 'otro'],
      required: true,
    },
    {
      key: 'occurredAt',
      label: '¿Hace cuánto tiempo ocurrió?',
      type: 'date',
      required: true,
    },
    {
      key: 'hasDocuments',
      label: '¿Tienes documentación relacionada?',
      type: 'boolean',
      required: true,
    },
    {
      key: 'description',
      label: 'Describe brevemente tu situación',
      type: 'textarea',
      minLength: 50,
      required: true,
    },
  ],
};

const GENERIC_URGENCY_RULES = {
  thresholds: {
    high: { maxDaysAgo: 30 },
    medium: { maxDaysAgo: 90 },
  },
};

async function seedCaseFormTemplates() {
  const specialties = await prisma.specialty.findMany({
    select: { id: true, code: true },
  });

  for (const spec of specialties) {
    await prisma.caseFormTemplate.upsert({
      where: { specialtyId_version: { specialtyId: spec.id, version: 1 } },
      update: {
        schema: GENERIC_TEMPLATE_SCHEMA,
        urgencyRules: GENERIC_URGENCY_RULES,
        isActive: true,
      },
      create: {
        specialtyId: spec.id,
        version: 1,
        schema: GENERIC_TEMPLATE_SCHEMA,
        urgencyRules: GENERIC_URGENCY_RULES,
        isActive: true,
      },
    });
  }
  console.log(`✓ Plantillas de formulario v1: ${specialties.length}`);
}

// =============================================================================
// TEST LAWYER — abogado de prueba ya validado (Carlos Ramírez)
// =============================================================================
// Necesario para poder probar el feed end-to-end. En producción los abogados
// se crean en estado pending y un admin los aprueba manualmente.
const TEST_LAWYER_EMAIL = 'carlos@test.com';
const TEST_LAWYER_PASSWORD = 'Test1234';
const TEST_LAWYER_SPECIALTIES: ReadonlyArray<string> = ['laboral', 'civil'];

async function seedTestLawyer(tenantId: string) {
  const passwordHash = await bcrypt.hash(TEST_LAWYER_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId, email: TEST_LAWYER_EMAIL },
    },
    update: {},
    create: {
      tenantId,
      email: TEST_LAWYER_EMAIL,
      passwordHash,
      role: UserRole.lawyer,
      firstName: 'Carlos',
      lastName: 'Ramírez',
      rut: '11.111.111-1',
      phone: '+56 9 1111 1111',
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  const specialties = await prisma.specialty.findMany({
    where: { code: { in: [...TEST_LAWYER_SPECIALTIES] } },
    select: { id: true, code: true },
  });

  await prisma.lawyerProfile.upsert({
    where: { userId: user.id },
    update: {
      validationStatus: ValidationStatus.approved,
      validatedAt: new Date(),
      isAvailable: true,
    },
    create: {
      userId: user.id,
      barNumber: '00000-1',
      validationStatus: ValidationStatus.approved,
      validatedAt: new Date(),
      isAvailable: true,
      yearsExperience: 8,
      bio: 'Especialista en Derecho Laboral y Civil con foco en negociación.',
    },
  });

  // Asegurar especialidades. Idempotente vía deleteMany + createMany.
  await prisma.lawyerSpecialty.deleteMany({ where: { lawyerId: user.id } });
  await prisma.lawyerSpecialty.createMany({
    data: specialties.map((s, idx) => ({
      lawyerId: user.id,
      specialtyId: s.id,
      isPrimary: idx === 0,
    })),
  });

  console.log(`✓ Abogado de prueba: ${user.email} (validado)`);
  console.log(`   Password: ${TEST_LAWYER_PASSWORD}  Especialidades: ${specialties.map((s) => s.code).join(', ')}`);
}

async function seedAdmin(tenantId: string) {
  const passwordHash = await bcrypt.hash(ADMIN_TEMP_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId,
        email: ADMIN_EMAIL,
      },
    },
    update: {},
    create: {
      tenantId,
      email: ADMIN_EMAIL,
      passwordHash,
      role: UserRole.admin,
      firstName: 'Admin',
      lastName: 'NexoJurídico',
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`✓ Admin: ${admin.email}`);
  console.log(`   ⚠️  Password temporal: ${ADMIN_TEMP_PASSWORD} — ROTAR antes de producción.`);
}

async function main() {
  console.log('--- Seed NexoJurídico ---');
  const tenant = await seedTenant();
  await seedSpecialties();
  await seedCaseFormTemplates();
  await seedAdmin(tenant.id);
  await seedTestLawyer(tenant.id);
  console.log('--- Seed completado ---');
}

main()
  .catch((err) => {
    console.error('Seed falló:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
