# Cruz Vermelha Criciúma · site institucional

Site estático da Cruz Vermelha Brasileira, Filial Criciúma. HTML, CSS e JS puros, sem build. A conversão é o botão **"Quero doar para a Cruz Vermelha"**, que pede nome e telefone, grava no Supabase e leva aos pontos de coleta. A filial não pede doações em dinheiro.

```
index.html               página principal (hero, números, história, programas, princípios, sede, mídia, parceiros, como ajudar)
pontos-de-coleta.html    destino do formulário: agradecimento, lista de pontos, mapa e dicas
abrace-uma-historia/     página da campanha de Natal 2026 (gerada)
entreemcampo/            cópia fiel da página da campanha Entre em Campo do site antigo (WordPress/Elementor), mesmo endereço
404.html                 página de erro (noindex, caminhos absolutos)
styleguide.html          guia visual para revisão (não vai para buscadores)
css/style.css            estilos, mobile first (breakpoints 640px, 960px)
js/main.js               rolagem suave, header, menu, reveals, contadores, linha do tempo, princípios, mídia, formulário
js/pontos-page.js        lista, mapa (Leaflet + OpenStreetMap) e lembrete na agenda
js/chat.js               chat de boas-vindas (pede nome e WhatsApp antes do contato)
js/video.js              player do vídeo do YouTube com controles do site
js/campanha.js           galeria e animações das páginas de campanha
js/pontos.js             DADOS dos pontos de coleta
js/config.js             CONFIG: projeto e chave pública do Supabase
supabase/                SQL da tabela de doadores, gatilho da planilha e passo a passo
planilha/                Apps Script da planilha Google de doadores e passo a passo
assets/                  logo, favicon, ícone do iPhone e imagem de compartilhamento
design/                  logo original, recorte do logo e gerador da imagem de compartilhamento
```

Bibliotecas por CDN, com versão fixa: GSAP 3.12.5 + ScrollTrigger (cdnjs), Lenis 1.1.13 e Leaflet 1.9.4 (unpkg).

## Rodar localmente

```bash
python3 -m http.server 4330
```

Depois é só abrir http://localhost:4330.

## Tarefas comuns

### Ligar o Supabase (contatos de doadores)
Siga [supabase/LEIA-ME.md](supabase/LEIA-ME.md): rode o `doadores.sql` no SQL Editor e cole a chave **pública** em `js/config.js`. **Enquanto `supabaseKey` estiver vazio, os contatos não são salvos** (o formulário funciona e o console avisa). Nunca use a `service_role`/`secret` no site.

### Planilha Google de doadores
Cada contato também vira uma linha numa planilha, com link de WhatsApp e status. Instalação em [planilha/LEIA-ME.md](planilha/LEIA-ME.md).

### Páginas de campanha (UniSATC)
A `entreemcampo/` é uma **cópia estática idêntica** da página original (HTML, CSS, imagens e scripts baixados do site antigo, com os endereços apontando para `/entreemcampo/`). Não edite à mão: ela fica como foi publicada pela turma.

A página `abrace-uma-historia/` é **gerada**: o conteúdo fica em `design/paginas/*.html` e o topo, menu, rodapé, chat e formulário vêm do `index.html`. Depois de mudar qualquer um deles, rode:

```bash
python3 design/gerar-paginas-campanha.py
```

Para uma campanha nova: copie um modelo de `design/paginas/`, inclua a pasta em `PAGINAS` no gerador, coloque as imagens em `assets/campanhas/<nome>/` e adicione um cartão na seção **Campanhas** do `index.html` (a mais recente primeiro). Parceiros e equipe ficam em listas no próprio gerador.

