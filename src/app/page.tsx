import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export default async function Inicio() {
  const { data } = await supabaseAdmin().from("pontos_qr").select("codigo, locais(nome)").eq("ativo", true);
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-3xl font-bold">OmniCenter</h1>
      <p className="mt-2 text-musgo">Atendimento do Capim Dourado Shopping por QR Code. Em produção, cada visitante chega por um QR Code impresso no shopping. Para testar, escolha um ponto:</p>
      <ul className="mt-4 grid gap-2">
        {(data ?? []).map((p: any) => <li key={p.codigo}><Link className="btn w-full justify-start" href={`/p/${p.codigo}`}>{p.codigo} · {p.locais?.nome}</Link></li>)}
      </ul>
      <p className="mt-6"><Link className="underline" href="/painel">Entrar no painel da equipe</Link></p>
    </main>
  );
}
