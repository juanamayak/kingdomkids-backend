# 🗺️ Roadmap de Migración — KingdomKids

> **Documento:** Plan de Migración Paso a Paso  
> **Fecha:** 28 de Junio de 2026  
> **Base:** [Análisis Arquitectónico v1.0](./analisis-arquitectonico.md)  
> **Autor:** Arquitectura de Software — Consultoría Cloud  
> **Versión:** 1.0

---

## 📑 Índice

1. [Estrategia General de Migración](#1-estrategia-general-de-migración)
2. [Prerequisitos y Preparación del Entorno](#2-prerequisitos-y-preparación-del-entorno)
3. [FASE 1 — Estabilización y Seguridad (Semanas 1-3)](#3-fase-1--estabilización-y-seguridad-semanas-1-3)
4. [FASE 2 — Limpieza y Calidad de Código (Semanas 4-6)](#4-fase-2--limpieza-y-calidad-de-código-semanas-4-6)
5. [FASE 3 — Migración del Backend a NestJS (Semanas 7-14)](#5-fase-3--migración-del-backend-a-nestjs-semanas-7-14)
6. [FASE 4 — Modernización de Frontends (Semanas 15-18)](#6-fase-4--modernización-de-frontends-semanas-15-18)
7. [FASE 5 — DevOps, Testing y Observabilidad (Semanas 19-22)](#7-fase-5--devops-testing-y-observabilidad-semanas-19-22)
8. [FASE 6 — Evolución y Escala (Semanas 23-26)](#8-fase-6--evolución-y-escala-semanas-23-26)
9. [Cronograma Visual](#9-cronograma-visual)
10. [Checklist Global de Migración](#10-checklist-global-de-migración)

---

## 1. Estrategia General de Migración

### 1.1 Filosofía: "Strangler Fig Pattern"

La migración seguirá el patrón **Strangler Fig** (Estrangulamiento Progresivo). No se reescribirá todo de golpe. En su lugar:

1. El backend Express actual sigue corriendo en producción
2. Se construye el nuevo backend NestJS módulo por módulo
3. Cada módulo nuevo reemplaza al antiguo endpoint por endpoint
4. Una vez migrado todo, se retira el backend Express

```
                    FASE 1-2                 FASE 3                    FASE 4-6
              ┌────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
              │   Express      │    │   Express  │ NestJS │    │       NestJS        │
              │   (estable +   │───▶│   (legacy) │ (new)  │───▶│   (100% migrado)    │
              │   seguro)      │    │            │        │    │                     │
              └────────────────┘    └─────────────────────┘    └─────────────────────┘
```

### 1.2 Principios Rectores

| # | Principio | Aplicación |
|---|---|---|
| 1 | **Zero downtime** | Cada paso debe ser desplegable sin romper producción |
| 2 | **Backward compatible** | Los frontends deben seguir funcionando durante toda la migración |
| 3 | **Incremental** | Cambios pequeños, verificables y reversibles |
| 4 | **Security first** | Lo primero que se arregla es la seguridad (datos de menores) |
| 5 | **Test before move** | No migrar código sin cobertura de tests mínima |

### 1.3 Criterio de Éxito Global

| Métrica | Estado Actual | Objetivo |
|---|---|---|
| Endpoints con autenticación | 1/14 (7%) | 14/14 (100%) |
| Cobertura de tests | 0% | ≥ 70% backend, ≥ 50% frontends |
| Código residual (admin) | ~70% | 0% |
| Tipos `any` en backend | ~95% de parámetros | < 5% |
| Tiempo de despliegue | Manual (~30min) | Automático (< 5min) |
| Documentación API | 0 endpoints documentados | 100% con Swagger |
| Vulnerabilidades conocidas | 4 críticas | 0 |

---

## 2. Prerequisitos y Preparación del Entorno

> **Duración:** 1-2 días  
> **Responsable:** DevOps / Lead Developer  
> **Riesgo:** Bajo

### Paso 2.1 — Crear ramas de migración

```bash
# En cada repositorio
git checkout -b develop
git checkout -b migration/phase-1
```

**Convención de ramas:**
```
main              → Producción actual
develop           → Integración
migration/phase-X → Rama por fase de migración
feature/TASK-XXX  → Ramas de tarea individual
```

### Paso 2.2 — Definir versión de Node.js

Crear en la raíz de CADA repositorio:

**Archivo:** `.nvmrc`
```
20.18.0
```

**Archivo:** Agregar en `package.json` del backend:
```json
"engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
}
```

### Paso 2.3 — Crear `.env.example` en el backend

**Archivo:** `kingdomkids-backend/.env.example`
```env
# Server
MODE=dev
LISTEN_PORT=8000

# Database
DB_HOST=localhost
DB_NAME=kingdomkids
DB_USER=root
DB_PASS=

# SSL (producción)
PRIVATE_SSL=
CERTIFICATE_SSL=
CABUNDLE_SSL=

# JWT
PRIVATE_KEY=./src/keys/private.pem
CRYPTR_KEY=your_cryptr_secret_key

# Email
EMAIL_HOST=
EMAIL_PORT=465
EMAIL_USER=
EMAIL_PASSWORD=

# Files
FILE_PATH=./files/qrs
```

### Paso 2.4 — Crear `.gitignore` robusto

**Archivo:** `kingdomkids-backend/.gitignore`
```gitignore
# Dependencies
node_modules/

# Build
dist/

# Environment
.env
.env.local
.env.production

# Keys (CRÍTICO)
src/keys/*.pem
certificates/

# IDE
.idea/
.vscode/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Files generated
files/qrs/*.jpg
```

> ⚠️ **ACCIÓN INMEDIATA:** Después de crear el `.gitignore`, ejecutar:
> ```bash
> git rm --cached src/keys/private.pem src/keys/public.pem
> git commit -m "security: remove RSA keys from tracking"
> ```

---

## 3. FASE 1 — Estabilización y Seguridad (Semanas 1-3)

> **Objetivo:** Cerrar todas las vulnerabilidades críticas SIN cambiar la arquitectura.  
> **Riesgo de la fase:** Medio (cambios en producción)  
> **Impacto en frontends:** Mínimo (solo necesitan enviar token JWT)

---

### 🔒 Sprint 1.1 — Middleware de Autenticación JWT (Semana 1)

#### Tarea 1.1.1 — Crear middleware `auth.middleware.ts`

**Archivo nuevo:** `kingdomkids-backend/src/helpers/auth.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import Cryptr from 'cryptr';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({
            ok: false,
            errors: [{ message: 'Token de autenticación no proporcionado.' }]
        });
    }

    try {
        const publicKeyPath = process.env.MODE !== 'dev'
            ? process.env.PUBLIC_KEY || './src/keys/public.pem'
            : './src/keys/public.pem';

        const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
        const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });

        // Descifrar datos del payload
        const cryptr = new Cryptr(process.env.CRYPTR_KEY || '');
        const payload = decoded as any;

        (req as any).adminId = cryptr.decrypt(payload.administradorId);
        (req as any).userType = cryptr.decrypt(payload.userType);

        next();
    } catch (e) {
        return res.status(401).json({
            ok: false,
            errors: [{ message: 'Token inválido o expirado.' }]
        });
    }
};
```

**Criterio de aceptación:**
- [ ] Middleware rechaza requests sin token (HTTP 401)
- [ ] Middleware rechaza tokens inválidos (HTTP 401)
- [ ] Middleware permite requests con token válido
- [ ] Datos del admin disponibles en `req.adminId`

#### Tarea 1.1.2 — Aplicar middleware a rutas protegidas

**Archivo a modificar:** `kingdomkids-backend/src/routes/routes.ts`

```typescript
import { Application } from 'express';
import { RegisterController } from '../controllers/register.controller';
import { CheckinAndOutController } from '../controllers/checkin_and_out.controller';
import { SessionController } from '../controllers/session.controller';
import { authMiddleware } from '../helpers/auth.middleware';

export class Routes {
    public registerController: RegisterController = new RegisterController();
    public checkinAndOutController: CheckinAndOutController = new CheckinAndOutController();
    public sessionController: SessionController = new SessionController();

    public routes(app: Application) {
        /* ============ RUTAS PÚBLICAS ============ */
        // Login (debe ser público)
        app.route('/api/login').post(this.sessionController.login);

        // Registro de niño (público — lo usan los padres)
        app.route('/api/register').post(this.registerController.register);

        // Confirmación post-registro (público — pantalla de éxito)
        app.route('/api/register/confirmation/:id').get(this.registerController.confirmation);

        // Check-in via QR (público — lo usa el scanner)
        app.route('/api/checkin').post(this.checkinAndOutController.checkin);

        /* ============ RUTAS PROTEGIDAS (requieren JWT) ============ */
        // Listado de niños (solo admin)
        app.route('/api/register').get(authMiddleware, this.registerController.index);
        app.route('/api/register/:id').get(authMiddleware, this.registerController.show);
        app.route('/api/finder').post(authMiddleware, this.registerController.finder);
        app.route('/api/register/qr/:id').get(authMiddleware, this.registerController.getQRCodeImage);

        // Check-in/out management (solo admin)
        app.route('/api/checkinAndOut/index').get(authMiddleware, this.checkinAndOutController.indexToday);
        app.route('/api/checkinAndOut/index/:register_id').get(authMiddleware, this.checkinAndOutController.indexByRegister);
        app.route('/api/checkinAndOut/:id').get(authMiddleware, this.checkinAndOutController.showByRegister);
        app.route('/api/checkinAndOut/checkout/:id').put(authMiddleware, this.checkinAndOutController.checkout);

        // Reportes (solo admin)
        app.route('/api/reports/:age').get(authMiddleware, this.registerController.excelByAge);
    }
}
```

**Decisión de diseño — ¿Qué rutas quedan públicas?**

| Ruta | ¿Pública? | Justificación |
|---|---|---|
| `POST /api/login` | ✅ Sí | Necesaria para obtener el token |
| `POST /api/register` | ✅ Sí | La usan los padres desde `kingdomkids-register` |
| `GET /api/register/confirmation/:id` | ✅ Sí | Pantalla de éxito post-registro |
| `POST /api/checkin` | ✅ Sí | El scanner público necesita registrar check-in |
| Todas las demás | ❌ No | Solo las usa el panel admin |

**Criterio de aceptación:**
- [ ] `GET /api/register` sin token → 401
- [ ] `GET /api/register` con token válido → 200
- [ ] `POST /api/register` (crear niño) sigue funcionando sin token
- [ ] `POST /api/login` sigue funcionando sin token
- [ ] `POST /api/checkin` sigue funcionando sin token
- [ ] Frontend admin sigue funcionando (ya envía token vía interceptor)
- [ ] Frontend register sigue funcionando (no necesita token)

---

### 🔒 Sprint 1.2 — CORS, Rate Limiting y Headers (Semana 1-2)

#### Tarea 1.2.1 — Configurar CORS restrictivo

**Archivo a modificar:** `kingdomkids-backend/src/config/server.ts`

Reemplazar `this.app.use(cors())` por:

```typescript
const allowedOrigins = [
    'http://localhost:4200',           // Admin dev
    'http://localhost:4300',           // Register dev
    'https://admin.mundodefeplaya.org', // Admin prod (ajustar al dominio real)
    'https://registro.mundodefeplaya.org', // Register prod (ajustar al dominio real)
];

this.app.use(cors({
    origin: (origin, callback) => {
        // Permitir requests sin origin (Postman, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Bloqueado por política CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
```

#### Tarea 1.2.2 — Instalar y configurar Rate Limiting

```bash
cd kingdomkids-backend
npm install express-rate-limit
npm install -D @types/express-rate-limit
```

**Agregar en** `server.ts` (dentro de `config()`):

```typescript
import rateLimit from 'express-rate-limit';

// Rate limit global: 100 requests por minuto por IP
const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, errors: [{ message: 'Demasiadas solicitudes. Intente más tarde.' }] }
});

// Rate limit para login: 5 intentos por minuto
const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { ok: false, errors: [{ message: 'Demasiados intentos de login. Intente en 1 minuto.' }] }
});

this.app.use(globalLimiter);

// Aplicar al login específicamente en routes.ts:
app.route('/api/login').post(loginLimiter, this.sessionController.login);
```

**Criterio de aceptación:**
- [ ] Request desde origen no autorizado → bloqueado por CORS
- [ ] Request desde `localhost:4200` → permitido
- [ ] Más de 5 intentos de login en 1 minuto → 429 Too Many Requests
- [ ] Más de 100 requests generales en 1 minuto → 429

---

### 🔒 Sprint 1.3 — Rotación de Claves y Variables de Entorno (Semana 2)

#### Tarea 1.3.1 — Generar nuevas claves RSA

```bash
# Generar nuevas claves (NO dentro del repositorio)
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Mover a ubicación segura en el servidor
# En producción: /etc/kingdomkids/keys/
# En dev: mantener en src/keys/ (ya está en .gitignore)
```

#### Tarea 1.3.2 — Actualizar `payload.ts` para usar variables de entorno

**Archivo:** `kingdomkids-backend/src/helpers/payload.ts`

```typescript
import jwt from 'jsonwebtoken';
import fs from 'fs';
import Cryptr from 'cryptr';

export class Payload {
    private privateKey: string;

    constructor() {
        const keyPath = process.env.JWT_PRIVATE_KEY_PATH || './src/keys/private.pem';
        this.privateKey = fs.readFileSync(keyPath, 'utf8');
    }

    public createToken(data: any) {
        try {
            const cryptr = new Cryptr(process.env.CRYPTR_KEY || '');

            if (data.user_type === 'administrador') {
                const administradorId = cryptr.encrypt(data.administrator_id);
                const userType = cryptr.encrypt(data.user_type);

                const token = jwt.sign(
                    { administradorId, userType },
                    this.privateKey,
                    { algorithm: 'RS256', expiresIn: '9h' }
                );

                return { ok: true, token };
            }

            return { ok: false };
        } catch (e) {
            console.error('Error creating token:', e);
            return { ok: false };
        }
    }
}
```

**Agregar al `.env`:**
```env
JWT_PRIVATE_KEY_PATH=./src/keys/private.pem
JWT_PUBLIC_KEY_PATH=./src/keys/public.pem
```

#### Tarea 1.3.3 — Eliminar claves del historial de Git

```bash
# IMPORTANTE: Solo si el repo es privado y no ha sido expuesto
# Si es público, las claves están COMPROMETIDAS y deben regenerarse obligatoriamente

git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch src/keys/private.pem src/keys/public.pem" \
  --prune-empty --tag-name-filter cat -- --all

git push origin --force --all
```

**Criterio de aceptación:**
- [ ] `src/keys/` está en `.gitignore`
- [ ] `git log --all -- src/keys/private.pem` no muestra resultados (si se limpió historial)
- [ ] Claves nuevas generadas y desplegadas en servidor de producción
- [ ] Payload helper lee rutas desde variables de entorno
- [ ] Login sigue funcionando con las nuevas claves

---

### 🔒 Sprint 1.4 — AuthGuard del Frontend Admin (Semana 2-3)

#### Tarea 1.4.1 — Crear AuthGuard funcional

**Archivo nuevo:** `kingdomkids-admin/src/app/core/guards/auth.guard.ts`

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../../services/session.service';

export const authGuard: CanActivateFn = (route, state) => {
    const sessionService = inject(SessionService);
    const router = inject(Router);

    const token = sessionService.getToken();

    if (token) {
        return true;
    }

    router.navigate(['/auth/login']);
    return false;
};
```

#### Tarea 1.4.2 — Activar AuthGuard en rutas

**Archivo a modificar:** `kingdomkids-admin/src/app/app.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        children: [
            { path: 'auth', loadChildren: () => import('./auth/auth.routes') },
            { path: '', pathMatch: 'full', redirectTo: 'auth/login' }
        ]
    },
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],    // ← ACTIVADO
        children: [
            { path: '', loadChildren: () => import('./pages/pages.routes') },
        ],
    },
    { path: '**', redirectTo: 'auth/login' }
];
```

#### Tarea 1.4.3 — Corregir import de environment en servicios

**Archivos a modificar (todos):** Cambiar `environment.development` → `environment`

```
kingdomkids-admin/src/app/services/session.service.ts
kingdomkids-admin/src/app/services/kids.service.ts
kingdomkids-register/src/app/services/kids.service.ts
kingdomkids-register/src/app/services/checkin.service.ts
```

En cada uno, cambiar:
```typescript
// ANTES
import {environment} from "../../environments/environment.development";

// DESPUÉS
import {environment} from "../../environments/environment";
```

> **Nota:** Angular automáticamente reemplaza `environment.ts` por `environment.development.ts` cuando se ejecuta con `ng serve` (configuración en `angular.json` → `fileReplacements`).

**Criterio de aceptación:**
- [ ] Acceder a `/kids` sin login → redirige a `/auth/login`
- [ ] Acceder a `/kids` con login → muestra la página
- [ ] `ng build --configuration=production` usa la URL de producción
- [ ] `ng serve` usa la URL de desarrollo (localhost)

---

### 🔒 Sprint 1.5 — Manejo Centralizado de Errores (Semana 3)

#### Tarea 1.5.1 — Crear middleware de error global

**Archivo nuevo:** `kingdomkids-backend/src/helpers/error.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(`[${new Date().toISOString()}] Error:`, err.message);
    console.error('Stack:', err.stack);

    // Error de CORS
    if (err.message === 'Bloqueado por política CORS') {
        return res.status(403).json({
            ok: false,
            errors: [{ message: 'Origen no permitido.' }]
        });
    }

    // Error genérico
    return res.status(500).json({
        ok: false,
        errors: [{ message: 'Error interno del servidor.' }]
    });
};
```

#### Tarea 1.5.2 — Registrar middleware en server.ts

Agregar al FINAL de `config()` en `server.ts`:

```typescript
import { errorMiddleware } from '../helpers/error.middleware';

// ... al final del constructor, DESPUÉS de this.routes.routes(this.app):
this.app.use(errorMiddleware);
```

#### Tarea 1.5.3 — Agregar scripts de inicio al backend

**Archivo a modificar:** `kingdomkids-backend/package.json`

```json
{
    "name": "kingdomkids-backend",
    "version": "1.0.0",
    "description": "API REST para el sistema KingdomKids",
    "main": "dist/app.js",
    "scripts": {
        "build": "tsc",
        "start": "node dist/app.js",
        "dev": "ts-node-dev --respawn --transpile-only src/app.ts",
        "test": "echo \"Error: no test specified\" && exit 1"
    },
    ...
}
```

```bash
npm install -D ts-node-dev @types/node
```

**Criterio de aceptación:**
- [ ] `npm run dev` inicia el servidor en modo desarrollo con hot-reload
- [ ] `npm run build && npm start` inicia en modo producción
- [ ] Error no controlado en un controller → responde 500 con mensaje genérico (no crashea)
- [ ] Error CORS → responde 403

---

### ✅ Entregables FASE 1

| Entregable | Verificación |
|---|---|
| Middleware JWT aplicado a rutas admin | `curl` sin token a `/api/register` → 401 |
| CORS restrictivo | Request desde origen externo → bloqueado |
| Rate limiting activo | 6 logins en 1 min → 429 |
| Claves RSA fuera del repo | `git status` no muestra `.pem` |
| AuthGuard activo en admin | URL directa sin login → redirect a login |
| Environment imports corregidos | `ng build --prod` apunta a URL de producción |
| Scripts npm funcionales | `npm run dev` inicia servidor |
| Error middleware global | Error inesperado → 500 sin crash |

---

## 4. FASE 2 — Limpieza y Calidad de Código (Semanas 4-6)

> **Objetivo:** Eliminar código muerto, fortalecer tipos, y dejar el código actual estable antes de migrar.  
> **Riesgo:** Bajo (no cambia funcionalidad)  
> **Impacto en producción:** Ninguno si se testea correctamente

---

### 🧹 Sprint 2.1 — Eliminar Código Residual del Template (Semana 4)

#### Tarea 2.1.1 — Backend: eliminar archivos `example.*`

**Archivos a eliminar:**
```
kingdomkids-backend/src/controllers/example.controller.ts
kingdomkids-backend/src/models/example.model.ts
kingdomkids-backend/src/queries/example.query.ts
```

#### Tarea 2.1.2 — Frontend Admin: eliminar servicios residuales

**Archivos a eliminar:**
```
kingdomkids-admin/src/app/services/contracts.service.ts
kingdomkids-admin/src/app/services/clients.service.ts
kingdomkids-admin/src/app/services/developers.service.ts
kingdomkids-admin/src/app/services/files.service.ts
kingdomkids-admin/src/app/services/links.service.ts
kingdomkids-admin/src/app/services/locations.service.ts
kingdomkids-admin/src/app/services/signatures.service.ts
```

#### Tarea 2.1.3 — Frontend Admin: eliminar componentes residuales

**Archivos/carpetas a eliminar:**
```
kingdomkids-admin/src/app/shared/components/clients-information/
kingdomkids-admin/src/app/shared/components/contract-details/
kingdomkids-admin/src/app/shared/components/dialogs/
kingdomkids-admin/src/app/shared/components/signature-pad/
kingdomkids-admin/src/app/pages/contracts/
kingdomkids-admin/src/app/pages/users/
kingdomkids-admin/src/app/pages/home/     (si no se usa activamente)
```

#### Tarea 2.1.4 — Frontend Admin: eliminar constantes residuales

**Archivos a eliminar:**
```
kingdomkids-admin/src/app/constants/contract-status.ts
kingdomkids-admin/src/app/constants/currency-types.ts
kingdomkids-admin/src/app/constants/languages.ts
kingdomkids-admin/src/app/constants/phone-codes.ts
```

#### Tarea 2.1.5 — Frontend Admin: eliminar assets residuales

**Archivos a eliminar:**
```
kingdomkids-admin/public/images/logo-buyback.png
kingdomkids-admin/public/images/logo-buyback-white.png
kingdomkids-admin/public/images/terminal-de-aeropuerto.png
kingdomkids-admin/bb-add-frontend.zip
```

#### Tarea 2.1.6 — Frontend Admin: limpiar SessionService

**Archivo a modificar:** `kingdomkids-admin/src/app/services/session.service.ts`

Eliminar propiedades no utilizadas:
```typescript
@Injectable({ providedIn: 'root' })
export class SessionService {
    private url = environment.urlApi;
    public jwtToken = 'VdiuajS4DLTUHg';
    // ELIMINAR estas propiedades residuales:
    // public profileToken = 'PF849!';
    // public permissionsToken = 'PM1995!';
    // public developerToken = 'DV1936!';
    // public corpToken = 'CP12345!';
    // public permissionId = 'PID9842!';
    // public lastUser = 'LU0712V!';
    ...
}
```

**Criterio de aceptación:**
- [ ] `ng build` del admin compila sin errores
- [ ] No quedan imports rotos en ningún archivo
- [ ] La aplicación admin funciona igual que antes
- [ ] `npm run build` del backend compila sin errores

---

### 🔧 Sprint 2.2 — Fortalecer Tipos TypeScript del Backend (Semana 4-5)

#### Tarea 2.2.1 — Crear DTOs (Data Transfer Objects)

**Archivo nuevo:** `kingdomkids-backend/src/interfaces/kid.dto.ts`

```typescript
export interface CreateKidDto {
    uuid: string;
    name: string;
    lastname: string;
    birthday: string;
    age: string;
    address: string;
    allergy: string;
    allergy_description?: string;
    medical_condition: string;
    medical_condition_description?: string;
    mdf_member: string;
    another_church: string;
    another_church_name?: string;
    invited: string;
    invite_name?: string;
    qr_code?: string;
    terms_condition: string | number;
}

export interface UpdateKidDto {
    qr_code?: string;
}

export interface KidResponse {
    ok: boolean;
    kid?: any;        // Será reemplazado por KidsModel en Fase 3
    kids?: any[];
    register?: any;
    registers?: any[];
    message?: string;
}
```

**Archivo nuevo:** `kingdomkids-backend/src/interfaces/parent.dto.ts`

```typescript
export interface CreateParentDto {
    kid_id: number;
    uuid: string;
    full_name: string;
    email: string;
    cellphone: string;
    type: string;
}
```

**Archivo nuevo:** `kingdomkids-backend/src/interfaces/authorized.dto.ts`

```typescript
export interface CreateAuthorizedDto {
    kid_id: number;
    uuid: string;
    full_name: string;
    cellphone: string;
    relationship: string;
}
```

**Archivo nuevo:** `kingdomkids-backend/src/interfaces/checkin.dto.ts`

```typescript
export interface CreateCheckinDto {
    uuid: string;
    kid_id: number;
    checkin_date: string;
}

export interface UpdateCheckoutDto {
    status: number;
    checkin_date: string | null;
    checkout_date: string;
}
```

#### Tarea 2.2.2 — Actualizar interfaces obsoletas

**Archivo a eliminar:** `kingdomkids-backend/src/interfaces/register.interface.ts` (reemplazado por DTOs)  
**Archivo a eliminar:** `kingdomkids-backend/src/interfaces/checkin_and_out.interface.ts` (reemplazado por DTOs)

#### Tarea 2.2.3 — Aplicar tipos en queries

Ejemplo para `kids.query.ts` — aplicar el mismo patrón a todas las queries:

```typescript
import { KidsModel } from '../models/kids.model';
import { ParentsModel } from '../models/parents.model';
import { AuthorizedModel } from '../models/authorized.model';
import { CreateKidDto, UpdateKidDto, KidResponse } from '../interfaces/kid.dto';

export class KidsQuery {

    public async find(name: string): Promise<KidResponse> {
        try {
            const register = await KidsModel.findOne({ where: { name } });
            return { ok: true, register };
        } catch (e) {
            console.error('KidsQuery.find error:', e);
            return { ok: false };
        }
    }

    public async register(data: CreateKidDto): Promise<KidResponse> {
        try {
            const kid = await KidsModel.create(data as any);
            return { ok: true, kid };
        } catch (e) {
            console.error('KidsQuery.register error:', e);
            return { ok: false };
        }
    }

    public async update(registerId: number, data: UpdateKidDto): Promise<KidResponse> {
        try {
            const kid = await KidsModel.update(data as any, { where: { id: registerId } });
            return { ok: true, kid };
        } catch (e) {
            console.error('KidsQuery.update error:', e);
            return { ok: false };
        }
    }

    // ... aplicar el mismo patrón a los demás métodos
}
```

**Criterio de aceptación:**
- [ ] `npm run build` sin errores de TypeScript
- [ ] No queda ningún parámetro de función tipado como `any` (en lo posible)
- [ ] Cada query devuelve un tipo de respuesta definido

---

### 🔧 Sprint 2.3 — Corregir Bugs Conocidos (Semana 5-6)

#### Tarea 2.3.1 — Corregir race condition en `files.ts`

**Archivo a modificar:** `kingdomkids-backend/src/helpers/files.ts`

Reemplazar la función `converBase64ToJpg`:

```typescript
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import moment from 'moment';

// ...

public async converBase64ToJpg(data: string): Promise<{ ok: boolean; image?: string; message?: string }> {
    const base64Data = data.replace(/^data:image\/(png|jpeg);base64,/, '');
    const filePath = process.env.FILE_PATH;

    try {
        const image = moment().unix() + '.jpg';
        await fsPromises.writeFile(`${filePath}/${image}`, base64Data, { encoding: 'base64' });
        return { ok: true, image };
    } catch (e) {
        console.error('Error al guardar QR:', e);
        return { ok: false, message: 'Existen problemas al guardar el QR' };
    }
}
```

#### Tarea 2.3.2 — Corregir queries copy-paste en `parents.query.ts` y `authorized.query.ts`

Estos archivos contienen métodos `find`, `show`, `index` que consultan `KidsModel` en lugar de `ParentsModel`/`AuthorizedModel`. Eliminar los métodos que no corresponden y dejar solo los que realmente usan el modelo correcto.

**Archivo:** `kingdomkids-backend/src/queries/parents.query.ts` — Limpiar a:
```typescript
import { ParentsModel } from '../models/parents.model';
import { CreateParentDto } from '../interfaces/parent.dto';

export class ParentsQueries {
    public async register(data: CreateParentDto) {
        try {
            const parent = await ParentsModel.create(data as any);
            return { ok: true, parent };
        } catch (e) {
            console.error('ParentsQueries.register error:', e);
            return { ok: false };
        }
    }
}
```

**Archivo:** `kingdomkids-backend/src/queries/authorized.query.ts` — Limpiar a:
```typescript
import { AuthorizedModel } from '../models/authorized.model';
import { CreateAuthorizedDto } from '../interfaces/authorized.dto';

export class AuthorizedQueries {
    public async register(data: CreateAuthorizedDto) {
        try {
            const authorized = await AuthorizedModel.create(data as any);
            return { ok: true, authorized };
        } catch (e) {
            console.error('AuthorizedQueries.register error:', e);
            return { ok: false };
        }
    }
}
```

#### Tarea 2.3.3 — Sincronizar modelo CheckInAndOut con BD real

**Archivo a modificar:** `kingdomkids-backend/src/models/checkin_and_out.model.ts`

Agregar los campos faltantes que se usan en el controller:

```typescript
import { Model, DataTypes } from 'sequelize';
import { database } from '../config/database';

export class CheckInAndOutModel extends Model {
    public id!: number;
    public uuid!: string;
    public kid_id!: number;
    public checkin_date!: Date | null;
    public checkout_date!: Date | null;
    public status!: number;
    public createdAt!: Date;
    public updatedAt!: Date;
}

CheckInAndOutModel.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    uuid: {
        type: DataTypes.STRING,
        allowNull: false
    },
    kid_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    checkin_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    checkout_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    }
}, {
    sequelize: database,
    tableName: 'checkin_register',
    timestamps: true
});
```

> ⚠️ **PRECAUCIÓN:** Antes de aplicar este cambio, verificar que los campos `checkout_date` y `status` existen en la tabla real de MySQL. Si no existen, crear la migración:
> ```sql
> ALTER TABLE checkin_register 
>     ADD COLUMN checkout_date DATETIME NULL AFTER checkin_date,
>     ADD COLUMN status TINYINT NOT NULL DEFAULT 1 AFTER checkout_date;
> ```

#### Tarea 2.3.4 — Corregir bug en reporte Excel (authorized duplicado)

**Archivo:** `kingdomkids-backend/src/controllers/register.controller.ts`

En el método `excelByAge`, la persona autorizada 2 usa el índice `[0]` en lugar de `[1]`:

```typescript
// ANTES (bug):
auth_person_two_name: element['authorized'][0]?.full_name,
auth_person_two_cellphone: element['authorized'][0]?.cellphone,
auth_person_two_relationship: element['authorized'][0]?.relationship

// DESPUÉS (correcto):
auth_person_two_name: element['authorized'][1]?.full_name,
auth_person_two_cellphone: element['authorized'][1]?.cellphone,
auth_person_two_relationship: element['authorized'][1]?.relationship
```

**Criterio de aceptación:**
- [ ] QR se genera correctamente (sin race condition)
- [ ] Queries de parents y authorized no consultan modelo incorrecto
- [ ] Modelo CheckInAndOut refleja columnas reales de BD
- [ ] Reporte Excel muestra persona autorizada 1 y 2 correctamente (no duplicada)

---

### ✅ Entregables FASE 2

| Entregable | Verificación |
|---|---|
| 0 archivos residuales en admin | `find . -name "*contract*" -o -name "*client*" -o -name "*developer*"` → vacío |
| 0 archivos example en backend | No existen `example.*` |
| DTOs definidos para todas las entidades | Existen 4 archivos en `interfaces/` |
| Bug de QR corregido | Registro exitoso genera QR consistentemente |
| Bug de Excel corregido | Persona autorizada 2 muestra datos correctos |
| Queries limpias | ParentsQueries y AuthorizedQueries solo consultan su propio modelo |
| Build limpio | `npm run build` y `ng build` sin warnings ni errores |

---

## 5. FASE 3 — Migración del Backend a NestJS (Semanas 7-14)

> **Objetivo:** Reescribir el backend completo en NestJS manteniendo compatibilidad con los frontends.  
> **Riesgo:** Alto (es el cambio más grande)  
> **Estrategia:** Strangler Fig — construir en paralelo, migrar ruta por ruta

---

### 🏗️ Sprint 3.1 — Scaffold del Proyecto NestJS (Semana 7)

#### Tarea 3.1.1 — Crear proyecto NestJS

```bash
# Desde la carpeta padre de los proyectos
npm i -g @nestjs/cli
nest new kingdomkids-api --package-manager npm --strict

cd kingdomkids-api
```

#### Tarea 3.1.2 — Instalar dependencias necesarias

```bash
# Base de datos
npm install @nestjs/sequelize sequelize sequelize-typescript mysql2
npm install -D @types/sequelize

# Autenticación
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install -D @types/passport-jwt @types/bcrypt

# Validación
npm install class-validator class-transformer

# Utilidades
npm install @nestjs/config uuid qrcode exceljs
npm install -D @types/qrcode @types/uuid

# Email
npm install @nestjs-modules/mailer nodemailer handlebars
npm install -D @types/nodemailer

# Documentación
npm install @nestjs/swagger

# Seguridad
npm install helmet @nestjs/throttler

# Logging
npm install nest-winston winston
```

#### Tarea 3.1.3 — Estructura de directorios del nuevo backend

```
kingdomkids-api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   ├── decorators/
│   │   │   └── public.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   └── interceptors/
│   │       └── logging.interceptor.ts
│   ├── config/
│   │   ├── database.config.ts
│   │   └── app.config.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   └── dto/
│   │   │       └── login.dto.ts
│   │   ├── kids/
│   │   │   ├── kids.module.ts
│   │   │   ├── kids.controller.ts
│   │   │   ├── kids.service.ts
│   │   │   ├── entities/
│   │   │   │   └── kid.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-kid.dto.ts
│   │   │       └── kid-response.dto.ts
│   │   ├── parents/
│   │   │   ├── parents.module.ts
│   │   │   ├── parents.service.ts
│   │   │   ├── entities/
│   │   │   │   └── parent.entity.ts
│   │   │   └── dto/
│   │   │       └── create-parent.dto.ts
│   │   ├── authorized/
│   │   │   ├── authorized.module.ts
│   │   │   ├── authorized.service.ts
│   │   │   ├── entities/
│   │   │   │   └── authorized.entity.ts
│   │   │   └── dto/
│   │   │       └── create-authorized.dto.ts
│   │   ├── checkin/
│   │   │   ├── checkin.module.ts
│   │   │   ├── checkin.controller.ts
│   │   │   ├── checkin.service.ts
│   │   │   ├── entities/
│   │   │   │   └── checkin.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-checkin.dto.ts
│   │   │       └── update-checkout.dto.ts
│   │   ├── reports/
│   │   │   ├── reports.module.ts
│   │   │   ├── reports.controller.ts
│   │   │   └── reports.service.ts
│   │   └── qr/
│   │       ├── qr.module.ts
│   │       └── qr.service.ts
│   └── shared/
│       ├── mailer/
│       │   ├── mailer.module.ts
│       │   └── mailer.service.ts
│       └── files/
│           ├── files.module.ts
│           └── files.service.ts
├── .env
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── nest-cli.json
```

#### Tarea 3.1.4 — Configurar `main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Prefijo global para mantener compatibilidad
    app.setGlobalPrefix('api');

    // Seguridad
    app.use(helmet());
    app.enableCors({
        origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:4200'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Validación automática con class-validator
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,          // Elimina propiedades no definidas en DTO
        forbidNonWhitelisted: true, // Error si envían propiedades no válidas
        transform: true,          // Transforma tipos automáticamente
    }));

    // Swagger
    const config = new DocumentBuilder()
        .setTitle('KingdomKids API')
        .setDescription('API para gestión de registro y asistencia de Kingdom Kids')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.LISTEN_PORT || 8000;
    await app.listen(port);
    console.log(`🚀 KingdomKids API running on port ${port}`);
    console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
```

#### Tarea 3.1.5 — Configurar `app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { KidsModule } from './modules/kids/kids.module';
import { CheckinModule } from './modules/checkin/checkin.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
    imports: [
        // Variables de entorno
        ConfigModule.forRoot({ isGlobal: true }),

        // Rate limiting global
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 100,
        }]),

        // Base de datos
        SequelizeModule.forRoot({
            dialect: 'mysql',
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '3306'),
            username: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            autoLoadModels: true,
            synchronize: false,    // NUNCA en producción
            logging: false,
            pool: {
                max: 5,
                min: 0,
                acquire: 60000,
                idle: 15000,
            },
        }),

        // Módulos de dominio
        AuthModule,
        KidsModule,
        CheckinModule,
        ReportsModule,
    ],
})
export class AppModule {}
```

**Criterio de aceptación:**
- [ ] `npm run start:dev` inicia el servidor NestJS sin errores
- [ ] `http://localhost:8000/api/docs` muestra la interfaz de Swagger
- [ ] La conexión a MySQL se establece correctamente
- [ ] Estructura de carpetas creada completa

