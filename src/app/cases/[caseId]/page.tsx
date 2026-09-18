import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getProfessionalUser } from "@/lib/auth";
import { getCaseById, listFormulations } from "@/lib/cases";
import { TopBar } from "@/components/TopBar";
import { DeleteCaseButton } from "@/components/DeleteCaseButton";
import { ArchiveCaseButton } from "@/components/ArchiveCaseButton";

const STATUS_LABEL: Record<string, string> = {
  gathering: "Recogiendo información",
  ready: "Informe listo (borrador)",
  closed: "Cerrada · versión vigente",
};

const STATUS_COLOR: Record<string, string> = {
  gathering: "bg-amber-100 text-amber-800",
  ready: "bg-teal-100 text-teal-800",
  closed: "bg-slate-200 text-slate-700",
};

function ordinal(n: number): string {
  return `${n}ª`;
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const user = await getProfessionalUser();
  if (!user) redirect("/login");

  const theCase = await getCaseById(caseId, user.id);
  if (!theCase) notFound();

  const rounds = await listFormulations(caseId);

  return (
    <div className="flex flex-1 flex-col">
      <TopBar subtitle={theCase.dog_name} />
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/cases" className="text-sm text-teal-700">
              ← Todos los casos
            </Link>
            <h1 className="text-xl font-heading font-semibold text-slate-900 mt-2">{theCase.dog_name}</h1>
            <p className="text-sm text-slate-500">{theCase.tutor_name || "Sin tutor registrado"}</p>
            {theCase.notes && <p className="text-sm text-slate-600 mt-2">{theCase.notes}</p>}
            {theCase.status === "archived" && (
              <span className="inline-block mt-2 text-xs px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
                Archivado
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-3">
            <ArchiveCaseButton caseId={caseId} status={theCase.status} />
            <DeleteCaseButton caseId={caseId} dogName={theCase.dog_name} />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Anamnesis de este caso ({rounds.length})
          </h2>
          <ul className="divide-y divide-slate-200 bg-white rounded-2xl border border-slate-200">
            {rounds.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/cases/${caseId}/rounds/${r.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-slate-50"
                >
                  <div>
                    <span className="font-medium text-slate-900">
                      {ordinal(r.round_number)} anamnesis
                    </span>
                    <div className="flex gap-1.5 mt-1">
                      {r.report && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-700">
                          informe profesional
                        </span>
                      )}
                      {r.family_report && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                          informe familiar
                        </span>
                      )}
                      {r.vet_report && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700">
                          nota veterinaria
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full shrink-0 ${STATUS_COLOR[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
