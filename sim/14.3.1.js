// 14.3.1 Try it: turn a line and find the direction of greatest spread.
// The learner turns a line through the center of the tea map (drag or slider), watches each tea's shadow,
// drags teas, makes random clouds, and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, fmt, challenges } = kit;
  const START = [[-3, -2], [-3, -2], [-3, 2], [-3, 2], [3, -2], [3, -2], [3, 2], [3, 2]];
  const NAMES = 'ABCDEFGH';
  let pts = START.map(p => p.slice()), deg = 30, anim = 0, spin = false;
  let start = true, random = false, moved = false, byHand = false;

  const svg = s('svg', { viewBox: '0 0 700 520' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const slider = h('input', { type: 'range', min: 0, max: 179, step: 1, value: deg, 'aria-label': 'Turn the line', style: { flex: '1 1 12rem' },
    oninput: e => { stop(); deg = +e.target.value; byHand = true; draw(); } });
  const degLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const spinBtn = btn('Turn slowly', () => {
    if (spin) { stop(); return; }
    stop(); spin = true; byHand = false; spinBtn.textContent = 'Pause'; loop();
  });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: the direction of greatest spread'),
    h('p', { class: 'sub' }, 'Each dot is a tea on the map. Every tea casts a shadow straight onto the line through the center. Drag the line or use the slider to turn it. You can also drag the teas.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, slider, degLabel),
        h('div', { class: 'sim-row' },
          spinBtn,
          btn('Find the greatest spread', find, 'go'),
          btn('New data (random)', newData),
          btn('Back to the 8 teas', () => { stop(); pts = START.map(p => p.slice()); deg = 30; start = true; random = false; moved = false; byHand = false; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Turn the line until the shadows have the greatest spread. What is the variance?',
      check: st => st.start && st.v >= 8.95, why: 'Left to right gives a variance of 9. Along this line the eight teas are spread out the most.' },
    { text: 'Now turn the line until the shadows have the smallest spread.',
      check: st => st.start && st.v <= 4.05, why: 'Up and down gives only 4. The smallest spread is at a right angle to the greatest.' },
    { text: 'Press “New data”, then turn the line yourself until the variance is the greatest it can be.',
      check: st => st.random && st.byHand && st.v >= st.max * 0.99, why: 'Every cloud of dots has one direction of greatest spread: its first principal component.' },
    { text: 'Drag the teas so that the greatest spread goes up and down.',
      check: st => st.moved && st.max - st.min > 0.5 && Math.abs(st.best - 90) < 10,
      why: 'The best direction follows the data: it always points where the dots spread the most.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1, VH = 520;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const MT = 10, MB = 340, SC = Math.min((VW - 30) / 11, (MB - MT - 20) / 9);
  const OX = VW / 2, OY = (MT + MB) / 2;
  const X = x => OX + x * SC, Y = y => OY - y * SC, XU = px => (px - OX) / SC, YU = py => (OY - py) / SC;
  const CX0 = 40 * F, CX1 = VW - 14, CY0 = 490, CY1 = 380;
  const cid = 'pca-clip-' + Math.random().toString(36).slice(2);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r1 = x => fmt(Math.round(x * 10) / 10).replace('-', '−'), r2 = x => fmt(Math.round(x * 100) / 100).replace('-', '−');

  function stats() {
    const n = pts.length, mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n;
    let sxx = 0, syy = 0, sxy = 0;
    for (const [x, y] of pts) { sxx += (x - mx) ** 2 / n; syy += (y - my) ** 2 / n; sxy += (x - mx) * (y - my) / n; }
    const mid = (sxx + syy) / 2, r = Math.sqrt(((sxx - syy) / 2) ** 2 + sxy ** 2);
    const best = (0.5 * Math.atan2(2 * sxy, sxx - syy) * 180 / Math.PI + 180) % 180;
    return { n, mx, my, sxx, syy, sxy, max: mid + r, min: mid - r, best };
  }
  const varAt = (st, d) => { const t = d * Math.PI / 180, c = Math.cos(t), sn = Math.sin(t); return st.sxx * c * c + 2 * st.sxy * c * sn + st.syy * sn * sn; };

  function stop() { spin = false; cancelAnimationFrame(anim); spinBtn.textContent = 'Turn slowly'; }
  function loop() { if (!spin) return; deg = (deg + 0.6) % 180; draw(); anim = requestAnimationFrame(loop); }
  function find() {
    stop(); byHand = false;
    const st = stats(), from = deg, t0 = performance.now();
    const d = ((st.best - deg + 90) % 180 + 180) % 180 - 90;
    const step = now => {
      const q = Math.min(1, (now - t0) / 900);
      deg = ((from + d * q * q * (3 - 2 * q)) % 180 + 180) % 180;
      draw();
      if (q < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }
  function newData() {
    stop();
    const a = Math.random() * Math.PI, s1 = 2 + Math.random() * 2, s2 = 0.3 + Math.random() * 1.2;
    const cx = Math.random() * 2 - 1, cy = Math.random() * 2 - 1, r = () => Math.random() * 2 - 1;
    pts = pts.map(() => {
      const u = r() * s1, w = r() * s2;
      const x = cx + u * Math.cos(a) - w * Math.sin(a), y = cy + u * Math.sin(a) + w * Math.cos(a);
      return [clamp(Math.round(x * 2) / 2, -4.5, 4.5), clamp(Math.round(y * 2) / 2, -4, 4)];
    });
    start = false; random = true; moved = false; byHand = false;
    draw();
  }

  // drag a tea to move it, or drag anywhere else on the map to turn the line
  let drag = null;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y > MB) return;
    let hit = -1, bd = 16 * F;
    pts.forEach(([x, y], i) => { const d = Math.hypot(X(x) - p.x, Y(y) - p.y); if (d <= bd) { bd = d; hit = i; } });
    stop();
    drag = hit >= 0 ? { i: hit } : { line: true };
    svg.setPointerCapture(e.pointerId);
    move(e);
  });
  const move = e => {
    if (!drag) return;
    const p = toSvg(e);
    if (drag.line) {
      const st = stats(), dx = p.x - X(st.mx), dy = Y(st.my) - p.y;
      if (Math.hypot(dx, dy) < 8) return;
      deg = ((Math.atan2(dy, dx) * 180 / Math.PI) % 180 + 180) % 180; byHand = true;
    } else {
      pts[drag.i] = [clamp(Math.round(XU(p.x) * 2) / 2, -4.5, 4.5), clamp(Math.round(YU(p.y) * 2) / 2, -4, 4)];
      moved = true; start = false;
    }
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { drag = null; });
  svg.addEventListener('pointercancel', () => { drag = null; });

  function draw() {
    const st = stats(), t = deg * Math.PI / 180, c = Math.cos(t), sn = Math.sin(t);
    const ts = pts.map(([x, y]) => (x - st.mx) * c + (y - st.my) * sn);
    const sum = ts.reduce((a, d) => a + d * d, 0), v = sum / st.n;
    const k = [s('defs', {}, s('clipPath', { id: cid }, s('rect', { x: 4, y: MT, width: VW - 8, height: MB - MT })))];
    const clip = `url(#${cid})`;
    // grid and axes
    for (let g = -12; g <= 12; g++) {
      const gx = X(g), gy = Y(g), col = g ? C.line : C.muted;
      if (gx >= 4 && gx <= VW - 4) k.push(s('line', { x1: gx, x2: gx, y1: MT, y2: MB, stroke: col, 'stroke-opacity': g ? 0.6 : 0.8 }));
      if (gy >= MT && gy <= MB) k.push(s('line', { x1: 4, x2: VW - 4, y1: gy, y2: gy, stroke: col, 'stroke-opacity': g ? 0.6 : 0.8 }));
    }
    // the line through the center
    const cx = X(st.mx), cy = Y(st.my), foot = d => [X(st.mx + d * c), Y(st.my + d * sn)];
    k.push(s('line', { 'clip-path': clip, x1: X(st.mx - 30 * c), y1: Y(st.my - 30 * sn), x2: X(st.mx + 30 * c), y2: Y(st.my + 30 * sn), stroke: C.ink, 'stroke-width': 2.5 }));
    // spread of the shadows
    const [ax, ay] = foot(Math.min(...ts)), [bx, by] = foot(Math.max(...ts));
    k.push(s('line', { x1: ax, y1: ay, x2: bx, y2: by, stroke: C.green, 'stroke-width': 9, 'stroke-opacity': 0.45, 'stroke-linecap': 'round' }));
    // shadows
    pts.forEach(([x, y], i) => {
      const [fx, fy] = foot(ts[i]);
      k.push(s('line', { x1: X(x), y1: Y(y), x2: fx, y2: fy, stroke: C.violet, 'stroke-dasharray': '4 4', 'stroke-opacity': 0.8 }),
        s('circle', { cx: fx, cy: fy, r: 4.5, fill: C.violet }));
    });
    // center
    k.push(s('circle', { cx, cy, r: 6, fill: 'none', stroke: C.amber, 'stroke-width': 2 }),
      s('text', { x: cx + 9, y: cy - 9, fill: C.amber, 'font-size': 12 * F, 'font-family': 'Consolas' }, 'center'));
    // teas
    pts.forEach(([x, y], i) => {
      k.push(s('circle', { cx: X(x), cy: Y(y), r: 12, fill: C.cyan, 'fill-opacity': 0.18 }),
        s('circle', { cx: X(x), cy: Y(y), r: 6, fill: C.cyan }),
        s('text', { x: X(x) + (i % 2 ? 14 : -14), y: Y(y) + 5, fill: C.ink, 'font-size': 14 * F, 'font-weight': 700,
          'text-anchor': i % 2 ? 'start' : 'end', 'font-family': 'Consolas' }, NAMES[i]));
    });
    // variance for every turn of the line
    const ymax = Math.max(1, st.max) * 1.15, px = d => CX0 + d / 180 * (CX1 - CX0), py = val => CY0 - val / ymax * (CY0 - CY1);
    k.push(s('line', { x1: CX0, x2: CX1, y1: CY0, y2: CY0, stroke: C.muted }),
      s('line', { x1: CX0, x2: CX0, y1: CY0, y2: CY1 - 8, stroke: C.muted }),
      s('text', { x: CX0 + 6, y: CY1 - 12, fill: C.muted, 'font-size': 13 * F, 'font-family': 'Consolas' }, 'variance for every turn'));
    for (const d of [0, 90, 180]) k.push(s('text', { x: px(d), y: CY0 + 18 * F, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, d + '°'));
    const line = [];
    for (let d = 0; d <= 180; d += 2) line.push(`${px(d)},${py(varAt(st, d))}`);
    k.push(s('polyline', { points: line.join(' '), fill: 'none', stroke: C.cyan, 'stroke-width': 2.5 }),
      s('line', { x1: px(st.best), x2: px(st.best), y1: CY0, y2: py(st.max), stroke: C.green, 'stroke-dasharray': '5 5' }),
      s('circle', { cx: px(deg), cy: py(v), r: 7, fill: C.amber }));
    svg.replaceChildren(...k);

    slider.value = Math.min(179, Math.round(deg));
    degLabel.textContent = `Line turned ${Math.round(deg) % 180}°`;
    fbox(box, [`turn     = ${Math.round(deg) % 180}°`, `shadows  = ${ts.map(r1).join('  ')}`, `squares added = ${r2(sum)}`,
      [`variance = ${r2(sum)} ÷ ${st.n} = ${r2(v)}`, C.amber], [`greatest = ${r2(st.max)} at ${Math.round(st.best) % 180}°`, C.green]]);
    note.textContent = 'The green bar shows how far the shadows spread. Variance = the mean of the squared shadow distances from the center. The direction with the greatest variance is the first principal component.';
    chal.update({ start, random, moved, byHand, v: Math.round(v * 1000) / 1000, max: st.max, min: st.min, best: st.best });
  }
  draw();
  return () => stop();
}
