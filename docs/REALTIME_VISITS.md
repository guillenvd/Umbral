# Realtime de visitas (nota técnica)

Esta implementación usa **Supabase Realtime** sobre `public.visits` y mantiene la autorización en backend/RLS.

## Principio de seguridad
- El cliente solo **escucha cambios** (`postgres_changes`).
- No se mueve lógica de permisos al cliente.
- Escrituras y transiciones siguen en server actions + RLS.

## Canales por vista
- `/today` → `visits-today-sync-all`
  - Escucha `INSERT/UPDATE/DELETE` en `public.visits`.
  - Actualiza tablero operativo de caseta.
- `/history` → `visits-history-sync-all`
  - Escucha los mismos eventos para reflejar cambios del guardia o cancelaciones del residente.
  - RLS asegura que un residente solo reciba filas permitidas.
- `/visits/[id]` → `visits-detail-sync-<id>`
  - Escucha solo el `id` de la visita actual (`filter: id=eq.<id>`).

## Estrategia UX anti-flicker
- Realtime no inserta/mergea localmente la lista.
- Ante evento, dispara `router.refresh()` con **debounce corto (220ms)**.
- Esto evita duplicados por estado local + server render, y mantiene consistencia de datos.
- Se expone indicador textual:
  - `En vivo`
  - `Actualizando en vivo…`

## Eventos cubiertos
- Creación de visita (`INSERT`)
- Cambio de estado (`UPDATE`)
- Cancelación (`UPDATE` con `status=cancelled`)
