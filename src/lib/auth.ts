import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Devuelve el usuario de Supabase Auth actual si tiene rol "professional",
 * o null. El tutor/familia nunca tiene cuenta: solo existe este rol.
 */
export async function getProfessionalUser() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = supabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "professional") return null;

  return user;
}
