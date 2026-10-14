// Cruz Vermelha Criciúma · chat de boas-vindas.
// Aparece depois da primeira dobra, abre sozinho uma vez por visita, conversa com mensagens prontas
// e leva ao WhatsApp da filial com o texto já escrito conforme o objetivo escolhido.
(function () {
  var root = document.querySelector('[data-chat]');
  if (!root) return;

  var WHATSAPP = '5548999541370';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Roteiro. Para mudar textos ou opções, edite só aqui.
  var GREETING = ['Olá, tudo bem? 👋', 'Que bom ter você aqui!', 'Como podemos te ajudar?'];
  var OPTIONS = [
    {
      id: 'doar',
      label: 'Quero doar para a Cruz Vermelha',
      replies: ['Que alegria! 💛 Fale com a gente e combinamos o que você pode doar e onde entregar.'],
      whatsapp: 'Olá! Vim pelo site e quero doar para a Cruz Vermelha Criciúma. Pode me orientar sobre o que doar e onde entregar?',
      extra: { label: 'Ver pontos de coleta', donation: true }
    },
    {
      id: 'auxilio',
      label: 'Preciso de auxílio da Cruz Vermelha',
      replies: [
        'Estamos aqui para isso. Conte para a gente o que você está precisando.',
        'Se for uma emergência, ligue agora para 193 (Bombeiros) ou 192 (SAMU).'
      ],
      whatsapp: 'Olá! Vim pelo site e preciso de auxílio da Cruz Vermelha Criciúma. Pode me ajudar?'
    },
    {
      id: 'voluntario',
      label: 'Quero fazer parte da Cruz Vermelha',
      replies: ['Que ótimo! Sempre precisamos de gente na triagem, na Fábrica de Fraldas e nas campanhas.'],
      whatsapp: 'Olá! Vim pelo site e quero fazer parte da Cruz Vermelha Criciúma como voluntário(a). Como faço?'
    }
  ];

  var panel = root.querySelector('.chat__panel');
  var body = root.querySelector('[data-chat-body]');
  var toggle = root.querySelector('[data-chat-toggle]');
  var started = false;
  var busy = false;

  /* Abrir e fechar --------------------------------------------------------- */

  function isOpen() { return root.classList.contains('is-open'); }

  function open(fromUser) {
    root.classList.add('is-open');
    root.classList.add('is-seen'); // some o selo "1"
    panel.removeAttribute('inert');
    panel.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Fechar conversa');
    // Só move o foco quando a pessoa abriu; na abertura automática não rouba o foco da página
    if (fromUser) setTimeout(function () { (body.querySelector('button, a') || panel.querySelector('.chat__close')).focus(); }, 300);
    if (!started) run();
  }

  function close() {
    root.classList.remove('is-open');
    panel.setAttribute('inert', '');
    panel.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir conversa com a Cruz Vermelha Criciúma');
  }

  toggle.addEventListener('click', function () { isOpen() ? close() : open(true); });
  root.querySelector('[data-chat-close]').addEventListener('click', function () { close(); toggle.focus(); });
  root.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) { close(); toggle.focus(); }
  });

  /* Mensagens -------------------------------------------------------------- */

  function wait(ms) { return new Promise(function (r) { setTimeout(r, reduceMotion ? 0 : ms); }); }

  function scrollDown() { body.scrollTop = body.scrollHeight; }

  function add(node) {
    body.appendChild(node);
    scrollDown();
    return node;
  }

  function bubble(text, who) {
    var p = document.createElement('p');
    p.className = 'chat__msg chat__msg--' + who;
    p.textContent = text;
    return add(p);
  }

  // Mostra os "três pontinhos" por um tempo proporcional ao texto, depois a mensagem
  function botSay(text) {
    var typing = document.createElement('p');
    typing.className = 'chat__msg chat__msg--bot chat__typing';
    typing.setAttribute('aria-label', 'Digitando');
    typing.innerHTML = '<span></span><span></span><span></span>';
    add(typing);
    return wait(Math.min(450 + text.length * 14, 1400)).then(function () {
      typing.remove();
      bubble(text, 'bot');
      return wait(250);
    });
  }

  function sayAll(lines) {
    return lines.reduce(function (p, line) { return p.then(function () { return botSay(line); }); }, Promise.resolve());
  }

  function choices(list) {
    var wrap = document.createElement('div');
    wrap.className = 'chat__choices';
    list.forEach(function (item) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chat__choice';
      b.textContent = item.label;
      if (item.donation) b.setAttribute('data-open-donation', ''); // o main.js abre o modal de doação
      b.addEventListener('click', function () { item.onPick(wrap); });
      wrap.appendChild(b);
    });
    return add(wrap);
  }

  function whatsappCard(message) {
    var a = document.createElement('a');
    a.className = 'chat__wa';
    a.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(message);
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML = '<span class="chat__wa-icon"><svg class="icon" aria-hidden="true"><use href="#i-whatsapp"/></svg></span>' +
      '<span><b>Entre em contato por aqui</b><small>Abre o WhatsApp com sua mensagem pronta</small></span>';
    return add(a);
  }

  function showOptions() {
    choices(OPTIONS.map(function (opt) {
      return { label: opt.label, onPick: function (wrap) { pick(opt, wrap); } };
    }));
  }

  function pick(opt, wrap) {
    if (busy) return;
    busy = true;
    wrap.remove();
    bubble(opt.label, 'user');
    sayAll(opt.replies).then(function () {
      whatsappCard(opt.whatsapp);
      var next = [{ label: 'Escolher outra opção', onPick: function (w) { w.remove(); showOptions(); } }];
      if (opt.extra) next.unshift({ label: opt.extra.label, donation: true, onPick: function () { close(); } });
      return wait(300).then(function () { choices(next); });
    }).then(function () { busy = false; });
  }

  function run() {
    started = true;
    busy = true;
    wait(350).then(function () { return sayAll(GREETING); }).then(function () {
      showOptions();
      busy = false;
    });
  }

  /* Aparecer depois da primeira dobra -------------------------------------- */

  var autoOpened = false;
  try { autoOpened = !!sessionStorage.getItem('cv-chat-aberto'); } catch (err) {}

  function blocked() {
    // Não abre por cima do modal de doação nem do menu do celular
    var modal = document.getElementById('donation-modal');
    return (modal && modal.classList.contains('is-open')) || document.documentElement.classList.contains('menu-open');
  }

  function onScroll() {
    if (window.scrollY < window.innerHeight * 0.8) return;
    root.classList.add('is-visible');
    if (!autoOpened) {
      autoOpened = true;
      // Abre sozinho uma vez por visita (sessão do navegador)
      try { sessionStorage.setItem('cv-chat-aberto', '1'); } catch (err) {}
      setTimeout(function () { if (!blocked() && !isOpen()) open(false); }, 900);
    }
    window.removeEventListener('scroll', onScroll);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
