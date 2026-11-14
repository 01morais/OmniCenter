# OmniCenter · Hub Integrado de Experiência Phygital
HackaRun · Desafio 07 · Equipe Crobat. Next.js + TypeScript + Tailwind, Supabase, Python/FastAPI.

## O que está implementado
| Item | Onde |
|---|---|
| QR Code → ponto físico (`/p/QR-012`), PWA, service worker | `src/app/p/[code]`, `public/sw.js`, `src/app/manifest.ts` |
| Home com busca, atalhos e SOS fixo | `src/app/p/[code]/page.tsx`, `BotaoSOS.tsx` |
| Chat de orientação + rota na planta (Dijkstra, rota acessível, Google Maps) | `api/chat`, `lib/rotas.ts`, `Chat.tsx`, `Planta.tsx` |
| Ocorrência em 3 passos, foto opcional (JPG/PNG, 2 MB), protocolo + PIN | `FormOcorrencia.tsx`, `api/chamados` |
| Triagem: regras + IA sugere, baixa confiança vai para triagem manual; SOS por regra fixa | `lib/triagem.ts`, `api/sos` |
| Consulta por protocolo + PIN (hash, limite de tentativas) | `api/chamados/consulta`, `Protocolo.tsx` |
| Kanban em tempo real, filtros, arrastar, detalhe, histórico automático | `Kanban.tsx`, `DetalheChamado.tsx`, gatilhos no SQL |
| Login da equipe e perfis (operador, gestor, administrador) com RLS | `middleware.ts`, `supabase/migrations/001_schema.sql` |
| Inteligência de dados (Python/Pandas, só leitura): indicadores, mapa de calor, 4 tipos de padrão com evidência | `analytics/`, `painel/inteligencia` |
| Cadastros: QR Codes com impressão, planta, setores, categorias, usuários | `painel/cadastros` |
| LGPD: sem cadastro do visitante, fotos privadas com link de 60 s, visões sem dados pessoais, purga por retenção | SQL (`purgar_fotos`, `v_chamados_analise`) |

## Como rodar
Para testar com o banco de teste compartilhado, siga o arquivo [LEIA-ME-TESTE.md](LEIA-ME-TESTE.md).

1. **Supabase**: crie um projeto. No SQL Editor rode `supabase/migrations/001_schema.sql` e depois `supabase/seed.sql`.
   Para usar o serviço Python, habilite o login do perfil `analytics_ro` com uma senha própria, conforme o guia de teste.
2. **Usuários da equipe**: Authentication → Add user. Depois, no SQL Editor:
   `insert into perfis (id, email, papel, setor_id) select id, email, 'admin', null from auth.users where email = 'voce@exemplo.com';`
   (papéis: `operador` com `setor_id`, `gestor`, `admin`).
3. **App**: `cp .env.example .env.local`, preencha as chaves, `npm install`, `npm run dev`.
4. **Python** (Windows/PowerShell; recomendado Python 3.12 ou 3.13):
   ```
   cd analytics
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   $env:DATABASE_URL_READONLY="postgresql://analytics_ro:SENHA@HOST:5432/postgres"
   $env:ANALYTICS_API_KEY="sua-chave"
   uvicorn main:app --port 8000
   ```
   (no Linux/Mac: `source .venv/bin/activate` e `export VAR=...`)
5. **Demo**: `$env:DATABASE_URL_ADMIN="postgresql://postgres:..."; python simular.py` (dentro de `analytics`, com o ambiente virtual ativo) e abra Inteligência de dados. Use esse simulador em um banco isolado com a planta ilustrativa do `seed.sql`, pois ele usa os IDs dessa planta.
6. **Deploy**: Vercel (app, variáveis do `.env.example`) e Railway (`analytics/`, `Procfile`).
   A IA é opcional: sem `OPENAI_API_KEY` tudo funciona só com regras.

## Pendências conhecidas
- A planta usada pela equipe está em `supabase/planta_capim_dourado.sql`.
- Cadastros: pontos de QR Code têm CRUD; setores, categorias, locais e usuários são só leitura no painel (edite no Supabase).
- Chat: responde rotas e destinos; a base de conhecimento (horários, serviços) fica para a fase 2.
- Limitador de tentativas da consulta é em memória por instância; em produção use Upstash/Redis.
- Notificações WhatsApp/SMS, sentimento e previsão de demanda: fases 2 e 3 do documento.
