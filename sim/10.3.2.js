// 10.3.2 Try it: logistic regression learns its step, guess by guess.
// The learner drags the record dots (or makes new records), sets the learning rate and the first guess,
// then steps or plays the learning and watches the gap curve fall, settle or bounce.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const RED = '#f87171';
  const N = [100, 100, 28], CLINIC = [75, 90, 27];
  let c = CLINIC.slice(), random = false, lr = 0.03, w0 = 0, speed = 3;
  let w = 0, iter = 0, hist = [], info = null, rose = false, playing = false, anim = 0, last = 0, dragging = -1;

  const sig = z => 1 / (1 + Math.exp(-z));
  const start = () => Math.log(c[0] / (N[0] - c[0]));
  const expect = (r, ww = w) => N[r] * sig(start() + ww * r);
  const gapAt = (ww = w) => Math.abs(c[1] - expect(1, ww)) + Math.abs(c[2] - expect(2, ww));
  const r1 = x => fmt(Math.round(x * 10) / 10), r2 = x => fmt(Math.round(x * 100) / 100), r3 = x => fmt(Math.round(x * 1000) / 1000);
  const num = v => String(Math.round(v * 1000) / 1000);
  const settled = () => !!info && Math.abs(info.push) < 0.001;

  const svg = s('svg', { viewBox: '0 0 700 490' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const playBtn = btn('▶ Play', () => playing ? pause() : run());
  const slider = (label, min, max, step, value, show, set) => {
    const out = h('b', { style: { minWidth: '3.2em' } }, show(value));
    const input = h('input', { type: 'range', min, max, step, value, style: { flex: '1 1 8rem' },
      oninput: e => { const v = +e.target.value; out.textContent = show(v); set(v); } });
    return h('label', { class: 'sim-note', style: { display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap', margin: '.5rem 0 0' } }, label, input, out);
  };
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: watch logistic regression learn'),
    h('p', { class: 'sub' }, 'The teal dots are the clinic records: the share who came with 0, 1 or 2 reminders. Drag a dot up or down to change the records. The start is held so the no-reminder group always matches; the computer learns only the step, guess by guess.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('Step', step, 'go'), playBtn, btn('Reset', reset),
          btn('New data (random)', () => {
            const c0 = rnd(50, 85), c1 = rnd(Math.min(97, c0 + 3), 97);
            c = [c0, c1, rnd(Math.round(28 * c1 / 100), 28)]; random = true; reset();
          }),
          btn('Clinic records', () => { c = CLINIC.slice(); random = false; reset(); })),
        slider('Learning rate', 0.005, 0.3, 0.005, lr, num, v => { lr = v; draw(); }),
        slider('First guess for the step', -1, 3, 0.1, w0, num, v => { w0 = v; reset(); }),
        slider('Speed (guesses per second)', 1, 12, 1, speed, num, v => { speed = v; })),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Predict, then press Step once: from a first guess of 0, where does the step land?',
      check: st => st.iter >= 1, why: 'A gap of 21 patients gives a big push: the step jumps from 0 to about 0.8.' },
    { text: 'With the clinic records, bring the gap under 0.5 in 5 guesses or fewer. Try a bigger learning rate, then Reset.',
      check: st => !st.random && st.iter >= 1 && st.iter <= 5 && st.gap < 0.5,
      why: 'Yes: a bigger learning rate makes bigger pushes, so the step settles in fewer guesses.' },
    { text: 'Break it on purpose: find a learning rate where a push jumps past the best step and the gap goes UP.',
      check: st => st.rose, why: 'Too big a push overshoots, so the gap grows and the step bounces back and forth.' },
    { text: 'Press “New data”, then Play until it settles. Does the gap always reach 0?',
      check: st => st.random && st.settled,
      why: 'Not always. With only the step to learn, the S gets as close as it can, then the pushes stop. Real data usually only come close.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 420 : 700, F = NARROW ? 1.3 : 1, VH = 490;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const X0 = NARROW ? 62 : 78, X1 = VW - (NARROW ? 96 : 150), TOP = 30, BOT = 250;
  const X = r => X0 + 30 + r * (X1 - X0 - 60) / 2, Y = p => BOT - p * (BOT - TOP);
  const LT = 336, LB = 460, LL = X0, LR = VW - 14;
  const tx = (x, y, str, fill, size, anchor = 'middle', weight = 400) =>
    s('text', { x, y, fill, 'font-size': size * F, 'text-anchor': anchor, 'font-family': 'Consolas, monospace', 'font-weight': weight }, str);

  function step() {
    const old = w, e1 = expect(1), e2 = expect(2), s1 = c[1] - e1, s2 = c[2] - e2;
    const push = lr * (s1 + 2 * s2), before = gapAt(), prev = info ? info.push : 0;
    w = Math.max(-8, Math.min(12, old + push)); iter++;
    const g = gapAt();
    if (prev && Math.sign(push) !== Math.sign(prev) && g > before + 1e-6) rose = true;
    hist.push(g); info = { old, e1, e2, s1, s2, push };
    draw();
  }
  function reset() { pause(); w = w0; iter = 0; hist = [gapAt()]; info = null; rose = false; draw(); }
  function run() { if (playing) return; playing = true; playBtn.textContent = '❚❚ Pause'; last = 0; anim = requestAnimationFrame(loop); }
  function pause() { playing = false; cancelAnimationFrame(anim); playBtn.textContent = '▶ Play'; }
  function loop(now) {
    if (!playing) return;
    if (now - last >= 1000 / speed) { last = now; step(); if (settled() || iter >= 300) { pause(); return; } }
    anim = requestAnimationFrame(loop);
  }

  // drag a record dot: its height sets how many came
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y > BOT + 20) return;
    let best = -1, bd = 50;
    [0, 1, 2].forEach(r => { const d = Math.abs(p.x - X(r)); if (d < bd) { bd = d; best = r; } });
    if (best < 0) return;
    dragging = best; svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e), r = dragging, v = Math.round((BOT - p.y) / (BOT - TOP) * N[r]);
    c[r] = Math.max(r === 0 ? 5 : 0, Math.min(r === 0 ? N[0] - 5 : N[r], v));
    random = false; reset();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; draw(); });

  function draw() {
    const k = [], b = start();
    // chance panel: records (teal), what the S expects (amber rings), the gap between them (red)
    for (const p of [0, 0.25, 0.5, 0.75, 1])
      k.push(s('line', { x1: X0, x2: X1 + 20, y1: Y(p), y2: Y(p), stroke: C.line }), tx(X0 - 8, Y(p) + 4, p * 100 + '%', C.muted, 12, 'end'));
    [0, 1, 2].forEach(r => k.push(tx(X(r), BOT + 22, String(r), C.muted, 14)));
    k.push(tx((X0 + X1) / 2, BOT + 44, 'reminders sent', C.muted, 13));
    const pts = [];
    for (let i = 0; i <= 46; i++) { const r = -0.15 + i * 0.05; pts.push(`${X(r)},${Y(sig(b + w * r))}`); }
    k.push(s('polyline', { points: pts.join(' '), fill: 'none', stroke: C.amber, 'stroke-width': 3 }));
    [0, 1, 2].forEach(r => {
      const e = expect(r), x = X(r), yc = Y(c[r] / N[r]), ye = Y(e / N[r]), up = yc <= ye;
      k.push(s('line', { x1: x, x2: x, y1: yc, y2: ye, stroke: RED, 'stroke-width': 4, 'stroke-linecap': 'round' }),
        s('circle', { cx: x, cy: ye, r: 7, fill: C.bg, stroke: C.amber, 'stroke-width': 2.5 }),
        s('circle', { cx: x, cy: yc, r: 9, fill: C.cyan, stroke: dragging === r ? C.ink : 'none', 'stroke-width': 2, style: 'cursor: ns-resize' }),
        tx(x + 14, yc + (up ? -4 : 14), `${c[r]}/${N[r]} came`, C.cyan, 12, 'start', 700),
        tx(x + 14, ye + (up ? 16 : -4), `expects ${r1(e)}`, C.amber, 12, 'start'));
    });
    // gap-versus-guess panel
    const xmax = Math.max(10, hist.length - 1), ymax = Math.max(1, ...hist.map(g => Math.min(g, 100)));
    const GXp = i => LL + i / xmax * (LR - LL), GYp = g => LB - Math.min(g, ymax) / ymax * (LB - LT - 10);
    k.push(tx(LR, LT - 26, `guess ${iter}   step ${r2(w)}   gap ${r2(gapAt())}`, C.ink, 13, 'end', 700),
      tx(LL, LT - 8, 'gap after each guess', RED, 13, 'start', 700),
      s('line', { x1: LL, x2: LR, y1: LB, y2: LB, stroke: C.muted }), s('line', { x1: LL, x2: LL, y1: LT, y2: LB, stroke: C.muted }),
      tx(LL - 6, LT + 10, r1(ymax), C.muted, 12, 'end'), tx(LL - 6, LB + 4, '0', C.muted, 12, 'end'),
      tx(LL, LB + 20, 'guess 0', C.muted, 12, 'start'), tx(LR, LB + 20, `guess ${xmax}`, C.muted, 12, 'end'),
      s('polyline', { points: hist.map((g, i) => `${GXp(i)},${GYp(g)}`).join(' '), fill: 'none', stroke: RED, 'stroke-width': 2.5 }));
    if (hist.length <= 60) hist.forEach((g, i) => k.push(s('circle', { cx: GXp(i), cy: GYp(g), r: 3.5, fill: RED })));
    svg.replaceChildren(...k);

    const lines = ['score = start + step × reminders', `start = ${r2(b)} (held: no reminder matches)`];
    if (info) {
      const sh = v => v >= 0 ? `${r1(v)} short` : `${r1(-v)} over`;
      lines.push(`old step = ${r3(info.old)}`,
        `1 reminder:  expects ${r1(info.e1)}, ${c[1]} came → ${sh(info.s1)}`,
        `2 reminders: expects ${r1(info.e2)}, ${c[2]} came → ${sh(info.s2)}`,
        `push = ${num(lr)} × (${r1(info.s1)} + 2 × ${r1(info.s2)}) = ${r3(info.push)}`,
        [`new step = ${r3(w)}   gap = ${r2(gapAt())}`, C.amber]);
    } else lines.push(`step = ${r2(w)} (first guess)`, [`gap = ${r2(gapAt())}: press Step`, C.amber]);
    fbox(box, lines);
    note.textContent = settled() ? `Settled after ${iter} guesses: the pushes are tiny now, so the step stays at ${r2(w)}.`
      : rose ? 'The gap went UP: the push was too big and jumped past the best step. Try a smaller learning rate.'
      : 'Each guess: compare what the S expects with who came. Short means the step is too low, so push it up. The two-reminder gap counts twice, because those patients got two steps.';
    chal.update({ iter, gap: gapAt(), rose, random, settled: settled() });
  }
  reset();
  return () => pause();
}
