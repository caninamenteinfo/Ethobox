import type { DomainKey } from "@/lib/domains";

export interface Profile {
  id: string;
  role: "professional";
  full_name: string;
}

export interface Case {
  id: string;
  professional_id: string;
  dog_name: string;
  tutor_name: string;
  notes: string;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

export type CaseModel = Partial<Record<DomainKey, string>>;

export interface WorkingHypothesis {
  hypothesis: string;
  supporting_evidence: string[];
  contradicting_evidence: string[];
  alternatives: string[];
}

export interface Sufficiency {
  is_sufficient: boolean;
  reasoning: string;
  open_uncertainties: string[];
}

export interface QuickRead {
  problema_principal: string;
  hipotesis_principal: string;
  nivel_confianza: string;
  prioridad_actual: string;
  decision_estrategica_inicial: string;
}

export interface FormulacionHipotesis {
  hipotesis_principal: string;
  evidencias: string[];
  contradicciones: string[];
  alternativas: string[];
  incertidumbres: string[];
}

export interface FactoresAModificar {
  perro: string;
  umwelt: string;
  tutor: string;
  interaccion: string;
  contexto: string;
}

export interface EstrategiaInicial {
  objetivos: string[];
  prioridades: string[];
  orden_intervencion: string[];
  que_evitar: string[];
  herramientas_propuestas: string[];
}

export interface ApoyoComplementario {
  item: string;
  nivel_evidencia: string;
  precauciones: string;
}

export interface CriteriosReevaluacion {
  mantener: string;
  progresar: string;
  retroceder: string;
  reformular: string;
}

/** Informe profesional estandarizado — estructura de 12 secciones (§13). */
export interface ProfessionalReport {
  lectura_rapida: QuickRead;
  comprension_caso: string;
  umwelt: string;
  sustrato_estado_funcional: string;
  dinamica_neuroconductual: string;
  sistemas_emocionales_motivacionales: string;
  formulacion_hipotesis: FormulacionHipotesis;
  factores_a_modificar: FactoresAModificar;
  estrategia_inicial: EstrategiaInicial;
  apoyos_complementarios: ApoyoComplementario[];
  indicadores_evolucion: string[];
  criterios_reevaluacion: CriteriosReevaluacion;
}

/** Cada ejercicio del informe familiar, siempre derivado de la formulación de ese caso (§17-18). */
export interface FamilyExercise {
  nombre: string;
  para_que_sirve: string;
  donde: string;
  cuando: string;
  como: string;
  cuando_premiar: string;
  que_observar: string;
  cuando_detenerse: string;
  como_saber_si_es_demasiado_dificil: string;
  como_progresar: string;
}

/** Informe para la familia/tutor — otro producto, no un resumen del profesional (§15-19). */
export interface FamilyReport {
  entender_que_le_esta_pasando: string;
  que_creemos_que_esta_ocurriendo: string;
  lo_que_no_vamos_a_hacer: string[];
  lo_que_si_vamos_a_hacer: string[];
  primer_objetivo: string;
  ejercicios: FamilyExercise[];
}

/** Informe/nota de derivación para el veterinario que colabora en el caso. */
export interface VetReport {
  motivo_derivacion: string;
  resumen_caso: string;
  hallazgos_relevantes_sustrato_salud: string;
  hipotesis_conductual_relevante: string;
  preguntas_para_el_veterinario: string[];
  apoyo_farmacologico_o_medico_a_valorar: string[];
  urgencia: string;
}

export type FormulationStatus = "gathering" | "ready" | "closed";

export interface Formulation {
  id: string;
  case_id: string;
  round_number: number;
  previous_formulation_id: string | null;
  status: FormulationStatus;
  case_model: CaseModel;
  working_hypotheses?: WorkingHypothesis[];
  sufficiency: Sufficiency | Record<string, never>;
  next_questions: string[];
  report: ProfessionalReport | null;
  family_report: FamilyReport | null;
  vet_report: VetReport | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface AnamnesisEntry {
  id: string;
  formulation_id: string;
  case_id: string;
  raw_text: string;
  created_at: string;
}

/** Salida estructurada que le pedimos a la IA en cada turno de análisis. */
export interface AnalysisResult {
  case_model: CaseModel;
  working_hypotheses: WorkingHypothesis[];
  sufficiency: Sufficiency;
  next_questions: string[];
  report: ProfessionalReport | null;
}
