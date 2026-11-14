"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase-browser";
import { SITUACOES, type Chamado, type Local, type Situacao } from "@/lib/tipos";
import { DetalheChamado } from "./DetalheChamado";

type Opt = { id: string; nome: string };
const hora = (d: string) => new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export function Kanban({ inicial, locais, setores, categorias, setorPadrao }: {
  inicial: Chamado[]; locais: Local[]; setores: Opt[]; categorias: Opt[]; setorPadrao: string | null;
}) {
  const sb = useMemo(() => supabaseNavegador(), []);
  const [lista, setLista] = useState(inicial), [aberto, setAberto] = useState<Chamado | null>(null);
  const [f, setF] = useState({ setor: setorPadrao ?? "", cat: "", prio: "", dias: "", q: "" });
  const local = (id: string) => locais.find((l) => l.id === id)?.nome ?? id;

  const recarregar = useCallback(async () => {
    const { data } = await sb.from("chamados").select("*").order("criado_em", { ascending: false }).limit(300);
    if (data) setLista(data as Chamado[]);
  }, [sb]);
  // Tempo real: qualquer insert/update visível para o perfil (RLS) atualiza o quadro.
  useEffect(() => {
    const ch = sb.channel("kanban").on("postgres_changes", { event: "*", schema: "public", table: "chamados" }, () => recarregar()).subscribe();
    return () => { sb.removeChannel(ch); };
  }, [sb, recarregar]);

  async function mover(id: number, situacao: Situacao) {
    setLista((l) => l.map((c) => (c.id === id ? { ...c, situacao } : c)));      // otimista; o gatilho do banco grava o histórico
    const { error } = await sb.from("chamados").update({ situacao }).eq("id", id);
    if (error) recarregar();
  }
  const vis = lista.filter((c) =>
    (!f.setor || c.setor_id === f.setor) && (!f.cat || c.categoria_id === f.cat) && (!f.prio || c.prioridade === f.prio) &&
    (!f.dias || Date.now() - new Date(c.criado_em).getTime() < Number(f.dias) * 864e5) &&
    (!f.q || c.protocolo.includes(f.q.toUpperCase())));
  const sel = (k: keyof typeof f, rot: string, ops: Opt[]) => (
    <select aria-label={rot} className="campo" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })}>
      <option value="">{rot}</option>{ops.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
    </select>);

  return (
    <div>
      <h1 className="text-2xl font-bold">Chamados</h1>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
        {sel("setor", "Setor", setores)}{sel("cat", "Categoria", categorias)}
        {sel("prio", "Prioridade", ["Normal", "Alta", "Máxima"].map((p) => ({ id: p, nome: p })))}
        {sel("dias", "Período", [{ id: "1", nome: "Últimas 24 h" }, { id: "7", nome: "Últimos 7 dias" }])}
        <input aria-label="Buscar protocolo" className="campo" placeholder="Buscar protocolo…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {SITUACOES.map((s) => {
          const col = vis.filter((c) => c.situacao === s).sort((a, b) => Number(b.sos) - Number(a.sos) || +new Date(b.criado_em) - +new Date(a.criado_em));
          return (
            <section key={s} aria-label={s} className="min-h-[260px] rounded-2xl bg-giz p-2"
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const id = Number(e.dataTransfer.getData("id")); if (id) mover(id, s); }}>
              <h2 className="px-2 py-1 font-bold">{s} ({col.length})</h2>
              {col.slice(0, 50).map((c) => (
                <article key={c.id} draggable onDragStart={(e) => e.dataTransfer.setData("id", String(c.id))} tabIndex={0}
                  onClick={() => setAberto(c)} onKeyDown={(e) => e.key === "Enter" && setAberto(c)}
                  className={`mt-2 cursor-pointer rounded-xl bg-white p-3 ${c.sos ? "border-2 border-sos" : "border border-ink/15"}`}>
                  <div className="flex justify-between"><b className={c.sos ? "text-sos" : ""}>{c.sos ? "SOS " : ""}{c.protocolo}</b><span className="text-xs text-musgo">{hora(c.criado_em)}</span></div>
                  <p>{c.sos ? c.sos_tipo : categorias.find((x) => x.id === c.categoria_id)?.nome} · {local(c.local_id)}</p>
                  <p className="mt-1 flex flex-wrap gap-1">
                    <span className={`chip ${c.prioridade !== "Normal" ? "border-sos text-sos" : ""}`}>{c.prioridade}</span>
                    <span className="chip">{setores.find((x) => x.id === c.setor_id)?.nome}</span>
                    {c.baixa_confianca && <span className="chip">triagem manual</span>}
                  </p>
                  <div className="mt-2 flex gap-1 md:hidden">{SITUACOES.filter((x) => x !== s).map((x) => <button key={x} className="btn !min-h-[36px] flex-1 text-xs" onClick={(e) => { e.stopPropagation(); mover(c.id, x); }}>→ {x}</button>)}</div>
                </article>
              ))}
            </section>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-musgo">Os cartões chegam em tempo real. Arraste para mudar o status.</p>
      {aberto && <DetalheChamado chamado={lista.find((c) => c.id === aberto.id) ?? aberto} locais={locais} setores={setores} categorias={categorias} onFechar={() => { setAberto(null); recarregar(); }} />}
    </div>
  );
}
