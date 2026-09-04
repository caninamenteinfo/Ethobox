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