---

### 🏗️ Sprint 3.2 — Módulo de Autenticación (Semana 8)

#### Tarea 3.2.1 — Entity de Administrator

**Archivo:** `src/modules/auth/entities/administrator.entity.ts`

```typescript
import { Column, Model, Table, DataType } from 'sequelize-typescript';

@Table({ tableName: 'users', timestamps: false })
export class Administrator extends Model {
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true })
    id: number;

    @Column({ type: DataType.STRING })
    username: string;

    @Column({ type: DataType.STRING })
    password: string;
}
```

#### Tarea 3.2.2 — DTOs de Login

**Archivo:** `src/modules/auth/dto/login.dto.ts`

```typescript
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'admin' })
    @IsString()
    @IsNotEmpty({ message: 'Favor de proporcionar el nombre de usuario.' })
    username: string;

    @ApiProperty({ example: '****' })
    @IsString()
    @IsNotEmpty({ message: 'Favor de proporcionar la contraseña.' })
    password: string;
}
```

#### Tarea 3.2.3 — JWT Strategy

**Archivo:** `src/modules/auth/strategies/jwt.strategy.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        const publicKeyPath = configService.get<string>('JWT_PUBLIC_KEY_PATH') || './src/keys/public.pem';
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: fs.readFileSync(publicKeyPath, 'utf8'),
            algorithms: ['RS256'],
        });
    }

    async validate(payload: any) {
        if (!payload.administradorId) {
            throw new UnauthorizedException();
        }
        return { adminId: payload.administradorId, userType: payload.userType };
    }
}
```

