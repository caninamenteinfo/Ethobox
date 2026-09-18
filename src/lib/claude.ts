import "server-only";
import { DOMAIN_KEYS, DOMAIN_LABELS } from "@/lib/domains";
import type {
  AnalysisResult,
  CaseModel,
  FamilyReport,
  ProfessionalReport,
  VetReport,
  WorkingHypothesis,
} from "@/types";

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

const UNDERSTANDING_TOOL = {
  name: "update_case_understanding",
  description:
    "Registra la comprensión actualizada del caso: representación por dominios, hipótesis de trabajo, evaluación de suficiencia y preguntas sugeridas. No incluye el informe.",
  input_schema: {
    type: "object",
    properties: {
      case_model: {
        type: "object",
        description:
          "Síntesis narrativa acumulada por dominio (clave = clave de dominio, valor = texto). Incluye todas las claves de dominio conocidas, incluso sin cambios.",
        additionalProperties: { type: "string" },
      },
      working_hypotheses: {
        type: "array",
        items: {
          type: "object",
          properties: {
            hypothesis: { type: "string" },
            supporting_evidence: { type: "array", items: { type: "string" } },
            contradicting_evidence: { type: "array", items: { type: "string" } },
            alternatives: { type: "array", items: { type: "string" } },
          },
          required: ["hypothesis", "supporting_evidence", "contradicting_evidence", "alternatives"],
        },
      },
      sufficiency: {
        type: "object",
        properties: {
          is_sufficient: { type: "boolean" },
          reasoning: { type: "string" },
          open_uncertainties: { type: "array", items: { type: "string" } },
        },
        required: ["is_sufficient", "reasoning", "open_uncertainties"],
      },
      next_questions: {
        type: "array",
        items: { type: "string" },
        description: "Preguntas de alto rendimiento informativo pendientes. Vacío si sufficiency.is_sufficient.",
      },
    },
    required: ["case_model", "working_hypotheses", "sufficiency", "next_questions"],
  },
};

const REPORT_TOOL = {
  name: "submit_professional_report",
  description: "Registra el informe profesional estandarizado de 12 secciones para esta ronda del caso.",
  input_schema: {
    type: "object",
    properties: {
      lectura_rapida: {
        type: "object",
        properties: {
          problema_principal: { type: "string" },
          hipotesis_principal: { type: "string" },
          nivel_confianza: { type: "string" },
          prioridad_actual: { type: "string" },
          decision_estrategica_inicial: { type: "string" },
        },
        required: [
          "problema_principal",
          "hipotesis_principal",
          "nivel_confianza",
          "prioridad_actual",
          "decision_estrategica_inicial",
        ],
      },
      comprension_caso: { type: "string" },
      umwelt: { type: "string" },
      sustrato_estado_funcional: { type: "string" },
      dinamica_neuroconductual: { type: "string" },
      sistemas_emocionales_motivacionales: { type: "string" },
      formulacion_hipotesis: {
        type: "object",
        properties: {
          hipotesis_principal: { type: "string" },
          evidencias: { type: "array", items: { type: "string" } },
          contradicciones: { type: "array", items: { type: "string" } },
          alternativas: { type: "array", items: { type: "string" } },
          incertidumbres: { type: "array", items: { type: "string" } },
        },
        required: ["hipotesis_principal", "evidencias", "contradicciones", "alternativas", "incertidumbres"],
      },
      factores_a_modificar: {
        type: "object",
        properties: {
          perro: { type: "string" },
          umwelt: { type: "string" },
          tutor: { type: "string" },
          interaccion: { type: "string" },
          contexto: { type: "string" },
        },
        required: ["perro", "umwelt", "tutor", "interaccion", "contexto"],
      },
      estrategia_inicial: {
        type: "object",
        properties: {
          objetivos: { type: "array", items: { type: "string" } },
          prioridades: { type: "array", items: { type: "string" } },
          orden_intervencion: { type: "array", items: { type: "string" } },
          que_evitar: { type: "array", items: { type: "string" } },
          herramientas_propuestas: { type: "array", items: { type: "string" } },
        },
        required: ["objetivos", "prioridades", "orden_intervencion", "que_evitar", "herramientas_propuestas"],
      },
      apoyos_complementarios: {
        type: "array",
        items: {
          type: "object",
          properties: {
            item: { type: "string" },
            nivel_evidencia: { type: "string" },
            precauciones: { type: "string" },
          },
          required: ["item", "nivel_evidencia", "precauciones"],
        },
      },
      indicadores_evolucion: { type: "array", items: { type: "string" } },
      criterios_reevaluacion: {
        type: "object",
        properties: {
          mantener: { type: "string" },
          progresar: { type: "string" },
          retroceder: { type: "string" },
          reformular: { type: "string" },
        },
        required: ["mantener", "progresar", "retroceder", "reformular"],
      },
    },
    required: [
      "lectura_rapida",
      "comprension_caso",
      "umwelt",
      "sustrato_estado_funcional",
      "dinamica_neuroconductual",
      "sistemas_emocionales_motivacionales",
      "formulacion_hipotesis",
      "factores_a_modificar",
      "estrategia_inicial",
      "apoyos_complementarios",
      "indicadores_evolucion",
      "criterios_reevaluacion",
    ],
  },
};

