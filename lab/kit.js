// Shared kit of the "Algorithms in action" lab (site/lab/). Plain ES module, no libraries.
// Part 1 is pure (seeded random, small maths) and also runs under Node for the maths checks.
// Part 2 builds the page: HiDPI canvas plots, line charts, Play / Step / Reset bar, knobs, notice box, autotest.

export const C = { bg: '#0b1020', plot: '#0a0f1f', ink: '#eef2ff', muted: '#b2bdd9', dim: '#7d89b0', line: '#26305a', card: '#0f1630',
  cyan: '#5ad7e8', pink: '#f472b6', amber: '#fbbf24', green: '#86efac', violet: '#a78bfa', grey: '#56618a' };
export const PAL = [C.cyan, C.pink, C.amber, C.violet, C.green, '#fb923c', '#60a5fa', '#f87171', '#e2e8f0', '#2dd4bf'];

// ---------- Part 1: pure helpers ----------
// Seeded random numbers (mulberry32): the same seed always gives the same data and the same run.
export function rng(seed) {
  let a = (seed >>> 0) || 1, spare = null;
  const u = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const n = () => { if (spare !== null) { const s = spare; spare = null; return s; } let x, y, r; do { x = 2 * u() - 1; y = 2 * u() - 1; r = x * x + y * y; } while (r >= 1 || r === 0); const f = Math.sqrt(-2 * Math.log(r) / r); spare = y * f; return x * f; };
  return { u, n, int: k => Math.floor(u() * k), range: (lo, hi) => lo + u() * (hi - lo),
    shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(u() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; } };
}
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export function f(x, d = 2) { if (x == null || !Number.isFinite(x)) return '–'; return x.toFixed(d); }
export const pct = x => (x == null || !Number.isFinite(x)) ? '–' : Math.round(x * 100) + '%';
export function niceTicks(lo, hi, n = 4) {
  const span = hi - lo; if (!(span > 0)) return [lo];
  const raw = span / n, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
  const st = (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p, out = [];
  for (let v = Math.ceil(lo / st - 1e-9) * st; v <= hi + st * 1e-6; v += st) out.push(Math.abs(v) < st * 1e-9 ? 0 : v);
  return out;
}
export function tickText(v) {
  const a = Math.abs(v);
  if (a >= 1e6) return +(v / 1e6).toFixed(1) + 'M';
  if (a >= 1e4) return +(v / 1e3).toFixed(0) + 'k';
  if (a >= 100 || Number.isInteger(v)) return String(Math.round(v));
  if (a >= 1) return String(+v.toFixed(1));
  return String(+v.toPrecision(2));
}
const rgbCache = new Map();
export function rgb(hex) { let v = rgbCache.get(hex); if (!v) { const n = parseInt(hex.slice(1), 16); v = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; rgbCache.set(hex, v); } return v; }

// ---------- Part 2: page helpers (browser only) ----------
export const Q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
export function h(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') { for (const [a, b] of Object.entries(v)) a.startsWith('--') ? e.style.setProperty(a, b) : (e.style[a] = b); }
    else if (k === 'html') e.innerHTML = v;
    else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}
export const btn = (label, onclick, kind = '') => h('button', { class: 'lab-btn ' + kind, type: 'button', onclick }, label);
export const card = (cls, ...kids) => h('section', { class: 'lab-card ' + cls }, ...kids);

// Page frame: header, then a two-column layout (side: data, run bar, notice; main: the panels).
export function page({ num, title, intro }) {
  const root = document.getElementById('lab');
  root.append(h('header', { class: 'lab-head' },
    h('nav', { class: 'lab-nav' }, h('a', { href: 'index.html' }, '‹ All labs'), h('a', { href: '../index.html' }, 'Course map')),
    h('div', { class: 'lab-kick' }, `ALGORITHMS IN ACTION · LAB ${num} OF 5`),
    h('h1', {}, title), h('p', {}, intro)));
  const side = h('div', { class: 'lab-side' }), main = h('div', { class: 'lab-main' });
  root.append(h('div', { class: 'lab-layout' }, side, main));
  return { root, side, main };
}

// Canvas box that stays sharp on HiDPI screens and redraws when its size changes.
function canvasBox(aspect, render) {
  const el = h('div', { class: 'lab-plot' }); el.style.aspectRatio = String(aspect);
  const cv = h('canvas'); el.append(cv);
  const B = { el, cv, ctx: cv.getContext('2d'), W: 0, H: 0, dpr: 1 };
  let queued = false;
  B.render = () => { if (!B.W) return; B.ctx.setTransform(B.dpr, 0, 0, B.dpr, 0, 0); B.ctx.clearRect(0, 0, B.W, B.H); render(B); };
  B.redraw = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; B.render(); }); };
  const size = () => {
    const r = el.getBoundingClientRect(); if (r.width < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    if (Math.abs(r.width - B.W) < .5 && Math.abs(r.height - B.H) < .5 && dpr === B.dpr) return;
    B.W = r.width; B.H = r.height; B.dpr = dpr;
    cv.width = Math.round(B.W * dpr); cv.height = Math.round(B.H * dpr); B.render();
  };
  new ResizeObserver(size).observe(el);
  B.size = size;
  return B;
}

