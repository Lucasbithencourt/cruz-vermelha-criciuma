// Cruz Vermelha Criciúma · player do vídeo em destaque ("Na mídia").
// O vídeo continua sendo do YouTube (player oficial, sem cookies), mas com os controles do site:
// play/pausa, barra de progresso, tempo, som e tela cheia, todos no vermelho da Cruz Vermelha.
// Até o clique, a página carrega só a capa; a API do YouTube entra quando a pessoa decide assistir.
(function () {
  var buttons = document.querySelectorAll('[data-youtube]');
  if (!buttons.length) return;

  var ICONS = {
    play: '<path d="M8 5.5v13l11-6.5z"/>',
    pause: '<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/>',
    replay: '<path d="M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z"/>',
    sound: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    muted: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9.5l5 5M22 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    exit: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  };

  function svg(name) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + '</svg>'; }

  function time(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  }

  // Carrega a API do YouTube uma vez só
  var apiReady = null;
  function loadApi() {
    if (apiReady) return apiReady;
    apiReady = new Promise(function (resolve) {
      if (window.YT && window.YT.Player) return resolve(window.YT);
      var previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (previous) previous();
        resolve(window.YT);
      };
      var s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    });
    return apiReady;
  }

  function mount(btn) {
    var id = btn.dataset.youtube;
    var title = btn.getAttribute('aria-label').replace('Assistir à reportagem: ', '');

    var wrap = document.createElement('div');
    wrap.className = 'vplayer is-loading';
    wrap.tabIndex = -1;
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', 'Vídeo: ' + title);
    wrap.innerHTML =
      '<div class="vplayer__frame"><div></div></div>' +
      '<div class="vplayer__hit" aria-hidden="true"></div>' +
      '<div class="vplayer__spinner" aria-hidden="true"></div>' +
      '<div class="vplayer__bar">' +
        '<button class="vplayer__btn" type="button" data-v="toggle" aria-label="Pausar">' + svg('pause') + '</button>' +
        '<span class="vplayer__time" data-v="current">0:00</span>' +
        '<input class="vplayer__progress" type="range" min="0" max="1000" step="1" value="0" aria-label="Posição do vídeo" data-v="progress">' +
        '<span class="vplayer__time" data-v="duration">0:00</span>' +
        '<button class="vplayer__btn" type="button" data-v="mute" aria-label="Tirar o som">' + svg('sound') + '</button>' +
        '<button class="vplayer__btn" type="button" data-v="full" aria-label="Tela cheia">' + svg('full') + '</button>' +
      '</div>';
    btn.replaceWith(wrap);

    var el = function (name) { return wrap.querySelector('[data-v="' + name + '"]'); };
    var toggleBtn = el('toggle');
    var muteBtn = el('mute');
    var fullBtn = el('full');
    var progress = el('progress');
    var current = el('current');
    var durationEl = el('duration');
    var player = null;
    var duration = 0;
    var seeking = false;
    var idleTimer = null;

    // Tela cheia do conjunto (vídeo + nossos controles); some onde o navegador não suporta (iPhone)
    var canFull = !!(wrap.requestFullscreen || wrap.webkitRequestFullscreen);
    if (!canFull) fullBtn.hidden = true;

    function setProgress(fraction) {
      progress.value = Math.round(fraction * 1000);
      progress.style.setProperty('--p', (fraction * 100).toFixed(2) + '%');
    }

    function tick() {
      if (player && player.getCurrentTime && !seeking) {
        var t = player.getCurrentTime();
        duration = player.getDuration() || duration;
        current.textContent = time(t);
        durationEl.textContent = time(duration);
        setProgress(duration ? t / duration : 0);
        progress.setAttribute('aria-valuetext', time(t) + ' de ' + time(duration));
      }
      requestAnimationFrame(tick);
    }

    function setPlayingUI(state) {
      var playing = state === 1 || state === 3;
      wrap.classList.toggle('is-playing', playing);
      wrap.classList.toggle('is-loading', state === 3);
      if (state === 0) {
        toggleBtn.innerHTML = svg('replay');
        toggleBtn.setAttribute('aria-label', 'Assistir de novo');
      } else {
        toggleBtn.innerHTML = svg(playing ? 'pause' : 'play');
        toggleBtn.setAttribute('aria-label', playing ? 'Pausar' : 'Reproduzir');
      }
      wakeControls();
    }

    function togglePlay() {
      if (!player) return;
      var s = player.getPlayerState();
      if (s === 1 || s === 3) player.pauseVideo();
      else player.playVideo();
    }

    function toggleMute() {
      if (!player) return;
      if (player.isMuted()) player.unMute(); else player.mute();
      var muted = !player.isMuted(); // a API só atualiza no próximo quadro
      muteBtn.innerHTML = svg(muted ? 'muted' : 'sound');
      muteBtn.setAttribute('aria-label', muted ? 'Ligar o som' : 'Tirar o som');
    }

    function toggleFull() {
      var isFull = document.fullscreenElement || document.webkitFullscreenElement;
      if (isFull) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else (wrap.requestFullscreen || wrap.webkitRequestFullscreen).call(wrap);
    }

    function onFullChange() {
      var isFull = (document.fullscreenElement || document.webkitFullscreenElement) === wrap;
      fullBtn.innerHTML = svg(isFull ? 'exit' : 'full');
      fullBtn.setAttribute('aria-label', isFull ? 'Sair da tela cheia' : 'Tela cheia');
    }
    document.addEventListener('fullscreenchange', onFullChange);
    document.addEventListener('webkitfullscreenchange', onFullChange);

    // Os controles somem durante o vídeo e voltam com qualquer movimento
    function wakeControls() {
      wrap.classList.remove('is-idle');
      clearTimeout(idleTimer);
      if (wrap.classList.contains('is-playing')) {
        idleTimer = setTimeout(function () {
          if (!wrap.contains(document.activeElement) || document.activeElement === wrap) wrap.classList.add('is-idle');
        }, 2600);
      }
    }
    ['pointermove', 'pointerdown', 'focusin', 'keydown'].forEach(function (ev) { wrap.addEventListener(ev, wakeControls); });

    toggleBtn.addEventListener('click', togglePlay);
    wrap.querySelector('.vplayer__hit').addEventListener('click', togglePlay);
    muteBtn.addEventListener('click', toggleMute);
    fullBtn.addEventListener('click', toggleFull);

    progress.addEventListener('input', function () {
      seeking = true;
      var f = progress.value / 1000;
      setProgress(f);
      current.textContent = time(f * duration);
    });
    progress.addEventListener('change', function () {
      if (player && duration) player.seekTo((progress.value / 1000) * duration, true);
      seeking = false;
    });

    // Atalhos quando o foco está no player: espaço/K pausa, setas avançam 5 s, M som, F tela cheia
    wrap.addEventListener('keydown', function (e) {
      if (e.target === progress && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return;
      var k = e.key.toLowerCase();
      if ((k === ' ' && e.target === wrap) || k === 'k') { e.preventDefault(); togglePlay(); }
      else if (k === 'arrowright' || k === 'arrowleft') {
        e.preventDefault();
        if (player) player.seekTo(player.getCurrentTime() + (k === 'arrowright' ? 5 : -5), true);
      }
      else if (k === 'm') toggleMute();
      else if (k === 'f' && canFull) toggleFull();
    });

    loadApi().then(function (YT) {
      player = new YT.Player(wrap.querySelector('.vplayer__frame > div'), {
        videoId: id,
        host: 'https://www.youtube-nocookie.com',
        playerVars: { autoplay: 1, controls: 0, rel: 0, modestbranding: 1, playsinline: 1, iv_load_policy: 3, fs: 0, disablekb: 1 },
        events: {
          onReady: function () {
            var iframe = player.getIframe();
            iframe.title = title;
            duration = player.getDuration();
            durationEl.textContent = time(duration);
            wrap.classList.remove('is-loading');
            player.playVideo();
            wrap.focus({ preventScroll: true });
            requestAnimationFrame(tick);
            // Alguns celulares bloqueiam o play automático: libera o toque direto no vídeo
            setTimeout(function () {
              var s = player.getPlayerState();
              if (s !== 1 && s !== 3) wrap.classList.add('needs-tap');
            }, 1800);
          },
          onStateChange: function (e) {
            if (e.data === 1) wrap.classList.remove('needs-tap');
            setPlayingUI(e.data);
          }
        }
      });
    });
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () { mount(btn); });
  });
})();
