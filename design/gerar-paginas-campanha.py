"""Gera as páginas das campanhas a partir de design/paginas/*.html.

Uso, na raiz do projeto:  python3 design/gerar-paginas-campanha.py

Cada página recebe o mesmo topo, menu, rodapé, chat e formulário de doação da página principal
(copiados do index.html), com os caminhos ajustados para a pasta da campanha.
Rode de novo sempre que mudar o menu, o rodapé ou o chat no index.html.
"""
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://lucasbithencourt.github.io/cruz-vermelha-criciuma/'  # trocar junto com o domínio (README)

# Páginas: modelo -> pasta publicada
PAGINAS = {
    'abrace-uma-historia.html': 'abrace-uma-historia',
    # entreemcampo/ não é gerada: é a cópia fiel da página da campanha no site antigo
}

# Abrace uma História ----------------------------------------------------------
PARCEIROS_ABRACE = [
    ('AGM Móveis', 'agm-moveis'), ('Criciúma EC', 'criciuma-ec'), ('Day Art', 'day-art'),
    ('Engeplus', 'engeplus'), ('Gráfica Padrão', 'grafica-padrao'), ('SATC', 'satc'),
    ('Silti Construtora', 'silti'), ('Zanette Centro de Saúde Visual', 'tiago-zanette'),
    ('Toro Mídia', 'toro-midia'), ('Le Fil Uniformes', 'le-fil'),
]
LOGOS_CLAROS = {'engeplus'}  # logo branco: vai em cartão escuro
EQUIPE_ABRACE = ['Ana Júlia Manarin', 'Jéssica Loureiro', 'Letícia Ghisi', 'Maria Eduarda Anzolin',
                 'Maria Eduarda Neto', 'Nathalia Zanellato', 'Valéria Ferreira']

E = html.escape


def bloco(s, inicio, fim, incluir_fim=False):
    a = s.index(inicio)
    b = s.index(fim, a)
    return s[a:b + (len(fim) if incluir_fim else 0)]


def ajustar_caminhos(trecho, base):
    """Trechos copiados do index.html: âncoras viram links para a página principal e arquivos ganham o prefixo."""
    trecho = re.sub(r'href="#(?!i-|conteudo)(topo)"', 'href="' + base + 'index.html"', trecho)
    trecho = re.sub(r'href="#(?!i-|conteudo)([a-z-]+)"', r'href="' + base + r'index.html#\1"', trecho)
    trecho = re.sub(r'(href|src|action|poster)="(assets/|css/|js/|pontos-de-coleta\.html)', r'\1="' + base + r'\2', trecho)
    trecho = re.sub(r'srcset="([^"]+)"', lambda m: 'srcset="' + re.sub(r'(^|, )assets/', r'\1' + base + 'assets/', m.group(1)) + '"', trecho)
    return trecho


def parceiros_abrace(base):
    linhas = []
    for nome, arq in PARCEIROS_ABRACE:
        extra = ' logo-grid__item--escuro' if arq in LOGOS_CLAROS else ''
        linhas.append(f'          <li class="logo-grid__item{extra}" data-reveal="scale"><img src="{base}assets/campanhas/abrace/parceiros/{arq}.webp" alt="{E(nome)}" loading="lazy"></li>')
    return '\n'.join(linhas)


def nomes(lista, tag_numero=False):
    linhas = []
    for i, n in enumerate(lista, 1):
        if tag_numero:
            linhas.append(f'          <li class="ec-player" data-reveal="scale"><span class="ec-player__num" aria-hidden="true">{i}</span><span class="ec-player__name">{E(n)}</span></li>')
        else:
            linhas.append(f'          <li data-reveal="fade">{E(n)}</li>')
    return '\n'.join(linhas)


def ler_modelo(caminho):
    texto = caminho.read_text(encoding='utf-8')
    meta_txt = re.match(r'\s*<!--(.*?)-->', texto, re.S).group(1)
    meta = dict(re.findall(r'^[ \t]*(\w+):[ \t]*(.*?)[ \t]*$', meta_txt, re.M))
    corpo = texto[texto.index('-->') + 3:].strip('\n')
    return meta, corpo


def main():
    index = (ROOT / 'index.html').read_text(encoding='utf-8')
    sprite = bloco(index, '  <!-- Ícones (sprite) -->', '  <header class="site-header">')
    topo = bloco(index, '  <header class="site-header">', '  <main id="conteudo">')
    rodape = bloco(index, '  <footer class="site-footer">', '  </footer>', incluir_fim=True)
    chat = bloco(index, '  <!-- Chat de boas-vindas', '  <!-- Modal de doação.')
    modal = bloco(index, '  <!-- Modal de doação.', '  <script src=')
    fontes = re.search(r'family=([^"&]+(?:&family=[^"&]+)*)&display=swap', index).group(1)

    for modelo, pasta in PAGINAS.items():
        meta, corpo = ler_modelo(ROOT / 'design' / 'paginas' / modelo)
        base = '../'
        url = SITE + pasta + '/'
        extra = meta.get('fonts')
        familia_extra = extra.split(':')[0] if extra else None
        familias = fontes + (('&family=' + extra) if extra and ('family=' + familia_extra) not in ('family=' + fontes) else '')
        corpo = (corpo.replace('{{BASE}}', base)
                 .replace('{{PARCEIROS_ABRACE}}', parceiros_abrace(base))
                 .replace('{{EQUIPE_ABRACE}}', nomes(EQUIPE_ABRACE))
                 )
        assert '{{' not in corpo, f'marcador sem valor em {modelo}'

        pagina = f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- Gerado por design/gerar-paginas-campanha.py a partir de design/paginas/{modelo}. Edite o modelo, não este arquivo. -->
  <title>{E(meta['title'])}</title>
  <meta name="description" content="{E(meta['description'])}">
  <link rel="canonical" href="{url}">
  <meta name="theme-color" content="{meta['theme']}">
  <link rel="icon" href="{base}assets/favicon-48.png" type="image/png">
  <link rel="apple-touch-icon" href="{base}assets/apple-touch-icon.png">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="Cruz Vermelha Criciúma">
  <meta property="og:url" content="{url}">
  <meta property="og:title" content="{E(meta['title'])}">
  <meta property="og:description" content="{E(meta['description'])}">
  <meta property="og:image" content="{SITE}{meta['og']}">
  <meta name="twitter:card" content="summary_large_image">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family={familias}&display=swap" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family={familias}&display=swap"></noscript>
  <link rel="stylesheet" href="{base}css/style.css">
</head>
<body class="{meta['bodyclass']}">
  <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>

{ajustar_caminhos(sprite, base).rstrip()}

{ajustar_caminhos(topo, base).rstrip()}

{corpo}

{ajustar_caminhos(rodape, base)}

{ajustar_caminhos(chat, base).rstrip()}

{ajustar_caminhos(modal, base).rstrip()}

  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" defer></script>
  <script src="https://unpkg.com/lenis@1.1.13/dist/lenis.min.js" defer></script>
  <script src="{base}js/config.js" defer></script>
  <script src="{base}js/main.js" defer></script>
  <script src="{base}js/chat.js" defer></script>
  <script src="{base}js/campanha.js" defer></script>
</body>
</html>
'''
        destino = ROOT / pasta / 'index.html'
        destino.parent.mkdir(exist_ok=True)
        destino.write_text(pagina, encoding='utf-8')
        print('gerado:', destino.relative_to(ROOT))


if __name__ == '__main__':
    main()