// Scatter / region plot in data coordinates. axes = {x:{name, lo, hi}, y:{name, lo, hi}} gives real units to the ticks.
export function plot(o = {}) {
  const P = canvasBox(o.aspect || 1, B => {
    const ctx = B.ctx, big = B.W >= 235 && P.axes && !o.noTicks;
    P.m = big ? { l: 38, r: 6, t: 6, b: 20 } : { l: 3, r: 3, t: 3, b: 3 };
    P.iw = B.W - P.m.l - P.m.r; P.ih = B.H - P.m.t - P.m.b;
    ctx.save(); ctx.beginPath(); ctx.rect(P.m.l, P.m.t, P.iw, P.ih); ctx.clip();
    if (P.draw) P.draw(P);
    ctx.restore();
    if (P.axes) drawAxes(P, big);
    if (P.over) P.over(P);
  });
  P.xr = o.xr || [-1.15, 1.15]; P.yr = o.yr || [-1.15, 1.15]; P.axes = o.axes || null; P.draw = null; P.m = { l: 3, r: 3, t: 3, b: 3 }; P.iw = 1; P.ih = 1;
  P.px = x => P.m.l + (x - P.xr[0]) / (P.xr[1] - P.xr[0]) * P.iw;
  P.py = y => P.m.t + (1 - (y - P.yr[0]) / (P.yr[1] - P.yr[0])) * P.ih;
  P.ux = px => P.xr[0] + (px - P.m.l) / P.iw * (P.xr[1] - P.xr[0]);
  P.uy = py => P.yr[0] + (1 - (py - P.m.t) / P.ih) * (P.yr[1] - P.yr[0]);
  // points: X = flat [x0,y0,x1,y1...]; colorOf(i) -> css colour or null (skip); hollowOf(i) -> ring instead of dot
  P.dots = (X, n, colorOf, r = 2.2, hollowOf = null) => {
    const ctx = P.ctx, groups = new Map();
    for (let i = 0; i < n; i++) { const c = colorOf(i); if (!c) continue; const k = (hollowOf && hollowOf(i) ? 'o' : 'f') + c; let g = groups.get(k); if (!g) groups.set(k, g = []); g.push(i); }
    for (const [k, g] of groups) {
      const hol = k[0] === 'o'; ctx.beginPath();
      for (const i of g) { const x = P.px(X[2 * i]), y = P.py(X[2 * i + 1]); ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 6.2832); }
      if (hol) { ctx.strokeStyle = k.slice(1); ctx.lineWidth = Math.max(1, r * .55); ctx.stroke(); } else { ctx.fillStyle = k.slice(1); ctx.fill(); }
    }
  };
  P.heat = (hm, alpha = 1, smooth = true) => { const ctx = P.ctx; ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = smooth; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(hm.cv, P.m.l, P.m.t, P.iw, P.ih); ctx.restore(); };
  P.path = (pts, color, width = 2, dash = null) => { const ctx = P.ctx; ctx.beginPath(); let pen = false; for (const p of pts) { if (!p || !Number.isFinite(p[1])) { pen = false; continue; } const x = P.px(p[0]), y = P.py(p[1]); if (pen) ctx.lineTo(x, y); else ctx.moveTo(x, y); pen = true; } ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]); };
  P.mark = (x, y, color, r = 6, shape = 'x') => {
    const ctx = P.ctx, X = P.px(x), Y = P.py(y); ctx.lineCap = 'round';
    for (const [col, w] of [['#050814', 5.5], [color, 2.6]]) {
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath();
      if (shape === 'x') { ctx.moveTo(X - r, Y - r); ctx.lineTo(X + r, Y + r); ctx.moveTo(X + r, Y - r); ctx.lineTo(X - r, Y + r); }
      else { ctx.arc(X, Y, r, 0, 6.2832); }
      ctx.stroke();
    }
  };
  return P;
}
function drawAxes(P, big) {
  const ctx = P.ctx, ax = P.axes; ctx.save();
  ctx.font = '600 10.5px Consolas, monospace'; ctx.fillStyle = C.dim; ctx.strokeStyle = '#2a355e'; ctx.lineWidth = 1;
  if (big) {
    ctx.strokeRect(P.m.l + .5, P.m.t + .5, P.iw - 1, P.ih - 1);
    const map = (a, r, v) => r[0] + (v - a.lo) / (a.hi - a.lo) * (r[1] - r[0]);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const v of niceTicks(ax.x.lo, ax.x.hi, P.iw > 330 ? 5 : 3)) { const x = P.px(map(ax.x, P.xr, v)); if (x < P.m.l + 8 || x > P.m.l + P.iw - 8) continue; ctx.fillText(tickText(v), x, P.m.t + P.ih + 4); }
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (const v of niceTicks(ax.y.lo, ax.y.hi, P.ih > 330 ? 5 : 3)) { const y = P.py(map(ax.y, P.yr, v)); if (y < P.m.t + 8 || y > P.m.t + P.ih - 8) continue; ctx.fillText(tickText(v), P.m.l - 4, y); }
  }
  const tag = (txt, x, y, align, base) => { ctx.textAlign = align; ctx.textBaseline = base; ctx.font = '600 10.5px "Segoe UI", Arial, sans-serif'; const w = ctx.measureText(txt).width; ctx.fillStyle = '#0a0f1fcc'; ctx.fillRect(align === 'right' ? x - w - 3 : x - 3, base === 'bottom' ? y - 13 : y - 2, w + 6, 15); ctx.fillStyle = '#aab4d6'; ctx.fillText(txt, x, y); };
  if (ax.x && ax.x.name) tag(ax.x.name + ' →', P.m.l + P.iw - 5, P.m.t + P.ih - 4, 'right', 'bottom');
  if (ax.y && ax.y.name) tag('↑ ' + ax.y.name, P.m.l + 5, P.m.t + 4, 'left', 'top');
  ctx.restore();
}