#### Tarea 3.2.4 — Decorador @Public()

**Archivo:** `src/common/decorators/public.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

#### Tarea 3.2.5 — Guard JWT Global

**Archivo:** `src/common/guards/jwt-auth.guard.ts`

```typescript
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        return super.canActivate(context);
    }
}
```

> Registrar como guard global en `AppModule` → `providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }]`

#### Tarea 3.2.6 — Auth Service + Controller

**Archivo:** `src/modules/auth/auth.service.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import Cryptr from 'cryptr';
import { Administrator } from './entities/administrator.entity';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    private cryptr: Cryptr;

    constructor(
        @InjectModel(Administrator) private adminModel: typeof Administrator,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {
        this.cryptr = new Cryptr(this.configService.get('CRYPTR_KEY') || '');
    }

    async login(dto: LoginDto) {
        const admin = await this.adminModel.findOne({ where: { username: dto.username } });

        if (!admin) {
            throw new UnauthorizedException('El usuario no se encuentra registrado.');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, admin.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Las credenciales no coinciden.');
        }

        const token = this.jwtService.sign({
            administradorId: this.cryptr.encrypt(admin.id.toString()),
            userType: this.cryptr.encrypt('administrador'),
        });

        return { ok: true, token, identity: admin };
    }
}
```

**Archivo:** `src/modules/auth/auth.controller.ts`

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Autenticación')
@Controller('login')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Public()
    @Post()
    @ApiOperation({ summary: 'Login de administrador' })
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }
}
```

