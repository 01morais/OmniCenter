import Link from "next/link";
import { carregarPonto } from "@/lib/ponto";
import { Chat } from "@/components/Chat";
import { BotaoSOS } from "@/components/BotaoSOS";

export const dynamic = "force-dynamic";
export default async function Pagina({ params, searchParams }: { params: { code: string }; searchParams: { q?: string } }) {
  const p = await carregarPonto(params.code);
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col p-5 pb-32">
      <Link href={`/p/${p.codigo}`} className="underline">← Início</Link>
      <h1 className="mt-2 text-2xl font-bold">Assistente</h1>
      <p className="text-sm text-musgo">📍 Você está em: {p.nome}</p>
      <Chat codigo={p.codigo} locais={p.locais} ligacoes={p.ligacoes} aqui={p.localId} inicial={searchParams.q} />
      <BotaoSOS codigo={p.codigo} />
    </main>
  );
}
