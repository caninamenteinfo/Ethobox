"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, PawPrint } from "lucide-react";

export function TopBar({ subtitle }: { subtitle?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <Link href="/cases" className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center">
          <PawPrint size={18} className="text-white" />
        </div>
        <div>
          <p className="font-heading font-semibold text-slate-900 leading-none">Ethobox</p>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </Link>
      <button
        onClick={logout}
        disabled={loading}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 disabled:opacity-50"
      >
        <LogOut size={16} />
        Salir
      </button>
    </header>
  );
}
