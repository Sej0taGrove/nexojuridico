# Prisma — convenciones del proyecto

## Regla raíz: PrismaClient siempre usa driver adapter

**Toda** instanciación de `PrismaClient` en este repo (seed, `src/lib/prisma.ts`,
route handlers, server actions, scripts, tests) debe usar `@prisma/adapter-pg`.
No se permite el patrón `datasources.db.url`.

```ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
```

### Por qué

- Prisma 7+ rechaza `new PrismaClient()` sin argumentos.
- El intento previo con `{ datasources: { db: { url } } }` dio errores en
  runtime contra Supabase. El adapter `pg` es el camino estable y
  recomendado por Prisma para Postgres en runtime Node.
- Un único patrón en todo el proyecto = menos sorpresas y menos branching
  de configuración entre seed/server/tests.

### Dependencias requeridas

Ya están en `package.json`:

- `@prisma/adapter-pg`
- `pg`
- `@types/pg` (devDependency)

### Schema y configuración relacionada

- `prisma/schema.prisma` — bloque `datasource db` solo declara
  `provider = "postgresql"`. **No** poner `url`.
- `prisma.config.ts` — la URL vive aquí (`datasource.url = process.env.DATABASE_URL`).
- `generator client { provider = "prisma-client-js" }` — sin
  `previewFeatures`. Driver adapters son GA en Prisma 7+.

### Patrón para `src/lib/prisma.ts` (server-side singleton)

Cuando se cree el singleton para Next.js, mantener el patrón:

```ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Antipatrones (no hacer)

- ❌ `new PrismaClient()`
- ❌ `new PrismaClient({ datasources: { db: { url: ... } } })`
- ❌ Combinar `adapter` con `datasources` en el mismo constructor.
- ❌ Volver a poner `url = env("DATABASE_URL")` dentro de `schema.prisma`.
