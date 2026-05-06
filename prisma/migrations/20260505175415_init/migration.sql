-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('client', 'lawyer', 'admin');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('borrador', 'en_cola', 'asignado', 'en_negociacion', 'cerrado_ganado', 'cerrado_perdido', 'cancelado', 'huerfano');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('alta', 'media', 'baja');

-- CreateEnum
CREATE TYPE "PreferredContact" AS ENUM ('email', 'phone', 'whatsapp');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "primary_color" TEXT,
    "contact_email" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "plan" TEXT NOT NULL DEFAULT 'pilot',
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "rut" TEXT,
    "phone" TEXT,
    "avatar_url" TEXT,
    "email_verified_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_profiles" (
    "user_id" UUID NOT NULL,
    "region" TEXT NOT NULL,
    "comuna" TEXT NOT NULL,
    "address" TEXT,
    "preferred_contact" "PreferredContact" NOT NULL DEFAULT 'email',
    "contact_schedule" TEXT,

    CONSTRAINT "client_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "lawyer_profiles" (
    "user_id" UUID NOT NULL,
    "bar_number" TEXT,
    "certificates_url" TEXT,
    "bio" TEXT,
    "years_experience" INTEGER,
    "fee_range" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT false,
    "validation_status" "ValidationStatus" NOT NULL DEFAULT 'pending',
    "validated_at" TIMESTAMP(3),
    "validated_by" UUID,
    "rejection_reason" TEXT,
    "rating_avg" DOUBLE PRECISION,
    "cases_taken_count" INTEGER NOT NULL DEFAULT 0,
    "cases_won_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lawyer_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "specialties" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "display_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lawyer_specialties" (
    "lawyer_id" UUID NOT NULL,
    "specialty_id" INTEGER NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "years_in_area" INTEGER,

    CONSTRAINT "lawyer_specialties_pkey" PRIMARY KEY ("lawyer_id","specialty_id")
);

