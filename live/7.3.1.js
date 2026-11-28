// lesson 7.3.1
// 7.3.1 Exact binomial test (live manim-web scene).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const CX = P ? 0 : -2.3;
  const PILL = P ? [0, 3.85, 0] : [CX, 2.05, 0];
  const BOXP = P ? [0, 2.35, 0] : [4.35, -0.25, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Formula box helper: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.42 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.38;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 4.9;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  // Helper: small ticket card
  function ticketCard(pos, borderColor = C.cyan, w = 0.72, h = 0.92) {
    const bg = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.1, color: borderColor, strokeWidth: 2 });
    bg.setFill(C.card, 0.95);
    bg.moveTo(pos);
    const l1 = new M.Line({ start: [pos[0] - w * 0.28, pos[1] + h * 0.22, 0], end: [pos[0] + w * 0.28, pos[1] + h * 0.22, 0], color: C.muted, strokeWidth: 2 });
    const l2 = new M.Line({ start: [pos[0] - w * 0.28, pos[1] + h * 0.04, 0], end: [pos[0] + w * 0.15, pos[1] + h * 0.04, 0], color: C.muted, strokeWidth: 2 });
    return new M.VGroup(bg, l1, l2);
  }

  // 0: Imagine a help desk. Customers send in tickets.
  const introY = P ? -0.6 : -0.35;
  const introCards = [];
  for (let k = 0; k < 5; k++) {
    const x = CX + (k - 2) * (P ? 1.15 : 1.25);
    introCards.push(ticketCard([x, introY, 0], C.muted, P ? 0.85 : 0.9, P ? 1.05 : 1.1));
  }
  await until(S(0));
  await play(
    new M.LaggedStart(introCards.map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 1.4 }),
    ...say('HELP DESK: CUSTOMER TICKETS', C.cyan)
  );

  // 1: New reply script
  const scriptBox = new M.RoundedRectangle({ width: P ? 3.8 : 3.6, height: 0.85, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2 });
  scriptBox.setFill(C.card, 0.95);
  scriptBox.moveTo([CX, introY + (P ? 1.45 : 1.35), 0]);
  const scriptLbl = T('NEW REPLY SCRIPT', P ? 20 : 21, C.cyan, true);
  scriptLbl.moveTo([CX, introY + (P ? 1.45 : 1.35), 0]);
  const scriptBadge = new M.VGroup(scriptBox, scriptLbl);
  await until(S(1));
  await play(new M.FadeIn(scriptBadge), ...say('NEW SCRIPT = WRITTEN REPLY GUIDE', C.cyan));

  // 2: Old script: about half resolved
  const oldTag = pill('OLD SCRIPT: ~1/2 RESOLVED (50%)', C.amber, P ? 17 : 18);
  oldTag.moveTo([CX, introY - (P ? 1.45 : 1.35), 0]);
  await until(S(2));
  await play(new M.FadeIn(oldTag), ...say('OLD SCRIPT: HALF RESOLVED', C.amber));

  // 3: Resolved at first contact
  const demoTick = T('✓', 34, C.green, true);
  demoTick.moveTo([CX, introY - 0.15, 0]);
  await until(S(3));
  await play(new M.FadeIn(demoTick), new M.Indicate(introCards[2], { color: C.green }), ...say('RESOLVED = FIXED IN FIRST ANSWER', C.green));

  // 4: First ten tickets with the new script
  const RESULTS = [1, 1, 1, 0, 1, 1, 1, 1, 1, 1]; // 9 ticks, 1 cross (at index 3)
  const cardW = P ? 1.05 : 0.72, cardH = P ? 1.25 : 0.98;
  const cardPos = k => P
    ? [((k % 5) - 2) * 1.32, (k < 5 ? 0.15 : -2.6), 0]
    : [CX + (k - 4.5) * 0.84, -0.35, 0];

  const cards = RESULTS.map((_, k) => ticketCard(cardPos(k), C.cyan, cardW, cardH));
  const legendY = P ? -4.4 : -1.85;
  const leg1 = T('✓ resolved', P ? 18 : 17, C.green, true);
  leg1.moveTo([CX - 1.35, legendY, 0]);
  const leg2 = T('✕ not resolved', P ? 18 : 17, C.muted, true);
  leg2.moveTo([CX + 1.25, legendY, 0]);

  await until(S(4));
  await play(
    new M.FadeOut(new M.VGroup(...introCards, scriptBadge, oldTag, demoTick)),
    new M.LaggedStart(cards.map(c => new M.FadeIn(c)), { lagRatio: 0.06, runTime: 1.2 }),
    new M.FadeIn(leg1),
    new M.FadeIn(leg2),
    ...say('FIRST 10 TICKETS (NEW SCRIPT)', C.cyan)
  );

  // 5: Tick, tick, tick, cross, tick, tick, tick, tick, tick, tick.
  const marks = RESULTS.map((v, k) => {
    const p = cardPos(k);
    const m = T(v ? '✓' : '✕', P ? 32 : 28, v ? C.green : C.muted, true);
    m.moveTo([p[0], p[1] - cardH * 0.16, 0]);
    return m;
  });
  await until(S(5));
  await play(new M.LaggedStart(marks.map(m => new M.FadeIn(m)), { lagRatio: 0.22, runTime: 2.3 }));

  // 6: Nine ticks out of ten. Better or luck?
  await until(S(6));
  await play(
    ...fbox(['observed: 9 / 10 ✓', ['better, or just luck?', C.amber]], C.amber),
    ...say('9 OF 10: BETTER OR LUCK?', C.amber)
  );

  // 7: Claim fixed before looking
  await until(S(7));
  await play(
    ...fbox(['claim (before looking):', ['new script > 1/2', C.cyan]], C.cyan),
    ...say('CLAIM: MORE THAN HALF', C.cyan)
  );

  // 8: Null hypothesis: chance = 1/2
  await until(S(8));
  await play(
    ...fbox(['null (no change):', ['chance = 1/2 (50%)', C.amber]], C.amber),
    ...say('NULL: CHANCE IS STILL 1/2', C.amber)
  );

  // 9: Fair coin flip
  const coins = RESULTS.map((v, k) => {
    const p = cardPos(k);
    const yOff = P ? 0.82 : 0.78;
    const c = new M.Circle({ radius: P ? 0.25 : 0.22, color: C.amber, strokeWidth: 2 });
    c.setFill(C.card, 0.95);
    c.moveTo([p[0], p[1] + yOff, 0]);
    const t = T(v ? 'H' : 'T', 17, v ? C.green : C.muted, true);
    t.moveTo([p[0], p[1] + yOff, 0]);
    return new M.VGroup(c, t);
  });
  await until(S(9));
  await play(
    new M.LaggedStart(coins.map(c => new M.FadeIn(c)), { lagRatio: 0.06, runTime: 1.1 }),
    ...say('EACH TICKET = FAIR COIN FLIP', C.amber)
  );

  // 10: How often 9 heads or more?
  await until(S(10));
  await play(
    ...fbox(['10 fair coins:', ['P(9 or more heads) = ?', C.amber]], C.amber),
    ...say('HOW OFTEN: 9 OR MORE HEADS?', C.amber)
  );

  // 11: Count exactly, no shortcut
  await until(S(11));
  await play(...say('COUNT EXACTLY — NO SHORTCUT', C.cyan));

  // 12: First ticket 2 ways, second 2 ways, 10 times
  const twos = RESULTS.map((_, k) => {
    const p = cardPos(k);
    const yOff = P ? -0.82 : -0.78;
    const t = T(k < 9 ? '2 ×' : '2', P ? 19 : 20, C.cyan, true);
    t.moveTo([p[0] + (k < 9 ? 0.08 : 0), p[1] + yOff, 0]);
    return t;
  });
  await until(S(12));
  await play(
    new M.LaggedStart(twos.map(t => new M.FadeIn(t)), { lagRatio: 0.1, runTime: 1.5 }),
    ...say('2 WAYS EACH, 10 TIMES', C.cyan)
  );

  // 13: 2^10 = 1,024 patterns
  await until(S(13));
  await play(
    ...fbox(['2 × 2 × ... × 2 (10×)', ['= 2¹⁰ = 1,024 patterns', C.cyan]], C.cyan),
    ...say('1,024 POSSIBLE PATTERNS', C.cyan)
  );

  // 14: Every pattern equally likely
  await until(S(14));
  await play(...say('EVERY PATTERN EQUALLY LIKELY', C.muted));

  // 15: All 10 ticks: only 1 pattern
  await until(S(15));
  await play(
    ...fbox(['10 ticks:  1 pattern', ['(all 10 are ✓)', C.green]], C.green),
    ...say('ALL 10 TICKS: 1 PATTERN', C.green)
  );

  // 16: Exactly 9 ticks: 10 patterns (1 cross in any of 10 places)
  await until(S(16));
  await play(
    new M.Indicate(marks[3], { color: C.amber }),
    ...fbox(['10 ticks:  1 pattern', [' 9 ticks: 10 patterns', C.green]], C.green),
    ...say('9 TICKS: 10 PATTERNS', C.green)
  );

  // 17: Together: 11 patterns
  await until(S(17));
  await play(
    ...fbox(['10 ticks:  1', ' 9 ticks: 10', ['9 or more: 11 patterns', C.amber]], C.amber),
    ...say('TOGETHER: 11 PATTERNS', C.amber)
  );

  // 18: 11 out of 1,024 ≈ 1 in 100
  await until(S(18));
  await play(
    ...fbox(['11 ÷ 1,024', ['≈ 1 in 100', C.amber]], C.amber),
    ...say('11 / 1,024 ≈ 1 IN 100', C.amber)
  );

  // 19: In decimals: 0.011
  await until(S(19));
  await play(
    ...fbox(['11 ÷ 1,024', ['≈ 0.011', C.amber]], C.amber),
    ...say('DECIMAL: 0.011', C.amber)
  );

  // 20: This chance is our p-value
  await until(S(20));
  await play(
    ...fbox([['p-value = 0.011', C.amber], ['chance of 9+ if null true', C.muted]], C.amber),
    ...say('P-VALUE = 0.011', C.amber)
  );

  // 21: One in a hundred is small
  await until(S(21));
  await play(...say('1 IN 100 IS SMALL — RARELY LUCK', C.green));

  // 22: Reject the null
  await until(S(22));
  await play(
    ...fbox([['p = 0.011 < 0.05', C.green], ['reject null: new > 1/2', C.green]], C.green),
    ...say('REJECT NULL: NEW SCRIPT BETTER', C.green)
  );

  // 23: Binomial bar chart (0 to 10)
  const COUNTS = [1, 10, 45, 120, 210, 252, 210, 120, 45, 10, 1];
  const BASE = P ? -4.6 : -2.75;
  const MAXH = P ? 4.4 : 3.4;
  const SP = P ? 0.62 : 0.72;
  const BW = P ? 0.44 : 0.50;
  const bx = k => CX + (k - 5) * SP;
  const bh = k => Math.max(0.08, (COUNTS[k] / 252) * MAXH);

  const axis = new M.Line({ start: [bx(0) - SP * 0.6, BASE, 0], end: [bx(10) + SP * 0.6, BASE, 0], color: C.muted, strokeWidth: 2 });
  const bars = COUNTS.map((_, k) => {
    const h = bh(k);
    const r = new M.Rectangle({ width: BW, height: h, color: C.cyan, strokeWidth: 1.5 });
    r.setFill(C.cyan, 0.75);
    r.moveTo([bx(k), BASE + h / 2, 0]);
    return r;
  });
  const xLabs = COUNTS.map((_, k) => {
    const t = T(String(k), P ? 16 : 17, C.muted, true);
    t.moveTo([bx(k), BASE - 0.3, 0]);
    return t;
  });
  const xTitle = T('number of ticks (out of 10)', P ? 17 : 17, C.muted);
  xTitle.moveTo([CX, BASE - 0.75, 0]);
  const yTitle = T('bar height = chance', P ? 16 : 16, C.muted);
  yTitle.moveTo([bx(0) + (P ? 0.9 : 1.0), BASE + MAXH * 0.75, 0]);

  await until(S(23));
  await play(
    new M.FadeOut(new M.VGroup(...cards, ...marks, ...coins, ...twos, leg1, leg2)),
    new M.Create(axis),
    new M.FadeIn(new M.VGroup(...xLabs, xTitle)),
    new M.LaggedStart(bars.map(b => new M.FadeIn(b)), { lagRatio: 0.06, runTime: 1.4 }),
    ...say('BAR FOR EVERY COUNT: 0 TO 10', C.cyan)
  );

  // 24: Bar height = chance under null
  await until(S(24));
  await play(new M.FadeIn(yTitle), ...say('HEIGHT = CHANCE UNDER NULL', C.muted));

  // 25: Tallest bar at 5 (expected)
  const expTag = pill('EXPECTED: 5', C.amber, 15);
  expTag.moveTo([bx(5), BASE + bh(5) + 0.42, 0]);
  await until(S(25));
  await play(
    new M.Indicate(bars[5], { color: C.amber }),
    new M.FadeIn(expTag),
    ...say('TALLEST AT 5 (HALF OF 10)', C.amber)
  );

  // 26: Our result 9 in the right tail
  const tag9 = pill('9 (OURS)', C.amber, 15);
  tag9.moveTo([bx(9), BASE + bh(9) + 0.95, 0]);
  const arr9 = new M.Arrow({ start: [bx(9), BASE + bh(9) + 0.68, 0], end: [bx(9), BASE + bh(9) + 0.1, 0], color: C.amber, strokeWidth: 3 });
  await until(S(26));
  await play(
    new M.FadeIn(tag9),
    new M.Create(arr9),
    ...say('OUR 9 SITS IN THE RIGHT TAIL', C.amber)
  );

  // 27: p-value = area of bars 9 and 10
  const rTailBox = new M.RoundedRectangle({ width: SP * 2.15, height: 0.55, cornerRadius: 0.1, color: C.amber, strokeWidth: 2 });
  rTailBox.moveTo([(bx(9) + bx(10)) / 2, BASE + 0.22, 0]);
  await until(S(27));
  bars[9].setColor(C.amber); bars[9].setFill(C.amber, 0.95);
  bars[10].setColor(C.amber); bars[10].setFill(C.amber, 0.95);
  await play(
    new M.Create(rTailBox),
    ...fbox(['right tail: bars 9 + 10', ['10/1024 + 1/1024 = 0.011', C.amber]], C.amber),
    ...say('P-VALUE = BARS 9 + 10', C.amber)
  );

  // 28: Binomial distribution
  await until(S(28));
  await play(...say('BINOMIAL DISTRIBUTION', C.violet));

  // 29: Exact binomial test
  await until(S(29));
  await play(...say('EXACT BINOMIAL TEST', C.cyan));

  // 30: Exact = real chances, no smooth bell shortcut
  const bellPts = [];
  for (let i = 0; i <= 40; i++) {
    const k = (i / 40) * 10;
    const y = BASE + MAXH * Math.exp(-0.5 * Math.pow((k - 5) / Math.sqrt(2.5), 2));
    bellPts.push([bx(k), y, 0]);
  }
  const bell = new M.VMobject({ color: C.muted, strokeWidth: 2 });
  bell.setPointsAsCorners(bellPts);
  await until(S(30));
  await play(
    new M.Create(bell),
    ...say('EXACT: REAL BARS, NO BELL SHORTCUT', C.cyan)
  );

  // 31: The formula
  await until(S(31));
  await play(
    new M.FadeOut(bell),
    ...fbox([['p = sum of P(count ≥ 9)', C.ink], ['  = P(9) + P(10)', C.muted], ['  = 11 / 1,024 ≈ 0.011', C.amber]], C.cyan),
    ...say('FORMULA: SUM EXTREME CHANCES', C.cyan)
  );

  // 32: Read it
  await until(S(32));
  await play(
    new M.Indicate(rTailBox, { color: C.amber }),
    ...say('ADD CHANCES AS FAR OUT OR MORE', C.amber)
  );

  // 33: What is it for?
  await until(S(33));
  await play(...say('USE: YES/NO COUNT VS FIXED CHANCE', C.green));

  // 34: Examples
  await until(S(34));
  await play(
    ...fbox(['examples:', '• pass rate', '• click rate', '• share of defects'], C.green),
    ...say('PASS RATE • CLICK RATE • DEFECTS', C.green)
  );

  // 35: Works with very few cases
  await until(S(35));
  await play(...say('WORKS EVEN WITH FEW CASES', C.cyan));

  // 36: Common trap: choosing direction after seeing data
  await until(S(36));
  await play(...say('TRAP 1: PICKING DIRECTION AFTER', C.violet));

  // 37: One-sided (right tail only)
  await until(S(37));
  await play(
    new M.Indicate(rTailBox, { color: C.amber }),
    ...fbox(['fixed before: "better"', ['right tail: 11/1024 ≈ 0.011', C.amber]], C.amber)
  );

  // 38: Two-sided (both tails: p doubles)
  const lTailBox = new M.RoundedRectangle({ width: SP * 2.15, height: 0.55, cornerRadius: 0.1, color: C.violet, strokeWidth: 2 });
  lTailBox.moveTo([(bx(0) + bx(1)) / 2, BASE + 0.22, 0]);
  const lTag = pill('LEFT TAIL: 0 OR 1', C.violet, 15);
  lTag.moveTo([(bx(0) + bx(1)) / 2 + (P ? 0.35 : 0.2), BASE + 0.95, 0]);
  await until(S(38));
  bars[0].setColor(C.violet); bars[0].setFill(C.violet, 0.95);
  bars[1].setColor(C.violet); bars[1].setFill(C.violet, 0.95);
  await play(
    new M.Create(lTailBox),
    new M.FadeIn(lTag),
    ...fbox(['no direction fixed:', ['both tails: 22/1024 ≈ 0.021', C.violet]], C.violet),
    ...say('BOTH TAILS: P DOUBLES (~2 IN 100)', C.violet)
  );

  // 39: Another trap: 10 tickets are few
  await until(S(39));
  bars[0].setColor(C.cyan); bars[0].setFill(C.cyan, 0.75);
  bars[1].setColor(C.cyan); bars[1].setFill(C.cyan, 0.75);
  await play(
    new M.FadeOut(new M.VGroup(lTailBox, lTag)),
    ...fbox(['trap 2: 10 tickets are few', 'luck is unlikely —', ['NOT "rate = 90% exactly"', C.violet]], C.violet),
    ...say('SMALL P ≠ EXACTLY 90%', C.violet)
  );

  // 40: In one sentence
  await until(S(40));
  await play(
    new M.Indicate(rTailBox, { color: C.amber }),
    ...fbox([['Exact binomial test', C.cyan], 'how often pure chance gives', ['a count as extreme as yours', C.amber]], C.cyan),
    ...say('EXACT BINOMIAL TEST', C.cyan)
  );
}
