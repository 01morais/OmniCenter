import Link from "next/link";
import { carregarPonto } from "@/lib/ponto";
import { Protocolo } from "@/components/Protocolo";
import { BotaoSOS } from "@/components/BotaoSOS";

export const dynamic = "force-dynamic";
export default async function Pagina({ params, searchParams }: { params: { code: string }; searchParams: { p?: string; k?: string; sos?: string } }) {
  const p = await carregarPonto(params.code);
  return (
    <main className="mx-auto max-w-md p-5 pb-32">
      <Link href={`/p/${p.codigo}`} className="underline">← Início</Link>
      <Protocolo inicialP={searchParams.p} inicialK={searchParams.k} sos={!!searchParams.sos} />
      <BotaoSOS codigo={p.codigo} />
    </main>
  );
}
