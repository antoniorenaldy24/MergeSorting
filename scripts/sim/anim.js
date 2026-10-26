/* ============================================================
   ANIM — pembangun timeline per langkah (GSAP advanced).
   Teknik: timeline bersarang + posisi presisi, MotionPathPlugin
   untuk lintasan penerbangan kartu, ScrambleText untuk narasi,
   stroke-dashoffset untuk wire, uniform shader digerakkan fase.
   ============================================================ */

var NARR_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789</>[]';

/* ---------- narasi & HUD ---------- */
function narrate(text) {
  var el = document.getElementById('narr');
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = text; return;
  }
  gsap.to(el, {
    duration: 0.55,
    scrambleText: { text: text, chars: NARR_CHARS, speed: 0.4 },
    overwrite: 'auto'
  });
}

function setPhase(ph) {
  sim.phase = ph;
  els.panel.setAttribute('data-phase', ph);
  var map = { idle: 'SIAP', divide: 'PEMBAGIAN', merge: 'PENGGABUNGAN', done: 'TERURUT' };
  document.getElementById('status-dot').className = 'dot ' + (ph === 'idle' ? '' : ph);
  document.getElementById('status-text').textContent = map[ph];
  var order = ['divide', 'merge', 'done'];
  document.querySelectorAll('#phases .ph').forEach(function (el) {
    var p = el.getAttribute('data-ph');
    el.classList.toggle('active', p === ph);
    el.classList.toggle('past', order.indexOf(p) < order.indexOf(ph));
  });
  if (window.BG && BG.ok) {
    BG.setEnergy({ idle: 0.28, divide: 0.5, merge: 0.72, done: 0.55 }[ph] || 0.3);
  }
  if (window.UI && UI.updateButtons) UI.updateButtons();
}

function bumpStat(kind) {
  var el = kind === 'cmp' ? document.getElementById('st-cmp') : document.getElementById('st-wr');
  if (kind === 'cmp') { sim.cmp++; el.textContent = sim.cmp; }
  else { sim.wr++; el.textContent = sim.wr; }
  el.classList.add(kind === 'cmp' ? 'flash-c' : 'flash-w');
  gsap.fromTo(el, { scale: 1.25 }, {
    scale: 1, duration: 0.4, ease: 'back.out(2.2)',
    onComplete: function () { el.classList.remove('flash-c', 'flash-w'); }
  });
}

function updateStepHud() {
  document.getElementById('st-step').textContent = sim.i + '/' + sim.steps.length;
  gsap.to('#prog-fill', {
    width: (sim.steps.length ? sim.i / sim.steps.length * 100 : 0) + '%',
    duration: 0.4, ease: 'power2.out', overwrite: 'auto'
  });
}

/* ---------- fokus visual ---------- */
function focusOn(g, kL, kR) {
  els.stageScale.classList.add('focus');
  [g, kL, kR].forEach(function (x) {
    if (x && x.el) {
      x.el.classList.add('lit');
      x.el.classList.remove('ghost');
    }
  });
  g.el.classList.add('ring-t');
  if (kL && kL.el) kL.el.classList.add('ring-l');
  if (kR && kR.el) kR.el.classList.add('ring-r');
}

function unfocus() {
  els.stageScale.classList.remove('focus');
  els.rows.querySelectorAll('.lit').forEach(function (el) { el.classList.remove('lit'); });
  els.rows.querySelectorAll('.ring-t').forEach(function (el) { el.classList.remove('ring-t'); });
  els.rows.querySelectorAll('.ring-l').forEach(function (el) { el.classList.remove('ring-l'); });
  els.rows.querySelectorAll('.ring-r').forEach(function (el) { el.classList.remove('ring-r'); });
}

/* ---------- garis pemisah (cut) ---------- */
function flashCut(pg) {
  var len = pg.to - pg.from, mid = Math.floor(len / 2);
  var cut = document.createElement('div');
  cut.className = 'cut';
  cut.style.left = (pg.x + mid * (CFG.CW + CFG.INTRA) - CFG.INTRA / 2 - 0.75) + 'px';
  cut.style.top = (pg.y - 7) + 'px';
  cut.style.height = (CFG.CH + 14) + 'px';
  els.rows.appendChild(cut);
  gsap.fromTo(cut,
    { scaleY: 0, opacity: 1, transformOrigin: '50% 50%' },
    {
      scaleY: 1, duration: 0.16, ease: 'power2.out',
      onComplete: function () {
        gsap.to(cut, {
          opacity: 0, duration: 0.32, ease: 'power1.in',
          onComplete: function () { cut.remove(); }
        });
      }
    });
}

