// 1.3.2 Try it: finding a percentile / quantile cutoff on sorted parcels.
// The learner drags parcel bars (or taps one and uses -1 / +1), slides the target share,
// tests whole-number spots and a 21-day late parcel, generates random weeks, and solves challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [3, 4, 4, 5, 6, 6, 7];
  let v = START.slice(), pct = 80, sel = 5, randomCount = 0;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const pctLabel = h('span', { class: 'sim-note', style: { margin: 0, color: C.amber, fontWeight: 700 } });
  const slider = h('input', {
    type: 'range', min: 10, max: 100, step: 5, value: pct,
    style: { flex: '1 1 160px', accentColor: C.amber, cursor: 'pointer', minHeight: '36px' },
    oninput: e => { pct = +e.target.value; draw(); }
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: finding a cutoff'),
    h('p', { class: 'sub' }, 'Parcels stay sorted shortest to longest. Drag a bar up or down (or tap and use −1 / +1), and slide the target share.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          pctLabel, slider,
          btn('50% (half)', () => setPct(50)),
          btn('80%', () => setPct(80), 'go')),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1 day', () => bump(-1)), btn('+1 day', () => bump(1)), selLabel),
        h('div', { class: 'sim-row' },
          btn('New week (random)', () => {
            v = Array.from({ length: v.length }, () => rnd(2, 12)).sort((a, b) => a - b);
            randomCount++;
            draw();
          }, 'go'),
          btn('Add a parcel', () => {
            if (v.length < 10) {
              v.push(rnd(2, 12));
              v.sort((a, b) => a - b);
              draw();
            }
          }),
          btn('Remove a parcel', () => {
            if (v.length > 4) {
              v.pop();
              sel = Math.min(sel, v.length - 1);
              draw();
            }
          }),
          btn('Try 10 parcels', () => {
            v = [2, 3, 4, 4, 5, 6, 6, 7, 8, 10];
            sel = 7;
            draw();
          }),
          btn('Make last parcel 21 days', () => {
            v[v.length - 1] = 21;
            v.sort((a, b) => a - b);
            sel = v.length - 1;
            draw();
          }),
          btn('Start again', () => {
            v = START.slice();
            pct = 80;
            slider.value = 80;
            sel = 5;
            draw();
          }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const r1 = x => Math.round(x * 10) / 10;
  const r2 = x => Math.round(x * 100) / 100;

  const chal = challenges(ch, [
    {
      text: 'Slide the target share to 50% (half) to find the halfway cutoff.',
      check: st => st.pct === 50,
      why: 'Yes! Half of the sorted line points straight to the middle spot—on the normal week that is 5 days.'
    },
    {
      text: 'Use 10 parcels at 80% so the spot lands on a whole number with no rounding.',
      check: st => st.n === 10 && st.pct === 80,
      why: 'Right! 0.8 × 10 = 8 exactly, so you stop right at parcel #8 without needing to round up.'
    },
    {
      text: 'At 80%, press “Make last parcel 21 days”. Notice whether the 80th percentile moves.',
      check: st => st.pct === 80 && st.v[st.n - 1] === 21,
      why: 'It stays put! One extreme late parcel does not pull the cutoff parcel at the 80% spot.'
    },
    {
      text: 'Press “New week (random)” at least twice and check that at least your target share arrives by the cutoff.',
      check: st => st.randomCount >= 2,
      why: 'Every time! Rounding up the spot guarantees that at least your chosen share meets the cutoff.'
    }
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = 440, F = NARROW ? 1.18 : 1;
  const X0 = NARROW ? 36 : 52, X1 = VW - 16, TOP = 54, BASE = 266;
  const BY = 332, BH = 34;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const maxv = () => Math.max(10, ...v);
  const unit = () => (BASE - TOP) / maxv();
  const slot = () => (X1 - X0) / v.length;

  function setPct(p) { pct = p; slider.value = p; draw(); }

  function setValAt(idx, nextVal) {
    v[idx] = Math.max(1, Math.min(25, nextVal));
    // keep v sorted and follow the edited parcel
    while (idx > 0 && v[idx] < v[idx - 1]) {
      [v[idx], v[idx - 1]] = [v[idx - 1], v[idx]];
      idx--;
    }
    while (idx < v.length - 1 && v[idx] > v[idx + 1]) {
      [v[idx], v[idx + 1]] = [v[idx + 1], v[idx]];
      idx++;
    }
    return idx;
  }

  function bump(d) {
    sel = setValAt(sel, v[sel] + d);
    draw();
  }

  // drag a bar vertically to adjust its delivery time
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y > BASE + 32) return;
    const i = Math.floor((p.x - X0) / slot());
    if (i < 0 || i >= v.length) return;
    sel = i; dragging = i;
    svg.setPointerCapture(e.pointerId);
    move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    const nextVal = Math.max(1, Math.min(25, Math.round((BASE - p.y) / unit())));
    dragging = setValAt(dragging, nextVal);
    sel = dragging;
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });

  function draw() {
    const n = v.length, mx = maxv(), u = unit(), sl = slot();
    const bw = Math.min(62, sl * 0.72);
    const share = pct / 100;
    const rawSpot = r2(share * n);
    const isWhole = Math.abs(rawSpot - Math.round(rawSpot)) < 1e-9;
    const spot = Math.max(1, Math.min(n, Math.ceil(rawSpot - 1e-9)));
    const cutoff = v[spot - 1];
    const atOrBelow = v.filter(x => x <= cutoff).length;
    const exactCount = v.filter(x => x === cutoff).length;
    const achievedPct = r1((atOrBelow / n) * 100);

    const k = [];
    const gStep = mx > 12 ? 5 : 2;
    for (let g = 0; g <= mx; g += gStep) {
      const y = BASE - g * u;
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g)
      );
    }

    // sorted parcel bars
    v.forEach((val, i) => {
      const cx = X0 + sl * (i + 0.5);
      const hgt = val * u, yTop = BASE - hgt;
      const isCut = i === spot - 1;
      const isLate = val >= 15;
      const col = isLate ? C.pink : (val <= cutoff ? C.green : C.cyan);
      if (i === sel) {
        k.push(s('rect', { x: cx - sl / 2 + 2, y: TOP - 10, width: sl - 4, height: BASE - TOP + 34, fill: '#ffffff', 'fill-opacity': .05, rx: 8 }));
      }
      k.push(s('rect', {
        x: cx - bw / 2, y: yTop, width: bw, height: Math.max(4, hgt),
        fill: col, 'fill-opacity': isCut ? .92 : .72,
        stroke: isCut ? C.amber : col, 'stroke-width': isCut ? 3 : 1, rx: 6
      }));
      k.push(s('text', {
        x: cx, y: yTop - 7, fill: isCut ? C.amber : col,
        'font-size': (n > 8 ? 13 : 15) * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, val));
      k.push(s('text', {
        x: cx, y: BASE + 20, fill: isCut ? C.amber : C.muted,
        'font-size': (n > 8 ? 11 : 13) * F, 'font-weight': isCut ? 700 : 400, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, '#' + (i + 1)));
    });

    // 0% to 100% share bar split into n equal slices
    const sw = (X1 - X0) / n;
    k.push(s('rect', { x: X0, y: BY, width: X1 - X0, height: BH, fill: C.card, stroke: C.muted, 'stroke-width': 1.5, rx: 6 }));
    for (let i = 0; i < n; i++) {
      const filled = i < atOrBelow;
      k.push(s('rect', {
        x: X0 + i * sw + 1.5, y: BY + 2, width: Math.max(2, sw - 3), height: BH - 4,
        fill: filled ? C.green : C.card, 'fill-opacity': filled ? .68 : 0,
        stroke: C.line, 'stroke-width': 1, rx: 3
      }));
    }
    [0, 50, 100].forEach(p => {
      const px = X0 + (p / 100) * (X1 - X0);
      k.push(s('text', {
        x: px, y: BY + BH + 17, fill: C.muted,
        'font-size': 12 * F, 'text-anchor': p === 0 ? 'start' : (p === 100 ? 'end' : 'middle'), 'font-family': 'Consolas'
      }, p + '%'));
    });

    // vertical amber target line connecting the share bar to the sorted parcels
    const tx = X0 + share * (X1 - X0);
    k.push(s('line', {
      x1: tx, x2: tx, y1: TOP - 10, y2: BY + BH + 6,
      stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '7 5'
    }));

    // target spot pill above share bar (clamped horizontally)
    const tText = `${pct}% → ${fmt(rawSpot)}${isWhole ? '' : ' → #' + spot}`;
    const tw = Math.max(106 * F, tText.length * 8.6 * F);
    const tcx = Math.max(X0 + tw / 2, Math.min(X1 - tw / 2, tx));
    k.push(
      s('rect', { x: tcx - tw / 2, y: BY - 27, width: tw, height: 22, rx: 11, fill: C.bg, stroke: C.amber, 'stroke-width': 1.5 }),
      s('text', { x: tcx, y: BY - 12, fill: C.amber, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, tText)
    );

    // cutoff summary pill at top right, clear of all bars
    const cText = `CUTOFF (#${spot}): ${cutoff} DAYS`;
    const cw = Math.max(155 * F, cText.length * 8.8 * F);
    k.push(
      s('rect', { x: X1 - cw, y: 6, width: cw, height: 26, rx: 13, fill: C.bg, stroke: C.amber, 'stroke-width': 1.5 }),
      s('text', { x: X1 - cw / 2, y: 23, fill: C.amber, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, cText)
    );

    // bottom coverage summary
    k.push(s('text', {
      x: (X0 + X1) / 2, y: BY + BH + 42, fill: C.green,
      'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
    }, `${atOrBelow} of ${n} parcels (${fmt(achievedPct)}%) took ${cutoff} days or less`));

    svg.replaceChildren(...k);

    pctLabel.textContent = `Target: ${pct}% (${fmt(share)})`;
    selLabel.textContent = `Selected: spot #${sel + 1} (${v[sel]} days)`;

    const spotLine = isWhole
      ? `spot  = ${fmt(share)} × ${n} = ${spot} (whole)`
      : `spot  = ${fmt(share)} × ${n} = ${fmt(rawSpot)} → round up to #${spot}`;
    fbox(box, [
      `sorted = ${v.join(', ')}`,
      `share  = ${pct}% = ${fmt(share)}   count = ${n}`,
      [spotLine, C.amber],
      [`${pct}th percentile = ${cutoff} days`, C.amber],
      [`≤ ${cutoff} days: ${atOrBelow} of ${n} (${fmt(achievedPct)}%)`, C.green]
    ]);
    note.textContent = `Spot #${spot} holds ${cutoff} days. Only ${exactCount} parcel${exactCount === 1 ? '' : 's'} took exactly ${cutoff} days, while ${atOrBelow} of ${n} arrived in ${cutoff} days or less.`;

    chal.update({ pct, n, v: v.slice(), spot, cutoff, atOrBelow, randomCount });
  }

  draw();
  return () => {};
}
