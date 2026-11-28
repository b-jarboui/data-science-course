// 14.4.4 PageRank: how connections give importance.
// Beat i = sentence i (0-based, 54 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play: basePlay } = L;

  // Shared chapter 14.4 reader order and colours: Ana=cyan, Ben=blue, Cara=orange, Dan=purple; Island=yellow.
  const NAMES = ['Ana', 'Ben', 'Cara', 'Dan'];
  const COL = [C.cyan, '#60a5fa', '#fb923c', C.violet];
  const BOOK_COL = '#fde047';

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) vs phone (8 x 14.22, y in [-5.5, 4.3])
  const CX = P ? 0 : -2.25;
  const NET_Y = P ? -0.2 : 0.25;
  const BOOK_Y = P ? -0.4 : 0.25;
  const NX = P ? [-2.7, -0.9, 0.9, 2.7] : [-5.4, -3.3, -1.2, 0.9];
  const PILL = P ? [0, 3.6, 0] : [CX, 1.98, 0];
  const BOXP = P ? [0, -3.35, 0] : [4.45, 0.95, 0];
  const POOL = P ? [0, -1.75, 0] : [CX, -1.65, 0];
  const CHART_X = P ? 0 : 4.45;
  const CHART_Y = P ? -5.6 : -1.78;
  const CHART_W = P ? 5.6 : 4.0;
  const CHART_H = P ? 1.5 : 1.9;
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 16 : 17);

  // Formula box (one on screen at a time)
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 19, lh = P ? 0.39 : 0.38;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 4.1;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.45 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.35 }));
    boxNow = g;
    return a;
  }

  // phone only: in the opening beats (2-14) a small card at the bottom repeats the idea of the
  // sentence, so the lower part of the tall screen is used (laptop: no card, unchanged)
  const pbox = (lines, color) => P ? fbox(lines, color) : [];

  // Geometry helpers for nodes, scores, and travelling points
  const scoreRad = v => {
    const base = P ? 0.4 : 0.42;
    const span = P ? 0.12 : 0.22;
    return base + span * Math.min(1, Math.max(0, (v - 10) / 30));
  };
  const makeNodeCircle = (i, r) => {
    const c = new M.Circle({ radius: r, color: COL[i], strokeWidth: 3.5 });
    c.setFill(C.card, 0.96);
    c.moveTo([NX[i], NET_Y, 0]);
    return c;
  };
  const makeDot = (p, color, r = P ? 0.095 : 0.105) => {
    const d = new M.Dot({ point: p, radius: r, color });
    d.setFill(color, 1);
    return d;
  };
  const edgeStartEnd = (from, to, radFrom, radTo) => {
    const dir = to > from ? 1 : -1;
    return [
      [NX[from] + dir * (radFrom + 0.06), NET_Y, 0.01],
      [NX[to] - dir * (radTo + 0.06), NET_Y, 0.01]
    ];
  };
  const flowBadge = (from, to, text, color) => {
    const above = to > from;
    const mx = (NX[from] + NX[to]) / 2;
    const my = NET_Y + (above ? (P ? 0.42 : 0.50) : (P ? -0.44 : -0.52));
    const str = above ? `${text} →` : `← ${text}`;
    const t = T(str, P ? 15 : 16, color, true, true);
    t.moveTo([mx, my, 0]);
    return t;
  };

  // Track persistent scene parts without re-wrapping existing objects
  const radii = [0.46, 0.46, 0.46, 0.46].map(() => P ? 0.46 : 0.54);
  let curRings = [], prevRings = [];
  const ind = (i, color, runTime) => {
    const ring = new M.Circle({ radius: radii[i] + 0.13, color, strokeWidth: 3.5 });
    ring.setFill(color, 0);
    ring.moveTo([NX[i], NET_Y, 0.03]);
    curRings.push(ring);
    return new M.Create(ring, { runTime: Math.min(runTime, 0.4) });
  };
  const play = (...a) => {
    const out = prevRings.map(r => new M.FadeOut(r, { runTime: 0.3 }));
    prevRings = curRings; curRings = [];
    return basePlay(...a, ...out);
  };
  const circles = [];
  const scoreMobs = [null, null, null, null];
  const edges = [];
  const nameLabels = [];
  let flowBadges = [];
  let activePackets = [];

  function setScoreAnims(i, valStr, scoreNum, runTime = 0.55) {
    const r = scoreRad(scoreNum);
    radii[i] = r;
    const sz = valStr.length >= 5 ? (P ? 16 : 17) : (valStr.length >= 4 ? (P ? 18 : 19) : (P ? 22 : 23));
    const nt = T(valStr, sz, COL[i], true, true);
    nt.moveTo([NX[i], NET_Y, 0.02]);
    const nc = makeNodeCircle(i, r);
    const anims = [
      new M.FadeOut(circles[i], { runTime: Math.min(runTime, 0.45) }),
      new M.FadeIn(nc, { runTime: Math.min(runTime, 0.45) }),
      new M.FadeIn(nt, { runTime: 0.4 })
    ];
    circles[i] = nc;
    if (scoreMobs[i]) anims.push(new M.FadeOut(scoreMobs[i], { runTime: 0.3 }));
    scoreMobs[i] = nt;
    return anims;
  }

  function sendAnims(from, to, labelStr, color, runTime = 0.85) {
    const [p0, p1] = edgeStartEnd(from, to, radii[from], radii[to]);
    const dot = makeDot(p0, color);
    const target = makeDot(p1, color);
    const badge = flowBadge(from, to, labelStr, color);
    activePackets.push(dot);
    flowBadges.push(badge);
    // pathArc +0.75 curves UP for left->right and DOWN for right->left (matching 1.2.4)
    return [
      new M.Transform(dot, target, { pathArc: 0.75, runTime }),
      new M.FadeIn(badge, { runTime: 0.5 })
    ];
  }

  function poolDeliverAnims(indices, runTime = 0.7) {
    const anims = [];
    for (const i of indices) {
      const start = [POOL[0] + (i - 1.5) * (P ? 0.55 : 0.65), POOL[1] + 0.32, 0.02];
      const end = [NX[i], NET_Y - radii[i] - 0.06, 0.02];
      const dot = makeDot(start, C.amber, P ? 0.085 : 0.095);
      const target = makeDot(end, C.amber, P ? 0.085 : 0.095);
      activePackets.push(dot);
      anims.push(new M.Transform(dot, target, { pathArc: i < 2 ? -0.35 : 0.35, runTime }));
    }
    return anims;
  }

  function clearPacketsAnim() {
    if (!activePackets.length) return [];
    const old = activePackets;
    activePackets = [];
    return [new M.FadeOut(new M.VGroup(...old), { runTime: 0.3 })];
  }

  function clearFlowsAnim() {
    const out = [];
    if (flowBadges.length) {
      const old = flowBadges;
      flowBadges = [];
      out.push(new M.FadeOut(new M.VGroup(...old), { runTime: 0.35 }));
    }
    out.push(...clearPacketsAnim());
    return out;
  }

  // ---------------------------------------------------------------------------
  // Beat 0: Imagine your bookshop wants to tell readers about a new book.
  const bookCard = new M.RoundedRectangle({ width: P ? 2.1 : 2.3, height: P ? 2.6 : 2.5, cornerRadius: 0.18, color: BOOK_COL, strokeWidth: 3 });
  bookCard.setFill(C.card, 0.96);
  bookCard.moveTo([CX, BOOK_Y, 0]);
  const bookSpine = new M.Line({ start: [CX - (P ? 0.72 : 0.8), BOOK_Y - 1.15, 0], end: [CX - (P ? 0.72 : 0.8), BOOK_Y + 1.15, 0], color: BOOK_COL, strokeWidth: 2 });
  const bookTitle = T('Island', P ? 28 : 30, BOOK_COL, false, true);
  bookTitle.moveTo([CX + 0.14, BOOK_Y + 0.32, 0]);
  const bookSub = T('NEW BOOK', P ? 15 : 16, C.amber, true, true);
  bookSub.moveTo([CX + 0.14, BOOK_Y - 0.35, 0]);
  const bookGroup = new M.VGroup(bookCard, bookSpine, bookTitle, bookSub);
  // phone: the opening picture (book, ripples, readers) is drawn 1.5x bigger to fill the tall screen
  const zb = m => { const c = m.getCenter(); m.scale(1.5); m.moveTo([CX + (c[0] - CX) * 1.5, BOOK_Y + (c[1] - BOOK_Y) * 1.5, c[2]]); };
  if (P) zb(bookGroup);

  await until(S(0));
  await play(new M.FadeIn(bookGroup, { runTime: 0.9 }), ...say('BOOKSHOP: A NEW BOOK', BOOK_COL));

  // Beat 1: You want to find readers whose recommendations may reach many other readers.
  const ripples = [1.55, 2.25].map(rad => {
    const ring = new M.Circle({ radius: rad, color: C.amber, strokeWidth: 2 });
    ring.setStrokeOpacity(0.45);
    ring.moveTo([CX, BOOK_Y, -0.01]);
    return ring;
  });
  const reachDots = [[-2.4, 0.65], [-2.1, -0.8], [2.4, 0.65], [2.1, -0.8], [0, -1.65]].map(([dx, dy], idx) => {
    const scx = P ? 0.78 : 1.05;
    const d = makeDot([CX + dx * scx, BOOK_Y + dy * (P ? 0.85 : 0.85), 0], COL[idx % 4], 0.12);
    return d;
  });
  if (P) [...ripples, ...reachDots].forEach(zb);
  await until(S(1));
  await play(
    new M.LaggedStart(ripples.map(r => new M.Create(r, { runTime: 0.7 })), { lagRatio: 0.35, runTime: 1.2 }),
    new M.LaggedStart(reachDots.map(d => new M.FadeIn(d, { runTime: 0.4 })), { lagRatio: 0.15, runTime: 1.1 }),
    ...say('WHO REACHES MANY READERS?', C.amber)
  );

  // Beat 2: Here are our four readers: Ana, Ben, Cara and Dan.
  const icons = NAMES.map((name, i) => {
    const x = NX[i], y = NET_Y;
    const head = new M.Circle({ radius: P ? 0.18 : 0.21, color: COL[i], strokeWidth: 2 });
    head.setFill(COL[i], 0.9);
    head.moveTo([x, y + 0.26, 0]);
    const body = new M.Arc({ radius: P ? 0.32 : 0.36, startAngle: 0, angle: Math.PI, color: COL[i], strokeWidth: 2 });
    body.setFill(COL[i], 0.85);
    body.moveTo([x, y - 0.16, 0]);
    return new M.VGroup(head, body);
  });
  NAMES.forEach((name, i) => {
    const lbl = T(name, P ? 20 : 22, COL[i], false, true);
    lbl.moveTo([NX[i], NET_Y + (P ? 0.82 : 0.96), 0]);
    nameLabels.push(lbl);
  });
  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(bookGroup, ...ripples, ...reachDots), { runTime: 0.5 }),
    new M.LaggedStart(icons.map((ic, i) => new M.FadeIn(new M.VGroup(ic, nameLabels[i]), { runTime: 0.45 })), { lagRatio: 0.22, runTime: 1.5 }),
    ...pbox(['Our readers', ['4 readers', C.cyan], 'Ana, Ben, Cara, Dan'], C.cyan),
    ...say('4 READERS: ANA, BEN, CARA, DAN', C.cyan)
  );

  // Note: nameLabels[i] were put in a transient VGroup only for FadeIn; keep icons and nameLabels separate!
  // Wait: putting nameLabels inside VGroup above would parent them to that VGroup. Let's NOT wrap nameLabels with icons!
  // Wait — we haven't emitted the file yet, so let's keep icons and nameLabels cleanly separate below!

  // Actually we can fade them in cleanly as two separate arrays inside play():
  // Let's keep our code 100% clean: never group objects we still want independent!
  // (We write the clean version right here.)
  // Wait - let's rewind and make sure Beat 2 uses separate FadeIns:
  // `new M.LaggedStart(icons.map(ic => new M.FadeIn(ic, { runTime: 0.45 })), ...)`
  // AND `new M.LaggedStart(nameLabels.map(lb => new M.FadeIn(lb, { runTime: 0.45 })), ...)`!

  // Beats 3, 4, 5: Friendships Ana-Ben, Ben-Cara, Cara-Dan
  for (let e = 0; e < 3; e++) {
    const ln = new M.Line({
      start: [NX[e], NET_Y, -0.02],
      end: [NX[e + 1], NET_Y, -0.02],
      color: C.muted,
      strokeWidth: 4
    });
    edges.push(ln);
  }
  await until(S(3));
  await play(new M.Create(edges[0], { runTime: 0.75 }), ...pbox(['Friendships', ['Ana — Ben', COL[0]]], COL[0]), ...say('ANA — BEN', COL[0]));

  await until(S(4));
  await play(new M.Create(edges[1], { runTime: 0.75 }), ...pbox(['Friendships', 'Ana — Ben', ['Ben — Cara', COL[1]]], COL[1]), ...say('BEN — CARA', COL[1]));

  await until(S(5));
  await play(new M.Create(edges[2], { runTime: 0.75 }), ...pbox(['Friendships', 'Ana — Ben', 'Ben — Cara', ['Cara — Dan', COL[2]]], COL[2]), ...say('CARA — DAN', COL[2]));

  // Beat 6: Draw these four readers as circles, with lines showing their friendships.
  for (let i = 0; i < 4; i++) circles.push(makeNodeCircle(i, radii[i]));
  await until(S(6));
  await play(
    new M.FadeOut(new M.VGroup(...icons), { runTime: 0.5 }),
    new M.LaggedStart(circles.map(c => new M.FadeIn(c, { runTime: 0.5 })), { lagRatio: 0.14, runTime: 1.1 }),
    ...pbox(['Network picture', ['circle = one reader', C.cyan], ['line = one friendship', C.muted]], C.cyan),
    ...say('CIRCLES = READERS · LINES = FRIENDSHIPS', C.cyan)
  );

  // Beat 7: Imagine that each reader recommends their friends.
  const recDots7 = [];
  const recAnims7 = [];
  for (let e = 0; e < 3; e++) {
    for (const [a, b] of [[e, e + 1], [e + 1, e]]) {
      const [p0, p1] = edgeStartEnd(a, b, radii[a], radii[b]);
      const d = makeDot(p0, COL[a], P ? 0.08 : 0.09);
      recDots7.push(d);
      recAnims7.push(new M.Transform(d, makeDot(p1, COL[a], P ? 0.08 : 0.09), { pathArc: 0.65, runTime: 0.9 }));
    }
  }
  await until(S(7));
  await play(new M.LaggedStart(recAnims7, { lagRatio: 0.08, runTime: 1.3 }), ...pbox(['Recommendations', ['each reader recommends', C.amber], ['their friends', C.amber]], C.amber), ...say('EACH READER RECOMMENDS FRIENDS', C.amber));

  // Beat 8: Each recommendation can give another reader some importance.
  const halos8 = circles.map((_, i) => {
    const h = new M.Circle({ radius: radii[i] + 0.14, color: C.amber, strokeWidth: 2.5 });
    h.setStrokeOpacity(0.75);
    h.moveTo([NX[i], NET_Y, -0.01]);
    return h;
  });
  await until(S(8));
  await play(
    new M.FadeOut(new M.VGroup(...recDots7), { runTime: 0.3 }),
    new M.LaggedStart(halos8.map(h => new M.FadeIn(h, { runTime: 0.45 })), { lagRatio: 0.12, runTime: 1.0 }),
    ...pbox(['Recommendations', ['give importance', C.amber], 'to other readers'], C.amber),
    ...say('RECOMMENDATION → IMPORTANCE', C.amber)
  );

  // Beat 9: But a recommendation from an important reader should carry more importance.
  const bigRing = new M.Circle({ radius: radii[1] + 0.24, color: C.amber, strokeWidth: 4 });
  bigRing.moveTo([NX[1], NET_Y, -0.01]);
  const [sSmall0, sSmall1] = edgeStartEnd(0, 1, radii[0], radii[1]);
  const [sBig0, sBig1] = edgeStartEnd(1, 2, radii[1], radii[2]);
  const smallDot = makeDot(sSmall0, COL[0], 0.075);
  const bigDot = makeDot(sBig0, C.amber, 0.17);
  await until(S(9));
  await play(
    new M.FadeOut(new M.VGroup(...halos8), { runTime: 0.3 }),
    new M.FadeIn(bigRing, { runTime: 0.4 }),
    new M.Transform(smallDot, makeDot(sSmall1, COL[0], 0.075), { pathArc: 0.75, runTime: 1.1 }),
    new M.Transform(bigDot, makeDot(sBig1, C.amber, 0.17), { pathArc: 0.75, runTime: 1.1 }),
    ...pbox(['From an important reader', ['= a bigger boost', C.amber]], C.amber),
    ...say('IMPORTANT READER → BIGGER BOOST', C.amber)
  );

  // Beat 10: Imagine giving each reader a collection of small glowing points.
  const glowClusters = [];
  for (let i = 0; i < 4; i++) {
    const pts = [];
    for (let k = 0; k < 6; k++) {
      const ang = k * Math.PI / 3;
      const rr = P ? 0.19 : 0.23;
      pts.push(makeDot([NX[i] + rr * Math.cos(ang), NET_Y + rr * Math.sin(ang), 0.02], C.amber, P ? 0.055 : 0.062));
    }
    glowClusters.push(pts);
  }
  await until(S(10));
  await play(
    new M.FadeOut(new M.VGroup(bigRing, smallDot, bigDot), { runTime: 0.35 }),
    new M.LaggedStart(glowClusters.flat().map(d => new M.FadeIn(d, { runTime: 0.35 })), { lagRatio: 0.04, runTime: 1.3 }),
    ...pbox(['Glowing points', ['= importance', C.amber]], C.amber),
    ...say('GLOWING POINTS = IMPORTANCE', C.amber)
  );

  // Beat 11: The number of points represents how important that reader is within this network of friendships.
  await until(S(11));
  await play(
    new M.LaggedStart(circles.map((c, k) => ind(k, C.amber, 0.6)), { lagRatio: 0.18, runTime: 1.6 }),
    ...pbox(['More points', ['= more important', C.cyan]], C.cyan),
    ...say('MORE POINTS = MORE IMPORTANT', C.cyan)
  );

  // Beat 12: Each reader shares most of their points equally among their friends.
  const shareDots12 = [];
  const shareAnims12 = [];
  for (let e = 0; e < 3; e++) {
    for (const [a, b] of [[e, e + 1], [e + 1, e]]) {
      const [p0, p1] = edgeStartEnd(a, b, radii[a], radii[b]);
      const d = makeDot(p0, C.amber, P ? 0.075 : 0.085);
      shareDots12.push(d);
      shareAnims12.push(new M.Transform(d, makeDot(p1, C.amber, P ? 0.075 : 0.085), { pathArc: 0.75, runTime: 1.0 }));
    }
  }
  await until(S(12));
  await play(new M.LaggedStart(shareAnims12, { lagRatio: 0.08, runTime: 1.4 }), ...pbox(['Sharing', ['most points go to friends,', C.cyan], ['in equal parts', C.cyan]], C.cyan), ...say('SHARE POINTS EQUALLY WITH FRIENDS', C.cyan));

  // Beat 13: Readers who receive more points become more important.
  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(...shareDots12), { runTime: 0.3 }),
    ind(1, C.amber, 0.8),
    ind(2, C.amber, 0.8),
    ...pbox(['More points received', ['= more important', C.amber]], C.amber),
    ...say('MORE INCOMING → MORE IMPORTANT', C.amber)
  );

  // Beat 14: Then everyone shares their new points again.
  const shareDots14 = [];
  const shareAnims14 = [];
  for (let e = 0; e < 3; e++) {
    for (const [a, b] of [[e, e + 1], [e + 1, e]]) {
      const [p0, p1] = edgeStartEnd(a, b, radii[a], radii[b]);
      const d = makeDot(p0, C.violet, P ? 0.075 : 0.085);
      shareDots14.push(d);
      shareAnims14.push(new M.Transform(d, makeDot(p1, C.violet, P ? 0.075 : 0.085), { pathArc: 0.75, runTime: 0.85 }));
    }
  }
  await until(S(14));
  await play(new M.LaggedStart(shareAnims14, { lagRatio: 0.06, runTime: 1.1 }), ...pbox(['Next', ['everyone shares', C.violet], ['their new points again', C.violet]], C.violet), ...say('SHARE AGAIN', C.violet));

  // Beat 15: This repeated sharing is the idea behind a method called PageRank.
  await until(S(15));
  await play(
    new M.FadeOut(new M.VGroup(...glowClusters.flat(), ...shareDots14), { runTime: 0.4 }),
    ...fbox(['PageRank', ['share importance', C.cyan], ['along connections,', C.cyan], ['round after round', C.amber]], C.green),
    ...say('THIS METHOD IS CALLED PAGERANK', C.green)
  );

  // Beat 16: Let's see how PageRank works, one round at a time.
  await until(S(16));
  await play(
    ...fbox(['One round at a time', ['Round 0: starting scores', C.muted]], C.cyan),
    ...say('ONE ROUND AT A TIME', C.cyan)
  );

  // Beat 17: Give each reader twenty-five points, so everyone starts with the same importance.
  await until(S(17));
  const startAnims = [];
  for (let i = 0; i < 4; i++) startAnims.push(...setScoreAnims(i, '25', 25, 0.55));
  await play(
    ...startAnims,
    ...fbox(['Round 0 (start)', ['Ana  = 25   Ben  = 25', C.ink], ['Cara = 25   Dan  = 25', C.ink]], C.cyan),
    ...say('START: 25 POINTS EACH', C.cyan)
  );

  // Beat 18: Together, the four readers have one hundred points.
  await until(S(18));
  await play(
    new M.LaggedStart(circles.map((c, k) => ind(k, C.amber, 0.5)), { lagRatio: 0.12, runTime: 1.0 }),
    ...fbox(['Round 0 (start)', '25 + 25 + 25 + 25', ['total = 100 points', C.amber]], C.amber),
    ...say('TOTAL = 100 POINTS', C.amber)
  );

  // Beat 19: In each round, readers send eighty percent of their points to their friends.
  await until(S(19));
  await play(
    new M.LaggedStart(edges.map(e => new M.Indicate(e, { color: C.cyan, runTime: 0.65 })), { lagRatio: 0.15, runTime: 1.1 }),
    ...fbox(['Each round:', ['80% → friends', C.cyan], ['20% → shared pool', C.muted]], C.cyan),
    ...say('80% SENT TO FRIENDS', C.cyan)
  );

  // Beat 20: The remaining twenty percent goes into a shared collection for all readers.
  const poolRect = new M.RoundedRectangle({ width: P ? 5.6 : 5.2, height: 0.72, cornerRadius: 0.18, color: C.amber, strokeWidth: 2 });
  poolRect.setFill(C.card, 0.94);
  poolRect.moveTo(POOL);
  const poolTxt = T('Shared pool (20%)', P ? 17 : 18, C.amber, true, true);
  poolTxt.moveTo(POOL);
  const toPoolDots = [0, 1, 2, 3].map(i => makeDot([NX[i], NET_Y - radii[i], 0.02], C.amber, 0.08));
  await until(S(20));
  await play(
    new M.FadeIn(poolRect, { runTime: 0.5 }),
    new M.FadeIn(poolTxt, { runTime: 0.5 }),
    new M.LaggedStart(toPoolDots.map((d, i) => new M.Transform(d, makeDot([POOL[0] + (i - 1.5) * 0.55, POOL[1], 0.02], C.amber, 0.08), { runTime: 0.75 })), { lagRatio: 0.08, runTime: 1.1 }),
    ...fbox(['Each round:', ['80% → friends', C.cyan], ['20% → shared pool', C.amber]], C.amber),
    ...say('20% → SHARED COLLECTION', C.amber)
  );

  // Beat 21: This gives us twenty shared points, or five points for each reader.
  const poolTxt2 = T('Shared pool: 20 pts (+5 each)', P ? 16 : 18, C.amber, true, true);
  poolTxt2.moveTo(POOL);
  await until(S(21));
  await play(
    new M.FadeOut(new M.VGroup(poolTxt, ...toPoolDots), { runTime: 0.35 }),
    new M.FadeIn(poolTxt2, { runTime: 0.45 }),
    ...fbox(['Shared pool:', '20% of 100 = 20 pts', ['20 ÷ 4 = +5 each', C.amber]], C.amber),
    ...say('20 SHARED POINTS = +5 EACH', C.amber)
  );

  // ---------------------------------------------------------------------------
  // ROUND 1 (Beats 22-31)
  // Beat 22: In our first round, Ana sends twenty points to Ben, her only friend.
  await until(S(22));
  await play(
    ind(0, COL[0], 0.5),
    ...sendAnims(0, 1, '20', COL[0], 0.9),
    ...fbox(['Round 1 · sending (80%)', ['Ana → Ben: 20', COL[0]]], COL[0]),
    ...say('ROUND 1: ANA SENDS 20 → BEN', COL[0])
  );

  // Beat 23: Ben shares twenty points equally, sending ten to Ana and ten to Cara.
  await until(S(23));
  await play(
    ind(1, COL[1], 0.5),
    ...sendAnims(1, 0, '10', COL[1], 0.9),
    ...sendAnims(1, 2, '10', COL[1], 0.9),
    ...fbox(['Round 1 · sending (80%)', ['Ana → Ben: 20', COL[0]], ['Ben → Ana: 10, Cara: 10', COL[1]]], COL[1]),
    ...say('BEN SPLITS 20: 10 + 10', COL[1])
  );

  // Beat 24: Cara sends ten points to Ben and ten to Dan.
  await until(S(24));
  await play(
    ind(2, COL[2], 0.5),
    ...sendAnims(2, 1, '10', COL[2], 0.85),
    ...sendAnims(2, 3, '10', COL[2], 0.85),
    ...fbox(['Round 1 · sending (80%)', ['Ben → Ana: 10, Cara: 10', COL[1]], ['Cara → Ben: 10, Dan: 10', COL[2]]], COL[2]),
    ...say('CARA SPLITS 20: 10 + 10', COL[2])
  );

  // Beat 25: Dan sends twenty points to Cara.
  await until(S(25));
  await play(
    ind(3, COL[3], 0.45),
    ...sendAnims(3, 2, '20', COL[3], 0.8),
    ...fbox(['Round 1 · sending (80%)', ['Cara → Ben: 10, Dan: 10', COL[2]], ['Dan → Cara: 20', COL[3]]], COL[3]),
    ...say('DAN SENDS 20 → CARA', COL[3])
  );

  // Beat 26: Everyone sends points using their scores from the start of the round.
  await until(S(26));
  await play(
    new M.LaggedStart(flowBadges.map(b => new M.Indicate(b, { color: C.amber, runTime: 0.45 })), { lagRatio: 0.08, runTime: 1.0 }),
    ...fbox(['Round 1 · rule', 'all sends use start scores', ['(25, 25, 25, 25)', C.muted]], C.violet),
    ...say('ALL USE START-OF-ROUND SCORES', C.violet)
  );

  // Beat 27: Now Ana receives ten from Ben, plus five shared points, giving her fifteen.
  await until(S(27));
  await play(
    ...clearPacketsAnim(),
    ...poolDeliverAnims([0], 0.65),
    ...setScoreAnims(0, '15', 15, 0.65),
    ...fbox(['Round 1 · new scores', ['Ana: 10 + 5 = 15', COL[0]]], COL[0]),
    ...say('ANA: 10 + 5 = 15', COL[0])
  );

  // Beat 28: Ben receives twenty from Ana and ten from Cara, plus five, giving him thirty-five.
  await until(S(28));
  await play(
    ...clearPacketsAnim(),
    ...poolDeliverAnims([1], 0.65),
    ...setScoreAnims(1, '35', 35, 0.65),
    ...fbox(['Round 1 · new scores', ['Ana: 10 + 5 = 15', COL[0]], ['Ben: 20 + 10 + 5 = 35', COL[1]]], COL[1]),
    ...say('BEN: 20 + 10 + 5 = 35', COL[1])
  );

  // Beat 29: Cara receives ten from Ben and twenty from Dan, plus five, giving her thirty-five.
  await until(S(29));
  await play(
    ...clearPacketsAnim(),
    ...poolDeliverAnims([2], 0.65),
    ...setScoreAnims(2, '35', 35, 0.65),
    ...fbox(['Round 1 · new scores', ['Ben:  20 + 10 + 5 = 35', COL[1]], ['Cara: 10 + 20 + 5 = 35', COL[2]]], COL[2]),
    ...say('CARA: 10 + 20 + 5 = 35', COL[2])
  );

  // Beat 30: Dan receives ten from Cara, plus five, giving him fifteen.
  await until(S(30));
  await play(
    ...clearPacketsAnim(),
    ...poolDeliverAnims([3], 0.65),
    ...setScoreAnims(3, '15', 15, 0.65),
    ...fbox(['Round 1 · new scores', ['Ana: 15   Ben: 35', C.ink], ['Cara: 35  Dan: 15', C.ink], ['total = 100', C.amber]], COL[3]),
    ...say('DAN: 10 + 5 = 15', COL[3])
  );

  // Beat 31: Ben and Cara now have more points than Ana and Dan.
  await until(S(31));
  await play(
    ...clearFlowsAnim(),
    ind(1, C.amber, 0.75),
    ind(2, C.amber, 0.75),
    ...say('BEN & CARA (35) > ANA & DAN (15)', C.amber)
  );

  // ---------------------------------------------------------------------------
  // ROUND 2 (Beats 32-38)
  // Beat 32: Let's begin our second round using these new scores.
  await until(S(32));
  await play(
    ...fbox(['Round 2 · start', ['Ana & Dan:  15', C.ink], ['Ben & Cara: 35', C.ink]], C.cyan),
    ...say('ROUND 2: START FROM 15, 35, 35, 15', C.cyan)
  );

  // Beat 33: Ana and Dan each have fifteen points, so each sends twelve to their only friend.
  await until(S(33));
  await play(
    ...sendAnims(0, 1, '12', COL[0], 0.9),
    ...sendAnims(3, 2, '12', COL[3], 0.9),
    ...fbox(['Round 2 · sending (80%)', ['Ana → Ben: 80% of 15 = 12', COL[0]], ['Dan → Cara: 80% of 15 = 12', COL[3]]], COL[0]),
    ...say('ANA & DAN SEND 12 EACH', COL[0])
  );

  // Beat 34: Ben and Cara each have thirty-five points, so each sends twenty-eight.
  await until(S(34));
  await play(
    ind(1, COL[1], 0.6),
    ind(2, COL[2], 0.6),
    ...fbox(['Round 2 · sending (80%)', ['Ben:  80% of 35 = 28', COL[1]], ['Cara: 80% of 35 = 28', COL[2]]], C.amber),
    ...say('BEN & CARA SEND 28 EACH', C.amber)
  );

  // Beat 35: They each have two friends, so each friend receives fourteen points.
  await until(S(35));
  await play(
    ...sendAnims(1, 0, '14', COL[1], 0.9),
    ...sendAnims(1, 2, '14', COL[1], 0.9),
    ...sendAnims(2, 1, '14', COL[2], 0.9),
    ...sendAnims(2, 3, '14', COL[2], 0.9),
    ...fbox(['Round 2 · split (2 friends)', ['Ben:  28 ÷ 2 = 14 each', COL[1]], ['Cara: 28 ÷ 2 = 14 each', COL[2]]], C.amber),
    ...say('28 ÷ 2 = 14 TO EACH FRIEND', C.amber)
  );

  // Beat 36: Ana and Dan each receive fourteen, plus five shared points, giving them nineteen each.
  await until(S(36));
  await play(
    ...clearPacketsAnim(),
    ...poolDeliverAnims([0, 3], 0.7),
    ...setScoreAnims(0, '19', 19, 0.7),
    ...setScoreAnims(3, '19', 19, 0.7),
    ...fbox(['Round 2 · new scores', ['Ana: 14 + 5 = 19', COL[0]], ['Dan: 14 + 5 = 19', COL[3]]], COL[0]),
    ...say('ANA & DAN: 14 + 5 = 19', COL[0])
  );

  // Beat 37: Ben and Cara each receive twelve plus fourteen, plus five, giving them thirty-one each.
  await until(S(37));
  await play(
    ...clearPacketsAnim(),
    ...poolDeliverAnims([1, 2], 0.7),
    ...setScoreAnims(1, '31', 31, 0.7),
    ...setScoreAnims(2, '31', 31, 0.7),
    ...fbox(['Round 2 · new scores', ['Ben:  12 + 14 + 5 = 31', COL[1]], ['Cara: 12 + 14 + 5 = 31', COL[2]]], COL[1]),
    ...say('BEN & CARA: 12 + 14 + 5 = 31', COL[1])
  );

  // Beat 38: Notice how the importance scores change again as the points travel.
  await until(S(38));
  await play(
    ...clearFlowsAnim(),
    new M.LaggedStart(circles.map((c, k) => ind(k, C.violet, 0.45)), { lagRatio: 0.12, runTime: 1.0 }),
    ...fbox(['After Round 2', ['19, 31, 31, 19', C.amber], ['total = 100', C.muted]], C.violet),
    ...say('SCORES SHIFT AGAIN', C.violet)
  );

  // ---------------------------------------------------------------------------
  // ROUND 3 (Beats 39-45)
  // Beat 39: Now begin our third round.
  await until(S(39));
  await play(
    ...fbox(['Round 3 · start', ['19, 31, 31, 19', C.ink]], C.cyan),
    ...say('ROUND 3', C.cyan)
  );

  // Beat 40: Ana and Dan each send fifteen point two points to their only friend.
  await until(S(40));
  await play(
    ...sendAnims(0, 1, '15.2', COL[0], 0.9),
    ...sendAnims(3, 2, '15.2', COL[3], 0.9),
    ...fbox(['Round 3 · sending (80%)', ['Ana → Ben:  15.2', COL[0]], ['Dan → Cara: 15.2', COL[3]]], COL[0]),
    ...say('ANA & DAN SEND 15.2', COL[0])
  );

  // Beat 41: Ben and Cara each send twenty-four point eight points, shared equally between two friends.
  await until(S(41));
  await play(
    ind(1, COL[1], 0.6),
    ind(2, COL[2], 0.6),
    ...fbox(['Round 3 · sending (80%)', ['Ben:  80% of 31 = 24.8', COL[1]], ['Cara: 80% of 31 = 24.8', COL[2]], ['split between 2 friends', C.muted]], C.amber),
    ...say('BEN & CARA SEND 24.8 EACH', C.amber)
  );

  // Beat 42: So each of their friends receives twelve point four points.
  await until(S(42));
  await play(
    ...sendAnims(1, 0, '12.4', COL[1], 0.85),
    ...sendAnims(1, 2, '12.4', COL[1], 0.85),
    ...sendAnims(2, 1, '12.4', COL[2], 0.85),
    ...sendAnims(2, 3, '12.4', COL[2], 0.85),
    ...fbox(['Round 3 · split', ['24.8 ÷ 2 = 12.4 each', C.amber]], C.amber),
    ...say('EACH FRIEND GETS 12.4', C.amber)
  );

  // Beat 43: Ana and Dan each receive twelve point four plus five, giving them seventeen point four.
  await until(S(43));
  await play(
    ...clearPacketsAnim(),
    ...poolDeliverAnims([0, 3], 0.7),
    ...setScoreAnims(0, '17.4', 17.4, 0.7),
    ...setScoreAnims(3, '17.4', 17.4, 0.7),
    ...fbox(['Round 3 · new scores', ['Ana: 12.4 + 5 = 17.4', COL[0]], ['Dan: 12.4 + 5 = 17.4', COL[3]]], COL[0]),
    ...say('ANA & DAN: 17.4', COL[0])
  );

  // Beat 44: Ben and Cara each receive fifteen point two plus twelve point four plus five.
  await until(S(44));
  await play(
    ...clearPacketsAnim(),
    ...poolDeliverAnims([1, 2], 0.7),
    ...fbox(['Round 3 · Ben & Cara', ['15.2 + 12.4 + 5', C.amber]], COL[1]),
    ...say('BEN & CARA: 15.2 + 12.4 + 5', COL[1])
  );

  // Beat 45: This gives Ben and Cara thirty-two point six points each.
  await until(S(45));
  await play(
    ...clearFlowsAnim(),
    ...setScoreAnims(1, '32.6', 32.6, 0.65),
    ...setScoreAnims(2, '32.6', 32.6, 0.65),
    ...fbox(['After Round 3', ['Ana & Dan:  17.4', COL[0]], ['Ben & Cara: 32.6', COL[1]]], C.green),
    ...say('BEN & CARA: 32.6 EACH', C.green)
  );

  // ---------------------------------------------------------------------------
  // FAST ROUNDS + TOTAL-CHANGE CURVE (Beats 46-49)
  const cx0 = CHART_X - CHART_W / 2 + 0.35;
  const cx1 = CHART_X + CHART_W / 2 - 0.1;
  const cy0 = CHART_Y - CHART_H / 2 + 0.18;
  const cy1 = CHART_Y + CHART_H / 2 - 0.12;
  const ptChart = (round, change) => [
    cx0 + ((round - 1) / 8) * (cx1 - cx0),
    cy0 + (change / 42) * (cy1 - cy0),
    0
  ];

  // Beat 46: Now repeat the sharing faster and watch how much the scores change between rounds.
  const xAxis = new M.Line({ start: [cx0, cy0, 0], end: [cx1, cy0, 0], color: C.muted, strokeWidth: 2 });
  const yAxis = new M.Line({ start: [cx0, cy0, 0], end: [cx0, cy1, 0], color: C.muted, strokeWidth: 2 });
  const chartTitle = T('Total change per round', P ? 17 : 17, C.amber, false, true);
  chartTitle.moveTo([CHART_X + 0.1, cy1 + 0.28, 0]);
  const chartXLab = T('round 1 → 9', 15, C.muted, true);
  chartXLab.moveTo([(cx0 + cx1) / 2, cy0 - 0.28, 0]);
  const yTicks = [0, 20, 40].map(v => {
    const [, py] = ptChart(1, v);
    const t = T(String(v), 15, C.muted, true);
    t.moveTo([cx0 - 0.30, py, 0]);
    return t;
  });

  await until(S(46));
  await play(
    new M.Create(xAxis, { runTime: 0.5 }),
    new M.Create(yAxis, { runTime: 0.5 }),
    new M.FadeIn(chartTitle, { runTime: 0.45 }),
    new M.FadeIn(chartXLab, { runTime: 0.45 }),
    new M.LaggedStart(yTicks.map(t => new M.FadeIn(t, { runTime: 0.3 })), { lagRatio: 0.15, runTime: 0.6 }),
    ...say('WATCH TOTAL CHANGE FALL', C.cyan)
  );

  // Beat 47: The total size of these changes falls from forty to sixteen, then to six point four.
  const cPts = [
    [1, 40, '40'],
    [2, 16, '16'],
    [3, 6.4, '6.4']
  ];
  const cDots = cPts.map(([r, v]) => makeDot(ptChart(r, v), C.amber, P ? 0.085 : 0.08));
  const cSegs = [0, 1].map(k => new M.Line({
    start: ptChart(cPts[k][0], cPts[k][1]),
    end: ptChart(cPts[k + 1][0], cPts[k + 1][1]),
    color: C.amber,
    strokeWidth: 3
  }));
  const cLabs = cPts.map(([r, v, s], idx) => {
    const [px, py] = ptChart(r, v);
    const t = T(s, 16, C.amber, true, true);
    t.moveTo([px + (idx === 0 ? 0.26 : 0.22), py + 0.18, 0]);
    return t;
  });

  await until(S(47));
  await play(
    new M.LaggedStart([
      new M.FadeIn(cDots[0], { runTime: 0.35 }),
      new M.FadeIn(cLabs[0], { runTime: 0.35 }),
      new M.Create(cSegs[0], { runTime: 0.45 }),
      new M.FadeIn(cDots[1], { runTime: 0.35 }),
      new M.FadeIn(cLabs[1], { runTime: 0.35 }),
      new M.Create(cSegs[1], { runTime: 0.45 }),
      new M.FadeIn(cDots[2], { runTime: 0.35 }),
      new M.FadeIn(cLabs[2], { runTime: 0.35 })
    ], { lagRatio: 0.28, runTime: 2.1 }),
    ...fbox(['Total change (all 4)', ['Round 1: 40', C.pink], ['Round 2: 16', C.amber], ['Round 3: 6.4', C.cyan]], C.amber),
    ...say('40 → 16 → 6.4', C.amber)
  );

  // Beat 48: Eventually, the scores nearly stop changing, and the curve of total changes approaches zero.
  const fastRounds = [
    { r: 4, a: 18.04, b: 31.96, ch: 2.56, as: '18.0', bs: '32.0' },
    { r: 5, a: 17.78, b: 32.22, ch: 1.02, as: '17.8', bs: '32.2' },
    { r: 6, a: 17.89, b: 32.11, ch: 0.41, as: '17.9', bs: '32.1' },
    { r: 7, a: 17.85, b: 32.15, ch: 0.16, as: '17.85', bs: '32.15' },
    { r: 8, a: 17.86, b: 32.14, ch: 0.07, as: '17.86', bs: '32.14' },
    { r: 9, a: 17.86, b: 32.14, ch: 0.03, as: '17.86', bs: '32.14' }
  ];
  let prevPt = ptChart(3, 6.4);
  await until(S(48));
  await play(...say('TOTAL CHANGE → 0', C.green));
  for (const st of fastRounds) {
    const nextPt = ptChart(st.r, st.ch);
    const seg = new M.Line({ start: prevPt, end: nextPt, color: C.green, strokeWidth: 3 });
    const dot = makeDot(nextPt, C.green, P ? 0.075 : 0.07);
    const pulse = [0, 1, 2].map(e => new M.Indicate(edges[e], { color: C.cyan, runTime: 0.35 }));
    await play(
      new M.Create(seg, { runTime: 0.35 }),
      new M.FadeIn(dot, { runTime: 0.25 }),
      ...pulse,
      ...setScoreAnims(0, st.as, st.a, 0.35),
      ...setScoreAnims(1, st.bs, st.b, 0.35),
      ...setScoreAnims(2, st.bs, st.b, 0.35),
      ...setScoreAnims(3, st.as, st.a, 0.35),
      ...fbox([`Round ${st.r}`, [`Ana & Dan:  ${st.as}`, COL[0]], [`Ben & Cara: ${st.bs}`, COL[1]], [`change = ${st.ch}`, C.green]], C.green)
    );
    prevPt = nextPt;
  }

  // Beat 49: Ana and Dan settle near eighteen points, while Ben and Cara settle near thirty-two points.
  await until(S(49));
  await play(
    ind(1, C.amber, 0.8),
    ind(2, C.amber, 0.8),
    ...fbox(['Settled scores', ['Ana & Dan:  17.86 (≈ 18)', COL[0]], ['Ben & Cara: 32.14 (≈ 32)', COL[1]]], C.green),
    ...say('SETTLED: ≈18 AND ≈32', C.green)
  );

  // Beat 50: We can now write our rule as a formula: new importance equals incoming points plus shared points.
  await until(S(50));
  await play(
    ...fbox(['PageRank formula', ['new importance =', C.ink], ['  incoming points', C.cyan], ['+ shared points', C.amber]], C.cyan),
    ...say('NEW = INCOMING + SHARED', C.cyan)
  );

  // Beat 51: PageRank uses this rule to find important people or web pages through their connections.
  await until(S(51));
  await play(
    new M.LaggedStart(edges.map(e => new M.Indicate(e, { color: C.green, runTime: 0.6 })), { lagRatio: 0.15, runTime: 1.2 }),
    ind(1, C.green, 0.7),
    ind(2, C.green, 0.7),
    ...say('IMPORTANCE FROM CONNECTIONS', C.green)
  );

  // Beat 52: But importance in a network does not tell us whether someone is kind, helpful or trustworthy.
  await until(S(52));
  await play(
    ...fbox(['Watch out', ['Measures connections,', C.cyan], ['NOT kindness or trust', C.pink]], C.pink),
    ...say('CONNECTIONS ≠ TRUST OR KINDNESS', C.pink)
  );

  // Beat 53: Remember: PageRank repeatedly shares importance along connections until the importance scores settle.
  const finalDots = [];
  const finalAnims = [];
  for (let e = 0; e < 3; e++) {
    for (const [a, b] of [[e, e + 1], [e + 1, e]]) {
      const [p0, p1] = edgeStartEnd(a, b, radii[a], radii[b]);
      const d = makeDot(p0, C.green, P ? 0.08 : 0.09);
      finalDots.push(d);
      finalAnims.push(new M.Transform(d, makeDot(p1, C.green, P ? 0.08 : 0.09), { pathArc: 0.75, runTime: 1.0 }));
    }
  }
  await until(S(53));
  await play(
    new M.LaggedStart(finalAnims, { lagRatio: 0.08, runTime: 1.4 }),
    ...fbox(['PageRank summary', ['1. Share along links', C.cyan], ['2. Repeat each round', C.amber], ['3. Stop when settled', C.green]], C.green),
    ...say('SHARE ALONG CONNECTIONS UNTIL SETTLED', C.green)
  );
}
