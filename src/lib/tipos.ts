export type Prioridade = "Normal" | "Alta" | "Máxima";
export type Situacao = "Novo" | "Em atendimento" | "Resolvido";
export type Papel = "operador" | "gestor" | "admin";
export type Local = { id: string; nome: string; nivel: string; tipo: string; x: number; y: number; publico: boolean };
export type Ligacao = { a: string; b: string; acessivel: boolean };
export type Chamado = {
  id: number; protocolo: string; categoria_id: string | null; descricao: string; foto_path: string | null;
  ponto_qr: string; local_id: string; prioridade: Prioridade; setor_id: string; situacao: Situacao;
  sos: boolean; sos_tipo: string | null; sugestao_ia: { categoria?: string; prioridade?: string; confianca?: number } | null;
  baixa_confianca: boolean; responsavel: string | null; observacoes: string; criado_em: string;
  primeira_resposta_em: string | null; resolvido_em: string | null; reaberturas: number;
};
export type Perfil = { id: string; email: string; papel: Papel; setor_id: string | null };
export const SITUACOES: Situacao[] = ["Novo", "Em atendimento", "Resolvido"];
