# PILOT_CHECKLIST.md

Checklist operativo para validar Umbral en entorno real antes de escalar despliegue.

## 1) Pruebas clave por rol

### Resident
- [ ] Puede iniciar sesión y ver solo rutas permitidas.
- [ ] Puede crear visita tipo `visitor`.
- [ ] Puede crear visita tipo `delivery` con campos específicos.
- [ ] Puede cancelar solo visitas propias en `pending`.
- [ ] Ve cambios de estado en realtime en historial y detalle.
- [ ] Puede enviar/recibir mensajes con caseta.

### Guard
- [ ] Puede ver `/today` con todas las visitas del día.
- [ ] Puede diferenciar visitor vs delivery visualmente.
- [ ] Puede ejecutar acciones operativas válidas por estado.
- [ ] No puede cancelar visitas como resident.
- [ ] Puede responder chats de residentes.

### Committee/Admin
- [ ] Committee puede crear comunicado.
- [ ] Admin puede crear comunicado y supervisar operación.
- [ ] Ambos ven historial de comunicados.
- [ ] Committee no participa en chat operativo.

---

## 2) Visitas (visitor)
- [ ] Crear visitor con nombre + ETA + nota.
- [ ] Verlo en `/today` y `/history`.
- [ ] Transición `pending -> arrived -> authorized`.
- [ ] Transición `pending -> arrived -> rejected`.
- [ ] Registro en auditoría visible en detalle.

---

## 3) Repartidores (delivery)
- [ ] Crear delivery con empresa/tipo/dropoff/instrucciones.
- [ ] Ver info relevante en cards de `/today`.
- [ ] Operar cierre `delivered_gate`.
- [ ] Operar cierre `sent_to_house`.
- [ ] Operar rechazo `rejected`.

---

## 4) Chat 1:1
- [ ] Crear conversación desde `/messages`.
- [ ] Abrir chat desde `/visits/[id]` con `visit_id` opcional.
- [ ] Mensajes entrantes/salientes en tiempo real.
- [ ] Auto-scroll al último mensaje en hilo.
- [ ] Unread badges actualizan al abrir conversación.

---

## 5) Comunicados
- [ ] Crear comunicado con prioridad `normal`.
- [ ] Crear comunicado con prioridad `important`.
- [ ] Crear comunicado con prioridad `urgent`.
- [ ] Ver badges/fecha/preview en cards.
- [ ] Confirmar actualización del feed en realtime.

---

## 6) Realtime
- [ ] `/today` se actualiza al crear/cambiar/cancelar visitas.
- [ ] `/history` refleja cambios de guard y resident sin reload manual.
- [ ] `/visits/[id]` refleja cambios de estado desde otras vistas.
- [ ] `/messages` y `/chat/[id]` reflejan nuevos mensajes.
- [ ] `/announcements` refleja comunicados nuevos.

---

## 7) Errores y edge cases básicos
- [ ] Login con `next` inválido cae a ruta segura.
- [ ] Intento de acceso a ruta sin permiso redirige a `/unauthorized`.
- [ ] Intento de mutación no autorizada bloqueado por backend/RLS.
- [ ] Doble tap en acciones no duplica mutación.
- [ ] Sin internet, app muestra fallback offline.
- [ ] Recuperación de conexión restablece datos en vivo.

---

## 8) Criterio de salida “pilot-ready”
Marcar piloto como listo cuando:
- [ ] Todos los checks críticos anteriores estén en verde.
- [ ] No existan bloqueadores P1 en operación de caseta.
- [ ] Equipo de operación valide usabilidad móvil en campo.
