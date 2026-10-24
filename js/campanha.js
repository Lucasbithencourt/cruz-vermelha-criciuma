// Cruz Vermelha Criciúma · interações das páginas de campanha.
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Galeria de peças: passa sozinha, em loop, sem fim ---------------------- */
  // As peças são duplicadas uma vez; quando a rolagem passa da primeira volta, recua o tamanho
  // de uma volta e ninguém percebe a emenda. Para com o mouse em cima, com o foco, ao arrastar,
  // fora da tela e no botão de pausa. Com movimento reduzido, fica parada (as setas continuam).

  var gallery = document.querySelector('[data-gallery]');
  if (gallery) {
    var VELOCIDADE = 38; // px por segundo
    var originais = Array.prototype.slice.call(gallery.children);
    originais.forEach(function (fig) {
      var copia = fig.cloneNode(true);
      copia.setAttribute('aria-hidden', 'true');
      copia.setAttribute('data-copia', '');
      copia.querySelectorAll('video').forEach(function (v) { v.setAttribute('preload', 'none'); });
      gallery.appendChild(copia);
    });
    gallery.classList.add('is-loop');

    var volta = 0; // largura de uma volta completa
    var medir = function () {
      var primeiraCopia = gallery.querySelector('[data-copia]');
      volta = primeiraCopia.offsetLeft - originais[0].offsetLeft;
    };
    medir();
    window.addEventListener('resize', medir);
    gallery.querySelectorAll('img').forEach(function (img) { if (!img.complete) img.addEventListener('load', medir); });

    var pos = 0; // posição com casas decimais (o scrollLeft arredonda)
    var normalizar = function () {
      if (volta <= 0) return;
      if (pos >= volta) pos -= volta;
      if (pos < 0) pos += volta;
      gallery.scrollLeft = pos;
    };

    var pausado = reduceMotion;
    var segurando = false; // mouse em cima, foco, arrastando ou fora da tela
    var esperaAte = 0;     // depois de um toque ou de uma seta, espera um pouco antes de voltar a andar
    var animSeta = null;   // deslocamento suave das setas
    var ultimo = null;

    var tique = function (agora) {
      var dt = ultimo === null ? 0 : Math.min(agora - ultimo, 100);
      ultimo = agora;
      if (animSeta) {
        var t = Math.min((agora - animSeta.inicio) / 650, 1);
        var e = 1 - Math.pow(1 - t, 3);
        pos = animSeta.de + (animSeta.para - animSeta.de) * e;
        normalizar();
        if (t >= 1) { animSeta = null; esperaAte = agora + 1500; }
      } else if (!pausado && !segurando && agora > esperaAte) {
        pos += VELOCIDADE * dt / 1000;
        normalizar();
      }
      requestAnimationFrame(tique);
    };
    requestAnimationFrame(tique);

    // Setas: um item por vez, no mesmo loop
    var step = function (dir) {
      var item = originais[0];
      var dist = item ? item.getBoundingClientRect().width + 16 : 300;
      if (pos < dist && dir < 0) pos += volta; // voltar do começo sem bater na borda
      animSeta = { de: pos, para: pos + dir * dist, inicio: performance.now() };
      if (reduceMotion) { pos = animSeta.para; normalizar(); animSeta = null; }
    };
    var prev = document.querySelector('[data-gallery-prev]');
    var next = document.querySelector('[data-gallery-next]');
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
    gallery.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    });

    // Botão de pausa
    var pauseBtn = document.querySelector('[data-gallery-pause]');
    var marcarPausa = function (p) {
      pausado = p;
      if (!pauseBtn) return;
      pauseBtn.setAttribute('aria-pressed', String(p));
      pauseBtn.setAttribute('aria-label', p ? 'Retomar a passagem das peças' : 'Pausar a passagem das peças');
    };
    if (pauseBtn) pauseBtn.addEventListener('click', function () { marcarPausa(!pausado); });
    marcarPausa(pausado);

    gallery.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') segurando = true; });
    gallery.addEventListener('pointerleave', function () { segurando = false; });
    gallery.addEventListener('focusin', function () { segurando = true; });
    gallery.addEventListener('focusout', function () { segurando = false; });

    // Toque no celular: a rolagem nativa manda; depois retoma de onde a pessoa deixou
    gallery.addEventListener('touchstart', function () { segurando = true; }, { passive: true });
    gallery.addEventListener('touchend', function () { segurando = false; esperaAte = performance.now() + 2500; }, { passive: true });
    gallery.addEventListener('scroll', function () {
      if (segurando || down) { pos = gallery.scrollLeft; if (pos >= volta || pos <= 0) normalizar(); }
    }, { passive: true });

    // Arrastar com o mouse no computador
    var down = false, startX = 0, startLeft = 0, moved = false;
    gallery.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; startX = e.clientX; startLeft = pos;
      gallery.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      pos = startLeft - dx;
      normalizar();
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      gallery.classList.remove('is-dragging');
      esperaAte = performance.now() + 1200;
    });
    gallery.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);

    // Fora da tela, não anda
    if ('IntersectionObserver' in window) {
      var foraDaTela = false;
      new IntersectionObserver(function (entries) {
        foraDaTela = !entries[0].isIntersecting;
        if (foraDaTela) segurando = true; else if (!gallery.matches(':hover') && !gallery.contains(document.activeElement)) segurando = false;
      }).observe(gallery);
    }
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

    var temCoord = function (p) { return isFinite(parseFloat(p.lat)) && isFinite(parseFloat(p.lng)); };

    var desenharPontos = function (pontos) {
      var lista = document.querySelector('[data-pontos-lista]');
      if (!lista || !pontos || !pontos.length) return;
      lista.innerHTML = pontos.map(function (p, i) {
        var rota = temCoord(p)
          ? '<a class="ab-ponto__rota" href="https://www.google.com/maps/dir/?api=1&amp;destination=' + parseFloat(p.lat) + ',' + parseFloat(p.lng) + '" target="_blank" rel="noopener">Como chegar <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></a>'
          : '';
        return '<li class="ab-ponto"' + (temCoord(p) ? ' data-ponto="' + i + '"' : '') + '><h3>' + esc(p.nome) + (p.confirmado === false ? '<span class="ab-ponto__selo">a confirmar</span>' : '') + '</h3>' +
          (p.endereco ? '<p><svg class="icon" aria-hidden="true"><use href="#i-pin"/></svg>' + esc(p.endereco) + '</p>' : '') +
          (p.horario ? '<p><svg class="icon" aria-hidden="true"><use href="#i-clock"/></svg>' + esc(p.horario) + '</p>' : '') + rota + '</li>';
      }).join('');
      desenharMapa(pontos, lista);
    };

    // Mapa (Leaflet + OpenStreetMap), igual ao da página de pontos de coleta
    var desenharMapa = function (pontos, lista) {
      var mapEl = document.querySelector('[data-pontos-mapa]');
      var noMapa = pontos.filter(temCoord);
      if (!mapEl || typeof window.L === 'undefined' || !noMapa.length) return;
      mapEl.hidden = false;
      var L = window.L;
      var map = L.map(mapEl, { scrollWheelZoom: false });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      var marcadores = {};
      pontos.forEach(function (p, i) {
        if (!temCoord(p)) return;
        var icone = L.divIcon({ className: 'map-pin' + (i === 0 ? ' map-pin--main' : ''), html: '<span></span>', iconSize: [28, 28], iconAnchor: [14, 14] });
        marcadores[i] = L.marker([parseFloat(p.lat), parseFloat(p.lng)], { icon: icone, title: p.nome }).addTo(map)
          .bindPopup('<strong>' + esc(p.nome) + '</strong>' + (p.endereco ? '<br>' + esc(p.endereco) : '') + (p.horario ? '<br><em>' + esc(p.horario) + '</em>' : ''));
      });
      var lista_m = Object.keys(marcadores).map(function (k) { return marcadores[k]; });
      if (lista_m.length === 1) map.setView(lista_m[0].getLatLng(), 16);
      else map.fitBounds(L.featureGroup(lista_m).getBounds().pad(0.25));

      // Clicar no cartão centraliza o ponto no mapa
      lista.querySelectorAll('[data-ponto]').forEach(function (li) {
        li.addEventListener('click', function (e) {
          if (e.target.closest('a')) return;
          var m = marcadores[li.dataset.ponto];
          lista.querySelectorAll('.is-ativo').forEach(function (x) { x.classList.remove('is-ativo'); });
          li.classList.add('is-ativo');
          map.flyTo(m.getLatLng(), 16, { duration: reduceMotion ? 0 : 0.8 });
          m.openPopup();
        });
      });
      // O mapa nasce dentro de uma seção que pode estar animando: recalcula o tamanho quando aparece
      setTimeout(function () { map.invalidateSize(); }, 400);
    };

    // Dois endereços: data-src-local é o arquivo do site (dados/abrace-uma-historia.json) e data-src é de onde
    // vêm os números. O sistema de arrecadação (metas-v1.js) troca o data-src pelo endereço dele.
    // Números: do sistema quando ele responde; se cair ou demorar, do arquivo do site.
    // Pontos de coleta: sempre do arquivo do site, que é quem a equipe do site mantém.
    var srcLocal = metas.dataset.srcLocal || metas.dataset.src;
    var srcNumeros = metas.dataset.src;
    var buscar = function (url, limite) {
      var controle = limite && 'AbortController' in window ? new AbortController() : null;
      var timer = controle && setTimeout(function () { controle.abort(); }, limite);
      return fetch(url, { cache: 'no-cache', signal: controle ? controle.signal : undefined })
        .then(function (r) {
          if (timer) clearTimeout(timer);
          if (!r.ok) throw new Error(r.status);
          return r.json();
        }, function (err) { if (timer) clearTimeout(timer); throw err; });
    };
    var local = buscar(srcLocal);
    var numeros = srcNumeros === srcLocal ? local : buscar(srcNumeros, 6000).catch(function (err) {
      console.warn('Sistema de arrecadação não respondeu; usando os números do arquivo do site.', err);
      return local;
    });

    numeros
      .then(function (dados) {
        desenharMetas(dados);
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      })
      .catch(function (err) {
        console.error('Medidor da campanha não carregou:', err);
        metas.querySelector('[data-metas-data]').textContent = 'Não foi possível carregar os números agora.';
      });

    local
      .then(function (dados) {
        desenharPontos(dados.pontos_de_coleta);
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      })
      .catch(function (err) { console.error('Pontos de coleta não carregaram:', err); });
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
