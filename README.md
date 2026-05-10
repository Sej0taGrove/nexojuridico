# NexoJurídico ⚖️

> **Plataforma integral de conexión entre clientes y abogados expertos.**
> Simplifica la búsqueda de asesoría legal, gestión de casos y comunicación directa.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## 📖 Descripción

**NexoJurídico** es una plataforma diseñada para democratizar y agilizar el acceso a la justicia. Conecta a personas que necesitan asesoría legal con abogados especialistas verificados, ofreciendo un entorno seguro para la evaluación preliminar de casos, comunicación inicial y seguimiento de gestiones. Está diseñado tanto para particulares como para profesionales del derecho que buscan ampliar su cartera de clientes.

## ✨ Características principales

### 👤 Cliente
*   **Registro rápido** y seguro verificando identidad con RUT.
*   **Publicación de casos** guiada mediante un _wizard_ por áreas de especialidad legal.
*   **Dashboard personalizado** con estado en tiempo real de sus solicitudes.
*   **Gestión de notificaciones** al recibir interés de un abogado.

### 🧑‍⚖️ Abogado
*   **Perfil profesional experto**, destacando especialidades y validando credenciales.
*   **Feed de casos disponibles** en tiempo real.
*   **Sistema de aceptación/rechazo** para seleccionar clientes compatibles con su perfil.
*   **Panel de administración de cartera** (mis casos, casos completados o pendientes).

### 🛡️ Administrador
*   **Control de usuarios**, aprobación manual de certificaciones de abogados.
*   **Monitoreo del sistema**, visibilidad de todo el flujo y métricas clave.

## 🛠️ Stack tecnológico

| Tecnología | Propósito |
| :--- | :--- |
| **Next.js (App Router)** | Framework React principal para Frontend y Backend (Server Actions). |
| **TypeScript** | Tipado estático y seguridad del código. |
| **Tailwind CSS + Shadcn UI** | Estilos utilitarios y componentes base de alta calidad accesibles. |
| **Prisma ORM** | Modelado, migraciones y acceso seguro a la base de datos relacional. |
| **PostgreSQL (Supabase)**| Base de datos principal. |
| **Zod** | Validación de esquemas y _types_ cross-stack. |
| **Vitest** | Runner de testing unitario rápido y ligero. |

## 📂 Arquitectura

Estructura principal del repositorio:

```text
NexoJuridico/
├── prisma/               # Modelo de DB (schema.prisma), migraciones y seeders
├── src/
│   ├── app/              # Rutas Next.js (App Router), Server Pages & Layouts
│   ├── components/       # Componentes UI (Shadcn), formularios y layouts
│   ├── lib/              # Utilidades de negocio puro (testing), constantes y helpers
│   ├── server/           # Lógica de backend (Services/Repositories) y validaciones Zod
│   └── types/            # Tipos globales de TypeScript
└── docs/                 # Documentación técnica, API y guías de despliegue
```

## 📋 Requisitos previos

*   **Node.js 20+**
*   **PostgreSQL** (Preferentemente instanciado en Supabase o servicio en la nube similar)
*   **Cuenta de Vercel** (Para el despliegue automático del frontend/backend)

## 🚀 Instalación y configuración

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-organizacion/nexojuridico.git
   cd nexojuridico
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar el entorno:**
   Copia el archivo de ejemplo y rellena los datos con las credenciales correspondientes.
   ```bash
   cp .env.example .env
   ```

4. **Base de Datos (Prisma):**
   ```bash
   # Aplicar las migraciones a la DB configurada en DATABASE_URL
   npx prisma migrate dev
   
   # Poblar con datos base iniciales
   npx prisma db seed
   ```

5. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   *La app estará disponible en [http://localhost:3000](http://localhost:3000)*

## 🔐 Variables de entorno

| Variable | Descripción |
| :--- | :--- |
| `DATABASE_URL` | String de conexión a PostgreSQL (Connection Pooler recomendado) |
| `JWT_SECRET` | Llave secreta para firmar los Access Tokens cortos |
| `JWT_REFRESH_SECRET` | Llave secreta para firmar los Refresh Tokens largos |

## 📜 Scripts disponibles

*   `npm run dev`: Inicia el servidor de desarrollo NEXT.js.
*   `npm run build`: Genera el cliente de Prisma y compila la app optimizada.
*   `npm run lint`: Corre las validaciones de ESLint.
*   `npm test`: Ejecuta los tests unitarios con Vitest.
*   `npx prisma generate`: Genera el código para el cliente de Prisma.
*   `npx prisma migrate dev`: Ejecuta las migraciones de BD locales.
*   `npx prisma db seed`: Rellena la BD con datos base (roles, casos, especialidades).

## 👥 Usuarios de prueba

Tras ejecutar el `seed`, puedes utilizar estas cuentas:

| Rol | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@nexojuridico.cl` | `Admin123!` |
| **Abogado** | `carlos@abogado.cl` | `Abogado123!` |
| **Cliente** | *(Regístrate en la plataforma)* | - |

## 📊 Estado del proyecto

📌 **Versión Actual:** MVP Funcional.
✅ El flujo central, registro, login y creación/toma de casos están operativos.
⏳ *Para pendientes y futuras integraciones (Ej. Emails con Resend, Mode Dark), consulta la bitácora `docs/TODO.md`.*

## 👨‍💻 Equipo

*   **Sebastián Espinoza** – *Lead Developer & Arquitecto*
    Desarrollo completo del stack (Frontend, Backend, Base de Datos).
*   **Robinson García** – *QA & Code Review*
    Revisión exhaustiva de código, pruebas funcionales, optimizaciones UX/performance.
*   **Vicente Leyton** – *DevOps & Deployment*
    Preparación del deploy final, configuración Vercel, presentación a Italo Vignes.

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.