const FAMILY_REPORT_TOOL = {
  name: "submit_family_report",
  description:
    "Registra el informe para la familia/tutor: otro producto, no un resumen del informe profesional. Lenguaje claro, cálido, sin jerga técnica.",
  input_schema: {
    type: "object",
    properties: {
      entender_que_le_esta_pasando: {
        type: "string",
        description: "Explicación clara, cálida y no culpabilizadora de qué le pasa al perro.",
      },
      que_creemos_que_esta_ocurriendo: {
        type: "string",
        description: "La formulación profesional traducida a lenguaje familiar, sin jerga técnica.",
      },
      lo_que_no_vamos_a_hacer: { type: "array", items: { type: "string" }, description: "Muy concreto." },
      lo_que_si_vamos_a_hacer: { type: "array", items: { type: "string" }, description: "Muy concreto." },
      primer_objetivo: {
        type: "string",
        description: "Qué capacidad se quiere desarrollar antes de perseguir el síntoma final.",
      },
      ejercicios: {
        type: "array",
        description: "Derivados específicamente de la formulación de este caso, nunca de una lista automática.",
        items: {
          type: "object",
          properties: {
            nombre: { type: "string" },
            para_que_sirve: { type: "string" },
            donde: { type: "string" },
            cuando: { type: "string" },
            como: { type: "string" },
            cuando_premiar: { type: "string" },
            que_observar: { type: "string" },
            cuando_detenerse: { type: "string" },
            como_saber_si_es_demasiado_dificil: { type: "string" },
            como_progresar: { type: "string" },
          },
          required: [
            "nombre",
            "para_que_sirve",
            "donde",
            "cuando",
            "como",
            "cuando_premiar",
            "que_observar",
            "cuando_detenerse",
            "como_saber_si_es_demasiado_dificil",
            "como_progresar",
          ],
        },
      },
    },
    required: [
      "entender_que_le_esta_pasando",
      "que_creemos_que_esta_ocurriendo",
      "lo_que_no_vamos_a_hacer",
      "lo_que_si_vamos_a_hacer",
      "primer_objetivo",
      "ejercicios",
    ],
  },
};

const VET_REPORT_TOOL = {
  name: "submit_vet_report",
  description:
    "Registra una nota de derivación/consulta para el veterinario que colabora en el caso: comunicación clínica entre profesionales.",
  input_schema: {
    type: "object",
    properties: {
      motivo_derivacion: {
        type: "string",
        description: "Por qué se escribe al veterinario. Si no hay motivo médico relevante, decirlo con honestidad.",
      },
      resumen_caso: { type: "string" },
      hallazgos_relevantes_sustrato_salud: {
        type: "string",
        description: "Distinguiendo explícitamente dato observado de inferencia.",
      },
      hipotesis_conductual_relevante: { type: "string" },
      preguntas_para_el_veterinario: {
        type: "array",
        items: { type: "string" },
        description: "Peticiones concretas: descartar X, valorar Y...",
      },
      apoyo_farmacologico_o_medico_a_valorar: {
        type: "array",
        items: { type: "string" },
        description: "Categorías a valorar por el veterinario, nunca una prescripción.",
      },
      urgencia: { type: "string", description: "p.ej. rutinaria / preferente / urgente, con breve justificación." },
    },
    required: [
      "motivo_derivacion",
      "resumen_caso",
      "hallazgos_relevantes_sustrato_salud",
      "hipotesis_conductual_relevante",
      "preguntas_para_el_veterinario",
      "apoyo_farmacologico_o_medico_a_valorar",
      "urgencia",
    ],
  },
};

