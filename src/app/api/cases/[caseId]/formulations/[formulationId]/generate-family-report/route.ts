import { NextResponse } from "next/server";
import { loadAuthorizedFormulation, isErrorContext } from "@/lib/guard";
import { saveFamilyReport } from "@/lib/cases";
import { generateFamilyReport } from "@/lib/claude";

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

  if (!formulation.report) {
    return NextResponse.json(
      { error: "Primero hay que generar el informe profesional de esta ronda." },
      { status: 400 }
    );
  }

  try {
    const familyReport = await generateFamilyReport({
      dogName: theCase.dog_name,
      tutorName: theCase.tutor_name,
      caseModel: formulation.case_model,
      workingHypotheses: formulation.working_hypotheses || [],
      professionalReport: formulation.report,
    });
    const updated = await saveFamilyReport(formulationId, familyReport);
    return NextResponse.json({ formulation: updated });
  } catch (err) {
    console.error("generate family report error", err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Error al generar el informe familiar: ${detail}` }, { status: 502 });
  }
}