### Medidor da campanha Abrace uma História
Os números da arrecadação e os pontos de coleta da campanha ficam em `dados/abrace-uma-historia.json`. Para atualizar, edite o arquivo no GitHub (ícone de lápis): mude o `arrecadado` de cada item e a data `atualizado_em` (DD/MM/AAAA), e faça o commit. A Vercel publica sozinha e a página lê o arquivo novo, sem rodar o gerador.
- Um medidor por item (quilo, litro e unidade não se somam). Todos começam em 0: nunca preencha número estimado.
- Os dois itens mais longe da meta ganham o selo "precisamos mais"; item que bate a meta mostra "Meta atingida, obrigado!".
- Ponto de coleta ainda não confirmado: use `"confirmado": false` e ele aparece com o selo "a confirmar".

### Medição de acessos e UTM
O site carrega o Vercel Web Analytics (sem cookies) quando está na Vercel. Para ver os dados, ative em Vercel > projeto > Analytics. Os links divulgados devem levar `utm_source`, `utm_medium` e `utm_campaign`, por exemplo `?utm_source=instagram&utm_medium=stories&utm_campaign=abrace`. O canal também vai junto do contato salvo (coluna `origem`). Para usar o Google Analytics 4, coloque o ID em `googleAnalyticsId` no `js/config.js`.

### Banner do topo (hero)
O topo da página principal abre no banner da campanha atual, que fica 10 s, e depois alterna com o institucional (7 s). O tempo de cada slide fica em `data-duracao` e o slide de abertura é o que tem `data-inicial`. Para trocar a campanha, edite o slide da campanha em `index.html` e o rótulo do botão no `hero-pager`.

### Incluir ou alterar um ponto de coleta
Edite `js/pontos.js`. A lista e o mapa se montam sozinhos; com mais de um ponto, o mapa enquadra todos. Coordenadas: no Google Maps, clique com o botão direito no local e copie.

### Trocar os placeholders por fotos
Os blocos `<div class="ph" data-label="Foto: ...">` marcam onde entra cada foto. Troque por:

```html
<img src="assets/fachada-sede-960.webp" alt="Fachada da sede da Cruz Vermelha Criciúma" width="960" height="720" loading="lazy">
```

Na linha do tempo, não mexa no HTML: preencha `data-photo-src="assets/..."` no `<li class="tl-event">` (o `data-photo-label` vira o texto alternativo). Exporte em WebP, com até 1600 px no lado maior. A foto do hero não deve ter `loading="lazy"`.

### Logo
O logo oficial da Cruz Vermelha Brasileira foi recortado do fundo branco por `design/recortar-logo.py` (entrada: `design/logo-cvb-original.jpg`). Ele gera `assets/logo-cruz-vermelha-*.png/webp`, o `favicon-48.png` e o `apple-touch-icon.png`. Se a filial mandar uma versão própria (de preferência em SVG ou PNG transparente), troque o original e rode:

```bash
python3 design/recortar-logo.py && python3 design/gerar-imagens.py
```

No site o logo fica sobre um disco branco (`.logo__img`), para não sumir nos fundos escuros.

### Publicação e domínio
- O site oficial é **https://www.cruzvermelhacriciuma.org.br**, publicado pela Vercel a cada push na branch `main`. O endereço sem `www` redireciona para ele.
- O DNS do domínio está no Cloudflare (registro no Registro.br). Não troque os servidores DNS sem recriar antes os registros de e-mail (MX, `mail`, `webmail`, `cpanel`, `autodiscover`, SPF e DMARC).
- `cruz-vermelha-criciuma.vercel.app` redireciona para o domínio (`vercel.json`) e a cópia antiga no GitHub Pages também (início do `js/main.js`).

