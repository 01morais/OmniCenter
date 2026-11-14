import { NextResponse } from "next/server";
import { perfilAtual, supabaseAdmin, supabaseServidor } from "@/lib/supabase-server";

/** Link temporário (60 s) para a foto de um chamado. Só equipe com acesso ao chamado (a RLS decide). */
export async function GET(req: Request) {
  if (!(await perfilAtual())) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  const path = new URL(req.url).searchParams.get("path");
  if (!path || !/^[\w-]+\.(jpg|png)$/.test(path)) return NextResponse.json({ erro: "Inválido." }, { status: 400 });
  const { data: c } = await supabaseServidor().from("chamados").select("id").eq("foto_path", path).maybeSingle();
  if (!c) return NextResponse.json({ erro: "Não autorizado." }, { status: 403 });
  const { data } = await supabaseAdmin().storage.from("fotos").createSignedUrl(path, 60);
  return NextResponse.json({ url: data?.signedUrl ?? null });
}
