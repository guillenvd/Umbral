# RELEASE.md

## 1) Flujo recomendado de ramas y PRs
- `main`: estable/producción.
- `feature/*`: trabajo por fase o módulo.
- PR obligatorio a `main` con:
  - alcance claro,
  - impacto en schema/RLS,
  - evidencias (`npm run lint`, `npm run build`, smoke tests).

Recomendación:
- Separar PRs de schema SQL de PRs UI cuando el cambio sea grande.

---

## 2) Cambios de schema/migraciones
Fuente actual: `supabase/schema.sql`.

Proceso recomendado:
1. Crear versión/migración SQL a partir del cambio.
2. Aplicar primero en staging.
3. Validar RLS con cuentas de prueba por rol.
4. Ejecutar smoke tests funcionales.
5. Aplicar en producción en ventana controlada.

Checklist de riesgo SQL:
- ¿Se agregó enum nuevo sin romper inserts?
- ¿Hay políticas `drop/create` ordenadas correctamente?
- ¿Se mantienen índices en tablas de alto tráfico?

---

## 3) Variables de entorno de producción
Definir en Vercel (Environment Variables):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Recomendaciones:
- Mantener variables separadas por entorno (`Preview`/`Production`).
- No exponer keys con privilegios elevados en frontend.

---

## 4) Deploy en Vercel
1. Conectar repo a Vercel.
2. Configurar variables por entorno.
3. Ejecutar deploy desde PR (preview).
4. Validar smoke test en preview.
5. Merge a `main` para deploy de producción.

---

## 5) Checklist pre-release
- [ ] `npm install`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Schema SQL revisado y aplicado en staging
- [ ] Validación por rol (resident/guard/committee/admin)
- [ ] Realtime activo en tablas (`visits`, `messages`, `announcements`)
- [ ] Validación PWA install/offline mínima
- [ ] README/docs actualizadas

---

## 6) Smoke test post-release

## Auth y rutas
- Login válido redirige correctamente.
- Ruta no permitida por rol envía a `/unauthorized`.

## Visitas
- Resident crea visitor y delivery.
- Guard ve ambos en `/today`.
- Guard ejecuta transición y resident la observa en realtime.

## Chat
- Resident envía mensaje a guard y guard responde.
- Inbox y chat activo se actualizan sin recarga manual.

## Announcements
- Committee/Admin publica comunicado.
- Resident/Guard lo ven en feed en vivo.

## PWA/offline
- App instalable desde navegador móvil.
- Sin red, navegación cae a `offline.html`.

---

## 7) Rollback básico
Si un release falla:
1. Revertir deploy en Vercel al build previo estable.
2. Si el fallo viene de schema, aplicar script de rollback o restaurar backup.
3. Verificar rutas críticas (`/today`, `/history`, `/messages`, `/announcements`).
4. Abrir incidente con causa raíz y acción correctiva.

Nota:
- Evitar migraciones destructivas sin plan de rollback y respaldo previo.
