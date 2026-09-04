import "server-only";
import { getProfessionalUser } from "@/lib/auth";
import { getCaseById, getFormulationById } from "@/lib/cases";
import type { Case, Formulation } from "@/types";

interface AuthorizedContext {
  userId: string;
  case: Case;
  formulation: Formulation;
}

/** Comprueba sesión + que el caso pertenece al profesional + que la ronda es de ese caso. */
export async function loadAuthorizedFormulation(
  caseId: string,
  formulationId: string
): Promise<AuthorizedContext | { error: string; status: number }> {
  const user = await getProfessionalUser();
  if (!user) return { error: "No autorizado.", status: 401 };

  const found = await getCaseById(caseId, user.id);
  if (!found) return { error: "Caso no encontrado.", status: 404 };

  const formulation = await getFormulationById(formulationId, caseId);
  if (!formulation) return { error: "Ronda no encontrada.", status: 404 };

  return { userId: user.id, case: found, formulation };
}

export function isErrorContext(
  ctx: AuthorizedContext | { error: string; status: number }
): ctx is { error: string; status: number } {
  return "error" in ctx;
}
