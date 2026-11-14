"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function BuscaHome({ base }: { base: string }) {
  const [q, setQ] = useState(""), r = useRouter();
  return (
    <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); r.push(`${base}/chat${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`); }}>
      <label htmlFor="busca" className="sr-only">Digite sua dúvida</label>
      <input id="busca" className="campo" placeholder="Digite sua dúvida…" value={q} onChange={(e) => setQ(e.target.value)} />
      <button className="btn btn-p" type="submit">Buscar</button>
    </form>
  );
}
