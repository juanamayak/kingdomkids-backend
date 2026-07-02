# 📋 Análisis Arquitectónico del Proyecto KingdomKids

> **Documento generado:** 27 de Junio de 2026  
> **Tipo:** Auditoría Técnica y Análisis de Estado Actual  
> **Autor:** Arquitectura de Software — Consultoría Cloud  
> **Versión:** 1.0

---

## 📑 Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Visión General del Sistema](#2-visión-general-del-sistema)
3. [Inventario Tecnológico](#3-inventario-tecnológico)
4. [Análisis del Backend (kingdomkids-backend)](#4-análisis-del-backend)
5. [Análisis del Frontend Admin (kingdomkids-admin)](#5-análisis-del-frontend-admin)
6. [Análisis del Frontend Registro (kingdomkids-register)](#6-análisis-del-frontend-registro)
7. [Modelo de Datos](#7-modelo-de-datos)
8. [Mapa de Endpoints (API REST)](#8-mapa-de-endpoints-api-rest)
9. [Hallazgos Críticos y Deuda Técnica](#9-hallazgos-críticos-y-deuda-técnica)
10. [Matriz de Riesgos](#10-matriz-de-riesgos)
11. [Recomendaciones de Mejora](#11-recomendaciones-de-mejora)
12. [Roadmap Sugerido de Modernización](#12-roadmap-sugerido-de-modernización)

---

## 1. Resumen Ejecutivo

**KingdomKids** es un sistema de gestión para el registro y control de asistencia (check-in / check-out) de niños en un programa eclesiástico. El sistema está compuesto por **3 repositorios independientes** que conforman una arquitectura de tipo monolito distribuido:

| Repositorio | Propósito | Stack Principal |
|---|---|---|
| `kingdomkids-backend` | API REST | Node.js + Express + Sequelize + MySQL |
| `kingdomkids-admin` | Panel de administración (backoffice) | Angular 19 + PrimeNG + TailwindCSS |
| `kingdomkids-register` | Formulario público de registro + Scanner QR | Angular 19 + PrimeNG + TailwindCSS |

El proyecto se encuentra en un **estado funcional temprano** (MVP) con deuda técnica significativa heredada de un template genérico (`ja-node-backend-template` / `ja-angular-frontend-template`). Existen oportunidades claras de mejora en seguridad, estructura, testing y preparación para producción.

**Dominio de producción:** `api.mundodefeplaya.org:3035`

---

## 2. Visión General del Sistema

### 2.1 Diagrama de Arquitectura Actual

```
┌─────────────────────┐     ┌──────────────────────┐
│  kingdomkids-admin   │     │ kingdomkids-register  │
│  (Angular 19)        │     │ (Angular 19)          │
│  Panel Backoffice    │     │ Formulario Público    │
│  + JWT Auth          │     │ + QR Scanner          │
└─────────┬───────────┘     └──────────┬────────────┘
          │ HTTP/HTTPS                  │ HTTP/HTTPS
          │                             │
          └──────────┬──────────────────┘
                     │
          ┌──────────▼──────────┐
          │ kingdomkids-backend  │
          │ (Express + Node.js)  │
          │ Puerto: 8000 (dev)   │
          │ Puerto: 3035 (prod)  │
          └──────────┬──────────┘
                     │ Sequelize ORM
          ┌──────────▼──────────┐
          │      MySQL           │
          │  (Base de Datos)     │
          └─────────────────────┘
          
          ┌─────────────────────┐
          │  Sistema de Archivos │
          │  /files/qrs/*.jpg    │
          │  (Códigos QR)        │
          └─────────────────────┘
```

### 2.2 Flujos Principales

| # | Flujo | Descripción |
|---|---|---|
| 1 | **Registro de Niño** | Padre/tutor llena formulario → se crea registro (kid + parents + authorized_person) → se genera QR → se almacena en filesystem |
| 2 | **Check-in** | Escaneo de QR → se identifica al niño → se registra entrada con timestamp |
| 3 | **Check-out** | Desde admin → se marca la salida del niño con timestamp |
| 4 | **Consulta de registros** | Admin visualiza tabla de niños registrados con filtros por edad |
| 5 | **Reportes Excel** | Admin genera reporte Excel filtrado por edad con datos completos |
| 6 | **Login Administrativo** | Autenticación con JWT (RS256) para acceso al backoffice |

---

## 3. Inventario Tecnológico

### 3.1 Backend

| Categoría | Tecnología | Versión | Observación |
|---|---|---|---|
| Runtime | Node.js | No especificado | ⚠️ Sin `.nvmrc` ni `engines` |
| Lenguaje | TypeScript | ^4.6.3 | ⚠️ Versión desactualizada (actual: 5.x) |
| Framework HTTP | Express | ^4.17.3 | ⚠️ Sin Express 5.x |
| ORM | Sequelize | ^6.19.0 | Funcional pero verbose |
| Base de Datos | MySQL | Via mysql2 ^2.3.3 | Relacional |
| Autenticación | JWT (RS256) | jsonwebtoken ^8.5.1 | Par de claves RSA en `/src/keys/` |
| Encriptación | Cryptr | ^6.0.3 | Cifrado simétrico para payload |
| Hashing | bcrypt | ^5.0.1 | Para contraseñas |
| Validación | express-validator + validator | ^6.14.2 | Validación manual |
| QR Codes | qrcode | ^1.5.0 | Generación de QR como imágenes |
| Email | nodemailer + handlebars | ^6.9.13 | Templates `.hbs` |
| Excel | exceljs | ^4.3.0 | Generación de reportes |
| Seguridad HTTP | helmet | ^5.1.0 | Headers de seguridad |
| File Upload | express-fileupload | ^1.4.0 | Manejo de archivos |
| IDs únicos | uuid | ^8.3.2 | UUIDs v4 |

### 3.2 Frontend Admin

| Categoría | Tecnología | Versión |
|---|---|---|
| Framework | Angular | ^19.2.14 |
| UI Components | PrimeNG | ^19.1.3 |
| CSS Framework | TailwindCSS | ^3.4.4 |
| Theme Engine | @primeng/themes (Aura) | ^19.1.3 |
| HTTP | HttpClient + interceptor JWT | Built-in |
| Fechas | moment.js | ^2.29.4 |
| PDF | jspdf + html2canvas | ^3.0.1 / ^1.4.1 |
| Alertas | sweetalert2 | ^11.22.0 |
| Firma digital | signature_pad | ^5.0.7 |
| Teléfono | intl-tel-input + ngx-intl-tel-input | ^19.5.7 / ^17.0.0 |

### 3.3 Frontend Registro

| Categoría | Tecnología | Versión |
|---|---|---|
| Framework | Angular | ^19.2.0 |
| UI Components | PrimeNG | ^19.1.3 |
| CSS Framework | TailwindCSS | ^3.4.17 |
| QR Scanner | html5-qrcode + ngx-scanner-qrcode | ^2.3.8 / 1.7.5 |
| Fechas | moment.js | ^2.30.1 |
| PDF | jspdf + html2canvas | ^3.0.1 / ^1.4.1 |
| Alertas | sweetalert2 | ^11.22.2 |

---

## 4. Análisis del Backend

### 4.1 Estructura de Directorios

```
src/
├── app.ts                          # Entry point
├── config/
│   ├── server.ts                   # Configuración Express (clase Server)
│   ├── database.ts                 # Conexión Sequelize → MySQL
│   └── relationships.ts           # Relaciones entre modelos
├── controllers/
│   ├── register.controller.ts     # CRUD de niños (474 líneas) ⚠️
│   ├── checkin_and_out.controller.ts
│   ├── session.controller.ts      # Login
│   └── example.controller.ts      # Template residual
├── models/
│   ├── kids.model.ts
│   ├── parents.model.ts
│   ├── authorized.model.ts
│   ├── checkin_and_out.model.ts
│   ├── administrator.model.ts
│   └── example.model.ts           # Template residual
├── queries/
│   ├── kids.query.ts
│   ├── parents.query.ts
│   ├── authorized.query.ts
│   ├── checkin_and_out.query.ts
│   ├── administrators.queries.ts
│   └── example.query.ts           # Template residual
├── helpers/
│   ├── files.ts                    # Manejo de archivos y QR
│   ├── mailer.ts                   # Envío de emails
│   ├── payload.ts                  # Creación de JWT
│   └── validate.ts                 # Validaciones manuales
├── interfaces/
│   ├── register.interface.ts       # ⚠️ Desactualizada vs modelo real
│   └── checkin_and_out.interface.ts
├── enums/
│   └── json-response.ts           # HTTP status codes
├── keys/
│   ├── private.pem                 # ⚠️ Clave privada en repo
│   └── public.pem
└── routes/
    └── routes.ts                   # Todas las rutas en un solo archivo
```

### 4.2 Patrón Arquitectónico

El backend sigue un patrón **MVC modificado** con una capa adicional de `queries`:

```
Request → Routes → Controller → Query → Model → Database
                        ↓
                    Helpers (validate, files, mailer, payload)
```

**Observaciones:**
- No hay capa de **servicios** (business logic acoplada al controller)
- No hay **middleware de autenticación** en las rutas (AuthGuard inexistente)
- No hay **middleware de validación** por ruta (validación manual en controllers)
- La capa `queries` actúa como un repositorio simple sin abstracción formal

### 4.3 Seguridad

| Aspecto | Estado | Detalle |
|---|---|---|
| Helmet (headers HTTP) | ✅ Implementado | X-Frame-Options, HSTS, XSS Filter |
| CORS | ⚠️ Abierto | `cors()` sin configuración restrictiva |
| JWT Auth | ⚠️ Parcial | Se genera token pero **NO se valida en rutas protegidas** |
| Rate Limiting | ❌ Ausente | Sin protección contra brute-force |
| Input Sanitization | ⚠️ Básica | Solo validación de campos requeridos |
| Claves RSA en repo | 🔴 Crítico | `private.pem` y `public.pem` en código fuente |
| HTTPS | ✅ En producción | Certificados SSL configurados |
| Password Hashing | ✅ bcrypt | Implementado correctamente |
| Variables de entorno | ✅ dotenv | `.env` para configuración sensible |

### 4.4 Problemas Identificados

| # | Severidad | Problema | Ubicación |
|---|---|---|---|
| 1 | 🔴 Crítica | Claves privadas RSA (`.pem`) commiteadas en el repositorio | `src/keys/` |
| 2 | 🔴 Crítica | **No existe middleware de autenticación en rutas** — todas las rutas son públicas | `routes/routes.ts` |
| 3 | 🔴 Crítica | CORS completamente abierto (`cors()` sin restricciones) | `config/server.ts` |
| 4 | 🟠 Alta | Controller `register.controller.ts` con **474 líneas** — violación SRP | `controllers/` |
| 5 | 🟠 Alta | Uso extensivo de `any` en tipos TypeScript (anula el tipado estático) | Todo el backend |
| 6 | 🟠 Alta | Sin script de inicio (`npm start`), solo `test` como echo | `package.json` |
| 7 | 🟠 Alta | Interfaces desactualizadas vs modelos reales (`registerInterface` ≠ `KidsModel`) | `interfaces/` |
| 8 | 🟡 Media | Archivos residuales del template (`example.*`) sin limpiar | Múltiples |
| 9 | 🟡 Media | Funcionalidad de email comentada (correo de confirmación) | `register.controller.ts` L270-L277 |
| 10 | 🟡 Media | Queries `ParentsQueries` y `AuthorizedQueries` contienen métodos que consultan `KidsModel` (copiar-pegar) | `queries/` |
| 11 | 🟡 Media | Sin logging estructurado (solo `console.log`) | Global |
| 12 | 🟡 Media | Sin manejo centralizado de errores | Global |
| 13 | 🟡 Media | `converBase64ToJpg` tiene race condition (no espera callback de `fs.writeFile`) | `helpers/files.ts` |
| 14 | 🟢 Baja | TypeScript ^4.6.3 desactualizado (actual ≥5.x) | `package.json` |
| 15 | 🟢 Baja | Sin `.gitignore` visible / sin `nodemon` / sin `ts-node-dev` para desarrollo | Root |

---

## 5. Análisis del Frontend Admin

### 5.1 Estructura de Directorios

```
src/app/
├── app.component.*                 # Root component
├── app.config.ts                   # Providers (PrimeNG Aura theme, JWT interceptor)
├── app.routes.ts                   # Rutas principales (lazy loading)
├── auth/
│   ├── login/                      # Componente de login
│   └── change-password/            # Cambio de contraseña
├── pages/
│   ├── pages.routes.ts             # Solo ruta 'kids' activa
│   ├── kids/                       # Listado y detalle de niños
│   ├── home/                       # ⚠️ Importado pero no usado en rutas
│   ├── contracts/                  # ⚠️ Residual de template anterior
│   └── users/                      # ⚠️ Residual de template anterior
├── services/
│   ├── session.service.ts          # Login, logout, token management
│   ├── kids.service.ts             # CRUD niños + reportes
│   ├── alerts.service.ts           # Wrapper SweetAlert2
│   ├── contracts.service.ts        # ⚠️ Residual
│   ├── clients.service.ts          # ⚠️ Residual
│   ├── developers.service.ts       # ⚠️ Residual
│   ├── files.service.ts            # ⚠️ Residual
│   ├── links.service.ts            # ⚠️ Residual
│   ├── locations.service.ts        # ⚠️ Residual
│   └── signatures.service.ts       # ⚠️ Residual
├── shared/components/
│   ├── kids-information/           # Detalle de niño
│   ├── navbar/
│   ├── sidebar/
│   ├── skeleton/
│   ├── clients-information/        # ⚠️ Residual
│   ├── contract-details/           # ⚠️ Residual
│   ├── dialogs/                    # ⚠️ Residual
│   └── signature-pad/              # ⚠️ Residual
├── core/interceptors/
│   └── jwt.interceptor.ts          # Inyección automática de token JWT
├── layouts/
│   └── main-layout/                # Layout principal con sidebar
├── constants/
│   ├── kids-ages.ts
│   ├── contract-status.ts          # ⚠️ Residual
│   ├── currency-types.ts           # ⚠️ Residual
│   ├── languages.ts                # ⚠️ Residual
│   └── phone-codes.ts              # ⚠️ Residual
└── environments/
    ├── environment.ts              # prod: api.mundodefeplaya.org:3035
    └── environment.development.ts  # dev: localhost:8000
```

### 5.2 Hallazgos

| # | Severidad | Problema |
|---|---|---|
| 1 | 🟠 Alta | **~70% del código es residual** de un template para contratos (`BuyBack`). Servicios, componentes, constantes y assets que no pertenecen al dominio KingdomKids |
| 2 | 🟠 Alta | `AuthGuard` está **comentado** en `app.routes.ts` — cualquiera puede acceder al panel sin login |
| 3 | 🟠 Alta | El `SessionService` importa siempre `environment.development` en lugar de `environment` (hardcoded) |
| 4 | 🟡 Media | Token JWT almacenado en `sessionStorage` con clave estática (`VdiuajS4DLTUHg`) |
| 5 | 🟡 Media | Información de niño almacenada en `localStorage` sin cifrado (`btoa` no es cifrado) |
| 6 | 🟡 Media | No existe page de error 404 (TODO en comentario) |
| 7 | 🟢 Baja | Assets de otro proyecto (`logo-buyback.png`, `terminal-de-aeropuerto.png`) en `/public/images/` |

---

## 6. Análisis del Frontend Registro

### 6.1 Estructura de Directorios

```
src/app/
├── app.component.*
├── app.config.ts
├── app.routes.ts                   # 6 rutas públicas
├── pages/
│   ├── home/                       # Página de inicio
│   ├── register/                   # Formulario de registro de niño
│   ├── success/                    # Confirmación post-registro
│   ├── scanner/                    # Escáner QR para check-in
│   ├── finder/                     # Buscador de niños por nombre
│   └── verification/              # Verificación por ID (post-scan QR)
├── services/
│   ├── kids.service.ts             # Registro y consulta
│   ├── checkin.service.ts          # Check-in
│   └── alerts.service.ts           # Wrapper SweetAlert2
├── constants/
│   └── months.ts
└── environments/
    ├── environment.ts              # prod
    └── environment.development.ts  # dev
```

### 6.2 Hallazgos

| # | Severidad | Problema |
|---|---|---|
| 1 | 🟡 Media | Aplicación completamente pública (sin autenticación) — correcto para formulario de registro, pero el scanner debería tener control de acceso |
| 2 | 🟡 Media | `KidsService` importa `environment.development` hardcoded en lugar del archivo base `environment` |
| 3 | 🟡 Media | Dos librerías diferentes para QR scanning (`html5-qrcode` + `ngx-scanner-qrcode`) — redundancia |
| 4 | 🟢 Baja | Proyecto más limpio que admin (sin residuos de template) |

---

## 7. Modelo de Datos

### 7.1 Diagrama Entidad-Relación

```
┌────────────────────────────────────────────────┐
│                    users                        │
│ (administrators / login)                        │
├────────────────────────────────────────────────┤
│ PK  id          INT UNSIGNED AUTO_INCREMENT     │
│     username    VARCHAR                         │
│     password    VARCHAR (bcrypt hash)            │
│     timestamps  FALSE                           │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│                     kids                        │
├────────────────────────────────────────────────┤
│ PK  id                   INT AUTO_INCREMENT     │
│     uuid                 VARCHAR(150)            │
│     name                 VARCHAR(150)            │
│     lastname             VARCHAR(150)            │
│     birthday             VARCHAR(150) ⚠️         │
│     age                  VARCHAR(100) ⚠️         │
│     address              VARCHAR(255)            │
│     allergy              VARCHAR(50)             │
│     allergy_description  VARCHAR(255) NULL       │
│     medical_condition    VARCHAR(50)             │
│     medical_condition_description VARCHAR(255)   │
│     mdf_member           VARCHAR(50)             │
│     another_church       VARCHAR(50)             │
│     another_church_name  VARCHAR(255) NULL       │
│     invited              VARCHAR(50)             │
│     invite_name          VARCHAR(150) NULL       │
│     qr_code              VARCHAR(150) NULL       │
│     terms_condition      VARCHAR(50)             │
│     createdAt            DATETIME                │
│     updatedAt            DATETIME                │
└──────────────────────┬─────────────────────────┘
                       │ 1:N
         ┌─────────────┼─────────────┐
         │                           │
         ▼                           ▼
┌─────────────────────┐   ┌──────────────────────┐
│      parents         │   │  authorized_person    │
├─────────────────────┤   ├──────────────────────┤
│ PK id       INT      │   │ PK id       INT       │
│ FK kid_id   INT      │   │ FK kid_id   INT       │
│    uuid     VARCHAR  │   │    uuid     VARCHAR   │
│    full_name VARCHAR │   │    full_name VARCHAR  │
│    email    VARCHAR  │   │    cellphone VARCHAR  │
│    cellphone VARCHAR │   │    relationship VARCH │
│    type     VARCHAR  │   │    createdAt          │
│    createdAt         │   │    updatedAt          │
│    updatedAt         │   └──────────────────────┘
└─────────────────────┘
         │
         │ (kid_id = kids.id)
         │
┌────────────────────────────────────────────────┐
│              checkin_register                   │
├────────────────────────────────────────────────┤
│ PK  id              INT AUTO_INCREMENT          │
│     uuid            VARCHAR                     │
│ FK  kid_id          INT                         │
│     checkin_date    DATETIME NULL                │
│     createdAt       DATETIME                    │
│     updatedAt       DATETIME                    │
└────────────────────────────────────────────────┘
```

### 7.2 Problemas del Modelo de Datos

| # | Campo | Problema | Recomendación |
|---|---|---|---|
| 1 | `kids.birthday` | `VARCHAR(150)` para fecha de nacimiento | Cambiar a `DATE` |
| 2 | `kids.age` | `VARCHAR(100)` para edad | Cambiar a `TINYINT UNSIGNED` (o calcular dinámicamente desde birthday) |
| 3 | `kids.allergy` | `VARCHAR(50)` para boolean | Cambiar a `BOOLEAN` / `TINYINT(1)` |
| 4 | `kids.medical_condition` | `VARCHAR(50)` para boolean | Cambiar a `BOOLEAN` / `TINYINT(1)` |
| 5 | `kids.mdf_member` | `VARCHAR(50)` para boolean | Cambiar a `BOOLEAN` / `TINYINT(1)` |
| 6 | `kids.another_church` | `VARCHAR(50)` para boolean | Cambiar a `BOOLEAN` / `TINYINT(1)` |
| 7 | `kids.invited` | `VARCHAR(50)` para boolean | Cambiar a `BOOLEAN` / `TINYINT(1)` |
| 8 | `kids.terms_condition` | `VARCHAR(50)` para boolean | Cambiar a `BOOLEAN` / `TINYINT(1)` |
| 9 | `checkin_register` | No tiene campo `checkout_date` ni `status` en el modelo (pero se usan en el controller) | Sincronizar modelo con BD real |
| 10 | General | No hay índices definidos en Sequelize (solo PK) | Agregar índices en `kid_id`, `uuid` |
| 11 | General | Relación `checkin_register.register_id` vs `kid_id` inconsistente en código | Unificar nombre de FK |

---

## 8. Mapa de Endpoints (API REST)

### 8.1 Tabla de Rutas

| Método | Endpoint | Controller | Auth | Descripción |
|---|---|---|---|---|
| `POST` | `/api/login` | `SessionController.login` | ❌ Público | Login administrador |
| `POST` | `/api/register` | `RegisterController.register` | ❌ Público | Registro de niño + padres + autorizados |
| `GET` | `/api/register` | `RegisterController.index` | ❌ ⚠️ Sin auth | Listar todos los niños |
| `GET` | `/api/register/:id` | `RegisterController.show` | ❌ ⚠️ Sin auth | Obtener niño por ID |
| `POST` | `/api/finder` | `RegisterController.finder` | ❌ ⚠️ Sin auth | Buscar niño por nombre |
| `GET` | `/api/register/qr/:id` | `RegisterController.getQRCodeImage` | ❌ ⚠️ Sin auth | Obtener QR en base64 |
| `GET` | `/api/register/confirmation/:id` | `RegisterController.confirmation` | ❌ ⚠️ Sin auth | Confirmación de registro + QR |
| `GET` | `/api/checkinAndOut/index` | `CheckinAndOutController.indexToday` | ❌ ⚠️ Sin auth | Listar check-ins de hoy |
| `GET` | `/api/checkinAndOut/index/:register_id` | `CheckinAndOutController.indexByRegister` | ❌ ⚠️ Sin auth | Check-ins por registro |
| `GET` | `/api/checkinAndOut/:id` | `CheckinAndOutController.showByRegister` | ❌ ⚠️ Sin auth | Detalle de check-in |
| `POST` | `/api/checkin` | `CheckinAndOutController.checkin` | ❌ ⚠️ Sin auth | Registrar entrada |
| `PUT` | `/api/checkinAndOut/checkout/:id` | `CheckinAndOutController.checkout` | ❌ ⚠️ Sin auth | Registrar salida |
| `GET` | `/api/reports/:age` | `RegisterController.excelByAge` | ❌ ⚠️ Sin auth | Reporte Excel por edad |
| `GET` | `/files/*` | `express.static` | ❌ Público | Servir archivos QR estáticos |

> ⚠️ **Hallazgo Crítico:** De 14 endpoints, **13 no tienen middleware de autenticación**. Cualquier persona con acceso al dominio puede listar niños, descargar QRs, registrar check-ins y generar reportes.

---

## 9. Hallazgos Críticos y Deuda Técnica

### 9.1 Deuda Técnica Clasificada

#### 🔴 Crítica (Requiere acción inmediata)

| ID | Hallazgo | Impacto |
|---|---|---|
| DT-01 | **Sin autenticación en 92% de endpoints** | Datos de menores de edad expuestos públicamente |
| DT-02 | **Claves privadas RSA en repositorio** | Compromiso de autenticación si el repo se filtra |
| DT-03 | **CORS sin restricciones** | Cualquier dominio puede realizar peticiones al API |
| DT-04 | **AuthGuard comentado en admin** | Panel de administración accesible sin login |

#### 🟠 Alta (Resolver antes de próximo release)

| ID | Hallazgo | Impacto |
|---|---|---|
| DT-05 | **0% de cobertura de tests** (sin tests unitarios ni e2e) | Regresiones no detectadas |
| DT-06 | **~70% código residual en admin** de template anterior | Mantenibilidad reducida, confusión |
| DT-07 | **Sin validación de entrada robusta** en endpoints | Posibles inyecciones |
| DT-08 | **Tipado débil** — uso extensivo de `any` | Se pierde la ventaja de TypeScript |
| DT-09 | **Controller de 474 líneas** con lógica de negocio, generación QR y Excel | Violación SRP |
| DT-10 | **Sin manejo centralizado de errores** | Errores no controlados crashean el servidor |
| DT-11 | **Sin script de inicio** (`npm start`) en package.json del backend | No es desplegable directamente |

#### 🟡 Media

| ID | Hallazgo | Impacto |
|---|---|---|
| DT-12 | Sin logging estructurado (solo `console.log`) | Sin trazabilidad en producción |
| DT-13 | Sin Docker / Dockerfile | Despliegue manual, no reproducible |
| DT-14 | Sin CI/CD pipeline | Despliegue propenso a errores humanos |
| DT-15 | Race condition en `converBase64ToJpg` | Posible pérdida de archivos QR |
| DT-16 | Import hardcoded de `environment.development` en servicios frontend | Siempre apunta a localhost |
| DT-17 | Modelo de datos usa VARCHAR para campos booleanos y fechas | Consultas ineficientes |
| DT-18 | Inconsistencia en FK: `register_id` vs `kid_id` | Confusión en queries |
| DT-19 | Email de confirmación deshabilitado (comentado) | Feature incompleta |

#### 🟢 Baja

| ID | Hallazgo | Impacto |
|---|---|---|
| DT-20 | TypeScript 4.x en backend (desactualizado) | Features modernos no disponibles |
| DT-21 | Dos librerías de QR scanner redundantes | Bundle size innecesario |
| DT-22 | Assets de otro proyecto (BuyBack) en admin | Peso innecesario |
| DT-23 | Sin página 404 en admin | UX pobre para rutas inválidas |

---

## 10. Matriz de Riesgos

| Riesgo | Probabilidad | Impacto | Nivel | Mitigación |
|---|---|---|---|---|
| Exposición de datos de menores por falta de auth | Alta | Crítico | 🔴 **Extremo** | Implementar middleware JWT + RBAC |
| Compromiso de claves RSA | Media | Crítico | 🔴 **Alto** | Rotar claves, mover a variables de entorno |
| Fallo en producción sin trazabilidad | Alta | Alto | 🟠 **Alto** | Implementar logging (Winston/Pino) |
| Regresiones por falta de tests | Alta | Medio | 🟠 **Alto** | Suite de tests unitarios + e2e |
| Downtime por despliegue manual | Media | Medio | 🟡 **Medio** | CI/CD pipeline |
| Pérdida de QR por race condition | Baja | Medio | 🟡 **Medio** | Usar `fs.promises.writeFile` con await |
| XSS por falta de sanitización | Baja | Alto | 🟡 **Medio** | Sanitización de inputs + CSP |

---

## 11. Recomendaciones de Mejora

### 11.1 Inmediatas (Sprint 0 — Seguridad)

```
Prioridad: CRÍTICA | Esfuerzo estimado: 1-2 sprints
```

1. **Implementar middleware de autenticación JWT** en todas las rutas de admin y check-in/out
2. **Habilitar AuthGuard** en el frontend admin (descomentar y configurar)
3. **Mover claves RSA** a variables de entorno o secrets manager (eliminar del repo)
4. **Configurar CORS** con whitelist de dominios permitidos
5. **Agregar `.gitignore`** robusto (`.env`, `node_modules`, `dist`, claves)
6. **Agregar rate limiting** con `express-rate-limit`
7. **Corregir imports** de `environment.development` → `environment` en servicios frontend

### 11.2 Corto Plazo (1-2 meses)

```
Prioridad: ALTA | Esfuerzo estimado: 2-3 sprints
```

1. **Eliminar todo código residual** del template (servicios, componentes, assets de BuyBack)
2. **Refactorizar `RegisterController`** — extraer lógica a services layer
3. **Corregir modelo de datos** — tipos correctos para booleanos y fechas
4. **Agregar tipado fuerte** — eliminar `any` y definir interfaces/DTOs
5. **Implementar manejo centralizado de errores** (middleware Express)
6. **Agregar scripts** al `package.json` backend (`start`, `dev`, `build`)
7. **Sincronizar modelos Sequelize** con BD real (campos `status`, `checkout_date`)
8. **Resolver race condition** en `files.ts` → usar `fs.promises`

### 11.3 Mediano Plazo (3-6 meses)

```
Prioridad: MEDIA | Esfuerzo estimado: 3-5 sprints
```

1. **Dockerizar** los 3 proyectos con `docker-compose`
2. **Implementar CI/CD** (GitHub Actions)
3. **Agregar tests unitarios** (Jest para backend, Jasmine/Karma para frontends)
4. **Implementar logging** con Winston o Pino + rotación de logs
5. **Migrar a NestJS** para obtener estructura modular, validación con decorators, Swagger automático
6. **Reemplazar `moment.js`** por `date-fns` o `dayjs` (moment está deprecated)
7. **Implementar paginación** en endpoints de listado
8. **Implementar soft deletes** y auditoría de cambios

### 11.4 Largo Plazo (6-12 meses)

```
Prioridad: MEJORA CONTINUA
```

1. **Migrar backend a NestJS** con módulos (Auth, Kids, CheckIn, Reports)
2. **Implementar API versioning** (`/api/v1/...`)
3. **Agregar Swagger/OpenAPI** para documentación automática
4. **Implementar WebSockets** para check-in en tiempo real
5. **Considerar S3/Cloud Storage** para archivos QR (en lugar de filesystem local)
6. **Implementar caché** (Redis) para consultas frecuentes
7. **Monitoreo** con herramientas APM (New Relic, Datadog, o Prometheus+Grafana)

---

## 12. Roadmap Sugerido de Modernización

```
    2026 Q3                2026 Q4                2027 Q1              2027 Q2
    ┌─────────────┐        ┌─────────────┐        ┌──────────────┐     ┌──────────────┐
    │  FASE 1     │        │  FASE 2     │        │  FASE 3      │     │  FASE 4      │
    │  Seguridad  │───────▶│  Limpieza   │───────▶│  Estructura  │────▶│  Evolución   │
    │  & Estabil. │        │  & Calidad  │        │  & DevOps    │     │  & Escala    │
    └─────────────┘        └─────────────┘        └──────────────┘     └──────────────┘
    
    • JWT Middleware        • Eliminar residuos    • Docker + CI/CD     • Migrar a NestJS
    • AuthGuard activo      • Refactor controllers • Tests unitarios    • API versioning
    • CORS restrictivo      • Tipado fuerte        • Logging Winston    • WebSockets
    • Rotar claves RSA      • Fix modelo datos     • Paginación         • Cloud Storage
    • Rate Limiting         • Error handling       • Swagger            • Monitoreo APM
    • Fix env imports       • npm scripts          • Soft deletes       • Caché Redis
```

---

## Apéndice A: Comandos Útiles para Desarrollo

```bash
# Backend - Agregar scripts necesarios en package.json:
"scripts": {
    "build": "tsc",
    "start": "node dist/app.js",
    "dev": "ts-node-dev --respawn src/app.ts"
}

# Instalar dependencias faltantes para desarrollo:
npm install -D ts-node-dev @types/node

# Frontend Admin:
ng serve --port 4200

# Frontend Register:
ng serve --port 4300
```

## Apéndice B: Estructura Sugerida Backend (NestJS)

```
src/
├── main.ts
├── app.module.ts
├── common/
│   ├── filters/          # Exception filters
│   ├── guards/           # Auth guards
│   ├── interceptors/     # Logging, transform
│   ├── pipes/            # Validation
│   └── decorators/       # Custom decorators
├── config/
│   └── database.config.ts
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   └── dto/
│   ├── kids/
│   │   ├── kids.module.ts
│   │   ├── kids.controller.ts
│   │   ├── kids.service.ts
│   │   ├── kids.entity.ts
│   │   └── dto/
│   ├── parents/
│   ├── checkin/
│   └── reports/
└── shared/
    ├── mailer/
    ├── files/
    └── qr/
```

---

> **Nota Final:** El sistema cumple con su función core (registro y check-in de niños) pero requiere atención urgente en materia de **seguridad** antes de considerar cualquier otra mejora. Los datos de menores de edad están actualmente expuestos sin autenticación, lo que representa un riesgo legal y ético significativo.

