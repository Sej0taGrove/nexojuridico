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
