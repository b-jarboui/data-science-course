// 12.4.11 Cost-sensitive thresholds — live, narration-synchronised lesson.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  // Fixed chapter 12.4 data (exact)
  const DATA = [
    { id: 'P1',  prob: 90, failed: false },
    { id: 'P2',  prob: 60, failed: true  },
    { id: 'P3',  prob: 60, failed: false },
    { id: 'P4',  prob: 30, failed: true  },
    { id: 'P5',  prob: 30, failed: false },
    { id: 'P6',  prob: 30, failed: false },
    { id: 'P7',  prob: 10, failed: false },
    { id: 'P8',  prob: 10, failed: false },
    { id: 'P9',  prob: 10, failed: false },
    { id: 'P10', prob: 10, failed: false },
    { id: 'P11', prob: 10, failed: false },
    { id: 'P12', prob: 10, failed: false },
  ];
  const IDS = DATA.map((_, i) => i);
  const THRESHOLDS = [100, 90, 60, 30, 10];

  // Shared chapter colours
  const BLUE = '#58A6FF';
  const RED = '#F87171';
  const GREEN = C.green;
  const AMBER = C.amber;

  // Responsive laptop (14.22 x 8) and phone (8 x 14.22) layout
  const CX = P ? 0 : -2.4;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.92, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.35, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Drawing helpers (every part placed with moveTo, fills set with setFill)
  function text(s, size, color, x, y, mono = false, maxw = null) {
    const t = T(s, size, color, mono);
    if (maxw !== null && t.getWidth() > maxw) t.scale(maxw / t.getWidth());
    t.moveTo([x, y, 0]);
    return t;
  }

  const line = (x1, y1, x2, y2, color = C.muted, sw = 2) =>
    new M.Line({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth: sw });

  const dashed = (x1, y1, x2, y2, color = C.muted, sw = 2) =>
    new M.DashedLine({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth: sw });

  function rect(x, y, w, h, color, opacity = 0.2, sw = 2) {
    const r = new M.Rectangle({ width: w, height: h, color, strokeWidth: sw });
    r.setFill(color, opacity);
    r.moveTo([x, y, 0]);
    return r;
  }

  function rounded(x, y, w, h, color = C.muted, fill = C.card, opacity = 0.95, sw = 2, radius = 0.12) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: radius, color, strokeWidth: sw });
    r.setFill(fill, opacity);
    r.moveTo([x, y, 0]);
    return r;
  }

  function circle(x, y, radius, color, opacity = 1, sw = 2) {
    const c = new M.Circle({ radius, color, strokeWidth: sw });
    c.setFill(color, opacity);
    c.moveTo([x, y, 0]);
    return c;
  }

  function arrow(x1, y1, x2, y2, color, head = 0.14, sw = 2.4) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    return new M.VGroup(
      line(x1, y1, x2, y2, color, sw),
      line(x2, y2, x2 + head * Math.cos(a + Math.PI * 0.82), y2 + head * Math.sin(a + Math.PI * 0.82), color, sw),
      line(x2, y2, x2 + head * Math.cos(a - Math.PI * 0.82), y2 + head * Math.sin(a - Math.PI * 0.82), color, sw),
    );
  }

  const fadeIn = objs => objs.filter(Boolean).map(o => new M.FadeIn(o));
  const fadeOut = objs => objs.filter(Boolean).map(o => new M.FadeOut(o));
  const lag = (anims, runTime = 1.1, lagRatio = 0.1) => new M.LaggedStart(anims, { lagRatio, runTime });

  // Single formula box helper (only one on screen at a time)
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20, lh = P ? 0.34 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.38;
    const r = rounded(BOXP[0], BOXP[1], wd, ht, color, C.card, 0.95, 2, 0.18);
    const left = BOXP[0] - wd / 2 + 0.325, top = BOXP[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.0 : 4.15, maxh = P ? 1.36 : 2.60;
    const sc0 = Math.min(1, maxw / wd, maxh / ht);
    if (sc0 < 1) g.scale(sc0);
    g.moveTo(BOXP);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow;
    boxNow = null;
    return [new M.FadeOut(old)];
  }

  // Shared Chapter 12.4 icons
  function pumpIcon(x, y, s = 1, color = C.cyan) {
    const motor = rounded(x - 0.29 * s, y, 0.60 * s, 0.40 * s, color, color, 0.14, 2, 0.07 * s);
    const fins = [-0.47, -0.35, -0.23].map(dx => line(x + dx * s, y - 0.13 * s, x + dx * s, y + 0.13 * s, color, 1.3));
    const housing = circle(x + 0.19 * s, y, 0.27 * s, color, 0.12);
    const inlet = rect(x + 0.51 * s, y, 0.20 * s, 0.15 * s, color, 0.15, 1.5);
    const outlet = rect(x + 0.19 * s, y + 0.36 * s, 0.17 * s, 0.26 * s, color, 0.15, 1.5);
    const hub = circle(x + 0.19 * s, y, 0.06 * s, color, 1, 1);
    const f1 = rect(x - 0.29 * s, y - 0.26 * s, 0.22 * s, 0.10 * s, color, 0.35, 1);
    const f2 = rect(x + 0.19 * s, y - 0.26 * s, 0.22 * s, 0.10 * s, color, 0.35, 1);
    return new M.VGroup(motor, ...fins, housing, inlet, outlet, hub, f1, f2);
  }

  function bellIcon(x, y, s = 1) {
    const r = 0.095 * s;
    const dome = new M.Circle({ radius: r, color: AMBER, strokeWidth: 2 });
    dome.setFill(AMBER, 0);
    dome.moveTo([x, y + 0.035 * s, 0]);
    return new M.VGroup(
      dome,
      line(x - r, y + 0.02 * s, x - 0.12 * s, y - 0.085 * s, AMBER, 2),
      line(x + r, y + 0.02 * s, x + 0.12 * s, y - 0.085 * s, AMBER, 2),
      line(x - 0.135 * s, y - 0.085 * s, x + 0.135 * s, y - 0.085 * s, AMBER, 2.5),
      circle(x, y + 0.14 * s, 0.024 * s, AMBER, 1, 1),
      circle(x, y - 0.135 * s, 0.030 * s, AMBER, 1, 1),
    );
  }

  // Red filled diamond = actual failure
  function failureIcon(x, y, s = 1) {
    const d = new M.Rectangle({ width: 0.17 * s, height: 0.17 * s, color: RED, strokeWidth: 1.5 });
    d.setFill(RED, 1);
    d.rotate(Math.PI / 4);
    d.moveTo([x, y, 0]);
    return d;
  }

  // Green outlined circle = no failure
  function safeIcon(x, y, s = 1) {
    return circle(x, y, 0.11 * s, GREEN, 0, 2.4);
  }

  // Pump card system: parts stay independent scene objects (never re-wrapped)
  const CARD_W = 1.24, CARD_H = 1.08;
  function cardBase(i, x, y, s) {
    return new M.VGroup(
      rounded(x, y, CARD_W * s, CARD_H * s, C.muted, C.card, 0.96, 1.6, 0.10 * s),
      text(DATA[i].id, Math.max(12, Math.round(19 * s)), C.ink, x - 0.17 * s, y + 0.31 * s, true, 0.65 * s),
      pumpIcon(x - 0.18 * s, y - 0.02 * s, 0.45 * s, C.cyan),
      line(x - 0.48 * s, y - 0.22 * s, x + 0.48 * s, y - 0.22 * s, C.muted, 1),
    );
  }

  function chanceLabel(i, x, y, s) {
    return text(`${DATA[i].prob}%`, Math.max(12, Math.round(19 * s)), BLUE, x, y - 0.36 * s, true, 0.80 * s);
  }

  function outcomeMark(i, x, y, s) {
    const xx = x + 0.37 * s, yy = y - 0.05 * s;
    return DATA[i].failed ? failureIcon(xx, yy, s) : safeIcon(xx, yy, s);
  }

  function alertMark(x, y, s) {
    return new M.VGroup(
      rounded(x, y, CARD_W * s + 0.04, CARD_H * s + 0.04, AMBER, AMBER, 0, 2.4, 0.10 * s),
      bellIcon(x + 0.38 * s, y + 0.28 * s, 0.90 * s),
    );
  }

  // Card grid layouts: spacious 4x3 intro, compact upper layout during sweep
  function introCardPos(i) {
    const spx = P ? 1.52 : 1.62, spy = P ? 1.34 : 1.38, top = P ? 0.90 : 0.88;
    return [CX + (i % 4 - 1.5) * spx, top - Math.floor(i / 4) * spy, 0];
  }
  const INTRO_S = P ? 0.96 : 1.04;

  function sweepCardPos(i) {
    if (P) {
      return [(i % 4 - 1.5) * 1.52, 1.22 - Math.floor(i / 4) * 1.14, 0];
    }
    return [CX + (i % 6 - 2.5) * 1.24, 0.96 - Math.floor(i / 6) * 0.94, 0];
  }
  const SWEEP_S = P ? 0.95 : 0.78;

  const cards = DATA.map((_, i) => ({
    i, x: 0, y: 0, s: INTRO_S,
    base: null, chance: null, outcome: null, alert: null,
  }));

  function showCardsIntro() {
    return cards.map((c, i) => {
      const [x, y] = introCardPos(i);
      c.x = x; c.y = y; c.s = INTRO_S;
      c.base = cardBase(i, x, y, c.s);
      return new M.FadeIn(c.base);
    });
  }

  function revealChance(ids) {
    const a = [];
    for (const i of ids) {
      const c = cards[i];
      if (!c.chance) { c.chance = chanceLabel(i, c.x, c.y, c.s); a.push(new M.FadeIn(c.chance)); }
    }
    return a;
  }

  function revealOutcomes(ids) {
    const a = [];
    for (const i of ids) {
      const c = cards[i];
      if (!c.outcome) { c.outcome = outcomeMark(i, c.x, c.y, c.s); a.push(new M.FadeIn(c.outcome)); }
    }
    return a;
  }

  function addAlerts(ids) {
    const a = [];
    for (const i of ids) {
      const c = cards[i];
      if (!c.alert) { c.alert = alertMark(c.x, c.y, c.s); a.push(new M.FadeIn(c.alert)); }
    }
    return a;
  }

  function removeAlerts(ids) {
    const a = [];
    for (const i of ids) {
      const c = cards[i];
      if (c.alert) { a.push(new M.FadeOut(c.alert)); c.alert = null; }
    }
    return a;
  }

  function moveCardsToSweep() {
    const a = [];
    for (const c of cards) {
      const [x, y] = sweepCardPos(c.i), s = SWEEP_S;
      a.push(new M.Transform(c.base, cardBase(c.i, x, y, s), { runTime: 1.0 }));
      if (c.chance) a.push(new M.Transform(c.chance, chanceLabel(c.i, x, y, s), { runTime: 1.0 }));
      if (c.outcome) a.push(new M.Transform(c.outcome, outcomeMark(c.i, x, y, s), { runTime: 1.0 }));
      if (c.alert) a.push(new M.Transform(c.alert, alertMark(x, y, s), { runTime: 1.0 }));
      c.x = x; c.y = y; c.s = s;
    }
    return a;
  }

  function clearAllCards() {
    const a = [];
    for (const c of cards) {
      a.push(...fadeOut([c.base, c.chance, c.outcome, c.alert]));
      c.base = null; c.chance = null; c.outcome = null; c.alert = null;
    }
    return a;
  }

  function respawnSweepCards(alertIds) {
    const a = [];
    for (const c of cards) {
      const [x, y] = sweepCardPos(c.i), s = SWEEP_S;
      c.x = x; c.y = y; c.s = s;
      c.base = cardBase(c.i, x, y, s);
      c.chance = chanceLabel(c.i, x, y, s);
      c.outcome = outcomeMark(c.i, x, y, s);
      c.alert = alertIds.includes(c.i) ? alertMark(x, y, s) : null;
      a.push(...fadeIn([c.base, c.chance, c.outcome, c.alert]));
    }
    return a;
  }

  // Cost-block geometry for the 5 threshold piles
  const PILE_BASE = P ? -4.75 : -2.52;
  const PILE_SP = P ? 1.32 : 1.42;
  const PILE_X = k => CX + (k - 2) * PILE_SP;
  const PITCH = P ? 0.205 : 0.142;
  const BLK_W = P ? 0.84 : 0.76;
  const BLK_H = P ? 0.16 : 0.112;

  function costBlock(x, y, color, w = BLK_W, h = BLK_H) {
    const b = new M.Rectangle({ width: w, height: h, color, strokeWidth: 1.2 });
    b.setFill(color, 0.85);
    b.moveTo([x, y, 0]);
    return b;
  }

  function pileSlot(k, j) {
    return [PILE_X(k), PILE_BASE + (j + 0.5) * PITCH];
  }

  // ============================================================
  // Beats 0–4: Real situation — two mistakes, different costs
  // ============================================================
  const IC_Y = P ? -0.55 : -0.30;
  const IC_DX = P ? 1.78 : 1.85;
  const IC_W = P ? 3.05 : 2.65;
  const IC_H = P ? 2.65 : 2.25;

  const faCard = new M.VGroup(
    rounded(CX - IC_DX, IC_Y, IC_W, IC_H, AMBER, C.card, 0.96, 2.5, 0.16),
    text('FALSE ALARM', P ? 17 : 18, AMBER, CX - IC_DX, IC_Y + IC_H * 0.34, true),
    pumpIcon(CX - IC_DX - 0.18, IC_Y - 0.05, P ? 1.05 : 0.95, C.cyan),
    bellIcon(CX - IC_DX + IC_W * 0.32, IC_Y + IC_H * 0.10, P ? 1.35 : 1.25),
    safeIcon(CX - IC_DX + IC_W * 0.32, IC_Y - IC_H * 0.22, P ? 1.30 : 1.20),
    text('Working well', P ? 16 : 16, GREEN, CX - IC_DX - 0.25, IC_Y - IC_H * 0.34),
  );
  const faSub = text('wastes time & money', P ? 17 : 16, AMBER, CX - IC_DX, IC_Y - IC_H / 2 - 0.38);

  const fnCard = new M.VGroup(
    rounded(CX + IC_DX, IC_Y, IC_W, IC_H, RED, C.card, 0.96, 2.5, 0.16),
    text('MISSED FAILURE', P ? 17 : 18, RED, CX + IC_DX, IC_Y + IC_H * 0.34, true),
    pumpIcon(CX + IC_DX - 0.18, IC_Y - 0.05, P ? 1.05 : 0.95, C.cyan),
    text('no alert', P ? 16 : 14, C.muted, CX + IC_DX + IC_W * 0.30, IC_Y + IC_H * 0.10, true),
    failureIcon(CX + IC_DX + IC_W * 0.32, IC_Y - IC_H * 0.22, P ? 1.35 : 1.25),
    text('Pump fails!', P ? 16 : 16, RED, CX + IC_DX - 0.25, IC_Y - IC_H * 0.34),
  );
  const fnSub = text('emergency repairs', P ? 17 : 16, RED, CX + IC_DX, IC_Y - IC_H / 2 - 0.38);
  const neqMark = text('≠', P ? 42 : 44, C.ink, CX, IC_Y, true);

  await until(S(0));
  await play(new M.FadeIn(faCard), ...say('ALERT ON A WORKING PUMP', AMBER));

  await until(S(1));
  await play(new M.FadeIn(faSub), new M.Indicate(faCard, { color: AMBER, runTime: 0.9 }), ...say('WASTES TIME AND MONEY', AMBER));

  await until(S(2));
  await play(new M.FadeIn(fnCard), new M.FadeIn(fnSub), ...say('MISSED FAILURE: EMERGENCY REPAIRS', RED));

  await until(S(3));
  await play(new M.FadeIn(neqMark), ...say('DIFFERENT MISTAKES, DIFFERENT COSTS', C.cyan));

  await until(S(4));
  await play(
    ...fbox([['Goal:', AMBER], 'Choose an alert threshold', ['for lowest total cost', AMBER]], AMBER),
    ...say('GOAL: LOWEST TOTAL COST', AMBER),
  );

  // ============================================================
  // Beats 5–11: Twelve water pump cards (exact shared dataset)
  // ============================================================
  await until(S(5));
  await play(
    ...fadeOut([faCard, faSub, fnCard, fnSub, neqMark]),
    ...clearBox(),
    lag(showCardsIntro(), 1.2, 0.06),
    ...say('12 WATER PUMP CARDS', C.cyan),
  );

  await until(S(6));
  await play(...revealChance([0]), new M.Indicate(cards[0].base, { color: BLUE, runTime: 0.9 }), ...say('P1: 90% FAILURE CHANCE', BLUE));

  await until(S(7));
  await play(
    ...revealChance([1, 2]),
    new M.Indicate(cards[1].base, { color: BLUE, runTime: 0.9 }),
    new M.Indicate(cards[2].base, { color: BLUE, runTime: 0.9 }),
    ...say('P2, P3: 60% FAILURE CHANCE', BLUE),
  );

  await until(S(8));
  await play(
    ...revealChance([3, 4, 5]),
    lag([3, 4, 5].map(i => new M.Indicate(cards[i].base, { color: BLUE, runTime: 0.7 })), 1.0, 0.15),
    ...say('P4, P5, P6: 30% FAILURE CHANCE', BLUE),
  );

  await until(S(9));
  await play(lag(revealChance([6, 7, 8, 9, 10, 11]), 1.1, 0.08), ...say('P7–P12: 10% FAILURE CHANCE', BLUE));

  await until(S(10));
  await play(
    new M.Indicate(cards[1].base, { color: RED, runTime: 1.0 }),
    new M.Indicate(cards[3].base, { color: RED, runTime: 1.0 }),
    ...say('NEXT 10 HOURS: ONLY P2 & P4 FAIL', RED),
  );

  await until(S(11));
  await play(
    lag(revealOutcomes(IDS), 1.3, 0.06),
    ...say('RED DIAMOND = FAIL · GREEN CIRCLE = SAFE', C.cyan),
  );

  // ============================================================
  // Beats 12–16: Cost blocks & cost-sensitive threshold selection
  // ============================================================
  const LEG_Y = P ? -3.55 : -1.85;
  const LEG_DX = P ? 2.25 : 2.35;
  const LEG_BW = P ? 0.90 : 0.78;
  const LEG_BH = P ? 0.22 : 0.17;
  const LEG_PITCH = P ? 0.27 : 0.21;
  const LEG_BASE = P ? -4.25 : -2.30;

  const legFA = new M.VGroup(
    costBlock(CX - LEG_DX, LEG_BASE + LEG_PITCH * 0.5, AMBER, LEG_BW, LEG_BH),
    text('1 block', P ? 17 : 17, AMBER, CX - LEG_DX, LEG_BASE + LEG_PITCH + 0.26, true),
    text('False alarm', P ? 16 : 16, C.ink, CX - LEG_DX, LEG_BASE - 0.30),
  );

  const legFNBlocks = [0, 1, 2, 3].map(j => costBlock(CX, LEG_BASE + (j + 0.5) * LEG_PITCH, RED, LEG_BW, LEG_BH));
  const legFN = new M.VGroup(
    ...legFNBlocks,
    text('4 blocks', P ? 17 : 17, RED, CX, LEG_BASE + 4 * LEG_PITCH + 0.26, true),
    text('Missed failure', P ? 16 : 16, C.ink, CX, LEG_BASE - 0.30),
  );

  const legOK = new M.VGroup(
    line(CX + LEG_DX - 0.45, LEG_BASE, CX + LEG_DX + 0.45, LEG_BASE, GREEN, 2.5),
    text('0 blocks', P ? 17 : 17, GREEN, CX + LEG_DX, LEG_BASE + 0.34, true),
    text('Correct', P ? 16 : 16, C.ink, CX + LEG_DX, LEG_BASE - 0.30),
  );

  await until(S(12));
  await play(
    ...moveCardsToSweep(),
    new M.FadeIn(legFA),
    ...fbox([['Mistake costs:', C.muted], ['False alarm = 1 block', AMBER]], AMBER),
    ...say('FALSE ALARM = 1 COST BLOCK', AMBER),
  );

  await until(S(13));
  await play(
    new M.FadeIn(legFN),
    ...fbox([['Mistake costs:', C.muted], ['False alarm    = 1 block', AMBER], ['Missed failure = 4 blocks', RED]], RED),
    ...say('MISSED FAILURE = 4 COST BLOCKS', RED),
  );

  await until(S(14));
  await play(
    new M.FadeIn(legOK),
    ...fbox([['Mistake costs:', C.muted], ['False alarm    = 1 block', AMBER], ['Missed failure = 4 blocks', RED], ['Correct        = 0 blocks', GREEN]], C.cyan),
    ...say('CORRECT DECISIONS = 0 COST', GREEN),
  );

  // Draw the 5-pile floor & threshold labels
  const floorL = PILE_X(0) - PILE_SP * 0.52;
  const floorR = PILE_X(4) + PILE_SP * 0.52;
  const pileFloor = line(floorL, PILE_BASE, floorR, PILE_BASE, C.muted, 2.5);
  const thrLabels = THRESHOLDS.map((t, k) => text(`${t}%`, P ? 18 : 17, C.muted, PILE_X(k), PILE_BASE - 0.28, true));

  await until(S(15));
  await play(
    ...fadeOut([legFA, legFN, legOK]),
    new M.Create(pileFloor),
    ...fadeIn(thrLabels),
    ...say('FIND THE SMALLEST PILE OF COST BLOCKS', AMBER),
  );

  await until(S(16));
  await play(
    ...fbox([['Cost-sensitive', GREEN], ['threshold selection:', GREEN], 'pick the cutoff with', 'the lowest mistake cost'], GREEN),
    ...say('COST-SENSITIVE THRESHOLD SELECTION', GREEN),
  );

  // ============================================================
  // Beats 17–33: Sweep 100%, 90%, 60%, 30%, 10%
  // ============================================================
  const allPileBlocks = [];
  const totalLabels = [];
  let activeBar = null;

  function moveActiveBar(k) {
    const target = rect(PILE_X(k), PILE_BASE - 0.46, PILE_SP * 0.72, 0.06, C.cyan, 1, 1);
    if (!activeBar) { activeBar = target; return [new M.FadeIn(activeBar)]; }
    return [new M.Transform(activeBar, target, { runTime: 0.6 })];
  }

  function makeBlocks(k, startIdx, count, color) {
    const bs = [];
    for (let j = 0; j < count; j++) {
      const [x, y] = pileSlot(k, startIdx + j);
      const b = costBlock(x, y, color);
      bs.push(b);
      allPileBlocks.push(b);
    }
    return bs;
  }

  function makeTotalLabel(k, heightCount, val, color) {
    const t = text(String(val), P ? 20 : 19, color, PILE_X(k), PILE_BASE + heightCount * PITCH + (P ? 0.26 : 0.22), true);
    totalLabels[k] = t;
    return t;
  }

  // --- 100% (k = 0): 0 alerts, 2 missed (8 red), 0 false -> cost 8 ---
  await until(S(17));
  await play(
    ...moveActiveBar(0),
    ...fbox([['Threshold = 100%', C.cyan], 'Alert if chance >= 100%'], C.cyan),
    ...say('THRESHOLD: 100%', C.cyan),
  );

  await until(S(18));
  await play(
    new M.Indicate(cards[1].outcome, { color: RED, runTime: 0.9 }),
    new M.Indicate(cards[3].outcome, { color: RED, runTime: 0.9 }),
    ...fbox([['Threshold = 100%', C.cyan], ['Alerts: 0', C.muted], ['Missed: 2 (P2, P4)', RED], ['False:  0', AMBER]], RED),
    ...say('NO ALERTS · 2 MISSED FAILURES', RED),
  );

  const b100 = makeBlocks(0, 0, 8, RED);
  const t100 = makeTotalLabel(0, 8, 8, RED);
  await until(S(19));
  await play(
    lag(fadeIn(b100), 1.1, 0.08),
    new M.FadeIn(t100),
    ...fbox([['Threshold = 100%', C.cyan], ['Missed: 2 × 4 = 8', RED], ['False:  0 × 1 = 0', AMBER], ['Total cost    = 8', C.ink]], RED),
    ...say('2 × 4 = 8 COST BLOCKS', RED),
  );

  // --- 90% (k = 1): P1 alerted (1 false), 2 missed (8 red) -> cost 9 ---
  await until(S(20));
  await play(...moveActiveBar(1), ...fbox([['Threshold = 90%', C.cyan], 'Alert if chance >= 90%'], C.cyan), ...say('THRESHOLD: 90%', C.cyan));

  await until(S(21));
  await play(
    ...addAlerts([0]),
    new M.Indicate(cards[0].outcome, { color: AMBER, runTime: 0.9 }),
    ...fbox([['Threshold = 90%', C.cyan], ['Alert: P1', AMBER], ['P1 did not fail', GREEN]], AMBER),
    ...say('P1 ALERTED — FALSE ALARM', AMBER),
  );

  const b90 = [...makeBlocks(1, 0, 8, RED), ...makeBlocks(1, 8, 1, AMBER)];
  await until(S(22));
  await play(
    lag(fadeIn(b90), 1.1, 0.07),
    ...fbox([['Threshold = 90%', C.cyan], ['Missed: 2 × 4 = 8', RED], ['False:  1 × 1 = 1', AMBER]], AMBER),
    ...say('2 MISSED + 1 FALSE ALARM', AMBER),
  );

  const t90 = makeTotalLabel(1, 9, 9, RED);
  await until(S(23));
  await play(
    new M.FadeIn(t90),
    ...fbox([['Threshold = 90%', C.cyan], ['Missed: 2 × 4 = 8', RED], ['False:  1 × 1 = 1', AMBER], ['Total cost    = 9', RED]], RED),
    ...say('TOTAL COST RISES TO 9', RED),
  );

  // --- 60% (k = 2): P1, P2, P3 alerted; 1 caught (P2), 1 missed (P4=4), 2 false (P1,P3=2) -> cost 6 ---
  await until(S(24));
  await play(...moveActiveBar(2), ...fbox([['Threshold = 60%', C.cyan], 'Alert if chance >= 60%'], C.cyan), ...say('THRESHOLD: 60%', C.cyan));

  await until(S(25));
  await play(...addAlerts([1, 2]), ...fbox([['Threshold = 60%', C.cyan], ['Alerts: P1, P2, P3', AMBER]], AMBER), ...say('P2 AND P3 RECEIVE ALERTS', AMBER));

  const b60Red = makeBlocks(2, 0, 4, RED);
  await until(S(26));
  await play(
    new M.Indicate(cards[1].base, { color: GREEN, runTime: 0.9 }),
    new M.Indicate(cards[3].outcome, { color: RED, runTime: 0.9 }),
    lag(fadeIn(b60Red), 0.9, 0.12),
    ...fbox([['Threshold = 60%', C.cyan], ['Caught: 1 (P2)', GREEN], ['Missed: 1 × 4 = 4', RED]], C.cyan),
    ...say('1 CAUGHT · 1 MISSED (4 BLOCKS)', RED),
  );

  const b60Amb = makeBlocks(2, 4, 2, AMBER);
  const t60 = makeTotalLabel(2, 6, 6, C.ink);
  await until(S(27));
  await play(
    lag(fadeIn(b60Amb), 0.7, 0.18),
    new M.FadeIn(t60),
    ...fbox([['Threshold = 60%', C.cyan], ['Missed: 1 × 4 = 4', RED], ['False:  2 × 1 = 2', AMBER], ['Total cost    = 6', C.ink]], AMBER),
    ...say('4 + 2 = 6 COST BLOCKS', AMBER),
  );

  // --- 30% (k = 3): P1–P6 alerted; 2 caught, 0 missed, 4 false -> cost 4 ---
  await until(S(28));
  await play(...moveActiveBar(3), ...fbox([['Threshold = 30%', C.cyan], 'Alert if chance >= 30%'], C.cyan), ...say('THRESHOLD: 30%', C.cyan));

  await until(S(29));
  await play(lag(addAlerts([3, 4, 5]), 0.9, 0.15), ...fbox([['Threshold = 30%', C.cyan], ['Alerts: P1 to P6', AMBER]], AMBER), ...say('P4, P5, P6 RECEIVE ALERTS', AMBER));

  await until(S(30));
  await play(
    new M.Indicate(cards[1].base, { color: GREEN, runTime: 0.9 }),
    new M.Indicate(cards[3].base, { color: GREEN, runTime: 0.9 }),
    ...fbox([['Threshold = 30%', C.cyan], ['Caught: 2 (P2, P4)', GREEN], ['Missed: 0 × 4 = 0', GREEN]], GREEN),
    ...say('BOTH FAILURES CAUGHT · 0 MISSED', GREEN),
  );

  const b30 = makeBlocks(3, 0, 4, AMBER);
  const t30 = makeTotalLabel(3, 4, 4, GREEN);
  await until(S(31));
  await play(
    lag(fadeIn(b30), 0.9, 0.12),
    new M.FadeIn(t30),
    ...fbox([['Threshold = 30%', C.cyan], ['Missed: 0 × 4 = 0', GREEN], ['False:  4 × 1 = 4', AMBER], ['Total cost    = 4', GREEN]], GREEN),
    ...say('4 FALSE ALARMS = COST OF 4', GREEN),
  );

  // --- 10% (k = 4): all 12 alerted; 0 missed, 10 false -> cost 10 ---
  await until(S(32));
  await play(
    ...moveActiveBar(4),
    lag(addAlerts([6, 7, 8, 9, 10, 11]), 1.1, 0.08),
    ...fbox([['Threshold = 10%', C.cyan], ['Alerts: all 12 pumps', AMBER]], AMBER),
    ...say('THRESHOLD: 10% · ALL 12 ALERTED', AMBER),
  );

  const b10 = makeBlocks(4, 0, 10, AMBER);
  const t10 = makeTotalLabel(4, 10, 10, RED);
  await until(S(33));
  await play(
    lag(fadeIn(b10), 1.2, 0.06),
    new M.FadeIn(t10),
    ...fbox([['Threshold = 10%', C.cyan], ['Missed:  0 × 4 =  0', GREEN], ['False:  10 × 1 = 10', AMBER], ['Total cost     = 10', RED]], RED),
    ...say('0 MISSED · 10 FALSE ALARMS = 10', RED),
  );

  // ============================================================
  // Beats 34–37: Compare all 5 piles & write the formula
  // ============================================================
  await until(S(34));
  await play(
    lag(totalLabels.map(t => new M.Indicate(t, { color: AMBER, runTime: 0.7 })), 2.2, 0.25),
    ...fbox([['Five piles compared:', C.muted], ['100% ->  8   90% ->  9', C.ink], [' 60% ->  6   30% ->  4', GREEN], [' 10% -> 10', C.ink]], C.cyan),
    ...say('COMPARE: 8, 9, 6, 4, AND 10', C.cyan),
  );

  const winBox = rounded(PILE_X(3), PILE_BASE + 2.5 * PITCH, PILE_SP * 0.90, 6.2 * PITCH, GREEN, GREEN, 0.08, 2.5, 0.12);
  await until(S(35));
  await play(
    ...removeAlerts([6, 7, 8, 9, 10, 11]),
    ...moveActiveBar(3),
    new M.Create(winBox),
    new M.Indicate(t30, { color: GREEN, runTime: 1.0 }),
    ...say('LOWEST COST HERE: 30% (4 BLOCKS)', GREEN),
  );

  await until(S(36));
  await play(
    ...fbox([['Short formula:', C.cyan]], C.cyan),
    ...say('WRITE AS A SHORT FORMULA', C.cyan),
  );

  await until(S(37));
  await play(
    ...fbox([['Total cost =', C.ink], ['  4 × missed failures', RED], ['+ 1 × false alarms', AMBER]], AMBER),
    ...say('COST = 4 × MISSED + FALSE ALARMS', AMBER),
  );

  // ============================================================
  // Beats 38–43: Before seeing outcomes — 100 pumps at 20%
  // ============================================================
  await until(S(38));
  await play(
    ...clearAllCards(),
    ...fadeOut([pileFloor, ...thrLabels, ...allPileBlocks, ...totalLabels, activeBar, winBox]),
    ...fbox([['Before seeing outcomes:', C.violet], 'Can we pick a threshold', 'from costs & chances?'], C.violet),
    ...say('CHOOSE BEFORE SEEING OUTCOMES?', C.violet),
  );

  // 10x10 grid of 100 comparable pumps at 20% failure chance
  const G_CX = P ? 0 : -4.20;
  const G_CY = P ? 0.15 : -0.45;
  const G_SP = P ? 0.27 : 0.29;
  const pumpDots = [];
  for (let i = 0; i < 100; i++) {
    const col = i % 10, row = Math.floor(i / 10);
    const x = G_CX + (col - 4.5) * G_SP;
    const y = G_CY + (4.5 - row) * G_SP;
    pumpDots.push(circle(x, y, P ? 0.085 : 0.09, BLUE, 0.85, 1.4));
  }
  const gridTitle = text('100 pumps · 20% each', P ? 17 : 17, BLUE, G_CX, G_CY - 5.4 * G_SP - 0.15, true);

  await until(S(39));
  await play(
    lag(fadeIn(pumpDots), 1.4, 0.015),
    new M.FadeIn(gridTitle),
    ...clearBox(),
    ...say('100 COMPARABLE PUMPS AT 20%', BLUE),
  );

  // Split: top 2 rows (20) fail (red), bottom 8 rows (80) safe (green)
  const splitAnims = pumpDots.map((dot, i) => {
    const c = dot.copy();
    if (i < 20) { c.setColor(RED); c.setFill(RED, 0.95); }
    else { c.setColor(GREEN); c.setFill(GREEN, 0.12); }
    return new M.Transform(dot, c, { runTime: 0.9 });
  });
  const lbl20 = text('20 fail', P ? 16 : 16, RED, P ? G_CX - 2.25 : G_CX - 1.95, G_CY + 4.0 * G_SP, true);
  const lbl80 = text('80 safe', P ? 16 : 16, GREEN, P ? G_CX - 2.25 : G_CX - 1.95, G_CY - 1.0 * G_SP, true);

  await until(S(40));
  await play(
    ...splitAnims,
    new M.FadeIn(lbl20),
    new M.FadeIn(lbl80),
    ...fbox([['100 pumps at 20%:', BLUE], ['Expect ~20 failures', RED], ['Expect ~80 safe', GREEN]], C.cyan),
    ...say('EXPECT ~20 FAILURES · ~80 SAFE', C.cyan),
  );

  // Expected-cost bars: No alerts (80) vs Alert all (80)
  const BAR_BASE = P ? -4.55 : -2.15;
  const BAR_H = P ? 2.15 : 2.35;
  const BAR_W = P ? 1.30 : 1.05;
  const BAR_X1 = P ? -1.45 : -1.05;
  const BAR_X2 = P ? 1.45 : 0.55;
  const barFloor = line(BAR_X1 - BAR_W * 0.85, BAR_BASE, BAR_X2 + BAR_W * 0.85, BAR_BASE, C.muted, 2);

  const barNo = rect(BAR_X1, BAR_BASE + BAR_H / 2, BAR_W, BAR_H, RED, 0.72, 2);
  const barNoTop = text('80', P ? 21 : 21, RED, BAR_X1, BAR_BASE + BAR_H + 0.28, true);
  const barNoCap = new M.VGroup(
    text('20 × 4', P ? 16 : 16, RED, BAR_X1, BAR_BASE - 0.28, true),
    text('No alerts', P ? 16 : 16, C.ink, BAR_X1, BAR_BASE - 0.58),
  );

  await until(S(41));
  await play(
    new M.Create(barFloor),
    new M.FadeIn(barNo),
    new M.FadeIn(barNoTop),
    new M.FadeIn(barNoCap),
    ...fbox([['At 20% failure chance:', BLUE], ['No alerts: 20 × 4 = 80', RED]], RED),
    ...say('NO ALERTS: 20 × 4 = 80 BLOCKS', RED),
  );

  const barAll = rect(BAR_X2, BAR_BASE + BAR_H / 2, BAR_W, BAR_H, AMBER, 0.72, 2);
  const barAllTop = text('80', P ? 21 : 21, AMBER, BAR_X2, BAR_BASE + BAR_H + 0.28, true);
  const barAllCap = new M.VGroup(
    text('80 × 1', P ? 16 : 16, AMBER, BAR_X2, BAR_BASE - 0.28, true),
    text('Alert all', P ? 16 : 16, C.ink, BAR_X2, BAR_BASE - 0.58),
  );

  await until(S(42));
  await play(
    new M.FadeIn(barAll),
    new M.FadeIn(barAllTop),
    new M.FadeIn(barAllCap),
    ...fbox([['At 20% failure chance:', BLUE], ['No alerts: 20 × 4 = 80', RED], ['Alert all: 80 × 1 = 80', AMBER]], AMBER),
    ...say('ALERT ALL: 80 × 1 = 80 BLOCKS', AMBER),
  );

  const tieLine = dashed(BAR_X1 - BAR_W * 0.75, BAR_BASE + BAR_H, BAR_X2 + BAR_W * 0.75, BAR_BASE + BAR_H, GREEN, 2.4);
  const tieTag = pill('EQUAL: 80 = 80', GREEN, P ? 15 : 15);
  tieTag.moveTo([(BAR_X1 + BAR_X2) / 2, BAR_BASE + BAR_H + 0.68, 0]);

  await until(S(43));
  await play(
    new M.Create(tieLine),
    new M.FadeIn(tieTag),
    ...fbox([['Expected cost = average', C.muted], ['No alerts: 80 blocks', RED], ['Alert all: 80 blocks', AMBER], ['Same expected cost!', GREEN]], GREEN),
    ...say('SAME EXPECTED COST ON AVERAGE', GREEN),
  );

  // ============================================================
  // Beats 44–48: Expected-cost crossover & threshold formula
  // ============================================================
  const GX0 = P ? -2.85 : -5.55, GX1 = P ? 3.15 : 0.95;
  const GY0 = P ? -4.30 : -2.25, GY1 = P ? 0.50 : 1.05;
  const gx = p => GX0 + (p / 100) * (GX1 - GX0);
  const gy = c => GY0 + (c / 4) * (GY1 - GY0);

  const axX = line(GX0, GY0, GX1, GY0, C.muted, 2.5);
  const axY = line(GX0, GY0, GX0, GY1, C.muted, 2.5);
  const xTicks = [0, 20, 40, 60, 80, 100].map(v => new M.VGroup(
    line(gx(v), GY0 - 0.08, gx(v), GY0 + 0.08, v === 20 ? GREEN : C.muted, 2),
    text(`${v}%`, P ? 15 : 15, v === 20 ? GREEN : C.muted, gx(v), GY0 - 0.30, true),
  ));
  const yTicks = [0, 1, 2, 3, 4].map(v => new M.VGroup(
    line(GX0 - 0.08, gy(v), GX0 + 0.08, gy(v), C.muted, 2),
    text(String(v), P ? 15 : 15, C.muted, GX0 - 0.30, gy(v), true),
  ));
  const xAxLab = text('Failure chance', P ? 16 : 16, C.muted, (GX0 + GX1) / 2, GY0 - 0.64);
  const yAxLab = text('Expected cost / pump', P ? 15 : 15, C.muted, GX0 + 1.15, GY1 + 0.25);

  const lineNoAlert = line(gx(0), gy(0), gx(100), gy(4), RED, 3.2);
  const lineAlert = line(gx(0), gy(1), gx(100), gy(0), AMBER, 3.2);
  const labNoAlert = text('No alert (4 × p)', P ? 15 : 15, RED, gx(68), gy(3.25), true);
  const labAlert = text('Alert (1 − p)', P ? 15 : 15, AMBER, gx(76), gy(0.62), true);
  const cutLine = dashed(gx(20), GY0, gx(20), GY1, GREEN, 2.2);
  const crossDot = new M.Dot({ point: [gx(20), gy(0.8), 0], radius: 0.11, color: GREEN });

  const highShade = rect((gx(20) + gx(100)) / 2, (GY0 + GY1) / 2, gx(100) - gx(20), GY1 - GY0, AMBER, 0.09, 0);
  const highTag = pill('HIGHER CHANCE → ALERT', AMBER, P ? 15 : 15);
  highTag.moveTo([gx(60), gy(1.65), 0]);

  await until(S(44));
  await play(
    ...fadeOut([...pumpDots, gridTitle, lbl20, lbl80, barFloor, barNo, barNoTop, barNoCap, barAll, barAllTop, barAllCap, tieLine, tieTag]),
    ...clearBox(),
    new M.Create(axX), new M.Create(axY),
    ...fadeIn([...xTicks, ...yTicks, xAxLab, yAxLab, labNoAlert, labAlert]),
    new M.Create(lineNoAlert), new M.Create(lineAlert),
    new M.Create(cutLine), new M.FadeIn(crossDot),
    new M.FadeIn(highShade), new M.FadeIn(highTag),
    ...say('ABOVE 20%: ALERT COSTS LESS', AMBER),
  );

  const lowShade = rect((gx(0) + gx(20)) / 2, (GY0 + GY1) / 2, gx(20) - gx(0), GY1 - GY0, GREEN, 0.12, 0);
  const lowTag = pill('LOWER → STAY QUIET', GREEN, P ? 15 : 15);
  lowTag.moveTo([gx(36), gy(2.35), 0]);
  const lowArr = arrow(gx(20), gy(2.05), gx(10), gy(1.65), GREEN);

  await until(S(45));
  await play(
    ...fadeOut([highShade, highTag]),
    new M.FadeIn(lowShade), new M.FadeIn(lowTag), new M.FadeIn(lowArr),
    ...say('BELOW 20%: STAY QUIET COSTS LESS', GREEN),
  );

  await until(S(46));
  await play(
    ...fadeOut([lowShade, lowTag, lowArr]),
    new M.Indicate(crossDot, { color: C.cyan, runTime: 1.0 }),
    ...fbox([['Find boundary from costs:', C.cyan], ['False alarm cost = 1', AMBER], ['Missed fail cost = 4', RED]], C.cyan),
    ...say('BOUNDARY FROM THE TWO COSTS', C.cyan),
  );

  await until(S(47));
  await play(
    ...fbox([['Threshold =', C.ink], ['  false alarm cost', AMBER], ['  ÷ (false + missed)', C.cyan]], C.cyan),
    ...say('FALSE COST ÷ SUM OF BOTH COSTS', C.cyan),
  );

  const cutBadge = pill('20%', GREEN, P ? 17 : 17);
  cutBadge.moveTo([gx(20), gy(0.8) + 0.50, 0]);
  await until(S(48));
  await play(
    new M.Flash(crossDot, { color: GREEN }),
    new M.FadeIn(cutBadge),
    ...fbox([['Threshold = 1 ÷ (1 + 4)', C.ink], ['          = 1 ÷ 5', C.muted], ['          = 20%', GREEN]], GREEN),
    ...say('1 ÷ (1 + 4) = 1/5 = 20%', GREEN),
  );

  // ============================================================
  // Beats 49–54: Back to 12 pumps, when to use, cautions & recap
  // ============================================================
  const sameNote = pill('20%: ALERTS P1–P6, SAME AS 30%', GREEN, P ? 16 : 15);
  sameNote.moveTo([CX, P ? -2.75 : -1.45, 0]);

  await until(S(49));
  await play(
    ...fadeOut([axX, axY, ...xTicks, ...yTicks, xAxLab, yAxLab, lineNoAlert, lineAlert, labNoAlert, labAlert, cutLine, crossDot, cutBadge]),
    ...respawnSweepCards([0, 1, 2, 3, 4, 5]),
    new M.FadeIn(sameNote),
    ...fbox([['On our 12 pumps:', C.muted], ['P1–P6 >= 20% -> Alert', AMBER], ['P7–P12 < 20% -> Quiet', C.muted], ['Same as 30% (cost 4)', GREEN]], GREEN),
    ...say('20% GIVES SAME DECISIONS AS 30%', GREEN),
  );

  await until(S(50));
  await play(
    ...fbox([['When to use it:', C.cyan], 'When false alarms and', 'missed failures have', ['different real costs', AMBER]], C.cyan),
    ...say('USE WHEN MISTAKE COSTS DIFFER', C.cyan),
  );

  // Caution 1: 12 pumps is too small
  const cBoxW = P ? 6.0 : 7.5, cBoxH = P ? 3.25 : 2.15;
  const cBoxY = P ? 0.14 : 0.49;
  const cautionFrame = rounded(CX, cBoxY, cBoxW, cBoxH, AMBER, AMBER, 0.05, 2.4, 0.16);
  const cautionTag = pill('ONLY 12 PUMPS: TOO FEW TO BE SURE', AMBER, P ? 16 : 15);
  cautionTag.moveTo([CX, P ? -2.75 : -1.45, 0]);

  await until(S(51));
  await play(
    new M.FadeOut(sameNote),
    new M.Create(cautionFrame),
    new M.FadeIn(cautionTag),
    ...fbox([['Be careful:', AMBER], '12 pumps are too few', 'to lock in the best', 'cutoff for future pumps'], AMBER),
    ...say('CAUTION: 12 PUMPS IS TOO SMALL', AMBER),
  );

  // Caution 2: trustworthy probabilities & accurate costs
  await until(S(52));
  await play(
    ...fadeOut([cautionFrame, cautionTag]),
    lag([0, 1, 2, 3, 4, 5].map(i => new M.Indicate(cards[i].chance, { color: BLUE, runTime: 0.7 })), 1.3, 0.12),
    ...fbox([['20% formula needs:', AMBER], ['1. Trustworthy chances', BLUE], ['2. Accurate cost values', RED]], AMBER),
    ...say('NEEDS TRUSTWORTHY CHANCES & COSTS', AMBER),
  );

  // Higher missed cost -> lower threshold (visual slider bar moving left)
  const SL_Y = P ? -3.15 : -1.65;
  const SL_L = CX - (P ? 2.6 : 2.9), SL_R = CX + (P ? 2.6 : 2.9);
  const slx = v => SL_L + (v / 50) * (SL_R - SL_L);
  const slBar = line(SL_L, SL_Y, SL_R, SL_Y, C.muted, 3);
  const slTicks = [0, 10, 20, 30, 40, 50].map(v => new M.VGroup(
    line(slx(v), SL_Y - 0.08, slx(v), SL_Y + 0.08, C.muted, 2),
    text(`${v}%`, P ? 15 : 15, C.muted, slx(v), SL_Y - 0.30, true),
  ));
  const slDot = new M.Dot({ point: [slx(20), SL_Y, 0], radius: 0.13, color: AMBER });
  const slArrow = arrow(slx(20), SL_Y + 0.42, slx(10), SL_Y + 0.42, AMBER);
  const slCap = text('Missed cost ↑  ⇒  lower cutoff', P ? 16 : 16, AMBER, CX, SL_Y + 0.74, true);

  await until(S(53));
  await play(
    new M.Create(slBar),
    ...fadeIn([...slTicks, slDot, slArrow, slCap]),
    new M.Transform(slDot, new M.Dot({ point: [slx(10), SL_Y, 0], radius: 0.13, color: RED }), { runTime: 1.2 }),
    ...fbox([['Higher missed cost:', RED], ['Cost 4 -> cutoff 20%', C.muted], ['Cost 9 -> cutoff 10%', AMBER], ['Alert earlier!', AMBER]], AMBER),
    ...say('HIGHER MISSED COST → LOWER CUTOFF', AMBER),
  );

  // Beat 54: Final one-sentence recap
  const recapPill = pill('WEIGH THE REAL COST OF EACH MISTAKE', GREEN, P ? 16 : 15);
  recapPill.moveTo([CX, P ? -3.05 : -1.55, 0]);
  await until(S(54));
  await play(
    ...fadeOut([slBar, ...slTicks, slDot, slArrow, slCap]),
    new M.FadeIn(recapPill),
    ...fbox([['Remember:', GREEN], 'A cost-sensitive cutoff', 'weighs mistake costs —', ['not every mistake is equal', AMBER]], GREEN),
    ...say('WEIGH THE CONSEQUENCES OF MISTAKES', GREEN),
  );
}
