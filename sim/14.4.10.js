// 14.4.10 Try it: cold start — recommending a book nobody has rated.
// The learner toggles Island's topics, inspects each reader's Jaccard similarity,
// records new ratings as they arrive, tries random bookshops, and checks 4 challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const TOPICS = ['Adventure', 'Nature', 'Mystery', 'Crime', 'History'];
  const BOOKS = [
    { name: 'Trail',  color: C.green,   topics: ['Adventure', 'Nature'] },
    { name: 'River',  color: '#2dd4bf', topics: ['Adventure', 'Nature'] },
    { name: 'Clues',  color: C.amber,   topics: ['Mystery', 'Crime'] },
    { name: 'Castle', color: C.violet,  topics: ['Mystery', 'History'] },
  ];
  const READERS = [
    { name: 'Ana',  color: C.cyan },
    { name: 'Ben',  color: '#60a5fa' },
    { name: 'Cara', color: '#fb923c' },
    { name: 'Dan',  color: C.violet },
  ];
  const ISLAND_COL = '#fde047';

  // Fixed Chapter 14.4 ratings: [Trail, River, Clues, Castle]
  const START_RATINGS = [
    [4, null, 2, null],
    [4, 5, 2, 1],
    [2, 1, 4, 5],
    [2, 2, 4, 4],
  ];
  const START_TOPICS = ['Adventure'];

  let ratings = START_RATINGS.map(r => r.slice());
  let islandTopics = START_TOPICS.slice();
  let islandRatings = [null, null, null, null];
  let sel = 0;
  let randomCount = 0;

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700;
  const VH = NARROW ? 548 : 476;
  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}` });

  const topicRow = h('div', { class: 'sim-row' });
  const rateRow = h('div', { class: 'sim-row' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: cold start bookshop'),
    h('p', { class: 'sub' },
      'Island has no ratings yet. Tap topics for Island to see how Jaccard similarity picks the first readers, then add ratings as readers try the book.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        topicRow,
        rateRow,
        h('div', { class: 'sim-row' },
          btn('New bookshop (random)', () => {
            randomize();
            randomCount++;
            draw();
          }, 'go'),
          btn('Clear Island ratings', () => {
            islandRatings = [null, null, null, null];
            draw();
          }),
          btn('Start again', () => {
            ratings = START_RATINGS.map(r => r.slice());
            islandTopics = START_TOPICS.slice();
            islandRatings = [null, null, null, null];
            sel = 0;
            draw();
          })
        )
      ),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)
      )
    )
  ));

  const r3 = x => Math.round(x * 1000) / 1000;

  function jaccard(a, b) {
    const setA = new Set(a), setB = new Set(b);
    const shared = [...setA].filter(t => setB.has(t));
    const distinct = new Set([...setA, ...setB]);
    const score = distinct.size === 0 ? 0 : shared.length / distinct.size;
    return { shared, distinct: [...distinct], score: r3(score) };
  }

  function readerInfo(idx) {
    const row = ratings[idx];
    const maxStar = Math.max(...row.filter(v => v != null));
    const favs = [];
    row.forEach((v, b) => {
      if (v === maxStar) {
        const j = jaccard(BOOKS[b].topics, islandTopics);
        favs.push({ book: BOOKS[b], stars: v, ...j });
      }
    });
    // Pick highest-matching favourite book (if tied, keep first in chapter order)
    let best = favs[0];
    for (const f of favs) if (f.score > best.score) best = f;
    return { maxStar, favs, best, score: best.score };
  }

  function randomize() {
    // Generate fresh reader ratings (each reader rates 2 to 4 older books, 1..5 stars)
    ratings = READERS.map(() => {
      const row = BOOKS.map(() => rnd(1, 5));
      const dropCount = rnd(0, 2);
      for (let d = 0; d < dropCount; d++) {
        const k = rnd(0, BOOKS.length - 1);
        row[k] = null;
      }
      // Guarantee at least 2 rated books
      if (row.filter(v => v != null).length < 2) {
        row[0] = rnd(1, 5);
        row[2] = rnd(1, 5);
      }
      return row;
    });
    // Generate 1 or 2 random topics for Island
    const pool = TOPICS.slice();
    const count = rnd(1, 2);
    islandTopics = [];
    for (let i = 0; i < count; i++) {
      const pick = rnd(0, pool.length - 1);
      islandTopics.push(pool.splice(pick, 1)[0]);
    }
    islandRatings = [null, null, null, null];
  }

  function toggleTopic(t) {
    if (islandTopics.includes(t)) islandTopics = islandTopics.filter(x => x !== t);
    else islandTopics = [...islandTopics, t];
    draw();
  }

  const chal = challenges(ch, [
    {
      text: 'Change Island’s topics so Ana and Ben both get a similarity score of 1.',
      check: st => st.scores.Ana === 1 && st.scores.Ben === 1,
      why: 'Yes! When Island has Adventure and Nature, it matches 2 out of 2 topics with Trail and River (2 ÷ 2 = 1).',
    },
    {
      text: 'Change Island’s topics so Cara has a higher similarity score than Ana and Ben.',
      check: st => st.scores.Cara > st.scores.Ana && st.scores.Cara > st.scores.Ben && st.scores.Cara > 0,
      why: 'Right! Adding Mystery or History matches Cara’s favourite book Castle, so the recommendation shifts to Cara.',
    },
    {
      text: 'Give Island a 5-star rating from Ana so Island gets its first rating.',
      check: st => st.islandRatings.Ana === 5,
      why: 'Now Island has its first real rating. One rating is a start, and more ratings let the shop learn further.',
    },
    {
      text: 'Press “New bookshop (random)” twice to see content-based cold start on fresh data.',
      check: st => st.randomCount >= 2,
      why: 'Every time, comparing topics with each reader’s favourite book gives a first recommendation with zero past ratings.',
    },
  ]);

  // Tap a reader card in the SVG to select them
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    const startY = NARROW ? 142 : 126;
    const stepY = NARROW ? 98 : 84;
    const idx = Math.floor((p.y - startY) / stepY);
    if (idx >= 0 && idx < READERS.length && p.y >= startY) {
      sel = idx;
      draw();
    }
  });

  function drawTopicPill(els, x, y, text, color, active, fontSize) {
    const padX = 9;
    const w = Math.max(66, text.length * fontSize * 0.62 + padX * 2);
    const hgt = fontSize + 11;
    els.push(
      s('rect', {
        x, y, width: w, height: hgt, rx: hgt / 2,
        fill: active ? color : C.bg, 'fill-opacity': active ? 0.22 : 0.9,
        stroke: active ? color : C.line, 'stroke-width': active ? 1.8 : 1.2,
      }),
      s('text', {
        x: x + w / 2, y: y + hgt / 2 + fontSize * 0.35,
        fill: active ? color : C.muted, 'font-size': fontSize,
        'font-weight': active ? 700 : 500, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace',
      }, text)
    );
    return w;
  }

  function draw() {
    const infos = READERS.map((_, i) => readerInfo(i));
    const ratingCount = islandRatings.filter(v => v != null).length;
    const unratedScores = infos.map((inf, i) => islandRatings[i] == null ? inf.score : -1);
    const topScore = Math.max(0, ...unratedScores);

    const els = [];
    const pad = 14;
    const cardW = VW - pad * 2;

    // --- Top Card: Island (the new book) ---
    const topH = NARROW ? 116 : 98;
    const statusText = ratingCount === 0
      ? 'COLD START · 0 RATINGS'
      : ratingCount === 1
        ? 'WARMING UP · 1 RATING'
        : `${ratingCount} RATINGS · TOPICS + RATINGS`;
    const statusCol = ratingCount === 0 ? C.pink : (ratingCount === 1 ? C.amber : C.green);

    els.push(
      s('rect', {
        x: pad, y: 12, width: cardW, height: topH, rx: 14,
        fill: C.bg, stroke: ISLAND_COL, 'stroke-width': 2.2,
      }),
      s('rect', {
        x: pad + 12, y: 12, width: cardW - 24, height: 4, rx: 2, fill: ISLAND_COL,
      }),
      s('text', {
        x: pad + 16, y: 42, fill: ISLAND_COL, 'font-size': NARROW ? 18 : 20,
        'font-weight': 700, 'font-family': '"Segoe UI", Arial, sans-serif',
      }, 'New book: Island'),
      s('text', {
        x: pad + cardW - 14, y: 40, fill: statusCol, 'font-size': NARROW ? 11.5 : 13,
        'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas, monospace',
      }, statusText)
    );

    // Island's active topic pills inside top card
    if (islandTopics.length === 0) {
      els.push(s('text', {
        x: pad + 16, y: 78, fill: C.pink, 'font-size': NARROW ? 13 : 14,
        'font-family': 'Consolas, monospace',
      }, 'No topics selected — tap a topic button below'));
    } else {
      let tx = pad + 16;
      let ty = 58;
      const fs = NARROW ? 12.5 : 13.5;
      for (const t of islandTopics) {
        const estW = Math.max(66, t.length * fs * 0.62 + 18);
        if (tx + estW > pad + cardW - 12) { tx = pad + 16; ty += fs + 16; }
        const w = drawTopicPill(els, tx, ty, t, ISLAND_COL, true, fs);
        tx += w + 8;
      }
    }

    // --- 4 Reader Rows ---
    const startY = NARROW ? 142 : 126;
    const stepY = NARROW ? 98 : 84;
    const rowH = NARROW ? 88 : 74;

    READERS.forEach((rd, i) => {
      const y = startY + i * stepY;
      const inf = infos[i];
      const rRate = islandRatings[i];
      const isRec = rRate == null && topScore > 0 && inf.score === topScore;
      const isSel = i === sel;

      els.push(
        s('rect', {
          x: pad, y, width: cardW, height: rowH, rx: 12,
          fill: isSel ? '#182446' : C.bg,
          stroke: isSel ? rd.color : (isRec ? C.green : C.line),
          'stroke-width': isSel ? 2.4 : (isRec ? 1.8 : 1.2),
        }),
        s('circle', { cx: pad + 20, cy: y + (NARROW ? 24 : rowH / 2), r: 8, fill: rd.color }),
        s('text', {
          x: pad + 36, y: y + (NARROW ? 30 : rowH / 2 + 6),
          fill: rd.color, 'font-size': NARROW ? 16 : 17, 'font-weight': 700,
          'font-family': '"Segoe UI", Arial, sans-serif',
        }, rd.name)
      );

      const favText = inf.favs.length > 1
        ? `${inf.favs.map(f => f.book.name).join(' & ')} (${inf.maxStar}★)`
        : `${inf.best.book.name} (${inf.maxStar}★)`;

      if (NARROW) {
        // Phone layout: top line name + fav + badge; bottom line topics + score bar
        els.push(s('text', {
          x: pad + 92, y: y + 29, fill: inf.best.book.color,
          'font-size': 13, 'font-weight': 700, 'font-family': 'Consolas, monospace',
        }, favText));

        let tx = pad + 14;
        for (const t of inf.best.book.topics) {
          const matched = islandTopics.includes(t);
          const w = drawTopicPill(els, tx, y + 48, t, matched ? C.green : C.muted, matched, 11.5);
          tx += w + 6;
        }

        // Bar + numeric score on bottom right
        const barX = VW - pad - 134, barW = 72, barY = y + 54;
        els.push(
          s('rect', { x: barX, y: barY, width: barW, height: 12, rx: 6, fill: '#1a2548' }),
          s('rect', {
            x: barX, y: barY, width: Math.max(0, barW * inf.score), height: 12, rx: 6,
            fill: inf.score > 0 ? C.amber : C.muted,
          }),
          s('text', {
            x: VW - pad - 12, y: y + 64, fill: inf.score > 0 ? C.amber : C.muted,
            'font-size': 15, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas, monospace',
          }, fmt(inf.score))
        );

        // Right top badge: rating or RECOMMEND
        if (rRate != null) {
          els.push(s('text', {
            x: VW - pad - 12, y: y + 29, fill: ISLAND_COL, 'font-size': 14,
            'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas, monospace',
          }, `Island ${rRate}★`));
        } else if (isRec) {
          els.push(s('text', {
            x: VW - pad - 12, y: y + 29, fill: C.green, 'font-size': 12.5,
            'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas, monospace',
          }, '✓ RECOMMEND'));
        }
      } else {
        // Laptop layout: single rich horizontal row
        els.push(s('text', {
          x: pad + 104, y: y + 26, fill: inf.best.book.color,
          'font-size': 13.5, 'font-weight': 700, 'font-family': 'Consolas, monospace',
        }, `Fav: ${favText}`));

        let tx = pad + 104;
        for (const t of inf.best.book.topics) {
          const matched = islandTopics.includes(t);
          const w = drawTopicPill(els, tx, y + 36, t, matched ? C.green : C.muted, matched, 12.5);
          tx += w + 7;
        }

        // Jaccard similarity bar + score
        const barX = 392, barW = 112, barY = y + rowH / 2 - 7;
        els.push(
          s('rect', { x: barX, y: barY, width: barW, height: 14, rx: 7, fill: '#1a2548' }),
          s('rect', {
            x: barX, y: barY, width: Math.max(0, barW * inf.score), height: 14, rx: 7,
            fill: inf.score > 0 ? C.amber : C.muted,
          }),
          s('text', {
            x: barX + barW + 12, y: y + rowH / 2 + 6,
            fill: inf.score > 0 ? C.amber : C.muted,
            'font-size': 16, 'font-weight': 700, 'font-family': 'Consolas, monospace',
          }, fmt(inf.score))
        );

        // Status / recommendation pill on far right
        if (rRate != null) {
          els.push(
            s('rect', {
              x: VW - pad - 108, y: y + rowH / 2 - 15, width: 96, height: 30, rx: 15,
              fill: ISLAND_COL, 'fill-opacity': 0.16, stroke: ISLAND_COL, 'stroke-width': 1.6,
            }),
            s('text', {
              x: VW - pad - 60, y: y + rowH / 2 + 5, fill: ISLAND_COL,
              'font-size': 13.5, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace',
            }, `RATED ${rRate}★`)
          );
        } else if (isRec) {
          els.push(
            s('rect', {
              x: VW - pad - 114, y: y + rowH / 2 - 15, width: 102, height: 30, rx: 15,
              fill: C.green, 'fill-opacity': 0.18, stroke: C.green, 'stroke-width': 1.6,
            }),
            s('text', {
              x: VW - pad - 63, y: y + rowH / 2 + 5, fill: C.green,
              'font-size': 12.5, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace',
            }, '✓ RECOMMEND')
          );
        } else {
          els.push(s('text', {
            x: VW - pad - 16, y: y + rowH / 2 + 5, fill: C.muted,
            'font-size': 13, 'text-anchor': 'end', 'font-family': 'Consolas, monospace',
          }, 'not rated'));
        }
      }
    });

    svg.replaceChildren(...els);

    // --- Topic toggle buttons ---
    topicRow.replaceChildren(
      h('span', { class: 'sim-note', style: { margin: 0, fontWeight: 700 } }, 'Island topics:'),
      ...TOPICS.map(t => btn(t, () => toggleTopic(t), islandTopics.includes(t) ? 'go' : ''))
    );

    // --- Selected reader Island rating buttons ---
    const curReader = READERS[sel];
    const curRate = islandRatings[sel];
    rateRow.replaceChildren(
      h('span', { class: 'sim-note', style: { margin: 0, color: curReader.color, fontWeight: 700 } },
        `${curReader.name} rates Island:`),
      btn('—', () => { islandRatings[sel] = null; draw(); }, curRate == null ? 'go' : ''),
      ...[1, 2, 3, 4, 5].map(st =>
        btn(`${st}★`, () => { islandRatings[sel] = st; draw(); }, curRate === st ? 'go' : '')
      )
    );

    // --- Formula box for selected reader ---
    const si = infos[sel];
    const lines = [
      [`Selected: ${curReader.name}`, curReader.color],
      `Fav book: ${si.best.book.name} (${si.maxStar}★)`,
      `${si.best.book.name}: ${si.best.book.topics.join(', ')}`,
      `Island: ${islandTopics.length ? islandTopics.join(', ') : '(none)'}`,
      `shared    = ${si.best.shared.length}${si.best.shared.length ? ' (' + si.best.shared.join(', ') + ')' : ''}`,
      `different = ${si.best.distinct.length}`,
      [`Jaccard   = ${si.best.shared.length} ÷ ${si.best.distinct.length || 1} = ${fmt(si.score)}`, C.amber],
    ];
    if (si.favs.length > 1) {
      lines.push([`Tied favs: ${si.favs.map(f => `${f.book.name}→${fmt(f.score)}`).join(', ')}`, C.muted]);
    }
    lines.push([
      ratingCount === 0
        ? 'Island ratings: 0 (cold start)'
        : `Island ratings: ${ratingCount} (avg ${fmt(r3(islandRatings.filter(v => v != null).reduce((a, b) => a + b, 0) / ratingCount))}★)`,
      statusCol,
    ]);
    fbox(box, lines);

    // --- Plain-language live note ---
    const recNames = READERS.filter((_, i) => islandRatings[i] == null && topScore > 0 && infos[i].score === topScore).map(r => r.name);
    if (islandTopics.length === 0 && ratingCount === 0) {
      note.textContent = 'Island has no topics and no ratings yet. Turn on a topic button to make a first content-based recommendation.';
    } else if (ratingCount === 0 && recNames.length > 0) {
      note.textContent = `Cold start: Island has 0 ratings, so we use topics. Recommend Island first to ${recNames.join(' and ')} (score ${fmt(topScore)}).`;
    } else if (ratingCount === 0) {
      note.textContent = 'Cold start: none of the readers’ favourite books share a topic with Island yet.';
    } else if (ratingCount === 1) {
      note.textContent = 'Island now has its first rating! One rating is a useful start, though it does not mean everyone will agree.';
    } else {
      note.textContent = `Island now has ${ratingCount} ratings. The bookshop can combine topic matches with real ratings from readers.`;
    }

    // --- Check challenges ---
    const scoresByName = {};
    const islByName = {};
    READERS.forEach((r, i) => {
      scoresByName[r.name] = infos[i].score;
      islByName[r.name] = islandRatings[i];
    });
    chal.update({
      scores: scoresByName,
      islandRatings: islByName,
      islandTopics: islandTopics.slice(),
      ratingCount,
      randomCount,
    });
  }

  draw();
  return () => {};
}
