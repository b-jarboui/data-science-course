// 21.2.7 Try it: human preference with a blinded paired comparison.
// The learner taps cards to set each pick (B wins, A wins, tie), watches the tally and B's preference rate
// update live, lets a random reader judge, and runs 200 readers at once to see how rough a few picks are.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, challenges } = kit;
  const BLUE = '#60a5fa', ORANGE = '#fb923c';
  const START = ['B', 'A', 'B', 'B', 'T', 'A', 'B', 'B', 'A', 'B'];
  let picks = START.slice(), pB = 67, shown = false, anim = 0;
  let hist = Array(11).fill(0), runs = 0, ahead = 0, run = null;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const pLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const slider = h('input', { type: 'range', min: 30, max: 90, step: 1, value: pB, 'aria-label': 'How often readers really prefer B',
    oninput: e => { pB = +e.target.value; clearRuns(); draw(); } });
  const namesBtn = btn('', () => { shown = !shown; clearRuns(); draw(); });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: which answer do readers prefer?'),
    h('p', { class: 'sub' }, 'Each card is one question, answered by A (blue) and B (orange). Tap a card to change the reader’s pick: B wins, A wins or tie. Ties are set aside.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Readers really prefer B:'), slider, pLabel),
        h('div', { class: 'sim-row' },
          btn('New reader (random)', newReader, 'go'),
          btn('Run 200 readers', runMany),
          namesBtn,
          btn('Add a card', () => { if (picks.length < 15) { picks.push(oneReader(1)[0]); clearRuns(); draw(); } }),
          btn('Remove a card', () => { if (picks.length > 4) { picks.pop(); clearRuns(); draw(); } }),
          btn('Start again', () => { picks = START.slice(); pB = 67; slider.value = 67; shown = false; clearRuns(); draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const tally = () => {
    const b = picks.filter(p => p === 'B').length, a = picks.filter(p => p === 'A').length;
    return { b, a, t: picks.length - a - b, d: a + b };
  };
  // a reader who sees the names leans toward the new assistant B
  const lean = () => Math.min(95, pB + (shown ? 20 : 0)) / 100;
  const oneReader = n => Array.from({ length: n }, () => Math.random() < 0.1 ? 'T' : Math.random() < lean() ? 'B' : 'A');

  const chal = challenges(ch, [
    { text: 'Tap the cards to make B’s preference rate exactly 75%.',
      check: st => st.d > 0 && 4 * st.b === 3 * st.d,
      why: 'Yes! 75% means B won 3 of every 4 decided picks. Ties never count.' },
    { text: 'Make at least 3 ties, but keep B’s rate at two thirds (about 67%).',
      check: st => st.t >= 3 && st.d > 0 && 3 * st.b === 2 * st.d,
      why: 'Right: ties are set aside, so they do not change the rate. Only B wins and A wins count.' },
    { text: 'Set the slider to 50% (A and B equally good), keep names hidden, and run 200 readers. How often is B still at 67% or more?',
      check: st => st.run && st.runs >= 200 && st.run.p === 50 && !st.run.shown,
      why: 'Quite often! With only a few picks, chance alone can put B ahead. That is why 9 picks is only a rough first look.' },
    { text: 'Keep the slider at 50%, show the names, and run 200 readers again.',
      check: st => st.run && st.runs >= 200 && st.run.p === 50 && st.run.shown,
      why: 'B looks better even though it is not: readers lean toward “new”. Hiding the names (blinding) removes that push.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps labels readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1, TOP = 12, ROW = 58;
  svg.setAttribute('viewBox', `0 0 ${VW} 440`);

  function newReader() { picks = oneReader(picks.length); draw(); }
  function clearRuns() { cancelAnimationFrame(anim); hist = Array(11).fill(0); runs = 0; ahead = 0; run = null; }
  function runMany() {
    clearRuns(); run = { p: pB, shown };
    const step = () => {
      for (let k = 0; k < 8 && runs < 200; k++) {
        const r = oneReader(picks.length), b = r.filter(x => x === 'B').length, d = r.filter(x => x !== 'T').length;
        runs++;
        if (!d) continue;
        hist[Math.min(10, Math.floor(10 * b / d + 1e-9))]++;
        if (3 * b >= 2 * d) ahead++;
      }
      draw();
      if (runs < 200) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  // tap a card: B wins -> A wins -> tie -> B wins
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), tw = (VW - 20) / 5, c = Math.floor((p.x - 10) / tw), r = Math.floor((p.y - TOP) / ROW), i = r * 5 + c;
    if (c < 0 || c > 4 || r < 0 || p.y - TOP - r * ROW > 50 || i >= picks.length) return;
    picks[i] = { B: 'A', A: 'T', T: 'B' }[picks[i]];
    draw();
  });

  function draw() {
    const n = picks.length, { b, a, t, d } = tally(), tw = (VW - 20) / 5, k = [];
    // the cards
    picks.forEach((p, i) => {
      const x = 10 + (i % 5) * tw, y = TOP + Math.floor(i / 5) * ROW, col = p === 'B' ? ORANGE : p === 'A' ? BLUE : C.muted;
      k.push(s('rect', { x: x + 3, y, width: tw - 6, height: 50, rx: 8, fill: C.card, stroke: col, 'stroke-width': 2 }),
        s('text', { x: x + 10, y: y + 15, fill: C.muted, 'font-size': 11 * F, 'font-family': 'Consolas' }, 'Q' + (i + 1)),
        s('text', { x: x + tw / 2, y: y + 40, fill: col, 'font-size': 18 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          p === 'T' ? 'tie' : NARROW ? p : p + ' wins'));
    });
    // decided picks as one bar, ties beside it
    const bx = 10, bw = VW - 20, by = 196;
    if (d) {
      const wB = bw * b / d;
      k.push(s('rect', { x: bx, y: by, width: wB, height: 28, fill: ORANGE, 'fill-opacity': .82, rx: 4 }),
        s('rect', { x: bx + wB, y: by, width: bw - wB, height: 28, fill: BLUE, 'fill-opacity': .82, rx: 4 }));
      if (wB > 44) k.push(s('text', { x: bx + wB / 2, y: by + 20, fill: C.bg, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `B ${b}`));
      if (bw - wB > 44) k.push(s('text', { x: bx + wB + (bw - wB) / 2, y: by + 20, fill: C.bg, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `A ${a}`));
    } else {
      k.push(s('rect', { x: bx, y: by, width: bw, height: 28, fill: 'none', stroke: C.muted, rx: 4 }),
        s('text', { x: VW / 2, y: by + 20, fill: C.muted, 'font-size': 14 * F, 'text-anchor': 'middle' }, 'no decided picks yet'));
    }
    k.push(s('text', { x: bx, y: by + 50, fill: C.muted, 'font-size': 13 * F, 'font-family': 'Consolas' }, `decided: ${d}   ·   ties set aside: ${t}`));
    // 200 random readers: where B's rate lands
    const hx0 = 20, hw = (VW - 40) / 11, hy0 = 398, hy1 = 290;
    k.push(s('text', { x: VW / 2, y: 272, fill: runs ? C.ink : C.muted, 'font-size': (NARROW ? 13 : 15) * F, 'font-weight': 650, 'text-anchor': 'middle' },
      runs ? `${runs} readers · B at 67% or more: ${Math.round(100 * ahead / runs)}%` : 'Run 200 readers to fill this chart'),
      s('line', { x1: hx0, x2: VW - 20, y1: hy0, y2: hy0, stroke: C.line, 'stroke-width': 2 }));
    const mx = Math.max(1, ...hist);
    hist.forEach((c, j) => {
      const hh = (hy0 - hy1) * c / mx;
      if (c) k.push(s('rect', { x: hx0 + j * hw + 2, y: hy0 - hh, width: hw - 4, height: hh, fill: C.violet, 'fill-opacity': .8, rx: 2 }));
    });
    [0, 5, 10].forEach(j => k.push(s('text', { x: hx0 + (j + 0.5) * hw, y: hy0 + 17, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${j * 10}%`)));
    k.push(s('text', { x: VW / 2, y: 434, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle' }, 'B’s preference rate, reader by reader'));
    if (d) {
      const xm = hx0 + (Math.min(10, Math.floor(10 * b / d + 1e-9)) + 0.5) * hw;
      k.push(s('line', { x1: xm, x2: xm, y1: hy1 - 4, y2: hy0, stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '6 5' }));
    }
    svg.replaceChildren(...k);

    fbox(box, [`B wins  = ${b}`, `A wins  = ${a}`, [`ties    = ${t} of ${n} (set aside)`, C.muted], `decided = ${b} + ${a} = ${d}`,
      d ? [`rate    = ${b} ÷ ${d} ≈ ${Math.round(100 * b / d)}%`, C.amber] : ['rate    = no decided picks yet', C.amber]]);
    note.textContent = (shown ? 'Names shown: random readers lean toward the new assistant B. '
      : 'Names hidden (blinded): a coin decides who goes left, so readers judge only the answers. ')
      + 'The dashed line marks the rate of the cards above.';
    pLabel.textContent = `${pB}% of decided picks` + (shown ? ' (+ lean)' : '');
    namesBtn.textContent = shown ? 'Names: shown (not blind)' : 'Names: hidden (blind)';
    chal.update({ b, a, t, d, n, runs, run });
  }
  draw();
  return () => cancelAnimationFrame(anim);
}
