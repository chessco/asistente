<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CitaIA SaaS Platform (Pitaya Schedly)

Este repositorio contiene la evolución de CitaIA, transformada de un asistente simple a una plataforma SaaS multi-tenant profesional con IA avanzada y gestión de pagos.

## 🚀 Recent Updates (Fase de Escalamiento SaaS)

Hemos implementado una serie de mejoras de alto impacto para profesionalizar el sistema:

### 1. Infraestructura & Multi-tenancy
- **Migración a MySQL**: Base de datos robusta gestionada por Prisma para escalabilidad masiva.
- **Aislamiento de Clientes**: Soporte multi-tenant completo con configuración independiente por negocio.
- **Dynamic Services**: CRUD de servicios (nombre, duración, precio) directamente desde el panel administrativo.

### 2. Capa de Inteligencia Artificial Premium
- **Google Gemini Integration**: Motor fluído para extracción de entidades (nombre, servicio, fecha) desde lenguaje natural.
- **Toggle IA Premium**: Selector en el dashboard para alternar entre flujo estructurado (Original) y flujo Premium (LLM).
- **Auto-Gestión Inteligente**: El bot ahora maneja autónomamente:
  - **Cancelaciones**: Sincronización con Google Calendar para liberar espacios.
  - **Reprogramaciones**: Cambio de citas detectando la intención del usuario.

### 3. Operación & Monetización
- **Recordatorios Automáticos**: Servicio en background que simula el envío de WhatsApp 24h antes de la cita.
- **Pagos con Stripe (Mock)**: Generación dinámica de links de pago para depósitos de confirmación.
- **Admin Insights**: Visualización del estado de pago (PAGADO/PENDIENTE) y montos en el listado de citas.

### 4. UX & Branding
- **Dashboard Rediseñado**: Nueva interfaz tipo *glassmorphism* con pestañas de Citas, Servicios y Configuraicón.
- **Landing Page Senior**: Actualizada para destacar el valor de la IA fluida y los pagos integrados.

---

## ## Run Locally

**Prerequisites:**  Node.js & Docker (para MySQL)

1. **Instalar dependencias**:
   `npm install` en raiz, `/api` y `/web`
2. **Configurar variables**:
   Set `GEMINI_API_KEY` y `DATABASE_URL` en `api/.env`
3. **Sincronizar DB**:
   `npx prisma db push` dentro de `/api`
4. **Ejecutar**:
   `./start-dev.ps1`
