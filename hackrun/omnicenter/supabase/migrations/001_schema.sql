-- OmniCenter · esquema principal
create extension if not exists pgcrypto;

create type papel as enum ('operador','gestor','admin');
create type prioridade as enum ('Normal','Alta','Máxima');
create type situacao as enum ('Novo','Em atendimento','Resolvido');

create table setores (id text primary key, nome text not null);
create table categorias (
  id text primary key, nome text not null,
  setor_id text not null references setores(id),
  prioridade_padrao prioridade not null default 'Normal'
);

-- Planta digital: locais (nós) e corredores (ligações)
create table locais (
  id text primary key, nome text not null,
  nivel text not null default 'terreo' check (nivel in ('terreo','praca_alimentacao','subsolo1','subsolo2')),
  tipo text not null default 'loja',
  x real not null, y real not null,
  publico boolean not null default true          -- depósitos e áreas de serviço = false
);
create table ligacoes (
  a text not null references locais(id), b text not null references locais(id),
  acessivel boolean not null default true,        -- elevador/rampa = true; escada rolante = false
  primary key (a, b)
);
create table pontos_qr (
  codigo text primary key, local_id text not null references locais(id), ativo boolean not null default true
);

create table perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null, papel papel not null default 'operador',
  setor_id text references setores(id)
);

create sequence protocolo_seq;
create table chamados (
  id bigserial primary key,
  protocolo text not null unique default ('OC-' || extract(year from now())::int || '-' || lpad(nextval('protocolo_seq')::text, 4, '0')),
  pin_hash text not null,
  categoria_id text references categorias(id),
  descricao text not null default '',
  foto_path text,
  ponto_qr text not null references pontos_qr(codigo),
  local_id text not null references locais(id),
  prioridade prioridade not null default 'Normal',
  setor_id text not null references setores(id),
  situacao situacao not null default 'Novo',
  sos boolean not null default false,
  sos_tipo text,
  sugestao_ia jsonb,
  baixa_confianca boolean not null default false,
  responsavel text,
  observacoes text not null default '',
  criado_em timestamptz not null default now(),
  primeira_resposta_em timestamptz,
  resolvido_em timestamptz,
  reaberturas int not null default 0
);
create index on chamados (situacao, criado_em desc);
create index on chamados (setor_id);

create table historico (
  id bigserial primary key, chamado_id bigint not null references chamados(id) on delete cascade,
  autor text not null, acao text not null, criado_em timestamptz not null default now()
);

-- Perguntas ao assistente (sem dados pessoais)
create table perguntas_chat (
  id bigserial primary key, ponto_qr text, pergunta text not null,
  respondida boolean not null default false, criado_em timestamptz not null default now()
);

-- Histórico automático + tempos de resposta/resolução + reaberturas
create or replace function trg_chamado() returns trigger language plpgsql security definer as $$
declare quem text := coalesce((select email from perfis where id = auth.uid()), 'Sistema');
begin
  if tg_op = 'INSERT' then
    insert into historico(chamado_id, autor, acao) values (new.id, 'Sistema',
      'Chamado registrado' || case when new.baixa_confianca then ' (baixa confiança: triagem manual)' else '' end);
    return new;
  end if;
  if new.situacao <> old.situacao then
    if new.situacao = 'Em atendimento' and new.primeira_resposta_em is null then new.primeira_resposta_em := now(); end if;
    if new.situacao = 'Resolvido' then new.resolvido_em := now(); end if;
    if old.situacao = 'Resolvido' then new.reaberturas := old.reaberturas + 1; new.resolvido_em := null; end if;
    insert into historico(chamado_id, autor, acao) values (new.id, quem, 'Status: ' || old.situacao || ' → ' || new.situacao);
  end if;
  if new.setor_id <> old.setor_id then
    insert into historico(chamado_id, autor, acao) values (new.id, quem, 'Reatribuído: ' || old.setor_id || ' → ' || new.setor_id);
  end if;
  if coalesce(new.responsavel,'') <> coalesce(old.responsavel,'') then
    insert into historico(chamado_id, autor, acao) values (new.id, quem, 'Responsável: ' || coalesce(new.responsavel,'—'));
  end if;
  if new.observacoes <> old.observacoes then
    insert into historico(chamado_id, autor, acao) values (new.id, quem, 'Providências/observações atualizadas');
  end if;
  return new;
end $$;
create trigger chamado_ins after insert on chamados for each row execute function trg_chamado();
create trigger chamado_upd before update on chamados for each row execute function trg_chamado();

-- Row Level Security
create or replace function meu_papel() returns papel language sql stable security definer as $$ select papel from perfis where id = auth.uid() $$;
create or replace function meu_setor() returns text language sql stable security definer as $$ select setor_id from perfis where id = auth.uid() $$;

