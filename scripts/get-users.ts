import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const rosalia = await prisma.user.findFirst({
    where: { email: 'rosalia_ricomaestas@hotmail.com' },
    include: {
      lawyerProfile: {
        include: {
          specialties: {
            include: { specialty: true }
          }
        }
      }
    }
  });

  if (!rosalia || !rosalia.lawyerProfile) {
    console.log("Rosalia o su perfil no encontrados");
    return;
  }

  const specialtyIds = rosalia.lawyerProfile.specialties.map(ls => ls.specialtyId);
  console.log("Especialidades de Rosalía:", rosalia.lawyerProfile.specialties.map(ls => ls.specialty.name).join(", "));

  let feedCases = await prisma.case.findMany({
    where: {
      status: 'en_cola',
      specialtyId: { in: specialtyIds }
    }
  });

  console.log(`Casos disponibles actualmente en su Feed ('en_cola'): ${feedCases.length}`);

  if (feedCases.length < 6) {
    console.log("Generando casos 'en_cola' adicionales para que su Feed se vea espectacular...");
    const client = await prisma.user.findFirst({ where: { role: 'client' } });
    const spec = rosalia.lawyerProfile.specialties[0]?.specialty;
    const template = await prisma.caseFormTemplate.findFirst({ where: { specialtyId: spec?.id } });

    if (client && spec && template) {
      for (let i = 1; i <= 6; i++) {
        await prisma.case.create({
          data: {
            tenantId: rosalia.tenantId,
            clientId: client.id,
            specialtyId: spec.id,
            templateId: template.id,
            title: `Consulta de ${spec.name}: Representación Urgente #${i}`,
            summary: `Se solicita representación e intervención de abogado especialista en ${spec.name} para resolución de conflicto legal.`,
            responses: {
              situation: 'conflicto',
              occurredAt: new Date().toISOString(),
              hasDocuments: true,
              description: `El cliente requiere apoyo formal e inmediato en el ámbito de ${spec.name}. Toda la documentación preliminar se encuentra adjunta para revisión.`
            },
            urgency: i % 2 === 0 ? 'alta' : 'media',
            urgencyScore: i % 2 === 0 ? 90 : 65,
            region: 'Región Metropolitana',
            comuna: 'Santiago',
            status: 'en_cola',
            contentHash: `demo-feed-hash-${Date.now()}-${i}`,
            publishedAt: new Date(),
          }
        });
      }
      console.log("¡Casos creados y añadidos al Feed de Rosalía con éxito!");
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
