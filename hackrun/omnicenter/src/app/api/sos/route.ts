import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-server";
import { roteSOS } from "@/lib/triagem";
import { hashPin, novoPin } from "@/lib/pin";

const Corpo = z.object({ tipo: z.enum(["Emergência médica", "Criança perdida", "Segurança"]), ponto_qr: z.string().max(40) });

export async function POST(req: Request) {
  const p = Corpo.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  const db = supabaseAdmin();
  const { data: ponto } = await db.from("pontos_qr").select("codigo, local_id").eq("codigo", p.data.ponto_qr).single();
  if (!ponto) return NextResponse.json({ erro: "Ponto desconhecido." }, { status: 404 });
  const r = roteSOS(p.data.tipo), pin = novoPin();
  const { data, error } = await db.from("chamados").insert({
    pin_hash: hashPin(pin), categoria_id: "seguranca", descricao: p.data.tipo, ponto_qr: ponto.codigo, local_id: ponto.local_id,
    prioridade: r.prioridade, setor_id: r.setor, sos: true, sos_tipo: p.data.tipo,
  }).select("protocolo").single();
  if (error || !data) return NextResponse.json({ erro: "Falha ao acionar. Se houver risco de vida, ligue 192 ou 193." }, { status: 500 });
  return NextResponse.json({ protocolo: data.protocolo, pin });
}
