"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Loader2 } from "lucide-react";
import type { Case } from "@/types";

export function ArchiveCaseButton({ caseId, status }: { caseId: string; status: Case["status"] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    setLoading(true);
    setError(null);
    const nextStatus = status === "archived" ? "active" : "archived";
    const res = await fetch(`/api/cases/${caseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(data?.error || "No se ha podido actualizar el caso.");
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={toggle}
        disabled={loading}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : status === "archived" ? (
          <ArchiveRestore size={15} />
        ) : (
          <Archive size={15} />
        )}
        {status === "archived" ? "Reactivar caso" : "Archivar caso"}
      </button>
      {error && <p className="text-red-600 text-xs">{error}</p>}
    </div>
  );
}
