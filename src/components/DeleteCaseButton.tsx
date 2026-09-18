"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

export function DeleteCaseButton({ caseId, dogName }: { caseId: string; dogName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doDelete = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/cases/${caseId}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(data?.error || "No se ha podido borrar el caso.");
      return;
    }
    router.push("/cases");
    router.refresh();
  };

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800"
      >
        <Trash2 size={15} />
        Borrar caso
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-700">
          ¿Borrar el caso de <strong>{dogName}</strong> y todo su historial? No se puede deshacer.
        </span>
        <button
          onClick={doDelete}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium disabled:opacity-50"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Sí, borrar
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs text-slate-500"
        >
          Cancelar
        </button>
      </div>
      {error && <p className="text-red-600 text-xs">{error}</p>}
    </div>
  );
}