alter table setores enable row level security;      alter table categorias enable row level security;
alter table locais enable row level security;       alter table ligacoes enable row level security;
alter table pontos_qr enable row level security;    alter table perfis enable row level security;
alter table chamados enable row level security;     alter table historico enable row level security;
alter table perguntas_chat enable row level security;

-- Cadastros: leitura para equipe; escrita só admin. Visitante nunca acessa o banco direto (só via servidor).
create policy "equipe lê setores" on setores for select to authenticated using (meu_papel() is not null);
create policy "equipe lê categorias" on categorias for select to authenticated using (meu_papel() is not null);
create policy "equipe lê locais" on locais for select to authenticated using (meu_papel() is not null);
create policy "equipe lê ligações" on ligacoes for select to authenticated using (meu_papel() is not null);
create policy "equipe lê pontos" on pontos_qr for select to authenticated using (meu_papel() is not null);
create policy "admin escreve setores" on setores for all to authenticated using (meu_papel() = 'admin') with check (meu_papel() = 'admin');
create policy "admin escreve categorias" on categorias for all to authenticated using (meu_papel() = 'admin') with check (meu_papel() = 'admin');
create policy "admin escreve locais" on locais for all to authenticated using (meu_papel() = 'admin') with check (meu_papel() = 'admin');
create policy "admin escreve ligações" on ligacoes for all to authenticated using (meu_papel() = 'admin') with check (meu_papel() = 'admin');
create policy "admin escreve pontos" on pontos_qr for all to authenticated using (meu_papel() = 'admin') with check (meu_papel() = 'admin');
create policy "perfil próprio" on perfis for select to authenticated using (id = auth.uid() or meu_papel() = 'admin');
create policy "admin gere perfis" on perfis for all to authenticated using (meu_papel() = 'admin') with check (meu_papel() = 'admin');

-- Chamados: operador vê seu setor + triagem manual + SOS; gestor/admin veem tudo.
create policy "ler chamados" on chamados for select to authenticated using (
  meu_papel() in ('gestor','admin')
  or (meu_papel() = 'operador' and (setor_id = meu_setor() or setor_id = 'triagem' or sos))
);
create policy "atualizar chamados" on chamados for update to authenticated using (
  meu_papel() in ('gestor','admin')
  or (meu_papel() = 'operador' and (setor_id = meu_setor() or setor_id = 'triagem' or sos))
) with check (true);
create policy "ler histórico" on historico for select to authenticated using (
  exists (select 1 from chamados c where c.id = chamado_id)   -- herda a RLS de chamados
);
create policy "gestor lê perguntas" on perguntas_chat for select to authenticated using (meu_papel() in ('gestor','admin'));

-- Tempo real do Kanban (a RLS vale também para o Realtime)
alter publication supabase_realtime add table chamados;

-- Visão sem dados pessoais para o serviço Python (descrição, foto e PIN ficam de fora)
create view v_chamados_analise as
  select id, protocolo, categoria_id, setor_id, ponto_qr, local_id, prioridade, situacao, sos, sos_tipo,
         baixa_confianca, criado_em, primeira_resposta_em, resolvido_em, reaberturas
  from chamados;
create view v_perguntas_analise as select id, ponto_qr, respondida, criado_em from perguntas_chat;

-- Perfil somente leitura para o Python. Habilite o login ao configurar o serviço.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'analytics_ro') then create role analytics_ro nologin; end if;
end $$;
grant usage on schema public to analytics_ro;
grant select on v_chamados_analise, v_perguntas_analise, locais, pontos_qr, setores, categorias to analytics_ro;

-- Fotos: bucket privado (acesso só por links temporários gerados no servidor)
insert into storage.buckets (id, name, public) values ('fotos', 'fotos', false) on conflict do nothing;

-- LGPD: retenção. Agende com pg_cron, ex.: select cron.schedule('purge', '0 3 * * *', 'select purgar_fotos(90)');
create or replace function purgar_fotos(dias int) returns int language plpgsql security definer as $$
declare n int;
begin
  delete from storage.objects where bucket_id = 'fotos' and created_at < now() - make_interval(days => dias);
  update chamados set foto_path = null where foto_path is not null and criado_em < now() - make_interval(days => dias);
  get diagnostics n = row_count; return n;
end $$;

-- Acesso explícito à API do Supabase em projetos novos.
grant select on public.setores, public.categorias, public.locais, public.ligacoes,
  public.pontos_qr, public.perfis, public.chamados, public.historico,
  public.perguntas_chat to authenticated;
grant insert, update, delete on public.setores, public.categorias, public.locais,
  public.ligacoes, public.pontos_qr, public.perfis to authenticated;
grant update on public.chamados to authenticated;
grant select on public.pontos_qr, public.locais, public.ligacoes, public.categorias,
  public.chamados to service_role;
grant insert on public.chamados, public.perguntas_chat to service_role;
grant usage on sequence public.protocolo_seq, public.chamados_id_seq,
  public.perguntas_chat_id_seq to service_role;
