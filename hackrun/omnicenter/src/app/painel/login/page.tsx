"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseNavegador } from "@/lib/supabase-browser";

export default function Login() {
  const [email, setEmail] = useState(""), [senha, setSenha] = useState(""), [erro, setErro] = useState(""), [env, setEnv] = useState(false);
  const r = useRouter();
  async function entrar(e: React.FormEvent) {
    e.preventDefault(); setEnv(true); setErro("");
    const { error } = await supabaseNavegador().auth.signInWithPassword({ email, password: senha });
    if (error) { setErro("E-mail ou senha incorretos."); setEnv(false); return; }
    r.push("/painel"); r.refresh();
  }
  return (
    <main className="mx-auto mt-16 max-w-sm p-6">
      <h1 className="text-2xl font-bold">Painel da equipe</h1>
      <form onSubmit={entrar}>
        <label htmlFor="email" className="rotulo">E-mail corporativo</label>
        <input id="email" type="email" required autoComplete="username" className="campo" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="senha" className="rotulo">Senha</label>
        <input id="senha" type="password" required autoComplete="current-password" className="campo" value={senha} onChange={(e) => setSenha(e.target.value)} />
        {erro && <p role="alert" className="mt-3 font-semibold text-sos">{erro}</p>}
        <button className="btn btn-p mt-5 w-full" disabled={env}>{env ? "Entrando…" : "Entrar"}</button>
      </form>
    </main>
  );
}
