import { NextResponse } from "next/server";
import { loadAuthorizedFormulation, isErrorContext } from "@/lib/guard";
import { listEntries, updateFormulationAnalysis } from "@/lib/cases";
import { analyzeAnamnesis } from "@/lib/claude";

/** El profesional fuerza la generación del informe aunque la IA no lo considere aún suficiente. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ caseId: string; formulationId: string }> }
) {
  const { caseId, formulationId } = await params;
  const ctx = await loadAuthorizedFormulation(caseId, formulationId);
  if (isErrorContext(ctx)) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }
  const { case: theCase, formulation } = ctx;

  if (formulation.status === "closed") {
    return NextResponse.json({ error: "Esta ronda ya está cerrada." }, { status: 409 });
  }

  try {
    const entries = await listEntries(formulationId);
    if (entries.length === 0) {
      return NextResponse.json(
        { error: "Añade al menos una entrada de anamnesis antes de generar el informe." },
        { status: 400 }
      );
    }

    const result = await analyzeAnamnesis({
      dogName: theCase.dog_name,
      tutorName: theCase.tutor_name,
      roundNumber: formulation.round_number,
      isFirstRoundOfCase: formulation.round_number === 1,
      previousRoundSummary:
        formulation.round_number > 1
          ? `Ronda de seguimiento tras aplicar y observar los resultados de la estrategia de la ronda ${formulation.round_number - 1}.`
          : null,
      previousCaseModel: formulation.case_model,
      previousHypotheses: formulation.working_hypotheses || [],
      entries: entries.map((e) => ({ raw_text: e.raw_text, created_at: e.created_at })),
      forceReport: true,
    });

    const updated = await updateFormulationAnalysis(formulationId, {
      caseModel: result.case_model,
      workingHypotheses: result.working_hypotheses,
      sufficiency: result.sufficiency,
      nextQuestions: result.next_questions,
      report: result.report,
    });

    return NextResponse.json({ formulation: updated });
  } catch (err) {
    console.error("generate report error", err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Error al generar el informe: ${detail}` }, { status: 502 });
  }
}
