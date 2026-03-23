# Plan de implementación por fases (Umbral)

Enfoque: **simple + modular + mobile-first**, evitando sobreingeniería.

## Fase 1 — Setup de proyecto
**Objetivo:** base técnica lista.

- Crear app Next.js (App Router, TypeScript)
- Configurar Tailwind + shadcn/ui
- Configurar cliente Supabase (browser/server)
- Definir layout móvil base y `bottom navigation`
- Dejar pipeline listo para Vercel

**Entregable:** proyecto corre en local y despliega en preview.

---

## Fase 2 — Auth + Roles
**Objetivo:** acceso seguro por rol.

- Supabase Auth (email magic link o password)
- Tabla `profiles` y rol por usuario
- Middleware para rutas protegidas por rol
- Guardas UI por permiso (resident, guard, committee, admin)

**Entregable:** login funcional + redirección según rol.

---

## Fase 3 — Modelo de datos + RLS
**Objetivo:** seguridad de datos en BD.

- Ejecutar `supabase/schema.sql`
- Verificar políticas RLS por entidad
- Cargar seed mínima de casas/usuarios demo
- Validar constraints de estados y relaciones

**Entregable:** datos seguros por diseño (RLS first).

---

## Fase 4 — Vecino: Crear visita
**Objetivo:** flujo principal de alta de visita.

- Pantalla “Nueva visita” con campos mínimos:
  - visitante
  - hora estimada
  - placas (opcional)
  - nota (opcional)
- Lista “Mis visitas” (cards con estado)
- Editar/cancelar visita `pending`

**Entregable:** residente administra sus visitas sin ver las de otros.

---

## Fase 5 — Guardia: Pantalla “Hoy”
**Objetivo:** operación móvil de caseta.

- Lista de visitas del día (orden ETA + prioridad)
- Búsqueda por nombre, casa, placa
- Acciones rápidas: llegó / autorizar / rechazar / mensaje
- Detalle de visita con botones sticky inferiores

**Entregable:** guardia opera todo desde teléfono, con una mano.

---

## Fase 6 — Estados + transiciones + auditoría
**Objetivo:** flujo operativo robusto y trazable.

- Reglas de transición de estado:
  - `pending -> arrived|authorized|rejected|cancelled|expired`
  - `arrived -> authorized|rejected`
- Registro de actor, fecha y nota de decisión
- Auditoría automática en `audit_logs`

**Entregable:** historial operativo completo, sin borrado.

---

## Fase 7 — Realtime (visitas)
**Objetivo:** actualización inmediata entre residente y caseta.

- Subscriptions Realtime para nuevas visitas
- Subscriptions para cambios de estado
- Actualización optimista de UI + fallback polling corto

**Entregable:** guardia ve nuevas visitas sin refrescar.

---

## Fase 8 — Chat 1:1 residente ↔ caseta
**Objetivo:** comunicación directa operativa.

- Vista de mensajes por vivienda
- Envío/recepción realtime
- Indicadores básicos (hora, remitente)

**Entregable:** canal privado funcional y usable en móvil.

---

## Fase 9 — Broadcast Comité/Admin
**Objetivo:** comunicación masiva interna.

- Lista de comunicados
- Crear comunicado (título + cuerpo)
- Segmentación opcional por calle/sección/edificio
- Feed realtime para residentes

**Entregable:** comité comunica rápido sin acceder a chats privados.

---

## Fase 10 — Pulido UX + PWA + hardening
**Objetivo:** experiencia final estable.

- Ajustes mobile-first (espaciado, targets táctiles, rendimiento)
- PWA básica (manifest + service worker)
- Manejo de errores y estados vacíos
- Revisión de accesibilidad y auditoría de seguridad

**Entregable:** versión lista para piloto interno.

---

## Checklist transversal por fase

- Mantener arquitectura simple (sin microservicios)
- No usar tablas como vista principal
- Cada feature debe funcionar bien en pantallas pequeñas
- Cada operación relevante debe quedar auditada
- Verificar RLS antes de dar por terminada una fase
