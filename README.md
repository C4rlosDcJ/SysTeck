# SysTeck - Sistema de Gestión de Reparaciones

[![License: ISC](https://img.shields.io/badge/License-ISC-007ACC.svg)](https://opensource.org/licenses/ISC)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933.svg)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/Database-MySQL-4479A1.svg)](https://www.mysql.com/)

**SysTeck** es una solución profesional e integral diseñada para simplificar la gestión de talleres de reparación de dispositivos electrónicos. Desde el seguimiento de tickets hasta la gestión de inventario y clientes, SysTeck ofrece una interfaz moderna, rápida y eficiente.

---

## Características Principales

### Portal del Cliente
- **Panel de Control Personalizado:** Vista rápida de reparaciones activas y su estado.
- **Cotizaciones Inteligentes:** Solicita presupuestos detallados con carga de imágenes.
- **Seguimiento en Tiempo Real:** Consulta el progreso de tus dispositivos mediante número de ticket.
- **Notificaciones Automáticas:** Mantente informado en cada etapa del proceso.

### Panel Administrativo
- **Gestión de Reparaciones:** Control total del ciclo de vida del equipo (Recibido -> Diagnóstico -> Reparando -> Listo).
- **Base de Datos de Clientes:** Historial completo, contactos y estadísticas por usuario.
- **Catálogo de Servicios:** Administra precios base y tiempos estimados para diferentes tipos de dispositivos.
- **Reportes y Estadísticas:** Visualiza ingresos, reparaciones completadas y rendimiento mensual.
- **Configuración Flexible:** Personaliza días de garantía, moneda y más.

---

## Diseño y Experiencia de Usuario

- **Estética Premium:** Tema oscuro sofisticado con efectos de glassmorphism.
- **Interactividad:** Animaciones suaves y transiciones optimizadas con Framer Motion (si aplica) y Lucide Icons.
- **Responsivo:** Diseño adaptado al 100% para dispositivos móviles y tablets.

---

## Guía de Inicio Rápido

### Requisitos Previos
- **Node.js** (v18.x o superior)
- **MySQL** (v8.0.x)
- **Git**

### 1. Clonación del Repositorio
```bash
git clone https://github.com/tu-usuario/systeck.git
cd systeck
```

### 2. Configuración de la Base de Datos
1. Crea una base de datos llamada `systeck`.
2. Importa el esquema inicial:
```bash
mysql -u tu_usuario -p systeck < database/schema.sql
```

### 3. Backend (API)
```bash
cd backend
npm install
cp .env.example .env
# Configura tus variables en .env (DB_PASSWORD, JWT_SECRET, etc.)
npm run dev
```

### 4. Frontend (UI)
```bash
cd ../frontend
npm install
npm run dev
```

---

## Credenciales de Acceso (Demo)

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| **Admin** | `admin@systeck.com` | `admin123` |
| **Cliente** | `cliente@demo.com` | `cliente123` |

---

## Stack Tecnológico

- **Frontend:** React 19, Vite, Recharts, Lucide React, CSS Moderno.
- **Backend:** Node.js, Express, JWT, Express Validator.
- **Base de Datos:** MySQL (Pool de conexiones con `mysql2/promise`).
- **Utilidades:** Multer (Uploads), Bcrypt (Seguridad), Nodemailer.

---

## Estructura del Proyecto

```text
SysTeck/
├── frontend/           # Aplicación SPA (React)
├── backend/            # API RESTFUL (Node.js)
├── database/           # Scripts SQL y migraciones
└── uploads/            # Archivos multimedia subidos
```

---

## Roadmap - Próximas Funcionalidades

### 🔜 Métodos de Pago (En Desarrollo)
Se planea integrar múltiples pasarelas de pago para facilitar las transacciones:

| Proveedor | Estado | Descripción |
|-----------|--------|-------------|
| **Stripe** | 📋 Planeado | Pagos con tarjeta de crédito/débito internacionales |
| **PayPal** | 📋 Planeado | Opción de pago alternativa para clientes internacionales |
| **MercadoPago** | 📋 Planeado | Pagos locales en LATAM (OXXO, SPEI, tarjetas) |
| **Pagos en efectivo** | 📋 Planeado | Registro manual de pagos en tienda |

#### Funcionalidades de Pagos Planeadas:
- ✅ Anticipo parcial al momento de la recepción
- ✅ Pago del saldo restante al momento de entrega
- 📋 Notificaciones automáticas de pago recibido
- 📋 Facturación electrónica (CFDI para México)
- 📋 Historial de transacciones por cliente
- 📋 Reportes de ingresos y conciliación

### 🔮 Otras Mejoras Planeadas
- **Notificaciones Push** - Alertas en tiempo real al cliente sobre su reparación
- **Chat en Vivo** - Comunicación directa entre cliente y técnico
- **App Móvil Nativa** - Versión iOS/Android del portal del cliente
- **Inventario de Refacciones** - Control de stock y reordenamiento automático
- **Multi-sucursal** - Soporte para múltiples ubicaciones

---

## Licencia

Este proyecto está bajo la licencia **ISC**.

Desarrollado con pasión por **SysTeck** © 2026.
