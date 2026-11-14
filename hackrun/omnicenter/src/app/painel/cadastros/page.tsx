import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { perfilAtual, supabaseServidor } from "@/lib/supabase-server";
import { Planta } from "@/components/Planta";
import { CartaoQR } from "@/components/CartaoQR";
import type { Ligacao, Local } from "@/lib/tipos";

export const dynamic = "force-dynamic";

async function adicionarPonto(fd: FormData) {
  "use server";
  if ((await perfilAtual())?.papel !== "admin") return;
  const codigo = String(fd.get("codigo") ?? "").trim().toUpperCase(), local_id = String(fd.get("local_id") ?? "");
  if (!/^QR-\d{3}$/.test(codigo) || !local_id) return;
  await supabaseServidor().from("pontos_qr").insert({ codigo, local_id });   // a RLS só permite admin
  revalidatePath("/painel/cadastros");
}
async function alternarPonto(fd: FormData) {
  "use server";
  if ((await perfilAtual())?.papel !== "admin") return;
  await supabaseServidor().from("pontos_qr").update({ ativo: fd.get("ativo") !== "true" }).eq("codigo", String(fd.get("codigo")));
  revalidatePath("/painel/cadastros");
}

export default async function Cadastros() {
  const perfil = await perfilAtual();
  if (!perfil) redirect("/painel/login");
  if (perfil.papel !== "admin") redirect("/painel");
  const sb = supabaseServidor();
  const [{ data: lo }, { data: li }, { data: pq }, { data: se }, { data: ca }, { data: us }] = await Promise.all([
    sb.from("locais").select("*").order("nome"), sb.from("ligacoes").select("*"), sb.from("pontos_qr").select("*").order("codigo"),
    sb.from("setores").select("*"), sb.from("categorias").select("*"), sb.from("perfis").select("*"),
  ]);
  const locais = (lo ?? []) as Local[], site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cadastros</h1>
      <section className="rounded-2xl border border-ink/15 bg-white p-4"><h2 className="font-bold">Pontos de QR Code</h2>
        <form action={adicionarPonto} className="mt-2 flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="cod">Código</label><input id="cod" name="codigo" className="campo !w-36" placeholder="QR-040" pattern="QR-\d{3}" required />
          <label className="sr-only" htmlFor="loc">Local</label><select id="loc" name="local_id" className="campo !w-64" required>{locais.filter((l) => l.publico).map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}</select>
          <button className="btn btn-p">Adicionar ponto</button>
        </form>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(pq ?? []).map((p: any) => (
            <div key={p.codigo} className="rounded-xl border border-ink/15 p-3">
              <CartaoQR url={`${site}/p/${p.codigo}`} codigo={p.codigo} local={locais.find((l) => l.id === p.local_id)?.nome ?? p.local_id} />
              <form action={alternarPonto} className="mt-2"><input type="hidden" name="codigo" value={p.codigo} /><input type="hidden" name="ativo" value={String(p.ativo)} /><button className="btn !min-h-[40px] w-full text-sm">{p.ativo ? "Desativar" : "Reativar"}</button></form>
            </div>))}
        </div>
      </section>
      <section className="rounded-2xl border border-ink/15 bg-white p-4"><h2 className="font-bold">Planta digital</h2>
        <Planta locais={locais} ligacoes={(li ?? []) as Ligacao[]} />
        <p className="mt-1 text-sm text-musgo">{locais.length} locais · {(li ?? []).length} ligações. Para ajustar a planta real, edite as tabelas locais e ligacoes (veja o README).</p></section>
      <section className="rounded-2xl border border-ink/15 bg-white p-4"><h2 className="font-bold">Setores, categorias e usuários</h2>
        <p className="mt-2">{(se ?? []).map((s: any) => <span key={s.id} className="chip mr-1">{s.nome}</span>)}</p>
        <p className="mt-2">{(ca ?? []).map((c: any) => <span key={c.id} className="chip mr-1">{c.nome} → {c.setor_id}</span>)}</p>
        <table className="mt-3 w-full text-left text-sm"><thead><tr><th>E-mail</th><th>Perfil</th><th>Setor</th></tr></thead><tbody>
          {(us ?? []).map((u: any) => <tr key={u.id} className="border-t border-ink/10"><td className="py-1">{u.email}</td><td>{u.papel}</td><td>{u.setor_id ?? "—"}</td></tr>)}</tbody></table>
      </section>
    </div>
  );
}
