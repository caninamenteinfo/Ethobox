import "server-only";
import { DOMAIN_KEYS, DOMAIN_LABELS } from "@/lib/domains";
import type { AnalysisResult, CaseModel, WorkingHypothesis } from "@/types";

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

const REPORT_SCHEMA = {
  type: ["object", "null"],
  description: "Informe profesional estandarizado de 12 secciones, o null si aún no se genera.",
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
};

const ANALYSIS_TOOL = {
  name: "submit_case_analysis",
  description:
    "Registra el análisis actualizado del caso: representación por dominios, hipótesis de trabajo, evaluación de suficiencia, preguntas sugeridas y, si procede, el informe profesional.",
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
      report: REPORT_SCHEMA,
    },
    required: ["case_model", "working_hypotheses", "sufficiency", "next_questions", "report"],
  },
};

async function callClaudeForAnalysis(
  messages: { role: string; content: string }[],
  system: string,
  maxTokens = 8000
): Promise<AnalysisResult> {
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
      messages,
      tools: [ANALYSIS_TOOL],
      tool_choice: { type: "tool", name: "submit_case_analysis" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error de la API de Claude (${response.status}): ${errText}`);
  }

  const data = await response.json();

  if (data.stop_reason === "max_tokens") {
    throw new Error(
      "La respuesta del modelo se cortó por longitud antes de terminar el análisis. Prueba a generar el informe con menos información acumulada, o inténtalo de nuevo."
    );
  }

  const toolUse = (data.content || []).find(
    (b: { type: string }) => b.type === "tool_use"
  ) as { type: string; input: unknown } | undefined;

  if (!toolUse) {
    throw new Error("El modelo no devolvió el análisis en el formato esperado.");
  }

  return toolUse.input as AnalysisResult;
}

const DOMAIN_LIST_TEXT = DOMAIN_KEYS.map((k) => `- ${k}: ${DOMAIN_LABELS[k]}`).join("\n");

const SYSTEM_PROMPT = `Eres el motor de razonamiento clínico de Ethobox, una herramienta para profesionales de conducta canina (enfoque de Neuroeducación Canina). Hablas SIEMPRE con el profesional, nunca con el tutor/familia: el tutor no tiene acceso a ti, toda la información llega a través del profesional (en vivo o ya recogida).

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
- Nunca atribuyas automáticamente un fracaso de la estrategia al tutor.

Registra siempre tu análisis llamando a la herramienta submit_case_analysis con TODOS sus campos. Rellena "report" (con su estructura completa) solo si sufficiency.is_sufficient es true, o si el profesional ha pedido explícitamente generar el informe aunque la información sea incompleta (en ese caso, marca las incertidumbres relevantes en incertidumbres/indicadores_evolucion en vez de bloquear). En caso contrario, "report" debe ser null y next_questions debe contener las preguntas pendientes de mayor valor.`;

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

/** Analiza la anamnesis acumulada de una ronda y decide si hay suficiente información. */
export async function analyzeAnamnesis(input: AnalyzeAnamnesisInput): Promise<AnalysisResult> {
  const entriesText = input.entries
    .map((e, i) => `--- Entrada ${i + 1} (${e.created_at}) ---\n${e.raw_text}`)
    .join("\n\n");

  const contextParts = [
    `Caso: perro "${input.dogName}", tutor/familia "${input.tutorName}".`,
    `Ronda de anamnesis número ${input.roundNumber}${input.isFirstRoundOfCase ? " (primera ronda del caso)" : " (ronda de seguimiento tras aplicar la estrategia anterior)"}.`,
  ];
  if (input.previousRoundSummary) {
    contextParts.push(`Resumen de por qué se abrió esta nueva ronda: ${input.previousRoundSummary}`);
  }
  contextParts.push(
    `Representación del caso acumulada hasta ahora (case_model de partida, actualízala, no la descartes):\n${JSON.stringify(input.previousCaseModel, null, 2)}`
  );
  contextParts.push(
    `Hipótesis de trabajo previas (actualízalas si procede):\n${JSON.stringify(input.previousHypotheses, null, 2)}`
  );
  contextParts.push(`Entradas de anamnesis de esta ronda, en orden cronológico:\n\n${entriesText}`);
  contextParts.push(
    input.forceReport
      ? "El profesional ha pedido explícitamente generar el informe AHORA, aunque considere insuficiente la información. Genera igualmente el informe completo, registrando las incertidumbres relevantes."
      : "Evalúa honestamente si ya se alcanza el umbral de suficiencia estratégica. Si no, no generes el informe: sugiere las preguntas de mayor valor para continuar."
  );

  const result = await callClaudeForAnalysis(
    [{ role: "user", content: contextParts.join("\n\n") }],
    SYSTEM_PROMPT,
    8000
  );

  if (!result.case_model || !result.sufficiency) {
    throw new Error("Respuesta del modelo con formato inesperado (faltan campos obligatorios).");
  }
  return result;
}