**Criterio de aceptación:**
- [ ] `POST /api/login` con credenciales válidas → 200 + token
- [ ] `POST /api/login` con credenciales inválidas → 401
- [ ] Rutas sin `@Public()` retornan 401 sin token
- [ ] Token generado es compatible con el frontend admin existente
- [ ] Swagger documenta el endpoint de login

---

### 🏗️ Sprint 3.3 — Módulo de Kids (Registro) (Semanas 9-10)

#### Tarea 3.3.1 — Entities (Kid, Parent, Authorized)

Crear las 3 entities con decoradores `sequelize-typescript`, mapeando las tablas `kids`, `parents`, `authorized_person` exactamente igual que el modelo actual.

**Relaciones a definir:**
```typescript
// En Kid entity:
@HasMany(() => Parent, 'kid_id')
parents: Parent[];

@HasMany(() => Authorized, 'kid_id')
authorized: Authorized[];

@HasMany(() => Checkin, 'kid_id')
checkins: Checkin[];
```

#### Tarea 3.3.2 — DTOs con validación automática

**Archivo:** `src/modules/kids/dto/create-kid.dto.ts`

```typescript
import { IsNotEmpty, IsString, IsOptional, IsDateString, IsNumberString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKidDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'Favor de proporcionar el nombre.' })
    name: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'Favor de proporcionar el apellido.' })
    lastname: string;

    @ApiProperty({ example: '2020-05-15' })
    @IsString()
    @IsNotEmpty({ message: 'Favor de proporcionar la fecha de nacimiento.' })
    birthday: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'Favor de proporcionar la edad.' })
    age: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'Favor de proporcionar la dirección.' })
    address: string;

    @ApiProperty()
    allergy: string;

    @ApiPropertyOptional()
    @IsOptional()
    allergy_description?: string;

    @ApiProperty()
    medical_condition: string;

    @ApiPropertyOptional()
    @IsOptional()
    medical_condition_description?: string;

    @ApiProperty()
    mdf_member: string;

    @ApiProperty()
    another_church: string;

    @ApiPropertyOptional()
    @IsOptional()
    another_church_name?: string;

    @ApiProperty()
    invited: string;

    @ApiPropertyOptional()
    @IsOptional()
    invite_name?: string;

    @ApiProperty()
    terms_condition: any;

    @ApiProperty({ type: [Object] })
    parents: CreateParentDto[];

    @ApiPropertyOptional({ type: [Object] })
    @IsOptional()
    authorized_person?: CreateAuthorizedDto[];
}
```

