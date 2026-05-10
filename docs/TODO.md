# NexoJurídico — Pendientes Técnicos y Backlog

Este documento clasifica las tareas y mejoras pendientes descubiertas durante el desarrollo, organizadas por prioridad.

---

## ⚡ P1: Crítico (Antes de producción / Piloto)

Las tareas de esta categoría deben ser implementadas obligatoriamente antes de que el primer usuario real utilice la aplicación en ambiente de producción.

1. **Rotación del password admin**: Cambiar la clave generada por defecto (`ChangeMe123!`) del usuario `admin@nexojuridico.cl` configurada en el seed de la base de datos.
2. **Índices de Base de Datos**: Ejecutar las migraciones pendientes que añaden los índices manuales (ej. GIN para JSON, índices compuestos de especialidades y regiones) documentados en `prisma/migrations/manual_indexes.sql`.
3. **Upload de Archivos a Supabase Storage**: Implementar la lógica para que los abogados suban las evidencias de título/colegiatura y que los clientes puedan subir documentos al crear el caso. Esto requiere configurar el storage bucket temporal/privado y modificar el endpoint/form de registro.
4. **Verificación de secretos de entorno**: Asegurar que en Vercel esten configuradas `DATABASE_URL` y variables JWT de uso intensivo y seguro (claves autogeneradas `openssl rand -base64 32`).
5. **Configuración de Cron Huérfanos**: Implementar un script / cron (`app/api/cron/orphans/route.ts` llamado por `vercel.json`) que ponga el `status` a `'huerfano'` para los casos de más de 7 días no tomados. Notificar automáticamente al administrador.

## 🚀 P2: Alta Prioridad (Post-lanzamiento temprano)

Estas tareas enriquecen funcionalmente el producto y previenen acumulación de deuda técnica. Pueden dejarse para una fase posterior al primer test piloto.

1. **Correos Transaccionales con Resend**: Configurar e implementar envíos de correos (plantillas HTML) para bienvenida de cuentas, notificación de caso tomado a cliente, y aviso de casos nuevos al administrador.
2. **Cambio de Contraseña y Recuperación**: Crear los flujos (endpoints y UI) para que un abogado/cliente pueda gestionar su clave (forgot password con token, password reset).
3. **Verificación de Email**: Asegurar el doble opt-in (link al correo del usuario) en el registro para evitar cuentas fantasma, antes de habilitar publicar casos.
4. **Triggers de Base de Datos**: Consolidar operaciones para actualización consistente como la lógica del campo `updated_at` nativo para todas las tablas, e inyectar el historial en `case_status_history` vía `Triggers BD` en vez de confiar la inserción puramente al servicio de Backend.
5. **Políticas RLS en Supabase**: Escalar el control de accesos usando _Row Level Security_ nativo de Postgres para `tenant_id` y usuario actual.
6. **Sentry (Monitoreo de Errores)**: Integrar Sentry para detectar excepciones en frontend y backend en tiempo real, especialmente vitales una vez haya tráfico constante.

## 🌟 P3: Nice to have (Mejoras futuras)

Oportunidades de crecimiento y mejoras no críticas.

1. **Dark Mode**: Terminar la implementación e introducción del toggle general dentro de la plataforma al 100% de los elementos UI, para comodidad del usuario.
2. **App Móvil (PWA / React Native)**: Evaluar convertir la interfaz web (que ya es mobile-first) en una Progressive Web App instalable, y posterior empaquetado para distribución en las tiendas iOS y Android.
3. **Soporte y Chat Directo**: Escalar la simple vista de contacto del caso a una mensajería en tiempo real abogado-cliente.
4. **Validaciones cruzadas en BD (CHECK constraints)**: Por ejemplo, forzar 1 sólo assignment de abogado sobre un caso a nivel de esquema (Postgres Constraint), validación obligatoria de `urgency_score` basada en fechas de la DB, u obligatoriedad de que exista _un único_ `is_primary=true` sobre la tabla de especialidades de los abogados.