/* ---------- teks narasi ---------- */
function wrapB(s) { return '[' + s + ']'; }

function splitText(k, kids) {
  if (k === 0) {
    return 'Divide — array dipecah pada indeks tengah: ' + kids.map(function (g) { return wrapB(fmtVals(g)); }).join(' | ') + '.';
  }
  var m = kids.length;
  if (m <= 4) {
    return 'Divide — level ' + (k + 1) + ': ' + kids.map(function (g) { return wrapB(fmtVals(g)); }).join(' | ') + '.';
  }
  var maxLen = 0;
  kids.forEach(function (g) { maxLen = Math.max(maxLen, g.to - g.from); });
  return 'Divide — level ' + (k + 1) + ': ' + m + ' sub-array terbentuk (maks. ' + maxLen + ' elemen).';
}

function cmpText(st) {
  if (st.src === 'L') return 'Bandingkan ' + st.cmp.l + ' ≤ ' + st.cmp.r + ' — ' + st.cmp.l + ' ditempatkan.';
  return 'Bandingkan ' + st.cmp.l + ' > ' + st.cmp.r + ' — ' + st.cmp.r + ' ditempatkan.';
}

function drainText(st) {
  return st.src === 'L'
    ? 'Sub-array kanan habis — ' + st.val + ' dipindahkan tanpa perbandingan.'
    : 'Sub-array kiri habis — ' + st.val + ' dipindahkan tanpa perbandingan.';
}

/* bersihkan label level yang barisnya sudah habis dikonsumsi */
function reapEmptyTags() {
  for (var k = 1; k < sim.depth; k++) {
    var alive = false;
    for (var j = 0; j < sim.levels[k].length; j++) {
      if (!sim.levels[k][j].consumed) { alive = true; break; }
    }
    if (!alive && sim.tags[k]) {
      (function (tag) {
        gsap.to(tag, { opacity: 0, duration: 0.4, onComplete: function () { tag.remove(); } });
      })(sim.tags[k]);
      sim.tags[k] = null;
    }
  }
}

/* ---------- konsumsi grup (merge naik) + cascade trunk ---------- */
function consumeGroup(kid, kidLevel) {
  kid.consumed = true;
  removeWires(kid);
  if (kid.el) { kid.el.remove(); kid.el = null; }
  var nl = kidLevel + 1;
  if (kid.copyNext >= 0 && nl < sim.depth) {
    var copy = sim.levels[nl][kid.copyNext];
    if (copy && !copy.consumed) {
      if (copy.el) {
        var el = copy.el;
        gsap.to(el, {
          opacity: 0, y: 8, duration: 0.28, ease: 'power1.in',
          onComplete: function () { el.remove(); }
        });
        copy.el = null;
      }
      removeWires(copy);
      copy.consumed = true;
      consumeGroup(copy, nl);
    }
  }
}

/* ============================================================
   RUNNER: SPLIT — materialisasi baris level k+1 (mitosis)
   ============================================================ */
function runSplit(st) {
  var k = st.level;
  var tl = gsap.timeline();
  var kids = sim.levels[k + 1];
  var m = kids.length;
  var stag = Math.min(0.085, 0.5 / Math.max(m, 1));

  createTag(k + 1);

  tl.call(function () {
    if (sim.phase !== 'divide') setPhase('divide');
    narrate(splitText(k, kids));
  }, null, 0);

  kids.forEach(function (cg, j) {
    buildGroupDOM(cg);
    var p = parentGroup(cg);
    var dx = p ? (p.cx - cg.cx) : 0;
    var dy = -(CFG.CH + CFG.ROWGAP);
    gsap.set(cg.el, { x: dx, y: dy, opacity: 0 });
    tl.to(cg.el, { x: 0, y: 0, opacity: 1, duration: 0.62, ease: 'power3.out' }, j * stag + 0.02);
  });

  sim.levels[k].forEach(function (pg, j) {
    tl.call(function () { if (pg.el) pg.el.classList.add('ghost'); }, null, j * stag + 0.2);
    if (pg.children) {
      tl.call(function () { flashCut(pg); }, null, j * stag + 0.06);
    }
  });

  tl.call(function () {
    kids.forEach(function (cg) { drawWiresInto(cg, true); });
  }, null, Math.max(0.6, (m - 1) * stag + 0.52));

  tl.to({}, { duration: 0.22 }, '>');
  return tl;
}