#### Tarea 3.3.3 — Kids Service

El `KidsService` debe encapsular toda la lógica que actualmente vive en `RegisterController`:

```typescript
@Injectable()
export class KidsService {
    constructor(
        @InjectModel(Kid) private kidModel: typeof Kid,
        private parentsService: ParentsService,
        private authorizedService: AuthorizedService,
        private qrService: QrService,
        private filesService: FilesService,
    ) {}

    async register(dto: CreateKidDto) {
        // 1. Crear kid
        // 2. Crear parents (loop)
        // 3. Crear authorized persons (loop)
        // 4. Generar QR
        // 5. Guardar imagen QR
        // 6. Actualizar kid con referencia al QR
        // Todo envuelto en una transacción Sequelize
    }

    async findAll() { ... }
    async findOne(id: number) { ... }
    async findByName(name: string) { ... }
    async findByAge(age: string) { ... }
    async getConfirmation(id: number) { ... }
    async getQrImage(id: number) { ... }
}
```

> **CLAVE:** Usar transacciones de Sequelize para el flujo de registro:
> ```typescript
> const transaction = await this.kidModel.sequelize.transaction();
> try {
>     // ... todas las operaciones
>     await transaction.commit();
> } catch (e) {
>     await transaction.rollback();
>     throw e;
> }
> ```