async function callClaudeTool<T>(
  tool: { name: string; description: string; input_schema: unknown },
  system: string,
  userContent: string,
  maxTokens: number,
  stepLabel: string
): Promise<T> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY no está configurada en el servidor.");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userContent }],
      tools: [tool],
      tool_choice: { type: "tool", name: tool.name },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error de la API de Claude (${response.status}) en "${stepLabel}": ${errText}`);
  }

  const data = await response.json();

  if (data.stop_reason === "max_tokens") {
    throw new Error(
      `La respuesta del modelo se cortó por longitud durante "${stepLabel}". Inténtalo de nuevo; si persiste, prueba a resumir un poco las entradas de anamnesis.`
    );
  }

  const toolUse = (data.content || []).find((b: { type: string }) => b.type === "tool_use") as
    | { type: string; input: unknown }
    | undefined;

  if (!toolUse) {
    throw new Error(`El modelo no devolvió el resultado esperado en "${stepLabel}".`);
  }

  return toolUse.input as T;
}

const DOMAIN_LIST_TEXT = DOMAIN_KEYS.map((k) => `- ${k}: ${DOMAIN_LABELS[k]}`).join("\n");

const REASONING_RULES = `Eres el motor de razonamiento clínico de Ethobox, una herramienta para profesionales de conducta canina (enfoque de Neuroeducación Canina). Hablas SIEMPRE con el profesional, nunca con el tutor/familia: el tutor no tiene acceso a ti, toda la información llega a través del profesional (en vivo o ya recogida).

PRINCIPIO FUNDAMENTAL
No estás rellenando una ficha. Estás construyendo una comprensión progresiva y suficientemente rica del caso (el perro, su Umwelt, su sustrato, su tutor, su historia) para poder responder: ¿qué parece estar ocurriendo, por qué, y qué tiene sentido hacer inicialmente? El informe que produces es una hipótesis de trabajo, no una conclusión definitiva.

DOMINIOS DE CONOCIMIENTO (no son un cuestionario fijo; decides qué explorar, cuándo y hasta qué profundidad)
${DOMAIN_LIST_TEXT}

REGLAS DE RAZONAMIENTO
- Nunca preguntes "por preguntar". Cada pregunta sugerida debe tener capacidad real de cambiar la formulación, una hipótesis, una prioridad o la estrategia. Si dos respuestas posibles llevarían a la misma estrategia, esa pregunta no es prioritaria.
- Una sola respuesta del profesional/tutor puede aportar información sobre varios dominios a la vez. Extrae TODO lo relevante que encuentres en el texto, aunque no responda literalmente a la última pregunta sugerida.
- El Umwelt es una dimensión transversal amplia (vivienda, personas, relaciones, otros animales, ejercicio, salidas, olfacción, descanso, alimentación, previsibilidad, estrés ambiental, recursos, posibilidad real de elección...). No lo trates como un campo que se rellena, sino como un modelo contextual que evoluciona.
- El sustrato (regulación, recuperación, carga de estrés, sueño, capacidad de procesamiento, factores médicos, dolor...) se explora cuando sea relevante. Conceptos como "hipofrontalidad funcional" son hipótesis interpretativas, no diagnósticos: traduce siempre los conceptos neurobiológicos a indicadores conductuales observables, y distingue explícitamente EN EL TEXTO qué es dato observado y qué es inferencia (usa frases como "Dato observado: …" / "Inferencia: …").
- No etiquetes rápido una conducta como "agresión", "miedo" o "ansiedad". Formula en términos de "los datos son compatibles con…" y sostén cada hipótesis con evidencias a favor, evidencias en contra, alternativas consideradas y qué información la cambiaría.
- El tutor es parte del sistema de intervención, no solo una fuente de datos: explora qué hace, cómo interpreta la conducta, qué puede sostener realmente, qué necesita aprender. Una estrategia técnicamente excelente pero inaplicable para esa familia no es una buena estrategia.
- De la historia y evolución, indaga solo lo que pueda cambiar la interpretación o la intervención, no la biografía completa.
- UMBRAL DE SUFICIENCIA ESTRATÉGICA: no continúes indagando solo porque queden campos sin cubrir. Da por suficiente la información cuando permita formular una hipótesis principal, reconocer las incertidumbres relevantes, establecer prioridades y proponer una estrategia inicial razonable. Las incertidumbres que queden se registran como "aspectos a observar/investigar durante la intervención", nunca como bloqueo.
- El informe debe recomendar, no solo describir: propone qué hacer, en qué orden, por qué, qué evitar, qué observar, y qué indicaría que la estrategia funciona o hay que modificarla. Pero la IA propone, el profesional decide: no ocultes incertidumbre para parecer más seguro.
- Nunca atribuyas automáticamente un fracaso de la estrategia al tutor.`;

const SYSTEM_PROMPT_UNDERSTANDING = `${REASONING_RULES}