// Small image used for coloured regions: set pixels, flush, then plot.heat(hm).
export function heat(w, hh) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = hh; const c = cv.getContext('2d'), im = c.createImageData(w, hh);
  return { w, h: hh, cv, d: im.data, flush() { c.putImageData(im, 0, 0); },
    gx: (i, P) => P.xr[0] + (i + .5) / w * (P.xr[1] - P.xr[0]), gy: (j, P) => P.yr[1] - (j + .5) / hh * (P.yr[1] - P.yr[0]) };
}

// Line chart. set([{name, color, data:[...], xs?:[...], dash?}], {log, ymin, ymax, xmax, marks})
export function chart(o = {}) {
  let series = [], opt = {};
  const legend = h('div', { class: 'lab-legend' });
  const B = canvasBox(o.aspect || 2.2, B => {
    const ctx = B.ctx, m = { l: 44, r: 8, t: 8, b: 20 }, iw = B.W - m.l - m.r, ih = B.H - m.t - m.b, log = !!opt.log;
    const tr = v => log ? Math.log10(Math.max(v, 1e-12)) : v;
    let lo = Infinity, hi = -Infinity, xmax = opt.xmax || 1, xmin = opt.xmin || 0;
    for (const s of series) for (let i = 0; i < s.data.length; i++) { const v = s.data[i]; if (!Number.isFinite(v) || (log && v <= 0)) continue; const t = tr(v); if (t < lo) lo = t; if (t > hi) hi = t; const x = s.xs ? s.xs[i] : i; if (x > xmax) xmax = x; }
    if (opt.ymin != null) lo = Math.min(lo, tr(opt.ymin)); if (opt.ymax != null) hi = opt.clipMax ? tr(opt.ymax) : Math.max(hi, tr(opt.ymax));
    if (!Number.isFinite(lo)) { lo = 0; hi = 1; } if (hi - lo < 1e-9) { hi = lo + (Math.abs(lo) || 1) * .1; lo -= (Math.abs(lo) || 1) * .1; }
    const pad = (hi - lo) * .06; lo -= pad; hi += pad;
    const X = x => m.l + (x - xmin) / (xmax - xmin || 1) * iw, Y = v => m.t + (1 - (tr(v) - lo) / (hi - lo)) * ih;
    ctx.font = '600 10.5px Consolas, monospace'; ctx.strokeStyle = '#1c2647'; ctx.fillStyle = C.dim; ctx.lineWidth = 1;
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    const yt = log ? niceTicks(lo, hi, 4).filter(v => Math.abs(v - Math.round(v)) < 1e-6 || hi - lo < 1.5) : niceTicks(lo, hi, 4);
    for (const t of yt) { const y = m.t + (1 - (t - lo) / (hi - lo)) * ih; ctx.beginPath(); ctx.moveTo(m.l, y + .5); ctx.lineTo(m.l + iw, y + .5); ctx.stroke(); ctx.fillText(log ? (t < -2.5 ? '1e' + Math.round(t) : tickText(+Math.pow(10, t).toPrecision(2))) : (o.yfmt ? o.yfmt(t) : tickText(t)), m.l - 5, y); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const t of niceTicks(xmin, xmax, 5)) { if (o.intX && !Number.isInteger(t)) continue; ctx.fillText(o.xfmt ? o.xfmt(t) : tickText(t), X(t), m.t + ih + 5); }
    ctx.strokeStyle = '#2a355e'; ctx.strokeRect(m.l + .5, m.t + .5, iw - 1, ih - 1);
    ctx.save(); ctx.beginPath(); ctx.rect(m.l, m.t, iw, ih); ctx.clip();
    for (const mk of opt.marks || []) { if (mk.x != null) { ctx.strokeStyle = mk.color || C.dim; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X(mk.x), m.t); ctx.lineTo(X(mk.x), m.t + ih); ctx.stroke(); } if (mk.y != null) { ctx.strokeStyle = mk.color || C.dim; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(m.l, Y(mk.y)); ctx.lineTo(m.l + iw, Y(mk.y)); ctx.stroke(); } ctx.setLineDash([]); }
    for (const s of series) {
      ctx.beginPath(); let pen = false, last = null;
      for (let i = 0; i < s.data.length; i++) { const v = s.data[i]; if (!Number.isFinite(v) || (log && v <= 0)) { pen = false; continue; } const x = X(s.xs ? s.xs[i] : i), y = Y(v); if (pen) ctx.lineTo(x, y); else ctx.moveTo(x, y); pen = true; last = [x, y]; }
      ctx.strokeStyle = s.color; ctx.lineWidth = s.width || 2; ctx.lineJoin = 'round'; ctx.setLineDash(s.dash || []); ctx.stroke(); ctx.setLineDash([]);
      if (last) { ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(last[0], last[1], 3, 0, 6.2832); ctx.fill(); }
    }
    ctx.restore();
    if (o.xlab) { ctx.fillStyle = '#aab4d6'; ctx.font = '600 10.5px "Segoe UI", Arial, sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(o.xlab + ' →', m.l + iw - 4, m.t + ih - 3); }
  });
  const el = h('div', {}, legend, B.el);
  return { el, set(s, op = {}) { series = s; opt = op; const key = s.map(x => x.name + x.color).join('|'); if (legend.dataset.k !== key) { legend.dataset.k = key; legend.replaceChildren(...s.filter(x => x.name).map(x => h('span', {}, h('i', { style: { background: x.color } }), x.name))); } B.redraw(); } };
}

