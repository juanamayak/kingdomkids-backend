# 🚀 Guía de Despliegue a Producción — KingdomKids
### DNS en HostGator · Servidor en IONOS VPS · FileZilla + PM2

> **Dominio:** `mundodefeplaya.org`
> **API en producción:** `https://api.mundodefeplaya.org:3035/api`
> **Última revisión:** Julio 2026

---

## Arquitectura general

```
  Usuario final
       │
       ▼
  HostGator DNS          ← Solo gestiona los registros DNS (A records)
  mundodefeplaya.org
       │  apunta a IP de IONOS
       ▼
  Servidor IONOS VPS     ← Aquí corre TODO: Node.js, Apache/Nginx, MySQL
  /var/www/html/
    kingdomkids-backend/   (API con PM2)
    admin/                 (Angular estático)
    registro/              (Angular estático)
```

> ⚠️ **HostGator NO sirve ningún archivo.** Solo actúa como gestor de DNS para redirigir
> los dominios a la IP de tu servidor IONOS. Toda la configuración de servidor se hace en IONOS.

---

## Índice

1. [Obtener la IP de tu servidor IONOS](#1-obtener-la-ip-de-tu-servidor-ionos)
2. [Configurar DNS en HostGator → apuntar a IONOS](#2-configurar-dns-en-hostgator--apuntar-a-ionos)
3. [Conexión al servidor IONOS con FileZilla](#3-conexión-al-servidor-ionos-con-filezilla)
4. [Preparar el Backend antes de subir](#4-preparar-el-backend-antes-de-subir)
5. [Subir el Backend con FileZilla](#5-subir-el-backend-con-filezilla)
6. [Configurar el .env en el servidor](#6-configurar-el-env-en-el-servidor)
7. [Configurar MySQL en IONOS](#7-configurar-mysql-en-ionos)
8. [Instalar dependencias e iniciar con PM2](#8-instalar-dependencias-e-iniciar-con-pm2)
9. [Preparar los Frontends antes de subir](#9-preparar-los-frontends-antes-de-subir)
10. [Subir los Frontends con FileZilla](#10-subir-los-frontends-con-filezilla)
11. [Configurar el servidor web en IONOS (Apache o Nginx)](#11-configurar-el-servidor-web-en-ionos-apache-o-nginx)
12. [Instalar SSL con Certbot en IONOS](#12-instalar-ssl-con-certbot-en-ionos)
13. [Abrir el puerto 3035 en IONOS](#13-abrir-el-puerto-3035-en-ionos)
14. [Verificación final](#14-verificación-final)
15. [Flujo de actualización re-deploy](#15-flujo-de-actualización-re-deploy)

---

## 1. Obtener la IP de tu servidor IONOS

Necesitas la IP pública de tu VPS para configurar el DNS en HostGator.

1. Entra a tu cuenta en [cloud.ionos.com](https://cloud.ionos.com) (o [my.ionos.com](https://my.ionos.com))
2. Ve a **Servidores** → selecciona tu VPS
3. Copia la **IP pública** (ej. `85.215.xxx.xxx`)

Guárdala, la usarás en el siguiente paso.

---

## 2. Configurar DNS en HostGator → apuntar a IONOS

> HostGator solo actúa como gestor de DNS. Aquí NO creas subdominios con Document Root,
> solo agregas registros **A** que apuntan la IP de tu servidor IONOS.

### 2.1 Entrar al editor de zonas DNS

1. Abre tu **cPanel de HostGator**
2. Ve a **Dominios → Editor de zonas DNS** (o "Zone Editor")
3. Busca `mundodefeplaya.org` y clic en **Administrar**

### 2.2 Agregar los 3 registros A

Clic en **+ Agregar registro** para cada uno:

| Nombre (subdominio) | TTL    | Tipo | Dirección (IP de IONOS) |
|---------------------|--------|------|------------------------|
| `api`               | `3600` | `A`  | `85.215.xxx.xxx`       |
| `admin`             | `3600` | `A`  | `85.215.xxx.xxx`       |
| `registro`          | `3600` | `A`  | `85.215.xxx.xxx`       |

> Reemplaza `85.215.xxx.xxx` con la IP real de tu servidor IONOS.

### 2.3 Verificar la propagación DNS

Los cambios DNS pueden tardar entre **5 minutos y 48 horas** en propagarse globalmente.

Para verificar antes de continuar:
```bash
# Desde tu PC (CMD o terminal)
nslookup api.mundodefeplaya.org
# Debe devolver la IP de tu servidor IONOS
```

También puedes usar [https://dnschecker.org](https://dnschecker.org) para ver la propagación global.

---

## 3. Conexión al servidor IONOS con FileZilla

Las credenciales de FileZilla son las de **IONOS**, no las de HostGator.

### 3.1 Obtener credenciales SSH de IONOS

1. Abre [my.ionos.com](https://my.ionos.com) → tu servidor VPS
2. En la sección de acceso busca: usuario `root` y la contraseña que definiste al crear el servidor
   (Si no la recuerdas, puedes restablecerla desde el panel de IONOS)

### 3.2 Configuración en FileZilla

Abre FileZilla → **Archivo → Gestor de sitios → Nuevo sitio**

```
Protocolo:      SFTP - SSH File Transfer Protocol
Servidor:       85.215.xxx.xxx    ← IP de tu servidor IONOS
Puerto:         22
Modo de acceso: Normal
Usuario:        root
Contraseña:     tu-contraseña-ionos
```

> ✅ Si IONOS usa autenticación por llave SSH en lugar de contraseña,
> en "Modo de acceso" selecciona **Archivo de clave** y apunta al archivo `.ppk` o `.pem`.

### 3.3 Mostrar archivos ocultos en FileZilla

Los archivos `.htaccess` y `.env` empiezan con punto y FileZilla los oculta por defecto.
Actívalos en: **Servidor → Forzar mostrar archivos ocultos**

### 3.4 Estructura de carpetas en tu servidor IONOS

```
/var/www/html/
  ├── kingdomkids-backend/    ← API Node.js
  ├── admin/                  ← SPA Admin Panel
  └── registro/               ← SPA Register App
```

> Si las carpetas no existen aún, créalas desde FileZilla con clic derecho → **Crear directorio**,
> o desde SSH con `mkdir -p /var/www/html/admin /var/www/html/registro`.

---

## 4. Preparar el Backend antes de subir

Haz esto **en tu computadora local** antes de subir archivos.

### 4.1 Compilar TypeScript

```bash
cd kingdomkids-backend
npm install
npx tsc
```

Esto genera la carpeta `dist/` con el JavaScript compilado listo para producción.

### 4.2 Qué archivos subir y cuáles NO

| ¿Subir? | Carpeta / Archivo | Motivo |
|---------|------------------|--------|
| ✅ Sí | `dist/` | Código compilado que ejecuta Node.js |
| ✅ Sí | `package.json` | Para instalar dependencias en el servidor |
| ✅ Sí | `package-lock.json` | Para versiones exactas de dependencias |
| ✅ Sí | `files/` | Carpeta donde se guardan los QR generados |
| ❌ No | `src/` | Código fuente TypeScript (no se usa en prod) |
| ❌ No | `node_modules/` | Se instala directamente en el servidor |
| ❌ No | `src/keys/` | Claves RSA — subirlas a una ruta segura aparte |
| ❌ No | `.env` | Se crea manualmente en el servidor |
| ❌ No | `certificates/` | Se suben por separado a una ruta segura |

---

## 5. Subir el Backend con FileZilla

### 5.1 Subir el código compilado

Destino en el servidor: `/var/www/html/kingdomkids-backend/`

```
Tu PC (local)                         →  Servidor IONOS
──────────────────────────────────────────────────────────────────────────────
dist/                                 →  /var/www/html/kingdomkids-backend/dist/
package.json                          →  /var/www/html/kingdomkids-backend/package.json
package-lock.json                     →  /var/www/html/kingdomkids-backend/package-lock.json
files/  (carpeta, puede ir vacía)     →  /var/www/html/kingdomkids-backend/files/
```

### 5.2 Subir los certificados SSL del backend

Crea la carpeta `/etc/ssl/kingdomkids/` en el servidor (desde SSH) y sube los certificados:

```bash
# Desde SSH en IONOS
mkdir -p /etc/ssl/kingdomkids
```

Luego desde FileZilla sube los archivos:
```
Tu PC: kingdomkids-backend/certificates/
  private.pem
  certificate.pem
  cabundle.pem

Destino en el servidor:
  /etc/ssl/kingdomkids/
    private.pem
    certificate.pem
    cabundle.pem
```

> 🔒 Esta ruta queda fuera de cualquier Document Root web. No es accesible por navegador.

---

## 6. Configurar el .env en el servidor

El `.env` se crea **directamente en el servidor via SSH**. Conéctate con:

```bash
# Desde CMD o PowerShell en Windows
ssh root@85.215.xxx.xxx
```

O usa **PuTTY** (Host: IP de IONOS, Port: 22).

Una vez conectado:

```bash
nano /var/www/html/kingdomkids-backend/.env
```

Pega el siguiente contenido y ajusta los valores:

```dotenv
# ─── Servidor ─────────────────────────────────────────────────
LISTEN_PORT=3035
MODE=prod

# ─── Base de datos ────────────────────────────────────────────
DB_HOST=localhost
DB_NAME=kingdomkids
DB_USER=kingdomkids_user
DB_PASS=TU_PASSWORD_DE_MYSQL_AQUI

# ─── Certificados SSL (rutas absolutas en el servidor) ────────
PRIVATE_SSL=/etc/ssl/kingdomkids/private.pem
CERTIFICATE_SSL=/etc/ssl/kingdomkids/certificate.pem
CABUNDLE_SSL=/etc/ssl/kingdomkids/cabundle.pem
```

Guarda: `Ctrl + O` → `Enter` → `Ctrl + X`

---

## 7. Configurar MySQL en IONOS

### 7.1 Instalar MySQL (si no está instalado)

```bash
sudo apt update
sudo apt install -y mysql-server
sudo mysql_secure_installation   # Configura contraseña root y seguridad básica
```

### 7.2 Crear la base de datos y usuario

```bash
mysql -u root -p
```

```sql
CREATE DATABASE kingdomkids CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'kingdomkids_user'@'localhost' IDENTIFIED BY 'TU_PASSWORD_SEGURA';
GRANT ALL PRIVILEGES ON kingdomkids.* TO 'kingdomkids_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 7.3 Importar el esquema

```bash
mysql -u kingdomkids_user -p kingdomkids < /var/www/html/kingdomkids-backend/docs/kingdomkids.sql
```

> Si `kingdomkids.sql` no está en el servidor aún, súbelo con FileZilla a
> `/var/www/html/kingdomkids-backend/docs/`.

---

## 8. Instalar dependencias e iniciar con PM2

Conéctate por SSH a tu servidor IONOS.

### 8.1 Verificar versiones

```bash
node --version    # v18 o v20 recomendado
npm --version
pm2 --version     # Si no está: npm install -g pm2
```

### 8.2 Instalar dependencias del proyecto

```bash
cd /var/www/html/kingdomkids-backend
npm install --omit=dev
```

### 8.3 Iniciar el proceso con PM2

```bash
pm2 start dist/app.js --name "kingdomkids-api"
pm2 status
pm2 logs kingdomkids-api --lines 30
```

### 8.4 Persistir PM2 al reiniciar el servidor

```bash
pm2 save
pm2 startup
# Ejecuta el comando que devuelva la terminal (algo como: sudo env PATH=... pm2 startup systemd ...)
```

### 8.5 Comandos PM2 de uso frecuente

```bash
pm2 status                             # Estado de todos los procesos
pm2 logs kingdomkids-api               # Logs en tiempo real
pm2 logs kingdomkids-api --lines 50    # Últimas 50 líneas
pm2 restart kingdomkids-api            # Reiniciar tras actualizar código
pm2 stop kingdomkids-api               # Detener
pm2 monit                              # Dashboard CPU/RAM/logs
```

---

## 9. Preparar los Frontends antes de subir

Haz esto **en tu computadora local**.

### 9.1 Los environments ya están configurados correctamente

**Admin** — `kingdomkids-admin/src/environments/environment.ts`:
```typescript
export const environment = {
    production: true,
    urlApi: 'https://api.mundodefeplaya.org:3035/api',
};
```

**Register** — `kingdomkids-register/src/environments/environment.ts`:
```typescript
export const environment = {
    production: true,
    urlApi: 'https://api.mundodefeplaya.org:3035/api',
};
```

✅ Ambos ya apuntan a la URL de producción correcta. No necesitas cambiar nada.

### 9.2 Compilar el Admin Panel

```bash
cd kingdomkids-admin
npm install
npx ng build --configuration=production
```

Archivos generados en: `dist/ja-angular-frontend-template/browser/`

### 9.3 Compilar el Register App

```bash
cd kingdomkids-register
npm install
npx ng build --configuration=production
```

Archivos generados en: `dist/kingdomkids-register/browser/`

---

## 10. Subir los Frontends con FileZilla

### 10.1 Admin Panel

```
Tu PC (origen)                                        Servidor IONOS (destino)
──────────────────────────────────────────────────────────────────────────────
dist/ja-angular-frontend-template/browser/*  →  /var/www/html/admin/
```

### 10.2 Register App

```
Tu PC (origen)                               Servidor IONOS (destino)
────────────────────────────────────────────────────────────────────
dist/kingdomkids-register/browser/*  →  /var/www/html/registro/
```

> ⚠️ Verifica que la carpeta `assets/wasm/` se subió correctamente — la necesita el scanner QR.

---

## 11. Configurar el servidor web en IONOS (Apache o Nginx)

Los frontends Angular son archivos estáticos que Apache o Nginx deben servir.
El backend Node.js **no** necesita configuración de servidor web — PM2 lo maneja directamente.

### ¿Tengo Apache o Nginx?

```bash
# Desde SSH en IONOS
apache2 -v       # Si muestra versión → tienes Apache
nginx -v         # Si muestra versión → tienes Nginx
```

---

### Opción A — Apache

#### Instalar Apache (si no está)
```bash
sudo apt install -y apache2
sudo a2enmod rewrite headers
sudo systemctl restart apache2
```

#### Virtual Host para el Admin Panel

```bash
sudo nano /etc/apache2/sites-available/admin.conf
```

```apache
<VirtualHost *:80>
    ServerName admin.mundodefeplaya.org
    DocumentRoot /var/www/html/admin

    <Directory /var/www/html/admin>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Virtual Host para el Register App

```bash
sudo nano /etc/apache2/sites-available/registro.conf
```

```apache
<VirtualHost *:80>
    ServerName registro.mundodefeplaya.org
    DocumentRoot /var/www/html/registro

    <Directory /var/www/html/registro>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Activar los sitios

```bash
sudo a2ensite admin.conf registro.conf
sudo systemctl reload apache2
```

#### Crear los .htaccess para Angular Router

Crea el archivo en tu PC y súbelo con FileZilla a cada carpeta del servidor.

**`/var/www/html/admin/.htaccess`:**
```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

**`/var/www/html/registro/.htaccess`:**
```apache
Options -MultiViews
RewriteEngine On

<FilesMatch "\.wasm$">
    Header set Content-Type "application/wasm"
</FilesMatch>

RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

---

### Opción B — Nginx

#### Instalar Nginx (si no está)
```bash
sudo apt install -y nginx
```

#### Configuración para Admin Panel

```bash
sudo nano /etc/nginx/sites-available/admin
```

```nginx
server {
    listen 80;
    server_name admin.mundodefeplaya.org;
    root /var/www/html/admin;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Configuración para Register App

```bash
sudo nano /etc/nginx/sites-available/registro
```

```nginx
server {
    listen 80;
    server_name registro.mundodefeplaya.org;
    root /var/www/html/registro;
    index index.html;

    location ~* \.wasm$ {
        add_header Content-Type application/wasm;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Activar los sitios

```bash
sudo ln -s /etc/nginx/sites-available/admin    /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/registro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 12. Instalar SSL con Certbot en IONOS

> En IONOS VPS no hay AutoSSL de cPanel. El SSL se instala directamente en el servidor con **Certbot**.
> Esto aplica para los frontends (puerto 443). El backend usa sus propios certificados PEM.

### 12.1 Instalar Certbot

```bash
sudo apt install -y certbot

# Si usas Apache:
sudo apt install -y python3-certbot-apache

# Si usas Nginx:
sudo apt install -y python3-certbot-nginx
```

### 12.2 Emitir certificados (los DNS ya deben estar propagados)

```bash
# Con Apache:
sudo certbot --apache -d admin.mundodefeplaya.org -d registro.mundodefeplaya.org

# Con Nginx:
sudo certbot --nginx -d admin.mundodefeplaya.org -d registro.mundodefeplaya.org
```

Certbot edita automáticamente los virtual hosts y activa HTTPS.

### 12.3 Renovación automática

Certbot instala un cron job para renovar automáticamente. Puedes verificarlo con:

```bash
sudo certbot renew --dry-run
```

### 12.4 SSL para el Backend Node.js (puerto 3035)

El backend maneja su propio HTTPS con los certificados que subiste a `/etc/ssl/kingdomkids/`.
Si necesitas certificados Let's Encrypt para el backend también:

```bash
# Emitir certificado (modo standalone — detiene temporalmente el backend)
pm2 stop kingdomkids-api
sudo certbot certonly --standalone -d api.mundodefeplaya.org
pm2 start kingdomkids-api

# Los archivos quedan en:
# /etc/letsencrypt/live/api.mundodefeplaya.org/privkey.pem
# /etc/letsencrypt/live/api.mundodefeplaya.org/cert.pem
# /etc/letsencrypt/live/api.mundodefeplaya.org/chain.pem
```

Actualiza el `.env` con estas rutas:
```dotenv
PRIVATE_SSL=/etc/letsencrypt/live/api.mundodefeplaya.org/privkey.pem
CERTIFICATE_SSL=/etc/letsencrypt/live/api.mundodefeplaya.org/cert.pem
CABUNDLE_SSL=/etc/letsencrypt/live/api.mundodefeplaya.org/chain.pem
```

---

## 13. Abrir el puerto 3035 en IONOS

El backend escucha en el puerto `3035`. Debes abrirlo en dos lugares.

### 13.1 Firewall del panel IONOS (primero)

1. Entra a [cloud.ionos.com](https://cloud.ionos.com) o [my.ionos.com](https://my.ionos.com)
2. Ve a tu servidor → **Red → Firewall** (o "Security Groups")
3. Agrega una regla de entrada (Inbound):
   - **Protocolo:** TCP
   - **Puerto:** `3035`
   - **Origen:** `0.0.0.0/0` (cualquier IP)
4. Guarda los cambios

### 13.2 Firewall del sistema operativo (segundo)

```bash
# Si usas ufw (Ubuntu)
sudo ufw allow 3035/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
sudo ufw status
```

### 13.3 Verificar que el puerto está abierto

```bash
# Desde tu computadora (CMD o terminal)
curl -k https://api.mundodefeplaya.org:3035/api/register
# Debe responder con JSON
```

---

## 14. Verificación final

```
[ ] DNS propagado: nslookup api.mundodefeplaya.org → devuelve IP de IONOS
[ ] DNS propagado: nslookup admin.mundodefeplaya.org → devuelve IP de IONOS
[ ] DNS propagado: nslookup registro.mundodefeplaya.org → devuelve IP de IONOS
[ ] pm2 status → kingdomkids-api aparece como "online"
[ ] pm2 logs → sin errores de BD ni de certificados SSL
[ ] curl -k https://api.mundodefeplaya.org:3035/api/register → responde JSON
[ ] https://admin.mundodefeplaya.org → carga el panel y redirige a login
[ ] https://registro.mundodefeplaya.org → carga el formulario de registro
[ ] Login del admin funciona correctamente
[ ] Se puede registrar un nuevo niño desde el formulario
[ ] El QR se genera correctamente
[ ] El scanner QR funciona en /scanner
[ ] Refrescar cualquier ruta del admin/registro NO da error 404 (F5 en /kids/123)
[ ] Candado verde (HTTPS) en los 3 subdominios
```

---

## 15. Flujo de actualización (re-deploy)

### Actualizar el Backend

1. **Local:** Haz cambios → compila
   ```bash
   cd kingdomkids-backend
   npx tsc
   ```
2. **FileZilla:** Sube la carpeta `dist/` a `/var/www/html/kingdomkids-backend/dist/`
3. **SSH en IONOS:**
   ```bash
   pm2 restart kingdomkids-api
   pm2 logs kingdomkids-api --lines 30
   ```

### Actualizar el Admin Panel

1. **Local:** Compila
   ```bash
   cd kingdomkids-admin
   npx ng build --configuration=production
   ```
2. **FileZilla:** Sube el contenido de `dist/ja-angular-frontend-template/browser/` a `/var/www/html/admin/`
3. ✅ No necesitas reiniciar nada en el servidor.

### Actualizar el Register App

1. **Local:** Compila
   ```bash
   cd kingdomkids-register
   npx ng build --configuration=production
   ```
2. **FileZilla:** Sube el contenido de `dist/kingdomkids-register/browser/` a `/var/www/html/registro/`

---

## 📋 Resumen de responsabilidades

| Plataforma | Qué hace | Qué NO hace |
|-----------|---------|------------|
| **HostGator** | Gestiona el DNS (registros A) | NO sirve archivos, NO corre Node.js |
| **IONOS VPS** | Sirve todos los archivos, corre la API, gestiona SSL y MySQL | NO gestiona el DNS del dominio |

## 📋 Resumen de rutas en el servidor IONOS

| Qué | Ruta |
|-----|------|
| Código del backend | `/var/www/html/kingdomkids-backend/` |
| Archivos QR generados | `/var/www/html/kingdomkids-backend/files/qrs/` |
| Variables de entorno | `/var/www/html/kingdomkids-backend/.env` |
| Certificados SSL | `/etc/ssl/kingdomkids/` |
| Admin Panel | `/var/www/html/admin/` |
| Register App | `/var/www/html/registro/` |

---

> ⚠️ **Recordatorio de seguridad:**
> - Agrega `.env` y `certificates/` a tu `.gitignore`
> - Nunca subas `src/keys/` a Git ni a una ruta pública del servidor
> - Activa autenticación JWT en todos los endpoints antes de exponer la API públicamente
