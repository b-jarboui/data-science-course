// lesson 12.1.8
// Group splits: keep every customer's renewal cards on the same side.
// Beat i = sentence i (0-based, 38 sentences: 0..37). Runs in site/live/engine.js.
//
// Shared chapter data (chapters/12.1.md): 20 renewals from 6 music-app customers.
// Random split (12.1.5):
//   Test (5): Bea Feb, Chen Apr, Ali May, Dina Jun, Eli Jun.
//   Training (15): the other 15 cards. All 5 test customers also appear in training.
// Group split (12.1.8):
//   Test (5, 2 customers): Chen (4 cards) + Farah (1 card).
//   Training (15, 4 customers): Ali (6) + Bea (3) + Dina (4) + Eli (2).
//   Zero customers appear on both sides.
// Rule: < 5 hours -> CANCEL; >= 5 hours -> STAY.
//   Group test score: 5 / 5 (Chen 4/4, Farah 1/1).
//   Alternative 2-customer test (Dina + Eli): 4 / 6 = 67% (misses: Dina Mar 3h, Eli Jun 6h).

export default async function (L) {
  const {
    M, P, FW, C, S,
    T, pill, showA, until, play,
  } = L;

  // ------------------------------------------------------------
  // Fixed shared chapter data (chapters/12.1.md)
  // ------------------------------------------------------------

  const DATA = [
    { name: 'Ali',   month: 'Jan', hours: 20, help: 0, cancelled: false },
    { name: 'Ali',   month: 'Feb', hours: 18, help: 0, cancelled: false },
    { name: 'Ali',   month: 'Mar', hours: 22, help: 1, cancelled: false },
    { name: 'Ali',   month: 'Apr', hours: 19, help: 0, cancelled: false },
    { name: 'Ali',   month: 'May', hours: 21, help: 0, cancelled: false },
    { name: 'Ali',   month: 'Jun', hours: 20, help: 0, cancelled: false },

    { name: 'Bea',   month: 'Jan', hours: 12, help: 0, cancelled: false },
    { name: 'Bea',   month: 'Feb', hours: 6,  help: 1, cancelled: false },
    { name: 'Bea',   month: 'Mar', hours: 2,  help: 1, cancelled: true },

    { name: 'Chen',  month: 'Jan', hours: 15, help: 0, cancelled: false },
    { name: 'Chen',  month: 'Feb', hours: 10, help: 0, cancelled: false },
    { name: 'Chen',  month: 'Mar', hours: 7,  help: 1, cancelled: false },
    { name: 'Chen',  month: 'Apr', hours: 3,  help: 2, cancelled: true },

    { name: 'Farah', month: 'Feb', hours: 1,  help: 0, cancelled: true },

    { name: 'Dina',  month: 'Mar', hours: 3,  help: 0, cancelled: false },
    { name: 'Dina',  month: 'Apr', hours: 9,  help: 0, cancelled: false },
    { name: 'Dina',  month: 'May', hours: 14, help: 0, cancelled: false },
    { name: 'Dina',  month: 'Jun', hours: 16, help: 0, cancelled: false },

    { name: 'Eli',   month: 'May', hours: 11, help: 0, cancelled: false },
    { name: 'Eli',   month: 'Jun', hours: 6,  help: 1, cancelled: true },
  ];

  const CUSTOMERS = ['Ali', 'Bea', 'Chen', 'Farah', 'Dina', 'Eli'];
  const id = d => `${d.name}-${d.month}`;
  const findCard = (name, month) => DATA.find(d => d.name === name && d.month === month);

  // Ordered to match training rows vertically so linking lines stay clean.
  const RANDOM_TEST = [
    findCard('Ali',  'May'),
    findCard('Bea',  'Feb'),
    findCard('Chen', 'Apr'),
    findCard('Dina', 'Jun'),
    findCard('Eli',  'Jun'),
  ];
  const RANDOM_TEST_IDS = new Set(RANDOM_TEST.map(id));
  const RANDOM_TRAIN = DATA.filter(d => !RANDOM_TEST_IDS.has(id(d)));

  const GROUP_TEST_NAMES = new Set(['Chen', 'Farah']);
  const GROUP_TEST = [
    findCard('Chen', 'Jan'),
    findCard('Chen', 'Feb'),
    findCard('Chen', 'Mar'),
    findCard('Chen', 'Apr'),
    findCard('Farah', 'Feb'),
  ];

  const GROUPED = Object.fromEntries(
    CUSTOMERS.map(name => [name, DATA.filter(d => d.name === name)])
  );

  const PINK = C.pink || '#f472b6';
  const CUSTOMER_COLOR = {
    Ali:   C.violet,
    Bea:   C.amber,
    Chen:  C.green,
    Farah: PINK,
    Dina:  '#60a5fa',
    Eli:   '#fb923c',
  };
  const outcomeColor = d => (d.cancelled ? PINK : C.cyan);
  const outcomeWord = d => (d.cancelled ? 'CANCEL' : 'STAY');

  // ------------------------------------------------------------
  // Responsive bands (zero overlap on laptop AND phone)
  //
  // Laptop (14.22 x 8):
  //   Backdrop title: [2.35, 3.65]
  //   Status pill:    y = 1.98 ([1.75, 2.21])
  //   Main stage:     y in [-1.96, +1.56]
  //   Bottom badge:   y = -2.26 ([-2.46, -2.06])
  //   Note box:       y = -3.22 ([-3.76, -2.68])
  //
  // Phone (8 x 14.22):
  //   Backdrop title: [4.66, 5.86]
  //   Status pill:    y = 4.12 ([3.89, 4.35])
  //   Main stage:     y in [-3.92, +3.62]
  //   Bottom badge:   y = -4.24 ([-4.46, -4.02])
  //   Note box:       y = -5.62 ([-6.42, -4.82])
  // ------------------------------------------------------------

  const PILL = P ? [0, 4.12, 0] : [0, 1.98, 0];
  const BOXP = P ? [0, -5.62, 0] : [0, -3.22, 0];
  const BADGE_Y = P ? -4.40 : -2.26;
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 18);

  // ------------------------------------------------------------
  // Basic visual helpers
  // ------------------------------------------------------------

  function textAt(s, size, color, pos, { mono = false, bold = false, maxWidth = null } = {}) {
    const t = T(s, size, color, mono, bold);
    let scale = 1;
    if (maxWidth && t.getWidth() > maxWidth) {
      scale = maxWidth / t.getWidth();
      t.scale(scale);
    }
    t.moveTo(pos);
    return t;
  }

  function measuredText(s, size, color, { mono = false, bold = false, maxWidth = null } = {}) {
    const t = T(s, size, color, mono, bold);
    let scale = 1;
    if (maxWidth && t.getWidth() > maxWidth) {
      scale = maxWidth / t.getWidth();
      t.scale(scale);
    }
    return { t, w: t.getWidth() * scale };
  }

  function line(a, b, color = C.muted, width = 2, opacity = 1) {
    const ln = new M.Line({ start: a, end: b, color, strokeWidth: width });
    if (opacity < 1) ln.setStrokeOpacity(opacity);
    return ln;
  }

  function dash(a, b, color = C.muted) {
    return new M.DashedLine({ start: a, end: b, color });
  }

  function rect(w, h, pos, color, fill = C.card, opacity = 0.95, strokeWidth = 2, cornerRadius = 0.12) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius, color, strokeWidth });
    r.setFill(fill, opacity);
    r.moveTo(pos);
    return r;
  }

  function block(w, h, pos, color, opacity = 0.85) {
    const r = new M.Rectangle({ width: w, height: h, color, strokeWidth: 1 });
    r.setFill(color, opacity);
    r.moveTo(pos);
    return r;
  }

  function dot(p, color = C.cyan, radius = 0.08) {
    const d = new M.Dot({ point: p, radius, color });
    d.setFill(color, 1);
    return d;
  }

  function glowParts(p, color = C.cyan, radius = 0.06) {
    const halo = new M.Dot({ point: p, radius: radius * 1.9, color });
    halo.setFill(color, 0.20);
    return [halo, dot(p, color, radius)];
  }

  function tagAt(s, color, pos, size = 16) {
    const t = pill(s, color, P ? Math.max(15, size) : size);
    t.moveTo(pos);
    return t;
  }

  function arrowParts(a, b, color = C.amber, width = 2.6) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const h = Math.min(0.16, len * 0.35), w = h * 0.58;
    const left = [b[0] - h * ux - w * uy, b[1] - h * uy + w * ux, 0];
    const right = [b[0] - h * ux + w * uy, b[1] - h * uy - w * ux, 0];
    return [
      line(a, b, color, width),
      line(b, left, color, width),
      line(b, right, color, width),
    ];
  }

  function arrow(a, b, color = C.amber, width = 2.6) {
    return new M.VGroup(...arrowParts(a, b, color, width));
  }

  function lockParts(p, color = C.amber, scale = 0.9) {
    const shackle = new M.Arc({
      radius: 0.11 * scale,
      startAngle: 0,
      angle: Math.PI,
      color,
      strokeWidth: 2.4,
    });
    shackle.setFill(color, 0);
    shackle.moveTo([p[0], p[1] + 0.085 * scale, 0]);
    const body = rect(0.32 * scale, 0.22 * scale, [p[0], p[1] - 0.02 * scale, 0], color, C.card, 0.95, 2, 0.05);
    const keyhole = dot([p[0], p[1] - 0.01 * scale, 0], color, 0.028 * scale);
    return [shackle, body, keyhole];
  }

  function personParts(p, color = C.violet, scale = 1) {
    const head = new M.Circle({ radius: 0.20 * scale, color, strokeWidth: 2 });
    head.setFill(color, 0.95);
    head.moveTo([p[0], p[1] + 0.28 * scale, 0]);
    const body = new M.Arc({ radius: 0.36 * scale, startAngle: 0, angle: Math.PI, color, strokeWidth: 2 });
    body.setFill(color, 0.85);
    body.moveTo([p[0], p[1] - 0.12 * scale, 0]);
    return [head, body];
  }

  const fadeInAll = (...objs) => objs.filter(Boolean).map(o => new M.FadeIn(o, { runTime: 0.38 }));
  const fadeOutAll = (...objs) => objs.filter(Boolean).map(o => new M.FadeOut(o, { runTime: 0.28 }));

  // ------------------------------------------------------------
  // Formula / note panel (bottom on BOTH laptop and phone)
  // ------------------------------------------------------------

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const anims = [];
    if (boxNow) anims.push(new M.FadeOut(boxNow, { runTime: 0.24 }));
    boxNow = null;
    if (!lines) return anims;

    const size = P ? 18 : 18;
    const lh = P ? 0.39 : 0.34;
    const rows = lines.map(l => (Array.isArray(l) ? l : [l, C.ink]));
    const maxLineW = P ? FW - 1.35 : 11.40;
    const items = rows.map(([s, c], idx) =>
      measuredText(s, size, c, { bold: idx === 0 && rows.length > 1, maxWidth: maxLineW })
    );
    const wd = Math.min(P ? FW - 0.70 : 12.20, Math.max(...items.map(it => it.w)) + 0.72);
    const ht = rows.length * lh + 0.34;
    const r = rect(wd, ht, BOXP, color, C.card, 0.96, 2.1, 0.16);
    const top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    items.forEach(({ t }, i) => {
      t.moveTo([BOXP[0], top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...items.map(it => it.t));
    anims.push(new M.FadeIn(g, { runTime: 0.34 }));
    boxNow = g;
    return anims;
  }

  // ------------------------------------------------------------
  // Stage tracking (pictureNow = persistent scene, marksNow = highlights)
  // ------------------------------------------------------------

  let pictureNow = [];
  let marksNow = [];

  function picture(...objects) {
    const next = objects.filter(Boolean);
    const anims = [...fadeOutAll(...pictureNow, ...marksNow), ...fadeInAll(...next)];
    pictureNow = next;
    marksNow = [];
    return anims;
  }

  function marks(...objects) {
    const next = objects.filter(Boolean);
    const anims = [...fadeOutAll(...marksNow), ...fadeInAll(...next)];
    marksNow = next;
    return anims;
  }

  // ------------------------------------------------------------
  // Split frame with measured lock-icon placement (never overlaps text)
  // ------------------------------------------------------------

  function splitFrame(spec, color, label, locked = false) {
    const p = [spec.x, spec.y, 0];
    const headerY = spec.y + spec.h / 2 + (P ? 0.24 : 0.22);
    const parts = [rect(spec.w, spec.h, p, color, color, 0.04, 2.2, 0.14)];
    const maxW = locked ? spec.w - 0.68 : spec.w - 0.30;
    const { t, w: actualW } = measuredText(label, P ? 16 : 16, color, { bold: true, maxWidth: maxW });
    if (locked) {
      const iconW = 0.34;
      const gap = 0.14;
      const totalW = iconW + gap + actualW;
      const iconX = spec.x - totalW / 2 + iconW / 2;
      const textX = iconX + iconW / 2 + gap + actualW / 2;
      parts.push(...lockParts([iconX, headerY, 0], color, 0.90));
      t.moveTo([textX, headerY, 0]);
    } else {
      t.moveTo([spec.x, headerY, 0]);
    }
    parts.push(t);
    return new M.VGroup(...parts);
  }

  // ============================================================
  // ACT 1: THE QUESTION & RANDOM SPLIT OVERLAP (Beats 0–7)
  // ============================================================

  function introCard(p, title, color, bodyLines, isPerson = false) {
    const w = P ? 6.90 : 5.00;
    const h = P ? 2.45 : 2.80;
    const parts = [
      rect(w, h, p, color, C.card, 0.95, 2.3, 0.16),
      textAt(title, P ? 19 : 20, color, [p[0], p[1] + h / 2 - 0.38, 0], { bold: true, maxWidth: w - 0.40 }),
    ];
    if (isPerson) {
      const iconX = P ? p[0] - 2.05 : p[0] - 1.35;
      const textX = P ? p[0] + 0.55 : p[0] + 0.65;
      parts.push(...personParts([iconX, p[1] - 0.15, 0], color, P ? 1.15 : 1.15));
      parts.push(
        textAt(bodyLines[0], P ? 19 : 19, C.ink, [textX, p[1] + 0.08, 0], { bold: true, maxWidth: w - 2.20 }),
        textAt(bodyLines[1], P ? 17 : 17, C.muted, [textX, p[1] - 0.42, 0], { maxWidth: w - 2.20 }),
      );
    } else {
      bodyLines.forEach((ln, i) => {
        const [txt, col] = Array.isArray(ln) ? ln : [ln, C.ink];
        parts.push(
          textAt(txt, P ? 19 : 19, col, [p[0], p[1] + 0.18 - i * 0.54, 0], { mono: true, bold: true, maxWidth: w - 0.50 })
        );
      });
    }
    return new M.VGroup(...parts);
  }

  const introLeftPos = P ? [0, 1.85, 0] : [-3.30, -0.22, 0];
  const introRightPos = P ? [0, -1.85, 0] : [3.30, -0.22, 0];
  const introRuleCard = introCard(
    introLeftPos,
    'MUSIC APP RULE',
    C.cyan,
    [['< 5 hours  →  CANCEL', PINK], ['≥ 5 hours  →  STAY', C.cyan]],
    false,
  );
  const introUnseenCard = introCard(
    introRightPos,
    'UNSEEN CUSTOMERS',
    C.violet,
    ['Never seen before', 'Cancel or stay?'],
    true,
  );
  const introArrow = arrow(
    P ? [0, 0.48, 0] : [-0.62, -0.22, 0],
    P ? [0, -0.48, 0] : [0.62, -0.22, 0],
    C.amber,
    3,
  );

  // Beat 0: "Suppose the music app wants to check its rule on customers it has never seen."
  await until(S(0));
  await play(
    ...picture(introRuleCard, introArrow, introUnseenCard),
    ...fbox([
      ['THE GOAL', C.violet],
      'Check the rule on customers it has never seen.',
    ], C.violet),
    ...say('CHECK THE RULE ON UNSEEN CUSTOMERS', C.violet),
  );

  // Beat 1: "Does our first test answer that question?"
  const qBadge = tagAt('FIRST TEST (RANDOM SPLIT) — ENOUGH?', C.amber, [0, BADGE_Y, 0], 16);
  const qRing = rect(
    P ? 7.06 : 5.16,
    P ? 2.61 : 2.96,
    introRightPos,
    C.amber,
    C.amber,
    0,
    3,
    0.18,
  );

  await until(S(1));
  await play(
    ...marks(qRing, qBadge),
    ...fbox([
      ['OUR FIRST TEST', C.amber],
      'Five cards picked at random. Are those people new?',
    ], C.amber),
    ...say('DOES OUR FIRST TEST ANSWER THAT?', C.amber),
  );

  // ------------------------------------------------------------
  // Random-split board (Beats 2–7)
  // ------------------------------------------------------------

  const RCW = P ? 2.18 : 1.38;
  const RCH = P ? 0.70 : 0.84;

  const R_TRAIN_FRAME = P
    ? { x: 0,     y: 1.18,  w: 7.36, h: 4.24 }
    : { x: -2.85, y: -0.36, w: 7.76, h: 3.08 };

  const R_TEST_FRAME = P
    ? { x: 0,    y: -2.56, w: 7.36, h: 1.92 }
    : { x: 4.65, y: -0.36, w: 4.20, h: 3.08 };

  function rTrainSlot(i) {
    if (P) {
      const col = i % 3, row = Math.floor(i / 3);
      return [(col - 1) * 2.32, 2.74 - row * 0.78, 0];
    }
    const col = i % 5, row = Math.floor(i / 5);
    return [-2.85 + (col - 2) * 1.48, 0.58 - row * 0.94, 0];
  }

  function rTestSlot(i) {
    if (P) {
      const row = i < 3 ? 0 : 1;
      const col = row === 0 ? i : i - 3;
      const inRow = row === 0 ? 3 : 2;
      return [(col - (inRow - 1) / 2) * 2.32, -2.15 - row * 0.82, 0];
    }
    const row = Math.floor(i / 2);
    const col = i % 2;
    return [4.65 + (col === 0 ? -0.92 : 0.92), 0.58 - row * 0.94, 0];
  }

  function renewalCard(d, p, w, h, { showName = true, showOutcome = true, highlight = null } = {}) {
    const idCol = showName ? CUSTOMER_COLOR[d.name] : C.muted;
    const stCol = outcomeColor(d);
    const parts = [
      rect(w, h, p, highlight || idCol, C.card, 0.95, highlight ? 2.8 : 1.9, 0.10),
      block(0.06, h * 0.72, [p[0] - w / 2 + 0.08, p[1], 0], idCol, 0.92),
    ];

    const title = showName ? `${d.name} ${d.month}` : d.month;
    parts.push(
      textAt(title, P ? 17 : 16, showName ? idCol : C.ink, [p[0] + 0.02, p[1] + h * 0.22, 0], {
        bold: true,
        maxWidth: w - 0.24,
      }),
      textAt(`${d.hours}h`, P ? 16 : 15, C.ink, [p[0] - w * 0.27, p[1] - h * 0.22, 0], {
        mono: true,
        bold: true,
        maxWidth: w * 0.36,
      }),
    );

    if (showOutcome) {
      parts.push(
        ...glowParts([p[0] - w * 0.06, p[1] - h * 0.22, 0], stCol, P ? 0.05 : 0.042),
        textAt(outcomeWord(d), P ? 15 : 15, stCol, [p[0] + w * 0.21, p[1] - h * 0.22, 0], {
          bold: true,
          maxWidth: w * 0.46,
        }),
      );
    } else {
      parts.push(
        textAt('HIDDEN', 15, C.muted, [p[0] + w * 0.15, p[1] - h * 0.22, 0], {
          bold: true,
          maxWidth: w * 0.50,
        }),
      );
    }

    return new M.VGroup(...parts);
  }

  function buildRandomSplit(showName) {
    const positions = new Map();
    const trainFrame = splitFrame(R_TRAIN_FRAME, C.cyan, 'TRAINING · 15 CARDS', false);
    const testFrame = splitFrame(R_TEST_FRAME, C.amber, 'LOCKED TEST · 5 CARDS', true);
    const objects = [trainFrame, testFrame];

    RANDOM_TRAIN.forEach((d, i) => {
      const p = rTrainSlot(i);
      positions.set(id(d), p);
      objects.push(renewalCard(d, p, RCW, RCH, { showName }));
    });
    RANDOM_TEST.forEach((d, i) => {
      const p = rTestSlot(i);
      positions.set(id(d), p);
      objects.push(renewalCard(d, p, RCW, RCH, { showName }));
    });
    return { objects, positions };
  }

  const randomNoNames = buildRandomSplit(false);

  // Beat 2: "Put the five test cards on the right and the training cards on the left."
  await until(S(2));
  await play(
    ...picture(...randomNoNames.objects),
    ...fbox([
      ['RANDOM SPLIT (15 TRAIN · 5 TEST)', C.cyan],
      'Cyan = stayed  ·  Pink = cancelled',
    ], C.cyan),
    ...say(P ? '15 TRAINING TOP · 5 TEST BOTTOM' : '15 TRAINING LEFT · 5 TEST RIGHT', C.cyan),
  );

  // Beat 3: "Show a name on each card."
  const randomNamed = buildRandomSplit(true);

  await until(S(3));
  await play(
    ...picture(...randomNamed.objects),
    ...fbox([
      ['CUSTOMER NAMES SHOWN', C.violet],
      'Each colour marks one of the 6 customers.',
    ], C.violet),
    ...say('SHOW EACH CUSTOMER NAME', C.violet),
  );

  function randomOutline(d, color = CUSTOMER_COLOR[d.name]) {
    const p = randomNamed.positions.get(id(d));
    return rect(RCW + 0.08, RCH + 0.08, p, color, color, 0, 2.8, 0.12);
  }

  function linksForCustomer(name) {
    const testCard = RANDOM_TEST.find(d => d.name === name);
    const trainCards = RANDOM_TRAIN.filter(d => d.name === name);
    const col = CUSTOMER_COLOR[name];
    const tp = randomNamed.positions.get(id(testCard));
    const lines = trainCards.map(tr => {
      const trp = randomNamed.positions.get(id(tr));
      const a = P ? [tp[0], tp[1] + RCH / 2, 0.02] : [tp[0] - RCW / 2, tp[1], 0.02];
      const b = P ? [trp[0], trp[1] - RCH / 2, 0.02] : [trp[0] + RCW / 2, trp[1], 0.02];
      return line(a, b, col, 2.3, 0.88);
    });
    const outlines = [randomOutline(testCard, col), ...trainCards.map(tr => randomOutline(tr, col))];
    return { lines, outlines };
  }

  // Beat 4: "Draw a line from Ali's May test card to his other cards in training."
  const aliLinks = linksForCustomer('Ali');

  await until(S(4));
  await play(
    ...fadeInAll(...aliLinks.outlines),
    new M.LaggedStart(aliLinks.lines.map(l => new M.Create(l, { runTime: 0.55 })), { lagRatio: 0.15, runTime: 1.15 }),
    ...fbox([
      ['ALI LINKS ACROSS', CUSTOMER_COLOR.Ali],
      'May in test  ↔  Jan, Feb, Mar, Apr, Jun in training',
    ], CUSTOMER_COLOR.Ali),
    ...say('ALI: 1 TEST CARD ↔ 5 TRAINING CARDS', CUSTOMER_COLOR.Ali),
  );
  marksNow.push(...aliLinks.outlines, ...aliLinks.lines);

  // Beat 5: "Link Bea’s February test card to her other cards in training."
  const beaLinks = linksForCustomer('Bea');

  await until(S(5));
  await play(
    ...fadeOutAll(...aliLinks.outlines),
    ...fadeInAll(...beaLinks.outlines),
    new M.LaggedStart(beaLinks.lines.map(l => new M.Create(l, { runTime: 0.55 })), { lagRatio: 0.25, runTime: 0.95 }),
    ...fbox([
      ['BEA LINKS ACROSS', CUSTOMER_COLOR.Bea],
      'Feb in test  ↔  Jan, Mar in training',
    ], CUSTOMER_COLOR.Bea),
    ...say('BEA: 1 TEST CARD ↔ 2 TRAINING CARDS', CUSTOMER_COLOR.Bea),
  );
  marksNow = [...aliLinks.lines, ...beaLinks.outlines, ...beaLinks.lines];

  // Beat 6: "Do the same for Chen, Dina, and Eli."
  const chenLinks = linksForCustomer('Chen');
  const dinaLinks = linksForCustomer('Dina');
  const eliLinks = linksForCustomer('Eli');
  const restLines = [...chenLinks.lines, ...dinaLinks.lines, ...eliLinks.lines];
  const restOutlines = [...chenLinks.outlines, ...dinaLinks.outlines, ...eliLinks.outlines];

  await until(S(6));
  await play(
    ...fadeOutAll(...beaLinks.outlines),
    ...fadeInAll(...restOutlines),
    new M.LaggedStart(restLines.map(l => new M.Create(l, { runTime: 0.50 })), { lagRatio: 0.12, runTime: 1.25 }),
    ...fbox([
      ['CHEN, DINA & ELI LINK ACROSS TOO', C.amber],
      'Chen (3 train)  ·  Dina (3 train)  ·  Eli (1 train)',
    ], C.amber),
    ...say('SAME FOR CHEN, DINA, AND ELI', C.amber),
  );
  marksNow = [...aliLinks.lines, ...beaLinks.lines, ...restOutlines, ...restLines];

  // Beat 7: "Every test card links to at least one training card."
  const allTestPinkOutlines = RANDOM_TEST.map(d => randomOutline(d, PINK));
  const overlapPill = tagAt('5 OF 5 TEST CARDS LINK TO TRAINING', PINK, [0, BADGE_Y, 0], 16);

  await until(S(7));
  await play(
    ...fadeOutAll(...restOutlines),
    ...fadeInAll(...allTestPinkOutlines, overlapPill),
    ...fbox([
      ['EVERY TEST CUSTOMER WAS SEEN BEFORE', PINK],
      '5 of 5 test cards belong to customers in training.',
    ], PINK),
    ...say('EVERY TEST CARD LINKS TO TRAINING', PINK),
  );
  marksNow = [...aliLinks.lines, ...beaLinks.lines, ...restLines, ...allTestPinkOutlines, overlapPill];

  // ============================================================
  // ACT 2: WHY OVERLAP BREAKS THE TEST — ALI (Beats 8–12)
  // ============================================================

  const ALI_TRAIN = GROUPED.Ali.filter(d => d.month !== 'May');
  const ALI_TEST = findCard('Ali', 'May');

  const ALI_TRAIN_BOX = P
    ? { x: 0,     y: 1.72,  w: 7.36, h: 2.86 }
    : { x: -2.90, y: -0.36, w: 7.30, h: 3.04 };

  const ALI_TEST_BOX = P
    ? { x: 0,    y: -2.35, w: 5.40, h: 1.80 }
    : { x: 4.75, y: -0.36, w: 3.90, h: 3.04 };

  const ALI_CARD_W = P ? 2.18 : 2.10;
  const ALI_CARD_H = P ? 1.04 : 1.12;

  function aliTrainSlot(i) {
    const row = i < 3 ? 0 : 1;
    const col = row === 0 ? i : i - 3;
    const inRow = row === 0 ? 3 : 2;
    const pitchX = P ? 2.32 : 2.26;
    const pitchY = P ? 1.24 : 1.32;
    const cx = ALI_TRAIN_BOX.x;
    const topY = ALI_TRAIN_BOX.y + pitchY / 2;
    return [cx + (col - (inRow - 1) / 2) * pitchX, topY - row * pitchY, 0];
  }

  function aliCard(d, p, w, h, { showOutcome = true, nameHighlight = false, outcomeHighlight = false } = {}) {
    const stCol = outcomeColor(d);
    const parts = [
      rect(w, h, p, outcomeHighlight ? C.cyan : CUSTOMER_COLOR.Ali, C.card, 0.95, outcomeHighlight ? 2.8 : 2.0, 0.12),
      block(0.07, h * 0.72, [p[0] - w / 2 + 0.09, p[1], 0], CUSTOMER_COLOR.Ali, 0.95),
    ];
    if (nameHighlight) {
      parts.push(rect(w - 0.34, 0.36, [p[0] + 0.04, p[1] + h * 0.24, 0], CUSTOMER_COLOR.Ali, CUSTOMER_COLOR.Ali, 0.18, 1.5, 0.08));
    }
    parts.push(
      textAt(`${d.name} ${d.month}`, P ? 18 : 18, CUSTOMER_COLOR.Ali, [p[0] + 0.04, p[1] + h * 0.24, 0], {
        bold: true,
        maxWidth: w - 0.30,
      }),
      textAt(`${d.hours}h`, P ? 17 : 17, C.ink, [p[0] - w * 0.26, p[1] - h * 0.20, 0], {
        mono: true,
        bold: true,
      }),
    );
    if (showOutcome) {
      parts.push(
        ...glowParts([p[0] - w * 0.02, p[1] - h * 0.20, 0], stCol, 0.055),
        textAt(outcomeWord(d), P ? 16 : 16, stCol, [p[0] + w * 0.25, p[1] - h * 0.20, 0], { bold: true }),
      );
    } else {
      parts.push(
        textAt('? (hidden)', 16, C.amber, [p[0] + w * 0.18, p[1] - h * 0.20, 0], { bold: true, maxWidth: w * 0.56 }),
      );
    }
    return new M.VGroup(...parts);
  }

  const aliTrainFrame = splitFrame(ALI_TRAIN_BOX, C.cyan, 'ALI IN TRAINING · 5 CARDS', false);
  const aliTestFrame = splitFrame(ALI_TEST_BOX, C.amber, 'LOCKED TEST · ALI', true);
  const aliTrainCards = ALI_TRAIN.map((d, i) => aliCard(d, aliTrainSlot(i), ALI_CARD_W, ALI_CARD_H, { nameHighlight: true }));
  const aliMayPos = P ? [0, -2.35, 0] : [4.75, -0.14, 0];
  const aliMayW = P ? 3.50 : 2.90;
  const aliMayH = P ? 1.24 : 1.38;
  let aliMayCard = aliCard(ALI_TEST, aliMayPos, aliMayW, aliMayH, { showOutcome: false });

  // Beat 8: "Imagine a rule can recognise Ali by name on the training cards."
  await until(S(8));
  await play(
    ...picture(aliTrainFrame, aliTestFrame, ...aliTrainCards, aliMayCard),
    ...fbox([
      ['SHORTCUT BY NAME', CUSTOMER_COLOR.Ali],
      'Suppose a rule recognises "Ali" on his 5 training cards.',
    ], CUSTOMER_COLOR.Ali),
    ...say('SUPPOSE A RULE RECOGNISES "ALI"', CUSTOMER_COLOR.Ali),
  );

  // Beat 9: "All five of those training cards say Ali stayed."
  const stayOutlines = ALI_TRAIN.map((_, i) =>
    rect(ALI_CARD_W + 0.09, ALI_CARD_H + 0.09, aliTrainSlot(i), C.cyan, C.cyan, 0, 2.8, 0.14)
  );
  const allStayBadge = tagAt('5 OF 5 TRAINING CARDS: STAY', C.cyan, [0, BADGE_Y, 0], 16);

  await until(S(9));
  await play(
    ...marks(...stayOutlines, allStayBadge),
    ...fbox([
      ['ALI’S TRAINING RECORD', C.cyan],
      'Jan, Feb, Mar, Apr, Jun — all 5 say STAY.',
    ], C.cyan),
    ...say('ALL 5 TRAINING CARDS SAY STAY', C.cyan),
  );

  // Beat 10: "A rule could remember Ali and guess stay on his May card."
  const memArrow = arrow(
    P ? [0, 0.18, 0] : [0.92, -0.36, 0],
    P ? [0, -1.06, 0] : [2.66, -0.36, 0],
    C.violet,
    3,
  );
  const memLabel = tagAt(
    'REMEMBER ALI → STAY',
    C.violet,
    P ? [0, -0.44, 0] : [1.78, 0.22, 0],
    15,
  );
  const guessBadge = tagAt(
    'GUESS: STAY',
    C.violet,
    P ? [0, BADGE_Y, 0] : [4.75, -1.32, 0],
    16,
  );

  await until(S(10));
  await play(
    ...marks(memArrow, memLabel, guessBadge),
    ...fbox([
      ['MEMORISING THE NAME', C.violet],
      'Sees "Ali" on May card → guesses STAY.',
    ], C.violet),
    ...say('REMEMBER ALI → GUESS STAY', C.violet),
  );

  // Beat 11: "That guess gets Ali right."
  const aliMayRevealed = aliCard(ALI_TEST, aliMayPos, aliMayW, aliMayH, { showOutcome: true, outcomeHighlight: true });
  const rightBadge = tagAt(
    'ACTUAL: STAY · RIGHT ✓',
    C.green,
    P ? [0, BADGE_Y, 0] : [4.75, -1.32, 0],
    16,
  );

  await until(S(11));
  await play(
    new M.FadeOut(aliMayCard, { runTime: 0.25 }),
    new M.FadeIn(aliMayRevealed, { runTime: 0.35 }),
    ...marks(memArrow, rightBadge),
    ...fbox([
      ['ALI MAY (21 HOURS)', C.green],
      'Guess: STAY  ·  Actual: STAY  →  RIGHT ✓',
    ], C.green),
    ...say('THAT GUESS GETS ALI RIGHT ✓', C.green),
  );
  pictureNow = pictureNow.map(o => (o === aliMayCard ? aliMayRevealed : o));
  aliMayCard = aliMayRevealed;

  // Beat 12: "We still need to check what the rule does for someone new."
  const familiarPanel = introCard(
    P ? [0, 1.75, 0] : [-3.25, -0.25, 0],
    'FAMILIAR: ALI',
    C.muted,
    [['Seen 5 times in training', C.ink], ['Memory works here ✓', C.muted]],
    false,
  );
  const newPanel = introCard(
    P ? [0, -1.80, 0] : [3.25, -0.25, 0],
    'SOMEONE NEW',
    C.amber,
    ['0 cards in training', 'What will the rule do?'],
    true,
  );

  await until(S(12));
  await play(
    ...picture(familiarPanel, newPanel),
    ...fbox([
      ['STILL UNANSWERED', C.amber],
      'We need to test on customers the rule has never met.',
    ], C.amber),
    ...say('WHAT ABOUT SOMEONE NEW?', C.amber),
  );

  // ============================================================
  // ACT 3: GROUPING & MAKING THE GROUP SPLIT (Beats 13–24)
  // ============================================================

  // Beats 13–14: Folder metaphor (Ali's 6 actual renewal cards inside one folder)
  function aliFolderPicture() {
    const fw = P ? 7.00 : 11.40;
    const fh = P ? 5.20 : 2.58;
    const fy = P ? 0.10 : -0.40;
    const tabW = P ? 2.65 : 2.80;
    const tabH = 0.46;
    const tabX = -fw / 2 + tabW / 2 + 0.16;
    const tabY = fy + fh / 2 + tabH / 2 - 0.04;

    const parts = [
      rect(tabW, tabH, [tabX, tabY, 0], CUSTOMER_COLOR.Ali, C.card, 0.96, 2.2, 0.10),
      textAt('ALI · 6 CARDS', 17, CUSTOMER_COLOR.Ali, [tabX, tabY, 0], { bold: true }),
      rect(fw, fh, [0, fy, 0], CUSTOMER_COLOR.Ali, C.card, 0.94, 2.5, 0.16),
    ];

    const cw = P ? 3.05 : 1.66;
    const ch = P ? 1.24 : 1.48;
    GROUPED.Ali.forEach((d, i) => {
      const p = P
        ? [(i % 2 === 0 ? -1.68 : 1.68), fy + 1.56 - Math.floor(i / 2) * 1.56, 0]
        : [(i - 2.5) * 1.82, fy - 0.08, 0];
      parts.push(
        rect(cw, ch, p, CUSTOMER_COLOR.Ali, C.bg, 0.92, 1.8, 0.10),
        textAt(`${d.name} ${d.month}`, P ? 18 : 17, CUSTOMER_COLOR.Ali, [p[0], p[1] + ch * 0.26, 0], { bold: true }),
        textAt(`${d.hours}h`, P ? 18 : 17, C.ink, [p[0], p[1] - 0.02, 0], { mono: true, bold: true }),
        ...glowParts([p[0] - 0.42, p[1] - ch * 0.30, 0], C.cyan, 0.05),
        textAt('STAY', 15, C.cyan, [p[0] + 0.16, p[1] - ch * 0.30, 0], { bold: true }),
      );
    });
    return new M.VGroup(...parts);
  }

  const folderPic = aliFolderPicture();
  const folderTag = tagAt('ONE PERSON = ONE FOLDER', CUSTOMER_COLOR.Ali, [0, BADGE_Y, 0], 16);

  // Beat 13: "So let's keep each person's cards together, like pages in the same folder."
  await until(S(13));
  await play(
    ...picture(folderPic),
    ...marks(folderTag),
    ...fbox([
      ['KEEP CARDS TOGETHER', CUSTOMER_COLOR.Ali],
      'Each person’s renewals stay together like pages in a folder.',
    ], CUSTOMER_COLOR.Ali),
    ...say('KEEP EACH PERSON’S CARDS IN ONE FOLDER', CUSTOMER_COLOR.Ali),
  );

  // Beat 14: "All the renewal cards for one customer make up one group."
  const groupRing = rect(
    P ? 7.22 : 11.64,
    P ? 5.42 : 2.80,
    [0, P ? 0.10 : -0.40, 0],
    C.green,
    C.green,
    0,
    3,
    0.18,
  );
  const oneGroupTag = tagAt('ALL CARDS FOR ONE CUSTOMER = 1 GROUP', C.green, [0, BADGE_Y, 0], 16);

  await until(S(14));
  await play(
    ...marks(groupRing, oneGroupTag),
    ...fbox([
      ['WHAT IS A GROUP?', C.green],
      'All renewal cards for one customer make up one group.',
    ], C.green),
    ...say('ONE CUSTOMER = ONE GROUP', C.green),
  );

  // ------------------------------------------------------------
  // Six customer bundles (FLAT VGroups so Transform moves every
  // shape and every text together with zero detachment)
  // ------------------------------------------------------------

  const GW = P ? 3.42 : 2.86;
  const GH = P ? 1.92 : 1.44;
  const MINI_W = P ? 1.02 : 0.84;
  const MINI_H = P ? 0.62 : 0.45;
  const MINI_SPX = P ? 1.09 : 0.91;
  const MINI_SPY = P ? 0.70 : 0.50;

  function bundle(name, center) {
    const records = GROUPED[name];
    const col = CUSTOMER_COLOR[name];
    const parts = [
      rect(GW, GH, center, col, C.card, 0.94, 2.3, 0.12),
      textAt(name, P ? 18 : 18, col, [center[0] - GW * 0.25, center[1] + GH / 2 - 0.22, 0], {
        bold: true,
        maxWidth: GW * 0.46,
      }),
      textAt(
        `${records.length} card${records.length === 1 ? '' : 's'}`,
        15,
        col,
        [center[0] + GW * 0.25, center[1] + GH / 2 - 0.22, 0],
        { mono: true, bold: true, maxWidth: GW * 0.46 },
      ),
    ];

    const rows = Math.ceil(records.length / 3);
    records.forEach((d, i) => {
      const row = Math.floor(i / 3);
      const colIdx = i % 3;
      const inRow = Math.min(3, records.length - row * 3);
      const x = center[0] + (colIdx - (inRow - 1) / 2) * MINI_SPX;
      const y = (center[1] - (P ? 0.22 : 0.16)) + ((rows - 1) / 2 - row) * MINI_SPY;
      const stCol = outcomeColor(d);

      parts.push(
        rect(MINI_W, MINI_H, [x, y, 0], col, C.bg, 0.94, 1.5, 0.08),
        textAt(d.month, P ? 17 : 15, C.ink, [x - 0.04, y + MINI_H * 0.22, 0], { mono: true, bold: true }),
        textAt(`${d.hours}h`, P ? 16 : 15, P ? C.ink : C.muted, [x - MINI_W * 0.16, y - MINI_H * 0.23, 0], { mono: true }),
        ...glowParts([x + MINI_W * 0.30, y - MINI_H * 0.23, 0], stCol, P ? 0.048 : 0.042),
      );
    });

    return new M.VGroup(...parts);
  }

  function initialBundlePos(name) {
    if (P) {
      const map = {
        Ali:   [-1.82,  2.20, 0],
        Bea:   [ 1.82,  2.20, 0],
        Dina:  [-1.82, -0.05, 0],
        Eli:   [ 1.82, -0.05, 0],
        Chen:  [-1.82, -2.30, 0],
        Farah: [ 1.82, -2.30, 0],
      };
      return map[name];
    }
    const map = {
      Ali:   [-3.55,  0.42, 0],
      Bea:   [ 0.00,  0.42, 0],
      Chen:  [ 3.55,  0.42, 0],
      Dina:  [-3.55, -1.14, 0],
      Eli:   [ 0.00, -1.14, 0],
      Farah: [ 3.55, -1.14, 0],
    };
    return map[name];
  }

  function stage18BundlePos(name) {
    if (P) {
      const map = {
        Ali:   [-1.82,  2.20, 0],
        Bea:   [ 1.82,  2.20, 0],
        Dina:  [-1.82,  0.12, 0],
        Eli:   [ 1.82,  0.12, 0],
        Chen:  [-1.82, -2.92, 0],
        Farah: [ 1.82, -2.30, 0],
      };
      return map[name];
    }
    const map = {
      Ali:   [-5.05,  0.42, 0],
      Bea:   [-1.95,  0.42, 0],
      Dina:  [-5.05, -1.14, 0],
      Eli:   [-1.95, -1.14, 0],
      Chen:  [ 4.80,  0.42, 0],
      Farah: [ 1.15, -1.14, 0],
    };
    return map[name];
  }

  function finalBundlePos(name) {
    if (P) {
      const map = {
        Ali:   [-1.82,  2.20, 0],
        Bea:   [ 1.82,  2.20, 0],
        Dina:  [-1.82,  0.12, 0],
        Eli:   [ 1.82,  0.12, 0],
        Chen:  [-1.82, -2.92, 0],
        Farah: [ 1.82, -2.92, 0],
      };
      return map[name];
    }
    const map = {
      Ali:   [-5.05,  0.42, 0],
      Bea:   [-1.95,  0.42, 0],
      Dina:  [-5.05, -1.14, 0],
      Eli:   [-1.95, -1.14, 0],
      Chen:  [ 4.80,  0.42, 0],
      Farah: [ 4.80, -1.14, 0],
    };
    return map[name];
  }

  const G_TRAIN_SPEC = P
    ? { x: 0,     y: 1.16,  w: 7.36, h: 4.30 }
    : { x: -3.50, y: -0.36, w: 6.32, h: 3.16 };

  const G_TEST_SPEC = P
    ? { x: 0,    y: -2.92, w: 7.36, h: 2.12 }
    : { x: 4.80, y: -0.36, w: 3.96, h: 3.16 };

  const groupHeading = textAt('Six customer groups', P ? 20 : 19, C.ink, [0, P ? 3.52 : 1.44, 0], { bold: true });
  const bundles = new Map();
  const bundlePos = new Map();
  CUSTOMERS.forEach(name => {
    const p = initialBundlePos(name);
    bundles.set(name, bundle(name, p));
    bundlePos.set(name, p);
  });

  function bundleOutline(name, color = CUSTOMER_COLOR[name]) {
    const p = bundlePos.get(name);
    return rect(GW + 0.10, GH + 0.10, p, color, color, 0, 3.0, 0.14);
  }

  // Beat 15: "Push the cards with each name into their own group."
  await until(S(15));
  await play(
    ...picture(groupHeading, ...bundles.values()),
    ...fbox([
      ['SIX CUSTOMER GROUPS', C.violet],
      'Ali 6  ·  Bea 3  ·  Chen 4  ·  Farah 1  ·  Dina 4  ·  Eli 2',
    ], C.violet),
    ...say('GROUP CARDS BY CUSTOMER NAME', C.violet),
  );

  // Beat 16: "Ali's group has six cards."
  await until(S(16));
  await play(
    ...marks(bundleOutline('Ali')),
    ...fbox([
      ['ALI’S GROUP', CUSTOMER_COLOR.Ali],
      '6 renewal cards — all stay together.',
    ], CUSTOMER_COLOR.Ali),
    ...say('ALI’S GROUP HAS 6 CARDS', CUSTOMER_COLOR.Ali),
  );

  // Beat 17: "Farah's group has one card."
  await until(S(17));
  await play(
    ...marks(bundleOutline('Farah')),
    ...fbox([
      ['FARAH’S GROUP', CUSTOMER_COLOR.Farah],
      '1 renewal card — group sizes can differ.',
    ], CUSTOMER_COLOR.Farah),
    ...say('FARAH’S GROUP HAS 1 CARD', CUSTOMER_COLOR.Farah),
  );

  // Beat 18: "Move all four of Chen's cards into a new test box."
  let gTestFrame = splitFrame(G_TEST_SPEC, C.amber, 'LOCKED TEST', true);
  const move18 = [];
  CUSTOMERS.forEach(name => {
    const from = bundlePos.get(name);
    const to = stage18BundlePos(name);
    if (Math.abs(from[0] - to[0]) > 0.001 || Math.abs(from[1] - to[1]) > 0.001) {
      move18.push(new M.Transform(bundles.get(name), bundle(name, to), { runTime: 0.95 }));
      bundlePos.set(name, to);
    }
  });

  await until(S(18));
  await play(
    ...marks(),
    new M.FadeOut(groupHeading, { runTime: 0.25 }),
    new M.FadeIn(gTestFrame, { runTime: 0.40 }),
    ...move18,
    ...fbox([
      ['NEW TEST BOX', C.amber],
      ['All 4 of Chen’s cards move in together.', CUSTOMER_COLOR.Chen],
    ], C.amber),
    ...say('MOVE ALL 4 OF CHEN’S CARDS TO TEST', CUSTOMER_COLOR.Chen),
  );
  pictureNow = [gTestFrame, ...bundles.values()];

  // Beat 19: "Add Farah's one card to the same box."
  const farahTarget = finalBundlePos('Farah');
  bundlePos.set('Farah', farahTarget);

  await until(S(19));
  await play(
    new M.Transform(bundles.get('Farah'), bundle('Farah', farahTarget), { runTime: 0.85 }),
    ...fbox([
      ['NEW TEST BOX', C.amber],
      ['Add Farah’s 1 card alongside Chen.', CUSTOMER_COLOR.Farah],
    ], C.amber),
    ...say('ADD FARAH’S 1 CARD TO TEST', CUSTOMER_COLOR.Farah),
  );

  // Beat 20: "That's five test cards from two customers."
  const gTestFrameFull = splitFrame(G_TEST_SPEC, C.amber, 'LOCKED TEST · 2 CUSTOMERS · 5 CARDS', true);

  await until(S(20));
  await play(
    new M.FadeOut(gTestFrame, { runTime: 0.25 }),
    new M.FadeIn(gTestFrameFull, { runTime: 0.35 }),
    ...marks(bundleOutline('Chen', C.amber), bundleOutline('Farah', C.amber)),
    ...fbox([
      ['LOCKED TEST TOTAL', C.amber],
      'Chen (4) + Farah (1) = 5 test cards · 2 customers',
    ], C.amber),
    ...say('5 TEST CARDS FROM 2 CUSTOMERS', C.amber),
  );
  pictureNow = pictureNow.map(o => (o === gTestFrame ? gTestFrameFull : o));
  gTestFrame = gTestFrameFull;

  // Beat 21: "Leave Ali, Bea, Dina, and Eli on the training side."
  let gTrainFrame = splitFrame(G_TRAIN_SPEC, C.cyan, 'TRAINING · 4 CUSTOMERS', false);

  await until(S(21));
  await play(
    new M.FadeIn(gTrainFrame, { runTime: 0.40 }),
    ...marks(
      bundleOutline('Ali', C.cyan),
      bundleOutline('Bea', C.cyan),
      bundleOutline('Dina', C.cyan),
      bundleOutline('Eli', C.cyan),
    ),
    ...fbox([
      ['TRAINING SIDE', C.cyan],
      '4 customers stay in training: Ali, Bea, Dina, Eli.',
    ], C.cyan),
    ...say('LEAVE ALI, BEA, DINA, ELI IN TRAINING', C.cyan),
  );
  pictureNow.push(gTrainFrame);

  // Beat 22: "Together they have fifteen cards."
  const gTrainFrameFull = splitFrame(G_TRAIN_SPEC, C.cyan, 'TRAINING · 4 CUSTOMERS · 15 CARDS', false);

  await until(S(22));
  await play(
    new M.FadeOut(gTrainFrame, { runTime: 0.25 }),
    new M.FadeIn(gTrainFrameFull, { runTime: 0.35 }),
    ...fbox([
      ['TRAINING TOTAL', C.cyan],
      '6 + 3 + 4 + 2 = 15 training cards',
    ], C.cyan),
    ...say('15 TRAINING CARDS TOTAL', C.cyan),
  );
  pictureNow = pictureNow.map(o => (o === gTrainFrame ? gTrainFrameFull : o));
  gTrainFrame = gTrainFrameFull;

  // Beat 23: "Check the names again and see that each name appears on only one side."
  function groupSepLine() {
    return P
      ? dash([-3.68, -1.26, 0], [3.68, -1.26, 0], C.green)
      : dash([1.24, -1.94, 0], [1.24, 1.22, 0], C.green);
  }
  const zeroOverlapBadge = () => tagAt('ZERO SHARED CUSTOMERS', C.green, [0, BADGE_Y, 0], 16);

  await until(S(23));
  await play(
    ...marks(groupSepLine(), zeroOverlapBadge()),
    ...fbox([
      ['ZERO OVERLAP', C.green],
      'Train: Ali, Bea, Dina, Eli  |  Test: Chen, Farah',
    ], C.green),
    ...say('EACH NAME ON ONE SIDE ONLY', C.green),
  );

  // Beat 24: "Keeping each group on one side is called a group split."
  await until(S(24));
  await play(
    ...marks(groupSepLine(), tagAt('GROUP SPLIT · 0 SHARED CUSTOMERS', C.green, [0, BADGE_Y, 0], 16)),
    ...fbox([
      ['GROUP SPLIT', C.green],
      'Every customer’s cards stay together on one side.',
    ], C.green),
    ...say('THIS IS CALLED A GROUP SPLIT', C.green),
  );

  // ============================================================
  // ACT 4: SCORING THE RULE ON THE GROUP TEST (Beats 25–34)
  // ============================================================

  const SC_W = P ? 3.45 : 2.18;
  const SC_H = P ? 1.62 : 2.02;

  function scoreCardPos(d) {
    const k = id(d);
    if (P) {
      const map = {
        'Chen-Jan':  [-1.85,  1.16, 0],
        'Chen-Feb':  [ 1.85,  1.16, 0],
        'Chen-Mar':  [-1.85, -0.70, 0],
        'Chen-Apr':  [ 1.85, -0.70, 0],
        'Farah-Feb': [ 0.00, -2.56, 0],
      };
      return map[k];
    }
    const map = {
      'Chen-Jan':  [-5.18, -0.52, 0],
      'Chen-Feb':  [-2.78, -0.52, 0],
      'Chen-Mar':  [-0.38, -0.52, 0],
      'Chen-Apr':  [ 2.02, -0.52, 0],
      'Farah-Feb': [ 5.02, -0.52, 0],
    };
    return map[k];
  }

  function makeScoreCardShell(d) {
    const p = scoreCardPos(d);
    const col = CUSTOMER_COLOR[d.name];
    const parts = [
      rect(SC_W, SC_H, p, col, C.card, 0.95, 2.2, 0.14),
      block(0.07, SC_H * 0.78, [p[0] - SC_W / 2 + 0.09, p[1], 0], col, 0.95),
      textAt(`${d.name} ${d.month}`, P ? 19 : 18, col, [p[0] + 0.04, p[1] + SC_H * 0.34, 0], {
        bold: true,
        maxWidth: SC_W - 0.32,
      }),
      textAt(`${d.hours} hour${d.hours === 1 ? '' : 's'}`, P ? 21 : 21, C.ink, [p[0] + 0.04, p[1] + SC_H * 0.08, 0], {
        mono: true,
        bold: true,
        maxWidth: SC_W - 0.32,
      }),
      line(
        [p[0] - SC_W / 2 + 0.22, p[1] - SC_H * 0.08, 0],
        [p[0] + SC_W / 2 - 0.18, p[1] - SC_H * 0.08, 0],
        C.grid,
        1.5,
      ),
    ];
    return new M.VGroup(...parts);
  }

  function guessLabel(d, text, color) {
    const p = scoreCardPos(d);
    return textAt(text, P ? 16 : 15, color, [p[0] + 0.04, p[1] - SC_H * 0.22, 0], {
      bold: true,
      maxWidth: SC_W - 0.28,
    });
  }

  function actualLabel(d, text, color) {
    const p = scoreCardPos(d);
    return textAt(text, P ? 16 : 15, color, [p[0] + 0.04, p[1] - SC_H * 0.38, 0], {
      bold: true,
      maxWidth: SC_W - 0.28,
    });
  }

  function scoreCardOutline(d, color) {
    const p = scoreCardPos(d);
    return rect(SC_W + 0.10, SC_H + 0.10, p, color, color, 0, 3.0, 0.16);
  }

  const rulePill = tagAt(
    'RULE: < 5h → CANCEL · ≥ 5h → STAY',
    C.amber,
    P ? [0, 3.30, 0] : [-1.75, 1.28, 0],
    P ? 16 : 17,
  );
  const scorePillPos = P ? [0, 2.56, 0] : [4.55, 1.28, 0];
  const scorePill = tagAt('SCORE: 0 / 5', C.muted, scorePillPos, 18);

  const scoreHeaders = P ? [] : [
    textAt('CHEN (4 CARDS)', 15, CUSTOMER_COLOR.Chen, [-1.58, 0.76, 0], { bold: true }),
    textAt('FARAH (1 CARD)', 15, CUSTOMER_COLOR.Farah, [5.02, 0.76, 0], { bold: true }),
  ];

  const cardShells = GROUP_TEST.map(makeScoreCardShell);
  const guessNow = new Map();
  const actualNow = new Map();
  GROUP_TEST.forEach(d => {
    guessNow.set(id(d), guessLabel(d, 'Guess: —', C.muted));
    actualNow.set(id(d), actualLabel(d, 'Actual: hidden', C.muted));
  });

  function setCardText(map, d, nextObj) {
    const k = id(d);
    const oldObj = map.get(k);
    map.set(k, nextObj);
    pictureNow = pictureNow.map(o => (o === oldObj ? nextObj : o));
    return [new M.FadeOut(oldObj, { runTime: 0.22 }), new M.FadeIn(nextObj, { runTime: 0.30 })];
  }

  // Beat 25: "Use the rule that guesses cancel below five hours and stay otherwise."
  await until(S(25));
  await play(
    ...picture(rulePill, scorePill, ...scoreHeaders, ...cardShells, ...guessNow.values(), ...actualNow.values()),
    ...fbox([
      ['TEST THE CUTOFF-5 RULE', C.amber],
      'Below 5 hours → CANCEL   |   5+ hours → STAY',
    ], C.amber),
    ...say('RULE: < 5 HOURS → CANCEL, ELSE STAY', C.amber),
  );

  // Beat 26: "Chen's April card shows three hours, so the rule guesses cancel."
  const chenApr = findCard('Chen', 'Apr');

  await until(S(26));
  await play(
    ...marks(scoreCardOutline(chenApr, C.amber)),
    ...setCardText(guessNow, chenApr, guessLabel(chenApr, 'Guess: CANCEL', PINK)),
    ...fbox([
      ['CHEN APRIL · 3 HOURS', CUSTOMER_COLOR.Chen],
      '3 < 5 hours  →  rule guesses CANCEL',
    ], PINK),
    ...say('CHEN APR (3h) → GUESS CANCEL', PINK),
  );

  // Beat 27: "Chen cancelled, so that guess is right."
  await until(S(27));
  await play(
    ...marks(scoreCardOutline(chenApr, C.green)),
    ...setCardText(actualNow, chenApr, actualLabel(chenApr, 'Actual: CANCEL ✓', C.green)),
    new M.Transform(scorePill, tagAt('SCORE: 1 / 5', C.green, scorePillPos, 18), { runTime: 0.42 }),
    ...fbox([
      ['CHEN APRIL · RIGHT ✓', C.green],
      'Chen cancelled  →  guess is right! (1 / 5)',
    ], C.green),
    ...say('CHEN CANCELLED — RIGHT ✓ (1 / 5)', C.green),
  );

  // Beat 28: "Chen played at least five hours on each of his other three cards."
  const chenOther = [findCard('Chen', 'Jan'), findCard('Chen', 'Feb'), findCard('Chen', 'Mar')];

  await until(S(28));
  await play(
    ...marks(...chenOther.map(d => scoreCardOutline(d, C.cyan))),
    ...fbox([
      ['CHEN’S OTHER 3 CARDS', C.cyan],
      'Jan 15h  ·  Feb 10h  ·  Mar 7h — all ≥ 5 hours',
    ], C.cyan),
    ...say('CHEN’S OTHER 3 CARDS: 15h, 10h, 7h', C.cyan),
  );

  // Beat 29: "The rule guesses stay on those three cards, and Chen stayed each time."
  const chenOtherUpdates = chenOther.flatMap(d => [
    ...setCardText(guessNow, d, guessLabel(d, 'Guess: STAY', C.cyan)),
    ...setCardText(actualNow, d, actualLabel(d, 'Actual: STAY ✓', C.green)),
  ]);

  await until(S(29));
  await play(
    ...marks(...chenOther.map(d => scoreCardOutline(d, C.green))),
    ...chenOtherUpdates,
    new M.Transform(scorePill, tagAt('SCORE: 4 / 5', C.green, scorePillPos, 18), { runTime: 0.45 }),
    ...fbox([
      ['CHEN OTHER 3 CARDS · ALL RIGHT ✓', C.green],
      'Guess: STAY · Actual: STAY × 3  (Score: 4 / 5)',
    ], C.green),
    ...say('GUESS STAY · CHEN STAYED × 3 (4 / 5)', C.green),
  );

  // Beat 30: "Farah played one hour before her February renewal."
  const farahFeb = findCard('Farah', 'Feb');

  await until(S(30));
  await play(
    ...marks(scoreCardOutline(farahFeb, C.amber)),
    ...fbox([
      ['FARAH FEBRUARY · 1 HOUR', CUSTOMER_COLOR.Farah],
      '1 hour played before renewal (< 5 hours)',
    ], CUSTOMER_COLOR.Farah),
    ...say('FARAH PLAYED 1 HOUR', CUSTOMER_COLOR.Farah),
  );

  // Beat 31: "The rule guesses cancel, and Farah cancelled."
  await until(S(31));
  await play(
    ...marks(scoreCardOutline(farahFeb, C.green)),
    ...setCardText(guessNow, farahFeb, guessLabel(farahFeb, 'Guess: CANCEL', PINK)),
    ...setCardText(actualNow, farahFeb, actualLabel(farahFeb, 'Actual: CANCEL ✓', C.green)),
    new M.Transform(scorePill, tagAt('SCORE: 5 / 5', C.green, scorePillPos, 18), { runTime: 0.45 }),
    ...fbox([
      ['FARAH FEBRUARY · RIGHT ✓', C.green],
      'Guess: CANCEL  ·  Actual: CANCEL  →  RIGHT ✓',
    ], C.green),
    ...say('FARAH CANCELLED — RIGHT ✓ (5 / 5)', C.green),
  );

  // Beat 32: "That’s five out of five on this small group test."
  const allFiveGreen = GROUP_TEST.map(d => scoreCardOutline(d, C.green));
  const fiveOfFiveBadge = tagAt('5 OUT OF 5 RIGHT = 100%', C.green, [0, BADGE_Y, 0], 17);

  await until(S(32));
  await play(
    ...marks(...allFiveGreen, fiveOfFiveBadge),
    ...fbox([
      ['GROUP TEST SCORE: 5 / 5', C.green],
      'Chen 4 / 4  +  Farah 1 / 1  =  5 out of 5',
    ], C.green),
    ...say('5 OUT OF 5 ON THIS GROUP TEST', C.green),
  );

  // Beat 33: "Those five cards cover only two customers."
  const chenGroupBox = P
    ? rect(7.36, 3.68, [0, 0.23, 0], C.amber, C.amber, 0, 3, 0.16)
    : rect(9.60, 2.24, [-1.58, -0.52, 0], C.amber, C.amber, 0, 3, 0.16);
  const farahGroupBox = P
    ? rect(3.72, 1.84, [0, -2.56, 0], C.amber, C.amber, 0, 3, 0.16)
    : rect(2.40, 2.24, [5.02, -0.52, 0], C.amber, C.amber, 0, 3, 0.16);
  const twoCustBadge = tagAt('ONLY 2 CUSTOMERS: CHEN & FARAH', C.amber, [0, BADGE_Y, 0], 16);

  await until(S(33));
  await play(
    ...marks(chenGroupBox, farahGroupBox, twoCustBadge),
    ...fbox([
      ['CAREFUL: SMALL SAMPLE', C.amber],
      '5 test cards, but they come from only 2 customers.',
    ], C.amber),
    ...say('ONLY 2 CUSTOMERS IN THIS TEST', C.amber),
  );

  // Beat 34: "The score can change a lot if we test on other customers."
  // Compare two real 2-customer group tests from chapters/12.1.md:
  //   Chen + Farah: 5 / 5 = 100%
  //   Dina + Eli:   4 / 6 = 67% (misses: Dina Mar 3h stayed, Eli Jun 6h cancelled)
  function swingPanel(p, title, results, scoreText, noteText, color) {
    const w = P ? 7.10 : 6.05;
    const h = P ? 2.85 : 2.95;
    const parts = [
      rect(w, h, p, color, C.card, 0.95, 2.3, 0.16),
      textAt(title, P ? 18 : 18, color, [p[0], p[1] + h / 2 - 0.36, 0], { bold: true, maxWidth: w - 0.40 }),
    ];
    const n = results.length;
    const tileW = Math.min(0.92, (w - 0.80) / n - 0.10);
    const pitch = tileW + 0.10;
    const tileY = p[1] + 0.24;
    results.forEach((ok, i) => {
      const tx = p[0] + (i - (n - 1) / 2) * pitch;
      const tc = ok ? C.green : PINK;
      parts.push(
        rect(tileW, 0.50, [tx, tileY, 0], tc, tc, ok ? 0.22 : 0.16, 2, 0.08),
        textAt(ok ? '✓' : '×', 20, tc, [tx, tileY, 0], { bold: true }),
      );
    });
    parts.push(
      textAt(scoreText, P ? 24 : 24, color, [p[0], p[1] - 0.48, 0], { mono: true, bold: true }),
      textAt(noteText, P ? 15 : 15, C.muted, [p[0], p[1] - 1.02, 0], { maxWidth: w - 0.40 }),
    );
    return new M.VGroup(...parts);
  }

  const swingLeft = swingPanel(
    P ? [0, 1.65, 0] : [-3.35, -0.25, 0],
    'TEST: CHEN + FARAH (2 CUSTOMERS)',
    [true, true, true, true, true],
    '5 / 5 = 100%',
    'All 5 predictions right',
    C.green,
  );
  const swingRight = swingPanel(
    P ? [0, -1.75, 0] : [3.35, -0.25, 0],
    'TEST: DINA + ELI (2 CUSTOMERS)',
    [false, true, true, true, true, false],
    '4 / 6 = 67%',
    'Misses: Dina Mar (3h), Eli Jun (6h)',
    PINK,
  );
  const swingBadge = tagAt('SAME RULE · SCORE SWINGS BY 33 POINTS', PINK, [0, BADGE_Y, 0], 16);

  await until(S(34));
  await play(
    ...picture(swingLeft, swingRight),
    ...marks(swingBadge),
    ...fbox([
      ['SMALL TESTS SWING A LOT', PINK],
      'Testing on other customers can change the score sharply.',
    ], PINK),
    ...say('SCORE CAN CHANGE ON OTHER CUSTOMERS', PINK),
  );

  // ============================================================
  // ACT 5: TAKEAWAY, TRAP & GOLDEN RULE (Beats 35–37)
  // ============================================================

  function completedGroupSplitObjects() {
    const trainF = splitFrame(G_TRAIN_SPEC, C.cyan, 'TRAINING · 4 CUSTOMERS · 15 CARDS', false);
    const testF = splitFrame(G_TEST_SPEC, C.amber, 'LOCKED TEST · 2 CUSTOMERS · 5 CARDS', true);
    const bs = CUSTOMERS.map(name => bundle(name, finalBundlePos(name)));
    return [trainF, testF, ...bs];
  }

  // Beat 35: "A group split lets you check how the rule works for customers it never saw during learning."
  await until(S(35));
  await play(
    ...picture(...completedGroupSplitObjects()),
    ...marks(groupSepLine(), zeroOverlapBadge()),
    ...fbox([
      ['WHY USE A GROUP SPLIT?', C.green],
      'Tests the rule on customers never seen during learning.',
    ], C.green),
    ...say('TESTS ON UNSEEN CUSTOMERS', C.green),
  );

  // Beats 36–37: Trap vs Fix comparison
  function trapComparePanel(p, isTrap) {
    const w = P ? 7.10 : 6.05;
    const h = P ? 2.85 : 2.95;
    const col = isTrap ? PINK : C.green;
    const title = isTrap ? 'TRAP: RANDOM CARDS' : 'FIX: GROUP SPLIT';
    const parts = [
      rect(w, h, p, col, C.card, 0.95, 2.3, 0.16),
      textAt(title, P ? 19 : 19, col, [p[0], p[1] + h / 2 - 0.36, 0], { bold: true }),
    ];

    const subW = w * 0.40;
    const subH = 1.24;
    const subY = p[1] + 0.04;
    const lx = p[0] - w * 0.25;
    const rx = p[0] + w * 0.25;

    parts.push(
      rect(subW, subH, [lx, subY, 0], C.cyan, C.bg, 0.92, 1.8, 0.10),
      textAt('TRAINING', 15, C.cyan, [lx, subY + 0.40, 0], { bold: true }),
      rect(subW, subH, [rx, subY, 0], C.amber, C.bg, 0.92, 1.8, 0.10),
      textAt('TEST', 15, C.amber, [rx, subY + 0.40, 0], { bold: true }),
    );

    if (isTrap) {
      parts.push(
        textAt('Ali · Bea · Chen', 15, C.ink, [lx, subY + 0.02, 0], { maxWidth: subW - 0.20 }),
        textAt('Dina · Eli · Farah', 15, C.muted, [lx, subY - 0.34, 0], { maxWidth: subW - 0.20 }),
        textAt('Ali · Bea · Chen', 15, PINK, [rx, subY + 0.02, 0], { bold: true, maxWidth: subW - 0.20 }),
        textAt('Dina · Eli', 15, PINK, [rx, subY - 0.34, 0], { bold: true, maxWidth: subW - 0.20 }),
        dash([lx + subW / 2, subY, 0], [rx - subW / 2, subY, 0], PINK),
        textAt('Same customer on both sides ×', P ? 16 : 16, PINK, [p[0], p[1] - h / 2 + 0.38, 0], { bold: true, maxWidth: w - 0.30 }),
      );
    } else {
      parts.push(
        textAt('Ali · Bea', 15, C.cyan, [lx, subY + 0.02, 0], { bold: true, maxWidth: subW - 0.20 }),
        textAt('Dina · Eli', 15, C.cyan, [lx, subY - 0.34, 0], { bold: true, maxWidth: subW - 0.20 }),
        textAt('Chen (4)', 15, C.green, [rx, subY + 0.02, 0], { bold: true, maxWidth: subW - 0.20 }),
        textAt('Farah (1)', 15, C.green, [rx, subY - 0.34, 0], { bold: true, maxWidth: subW - 0.20 }),
        dash([p[0], subY - subH / 2 - 0.06, 0], [p[0], subY + subH / 2 + 0.06, 0], C.green),
        textAt('All cards for each customer together ✓', P ? 16 : 16, C.green, [p[0], p[1] - h / 2 + 0.38, 0], { bold: true, maxWidth: w - 0.30 }),
      );
    }
    return new M.VGroup(...parts);
  }

  const trapPos = P ? [0, 1.65, 0] : [-3.35, -0.25, 0];
  const fixPos = P ? [0, -1.75, 0] : [3.35, -0.25, 0];
  const trapPanel = trapComparePanel(trapPos, true);
  const fixPanel = trapComparePanel(fixPos, false);
  const cmpOutlineW = (P ? 7.10 : 6.05) + 0.14;
  const cmpOutlineH = (P ? 2.85 : 2.95) + 0.14;

  // Beat 36: "Here's a trap: choosing cards by chance can still put the same person on both sides."
  await until(S(36));
  await play(
    ...picture(trapPanel, fixPanel),
    ...marks(
      rect(cmpOutlineW, cmpOutlineH, trapPos, PINK, PINK, 0, 3.2, 0.18),
      tagAt('TRAP: RANDOM CARDS SPLIT PEOPLE', PINK, [0, BADGE_Y, 0], 16),
    ),
    ...fbox([
      ['THE TRAP', PINK],
      'Picking cards by chance puts the same person on both sides.',
    ], PINK),
    ...say('TRAP: RANDOM CARDS SPLIT CUSTOMERS', PINK),
  );

  // Beat 37: "For a test on unseen customers, move all cards for each customer together."
  await until(S(37));
  await play(
    ...marks(
      rect(cmpOutlineW, cmpOutlineH, fixPos, C.green, C.green, 0, 3.2, 0.18),
      tagAt('MOVE EACH CUSTOMER AS ONE GROUP ✓', C.green, [0, BADGE_Y, 0], 16),
    ),
    ...fbox([
      ['GOLDEN RULE', C.green],
      'For unseen customers, move all cards per customer together.',
    ], C.green),
    ...say('MOVE ALL CARDS PER CUSTOMER TOGETHER', C.green),
  );
}
