import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-server";
import { triar } from "@/lib/triagem";
import { hashPin, novoPin } from "@/lib/pin";

const Corpo = z.object({
  categoria: z.string().min(1).max(40), descricao: z.string().max(1000).default(""), ponto_qr: z.string().min(1).max(40),
});
const TIPOS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png" };

export async function POST(req: Request) {
  const fd = await req.formData();
  const p = Corpo.safeParse({ categoria: fd.get("categoria"), descricao: fd.get("descricao") ?? "", ponto_qr: fd.get("ponto_qr") });
  if (!p.success) return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });

  const foto = fd.get("foto");
  if (foto instanceof File && foto.size > 0 && (!TIPOS[foto.type] || foto.size > 2_000_000))
    return NextResponse.json({ erro: "Use foto JPG ou PNG de até 2 MB." }, { status: 400 });

  const db = supabaseAdmin();
  const { data: ponto } = await db.from("pontos_qr").select("codigo, local_id").eq("codigo", p.data.ponto_qr).eq("ativo", true).single();
  if (!ponto) return NextResponse.json({ erro: "Ponto de QR Code desconhecido." }, { status: 404 });
  const { data: cats } = await db.from("categorias").select("id, setor_id, prioridade_padrao");
  const t = await triar(p.data.categoria, p.data.descricao, cats ?? []);

  let foto_path: string | null = null;
  if (foto instanceof File && foto.size > 0) {
    foto_path = `${randomUUID()}.${TIPOS[foto.type]}`;
    const up = await db.storage.from("fotos").upload(foto_path, await foto.arrayBuffer(), { contentType: foto.type });
    if (up.error) foto_path = null;
  }
  const pin = novoPin();
  const { data, error } = await db.from("chamados").insert({
    pin_hash: hashPin(pin), categoria_id: t.categoria, descricao: p.data.descricao, foto_path,
    ponto_qr: ponto.codigo, local_id: ponto.local_id, prioridade: t.prioridade, setor_id: t.setor,
    baixa_confianca: t.baixa, sugestao_ia: t.sugestao,
  }).select("protocolo").single();
  if (error || !data) return NextResponse.json({ erro: "Não foi possível registrar. Tente novamente." }, { status: 500 });
  return NextResponse.json({ protocolo: data.protocolo, pin });
}
