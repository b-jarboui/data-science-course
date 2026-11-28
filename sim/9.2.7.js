// 9.2.7 Try it: learning rates on the U (chapters/9.2.md, middle rent held at 10).
// loss = 3 + 2 × (step price − 2)², slope = 4 × (step price − 2). The learner slides the learning rate and watches
// the dot crawl, land or bounce, step by step, with the loss curve growing. Built on iter.js.
import { iterSim, num, sgn } from './iter.js';

const SIZE = [-1, 0, 1], RENT = [9, 11, 13];
const guesses = sp => SIZE.map(x => 10 + sp * x);
const misses = sp => guesses(sp).map((g, i) => g - RENT[i]);
const lossOf = sp => misses(sp).reduce((a, d) => a + d * d, 0);   // = 3 + 2 × (sp − 2)²
const slope = sp => 4 * (sp - 2);
const NAME = { 0.01: ' (one hundredth)', 0.1: ' (one tenth)', 0.25: ' (a quarter)', 0.5: ' (one half)', 0.75: ' (three quarters)' };
const S0 = -3, S1 = 7, LMAX = 40;   // drawing window: step price -3..7, loss 0..40

export default function mount(root, kit) {
  const { h, s, C, btn } = kit;
  let G;
  const px = v => G.X0 + (v - S0) / (S1 - S0) * (G.X1 - G.X0);
  const py = L => G.Y1 - L / LMAX * (G.Y1 - G.Y0);
  const lossText = sp => { const d = misses(sp), L = lossOf(sp); return L < 1e4 ? `${d.map(x => num(x * x)).join(' + ')} = ${num(L)}` : num(L); };

  const sim = iterSim({
    mount: root,
    title: 'Try it: how big a step?',
    sub: 'Only the step price moves; the middle rent stays at 10. Slide the learning rate, press Step, and watch the dot crawl, land or bounce.',
    knobs: [
      { key: 'lr', label: 'Learning rate: the fraction of the slope you step', min: 0.01, max: 0.8, step: 0.01, value: 0.1, fmt: v => v.toFixed(2) + (NAME[v] || '') },
      { key: 's0', label: 'Start: step price', min: -2, max: 6, step: 0.5, value: 0, fmt: num,
        random: r => { const v = -2 + 0.5 * Math.floor(r * 16); return v >= 2 ? v + 0.5 : v; } },
    ],
    extra: api => h('div', { class: 'sim-row' }, h('span', { class: 'sim-note', style: { margin: 0 } }, 'Rates from the lesson:'),
      ...[0.01, 0.1, 0.25, 0.5, 0.75].map(v => btn(String(v), () => { api.setKnob('lr', v); api.reset(); }, 'ghost'))),
    init: (rng, k) => ({ s: k.s0, s0: k.s0 }),
    loss: st => lossOf(st.s),
    start(st, c) {
      const d = misses(st.s);
      return [[`Start · learning rate ${num(c.knobs.lr)}`, C.amber],
        `step price ${num(st.s)}   (middle rent stays 10)`,
        `guesses ${guesses(st.s).map(num).join(', ')} · misses ${d.map(sgn).join(', ')}`,
        `loss    ${lossText(st.s)}`,
        `slope   4 × (${num(st.s)} − 2) = ${num(slope(st.s))}`,
        ['Press Step:  new = old − rate × slope', C.cyan]];
    },
    step(st, k, c) {
      const g = slope(st.s), ch = -k.lr * g, ns = st.s + ch, L0 = lossOf(st.s), L = lossOf(ns);
      return { state: { ...st, s: ns }, loss: L, lines: [
        [`Step ${c.iter + 1} · learning rate ${num(k.lr)}`, C.amber],
        `old step price ${num(st.s)}`,
        `slope   4 × (${num(st.s)} − 2) = ${num(g)}`,
        `change  −${num(k.lr)} × (${num(g)}) = ${sgn(ch)}`,
        [`new step price ${num(st.s)} ${ch < 0 ? '−' : '+'} ${num(Math.abs(ch))} = ${num(ns)}`, C.cyan],
        L < 1e4 ? `guesses ${guesses(ns).map(num).join(', ')} · misses ${misses(ns).map(sgn).join(', ')}` : 'guesses far off the dots',
        [`loss ${num(L0)} → ${lossText(ns)}${L > L0 + 1e-9 ? '  (went UP)' : Math.abs(L - L0) < 1e-9 ? '  (no change)' : ''}`,
          L > L0 + 1e-9 ? C.pink : C.amber]] };
    },
    stop(c) {
      const n = c.iter, L = c.history[n];
      if (!Number.isFinite(L) || L > 1e4) return { outcome: 'diverged', text: 'Diverged: each jump lands higher on the other wall, so the loss keeps growing.' };
      if (L - 3 < 1e-4) return { outcome: 'settled', text: `Settled after ${n} step${n > 1 ? 's' : ''} at the bottom: step price 2, loss 3.` };
      if (n >= 4 && Math.abs(L - c.history[n - 2]) < 1e-9) return { outcome: 'stuck', text: 'Stuck: it bounces between the same two spots forever and never gets lower.' };
      return null;
    },
    note(c) {
      if (c.iter === 0) return 'The dashed ring shows where the next step will land. The short gold line is the slope where the dot stands.';
      const L = c.history[c.iter], L0 = c.history[c.iter - 1];
      if (L > L0 + 1e-9) return 'The loss went UP: the step trusted the slope too far and jumped past the bottom.';
      if ((c.states[c.iter - 1].s - 2) * (c.state.s - 2) < 0) return 'It jumped over the bottom, but landed lower than before.';
      return c.knobs.lr <= 0.03 ? 'Crawling: each step is tiny, so it needs many steps to reach the bottom.' : 'A step downhill: the loss went down.';
    },
    challenges: [
      { text: 'Land on the bottom (loss 3) in a single step.',
        check: c => c.iter >= 1 && c.state.s0 !== 2 && Math.abs(c.history[1] - 3) < 1e-6,
        why: 'Yes: a quarter. Here the slope is 4 times the distance to the bottom, so a quarter of it is exactly that distance.' },
      { text: 'Find the learning rate where the first step leaves the loss exactly where it started.',
        check: c => c.iter >= 1 && c.state.s0 !== 2 && Math.abs(c.history[1] - c.history[0]) < 1e-6,
        why: 'One half: the step is twice the distance to the bottom, so the dot lands at the same height on the other wall.' },
      { text: 'Make the walk diverge: the loss keeps growing. Press Play to watch.',
        check: c => c.outcome?.outcome === 'diverged',
        why: 'Any learning rate above one half does it: the derivative is only true near the dot, and a big step trusts it too far.' },
      { text: 'Choose a learning rate. Predict below, then press Play.',
        check: c => c.predictionRight === true,
        why: 'Well judged. Below one half it settles; at one half it bounces in place; above one half it bounces out.' },
    ],
    predict: { at: 3, ask: 'Before you press Play: will the walk settle at the bottom?',
      choices: [['settle', 'It will settle'], ['fail', 'It will not settle']], judge: o => (o === 'settled' ? 'settle' : 'fail') },
    maxIter: 400,

    setup(svg) {
      const n = (root.clientWidth || innerWidth) < 600;
      G = n ? { VW: 400, VH: 440, X0: 44, X1: 392, Y0: 16, Y1: 390, F: 1.25 } : { VW: 700, VH: 420, X0: 56, X1: 686, Y0: 16, Y1: 370, F: 1 };
      svg.setAttribute('viewBox', `0 0 ${G.VW} ${G.VH}`);
      svg.style.touchAction = 'pan-y';   // nothing to drag here, so let the page scroll on a phone
    },

    draw(st, c) {
      const { F } = G, k = [], mono = { 'font-family': 'Consolas' };
      const moving = c.prev && c.t < 1;
      k.push(s('defs', {}, s('clipPath', { id: 'c927' }, s('rect', { x: G.X0, y: G.Y0 - 2, width: G.X1 - G.X0, height: G.Y1 - G.Y0 + 2 }))));
      for (let L = 0; L <= LMAX; L += 10) k.push(s('line', { x1: G.X0, x2: G.X1, y1: py(L), y2: py(L), stroke: C.line }),
        s('text', { x: G.X0 - 6, y: py(L) + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', ...mono }, L));
      for (let v = -2; v <= 6; v += 2) k.push(s('text', { x: px(v), y: G.Y1 + 18 * F, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', ...mono }, v));
      k.push(s('text', { x: G.X1, y: G.Y1 + 36 * F, fill: C.ink, 'font-size': 13 * F, 'text-anchor': 'end' }, 'step price →'),
        s('text', { x: G.X0 + 6, y: G.Y0 + 14 * F, fill: C.ink, 'font-size': 13 * F }, '↑ loss'));
      const g = s('g', { 'clip-path': 'url(#c927)' });
      let d = '';
      for (let v = S0; v <= S1 + 1e-9; v += 0.05) d += `${d ? 'L' : 'M'}${px(v).toFixed(1)} ${py(lossOf(v)).toFixed(1)}`;
      g.append(s('path', { d, fill: 'none', stroke: C.cyan, 'stroke-width': 7, 'stroke-opacity': .18 }),
        s('path', { d, fill: 'none', stroke: C.cyan, 'stroke-width': 3 }),
        s('path', { d: `M${px(2) - 7} ${py(3)}h14M${px(2)} ${py(3) - 7}v14`, stroke: C.green, 'stroke-width': 2.5 }));
      // jumps as arcs over the curve (the last 30), the one in progress drawn up to t
      const P = a => ({ x: px(a), y: py(lossOf(a)) });
      const arc = (a, b, t = 1) => {
        const A = P(a), B = P(b), cx = (A.x + B.x) / 2, cy = Math.min(A.y, B.y) - 30 - 0.12 * Math.abs(B.x - A.x);
        let out = `M${A.x.toFixed(1)} ${A.y.toFixed(1)}`, end = A;
        for (let i = 1; i <= 24; i++) {
          const u = t * i / 24;
          end = { x: (1 - u) ** 2 * A.x + 2 * u * (1 - u) * cx + u * u * B.x, y: (1 - u) ** 2 * A.y + 2 * u * (1 - u) * cy + u * u * B.y };
          out += `L${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
        }
        return { d: out, end };
      };
      const ss = c.states.map(q => q.s), last = ss.length - 1, from = Math.max(1, last - 30);
      for (let i = from; i <= last; i++) {
        if (moving && i === last) break;
        const up = lossOf(ss[i]) > lossOf(ss[i - 1]) + 1e-9;
        g.append(s('path', { d: arc(ss[i - 1], ss[i]).d, fill: 'none', stroke: up ? C.pink : C.amber, 'stroke-width': 2, 'stroke-opacity': .35 + .5 * (i - from) / Math.max(1, last - from), 'stroke-dasharray': '6 5' }));
      }
      ss.slice(Math.max(0, from - 1), moving ? last : last + 1).forEach(v => g.append(s('circle', { cx: px(v), cy: py(lossOf(v)), r: 4, fill: C.amber, 'fill-opacity': .6 })));
      let dot = P(st.s);
      if (moving) {
        const a = arc(c.prev.s, st.s, c.t);
        g.append(s('path', { d: a.d, fill: 'none', stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '6 5' }));
        dot = a.end;
      } else if (!c.outcome) {
        // slope where the dot stands, and where the next step will land
        const m = slope(st.s), w = 0.7, ns = st.s - c.knobs.lr * m, N = P(ns);
        g.append(s('line', { x1: px(st.s - w), y1: py(lossOf(st.s) - m * w), x2: px(st.s + w), y2: py(lossOf(st.s) + m * w), stroke: C.amber, 'stroke-width': 2.5 }),
          s('circle', { cx: N.x, cy: N.y, r: 8, fill: 'none', stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '3 3' }));
      }
      const off = dot.y < G.Y0 || dot.x < G.X0 || dot.x > G.X1;
      const dx = Math.min(G.X1 - 6, Math.max(G.X0 + 6, dot.x)), dy = Math.max(G.Y0 + 6, dot.y);
      g.append(s('circle', { cx: dx, cy: dy, r: 15, fill: C.amber, 'fill-opacity': .2 }),
        s('circle', { cx: dx, cy: dy, r: 8, fill: off ? C.pink : C.amber, stroke: C.bg, 'stroke-width': 2 }));
      k.push(g);
      if (off && !moving) k.push(s('text', { x: Math.min(G.X1 - 90 * F, Math.max(G.X0 + 90 * F, dx)), y: G.Y0 + 36 * F, fill: C.pink, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', ...mono },
        `↑ off the chart: loss ${num(lossOf(st.s))}`));
      if (!moving && !off) k.push(s('text', { x: Math.min(G.X1 - 4, Math.max(G.X0 + 40 * F, dx)), y: dy - 20 * F, fill: C.amber, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', ...mono },
        `slope ${num(slope(st.s))}`));
      return k;
    },
  });
  return sim.destroy;
}
