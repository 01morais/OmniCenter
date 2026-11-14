"use client";
import { useRouter } from "next/navigation";
import { supabaseNavegador } from "@/lib/supabase-browser";
export function SairBotao() {
  const r = useRouter();
  return <button className="rounded-lg border border-white/30 px-3 py-2 text-sm" onClick={async () => { await supabaseNavegador().auth.signOut(); r.push("/painel/login"); r.refresh(); }}>Sair</button>;
}
