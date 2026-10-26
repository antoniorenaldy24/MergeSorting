/* ============================================================
   ENGINE — model merge sort + layout pohon rekursi + generator langkah.
   Setiap langkah dipetakan 1:1 ke operasi algoritma:
   - split  : partisi indeks (tanpa perbandingan)
   - place  : satu penempatan hasil perbandingan (two-pointer merge stabil)
   ============================================================ */

var CFG = {
  CW: 42,        // lebar kartu (natural px)
  CH: 42,        // tinggi kartu
  INTRA: 6,      // jarak antar kartu dalam satu grup
  INTER: 18,     // jarak antar grup
  ROWGAP: 32,    // jarak vertikal antar level
  TAGW: 46,      // lebar kolom label level
  PADT: 18,      // padding atas stage
  PADB: 20       // padding bawah stage
};

var els = {};
var layout = { W: 0, H: 0, scale: 1 };
var sim = {
  values: [], n: 8,
  levels: [], depth: 0,
  steps: [], i: 0,
  phase: 'idle', done: false,
  speed: 1.5,
  cmp: 0, wr: 0,
  tags: {}, tracked: []
};
var ctl = { playing: false, busy: false, current: null };

/* ---------- util ---------- */
function randUnique(n) {
  var pool = [];
  for (var v = 2; v <= 99; v++) pool.push(v);
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
  }
  return pool.slice(0, n);
}

/* ---------- pohon rekursi ----------
   Setiap level mempartisi [0,n) penuh: grup berukuran >1 dipecah dua,
   singleton disalin ke bawah (trunk) — merepresentasikan baris penuh. */
function buildTree(values) {
  var levels = [[{ from: 0, to: values.length, gi: 0, pk: -1, pgi: -1, children: null, copyNext: -1 }]];
  for (var k = 0; k < 24; k++) {
    var cur = levels[levels.length - 1];
    var next = [], any = false;
    cur.forEach(function (g) {
      var len = g.to - g.from;
      if (len > 1) {
        var mid = g.from + Math.floor(len / 2);
        g.children = [next.length, next.length + 1];
        next.push({ from: g.from, to: mid, gi: next.length, pk: k, pgi: g.gi, children: null, copyNext: -1 });
        next.push({ from: mid, to: g.to, gi: next.length, pk: k, pgi: g.gi, children: null, copyNext: -1 });
        any = true;
      } else {
        g.copyNext = next.length;
        next.push({ from: g.from, to: g.to, gi: next.length, pk: k, pgi: g.gi, children: null, copyNext: -1 });
      }
    });
    if (!any) break;
    levels.push(next);
  }
  return levels;
}

/* ---------- layout natural (independen viewport; scale hanya visual) ---------- */
function computeLayout() {
  var n = sim.n, depth = sim.depth;
  function rowW(k) {
    var m = sim.levels[k].length;
    return n * CFG.CW + (n - 1) * CFG.INTRA + (m - 1) * (CFG.INTER - CFG.INTRA);
  }
  var contentW = 0;
  for (var k = 0; k < depth; k++) contentW = Math.max(contentW, rowW(k));
  layout.W = contentW + CFG.TAGW * 2 + 10;
  layout.H = CFG.PADT + depth * (CFG.CH + CFG.ROWGAP) - CFG.ROWGAP + CFG.PADB;
  for (var k2 = 0; k2 < depth; k2++) {
    var gs = sim.levels[k2];
    var x = CFG.TAGW + 10 + (contentW - rowW(k2)) / 2;
    var y = CFG.PADT + k2 * (CFG.CH + CFG.ROWGAP);
    gs.forEach(function (g) {
      var len = g.to - g.from;
      g.w = len * CFG.CW + (len - 1) * CFG.INTRA;
      g.x = x; g.y = y; g.cx = x + g.w / 2;
      x += g.w + CFG.INTER;
    });
  }
  applyScale();
}

