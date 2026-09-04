import type { ProfessionalReport } from "@/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold text-teal-700 uppercase tracking-wide mb-2">{title}</h3>
      {children}
    </section>
  );
}

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

export function ReportView({ report }: { report: ProfessionalReport }) {
  const qr = report.lectura_rapida;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
      <h2 className="text-lg font-heading font-semibold text-slate-900">Informe profesional</h2>

      <Section title="1. Lectura rápida">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500">Problema principal</dt>
            <dd className="text-slate-900 font-medium">{qr.problema_principal}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Hipótesis principal</dt>
            <dd className="text-slate-900 font-medium">{qr.hipotesis_principal}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Nivel de confianza</dt>
            <dd className="text-slate-900">{qr.nivel_confianza}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Prioridad actual</dt>
            <dd className="text-slate-900">{qr.prioridad_actual}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-slate-500">Decisión estratégica inicial</dt>
            <dd className="text-slate-900">{qr.decision_estrategica_inicial}</dd>
          </div>
        </dl>
      </Section>

      <Section title="2. Comprensión del caso">
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{report.comprension_caso}</p>
      </Section>

      <Section title="3. Umwelt">
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{report.umwelt}</p>
      </Section>

      <Section title="4. Sustrato y estado funcional">
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{report.sustrato_estado_funcional}</p>
      </Section>

      <Section title="5. Dinámica neuroconductual">
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{report.dinamica_neuroconductual}</p>
      </Section>

      <Section title="6. Sistemas emocionales / motivacionales">
        <p className="text-sm text-slate-700 whitespace-pre-wrap">
          {report.sistemas_emocionales_motivacionales}
        </p>
      </Section>

      <Section title="7. Formulación e hipótesis">
        <p className="text-sm text-slate-900 font-medium mb-2">
          {report.formulacion_hipotesis.hipotesis_principal}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold text-emerald-700 mb-1">Evidencias a favor</p>
            <List items={report.formulacion_hipotesis.evidencias} />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-700 mb-1">Contradicciones</p>
            <List items={report.formulacion_hipotesis.contradicciones} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1">Alternativas</p>
            <List items={report.formulacion_hipotesis.alternativas} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1">
              Incertidumbres (a observar durante la intervención)
            </p>
            <List items={report.formulacion_hipotesis.incertidumbres} />
          </div>
        </div>
      </Section>

      <Section title="8. Factores a modificar">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {(
            [
              ["Perro", report.factores_a_modificar.perro],
              ["Umwelt", report.factores_a_modificar.umwelt],
              ["Tutor", report.factores_a_modificar.tutor],
              ["Interacción", report.factores_a_modificar.interaccion],
              ["Contexto", report.factores_a_modificar.contexto],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt className="text-slate-500">{label}</dt>
              <dd className="text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="9. Estrategia inicial">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1">Objetivos</p>
            <List items={report.estrategia_inicial.objetivos} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1">Prioridades</p>
            <List items={report.estrategia_inicial.prioridades} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1">Orden de intervención</p>
            <List items={report.estrategia_inicial.orden_intervencion} />
          </div>
          <div>
            <p className="text-xs font-semibold text-red-700 mb-1">Qué evitar</p>
            <List items={report.estrategia_inicial.que_evitar} />
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold text-slate-600 mb-1">Herramientas propuestas</p>
            <List items={report.estrategia_inicial.herramientas_propuestas} />
          </div>
        </div>
      </Section>

      {report.apoyos_complementarios?.length > 0 && (
        <Section title="10. Apoyos complementarios">
          <ul className="space-y-2 text-sm">
            {report.apoyos_complementarios.map((a, i) => (
              <li key={i} className="border border-slate-100 rounded-lg p-2.5">
                <p className="font-medium text-slate-900">{a.item}</p>
                <p className="text-slate-600">Nivel de evidencia: {a.nivel_evidencia}</p>
                <p className="text-slate-600">Precauciones: {a.precauciones}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="11. Indicadores de evolución">
        <List items={report.indicadores_evolucion} />
      </Section>

      <Section title="12. Criterios de reevaluación">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500">Mantener</dt>
            <dd className="text-slate-800">{report.criterios_reevaluacion.mantener}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Progresar</dt>
            <dd className="text-slate-800">{report.criterios_reevaluacion.progresar}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Retroceder</dt>
            <dd className="text-slate-800">{report.criterios_reevaluacion.retroceder}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Reformular</dt>
            <dd className="text-slate-800">{report.criterios_reevaluacion.reformular}</dd>
          </div>
        </dl>
      </Section>
    </div>
  );
}
