-- Cruz Vermelha Criciúma · envia cada doador novo para a planilha Google
-- Rode no Supabase (SQL Editor) DEPOIS de publicar o Apps Script da planilha.
-- Troque COLE_AQUI_A_URL_DO_APP_DA_WEB pela URL que termina em /exec (planilha/LEIA-ME.md, passo 4).
-- Não suba este arquivo com a URL preenchida: ela dá permissão para gravar na planilha.

create extension if not exists pg_net with schema extensions;

create or replace function public.enviar_doador_para_planilha()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform net.http_post(
    url := 'COLE_AQUI_A_URL_DO_APP_DA_WEB',
    body := jsonb_build_object('type', 'INSERT', 'table', 'doadores', 'record', to_jsonb(new)),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return new; -- se a planilha falhar, o contato continua salvo no Supabase
end;
$$;

revoke all on function public.enviar_doador_para_planilha() from public, anon, authenticated;

drop trigger if exists doador_para_planilha on public.doadores;
create trigger doador_para_planilha
  after insert on public.doadores
  for each row execute function public.enviar_doador_para_planilha();
