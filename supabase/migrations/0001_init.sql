-- Ethobox — esquema inicial (V0)
-- Ejecutar en el SQL Editor de Supabase (o vía `supabase db push`).

create extension if not exists "pgcrypto";

-- Perfiles de usuarios de Supabase Auth. Solo se usa para marcar
-- qué cuentas tienen rol "professional" y pueden entrar a la app.
-- El tutor/familia NUNCA tiene cuenta ni acceso directo a la IA:
-- toda la información pasa siempre por el profesional.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'professional' check (role in ('professional')),
  full_name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: select propio" on public.profiles;
create policy "profiles: select propio" on public.profiles
  for select using (auth.uid() = id);

-- Un caso = un perro + su tutor/familia, llevado por un profesional.
-- No guarda diagnóstico alguno directamente: eso vive en las
-- "formulations" (rondas de anamnesis -> formulación -> estrategia).
create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.profiles(id) on delete cascade,
  dog_name text not null,
  tutor_name text not null default '',
  notes text not null default '',
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cases enable row level security;
-- Sin políticas de select/insert/update para anon/authenticated: todo el
-- acceso a casos pasa por rutas de servidor con la service role key
-- (ver src/lib/auth.ts), que comprueba professional_id = usuario actual.

create index if not exists cases_professional_id_idx
  on public.cases(professional_id);

-- Una "formulation" es una ronda del ciclo:
--   anamnesis dirigida -> representación del caso -> ¿suficiente? -> informe
-- Cada caso puede tener N rondas (round_number 1, 2, 3...). Nunca se
-- reescribe una ronda anterior: una nueva ronda es una fila nueva que
-- parte del case_model de la anterior. El profesional decide manualmente
-- cuándo una ronda pasa a 'closed' (versión vigente/"definitiva" por ahora).
create table if not exists public.formulations (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  round_number int not null,
  previous_formulation_id uuid references public.formulations(id),
  status text not null default 'gathering'
    check (status in ('gathering', 'ready', 'closed')),
  -- Representación acumulada del caso por dominios (conducta, historia,
  -- Umwelt, sustrato, sistemas emocionales/motivacionales, aprendizaje,
  -- contexto, tutor, relación perro-tutor, salud, entorno social,
  -- recursos/limitaciones). Ver src/lib/domains.ts.
  case_model jsonb not null default '{}'::jsonb,
  -- Hipótesis de trabajo: [{ hypothesis, supporting_evidence, contradicting_evidence, alternatives }]
  working_hypotheses jsonb not null default '[]'::jsonb,
  -- { is_sufficient, reasoning, open_uncertainties: string[] }
  sufficiency jsonb not null default '{}'::jsonb,
  -- Preguntas de alto rendimiento informativo sugeridas para seguir
  -- indagando, cuando aún no se alcanza el umbral de suficiencia.
  next_questions jsonb not null default '[]'::jsonb,
  -- Informe profesional estandarizado (12 secciones), solo se rellena
  -- cuando status pasa a 'ready' o 'closed'.
  report jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  unique (case_id, round_number)
);

alter table public.formulations enable row level security;

create index if not exists formulations_case_id_idx
  on public.formulations(case_id);

-- Cada entrada de anamnesis es un volcado de texto libre que el
-- profesional aporta (en vivo o recogido antes), asociado a la ronda
-- en curso. La IA los va incorporando al case_model de esa ronda.
create table if not exists public.anamnesis_entries (
  id uuid primary key default gen_random_uuid(),
  formulation_id uuid not null references public.formulations(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  raw_text text not null,
  created_at timestamptz not null default now()
);

alter table public.anamnesis_entries enable row level security;

create index if not exists anamnesis_entries_formulation_id_idx
  on public.anamnesis_entries(formulation_id);
