# Ethobox

Anamnesis inteligente, formulación y estrategia para profesionales de conducta canina.

Este es el **V0**: un primer prototipo mínimo, deliberadamente acotado. No incluye todavía el informe para la familia ni el modo "copiloto en vivo" — solo el ciclo profesional: anamnesis asíncrona → representación del caso → suficiencia → informe profesional → cierre de ronda → nueva ronda de seguimiento.

## Principios del sistema (resumen)

- El tutor/familia **nunca** tiene acceso directo a la IA. Todo pasa por el profesional, que pega o dicta en la app lo que ha recogido (en consulta o por su cuenta).
- La IA no rellena un formulario: construye una representación del caso por dominios (conducta, historia, Umwelt, sustrato, sistemas emocionales/motivacionales, tutor, contexto...) y decide qué indagar.
- Se detiene por **suficiencia estratégica**, no por campos vacíos. El profesional puede forzar el informe antes si lo necesita.
- Cada caso puede tener N rondas de anamnesis → formulación → estrategia → aplicación → observación → nueva ronda. Nada se reescribe: cada ronda es una fila nueva que parte del estado de la anterior. El profesional decide manualmente cuándo una ronda pasa a "cerrada" (versión vigente por ahora).

Ver el documento conceptual original para el detalle completo de las reglas de razonamiento (dominios, Umwelt, sustrato, sistemas emocionales, estructura del informe de 12 secciones, etc.) — están traducidas al prompt del sistema en `src/lib/claude.ts`.

## Stack

Next.js 16 (App Router) + Supabase (Auth + Postgres) + Anthropic API. Mismo patrón que el proyecto hermano `campus_caniciencia`: la service role key de Supabase solo se usa en código de servidor (`server-only`), la autorización real siempre se comprueba ahí, nunca solo con RLS de cliente.

## Poner en marcha

1. `npm install`
2. Crea un proyecto en [Supabase](https://supabase.com) y ejecuta `supabase/migrations/0001_init.sql` en el SQL Editor.
3. Crea tu usuario profesional: Authentication → Users → Add user (email + contraseña). Copia su UID y ejecuta `supabase/migrations/0002_seed_professional.sql.example` (renombrado a `.sql` o pegado directamente) con ese UID.
4. Copia `.env.example` a `.env.local` y rellena las claves de Supabase (Project Settings → API) y tu `ANTHROPIC_API_KEY`.
5. `npm run dev` y entra en `/login` con el usuario creado en el paso 3.

### Desplegar en Vercel

Alternativa a correrlo en local: importar este repositorio en [Vercel](https://vercel.com/new) y configurar las mismas variables del paso 4 en Project → Settings → Environment Variables. Las que empiezan por `NEXT_PUBLIC_` van como tipo **Config** (se exponen al navegador); `SUPABASE_SERVICE_ROLE_KEY` y `ANTHROPIC_API_KEY` van como tipo **Secret**. Nota: Supabase permite compartir un único proyecto entre varias apps con RLS habilitado y `service_role` para el acceso real — por eso las tablas de Ethobox llevan el prefijo `ethobox_`, si convives con otro proyecto (como `campus_caniciencia`) en la misma cuenta gratuita de Supabase.

## Flujo de uso

1. **Nuevo caso** (`/cases`) — nombre del perro y del tutor. Se crea automáticamente la ronda 1.
2. **Ronda de anamnesis** (`/cases/[id]/rounds/[id]`) — vas pegando/dictando lo que te cuenta el tutor (o tus propias notas). Cada vez que pulsas "Analizar", la IA actualiza la representación del caso, las hipótesis de trabajo y te dice si ya hay suficiente información o qué preguntar a continuación.
3. Cuando la IA lo considera suficiente (o tú fuerzas "Generar informe ahora"), aparece el **informe profesional** de 12 secciones.
4. **"Cerrar esta ronda como vigente"** la marca como la versión de referencia actual del caso (no impide reabrir más adelante).
5. Tras aplicar la estrategia y observar resultados, **"Iniciar nueva ronda"** abre la ronda siguiente, partiendo de la representación del caso ya construida — no desde cero.

## Qué falta a propósito (fuera de alcance del V0)

- Informe para la familia/tutor (otro producto, con su propio lenguaje y ejercicios derivados de la formulación).
- Modo copiloto en vivo (sugerencias de pregunta en tiempo real durante la consulta).
- Roles múltiples / multi-profesional en un mismo caso.
