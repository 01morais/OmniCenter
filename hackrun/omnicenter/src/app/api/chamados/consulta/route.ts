import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-server";
import { hashPin } from "@/lib/pin";

const tentativas = new Map<string, { n: number; ate: number }>();   // limitador simples (por instância)
const Corpo = z.object({ protocolo: z.string().max(20), pin: z.string().regex(/^\d{4}$/) });

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "anon";
  const t = tentativas.get(ip);
  if (t && t.ate > Date.now() && t.n >= 8) return NextResponse.json({ erro: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });
  tentativas.set(ip, { n: (t && t.ate > Date.now() ? t.n : 0) + 1, ate: t && t.ate > Date.now() ? t.ate : Date.now() + 60_000 });

  const p = Corpo.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ erro: "Protocolo ou código inválido." }, { status: 400 });
  const { data } = await supabaseAdmin().from("chamados")
    .select("protocolo, situacao, sos, categoria_id, criado_em, primeira_resposta_em, resolvido_em, pin_hash")
    .eq("protocolo", p.data.protocolo.trim().toUpperCase()).single();
  if (!data || data.pin_hash !== hashPin(p.data.pin)) return NextResponse.json({ erro: "Protocolo ou código inválido." }, { status: 404 });
  const { pin_hash: _omitido, ...publico } = data;
  return NextResponse.json(publico);   // nunca devolve descrição, foto ou observações internas
}
