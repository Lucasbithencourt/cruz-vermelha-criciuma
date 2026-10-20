// Cruz Vermelha Criciúma · interações das páginas de campanha.
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Galeria horizontal: setas avançam um item por vez --------------------- */

  var gallery = document.querySelector('[data-gallery]');
  if (gallery) {
    var step = function (dir) {
      var item = gallery.querySelector('figure');
      var dist = item ? item.getBoundingClientRect().width + 16 : 300;
      gallery.scrollBy({ left: dir * dist, behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    var prev = document.querySelector('[data-gallery-prev]');
    var next = document.querySelector('[data-gallery-next]');
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
    gallery.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    });

    // Arrastar com o mouse no computador
    var down = false, startX = 0, startLeft = 0, moved = false;
    gallery.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; startX = e.clientX; startLeft = gallery.scrollLeft;
      gallery.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      gallery.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', function () {
      down = false;
      gallery.classList.remove('is-dragging');
    });
    gallery.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  }

  /* Estrelas e elementos que flutuam com a rolagem (data-drift = px) ------- */

  if (!reduceMotion && window.gsap && window.ScrollTrigger) {
    document.querySelectorAll('[data-drift]').forEach(function (el) {
      var sec = el.closest('section') || el.parentElement;
      window.gsap.fromTo(el, { y: 0, rotate: 0 }, {
        y: Number(el.dataset.drift) * 3,
        rotate: Number(el.dataset.drift) / 2,
        ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* Medidor de arrecadação e pontos de coleta (dados/abrace-uma-historia.json) */
  // Um medidor por item: quilo, litro e unidade não se somam. Nada de número inventado: tudo vem do JSON.

  var metas = document.querySelector('[data-metas]');
  if (metas) {
    var num = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
    var SINGULAR = { litros: 'litro', unidades: 'unidade' };
    var esc = function (t) {
      return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
    };
    var unidade = function (n, u) { return n === 1 && SINGULAR[u] ? SINGULAR[u] : u; };
    // "600 kg de café", "500 litros de leite em caixa", "500 brinquedos usados"
    var quanto = function (n, it) {
      var nome = it.item.toLowerCase();
      return it.unidade === 'unidades' ? num.format(n) + ' ' + nome : num.format(n) + ' ' + unidade(n, it.unidade) + ' de ' + nome;
    };

    var desenharMetas = function (dados) {
      var itens = (dados.itens || []).map(function (it) {
        var meta = Number(it.meta) || 0;
        var arrecadado = Math.max(Number(it.arrecadado) || 0, 0);
        return { it: it, meta: meta, arrecadado: arrecadado, pct: meta ? arrecadado / meta : 0 };
      });

      // Destaque: os dois itens mais longe da meta. Se todos estão iguais (por exemplo, no começo), nenhum.
      var abertos = itens.filter(function (x) { return x.pct < 1; });
      var urgentes = [];
      var pcts = abertos.map(function (x) { return x.pct; });
      if (abertos.length > 1 && Math.min.apply(null, pcts) !== Math.max.apply(null, pcts)) {
        urgentes = abertos.slice().sort(function (a, b) { return a.pct - b.pct; }).slice(0, 2);
      }

      metas.querySelector('[data-metas-lista]').innerHTML = itens.map(function (x) {
        var completa = x.pct >= 1;
        var urgente = urgentes.indexOf(x) > -1;
        var pctTexto = Math.floor(Math.min(x.pct, 1) * 100) + '%';
        var falta = completa
          ? 'Meta atingida, obrigado!'
          : 'Ainda falta: ' + quanto(Math.max(x.meta - x.arrecadado, 0), x.it);
        return '<li class="ab-meta' + (completa ? ' is-completa' : '') + (urgente ? ' is-urgente' : '') + '" style="--p:' + (Math.min(x.pct, 1) * 100).toFixed(1) + '%">' +
          (urgente ? '<span class="ab-meta__selo">precisamos mais</span>' : '') +
          '<div class="ab-meta__topo"><h3>' + esc(x.it.item) + (x.it.detalhe ? '<small>' + esc(x.it.detalhe) + '</small>' : '') + '</h3>' +
          '<span class="ab-meta__pct">' + pctTexto + '</span></div>' +
          '<div class="ab-meta__barra" role="progressbar" aria-label="' + esc(x.it.item) + '" aria-valuemin="0" aria-valuemax="' + x.meta + '" aria-valuenow="' + Math.min(x.arrecadado, x.meta) + '" aria-valuetext="' + esc(num.format(x.arrecadado) + ' de ' + num.format(x.meta) + ' ' + x.it.unidade) + '"><span></span></div>' +
          '<p class="ab-meta__numeros"><b>' + num.format(x.arrecadado) + '</b> / ' + num.format(x.meta) + ' ' + esc(unidade(x.meta, x.it.unidade)) + '</p>' +
          '<p class="ab-meta__falta">' + esc(falta) + '</p></li>';
      }).join('');

      metas.querySelector('[data-metas-data]').textContent = dados.atualizado_em ? 'Atualizado em ' + dados.atualizado_em : '';
      if (dados.prazo) metas.querySelector('[data-metas-prazo]').textContent = dados.prazo;

      // Antes da primeira contagem, explica os zeros em vez de deixar parecer que ninguém doou
      var aviso = metas.querySelector('[data-metas-aviso]');
      var tudoZero = itens.length && itens.every(function (x) { return x.arrecadado === 0; });
      aviso.hidden = !tudoZero;
      if (tudoZero) aviso.textContent = 'A contagem começa com as primeiras entregas. Os números são atualizados pela equipe da filial.';

      // Barras enchem quando o medidor aparece na tela
      var cards = metas.querySelectorAll('.ab-meta');
      if (reduceMotion || !('IntersectionObserver' in window)) {
        cards.forEach(function (c) { c.classList.add('is-visivel'); });
      } else {
        var obs = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            e.target.classList.add('is-visivel');
            obs.unobserve(e.target);
          });
        }, { threshold: 0.4 });
        cards.forEach(function (c, i) { c.style.transitionDelay = (i % 3) * 0.08 + 's'; obs.observe(c); });
      }
    };

    var desenharPontos = function (pontos) {
      var lista = document.querySelector('[data-pontos-lista]');
      if (!lista || !pontos || !pontos.length) return;
      lista.innerHTML = pontos.map(function (p) {
        return '<li class="ab-ponto"><h3>' + esc(p.nome) + (p.confirmado === false ? '<span class="ab-ponto__selo">a confirmar</span>' : '') + '</h3>' +
          (p.endereco ? '<p><svg class="icon" aria-hidden="true"><use href="#i-pin"/></svg>' + esc(p.endereco) + '</p>' : '') +
          (p.horario ? '<p><svg class="icon" aria-hidden="true"><use href="#i-clock"/></svg>' + esc(p.horario) + '</p>' : '') + '</li>';
      }).join('');
    };

    fetch(metas.dataset.src, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (dados) {
        desenharMetas(dados);
        desenharPontos(dados.pontos_de_coleta);
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      })
      .catch(function (err) {
        console.error('Medidor da campanha não carregou:', err);
        metas.querySelector('[data-metas-data]').textContent = 'Não foi possível carregar os números agora.';
      });
  }

  /* Vídeos em loop só tocam quando estão na tela (economiza bateria e dados) */

  var loops = document.querySelectorAll('video[autoplay][loop]');
  if ('IntersectionObserver' in window && loops.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (entry.isIntersecting && !reduceMotion) {
          if (v.preload === 'none') { v.preload = 'auto'; v.load(); }
          v.play().catch(function () {});
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.25 });
    loops.forEach(function (v) { v.removeAttribute('autoplay'); io.observe(v); });
  }
})();
