import Link from "next/link";
import { carregarPonto } from "@/lib/ponto";
import { supabaseAdmin } from "@/lib/supabase-server";
import { FormOcorrencia } from "@/components/FormOcorrencia";
import { BotaoSOS } from "@/components/BotaoSOS";

export const dynamic = "force-dynamic";
export default async function Pagina({ params, searchParams }: { params: { code: string }; searchParams: { cat?: string; desc?: string } }) {
  const p = await carregarPonto(params.code);
  const { data: cats } = await supabaseAdmin().from("categorias").select("id, nome").order("nome");
  return (
    <main className="mx-auto max-w-md p-5 pb-32">
      <Link href={`/p/${p.codigo}`} className="underline">← Início</Link>
      <h1 className="mt-2 text-2xl font-bold">Reportar problema</h1>
      <FormOcorrencia codigo={p.codigo} local={p.nome} categorias={cats ?? []} catInicial={searchParams.cat} descInicial={searchParams.desc} />
      <BotaoSOS codigo={p.codigo} />
    </main>
  );
}
