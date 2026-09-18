import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getProfessionalUser } from "@/lib/auth";
import { getCaseById, getFormulationById, listEntries, listFormulations } from "@/lib/cases";
import { TopBar } from "@/components/TopBar";
import { RoundWorkspace } from "@/components/RoundWorkspace";

export const maxDuration = 30;

export default async function RoundPage({
  params,
}: {
  params: Promise<{ caseId: string; formulationId: string }>;
}) {
  const { caseId, formulationId } = await params;
  const user = await getProfessionalUser();
  if (!user) redirect("/login");

  const theCase = await getCaseById(caseId, user.id);
  if (!theCase) notFound();

  const formulation = await getFormulationById(formulationId, caseId);
  if (!formulation) notFound();

  const [entries, allRounds] = await Promise.all([listEntries(formulationId), listFormulations(caseId)]);

  return (
    <div className="flex flex-1 flex-col">
      <TopBar subtitle={theCase.dog_name} />
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        <Link href={`/cases/${caseId}`} className="text-sm text-teal-700">
          ← Historial de rondas
        </Link>
        <div className="mt-4">
          <RoundWorkspace theCase={theCase} initialFormulation={formulation} initialEntries={entries} allRounds={allRounds} />
        </div>
      </main>
    </div>
  );
}
