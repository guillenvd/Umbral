# Realtime de anuncios (broadcast)

## Canal y estrategia
- Vista: `/announcements`
- Canal Supabase Realtime: `announcements-sync`
- Tabla observada: `public.announcements`
- Evento: `postgres_changes` con `event: *` (insert/update/delete)

Al detectar un cambio, el cliente ejecuta `router.refresh()` con debounce corto (220ms) para mantener la lista en vivo sin parpadeo fuerte en móvil.

## Seguridad
- El cliente **solo escucha** cambios; no decide permisos.
- Escritura de comunicados se valida en backend (`createAnnouncementAction`) y además por RLS.
- RLS esperado:
  - `select`: residentes, guardia, comité y admin pueden leer comunicados publicados.
  - `insert/update`: solo comité/admin.

## UX
- Indicador visual de estado realtime: "Comunicados en vivo" / "Actualizando comunicados...".
- Lista en cards mobile-first con badge de prioridad visible.
