import { NextResponse } from "next/server";
import { loadAuthorizedFormulation, isErrorContext } from "@/lib/guard";
import { closeFormulation } from "@/lib/cases";

/** El profesional marca esta ronda como la versión vigente/"definitiva" por ahora. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ caseId: string; formulationId: string }> }
) {
  const { caseId, formulationId } = await params;
  const ctx = await loadAuthorizedFormulation(caseId, formulationId);
  if (isErrorContext(ctx)) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  try {
    const updated = await closeFormulation(formulationId);
    return NextResponse.json({ formulation: updated });
  } catch (err) {
    console.error("close formulation error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se ha podido cerrar la ronda." },
      { status: 400 }
    );
  }
}