Tu tarea ahora es ÚNICAMENTE actualizar la comprensión del caso, llamando a update_case_understanding: la representación por dominios, las hipótesis de trabajo, si ya se alcanza el umbral de suficiencia estratégica, y (si no es suficiente) las preguntas de mayor valor para seguir indagando. No redactes ningún informe en este paso — eso ocurre en un paso aparte.`;

const SYSTEM_PROMPT_REPORT = `${REASONING_RULES}

Tu tarea ahora es ÚNICAMENTE redactar el informe profesional completo, llamando a submit_professional_report, a partir de la representación del caso y las hipótesis de trabajo ya construidas (te las paso a continuación). Sigue exactamente la estructura de 12 secciones de la herramienta. Sé concreto y evita relleno: prioriza que cada sección aporte información accionable sobre que sea muy larga.`;

const SYSTEM_PROMPT_FAMILY = `${REASONING_RULES}

Tu tarea ahora es ÚNICAMENTE traducir la formulación e informe profesional ya construidos en un informe PARA LA FAMILIA/TUTOR, llamando a submit_family_report. No es un resumen del informe profesional: es otro producto (§15-19), con objetivo de que la familia entienda qué está pasando, deje de interpretar mal ciertas conductas, sepa exactamente qué NO hacer y qué SÍ hacer, entienda qué se está intentando conseguir, pueda ejecutar los ejercicios, sepa qué observar y pueda reconocer el progreso.
- Lenguaje claro, cálido, cercano y NUNCA culpabilizador. Nada de jerga técnica (los conceptos técnicos quedan en el informe profesional).
- Debe ser accionable: al terminar de leerlo, la familia debe saber "mañana, durante el paseo, hago esto".
- Los ejercicios deben derivarse específicamente de la formulación de ESTE caso — nunca de una lista automática sintoma→ejercicio. Cada ejercicio debe tener un propósito claro y explicable ligado a esa formulación, con instrucciones muy concretas.
- No reveles automáticamente todo el detalle interno del informe profesional (incertidumbres clínicas, alternativas diagnósticas, dudas del profesional): el profesional decide qué se comparte, así que quédate en lo que la familia necesita para actuar bien y sentirse acompañada.`;

const SYSTEM_PROMPT_VET = `${REASONING_RULES}

