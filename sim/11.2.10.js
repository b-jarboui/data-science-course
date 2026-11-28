// 11.2.10 Try it: ARIMA(1, 1, 0) — differencing, predicting the next change, adding it back.
// The learner drags weeks 1-6 (or taps and uses -1 / +1), adjusts the share of the last change,
// animates the forecast step by step, reveals real holidays, generates random hotels, and solves challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [20, 24, 20, 23, 24, 29];
  const REAL_START = [35, 33];
  const WHITE = '#ffffff';

  let v = START.slice();
  let realFuture = REAL_START.slice();
  let phi = 0.4;
  let sel = 5;            // week 6 selected initially
  let revealed = false;
  let random = false;
  let randomCount = 0;
  let prog = 2;           // 0..2 animated forecast progress (0=week6, 1=Xmas, 2=NY)
  let anim = 0;

  const svg = s('svg', { viewBox: '0 0 700 470' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const phiLabel = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.amber } });
  const phiSlider = h('input', {
    type: 'range', min: '-0.8', max: '1.2', step: '0.1', value: '0.4',
    style: { flex: '1 1 160px', accentColor: C.amber },
    oninput: e => { phi = Math.round(parseFloat(e.target.value) * 10) / 10; cancelAnim(); prog = 2; draw(); }
  });
  const revealBtn = btn('Reveal real holidays', () => { revealed = !revealed; draw(); }, 'go');

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: ARIMA(1, 1, 0)'),
    h('p', { class: 'sub' }, 'Drag any cyan dot (weeks 1 to 6) up or down, or tap a week and use −1 / +1. Change the share kept from the last rise and watch both holiday forecasts move.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1', () => bump(-1)), btn('+1', () => bump(1)), selLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Share of last change:'),
          phiSlider, phiLabel),
        h('div', { class: 'sim-row' },
          revealBtn,
          btn('Animate forecast', () => animateForecast()),
          btn('New hotel (random)', () => newHotel()),
          btn('Start again', () => resetAll()))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const r2 = x => Math.round(x * 100) / 100;
  const signed = x => {
    const v0 = r2(x);
    return v0 > 0 ? `+${fmt(v0)}` : v0 < 0 ? `−${fmt(Math.abs(v0))}` : '0';
  };
  const diffs = () => [1, 2, 3, 4, 5].map(i => v[i] - v[i - 1]);
  function forecast() {
    const ds = diffs();
    const lastDiff = ds[4];
    const d7 = r2(phi * lastDiff);
    const f7 = r2(v[5] + d7);
    const d8 = r2(phi * d7);
    const f8 = r2(f7 + d8);
    return { ds, lastDiff, d7, f7, d8, f8 };
  }

  const chal = challenges(ch, [
    {
      text: 'Change week 6 (or week 5) so the last weekly change is +10, while keeping the share at 0.4.',
      check: st => st.lastDiff === 10 && Math.abs(st.phi - 0.4) < 1e-6,
      why: 'Yes! Four tenths of +10 is +4, so ARIMA adds 4 rooms to week 6 for Christmas.'
    },
    {
      text: 'Move the share slider to 0. What happens to both forecasts?',
      check: st => Math.abs(st.phi) < 1e-6,
      why: 'With share 0, none of the last change carries forward, so ARIMA becomes the flat naive forecast.'
    },
    {
      text: 'Press “Start again” if needed, then press “Reveal real holidays” on the hotel data.',
      check: st => !st.random && st.revealed && st.v.join() === START.join(),
      why: 'Weekly changes alone cannot know Christmas is coming, so the 31-room forecast falls 4 rooms short of 35.'
    },
    {
      text: 'Press “New hotel (random)” twice to test ARIMA on fresh weekly counts.',
      check: st => st.randomCount >= 2,
      why: 'Every time, ARIMA turns counts into changes, takes a share of the last change, and adds it back.'
    }
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = 470, F = NARROW ? 1.12 : 1;
  const X0 = NARROW ? 40 : 54, X1 = VW - 16, TOP = 28, BASE = 300;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const colW = (X1 - X0) / 8;
  const cx = i => X0 + (i + 0.5) * colW;

  function yBounds(f) {
    const vals = [...v, f.f7, f.f8];
    if (revealed) vals.push(...realFuture);
    const maxv = Math.max(40, Math.ceil(Math.max(...vals) / 10) * 10);
    const minv = Math.min(0, Math.floor(Math.min(...vals) / 10) * 10);
    return { minv, maxv, y: val => BASE - ((val - minv) / (maxv - minv)) * (BASE - TOP) };
  }

  function cancelAnim() { if (anim) { cancelAnimationFrame(anim); anim = 0; } }

  function bump(d) {
    v[sel] = Math.max(1, Math.min(40, v[sel] + d));
    cancelAnim(); prog = 2; draw();
  }

  function animateForecast() {
    cancelAnim();
    prog = 0;
    const t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 1400);
      prog = k * 2;
      draw();
      if (k < 1) anim = requestAnimationFrame(step);
      else anim = 0;
    };
    anim = requestAnimationFrame(step);
  }

  function newHotel() {
    cancelAnim();
    const base = rnd(14, 24);
    const arr = [base];
    for (let i = 1; i < 6; i++) {
      const next = Math.max(6, Math.min(34, arr[i - 1] + rnd(-4, 6)));
      arr.push(next);
    }
    v = arr;
    realFuture = [
      Math.max(8, Math.min(40, arr[5] + rnd(0, 8))),
      Math.max(8, Math.min(40, arr[5] + rnd(-2, 7)))
    ];
    random = true;
    randomCount++;
    revealed = false;
    prog = 2;
    draw();
  }

  function resetAll() {
    cancelAnim();
    v = START.slice();
    realFuture = REAL_START.slice();
    phi = 0.4;
    phiSlider.value = '0.4';
    sel = 5;
    revealed = false;
    random = false;
    prog = 2;
    draw();
  }

  // Pointer dragging for weeks 1-6
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y > BASE + 30) return;
    const i = Math.floor((p.x - X0) / colW);
    if (i < 0 || i > 5) return;
    sel = i; dragging = i;
    svg.setPointerCapture(e.pointerId);
    move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e), f = forecast(), { minv, maxv } = yBounds(f);
    const val = minv + ((BASE - p.y) / (BASE - TOP)) * (maxv - minv);
    v[dragging] = Math.max(1, Math.min(40, Math.round(val)));
    cancelAnim(); prog = 2; draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });

  function draw() {
    const f = forecast();
    const { minv, maxv, y } = yBounds(f);
    const k = [];

    // Grid and y-axis ticks
    const stepG = (maxv - minv) > 50 ? 20 : 10;
    for (let g = minv; g <= maxv; g += stepG) {
      const gy = y(g);
      k.push(
        s('line', { x1: X0, x2: X1, y1: gy, y2: gy, stroke: C.line }),
        s('text', { x: X0 - 8, y: gy + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g)
      );
    }

    // Selected week highlight
    k.push(s('rect', {
      x: cx(sel) - colW * 0.44, y: TOP - 8, width: colW * 0.88, height: BASE - TOP + 10,
      fill: '#ffffff', 'fill-opacity': 0.05, rx: 8
    }));

    // Future hidden columns (weeks 7-8)
    for (const i of [6, 7]) {
      k.push(s('rect', {
        x: cx(i) - colW * 0.42, y: TOP - 4, width: colW * 0.84, height: BASE - TOP + 4,
        fill: C.card, 'fill-opacity': 0.45, stroke: C.line, 'stroke-dasharray': '5 5', rx: 6
      }));
    }

    // "NOW" divider at week 6
    k.push(
      s('line', { x1: cx(5), x2: cx(5), y1: TOP - 6, y2: BASE, stroke: C.cyan, 'stroke-opacity': 0.35, 'stroke-dasharray': '4 4' }),
      s('text', { x: cx(5), y: TOP - 10, fill: C.cyan, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'NOW')
    );

    // Observed segments (colored green up, pink down, muted flat)
    for (let i = 0; i < 5; i++) {
      const d = f.ds[i];
      const col = d > 0 ? C.green : d < 0 ? C.pink : C.muted;
      k.push(s('line', {
        x1: cx(i), y1: y(v[i]), x2: cx(i + 1), y2: y(v[i + 1]),
        stroke: col, 'stroke-width': 3
      }));
    }

    // Observed cyan dots & labels
    for (let i = 0; i < 6; i++) {
      const px = cx(i), py = y(v[i]);
      k.push(
        s('circle', { cx: px, cy: py, r: 13, fill: C.cyan, 'fill-opacity': 0.16 }),
        s('circle', { cx: px, cy: py, r: i === sel ? 7.5 : 6, fill: C.cyan, stroke: i === sel ? WHITE : 'none', 'stroke-width': 2 }),
        s('text', {
          x: px, y: py - 12, fill: C.cyan, 'font-size': 13 * F, 'font-weight': 700,
          'text-anchor': 'middle', 'font-family': 'Consolas'
        }, v[i])
      );
    }

    // Animated ARIMA forecast path (week 6 -> 7 -> 8)
    const p1 = Math.min(1, prog);
    const p2 = Math.max(0, Math.min(1, prog - 1));
    if (p1 > 0.01) {
      const x7 = cx(5) + (cx(6) - cx(5)) * p1;
      const y7 = y(v[5]) + (y(f.f7) - y(v[5])) * p1;
      k.push(s('line', {
        x1: cx(5), y1: y(v[5]), x2: x7, y2: y7,
        stroke: C.amber, 'stroke-width': 3, 'stroke-dasharray': '7 5'
      }));
      if (p1 >= 0.98) {
        k.push(
          s('circle', { cx: cx(6), cy: y(f.f7), r: 13, fill: C.amber, 'fill-opacity': 0.18 }),
          s('circle', { cx: cx(6), cy: y(f.f7), r: 6.5, fill: C.amber }),
          s('text', {
            x: cx(6), y: y(f.f7) + 22, fill: C.amber, 'font-size': 13 * F, 'font-weight': 700,
            'text-anchor': 'middle', 'font-family': 'Consolas'
          }, fmt(f.f7))
        );
      }
    }
    if (p2 > 0.01) {
      const x8 = cx(6) + (cx(7) - cx(6)) * p2;
      const y8 = y(f.f7) + (y(f.f8) - y(f.f7)) * p2;
      k.push(s('line', {
        x1: cx(6), y1: y(f.f7), x2: x8, y2: y8,
        stroke: C.amber, 'stroke-width': 3, 'stroke-dasharray': '7 5'
      }));
      if (p2 >= 0.98) {
        k.push(
          s('circle', { cx: cx(7), cy: y(f.f8), r: 13, fill: C.amber, 'fill-opacity': 0.18 }),
          s('circle', { cx: cx(7), cy: y(f.f8), r: 6.5, fill: C.amber }),
          s('text', {
            x: cx(7), y: y(f.f8) + 22, fill: C.amber, 'font-size': 13 * F, 'font-weight': 700,
            'text-anchor': 'middle', 'font-family': 'Consolas'
          }, fmt(f.f8))
        );
      }
    }

    // Real holiday dots & Christmas error gap when revealed
    if (revealed) {
      const r7y = y(realFuture[0]), r8y = y(realFuture[1]);
      if (p1 >= 0.98) {
        const err7 = r2(realFuture[0] - f.f7);
        k.push(
          s('line', { x1: cx(6), y1: y(f.f7), x2: cx(6), y2: r7y, stroke: C.pink, 'stroke-width': 3 }),
          s('text', {
            x: cx(6) - 10, y: (y(f.f7) + r7y) / 2 + 4, fill: C.pink, 'font-size': 12 * F,
            'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas'
          }, 'err ' + signed(err7))
        );
      }
      for (const [idx, ryVal, val] of [[6, r7y, realFuture[0]], [7, r8y, realFuture[1]]]) {
        k.push(
          s('circle', { cx: cx(idx), cy: ryVal, r: 12, fill: WHITE, 'fill-opacity': 0.18 }),
          s('circle', { cx: cx(idx), cy: ryVal, r: 6.5, fill: WHITE }),
          s('text', {
            x: cx(idx), y: ryVal - 12, fill: WHITE, 'font-size': 13 * F, 'font-weight': 700,
            'text-anchor': 'middle', 'font-family': 'Consolas'
          }, val)
        );
      }
    }

    // Week axis labels
    const wNames = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'Xmas', 'NY'];
    wNames.forEach((lbl, i) => {
      k.push(s('text', {
        x: cx(i), y: BASE + 22, fill: i >= 6 ? C.amber : (i === sel ? C.ink : C.muted),
        'font-size': 12.5 * F, 'font-weight': i === sel || i >= 6 ? 700 : 500,
        'text-anchor': 'middle', 'font-family': 'Consolas'
      }, lbl));
    });

    // Weekly changes (differences) strip
    k.push(
      s('line', { x1: X0, x2: X1, y1: 344, y2: 344, stroke: C.line }),
      s('text', { x: X0, y: 365, fill: C.muted, 'font-size': 12 * F, 'font-family': 'Consolas' }, 'Weekly changes (differencing) → predicted changes:')
    );

    const allDiffs = [
      ...f.ds.map((d, i) => ({ col: i + 1, val: d, pred: false })),
      ...(p1 >= 0.98 ? [{ col: 6, val: f.d7, pred: true }] : []),
      ...(p2 >= 0.98 ? [{ col: 7, val: f.d8, pred: true }] : [])
    ];
    const maxAbsD = Math.max(5, ...allDiffs.map(x => Math.abs(x.val)));
    const boxY = 378, boxH = 34, barBaseY = 446, barMaxH = 26;

    for (const item of allDiffs) {
      const bx = cx(item.col), bw = Math.min(68, colW * 0.84);
      const col = item.pred ? C.amber : (item.val > 0 ? C.green : item.val < 0 ? C.pink : C.muted);
      k.push(
        s('rect', {
          x: bx - bw / 2, y: boxY, width: bw, height: boxH, rx: 7,
          fill: col, 'fill-opacity': item.pred ? 0.18 : 0.13, stroke: col,
          'stroke-dasharray': item.pred ? '4 3' : null
        }),
        s('text', {
          x: bx, y: boxY + 22, fill: col, 'font-size': 13 * F, 'font-weight': 700,
          'text-anchor': 'middle', 'font-family': 'Consolas'
        }, signed(item.val))
      );
      // Mini magnitude bar under each change
      const bh = Math.max(2, (Math.abs(item.val) / maxAbsD) * barMaxH);
      k.push(s('rect', {
        x: bx - bw * 0.28, y: barBaseY - bh, width: bw * 0.56, height: bh, rx: 2,
        fill: col, 'fill-opacity': 0.72
      }));
    }

    svg.replaceChildren(...k);

    // Formula box
    const lines = [
      `changes: ${f.ds.map(signed).join(', ')}`,
      `last change = ${v[5]} − ${v[4]} = ${signed(f.lastDiff)}`,
      [`Xmas change = ${fmt(phi)} × ${signed(f.lastDiff)} = ${signed(f.d7)}`, C.amber],
      [`Xmas count  = ${v[5]} + (${signed(f.d7)}) = ${fmt(f.f7)}`, C.amber],
      [`NY change   = ${fmt(phi)} × ${signed(f.d7)} = ${signed(f.d8)}`, C.amber],
      [`NY count    = ${fmt(f.f7)} + (${signed(f.d8)}) = ${fmt(f.f8)}`, C.amber]
    ];
    if (revealed) {
      const e7 = r2(realFuture[0] - f.f7);
      lines.push([`real Xmas = ${realFuture[0]}, error = ${signed(e7)}`, Math.abs(e7) <= 1 ? C.green : C.pink]);
    }
    fbox(box, lines);

    selLabel.textContent = `Selected: week ${sel + 1} (${v[sel]} rooms)`;
    phiLabel.textContent = fmt(phi);
    revealBtn.textContent = revealed ? 'Hide real holidays' : 'Reveal real holidays';

    if (phi === 0) {
      note.textContent = 'Share is 0: none of the last change carries ahead, so ARIMA stays flat at week 6.';
    } else if (phi > 1) {
      note.textContent = 'Share is above 1: each week ahead carries a bigger change than the one before it.';
    } else if (phi < 0) {
      note.textContent = 'Negative share: a rise predicts a drop next week, and a drop predicts a rise.';
    } else {
      note.textContent = 'ARIMA(1, 1, 0) turns counts into weekly changes, keeps a share of the last change, and adds it back.';
    }

    chal.update({ v, phi, lastDiff: f.lastDiff, revealed, random, randomCount });
  }

  draw();
  return () => cancelAnim();
}
