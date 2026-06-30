import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Prisma 7+ requiere driver adapter. Patrón obligatorio en TODO el proyecto.
// Ver: docs/prisma.md
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2, // Límite por instancia serverless para no exceder el máximo de 15 conexiones de Supabase/Neon
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.pool = pool;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(pool),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
