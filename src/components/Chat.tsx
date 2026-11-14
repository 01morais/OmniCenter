"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Planta } from "./Planta";
import type { Ligacao, Local } from "@/lib/tipos";

type Msg = { eu?: boolean; texto: string; caminho?: Local[]; maps?: string; acessivel?: boolean; semResposta?: boolean; pergunta?: string };

export function Chat({ codigo, locais, ligacoes, aqui, inicial }: { codigo: string; locais: Local[]; ligacoes: Ligacao[]; aqui: string; inicial?: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([{ texto: "Pergunte onde fica uma loja, o banheiro ou o estacionamento. Eu mostro o caminho na planta." }]);
  const [txt, setTxt] = useState(""), [espera, setEspera] = useState(false), fim = useRef<HTMLDivElement>(null), usou = useRef(false);

  async function enviar(mensagem: string, acessivel?: boolean) {
    if (!mensagem.trim()) return;
    setMsgs((m) => [...m, { eu: true, texto: mensagem }]); setTxt(""); setEspera(true);
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mensagem, ponto_qr: codigo, acessivel }) });
      const j = await r.json();
      setMsgs((m) => [...m, r.ok ? { texto: j.texto, caminho: j.caminho, maps: j.maps, acessivel: j.acessivel, semResposta: !j.respondida, pergunta: mensagem }
        : { texto: j.erro ?? "Algo deu errado.", semResposta: true }]);
    } catch { setMsgs((m) => [...m, { texto: "Sem conexão. Tente de novo ou abra um chamado.", semResposta: true }]); }
    setEspera(false);
  }
  useEffect(() => { if (inicial && !usou.current) { usou.current = true; enviar(inicial); } }, [inicial]);   // eslint-disable-line
  useEffect(() => fim.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);

  return (
    <div className="mt-3 flex flex-1 flex-col">
      <div className="flex-1 space-y-3" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={m.eu ? "ml-auto max-w-[85%] rounded-2xl bg-ink px-3 py-2 text-white" : "max-w-[92%] rounded-2xl border border-ink/15 bg-white px-3 py-2"}>
            <p>{m.texto}</p>
            {m.caminho && (
              <div className="mt-2">
                <Planta locais={locais} ligacoes={ligacoes} caminho={m.caminho} aqui={aqui} />
                <div className="mt-2 flex gap-2">
                  {!m.acessivel && <button className="btn flex-1 text-sm" onClick={() => enviar(msgs[i - 1].texto, true)}>♿ Rota acessível</button>}
                  <a className="btn flex-1 text-sm" target="_blank" rel="noopener" href={m.maps}>Abrir no Google Maps</a>
                </div>
              </div>
            )}
            {m.semResposta && <Link className="mt-2 inline-block font-semibold underline" href={`/p/${codigo}/reportar${m.pergunta ? `?desc=${encodeURIComponent(m.pergunta)}` : ""}`}>Não resolveu? Abrir um chamado</Link>}
          </div>
        ))}
        {espera && <p className="text-sm text-musgo">Procurando o caminho…</p>}
        <div ref={fim} />
      </div>
      <form className="sticky bottom-24 mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); enviar(txt); }}>
        <label htmlFor="msg" className="sr-only">Escreva sua mensagem</label>
        <input id="msg" className="campo" placeholder="Escreva sua mensagem…" value={txt} onChange={(e) => setTxt(e.target.value)} maxLength={300} />
        <button className="btn btn-p" disabled={espera}>Enviar</button>
      </form>
    </div>
  );
}