// Play / Step / Reset bar. step() does ONE step and returns true when everything is finished. frame() redraws.
export function runner({ step, reset, frame, unit = 'Step', from = 0 }) {
  let playing = false, done = false, count = 0, raf = 0, last = 0, acc = 0;
  const RATES = [1.5, 4, 10, 25, 60, 1e9];
  const bPlay = btn('▶ Play', () => (playing ? pause() : play()), 'go'), bStep = btn('Step', () => { pause(); one(); frame(); }), bReset = btn('Reset', () => { reset(); R.clear(); frame(); });
  const speed = h('input', { type: 'range', min: 1, max: 6, step: 1, value: Q.get('speed') || 3, 'aria-label': 'Speed' });
  const cnt = h('span', { class: 'lab-count' });
  const el = h('div', { class: 'lab-run' }, bPlay, bStep, bReset, h('label', {}, 'Speed', speed), cnt);
  const ui = () => { bPlay.textContent = playing ? '❚❚ Pause' : done ? '↻ Again' : '▶ Play'; bStep.disabled = done; cnt.textContent = (done ? 'Done · ' : '') + unit + ' ' + (count + from); };
  const one = () => { if (done) return; count++; done = !!step(); if (done) playing = false; };
  const loop = t => {
    if (!playing) return;
    const rate = RATES[speed.value - 1]; acc = Math.min(acc + Math.min(t - last, 100) / 1000 * rate, rate > 100 ? 1e9 : 4); last = t;
    const t0 = performance.now(); let did = false;
    while (acc >= 1 && !done && performance.now() - t0 < 14) { one(); acc -= 1; did = true; }
    if (rate > 100) acc = 1;
    if (did) { frame(); ui(); }
    if (playing) raf = requestAnimationFrame(loop); else ui();
  };
  const play = () => { if (done) { reset(); R.clear(); } playing = true; acc = 1; last = performance.now(); ui(); raf = requestAnimationFrame(loop); };
  const pause = () => { playing = false; cancelAnimationFrame(raf); ui(); };
  const R = { el, play, pause, get count() { return count; }, get done() { return done; }, get playing() { return playing; },
    clear() { pause(); done = false; count = 0; ui(); },
    runAll(max = 5000) { let g = 0; while (!done && g++ < max) one(); frame(); ui(); return g; },
    // ?run=N does N steps at once (used for screenshots), ?play=1 presses Play.
    auto() { const n = +Q.get('run'); if (n) { for (let i = 0; i < n && !done; i++) one(); frame(); ui(); } else if (Q.get('play')) play(); } };
  ui();
  return R;
}

