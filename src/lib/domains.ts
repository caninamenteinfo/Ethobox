/**
 * Dominios de conocimiento (§5 del documento conceptual). No son un
 * cuestionario ni secciones que "rellenar": son la lista de áreas sobre
 * las que la IA puede decidir indagar, cuándo y hasta qué profundidad.
 * Se usan para estructurar el case_model y para que el profesional vea
 * de un vistazo qué se ha explorado y qué no.
 */
export const DOMAIN_KEYS = [
  "conducta",
  "historia_evolucion",
  "estado_funcional",
  "regulacion",
  "sustrato",
  "umwelt",
  "sistemas_emocionales_motivacionales",
  "aprendizaje",
  "contexto",
  "tutor",
  "relacion_perro_tutor",
  "salud",
  "entorno_social",
  "recursos_limitaciones",
] as const;

export type DomainKey = (typeof DOMAIN_KEYS)[number];

export const DOMAIN_LABELS: Record<DomainKey, string> = {
  conducta: "Conducta",
  historia_evolucion: "Historia y evolución",
  estado_funcional: "Estado funcional",
  regulacion: "Regulación",
  sustrato: "Sustrato",
  umwelt: "Umwelt",
  sistemas_emocionales_motivacionales: "Sistemas emocionales / motivacionales",
  aprendizaje: "Aprendizaje",
  contexto: "Contexto",
  tutor: "Tutor",
  relacion_perro_tutor: "Relación perro–tutor",
  salud: "Salud",
  entorno_social: "Entorno social",
  recursos_limitaciones: "Recursos y limitaciones",
};
