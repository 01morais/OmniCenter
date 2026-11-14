"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function FormOcorrencia({ codigo, local, categorias, catInicial, descInicial }: {
  codigo: string; local: string; categorias: { id: string; nome: string }[]; catInicial?: string; descInicial?: string;
}) {
  const [passo, setPasso] = useState(catInicial ? 2 : 1);
  const [cat, setCat] = useState(catInicial ?? ""), [desc, setDesc] = useState(descInicial ?? "");
  const [foto, setFoto] = useState<File | null>(null), [erro, setErro] = useState(""), [env, setEnv] = useState(false);
  const r = useRouter();
  const nome = categorias.find((c) => c.id === cat)?.nome ?? "";

  function escolherFoto(f: File | undefined) {
    setErro("");
    if (!f) return setFoto(null);
    if (!["image/jpeg", "image/png"].includes(f.type) || f.size > 2_000_000) { setErro("Use uma foto JPG ou PNG de até 2 MB."); return setFoto(null); }
    setFoto(f);
  }
  async function enviar() {
    setEnv(true); setErro("");
    const fd = new FormData();
    fd.set("categoria", cat); fd.set("descricao", desc); fd.set("ponto_qr", codigo); if (foto) fd.set("foto", foto);
    try {
      const res = await fetch("/api/chamados", { method: "POST", body: fd }), j = await res.json();
      if (!res.ok) throw new Error(j.erro);
      r.push(`/p/${codigo}/protocolo?p=${j.protocolo}&k=${j.pin}`);
    } catch (e: any) { setErro(e.message || "Sem conexão. Tente de novo."); setEnv(false); }
  }

  return (
    <div>
      <ol className="mt-3 flex gap-2" aria-label="Passos">
        {[1, 2, 3].map((n) => <li key={n} aria-current={passo === n ? "step" : undefined} className={`grid h-8 w-8 place-items-center rounded-full border ${passo >= n ? "border-ink bg-ink text-white" : "border-ink/25"}`}>{n}</li>)}
      </ol>
      {passo === 1 && (
        <>
          <h2 className="mt-4 text-lg font-bold">Qual é o problema?</h2>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Categoria">
            {categorias.map((c) => <button key={c.id} role="radio" aria-checked={cat === c.id} onClick={() => setCat(c.id)} className={`btn ${cat === c.id ? "btn-p" : ""}`}>{c.nome}</button>)}
          </div>
          <button className="btn btn-p mt-5 w-full" disabled={!cat} onClick={() => setPasso(2)}>Continuar</button>
        </>
      )}
      {passo === 2 && (
        <>
          <label htmlFor="desc" className="rotulo">Descreva (opcional)</label>
          <textarea id="desc" rows={4} maxLength={1000} className="campo" placeholder="Ex.: banheiro sem papel" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <label htmlFor="foto" className="rotulo">Foto (opcional · JPG ou PNG até 2 MB)</label>
          <input id="foto" type="file" accept="image/jpeg,image/png" capture="environment" className="campo" onChange={(e) => escolherFoto(e.target.files?.[0])} />
          <p className="mt-3 text-sm text-musgo">📍 Local: {local} ({codigo})</p>
          {erro && <p role="alert" className="mt-2 font-semibold text-sos">{erro}</p>}
          <div className="mt-4 flex gap-2"><button className="btn" onClick={() => setPasso(1)}>Voltar</button><button className="btn btn-p flex-1" onClick={() => setPasso(3)}>Continuar</button></div>
        </>
      )}
      {passo === 3 && (
        <>
          <h2 className="mt-4 text-lg font-bold">Revise e envie</h2>
          <div className="mt-2 rounded-xl border border-ink/15 bg-white p-3">
            <p className="font-semibold">{nome}</p><p>{desc || <span className="text-musgo">Sem descrição</span>}</p>
            <p className="mt-1 text-sm text-musgo">📍 {local}{foto ? " · 📷 foto anexada" : ""}</p>
          </div>
          {erro && <p role="alert" className="mt-2 font-semibold text-sos">{erro}</p>}
          <div className="mt-4 flex gap-2"><button className="btn" onClick={() => setPasso(2)}>Voltar</button><button className="btn btn-p flex-1" disabled={env} onClick={enviar}>{env ? "Enviando…" : "Enviar chamado"}</button></div>
        </>
      )}
    </div>
  );
}
