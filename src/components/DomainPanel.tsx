import { DOMAIN_KEYS, DOMAIN_LABELS } from "@/lib/domains";
import type { CaseModel, WorkingHypothesis } from "@/types";

export function DomainPanel({
  caseModel,
  hypotheses,
}: {
  caseModel: CaseModel;
  hypotheses: WorkingHypothesis[];
}) {
  const exploredDomains = DOMAIN_KEYS.filter((k) => (caseModel[k] || "").trim().length > 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Representación del caso ({exploredDomains.length}/{DOMAIN_KEYS.length} dominios explorados)
        </h2>
        {exploredDomains.length === 0 ? (
          <p className="text-sm text-slate-400">
            Todavía no hay ninguna síntesis por dominio. Añade la primera entrada de anamnesis.
          </p>
        ) : (
          <dl className="space-y-3">
            {exploredDomains.map((key) => (
              <div key={key}>
                <dt className="text-xs font-semibold text-teal-700">{DOMAIN_LABELS[key]}</dt>
                <dd className="text-sm text-slate-700 whitespace-pre-wrap">{caseModel[key]}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {hypotheses.length > 0 && (
        <div className="border-t border-slate-100 pt-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Hipótesis de trabajo
          </h2>
          <ul className="space-y-3">
            {hypotheses.map((h, i) => (
              <li key={i} className="text-sm">
                <p className="font-medium text-slate-900">Los datos son compatibles con: {h.hypothesis}</p>
                {h.supporting_evidence.length > 0 && (
                  <p className="text-slate-600 mt-1">
                    <span className="text-emerald-700 font-medium">A favor: </span>
                    {h.supporting_evidence.join("; ")}
                  </p>
                )}
                {h.contradicting_evidence.length > 0 && (
                  <p className="text-slate-600">
                    <span className="text-amber-700 font-medium">En contra: </span>
                    {h.contradicting_evidence.join("; ")}
                  </p>
                )}
                {h.alternatives.length > 0 && (
                  <p className="text-slate-500">
                    <span className="font-medium">Alternativas: </span>
                    {h.alternatives.join("; ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
