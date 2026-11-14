import Link from "next/link";
import { perfilAtual } from "@/lib/supabase-server";
import { SairBotao } from "@/components/SairBotao";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const p = await perfilAtual();
  if (!p) return <>{children}</>;
  return (
    <div className="min-h-screen">
      <header className="flex flex-wrap items-center gap-2 bg-ink px-4 py-3 text-white">
        <b className="mr-4 font-titulo text-lg">OmniCenter</b>
        <nav className="flex flex-wrap gap-1" aria-label="Painel">
          <Link className="rounded-lg px-3 py-2 hover:bg-white/10" href="/painel">Chamados</Link>
          {p.papel !== "operador" && <Link className="rounded-lg px-3 py-2 hover:bg-white/10" href="/painel/inteligencia">Inteligência de dados</Link>}
          {p.papel === "admin" && <Link className="rounded-lg px-3 py-2 hover:bg-white/10" href="/painel/cadastros">Cadastros</Link>}
        </nav>
        <span className="ml-auto text-sm text-white/80">{p.email} · {p.papel}</span><SairBotao />
      </header>
      <div className="mx-auto max-w-[1300px] p-4">{children}</div>
    </div>
  );
}
