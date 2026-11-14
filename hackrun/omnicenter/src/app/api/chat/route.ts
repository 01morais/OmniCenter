import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-server";
import { perguntarIA } from "@/lib/ia";
import { calcularRota, mapsUrl, semAcento } from "@/lib/rotas";
import type { Ligacao, Local } from "@/lib/tipos";

const Corpo = z.object({ mensagem: z.string().min(1).max(300), ponto_qr: z.string().max(40), acessivel: z.boolean().optional() });
type Intencao = { destino?: string | null; acessivel?: boolean };

export async function POST(req: Request) {
  const p = Corpo.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ erro: "Mensagem inválida." }, { status: 400 });
  const db = supabaseAdmin();
  const [{ data: ponto }, { data: L }, { data: E }] = await Promise.all([
    db.from("pontos_qr").select("local_id").eq("codigo", p.data.ponto_qr).single(),
    db.from("locais").select("*").eq("publico", true), db.from("ligacoes").select("*"),
  ]);
  const locais = (L ?? []) as Local[], ligacoes = (E ?? []) as Ligacao[];
  const msg = semAcento(p.data.mensagem);

  // 1) a IA só identifica o destino; se não houver IA, casamos pelo nome do local
  const ia = await perguntarIA<Intencao>(
    `Identifique o destino pedido pelo visitante. Locais: ${locais.map((l) => `${l.id}=${l.nome}`).join("; ")}. Responda JSON {"destino": id|null, "acessivel": boolean}.`,
    p.data.mensagem);
  const destino = (ia?.destino && locais.find((l) => l.id === ia.destino)) ||
    locais.find((l) => l.tipo !== "corredor" && msg.includes(semAcento(l.nome).replace(/ \(.*\)/, ""))) ||
    locais.find((l) => /banheiro|toalete|wc/.test(msg) && l.tipo === "banheiro") ||
    locais.find((l) => /comer|comida|lanche|restaurante|alimenta/.test(msg) && l.tipo === "alimentacao") ||
    locais.find((l) => /estacion|carro/.test(msg) && l.tipo === "estacionamento") || null;
  const acessivel = p.data.acessivel ?? ia?.acessivel ?? /acess|cadeira|rampa|elevador/.test(msg);

  const caminho = destino && ponto ? calcularRota(locais, ligacoes, ponto.local_id, destino.id, acessivel) : null;
  if (!destino || !caminho) {
    await db.from("perguntas_chat").insert({ ponto_qr: p.data.ponto_qr, pergunta: p.data.mensagem, respondida: false });
    return NextResponse.json({ texto: destino ? "Não encontrei um caminho para esse destino." : "Não tenho certeza de como responder isso. Posso abrir um chamado para a equipe.", respondida: false });
  }
  // 2) a rota vem do servidor; a IA apenas a descreve com referências do shopping
  const nomes = caminho.map((l) => l.nome);
  const desc = await perguntarIA<{ texto: string }>(
    `Descreva em até 2 frases, em português, este trajeto já calculado. Não invente locais. Responda JSON {"texto": string}.`,
    `Caminho: ${nomes.join(" → ")}${acessivel ? " (rota acessível)" : ""}`);
  const texto = desc?.texto ||
    `Siga de ${nomes[0]} até ${nomes[nomes.length - 1]}${nomes.length > 2 ? ", passando por " + nomes.slice(1, -1).join(", ") : ""}.${acessivel ? " Esta é a rota acessível." : ""}`;
  await db.from("perguntas_chat").insert({ ponto_qr: p.data.ponto_qr, pergunta: p.data.mensagem, respondida: true });
  return NextResponse.json({ texto, caminho, acessivel, destino: destino.nome, maps: mapsUrl(destino.nome), respondida: true });
}
