import { NextResponse } from "next/server";
import { loadAuthorizedFormulation, isErrorContext } from "@/lib/guard";
import { startNewRound } from "@/lib/cases";

/**
 * Abre una nueva ronda de anamnesis dirigida a partir de esta, tras aplicar
 * la estrategia y observar resultados (§21). Parte del case_model e
 * hipótesis de la ronda anterior; no la reescribe.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ caseId: string; formulationId: string }> }
) {
  const { caseId, formulationId } = await params;
  const ctx = await loadAuthorizedFormulation(caseId, formulationId);
  if (isErrorContext(ctx)) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }
  const { formulation } = ctx;

  if (formulation.status === "gathering") {
    return NextResponse.json(
      { error: "Esta ronda todavía está en curso; genera antes su informe." },
      { status: 409 }
    );
  }

  try {
    const created = await startNewRound({
      caseId,
      previousFormulationId: formulationId,
      previousCaseModel: formulation.case_model,
      previousHypotheses: formulation.working_hypotheses || [],
    });
    return NextResponse.json({ formulation: created });
  } catch (err) {
    console.error("new round error", err);
    return NextResponse.json({ error: "No se ha podido abrir la nueva ronda." }, { status: 500 });
  }
}