function applyScale() {
  var avail = els.viewport.clientWidth || 600;
  var s = Math.min(1, avail / layout.W);
  layout.scale = s;
  els.stageScale.style.width = layout.W + 'px';
  els.stageScale.style.height = layout.H + 'px';
  els.wires.setAttribute('width', layout.W);
  els.wires.setAttribute('height', layout.H);
  els.wires.setAttribute('viewBox', '0 0 ' + layout.W + ' ' + layout.H);
  els.stageScale.style.transform = s < 1 ? 'scale(' + s + ')' : '';
  els.viewport.style.height = Math.round(layout.H * s) + 'px';
}

/* ---------- DOM builder ---------- */
function buildGroupDOM(g) {
  var el = document.createElement('div');
  el.className = 'group';
  el.style.left = g.x + 'px';
  el.style.top = g.y + 'px';
  el.style.width = g.w + 'px';
  el.style.height = CFG.CH + 'px';
  g.cards = []; g.landed = null; g.slotEls = null; g.wires = null; g.consumed = false;
  for (var i = g.from; i < g.to; i++) {
    var c = document.createElement('div');
    c.className = 'card';
    c.textContent = sim.values[i];
    /* PENTING: kartu absolut di dalam grup — posisinya permanen.
       Saat kartu lain diambil, kartu ini TIDAK pernah bergeser. */
    c.style.left = ((i - g.from) * (CFG.CW + CFG.INTRA)) + 'px';
    el.appendChild(c);
    g.cards.push(c);
    sim.tracked.push(c);
  }
  els.rows.appendChild(el);
  g.el = el;
  sim.tracked.push(el);
  return el;
}

function buildSlots(g) {
  g.slotEls = [];
  g.landed = new Array(g.to - g.from).fill(null);
  for (var i = 0; i < g.to - g.from; i++) {
    var s = document.createElement('div');
    s.className = 'slot';
    s.style.left = (i * (CFG.CW + CFG.INTRA)) + 'px';
    g.el.appendChild(s);
    g.slotEls.push(s);
    sim.tracked.push(s);
  }
}

function createTag(k) {
  if (sim.tags[k]) return;
  var t = document.createElement('div');
  t.className = 'rowtag';
  var sub = k === 0 ? 'INPUT' : (k === sim.depth - 1 ? 'UNIT' : '');
  t.innerHTML = '<b>L' + k + '</b>' + (sub ? '<span>' + sub + '</span>' : '');
  t.style.left = '2px';
  t.style.top = (CFG.PADT + k * (CFG.CH + CFG.ROWGAP) + CFG.CH / 2) + 'px';
  els.rows.appendChild(t);
  sim.tags[k] = t;
}

/* ---------- wires (SVG) ---------- */
function parentGroup(g) {
  if (g.pk < 0) return null;
  return sim.levels[g.pk][g.pgi];
}

function wirePathD(px, py, cx, cy) {
  var dy = (cy - py) * 0.55;
  return 'M' + px.toFixed(1) + ' ' + py.toFixed(1) +
    ' C ' + px.toFixed(1) + ' ' + (py + dy).toFixed(1) + ', ' +
    cx.toFixed(1) + ' ' + (cy - dy).toFixed(1) + ', ' +
    cx.toFixed(1) + ' ' + cy.toFixed(1);
}