/* ============================================================
   RUNNER: PLACE — satu operasi penempatan (compare & fly)
   ============================================================ */
function runPlace(st) {
  var g = st.g, kL = st.kids[0], kR = st.kids[1];
  var headL = kL.cards[0], headR = kR.cards[0];
  var winner = st.src === 'L' ? headL : headR;
  var tl = gsap.timeline();
  var t = 0;

  /* --- buka grup: kartu lama keluar, slot masuk --- */
  if (st.first) {
    buildSlots(g);
    g.slotEls.forEach(function (s) { s.style.display = 'none'; });
    tl.call(function () {
      narrate('Merge — [' + fmtVals(kL) + '] + [' + fmtVals(kR) + '] digabungkan.');
      focusOn(g, kL, kR);
      g.el.classList.remove('ghost');
    }, null, 0);
    tl.to(g.cards, { y: 9, opacity: 0, scale: 0.9, duration: 0.22, stagger: 0.014, ease: 'power1.in' }, 0);
    tl.call(function () {
      g.cards.forEach(function (c) { c.remove(); });
      g.cards = [];
      g.slotEls.forEach(function (s) { s.style.display = ''; });
    }, null, 0.24);
    tl.fromTo(g.slotEls,
      { opacity: 0, scale: 0.86 },
      { opacity: 1, scale: 1, duration: 0.22, stagger: 0.012, ease: 'back.out(1.9)', immediateRender: false },
      0.3);
    t = 0.58;
  }

  /* --- sorot dua pointer (perbandingan) --- */
  if (st.cmp) {
    tl.call(function () {
      if (headL) headL.classList.add('cmp', 'cmp-l');
      if (headR) headR.classList.add('cmp', 'cmp-r');
      narrate(cmpText(st));
      bumpStat('cmp');
    }, null, t);
    tl.to([headL, headR], { y: -6, duration: 0.18, ease: 'power2.out' }, t);
    t += 0.26;
  } else if (!st.first) {
    tl.call(function () { narrate(drainText(st)); }, null, t);
  }

  /* --- penerbangan kartu (MotionPath) ---
     Posisi awal = posisi KARTU yang sesungguhnya di dalam grup sumber
     (winner.offsetLeft) — bukan tepi kiri grup. Kartu absolut di dalam
     grup, jadi ia tidak pernah bergeser ketika kartu lain diambil;
     penerbangan selalu LURUS dari posisi aslinya ke slot tujuan. */
  var srcKid = st.src === 'L' ? kL : kR;
  var fromX = srcKid.x + winner.offsetLeft;
  var fromY = srcKid.y + winner.offsetTop;
  var toX = g.x + st.insertIdx * (CFG.CW + CFG.INTRA);
  var toY = g.y;
  var midX = (toX - fromX) / 2;
  var midY = (toY - fromY) / 2 - 38;
  var slot = g.slotEls ? g.slotEls[st.insertIdx] : null;

  tl.call(function () {
    if (headL) { headL.classList.remove('cmp', 'cmp-l'); gsap.set(headL, { y: 0 }); }
    if (headR) { headR.classList.remove('cmp', 'cmp-r'); gsap.set(headR, { y: 0 }); }
    srcKid.cards.shift();
    /* kembalikan slot sumber yang dikosongkan menjadi garis putus */
    var wIdx = Math.round((parseInt(winner.style.left, 10) || 0) / (CFG.CW + CFG.INTRA));
    if (srcKid.slotEls && srcKid.slotEls[wIdx]) srcKid.slotEls[wIdx].classList.remove('filled');
    if (slot) slot.classList.add('next');
    winner.classList.add('fly', st.src === 'L' ? 'fly-l' : 'fly-r');
    winner.remove();
    els.flight.appendChild(winner);
    gsap.set(winner, { position: 'absolute', left: fromX, top: fromY, x: 0, y: 0 });
  }, null, t);

  tl.to(winner, {
    motionPath: {
      path: [{ x: 0, y: 0 }, { x: midX, y: midY }, { x: toX - fromX, y: toY - fromY }],
      curviness: 1.25
    },
    duration: 0.48, ease: 'power2.inOut'
  }, t + 0.02);

  tl.call(function () {
    /* mendarat tepat di posisi slotnya — kartu menjadi anak langsung grup
       (bukan anak slot), sehingga offsetParent selalu .group dan pengukuran
       posisi pada merge level berikutnya selalu tepat. */
    winner.classList.remove('fly', 'fly-l', 'fly-r');
    winner.style.position = 'absolute';
    winner.style.left = (st.insertIdx * (CFG.CW + CFG.INTRA)) + 'px';
    winner.style.top = '0px';
    gsap.set(winner, { clearProps: 'x,y' });
    g.el.appendChild(winner);
    if (slot) {
      slot.classList.remove('next');
      slot.classList.add('filled');
    }
    g.landed[st.insertIdx] = winner;
    bumpStat('wr');
  }, null, t + 0.5);

  tl.fromTo(winner,
    { scaleY: 0.8 },
    { scaleY: 1, duration: 0.24, ease: 'back.out(3)', transformOrigin: '50% 100%', immediateRender: false },
    t + 0.52);

  /* --- tutup grup: sweep, sorted, konsumsi children --- */
  if (st.last) {
    var end = t + 0.66;
    tl.call(function () {
      narrate('Sub-array terurut: [' + st.sortedVals.join(', ') + '].');
      var sw = document.createElement('div');
      sw.className = 'sweep';
      sw.style.left = '-64px';
      g.el.appendChild(sw);
      gsap.fromTo(sw, { x: 0 }, {
        x: g.w + 130, duration: 0.5, ease: 'power2.inOut',
        onComplete: function () { sw.remove(); }
      });
    }, null, end);
    tl.call(function () { g.el.classList.add('sorted'); }, null, end + 0.2);
    tl.to([kL.el, kR.el], { y: 12, opacity: 0, duration: 0.3, stagger: 0.05, ease: 'power1.in' }, end + 0.1);
    tl.call(function () {
      consumeGroup(kL, st.level + 1);
      consumeGroup(kR, st.level + 1);
      unfocus();
      reapEmptyTags();
    }, null, end + 0.46);
    tl.call(function () {
      /* kartu hasil merge menjadi kartu aktif grup ini (sumber merge level berikutnya) */
      g.cards = (g.landed || []).filter(Boolean).slice();
    }, null, end + 0.5);
  }

  return tl;
}