### SEO e GEO (buscadores e assistentes de IA)
- Cada página tem título, descrição, `canonical`, Open Graph e dados estruturados (JSON-LD). Na página inicial: organização (NGO), site e perguntas frequentes (FAQPage, o mesmo texto da seção "Perguntas frequentes"). Nas demais: página e trilha de navegação.
- `sitemap.xml` lista as páginas públicas; atualize o `lastmod` quando mudar uma página.
- `robots.txt` libera buscadores e assistentes de IA e aponta o sitemap.
- `llms.txt` é o resumo do site para assistentes de IA (ChatGPT, Claude, Perplexity). Mantenha endereço, horário e contato iguais aos da página.
- Search Console: propriedade de prefixo de URL `https://www.cruzvermelhacriciuma.org.br/`, verificada pela meta tag `google-site-verification` no `index.html`; envie o `sitemap.xml` em Sitemaps.

## O que já está feito

- **SEO local:** title e description por página, um H1 por página, JSON-LD `NGO` (endereço, coordenadas, CNPJ, fundação, horário, Instagram), Open Graph e Twitter Card com imagem 1200×630, `robots.txt` e `sitemap.xml`.
- **Acessibilidade:** link "pular para o conteúdo", foco visível, modal com foco preso e Esc, campos com rótulo e mensagens de erro anunciadas, hierarquia de títulos sem saltos. Todas as combinações de cor de texto passam de 4,5:1.
- **Movimento:** com "reduzir movimento" ativo no aparelho, tudo aparece sem animação e sem rolagem suave. Sem JavaScript, o conteúdo inteiro continua visível.
- **Privacidade:** consentimento obrigatório (LGPD), campo isca contra robôs, nada de dados pessoais na URL. Só o primeiro nome fica na sessão do navegador, para a saudação.
- **Peso da página principal:** cerca de 150 KB comprimidos, sem contar fotos (HTML 14 KB, CSS 14 KB, JS próprio 8 KB, bibliotecas 50 KB).

## Pendências com a filial

**Campanha Abrace uma História**
- [ ] Período exato (hoje o site diz "Campanha de Natal 2026", tirado do spot de rádio).
- [ ] Pontos de coleta além da sede, se houver.
- [ ] Meta de arrecadação (para uma barra de progresso).
- [ ] Fotos reais da ação.
- [ ] Autorização das 7 alunas para os nomes nos créditos.

**Campanha Entre em Campo**
- [ ] Datas e resultado para o cartão da página principal (hoje: "maio e junho de 2026", pelas datas dos arquivos do site antigo). A página em si é a cópia fiel do original.

**Geral**

Detalhes e fontes no `CONTEUDO.md` (documento interno, fora do repositório).

- [ ] **Pix:** uma matéria de 2024 cita Pix no CNPJ para a Fábrica de Fraldas. O site diz "não pedimos doações em dinheiro". Confirmar a regra atual.
- [x] **Logo:** logo oficial da CVB aplicado (fundo removido).
- [ ] **Fotos:** fachada, Fábrica de Fraldas, voluntários, triagem, entrega de quinta (sem rostos), comboio do RS e uma foto antiga da filial.
- [ ] **Pino do mapa:** está no ponto da rua dado pelo OpenStreetMap. Ajustar para o número 15 em `js/pontos.js`.
- [ ] **CEP:** o CNPJ registra 88805-228, o OpenStreetMap dá 88805-085 para a rua.
- [ ] **Farmácia Solidária, primeiros socorros e kits para bebês:** confirmar se seguem ativos. Medicamentos estão fora da lista "o que doar" até lá.
- [ ] **Reforma da sede** (junho de 2025): ainda precisam de tinta, portas e pisos?
- [ ] **Pontos de coleta parceiros**, se houver.
- [ ] **Uso dos nomes dos parceiros** na seção "Quem caminha com a gente" e autorização para logos.
- [x] **Supabase:** tabela `doadores` criada e chave pública em `js/config.js` (testado em 14/10/2026: inserção 201; leitura, exclusão e envios inválidos bloqueados).
- [x] **Planilha Google:** script instalado, app da Web publicado e gatilho do Supabase criado (testado ponta a ponta em 15/10/2026).
- [ ] **Compartilhamento da planilha:** deixar como Restrito e liberar só a equipe (ela guarda nomes e telefones).
