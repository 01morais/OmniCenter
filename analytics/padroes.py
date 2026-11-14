"""Análises sobre os registros da aplicação. Só lê; nunca altera chamados nem aciona equipes."""
import pandas as pd

NOME_CAT = {"limpeza": "limpeza", "manutencao": "manutenção", "seguranca": "segurança", "objeto_perdido": "objeto perdido", "outro": "outros"}


def indicadores(df: pd.DataFrame) -> dict:
    if df.empty:
        return {"volume": 0, "primeira_resposta_min": 0, "resolucao_min": 0, "reabertura_pct": 0}
    pr = (df.primeira_resposta_em - df.criado_em).dt.total_seconds().dropna() / 60
    rs = (df.resolvido_em - df.criado_em).dt.total_seconds().dropna() / 60
    return {"volume": int(len(df)), "primeira_resposta_min": int(round(pr.mean())) if len(pr) else 0,
            "resolucao_min": int(round(rs.mean())) if len(rs) else 0, "reabertura_pct": int(round(100 * (df.reaberturas > 0).mean()))}


def _ev(d: pd.DataFrame) -> list[str]:
    return d.protocolo.tolist()[:60]


def recorrencia(df, nome_local):
    """Mesmo local + categoria com muitos chamados concentrados em uma janela de 2 horas."""
    out = []
    for (loc, cat), g in df[~df.sos].groupby(["local_id", "categoria_id"]):
        if len(g) < 5:
            continue
        h = g.criado_em.dt.hour
        melhor = max(range(0, 23), key=lambda x: ((h == x) | (h == x + 1)).sum())
        n = int(((h == melhor) | (h == melhor + 1)).sum())
        if n / len(g) >= 0.5:
            out.append({"tipo": "Recorrência", "evidencia": _ev(g),
                        "texto": f"{nome_local(loc)} recebeu {len(g)} chamados de {NOME_CAT.get(cat, cat)} no período, {round(100 * n / len(g))}% entre {melhor}h e {melhor + 2}h."})
    return out


def gargalo(df):
    """Manutenção aberta à noite demora bem mais para ser resolvida."""
    m = df[(df.categoria_id == "manutencao") & df.resolvido_em.notna()].copy()
    m["dur"] = (m.resolvido_em - m.criado_em).dt.total_seconds() / 60
    noite, dia = m[m.criado_em.dt.hour >= 18], m[m.criado_em.dt.hour < 18]
    if len(noite) >= 3 and len(dia) >= 3 and dia.dur.mean() > 0 and noite.dur.mean() / dia.dur.mean() >= 1.5:
        return [{"tipo": "Gargalo", "evidencia": _ev(noite),
                 "texto": f"Chamados de manutenção abertos depois das 18h levam {noite.dur.mean() / dia.dur.mean():.1f}× o tempo para serem resolvidos."}]
    return []


def reincidencia(df, nome_local):
    r = df[df.reaberturas > 0]
    return [{"tipo": "Reincidência", "evidencia": _ev(g),
             "texto": f"{nome_local(loc)}: {int(g.reaberturas.sum())} reabertura(s) depois de marcado como resolvido."} for loc, g in r.groupby("local_id")]


def desvio(df, dias):
    """Hoje vs. média diária dos dias anteriores, por ponto de QR Code."""
    agora = pd.Timestamp.now(tz="UTC")
    hoje = df[df.criado_em > agora - pd.Timedelta(days=1)]
    antes = df[df.criado_em <= agora - pd.Timedelta(days=1)]
    out = []
    for ponto, g in hoje.groupby("ponto_qr"):
        media = len(antes[antes.ponto_qr == ponto]) / max(dias - 1, 1)
        if len(g) >= 5 and len(g) >= 3 * max(media, 0.5):
            out.append({"tipo": "Desvio fora do normal", "evidencia": _ev(g),
                        "texto": f"O ponto {ponto} teve {len(g)} chamados hoje, contra média de {media:.1f} por dia."})
    return out
