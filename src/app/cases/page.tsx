import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfessionalUser } from "@/lib/auth";
import { listCasesForProfessional } from "@/lib/cases";
import { TopBar } from "@/components/TopBar";
import { NewCaseForm } from "@/components/NewCaseForm";
import type { Case } from "@/types";

function CaseList({ cases }: { cases: Case[] }) {
  return (
    <ul className="divide-y divide-slate-200 bg-white rounded-2xl border border-slate-200">
      {cases.map((c) => (
        <li key={c.id}>
          <Link href={`/cases/${c.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50">
            <div>
              <p className="font-medium text-slate-900">{c.dog_name}</p>
              <p className="text-sm text-slate-500">{c.tutor_name || "Sin tutor registrado"}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function CasesPage() {
  const user = await getProfessionalUser();
  if (!user) redirect("/login");

  const cases = await listCasesForProfessional(user.id);
  const activeCases = cases.filter((c) => c.status === "active");
  const archivedCases = cases.filter((c) => c.status === "archived");

  return (
    <div className="flex flex-1 flex-col">
      <TopBar subtitle="Casos" />
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-heading font-semibold text-slate-900">Tus casos</h1>
        </div>

        <NewCaseForm />

        {cases.length === 0 ? (
          <p className="text-slate-500 text-sm">Todavía no tienes ningún caso. Crea el primero arriba.</p>
        ) : (
          <>
            {activeCases.length === 0 ? (
              <p className="text-slate-500 text-sm">No tienes casos activos.</p>
            ) : (
              <CaseList cases={activeCases} />
            )}

            {archivedCases.length > 0 && (
              <details className="group">
                <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-700 select-none">
                  Casos archivados ({archivedCases.length})
                </summary>
                <div className="mt-3">
                  <CaseList cases={archivedCases} />
                </div>
              </details>
            )}
          </>
        )}
      </main>
    </div>
  );
}
