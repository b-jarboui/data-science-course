// 10.2.1 Try it: partial slopes.
// Four apartment cards show the model's rent estimates. The learner sets the two floor areas and the model's
// knobs with sliders, taps two cards to compare them, makes random models, and solves challenges the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = { base: 970, slope: 100, gap: 60, left: 40, right: 50 };
  let m = { ...START }, sel = [], random = false;
  const CARDS = [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }];
  const HOOD = ['Cedar', 'Station'];

  const money = v => (v < 0 ? '−$' : '$') + Math.abs(v).toLocaleString('en-US');
  const signed = v => (v < 0 ? '−$' : '+$') + Math.abs(v).toLocaleString('en-US');
  const areaOf = c => c.col ? m.right : m.left;
  const est = c => m.base + m.slope * (areaOf(c) - 40) / 10 + (c.row ? m.gap : 0);
  const desc = c => `${HOOD[c.row]} ${areaOf(c)} m²`;
  const stepWord = n => `${fmt(n)} step${Math.abs(n) === 1 ? '' : 's'}`;

  // sliders: label text updates live
  const sliders = [];
  function slider(key, min, max, label) {
    const out = h('span', { class: 'sim-note', style: { margin: 0, flex: '1 1 14rem' } });
    const input = h('input', { type: 'range', min, max, step: 10, style: { flex: '1 1 10rem' },
      oninput: () => { m[key] = +input.value; draw(); } });
    sliders.push(() => { input.value = m[key]; out.textContent = label(m[key]); input.setAttribute('aria-label', label(m[key])); });
    return h('div', { class: 'sim-row', style: { alignItems: 'center' } }, out, input);
  }

  const svg = s('svg', { viewBox: '0 0 700 420' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: partial slopes'),
    h('p', { class: 'sub' }, 'Each card shows the model’s rent estimate. All four apartments are 10 years old and an 8-minute walk from transit. Tap two cards to compare them. Move the sliders to change the sizes or the model.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        slider('left', 30, 100, v => `Left column: ${v} m²`),
        slider('right', 30, 100, v => `Right column: ${v} m²`),
        slider('slope', 0, 200, v => `Area slope: ${signed(v)} per 10 m²`),
        slider('gap', -100, 200, v => `Station extra: ${signed(v)}`),
        h('div', { class: 'sim-row' },
          btn('New data (random model)', () => { m.base = rnd(80, 120) * 10; m.slope = rnd(3, 20) * 10; m.gap = rnd(-6, 16) * 10; random = true; draw(); }, 'go'),
          btn('Clear selection', () => { sel = []; draw(); }),
          btn('Start again', () => { m = { ...START }; sel = []; random = false; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Tap two cards where only the floor area changes.',
      check: st => st.kind === 'area',
      why: 'Yes: same neighbourhood, same age, same walk, so the whole change comes from the extra space.' },
    { text: 'Now tap two cards where only the neighbourhood changes. What is moving to Station worth?',
      check: st => st.kind === 'hood',
      why: 'Right: same size, so the whole change is the Station extra.' },
    { text: 'Set the left column to 40 m² and the right to 70 m², then tap the two Cedar cards. Is the rise the slope times 3 steps?',
      check: st => st.left === 40 && st.right === 70 && st.key === '0-1',
      why: 'Yes: 30 extra square metres are 3 steps of 10, and each step adds the same slope.' },
    { text: 'Press “New data”, then tap small Cedar and big Station. Does the change still split into neighbourhood + area?',
      check: st => st.random && st.key === '0-3' && st.kind === 'both',
      why: 'Always: in this model the diagonal change is the Station extra plus slope × steps, whatever the numbers.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const F = NARROW ? 1.25 : 1, VW = NARROW ? 400 : 700, VH = NARROW ? 470 : 420;
  const CW = NARROW ? 150 : 220, CH = NARROW ? 160 : 140;
  const xL = NARROW ? 10 : 40, xR = VW - xL - CW, yT = 30, yB = yT + CH + (NARROW ? 90 : 80);
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const colX = c => c ? xR : xL, rowY = r => r ? yB : yT;
  const mono = 'Consolas, monospace', sans = 'Segoe UI, Arial, sans-serif';
  const tx = (x, y, str, fill, size, extra = {}) =>
    s('text', { x, y, fill, 'font-size': size * F, 'font-family': mono, 'text-anchor': 'middle', ...extra }, str);
  function arrow(x1, y1, x2, y2, color) {
    const a = Math.atan2(y2 - y1, x2 - x1), len = 12 * F;
    const p = da => `${x2 - len * Math.cos(a + da)},${y2 - len * Math.sin(a + da)}`;
    return [s('line', { x1, y1, x2: x2 - Math.cos(a) * len * 0.8, y2: y2 - Math.sin(a) * len * 0.8, stroke: color, 'stroke-width': 3 }),
      s('polygon', { points: `${x2},${y2} ${p(0.45)} ${p(-0.45)}`, fill: color })];
  }

  // tap a card: first tap = FROM, second = TO, a third tap starts a new pair
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    const i = CARDS.findIndex(c => p.x >= colX(c.col) && p.x <= colX(c.col) + CW && p.y >= rowY(c.row) && p.y <= rowY(c.row) + CH);
    if (i < 0) return;
    if (sel.length === 2) sel = [i];
    else if (sel.includes(i)) sel = sel.filter(j => j !== i);
    else sel.push(i);
    draw();
  });

  function pair() {
    if (sel.length < 2) return null;
    const [A, B] = sel.map(i => CARDS[i]);
    const steps = (areaOf(B) - areaOf(A)) / 10, area = steps !== 0, hood = A.row !== B.row;
    return { A, B, ea: est(A), eb: est(B), steps,
      kind: area && hood ? 'both' : area ? 'area' : hood ? 'hood' : 'same',
      areaPart: m.slope * steps, hoodPart: (B.row - A.row) * m.gap, key: sel.slice().sort().join('-') };
  }

  function draw() {
    sliders.forEach(f => f());
    const k = [], pr = pair(), steps = (m.right - m.left) / 10;
    const center = i => [colX(CARDS[i].col) + CW / 2, rowY(CARDS[i].row) + CH / 2];
    // the compared pair: a dashed pink line drawn under the cards, so it shows only between them
    if (pr) { const [a, b] = sel.map(center); k.push(s('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: C.pink, 'stroke-width': 4, 'stroke-dasharray': '10 7' })); }
    // row arrows: the rise from the left card to the right card in each neighbourhood
    [0, 1].forEach(r => {
      const y = rowY(r), col = r ? C.amber : C.cyan, rise = m.slope * steps, sg = Math.sign(rise);
      const x1 = xL + CW + 10, x2 = xR - 10, mid = (x1 + x2) / 2;
      k.push(...arrow(x1, y + CH * (0.51 + 0.11 * sg), x2, y + CH * (0.51 - 0.11 * sg), col),
        tx(mid, y + CH * 0.22, signed(rise), col, 16, { 'font-weight': 700 }),
        tx(mid, y + CH * 0.86, stepWord(steps), C.muted, 13));
    });
    CARDS.forEach((c, i) => {
      const x = colX(c.col), y = rowY(c.row), col = c.row ? C.amber : C.cyan, on = sel.indexOf(i);
      k.push(s('rect', { x, y, width: CW, height: CH, rx: 12, fill: C.card, stroke: on >= 0 ? C.pink : col, 'stroke-width': on >= 0 ? 4 : 2, style: 'cursor:pointer' }));
      const my = y + CH * 0.2 - 5 * F;
      k.push(c.row ? s('rect', { x: x + 12, y: my - 7 * F, width: 14 * F, height: 14 * F, fill: col })
        : s('circle', { cx: x + 12 + 7 * F, cy: my, r: 7 * F, fill: col }));
      k.push(tx(x + 20 + 14 * F, y + CH * 0.2, HOOD[c.row], col, 16, { 'text-anchor': 'start', 'font-weight': 700, 'font-family': sans }),
        tx(x + 14, y + CH * 0.42, `${areaOf(c)} m²`, C.ink, 17, { 'text-anchor': 'start', 'font-weight': 700 }),
        tx(x + 14, y + CH * 0.6, '10 yrs · 8 min', C.muted, 13, { 'text-anchor': 'start' }),
        tx(x + 14, y + CH * 0.87, money(est(c)), col, 26, { 'text-anchor': 'start', 'font-weight': 700 }));
      if (on >= 0) {
        const bx = x + CW - 66 * F;
        k.push(s('rect', { x: bx, y: y - 11 * F, width: 56 * F, height: 22 * F, rx: 11 * F, fill: C.bg, stroke: C.pink }),
          tx(bx + 28 * F, y + 5 * F, on ? 'TO' : 'FROM', C.pink, 12, { 'font-weight': 700 }));
      }
    });
    svg.replaceChildren(...k);

    const lines = ['the model:', `  Cedar, 40 m² → ${money(m.base)}`, `  each +10 m² → ${signed(m.slope)}`, `  Station     → ${signed(m.gap)}`];
    let msg = 'Tap a card, then another card, to compare their estimates. The dashed pink line joins the two.';
    if (pr) {
      lines.push(' ', `${desc(pr.A)} → ${desc(pr.B)}`, [`change = ${money(pr.eb)} − ${money(pr.ea)} = ${signed(pr.eb - pr.ea)}`, C.amber]);
      if (pr.kind === 'area') {
        lines.push([`only area: ${signed(m.slope)} × ${fmt(pr.steps)} = ${signed(pr.areaPart)}`, C.green]);
        msg = 'Only the floor area changed, so the change is the area’s partial slope times the number of steps.';
      } else if (pr.kind === 'hood') {
        lines.push([`only neighbourhood: ${signed(pr.hoodPart)}`, C.green]);
        msg = 'Only the neighbourhood changed, so the whole change is the Station extra.';
      } else if (pr.kind === 'both') {
        lines.push([`two changes: ${signed(pr.hoodPart)} (place) ${signed(pr.areaPart)} (area)`, C.pink]);
        msg = 'Two details changed at once, so this change mixes both. Compare cards that differ in one detail to split it.';
      } else {
        lines.push(['same details → same estimate', C.green]);
        msg = 'These two cards have the same details, so the model gives the same estimate.';
      }
    }
    fbox(box, lines);
    note.textContent = msg;
    chal.update({ kind: pr ? pr.kind : null, key: pr ? pr.key : null, left: m.left, right: m.right, random });
  }
  draw();
  return () => {};
}
