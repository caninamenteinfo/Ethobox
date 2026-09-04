"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PawPrint } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password || loading) return;
    setLoading(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signInError) {
      setError("Credenciales incorrectas.");
      return;
    }
    router.push("/cases");
    router.refresh();
  };

  return (
    <div className="flex flex-1 min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl border-2 border-teal-100 p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-teal-600 flex items-center justify-center mb-4">
            <PawPrint size={30} className="text-white" />
          </div>
          <p className="font-semibold text-sm tracking-wide text-teal-700 mb-1">ETHOBOX</p>
          <h1 className="text-2xl text-black font-semibold font-heading">Acceso profesional</h1>
        </div>

        <div className="space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-black outline-none focus:border-teal-600"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Contraseña"
            type="password"
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-black outline-none focus:border-teal-600"
          />
        </div>

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

        <button
          onClick={submit}
          disabled={loading || !email.trim() || !password}
          className="w-full mt-5 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-medium disabled:opacity-50 bg-teal-600"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </div>
    </div>
  );
}
