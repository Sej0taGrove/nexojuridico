# Guía de Despliegue en Vercel - NexoJurídico

Esta guía contiene el _checklist_ completo y los pasos para llevar NexoJurídico a producción utilizando la plataforma Vercel.

## ✅ Checklist de Variables de Entorno

En tu proyecto en Vercel -> Settings -> Environment Variables, asegúrate de tener añadidas TODAS las siguientes variables antes del primer despliegue exitoso:

| Nombre de Variable | Obligatorio | Descripción |
| :--- | :---: | :--- |
| `DATABASE_URL` | Sí | Cadena de conexión al pool de Supabase/PostgreSQL (`... ?schema=public`). |
| `JWT_SECRET` | Sí | String aleatorio (ideal base64 32 bytes) para Access Tokens. |
| `JWT_REFRESH_SECRET` | Sí | String aleatorio largo para persistencia de sesión. |

_(Nota: Agrega cualquier otra variable como URLs de Supabase Storage en el futuro si corresponde)_

---

## 🚀 Pasos de Despliegue desde cero

1. **Reparación y Envío a GitHub**:
   Asegúrate de que todo el código (incluyendo la generación de Prisma local) compila adecuadamente. Haz `git commit & git push` hacia tu rama maestra en GitHub.

2. **Crear Nuevo Proyecto en Vercel**:
   - Inicia sesión en [Vercel](https://vercel.com).
   - Haz clic en **Add New...** -> **Project**.
   - Haz _Import_ del repositorio de GitHub que contiene `NexoJurídico`.

3. **Configuración Inicial del Build**:
   - En *Framework Preset*, asegúrate de que diga **Next.js**.
   - *Build Command*: Debe autodetectar `npm run build`, y nuestro `package.json` ya tiene `prisma generate && next build`.
   - *Install Command*: Por defecto `npm install`.

4. **Cargar Variables de Entorno**:
   - En la sección **Environment Variables** añade `DATABASE_URL`, `JWT_SECRET` y `JWT_REFRESH_SECRET`.

5. **Clic en Deploy**:
   Vercel instalará dependencias, compilará y ejecutará el lint. Al finalizar, la app estará en línea.

---

## 🧐 Cómo verificar que el deploy funciona

Realiza estas comprobaciones básicas en el entorno de producción (tu nueva URL, e.g. `nexojuridico.vercel.app`):
1. **Acceso DB**: Entra con la cuenta _admin_ (`admin@nexojuridico.cl` - si enviaste un `prisma db seed` a tu BD remota). Si entras al dashboard, Prisma conectó bien al pool remoto de Supabase.
2. **Navegación**: Visita la página de registro de cliente y haz un simulacro de registro.
3. **Flujos**: Intenta que un cliente suba un caso. Revisa si en la base de datos cambian adecuadamente los _status_ de los casos y no saltan errores de CORS o Internal Server Error (500).

---

## 🌍 URL de Producción Actual

_Aún pendiente de generación:_
`https://nexojuridico.vercel.app` (Ejemplo una vez desplegado)
