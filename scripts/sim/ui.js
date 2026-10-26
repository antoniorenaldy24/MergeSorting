/* ============================================================
   UI — controller playback, intro, parallax, shortcut keyboard.
   ============================================================ */
var UI = {};
(function () {
  function $(id) { return document.getElementById(id); }

  /* ---------- state tombol ---------- */
  UI.updateButtons = function () {
    var btnRun = $('btn-run'), ctaRun = $('cta-run');
    var label = 'Jalankan';
    if (sim.phase === 'done') label = 'Ulangi';
    else if (ctl.playing) label = 'Jeda';
    else if (ctl.current && ctl.current.paused && ctl.current.paused() && ctl.busy) label = 'Lanjutkan';
    $('btn-run-label').textContent = label;
    btnRun.classList.toggle('playing', ctl.playing);
    ctaRun.classList.toggle('playing', ctl.playing);
    var ctaLabel = ctaRun.querySelector('.ic');
    if (ctaLabel) ctaLabel.style.display = '';
    $('btn-step').disabled = ctl.playing || sim.phase === 'done';
  };

  /* ---------- playback ---------- */
  function execStep(st) {
    try {
      ctl.current = STEP_RUNNERS[st.type](st);
    } catch (err) {
      console.error('[sim] step error:', err);
      ctl.current = null; ctl.busy = false; ctl.playing = false;
      UI.updateButtons();
      return;
    }
    ctl.current.timeScale(sim.speed);
    ctl.current.then(function () {
      ctl.busy = false;
      if (sim.phase === 'done') {
        ctl.playing = false;
        UI.updateButtons();
      } else if (ctl.playing) {
        playNext();
      } else {
        UI.updateButtons();
      }
    }, function (err) {
      console.error('[sim] timeline error:', err);
      ctl.playing = false; ctl.busy = false;
      UI.updateButtons();
    });
  }

  function playNext() {
    if (!ctl.playing) return;
    if (sim.i >= sim.steps.length) { ctl.playing = false; UI.updateButtons(); return; }
    var st = sim.steps[sim.i++];
    updateStepHud();
    ctl.busy = true;
    UI.updateButtons();
    execStep(st);
  }

  function togglePlay() {
    if (sim.phase === 'done') {
      rebuild(false);
      updateAll(false);
    }
    if (ctl.playing) {
      ctl.playing = false;
      if (ctl.current && ctl.current.isActive()) ctl.current.pause();
      narrate('Simulasi dijeda pada langkah ' + sim.i + '/' + sim.steps.length + '.');
    } else {
      ctl.playing = true;
      if (ctl.current && ctl.current.paused && ctl.current.paused()) ctl.current.resume();
      else if (!ctl.busy) playNext();
    }
    UI.updateButtons();
  }

  function stepOnce() {
    if (sim.phase === 'done') return;
    if (ctl.playing) { togglePlay(); return; }
    if (ctl.busy) {
      if (ctl.current) ctl.current.timeScale(Math.max(sim.speed, 6));
      return;
    }
    if (sim.i >= sim.steps.length) return;
    var st = sim.steps[sim.i++];
    updateStepHud();
    ctl.busy = true;
    UI.updateButtons();
    execStep(st);
  }

  /* ---------- reset & dataset ---------- */
  function updateAll(fresh) {
    setPhase('idle');
    $('st-cmp').textContent = '0';
    $('st-wr').textContent = '0';
    $('st-depth').textContent = sim.depth;
    updateStepHud();
    var cards = sim.levels[0][0].cards;
    gsap.fromTo(cards,
      { scale: 0.4, opacity: 0, y: 10 },
      { scale: 1, opacity: 1, y: 0, duration: 0.45, stagger: 0.04, ease: 'back.out(1.8)', overwrite: true });
    narrate(fresh
      ? 'Dataset baru: ' + sim.n + ' elemen acak tanpa duplikasi (2–99).'
      : 'Array ' + sim.n + ' elemen siap dieksekusi — jalankan simulasi untuk memulai.');
    UI.updateButtons();
  }

  function hardReset(rand) {
    rebuild(rand);
    updateAll(rand);
  }

  /* ---------- binding ---------- */
  function bindUI() {
    $('btn-run').addEventListener('click', togglePlay);
    $('cta-run').addEventListener('click', function () {
      var r = $('panel').getBoundingClientRect();
      if (r.top > window.innerHeight * 0.92 || r.bottom < 0) {
        $('panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      togglePlay();
    });
    $('btn-step').addEventListener('click', stepOnce);
    $('btn-rand').addEventListener('click', function () { hardReset(true); });
    $('cta-rand').addEventListener('click', function () { hardReset(true); });
    $('btn-reset').addEventListener('click', function () { hardReset(false); });

    var seg = $('seg-size');
    seg.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.classList.contains('on')) return;
        seg.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        sim.n = parseInt(b.getAttribute('data-n'), 10);
        hardReset(true);
      });
    });

    var speed = $('speed'), spdVal = $('spd-val');
    speed.addEventListener('input', function () {
      sim.speed = parseFloat(speed.value);
      spdVal.textContent = sim.speed.toFixed(2).replace(/\.?0+$/, '') + '×';
      if (ctl.current && !ctl.current.paused()) {
        var ts = ctl.current.timeScale();
        if (ts <= 3.2) ctl.current.timeScale(sim.speed);
      }
    });

    window.addEventListener('keydown', function (e) {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      else if (e.code === 'ArrowRight') { e.preventDefault(); stepOnce(); }
      else if (e.key === 'r' || e.key === 'R') { hardReset(true); }
      else if (e.key === 'Escape') { hardReset(false); }
    });

    var resizeT;
    window.addEventListener('resize', function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(applyScale, 160);
    });
  }

  /* ---------- parallax orbs ---------- */
  function parallax() {
    if (window.matchMedia && matchMedia('(pointer: coarse)').matches) return;
    var depths = [26, 38, 30];
    document.querySelectorAll('.orb').forEach(function (o, i) {
      var depth = depths[i] || 24;
      var qx = gsap.quickTo(o, 'x', { duration: 1.1, ease: 'power3' });
      var qy = gsap.quickTo(o, 'y', { duration: 1.1, ease: 'power3' });
      window.addEventListener('pointermove', function (e) {
        qx((e.clientX / window.innerWidth - 0.5) * depth);
        qy((e.clientY / window.innerHeight - 0.5) * depth);
      }, { passive: true });
      gsap.to(o.querySelector('.core'), {
        x: '+=46', y: '+=30', duration: 16 + i * 5,
        yoyo: true, repeat: -1, ease: 'sine.inOut'
      });
    });
  }

  /* ---------- intro ---------- */
  function intro() {
    var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      gsap.set('#bg-canvas', { opacity: 1 });
      narrate('Array ' + sim.n + ' elemen siap dieksekusi — jalankan simulasi untuk memulai.');
      return;
    }
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.fromTo('#bg-canvas', { opacity: 0 }, { opacity: 1, duration: 1.6, ease: 'power2.out' }, 0);
    tl.from('.topbar', { y: -16, opacity: 0, duration: 0.8 }, 0.15);
    tl.from('.badge', { y: 14, opacity: 0, duration: 0.7 }, 0.35);
    var split = null;
    try { split = SplitText.create('#h1', { type: 'chars', charsClass: 'ch' }); }
    catch (err) {
      try { split = new SplitText('#h1', { type: 'chars', charsClass: 'ch' }); } catch (e2) { split = null; }
    }
    if (split && split.chars && split.chars.length) {
      tl.from(split.chars, { yPercent: 120, autoAlpha: 0, duration: 0.72, stagger: 0.026, ease: 'back.out(1.7)' }, 0.42);
    } else {
      tl.from('#h1', { y: 26, opacity: 0, duration: 0.8 }, 0.42);
    }
    tl.from('.lede', { y: 16, opacity: 0, duration: 0.8 }, 0.6);
    tl.from('.chip', { y: 12, opacity: 0, duration: 0.55, stagger: 0.055 }, 0.72);
    tl.from('.cta .btn', { y: 12, opacity: 0, duration: 0.55, stagger: 0.08 }, 0.84);
    tl.from('.kbd-hints', { opacity: 0, duration: 0.7 }, 1.0);
    tl.from('#panel', { y: 36, opacity: 0, duration: 0.9 }, 0.9);
    tl.fromTo(sim.levels[0][0].cards,
      { scale: 0.4, opacity: 0, y: 12 },
      { scale: 1, opacity: 1, y: 0, duration: 0.5, stagger: 0.045, ease: 'back.out(1.8)' }, 1.18);
    tl.call(function () {
      narrate('Array ' + sim.n + ' elemen siap dieksekusi — jalankan simulasi untuk memulai.');
    }, null, 1.35);
  }

  /* ---------- boot ---------- */
  function boot() {
    gsap.registerPlugin(MotionPathPlugin, SplitText, ScrambleTextPlugin, CustomEase);
    if (gsap.config) gsap.config({ nullTargetWarn: false, force3D: true });

    initEngine();
    bindUI();
    setPhase('idle');
    $('st-depth').textContent = sim.depth;
    updateStepHud();
    UI.updateButtons();
    parallax();

    var started = false;
    function start() {
      if (started) return;
      started = true;
      setTimeout(intro, 80);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(start);
      setTimeout(start, 1500);
    } else {
      setTimeout(start, 300);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
