# NexoJurídico — Pendientes Técnicos

> Este archivo lista todo lo que el modelo de datos / arquitectura
> requiere pero **no se puede expresar en `schema.prisma`**, o que
> debe configurarse fuera del ORM. Cada item incluye dónde aplicarlo
> y por qué importa.

---

## 1. Triggers de base de datos

### 1.1. Auto-actualización de `updated_at`

**Estado:** Cubierto por Prisma vía `@updatedAt` — pero **solo cuando el cambio
pasa por Prisma**. Si en algún momento se hacen UPDATEs directos por SQL
(jobs, scripts manuales, herramientas externas), `updated_at` no se moverá.

**Recomendación:** Crear un trigger PostgreSQL que actualice `updated_at` a
nivel de BD para garantizar la invariante incluso fuera de Prisma.

```sql
-- Función reusable
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a cada tabla con updated_at:
CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Repetir para: users, cases, ... (todas las tablas con updated_at)
```

**Tablas afectadas:** `tenants`, `users`, `cases`. (El resto no tienen `updated_at`
en el modelo actual — verificar al crecer.)

**Dónde añadir:** Migración SQL crudo posterior a `prisma migrate dev --name init`,
o como migración explícita `prisma migrate dev --name updated_at_triggers --create-only`.

---

### 1.2. Auto-registro en `case_status_history` cuando cambia `cases.status`

**Por qué:** El documento maestro (§8.4) declara que cada cambio de estado
debe registrarse automáticamente. Hacerlo desde la app requiere disciplina
(toda mutación de `cases.status` debe pasar por un servicio dedicado). Un
trigger lo hace inviolable.

**Decisión pendiente:** ¿Implementarlo en BD (trigger) o en aplicación
(servicio único `caseStatusService.transition()`)?

- **Trigger en BD:** Garantiza la invariante incluso ante UPDATEs directos.
  Pero el campo `changed_by` requiere que la app pase el actor por
  `SET LOCAL app.current_user_id` o similar — agrega complejidad.
- **Servicio en app:** Más simple, controla `changed_by` y `reason`
  naturalmente. Requiere disciplina (lint rule / code review) para que
  nadie escriba `prisma.case.update({ status: ... })` en otro lado.

**Recomendación pragmática:** Empezar con servicio en app, agregar trigger
defensivo más adelante si aparecen casos que escapan al servicio.

```sql
-- Boceto del trigger (si se opta por BD):
CREATE OR REPLACE FUNCTION log_case_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO case_status_history (case_id, from_status, to_status, changed_by, created_at)
    VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      COALESCE(current_setting('app.current_user_id', true)::uuid, NEW.client_id),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cases_status_history
  AFTER UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION log_case_status_change();
```

---

## 2. Cron job: marcar casos huérfanos

**Spec (§8.4):** Casos con más de 7 días en `en_cola` → pasan a `huerfano`,
se setea `orphan_at`, se notifica al admin.

**Implementación recomendada:**

```sql
-- Lógica del job (correr cada hora):
UPDATE cases
SET status = 'huerfano',
    orphan_at = NOW(),
    updated_at = NOW()
WHERE status = 'en_cola'
  AND published_at < NOW() - INTERVAL '7 days'
  AND deleted_at IS NULL;
```

**Dónde correrlo (3 opciones, ordenadas por simpleza):**

1. **Vercel Cron** (recomendada): Ruta `app/api/cron/orphans/route.ts`
   protegida con `CRON_SECRET`. `vercel.json` la dispara cada hora.
   Cero infra extra.
2. **Supabase pg_cron**: Más cerca de los datos, sin pasar por la app.
   Requiere habilitar la extensión.
3. **Worker externo** (BullMQ + Redis): Sobre-ingeniería para el MVP.

**TODO al implementar:**
- Disparar notificaciones al admin (D-06: Casos huérfanos) por cada
  caso que pasa a huérfano.
- Registrar la transición en `case_status_history` (cuando esté el
  trigger / servicio del item 1.2).

---

## 3. Índices avanzados (parciales / GIN)

**Estado:** Definidos en `prisma/migrations/manual_indexes.sql` con
comentarios explicando cada uno. Pendiente: integrarlos a la migración
inicial generada por `prisma migrate dev`.

Ver el archivo para los 4 índices (`idx_cases_specialty_urgency`,
`idx_cases_content_hash`, `idx_cases_responses` GIN,
`idx_notifications_user_unread`) y las opciones de aplicación.

---

## 4. Row Level Security / aislamiento multi-tenant

**Spec (§9.5):** Todas las queries Prisma deben filtrar por `tenant_id`
para evitar fugas entre tenants.

**Implementación recomendada:** `PrismaClient` extendido (Prisma Client
Extensions, `client.$extends`) que inyecte automáticamente
`{ where: { tenantId: ctx.tenantId } }` en operaciones `find*`, `update*`,
`delete*`, `count` para los modelos con `tenant_id`.

**Alternativa más fuerte:** PostgreSQL RLS (`ALTER TABLE … ENABLE ROW LEVEL
SECURITY`) + policy que use `current_setting('app.tenant_id')`. Defensa en
profundidad: aunque el código tenga un bug, la BD bloquea la fuga. Más
trabajo de configuración (la app debe `SET LOCAL app.tenant_id` por
transacción).

**Recomendación:** Empezar con la extensión de Prisma; añadir RLS antes
del go-live multi-tenant real (post-piloto).

---

## 5. Validación de invariantes adicionales

Pendientes que ni Prisma ni el modelo actual fuerzan, pero el documento
maestro implica:

- **Un solo `case_assignments.is_active = true` por caso** → CHECK constraint
  o índice único parcial: `CREATE UNIQUE INDEX … ON case_assignments(case_id) WHERE is_active`.
- **`lawyer_specialties.is_primary = true` único por abogado** → mismo patrón.
- **`case_form_templates.is_active = true` único por especialidad** → mismo patrón.
- **`urgency` y `urgency_score` consistentes** (ej: `alta` ↔ score >= threshold)
  → validar en aplicación o CHECK constraint con thresholds.

---

## 6. Storage de documentos del abogado

**Spec (§9.1):** Supabase Storage para `lawyer_profiles.certificates_url`.

**Pendiente:** Definir bucket, política de acceso (firmar URLs temporales
vs públicas), y formato del campo (¿una URL? ¿un array de URLs en JSONB?).
Actualmente `certificates_url` es `String?` — probablemente debería pasar
a `Json?` (lista de documentos: nombre + URL + tipo).

---

## 7. Variables de entorno faltantes

`.env` / `.env.local` debe tener al menos `DATABASE_URL` antes de poder
correr `prisma migrate dev`. Lista completa en §9.7 del documento maestro.

**Verificar antes del primer migrate:**
```bash
test -f .env || echo "FALTA .env con DATABASE_URL"
```

---

## 8. Rotación del password admin del seed

`prisma/seed.ts` crea `admin@nexojuridico.cl` con password temporal
`ChangeMe123!`. **Antes de ir a producción** debe rotarse — ver nota
en el código del seed.
