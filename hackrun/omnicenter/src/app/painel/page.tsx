import { redirect } from "next/navigation";
import { perfilAtual, supabaseServidor } from "@/lib/supabase-server";
import { Kanban } from "@/components/Kanban";
import type { Chamado, Local } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export default async function Painel() {
  const perfil = await perfilAtual();
  if (!perfil) redirect("/painel/login");
  const sb = supabaseServidor();
  const [{ data: ch }, { data: lo }, { data: se }, { data: ca }] = await Promise.all([
    sb.from("chamados").select("*").order("criado_em", { ascending: false }).limit(300),
    sb.from("locais").select("*"), sb.from("setores").select("*"), sb.from("categorias").select("id, nome"),
  ]);
  return <Kanban inicial={(ch ?? []) as Chamado[]} locais={(lo ?? []) as Local[]} setores={se ?? []} categorias={ca ?? []} setorPadrao={perfil.papel === "operador" ? perfil.setor_id : null} />;
}
