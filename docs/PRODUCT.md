# PRODUCT.md

## 1) Qué resuelve el sistema
Umbral resuelve el problema operativo de fraccionamientos/condominios donde el control de acceso y comunicación con caseta suele hacerse por llamadas, notas o apps separadas.

### Problemas que ataca
- Falta de visibilidad en tiempo real de quién viene y a qué hora.
- Fricción entre residente y guardia para autorizar/rechazar acceso.
- Historial incompleto de eventos operativos.
- Comunicación dispersa para casos de entrega/visita.

### Resultado esperado
- Menor tiempo de atención en caseta.
- Menos errores de autorización.
- Mayor trazabilidad por evento (auditoría).
- Mejor experiencia móvil para guardia y residentes.

---

## 2) Usuarios y roles

### Resident
- Crea visitas y repartidores.
- Cancela visitas pendientes propias.
- Consulta historial propio.
- Chatea 1:1 con caseta.
- Recibe comunicados.

### Guard
- Ve visitas del día de toda la operación.
- Ejecuta transición de estados operativos.
- Chatea con residentes.
- Consulta historial operativo.

### Committee
- Publica comunicados broadcast.
- Consulta historial de comunicados.
- No participa en chat 1:1 operativo.

### Admin
- Supervisión operativa global.
- Permisos de lectura/actualización ampliados en backend y RLS.

---

## 3) Flujos principales

## Flujo A: Visita normal
1. Resident crea visita (`type = visitor`).
2. Guard la ve en `/today`.
3. Guard marca llegada (`arrived`).
4. Guard autoriza o rechaza (`authorized` / `rejected`).
5. Se registra auditoría.

## Flujo B: Repartidor (delivery)
1. Resident crea registro (`type = delivery`) con empresa/tipo/instrucciones.
2. Guard lo opera desde `/today`.
3. Guard puede cerrar como `delivered_gate`, `sent_to_house` o `rejected`.
4. Se registra auditoría.

## Flujo C: Chat operativo
1. Resident inicia conversación con guardia desde inbox o detalle de visita.
2. Guard responde en el mismo hilo.
3. Ambas vistas se actualizan en realtime.

## Flujo D: Comunicados
1. Committee/Admin publica announcement.
2. Resident y Guard lo ven en el feed sin recargar (realtime).

---

## 4) Módulos funcionales
- **Autenticación y sesión:** login email/password con Supabase Auth.
- **Visitas:** creación, listado, detalle, transiciones de estado.
- **Today (guardia):** tablero operativo diario mobile-first.
- **Historial:** consulta de registros por usuario/rol.
- **Chat:** inbox + hilo activo con unread badges.
- **Announcements:** feed + creación restringida.
- **Auditoría:** trazabilidad en `audit_logs`.
- **PWA:** instalación y fallback offline mínimo.

---

## 5) Estados de visitas

### Estados base
- `pending`
- `arrived`
- `authorized`
- `rejected`
- `cancelled`
- `expired`

### Estados adicionales para delivery
- `delivered_gate`
- `sent_to_house`

### Transiciones soportadas actualmente
- Visitor: `pending -> arrived -> authorized|rejected`
- Delivery: `pending -> arrived -> authorized|rejected|delivered_gate|sent_to_house`
- Resident cancelación: `pending -> cancelled`
- Expiración: `pending -> expired` (aplicada por lógica operativa al consultar/mutar)

---

## 6) Reglas de negocio activas
- Solo Resident crea visitas.
- Resident solo ve/muta visitas propias permitidas.
- Guard no puede cancelar como resident.
- Committee/Admin crean anuncios; residentes/guardias solo leen.
- Chat permitido solo Resident ↔ Guard.
- No se borra historial operativo.

---

## 7) Límites actuales y backlog de largo plazo

### Límites actuales (explícitos)
- Notificaciones push **no** implementadas.
- Expiración automática no está en cron externo; depende de ejecución en flujos operativos.
- Segmentación avanzada de comunicados (`announcement_targets`) existe a nivel de modelo, pero el flujo UI actual es broadcast general.

### Backlog largo plazo recomendado
- Push notifications (PWA + fallback nativo).
- Job programado para expiración autónoma de visitas.
- Métricas operativas (SLA caseta, tiempos por estado).
- Herramientas de soporte/admin (impersonation segura, exportes, reportes).
