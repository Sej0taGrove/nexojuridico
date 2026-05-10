# Documentación de API - NexoJurídico

## Auth

- **`POST /api/auth/login`**
  - **Descripción**: Inicia sesión.
  - **Body**: `{ email, password, remember }`
  - **Response**: `{ user }` o cookie session
- **`POST /api/auth/logout`**
  - **Descripción**: Cierra la sesión activa.
- **`GET /api/auth/me`**
  - **Descripción**: Obtiene la información del usuario autenticado.
- **`PUT /api/auth/profile`**
  - **Descripción**: Edita el perfil del usuario.
- **`POST /api/auth/register/client`**
  - **Descripción**: Registro como cliente.
- **`POST /api/auth/register/lawyer`**
  - **Descripción**: Registro como abogado.

## Cases (Cliente)

- **`POST /api/cases`**
  - **Descripción**: Crea un caso nuevo.
  - **Body**: `{ specialtyId, responses, region, comuna, preferredContact, phone }`
- **`GET /api/cases`**
  - **Descripción**: Lista los casos del cliente.
- **`GET /api/cases/:id`**
  - **Descripción**: Detalles de un caso específico.
- **`POST /api/cases/:id/accept`**
  - **Descripción**: El cliente acepta a un abogado.
- **`POST /api/cases/:id/status`**
  - **Descripción**: Actualiza el estado del caso.

## Feed (Abogado)

- **`GET /api/feed`**
  - **Descripción**: Listado de todos los casos disponibles en el feed.
- **`GET /api/feed/:id`**
  - **Descripción**: Ver los detalles públicos de un caso en el feed.

## Lawyer (Area Abogado)

- **`GET /api/lawyer/cases`**
  - **Descripción**: Casos que han sido asignados al abogado actual.
- **`GET /api/lawyer/cases/:id`**
  - **Descripción**: Detalle del caso tomado.
- **`GET /api/lawyer/stats`**
  - **Descripción**: Estadísticas del panel del abogado.

## Notifications

- **`GET /api/notifications`**
  - **Descripción**: Lista las notificaciones del usuario.
- **`GET /api/notifications/unread-count`**
  - **Descripción**: Cuenta de notificaciones no leídas.
- **`POST /api/notifications/:id/read`**
  - **Descripción**: Marca una notificación como leída.

## Admin

- **`GET /api/admin/cases`**
  - **Descripción**: Lista todos los casos para el administrador.
- **`GET /api/admin/cases/:id`**
  - **Descripción**: Detalle caso (modo admin).
- **`POST /api/admin/cases/:id/close`**
  - **Descripción**: Forzar cierre del caso de forma administrativa.
- **`GET /api/admin/lawyers`**
  - **Descripción**: Lista los abogados.
- **`PUT /api/admin/lawyers/:id`**
  - **Descripción**: Aprueba o rechaza a un abogado, o modifica sus credenciales.
- **`GET /api/admin/orphan-cases`**
  - **Descripción**: Lista casos huérfanos sin abogado o sin asignación válida.
- **`GET /api/admin/sidebar-stats`**
  - **Descripción**: Estadísticas específicas de la barra lateral (cantidad pendientes, etc.).
- **`GET /api/admin/stats`**
  - **Descripción**: KPI globales para el panel admin principal.
