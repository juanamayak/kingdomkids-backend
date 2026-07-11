# Recomendaciones — Reenvío de PDFs corregidos (registros del 4 de junio)

> **Contexto:** Se generaron PDFs con información errónea durante el evento del 4 de junio de 2025.
> Los PDFs fueron corregidos y se necesita hacérselos llegar a los tutores que registraron a sus hijos ese día.

---

## Diagnóstico previo

Antes de implementar cualquier solución, confirma lo siguiente:

| Pregunta | Relevancia |
|---|---|
| ¿Los registros del 4 de junio tienen `createdAt` entre `2025-06-04 00:00:00` y `2025-06-04 23:59:59`? | Determina si el filtro por fecha es suficiente para identificarlos |
| ¿El campo `email` en la tabla `parents` está poblado para esos registros? | Determina si se puede contactar por correo |
| ¿Los PDFs corregidos se generan desde el admin o se adjuntan manualmente? | Cambia si la solución es automática o semi-manual |
| ¿Cuántos niños se registraron ese día? | Determina si un script puntual o un endpoint es más conveniente |

### Consulta SQL de diagnóstico

```sql
-- Verificar registros del 4 de junio y si tienen email
SELECT
    k.id,
    k.name,
    k.lastname,
    k.createdAt,
    p.full_name AS tutor,
    p.email,
    p.type
FROM kids k
JOIN parents p ON p.kid_id = k.id
WHERE DATE(k.createdAt) = '2025-06-04'
ORDER BY k.id;
```

---

## Opción 1 — Script puntual en Node.js (⭐ Recomendada)

**Cuándo usarla:** Cuando es un evento único que no se va a repetir, y el número de registros es manejable (< 200).

**Ventajas:**
- No requiere cambios en el API ni en el admin.
- Se ejecuta una sola vez, se revisa el resultado y se elimina.
- Control total sobre qué se envía y a quién.
- Sin riesgo de afectar endpoints productivos.

**Estructura del script:**

```
kingdomkids-backend/
  scripts/
    resend-june4-pdfs.ts     ← script puntual
```

**Flujo del script:**

```
1. Consulta DB → kids WHERE DATE(createdAt) = '2025-06-04'
   + JOIN parents para obtener emails
2. Por cada kid:
   a. Generar el PDF corregido (o adjuntar el archivo ya corregido)
   b. Enviar email con nodemailer adjuntando el PDF
   c. Log del resultado (enviado / fallido)
3. Al terminar: mostrar resumen (X enviados, Y fallidos)
```

**Borrador del script:**

```typescript
// scripts/resend-june4-pdfs.ts
import 'dotenv/config';
import { database } from '../src/config/database';
import { KidsModel } from '../src/models/kids.model';
import { ParentsModel } from '../src/models/parents.model';
import { Op } from 'sequelize';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

async function main() {
  await database.authenticate();

  const kids = await KidsModel.findAll({
    where: {
      createdAt: {
        [Op.between]: ['2025-06-04 00:00:00', '2025-06-04 23:59:59'],
      },
    },
    include: [{ model: ParentsModel, as: 'parents' }],
  });

  console.log(`Niños encontrados del 4 de junio: ${kids.length}`);

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const resultados: { kid: string; email: string; ok: boolean }[] = [];

  for (const kid of kids) {
    const parents = (kid as any).parents as ParentsModel[];
    const pdfPath = path.join(__dirname, `../files/pdfs/${kid.id}.pdf`);

    // Verificar que el PDF corregido existe
    if (!fs.existsSync(pdfPath)) {
      console.warn(`⚠️  PDF no encontrado para kid ID ${kid.id} — omitiendo`);
      continue;
    }

    for (const parent of parents) {
      if (!parent.email) continue;

      try {
        await transporter.sendMail({
          from: `"KingdomKids · Mundo de Fe" <${process.env.EMAIL_USER}>`,
          to: parent.email,
          subject: 'Credencial corregida de tu hijo/a — KingdomKids',
          html: `
            <p>Hola ${parent.full_name},</p>
            <p>Te enviamos la credencial corregida de <strong>${kid.name} ${kid.lastname}</strong>.</p>
            <p>Por favor reemplaza el documento anterior con este adjunto.</p>
            <p>Disculpa los inconvenientes.</p>
            <br/>
            <p>— Equipo KingdomKids · Mundo de Fe Playa del Carmen</p>
          `,
          attachments: [
            {
              filename: `credencial-${kid.name}-${kid.lastname}.pdf`,
              path: pdfPath,
            },
          ],
        });

        resultados.push({ kid: `${kid.name} ${kid.lastname}`, email: parent.email, ok: true });
        console.log(`✅ Enviado a ${parent.email} (${kid.name} ${kid.lastname})`);
      } catch (error) {
        resultados.push({ kid: `${kid.name} ${kid.lastname}`, email: parent.email, ok: false });
        console.error(`❌ Falló para ${parent.email}:`, error);
      }
    }
  }

  const exitosos = resultados.filter(r => r.ok).length;
  const fallidos = resultados.filter(r => !r.ok).length;
  console.log(`\n📊 Resumen: ${exitosos} enviados, ${fallidos} fallidos`);

  await database.close();
}

main().catch(console.error);
```

