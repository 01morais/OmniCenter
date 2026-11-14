import "server-only";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "./supabase-server";
import type { Ligacao, Local } from "./tipos";

/** Valida o código do QR e devolve o ponto, o nome do local e a planta. */
export async function carregarPonto(codigo: string) {
  const db = supabaseAdmin();
  const { data: ponto } = await db.from("pontos_qr").select("codigo, local_id, locais(nome)").eq("codigo", codigo).eq("ativo", true).single();
  if (!ponto) notFound();
  const [{ data: L }, { data: E }] = await Promise.all([db.from("locais").select("*"), db.from("ligacoes").select("*")]);
  return { codigo: ponto.codigo as string, localId: ponto.local_id as string, nome: (ponto as any).locais?.nome as string,
    locais: (L ?? []) as Local[], ligacoes: (E ?? []) as Ligacao[] };
}
