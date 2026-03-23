# Umbral

Aplicación web **mobile-first** para uso residencial interno: control de visitas/repartidores, operación de caseta, chat operativo 1:1 y comunicados broadcast.

## Objetivo del sistema
Umbral centraliza la operación diaria entre residentes y caseta en una sola PWA:
- Registrar visitas y repartidores con estado operativo.
- Permitir al guardia gestionar accesos en tiempo real.
- Habilitar chat 1:1 residente ↔ caseta.
- Publicar comunicados por Comité/Admin.
- Mantener trazabilidad por auditoría y reglas RLS.

## Stack tecnológico
- **Frontend/App:** Next.js 15 (App Router) + React 19 + TypeScript.
- **UI:** Tailwind CSS + componentes base estilo shadcn.
- **Backend gestionado:** Supabase (Auth, Postgres, Realtime, RLS).
- **Deploy objetivo:** Vercel.
- **PWA:** `manifest.webmanifest`, `sw.js`, fallback offline.

## Roles del producto
- **Resident:** crea/cancela visitas propias, consulta historial propio, chat con caseta, lee comunicados.
- **Guard:** opera visitas del día (llegó/autoriza/rechaza/entrega), responde chats, lee comunicados.
- **Committee:** crea comunicados broadcast y consulta historial de comunicados.
- **Admin:** supervisión operativa y permisos amplios de gestión.

## Módulos principales
- **Visitas/Delivery:** flujo end-to-end con un solo modelo `visits`.
- **Today (caseta):** lista operativa diaria con acciones rápidas.
- **Historial:** consultas por estado/periodo para operación diaria.
- **Chat 1:1:** inbox y conversación en tiempo real.
- **Announcements:** feed de comunicados + creación por roles autorizados.
- **PWA/Offline:** instalación y fallback sin conexión.
- **Auditoría:** eventos en `audit_logs` para cambios críticos.

## Estructura del repositorio
```txt
app/
  (auth)/login/
  (protected)/
    announcements/
    chat/
    history/
    messages/
    today/
    visits/
  layout.tsx
  manifest.ts
components/
  announcements/
  chat/
  mobile/
  ui/
  visits/
lib/
  auth/
  supabase/
  chat.ts
  logger.ts
  visits.ts
supabase/
  schema.sql
docs/
  PRODUCT.md
  TECHNICAL.md
  LOCAL_SETUP.md
  RELEASE.md
  PILOT_CHECKLIST.md
  REALTIME_VISITS.md
  REALTIME_CHAT.md
  REALTIME_ANNOUNCEMENTS.md
```

## Navegación de documentación
- **Producto (qué y para quién):** `docs/PRODUCT.md`
- **Técnica (cómo está construido):** `docs/TECHNICAL.md`
- **Setup local paso a paso:** `docs/LOCAL_SETUP.md`
- **Release/Deploy operativo:** `docs/RELEASE.md`
- **Validación piloto en campo:** `docs/PILOT_CHECKLIST.md`
- **Notas específicas de realtime:**
  - `docs/REALTIME_VISITS.md`
  - `docs/REALTIME_CHAT.md`
  - `docs/REALTIME_ANNOUNCEMENTS.md`

## Comandos básicos
```bash
npm install
npm run dev
npm run lint
npm run build
npm run start
```

## Estado actual (resumen)
- Visitas + delivery funcionando end-to-end con transiciones de estado.
- Realtime activo para `today`, `history`, detalle de visita, chat y announcements.
- Guards de ruta por rol y autorización real en backend + RLS.
- PWA instalable con estrategia offline mínima.

Para detalles completos y checklist operativo, usar la documentación en `docs/`.
