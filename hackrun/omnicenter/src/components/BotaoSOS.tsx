"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const TIPOS = ["Emergência médica", "Criança perdida", "Segurança"];

export function BotaoSOS({ codigo }: { codigo: string }) {
  const [aberto, setAberto] = useState(false), [env, setEnv] = useState(false), [erro, setErro] = useState("");
  const r = useRouter();
  async function enviar(tipo: string) {
    setEnv(true); setErro("");
    const res = await fetch("/api/sos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo, ponto_qr: codigo }) });
    const j = await res.json(); setEnv(false);
    if (!res.ok) return setErro(j.erro);
    r.push(`/p/${codigo}/protocolo?p=${j.protocolo}&k=${j.pin}&sos=1`);
  }
  return (
    <>
      <button onClick={() => setAberto(true)} aria-label="SOS: pedir ajuda urgente"
        className="btn btn-sos fixed bottom-5 right-5 z-30 h-[72px] w-[72px] rounded-full text-lg shadow-lg" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>SOS</button>
      {aberto && (
        <div role="dialog" aria-modal="true" aria-labelledby="sos-t" className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <h2 id="sos-t" className="text-xl font-bold">Precisa de ajuda urgente?</h2>
            <p className="mt-1 text-musgo">Escolha o tipo de ocorrência.</p>
            <div className="mt-3 grid gap-2">{TIPOS.map((t) => <button key={t} disabled={env} onClick={() => enviar(t)} className="btn btn-sos">{t}</button>)}</div>
            <p className="mt-3 text-sm">A equipe do shopping vai até o local deste QR Code.<br /><b>Risco de vida? Ligue 192 ou 193.</b></p>
            {erro && <p role="alert" className="mt-2 font-semibold text-sos">{erro}</p>}
            <button onClick={() => setAberto(false)} className="btn mt-3 w-full">Cancelar</button>
          </div>
        </div>
      )}
    </>
  );
}
