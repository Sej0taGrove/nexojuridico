import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const c = await prisma.user.findFirst({ where: { role: 'client' } });
  const l = await prisma.user.findFirst({ where: { role: 'lawyer' } });
  const a = await prisma.user.findFirst({ where: { role: 'admin' } });
  console.log("CLIENTE=" + c?.email);
  console.log("ABOGADO=" + l?.email);
  console.log("ADMIN=" + a?.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
