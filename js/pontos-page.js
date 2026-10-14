// Cruz Vermelha Criciúma · página de pontos de coleta: saudação, lista, mapa e lembrete na agenda.
(function () {
  var pontos = window.CV_PONTOS || [];
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Saudação com o primeiro nome digitado no formulário -------------------- */

  var title = document.querySelector('[data-thanks-title]');
  var nome = null;
  try { nome = sessionStorage.getItem('cv-nome'); } catch (err) {}
  if (title && nome) title.textContent = 'Obrigado, ' + nome + '!';

  /* Lembrete: próxima quinta-feira, 13h às 17h, no Google Agenda ----------- */

  function nextThursday() {
    var d = new Date();
    var diff = (4 - d.getDay() + 7) % 7;
    // Se já passou das 17h de quinta, vai para a próxima semana
    if (diff === 0 && d.getHours() >= 17) diff = 7;
    d.setDate(d.getDate() + diff);
    return d;
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function calendarUrl(ponto) {
    var d = nextThursday();
    var day = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
    var params = new URLSearchParams({
      action: 'TEMPLATE',
      text: 'Levar doação à Cruz Vermelha Criciúma',
      dates: day + 'T130000/' + day + 'T170000',
      ctz: 'America/Sao_Paulo',
      details: 'Doação de itens (alimentos, fraldas, higiene, agasalhos). A Cruz Vermelha Criciúma não pede doações em dinheiro.',
      location: ponto.endereco + ', ' + ponto.bairro + ', ' + ponto.cidade
    });
    return 'https://calendar.google.com/calendar/render?' + params.toString();
  }

  function directionsUrl(ponto) {
    var dest = ponto.endereco + ', ' + ponto.bairro + ', ' + ponto.cidade;
    return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(dest);
  }

  /* Lista ------------------------------------------------------------------- */

  var list = document.querySelector('[data-collect-list]');
  if (!list) return;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function icon(name) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS(ns, 'use');
    use.setAttribute('href', '#i-' + name);
    svg.appendChild(use);
    return svg;
  }

  var items = pontos.map(function (ponto, i) {
    var li = el('li', 'spot' + (ponto.principal ? ' spot--main' : ''));
    li.dataset.reveal = '';
    li.style.setProperty('--i', i);

    if (ponto.principal) li.appendChild(el('span', 'tag', 'Ponto principal'));
    li.appendChild(el('h3', null, ponto.nome));

    var info = el('ul', 'spot__info');
    var addr = el('li');
    addr.appendChild(icon('pin'));
    addr.appendChild(el('span', null, ponto.endereco + ' · ' + ponto.bairro + ' · ' + ponto.cidade));
    var hours = el('li');
    hours.appendChild(icon('clock'));
    hours.appendChild(el('span', null, ponto.horario));
    info.appendChild(addr);
    info.appendChild(hours);
    li.appendChild(info);

    var tags = el('ul', 'spot__items');
    tags.setAttribute('aria-label', 'Itens recebidos');
    ponto.itens.forEach(function (item) { tags.appendChild(el('li', null, item)); });
    li.appendChild(tags);

    var actions = el('div', 'spot__actions');
    var go = el('a', 'btn btn--primary');
    go.href = directionsUrl(ponto);
    go.target = '_blank';
    go.rel = 'noopener';
    go.appendChild(icon('route'));
    go.appendChild(document.createTextNode('Como chegar'));
    actions.appendChild(go);

    // A sede recebe às quintas; o lembrete só faz sentido para pontos com esse horário
    if (/quinta/i.test(ponto.horario)) {
      var remind = el('a', 'btn btn--outline');
      remind.href = calendarUrl(ponto);
      remind.target = '_blank';
      remind.rel = 'noopener';
      remind.appendChild(icon('calendar'));
      remind.appendChild(document.createTextNode('Me lembre na quinta'));
      actions.appendChild(remind);
    }
    li.appendChild(actions);

    list.appendChild(li);
    return li;
  });

  // Os cards entram com o mesmo reveal do resto do site
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    items.forEach(function (li) { io.observe(li); });
  } else {
    items.forEach(function (li) { li.classList.add('is-visible'); });
  }

  /* Mapa (Leaflet + OpenStreetMap) ----------------------------------------- */

  var mapEl = document.getElementById('mapa');
  if (!mapEl || typeof window.L === 'undefined' || !pontos.length) {
    if (mapEl) mapEl.hidden = true;
    return;
  }

  var L = window.L;
  var map = L.map(mapEl, { scrollWheelZoom: false, zoomControl: true });
  // Tiles padrão do OpenStreetMap (sem chave); o CSS deixa o mapa em tons de cinza para o pino vermelho se destacar
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  var pin = function (main) {
    return L.divIcon({
      className: 'map-pin' + (main ? ' map-pin--main' : ''),
      html: '<span></span>',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
  };

  var markers = pontos.map(function (ponto) {
    var popup = '<strong>' + ponto.nome + '</strong><br>' + ponto.endereco + ' · ' + ponto.bairro + '<br><em>' + ponto.horario + '</em>';
    return L.marker([ponto.lat, ponto.lng], { icon: pin(ponto.principal), title: ponto.nome }).addTo(map).bindPopup(popup);
  });

  if (markers.length === 1) {
    map.setView([pontos[0].lat, pontos[0].lng], 16);
  } else {
    map.fitBounds(L.featureGroup(markers).getBounds().pad(0.25));
  }

  // Clicar no card centraliza o ponto no mapa
  items.forEach(function (li, i) {
    li.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      map.flyTo(markers[i].getLatLng(), 16, { duration: reduceMotion ? 0 : 0.8 });
      markers[i].openPopup();
    });
  });
})();
