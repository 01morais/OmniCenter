"use client";
import { useEffect, useState } from "react";

type Resp = { protocolo: string; situacao: string; sos: boolean; criado_em: string };
const PASSOS = [["Novo", "Recebido"], ["Em atendimento", "Em atendimento"], ["Resolvido", "Resolvido"]];

export function Protocolo({ inicialP, inicialK, sos }: { inicialP?: string; inicialK?: string; sos: boolean }) {
  const [p, setP] = useState(inicialP ?? ""), [k, setK] = useState(inicialK ?? ""), [r, setR] = useState<Resp | null>(null), [erro, setErro] = useState("");
  async function consultar() {
    setErro(""); setR(null);
    const res = await fetch("/api/chamados/consulta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ protocolo: p, pin: k }) });
    const j = await res.json(); res.ok ? setR(j) : setErro(j.erro);
  }
  useEffect(() => { if (inicialP && inicialK) consultar(); }, []);   // eslint-disable-line
  const i = r ? PASSOS.findIndex(([s]) => s === r.situacao) : -1;
  return (
    <div>
      {inicialP && inicialK && (
        <div className="mt-4 rounded-2xl border border-ink/15 bg-white p-5 text-center">
          <p className="text-3xl" aria-hidden>✅</p>
          <h1 className="text-xl font-bold">{sos ? "Equipe acionada" : "Recebemos sua solicitação"}</h1>
          <p className="mt-2 text-sm text-musgo">Protocolo</p><p className="font-titulo text-2xl font-bold">{inicialP}</p>
          <p className="mt-1">Código de validação: <b>{inicialK}</b></p>
          <p className="mt-2 text-sm text-musgo">Guarde os dois para acompanhar o chamado.</p>
          {sos && <p className="mt-3 rounded-lg bg-sos/10 p-2 font-semibold text-sos">Risco de vida? Ligue 192 ou 193 agora.</p>}
        </div>
      )}
      <h2 className="mt-6 text-lg font-bold">Acompanhar chamado</h2>
      <label htmlFor="p" className="rotulo">Protocolo</label>
      <input id="p" className="campo" placeholder="OC-2026-0001" value={p} onChange={(e) => setP(e.target.value)} />
      <label htmlFor="k" className="rotulo">Código de validação (4 dígitos)</label>
      <input id="k" className="campo" inputMode="numeric" maxLength={4} value={k} onChange={(e) => setK(e.target.value)} />
      <button className="btn btn-p mt-4 w-full" onClick={consultar}>Consultar</button>
      {erro && <p role="alert" className="mt-3 font-semibold text-sos">{erro}</p>}
      {r && (
        <ol className="mt-4 space-y-2 rounded-xl border border-ink/15 bg-white p-4">
          {PASSOS.map(([, rot], n) => <li key={rot} className={n <= i ? "font-bold" : "text-musgo"}>{n <= i ? "●" : "○"} {rot}</li>)}
        </ol>
      )}
    </div>
  );
}
