"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

export function NewCaseForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dogName, setDogName] = useState("");
  const [tutorName, setTutorName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!dogName.trim() || loading) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dogName, tutorName, notes }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(data?.error || "No se ha podido crear el caso.");
      return;
    }
    router.push(`/cases/${data.case.id}/rounds/${data.formulation.id}`);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white font-medium text-sm"
      >
        <Plus size={16} />
        Nuevo caso
      </button>
    );
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-5">
      <h2 className="font-heading font-semibold text-slate-900 mb-3">Nuevo caso</h2>
      <div className="space-y-2.5">
        <input
          value={dogName}
          onChange={(e) => setDogName(e.target.value)}
          placeholder="Nombre del perro"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-600"
        />
        <input
          value={tutorName}
          onChange={(e) => setTutorName(e.target.value)}
          placeholder="Nombre del tutor/familia"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-600"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas rápidas (opcional)"
          rows={2}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-600"
        />
      </div>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      <div className="flex gap-2 mt-4">
        <button
          onClick={submit}
          disabled={loading || !dogName.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium disabled:opacity-50"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Crear caso
        </button>
        <button
          onClick={() => setOpen(false)}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm text-slate-500"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
