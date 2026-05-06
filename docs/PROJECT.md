# NexoJurídico — Documento Maestro del Proyecto

> **Fuente de verdad** para el desarrollo del marketplace bilateral de servicios legales.

**Versión:** 0.3 (Bloques 1, 2, 3, 4 y 6 cerrados)
**Fecha de inicio:** Abril 2026
**Cliente piloto:** Italo Vignes Santibañez
**Desarrollador:** Robinson García (modalidad individual)

---

## Tabla de Contenidos

1. [Visión del Producto](#1-visión-del-producto)
2. [Roles del Sistema (RBAC)](#2-roles-del-sistema-rbac)
3. [Flujo del Caso](#3-flujo-del-caso-estados-y-transiciones)
4. [Especialidades Legales](#4-especialidades-legales-catálogo-inicial)
5. [Sistema de Clasificación Automática](#5-sistema-de-clasificación-automática)
6. [Inventario Completo de Pantallas](#6-inventario-completo-de-pantallas)
7. [Sistema de Diseño](#7-sistema-de-diseño)
8. [Modelo de Datos](#8-modelo-de-datos)
9. [Arquitectura Técnica](#9-arquitectura-técnica)
10. [Diferencias respecto a la Documentación Original](#10-diferencias-respecto-a-la-documentación-original)
11. [Próximos Bloques](#11-próximos-bloques)

---

## 1. Visión del Producto

NexoJurídico es una plataforma web tipo **marketplace bilateral** que conecta automáticamente a ciudadanos con necesidades legales con abogados especialistas validados. El sistema elimina la fricción del primer contacto: el usuario expresa su problema en un formulario estructurado, el sistema clasifica y enruta el caso automáticamente, y los abogados reciben prospectos pre-calificados según su especialidad.

**Propuesta de valor para cada rol:**

- **Usuario (ciudadano):** Encuentra asesoría especializada sin tener que buscar por su cuenta. Su caso llega al abogado correcto.
- **Abogado:** Recibe casos filtrados por especialidad y urgencia, sin gastar horas en triaje manual.
- **Administrador (estudio jurídico):** Controla qué abogados acceden al marketplace y supervisa métricas de operación.

---

## 2. Roles del Sistema (RBAC)

### 2.1. Usuario Cliente (Ciudadano)

**Quién es:** Persona natural con una necesidad legal puntual.

**Qué puede hacer:**
- Registrarse con email y datos básicos
- Llenar un formulario dinámico para publicar su caso
- **Tener múltiples casos abiertos simultáneamente** (siempre que sean distintos)
- Ver el estado de cada uno de sus casos
- Recibir notificaciones cuando un abogado tome su caso
- Cancelar un caso mientras esté `en_cola`

**Qué NO puede hacer:**
- Buscar o contactar abogados directamente
- Ver el feed completo de casos de la plataforma
- Modificar el caso una vez publicado
- Crear casos duplicados (ver Sección 5.4)

### 2.2. Abogado

**Quién es:** Profesional del derecho validado por el administrador.

**Qué puede hacer:**
- Registrarse y enviar documentación para validación
- Configurar especialidades y zonas de cobertura
- Pausar/reactivar su disponibilidad
- Ver feed personalizado de casos
- Ver datos parciales del cliente antes de aceptar (nombre + comuna)
- Aceptar o rechazar casos
- Acceder a contacto completo solo al aceptar
- Cambiar estado del caso
- Ver dashboards de métricas (3 dashboards)

**Qué NO puede hacer:**
- Ver casos fuera de su especialidad
- Ver contacto antes de aceptar
- Modificar reglas del sistema
- Operar antes de validación

### 2.3. Administrador

**Quién es:** El cliente Italo Vignes (y otros estudios en multi-tenant).

**Qué puede hacer:**
- Validar/rechazar abogados
- Suspender o eliminar abogados
- Configurar reglas de matchmaking
- Ver métricas globales
- Intervenir en casos huérfanos
- Gestionar catálogo de especialidades
- Enviar comunicaciones

**Qué NO puede hacer:**
- Ver contenido detallado de casos sin justificación
- Suplantar otros roles

---

## 3. Flujo del Caso (Estados y Transiciones)

```
USUARIO PUBLICA → DETECCIÓN DUPLICADOS → CLASIFICACIÓN AUTOMÁTICA
        → EN COLA / FEED → ABOGADO ACEPTA → EN NEGOCIACIÓN
        → CERRADO GANADO / CERRADO PERDIDO

(Si nadie lo toma en X días → HUÉRFANO → admin interviene)
```

**Estados del caso:**

| Estado | Descripción |
|--------|-------------|
| `borrador` | Formulario iniciado, no enviado |
| `en_cola` | Clasificado, esperando ser tomado |
| `asignado` | Un abogado lo tomó |
| `en_negociacion` | Abogado y cliente se contactaron |
| `cerrado_ganado` | Servicio legal concretado |
| `cerrado_perdido` | Cliente desistió o no hubo acuerdo |
| `cancelado` | Cliente canceló antes de ser tomado |
| `huerfano` | Nadie lo tomó tras X días |

**Importante:** No existe mensajería interna. Todo contacto cliente-abogado es **fuera de la plataforma**.

---

## 4. Especialidades Legales (Catálogo Inicial)

| # | Especialidad | Ejemplos de casos |
|---|--------------|-------------------|
| 1 | Derecho Laboral | Despidos, finiquitos, accidentes, acoso |
| 2 | Derecho de Familia | Divorcios, alimentos, tuición, VIF, adopción |
| 3 | Derecho Civil | Contratos, responsabilidad, arrendamientos |
| 4 | Derecho Penal | Defensa, querellas, libertad condicional |
| 5 | Derecho Comercial | Sociedades, quiebras, propiedad intelectual |
| 6 | Derecho Tributario | Defensa SII, planificación, multas |
| 7 | Derecho Inmobiliario | Compraventa, regularización, CBR |
| 8 | Derecho Migratorio | Visas, residencias, expulsiones |
| 9 | Derecho Previsional | Pensiones, AFP, invalidez |

**Decisión técnica:** Especialidades se almacenan como tabla en BD para gestión dinámica.

---

## 5. Sistema de Clasificación Automática

### 5.1. Asignación de Especialidad

El formulario inicia con pregunta categorizadora que mapea a las 9 especialidades. Según la respuesta, se cargan sub-preguntas específicas.

### 5.2. Cálculo de Urgencia

Sistema de **puntaje ponderado** según respuestas.

**Niveles:**
- 🔴 ALTA — atención inmediata (días)
- 🟡 MEDIA — atención pronta (semanas)
- 🟢 BAJA — preventiva o sin presión

**Factores ALTA:** Plazos legales próximos, privación de libertad, daño irreparable, embargos/desalojos próximos.

**Factores MEDIA:** Conflictos activos sin plazo crítico, procesos en curso.

**Factores BAJA:** Asesoría preventiva, contratos sin presión.

### 5.3. Matchmaking

Caso entra al feed de abogados que cumplen TODOS:
1. Especialidad coincidente
2. Estado activo (validado, no suspendido)
3. Cobertura geográfica
4. Disponibilidad activada

Orden: urgencia desc + fecha publicación asc.

### 5.4. Detección de Casos Duplicados

**Nivel 1 (bloqueo duro):** Misma especialidad y subcategoría en caso activo del mismo cliente.

**Nivel 2 (similitud):** Comparación de respuestas, bloqueo si supera 80%.

**Nivel 3 (advertencia):** Modal si crea 3er caso de misma especialidad en 24h.

**Excepción:** Si caso anterior está cerrado/cancelado/huérfano, no aplica.

### 5.5. Privacidad: Visibilidad de Datos

**Antes de aceptar el abogado ve:**
- Nombre de pila (sin apellido)
- Comuna y región
- Descripción completa del caso
- Especialidad, urgencia, fecha

**Solo al aceptar se desbloquea:**
- Apellido completo, email, teléfono, RUT

---

## 6. Inventario Completo de Pantallas

### 6.1. Portal Público (13 pantallas)

| Código | Pantalla |
|--------|----------|
| P-01 | Landing page |
| P-02 | Cómo funciona — Para ciudadanos |
| P-03 | Cómo funciona — Para abogados |
| P-04 | Especialidades |
| P-05 | Sobre NexoJurídico |
| P-06 | Términos y Condiciones |
| P-07 | Política de Privacidad |
| P-08 | Login |
| P-09 | Registro — Cliente |
| P-10 | Registro — Abogado |
| P-11 | Recuperar contraseña |
| P-12 | Verificación de email |
| P-13 | 404 / Error |

### 6.2. Cliente (11 pantallas)

| Código | Pantalla |
|--------|----------|
| C-01 | Dashboard del cliente |
| C-02 | Publicar — Paso 1: Categoría |
| C-03 | Publicar — Paso 2: Formulario dinámico |
| C-04 | Publicar — Paso 3: Datos de contacto |
| C-05 | Publicar — Paso 4: Resumen y envío |
| C-06 | Mi caso — Detalle |
| C-07 | Mis casos |
| C-08 | Notificaciones |
| C-09 | Mi perfil |
| C-10 | Cancelar caso |
| C-11 | Modal de duplicado detectado |

### 6.3. Abogado (12 pantallas)

| Código | Pantalla |
|--------|----------|
| A-01 | Pendiente de validación |
| A-02 | Onboarding inicial |
| A-03 | Feed de casos |
| A-04 | Detalle de caso (preview) |
| A-05 | Detalle de caso (aceptado) |
| A-06 | Mis casos activos |
| A-07 | Mis casos cerrados |
| A-08 | Dashboard de métricas (3 dashboards) |
| A-09 | Configuración profesional |
| A-10 | Disponibilidad |
| A-11 | Mi perfil |
| A-12 | Notificaciones |

### 6.4. Administrador (13 pantallas)

| Código | Pantalla |
|--------|----------|
| D-01 | Dashboard general |
| D-02 | Validación de abogados |
| D-03 | Gestión de abogados |
| D-04 | Detalle de abogado |
| D-05 | Casos activos |
| D-06 | Casos huérfanos |
| D-07 | Métricas avanzadas |
| D-08 | Gestión de especialidades |
| D-09 | Reglas de matchmaking |
| D-10 | Gestión de usuarios |
| D-11 | Configuración del sistema |
| D-12 | Logs y auditoría |
| D-13 | Mi perfil admin |

### 6.5. Transversales (3 pantallas)

| Código | Pantalla |
|--------|----------|
| S-01 | Sin conexión / Error de servidor |
| S-02 | Pantalla de carga inicial |
| S-03 | Modal de confirmación genérico |

**TOTAL: 52 pantallas.** 10 críticas requieren más diseño:
P-01, P-08, P-09, P-10, C-02 a C-05, C-06, A-03, A-04, A-05, A-08, D-01, D-02, D-06.

---

## 7. Sistema de Diseño

### 7.1. Filosofía

Confianza por encima de creatividad. Información sobre decoración. Densidad calibrada. Cero "AI generic".

Referencias: Linear, Stripe Dashboard, Notion, Vercel, despachos jurídicos modernos (Cuatrecasas, Latham & Watkins).

### 7.2. Paleta de Colores

**Primario (Navy) — basado en #013565:**

```
navy-50    #E6EEF5   navy-500   #034F8C
navy-100   #CCE0EC   navy-600   #013565  ← BASE
navy-200   #99C0D9   navy-700   #012A52
navy-300   #6699BD   navy-800   #011F3D
navy-400   #336FA1   navy-900   #001428
```

**Neutrales:**

```
white      #FFFFFF   gray-500   #6B7585
gray-50    #FAFBFC   gray-600   #4A5462
gray-100   #F4F6F8   gray-700   #2F3744
gray-200   #E5E9EE   gray-800   #1C2330
gray-300   #CBD2DA   gray-900   #0F1420
gray-400   #9AA4B2
```

**Estados:**

```
SUCCESS (verde, urgencia BAJA)
  success-50  #ECFDF3   success-500  #12B76A   success-700  #027A48

WARNING (ámbar, urgencia MEDIA)
  warning-50  #FFFAEB   warning-500  #F79009   warning-700  #B54708

DANGER (rojo, urgencia ALTA)
  danger-50   #FEF3F2   danger-500   #F04438   danger-700   #B42318

INFO (azul cielo, ≠ marca, para tooltips)
  info-50     #EFF8FF   info-500     #2E90FA   info-700     #175CD3
```

### 7.3. Tipografía

**Familia:** Inter (gratis, optimizada para UI, multi-peso). Para números tabulares: `font-feature-settings: "tnum"`.

**Escala:**

```
text-xs   12px   labels, captions
text-sm   14px   secundario, badges
text-base 16px   cuerpo, inputs
text-lg   18px   destacado
text-xl   20px   H4
text-2xl  24px   H3
text-3xl  30px   H2
text-4xl  36px   H1 internos
text-5xl  48px   hero titles
text-6xl  60px   landing principal
```

**Pesos:** Regular (400), Medium (500), Semibold (600), Bold (700). Nunca 800/900.

**Line-height:** títulos 1.2, cuerpo 1.5, texto largo 1.65.

### 7.4. Espaciado

Múltiplos de 4px: space-1 (4px), space-2 (8px), space-3 (12px), space-4 (16px), space-6 (24px), space-8 (32px), space-12 (48px), space-16 (64px), space-20 (80px), space-24 (96px).

**Anchos máximos:**
- Texto largo: 720px
- Formularios: 560px
- Container landing: 1200px
- Container dashboards: 1440px

### 7.5. Bordes y Radios

```
radius-sm   4px    radius-xl   12px
radius-md   6px    radius-2xl  16px
radius-lg   8px    radius-full 9999px (píldoras)
```

**Default para botones y cards:** `radius-lg` (8px).

### 7.6. Sombras

```
shadow-xs    0 1px 2px rgba(15,23,42,0.05)
shadow-sm    0 1px 3px rgba(15,23,42,0.08)
shadow-md    0 4px 6px rgba(15,23,42,0.07)
shadow-lg    0 10px 15px rgba(15,23,42,0.10)
shadow-xl    0 20px 25px rgba(15,23,42,0.12)
shadow-focus 0 0 0 4px rgba(1,53,101,0.15)
```

Nunca usar negro puro en sombras.

### 7.7. Componentes Base

**Botón Primario:** fondo navy-600, texto white semibold, padding 12px 20px, radius 8px, hover navy-700.

**Botón Secundario:** fondo white, borde gray-300, texto gray-700.

**Botón Ghost:** transparente, texto navy-600, hover navy-50.

**Botón Destructivo:** fondo danger-500, texto white.

**Input:** fondo white, borde gray-300, padding 10px 14px, radius 6px. Focus: borde navy-500 + shadow-focus. Error: borde danger-500.

**Card:** fondo white, borde gray-200, radius 12px, padding 24px, shadow-sm.

**Badge:** fondo navy-50, texto navy-700 semibold xs mayúsculas, padding 4px 10px, radius full.

**Tabla:** header gray-50, padding 16px, hover de fila gray-50.

**Modal:** overlay rgba(15,23,42,0.5) con backdrop-blur, modal radius 16px, max-width 560px.

**Sidebar:** ancho 260px, item activo con borde izquierdo 3px navy-600.

### 7.8. Iconografía

**Lucide Icons** (lucide.dev). Tamaños: 16px, 20px, 24px, 32px+.

### 7.9. Accesibilidad WCAG 2.1 AA

Contraste mínimo 4.5:1, foco visible, navegación por teclado, targets 44x44px mínimo en móvil.

---

## 8. Modelo de Datos

### 8.1. Decisiones Estratégicas

**Multi-tenant desde el día 1:** Estrategia "Shared DB, shared schema con tenant_id". Para MVP solo un tenant (Italo).

**Formularios dinámicos con JSON Schema:** Tabla `cases` con campo `responses` JSONB. Estructura definida en `case_form_templates`.

**Soft delete:** Nunca borrar físicamente. Campo `deleted_at`.

### 8.2. Esquema (Tablas Principales)

**`tenants`** — Multi-tenancy
```sql
id UUID PK, slug, name, logo_url, primary_color, contact_email,
is_active, plan, settings JSONB, timestamps
```

**`users`** — Todos los roles
```sql
id UUID PK, tenant_id FK, email, password_hash, role (client|lawyer|admin),
first_name, last_name, rut, phone, avatar_url, email_verified_at,
is_active, last_login_at, timestamps, deleted_at
UNIQUE (tenant_id, email)
```

**`client_profiles`** — Datos extra del cliente
```sql
user_id PK FK, region, comuna, address, preferred_contact, contact_schedule
```

**`lawyer_profiles`** — Datos extra del abogado
```sql
user_id PK FK, bar_number, certificates_url, bio, years_experience, fee_range,
is_available, validation_status (pending|approved|rejected|suspended),
validated_at, validated_by, rejection_reason, rating_avg, cases_taken_count,
cases_won_count
```

**`specialties`** — Catálogo (9 inicial)
```sql
id SERIAL PK, code UNIQUE, name, description, icon, display_order, is_active
```

**`lawyer_specialties`** — N:M
```sql
lawyer_id FK, specialty_id FK, is_primary, years_in_area
PRIMARY KEY (lawyer_id, specialty_id)
```

**`lawyer_coverage`** — Zonas geográficas
```sql
id PK, lawyer_id FK, region, comuna (NULL = toda la región)
```

**`case_form_templates`** — Formularios dinámicos
```sql
id PK, specialty_id FK, version, schema JSONB, urgency_rules JSONB, is_active
```

**`cases`** — Tabla central
```sql
id UUID PK, tenant_id FK, client_id FK, specialty_id FK, template_id FK,
title, summary, responses JSONB, urgency, urgency_score, region, comuna,
status (borrador|en_cola|asignado|en_negociacion|cerrado_ganado|cerrado_perdido|cancelado|huerfano),
content_hash, published_at, assigned_at, closed_at, orphan_at, timestamps, deleted_at
```

**`case_assignments`** — Quién tomó el caso
```sql
id PK, case_id FK, lawyer_id FK, assigned_at, released_at, is_active
```

**`case_status_history`** — Audit log del flujo
```sql
id PK, case_id FK, from_status, to_status, changed_by FK, reason, metadata, created_at
```

**`notifications`** — Sistema de notificaciones
```sql
id PK, user_id FK, type, title, message, link, metadata, read_at, created_at
```

**`sessions`** — Refresh tokens
```sql
id PK, user_id FK, refresh_token UNIQUE, user_agent, ip_address, expires_at, revoked_at
```

**`audit_logs`** — Acciones críticas
```sql
id PK, tenant_id FK, actor_id FK, action, entity_type, entity_id, metadata, ip_address, created_at
```

### 8.3. Índices Críticos

```sql
-- Performance del feed del abogado
idx_cases_specialty_urgency (specialty_id, urgency, published_at) WHERE status = 'en_cola'

-- Detección de duplicados
idx_cases_content_hash (client_id, content_hash) WHERE status IN ('en_cola','asignado')

-- Búsqueda en respuestas JSONB
idx_cases_responses USING GIN (responses)

-- Notificaciones no leídas
idx_notifications_user_unread (user_id, read_at, created_at DESC)

-- Validación de abogados
idx_lawyer_validation (validation_status)
```

### 8.4. Triggers y Lógica en BD

- Auto-actualización de `updated_at` en todas las tablas
- Auto-registro en `case_status_history` cuando cambia `cases.status`
- Cron job hourly: marca casos con >7 días en `en_cola` como `huerfano`

### 8.5. Volumen Estimado

Año 1: 1-5 tenants, 500-2.000 clientes, 20-100 abogados, 1.000-5.000 casos.
Año 3: 50-100 tenants, 10.000-50.000 clientes, 500-2.000 abogados, 50.000-200.000 casos.

PostgreSQL maneja esto sin problemas con los índices definidos.

---

## 9. Arquitectura Técnica

### 9.1. Stack Definitivo

**Framework:** Next.js 15 (App Router) — fullstack, un solo codebase y deploy.

```
Frontend:
  - React 19, TypeScript estricto, Tailwind CSS 4
  - shadcn/ui (componentes base)
  - Lucide React (iconos)
  - Recharts (dashboards)
  - React Hook Form + Zod (formularios)
  - TanStack Query (cache cliente)

Backend (Next.js API Routes):
  - JWT (jose)
  - bcrypt (passwords)
  - Zod (validación inputs)

ORM: Prisma

DB: PostgreSQL en Supabase (free tier)

Infraestructura:
  - Vercel (hosting fullstack)
  - Resend (emails transaccionales)
  - Supabase Storage (documentos abogados)
  - Sentry (monitoreo errores)
  - GitHub (repo + CI/CD)
```

### 9.2. Estructura de Carpetas

```
nexojuridico/
├── docs/                    ← Documentación del proyecto
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
└── src/
    ├── app/
    │   ├── (public)/        ← Layout público (landing, login, etc.)
    │   ├── (cliente)/       ← Layout cliente autenticado
    │   ├── (abogado)/       ← Layout abogado
    │   ├── (admin)/         ← Layout admin
    │   ├── api/             ← Endpoints REST
    │   ├── layout.tsx
    │   └── globals.css
    ├── components/
    │   ├── ui/              ← shadcn/ui
    │   ├── layout/          ← Sidebar, Topbar, Footer
    │   ├── shared/          ← UrgencyBadge, CaseCard, etc.
    │   ├── forms/           ← DynamicCaseForm, etc.
    │   └── dashboards/
    ├── lib/                 ← Utilidades técnicas
    │   ├── prisma.ts
    │   ├── auth.ts
    │   ├── tenant.ts
    │   ├── matchmaking.ts
    │   ├── urgency.ts
    │   ├── duplicates.ts
    │   └── email.ts
    ├── hooks/               ← Custom React Hooks
    ├── middleware.ts
    ├── types/               ← Tipos TS globales
    └── server/
        ├── services/        ← Lógica de negocio
        ├── repositories/    ← Acceso a datos
        └── validators/      ← Schemas de Zod
```

### 9.3. Endpoints REST Principales

```
AUTH
  POST   /api/auth/register/{cliente|abogado}
  POST   /api/auth/login
  POST   /api/auth/refresh
  POST   /api/auth/logout
  POST   /api/auth/verify-email
  POST   /api/auth/forgot-password
  POST   /api/auth/reset-password

CASES
  GET    /api/cases              (filtrado por rol)
  POST   /api/cases              (cliente crea)
  GET    /api/cases/:id          (con anonimización si abogado)
  PATCH  /api/cases/:id
  POST   /api/cases/:id/accept   (abogado acepta)
  POST   /api/cases/:id/check-duplicate
  GET    /api/cases/:id/history

LAWYERS
  GET    /api/lawyers/me
  PATCH  /api/lawyers/me
  PATCH  /api/lawyers/me/availability
  POST   /api/lawyers/me/specialties
  POST   /api/lawyers/me/coverage
  
  ADMIN ONLY:
  GET    /api/lawyers
  GET    /api/lawyers/pending
  POST   /api/lawyers/:id/{approve|reject|suspend}

SPECIALTIES
  GET    /api/specialties
  GET    /api/specialties/:id/template

NOTIFICATIONS
  GET    /api/notifications
  PATCH  /api/notifications/:id/read
  POST   /api/notifications/read-all

METRICS
  GET    /api/metrics/admin/{overview|specialties}
  GET    /api/metrics/lawyer/{personal|conversion}
```

**Convenciones:**
- JWT en todos excepto `/auth/*` y `/specialties` (GET público)
- Respuesta éxito: `{ data, meta }`
- Respuesta error: `{ error: { code, message, details } }`
- Paginación: `?page=1&limit=20`

### 9.4. Auth Flow

```
LOGIN → access_token (15 min, en memoria) + refresh_token (7 días, httpOnly cookie)
REQUEST → Header: Authorization: Bearer <access_token>
EXPIRADO → /api/auth/refresh con cookie → nuevo access_token
LOGOUT → revoca refresh_token en BD (sessions.revoked_at = NOW())
```

JWT payload: `{ id, role, tenant_id }` + estándar (iat, exp).

### 9.5. Tenant Resolution

Middleware extrae `tenant_id` del JWT y lo adjunta al request. **Todas las queries de Prisma deben filtrar por `tenant_id`.** Para evitar olvidos, implementaremos un `PrismaClient` extendido que automáticamente lo agregue (Row Level Security en código).

### 9.6. Algoritmos Clave

**Matchmaking:**
1. Validar abogado (approved, available)
2. Obtener especialidades + cobertura del abogado
3. Query cases: tenant_id + status='en_cola' + specialty_id IN + región/comuna match
4. Ordenar por urgency_score DESC, published_at ASC
5. Anonimizar datos del cliente

**Cálculo de urgencia:**
1. Obtener template activo de la especialidad
2. Aplicar reglas: para cada regla, si matchea condiciones, score = max(score, rule.score)
3. Determinar nivel según thresholds (alta/media/baja)

**Detección de duplicados:**
1. Hash de respuestas clave del nuevo caso
2. Buscar casos activos del cliente en misma especialidad
3. Si hay match exacto de hash → bloqueo duro
4. Si similitud >= 80% → bloqueo
5. Si tiene 2+ casos en 24h → advertencia (soft)

### 9.7. Variables de Entorno

```bash
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@nexojuridico.cl
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
SENTRY_DSN=...
DEFAULT_TENANT_SLUG=vignes
```

### 9.8. Convenciones de Código

- TypeScript estricto
- ESLint + Prettier
- Componentes: PascalCase
- Hooks: camelCase con prefijo `use`
- Tipos: PascalCase
- Constants: SCREAMING_SNAKE_CASE
- Comentarios en español, código en inglés

### 9.9. Plan de Testing

```
NIVEL 1 — Unit Tests (Vitest)
  server/services/, lib/, server/validators/

NIVEL 2 — Integration Tests (Vitest + supertest)
  api/auth/*, api/cases/*, api/lawyers/*

NIVEL 3 — E2E Tests (Playwright)
  Flows completos de cliente, abogado y admin
```

---

## 10. Diferencias respecto a la Documentación Original

| Original | Actual | Justificación |
|----------|--------|---------------|
| RBAC 2 roles | RBAC 3 roles (+ admin) | Esencial para validación de abogados |
| Multi-tenant Fase 5 | Multi-tenant día 1 | Refactor a posteriori es muy costoso |
| Matchmaking simple | Auto + clasificación + urgencia calculada | Mayor escalabilidad |
| Sin reglas anti-duplicados | 3 niveles de detección | Calidad de datos |
| Datos cliente abiertos | Anonimización parcial | Privacidad |
| React + Express | Next.js fullstack | Productividad para dev solo |
| Express separado | API Routes integradas | Simpleza de deploy |

---

## 11. Próximos Bloques

- [x] **Bloque 1:** Definición de flujos y roles
- [x] **Bloque 2:** Inventario de pantallas
- [x] **Bloque 3:** Sistema de diseño
- [x] **Bloque 4:** Modelo de datos
- [x] **Bloque 6:** Arquitectura técnica
- [ ] **Bloque 5:** Mockups visuales (próxima semana, cuando se renueve Claude Design)
- [ ] **Bloque 7:** Implementación con Claude Code

---

*Documento vivo. Última actualización: cierre de Bloques 3, 4 y 6.*
