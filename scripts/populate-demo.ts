import 'dotenv/config';
import { PrismaClient, UserRole, ValidationStatus, CaseStatus, UrgencyLevel } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { fakerES as faker } from '@faker-js/faker';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TENANT_SLUG = 'vignes';
const DEFAULT_PASSWORD = 'Test1234'; // All dummy users get this password

async function main() {
  console.log('--- Iniciando poblado de DEMO ---');
  
  const tenant = await prisma.tenant.findUnique({ where: { slug: TENANT_SLUG } });
  if (!tenant) throw new Error('Tenant no encontrado. Corre primero: npm run db:seed');

  const specialties = await prisma.specialty.findMany();
  const templates = await prisma.caseFormTemplate.findMany();

  if (specialties.length === 0 || templates.length === 0) {
    throw new Error('Especialidades o plantillas vacías. Corre primero: npm run db:seed');
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // 1. Crear 20 Clientes
  console.log('Creando 20 clientes falsos...');
  const clients = [];
  for (let i = 0; i < 20; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        passwordHash,
        role: UserRole.client,
        firstName,
        lastName,
        rut: `1${faker.string.numeric(7)}-${faker.string.numeric(1)}`,
        phone: faker.phone.number(),
        isActive: true,
        emailVerifiedAt: new Date(),
        clientProfile: {
          create: {
            region: faker.location.state(),
            comuna: faker.location.city(),
          }
        }
      }
    });
    clients.push(user);
  }

  // 2. Crear 15 Abogados (10 aprobados, 5 pendientes)
  console.log('Creando 15 abogados falsos...');
  const lawyers = [];
  for (let i = 0; i < 15; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    const isApproved = i < 10;
    
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        passwordHash,
        role: UserRole.lawyer,
        firstName,
        lastName,
        rut: `1${faker.string.numeric(7)}-${faker.string.numeric(1)}`,
        phone: faker.phone.number(),
        isActive: true,
        emailVerifiedAt: new Date(),
        lawyerProfile: {
          create: {
            barNumber: faker.string.numeric(5) + '-1',
            validationStatus: isApproved ? ValidationStatus.approved : ValidationStatus.pending,
            validatedAt: isApproved ? faker.date.past() : null,
            isAvailable: isApproved,
            yearsExperience: faker.number.int({ min: 1, max: 20 }),
            bio: faker.person.bio(),
            ratingAvg: isApproved ? faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }) : null,
            casesTakenCount: isApproved ? faker.number.int({ min: 5, max: 50 }) : 0,
            casesWonCount: isApproved ? faker.number.int({ min: 2, max: 40 }) : 0,
          }
        }
      }
    });

    // Asignar 1 o 2 especialidades
    const specsToAssign = faker.helpers.arrayElements(specialties, { min: 1, max: 2 });
    for (let j = 0; j < specsToAssign.length; j++) {
      await prisma.lawyerSpecialty.create({
        data: {
          lawyerId: user.id,
          specialtyId: specsToAssign[j].id,
          isPrimary: j === 0,
        }
      });
    }

    if (isApproved) {
      lawyers.push(user);
    }
  }

  // 3. Crear 100 Casos
  console.log('Creando 100 casos falsos...');
  const urgencies = [UrgencyLevel.alta, UrgencyLevel.media, UrgencyLevel.baja];
  const statuses = [
    CaseStatus.en_cola, CaseStatus.en_cola, CaseStatus.en_cola, // 30% en cola
    CaseStatus.asignado, CaseStatus.asignado, // 20% asignado
    CaseStatus.en_negociacion, // 10% en negociacion
    CaseStatus.cerrado_ganado, CaseStatus.cerrado_ganado, // 20% ganado
    CaseStatus.cerrado_perdido, // 10% perdido
    CaseStatus.huerfano // 10% huerfano
  ];

  for (let i = 0; i < 100; i++) {
    const client = faker.helpers.arrayElement(clients);
    const spec = faker.helpers.arrayElement(specialties);
    const template = templates.find(t => t.specialtyId === spec.id) || templates[0];
    const status = faker.helpers.arrayElement(statuses);
    const urgency = faker.helpers.arrayElement(urgencies);
    const createdAt = faker.date.recent({ days: 60 });
    
    // Simular un hash
    const contentHash = faker.string.uuid();

    const newCase = await prisma.case.create({
      data: {
        tenantId: tenant.id,
        clientId: client.id,
        specialtyId: spec.id,
        templateId: template.id,
        title: `Problema de ${spec.name} - ${faker.lorem.words(3)}`,
        summary: faker.lorem.sentence(),
        responses: {
          situation: faker.helpers.arrayElement(['conflicto', 'consulta', 'tramite']),
          occurredAt: faker.date.recent({ days: 30 }),
          hasDocuments: faker.datatype.boolean(),
          description: faker.lorem.paragraph(),
        },
        urgency,
        urgencyScore: faker.number.int({ min: 10, max: 90 }),
        region: faker.location.state(),
        comuna: faker.location.city(),
        status,
        contentHash,
        publishedAt: createdAt,
        createdAt,
        updatedAt: faker.date.recent({ days: 10 }),
        orphanAt: status === CaseStatus.huerfano ? faker.date.recent() : null,
      }
    });

    // Si el estado es asignado o posterior, crear asignación
    const isAssigned = [CaseStatus.asignado, CaseStatus.en_negociacion, CaseStatus.cerrado_ganado, CaseStatus.cerrado_perdido].includes(status);
    
    if (isAssigned) {
      const lawyer = faker.helpers.arrayElement(lawyers); // Toma uno de los abogados aprobados
      
      const assignmentDate = faker.date.between({ from: createdAt, to: new Date() });
      await prisma.caseAssignment.create({
        data: {
          caseId: newCase.id,
          lawyerId: lawyer.id,
          assignedAt: assignmentDate,
          isActive: [CaseStatus.asignado, CaseStatus.en_negociacion].includes(status),
          releasedAt: [CaseStatus.cerrado_ganado, CaseStatus.cerrado_perdido].includes(status) ? faker.date.recent() : null,
        }
      });

      // Crear historial de cambio de estado a asignado
      await prisma.caseStatusHistory.create({
        data: {
          caseId: newCase.id,
          fromStatus: CaseStatus.en_cola,
          toStatus: CaseStatus.asignado,
          changedBy: lawyer.id,
          reason: "Caso tomado del feed",
          createdAt: assignmentDate,
        }
      });

      if ([CaseStatus.cerrado_ganado, CaseStatus.cerrado_perdido].includes(status)) {
         await prisma.caseStatusHistory.create({
           data: {
             caseId: newCase.id,
             fromStatus: CaseStatus.asignado,
             toStatus: status,
             changedBy: lawyer.id,
             reason: "Resolución del caso",
             createdAt: faker.date.between({ from: assignmentDate, to: new Date() }),
           }
         });
      }
    }
  }

  console.log('--- Poblado completado con éxito ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
