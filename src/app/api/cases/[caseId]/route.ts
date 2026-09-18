import { NextResponse } from "next/server";
import { getProfessionalUser } from "@/lib/auth";
import { deleteCase } from "@/lib/cases";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const user = await getProfessionalUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const { caseId } = await params;

  try {
    await deleteCase(caseId, user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete case error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se ha podido borrar el caso." },
      { status: 400 }
    );
  }
}
