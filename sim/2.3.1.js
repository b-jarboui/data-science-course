// 2.3.1 Try it: Counts and rates.
// The learner drags bars or taps −1/+1 for complaints and −1,000/+1,000 for riders,
// flips smoothly between raw counts and rates per 1,000 riders, tests random cities,
// and solves self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const COLS = ['#38bdf8', '#fb923c', C.violet];
  const NAMES = ['Route A', 'Route B', 'Route C'];
  const START = [
    { complaints: 30, ridersK: 20 },
    { complaints: 15, ridersK: 5 },
    { complaints: 6, ridersK: 1 },
  ];

  let routes = START.map(r => ({ ...r }));
  let sel = 0;
  let targetMode = 0; // 0 = counts, 1 = rates per 1,000
  let blend = 0;
  let anim = 0;
  let freshRandom = false;
  let randomRates = 0;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  const rateOf = r => r.complaints / r.ridersK;
  const r2 = x => Math.round(x * 100) / 100;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: counts and rates'),
    h('p', { class: 'sub' }, 'Drag any bar up or down, or tap a route and change its complaints or riders. Switch between counts and rates per 1,000 riders to see the picture flip.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Complaints −1', () => bumpC(-1)),
          btn('Complaints +1', () => bumpC(1)),
          btn('Riders −1,000', () => bumpR(-1)),
          btn('Riders +1,000', () => bumpR(1)),
          selLabel),
        h('div', { class: 'sim-row' },
          btn('Show rates (per 1,000)', () => go(1), 'go'),
          btn('Show counts', () => go(0)),
          btn('New city (random)', newCity),
          btn('Start again', reset))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Press “Show rates (per 1,000)” to compare all three routes for the same number of riders.',
      check: st => st.mode === 1,
      why: 'The picture flips! By count Route A looks worst (30), but per 1,000 riders Route C is worst (6) and Route A is best (1.5).'
    },
    {
      text: 'Keep Route C at 6 complaints, and increase Route C’s riders until its rate drops to 2 per 1,000.',
      check: st => st.routes[2].complaints === 6 && Math.abs(st.rates[2] - 2) < 1e-9,
      why: 'Yes! With 3,000 riders, those 6 complaints are shared across 3 groups of 1,000, so the rate drops from 6 to 2.'
    },
    {
      text: 'Make Route A and Route B have the exact same rate, while keeping their rider counts different.',
      check: st => Math.abs(st.rates[0] - st.rates[1]) < 1e-9 && st.routes[0].ridersK !== st.routes[1].ridersK,
      why: 'Right! A big route and a small route can be equally good for riders even when their raw counts are very different.'
    },
    {
      text: 'Press “New city (random)” and then “Show rates (per 1,000)”, twice. Does the biggest count always have the worst rate?',
      check: st => st.randomRates >= 2,
      why: 'No! Counts grow with route size. Dividing by the denominator (riders) is what shows which route goes wrong more often for a rider.'
    }
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.18 : 1;
  const X0 = NARROW ? 44 : 58, X1 = VW - 16, TOP = 42, BASE = 278;
  svg.setAttribute('viewBox', `0 0 ${VW} 440`);
  const slot = () => (X1 - X0) / 3;

  const maxCount = () => Math.max(30, Math.ceil(Math.max(...routes.map(r => r.complaints)) / 10) * 10);
  const maxRate = () => {
    const m = Math.max(6, ...routes.map(rateOf));
    return m <= 8 ? 8 : m <= 12 ? 12 : Math.ceil(m / 5) * 5;
  };
  const niceStep = mx => mx <= 8 ? 2 : mx <= 15 ? 3 : mx <= 30 ? 10 : 15;

  function go(target) {
    if (target === 1 && freshRandom && targetMode === 0) {
      randomRates++;
      freshRandom = false;
    }
    targetMode = target;
    cancelAnimationFrame(anim);
    const from = blend, t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 700);
      blend = from + (target - from) * k * k * (3 - 2 * k);
      draw();
      if (k < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  function newCity() {
    cancelAnimationFrame(anim);
    targetMode = 0;
    blend = 0;
    freshRandom = true;
    const sizes = [rnd(12, 24), rnd(4, 10), rnd(1, 3)];
    // shuffle sizes so any route can be big or small
    for (let i = sizes.length - 1; i > 0; i--) {
      const j = rnd(0, i);
      [sizes[i], sizes[j]] = [sizes[j], sizes[i]];
    }
    routes = sizes.map(ridersK => ({
      ridersK,
      complaints: clamp(Math.round(ridersK * (rnd(10, 65) / 10)), 2, 50)
    }));
    draw();
  }

  function reset() {
    cancelAnimationFrame(anim);
    routes = START.map(r => ({ ...r }));
    sel = 0;
    targetMode = 0;
    blend = 0;
    freshRandom = false;
    draw();
  }

  function bumpC(d) {
    routes[sel].complaints = clamp(routes[sel].complaints + d, 1, 60);
    draw();
  }
  function bumpR(d) {
    routes[sel].ridersK = clamp(routes[sel].ridersK + d, 1, 25);
    draw();
  }

  // drag a bar or tap a route column
  let dragging = -1, dragMax = 30;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    const i = Math.floor((p.x - X0) / slot());
    if (i < 0 || i >= 3) return;
    sel = i;
    if (p.y <= BASE + 10) {
      dragging = i;
      dragMax = targetMode === 0 ? maxCount() : maxRate();
      svg.setPointerCapture(e.pointerId);
      move(e);
    } else {
      draw();
    }
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    const frac = clamp((BASE - p.y) / (BASE - TOP), 0.02, 1);
    const val = frac * dragMax;
    if (targetMode === 0) {
      routes[dragging].complaints = clamp(Math.round(val), 1, 60);
    } else {
      routes[dragging].complaints = clamp(Math.round(val * routes[dragging].ridersK), 1, 60);
    }
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  function draw() {
    const sl = slot(), bw = Math.min(NARROW ? 66 : 96, sl * 0.56);
    const mc = dragging >= 0 && targetMode === 0 ? dragMax : maxCount();
    const mr = dragging >= 0 && targetMode === 1 ? dragMax : maxRate();
    const showRate = blend >= 0.5;
    const axisMax = showRate ? mr : mc;
    const step = niceStep(axisMax);
    const fade = Math.min(1, Math.abs(blend - 0.5) * 2.2);
    const rates = routes.map(rateOf);

    const k = [];
    // mode header inside SVG
    k.push(s('text', {
      x: X0, y: 20, fill: showRate ? C.green : C.cyan, 'fill-opacity': fade,
      'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas'
    }, showRate ? 'COMPLAINTS PER 1,000 RIDERS (RATE)' : 'TOTAL COMPLAINTS (COUNT)'));

    // grid lines
    for (let g = 0; g <= axisMax + 1e-9; g += step) {
      const y = BASE - (g / axisMax) * (BASE - TOP);
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: g === 0 ? C.muted : C.line, 'stroke-width': g === 0 ? 2 : 1 }),
        s('text', {
          x: X0 - 8, y: y + 4, fill: C.muted, 'fill-opacity': fade,
          'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas'
        }, fmt(g))
      );
    }

    // worst index for current view
    const shownVals = showRate ? rates : routes.map(r => r.complaints);
    const topVal = Math.max(...shownVals);

    routes.forEach((r, i) => {
      const cx = X0 + sl * (i + 0.5), col = COLS[i];
      if (i === sel) {
        k.push(s('rect', {
          x: cx - sl / 2 + 4, y: TOP - 12, width: sl - 8, height: 440 - TOP + 4,
          fill: '#ffffff', 'fill-opacity': 0.045, rx: 10
        }));
      }
      const hCount = (r.complaints / mc) * (BASE - TOP);
      const hRate = (rates[i] / mr) * (BASE - TOP);
      const hgt = Math.max(4, hCount + (hRate - hCount) * blend);
      const yTop = BASE - hgt;

      // glowing bar
      k.push(
        s('rect', { x: cx - bw / 2 - 5, y: yTop - 3, width: bw + 10, height: hgt + 3, fill: col, 'fill-opacity': 0.16, rx: 6 }),
        s('rect', { x: cx - bw / 2, y: yTop, width: bw, height: hgt, fill: col, 'fill-opacity': 0.85, stroke: col, 'stroke-width': 2, rx: 4 })
      );

      // bar value label
      const valText = showRate ? fmt(r2(rates[i])) : String(r.complaints);
      k.push(s('text', {
        x: cx, y: Math.max(TOP - 2, yTop - 9), fill: col, 'fill-opacity': fade,
        'font-size': 16 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, valText));

      // WORST badge on tallest bar(s)
      if (shownVals[i] >= topVal - 1e-9 && fade > 0.6) {
        const py = Math.max(TOP - 16, yTop - 36 * F);
        const pw = 62 * F, ph = 20 * F;
        k.push(
          s('rect', { x: cx - pw / 2, y: py, width: pw, height: ph, rx: ph / 2, fill: C.bg, stroke: C.pink, 'stroke-width': 1.5, 'fill-opacity': 0.92 }),
          s('text', { x: cx, y: py + ph * 0.72, fill: C.pink, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'WORST')
        );
      }

      // route name below baseline
      k.push(s('text', {
        x: cx, y: BASE + 24, fill: col,
        'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Segoe UI, Arial, sans-serif'
      }, NAMES[i]));

      // 1,000-rider group blocks below route name
      const cols = 5;
      const chipW = Math.min(NARROW ? 16 : 24, (sl - 26) / cols - 4);
      const chipH = 11, gapX = 4, gapY = 4;
      const gridW = cols * chipW + (cols - 1) * gapX;
      const gx0 = cx - gridW / 2, gy0 = BASE + 36;
      for (let b = 0; b < r.ridersK; b++) {
        const bc = b % cols, br = Math.floor(b / cols);
        k.push(s('rect', {
          x: gx0 + bc * (chipW + gapX), y: gy0 + br * (chipH + gapY),
          width: chipW, height: chipH, rx: 2.5,
          fill: col, 'fill-opacity': 0.35, stroke: col, 'stroke-width': 1
        }));
      }
      const rowsUsed = Math.ceil(r.ridersK / cols);
      k.push(s('text', {
        x: cx, y: Math.min(432, gy0 + rowsUsed * (chipH + gapY) + 14),
        fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, `${(r.ridersK * 1000).toLocaleString()} riders`));
    });

    svg.replaceChildren(...k);

    const cur = routes[sel], curRate = rates[sel];
    fbox(box, [
      [`${NAMES[sel]}: ${cur.complaints} complaints, ${(cur.ridersK * 1000).toLocaleString()} riders`, COLS[sel]],
      `groups = ${(cur.ridersK * 1000).toLocaleString()} ÷ 1,000 = ${cur.ridersK}`,
      [`rate   = ${cur.complaints} ÷ ${cur.ridersK} = ${fmt(r2(curRate))} per 1,000`, C.amber],
      [`All rates → A: ${fmt(r2(rates[0]))}  B: ${fmt(r2(rates[1]))}  C: ${fmt(r2(rates[2]))}`, C.green]
    ]);
    note.textContent = targetMode === 1
      ? 'Rates divide each count by its groups of 1,000 riders (the denominator), so different route sizes compare fairly.'
      : 'Counts show total complaints. Each small block below a bar is one group of 1,000 riders.';
    selLabel.textContent = `Selected: ${NAMES[sel]} (${cur.complaints} complaints, ${(cur.ridersK * 1000).toLocaleString()} riders)`;

    chal.update({ mode: targetMode, routes, rates, randomRates });
  }

  draw();
  return () => cancelAnimationFrame(anim);
}
