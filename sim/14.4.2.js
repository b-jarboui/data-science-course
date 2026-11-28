// 14.4.2 Try it: Lift — stronger than chance?
// Tap books inside the 8 bookshop baskets to add or remove them, test the 100%-confidence trap,
// generate random independent baskets, and solve self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, fmt, challenges } = kit;

  const BOOKS = ['Trail', 'River', 'Clues', 'Castle'];
  const BCOL = { Trail: C.green, River: C.cyan, Clues: C.amber, Castle: C.violet };
  const START = [
    ['Trail', 'River'],
    ['Trail', 'River', 'Clues'],
    ['Trail', 'River'],
    ['Trail', 'Clues'],
    ['River', 'Castle'],
    ['Clues', 'Castle'],
    ['Clues'],
    ['Castle'],
  ];

  const cloneStart = () => START.map(list => {
    const o = {};
    BOOKS.forEach(b => { o[b] = list.includes(b); });
    return o;
  });

  let baskets = cloneStart();
  let randomCount = 0;

  const svg = s('svg', { viewBox: '0 0 700 470' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: lift in the bookshop'),
    h('p', { class: 'sub' }, 'Tap any book inside a basket to add or remove it. Watch how expected count, observed count, confidence, and lift for Trail → River update live.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('Put River in all baskets', () => {
            baskets.forEach(b => { b.River = true; });
            draw();
          }, 'go'),
          btn('New data (random)', () => {
            randomBaskets();
            randomCount++;
            draw();
          }),
          btn('Start again', () => {
            baskets = cloneStart();
            draw();
          }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  function randomBaskets() {
    // Independent random placements so learners see lift move around 1 by chance
    for (let tries = 0; tries < 20; tries++) {
      const next = Array.from({ length: 8 }, () => ({
        Trail: Math.random() < 0.5,
        River: Math.random() < 0.5,
        Clues: Math.random() < 0.45,
        Castle: Math.random() < 0.4,
      }));
      if (next.some(b => b.Trail) && next.some(b => b.River)) {
        baskets = next;
        return;
      }
    }
    baskets = cloneStart();
  }

  const chal = challenges(ch, [
    {
      text: 'Press "Put River in all baskets". Watch what happens to confidence and lift.',
      check: st => st.nRiver === st.n && st.nTrail > 0,
      why: 'Confidence jumps to 100%, but lift drops to 1! When River is in every basket, buying Trail makes no difference.'
    },
    {
      text: 'Tap books to make lift equal to 1 while River is in half of all baskets (4 of 8).',
      check: st => st.lift !== null && Math.abs(st.lift - 1) < 1e-9 && st.nRiver === 4 && st.nTrail > 0,
      why: 'Exact independence: half of all baskets have River, and half of Trail baskets have River, so observed equals expected.'
    },
    {
      text: 'Make lift drop below 1 (fewer shared purchases than expected).',
      check: st => st.lift !== null && st.lift < 1 - 1e-9 && st.nTrail > 0 && st.nRiver > 0,
      why: 'Lift below 1 means River appears less often in baskets with Trail than in baskets overall.'
    },
    {
      text: 'Press "New data (random)" at least 3 times. Notice how far lift can jump from 1 with only 8 baskets.',
      check: st => st.randomCount >= 3,
      why: 'With only 8 baskets, even independent random purchases often give a lift far from 1. Small data can mislead!'
    }
  ]);

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700;
  const VH = NARROW ? 610 : 470;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  function onTap(e) {
    const el = e.target.closest('[data-book]');
    if (!el) return;
    const idx = Number(el.getAttribute('data-basket'));
    const book = el.getAttribute('data-book');
    if (Number.isNaN(idx) || !baskets[idx]) return;
    baskets[idx][book] = !baskets[idx][book];
    draw();
  }
  svg.addEventListener('pointerdown', onTap);

  const r2 = x => Math.round(x * 100) / 100;

  function draw() {
    const n = baskets.length;
    const nTrail = baskets.filter(b => b.Trail).length;
    const nRiver = baskets.filter(b => b.River).length;
    const obs = baskets.filter(b => b.Trail && b.River).length;
    const riverShare = nRiver / n;
    const conf = nTrail > 0 ? obs / nTrail : null;
    const exp = nTrail * riverShare;
    const lift = exp > 0 ? obs / exp : null;

    const k = [];

    // 1) Shopping baskets grid
    const cols = NARROW ? 2 : 4;
    const padX = NARROW ? 10 : 16;
    const gapX = 12;
    const gapY = NARROW ? 12 : 14;
    const bw = (VW - 2 * padX - (cols - 1) * gapX) / cols;
    const bh = NARROW ? 96 : 128;
    const topY = 14;

    baskets.forEach((b, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = padX + col * (bw + gapX);
      const y = topY + row * (bh + gapY);
      const both = b.Trail && b.River;
      const border = both ? C.cyan : (b.Trail ? C.green : C.line);
      const sw = both ? 2.5 : (b.Trail ? 2 : 1.2);

      // Subtle basket handle
      k.push(s('path', {
        d: `M ${x + bw / 2 - 14} ${y} A 14 9 0 0 1 ${x + bw / 2 + 14} ${y}`,
        fill: 'none', stroke: both ? C.cyan : C.muted, 'stroke-width': 1.8
      }));
      // Basket body
      k.push(s('rect', {
        x, y, width: bw, height: bh, rx: 10,
        fill: C.bg, stroke: border, 'stroke-width': sw
      }));
      // Basket header & status tag
      k.push(s('text', {
        x: x + 10, y: y + 19, fill: C.muted,
        'font-size': NARROW ? 12 : 13, 'font-weight': 700, 'font-family': 'Consolas'
      }, `#${i + 1}`));
      if (both) {
        k.push(s('text', {
          x: x + bw - 10, y: y + 19, fill: C.cyan, 'text-anchor': 'end',
          'font-size': NARROW ? 11 : 12, 'font-weight': 700, 'font-family': 'Consolas'
        }, 'BOTH'));
      } else if (b.Trail) {
        k.push(s('text', {
          x: x + bw - 10, y: y + 19, fill: C.green, 'text-anchor': 'end',
          'font-size': NARROW ? 11 : 12, 'font-weight': 700, 'font-family': 'Consolas'
        }, 'TRAIL'));
      } else if (b.River) {
        k.push(s('text', {
          x: x + bw - 10, y: y + 19, fill: C.muted, 'text-anchor': 'end',
          'font-size': NARROW ? 11 : 12, 'font-weight': 700, 'font-family': 'Consolas'
        }, 'RIVER'));
      }

      // 2x2 tappable book chips inside each basket
      const chipGap = 6;
      const cw = (bw - 20 - chipGap) / 2;
      const chg = NARROW ? 30 : 40;
      const startY = y + (NARROW ? 27 : 31);
      BOOKS.forEach((book, bi) => {
        const bx = x + 10 + (bi % 2) * (cw + chipGap);
        const by = startY + Math.floor(bi / 2) * (chg + chipGap);
        const on = b[book];
        const bcol = BCOL[book];
        const g = s('g', { 'data-basket': i, 'data-book': book, style: 'cursor:pointer' },
          s('rect', {
            x: bx, y: by, width: cw, height: chg, rx: 7,
            fill: on ? bcol : C.card, 'fill-opacity': on ? 0.22 : 0.7,
            stroke: on ? bcol : C.line, 'stroke-width': on ? 1.8 : 1,
            'stroke-dasharray': on ? null : '4 3'
          }),
          s('text', {
            x: bx + cw / 2, y: by + chg / 2 + 4.5,
            fill: on ? bcol : '#56638a', 'text-anchor': 'middle',
            'font-size': NARROW ? 12 : 13, 'font-weight': on ? 700 : 500,
            'font-family': '"Segoe UI", Arial, sans-serif',
            style: 'pointer-events:none;user-select:none'
          }, book)
        );
        k.push(g);
      });
    });

    // 2) Bottom panel: Expected vs Observed bars + Lift Scale
    const panelY = topY + (NARROW ? 4 : 2) * (bh + gapY) + 10;

    // Expected vs Observed comparison
    const barX = padX + 4;
    const barMaxW = NARROW ? (VW - 2 * padX - 125) : 165;
    const barScale = Math.max(4, obs, exp);
    const expW = (exp / barScale) * barMaxW;
    const obsW = (obs / barScale) * barMaxW;

    k.push(s('text', {
      x: barX, y: panelY + 14, fill: C.muted,
      'font-size': 12, 'font-weight': 700, 'font-family': 'Consolas'
    }, 'TRAIL + RIVER COUNT'));

    // Expected bar
    k.push(
      s('text', { x: barX, y: panelY + 42, fill: C.violet, 'font-size': 13, 'font-weight': 700, 'font-family': 'Consolas' }, 'Expected'),
      s('rect', { x: barX + 76, y: panelY + 28, width: barMaxW, height: 18, rx: 5, fill: C.bg, stroke: C.line }),
      s('rect', { x: barX + 76, y: panelY + 28, width: Math.max(0, expW), height: 18, rx: 5, fill: C.violet, 'fill-opacity': 0.8 }),
      s('text', { x: barX + 82 + barMaxW, y: panelY + 42, fill: C.violet, 'font-size': 14, 'font-weight': 700, 'font-family': 'Consolas' }, fmt(r2(exp)))
    );

    // Observed bar
    k.push(
      s('text', { x: barX, y: panelY + 72, fill: C.cyan, 'font-size': 13, 'font-weight': 700, 'font-family': 'Consolas' }, 'Observed'),
      s('rect', { x: barX + 76, y: panelY + 58, width: barMaxW, height: 18, rx: 5, fill: C.bg, stroke: C.line }),
      s('rect', { x: barX + 76, y: panelY + 58, width: Math.max(0, obsW), height: 18, rx: 5, fill: C.cyan, 'fill-opacity': 0.85 }),
      s('text', { x: barX + 82 + barMaxW, y: panelY + 72, fill: C.cyan, 'font-size': 14, 'font-weight': 700, 'font-family': 'Consolas' }, String(obs))
    );

    // Lift Scale
    const sx0 = NARROW ? padX + 14 : 322;
    const sx1 = VW - padX - 14;
    const sy = NARROW ? panelY + 122 : panelY + 62;
    const maxLift = Math.max(2.5, lift ? Math.ceil(lift * 2) / 2 : 2.5);
    const l2x = v => sx0 + (Math.min(maxLift, Math.max(0, v)) / maxLift) * (sx1 - sx0);
    const x1 = l2x(1);

    k.push(
      s('text', { x: sx0, y: sy - 38, fill: C.muted, 'font-size': 12, 'font-weight': 700, 'font-family': 'Consolas' }, 'LIFT SCALE'),
      // Below 1 and above 1 tinted bars
      s('line', { x1: sx0, x2: x1, y1: sy, y2: sy, stroke: C.pink, 'stroke-width': 5, 'stroke-opacity': 0.45 }),
      s('line', { x1: x1, x2: sx1, y1: sy, y2: sy, stroke: C.green, 'stroke-width': 5, 'stroke-opacity': 0.45 }),
      // Dashed independence marker at 1
      s('line', { x1: x1, x2: x1, y1: sy - 22, y2: sy + 18, stroke: C.violet, 'stroke-width': 2, 'stroke-dasharray': '5 4' })
    );

    const step = maxLift <= 3 ? 0.5 : 1;
    for (let v = 0; v <= maxLift + 1e-6; v += step) {
      const tx = l2x(v);
      const isOne = Math.abs(v - 1) < 1e-6;
      k.push(
        s('line', { x1: tx, x2: tx, y1: sy - 6, y2: sy + 6, stroke: isOne ? C.violet : C.muted, 'stroke-width': isOne ? 2 : 1.5 }),
        s('text', {
          x: tx, y: sy + 24, fill: isOne ? C.violet : C.muted, 'text-anchor': 'middle',
          'font-size': 12, 'font-weight': isOne ? 700 : 400, 'font-family': 'Consolas'
        }, fmt(r2(v)))
      );
    }

    if (lift !== null) {
      const lx = l2x(lift);
      const lcol = Math.abs(lift - 1) < 1e-9 ? C.violet : (lift > 1 ? C.amber : C.pink);
      const pillW = 94;
      const px = Math.max(sx0, Math.min(sx1 - pillW, lx - pillW / 2));
      k.push(
        s('circle', { cx: lx, cy: sy, r: 13, fill: lcol, 'fill-opacity': 0.22 }),
        s('circle', { cx: lx, cy: sy, r: 6.5, fill: lcol }),
        s('rect', { x: px, y: sy - 42, width: pillW, height: 24, rx: 12, fill: C.bg, stroke: lcol, 'stroke-width': 1.8 }),
        s('text', {
          x: px + pillW / 2, y: sy - 26, fill: lcol, 'text-anchor': 'middle',
          'font-size': 13, 'font-weight': 700, 'font-family': 'Consolas'
        }, `LIFT ${fmt(r2(lift))}`)
      );
    } else {
      k.push(s('text', {
        x: (sx0 + sx1) / 2, y: sy - 20, fill: C.muted, 'text-anchor': 'middle',
        'font-size': 13, 'font-family': 'Consolas'
      }, 'Add Trail & River to compute lift'));
    }

    svg.replaceChildren(...k);

    // 3) Formula box & live explanation
    const liftCol = lift === null ? C.muted : (Math.abs(lift - 1) < 1e-9 ? C.violet : (lift > 1 ? C.amber : C.pink));
    const confStr = conf === null ? '—' : `${obs} of ${nTrail} (${fmt(r2(conf * 100))}%)`;
    const riverPct = fmt(r2(riverShare * 100));
    const lines = [
      [`Trail baskets  = ${nTrail} of ${n}`, C.green],
      [`River overall  = ${nRiver} of ${n} (${riverPct}%)`, C.cyan],
      [`Confidence     = ${confStr}`, C.muted],
      [`Expected count = ${riverPct}% of ${nTrail} = ${fmt(r2(exp))}`, C.violet],
      [`Observed count = ${obs}`, C.cyan],
      [lift === null ? 'Lift           = —' : `Lift = ${obs} ÷ ${fmt(r2(exp))} = ${fmt(r2(lift))}`, liftCol]
    ];
    fbox(box, lines);

    if (lift === null) {
      note.textContent = 'At least one basket needs Trail and at least one needs River before we can compare observed with expected.';
    } else if (Math.abs(lift - 1) < 1e-9) {
      note.textContent = 'Lift is 1: we observe the exact number expected under independence. Buying Trail makes no difference to buying River.';
    } else if (lift > 1) {
      note.textContent = `Lift is above 1: River is ${fmt(r2(lift))} times as common in Trail baskets as in all baskets.`;
    } else {
      note.textContent = `Lift is below 1: River appears less often in Trail baskets (${obs}) than expected under independence (${fmt(r2(exp))}).`;
    }

    chal.update({ n, nTrail, nRiver, obs, exp, lift, randomCount });
  }

  draw();
  return () => svg.removeEventListener('pointerdown', onTap);
}
