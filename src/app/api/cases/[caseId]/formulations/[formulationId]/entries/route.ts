import { NextResponse } from "next/server";
import { loadAuthorizedFormulation, isErrorContext } from "@/lib/guard";
import { addEntry, listEntries, updateFormulationAnalysis } from "@/lib/cases";
import { analyzeAnamnesis } from "@/lib/claude";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ caseId: string; formulationId: string }> }
) {
  const { caseId, formulationId } = await params;
  const ctx = await loadAuthorizedFormulation(caseId, formulationId);
  if (isErrorContext(ctx)) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }
  const { case: theCase, formulation } = ctx;

  if (formulation.status === "closed") {
    return NextResponse.json(
      { error: "Esta ronda ya está cerrada. Abre una ronda nueva para añadir más información." },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => null);
  const rawText = typeof body?.rawText === "string" ? body.rawText.trim() : "";

  try {
    let entries = await listEntries(formulationId);
    if (rawText) {
      await addEntry({ formulationId, caseId, rawText });
      entries = await listEntries(formulationId);
    } else if (entries.length === 0) {
      // Sin texto nuevo y sin entradas previas: no hay nada que (re)analizar.
      return NextResponse.json({ error: "El texto de la entrada no puede estar vacío." }, { status: 400 });
    }
    // rawText vacío + entradas ya existentes = reintento: reanaliza lo ya
    // guardado sin duplicar ninguna entrada.

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
      forceReport: false,
    });

    const updated = await updateFormulationAnalysis(formulationId, {
      caseModel: result.case_model,
      workingHypotheses: result.working_hypotheses,
      sufficiency: result.sufficiency,
      nextQuestions: result.next_questions,
      report: result.report,
    });

    return NextResponse.json({ formulation: updated, entries });
  } catch (err) {
    console.error("analyze entry error", err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Error al analizar la anamnesis: ${detail}` }, { status: 502 });
  }
}
