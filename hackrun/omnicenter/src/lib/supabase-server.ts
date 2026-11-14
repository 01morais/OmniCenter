import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Perfil } from "./tipos";

/** Cliente com a sessão da equipe (respeita a RLS). */
export function supabaseServidor() {
  const c = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => c.getAll(),
      setAll: (l) => { try { l.forEach(({ name, value, options }) => c.set(name, value, options)); } catch {} },
    },
  });
}
/** Cliente com chave de serviço: ignora a RLS. Use só em rotas de servidor, depois de validar a entrada. */
export const supabaseAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

export async function perfilAtual(): Promise<Perfil | null> {
  const sb = supabaseServidor();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("perfis").select("*").eq("id", user.id).single();
  return (data as Perfil) ?? null;
}
