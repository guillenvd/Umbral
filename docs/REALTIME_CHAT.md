# Realtime Chat (residente ↔ caseta)

## Canales
- Inbox `/messages`: `messages-inbox-all`
- Chat activo `/chat/[id]`: `messages-chat-<peerId>`

## Evento escuchado
- `postgres_changes` sobre `public.messages` para `INSERT/UPDATE/DELETE`.

## Estrategia UX
- Refresh con debounce corto (`router.refresh`) para evitar duplicados/flicker.
- Indicador visible: `Mensajería en vivo` / `Actualizando mensajes...`.

## Seguridad
- El cliente solo escucha cambios.
- Envío de mensajes en server action (`sendMessageAction`).
- RLS bloquea:
  - chat entre vecinos
  - participación de comité/admin en chat operativo
  - lectura fuera de conversaciones permitidas.