#### Tarea 3.3.4 — Kids Controller

```typescript
@ApiTags('Registros de Niños')
@Controller('register')
export class KidsController {
    constructor(private kidsService: KidsService) {}

    @Public()
    @Post()
    @ApiOperation({ summary: 'Registrar un nuevo niño' })
    async register(@Body() dto: CreateKidDto) { ... }

    @Public()
    @Get('confirmation/:id')
    @ApiOperation({ summary: 'Obtener confirmación de registro' })
    async confirmation(@Param('id', ParseIntPipe) id: number) { ... }

    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Listar todos los niños registrados' })
    async findAll() { ... }

    @Get(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener niño por ID' })
    async findOne(@Param('id', ParseIntPipe) id: number) { ... }

    @Post('finder')            // Mantener por backward compat (pendiente deprecar)
    @ApiBearerAuth()
    async finder(@Body() body: FinderDto) { ... }

    @Get('qr/:id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener imagen QR del niño' })
    async getQr(@Param('id', ParseIntPipe) id: number) { ... }
}
```

**Criterio de aceptación:**
- [ ] `POST /api/register` crea kid + parents + authorized + QR (mismo payload que antes)
- [ ] `GET /api/register` devuelve la misma estructura JSON que el backend Express
- [ ] `GET /api/register/:id` incluye parents y authorized como relaciones
- [ ] Swagger documenta todos los endpoints con sus DTOs
- [ ] Transacción hace rollback si falla cualquier paso del registro

---

### 🏗️ Sprint 3.4 — Módulo de Check-in/Check-out (Semana 11)

#### Tarea 3.4.1 — Entity de Checkin

```typescript
@Table({ tableName: 'checkin_register', timestamps: true })
export class Checkin extends Model {
    @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
    id: number;

    @Column({ type: DataType.STRING, allowNull: false })
    uuid: string;

    @ForeignKey(() => Kid)
    @Column({ type: DataType.INTEGER, allowNull: false })
    kid_id: number;

    @BelongsTo(() => Kid)
    kid: Kid;

    @Column({ type: DataType.DATE, allowNull: true })
    checkin_date: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    checkout_date: Date;

    @Column({ type: DataType.INTEGER, defaultValue: 1 })
    status: number;
}
```

#### Tarea 3.4.2 — DTOs y Service

Mapear los endpoints existentes exactamente:

| Express (actual) | NestJS (nuevo) | Auth |
|---|---|---|
| `POST /api/checkin` | `POST /api/checkin` | @Public() |
| `GET /api/checkinAndOut/index` | `GET /api/checkinAndOut/index` | JWT |
| `GET /api/checkinAndOut/index/:register_id` | `GET /api/checkinAndOut/index/:register_id` | JWT |
| `GET /api/checkinAndOut/:id` | `GET /api/checkinAndOut/:id` | JWT |
| `PUT /api/checkinAndOut/checkout/:id` | `PUT /api/checkinAndOut/checkout/:id` | JWT |

> **IMPORTANTE:** Mantener exactamente las mismas rutas para que los frontends no necesiten cambios.

**Criterio de aceptación:**
- [ ] Check-in desde scanner QR sigue funcionando
- [ ] Check-out desde admin sigue funcionando
- [ ] Listado de check-ins del día funciona
- [ ] Swagger documenta todos los endpoints

---

### 🏗️ Sprint 3.5 — Módulo de Reportes + QR + Mailer (Semana 12)

#### Tarea 3.5.1 — QR Service

```typescript
@Injectable()
export class QrService {
    async generateQrDataUrl(data: string): Promise<string> {
        return QRCode.toDataURL(data, {
            errorCorrectionLevel: 'H',
            type: 'image/jpeg',
            margin: 1,
        });
    }
}
```

#### Tarea 3.5.2 — Reports Service

Extraer la generación de Excel del controller a un servicio dedicado:

```typescript
@Injectable()
export class ReportsService {
    constructor(private kidsService: KidsService) {}

    async generateExcelByAge(age: string): Promise<Buffer> {
        const kids = await this.kidsService.findByAge(age);
        const workbook = new ExcelJS.Workbook();
        // ... lógica de generación de Excel
        return workbook.xlsx.writeBuffer() as Promise<Buffer>;
    }
}
```

#### Tarea 3.5.3 — Mailer Service

```typescript
@Injectable()
export class MailerAppService {
    private transporter: any;

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: configService.get('EMAIL_HOST'),
            port: configService.get('EMAIL_PORT'),
            secure: true,
            auth: {
                user: configService.get('EMAIL_USER'),
                pass: configService.get('EMAIL_PASSWORD'),
            },
        });
    }

    async sendRegistrationEmail(to: string, kidName: string, qrImage: string) {
        // Implementar envío (descomentar la funcionalidad)
    }
}
```

