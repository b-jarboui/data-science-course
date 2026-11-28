// 16.1.8 Try it: proxy variables — when one feature reveals another.
// Tap any home's address block or age mark, cover the age column to test how well
// the block predicts the hidden age group, add homes or make random towns, and solve challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [
    { id: 'A', block: 'Cedar', older: true },
    { id: 'B', block: 'Cedar', older: true },
    { id: 'C', block: 'Park', older: false },
    { id: 'D', block: 'Park', older: false },
  ];
  const LETTERS = 'ABCDEFGHIJKL';

  let homes = START.map(x => ({ ...x }));
  let covered = false;
  let checked = false;
  let revealedOnce = false;
  let bigRandoms = 0;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const coverBtn = btn('Cover age & guess', toggleCover, 'go');

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: check for a proxy variable'),
    h('p', { class: 'sub' }, 'Tap any home’s block (Cedar / Park) or age mark (purple 65+ / yellow under 65) to change it. Then cover the age column to see how well the address block predicts the hidden age group.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          coverBtn,
          btn('New data (random)', newRandom),
          btn('Add a home', addHome),
          btn('Remove a home', removeHome),
          btn('Start again', resetAll))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Press “Cover age & guess”, then press “Reveal & check”. Do all 4 guesses match?',
      check: st => st.revealedOnce,
      why: 'Yes! Because Cedar is 100% aged 65+ and Park is 0% aged 65+, the address block reveals every hidden age mark.'
    },
    {
      text: 'Tap the age marks so Cedar and Park have the exact same 65+ share (a 0-point gap).',
      check: st => st.cN > 0 && st.pN > 0 && st.gap === 0,
      why: 'Nice! When both blocks have the same 65+ share, the address block stops giving away the age group.'
    },
    {
      text: 'Change the homes so Cedar is 50% aged 65+ and Park is 0% aged 65+.',
      check: st => st.cShare === 50 && st.pShare === 0,
      why: 'Good! A proxy does not have to be 100% vs 0% — even a 50-point gap still lets a model guess age indirectly.'
    },
    {
      text: 'Use “Add a home” until you have at least 10 homes, then press “New data (random)” twice.',
      check: st => st.n >= 10 && st.bigRandoms >= 2,
      why: 'With more homes, random blocks rarely stay at 100% vs 0%. Larger samples show whether the link is real.'
    }
  ]);

  function stats() {
    const cedar = homes.filter(x => x.block === 'Cedar');
    const park = homes.filter(x => x.block === 'Park');
    const cN = cedar.length, pN = park.length;
    const c65 = cedar.filter(x => x.older).length;
    const p65 = park.filter(x => x.older).length;
    const cShare = cN ? Math.round((c65 / cN) * 1000) / 10 : null;
    const pShare = pN ? Math.round((p65 / pN) * 1000) / 10 : null;
    const gap = (cShare != null && pShare != null) ? Math.round(Math.abs(cShare - pShare) * 10) / 10 : null;

    // Best guess for each block when age is hidden (ties default Cedar -> 65+, Park -> <65)
    const guessCedarOlder = c65 * 2 >= cN;
    const guessParkOlder = p65 * 2 > pN;
    const guesses = homes.map(x => x.block === 'Cedar' ? guessCedarOlder : guessParkOlder);
    const correct = homes.filter((x, i) => guesses[i] === x.older).length;
    const acc = Math.round((correct / homes.length) * 1000) / 10;

    return { cN, pN, c65, p65, cShare, pShare, gap, guesses, correct, acc, n: homes.length };
  }

  function toggleCover() {
    if (!covered) {
      covered = true;
      checked = false;
    } else {
      covered = false;
      checked = true;
      revealedOnce = true;
    }
    draw();
  }

  function newRandom() {
    const n = homes.length;
    homes = Array.from({ length: n }, (_, i) => ({
      id: LETTERS[i],
      block: i === 0 ? 'Cedar' : (i === 1 ? 'Park' : (rnd(0, 1) ? 'Cedar' : 'Park')),
      older: rnd(0, 1) === 1
    }));
    if (n >= 10) bigRandoms++;
    covered = false;
    checked = false;
    draw();
  }

  function addHome() {
    if (homes.length >= 12) return;
    const i = homes.length;
    homes.push({
      id: LETTERS[i],
      block: i % 2 === 0 ? 'Cedar' : 'Park',
      older: rnd(0, 1) === 1
    });
    covered = false;
    checked = false;
    draw();
  }

  function removeHome() {
    if (homes.length <= 4) return;
    homes.pop();
    covered = false;
    checked = false;
    draw();
  }

  function resetAll() {
    homes = START.map(x => ({ ...x }));
    covered = false;
    checked = false;
    draw();
  }

  function flipBlock(i) {
    homes[i].block = homes[i].block === 'Cedar' ? 'Park' : 'Cedar';
    checked = false;
    draw();
  }

  function flipAge(i) {
    if (covered) return;
    homes[i].older = !homes[i].older;
    checked = false;
    draw();
  }

  function draw() {
    const NARROW = (root.clientWidth || innerWidth) < 560;
    const VW = NARROW ? 420 : 700, VH = NARROW ? 565 : 440;
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    const st = stats();
    coverBtn.textContent = covered ? 'Reveal & check' : 'Cover age & guess';

    const kids = [];

    // 1. Homes table / grid
    const twoCols = NARROW || homes.length > 6;
    const rows = twoCols ? Math.ceil(homes.length / 2) : homes.length;
    const startX = 12, startY = 38;
    const gridW = NARROW ? VW - 24 : 424;
    const colGap = 10;
    const cardW = twoCols ? (gridW - colGap) / 2 : gridW;
    const rowH = NARROW ? Math.min(44, Math.floor(268 / Math.max(rows, 2))) : Math.min(54, Math.floor(355 / Math.max(rows, 4)));

    kids.push(s('text', {
      x: startX, y: 24, fill: C.muted, 'font-size': NARROW ? 14 : 15, 'font-weight': 700,
      'font-family': 'Consolas'
    }, `HOMES (${homes.length}) — TAP BLOCK OR AGE TO EDIT`));

    homes.forEach((home, i) => {
      const col = twoCols ? (i % 2) : 0;
      const row = twoCols ? Math.floor(i / 2) : i;
      const x = startX + col * (cardW + colGap);
      const y = startY + row * (rowH + 6);
      const bCol = home.block === 'Cedar' ? C.cyan : C.green;
      const aCol = home.older ? C.violet : C.amber;
      const gCol = st.guesses[i] ? C.violet : C.amber;

      kids.push(s('rect', {
        x, y, width: cardW, height: rowH, rx: 9,
        fill: '#131c38', stroke: C.line, 'stroke-width': 1.2
      }));

      // Home letter
      kids.push(s('text', {
        x: x + (twoCols ? 16 : 24), y: y + rowH / 2 + 5, fill: C.ink,
        'font-size': twoCols ? 15 : 17, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, twoCols ? home.id : `Home ${home.id}`));

      // Block chip (tappable)
      const bx = x + (twoCols ? 34 : 78);
      const bw = twoCols ? 62 : 94;
      const bh = rowH - 12;
      const by = y + 6;
      const blkG = s('g', { style: 'cursor:pointer' },
        s('rect', { x: bx, y: by, width: bw, height: bh, rx: 7, fill: bCol, 'fill-opacity': 0.16, stroke: bCol, 'stroke-width': 1.5 }),
        s('text', {
          x: bx + bw / 2, y: y + rowH / 2 + 5, fill: bCol,
          'font-size': twoCols ? 13 : 15, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, home.block)
      );
      blkG.addEventListener('pointerdown', e => { e.preventDefault(); flipBlock(i); });
      kids.push(blkG);

      // Age chip (tappable when uncovered)
      const ax = bx + bw + (twoCols ? 7 : 12);
      const aw = twoCols ? (cardW - (ax - x) - 8) : 138;
      if (covered) {
        kids.push(
          s('rect', { x: ax, y: by, width: aw, height: bh, rx: 7, fill: '#1c2647', stroke: C.muted, 'stroke-width': 1.5 }),
          s('circle', { cx: ax + aw - 16, cy: y + rowH / 2, r: 6.5, fill: gCol }),
          s('text', {
            x: ax + (aw - 24) / 2 + 3, y: y + rowH / 2 + 5, fill: C.muted,
            'font-size': twoCols ? 11.5 : 13, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
          }, twoCols ? 'GUESS' : 'HIDDEN →')
        );
      } else {
        const ageG = s('g', { style: 'cursor:pointer' },
          s('rect', { x: ax, y: by, width: aw, height: bh, rx: 7, fill: aCol, 'fill-opacity': 0.14, stroke: aCol, 'stroke-width': 1.5 }),
          s('circle', { cx: ax + 14, cy: y + rowH / 2, r: 6, fill: aCol }),
          s('text', {
            x: ax + 26 + (aw - 30) / 2, y: y + rowH / 2 + 5, fill: aCol,
            'font-size': twoCols ? 12.5 : 14.5, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
          }, home.older ? '65+' : '<65')
        );
        ageG.addEventListener('pointerdown', e => { e.preventDefault(); flipAge(i); });
        kids.push(ageG);

        if (checked) {
          const ok = st.guesses[i] === home.older;
          const cx = twoCols ? (x + cardW - 14) : (ax + aw + 32);
          kids.push(s('text', {
            x: cx, y: y + rowH / 2 + 6, fill: ok ? C.green : C.pink,
            'font-size': twoCols ? 16 : 20, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Segoe UI'
          }, ok ? '✓' : '×'));
          if (!twoCols) {
            kids.push(s('circle', { cx: ax + aw + 14, cy: y + rowH / 2, r: 5, fill: gCol }));
          }
        }
      }
    });

    // 2. Share aged 65+ Bar Chart
    const chX0 = NARROW ? 62 : 494;
    const chX1 = NARROW ? VW - 24 : 684;
    const chTop = NARROW ? 360 : 66;
    const chBase = NARROW ? 500 : 326;
    const chH = chBase - chTop;
    const chMid = (chX0 + chX1) / 2;

    kids.push(s('text', {
      x: chMid, y: chTop - 22, fill: C.ink, 'font-size': 15, 'font-weight': 700,
      'text-anchor': 'middle', 'font-family': 'Consolas'
    }, 'SHARE AGED 65+'));

    for (const pct of [0, 50, 100]) {
      const gy = chBase - (pct / 100) * chH;
      kids.push(
        s('line', {
          x1: chX0, x2: chX1, y1: gy, y2: gy,
          stroke: pct === 0 ? C.muted : C.line,
          'stroke-width': pct === 0 ? 2 : 1.2,
          'stroke-dasharray': pct === 0 ? null : '5 5'
        }),
        s('text', {
          x: chX0 - 8, y: gy + 4, fill: C.muted, 'font-size': 12.5,
          'text-anchor': 'end', 'font-family': 'Consolas'
        }, `${pct}%`)
      );
    }

    const barW = NARROW ? 68 : 54;
    const bars = [
      { name: 'Cedar', x: chX0 + (chX1 - chX0) * 0.28, share: st.cShare, col: C.violet, lblCol: C.cyan, sub: `${st.c65}/${st.cN}` },
      { name: 'Park',  x: chX0 + (chX1 - chX0) * 0.72, share: st.pShare, col: C.amber,  lblCol: C.green, sub: `${st.p65}/${st.pN}` }
    ];

    bars.forEach(b => {
      const val = b.share == null ? 0 : b.share;
      const bh = Math.max(b.share == null ? 0 : 4, (val / 100) * chH);
      if (b.share != null) {
        kids.push(s('rect', {
          x: b.x - barW / 2, y: chBase - bh, width: barW, height: bh, rx: 4,
          fill: b.col, 'fill-opacity': 0.85
        }));
      }
      kids.push(
        s('text', {
          x: b.x, y: b.share == null ? chBase - 12 : Math.min(chBase - 12, chBase - bh - 8),
          fill: b.col, 'font-size': 15, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, b.share == null ? '—' : `${fmt(b.share)}%`),
        s('text', {
          x: b.x, y: chBase + 20, fill: b.lblCol, 'font-size': 14.5, 'font-weight': 700,
          'text-anchor': 'middle', 'font-family': 'Consolas'
        }, b.name),
        s('text', {
          x: b.x, y: chBase + 38, fill: C.muted, 'font-size': 12.5,
          'text-anchor': 'middle', 'font-family': 'Consolas'
        }, b.sub)
      );
    });

    // Gap badge
    const gapText = st.gap == null ? 'GAP: —' : `BLOCK GAP: ${fmt(st.gap)} PTS`;
    const gapCol = st.gap == null ? C.muted : (st.gap === 0 ? C.green : (st.gap >= 60 ? C.pink : C.amber));
    const badgeY = NARROW ? 550 : 398;
    kids.push(
      s('rect', { x: chMid - 92, y: badgeY - 19, width: 184, height: 28, rx: 14, fill: C.bg, stroke: gapCol, 'stroke-width': 1.5 }),
      s('text', { x: chMid, y: badgeY, fill: gapCol, 'font-size': 13.5, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, gapText)
    );

    svg.replaceChildren(...kids);

    // 3. Formula box & plain note
    const cLine = st.cN ? `Cedar 65+ = ${st.c65} ÷ ${st.cN} × 100 = ${fmt(st.cShare)}%` : 'Cedar 65+ = no homes in Cedar';
    const pLine = st.pN ? `Park  65+ = ${st.p65} ÷ ${st.pN} × 100 = ${fmt(st.pShare)}%` : 'Park  65+ = no homes in Park';
    const gLine = st.gap == null ? 'Block gap = need homes in both blocks' : `Block gap = |${fmt(st.cShare)} − ${fmt(st.pShare)}| = ${fmt(st.gap)} pts`;
    const aLine = `Guess from block: ${st.correct} / ${st.n} (${fmt(st.acc)}%)`;
    fbox(box, [
      [cLine, C.violet],
      [pLine, C.amber],
      [gLine, gapCol],
      [aLine, C.cyan]
    ]);

    if (covered) {
      note.textContent = 'Age is hidden! Each dot shows what the address block predicts. Press “Reveal & check” to lift the cards.';
    } else if (st.gap === 0) {
      note.textContent = 'No proxy here: both blocks have the exact same 65+ share, so the address block reveals nothing new about age.';
    } else if (st.gap != null && st.gap >= 60) {
      note.textContent = 'Strong proxy: knowing the address block strongly reveals the hidden age group, even if age is removed from the model.';
    } else if (st.gap != null) {
      note.textContent = 'Partial proxy: the two blocks differ somewhat in age share, so the address still gives a partial clue.';
    } else {
      note.textContent = 'Put at least one home in Cedar and one in Park to compare the two blocks.';
    }

    chal.update({ ...st, revealedOnce, bigRandoms });
  }

  draw();
  return () => {};
}
