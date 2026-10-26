"""Gera as páginas das campanhas a partir de design/paginas/*.html.

Uso, na raiz do projeto:  python3 design/gerar-paginas-campanha.py

Cada página recebe o mesmo topo, menu, rodapé, chat e formulário de doação da página principal
(copiados do index.html), com os caminhos ajustados para a pasta da campanha.
Rode de novo sempre que mudar o menu, o rodapé ou o chat no index.html.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://www.cruzvermelhacriciuma.org.br/'  # trocar junto com o domínio (README)

# Páginas: modelo -> pasta publicada
PAGINAS = {
    'abrace-uma-historia.html': 'abrace-uma-historia',
    # entreemcampo/ não é gerada: é a cópia fiel da página da campanha no site antigo
}

# Abrace uma História ----------------------------------------------------------
PARCEIROS_ABRACE = [  # (nome, arquivo do logo em assets/campanhas/abrace/parceiros/ ou None = só o nome)
    ('AGM Móveis Sob Medida', 'agm-moveis'), ('Day Art', 'day-art'), ('Le Fil Uniformes', 'le-fil'),
    ('Toro Outdoors', 'toro-midia'), ('Gráfica Padrão', 'grafica-padrao'), ('Mais Cor Comunicação Visual', 'mais-cor'),
    ('Criciúma Esporte Clube', 'criciuma-ec'), ('Gráfica Exterval', None), ('Impacto LED', None),
    ('Silti Construtora', 'silti'), ('Ney Lopes Outdoor', None), ('Criciúma Shopping', 'criciuma-shopping'),
    ('Engeplus', 'engeplus'),
]
LOGOS_CLAROS = {'engeplus'}  # logo branco: vai em cartão escuro
# Turma de Publicidade e Propaganda da UniSATC, por área (lista enviada pela turma).
# (nome, função, perfil): o perfil é "@usuario" do Instagram ou o link completo (LinkedIn etc.). Vazio = nome sem link.
EQUIPE_ABRACE = [
    ('Coordenação', 'vermelho', [
        ('Débora Casagrande', 'captação', '@debs_casagrande'),
        ('Gabriele Patrício', 'redes sociais', '@gabrielepatriciio'),
        ('Júlia Machado', 'design', '@juliamgabriel'),
        ('Júlia Schulter Manique Barreto', 'design', 'https://www.linkedin.com/in/j%C3%BAlia-schulter-manique-barreto-04bb7736a'),
        ('Karolayn', 'eventos e patrocínio', '@karollmachaado'),
        ('Letícia Ghisi', 'redação', '@leticia.ghisii'),
        ('Nathalia Zanellato', 'design', '@nathaliazzanellato'),
        ('Pietra', 'guerrilha', ''),
    ]),
    ('Design', 'verde', [
        ('Amanda Araujo', '', ''),
        ('Beatriz Topanotti', '', '@beatriztopanotti'),
        ('Inaiá', '', '@inaia_roncari'),
        ('Jose', '', ''),
        ('Julia Gerber', '', '@visuals_byjulia'),
        ('Lucas de Bithencourt', '', ''),
        ('Maria Eduarda Anzolin', '', 'https://www.linkedin.com/in/maria-eduarda-anzolin-411075336/'),
        ('Nathieli Velho Lopes', '', '@nathieli_vl'),
        ('Valéria Ferreira Mendes', '', 'https://www.linkedin.com/in/val%C3%A9ria-ferreira-mendes-616365348/'),
    ]),
    ('Site', 'rosa', [
        ('Lucas de Bithencourt', '', ''),
        ('Vinicius Raupp', '', ''),
        ('Vítor Raupp', '', '@ovitorraupp'),
    ]),
    ('Redação', 'rosa', [
        ('Jessica', '', '@jessica.loureiroo'),
        ('Lara', '', ''),
        ('Letícia Dieckes', '', ''),
        ('Lia', '', '@liakouketsu'),
        ('Loise Ritieri', '', '@loiseritieri'),
        ('Ricardo', '', '@ricardo.machadoo'),
    ]),
    ('Captação e edição de vídeo', 'amarelo', [
        ('Aguinaldo', 'edição', ''),
        ('Anna Clara Pomini', 'captação e edição', '@annapomini'),
        ('Arthur', 'edição', ''),
        ('Davi', 'edição', ''),
        ('Eduarda Sonemann', 'captação', '@dudasonemann'),
        ('Elen Maria', 'captação', '@elenmariafs'),
        ('Gabrieli Pires', 'edição', '@gabip_digital'),
        ('Bella Machado', 'captação', ''),
        ('Júlia Farias', 'captação', ''),
        ('Maria Eduarda Colombo', 'edição', '@dudaa_colomboo'),
        ('Maria Luiza', 'edição', 'https://www.linkedin.com/in/maria-luiza-b38036334'),
        ('Roberta', 'edição', '@robertaa_bloemer'),
        ('Tainá', 'edição', ''),
    ]),
    ('Relacionamento e tecnologia', 'vermelho', [
        ('Alice Nava Lenhani', 'RP', '@alicelenhanii'),
        ('Vítor Raupp', 'RP e assessoria', '@ovitorraupp'),
        ('Ana Julia', 'WhatsApp', ''),
        ('Maria Eduarda Neto', 'WhatsApp', ''),
        ('Keila Bez', 'programação', '@keilabez_'),
    ]),
]

E = html.escape


def bloco(s, inicio, fim, incluir_fim=False):
    a = s.index(inicio)
    b = s.index(fim, a)
    return s[a:b + (len(fim) if incluir_fim else 0)]


def ajustar_caminhos(trecho, base):
    """Trechos copiados do index.html: âncoras viram links para a página principal e arquivos ganham o prefixo."""
    trecho = re.sub(r'href="#(?!i-|conteudo)(topo)"', 'href="' + base + 'index.html"', trecho)
    trecho = re.sub(r'href="#(?!i-|conteudo)([a-z-]+)"', r'href="' + base + r'index.html#\1"', trecho)
    # Qualquer caminho relativo (arquivos, páginas e pastas de campanha) ganha o prefixo da pasta
    trecho = re.sub(r'(href|src|action|poster)="(?!https?:|#|/|mailto:|tel:|data:|\.\./|index\.html)([^"]+)"', r'\1="' + base + r'\2"', trecho)
    trecho = re.sub(r'srcset="([^"]+)"', lambda m: 'srcset="' + re.sub(r'(^|, )assets/', r'\1' + base + 'assets/', m.group(1)) + '"', trecho)
    return trecho


def atualizar_pontos(topo_index, modal_index):
    """Leva o menu e o formulário de doação do index.html para pontos-de-coleta.html (mesma pasta)."""
    caminho = ROOT / 'pontos-de-coleta.html'
    pagina = caminho.read_text(encoding='utf-8')
    antigo = bloco(pagina, '  <header class="site-header">', '  <main id="conteudo">')
    pagina = pagina.replace(antigo, ajustar_caminhos(topo_index, ''))
    # Formulário: troca o bloco se já existir, senão entra antes dos scripts
    modal = ajustar_caminhos(modal_index, '')
    if '  <!-- Modal de doação.' in pagina:
        pagina = pagina.replace(bloco(pagina, '  <!-- Modal de doação.', '  <script src='), modal)
    else:
        i = pagina.index('  <script src=')
        pagina = pagina[:i] + modal + pagina[i:]
    if 'js/config.js' not in pagina:
        pagina = pagina.replace('  <script src="js/main.js" defer></script>', '  <script src="js/config.js" defer></script>\n  <script src="js/main.js" defer></script>')
    caminho.write_text(pagina, encoding='utf-8')
    print('menu e formulário atualizados:', caminho.relative_to(ROOT))


def parceiros_abrace(base):
    linhas = []
    for nome, arq in PARCEIROS_ABRACE:
        if not arq:  # logo ainda não enviado: cartão com o nome
            linhas.append(f'          <li class="logo-grid__item logo-grid__item--nome" data-reveal="scale"><span>{E(nome)}</span></li>')
            continue
        extra = ' logo-grid__item--escuro' if arq in LOGOS_CLAROS else ''
        linhas.append(f'          <li class="logo-grid__item{extra}" data-reveal="scale"><img src="{base}assets/campanhas/abrace/parceiros/{arq}.webp" alt="{E(nome)}" loading="lazy"></li>')
    return '\n'.join(linhas)


def perfil_url(perfil):
    if not perfil:
        return ''
    if perfil.startswith('@'):
        return 'https://www.instagram.com/' + perfil[1:] + '/'
    return perfil if perfil.startswith('http') else 'https://' + perfil


FORA_DA_TURMA = {'Vinicius Raupp'}  # aparecem nos créditos, mas não contam no "turma de N estudantes"


def total_equipe(grupos):
    return len({nome for _, _, pessoas in grupos for nome, _, _ in pessoas} - FORA_DA_TURMA)


def equipe(grupos):
    blocos = []
    for area, cor, pessoas in grupos:
        itens = []
        for nome, funcao, perfil in pessoas:
            extra = f'<small>{E(funcao)}</small>' if funcao else ''
            url = perfil_url(perfil)
            if url:
                rede = 'LinkedIn' if 'linkedin.com' in url else 'Instagram'
                itens.append(f'              <li><a href="{E(url)}" target="_blank" rel="noopener" title="{E(nome)} no {rede}">{E(nome)}{extra}<svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></a></li>')
            else:
                itens.append(f'              <li>{E(nome)}{extra}</li>')
        blocos.append(f'''          <div class="camp-team__group camp-team__group--{cor}" data-reveal>
            <h3>{E(area)} <span>{len(pessoas)}</span></h3>
            <ul class="camp-team__names">
{chr(10).join(itens)}
            </ul>
          </div>''')
    return '\n'.join(blocos)


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

    atualizar_pontos(topo, modal)

    for modelo, pasta in PAGINAS.items():
        meta, corpo = ler_modelo(ROOT / 'design' / 'paginas' / modelo)
        base = '../'
        url = SITE + pasta + '/'
        extra = meta.get('fonts')
        familia_extra = extra.split(':')[0] if extra else None
        familias = fontes + (('&family=' + extra) if extra and ('family=' + familia_extra) not in ('family=' + fontes) else '')
        corpo = (corpo.replace('{{BASE}}', base)
                 .replace('{{PARCEIROS_ABRACE}}', parceiros_abrace(base))
                 .replace('{{EQUIPE_ABRACE}}', equipe(EQUIPE_ABRACE))
                 .replace('{{TOTAL_EQUIPE}}', str(total_equipe(EQUIPE_ABRACE)))
                 )
        assert '{{' not in corpo, f'marcador sem valor em {modelo}'

        # Dados estruturados: página, trilha (início > campanha) e ligação com a organização da página inicial
        dados_estruturados = json.dumps({
            '@context': 'https://schema.org',
            '@graph': [
                {'@type': 'WebPage', '@id': url + '#pagina', 'url': url, 'name': meta['title'],
                 'description': meta['description'], 'inLanguage': 'pt-BR',
                 'isPartOf': {'@id': SITE + '#site'}, 'about': {'@id': SITE + '#organizacao'},
                 'primaryImageOfPage': SITE + meta['og'], 'breadcrumb': {'@id': url + '#trilha'}},
                {'@type': 'BreadcrumbList', '@id': url + '#trilha', 'itemListElement': [
                    {'@type': 'ListItem', 'position': 1, 'name': 'Início', 'item': SITE},
                    {'@type': 'ListItem', 'position': 2, 'name': meta.get('breadcrumb', meta['title']), 'item': url}]},
            ]}, ensure_ascii=False)
        tem_mapa = meta.get('mapa') == 'sim'
        # Depois do formulário de doação, a pessoa vai para esta âncora da própria página (senão, pontos de coleta)
        destino = f' data-doacao-destino="{meta["destino_doacao"]}"' if meta.get('destino_doacao') else ''
        leaflet_css = '\n  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">' if tem_mapa else ''
        leaflet_js = '  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" defer></script>\n' if tem_mapa else ''
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
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="{E(meta.get('og_alt', meta['title']))}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{E(meta['title'])}">
  <meta name="twitter:description" content="{E(meta['description'])}">
  <meta name="twitter:image" content="{SITE}{meta['og']}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="geo.region" content="BR-SC">
  <meta name="geo.placename" content="Criciúma">
  <script type="application/ld+json">
  {dados_estruturados}
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family={familias}&display=swap" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family={familias}&display=swap"></noscript>
  <link rel="stylesheet" href="{base}css/style.css">{leaflet_css}
</head>
<body class="{meta['bodyclass']}"{destino}>
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
  <script src="https://cruzvermelha-arrecadacao.vercel.app/metas-v1.js" integrity="sha384-wrpi6uuGhlFxLSSNIdnVRuA+UVDXBOTMp+s9M2NRz2BvacPO/I+YkTujN238FAQW" crossorigin="anonymous" defer></script>
{leaflet_js}  <script src="{base}js/campanha.js" defer></script>
</body>
</html>
'''
        destino = ROOT / pasta / 'index.html'
        destino.parent.mkdir(exist_ok=True)
        destino.write_text(pagina, encoding='utf-8')
        print('gerado:', destino.relative_to(ROOT))


if __name__ == '__main__':
    main()
