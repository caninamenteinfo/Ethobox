import "server-only";
import { DOMAIN_KEYS, DOMAIN_LABELS } from "@/lib/domains";
import type { AnalysisResult, CaseModel, WorkingHypothesis } from "@/types";

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

async function callClaude(
  messages: { role: string; content: string }[],
  system: string,
  maxTokens = 4000
): Promise<string> {
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
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error de la API de Claude (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = (data.content || [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("\n");

  if (!text) {
    throw new Error("Respuesta vacía del modelo.");
  }
  return text;
}

function extractJson(reply: string): unknown {
  let clean = reply.replace(/```json|```/g, "").trim();
  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    clean = clean.slice(firstBrace, lastBrace + 1);
  }
  return JSON.parse(clean);
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

FORMATO DE SALIDA
Responde ÚNICAMENTE con JSON válido, sin texto adicional ni markdown, con exactamente esta forma:
{
  "case_model": { "<clave_de_dominio>": "síntesis narrativa acumulada de ese dominio, o cadena vacía si aún no se ha explorado", ... incluye TODAS las claves de dominio listadas arriba, incluso si no cambian respecto a lo que ya tenías ... },
  "working_hypotheses": [ { "hypothesis": "...", "supporting_evidence": ["..."], "contradicting_evidence": ["..."], "alternatives": ["..."] } ],
  "sufficiency": { "is_sufficient": true|false, "reasoning": "por qué crees que sí/no basta ya para actuar", "open_uncertainties": ["..."] },
  "next_questions": ["pregunta de alto rendimiento informativo 1", "..."],
  "report": null | {
    "lectura_rapida": { "problema_principal": "...", "hipotesis_principal": "...", "nivel_confianza": "...", "prioridad_actual": "...", "decision_estrategica_inicial": "..." },
    "comprension_caso": "...",
    "umwelt": "...",
    "sustrato_estado_funcional": "...",
    "dinamica_neuroconductual": "...",
    "sistemas_emocionales_motivacionales": "...",
    "formulacion_hipotesis": { "hipotesis_principal": "...", "evidencias": ["..."], "contradicciones": ["..."], "alternativas": ["..."], "incertidumbres": ["..."] },
    "factores_a_modificar": { "perro": "...", "umwelt": "...", "tutor": "...", "interaccion": "...", "contexto": "..." },
    "estrategia_inicial": { "objetivos": ["..."], "prioridades": ["..."], "orden_intervencion": ["..."], "que_evitar": ["..."], "herramientas_propuestas": ["..."] },
    "apoyos_complementarios": [ { "item": "...", "nivel_evidencia": "...", "precauciones": "..." } ],
    "indicadores_evolucion": ["..."],
    "criterios_reevaluacion": { "mantener": "...", "progresar": "...", "retroceder": "...", "reformular": "..." }
  }
}

Rellena "report" (con la estructura completa de arriba) si sufficiency.is_sufficient es true, o si el profesional ha pedido explícitamente generar el informe aunque la información sea incompleta (en ese caso, marca las incertidumbres relevantes en incertidumbres/indicadores_evolucion en vez de bloquear). En caso contrario, "report" debe ser null y next_questions debe contener las preguntas pendientes de mayor valor.`;

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

  const reply = await callClaude(
    [{ role: "user", content: contextParts.join("\n\n") }],
    SYSTEM_PROMPT,
    4000
  );

  const parsed = extractJson(reply) as AnalysisResult;
  if (!parsed.case_model || !parsed.sufficiency) {
    throw new Error("Respuesta del modelo con formato inesperado.");
  }
  return parsed;
}
