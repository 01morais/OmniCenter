import { redirect } from "next/navigation";
import { perfilAtual, supabaseServidor } from "@/lib/supabase-server";
import { Planta } from "@/components/Planta";
import { GraficoHora } from "@/components/GraficoHora";
import type { Ligacao, Local } from "@/lib/tipos";

export const dynamic = "force-dynamic";
type Resumo = {
  indicadores: { volume: number; primeira_resposta_min: number; resolucao_min: number; reabertura_pct: number };
  calor: { local_id: string; qtd: number }[]; por_hora: { hora: number; qtd: number }[];
  padroes: { tipo: string; texto: string; evidencia: string[] }[];
};

export default async function Inteligencia({ searchParams }: { searchParams: { dias?: string } }) {
  const perfil = await perfilAtual();
  if (!perfil) redirect("/painel/login");
  if (perfil.papel === "operador") redirect("/painel");
  const dias = [7, 30].includes(Number(searchParams.dias)) ? Number(searchParams.dias) : 7;
  const sb = supabaseServidor();
  const [{ data: lo }, { data: li }] = await Promise.all([sb.from("locais").select("*"), sb.from("ligacoes").select("*")]);

  // O navegador nunca fala com o Python: o servidor Next valida o perfil e chama o serviço com a chave secreta.
  let r: Resumo | null = null;
  try {
    const res = await fetch(`${process.env.ANALYTICS_URL}/resumo?dias=${dias}`, { headers: { "X-API-Key": process.env.ANALYTICS_API_KEY! }, cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (res.ok) r = await res.json();
  } catch { /* o serviço de análise pode estar fora do ar: a operação não depende dele */ }

  const calor = Object.fromEntries((r?.calor ?? []).map((c) => [c.local_id, c.qtd]));
  const kpi = r ? [["Chamados", r.indicadores.volume], ["Primeira resposta", `${r.indicadores.primeira_resposta_min} min`], ["Resolução", `${r.indicadores.resolucao_min} min`], ["Reabertura", `${r.indicadores.reabertura_pct}%`]] : [];
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Inteligência de dados</h1>
        <nav className="flex gap-2" aria-label="Período">
          {[7, 30].map((d) => <a key={d} href={`?dias=${d}`} className={`btn ${d === dias ? "btn-p" : ""}`}>Últimos {d} dias</a>)}
        </nav>
      </div>
      {!r ? (
        <p role="alert" className="mt-4 rounded-xl border border-sos p-4">O serviço de análise não respondeu. Os chamados continuam funcionando normalmente. Verifique o serviço Python e tente de novo.</p>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">{kpi.map(([k, v]) => <div key={k} className="rounded-xl border border-ink/15 bg-white p-4"><dt className="text-sm text-musgo">{k}</dt><dd className="font-titulo text-3xl font-bold">{v}</dd></div>)}</dl>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-ink/15 bg-white p-4"><h2 className="font-bold">Mapa de calor sobre a planta</h2>
              <Planta locais={(lo ?? []) as Local[]} ligacoes={(li ?? []) as Ligacao[]} calor={calor} />
              <p className="mt-1 text-sm text-musgo">Intensidade = número de chamados por local.</p>
              <h3 className="mt-4 font-bold">Chamados por hora do dia</h3><GraficoHora dados={r.por_hora} /></section>
            <section className="rounded-2xl border border-ink/15 bg-white p-4"><h2 className="font-bold">Padrões identificados</h2>
              {r.padroes.length === 0 && <p className="mt-2 text-musgo">Nenhum padrão ainda. Eles aparecem conforme os chamados se acumulam.</p>}
              {r.padroes.map((p, i) => (
                <div key={i} className="mt-3 rounded-xl bg-giz p-3"><b>{p.tipo}</b><p>{p.texto}</p>
                  <details><summary className="cursor-pointer text-sm underline">Ver evidência ({p.evidencia.length})</summary><p className="mt-1 text-sm text-musgo">{p.evidencia.join(", ")}</p></details></div>
              ))}
              <p className="mt-4 text-sm text-musgo">O sistema apresenta; a decisão é do gestor.</p></section>
          </div>
        </>
      )}
    </div>
  );
}
