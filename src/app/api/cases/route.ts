import { NextResponse } from "next/server";
import { getProfessionalUser } from "@/lib/auth";
import { createCase, listFormulations } from "@/lib/cases";

export async function POST(req: Request) {
  const user = await getProfessionalUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const dogName = typeof body?.dogName === "string" ? body.dogName.trim() : "";
  const tutorName = typeof body?.tutorName === "string" ? body.tutorName.trim() : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";

  if (!dogName) {
    return NextResponse.json({ error: "El nombre del perro es obligatorio." }, { status: 400 });
  }

  try {
    const created = await createCase({ professionalId: user.id, dogName, tutorName, notes });
    const [firstRound] = await listFormulations(created.id);
    return NextResponse.json({ case: created, formulation: firstRound });
  } catch (err) {
    console.error("create case error", err);
    return NextResponse.json({ error: "No se ha podido crear el caso." }, { status: 500 });
  }
}
