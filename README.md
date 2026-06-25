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
- **Cotizaciones Inteligentes:** Solicita presupuestos detallados con carga de imágenes de los dispositivos.
- **Seguimiento en Tiempo Real:** Consulta el progreso de tus dispositivos mediante número de ticket.
- **Notificaciones Automáticas:** Mantente informado en cada etapa del proceso.

### Panel Administrativo y Módulos de Control
- **Gestión de Reparaciones:** Control total del ciclo de vida del equipo (Recibido -> Diagnóstico -> Reparando -> Listo).
- **Punto de Venta (POS):** Módulo para facturación y cobro rápido de servicios, refacciones y ventas directas.
- **Control de Inventario:** Catálogo de productos, categorías, niveles de stock, SKU y códigos de barras.
- **Base de Datos de Clientes:** Historial completo de reparaciones, cotizaciones, compras realizadas y estadísticas detalladas.
- **Catálogo de Servicios:** Administración de precios base y tiempos estimados por categoría de dispositivo.
- **Reportes y Estadísticas:** Análisis detallado de ingresos, reparaciones completadas y rendimiento mensual.
- **Configuración General:** Personalización de datos del negocio, logotipo, días de garantía, moneda y políticas.

---

## Diseño y Experiencia de Usuario

- **Soporte Multi-tema:** Alternancia dinámica entre Tema Claro y Tema Oscuro.
- **Estética Premium:** Efectos de glassmorphism adaptativos y paleta de colores cohesiva.
- **Interactividad Avanzada:** Animaciones fluidas basadas en microinteracciones y transiciones modernas.
- **Responsivo:** Diseño completamente adaptado para smartphones, tablets y computadoras de escritorio.

---

## Guía de Inicio Rápido

### Requisitos Previos
- **Node.js** (v18.x o superior)
- **MySQL** (v8.0.x o compatible, soporta conexiones SSL)
- **Git**

### 1. Clonación del Repositorio
```bash
git clone https://github.com/C4rlosDcJ/SysTeck.git
cd systeck
```

### 2. Configuración de la Base de Datos
1. Crea una base de datos en tu servidor local o remoto (por ejemplo en Aiven o RDS).
2. Importa el esquema inicial de tablas e índices desde la carpeta correspondiente:
```bash
mysql -u tu_usuario -p nombre_base_datos < database/schema.sql
```

### 3. Backend (API)
1. Instala las dependencias:
```bash
cd backend
npm install
```
2. Crea un archivo `.env` tomando como base `.env.example` y rellena las variables de entorno necesarias:
   - Configuración de base de datos (host, usuario, contraseña, puerto, nombre de base de datos)
   - Ajustes de SSL si tu servidor MySQL lo requiere (`MYSQL_ATTR_SSL_CA` o configuración equivalente en el código)
   - Secretos para JWT y firmas de sesión
3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

### 4. Frontend (UI)
1. Navega al directorio del cliente e instala las dependencias:
```bash
cd ../frontend
npm install
```
2. Configura las variables de entorno correspondientes para la API (por ejemplo `VITE_API_URL`).
3. Inicia el servidor de desarrollo local:
```bash
npm run dev
```

---

## Stack Tecnológico

- **Frontend:** React, Vite, Recharts, Lucide Icons, Vanilla CSS con variables de diseño personalizadas.
- **Backend:** Node.js, Express, JWT, Express Validator, CORS Dinámico.
- **Base de Datos:** MySQL (Pool de conexiones con `mysql2/promise` y soporte de certificados SSL).
- **Despliegue:** Preparado para Vercel (frontend) y Render (backend).

---

## Estructura del Proyecto

```text
SysTeck/
├── frontend/           # SPA en React y estilos CSS interactivos
├── backend/            # API REST en Node.js y Express
├── database/           # Archivos de inicialización SQL
└── uploads/            # Archivos locales de imágenes (soporte multimedia)
```

---

## Licencia

Este proyecto está bajo la licencia **ISC**.

Desarrollado para **SysTeck** © 2026.
