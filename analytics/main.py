"""Serviço de inteligência de dados do OmniCenter (somente leitura, sem dados pessoais)."""
import os
import pandas as pd
from fastapi import Depends, FastAPI, Header, HTTPException
from sqlalchemy import create_engine
import padroes

# Usa o perfil analytics_ro, que só enxerga as visões sem dados pessoais.
engine = create_engine(os.environ["DATABASE_URL_READONLY"], pool_pre_ping=True)
app = FastAPI(title="OmniCenter · Inteligência de dados")


def autorizar(x_api_key: str = Header(default="")):
    if x_api_key != os.environ.get("ANALYTICS_API_KEY"):
        raise HTTPException(401, "Não autorizado")


@app.get("/saude")
def saude():
    return {"ok": True}


@app.get("/resumo", dependencies=[Depends(autorizar)])
def resumo(dias: int = 7):
    dias = max(1, min(dias, 90))
    df = pd.read_sql(
        "select * from v_chamados_analise where criado_em > now() - make_interval(days => %(d)s)",
        engine, params={"d": dias}, parse_dates=["criado_em", "primeira_resposta_em", "resolvido_em"])
    locais = pd.read_sql("select id, nome from locais", engine).set_index("id").nome.to_dict()
    nome = lambda i: locais.get(i, i)  # noqa: E731
    if df.empty:
        return {"indicadores": padroes.indicadores(df), "calor": [], "por_hora": [{"hora": h, "qtd": 0} for h in range(24)], "padroes": []}
    horas = df.criado_em.dt.tz_convert("America/Araguaina").dt.hour.value_counts()
    return {
        "indicadores": padroes.indicadores(df),
        "calor": [{"local_id": k, "qtd": int(v)} for k, v in df.local_id.value_counts().items()],
        "por_hora": [{"hora": h, "qtd": int(horas.get(h, 0))} for h in range(24)],
        "padroes": padroes.recorrencia(df, nome) + padroes.gargalo(df) + padroes.reincidencia(df, nome) + padroes.desvio(df, dias),
    }
