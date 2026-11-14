import type { Ligacao, Local } from "@/lib/tipos";

/** Planta digital em SVG. caminho = trajeto calculado; calor = nº de chamados por local. */
export function Planta({ locais, ligacoes, caminho, aqui, calor }: {
  locais: Local[]; ligacoes: Ligacao[]; caminho?: Local[]; aqui?: string; calor?: Record<string, number>;
}) {
  const L = new Map(locais.map((l) => [l.id, l]));
  const max = Math.max(1, ...Object.values(calor ?? {}));
  const fim = caminho?.[caminho.length - 1]?.id;
  return (
    <svg viewBox="0 0 320 220" role="img" aria-label="Planta do shopping" className="w-full rounded-xl border border-ink/15 bg-white">
      {ligacoes.map((e) => {
        const a = L.get(e.a), b = L.get(e.b);
        return a && b && a.publico && b.publico ? (
          <line key={e.a + e.b} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#E3E8E2" strokeWidth={4} strokeDasharray={e.acessivel ? undefined : "2 4"} />
        ) : null;
      })}
      {caminho && caminho.length > 1 && (
        <polyline fill="none" stroke="#C9962B" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="7 5"
          points={caminho.map((l) => `${l.x},${l.y}`).join(" ")} />
      )}
      {locais.filter((l) => l.publico).map((l) => (
        <g key={l.id}>
          {calor?.[l.id] ? <circle cx={l.x} cy={l.y} r={7 + (calor[l.id] / max) * 20} fill="#C62828" opacity={0.35} /> : null}
          <circle cx={l.x} cy={l.y} r={l.id === aqui || l.id === fim ? 5 : 3.5} fill={l.id === aqui ? "#12332E" : l.id === fim ? "#C62828" : "#4A5B57"} />
          <text x={l.x + 6} y={l.y - 6} fontSize={8} fill="#12332E">{l.nome}</text>
        </g>
      ))}
      <text x={6} y={214} fontSize={7.5} fill="#4A5B57">Pontilhado cinza: escada rolante (sem acessibilidade)</text>
    </svg>
  );
}
