import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getProfessionalUser } from "@/lib/auth";
import { getCaseById, listFormulations } from "@/lib/cases";
import { TopBar } from "@/components/TopBar";

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
        <div>
          <Link href="/cases" className="text-sm text-teal-700">
            ← Todos los casos
          </Link>
          <h1 className="text-xl font-heading font-semibold text-slate-900 mt-2">{theCase.dog_name}</h1>
          <p className="text-sm text-slate-500">{theCase.tutor_name || "Sin tutor registrado"}</p>
          {theCase.notes && <p className="text-sm text-slate-600 mt-2">{theCase.notes}</p>}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Rondas de anamnesis / formulación
          </h2>
          <ul className="divide-y divide-slate-200 bg-white rounded-2xl border border-slate-200">
            {rounds.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/cases/${caseId}/rounds/${r.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-900">Ronda {r.round_number}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full ${STATUS_COLOR[r.status]}`}>
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
