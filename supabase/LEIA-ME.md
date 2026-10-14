# Contatos de doadores no Supabase

O formulário "Quero doar" grava nome, telefone e consentimento na tabela `doadores` do projeto `cbitixnnwwhrghtwlnnt`.

## Configurar (uma vez)

1. No Supabase, abra **SQL Editor → New query**, cole o conteúdo de [`doadores.sql`](doadores.sql) e clique em **Run**.
2. Em **Project Settings → API Keys**, copie a chave **pública**:
   - a **publishable key** (começa com `sb_publishable_`), ou
   - a **anon key** da aba "Legacy API Keys" (começa com `eyJ`).
3. Cole a chave em `js/config.js`, no campo `supabaseKey`.
4. Teste: preencha o formulário no site e veja a linha em **Table Editor → doadores**.

## Segurança

- A chave pública fica visível no código do site, e isso é normal no Supabase: quem protege os dados é o RLS. Com o `doadores.sql`, essa chave **só consegue inserir**, nunca ler a lista.
- **Nunca** coloque no site a `service_role` nem a `secret key` (`sb_secret_...`). Elas ignoram o RLS e dão acesso total ao banco.
- O banco recusa nome vazio, telefone sem DDD e envio sem consentimento.

## Ver e exportar os contatos

**Table Editor → doadores**. Para planilha: botão **Export → CSV**.

LGPD: são dados pessoais. Dê acesso ao projeto só a quem precisa e apague a linha de quem pedir exclusão.