**Criterio de aceptación:**
- [ ] `GET /api/reports/:age` descarga un Excel idéntico al actual
- [ ] El servicio de QR genera imágenes correctas
- [ ] El mailer está configurado (aunque se active más adelante)

---

### 🏗️ Sprint 3.6 — Testing del Backend NestJS (Semana 13)

#### Tarea 3.6.1 — Tests unitarios de servicios

```bash
# Generar tests
nest g --flat --no-spec false
```

**Tests mínimos requeridos:**

| Servicio | Tests |
|---|---|
| `AuthService` | login exitoso, credenciales inválidas, usuario no encontrado |
| `KidsService` | register completo, findAll, findOne, findByAge |
| `CheckinService` | checkin, checkout, index |
| `QrService` | generación de QR |
| `ReportsService` | generación de Excel |

```bash
# Ejecutar tests
npm run test
npm run test:cov   # Con cobertura
```

**Criterio de aceptación:**
- [ ] ≥ 70% de cobertura en servicios
- [ ] Todos los tests pasan
- [ ] Tests usan mocks para la BD (no acceden a MySQL real)

---

### 🏗️ Sprint 3.7 — Cutover del Backend (Semana 14)

#### Tarea 3.7.1 — Test de integración End-to-End

Ejecutar el nuevo backend NestJS contra los frontends existentes:

```
1. Iniciar NestJS en puerto 8000
2. Iniciar kingdomkids-admin (apuntando a localhost:8000)
3. Iniciar kingdomkids-register (apuntando a localhost:8000)
4. Ejecutar flujo completo:
   a. Login en admin ✓
   b. Registrar niño desde register ✓
   c. Ver lista de niños en admin ✓
   d. Escanear QR para check-in ✓
   e. Registrar check-out desde admin ✓
   f. Descargar reporte Excel ✓
```

#### Tarea 3.7.2 — Despliegue en producción

```
1. Backup de BD MySQL
2. Detener backend Express
3. Desplegar backend NestJS (misma URL, mismo puerto)
4. Verificar todos los flujos
5. Si falla → rollback al Express
```

**Criterio de aceptación:**
- [ ] Todos los flujos E2E pasan con el nuevo backend
- [ ] Los frontends NO necesitaron ningún cambio
- [ ] Swagger accesible en producción en `/api/docs`
- [ ] Tiempo de respuesta ≤ al backend Express
- [ ] Logs estructurados visibles en consola/archivo

---

### ✅ Entregables FASE 3

| Entregable | Verificación |
|---|---|
| Backend NestJS funcionando | `npm run start:prod` sin errores |
| 100% de endpoints migrados | Swagger muestra 14 endpoints |
| JWT Auth global activa | Rutas protegidas devuelven 401 sin token |
| @Public() en rutas públicas | Registro y check-in funcionan sin token |
| Validación automática con DTOs | Enviar body incompleto → 400 con errores claros |
| Swagger completo | `/api/docs` documenta toda la API |
| ≥ 70% cobertura de tests | `npm run test:cov` |
| Backend Express retirado | Repositorio archivado o eliminado |

---

## 6. FASE 4 — Modernización de Frontends (Semanas 15-18)

> **Objetivo:** Limpiar los frontends y modernizar patrones de Angular.  
> **Riesgo:** Bajo  
> **Prerequisito:** Backend NestJS en producción

---

### 🎨 Sprint 4.1 — Refactorizar Frontend Admin (Semanas 15-16)

| # | Tarea | Detalle |
|---|---|---|
| 1 | Crear página 404 | Componente `NotFoundComponent` + ruta `**` |
| 2 | Crear página Home/Dashboard | Estadísticas: total niños, check-ins hoy, alergias, condiciones médicas |
| 3 | Mover lógica de `localStorage` a servicio | Dejar de usar `btoa` para datos de niños; usar un servicio con estado |
| 4 | Implementar interfaces TypeScript | Crear `Kid`, `Parent`, `Authorized`, `Checkin` interfaces |
| 5 | Eliminar `moment.js` | Reemplazar por `date-fns` o API nativa `Intl.DateTimeFormat` |
| 6 | Agregar lazy loading completo | Cada módulo de pages debe cargarse lazy |
| 7 | Agregar página de check-ins | Tabla de check-ins del día con acciones de checkout |

---

### 🎨 Sprint 4.2 — Refactorizar Frontend Register (Semanas 17-18)

| # | Tarea | Detalle |
|---|---|---|
| 1 | Eliminar librería QR redundante | Quedarse con `html5-qrcode` O `ngx-scanner-qrcode`, no ambas |
| 2 | Crear interfaces TypeScript | Mismas interfaces que admin para consistencia |
| 3 | Eliminar `moment.js` | Reemplazar por `date-fns` |
| 4 | Mejorar UX del formulario | Indicadores de paso, validación visual en tiempo real |
| 5 | Agregar PWA support | Para uso offline del scanner en el lugar del evento |

---

### ✅ Entregables FASE 4

| Entregable | Verificación |
|---|---|
| Admin sin código residual | 0 archivos ajenos al dominio KingdomKids |
| Página 404 funcional | URL inválida → muestra 404 |
| Dashboard con estadísticas | `/home` muestra métricas |
| Interfaces TypeScript | No queda `any` en servicios |
| Sin moment.js | `package.json` sin `moment` |
| Scanner con 1 sola librería | Solo una librería de QR en `package.json` |

---

## 7. FASE 5 — DevOps, Testing y Observabilidad (Semanas 19-22)

---

### 🐳 Sprint 5.1 — Dockerización (Semanas 19-20)

#### Tarea 5.1.1 — Dockerfile del Backend

**Archivo:** `kingdomkids-api/Dockerfile`

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Crear directorio para QRs
RUN mkdir -p /app/files/qrs

EXPOSE 8000
CMD ["node", "dist/main.js"]
```

#### Tarea 5.1.2 — Docker Compose completo

**Archivo:** `docker-compose.yml` (raíz del workspace)

```yaml
version: '3.8'
services:
  api:
    build: ./kingdomkids-api
    ports:
      - "8000:8000"
    environment:
      - DB_HOST=db
      - DB_PORT=3306
      - DB_NAME=kingdomkids
      - DB_USER=root
      - DB_PASS=root_password
    depends_on:
      - db
    volumes:
      - qr_files:/app/files/qrs

  admin:
    build: ./kingdomkids-admin
    ports:
      - "4200:80"

  register:
    build: ./kingdomkids-register
    ports:
      - "4300:80"

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: kingdomkids
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
  qr_files:
```

---

### ⚙️ Sprint 5.2 — CI/CD Pipeline (Semana 21)

#### Tarea 5.2.1 — GitHub Actions para Backend

**Archivo:** `.github/workflows/backend.yml`

```yaml
name: Backend CI/CD

on:
  push:
    branches: [main, develop]
    paths: ['kingdomkids-api/**']
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd kingdomkids-api && npm ci
      - run: cd kingdomkids-api && npm run lint
      - run: cd kingdomkids-api && npm run test:cov
      - run: cd kingdomkids-api && npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      # Deployment steps (SSH, Docker, etc.)
      - name: Deploy to production
        run: echo "Deploy step - configurar según hosting"
