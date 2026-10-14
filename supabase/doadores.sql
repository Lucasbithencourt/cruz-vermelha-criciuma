-- Cruz Vermelha Criciúma · tabela de doadores do formulário "Quero doar"
-- Rode uma vez no Supabase: SQL Editor → New query → cole tudo → Run.
-- O site (chave pública) só pode INSERIR. Ninguém de fora consegue ler, alterar ou apagar.

create table if not exists public.doadores (
  id            bigint generated always as identity primary key,
  criado_em     timestamptz not null default now(),
  nome          text not null check (char_length(btrim(nome)) between 2 and 120),
  telefone      text not null check (char_length(regexp_replace(telefone, '\D', '', 'g')) between 10 and 11),
  consentimento boolean not null check (consentimento),
  origem        text check (char_length(origem) <= 200)
);

comment on table public.doadores is 'Contatos deixados no site para doar. Dados pessoais (LGPD): apagar a linha de quem pedir exclusão.';

-- Segurança: RLS ligado e permissões mínimas para a chave pública (anon)
alter table public.doadores enable row level security;

revoke all on public.doadores from anon, authenticated;
grant insert (nome, telefone, consentimento, origem) on public.doadores to anon;

drop policy if exists "site insere doadores" on public.doadores;
create policy "site insere doadores"
  on public.doadores
  for insert
  to anon
  with check (consentimento);

-- Sem política de SELECT/UPDATE/DELETE: os contatos só aparecem no painel do Supabase (Table Editor).
