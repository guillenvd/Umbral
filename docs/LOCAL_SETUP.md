# LOCAL_SETUP.md

## 1) Prerrequisitos
- Node.js 20+ (recomendado LTS reciente).
- npm 10+.
- Proyecto Supabase (local o cloud).
- Git.

Opcional recomendado:
- Supabase CLI para aplicar schema local.

---

## 2) Variables de entorno
Crear `.env.local` en la raíz:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

> Nota: la app actual usa cliente SSR y browser con estas variables públicas. No requiere service role key para correr el flujo base.

---

## 3) Instalación
```bash
npm install
```

---

## 4) Configurar Supabase (schema + políticas)

### Opción A: Supabase SQL Editor (rápida)
1. Abrir proyecto Supabase.
2. Ir a SQL Editor.
3. Ejecutar contenido de `supabase/schema.sql`.
4. Confirmar que se crean tablas, tipos, triggers y policies.

### Opción B: Supabase CLI (recomendada para equipos)
1. Inicializar/ligar proyecto.
2. Aplicar `supabase/schema.sql` como migración.
3. Versionar cambios SQL en PR.

---

## 5) Datos mínimos de arranque
Para pruebas funcionales, crear al menos:
- 1 usuario resident.
- 1 usuario guard.
- 1 usuario committee (opcional para broadcasts).
- 1 house.
- membresía activa de resident en `house_members`.
- perfiles en `profiles` con `role` correcto.

También puedes setear `user_metadata.role`, pero el sistema tiene fallback a `profiles.role`.

---

## 6) Ejecutar localmente
```bash
npm run dev
```
Abrir: `http://localhost:3000/login`

Comandos adicionales:
```bash
npm run lint
npm run build
npm run start
```

---

## 7) Realtime local
En Supabase, habilitar realtime para tablas:
- `visits`
- `messages`
- `announcements`

Sin eso, las pantallas siguen funcionando, pero no verás actualización “en vivo”.

---

## 8) Troubleshooting

## Error: redirecciones extrañas al login
- Verifica sesión activa en Supabase Auth.
- Verifica que middleware no esté bloqueando por rol/ruta.
- Revisa que `next` query param en login sea ruta interna válida.

## Error: no puedo crear visita
- Confirma usuario con rol `resident`.
- Confirma `house_members.is_active = true` para la vivienda.
- Revisa policy `visits_resident_insert`.

## Error: no aparecen mensajes/comunicados en realtime
- Verifica tablas habilitadas en Realtime.
- Confirma que sesión y RLS permitan `select`.
- Revisa conexión de red/dispositivo móvil.

## Build falla por tipos/lint
```bash
npm run lint
npm run build
```
Corrige primero lint/type errors antes de revisar runtime.

---

## 9) Comandos útiles de soporte
```bash
# Estado rápido del repo
git status --short

# Último commit
git log -1 --oneline

# Buscar referencias de una policy/ruta
rg "visits_resident_insert|ROLE_ROUTE_RULES|announcements-sync"
```