export function slider({ label, min, max, step = 1, value, fmt = String, oninput }) {
  const out = h('output', {}, fmt(value));
  const inp = h('input', { type: 'range', min, max, step, value, 'aria-label': label, oninput: () => { out.textContent = fmt(+inp.value); oninput && oninput(+inp.value); } });
  const el = h('label', { class: 'lab-knob' }, h('span', {}, label, out), inp);
  return { el, get value() { return +inp.value; }, set(v, lim) { if (lim) { inp.min = lim[0]; inp.max = lim[1]; if (lim[2]) inp.step = lim[2]; } inp.value = v; out.textContent = fmt(+inp.value); } };
}
export function select({ label, options, value, onchange }) {
  const sel = h('select', { 'aria-label': label, onchange: () => onchange && onchange(sel.value) }, options.map(o => h('option', { value: o.id, selected: o.id === value }, o.name)));
  return { el: h('label', { class: 'lab-knob' }, h('span', {}, label), sel), get value() { return sel.value; }, set(v) { sel.value = v; } };
}
export function chips(items, value, onpick) {
  const el = h('div', { class: 'lab-chips', role: 'group' });
  const bs = items.map(it => h('button', { class: 'lab-chip', type: 'button', 'aria-pressed': String(it.id === value), onclick: () => { set(it.id); onpick(it.id); } }, it.name));
  const set = id => { value = id; bs.forEach((b, i) => b.setAttribute('aria-pressed', String(items[i].id === id))); };
  el.append(...bs);
  return { el, set, get value() { return value; } };
}
// One method panel: title, plot, small numbers.
export function panel(title, color, body, cls = '') {
  const note = h('small', {}), stat = h('div', { class: 'lab-stat' });
  const el = h('div', { class: 'lab-panel ' + cls }, h('div', { class: 'lab-ptitle', style: { color } }, h('span', {}, title), note), body, stat);
  return { el, stat(html) { if (stat._h !== html) { stat._h = html; stat.innerHTML = html; } }, note(t, col = '') { note.textContent = t; note.style.color = col; } };
}
export function notice(title = 'What to notice') {
  const ul = h('ul'), el = card('lab-notice', h('h2', { class: 'amber' }, title), ul);
  return { el, set(lines) { const key = lines.join('\n'); if (ul._k === key) return; ul._k = key; ul.replaceChildren(...lines.filter(Boolean).map(t => h('li', { html: t }))); } };
}
export const tryBox = lines => card('lab-try', h('h2', {}, 'Try this'), h('ul', {}, lines.map(t => h('li', { html: t }))));
export const legend = items => h('div', { class: 'lab-legend' }, items.map(([cls, color, text]) => h('span', {}, h('i', { class: cls, style: { background: color, borderColor: color } }), text)));