-- CreateTable
CREATE TABLE "lawyer_coverage" (
    "id" SERIAL NOT NULL,
    "lawyer_id" UUID NOT NULL,
    "region" TEXT NOT NULL,
    "comuna" TEXT,

    CONSTRAINT "lawyer_coverage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_form_templates" (
    "id" SERIAL NOT NULL,
    "specialty_id" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "schema" JSONB NOT NULL,
    "urgency_rules" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "case_form_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "specialty_id" INTEGER NOT NULL,
    "template_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "responses" JSONB NOT NULL,
    "urgency" "UrgencyLevel",
    "urgency_score" INTEGER,
    "region" TEXT,
    "comuna" TEXT,
    "status" "CaseStatus" NOT NULL DEFAULT 'borrador',
    "content_hash" TEXT,
    "published_at" TIMESTAMP(3),
    "assigned_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "orphan_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_assignments" (
    "id" SERIAL NOT NULL,
    "case_id" UUID NOT NULL,
    "lawyer_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "released_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "case_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_status_history" (
    "id" SERIAL NOT NULL,
    "case_id" UUID NOT NULL,
    "from_status" "CaseStatus",
    "to_status" "CaseStatus" NOT NULL,
    "changed_by" UUID NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "metadata" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "metadata" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "lawyer_profiles_validation_status_idx" ON "lawyer_profiles"("validation_status");

-- CreateIndex
CREATE UNIQUE INDEX "specialties_code_key" ON "specialties"("code");

-- CreateIndex
CREATE INDEX "lawyer_specialties_specialty_id_idx" ON "lawyer_specialties"("specialty_id");

-- CreateIndex
CREATE INDEX "lawyer_coverage_lawyer_id_idx" ON "lawyer_coverage"("lawyer_id");

-- CreateIndex
CREATE INDEX "lawyer_coverage_region_comuna_idx" ON "lawyer_coverage"("region", "comuna");

-- CreateIndex
CREATE INDEX "case_form_templates_specialty_id_is_active_idx" ON "case_form_templates"("specialty_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "case_form_templates_specialty_id_version_key" ON "case_form_templates"("specialty_id", "version");

-- CreateIndex
CREATE INDEX "cases_tenant_id_idx" ON "cases"("tenant_id");

-- CreateIndex
CREATE INDEX "cases_client_id_idx" ON "cases"("client_id");

-- CreateIndex
CREATE INDEX "cases_specialty_id_idx" ON "cases"("specialty_id");

-- CreateIndex
CREATE INDEX "cases_status_idx" ON "cases"("status");

-- CreateIndex
CREATE INDEX "case_assignments_case_id_idx" ON "case_assignments"("case_id");

-- CreateIndex
CREATE INDEX "case_assignments_lawyer_id_idx" ON "case_assignments"("lawyer_id");

-- CreateIndex
CREATE INDEX "case_assignments_lawyer_id_is_active_idx" ON "case_assignments"("lawyer_id", "is_active");

-- CreateIndex
CREATE INDEX "case_status_history_case_id_idx" ON "case_status_history"("case_id");

-- CreateIndex
CREATE INDEX "case_status_history_changed_by_idx" ON "case_status_history"("changed_by");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_key" ON "sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "audit_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lawyer_profiles" ADD CONSTRAINT "lawyer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lawyer_profiles" ADD CONSTRAINT "lawyer_profiles_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lawyer_specialties" ADD CONSTRAINT "lawyer_specialties_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "lawyer_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lawyer_specialties" ADD CONSTRAINT "lawyer_specialties_specialty_id_fkey" FOREIGN KEY ("specialty_id") REFERENCES "specialties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lawyer_coverage" ADD CONSTRAINT "lawyer_coverage_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "lawyer_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_form_templates" ADD CONSTRAINT "case_form_templates_specialty_id_fkey" FOREIGN KEY ("specialty_id") REFERENCES "specialties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_specialty_id_fkey" FOREIGN KEY ("specialty_id") REFERENCES "specialties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "case_form_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_assignments" ADD CONSTRAINT "case_assignments_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_assignments" ADD CONSTRAINT "case_assignments_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_status_history" ADD CONSTRAINT "case_status_history_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_status_history" ADD CONSTRAINT "case_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- =============================================================================
-- Índices avanzados — NexoJurídico
-- =============================================================================
-- Estos índices NO se pueden expresar en schema.prisma (índices parciales con
-- WHERE, GIN sobre JSONB). Hay que añadirlos manualmente a la migración SQL
-- generada por `prisma migrate dev` antes de aplicarla a la BD, O ejecutarlos
-- de forma independiente con `psql $DATABASE_URL -f prisma/migrations/manual_indexes.sql`.
--
-- Referencia: docs/PROJECT.md §8.3
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. idx_cases_specialty_urgency
-- -----------------------------------------------------------------------------
-- Soporta el feed del abogado (§9.6 Matchmaking): query por especialidad +
-- estado='en_cola' ordenado por urgencia DESC, fecha publicación ASC.
-- Es PARCIAL: solo casos en cola, lo que mantiene el índice pequeño y rápido
-- aun con millones de casos cerrados históricos.
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cases_specialty_urgency
  ON cases (specialty_id, urgency, published_at)
  WHERE status = 'en_cola';


-- -----------------------------------------------------------------------------
-- 2. idx_cases_content_hash
-- -----------------------------------------------------------------------------
-- Soporta detección de duplicados Nivel 1 (§5.4): bloqueo duro cuando un
-- mismo cliente intenta crear un caso con idéntico hash de respuestas en una
-- especialidad cuyo caso anterior aún está activo.
-- PARCIAL: solo casos activos (en_cola o asignado). Casos cerrados/cancelados
-- /huérfanos NO bloquean (un cliente puede republicar un caso resuelto).
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cases_content_hash
  ON cases (client_id, content_hash)
  WHERE status IN ('en_cola', 'asignado');


-- -----------------------------------------------------------------------------
-- 3. idx_cases_responses (GIN)
-- -----------------------------------------------------------------------------
-- Permite buscar dentro del JSONB `responses` (campo dinámico del formulario)
-- para reportes / filtros administrativos sin escanear toda la tabla.
-- GIN es el tipo de índice de PostgreSQL para JSONB y soporta los operadores
-- @>, ?, ?&, ?| de forma eficiente.
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cases_responses
  ON cases USING GIN (responses);


-- -----------------------------------------------------------------------------
-- 4. idx_notifications_user_unread
-- -----------------------------------------------------------------------------
-- Soporta el badge "tienes N notificaciones sin leer" del topbar y la vista
-- de notificaciones del usuario, ordenando por más recientes primero.
-- PARCIAL: solo no-leídas (read_at IS NULL). El índice se mantiene pequeño
-- porque la mayoría de notificaciones se leen rápido y se filtran fuera.
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;


-- =============================================================================
-- Cómo aplicar estos índices
-- =============================================================================
-- Opción A (recomendada) — incluir en la migración inicial:
--   1. Generar la migración:  npx prisma migrate dev --name init --create-only
--   2. Abrir el archivo generado en prisma/migrations/<timestamp>_init/migration.sql
--   3. Pegar el contenido de ESTE archivo al final de migration.sql
--   4. Aplicar:  npx prisma migrate dev
--
-- Opción B — aplicar fuera de Prisma (BD existente):
--   psql "$DATABASE_URL" -f prisma/migrations/manual_indexes.sql
--
-- Opción C — usar `prisma db execute` (Prisma 5+):
--   npx prisma db execute --file prisma/migrations/manual_indexes.sql --schema prisma/schema.prisma
-- =============================================================================
