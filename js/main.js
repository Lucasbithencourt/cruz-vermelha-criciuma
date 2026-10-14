// Cruz Vermelha Criciúma · base de interações: rolagem suave, header, menu, reveals e modal.
// As cenas de scroll maiores (hero, linha do tempo, galeria) entram nas próximas etapas em cima desta base.
(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  // Só escondemos elementos para animar quando o movimento está liberado
  if (!reduceMotion) root.classList.add('js-motion');

  /* Rolagem suave (Lenis) sincronizada com o ScrollTrigger ----------------- */

  var lenis = null;
  if (!reduceMotion && typeof window.Lenis !== 'undefined') {
    lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
    if (hasGsap) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(0);
    }
  } else if (hasGsap) {
    window.gsap.registerPlugin(window.ScrollTrigger);
  }
  window.CV = { lenis: lenis, reduceMotion: reduceMotion, hasGsap: hasGsap };

  // Âncoras internas passam pelo Lenis para manter a rolagem suave e descontar o header
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var id = link.getAttribute('href');
    if (id.length < 2) return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: header ? -header.offsetHeight + 1 : 0 });
    else target.scrollIntoView();
    history.replaceState(null, '', id);
  });

  /* Header: fundo ao rolar, esconde ao descer, barra de progresso ---------- */

  var header = document.querySelector('.site-header');
  var progress = document.querySelector('.progress');
  var lastY = 0;

  function onScroll() {
    if (!header) return;
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle('is-scrolled', y > 24);
    // Some ao descer depois da primeira dobra; volta a qualquer rolagem para cima
    header.classList.toggle('is-hidden', y > lastY && y > window.innerHeight * 0.6 && !root.classList.contains('menu-open'));
    if (progress) progress.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Menu mobile ------------------------------------------------------------ */

  var toggle = document.querySelector('.menu-toggle');
  var mobileMenu = document.getElementById('mobile-menu');

  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    mobileMenu.setAttribute('aria-hidden', String(!open));
    if (lenis) open ? lenis.stop() : lenis.start();
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (toggle && mobileMenu) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    mobileMenu.addEventListener('click', function (e) {
      if (e.target.closest('a, [data-open-donation]')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('menu-open')) {
        setMenu(false);
        toggle.focus();
      }
    });
    window.matchMedia('(min-width: 1100px)').addEventListener('change', function (mq) {
      if (mq.matches) setMenu(false);
    });
  }

  /* Link ativo no menu conforme a seção visível ---------------------------- */

  var navLinks = document.querySelectorAll('.nav__link[href^="#"]');
  if ('IntersectionObserver' in window && navLinks.length) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = byId[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
          link.setAttribute('aria-current', 'true');
        } else if (link.hasAttribute('aria-current')) {
          link.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) navObserver.observe(section);
    });
  }

  /* Títulos que sobem palavra por palavra ---------------------------------- */
  // Envolve cada palavra em dois spans; o CSS faz a máscara e o atraso em cascata.

  document.querySelectorAll('[data-split]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(function (word, i) {
      return '<span class="split-word" aria-hidden="true"><span style="--w:' + i + '">' + word + '</span></span>';
    }).join(' ');
  });

  /* Reveals ao entrar na tela ---------------------------------------------- */

  // O que está no hero entra no carregamento, sem depender da rolagem
  var revealEls = document.querySelectorAll('[data-reveal]:not(.hero *), [data-split]:not(.hero *)');
  var heroEls = document.querySelectorAll('.hero [data-reveal], .hero [data-split]');
  setTimeout(function () {
    heroEls.forEach(function (el) { el.classList.add('is-visible'); });
  }, reduceMotion ? 0 : 150);

  if (!reduceMotion && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // Cascata: filhos de [data-stagger] recebem o índice usado no atraso
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.setProperty('--i', i);
    });
  });

  /* Hero: entrada e parallax ----------------------------------------------- */

  // Um quadro depois do carregamento, para a transição da foto ter um ponto de partida
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { root.classList.add('is-loaded'); });
  });

  if (hasGsap && !reduceMotion && document.querySelector('.hero')) {
    var gsap = window.gsap;
    var heroScroll = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
    // A foto desce mais devagar que a página; o conteúdo sobe e some
    gsap.to('.hero__media', { yPercent: 22, ease: 'none', scrollTrigger: heroScroll });
    gsap.to('.hero__inner', { yPercent: -12, opacity: 0.15, ease: 'none', scrollTrigger: heroScroll });
    gsap.to('.hero__scroll', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '15% top', scrub: true } });
  }

  /* Contadores ------------------------------------------------------------- */
  // O HTML já traz o valor final (vale sem JS e para buscadores); aqui ele recomeça do zero e sobe.

  var counters = document.querySelectorAll('[data-count]');
  var format = new Intl.NumberFormat('pt-BR');

  function renderCount(el, value) {
    el.textContent = (el.dataset.prefix || '') + format.format(value) + (el.dataset.suffix || '');
  }

  function runCounter(el) {
    var target = Number(el.dataset.count);
    var duration = 2000;
    var start = null;
    var stat = el.closest('.stat');
    function step(time) {
      if (start === null) start = time;
      var t = Math.min((time - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 4);
      renderCount(el, Math.round(target * eased));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    if (stat) stat.classList.add('is-counted');
  }

  if (!reduceMotion && 'IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        // Pequeno atraso para acompanhar a entrada do card
        setTimeout(function () { runCounter(entry.target); }, 250);
        counterObserver.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) {
      renderCount(el, 0);
      counterObserver.observe(el);
    });
  } else {
    counters.forEach(function (el) {
      var stat = el.closest('.stat');
      if (stat) stat.classList.add('is-counted');
    });
  }

  /* Linha do tempo --------------------------------------------------------- */

  var timeline = document.querySelector('.timeline');
  if (timeline) {
    var tlList = timeline.querySelector('.timeline__list');
    var tlEvents = Array.prototype.slice.call(timeline.querySelectorAll('.tl-event'));
    var tlYear = timeline.querySelector('[data-tl-year]');
    var tlChapter = timeline.querySelector('[data-tl-chapter]');
    var tlMedia = timeline.querySelector('[data-tl-media]');
    var activeIndex = -1;

    // Foto de cada evento: imagem real se houver data-photo-src, senão o placeholder com legenda
    function makeMedia(ev) {
      var el;
      if (ev.dataset.photoSrc) {
        el = document.createElement('img');
        el.src = ev.dataset.photoSrc;
        el.alt = ev.dataset.photoLabel || '';
        el.loading = 'lazy';
      } else {
        el = document.createElement('div');
        el.className = 'ph';
        el.dataset.label = ev.dataset.photoLabel || '';
      }
      return el;
    }

    tlEvents.forEach(function (ev) {
      // Painel fixo do desktop
      var panelItem = makeMedia(ev);
      tlMedia.appendChild(panelItem);
      ev._panelMedia = panelItem;
      // Foto dentro do evento, só visível no celular
      var inline = makeMedia(ev);
      inline.classList.add('tl-event__media');
      ev.querySelector('h3').insertAdjacentElement('afterend', inline);
    });

    // Troca o ano com efeito de odômetro: o novo entra por baixo (ou por cima, ao voltar)
    function setYear(year, forward) {
      var current = tlYear.lastElementChild;
      if (current && current.textContent === year) return;
      var next = document.createElement('span');
      next.textContent = year;
      tlYear.appendChild(next);
      if (reduceMotion || !next.animate || !current) {
        if (current) current.remove();
        return;
      }
      var dist = forward ? '100%' : '-100%';
      var back = forward ? '-100%' : '100%';
      var opts = { duration: 700, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' };
      next.animate([{ transform: 'translateY(' + dist + ')' }, { transform: 'none' }], opts);
      current.animate([{ transform: 'none' }, { transform: 'translateY(' + back + ')' }], opts)
        .onfinish = function () { current.remove(); };
    }

    function activate(index) {
      if (index === activeIndex) return;
      var forward = index > activeIndex;
      activeIndex = index;
      tlEvents.forEach(function (ev, i) {
        ev.classList.toggle('is-active', i === index);
        ev.classList.toggle('is-passed', i < index);
        ev._panelMedia.classList.toggle('is-active', i === index);
      });
      var ev = tlEvents[index];
      setYear(ev.dataset.year, forward);
      tlChapter.textContent = ev.dataset.chapter;
    }

    // O evento ativo é o que cruza a linha um pouco acima do meio da tela
    if ('IntersectionObserver' in window) {
      var tlObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) activate(tlEvents.indexOf(entry.target));
        });
      }, { rootMargin: '-45% 0px -54% 0px' });
      tlEvents.forEach(function (ev) { tlObserver.observe(ev); });
    }
    activate(0);

    // Preenchimento do trilho conforme a rolagem
    if (!reduceMotion) {
      var updateTrack = function () {
        var rect = tlList.getBoundingClientRect();
        var p = (window.innerHeight * 0.5 - rect.top) / rect.height;
        tlList.style.setProperty('--tl', Math.min(Math.max(p, 0), 1).toFixed(4));
      };
      window.addEventListener('scroll', updateTrack, { passive: true });
      window.addEventListener('resize', updateTrack);
      updateTrack();
    }

    // Faixa gigante desliza para a esquerda enquanto a seção passa
    if (hasGsap && !reduceMotion) {
      window.gsap.fromTo('.history__band-text', { xPercent: 0 }, {
        xPercent: -35,
        ease: 'none',
        scrollTrigger: { trigger: '.history__band', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }
  }

  /* O que fazemos ---------------------------------------------------------- */

  // Brilho que acompanha o cursor nos cards
  document.querySelectorAll('.card--spot').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // Foto do programa em destaque desliza dentro da moldura
  if (hasGsap && !reduceMotion && document.querySelector('.program-feature')) {
    window.gsap.fromTo('.program-feature__media .ph', { yPercent: -8 }, {
      yPercent: 8,
      ease: 'none',
      scrollTrigger: { trigger: '.program-feature', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  /* Os 7 princípios -------------------------------------------------------- */

  var pTrack = document.querySelector('[data-principles-track]');
  if (pTrack) {
    var pCurrent = document.querySelector('[data-principle-current]');
    var pBar = document.querySelector('[data-principle-bar]');
    var pTotal = pTrack.children.length;

    var setPrinciple = function (progress) {
      var index = Math.min(pTotal - 1, Math.floor(progress * pTotal));
      pCurrent.textContent = String(index + 1).padStart(2, '0');
      pBar.style.setProperty('--pp', Math.max(progress, 1 / pTotal).toFixed(3));
    };

    // Celular e tablet: o contador acompanha o arraste do carrossel
    pTrack.addEventListener('scroll', function () {
      var max = pTrack.scrollWidth - pTrack.clientWidth;
      setPrinciple(max > 0 ? pTrack.scrollLeft / max : 0);
    }, { passive: true });

    // Desktop: a seção fica presa e a rolagem vertical move os cards na horizontal
    if (hasGsap && !reduceMotion) {
      var mm = window.gsap.matchMedia();
      mm.add('(min-width: 960px)', function () {
        var distance = function () { return Math.max(0, pTrack.scrollWidth - window.innerWidth); };
        window.gsap.to(pTrack, {
          x: function () { return -distance(); },
          ease: 'none',
          scrollTrigger: {
            trigger: '.principles',
            start: 'top top',
            end: function () { return '+=' + distance(); },
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: function (self) { setPrinciple(self.progress); }
          }
        });
      });
    }
  }

  /* A sede: colunas da galeria em velocidades diferentes ------------------- */

  if (hasGsap && !reduceMotion) {
    window.gsap.matchMedia().add('(min-width: 640px)', function () {
      document.querySelectorAll('.hq__col[data-speed]').forEach(function (col) {
        var speed = Number(col.dataset.speed);
        window.gsap.fromTo(col, { yPercent: speed }, {
          yPercent: -speed,
          ease: 'none',
          scrollTrigger: { trigger: '.hq__gallery', start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
    });
  }

  /* Na mídia: filtro por ano e prévia que segue o cursor ------------------- */

  var pressItems = document.querySelectorAll('.press__item');
  document.querySelectorAll('.press__filters .chip').forEach(function (chip, _, chips) {
    chip.addEventListener('click', function () {
      var year = chip.dataset.filter;
      chips.forEach(function (c) {
        c.classList.toggle('is-active', c === chip);
        c.setAttribute('aria-pressed', String(c === chip));
      });
      var n = 0;
      pressItems.forEach(function (item) {
        var show = year === 'all' || item.dataset.year === year;
        item.hidden = !show;
        item.classList.remove('is-entering');
        if (show && !reduceMotion) {
          void item.offsetWidth; // reinicia a animação de entrada
          item.style.setProperty('--n', n++);
          item.classList.add('is-entering');
        }
      });
      if (hasGsap) window.ScrollTrigger.refresh();
    });
  });

  var preview = document.querySelector('.press__preview');
  var pressList = document.querySelector('.press__list');
  if (preview && pressList && window.matchMedia('(hover: hover) and (min-width: 960px)').matches) {
    var previewOutlet = preview.querySelector('.press__preview-outlet');
    var previewText = preview.querySelector('.press__preview-text');
    var target = { x: 0, y: 0 };
    var pos = { x: 0, y: 0 };
    var following = false;

    // A prévia persegue o cursor com um leve atraso (interpolação)
    var follow = function () {
      pos.x += (target.x - pos.x) * (reduceMotion ? 1 : 0.16);
      pos.y += (target.y - pos.y) * (reduceMotion ? 1 : 0.16);
      preview.style.transform = 'translate(' + pos.x + 'px,' + pos.y + 'px)';
      if (following) requestAnimationFrame(follow);
    };

    pressList.addEventListener('pointermove', function (e) {
      // Fica à direita do cursor; se não couber, vai para a esquerda
      var w = preview.offsetWidth;
      target.x = e.clientX + 28 + w > window.innerWidth ? e.clientX - w - 28 : e.clientX + 28;
      target.y = e.clientY - preview.offsetHeight / 2;
    });
    pressList.addEventListener('pointerover', function (e) {
      var link = e.target.closest('.press__link');
      if (!link) return;
      previewOutlet.textContent = link.dataset.outlet;
      previewText.textContent = link.dataset.summary;
      if (!following) {
        pos.x = target.x;
        pos.y = target.y;
        following = true;
        requestAnimationFrame(follow);
      }
      preview.classList.add('is-on');
    });
    pressList.addEventListener('pointerleave', function () {
      preview.classList.remove('is-on');
      following = false;
    });
  }

  /* Parceiros: faixas que andam em direções opostas ------------------------ */

  if (hasGsap && !reduceMotion) {
    document.querySelectorAll('.partners__row').forEach(function (row) {
      var dir = Number(row.dataset.dir);
      window.gsap.fromTo(row, { xPercent: dir < 0 ? 0 : -25 }, {
        xPercent: dir < 0 ? -25 : 0,
        ease: 'none',
        scrollTrigger: { trigger: '.partners__rows', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  // Recalcula as cenas quando as fontes terminam de carregar (as alturas mudam)
  if (hasGsap && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { window.ScrollTrigger.refresh(); });
  }

  /* Modal de doação -------------------------------------------------------- */
  // Abre por qualquer [data-open-donation]. O envio fica no bloco do formulário, mais abaixo.

  var modal = document.getElementById('donation-modal');
  var lastFocus = null;

  function focusables() {
    return modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])');
  }

  function openModal() {
    lastFocus = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
    setTimeout(function () {
      var first = modal.querySelector('input');
      (first || focusables()[0]).focus();
    }, 80);
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
    if (lastFocus) lastFocus.focus();
  }

  if (modal) {
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-open-donation]')) { e.preventDefault(); openModal(); }
      if (e.target.closest('[data-close-modal]')) closeModal();
    });

    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
      if (e.key !== 'Tab') return;
      // Mantém o foco dentro do modal
      var items = focusables();
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* Gravação do contato no Supabase --------------------------------------- */
  // Insere direto pela API REST. A chave é pública; o RLS da tabela só permite inserir (supabase/doadores.sql).

  function saveDonor(row) {
    var cfg = window.CV_CONFIG || {};
    if (!cfg.supabaseUrl || !cfg.supabaseKey) {
      console.warn('CV_CONFIG.supabaseKey vazio: contato não foi salvo (veja supabase/LEIA-ME.md).');
      return Promise.resolve();
    }
    var headers = {
      'apikey': cfg.supabaseKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    };
    // A anon key antiga é um JWT e vai também no Authorization; a publishable key nova dispensa
    if (/^eyJ/.test(cfg.supabaseKey)) headers.Authorization = 'Bearer ' + cfg.supabaseKey;

    // Limite de espera: se a rede travar, a pessoa não fica presa no botão
    var controller = 'AbortController' in window ? new AbortController() : null;
    var timer = controller && setTimeout(function () { controller.abort(); }, 4000);

    return fetch(cfg.supabaseUrl.replace(/\/$/, '') + '/rest/v1/' + (cfg.supabaseTable || 'doadores'), {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(row),
      signal: controller ? controller.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      if (!res.ok) return res.text().then(function (t) { throw new Error(res.status + ' ' + t); });
    }, function (err) {
      if (timer) clearTimeout(timer);
      throw err;
    });
  }

  /* Formulário de doação --------------------------------------------------- */
  // Valida, grava no Supabase e leva aos pontos de coleta.

  var form = document.getElementById('donation-form');
  if (form) {
    var nameInput = form.elements.nome;
    var phoneInput = form.elements.telefone;
    var consent = form.elements.consentimento;
    var submitBtn = form.querySelector('[type="submit"]');

    // Máscara (48) 99999-9999 enquanto digita
    var maskPhone = function (value) {
      var d = value.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '').slice(0, 11);
      if (d.length <= 2) return d.length ? '(' + d : '';
      if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
      if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
      return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    };
    phoneInput.addEventListener('input', function () {
      phoneInput.value = maskPhone(phoneInput.value);
    });

    var setError = function (input, message) {
      var holder = input.type === 'checkbox' ? form.querySelector('.check__error') : input.parentNode.querySelector('.field__error');
      holder.textContent = message || '';
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
    };

    var validate = function () {
      var firstInvalid = null;
      var name = nameInput.value.trim();
      var digits = phoneInput.value.replace(/\D/g, '');

      if (name.length < 3 || !/[a-zA-ZÀ-ÿ]/.test(name)) {
        setError(nameInput, 'Escreva seu nome, por favor.');
        firstInvalid = firstInvalid || nameInput;
      } else setError(nameInput);

      if (digits.length < 10 || digits.length > 11) {
        setError(phoneInput, 'Informe um telefone com DDD, como (48) 99999-9999.');
        firstInvalid = firstInvalid || phoneInput;
      } else setError(phoneInput);

      if (!consent.checked) {
        setError(consent, 'Para continuar, marque a autorização.');
        firstInvalid = firstInvalid || consent;
      } else setError(consent);

      if (firstInvalid) firstInvalid.focus();
      return !firstInvalid;
    };

    // Depois do primeiro erro, a mensagem some assim que o campo fica certo
    [nameInput, phoneInput, consent].forEach(function (input) {
      input.addEventListener(input.type === 'checkbox' ? 'change' : 'input', function () {
        if (input.getAttribute('aria-invalid') === 'true') validate();
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;

      submitBtn.disabled = true;
      submitBtn.classList.add('is-loading');

      // Só o primeiro nome, para a saudação na próxima página (nada vai na URL)
      try { sessionStorage.setItem('cv-nome', nameInput.value.trim().split(/\s+/)[0]); } catch (err) {}

      var goNext = function () { window.location.href = form.getAttribute('action'); };

      // Campo isca preenchido = robô: segue sem gravar
      if (form.elements.site.value) { goNext(); return; }

      saveDonor({
        nome: nameInput.value.trim(),
        telefone: phoneInput.value.trim(),
        consentimento: true,
        origem: location.pathname
      }).then(goNext, function (err) {
        // Não trava quem quer doar: registra o problema e segue para os pontos de coleta
        console.error('Contato não foi salvo:', err);
        goNext();
      });
    });
  }

  /* Ano do rodapé ---------------------------------------------------------- */

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
