import Link from "next/link";
import { carregarPonto } from "@/lib/ponto";
import { BotaoSOS } from "@/components/BotaoSOS";
import { BuscaHome } from "@/components/BuscaHome";

export const dynamic = "force-dynamic";
export default async function Home({ params }: { params: { code: string } }) {
  const p = await carregarPonto(params.code);
  const c = `/p/${p.codigo}`;
  const atalhos = [
    { t: "Reportar problema", h: `${c}/reportar`, i: "🛠️" },
    { t: "Achados e perdidos", h: `${c}/reportar?cat=objeto_perdido`, i: "🎒" },
    { t: "Estacionamento", h: `${c}/chat?q=${encodeURIComponent("onde fica o estacionamento")}`, i: "🅿️" },
    { t: "Lojas e serviços", h: `${c}/chat`, i: "🛍️" },
  ];
  return (
    <main className="mx-auto max-w-md p-5 pb-32">
      <p className="rounded-xl bg-giz px-3 py-2 text-sm">📍 Você está em: <b>{p.nome}</b></p>
      <h1 className="mt-5 text-3xl font-bold">Olá!<br />Como podemos ajudar hoje?</h1>
      <BuscaHome base={c} />
      <nav aria-label="Atalhos" className="mt-4 grid grid-cols-2 gap-3">
        {atalhos.map((a) => (
          <Link key={a.t} href={a.h} className="btn flex-col gap-1 py-5 text-center"><span aria-hidden className="text-2xl">{a.i}</span>{a.t}</Link>
        ))}
      </nav>
      <p className="mt-5"><Link className="underline" href={`${c}/protocolo`}>Meus protocolos</Link></p>
      <BotaoSOS codigo={p.codigo} />
    </main>
  );
}
