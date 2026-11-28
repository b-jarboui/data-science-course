// 1.2.4 Try it: the mean as a fair share.
// The learner drags stacks of minute-blocks (or taps one and uses -1 / +1), levels them,
// makes random classes, and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [10, 12, 15, 18, 25, 30, 30];
  let v = START.slice(), sel = 0, level = 0, anim = 0, randomLevels = 0, random = false;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: the fair share'),
    h('p', { class: 'sub' }, 'Each stack is one student’s trip, one block per minute. Drag a stack up or down, or tap it and use −1 / +1.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1', () => bump(-1)), btn('+1', () => bump(1)), selLabel),
        h('div', { class: 'sim-row' },
          btn('Level the stacks', () => go(1), 'go'),
          btn('Back to the trips', () => go(0)),
          btn('New class (random)', () => { v = v.map(() => rnd(5, 40)); random = true; changed(); }),
          btn('Add a student', () => { if (v.length < 10) { v.push(rnd(5, 40)); changed(); } }),
          btn('Remove a student', () => { if (v.length > 2) { v.pop(); sel = Math.min(sel, v.length - 1); changed(); } }),
          btn('Add a 90-minute trip', () => { if (v.length < 10) { v.push(90); changed(); } }),
          btn('Start again', () => { v = START.slice(); random = false; sel = 0; changed(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const total = () => v.reduce((a, b) => a + b, 0);
  const mean = () => total() / v.length;
  const r2 = x => Math.round(x * 100) / 100;
  const chal = challenges(ch, [
    { text: 'Make the mean exactly 25 minutes.',
      check: st => st.mean === 25, why: 'Yes! Now the total, shared equally, gives everyone 25 minutes.' },
    { text: 'With 7 students, change some trips but keep the mean at exactly 20.',
      check: st => st.mean === 20 && st.n === 7 && st.v.join() !== START.join(),
      why: 'Right: very different trips can have the same mean, as long as the total stays 140.' },
    { text: 'Press “Add a 90-minute trip”. How far does one student pull the mean?',
      check: st => st.v.includes(90),
      why: 'One very long trip adds a lot to the total, so everyone’s fair share goes up. The mean is easy to pull.' },
    { text: 'Press “New class” and then “Level the stacks”, twice. Is the level always the total divided by the count?',
      check: st => st.randomLevels >= 2,
      why: 'Always. Levelling never adds or removes a block, so the level is the total shared equally.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1;
  const X0 = NARROW ? 34 : 50, X1 = VW - 10, BASE = 392, TOP = 30;
  svg.setAttribute('viewBox', `0 0 ${VW} 440`);
  const maxv = () => Math.max(40, ...v);
  const unit = () => (BASE - TOP) / maxv();
  const slot = () => (X1 - X0) / v.length;

  function changed() { cancelAnimationFrame(anim); level = 0; draw(); }
  function bump(d) { v[sel] = Math.max(1, Math.min(90, v[sel] + d)); changed(); }
  function go(target) {
    if (target === 1 && random && level < 0.5) randomLevels++;
    cancelAnimationFrame(anim);
    const from = level, t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 900);
      level = from + (target - from) * k * k * (3 - 2 * k);
      draw();
      if (k < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  // drag a stack: pointer height sets the trip length
  let dragging = -1;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), i = Math.floor((p.x - X0) / slot());
    if (i < 0 || i >= v.length) return;
    sel = i; dragging = i; svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    v[dragging] = Math.max(1, Math.min(90, Math.round((BASE - p.y) / unit())));
    changed();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });

  function draw() {
    const n = v.length, m = mean(), u = unit(), sl = slot(), bw = Math.min(60, sl * 0.7), mx = maxv();
    const k = [];
    for (let g = 0; g <= mx; g += 10) {
      const y = BASE - g * u;
      k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g));
    }
    v.forEach((val, i) => {
      const hgt = val + (m - val) * level, cx = X0 + sl * (i + 0.5), col = val === 90 ? C.pink : C.cyan;
      if (i === sel) k.push(s('rect', { x: cx - sl / 2 + 3, y: TOP - 10, width: sl - 6, height: BASE - TOP + 10, fill: '#ffffff', 'fill-opacity': .04, rx: 8 }));
      for (let b = 0; b < Math.ceil(hgt - 1e-9); b++) {
        const part = Math.min(1, hgt - b);
        k.push(s('rect', { x: cx - bw / 2, y: BASE - (b + part) * u + 0.6, width: bw, height: Math.max(0, part * u - 1.2), fill: col, 'fill-opacity': .82, rx: 1.5 }));
      }
      k.push(s('text', { x: cx, y: BASE + 24, fill: col, 'font-size': (n > 8 ? 14 : 17) * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(r2(hgt))));
    });
    const ym = BASE - m * u;
    k.push(s('line', { x1: X0, x2: X1, y1: ym, y2: ym, stroke: C.amber, 'stroke-width': 3, 'stroke-dasharray': '9 7' }),
      s('rect', { x: X1 - 128 * F, y: ym - 32 * F, width: 128 * F, height: 26 * F, rx: 13 * F, fill: C.bg, stroke: C.amber }),
      s('text', { x: X1 - 64 * F, y: ym - 14 * F, fill: C.amber, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'MEAN ' + fmt(r2(m))));
    svg.replaceChildren(...k);
    const list = v.join(' + ');
    fbox(box, [list.length <= 40 ? `sum   = ${list}` : 'sum   = all trips added', `      = ${total()}`, `count = ${n}`,
      [`mean  = ${total()} ÷ ${n} = ${fmt(r2(m))}`, C.amber]]);
    note.textContent = level > 0.99 ? 'Levelled: every stack holds the fair share. No block was added or removed.'
      : 'The dashed line is the mean: the level every stack would reach if the blocks were shared equally.';
    selLabel.textContent = `Selected: student ${sel + 1} (${v[sel]} min)`;
    chal.update({ mean: Math.round(m * 1000) / 1000, n, v, randomLevels });
  }
  draw();
  return () => cancelAnimationFrame(anim);
}
