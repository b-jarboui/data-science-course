// 11.2.7 Try it: autoregressive model AR(2).
// Drag weeks 1-6 (or tap a week and use -1 / +1), tune the usual count and the two lag weights,
// reveal week 7 to check the error, generate fresh random hotel weeks, and solve self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const START = [20, 24, 20, 23, 24, 29];
  const START_REAL = 35;

  let weeks = START.slice();
  let real7 = START_REAL;
  let usual = 22, a1 = 0.50, a2 = 0.25;
  let sel = 5; // week 6 selected by default
  let revealed = false, isRandom = false, countedThisRandom = false, randomReveals = 0;

  const svg = s('svg', { viewBox: '0 0 700 420' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  function sliderRow(label, min, max, step, val, onChange, format) {
    const out = h('span', { style: { fontFamily: 'Consolas, monospace', fontWeight: 700, color: C.amber, minWidth: '3.4rem', textAlign: 'right' } }, format(val));
    const inp = h('input', {
      type: 'range', min, max, step, value: val,
      style: { flex: '1 1 8rem', accentColor: C.cyan },
      oninput: e => { const v = +e.target.value; out.textContent = format(v); onChange(v); }
    });
    const row = h('div', { class: 'sim-row', style: { marginTop: '.55rem', justifyContent: 'space-between' } },
      h('span', { style: { minWidth: '8.5rem', fontSize: '.92rem', color: '#cfd7f0' } }, label),
      inp, out);
    return { row, set(v) { inp.value = v; out.textContent = format(v); } };
  }

  const sUsual = sliderRow('Usual count', 10, 34, 1, usual, v => { usual = v; draw(); }, v => `${v}`);
  const sA1 = sliderRow('Lag 1 weight (wk 6)', 0, 1, 0.05, a1, v => { a1 = r2(v); draw(); }, v => v.toFixed(2));
  const sA2 = sliderRow('Lag 2 weight (wk 5)', 0, 0.75, 0.05, a2, v => { a2 = r2(v); draw(); }, v => v.toFixed(2));

  const revealBtn = btn('Reveal week 7', () => toggleReveal(), 'go');

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: autoregressive forecast AR(2)'),
    h('p', { class: 'sub' }, 'Drag any cyan dot (weeks 1 to 6) up or down, or tap a week and use −1 / +1. Watch the bars from the usual line and the two pieces that build week 7’s forecast.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1', () => bump(-1)), btn('+1', () => bump(1)), selLabel),
        sUsual.row, sA1.row, sA2.row,
        h('div', { class: 'sim-row' },
          revealBtn,
          btn('New weeks (random)', () => newRandom()),
          btn('Start again', () => reset()))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const r2 = x => Math.round(x * 100) / 100;
  const r3 = x => Math.round(x * 1000) / 1000;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const signed = x => {
    const v = r2(x);
    return v > 0 ? `+${fmt(v)}` : v < 0 ? `−${fmt(Math.abs(v))}` : '0';
  };

  function calc() {
    const g1 = weeks[5] - usual;
    const g2 = weeks[4] - usual;
    const p1 = r3(a1 * g1);
    const p2 = r3(a2 * g2);
    const fc = r3(usual + p1 + p2);
    return { g1, g2, p1, p2, fc };
  }

  function toggleReveal() {
    revealed = !revealed;
    if (revealed && isRandom && !countedThisRandom) {
      countedThisRandom = true;
      randomReveals++;
    }
    draw();
  }

  function newRandom() {
    const u = rnd(18, 26);
    usual = u;
    sUsual.set(u);
    const seq = [clamp(u + rnd(-6, 6), 4, 38), clamp(u + rnd(-6, 6), 4, 38)];
    for (let i = 2; i < 7; i++) {
      const next = u + 0.5 * (seq[i - 1] - u) + 0.25 * (seq[i - 2] - u) + rnd(-3, 3);
      seq.push(clamp(Math.round(next), 3, 39));
    }
    weeks = seq.slice(0, 6);
    real7 = seq[6];
    revealed = false;
    isRandom = true;
    countedThisRandom = false;
    draw();
  }

  function reset() {
    weeks = START.slice();
    real7 = START_REAL;
    usual = 22; a1 = 0.50; a2 = 0.25;
    sUsual.set(usual); sA1.set(a1); sA2.set(a2);
    sel = 5;
    revealed = false;
    isRandom = false;
    countedThisRandom = false;
    draw();
  }

  function bump(d) {
    weeks[sel] = clamp(weeks[sel] + d, 0, 40);
    draw();
  }

  const chal = challenges(ch, [
    {
      text: 'Drag week 6 below the usual line (22) so its bar points down and pulls the forecast below 22.',
      check: st => st.w6 < st.usual && st.fc < st.usual,
      why: 'Yes! A count below the usual line makes a downward bar, and taking a piece of it lowers the forecast.'
    },
    {
      text: 'With usual = 22 and weights 0.50 and 0.25, change week 6 (or week 5) to make the forecast exactly 30.',
      check: st => st.usual === 22 && Math.abs(st.a1 - 0.5) < 1e-6 && Math.abs(st.a2 - 0.25) < 1e-6 && Math.abs(st.fc - 30) < 0.001,
      why: 'Right! Starting from 22, the two gap pieces need to add +8 rooms (for example, week 6 = 37 and week 5 = 24).'
    },
    {
      text: 'Set the lag-2 weight to 0 so only week 6 counts, then raise the lag-1 weight to 0.75 or higher.',
      check: st => st.a2 === 0 && st.a1 >= 0.75,
      why: 'Good! With lag-2 weight at 0, only last week’s gap moves the guess, and a larger weight carries more of it over.'
    },
    {
      text: 'Press “New weeks (random)” and then “Reveal week 7”, twice. Notice how AR(2) tracks ordinary carry-over.',
      check: st => st.randomReveals >= 2,
      why: 'When busy or quiet weeks carry over without a surprise holiday jump, the AR(2) pieces land much closer to the real count.'
    }
  ]);

  // SVG geometry (phone-friendly narrow viewBox)
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 420, F = NARROW ? 1.18 : 1;
  const X0 = NARROW ? 40 : 54, X1 = VW - 16, BASE = 362, TOP = 30;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const colW = (X1 - X0) / 7;
  const wx = i => X0 + colW * (i + 0.5);
  const ry = r => BASE - (r / 40) * (BASE - TOP);

  // Pointer drag on weeks 1..6
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), i = Math.floor((p.x - X0) / colW);
    if (i < 0 || i > 5) return;
    sel = i; dragging = i;
    svg.setPointerCapture(e.pointerId);
    move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    weeks[dragging] = clamp(Math.round(((BASE - p.y) / (BASE - TOP)) * 40), 0, 40);
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  function draw() {
    const { g1, g2, p1, p2, fc } = calc();
    const k = [];

    // Gridlines and y-axis labels (0..40)
    for (let r = 0; r <= 40; r += 10) {
      const y = ry(r);
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line, 'stroke-width': r === 0 ? 2 : 1 }),
        s('text', { x: X0 - 8, y: y + 4 * F, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'end', 'font-family': 'Consolas, monospace' }, r)
      );
    }
    k.push(s('line', { x1: X0, x2: X0, y1: TOP, y2: BASE, stroke: C.muted, 'stroke-width': 2 }));

    // Highlight selected observed week column
    k.push(s('rect', {
      x: wx(sel) - colW * 0.44, y: TOP - 6, width: colW * 0.88, height: BASE - TOP + 6,
      fill: '#ffffff', 'fill-opacity': 0.05, rx: 8
    }));

    // Usual count dashed guide line
    const yu = ry(usual);
    k.push(
      s('line', { x1: X0, x2: X1, y1: yu, y2: yu, stroke: C.ink, 'stroke-width': 2, 'stroke-dasharray': '7 6', 'stroke-opacity': 0.75 }),
      s('text', { x: X0 + 6, y: yu - 6, fill: C.ink, 'font-size': 12 * F, 'font-family': 'Consolas, monospace', opacity: 0.85 }, `usual ${usual}`)
    );

    // Gap bars for lag 2 (week 5) and lag 1 (week 6)
    const barW = Math.min(28, colW * 0.34);
    [[4, g2], [5, g1]].forEach(([idx, gap]) => {
      const col = gap >= 0 ? C.cyan : C.pink;
      const yA = ry(usual), yB = ry(weeks[idx]);
      if (Math.abs(yB - yA) > 1) {
        k.push(s('rect', {
          x: wx(idx) - barW / 2, y: Math.min(yA, yB), width: barW, height: Math.abs(yB - yA),
          fill: col, 'fill-opacity': 0.35, stroke: col, 'stroke-width': 1.6, rx: 3
        }));
      }
      const gy = gap >= 0 ? yA + 16 * F : yA - 7 * F;
      k.push(s('text', {
        x: wx(idx), y: gy, fill: col, 'font-size': 12.5 * F, 'font-weight': 700,
        'text-anchor': 'middle', 'font-family': 'Consolas, monospace'
      }, signed(gap)));
    });

    // Stacked pieces at week 7 (lag 1 piece from usual, then lag 2 piece on top)
    const x7 = wx(6);
    const yStart = ry(usual);
    const yMid = ry(clamp(usual + p1, 0, 40));
    const yEnd = ry(clamp(fc, 0, 40));
    if (Math.abs(yMid - yStart) > 1) {
      const c1 = p1 >= 0 ? C.amber : C.pink;
      k.push(s('rect', {
        x: x7 - barW / 2, y: Math.min(yStart, yMid), width: barW, height: Math.abs(yMid - yStart),
        fill: c1, 'fill-opacity': 0.65, stroke: c1, 'stroke-width': 1.6, rx: 2
      }));
    }
    if (Math.abs(yEnd - yMid) > 1) {
      const c2 = p2 >= 0 ? C.green : C.pink;
      k.push(s('rect', {
        x: x7 - barW * 0.42, y: Math.min(yMid, yEnd), width: barW * 0.84, height: Math.abs(yEnd - yMid),
        fill: c2, 'fill-opacity': 0.78, stroke: c2, 'stroke-width': 1.6, rx: 2
      }));
    }

    // Observed cyan polyline (weeks 1..6)
    const pts = weeks.map((v, i) => `${wx(i)},${ry(v)}`).join(' ');
    k.push(s('polyline', { points: pts, fill: 'none', stroke: C.cyan, 'stroke-width': 2.6 }));

    // Forecast dashed amber line from week 6 to week 7
    const fcClamped = clamp(fc, 0, 40);
    k.push(s('line', {
      x1: wx(5), y1: ry(weeks[5]), x2: x7, y2: ry(fcClamped),
      stroke: C.amber, 'stroke-width': 2.6, 'stroke-dasharray': '7 6'
    }));

    // Observed cyan dots (weeks 1..6)
    weeks.forEach((v, i) => {
      const cx = wx(i), cy = ry(v), isLag = i === 4 || i === 5;
      k.push(
        s('circle', { cx, cy, r: (i === sel ? 14 : 11) * F, fill: C.cyan, 'fill-opacity': i === sel ? 0.25 : 0.14 }),
        s('circle', { cx, cy, r: 5.5 * F, fill: C.cyan, stroke: i === sel ? '#ffffff' : 'none', 'stroke-width': 2 }),
        s('text', {
          x: cx, y: cy + (v >= 36 ? 20 * F : -11 * F), fill: isLag ? '#ffffff' : C.cyan,
          'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace'
        }, v)
      );
    });

    // Forecast amber dot & badge at week 7
    const fy = ry(fcClamped);
    k.push(
      s('circle', { cx: x7, cy: fy, r: 12 * F, fill: C.amber, 'fill-opacity': 0.22 }),
      s('circle', { cx: x7, cy: fy, r: 6 * F, fill: C.amber }),
      s('text', {
        x: x7, y: fy + (revealed && real7 > fcClamped && Math.abs(real7 - fcClamped) < 5 ? 20 * F : -12 * F),
        fill: C.amber, 'font-size': 13.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace'
      }, fmt(r2(fc)))
    );

    // Optional revealed week 7 actual dot and error bar
    if (revealed) {
      const ay = ry(real7);
      k.push(
        s('line', { x1: x7, x2: x7, y1: fy, y2: ay, stroke: C.pink, 'stroke-width': 2.5 }),
        s('circle', { cx: x7, cy: ay, r: 12 * F, fill: '#ffffff', 'fill-opacity': 0.22 }),
        s('circle', { cx: x7, cy: ay, r: 6 * F, fill: '#ffffff' }),
        s('text', {
          x: x7, y: ay + (real7 >= 37 ? 20 * F : -12 * F), fill: '#ffffff',
          'font-size': 13.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace'
        }, `real ${real7}`)
      );
    }

    // X-axis week labels
    for (let i = 0; i < 7; i++) {
      const lab = i === 6 ? (isRandom ? 'wk 7' : '7 Xmas') : String(i + 1);
      k.push(s('text', {
        x: wx(i), y: BASE + 22 * F, fill: i === 6 ? C.amber : (i === sel ? '#ffffff' : C.muted),
        'font-size': 13 * F, 'font-weight': (i === sel || i === 6) ? 700 : 400,
        'text-anchor': 'middle', 'font-family': 'Consolas, monospace'
      }, lab));
    }

    svg.replaceChildren(...k);

    // Live formula box
    const lines = [
      `usual count   = ${usual}`,
      [`lag 1 (wk 6):  ${weeks[5]} − ${usual} = ${signed(g1)}`, g1 >= 0 ? C.cyan : C.pink],
      [`  piece 1     = ${a1.toFixed(2)} × ${signed(g1)} = ${signed(p1)}`, p1 >= 0 ? C.amber : C.pink],
      [`lag 2 (wk 5):  ${weeks[4]} − ${usual} = ${signed(g2)}`, g2 >= 0 ? C.cyan : C.pink],
      [`  piece 2     = ${a2.toFixed(2)} × ${signed(g2)} = ${signed(p2)}`, p2 >= 0 ? C.green : C.pink],
      [`forecast      = ${usual} ${p1 < 0 ? '−' : '+'} ${fmt(r2(Math.abs(p1)))} ${p2 < 0 ? '−' : '+'} ${fmt(r2(Math.abs(p2)))} = ${fmt(r2(fc))}`, C.amber]
    ];
    if (revealed) {
      const err = r2(real7 - fc);
      lines.push([`real wk 7     = ${real7}  (error ${signed(err)})`, C.pink]);
    }
    fbox(box, lines);

    revealBtn.textContent = revealed ? 'Hide week 7' : (isRandom ? 'Reveal week 7' : 'Reveal Christmas (35)');
    selLabel.textContent = `Selected: week ${sel + 1} (${weeks[sel]} rooms)`;
    note.textContent = revealed
      ? (!isRandom
        ? `Real Christmas was ${real7}. Recent counts alone cannot know about a holiday jump.`
        : `Real week 7 was ${real7}. Forecast error: ${signed(real7 - fc)} rooms.`)
      : 'Cyan bars push above usual; pink downward bars pull the forecast down. Only weeks 5 and 6 enter AR(2).';

    chal.update({ usual, a1, a2, w5: weeks[4], w6: weeks[5], fc: r3(fc), randomReveals });
  }

  draw();
  return () => {};
}