```

---

### 📊 Sprint 5.3 — Observabilidad (Semana 22)

| # | Tarea | Herramienta |
|---|---|---|
| 1 | Logging estructurado | Winston con niveles (error, warn, info, debug) |
| 2 | Interceptor de logging | Log automático de cada request (método, URL, status, duración) |
| 3 | Health check endpoint | `GET /api/health` → estado del servidor + BD |
| 4 | Métricas básicas | Endpoint `/api/metrics` con contadores de requests |

**Health Check:**
```typescript
@Controller('health')
export class HealthController {
    @Public()
    @Get()
    async check() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: 'connected', // Verificar conexión real
        };
    }
}
```

---

### ✅ Entregables FASE 5

| Entregable | Verificación |
|---|---|
| Docker Compose funcional | `docker-compose up` levanta todo el stack |
| CI/CD pipeline activo | Push a `main` → tests + deploy automático |
| Logs estructurados | Cada request deja un log con timestamp, método, status |
| Health check | `GET /api/health` → 200 |

---

## 8. FASE 6 — Evolución y Escala (Semanas 23-26)

> **Objetivo:** Features avanzados y preparación para crecimiento.

---

### 🚀 Sprint 6.1 — Features Avanzados

| # | Feature | Detalle | Prioridad |
|---|---|---|---|
| 1 | **Paginación** | Todos los endpoints de listado con `page`, `limit`, `total` | Alta |
| 2 | **Soft deletes** | Campo `deletedAt` en todas las tablas; `paranoid: true` en Sequelize | Alta |
| 3 | **Auditoría** | Tabla `audit_log` con quién, qué y cuándo se hizo cada cambio | Media |
| 4 | **API Versioning** | Prefijo `/api/v1/` para poder crear v2 sin romper v1 | Media |
| 5 | **Email de confirmación** | Reactivar y completar el envío de email post-registro | Media |
| 6 | **Notificaciones en tiempo real** | WebSocket gateway para check-in en vivo en el admin | Baja |

---

### 🚀 Sprint 6.2 — Mejora del Modelo de Datos

#### Migración SQL para corregir tipos de datos:

```sql
-- Backup primero
CREATE TABLE kids_backup AS SELECT * FROM kids;

-- Corregir tipos booleanos
ALTER TABLE kids
    MODIFY COLUMN allergy TINYINT(1) NOT NULL DEFAULT 0,
    MODIFY COLUMN medical_condition TINYINT(1) NOT NULL DEFAULT 0,
    MODIFY COLUMN mdf_member TINYINT(1) NOT NULL DEFAULT 0,
    MODIFY COLUMN another_church TINYINT(1) NOT NULL DEFAULT 0,
    MODIFY COLUMN invited TINYINT(1) NOT NULL DEFAULT 0,
    MODIFY COLUMN terms_condition TINYINT(1) NOT NULL DEFAULT 0;

-- Corregir tipo de edad
ALTER TABLE kids
    MODIFY COLUMN age TINYINT UNSIGNED NOT NULL;

-- Agregar índices
ALTER TABLE kids ADD INDEX idx_kids_uuid (uuid);
ALTER TABLE kids ADD INDEX idx_kids_age (age);
ALTER TABLE parents ADD INDEX idx_parents_kid_id (kid_id);
ALTER TABLE authorized_person ADD INDEX idx_authorized_kid_id (kid_id);
ALTER TABLE checkin_register ADD INDEX idx_checkin_kid_id (kid_id);
ALTER TABLE checkin_register ADD INDEX idx_checkin_date (checkin_date);
```

> ⚠️ Actualizar los entities de NestJS para reflejar los nuevos tipos después de la migración.

---

### 🚀 Sprint 6.3 — Preparación para Escala

| # | Mejora | Detalle |
|---|---|---|
| 1 | **Cloud Storage para QRs** | Migrar de filesystem local a S3/GCS para los archivos QR |
| 2 | **Caché con Redis** | Cachear consultas frecuentes (listado de niños, dashboard) |
| 3 | **Connection pooling** | Aumentar pool de BD si el tráfico crece |
| 4 | **CDN para frontends** | Servir Angular builds desde CloudFront/Cloudflare |

---

### ✅ Entregables FASE 6

| Entregable | Verificación |
|---|---|
| Paginación en todos los listados | `GET /api/register?page=1&limit=20` → respuesta paginada |
| Soft deletes activos | Eliminar niño → `deletedAt` se llena (no se borra físicamente) |
| Modelo de datos corregido | Booleanos son `TINYINT(1)`, edad es `TINYINT UNSIGNED` |
| Índices creados | `SHOW INDEX FROM kids` muestra índices adicionales |
| Email de confirmación activo | Registrar niño → padres reciben email con QR |

---

## 9. Cronograma Visual

```
SEMANA   1    2    3    4    5    6    7    8    9   10   11   12   13   14   15   16   17   18   19   20   21   22   23   24   25   26
        ─────────────── ──────────────── ──────────────────────────────────────── ──────────────────── ──────────────────── ─────────────────
FASE 1  ████████████████                                                                                                  
        JWT  CORS  Keys  AuthGuard                                                                                        
                    ErrorMW                                                                                               

FASE 2                   ████████████████                                                                                 
                         Limpieza  DTOs  Bugs                                                                             

FASE 3                                   ████████████████████████████████████████                                          
                                         Scaffold Auth  Kids  Checkin Reports Tests Cutover                               

FASE 4                                                                           ████████████████████                      
                                                                                 Admin     Register                       

FASE 5                                                                                                ████████████████████
                                                                                                      Docker CI/CD  Logs  

FASE 6                                                                                                                    █████████████████
                                                                                                                          Paginar Soft-del
                                                                                                                          BD Types  Scale  
```

---

## 10. Checklist Global de Migración

### Pre-Migración
- [ ] Ramas de Git creadas (develop, migration/phase-X)
- [ ] `.nvmrc` en todos los repos
- [ ] `.env.example` documentado
- [ ] `.gitignore` robusto aplicado
- [ ] Backup completo de BD MySQL

### FASE 1 — Seguridad ✅
- [ ] Middleware JWT creado y aplicado (13 rutas protegidas)
- [ ] CORS con whitelist configurado
- [ ] Rate limiting activo (global + login)
- [ ] Claves RSA fuera del repositorio
- [ ] AuthGuard activo en admin
- [ ] Imports de environment corregidos
- [ ] Scripts npm funcionales en backend
- [ ] Middleware de error global activo

### FASE 2 — Limpieza ✅
- [ ] 0 archivos residuales en admin
- [ ] 0 archivos example en backend
- [ ] DTOs creados para todas las entidades
- [ ] Race condition de QR corregida
- [ ] Bug de Excel (authorized duplicado) corregido
- [ ] Queries limpiadas (sin copiar-pegar incorrecto)
- [ ] Modelo CheckInAndOut sincronizado con BD

### FASE 3 — NestJS ✅
- [ ] Proyecto NestJS creado con estructura modular
- [ ] Módulo Auth migrado (login + JWT strategy)
- [ ] Módulo Kids migrado (CRUD + QR + registro completo)
- [ ] Módulo Checkin migrado (check-in + check-out)
- [ ] Módulo Reports migrado (Excel por edad)
- [ ] Servicios de QR, Files y Mailer extraídos
- [ ] Swagger completo y accesible
- [ ] Validación automática con class-validator
- [ ] Guard JWT global con decorador @Public()
- [ ] ≥ 70% cobertura de tests unitarios
- [ ] Tests E2E exitosos contra frontends existentes
- [ ] Cutover a producción exitoso
- [ ] Backend Express archivado

### FASE 4 — Frontends ✅
- [ ] Página 404 en admin
- [ ] Dashboard con estadísticas
- [ ] Interfaces TypeScript completas
- [ ] moment.js eliminado
- [ ] Scanner con 1 sola librería QR
- [ ] Datos de niño manejados por servicio (no localStorage directo)

### FASE 5 — DevOps ✅
- [ ] Dockerfile para cada proyecto
- [ ] docker-compose funcional
- [ ] CI/CD pipeline con GitHub Actions
- [ ] Logging estructurado con Winston
- [ ] Health check endpoint activo
- [ ] Interceptor de logging en cada request

### FASE 6 — Evolución ✅
- [ ] Paginación en endpoints de listado
- [ ] Soft deletes implementados
- [ ] Tipos de datos corregidos en BD (booleanos, edad)
- [ ] Índices de BD creados
- [ ] Email de confirmación reactivado
- [ ] API versionada (`/api/v1/`)

---

> **Duración total estimada:** 26 semanas (~6 meses) con 1 desarrollador full-time.  
> Con 2 desarrolladores, las fases 3-4 pueden paralelizarse reduciendo a ~18 semanas.
> 
> **Costo de NO migrar:** Cada día que pasa con los datos de menores expuestos sin autenticación es un riesgo legal y ético creciente. La FASE 1 debe ejecutarse de forma inmediata independientemente del resto del roadmap.

