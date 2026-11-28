// 1.1.9 Try it: from "how busy?" to orders per hour.
// Two days on the same time scale. Tap a time line to add an order, tap a dot to remove it,
// change how many hours each day lasted, spread the orders evenly, and solve small challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = { a: { hours: 1, m: [5, 11, 20, 26, 40, 52] }, b: { hours: 3, m: [5, 20, 35, 50, 70, 90, 115, 140, 165] } };
  const clone = o => JSON.parse(JSON.stringify(o));
  let d = clone(START), spread = 0, anim = 0, randomSpreads = 0, random = false;
  const NAME = { a: 'Today', b: 'Yesterday' }, COL = { a: C.cyan, b: C.pink };

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const hoursRow = day => h('div', { class: 'sim-row', style: { alignItems: 'center' } },
    h('span', { class: 'sim-note', style: { margin: 0, color: COL[day], minWidth: '86px' } }, NAME[day] + ':'),
    btn('− 1 hour', () => setHours(day, -1)), btn('+ 1 hour', () => setHours(day, 1)));
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: how busy were we?'),
    h('p', { class: 'sub' }, 'Each dot is one order. Tap a time line to add an order, or tap a dot to remove it.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg, hoursRow('a'), hoursRow('b'),
        h('div', { class: 'sim-row' },
          btn('Spread evenly', () => go(1), 'go'),
          btn('Back to the real times', () => go(0)),
          btn('New days (random)', () => { d = { a: randDay(), b: randDay() }; random = true; changed(); }),
          btn('Start again', () => { d = clone(START); random = false; changed(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  function randDay() {
    const hours = rnd(1, 4), n = rnd(hours, hours * 6), m = [];
    for (let i = 0; i < n; i++) m.push(rnd(0, hours * 60 - 1));
    return { hours, m: m.sort((x, y) => x - y) };
  }
  const n = day => d[day].m.length;
  const rate = day => n(day) / d[day].hours;
  const perHour = day => { const c = Array(d[day].hours).fill(0); d[day].m.forEach(t => c[Math.floor(t / 60)]++); return c; };
  const r2 = x => Math.round(x * 100) / 100;

  const chal = challenges(ch, [
    { text: 'Add orders to yesterday until it is exactly as busy per hour as today.',
      check: st => st.ra === st.rb, why: 'Yes! Same orders per hour means the same pace, even with different totals and lengths of time.' },
    { text: 'Make today LESS busy per hour than yesterday, while today still has fewer orders in total.',
      check: st => st.na < st.nb && st.ra < st.rb, why: 'Right: to compare, you divide by the hours. Fewer orders in total can mean a slower or a faster pace.' },
    { text: 'Give yesterday a rush: keep 9 orders over 3 hours, but put 6 of them in one hour and none in another.',
      check: st => st.nb === 9 && st.hb === 3 && Math.max(...st.cb) >= 6 && Math.min(...st.cb) === 0,
      why: 'The rate is still 9 ÷ 3 = 3 per hour. A rate is the pace as if the orders were spread evenly, so it can hide a rush.' },
    { text: 'Press “New days”, guess which day is busier per hour, then press “Spread evenly”. Do it twice.',
      check: st => st.randomSpreads >= 2, why: 'Every time, the busier day is the one with more orders for each hour, not the one with more orders in total.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.3 : 1;
  const X0 = NARROW ? 18 : 30, X1 = VW - 18, U = (X1 - X0) / 4;   // one hour, same scale for both days
  const Y = { a: 170, b: 380 }, R = NARROW ? 6.5 : 7, GX = NARROW ? 17 : 20, GY = 17;
  svg.setAttribute('viewBox', `0 0 ${VW} 440`);
  const xOf = t => X0 + U * t / 60;

  function setHours(day, k) {
    const hrs = Math.max(1, Math.min(4, d[day].hours + k));
    d[day].hours = hrs; d[day].m = d[day].m.filter(t => t < hrs * 60); changed();
  }
  function changed() { cancelAnimationFrame(anim); spread = 0; draw(); }
  function go(target) {
    if (target === 1 && random && spread < 0.5) { randomSpreads++; draw(); }
    cancelAnimationFrame(anim);
    const from = spread, t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 900);
      spread = from + (target - from) * k * k * (3 - 2 * k);
      draw();
      if (k < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  // tap: near a dot removes it, elsewhere on a line adds an order at that time
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    if (spread > 0.01) { go(0); return; }
    const p = toSvg(e);
    const day = Math.abs(p.y - Y.a) < Math.abs(p.y - Y.b) ? 'a' : 'b';
    if (Math.abs(p.y - Y[day]) > 70) return;
    const near = d[day].m.findIndex(t => Math.abs(xOf(t) - p.x) < 11 && Math.abs(Y[day] - 14 - p.y) < 26);
    if (near >= 0) { d[day].m.splice(near, 1); changed(); return; }
    const t = Math.round((p.x - X0) / U * 60);
    if (t < 0 || t >= d[day].hours * 60 || n(day) >= 24) return;
    d[day].m.push(t); d[day].m.sort((x, y) => x - y); changed();
  });

  function draw() {
    const k = [];
    for (const day of ['a', 'b']) {
      const y = Y[day], hrs = d[day].hours, col = COL[day], cnt = perHour(day), per = rate(day);
      k.push(s('text', { x: X0, y: y - 120, fill: col, 'font-size': 15 * F, 'font-weight': 700, 'font-family': 'Consolas' },
        `${NAME[day].toUpperCase()} · ${n(day)} orders in ${hrs} hour${hrs > 1 ? 's' : ''}`));
      for (let hh = 0; hh < hrs; hh++) {
        k.push(s('rect', { x: xOf(hh * 60) + 3, y: y - 104, width: U - 6, height: 100, rx: 8, fill: col, 'fill-opacity': .04 + .06 * spread, stroke: col, 'stroke-opacity': .25 + .4 * spread }));
        k.push(s('text', { x: xOf(hh * 60 + 30), y: y + 40 * F, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `real: ${cnt[hh]}`));
        if (spread > 0.6) k.push(s('text', { x: xOf(hh * 60 + 30), y: y - 84, fill: C.amber, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas', opacity: (spread - 0.6) / 0.4 }, fmt(r2(per)) + ' each'));
      }
      k.push(s('line', { x1: X0, x2: xOf(hrs * 60), y1: y, y2: y, stroke: C.muted, 'stroke-width': 3 }));
      for (let hh = 0; hh <= hrs; hh++) {
        k.push(s('line', { x1: xOf(hh * 60), x2: xOf(hh * 60), y1: y - 6, y2: y + 6, stroke: C.muted, 'stroke-width': 3 }),
          s('text', { x: xOf(hh * 60), y: y + 22 * F, fill: C.muted, 'font-size': 13 * F, 'text-anchor': hh === 0 ? 'start' : (hh === hrs ? 'end' : 'middle'), 'font-family': 'Consolas' }, `${8 + hh}:00`));
      }
      // dots: real time, or dealt evenly into the hours (one to each hour, again and again)
      d[day].m.forEach((t, i) => {
        const hh = i % hrs, slotI = Math.floor(i / hrs), r = Math.floor(slotI / 3), c = slotI % 3;
        const ex = xOf(hh * 60 + 30) + (c - 1) * GX, ey = y - 14 - r * GY;
        const x = xOf(t) + (ex - xOf(t)) * spread, yy = (y - 14) + (ey - (y - 14)) * spread;
        k.push(s('circle', { cx: x, cy: yy, r: R * 1.9, fill: col, 'fill-opacity': .15 }), s('circle', { cx: x, cy: yy, r: R, fill: col }));
      });
    }
    svg.replaceChildren(...k);
    const ra = rate('a'), rb = rate('b');
    const line = day => `${NAME[day].padEnd(9)} ${n(day)} ÷ ${d[day].hours} = ${fmt(r2(rate(day)))} per hour`;
    const verdict = Math.abs(ra - rb) < 1e-9 ? 'same pace per hour' : (ra > rb ? 'today is busier per hour' : 'yesterday is busier per hour');
    fbox(box, ['orders per hour = orders ÷ hours', [line('a'), C.cyan], [line('b'), C.pink], ['→ ' + verdict, C.amber]]);
    note.textContent = spread > 0.99 ? 'Spread evenly: each hour gets the same share. That share is the rate, orders per hour.'
      : 'Grey numbers under each hour are the real counts. “Spread evenly” deals the orders out, one to each hour, again and again.';
    chal.update({ na: n('a'), nb: n('b'), ra: r2(ra), rb: r2(rb), hb: d.b.hours, cb: perHour('b'), randomSpreads });
  }
  draw();
  return () => cancelAnimationFrame(anim);
}
