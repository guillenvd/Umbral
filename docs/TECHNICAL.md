# TECHNICAL.md

## 1) Arquitectura general
Umbral usa arquitectura **monolítica modular**:
- UI y server rendering en Next.js App Router.
- Persistencia, auth, realtime y autorización de datos en Supabase.
- Reglas de negocio críticas en server actions + RLS (defensa en profundidad).

## Diagrama conceptual
1. Cliente móvil (PWA) navega rutas App Router.
2. Server Components/server actions usan `createSupabaseServerClient()`.
3. Supabase aplica Auth + RLS en cada query/mutación.
4. Realtime emite cambios (`postgres_changes`) a clientes suscritos.
5. Cliente refresca datos con `router.refresh()` y debounce.

---

## 2) Next.js + Supabase + Realtime + PWA

### Next.js (App Router)
- Rutas protegidas en `app/(protected)`.
- Auth route en `app/(auth)/login`.
- Middleware para guardas por rol.
- Server actions para mutaciones críticas.

### Supabase
- Auth por sesión/cookies SSR.
- Postgres como fuente única de verdad.
- RLS habilitado en tablas sensibles.

### Realtime
- Canales por módulo (`visits`, `messages`, `announcements`).
- Evento de cambios: inserción/actualización/borrado lógico.
- Refresh controlado para minimizar flicker.

### PWA
- `app/manifest.ts` para metadata instalable.
- `public/sw.js` con cache runtime mínimo y fallback offline.
- `public/offline.html` como experiencia degradada.

---

## 3) Estructura de carpetas (resumen)
- `app/`: rutas, layouts, páginas, metadata, providers.
- `components/`: UI reusable y widgets de dominio (visits/chat/announcements).
- `lib/auth`: resolución de rol y sesión.
- `lib/supabase`: clientes server/browser.
- `lib/visits.ts`, `lib/chat.ts`: utilidades de dominio.
- `supabase/schema.sql`: modelo SQL, triggers, RLS.
- `docs/`: operación y documentación de producto/técnica.

---

## 4) Auth y sesión
- Cliente SSR se construye en `lib/supabase/server.ts`.
- Sesión actual se obtiene en `lib/auth/session.ts`.
- Rol efectivo:
  1. `session.user.user_metadata.role` si es válido.
  2. fallback a `profiles.role`.
  3. fallback final: `resident`.

---

## 5) Roles y permisos (app)
Reglas de navegación por prefijo en `lib/auth/roles.ts`:
- `/today`: guard, admin
- `/visits/new`: resident
- `/visits`: resident, guard, admin
- `/messages` y `/chat`: resident, guard
- `/history`: resident, guard, admin
- `/announcements/new`: committee, admin
- `/announcements`: resident, guard, committee, admin

`middleware.ts` aplica redirección a `/login` sin sesión y `/unauthorized` si rol no permitido.

---

## 6) RLS (fuente de seguridad de datos)
Definida en `supabase/schema.sql`.

### Visitas
- **Select:** resident solo propias; guard/admin global.
- **Insert:** solo resident, solo para sí mismo y casa activa.
- **Update resident:** solo propias en `pending`; nuevo estado limitado.
- **Update guard:** estados operativos, sin cancelar como resident.
- **Update admin:** permitido para supervisión.

### Mensajes
- Read cuando usuario participa en el mensaje.
- Insert restringido a pares resident↔guard.

### Announcements
- Read para todos autenticados publicados.
- Insert/update solo committee/admin.

### Audit
- Lectura guard/admin.
- Inserción directa bloqueada (solo triggers).

---

## 7) Server actions críticas
- `app/(protected)/visits/actions.ts`: create/cancel/transiciones operativas.
- `app/(protected)/chat/actions.ts`: envío de mensaje y lectura.
- `app/(protected)/announcements/actions.ts`: creación de comunicado.

Patrón común:
1. Obtener sesión y rol.
2. Validar intención/regla de negocio.
3. Ejecutar query (RLS sigue activo).
4. Revalidar rutas y retornar estado UI.
5. Registrar error con `logServerError` en fallos.

---

## 8) Canales realtime implementados

### Visitas
- `/today`: `visits-today-sync-all`
- `/history`: `visits-history-sync-all`
- `/visits/[id]`: `visits-detail-sync-<id>`

### Chat
- Inbox: `messages-inbox-all`
- Hilo: `messages-chat-<peerId>`

### Announcements
- Feed: `announcements-sync`

---

## 9) Decisiones técnicas importantes
- **Modelo único de visitas:** visitor + delivery en la misma tabla para simplicidad operativa.
- **Autorización dual:** middleware (UX) + RLS/server actions (seguridad real).
- **Estado realtime via refresh controlado:** menos complejidad que sincronización local compleja y suficiente para operación móvil.
- **PWA mínima pero estable:** instalación + offline fallback antes de introducir push.
- **Auditoría append-only:** útil para soporte y trazabilidad operativa.

---

## 10) Inconsistencias/concesiones actuales (explícitas)
- `expired` aún no depende de cron dedicado externo.
- Segmentación de announcements está a nivel de esquema, no completada en UI de creación.
- No hay suite de pruebas automatizadas e2e todavía; hardening actual se valida con lint/build y pruebas manuales.
