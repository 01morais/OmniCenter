import type { Ligacao, Local } from "./tipos";

/** Menor caminho (Dijkstra) na planta digital. Áreas de serviço (publico=false) nunca entram. */
export function calcularRota(locais: Local[], ligacoes: Ligacao[], de: string, para: string, acessivel: boolean): Local[] | null {
  const pub = new Map(locais.filter((l) => l.publico).map((l) => [l.id, l]));
  if (!pub.has(de) || !pub.has(para)) return null;
  const adj = new Map<string, { to: string; w: number }[]>();
  for (const e of ligacoes) {
    if (acessivel && !e.acessivel) continue;
    const A = pub.get(e.a), B = pub.get(e.b);
    if (!A || !B) continue;
    const w = Math.hypot(A.x - B.x, A.y - B.y) + (A.nivel !== B.nivel ? 30 : 0);
    (adj.get(e.a) ?? adj.set(e.a, []).get(e.a)!).push({ to: e.b, w });
    (adj.get(e.b) ?? adj.set(e.b, []).get(e.b)!).push({ to: e.a, w });
  }
  const dist = new Map<string, number>([[de, 0]]), prev = new Map<string, string>(), aberto = new Set(pub.keys());
  while (aberto.size) {
    let u: string | null = null;
    for (const k of aberto) if (dist.has(k) && (u === null || dist.get(k)! < dist.get(u)!)) u = k;
    if (u === null) break;
    aberto.delete(u);
    if (u === para) break;
    for (const { to, w } of adj.get(u) ?? []) {
      const nd = dist.get(u)! + w;
      if (aberto.has(to) && nd < (dist.get(to) ?? Infinity)) { dist.set(to, nd); prev.set(to, u); }
    }
  }
  if (!dist.has(para)) return null;
  const ids = [para];
  while (ids[0] !== de) ids.unshift(prev.get(ids[0])!);
  return ids.map((id) => pub.get(id)!);
}

export const mapsUrl = (nome: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Capim Dourado Shopping Palmas " + nome)}`;

export const semAcento = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
