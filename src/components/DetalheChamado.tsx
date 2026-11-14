"use client";
import { useEffect, useMemo, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase-browser";
import { SITUACOES, type Chamado, type Ligacao, type Local } from "@/lib/tipos";
import { Planta } from "./Planta";

type Opt = { id: string; nome: string };
export function DetalheChamado({ chamado: c, locais, setores, categorias, onFechar }: { chamado: Chamado; locais: Local[]; setores: Opt[]; categorias: Opt[]; onFechar: () => void }) {
  const sb = useMemo(() => supabaseNavegador(), []);
  const [hist, setHist] = useState<{ id: number; autor: string; acao: string; criado_em: string }[]>([]);
  const [ligs, setLigs] = useState<Ligacao[]>([]), [foto, setFoto] = useState<string | null>(null);
  const [setor, setSetor] = useState(c.setor_id), [resp, setResp] = useState(c.responsavel ?? ""), [obs, setObs] = useState(c.observacoes), [sit, setSit] = useState(c.situacao), [msg, setMsg] = useState("");

  const carregarHist = () => sb.from("historico").select("*").eq("chamado_id", c.id).order("criado_em").then(({ data }) => data && setHist(data));
  useEffect(() => {
    carregarHist(); sb.from("ligacoes").select("*").then(({ data }) => data && setLigs(data));
    if (c.foto_path) fetch(`/api/foto?path=${encodeURIComponent(c.foto_path)}`).then((r) => r.json()).then((j) => setFoto(j.url));
  }, [c.id]);   // eslint-disable-line

  async function salvar() {
    const { error } = await sb.from("chamados").update({ setor_id: setor, responsavel: resp || null, observacoes: obs, situacao: sit }).eq("id", c.id);
    setMsg(error ? "Não foi possível salvar." : "Salvo."); carregarHist();
  }
  const ia = c.sugestao_ia;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="det-t" className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-5">
        <h2 id="det-t" className={`text-xl font-bold ${c.sos ? "text-sos" : ""}`}>{c.sos ? "SOS · " : ""}{c.protocolo}</h2>
        <p className="mt-1">{c.sos ? c.sos_tipo : categorias.find((x) => x.id === c.categoria_id)?.nome} · {locais.find((l) => l.id === c.local_id)?.nome} · <span className="chip">{c.prioridade}</span></p>
        <p className="mt-3">{c.descricao || <span className="text-musgo">Sem descrição</span>}</p>
        {foto && <img src={foto} alt="Foto anexada ao chamado" className="mt-3 max-h-64 rounded-xl" />}
        <p className="mt-3 rounded-xl bg-giz p-3 text-sm">🤖 Sugestão da IA: {ia ? <>categoria <b>{ia.categoria}</b>, prioridade <b>{ia.prioridade}</b> (confiança {Math.round((ia.confianca ?? 0) * 100)}%)</> : "sem sugestão (regras fixas)"}. A decisão final é da equipe.</p>
        <div className="mt-3"><Planta locais={locais} ligacoes={ligs} aqui={c.local_id} /></div>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <div><label className="rotulo" htmlFor="d-st">Status</label><select id="d-st" className="campo" value={sit} onChange={(e) => setSit(e.target.value as any)}>{SITUACOES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><label className="rotulo" htmlFor="d-se">Setor</label><select id="d-se" className="campo" value={setor} onChange={(e) => setSetor(e.target.value)}>{setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}</select></div>
          <div><label className="rotulo" htmlFor="d-re">Responsável</label><input id="d-re" className="campo" value={resp} onChange={(e) => setResp(e.target.value)} /></div>
        </div>
        <label className="rotulo" htmlFor="d-ob">Providências e observações internas</label>
        <textarea id="d-ob" rows={3} className="campo" value={obs} onChange={(e) => setObs(e.target.value)} />
        <div className="mt-3 flex items-center gap-2"><button className="btn btn-p" onClick={salvar}>Salvar alterações</button><button className="btn" onClick={onFechar}>Fechar</button><span role="status" className="text-sm">{msg}</span></div>
        <h3 className="mt-5 font-bold">Histórico</h3>
        <ul className="mt-1 space-y-1 text-sm">{hist.map((h) => <li key={h.id}><span className="text-musgo">{new Date(h.criado_em).toLocaleString("pt-BR")}</span> · {h.autor} · {h.acao}</li>)}</ul>
      </div>
    </div>
  );
}
