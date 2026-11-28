// 14.3.2 Try it: explained variance.
// The learner drags the variance of each principal component (or taps one and uses -1 / +1), sets a target,
// chooses how many PCs to keep, makes random data, and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [54, 24, 2], COLS = [C.cyan, C.amber, C.pink, C.violet, C.green], VMAX = 60;
  let v = START.slice(), keep = 2, target = 95, sel = 0, randomCount = 0;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const tgtLabel = h('span', { class: 'sim-note', style: { margin: 0, minWidth: '7.5rem' } });
  const slider = h('input', { type: 'range', min: 50, max: 99, step: 1, value: target, 'aria-label': 'Target share of the total variance', style: { flex: '1 1 10rem' } });
  slider.addEventListener('input', () => { target = +slider.value; draw(); });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: how many patterns do we need?'),
    h('p', { class: 'sub' }, 'Each column is the variance of one principal component (PC). Drag a column up or down, or tap it and use −1 / +1. The long bar shares the total variance between the PCs; tap a part of it to keep the PCs up to there.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1', () => bump(-1)), btn('+1', () => bump(1)), selLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, tgtLabel, slider),
        h('div', { class: 'sim-row' },
          btn('Keep one fewer PC', () => { keep = Math.max(1, keep - 1); draw(); }),
          btn('Keep one more PC', () => { keep = Math.min(v.length, keep + 1); draw(); }, 'go'),
          btn('New data (random)', newData),
          btn('Start again', () => { v = START.slice(); keep = 2; target = 95; slider.value = 95; sel = 0; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const total = () => v.reduce((a, b) => a + b, 0);
  const r2 = x => Math.round(x * 100) / 100;
  const pcts = () => v.map(x => r2(x / total() * 100));
  const keptPct = k => r2(v.slice(0, k).reduce((a, b) => a + b, 0) / total() * 100);
  const needed = () => { for (let k = 1; k <= v.length; k++) if (keptPct(k) >= target) return k; return v.length; };
  const chal = challenges(ch, [
    { text: 'Make PC1 explain exactly 50 % of the total variance.',
      check: st => st.pct[0] === 50, why: 'Yes! PC1’s variance is now exactly half of the total, so its share is 50 %.' },
    { text: 'With a 95 % target, make PC3 big enough that keeping 2 PCs is no longer enough.',
      check: st => st.n >= 3 && st.target === 95 && st.cum2 < 95,
      why: 'Right: when the third pattern holds more of the variance, the first two together fall below the target.' },
    { text: 'Set the target to 99 % and keep the fewest PCs that reach it.',
      check: st => st.target === 99 && st.keep === st.needed,
      why: 'Well done: a higher target usually needs more PCs, and you kept no more than necessary.' },
    { text: 'Press “New data” twice. Do the shares always add up to 100 %?',
      check: st => st.randomCount >= 2,
      why: 'Always. The shares split one total, so together they fill the whole bar: 100 %.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1;
  const X0 = NARROW ? 34 : 50, X1 = VW - 10, TOP = 34, BASE = 200, BY = 262, BH = 40;
  svg.setAttribute('viewBox', `0 0 ${VW} 440`);
  const unit = (BASE - TOP) / VMAX, slot = () => (X1 - X0) / v.length;
  const bx = p => X0 + (X1 - X0) * p / 100;
  const clamp = x => Math.max(1, Math.min(VMAX, x));

  function sortV() { const val = v[sel]; v.sort((a, b) => b - a); sel = v.indexOf(val); }
  function bump(d) { v[sel] = clamp(v[sel] + d); sortV(); draw(); }
  function newData() {
    const n = rnd(3, 5);
    v = Array.from({ length: n }, () => rnd(1, VMAX)).sort((a, b) => b - a);
    keep = Math.min(keep, n); sel = 0; randomCount++; draw();
  }

  // drag a column: pointer height sets its variance; tap the long bar: keep the PCs up to there
  let dragging = -1;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y >= BY - 6 && p.y <= BY + BH + 6) {
      const u = (p.x - X0) / (X1 - X0) * total();
      let acc = 0; keep = v.length;
      for (let i = 0; i < v.length; i++) { acc += v[i]; if (u <= acc) { keep = i + 1; break; } }
      draw(); return;
    }
    if (p.y > BASE + 30) return;
    const i = Math.floor((p.x - X0) / slot());
    if (i < 0 || i >= v.length) return;
    sel = i; dragging = i; svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    v[dragging] = clamp(Math.round((BASE - p.y) / unit));
    draw();
  };
  const drop = () => { if (dragging >= 0) { dragging = -1; sortV(); draw(); } };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', drop);
  svg.addEventListener('pointercancel', drop);

  function draw() {
    const n = v.length, tot = total(), pc = pcts(), cum = keptPct(keep), ok = cum >= target, sl = slot(), bw = Math.min(64, sl * 0.6);
    const k = [s('text', { x: X0, y: 16, fill: C.muted, 'font-size': 12 * F, 'font-family': 'Consolas' }, 'variance')];
    for (let g = 0; g <= VMAX; g += 20) {
      const y = BASE - g * unit;
      k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g));
    }
    // one column per PC
    v.forEach((val, i) => {
      const cx = X0 + sl * (i + 0.5), col = COLS[i], top = BASE - val * unit;
      if (i === sel) k.push(s('rect', { x: cx - sl / 2 + 3, y: TOP - 10, width: sl - 6, height: BASE - TOP + 34, fill: '#ffffff', 'fill-opacity': .04, rx: 8 }));
      k.push(s('rect', { x: cx - bw / 2, y: top, width: bw, height: BASE - top, fill: col, 'fill-opacity': i < keep ? .85 : .25, rx: 3 }),
        s('text', { x: cx, y: top - 8, fill: col, 'font-size': 16 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, val),
        s('text', { x: cx, y: BASE + 22, fill: col, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'PC' + (i + 1)));
    });
    // the long bar: one block per unit of variance when they fit, else one part per PC
    const uw = (X1 - X0) / tot;
    let acc = 0;
    v.forEach((val, i) => {
      const col = COLS[i], op = i < keep ? .85 : .2, x0 = X0 + acc * uw, w = val * uw;
      if (uw >= 3) for (let b = 0; b < val; b++) k.push(s('rect', { x: x0 + b * uw + 0.5, y: BY, width: uw - 1, height: BH, fill: col, 'fill-opacity': op, rx: 1 }));
      else k.push(s('rect', { x: x0 + 0.5, y: BY, width: Math.max(0, w - 1), height: BH, fill: col, 'fill-opacity': op, rx: 2 }));
      if (w >= 34 * F) k.push(s('text', { x: x0 + w / 2, y: BY - 9, fill: col, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(pc[i]) + ' %'));
      acc += val;
    });
    // percent scale, target and kept share
    for (const p of [0, 25, 50, 75, 100]) {
      const x = bx(p);
      k.push(s('line', { x1: x, x2: x, y1: BY + BH + 3, y2: BY + BH + 9, stroke: C.muted }),
        s('text', { x, y: BY + BH + 24, fill: C.muted, 'font-size': 12 * F, 'text-anchor': p === 0 ? 'start' : p === 100 ? 'end' : 'middle', 'font-family': 'Consolas' }, p + ' %'));
    }
    const tx = bx(target);
    k.push(s('line', { x1: tx, x2: tx, y1: BY - 4, y2: BY + BH + 32, stroke: C.green, 'stroke-width': 3, 'stroke-dasharray': '7 5' }),
      s('text', { x: Math.max(X0 + 60 * F, Math.min(X1 - 60 * F, tx)), y: BY + BH + 48, fill: C.green, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `target ${target} %`));
    const kc = ok ? C.green : C.pink;
    k.push(s('line', { x1: X0, x2: bx(cum), y1: BY + BH + 66, y2: BY + BH + 66, stroke: kc, 'stroke-width': 5, 'stroke-linecap': 'round' }),
      s('text', { x: X0, y: BY + BH + 90, fill: kc, 'font-size': 15 * F, 'font-weight': 700, 'font-family': 'Consolas' }, `kept ${keep} PC${keep > 1 ? 's' : ''}: ${fmt(cum)} %`));
    svg.replaceChildren(...k);

    const lines = [`total = ${v.join(' + ')} = ${tot}`];
    v.forEach((x, i) => lines.push([`PC${i + 1}: ${x} ÷ ${tot} × 100 = ${fmt(pc[i])} %`, COLS[i]]));
    lines.push(`kept = ${pc.slice(0, keep).map(fmt).join(' + ')}${keep > 1 ? ` = ${fmt(cum)}` : ''} %`);
    lines.push([`${fmt(cum)} % ${ok ? '≥' : '<'} ${target} %  ${ok ? '✓ target reached' : '✗ below the target'}`, kc]);
    fbox(box, lines);
    const need = needed();
    note.textContent = `To keep at least ${target} % of the variance you need ${need} PC${need > 1 ? 's' : ''}. ` +
      (keep < n ? `The PCs you drop still hold ${fmt(r2(100 - cum))} %: small, but it may be the detail your question needs.`
        : 'You keep every PC: nothing is lost, but nothing is simpler either.');
    selLabel.textContent = `Selected: PC${sel + 1} (variance ${v[sel]})`;
    tgtLabel.textContent = `Target: ${target} %`;
    chal.update({ pct: pc, n, v, keep, target, needed: need, cum2: n >= 2 ? keptPct(2) : 100, randomCount });
  }
  draw();
  return () => {};
}
