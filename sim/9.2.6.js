// 9.2.6 Try it: gradient descent on the rent line (chapters/9.2.md).
// The dot walks down the loss map (a bowl seen from above) one step at a time while the rent line swings toward the dots.
// Knobs: learning rate and start point (sliders, or tap the map). Built on iter.js.
import { iterSim, num, sgn } from './iter.js';

const SIZE = [-1, 0, 1], RENT = [9, 11, 13], DOT = ['#5ad7e8', '#eef2ff', '#f472b6'];
const guesses = st => SIZE.map(x => st.m + st.s * x);
const misses = st => guesses(st).map((g, i) => g - RENT[i]);
const lossOf = st => misses(st).reduce((a, d) => a + d * d, 0);
const grad = st => [4 * (st.s - 2), 6 * (st.m - 11)];   // uphill slope for step price, for middle rent
const list = a => a.map(num).join(', ');
const slist = a => a.map(sgn).join(', ');
const RATE = { 0.01: ' (one hundredth)', 0.1: ' (one tenth)', 0.25: ' (a quarter)' };

export default function mount(root, kit) {
  const { s, C } = kit;
  let G;   // geometry, set in setup
  // map: step price -3..7 across, middle rent 6..16 up
  const px = v => G.MX0 + (v + 3) / 10 * (G.MX1 - G.MX0);
  const py = v => G.MY1 - (v - 6) / 10 * (G.MY1 - G.MY0);
  const sx = x => -3 + (x - G.MX0) / (G.MX1 - G.MX0) * 10;
  const my = y => 6 + (G.MY1 - y) / (G.MY1 - G.MY0) * 10;

  const sim = iterSim({
    mount: root,
    title: 'Try it: walk down the loss bowl',
    sub: 'Each Step reads the uphill slopes where the dot stands and moves a small fraction of them the other way. Tap the map to choose where to start.',
    knobs: [
      { key: 'lr', label: 'Learning rate: the fraction of the slope you step', min: 0.01, max: 0.4, step: 0.01, value: 0.1, fmt: v => v.toFixed(2) + (RATE[v] || '') },
      { key: 's0', label: 'Start: step price', min: -2, max: 6, step: 0.1, value: 0, fmt: num, random: r => Math.round((-2 + 8 * r) * 2) / 2 },
      { key: 'm0', label: 'Start: middle rent', min: 7, max: 15, step: 0.1, value: 10, fmt: num, random: r => Math.round((7 + 8 * r) * 2) / 2 },
    ],
    init: (rng, k) => ({ s: k.s0, m: k.m0, s0: k.s0, m0: k.m0 }),
    loss: lossOf,
    start(st, c) {
      const [gs, gm] = grad(st), d = misses(st);
      return [[`Start · learning rate ${num(c.knobs.lr)}`, C.amber],
        `step price ${num(st.s)} · middle rent ${num(st.m)}`,
        `guesses ${list(guesses(st))}`,
        `misses  ${slist(d)}`,
        `loss    ${d.map(x => num(x * x)).join(' + ')} = ${num(lossOf(st))}`,
        `uphill slopes (gradient): ${num(gs)}, ${num(gm)}`,
        ['Press Step:  new = old − rate × slope', C.cyan]];
    },
    step(st, k, c) {
      const [gs, gm] = grad(st), ds = -k.lr * gs, dm = -k.lr * gm;
      const nx = { ...st, s: st.s + ds, m: st.m + dm }, d = misses(nx), L = lossOf(nx), L0 = lossOf(st);
      return { state: nx, loss: L, lines: [
        [`Step ${c.iter + 1} · learning rate ${num(k.lr)}`, C.amber],
        `step price:  slope ${num(gs)}`,
        `  change −${num(k.lr)} × (${num(gs)}) = ${sgn(ds)}`,
        [`  new ${num(st.s)} ${ds < 0 ? '−' : '+'} ${num(Math.abs(ds))} = ${num(nx.s)}`, C.cyan],
        `middle rent: slope ${num(gm)}`,
        `  change −${num(k.lr)} × (${num(gm)}) = ${sgn(dm)}`,
        [`  new ${num(st.m)} ${dm < 0 ? '−' : '+'} ${num(Math.abs(dm))} = ${num(nx.m)}`, C.cyan],
        `misses  ${slist(d)}`,
        [`loss ${num(L0)} → ${L < 1e4 ? d.map(x => num(x * x)).join(' + ') + ' = ' : ''}${num(L)}${L > L0 ? '  (went UP)' : ''}`, L > L0 ? C.pink : C.amber]] };
    },
    stop(c) {
      const L = c.history[c.iter];
      if (!Number.isFinite(L) || L > 1e4) return { outcome: 'diverged', text: 'Diverged: every step jumps past the bottom and lands higher, so the loss keeps growing.' };
      if (L < 1e-4) return { outcome: 'settled', text: `Settled after ${c.iter} steps: the loss is almost zero and the steps have shrunk to almost nothing.` };
      return null;
    },
    note(c) {
      if (c.iter === 0) return 'The dashed arrow shows where the next step will land. Press Step, or tap the map to start somewhere else.';
      const a = c.states[c.states.length - 2], b = c.state, len = Math.hypot(b.s - a.s, b.m - a.m);
      if (c.history[c.iter] > c.history[c.iter - 1]) return 'The loss went up: that step jumped past the bottom of the bowl.';
      return `Last step length: ${num(len)}. Near the bottom the ground is flatter, so the steps get shorter on their own.`;
    },
    challenges: [
      { text: 'From the flat-line start (step price 0, middle rent 10), get the loss below 0.01 in 3 steps or fewer. At one tenth it takes 7.',
        check: c => c.state.s0 === 0 && c.state.m0 === 10 && c.iter >= 1 && c.iter <= 3 && c.history[c.iter] < 0.01,
        why: 'Yes! A learning rate near 0.2 takes bigger strides, and in this bowl they still land close to the bottom.' },
      { text: 'Find a learning rate that makes the walk jump past the bottom and diverge. Press Play to watch.',
        check: c => c.outcome?.outcome === 'diverged',
        why: 'Right. Above one third, each step overshoots the steep middle-rent walls by more than it fixes, so every jump lands higher.' },
      { text: 'Choose any learning rate and start. Predict below, then press Play.',
        check: c => c.predictionRight === true,
        why: 'Well judged. In this bowl, small steps always settle; a learning rate above one third bounces out.' },
    ],
    predict: { at: 2, ask: 'Before you press Play: will the walk settle at the bottom?',
      choices: [['settle', 'It will settle'], ['fail', 'It will not settle']], judge: o => (o === 'settled' ? 'settle' : 'fail') },
    maxIter: 400,

    setup(svg, api) {
      const n = (root.clientWidth || innerWidth) < 600;
      G = n ? { VW: 400, VH: 720, MX0: 44, MX1: 390, MY0: 12, MY1: 358, RX0: 60, RX1: 390, RY0: 430, RY1: 690, F: 1.25 }
            : { VW: 700, VH: 430, MX0: 50, MX1: 420, MY0: 14, MY1: 384, RX0: 498, RX1: 690, RY0: 44, RY1: 384, F: 1 };
      svg.setAttribute('viewBox', `0 0 ${G.VW} ${G.VH}`);
      svg.style.touchAction = 'pan-y';   // a tap still picks the start; a swipe scrolls the page on a phone
      const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
      svg.addEventListener('pointerdown', e => {
        const p = toSvg(e);
        if (p.x < G.MX0 || p.x > G.MX1 || p.y < G.MY0 || p.y > G.MY1) return;
        api.setKnob('s0', Math.round(sx(p.x) * 10) / 10);
        api.setKnob('m0', Math.round(my(p.y) * 10) / 10);
        api.reset();
      });
    },

    draw(st, c) {
      const { F } = G, k = [], mono = { 'font-family': 'Consolas' };
      const at = c.prev && c.t < 1 ? { s: c.prev.s + (st.s - c.prev.s) * c.t, m: c.prev.m + (st.m - c.prev.m) * c.t } : st;
      // loss map: contour rings around the bottom (2, 11)
      k.push(s('defs', {}, s('clipPath', { id: 'm926' }, s('rect', { x: G.MX0, y: G.MY0, width: G.MX1 - G.MX0, height: G.MY1 - G.MY0 })),
        s('clipPath', { id: 'r926' }, s('rect', { x: G.RX0, y: G.RY0, width: G.RX1 - G.RX0, height: G.RY1 - G.RY0 }))));
      k.push(s('rect', { x: G.MX0, y: G.MY0, width: G.MX1 - G.MX0, height: G.MY1 - G.MY0, fill: C.bg, stroke: C.line }));
      const map = s('g', { 'clip-path': 'url(#m926)' });
      for (let v = -2; v <= 6; v += 2) map.append(s('line', { x1: px(v), x2: px(v), y1: G.MY0, y2: G.MY1, stroke: C.line, 'stroke-opacity': .6 }));
      for (let v = 7; v <= 15; v += 2) map.append(s('line', { x1: G.MX0, x2: G.MX1, y1: py(v), y2: py(v), stroke: C.line, 'stroke-opacity': .6 }));
      const U = (G.MX1 - G.MX0) / 10;
      [100, 60, 35, 20, 11, 6, 3, 1, 0.25].forEach((L, i) => {
        map.append(s('ellipse', { cx: px(2), cy: py(11), rx: Math.sqrt(L / 2) * U, ry: Math.sqrt(L / 3) * U,
          fill: C.cyan, 'fill-opacity': 0.035 + i * 0.012, stroke: C.cyan, 'stroke-opacity': 0.25 + i * 0.06 }));
        const lx = px(2 + Math.sqrt(L / 2));
        if (L >= 3 && lx < G.MX1 - 14) map.append(s('text', { x: lx + 3, y: py(11) - 4, fill: C.muted, 'font-size': 11 * F, ...mono }, num(L)));
      });
      map.append(s('path', { d: `M${px(2) - 7} ${py(11)}h14M${px(2)} ${py(11) - 7}v14`, stroke: C.green, 'stroke-width': 2.5 }));
      // trail of steps
      const pts = c.states.slice(0, c.prev && c.t < 1 ? -1 : undefined).concat([at]);
      map.append(s('polyline', { points: pts.map(p => `${px(p.s)},${py(p.m)}`).join(' '), fill: 'none', stroke: C.amber, 'stroke-width': 2, 'stroke-opacity': .8 }));
      pts.slice(0, -1).forEach(p => map.append(s('circle', { cx: px(p.s), cy: py(p.m), r: 3.5, fill: C.amber, 'fill-opacity': .7 })));
      // the next step, shown before it is taken
      if (!c.outcome && !(c.prev && c.t < 1)) {
        const [gs, gm] = grad(st), ns = st.s - c.knobs.lr * gs, nm = st.m - c.knobs.lr * gm;
        map.append(s('line', { x1: px(st.s), y1: py(st.m), x2: px(ns), y2: py(nm), stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '5 5' }),
          s('circle', { cx: px(ns), cy: py(nm), r: 6, fill: 'none', stroke: C.amber, 'stroke-dasharray': '3 3' }));
      }
      const cx = Math.min(G.MX1 - 4, Math.max(G.MX0 + 4, px(at.s))), cy = Math.min(G.MY1 - 4, Math.max(G.MY0 + 4, py(at.m)));
      const off = cx !== px(at.s) || cy !== py(at.m);
      map.append(s('circle', { cx, cy, r: 14, fill: C.amber, 'fill-opacity': .18 }),
        s('circle', { cx, cy, r: 8, fill: off ? C.pink : C.amber, stroke: C.bg, 'stroke-width': 2 }));
      k.push(map);
      if (off) k.push(s('text', { x: (G.MX0 + G.MX1) / 2, y: G.MY0 + 22 * F, fill: C.pink, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', ...mono }, 'the dot has left the map'));
      for (let v = -2; v <= 6; v += 2) k.push(s('text', { x: px(v), y: G.MY1 + 17 * F, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', ...mono }, v));
      for (let v = 7; v <= 15; v += 2) k.push(s('text', { x: G.MX0 - 6, y: py(v) + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', ...mono }, v));
      k.push(s('text', { x: G.MX1, y: G.MY1 + 34 * F, fill: C.ink, 'font-size': 13 * F, 'text-anchor': 'end' }, 'step price →'),
        s('text', { x: G.MX0 + 6, y: G.MY0 + 16 * F, fill: C.ink, 'font-size': 13 * F }, '↑ middle rent'));

      // rent picture: the three apartments and the current line
      const rx = x => G.RX0 + (x + 1.5) / 3 * (G.RX1 - G.RX0), ry = r => G.RY1 - (r - 4) / 14 * (G.RY1 - G.RY0);
      k.push(s('rect', { x: G.RX0, y: G.RY0, width: G.RX1 - G.RX0, height: G.RY1 - G.RY0, fill: C.bg, stroke: C.line }),
        s('text', { x: G.RX0, y: G.RY0 - 10, fill: C.ink, 'font-size': 13 * F }, 'Rent line (hundreds of $)'));
      const rent = s('g', { 'clip-path': 'url(#r926)' });
      for (const r of [5, 10, 15]) {
        rent.append(s('line', { x1: G.RX0, x2: G.RX1, y1: ry(r), y2: ry(r), stroke: C.line }));
        k.push(s('text', { x: G.RX0 - 6, y: ry(r) + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', ...mono }, r));
      }
      SIZE.forEach((x, i) => rent.append(s('line', { x1: rx(x), x2: rx(x), y1: ry(RENT[i]), y2: ry(at.m + at.s * x), stroke: DOT[i], 'stroke-width': 2, 'stroke-dasharray': '4 4' })));
      rent.append(s('line', { x1: rx(-1.5), y1: ry(at.m - 1.5 * at.s), x2: rx(1.5), y2: ry(at.m + 1.5 * at.s), stroke: C.amber, 'stroke-width': 3.5 }));
      SIZE.forEach((x, i) => rent.append(s('circle', { cx: rx(x), cy: ry(RENT[i]), r: 7, fill: DOT[i] })));
      k.push(rent);
      ['small', 'middle', 'large'].forEach((w, i) => k.push(s('text', { x: rx(SIZE[i]), y: G.RY1 + 17 * F, fill: DOT[i], 'font-size': 12 * F, 'text-anchor': 'middle' }, w)));
      return k;
    },
  });
  return sim.destroy;
}