Tu tarea ahora es ÚNICAMENTE redactar una nota de derivación/consulta PARA EL VETERINARIO que colabora en este caso, llamando a submit_vet_report. Es una comunicación clínica entre profesionales: concreta, sin jerga innecesaria de conducta, centrada en lo que el veterinario necesita saber y hacer.
- Nunca prescribas ni afirmes un diagnóstico médico: el equipo de conducta propone hipótesis y pide valoración veterinaria; el veterinario decide.
- Distingue siempre dato observado de inferencia, especialmente en hallazgos_relevantes_sustrato_salud.
- Si no hay ningún motivo médico relevante que derivar en este momento, dilo con honestidad en motivo_derivacion (p. ej. "descartar dolor antes de intensificar el trabajo conductual") en vez de inventar uno.
- apoyo_farmacologico_o_medico_a_valorar son categorías a considerar por el veterinario (p. ej. "valorar manejo del dolor", "descartar causa endocrina"), nunca fármacos o dosis concretas.`;

export interface AnalyzeAnamnesisInput {
  dogName: string;
  tutorName: string;
  roundNumber: number;
  isFirstRoundOfCase: boolean;
  previousRoundSummary: string | null;
  previousCaseModel: CaseModel;
  previousHypotheses: WorkingHypothesis[];
  entries: { raw_text: string; created_at: string }[];
  forceReport: boolean;
}

interface UnderstandingResult {
  case_model: CaseModel;
  working_hypotheses: WorkingHypothesis[];
  sufficiency: AnalysisResult["sufficiency"];
  next_questions: string[];
}

/** Analiza la anamnesis acumulada de una ronda y decide si hay suficiente información. */
export async function analyzeAnamnesis(input: AnalyzeAnamnesisInput): Promise<AnalysisResult> {
  const entriesText = input.entries
    .map((e, i) => `--- Entrada ${i + 1} (${e.created_at}) ---\n${e.raw_text}`)
    .join("\n\n");

  const caseHeader = [
    `Caso: perro "${input.dogName}", tutor/familia "${input.tutorName}".`,
    `Ronda de anamnesis número ${input.roundNumber}${input.isFirstRoundOfCase ? " (primera ronda del caso)" : " (ronda de seguimiento tras aplicar la estrategia anterior)"}.`,
    input.previousRoundSummary ? `Resumen de por qué se abrió esta nueva ronda: ${input.previousRoundSummary}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const understandingContent = [
    caseHeader,
    `Representación del caso acumulada hasta ahora (case_model de partida, actualízala, no la descartes):\n${JSON.stringify(input.previousCaseModel, null, 2)}`,
    `Hipótesis de trabajo previas (actualízalas si procede):\n${JSON.stringify(input.previousHypotheses, null, 2)}`,
    `Entradas de anamnesis de esta ronda, en orden cronológico:\n\n${entriesText}`,
    "Evalúa honestamente si ya se alcanza el umbral de suficiencia estratégica.",
  ].join("\n\n");

  const understanding = await callClaudeTool<UnderstandingResult>(
    UNDERSTANDING_TOOL,
    SYSTEM_PROMPT_UNDERSTANDING,
    understandingContent,
    6000,
    "actualizar la comprensión del caso"
  );

  if (!understanding.case_model || !understanding.sufficiency) {
    throw new Error("Respuesta del modelo con formato inesperado (faltan campos obligatorios).");
  }

  const shouldGenerateReport = input.forceReport || understanding.sufficiency.is_sufficient;
  let report: ProfessionalReport | null = null;

  if (shouldGenerateReport) {
    const reportContent = [
      caseHeader,
      `Representación del caso (ya actualizada con la última anamnesis):\n${JSON.stringify(understanding.case_model, null, 2)}`,
      `Hipótesis de trabajo (ya actualizadas):\n${JSON.stringify(understanding.working_hypotheses, null, 2)}`,
      `Evaluación de suficiencia: ${JSON.stringify(understanding.sufficiency, null, 2)}`,
      input.forceReport && !understanding.sufficiency.is_sufficient
        ? "El profesional ha pedido explícitamente generar el informe AHORA, aunque la información aún no se considere suficiente. Redacta igualmente el informe completo, registrando las incertidumbres relevantes como aspectos a observar durante la intervención."
        : "La información ya se considera suficiente: redacta el informe completo.",
    ].join("\n\n");

    report = await callClaudeTool<ProfessionalReport>(
      REPORT_TOOL,
      SYSTEM_PROMPT_REPORT,
      reportContent,
      8000,
      "redactar el informe profesional"
    );
  }

  return {
    case_model: understanding.case_model,
    working_hypotheses: understanding.working_hypotheses,
    sufficiency: understanding.sufficiency,
    next_questions: understanding.next_questions,
    report,
  };
}

export interface GenerateDerivedReportInput {
  dogName: string;
  tutorName: string;
  caseModel: CaseModel;
  workingHypotheses: WorkingHypothesis[];
  professionalReport: ProfessionalReport;
}

function derivedReportContext(input: GenerateDerivedReportInput): string {
  return [
    `Caso: perro "${input.dogName}", tutor/familia "${input.tutorName}".`,
    `Representación del caso por dominios:\n${JSON.stringify(input.caseModel, null, 2)}`,
    `Hipótesis de trabajo:\n${JSON.stringify(input.workingHypotheses, null, 2)}`,
    `Informe profesional ya generado (fuente de la que partir, mismo caso, no lo contradigas):\n${JSON.stringify(input.professionalReport, null, 2)}`,
  ].join("\n\n");
}

/** Genera el informe para la familia/tutor a partir del informe profesional ya generado. */
export async function generateFamilyReport(input: GenerateDerivedReportInput): Promise<FamilyReport> {
  return callClaudeTool<FamilyReport>(
    FAMILY_REPORT_TOOL,
    SYSTEM_PROMPT_FAMILY,
    derivedReportContext(input),
    8000,
    "redactar el informe familiar"
  );
}

/** Genera la nota de derivación para el veterinario a partir del informe profesional ya generado. */
export async function generateVetReport(input: GenerateDerivedReportInput): Promise<VetReport> {
  return callClaudeTool<VetReport>(
    VET_REPORT_TOOL,
    SYSTEM_PROMPT_VET,
    derivedReportContext(input),
    4000,
    "redactar la nota para el veterinario"
  );
}
