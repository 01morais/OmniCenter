import "server-only";
import { perguntarIA } from "./ia";
import type { Prioridade } from "./tipos";

type Cat = { id: string; setor_id: string; prioridade_padrao: Prioridade };
type SugestaoIA = { categoria?: string; prioridade?: Prioridade; confianca?: number };
const ordem: Prioridade[] = ["Normal", "Alta", "Máxima"];
const maior = (a: Prioridade, b: Prioridade) => (ordem.indexOf(a) >= ordem.indexOf(b) ? a : b);
const RISCO = /vazamento|fogo|fuma[cç]a|queda|ca[ií]u|preso|choque|el[eé]trico|quebrad|ferid|sangue|briga|amea[cç]a/i;

/** A IA sugere; a regra de negócio decide. Baixa confiança vai para a fila de triagem manual. */
export async function triar(categoriaId: string, descricao: string, cats: Cat[]) {
  const cat = cats.find((c) => c.id === categoriaId) ?? cats.find((c) => c.id === "outro")!;
  const ia = descricao.trim().length >= 8
    ? await perguntarIA<SugestaoIA>(
        `Você faz triagem de chamados de um shopping. Responda JSON: {"categoria": um de [${cats.map((c) => c.id).join(",")}], "prioridade": "Normal"|"Alta", "confianca": 0..1}. Use só o texto recebido.`,
        descricao.slice(0, 500))
    : null;

  let final = cat;
  if (cat.id === "outro" && ia?.categoria && (ia.confianca ?? 0) >= 0.7) final = cats.find((c) => c.id === ia.categoria) ?? cat;
  let prioridade = final.prioridade_padrao;
  if (RISCO.test(descricao)) prioridade = maior(prioridade, "Alta");
  if (ia?.prioridade && (ia.confianca ?? 0) >= 0.6 && ia.prioridade !== "Máxima") prioridade = maior(prioridade, ia.prioridade);

  const baixa = final.id === "outro" || (ia != null && (ia.confianca ?? 1) < 0.5);
  return { categoria: final.id, setor: baixa ? "triagem" : final.setor_id, prioridade, baixa, sugestao: ia };
}

/** SOS: regra fixa, sem IA. */
export const roteSOS = (tipo: string) => ({
  setor: tipo === "Emergência médica" ? "brigada" : "seguranca", prioridade: "Máxima" as Prioridade,
});