**Para ejecutarlo:**

```bash
# Desde kingdomkids-backend/
npx ts-node scripts/resend-june4-pdfs.ts
```

> ⚠️ Asegúrate de que las variables de entorno (`.env`) estén disponibles antes de ejecutar.

---

## Opción 2 — Endpoint temporal en el API (semi-manual desde Postman/Thunder Client)

**Cuándo usarla:** Si prefieres disparar el reenvío desde una herramienta REST con control visual.

**Flujo:**

1. Crear un endpoint protegido con JWT: `POST /api/admin/resend-june4-pdfs`
2. El endpoint ejecuta la misma lógica que el script anterior.
3. Retorna un resumen JSON con los resultados.
4. **Eliminar el endpoint** una vez confirmado el envío.

**Ventaja sobre el script:** Puedes ejecutarlo desde cualquier máquina sin necesidad de acceso directo al servidor.

**Desventaja:** Más riesgo de dejar código temporal en producción si no se elimina.

---

## Opción 3 — Exportar lista de emails + envío manual desde tu cliente de correo

**Cuándo usarla:** Si hay muy pocos registros (< 20) o si hay dudas sobre la infraestructura de correo.

**Flujo:**

```sql
-- Extraer emails del 4 de junio
SELECT DISTINCT p.email, p.full_name, k.name, k.lastname
FROM kids k
JOIN parents p ON p.kid_id = k.id
WHERE DATE(k.createdAt) = '2025-06-04'
  AND p.email IS NOT NULL AND p.email != '';
```

1. Exportar resultado a CSV.
2. Enviar los PDFs corregidos manualmente desde Gmail/Outlook con copia oculta (BCC) o individualmente.

**Desventaja:** Manual, propenso a errores humanos, no queda registro en el sistema.

---

## Recomendación final

```
✅ Usa la Opción 1 (script puntual)
```

**Razones:**
- El backend ya tiene `nodemailer` configurado con las credenciales en `.env` — no hay que instalar nada.
- Es trazable: el log en consola deja evidencia de qué se envió y qué falló.
- Es descartable: se borra el script después de usarlo.
- No toca código productivo.

---

## Checklist antes de ejecutar

```
[ ] Ejecutar la consulta SQL de diagnóstico y revisar los registros del 4 de junio
[ ] Verificar que los PDFs corregidos estén en files/pdfs/{id}.pdf (o ajustar la ruta en el script)
[ ] Confirmar que las variables de entorno EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD están en .env
[ ] Hacer un envío de prueba a tu propio correo con UN solo kid antes de lanzar todos
[ ] Guardar el log de resultados (redirigir stdout a un .txt si es necesario)
[ ] Eliminar el script después de confirmar que todos los envíos fueron exitosos
```

---

## Mejora futura (deuda técnica relacionada)

Este incidente expone la necesidad de:

1. **Endpoint de reenvío de credencial individual** desde el panel admin — acción "Reenviar PDF" en la vista de detalle del niño.
2. **Log de emails enviados** en BD — una tabla `email_log` con `kid_id`, `email`, `type`, `sent_at`, `status`.
3. **Indicador en el registro del niño** de cuándo se le envió su credencial por última vez.

Estos puntos pueden registrarse como issues para la siguiente iteración del módulo de Ministerio Infantil.

---

*Documento generado el 10 de julio de 2026 · KingdomKids — Mundo de Fe Playa del Carmen*

