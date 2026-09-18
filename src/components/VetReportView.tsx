import { asArray } from "@/lib/safe-array";
import type { VetReport } from "@/types";

function List({ items }: { items: unknown }) {
  const safe = asArray(items);
  if (!safe.length) return <p className="text-sm text-slate-400">—</p>;
  return (
    <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
      {safe.map((it, i) => (
        <li key={i}>{String(it)}</li>
      ))}
    </ul>
  );
}

export function VetReportView({ report, dogName }: { report: VetReport; dogName: string }) {
  return (
    <div className="bg-white rounded-2xl border border-sky-200 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-semibold text-slate-900">
          Nota para el veterinario — {dogName}
        </h2>
        <span className="text-xs px-2.5 py-1 rounded-full bg-sky-100 text-sky-800">{report.urgencia}</span>
      </div>

      <section>
        <h3 className="text-sm font-semibold text-sky-700 uppercase tracking-wide mb-2">Motivo de la derivación</h3>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{report.motivo_derivacion}</p>
      </section>

      <section className="border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold text-sky-700 uppercase tracking-wide mb-2">Resumen del caso</h3>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{report.resumen_caso}</p>
      </section>

      <section className="border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold text-sky-700 uppercase tracking-wide mb-2">
          Hallazgos relevantes (sustrato / salud)
        </h3>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{report.hallazgos_relevantes_sustrato_salud}</p>
      </section>

      <section className="border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold text-sky-700 uppercase tracking-wide mb-2">
          Hipótesis conductual relevante
        </h3>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{report.hipotesis_conductual_relevante}</p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <section>
          <h3 className="text-sm font-semibold text-sky-700 uppercase tracking-wide mb-2">
            Preguntas para el veterinario
          </h3>
          <List items={report.preguntas_para_el_veterinario} />
        </section>
        <section>
          <h3 className="text-sm font-semibold text-sky-700 uppercase tracking-wide mb-2">
            Apoyo farmacológico/médico a valorar
          </h3>
          <List items={report.apoyo_farmacologico_o_medico_a_valorar} />
          <p className="text-xs text-slate-400 mt-2">
            Categorías a valorar por el veterinario, no una prescripción.
          </p>
        </section>
      </div>
    </div>
  );
}
