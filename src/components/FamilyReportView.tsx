import type { FamilyReport } from "@/types";

function List({ items }: { items: string[] }) {
  if (!items?.length) return <p className="text-sm text-slate-400">—</p>;
  return (
    <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

export function FamilyReportView({ report, dogName }: { report: FamilyReport; dogName: string }) {
  return (
    <div className="bg-white rounded-2xl border border-amber-200 p-6 space-y-5">
      <h2 className="text-lg font-heading font-semibold text-slate-900">
        Informe para la familia — {dogName}
      </h2>

      <section>
        <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-2">
          Entender qué le está pasando
        </h3>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{report.entender_que_le_esta_pasando}</p>
      </section>

      <section className="border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-2">
          Qué creemos que está ocurriendo
        </h3>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{report.que_creemos_que_esta_ocurriendo}</p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <section>
          <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-2">Lo que NO vamos a hacer</h3>
          <List items={report.lo_que_no_vamos_a_hacer} />
        </section>
        <section>
          <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wide mb-2">
            Lo que SÍ vamos a hacer
          </h3>
          <List items={report.lo_que_si_vamos_a_hacer} />
        </section>
      </div>

      <section className="border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-2">Nuestro primer objetivo</h3>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{report.primer_objetivo}</p>
      </section>

      <section className="border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3">Ejercicios prácticos</h3>
        <div className="space-y-4">
          {report.ejercicios.map((ex, i) => (
            <div key={i} className="border border-amber-100 rounded-xl p-4 bg-amber-50/40">
              <p className="font-medium text-slate-900 mb-2">{ex.nombre}</p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-slate-500">Para qué sirve</dt>
                  <dd className="text-slate-800">{ex.para_que_sirve}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Dónde</dt>
                  <dd className="text-slate-800">{ex.donde}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Cuándo</dt>
                  <dd className="text-slate-800">{ex.cuando}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Cómo</dt>
                  <dd className="text-slate-800">{ex.como}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Cuándo premiar</dt>
                  <dd className="text-slate-800">{ex.cuando_premiar}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Qué observar</dt>
                  <dd className="text-slate-800">{ex.que_observar}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Cuándo detenerse</dt>
                  <dd className="text-slate-800">{ex.cuando_detenerse}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Si es demasiado difícil</dt>
                  <dd className="text-slate-800">{ex.como_saber_si_es_demasiado_dificil}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-500">Cómo progresar</dt>
                  <dd className="text-slate-800">{ex.como_progresar}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
