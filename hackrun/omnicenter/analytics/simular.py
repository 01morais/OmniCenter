"""Gera chamados simulados com a mesma estrutura dos reais e padrões plantados de propósito:
  • pico de limpeza no banheiro da praça de alimentação entre 12h e 14h
  • manutenção noturna que demora o dobro
  • reaberturas na escada rolante   • rajada de chamados hoje no QR-030
Uso:  DATABASE_URL_ADMIN=postgresql://postgres:...@.../postgres python simular.py
"""
import os, random
from datetime import datetime, timedelta, timezone
import psycopg2

random.seed(7)
con = psycopg2.connect(os.environ["DATABASE_URL_ADMIN"]); cur = con.cursor()
agora = datetime.now(timezone.utc)
PONTOS = {"QR-001": "ent", "QR-012": "pra", "QR-020": "evt", "QR-030": "est"}
SETOR = {"limpeza": "limpeza", "manutencao": "manutencao", "seguranca": "seguranca", "objeto_perdido": "sac"}


def inserir(cat, qr, quando, dur_min, local=None, reab=0):
    pr = quando + timedelta(minutes=random.randint(2, 9))
    cur.execute(
        """insert into chamados (pin_hash, categoria_id, descricao, ponto_qr, local_id, setor_id, prioridade, situacao,
             criado_em, primeira_resposta_em, resolvido_em, reaberturas)
           values ('simulado', %s, 'Chamado simulado', %s, %s, %s, 'Normal', 'Resolvido', %s, %s, %s, %s)""",
        (cat, qr, local or PONTOS[qr], SETOR[cat], quando, pr, quando + timedelta(minutes=dur_min), reab))


for _ in range(170):
    dia = random.randint(0, 6); base = (agora - timedelta(days=dia)).replace(minute=random.randint(0, 59), second=0, microsecond=0)
    r = random.random()
    if r < 0.35:
        inserir("limpeza", "QR-012", base.replace(hour=15 + random.choice([0, 1])), random.randint(20, 40), "ban")   # 12h-13h em Palmas (UTC-3)
    elif r < 0.6:
        h = random.randint(11, 24) % 24; q = base.replace(hour=h)
        noite = (h - 3) % 24 >= 18
        inserir("manutencao", random.choice(list(PONTOS)), q, random.randint(70, 100) if noite else random.randint(30, 50))
    else:
        inserir(random.choice(["limpeza", "seguranca", "objeto_perdido"]), random.choice(list(PONTOS)), base.replace(hour=random.randint(11, 24) % 24), random.randint(20, 50))
for i in range(3):
    inserir("manutencao", "QR-020", agora - timedelta(days=1 + i, hours=1), 40, "esc", reab=1)
for i in range(9):
    inserir("seguranca", "QR-030", agora - timedelta(minutes=5 * (i + 1)), 20)
con.commit(); print("Chamados simulados inseridos.")
