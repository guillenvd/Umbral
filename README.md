# Umbral

Base ejecutable de la **Fase 1** para Umbral: app mobile-first con Next.js App Router, Tailwind, componentes estilo shadcn, Supabase (SSR) y auth/roles iniciales.

## Stack
- Next.js (App Router, TypeScript)
- Tailwind CSS
- UI base inspirada en shadcn/ui (`components/ui/button.tsx` + utilidades)
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)

## Qué incluye esta fase
- Scaffold de proyecto Next.js listo para crecer
- Integración Supabase:
  - Cliente browser (`lib/supabase/client.ts`)
  - Cliente server/SSR (`lib/supabase/server.ts`)
- Auth básica por email/password (`/login`)
- Resolución de rol (`user_metadata.role` con fallback a tabla `profiles`)
- Guards de acceso por rol en `middleware.ts`
- Layout mobile-first con header + **bottom navigation**
- Rutas placeholder funcionales:
  - `/today`
  - `/visits/new`
  - `/messages`
  - `/history`
  - `/announcements`
- Modelo de visitas extendido para **visita** y **repartidor (delivery)** en una sola tabla `visits`
- Flujo end-to-end de visitas:
  - Crear visita/delivery con server action (`/visits/new`)
  - Listado en cards para vecino/guardia (`/history`, `/today`)
  - Detalle por visita con acciones (`/visits/[id]`)
  - Transiciones de estado controladas en backend
- Realtime operativo en vistas de visitas (`/today`, `/history`, `/visits/[id]`) usando Supabase Realtime + `router.refresh()`

## Estructura

```txt
app/
├─ (auth)/login/page.tsx
├─ (protected)/
│  ├─ layout.tsx
│  ├─ announcements/page.tsx
│  ├─ history/page.tsx
│  ├─ messages/page.tsx
│  ├─ today/page.tsx
│  └─ visits/new/page.tsx
├─ unauthorized/page.tsx
├─ globals.css
├─ layout.tsx
├─ page.tsx
└─ providers.tsx

components/
├─ mobile/bottom-nav.tsx
└─ ui/button.tsx

lib/
├─ auth/
│  ├─ roles.ts
│  └─ session.ts
├─ supabase/
│  ├─ client.ts
│  └─ server.ts
└─ utils.ts

supabase/
└─ schema.sql
```

## Configuración local

1. Instalar dependencias:
```bash
npm install
```

2. Crear `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

3. Correr en desarrollo:
```bash
npm run dev
```

4. Abrir:
- `http://localhost:3000/login`

## Roles y guards iniciales
Reglas implementadas en `lib/auth/roles.ts` + `middleware.ts`:

- `/today` → `guard`, `admin`
- `/visits/new` → `resident`
- `/messages` → `resident`, `guard`, `admin`
- `/history` → `resident`, `guard`, `admin`
- `/announcements` → `resident`, `guard`, `committee`, `admin`

Si un usuario autenticado no tiene permiso, se redirige a `/unauthorized`.

## Nota sobre esta fase
- Esta fase se enfoca en **VISITAS** end-to-end (visitor + delivery).
- Incluye realtime para visitas.
- Aún no incluye chat completo ni comunicados.

## Realtime de visitas (Fase 3)
- `components/visits/realtime-sync.tsx` crea una suscripción a `public.visits` (`postgres_changes`).
- Al recibir inserciones/updates/deletes, hace `router.refresh()` con un debounce corto para evitar flicker en móvil.
- Se usa en:
  - `/today` (operación de caseta en vivo)
  - `/history` (lista del vecino/guardia en vivo)
  - `/visits/[id]` (detalle en vivo por `id`)
- Canales por vista:
  - `/today` → `visits-today-sync-all`
  - `/history` → `visits-history-sync-all`
  - `/visits/[id]` → `visits-detail-sync-<id>`
- Nota técnica completa: `docs/REALTIME_VISITS.md`.

## Seguridad / RLS de visitas (Fase 3)
Policies relevantes en `supabase/schema.sql`:
- `visits_resident_guard_admin_read`
  - Residente: solo sus propias visitas (`resident_id = auth.uid()`).
  - Guardia/Admin: lectura global operativa.
- `visits_resident_insert`
  - Residente crea visitas solo para sí mismo y en vivienda activa.
- `visits_resident_update_pending`
  - Residente solo puede mutar visitas propias en `pending` y dejar `pending` o `cancelled`.
- `visits_guard_update_operational`
  - Guardia puede operar estados operativos, sin permiso para `cancelled`.
- `visits_admin_update`
  - Admin mantiene capacidad de supervisión/ajuste.

Decisión de producto implementada:
- **Quién crea visitas:** solo `resident`.
- Alineación completa:
  - UI/guards (`/visits/new`) solo para `resident`.
  - `createVisitAction` rechaza cualquier rol distinto de `resident`.
  - RLS `visits_resident_insert` permite insert únicamente a `resident` dueño de la visita.

Transiciones implementadas en backend (`app/(protected)/visits/actions.ts`):
- Visitor: `pending -> arrived -> authorized/rejected`
- Delivery: `pending -> arrived -> authorized/rejected/delivered_gate/sent_to_house`
- Cancelación residente: `pending -> cancelled`
- `expired` queda documentado como siguiente paso para automatizar por job/cron.