/* ============================================================
   RUNNER: PHASE — transisi fase
   ============================================================ */
function runPhase(st) {
  var tl = gsap.timeline();
  tl.call(function () {
    setPhase(st.phase);
    narrate('Fase 02 — seluruh elemen mencapai unit tunggal; penggabungan dimulai dari level terdalam.');
  }, null, 0);
  tl.fromTo(els.rows, { opacity: 1 }, { opacity: 1, duration: 0.55, immediateRender: false }, 0);
  return tl;
}

/* ============================================================
   RUNNER: FINALE — perayaan akhir yang elegan
   ============================================================ */
function runFinale() {
  var tl = gsap.timeline();
  var g0 = sim.levels[0][0];
  var cards = (g0.landed || []).filter(Boolean);
  tl.call(function () { setPhase('done'); }, null, 0);
  tl.call(function () {
    narrate('Terurut — ' + sim.cmp + ' perbandingan, ' + sim.wr + ' penempatan · O(n log n).');
  }, null, 0.12);
  if (cards.length) {
    tl.fromTo(cards, { y: 0 }, { y: -9, duration: 0.2, stagger: 0.035, ease: 'power2.out', immediateRender: false }, 0.05);
    tl.to(cards, { y: 0, duration: 0.4, stagger: 0.035, ease: 'back.out(2.4)' }, 0.28);
    tl.call(function () { g0.el.classList.add('final'); }, null, 0.3);
  }
  tl.call(function () {
    if (window.BG && BG.ok) {
      gsap.fromTo(BG.state, { energy: 0.95 }, { energy: 0.5, duration: 1.8, ease: 'power2.out', overwrite: 'auto' });
    }
  }, null, 0.15);
  tl.to({}, { duration: 0.5 }, '>');
  return tl;
}

var STEP_RUNNERS = {
  split: runSplit,
  place: runPlace,
  phase: runPhase,
  finale: runFinale
};
