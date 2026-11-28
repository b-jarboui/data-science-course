// 5.1.1 Try it: Bernoulli trials (urgent vs. not urgent tickets).
// The learner sets the chance p, draws tickets one by one or in batches of 10 / 100,
// watches the running average of 0s and 1s settle toward p, and solves self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, fmt, challenges } = kit;
  const ORANGE = '#fb923c';

  // Initial 100-ticket batch matching the lesson (20 urgent, 80 not urgent at p = 0.20)
  const INIT_URG = new Set([2, 7, 11, 12, 18, 24, 30, 35, 39, 43, 47, 56, 61, 62, 68, 74, 80, 85, 89, 94]);
  const makeInitial = () => Array.from({ length: 100 }, (_, i) => INIT_URG.has(i) ? 1 : 0);

  let p = 0.2;
  let tickets = makeInitial();
  let sel = -1;
  let freshAt02 = 0;

  const svg = s('svg', { viewBox: '0 0 700 470' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const pValLbl = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', fontWeight: 700, color: ORANGE } });
  const slider = h('input', {
    type: 'range', min: 0, max: 100, step: 5, value: 20,
    style: { flex: '1 1 160px', accentColor: ORANGE, cursor: 'pointer' },
    oninput: () => setP(Number(slider.value) / 100)
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: Bernoulli trials'),
    h('p', { class: 'sub' }, 'Each card is one ticket: glowing orange = urgent (1), blue = not urgent (0). Set the chance p, draw tickets, and watch the average of the 0s and 1s.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−0.05', () => setP(p - 0.05)),
          slider,
          btn('+0.05', () => setP(p + 0.05)),
          pValLbl),
        h('div', { class: 'sim-row' },
          btn('Draw 1 ticket', () => addTrials(1), 'go'),
          btn('+10 tickets', () => addTrials(10)),
          btn('+100 tickets', () => addTrials(100)),
          btn('New data (100)', () => newBatch()),
          btn('Clear', () => { tickets = []; sel = -1; draw(); }),
          btn('Reset (p = 1/5)', () => { p = 0.2; slider.value = 20; tickets = makeInitial(); sel = -1; draw(); }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Set p to 0.50 so urgent and not urgent are equally likely.',
      check: st => Math.abs(st.p - 0.5) < 1e-6,
      why: 'Yes! At p = 0.50 the variance reaches its largest value, 0.25, because neither outcome is favored.'
    },
    {
      text: 'Make the variance equal to 0 (no spread at all).',
      check: st => st.p === 0 || st.p === 1,
      why: 'Right: when p is 0 or 1, every ticket is the same, so there is no spread and the variance is 0.'
    },
    {
      text: 'Set p to 0.20, then press “New data (100)” twice. Do you get 20 urgent cards every time?',
      check: st => Math.abs(st.p - 0.2) < 1e-6 && st.freshAt02 >= 2,
      why: 'Usually not! The count bounces around 20 because 1 in 5 is a chance, not a promise.'
    },
    {
      text: 'Build up at least 200 tickets (with p between 0.10 and 0.90) and watch the orange line.',
      check: st => st.p >= 0.1 && st.p <= 0.9 && st.n >= 200,
      why: 'Over many tickets, the running average of the 0s and 1s settles close to the dashed amber line at p.'
    }
  ]);

  function drawOne() { return Math.random() < p ? 1 : 0; }

  function setP(next) {
    p = Math.round(Math.max(0, Math.min(1, next)) * 100) / 100;
    slider.value = Math.round(p * 100);
    tickets = Array.from({ length: 100 }, drawOne);
    sel = -1;
    draw();
  }

  function addTrials(k) {
    for (let i = 0; i < k; i++) tickets.push(drawOne());
    sel = tickets.length - 1;
    draw();
  }

  function newBatch() {
    if (Math.abs(p - 0.2) < 1e-6) freshAt02++;
    tickets = Array.from({ length: 100 }, drawOne);
    sel = -1;
    draw();
  }

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.18 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} 470`);

  const GX0 = NARROW ? 16 : 36, GX1 = VW - (NARROW ? 16 : 24);
  const GY0 = 30, GY1 = 244;
  const CX0 = NARROW ? 42 : 52, CX1 = VW - (NARROW ? 16 : 24);
  const CY0 = 290, CY1 = 434;

  // Tap a card in the 10x10 grid to inspect it
  const toSvg = e => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const pt = toSvg(e);
    if (pt.x < GX0 || pt.x > GX1 || pt.y < GY0 || pt.y > GY1) return;
    const col = Math.floor((pt.x - GX0) / ((GX1 - GX0) / 10));
    const row = Math.floor((pt.y - GY0) / ((GY1 - GY0) / 10));
    const offset = Math.max(0, tickets.length - 100);
    const idx = offset + row * 10 + col;
    if (idx >= 0 && idx < tickets.length) { sel = idx; draw(); }
  });

  function draw() {
    const n = tickets.length;
    const urgCount = tickets.reduce((a, b) => a + b, 0);
    const share = n ? urgCount / n : 0;
    const q = Math.round((1 - p) * 100) / 100;
    const variance = Math.round(p * q * 10000) / 10000;
    const k = [];

    // Header above card grid
    const offset = Math.max(0, n - 100);
    const shown = tickets.slice(offset);
    const headerTxt = n === 0
      ? 'No tickets yet — press “Draw 1 ticket” or “New data (100)”'
      : n <= 100
        ? `Tickets 1–${n}  (${urgCount} urgent, ${n - urgCount} not urgent)`
        : `Latest 100 of ${n} tickets  (${urgCount} urgent overall)`;
    k.push(s('text', { x: GX0, y: 19, fill: C.muted, 'font-size': 12.5 * F, 'font-family': 'Consolas' }, headerTxt));

    // 10x10 glowing ticket grid
    const cellW = (GX1 - GX0) / 10, cellH = (GY1 - GY0) / 10;
    const padX = NARROW ? 2.5 : 4, padY = 2.5;
    for (let i = 0; i < 100; i++) {
      const r = Math.floor(i / 10), c = i % 10;
      const x = GX0 + c * cellW + padX, y = GY0 + r * cellH + padY;
      const w = cellW - padX * 2, hgt = cellH - padY * 2;
      if (i < shown.length) {
        const val = shown[i];
        const absIdx = offset + i;
        const col = val === 1 ? ORANGE : C.cyan;
        const isSel = absIdx === sel;
        k.push(s('rect', {
          x, y, width: w, height: hgt, rx: 3.5,
          fill: col, 'fill-opacity': val === 1 ? 0.85 : 0.34,
          stroke: isSel ? C.amber : col, 'stroke-width': isSel ? 2.4 : 1.1
        }));
        k.push(s('text', {
          x: x + w / 2, y: y + hgt / 2 + 4,
          fill: val === 1 ? C.bg : C.ink,
          'font-size': (NARROW ? 11 : 12), 'font-weight': 700,
          'text-anchor': 'middle', 'font-family': 'Consolas'
        }, String(val)));
      } else {
        k.push(s('rect', {
          x, y, width: w, height: hgt, rx: 3.5,
          fill: C.bg, 'fill-opacity': 0.5,
          stroke: C.line, 'stroke-width': 1
        }));
      }
    }

    // Running-share chart title
    k.push(s('text', {
      x: CX0, y: CY0 - 12, fill: C.muted, 'font-size': 12.5 * F, 'font-family': 'Consolas'
    }, 'Running average of 0s and 1s (share of urgent tickets)'));

    // Y-axis gridlines (0, 0.25, 0.5, 0.75, 1)
    [0, 0.25, 0.5, 0.75, 1].forEach(gv => {
      const y = CY1 - gv * (CY1 - CY0);
      k.push(s('line', { x1: CX0, x2: CX1, y1: y, y2: y, stroke: C.line, 'stroke-width': 1 }));
      k.push(s('text', {
        x: CX0 - 7, y: y + 4, fill: C.muted,
        'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas'
      }, gv.toFixed(2).replace(/\.00$/, '')));
    });

    // Axes
    k.push(s('line', { x1: CX0, x2: CX1, y1: CY1, y2: CY1, stroke: C.muted, 'stroke-width': 1.5 }));
    k.push(s('line', { x1: CX0, x2: CX0, y1: CY0, y2: CY1, stroke: C.muted, 'stroke-width': 1.5 }));

    // Running average curve
    if (n > 0) {
      const maxX = Math.max(10, n);
      let running = 0;
      const pts = [];
      const stride = n > 250 ? Math.ceil(n / 250) : 1;
      for (let i = 0; i < n; i++) {
        running += tickets[i];
        if (i === 0 || i === n - 1 || (i + 1) % stride === 0) {
          const px = CX0 + ((i + 1) / maxX) * (CX1 - CX0);
          const py = CY1 - (running / (i + 1)) * (CY1 - CY0);
          pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
        }
      }
      if (pts.length > 1) {
        k.push(s('polyline', {
          points: pts.join(' '), fill: 'none',
          stroke: ORANGE, 'stroke-width': 2.6, 'stroke-linejoin': 'round'
        }));
      }
      const lastX = CX0 + (n / maxX) * (CX1 - CX0);
      const lastY = CY1 - share * (CY1 - CY0);
      k.push(s('circle', { cx: lastX, cy: lastY, r: 4.5, fill: ORANGE, stroke: C.bg, 'stroke-width': 1.5 }));

      // X-axis tick labels
      const ticks = n <= 10 ? [1, n] : [1, Math.round(n / 2), n];
      ticks.forEach(tk => {
        const tx = CX0 + (tk / maxX) * (CX1 - CX0);
        k.push(s('text', {
          x: tx, y: CY1 + 18, fill: C.muted,
          'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, String(tk)));
      });
    }

    // Dashed amber target line at true p
    const yp = CY1 - p * (CY1 - CY0);
    const pillW = 92 * F, pillH = 22 * F;
    const pillY = Math.max(CY0 + 2, Math.min(CY1 - pillH - 2, yp - pillH - 4));
    k.push(
      s('line', { x1: CX0, x2: CX1, y1: yp, y2: yp, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '8 6' }),
      s('rect', { x: CX1 - pillW, y: pillY, width: pillW, height: pillH, rx: pillH / 2, fill: C.bg, stroke: C.amber }),
      s('text', {
        x: CX1 - pillW / 2, y: pillY + pillH * 0.7, fill: C.amber,
        'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, `p = ${p.toFixed(2)}`)
    );

    svg.replaceChildren(...k);

    // Formula box
    fbox(box, [
      [`P(U = 1) = p     = ${p.toFixed(2)}`, ORANGE],
      [`P(U = 0) = 1 − p = ${q.toFixed(2)}`, C.cyan],
      [`mean     = p     = ${p.toFixed(2)}`, C.amber],
      [`variance = p(1−p)= ${fmt(variance)}`, C.violet],
      n > 0
        ? [`sample: ${urgCount} ÷ ${n} = ${share.toFixed(3)}`, C.ink]
        : ['sample: 0 tickets drawn yet', C.muted]
    ]);

    pValLbl.textContent = `p = ${p.toFixed(2)}`;
    if (sel >= 0 && sel < n) {
      note.textContent = `Ticket #${sel + 1}: ${tickets[sel] === 1 ? 'urgent (U = 1)' : 'not urgent (U = 0)'}. Each ticket is an independent Bernoulli trial with chance p = ${p.toFixed(2)}.`;
    } else if (n === 0) {
      note.textContent = 'Draw one ticket at a time to see individual trials, or add 100 to watch the running share settle near p.';
    } else {
      note.textContent = `In ${n} tickets, ${urgCount} were urgent (${(share * 100).toFixed(1)}%). The dashed amber line marks the true chance p = ${p.toFixed(2)}.`;
    }

    chal.update({ p, n, urgCount, share, variance, freshAt02 });
  }

  draw();
  return () => {};
}
