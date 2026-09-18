import { NextResponse } from "next/server";
import { getProfessionalUser } from "@/lib/auth";
import { deleteCase, setCaseStatus } from "@/lib/cases";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const user = await getProfessionalUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const { caseId } = await params;
  const body = await req.json().catch(() => null);
  const status = body?.status === "archived" ? "archived" : body?.status === "active" ? "active" : null;
  if (!status) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  try {
    const updated = await setCaseStatus(caseId, user.id, status);
    return NextResponse.json({ case: updated });
  } catch (err) {
    console.error("update case status error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se ha podido actualizar el caso." },
      { status: 400 }
    );
  }
}

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
