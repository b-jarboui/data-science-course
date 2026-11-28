// 1.3.9 Try it: standard scores.
// Tap any parcel dot to inspect its standard score, drag it left or right (or use −1 / +1),
// add an extreme 21-day parcel, generate fresh random weeks, and solve self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [3, 4, 4, 5, 6, 6, 7];
  let v = START.slice(), sel = 6, randomCount = 0;

  const svg = s('svg', { viewBox: '0 0 700 370' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: standard scores'),
    h('p', { class: 'sub' }, 'Each cyan dot is one parcel’s delivery time in days. Tap a parcel to inspect its score, and drag it left or right (or use −1 / +1) to see how many standard-deviation steps it sits from the mean.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1 day', () => bump(-1)), btn('+1 day', () => bump(1)), selLabel),
        h('div', { class: 'sim-row' },
          btn('New data (random)', () => {
            const center = rnd(4, 9), spread = rnd(1, 3);
            v = v.map(() => Math.max(1, Math.min(18, center + rnd(-spread, spread))));
            if (new Set(v).size === 1) v[v.length - 1] += 2;
            sel = v.length - 1;
            randomCount++;
            draw();
          }, 'go'),
          btn('Add a 21-day parcel', () => {
            if (v.length < 10) {
              v.push(21);
              // Keep focus on the 7-day parcel if present so the learner sees its score shrink!
              const i7 = v.indexOf(7);
              if (i7 >= 0) sel = i7;
              draw();
            }
          }),
          btn('Add a parcel', () => { if (v.length < 10) { v.push(rnd(2, 10)); sel = v.length - 1; draw(); } }),
          btn('Remove a parcel', () => { if (v.length > 3) { v.pop(); sel = Math.min(sel, v.length - 1); draw(); } }),
          btn('Start again', () => { v = START.slice(); sel = 6; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const r2 = x => Math.round(x * 100) / 100;
  const signed = x => (x > 0.004 ? '+' : '') + fmt(r2(x));
  function stats() {
    const n = v.length;
    const m = v.reduce((a, b) => a + b, 0) / n;
    const variance = n > 1 ? v.reduce((a, x) => a + (x - m) ** 2, 0) / (n - 1) : 0;
    const sd = Math.sqrt(variance);
    const val = v[sel];
    const gap = val - m;
    const z = sd > 1e-9 ? gap / sd : 0;
    return { n, m, sd, val, gap, z };
  }

  const chal = challenges(ch, [
    {
      text: 'Tap a parcel below the mean so its standard score is negative.',
      check: st => st.sd > 0 && st.z < -0.05,
      why: 'Right! Parcels below the mean have a negative gap, so their standard score has a minus sign.'
    },
    {
      text: 'Drag a parcel far from the group so its standard score goes past +2 (or below −2).',
      check: st => st.sd > 0 && Math.abs(st.z) > 2,
      why: 'Now it stands out! Results more than 2 standard-deviation steps from the mean are unusual.'
    },
    {
      text: 'Press “Add a 21-day parcel” and watch what happens to the step size (SD) and the 7-day parcel’s score.',
      check: st => st.v.includes(21),
      why: 'One extreme parcel pulls the mean up and stretches the SD, so other late parcels look closer to normal.'
    },
    {
      text: 'Press “New data (random)” twice, then tap a parcel close to the mean so its score is near 0.',
      check: st => st.randomCount >= 2 && st.sd > 0 && Math.abs(st.z) < 0.65,
      why: 'Always! On any dataset, results close to the mean sit close to 0 standard-deviation steps away.'
    }
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 370, F = NARROW ? 1.2 : 1;
  const X0 = NARROW ? 28 : 44, X1 = VW - (NARROW ? 24 : 38);
  const AXIS_Y = 266;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const maxX = () => Math.max(10, Math.ceil(Math.max(...v) + 2));
  const xOf = val => X0 + (val / maxX()) * (X1 - X0);
  const valOf = x => Math.max(1, Math.min(25, Math.round(((x - X0) / (X1 - X0)) * maxX())));

  function dotCoords() {
    const seen = new Map();
    return v.map((val, i) => {
      const c = seen.get(val) || 0;
      seen.set(val, c + 1);
      return { i, val, x: xOf(val), y: AXIS_Y - 26 - c * (28 * F) };
    });
  }

  function bump(d) {
    v[sel] = Math.max(1, Math.min(25, v[sel] + d));
    draw();
  }

  // pointer interaction: tap any dot to select, drag horizontally to change its delivery time
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), pts = dotCoords();
    let best = -1, bestD = Infinity;
    for (const pt of pts) {
      const d = Math.hypot(pt.x - p.x, pt.y - p.y);
      if (d < bestD) { bestD = d; best = pt.i; }
    }
    if (best >= 0 && bestD < 36 * F) {
      sel = best;
      dragging = best;
      svg.setPointerCapture(e.pointerId);
      draw();
    } else if (p.y > 40 && p.y < AXIS_Y + 40) {
      // tapping directly on the line moves the currently selected parcel there
      dragging = sel;
      svg.setPointerCapture(e.pointerId);
      v[sel] = valOf(p.x);
      draw();
    }
  });
  svg.addEventListener('pointermove', e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    const nv = valOf(p.x);
    if (nv !== v[dragging]) {
      v[dragging] = nv;
      draw();
    }
  });
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  function draw() {
    const { n, m, sd, val, gap, z } = stats();
    const mx = maxX(), xm = xOf(m), xs = xOf(val);
    const scoreCol = sd === 0 ? C.muted : Math.abs(z) > 2 ? C.pink : Math.abs(z) > 1 ? C.amber : C.green;
    const k = [];

    // ±2 SD typical shaded band
    if (sd > 1e-9) {
      const xLo = Math.max(X0, xOf(m - 2 * sd)), xHi = Math.min(X1, xOf(m + 2 * sd));
      k.push(s('rect', { x: xLo, y: 120, width: Math.max(0, xHi - xLo), height: AXIS_Y - 120, fill: C.green, 'fill-opacity': 0.09 }));
      for (const mult of [-2, -1, 1, 2]) {
        const xv = xOf(m + mult * sd);
        if (xv > X0 + 2 && xv < X1 - 2) {
          k.push(s('line', { x1: xv, x2: xv, y1: 124, y2: AXIS_Y, stroke: Math.abs(mult) === 2 ? C.green : C.line, 'stroke-dasharray': '5 5', 'stroke-width': 1.5 }));
          k.push(s('text', { x: xv, y: 116, fill: Math.abs(mult) === 2 ? C.green : C.muted, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, (mult > 0 ? '+' : '') + mult + ' SD'));
        }
      }
    }

    // days axis & ticks
    const step = mx > 16 ? 2 : 1;
    k.push(s('line', { x1: X0, x2: X1, y1: AXIS_Y, y2: AXIS_Y, stroke: C.muted, 'stroke-width': 2.5 }));
    for (let d = 0; d <= mx; d += step) {
      const xd = xOf(d);
      k.push(s('line', { x1: xd, x2: xd, y1: AXIS_Y - 5, y2: AXIS_Y + 6, stroke: C.muted, 'stroke-width': 1.5 }));
      k.push(s('text', { x: xd, y: AXIS_Y + 23 * F, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, d));
    }
    k.push(s('text', { x: X1, y: AXIS_Y + 42 * F, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Segoe UI, sans-serif' }, 'days'));

    // mean line & badge
    k.push(s('line', { x1: xm, x2: xm, y1: 96, y2: AXIS_Y + 6, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '7 6' }));
    const mW = 104 * F, mX = Math.max(X0, Math.min(X1 - mW, xm - mW / 2));
    k.push(s('rect', { x: mX, y: AXIS_Y + 48 * F, width: mW, height: 24 * F, rx: 12 * F, fill: C.bg, stroke: C.amber }));
    k.push(s('text', { x: mX + mW / 2, y: AXIS_Y + 64 * F, fill: C.amber, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'MEAN ' + fmt(r2(m))));

    // SD step blocks from mean toward selected parcel
    if (sd > 1e-9 && Math.abs(gap) > 1e-9) {
      const dir = gap > 0 ? 1 : -1;
      const whole = Math.floor(Math.abs(z));
      const barY = 66, barH = 22;
      for (let st = 0; st < Math.min(4, whole + 1); st++) {
        const a = m + dir * st * sd;
        const b = Math.abs(st + 1) <= Math.abs(z) ? m + dir * (st + 1) * sd : val;
        const xa = Math.max(X0, Math.min(X1, xOf(a))), xb = Math.max(X0, Math.min(X1, xOf(b)));
        const xMin = Math.min(xa, xb), w = Math.abs(xb - xa);
        if (w > 1) {
          const isFull = st < whole;
          k.push(s('rect', { x: xMin, y: barY, width: w, height: barH, rx: 4, fill: isFull ? C.green : scoreCol, 'fill-opacity': isFull ? 0.32 : 0.28, stroke: isFull ? C.green : scoreCol, 'stroke-width': 1.8 }));
          if (w > 22) {
            k.push(s('text', { x: xMin + w / 2, y: barY + 15, fill: isFull ? C.green : scoreCol, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, isFull ? String(st + 1) : fmt(r2(Math.abs(z) - whole))));
          }
        }
      }
      // gap line from mean to selected parcel
      k.push(s('line', { x1: xm, x2: xs, y1: 52, y2: 52, stroke: scoreCol, 'stroke-width': 2.5 }));
      k.push(s('circle', { cx: xs, cy: 52, r: 4, fill: scoreCol }));
      k.push(s('text', { x: (xm + xs) / 2, y: 44, fill: scoreCol, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `gap ${signed(gap)} d`));
    }

    // parcel dots
    const pts = dotCoords();
    for (const pt of pts) {
      const isSel = pt.i === sel;
      const col = pt.val >= 20 ? C.pink : isSel ? scoreCol : C.cyan;
      if (isSel) {
        k.push(s('circle', { cx: pt.x, cy: pt.y, r: 19 * F, fill: col, 'fill-opacity': 0.16, stroke: col, 'stroke-width': 2.2 }));
      } else {
        k.push(s('circle', { cx: pt.x, cy: pt.y, r: 14 * F, fill: col, 'fill-opacity': 0.14 }));
      }
      k.push(s('circle', { cx: pt.x, cy: pt.y, r: (isSel ? 9 : 7.5) * F, fill: col, style: { cursor: 'grab' } }));
    }

    // top score pill
    const pillTxt = sd > 1e-9 ? `SCORE ${signed(z)} STEPS` : 'ALL EQUAL (SD = 0)';
    const pW = Math.max(150, pillTxt.length * 9.5) * F;
    const pX = Math.max(X0, Math.min(X1 - pW, xs - pW / 2));
    k.push(s('rect', { x: pX, y: 6, width: pW, height: 26 * F, rx: 13 * F, fill: C.bg, stroke: scoreCol, 'stroke-width': 2 }));
    k.push(s('text', { x: pX + pW / 2, y: 23 * F, fill: scoreCol, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, pillTxt));

    svg.replaceChildren(...k);

    // live formula box
    fbox(box, [
      `parcel = ${val} days  (${n} parcels total)`,
      `mean   = ${fmt(r2(m))} days,  SD = ${fmt(r2(sd))} days`,
      `gap    = ${val} − ${fmt(r2(m))} = ${signed(gap)} days`,
      sd > 1e-9
        ? [`score  = ${signed(gap)} ÷ ${fmt(r2(sd))} = ${signed(z)} steps`, scoreCol]
        : ['score  = — (all values identical)', C.muted]
    ]);

    note.textContent = sd < 1e-9
      ? 'Every parcel took the exact same time, so the standard deviation is 0.'
      : Math.abs(z) < 0.05
        ? 'Right on the mean: 0 standard-deviation steps away.'
        : Math.abs(z) <= 1
          ? 'Close to the mean — within 1 step (very typical).'
          : Math.abs(z) <= 2
            ? 'Within 2 steps of the mean — a bit away, not truly unusual.'
            : 'Past 2 standard-deviation steps from the mean — this parcel really stands out!';

    selLabel.textContent = `Selected: parcel ${sel + 1} (${val} days)`;
    chal.update({ v, n, m, sd, val, gap, z, randomCount });
  }

  draw();
  return () => {};
}
