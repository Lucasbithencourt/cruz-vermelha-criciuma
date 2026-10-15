# Planilha de doadores (Google Sheets)

Cada contato deixado no formulário do site cai no Supabase e, na mesma hora, vira uma linha na aba **Doadores** da planilha:

| Data | Nome | Telefone | WhatsApp | Status | Origem | ID |
|---|---|---|---|---|---|---|
| 14/10/2026 20:31 | Maria Silva | (48) 99999-9999 | Abrir conversa | Novo | /index.html | 12 |

- **WhatsApp:** abre a conversa com uma mensagem de agradecimento pronta.
- **Status:** lista com Novo, Contatado, Doou e Sem retorno, cada um com uma cor. A equipe atualiza à mão.

## Aba Painel

A primeira aba resume tudo e se atualiza sozinha, sem ninguém mexer:

- **4 números no topo:** contatos recebidos, últimos 7 dias, % já contatados e quantos doaram.
- **4 gráficos:** contatos por dia (30 dias), status dos contatos (rosca), contatos por mês e dias da semana com mais contatos.
- **Últimos contatos:** os 8 mais recentes, com nome, telefone e status.

As cores seguem o site. A equipe só trabalha na aba **Doadores**, mudando o status; o painel acompanha. Se algum gráfico for apagado sem querer, use **Cruz Vermelha → Refazer o painel**.

## Instalar (uma vez, cerca de 5 minutos)

1. **Restrinja o acesso.** Na planilha, clique em **Compartilhar → Acesso geral → Restrito**. Ela vai guardar nomes e telefones (LGPD). Adicione só quem precisa.
2. **Cole o script.** Abra **Extensões → Apps Script**, apague o conteúdo de `Código.gs`, cole o conteúdo de [`Code.gs`](Code.gs) e salve (ícone de disquete).
3. **Configure.** Volte para a planilha e recarregue a página. Vai aparecer o menu **Cruz Vermelha**. Clique em **Cruz Vermelha → Configurar planilha** e autorize o acesso quando o Google pedir. Isso cria e formata as abas **Doadores** e **Painel**.
4. **Publique.** No Apps Script, clique em **Implantar → Nova implantação → engrenagem → App da Web**:
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**

   Clique em **Implantar** e copie a **URL do app da Web** (termina em `/exec`).
5. **Ligue o Supabase.** No SQL Editor do Supabase, cole o conteúdo de [`../supabase/webhook-planilha.sql`](../supabase/webhook-planilha.sql), troque `COLE_AQUI_A_URL_DO_APP_DA_WEB` pela URL do passo 4 e clique em **Run**.
6. **Teste.** Preencha o formulário do site. Em poucos segundos a linha aparece na aba **Doadores**.

## Bom saber

- "Qualquer pessoa" no passo 4 é o que permite o Supabase gravar sem login. O script só **acrescenta** linhas: não lê, não apaga e ignora qualquer envio fora do formato do Supabase. A URL só fica guardada dentro do Supabase, não no código do site.
- Se a planilha estiver fora do ar, o contato **continua salvo no Supabase** (Table Editor → doadores).
- Mudou o `Code.gs`? Faça **Implantar → Gerenciar implantações → Editar → Nova versão**, senão a URL continua rodando a versão antiga.
- **Cruz Vermelha → Adicionar linha de teste** cria uma linha falsa para conferir a formatação.