/* gambar wire dari parent g.pk → g; hot: 'l' | 'r' | '' */
function drawWiresInto(g, animate) {
  var p = parentGroup(g);
  if (!p) return;
  g.wires = g.wires || [];
  var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', wirePathD(p.cx, p.y + CFG.CH, g.cx, g.y));
  var hot = p.children ? (p.children[0] === g.gi ? 'l' : 'r') : '';
  if (hot) path.setAttribute('class', 'hot-' + hot);
  els.wires.appendChild(path);
  if (animate) {
    var len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    gsap.to(path, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' });
  }
  g.wires.push(path);
}

function removeWires(g) {
  if (!g.wires) return;
  var ws = g.wires; g.wires = null;
  gsap.to(ws, {
    opacity: 0, duration: 0.28, ease: 'power1.in',
    onComplete: function () { ws.forEach(function (p) { p.remove(); }); }
  });
}

/* ---------- generator langkah ---------- */
function fmtVals(g) {
  var out = [];
  for (var i = g.from; i < g.to; i++) out.push(sim.values[i]);
  return out.join(', ');
}

function buildSteps() {
  var steps = [];
  var levels = sim.levels, depth = sim.depth;

  /* fase 01 — pembagian (satu langkah per level, kiri→kanan dengan stagger) */
  for (var k = 0; k < depth - 1; k++) {
    steps.push({ type: 'split', level: k });
  }

  /* transisi fase */
  steps.push({ type: 'phase', phase: 'merge' });

  /* fase 02 — penggabungan (bottom-up, per grup kiri→kanan, per operasi)
     PENTING: merge disimulasikan terhadap keadaan TERURUT tiap sub-array
     (array kerja "arr" ditulis balik setelah tiap merge — meniru hasil rekursi). */
  var arr = sim.values.slice();
  for (var kk = depth - 2; kk >= 0; kk--) {
    levels[kk].forEach(function (g) {
      if (g.to - g.from <= 1 || !g.children) return;
      var kL = levels[kk + 1][g.children[0]];
      var kR = levels[kk + 1][g.children[1]];
      var L = arr.slice(kL.from, kL.to);
      var R = arr.slice(kR.from, kR.to);
      var li = 0, ri = 0, idx = 0, seq = [];
      while (li < L.length && ri < R.length) {
        var cmpv = { l: L[li], r: R[ri] };
        if (L[li] <= R[ri]) { seq.push({ src: 'L', val: L[li], cmp: cmpv }); li++; }
        else { seq.push({ src: 'R', val: R[ri], cmp: cmpv }); ri++; }
      }
      while (li < L.length) { seq.push({ src: 'L', val: L[li], drain: true }); li++; }
      while (ri < R.length) { seq.push({ src: 'R', val: R[ri], drain: true }); ri++; }
      seq.forEach(function (s, j) { arr[g.from + j] = s.val; });
      seq.forEach(function (s, j) {
        steps.push({
          type: 'place', level: kk, g: g, kids: [kL, kR],
          src: s.src, val: s.val, cmp: s.cmp || null, drain: !!s.drain,
          first: j === 0, last: j === seq.length - 1,
          insertIdx: j, sortedVals: seq.map(function (x) { return x.val; })
        });
      });
    });
  }

  steps.push({ type: 'finale' });
  return steps;
}

/* ---------- rebuild total ---------- */
function rebuild(randomize) {
  ctl.playing = false;
  if (ctl.current) { ctl.current.kill(); ctl.current = null; }
  ctl.busy = false;
  gsap.killTweensOf(sim.tracked);
  sim.tracked.forEach(function (el) { gsap.killTweensOf(el); });
  els.rows.innerHTML = '';
  els.wires.innerHTML = '';
  els.flight.innerHTML = '';
  sim.tracked = [];

  if (randomize) sim.values = randUnique(sim.n);
  sim.levels = buildTree(sim.values);
  sim.depth = sim.levels.length;
  sim.tags = {};
  computeLayout();
  createTag(0);
  buildGroupDOM(sim.levels[0][0]);
  sim.steps = buildSteps();
  sim.i = 0; sim.cmp = 0; sim.wr = 0;
  sim.done = false; sim.phase = 'idle';

  if (typeof UI !== 'undefined' && UI.resetVisuals) UI.resetVisuals();
}

/* ---------- init elemen stage ---------- */
function initEngine() {
  els.viewport = document.getElementById('stage-viewport');
  els.stageScale = document.getElementById('stage-scale');
  els.wires = document.getElementById('wires');
  els.rows = document.getElementById('rows');
  els.flight = document.getElementById('flight');
  els.panel = document.getElementById('panel');
  sim.n = window.innerWidth < 560 ? 6 : 8;
  sim.values = randUnique(sim.n);
  sim.levels = buildTree(sim.values);
  sim.depth = sim.levels.length;
  computeLayout();
  createTag(0);
  buildGroupDOM(sim.levels[0][0]);
  sim.steps = buildSteps();
}