// ?autotest=1 : run every method on every dataset and print the checks in the page.
export async function autotest(name, fn) {
  const pre = h('pre', { id: 'autotest' }, `AUTOTEST ${name}\n`); document.body.prepend(pre);
  const t = { pass: 0, fail: 0, log(s) { pre.append(s + '\n'); }, ok(cond, msg) { if (cond) t.pass++; else { t.fail++; pre.append('FAIL  ' + msg + '\n'); } return cond; } };
  window.addEventListener('error', e => { t.fail++; t.log('PAGE ERROR ' + e.message); });
  try { await fn(t); } catch (e) { t.fail++; t.log('ERROR ' + (e && e.stack || e)); }
  await new Promise(r => setTimeout(r, 300));
  const de = document.documentElement;
  t.ok(de.scrollWidth <= window.innerWidth + 1, `sideways scroll: page ${de.scrollWidth}px > window ${window.innerWidth}px`);
  t.log(`layout window=${window.innerWidth}px page=${de.scrollWidth}px`);
  t.log(`AUTOTEST ${name} DONE pass=${t.pass} fail=${t.fail} ${t.fail ? 'FAILED' : 'ALL-OK'}`);
  document.title = `AUTOTEST ${t.fail ? 'FAILED' : 'ALL-OK'}`;
  if (window.parent !== window) window.parent.postMessage({ autotest: pre.textContent }, '*');   // phone-width test runs inside a 375px frame
}
// Node-side twin of the autotest reporter (see selftest.mjs).
export function reporter(log = console.log) { const t = { pass: 0, fail: 0, log, ok(cond, msg) { if (cond) t.pass++; else { t.fail++; log('FAIL  ' + msg); } return cond; } }; return t; }
