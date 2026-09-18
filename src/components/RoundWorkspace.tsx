"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, FileText, Lock, RotateCcw } from "lucide-react";
import { DomainPanel } from "@/components/DomainPanel";
import { ReportView } from "@/components/ReportView";
import type { AnamnesisEntry, Case, Formulation } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  gathering: "Recogiendo información",
  ready: "Informe listo (borrador)",
  closed: "Cerrada · versión vigente",
};

export function RoundWorkspace({
  theCase,
  initialFormulation,
  initialEntries,
}: {
  theCase: Case;
  initialFormulation: Formulation;
  initialEntries: AnamnesisEntry[];
}) {
  const router = useRouter();
  const [formulation, setFormulation] = useState(initialFormulation);
  const [entries, setEntries] = useState(initialEntries);
  const [draft, setDraft] = useState("");
  const [answers, setAnswers] = useState<string[]>(() => (initialFormulation.next_questions || []).map(() => ""));
  const [busy, setBusy] = useState<null | "analyze" | "force" | "close" | "newRound">(null);
  const [error, setError] = useState<string | null>(null);

  const base = `/api/cases/${theCase.id}/formulations/${formulation.id}`;

  const setAnswer = (index: number, value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const composeRawText = () => {
    const parts: string[] = [];
    (formulation.next_questions || []).forEach((q, i) => {
      const a = answers[i]?.trim();
      if (a) parts.push(`Pregunta: ${q}\nRespuesta: ${a}`);
    });
    if (draft.trim()) parts.push(draft.trim());
    return parts.join("\n\n");
  };

  const hasSomethingToAnalyze = composeRawText().length > 0;

  // rawText === undefined -> envío normal (compone preguntas+notas).
  // rawText === "" -> reintento: no añade ninguna entrada nueva, solo
  // vuelve a analizar lo que ya está guardado (evita duplicar texto si
  // el paso anterior falló después de guardar la entrada).
  const runAnalyze = async (rawTextOverride?: string) => {
    if (busy) return;
    const rawText = rawTextOverride ?? composeRawText();
    if (rawTextOverride === undefined && !rawText) return;
    setBusy("analyze");
    setError(null);
    const res = await fetch(`${base}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText }),
    });
    const data = await res.json().catch(() => null);
    setBusy(null);
    if (!res.ok) {
      setError(data?.error || "Error al analizar.");
      // El texto ya quedó guardado como entrada antes de fallar: se
      // limpian las cajas para no reenviarlo duplicado al reintentar.
      setDraft("");
      setAnswers((formulation.next_questions || []).map(() => ""));
      return;
    }
    setFormulation(data.formulation);
    setEntries(data.entries);
    setDraft("");
    setAnswers((data.formulation.next_questions || []).map(() => ""));
  };

  const analyze = () => runAnalyze();
  const retryAnalyze = () => runAnalyze("");

  const forceReport = async () => {
    if (busy) return;
    setBusy("force");
    setError(null);
    const res = await fetch(`${base}/generate-report`, { method: "POST" });
    const data = await res.json().catch(() => null);
    setBusy(null);
    if (!res.ok) {
      setError(data?.error || "Error al generar el informe.");
      return;
    }
    setFormulation(data.formulation);
  };

  const close = async () => {
    if (busy) return;
    setBusy("close");
    setError(null);
    const res = await fetch(`${base}/close`, { method: "POST" });
    const data = await res.json().catch(() => null);
    setBusy(null);
    if (!res.ok) {
      setError(data?.error || "Error al cerrar la ronda.");
      return;
    }
    setFormulation(data.formulation);
  };

  const newRound = async () => {
    if (busy) return;
    setBusy("newRound");
    setError(null);
    const res = await fetch(`${base}/new-round`, { method: "POST" });
    const data = await res.json().catch(() => null);
    setBusy(null);
    if (!res.ok) {
      setError(data?.error || "Error al abrir la nueva ronda.");
      return;
    }
    router.push(`/cases/${theCase.id}/rounds/${data.formulation.id}`);
  };

  const sufficiency = "is_sufficient" in formulation.sufficiency ? formulation.sufficiency : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-semibold text-slate-900">
            Ronda {formulation.round_number} · {theCase.dog_name}
          </h1>
          <p className="text-sm text-slate-500">{STATUS_LABEL[formulation.status]}</p>
        </div>
      </div>

      {sufficiency && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            sufficiency.is_sufficient
              ? "border-teal-200 bg-teal-50 text-teal-900"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          <p className="font-medium">
            {sufficiency.is_sufficient
              ? "La IA considera que hay suficiente información para actuar."
              : "La IA considera que aún no hay suficiente información."}
          </p>
          <p className="mt-1">{sufficiency.reasoning}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Anamnesis de esta ronda
            </h2>
            <div className="space-y-3 max-h-80 overflow-y-auto mb-3">
              {entries.length === 0 && (
                <p className="text-sm text-slate-400">
                  Pega o dicta aquí lo que te ha contado el tutor (o tus propias notas de consulta).
                </p>
              )}
              {entries.map((e) => (
                <div key={e.id} className="text-sm bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">
                  {e.raw_text}
                </div>
              ))}
            </div>

          </div>

          {formulation.status !== "closed" && formulation.next_questions?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Preguntas sugeridas (mayor valor diferencial)
              </h2>
              <div className="space-y-4">
                {formulation.next_questions.map((q, i) => (
                  <div key={i}>
                    <p className="text-sm text-slate-800 font-medium mb-1">{q}</p>
                    <textarea
                      value={answers[i] || ""}
                      onChange={(ev) => setAnswer(i, ev.target.value)}
                      rows={2}
                      placeholder="Qué te ha contado el tutor (o tu impresión)…"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-600"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {formulation.status !== "closed" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Otras notas u observaciones
              </h2>
              <textarea
                value={draft}
                onChange={(ev) => setDraft(ev.target.value)}
                rows={4}
                placeholder="Cualquier otra información, no ligada a una pregunta concreta…"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-600"
              />
              <button
                onClick={analyze}
                disabled={!hasSomethingToAnalyze || busy !== null}
                className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {busy === "analyze" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Analizar
              </button>
            </div>
          )}
        </div>

        <DomainPanel caseModel={formulation.case_model} hypotheses={formulation.working_hypotheses || []} />
      </div>

      {error && (
        <div className="flex items-center gap-3">
          <p className="text-red-600 text-sm">{error}</p>
          {formulation.status !== "closed" && entries.length > 0 && (
            <button
              onClick={retryAnalyze}
              disabled={busy !== null}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-300 text-red-700 text-xs font-medium disabled:opacity-50"
            >
              {busy === "analyze" ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
              Reintentar análisis
            </button>
          )}
        </div>
      )}

      {formulation.status !== "closed" && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={forceReport}
            disabled={busy !== null || entries.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-teal-600 text-teal-700 text-sm font-medium disabled:opacity-50"
          >
            {busy === "force" ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            {formulation.report ? "Regenerar informe" : "Generar informe ahora"}
          </button>
          {formulation.status === "ready" && (
            <button
              onClick={close}
              disabled={busy !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium disabled:opacity-50"
            >
              {busy === "close" ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              Cerrar esta ronda como vigente
            </button>
          )}
        </div>
      )}

      {formulation.status !== "gathering" && (
        <button
          onClick={newRound}
          disabled={busy !== null}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium disabled:opacity-50"
        >
          {busy === "newRound" ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
          Iniciar nueva ronda (tras aplicar la estrategia)
        </button>
      )}

      {formulation.report && <ReportView report={formulation.report} />}
    </div>
  );
}
