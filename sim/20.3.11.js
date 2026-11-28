// 20.3.11 Try it: speculative decoding, round by round.
// Each round the draft model guesses a few tokens (2 ms each) and the large model checks them all in one pass (20 ms).
// The learner taps guesses right or wrong, steps or plays the rounds, turns the knobs and races plain decoding.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const OR = '#fb923c', LARGE = 20, DRAFT = 2;
  const PREFIX = 'The library will open';
  const ANSWERS = [
    'at nine . The café is open until six . The gym will open at seven on Monday .',
    'on Monday . The café will open at ten . The gym is open until nine .',
    'at ten . The café is open until six on Monday . The gym will open soon .',
    'soon . The gym will open at seven . The café is open until nine on Monday .',
  ].map(a => a.split(' '));
  const WRONG = ['tomorrow', 'purple', 'late', 'noon', 'time', 'soon', 'ten', 'is', 'the', 'on', 'at', 'six'];
  let ai = 0, ans = ANSWERS[0], pos = 0, round = 0, specMs = 0, rounds = [], last = null, pending = [];
  let k = 3, acc = 70, speed = 1.5, playing = false, timer = 0;

  const svg = s('svg', { viewBox: '0 0 700 610' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const counter = h('span', { class: 'sim-note', style: { margin: 0 } });
  const playBtn = btn('Play', togglePlay);
  const slider = (label, min, max, step, value, on, show) => {
    const out = h('b', {}, show(value));
    const input = h('input', { type: 'range', min, max, step, value, oninput: e => { const v = +e.target.value; out.textContent = show(v); on(v); } });
    return h('label', { class: 'sim-note', style: { display: 'flex', alignItems: 'center', gap: '.5rem', margin: 0, flexWrap: 'wrap' } }, label, input, out);
  };
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: draft, then check'),
    h('p', { class: 'sub' }, 'Each round the draft model guesses a few tokens (2 ms each). Then the large model checks them all in one pass (20 ms): it keeps the guesses up to the first wrong one and puts its own token there. Tap a guess in the next draft to make it right or wrong.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('Step: one round', step, 'go'), playBtn, btn('Reset', reset), btn('New data (random)', newData)),
        h('div', { class: 'sim-row' },
          slider('Guesses per round', 2, 6, 1, k, v => { k = v; knob(); }, v => String(v)),
          slider('Each guess right', 0, 100, 10, acc, v => { acc = v; knob(); }, v => v + '%'),
          slider('Speed', 0.5, 5, 0.5, speed, v => { speed = v; }, v => v + ' rounds/s')),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, counter)),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Press Step once. Does the large model keep 3 tokens for 26 ms, like in the video?',
      check: st => !!st.last && st.last.kept === 3 && st.last.ms === 26,
      why: 'Yes: two guesses agreed and the third was replaced. 3 × 2 + 20 = 26 ms for 3 tokens, instead of 60.' },
    { text: 'Tap the first guess of the next draft to make it wrong, then press Step.',
      check: st => !!st.last && st.last.firstWrong,
      why: 'Only the large model’s own token is kept: 1 token for 2 ms per guess plus 20 ms, slower than the plain 20 ms.' },
    { text: 'Predict, then check: lower “Each guess right” until a whole answer takes longer with the draft than plain. Press Play.',
      check: st => st.done && st.specMs > st.plainMs,
      why: 'A draft that is often wrong keeps few tokens per round but still pays for every guess and every check. A poor draft wastes time.' },
    { text: 'Find settings that write a whole answer in less than half the plain time.',
      check: st => st.done && st.specMs * 2 < st.plainMs,
      why: 'With a good draft and several guesses per round, most rounds keep many tokens for one 20 ms check.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps words readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1, VH = 610;
  const X0 = NARROW ? 14 : 24, X1 = VW - X0;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const SL = (X1 - X0) / 6, CW = SL - 8, CHH = 38;

  const wrongFor = t => { const o = WRONG.filter(w => w !== t); return o[rnd(0, o.length - 1)]; };
  function roll() {
    const n = Math.min(k, ans.length - pos);
    pending = Array.from({ length: n }, (_, i) => {
      const right = Math.random() * 100 < acc;
      return { right, word: right ? ans[pos + i] : wrongFor(ans[pos + i]) };
    });
  }
  function toggle(i) {
    const d = pending[i];
    d.right = !d.right; d.word = d.right ? ans[pos + i] : wrongFor(ans[pos + i]);
    draw();
  }
  function step() {
    if (pos >= ans.length) return;
    const n = pending.length;
    let agree = 0;
    while (agree < n && pending[agree].right) agree++;
    const own = agree < n ? 1 : 0, kept = agree + own, ms = n * DRAFT + LARGE;
    last = { draft: pending, start: pos, n, agree, own, kept, ms, firstWrong: !pending[0].right };
    rounds.push(last);
    pos += kept; specMs += ms; round++;
    if (pos >= ans.length) { pending = []; stop(); } else roll();
    draw();
  }
  function stop() { playing = false; clearTimeout(timer); playBtn.textContent = 'Play'; }
  function tick() { step(); if (playing) timer = setTimeout(tick, 1000 / speed); }
  function togglePlay() {
    if (playing) { stop(); return; }
    if (pos >= ans.length) reset();
    playing = true; playBtn.textContent = 'Pause'; tick();
  }
  function reset() { stop(); pos = 0; round = 0; specMs = 0; rounds = []; last = null; roll(); draw(); }
  function newData() { ai = (ai + rnd(1, ANSWERS.length - 1)) % ANSWERS.length; ans = ANSWERS[ai]; reset(); }
  function knob() { if (pos < ans.length) roll(); draw(); }

  const txt = (x, y, str, o = {}) => s('text', { x, y, fill: o.fill || C.ink, 'font-size': (o.size || 14) * F, 'font-weight': o.bold ? 700 : 400,
    'text-anchor': o.anchor || 'start', 'font-family': o.mono ? 'Consolas, monospace' : '"Segoe UI", Arial, sans-serif' }, str);
  function tokenCard(x, y, word, color, o = {}) {
    const fs = Math.min(15 * F, CW / (Math.max(1, word.length) * 0.62));
    const g = s('g', { opacity: o.opacity });
    g.append(s('rect', { x, y, width: CW, height: CHH, rx: 7, fill: color, 'fill-opacity': 0.16, stroke: color, 'stroke-width': 2, 'stroke-dasharray': o.dash ? '5 4' : null }),
      s('text', { x: x + CW / 2, y: y + CHH / 2 + fs * 0.35, fill: C.ink, 'font-size': fs, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace' }, word));
    return g;
  }

  function draw() {
    const out = [], done = pos >= ans.length, plainMs = pos * LARGE;

    // 1. the answer so far
    out.push(txt(X0, 22, 'Answer so far', { fill: C.muted, size: 13 }), txt(X1, 22, `${pos} / ${ans.length} tokens`, { fill: C.muted, size: 13, anchor: 'end' }));
    const maxc = Math.floor((X1 - X0) / (15 * F * 0.6)), written = ans.slice(0, pos).join(' ');
    const room = maxc - written.length - 1, line = txt(X0, 48, '', { mono: true, size: 15 });
    if (room >= PREFIX.length) line.append(s('tspan', { fill: C.muted }, PREFIX), s('tspan', { fill: C.cyan }, written ? ' ' + written : ''));
    else if (room > 3) line.append(s('tspan', { fill: C.muted }, '…' + PREFIX.slice(-(room - 1))), s('tspan', { fill: C.cyan }, ' ' + written));
    else line.append(s('tspan', { fill: C.muted }, '… '), s('tspan', { fill: C.cyan }, written.slice(-(maxc - 2))));
    out.push(line);

    // 2. the last round, checked by the large model
    out.push(txt(X0, 80, last ? `Last round (round ${round}): checked by the large model` : 'Last round: none yet. Press Step.', { fill: C.muted, size: 13 }));
    if (last) last.draft.forEach((d, i) => {
      const x = X0 + i * SL + 4, y = 90, ok = i < last.agree, wrong = i === last.agree, gone = i > last.agree;
      out.push(tokenCard(x, y, d.word, ok ? C.cyan : C.pink, { dash: !ok, opacity: gone ? 0.45 : null }));
      if (!gone) out.push(txt(x + CW / 2, y + CHH + 22, ok ? '✓' : '✗', { fill: ok ? C.green : C.pink, size: 20, bold: true, anchor: 'middle' }));
      if (wrong) out.push(tokenCard(x, y + CHH + 32, ans[last.start + i], C.cyan));
    });

    // 3. the next draft: tap to make a guess right or wrong
    out.push(txt(X0, 232, done ? 'Answer finished. Press Reset or New data.' : 'Next draft (orange): tap a guess to make it right or wrong', { fill: C.muted, size: 13 }));
    pending.forEach((d, i) => {
      const x = X0 + i * SL + 4, y = 242, g = tokenCard(x, y, d.word, OR);
      g.style.cursor = 'pointer';
      g.addEventListener('click', () => toggle(i));
      out.push(g, txt(x + CW / 2, y + CHH + 18, d.right ? 'right' : 'wrong', { fill: d.right ? C.green : C.pink, size: 12, bold: true, anchor: 'middle' }));
    });

    // 4. time: plain decoding against the draft + check rounds
    const u = (X1 - X0) / Math.max(ans.length * LARGE, specMs, 1);
    out.push(txt(X0, 332, `Plain, one 20 ms step per token: ${plainMs} ms`, { fill: C.muted, size: 13 }));
    for (let t = 0; t < pos; t++) out.push(s('rect', { x: X0 + t * LARGE * u + 0.5, y: 340, width: Math.max(0.5, LARGE * u - 1), height: 18, fill: C.cyan, 'fill-opacity': 0.45 }));
    out.push(txt(X0, 384, `With the draft (orange guesses, cyan checks): ${specMs} ms`, { fill: C.muted, size: 13 }));
    let t0 = 0;
    for (const r of rounds) {
      out.push(s('rect', { x: X0 + t0 * u + 0.5, y: 392, width: Math.max(0.5, r.n * DRAFT * u - 1), height: 18, fill: OR, 'fill-opacity': 0.85 }));
      t0 += r.n * DRAFT;
      out.push(s('rect', { x: X0 + t0 * u + 0.5, y: 392, width: Math.max(0.5, LARGE * u - 1), height: 18, fill: C.cyan, 'fill-opacity': 0.85 }));
      t0 += LARGE;
    }

    // 5. the curve: milliseconds per token after each round
    let cumMs = 0, cumTok = 0;
    const hist = rounds.map(r => { cumMs += r.ms; cumTok += r.kept; return cumMs / cumTok; });
    const GY0 = 450, GY1 = 580, GX0 = X0 + 30 * F, GX1 = X1 - 6;
    const ymax = Math.max(40, ...hist.map(v => Math.ceil(v / 10) * 10)), xmax = Math.max(6, hist.length);
    const gx = i => GX0 + i / xmax * (GX1 - GX0), gy = v => GY1 - v / ymax * (GY1 - GY0);
    out.push(txt(X0, 436, 'Milliseconds per token so far (lower = faster)', { fill: C.muted, size: 13 }));
    for (let g = 0; g <= ymax; g += 10) out.push(s('line', { x1: GX0, x2: GX1, y1: gy(g), y2: gy(g), stroke: C.line }),
      txt(GX0 - 6, gy(g) + 4, g, { fill: C.muted, size: 11, anchor: 'end', mono: true }));
    out.push(s('line', { x1: GX0, x2: GX1, y1: gy(LARGE), y2: gy(LARGE), stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '8 6' }),
      txt(GX1, gy(LARGE) - 6, 'plain: 20', { fill: C.amber, size: 12, anchor: 'end', bold: true, mono: true }),
      txt(GX0, GY1 + 20, 'round 0', { fill: C.muted, size: 11, mono: true }),
      txt(GX1, GY1 + 20, `round ${xmax}`, { fill: C.muted, size: 11, anchor: 'end', mono: true }));
    if (hist.length) {
      out.push(s('polyline', { points: hist.map((v, i) => `${gx(i + 1)},${gy(v)}`).join(' '), fill: 'none', stroke: C.cyan, 'stroke-width': 2.5 }));
      hist.forEach((v, i) => out.push(s('circle', { cx: gx(i + 1), cy: gy(v), r: 4, fill: v < LARGE ? C.green : C.pink })));
    }
    svg.replaceChildren(...out);

    // formula box: this round's numbers
    if (!last) fbox(box, [['round 0: nothing written yet', C.muted], [`next: draft ${pending.length} × 2 ms = ${pending.length * DRAFT} ms`, OR], ['then: 1 check pass   = 20 ms', C.cyan]]);
    else {
      const per = last.ms / last.kept;
      fbox(box, [[`round ${round}`, C.muted],
        [`draft  ${last.n} × 2 ms = ${last.n * DRAFT} ms`, OR],
        ['check  1 pass   = 20 ms', C.cyan],
        `kept   ${last.agree} agreed${last.own ? ' + 1 own' : ''} = ${last.kept} token${last.kept > 1 ? 's' : ''}`,
        [`       ${last.ms} ms ÷ ${last.kept} = ${fmt(Math.round(per * 10) / 10)} ms per token`, per < LARGE ? C.green : C.pink],
        [`total  ${specMs} ms  (plain: ${plainMs} ms)`, C.amber]]);
    }
    note.textContent = done
      ? (specMs < plainMs ? `Finished: ${specMs} ms with the draft against ${plainMs} ms plain. Same words, less time.`
        : `Finished: ${specMs} ms with the draft against ${plainMs} ms plain. The draft was wrong too often, so it wasted time.`)
      : last ? (last.ms / last.kept < LARGE ? 'This round beat plain decoding: less than 20 ms per token.'
        : 'This round was slower than plain decoding: too few guesses were kept.')
      : 'Press Step to run one round: the draft guesses, then the large model checks once.';
    counter.textContent = `Round ${round} · ${pos} / ${ans.length} tokens · ${k} guesses per round · each guess right ${acc}%`;
    chal.update({ last, done, specMs, plainMs });
  }

  // the first round is the lesson's: at, nine (right), tomorrow (wrong)
  pending = [{ right: true, word: 'at' }, { right: true, word: 'nine' }, { right: false, word: 'tomorrow' }];
  draw();
  return () => clearTimeout(timer);
}
