-- Ethobox — añade el informe para el tutor/familia y el informe para
-- el veterinario, como columnas propias de cada ronda (formulation).
-- Ambos se derivan del informe profesional ya generado, no lo sustituyen.

alter table public.ethobox_formulations
  add column if not exists family_report jsonb,
  add column if not exists vet_report jsonb;
