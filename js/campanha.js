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
