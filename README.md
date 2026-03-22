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
- `/visits/new` → `resident`, `admin`
- `/messages` → `resident`, `guard`, `admin`
- `/history` → `resident`, `guard`, `admin`
- `/announcements` → `resident`, `guard`, `committee`, `admin`

Si un usuario autenticado no tiene permiso, se redirige a `/unauthorized`.

## Nota sobre esta fase
- Esta fase se enfoca en **VISITAS** end-to-end (visitor + delivery).
- Aún no incluye realtime, chat completo ni comunicados.
