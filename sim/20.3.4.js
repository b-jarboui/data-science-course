// 20.3.4 Try it: the temperature dial.
// The learner turns the temperature, drags the raw scores (or taps a row and uses -0.1 / +0.1),
// draws tokens by chance many times, and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const TOK = ['at', 'on', 'soon', 'late', 'purple'];
  const START = [2.4, 2.0, 1.3, 0.4, 0];
  let z = START.slice(), temp = 1, sel = 0, counts = [0, 0, 0, 0, 0], draws = 0, last = -1, anim = 0;

  const svg = s('svg', { viewBox: '0 0 700 360' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const tLabel = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', fontWeight: 700, color: C.amber } });
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const slider = h('input', { type: 'range', min: 0.05, max: 5, step: 0.05, value: 1, style: { flex: '1 1 10rem' }, 'aria-label': 'Temperature',
    oninput: e => setT(+e.target.value) });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: the temperature dial'),
    h('p', { class: 'sub' }, 'Each row is a possible next token after “The library will open”. Turn the temperature, drag a raw score, and draw tokens by chance to see how often each one comes out.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Temperature'), slider, tLabel),
        h('div', { class: 'sim-row' },
          btn('T = 0.5', () => setT(0.5)), btn('T = 1', () => setT(1)), btn('T = 2', () => setT(2))),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−0.1', () => bump(-0.1)), btn('+0.1', () => bump(0.1)), selLabel),
        h('div', { class: 'sim-row' },
          btn('Draw 100 tokens', () => drawMany(100), 'go'),
          btn('Draw 1 token', () => drawMany(1)),
          btn('Clear draws', () => { cancelAnimationFrame(anim); clearDraws(); draw(); }),
          btn('New scores (random)', () => { z = z.map(() => rnd(0, 40) / 10); changed(); }),
          btn('Start again', () => { z = START.slice(); sel = 0; setT(1); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const r1 = x => Math.round(x * 10) / 10, r2 = x => Math.round(x * 100) / 100;
  const probsAt = t => {
    const a = z.map(v => v / t), m = Math.max(...a), e = a.map(v => Math.exp(v - m)), sum = e.reduce((x, y) => x + y, 0);
    return e.map(v => v / sum);
  };
  const probs = () => probsAt(temp);
  const chal = challenges(ch, [
    { text: 'Turn the dial until the top token’s chance is above 90%.',
      check: st => st.top > 90, why: 'Yes! A low temperature stretches every gap, so the top token takes almost everything, like greedy decoding.' },
    { text: 'With the starting scores, make “purple” reach at least 12% using only the dial.',
      check: st => st.start && st.lastP >= 12, why: 'Right: a high temperature shrinks every gap, so even nonsense like “purple” gets drawn more often.' },
    { text: 'Predict first: at T = 2, will “at” still have the biggest chance? Set T = 2 and draw 100 tokens.',
      check: st => st.T === 2 && st.draws >= 100,
      why: 'Dividing every score by the same number keeps their order, so “at” keeps the biggest bar. With only 100 draws, luck can still mix up close counts.' },
    { text: 'Turn T down to 0.1 or less and draw 100 tokens. How many are not the top token?',
      check: st => st.T <= 0.1 && st.draws >= 100, why: 'Almost none: near zero, the draw nearly always picks the top token, just like greedy decoding.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1, VH = 360;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const NX = 10, TX0 = NARROW ? 80 : 92, TX1 = NARROW ? 170 : 250, BX0 = NARROW ? 190 : 290;
  const BW = VW - (NARROW ? 62 : 70) - BX0;
  const ROW = i => 66 + i * 62;
  const sx = v => TX0 + v / 5 * (TX1 - TX0);

  function clearDraws() { counts = [0, 0, 0, 0, 0]; draws = 0; last = -1; }
  function changed() { cancelAnimationFrame(anim); clearDraws(); draw(); }
  function setT(v) { temp = Math.max(0.05, Math.min(5, Math.round(v * 100) / 100)); slider.value = temp; changed(); }
  function bump(d) { z[sel] = Math.max(0, Math.min(5, Math.round((z[sel] + d) * 10) / 10)); changed(); }
  function drawOne() {
    const p = probs();
    let r = Math.random(), i = 0;
    while (i < p.length - 1 && r >= p[i]) { r -= p[i]; i++; }
    counts[i]++; draws++; last = i;
  }
  function drawMany(n) {
    cancelAnimationFrame(anim);
    let left = n;
    const per = Math.max(1, Math.ceil(n / 40));
    const step = () => {
      for (let j = 0; j < per && left > 0; j++, left--) drawOne();
      draw();
      if (left > 0) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  // drag a score dot left or right; tap a row to select it
  let dragging = -1;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), i = Math.floor((p.y - 35) / 62);
    if (i < 0 || i >= TOK.length) return;
    sel = i;
    if (p.x < BX0 - 8) { dragging = i; svg.setPointerCapture(e.pointerId); move(e); } else draw();
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    z[dragging] = Math.max(0, Math.min(5, Math.round((p.x - TX0) / (TX1 - TX0) * 50) / 10));
    changed();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });

  function draw() {
    const p = probs(), base = probsAt(1), k = [];
    const head = (x, text, anchor) => s('text', { x, y: 24, fill: C.muted, 'font-size': 13 * F, 'text-anchor': anchor, 'font-family': 'Segoe UI, Arial' }, text);
    k.push(head(NX, 'token', 'start'), head((TX0 + TX1) / 2, 'raw score', 'middle'), head(BX0, 'chance (dashed: T = 1)', 'start'));
    TOK.forEach((t, i) => {
      const y = ROW(i), w = p[i] * BW, g = base[i] * BW, col = i === last ? C.amber : C.cyan;
      if (i === sel) k.push(s('rect', { x: 2, y: y - 29, width: VW - 4, height: 56, rx: 10, fill: '#ffffff', 'fill-opacity': .04 }));
      k.push(s('text', { x: NX, y: y + 5, fill: i === last ? C.amber : C.ink, 'font-size': 16 * F, 'font-weight': 700, 'font-family': 'Segoe UI, Arial' }, t),
        s('line', { x1: TX0, x2: TX1, y1: y, y2: y, stroke: C.line, 'stroke-width': 4, 'stroke-linecap': 'round' }),
        s('circle', { cx: sx(z[i]), cy: y, r: 9 * F, fill: C.cyan }),
        s('text', { x: sx(z[i]), y: y - 13 * F, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(z[i])),
        s('rect', { x: BX0, y: y - 12, width: Math.max(1, g), height: 18, fill: 'none', stroke: C.muted, 'stroke-dasharray': '4 3', rx: 2 }),
        s('rect', { x: BX0, y: y - 12, width: Math.max(1, w), height: 18, fill: col, 'fill-opacity': .82, rx: 2 }),
        s('text', { x: BX0 + Math.max(w, g) + 6, y: y + 3, fill: col, 'font-size': 14 * F, 'font-weight': 700, 'font-family': 'Consolas' }, fmt(r1(p[i] * 100)) + '%'));
      if (draws) {
        const dw = counts[i] / draws * BW;
        k.push(s('rect', { x: BX0, y: y + 10, width: Math.max(1, dw), height: 6, fill: C.amber, rx: 2 }),
          s('text', { x: BX0 + dw + 6, y: y + 18, fill: C.amber, 'font-size': 11 * F, 'font-family': 'Consolas' }, counts[i]));
      }
    });
    svg.replaceChildren(...k);
    const i = sel, order = z.map((_, j) => j).sort((a, b) => z[b] - z[a]), gap = z[order[0]] - z[order[1]];
    fbox(box, [`T = ${fmt(temp)}`, 'new score = old score ÷ T',
      `${TOK[i]}: ${fmt(z[i])} ÷ ${fmt(temp)} = ${fmt(r2(z[i] / temp))}`,
      `gap 1st − 2nd: ${fmt(r2(gap))} → ${fmt(r2(gap / temp))}`,
      [`softmax: ${TOK[i]} = ${fmt(r1(p[i] * 100))}%`, C.amber]]);
    const mood = temp < 1 ? 'Below 1: every gap grows, so the chances get sharper.'
      : temp > 1 ? 'Above 1: every gap shrinks, so the chances get flatter.' : 'T = 1: the scores are used as they are.';
    note.textContent = `${mood} The order of the chances never changes. ` +
      (draws ? `Draws so far: ${draws} (thin amber bars).` : 'Press “Draw 100 tokens” to draw by chance.');
    tLabel.textContent = `T = ${fmt(temp)}`;
    selLabel.textContent = `Selected: “${TOK[sel]}” (score ${fmt(z[sel])})`;
    chal.update({ top: Math.max(...p) * 100, lastP: p[4] * 100, start: z.join() === START.join(), T: temp, draws });
  }
  draw();
  return () => cancelAnimationFrame(anim);
}
