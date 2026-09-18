import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AnamnesisEntry, Case, CaseModel, Formulation, WorkingHypothesis } from "@/types";

const CASE_COLUMNS = "id, professional_id, dog_name, tutor_name, notes, status, created_at, updated_at";
const FORMULATION_COLUMNS =
  "id, case_id, round_number, previous_formulation_id, status, case_model, working_hypotheses, sufficiency, next_questions, report, created_at, updated_at, closed_at";
const ENTRY_COLUMNS = "id, formulation_id, case_id, raw_text, created_at";

export async function listCasesForProfessional(professionalId: string): Promise<Case[]> {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("ethobox_cases")
    .select(CASE_COLUMNS)
    .eq("professional_id", professionalId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Case[]) || [];
}

export async function getCaseById(caseId: string, professionalId: string): Promise<Case | null> {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("ethobox_cases")
    .select(CASE_COLUMNS)
    .eq("id", caseId)
    .eq("professional_id", professionalId)
    .maybeSingle();
  return (data as Case) || null;
}

export async function createCase(fields: {
  professionalId: string;
  dogName: string;
  tutorName: string;
  notes: string;
}): Promise<Case> {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("ethobox_cases")
    .insert({
      professional_id: fields.professionalId,
      dog_name: fields.dogName,
      tutor_name: fields.tutorName,
      notes: fields.notes,
    })
    .select(CASE_COLUMNS)
    .single();
  if (error || !data) throw new Error(error?.message || "No se ha podido crear el caso.");

  await admin.from("ethobox_formulations").insert({
    case_id: data.id,
    round_number: 1,
    previous_formulation_id: null,
    status: "gathering",
    case_model: {},
    working_hypotheses: [],
    sufficiency: {},
    next_questions: [],
  });

  return data as Case;
}

export async function listFormulations(caseId: string): Promise<Formulation[]> {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("ethobox_formulations")
    .select(FORMULATION_COLUMNS)
    .eq("case_id", caseId)
    .order("round_number", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Formulation[]) || [];
}

export async function getFormulationById(formulationId: string, caseId: string): Promise<Formulation | null> {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("ethobox_formulations")
    .select(FORMULATION_COLUMNS)
    .eq("id", formulationId)
    .eq("case_id", caseId)
    .maybeSingle();
  return (data as Formulation) || null;
}

export async function listEntries(formulationId: string): Promise<AnamnesisEntry[]> {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("ethobox_anamnesis_entries")
    .select(ENTRY_COLUMNS)
    .eq("formulation_id", formulationId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as AnamnesisEntry[]) || [];
}

export async function addEntry(fields: {
  formulationId: string;
  caseId: string;
  rawText: string;
}): Promise<AnamnesisEntry> {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("ethobox_anamnesis_entries")
    .insert({ formulation_id: fields.formulationId, case_id: fields.caseId, raw_text: fields.rawText })
    .select(ENTRY_COLUMNS)
    .single();
  if (error || !data) throw new Error(error?.message || "No se ha podido guardar la entrada.");
  return data as AnamnesisEntry;
}

export async function updateFormulationAnalysis(
  formulationId: string,
  fields: {
    caseModel: CaseModel;
    workingHypotheses: WorkingHypothesis[];
    sufficiency: Formulation["sufficiency"];
    nextQuestions: string[];
    report: Formulation["report"];
  }
): Promise<Formulation> {
  const admin = supabaseAdmin();
  const status = fields.report ? "ready" : "gathering";
  const { data, error } = await admin
    .from("ethobox_formulations")
    .update({
      case_model: fields.caseModel,
      working_hypotheses: fields.workingHypotheses,
      sufficiency: fields.sufficiency,
      next_questions: fields.nextQuestions,
      report: fields.report,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", formulationId)
    .select(FORMULATION_COLUMNS)
    .single();
  if (error || !data) throw new Error(error?.message || "No se ha podido guardar el análisis.");
  return data as Formulation;
}

export async function closeFormulation(formulationId: string): Promise<Formulation> {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("ethobox_formulations")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", formulationId)
    .eq("status", "ready")
    .select(FORMULATION_COLUMNS)
    .single();
  if (error || !data) {
    throw new Error(
      error?.message || "Solo se puede cerrar una ronda que ya tenga un informe listo ('ready')."
    );
  }
  return data as Formulation;
}

export async function startNewRound(fields: {
  caseId: string;
  previousFormulationId: string;
  previousCaseModel: CaseModel;
  previousHypotheses: WorkingHypothesis[];
}): Promise<Formulation> {
  const admin = supabaseAdmin();
  const { data: prev, error: prevError } = await admin
    .from("ethobox_formulations")
    .select("round_number")
    .eq("id", fields.previousFormulationId)
    .single();
  if (prevError || !prev) throw new Error(prevError?.message || "Ronda anterior no encontrada.");

  const { data, error } = await admin
    .from("ethobox_formulations")
    .insert({
      case_id: fields.caseId,
      round_number: prev.round_number + 1,
      previous_formulation_id: fields.previousFormulationId,
      status: "gathering",
      case_model: fields.previousCaseModel,
      working_hypotheses: fields.previousHypotheses,
      sufficiency: {},
      next_questions: [],
    })
    .select(FORMULATION_COLUMNS)
    .single();
  if (error || !data) throw new Error(error?.message || "No se ha podido abrir la nueva ronda.");
  return data as Formulation;
}
