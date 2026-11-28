// 15.1.2 Exploration and exploitation: try or choose what looks best.
// Beat i = sentence i (0-based, 51 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const ORANGE = '#fb923c';
  const SEQ_A = [1, 0, 0, 1, 0, 1, 0, 1, 0, 1];
  const SEQ_B = [0, 1, 1, 1, 0, 1, 1, 1, 1, 0];

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]), phone (8 x 14.22, y in [-5.5, 4.3])
  const CX = P ? 0 : -2.3;
  const PILL = P ? [0, 4.3, 0] : [CX, 1.96, 0];
  const BOXP = P ? [0, -4.15, 0] : [4.55, -0.55, 0];
  const BOX_MAXW = P ? FW - 0.6 : 4.2;
  const LEARNER_Y = P ? 3.5 : 1.32;

  const CW = P ? 3.7 : 4.0, CH = P ? 5.0 : 3.70, CY = P ? 0.45 : -0.92;
  const AX = P ? -1.95 : CX - 2.25, BX = P ? 1.95 : CX + 2.25;
  const BW = P ? 3.0 : 3.20, BH = P ? 0.34 : 0.28;
  const DR = P ? 0.17 : 0.15, DX = P ? 0.62 : 0.62;

  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 18);
  const pct = (r, n) => n ? Math.round(r / n * 1000) / 10 : 0;
  const fmtPct = x => (Number.isInteger(x) ? String(x) : x.toFixed(1)) + '%';

  // Single formula box at BOXP
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 19, lh = P ? 0.44 : 0.39;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    if (wd > BOX_MAXW) g.scale(BOX_MAXW / wd);
    const a = [new M.FadeIn(g, { runTime: 0.6 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.45 }));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow; boxNow = null;
    return [new M.FadeOut(old, { runTime: 0.45 })];
  }

  // Reusable primitive builders
  function quizIcon(x, y) {
    const b = new M.RoundedRectangle({ width: 0.36, height: 0.36, cornerRadius: 0.08, color: C.cyan, strokeWidth: 2 });
    b.setFill(C.cyan, 0.16); b.moveTo([x, y, 0]);
    const q = T('?', P ? 16 : 17, C.cyan, true, true); q.moveTo([x, y, 0]);
    return new M.VGroup(b, q);
  }
  function reminderIcon(x, y) {
    const dome = new M.Arc({ radius: 0.14, startAngle: 0, angle: Math.PI, color: ORANGE, strokeWidth: 2.4 });
    dome.setFill(ORANGE, 0.22); dome.moveTo([x, y - 0.02, 0]);
    const brim = new M.Line({ start: [x - 0.18, y - 0.08, 0], end: [x + 0.18, y - 0.08, 0], color: ORANGE, strokeWidth: 2.4 });
    const clap = new M.Dot({ point: [x, y - 0.14, 0], radius: 0.04, color: ORANGE });
    return new M.VGroup(dome, brim, clap);
  }
  function rewardDot(kind, pos) {
    if (kind === 1) {
      const c = new M.Circle({ radius: DR, color: C.green, strokeWidth: 2.2 });
      c.setFill(C.green, 0.24); c.moveTo(pos);
      const s = T('✓', P ? 17 : 15, C.green, true, true); s.moveTo(pos);
      return new M.VGroup(c, s);
    }
    if (kind === 0) {
      const c = new M.Circle({ radius: DR, color: C.muted, strokeWidth: 2 });
      c.setFill(C.muted, 0.18); c.moveTo(pos);
      const s = T('×', P ? 17 : 15, C.muted, true, true); s.moveTo(pos);
      return new M.VGroup(c, s);
    }
    const c = new M.Circle({ radius: DR, color: C.muted, strokeWidth: 1.8 });
    c.setFill(C.card, 0.96); c.moveTo(pos);
    const s = T('?', P ? 17 : 15, C.muted, true, true); s.moveTo(pos);
    return new M.VGroup(c, s);
  }
  function learnerBadge(x, y, label, col = C.ink) {
    const txt = T(label, P ? 18 : 16, col, false, true);
    const dx = label ? -(txt.getWidth() / 2 + 0.28) : 0;
    const halo = new M.Dot({ point: [x + dx, y, 0], radius: 0.26, color: col }); halo.setFill(col, 0.22);
    const core = new M.Dot({ point: [x + dx, y, 0], radius: 0.12, color: col }); core.setFill(col, 0.95);
    if (!label) return new M.VGroup(halo, core);
    txt.moveTo([x + 0.18, y, 0]);
    return new M.VGroup(halo, core, txt);
  }

  // Prompt Card builder & dynamic updaters
  function makeBarRect(card, rate) {
    const w = Math.max(0.06, rate * BW);
    const r = new M.Rectangle({ width: w, height: BH, color: card.color, strokeWidth: 0 });
    r.setFill(card.color, rate > 0.001 ? 0.88 : 0.18);
    r.moveTo([card.barLeft + w / 2, card.barY, 0]);
    return r;
  }
  function makeUncRect(card, rate, n) {
    const hw = n > 0 ? Math.min(0.42, 0.42 / Math.sqrt(n)) : 0.5;
    const lo = Math.max(0, rate - hw), hi = Math.min(1, rate + hw);
    const w = Math.max(0.14, (hi - lo) * BW);
    const r = new M.RoundedRectangle({ width: w, height: BH + 0.22, cornerRadius: 0.08, color: card.color, strokeWidth: 1 });
    r.setFill(card.color, 0.18);
    r.setStrokeOpacity(0.45);
    r.moveTo([card.barLeft + (lo + hi) / 2 * BW, card.barY, -0.01]);
    return r;
  }
  function buildCard(id, x, title, sub, color) {
    const frame = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.22, color, strokeWidth: 2.6 });
    frame.setFill(C.card, 0.94); frame.moveTo([x, CY, -0.02]);
    const headY = CY + (P ? 2.05 : 1.46);
    const icon = id === 'A' ? quizIcon(x - (P ? 1.15 : 1.32), headY) : reminderIcon(x - (P ? 1.15 : 1.32), headY);
    const titleT = T(title, P ? 22 : 21, color, false, true); titleT.moveTo([x + 0.12, headY, 0]);
    const subT = T(sub, P ? 17 : 14, C.muted); subT.moveTo([x, CY + (P ? 1.6 : 1.10), 0]);
    const divY = CY + (P ? 1.3 : 0.86);
    const div = new M.Line({ start: [x - CW / 2 + 0.25, divY, 0], end: [x + CW / 2 - 0.25, divY, 0], color: C.line, strokeWidth: 1.5 });

    const barY = CY - (P ? 1.15 : 0.90), barLeft = x - BW / 2;
    const track = new M.Rectangle({ width: BW, height: BH, color: C.line, strokeWidth: 1.2 });
    track.setFill(C.bg, 0.9); track.moveTo([x, barY, -0.01]);

    const card = {
      id, x, color, frame, icon, titleT, subT, div, track, barY, barLeft,
      statsY: CY - (P ? 0.5 : 0.46),
      infoY: CY - (P ? 1.85 : 1.44),
      rowY: [CY + (P ? 0.85 : 0.48), CY + (P ? 0.25 : 0.04)],
      slotPos(idx) {
        const r = Math.floor(idx / 5), c = idx % 5;
        return [x + (c - 2) * DX, this.rowY[r], 0];
      },
      dots: [],
      bar: null,
      unc: null,
      statsT: null,
      infoT: null,
      extras: [],
      baseObjs() { return [this.frame, this.icon, this.titleT, this.subT, this.div]; },
      allLive() {
        const out = [...this.baseObjs(), this.track, ...this.dots, ...this.extras];
        if (this.bar) out.push(this.bar);
        if (this.unc) out.push(this.unc);
        if (this.statsT) out.push(this.statsT);
        if (this.infoT) out.push(this.infoT);
        return out;
      }
    };
    return card;
  }
  function setStats(card, text, col = card.color) {
    const nt = T(text, P ? 19 : 17, col, true, true); nt.moveTo([card.x, card.statsY, 0]);
    const a = [new M.FadeIn(nt, { runTime: 0.45 })];
    if (card.statsT) a.push(new M.FadeOut(card.statsT, { runTime: 0.35 }));
    card.statsT = nt;
    return a;
  }
  function setInfo(card, text, col = C.muted) {
    const nt = T(text, P ? 16 : 14, col, true); nt.moveTo([card.x, card.infoY, 0]);
    const a = [new M.FadeIn(nt, { runTime: 0.45 })];
    if (card.infoT) a.push(new M.FadeOut(card.infoT, { runTime: 0.35 }));
    card.infoT = nt;
    return a;
  }
  function updateBar(card, rate, n) {
    const a = [];
    if (!card.bar) {
      card.bar = makeBarRect(card, rate);
      a.push(new M.FadeIn(card.bar, { runTime: 0.6 }));
    } else {
      a.push(new M.Transform(card.bar, makeBarRect(card, rate), { runTime: 0.75 }));
    }
    return a;
  }

  // =========================================================================
  // BEATS 0–3: Study app & two prompts
  // =========================================================================
  const introLearners = Array.from({ length: 5 }, (_, k) => {
    const x = CX + (k - 2) * (P ? 1.4 : 1.35), y = P ? 1.0 : -0.15;
    return learnerBadge(x, y, '', C.cyan);
  });
  const introTag = T('Study app learners', P ? 21 : 20, C.muted);
  introTag.moveTo([CX, P ? 0.0 : -0.95, 0]);

  await until(S(0));
  await play(
    new M.LaggedStart(introLearners.map(g => new M.FadeIn(g)), { lagRatio: 0.14, runTime: 1.2 }),
    new M.FadeIn(introTag, { runTime: 0.8 }),
    ...(P ? fbox([['Goal:', C.green], ['learners come back', C.ink], ['the next day', C.ink]], C.green) : []),
    ...say('HELP LEARNERS RETURN TO YOUR APP')
  );

  let cardA = buildCard('A', AX, 'Prompt A', 'Quick quiz', C.cyan);
  let cardB = buildCard('B', BX, 'Prompt B', 'Study reminder', ORANGE);

  await until(S(1));
  await play(
    ...introLearners.map(g => new M.FadeOut(g, { runTime: 0.45 })),
    new M.FadeOut(introTag, { runTime: 0.45 }),
    ...clearBox(),
    ...cardA.baseObjs().map(o => new M.FadeIn(o, { runTime: 0.7 })),
    ...cardB.baseObjs().map(o => new M.FadeIn(o, { runTime: 0.7 })),
    ...fbox([['Two prompts:', C.muted], ['A = quick quiz', C.cyan], ['B = study reminder', ORANGE]]),
    ...say('A = QUIZ   ·   B = REMINDER')
  );

  await until(S(2));
  await play(
    new M.Indicate(cardA.titleT, { color: C.amber, runTime: 0.8 }),
    new M.Indicate(cardB.titleT, { color: C.amber, runTime: 0.8 }),
    ...fbox([['Goal:', C.amber], ['choose the prompt that', C.ink], ['brings more learners back', C.ink]], C.amber),
    ...say('GOAL: MORE LEARNERS RETURN', C.amber)
  );

  const qA0 = rewardDot(null, cardA.slotPos(0));
  const qB0 = rewardDot(null, cardB.slotPos(0));
  cardA.dots.push(qA0); cardB.dots.push(qB0);
  await until(S(3));
  await play(
    new M.FadeIn(qA0, { runTime: 0.6 }),
    new M.FadeIn(qB0, { runTime: 0.6 }),
    ...setStats(cardA, 'not tried yet', C.muted),
    ...setStats(cardB, 'not tried yet', C.muted),
    ...fbox([['We do not know yet.', C.violet], ['Try both prompts', C.ink], ['and watch the results.', C.ink]], C.violet),
    ...say('UNKNOWN: TRY THEM TO LEARN', C.violet)
  );

  // =========================================================================
  // BEATS 4–11: First two learners & side-by-side comparison
  // =========================================================================
  let activeLearner = learnerBadge(AX, LEARNER_Y, 'Learner 1', C.cyan);
  await until(S(4));
  await play(
    new M.FadeIn(activeLearner, { runTime: 0.6 }),
    new M.Indicate(cardA.frame, { color: C.cyan, runTime: 0.8 }),
    ...say('LEARNER 1 → PROMPT A', C.cyan)
  );

  const dA0 = rewardDot(1, cardA.slotPos(0));
  cardA.dots[0] = dA0;
  await until(S(5));
  await play(
    new M.FadeOut(activeLearner, { runTime: 0.4 }),
    new M.FadeOut(qA0, { runTime: 0.35 }),
    new M.FadeIn(dA0, { runTime: 0.55 }),
    new M.Flash(dA0, { color: C.green, runTime: 0.6 }),
    ...setStats(cardA, '1 / 1', C.green),
    ...fbox([['Results so far:', C.muted], ['A: reward 1', C.green], ['B: not tried yet', C.muted]], C.green),
    ...say('RETURNED → REWARD = 1', C.green)
  );
  activeLearner = null;

  activeLearner = learnerBadge(BX, LEARNER_Y, 'Learner 2', ORANGE);
  await until(S(6));
  await play(
    new M.FadeIn(activeLearner, { runTime: 0.6 }),
    new M.Indicate(cardB.frame, { color: ORANGE, runTime: 0.8 }),
    ...say('LEARNER 2 → PROMPT B', ORANGE)
  );

  const dB0 = rewardDot(0, cardB.slotPos(0));
  cardB.dots[0] = dB0;
  await until(S(7));
  await play(
    new M.FadeOut(activeLearner, { runTime: 0.4 }),
    new M.FadeOut(qB0, { runTime: 0.35 }),
    new M.FadeIn(dB0, { runTime: 0.55 }),
    ...setStats(cardB, '0 / 1', C.muted),
    ...fbox([['Results so far:', C.muted], ['A: reward 1', C.green], ['B: reward 0', C.muted]], C.muted),
    ...say('NO RETURN → REWARD = 0', C.muted)
  );
  activeLearner = null;

  await until(S(8));
  await play(
    new M.FadeIn(cardA.track, { runTime: 0.5 }),
    new M.FadeIn(cardB.track, { runTime: 0.5 }),
    ...fbox([['Side by side:', C.muted], ['A: 1 return / 1', C.cyan], ['B: 0 returns / 1', ORANGE]]),
    ...say('RESULTS SIDE BY SIDE')
  );

  await until(S(9));
  await play(
    ...updateBar(cardA, 1, 1),
    ...setStats(cardA, '1 / 1  =  100%', C.cyan),
    ...setInfo(cardA, '1 choice', C.muted),
    ...fbox([['A: 1 ÷ 1 = 100%', C.cyan], ['B: 0 / 1', C.muted]], C.cyan),
    ...say('A: 1 FROM 1 → 100%', C.cyan)
  );

  await until(S(10));
  await play(
    ...updateBar(cardB, 0, 1),
    ...setStats(cardB, '0 / 1  =  0%', ORANGE),
    ...setInfo(cardB, '1 choice', C.muted),
    ...fbox([['A: 1 ÷ 1 = 100%', C.cyan], ['B: 0 ÷ 1 = 0%', ORANGE]], ORANGE),
    ...say('B: 0 FROM 1 → 0%', ORANGE)
  );

  activeLearner = learnerBadge(CX, LEARNER_Y, 'Learner 3 ?', C.amber);
  await until(S(11));
  await play(
    new M.FadeIn(activeLearner, { runTime: 0.6 }),
    ...say('NEXT LEARNER: A OR B?', C.amber)
  );

  // =========================================================================
  // BEATS 12–15: Restaurant analogy
  // =========================================================================
  const plateY = P ? 0.9 : -0.35, plateR = P ? 1.3 : 1.32;
  const p1X = P ? -1.85 : CX - 2.2, p2X = P ? 1.85 : CX + 2.2;
  function makePlate(x, label, col) {
    const outer = new M.Circle({ radius: plateR, color: col, strokeWidth: 2.6 });
    outer.setFill(C.card, 0.94); outer.moveTo([x, plateY, -0.01]);
    const inner = new M.Circle({ radius: plateR * 0.72, color: C.line, strokeWidth: 1.5 });
    inner.setFill(C.bg, 0.85); inner.moveTo([x, plateY, 0]);
    const lbl = T(label, P ? 20 : 21, col, false, true); lbl.moveTo([x, plateY - plateR - 0.42, 0]);
    return [outer, inner, lbl];
  }
  const plate1 = makePlate(p1X, 'Meal 1', C.cyan);
  const plate2 = makePlate(p2X, 'Meal 2', ORANGE);
  const mealObjs = [...plate1, ...plate2];

  await until(S(12));
  await play(
    ...cardA.allLive().map(o => new M.FadeOut(o, { runTime: 0.45 })),
    ...cardB.allLive().map(o => new M.FadeOut(o, { runTime: 0.45 })),
    new M.FadeOut(activeLearner, { runTime: 0.45 }),
    ...clearBox(),
    ...mealObjs.map(o => new M.FadeIn(o, { runTime: 0.7 })),
    ...say('RESTAURANT: TWO MEALS TRIED', C.violet)
  );
  activeLearner = null;

  const m1Badge = rewardDot(1, [p1X, plateY + 0.16, 0]);
  const m1Text = T('Good', P ? 17 : 18, C.green, false, true); m1Text.moveTo([p1X, plateY - 0.34, 0]);
  const m2Badge = rewardDot(0, [p2X, plateY + 0.16, 0]);
  const m2Text = T('Not good', P ? 16 : 17, C.muted, false, true); m2Text.moveTo([p2X, plateY - 0.34, 0]);
  mealObjs.push(m1Badge, m1Text, m2Badge, m2Text);

  await until(S(13));
  await play(
    new M.FadeIn(m1Badge, { runTime: 0.5 }), new M.FadeIn(m1Text, { runTime: 0.5 }),
    new M.FadeIn(m2Badge, { runTime: 0.5 }), new M.FadeIn(m2Text, { runTime: 0.5 }),
    ...say('ONE GOOD  ·  ONE NOT GOOD')
  );

  const ring1 = new M.Circle({ radius: plateR + 0.16, color: C.amber, strokeWidth: 3.5 });
  ring1.moveTo([p1X, plateY, 0]);
  const cap1 = T('Order again', P ? 16 : 17, C.amber, true); cap1.moveTo([p1X, plateY - plateR - 0.88, 0]);
  await until(S(14));
  await play(
    new M.Create(ring1, { runTime: 0.7 }),
    new M.FadeIn(cap1, { runTime: 0.5 }),
    ...fbox([['Option 1:', C.amber], ['order the meal', C.ink], ['you already enjoyed', C.ink]], C.amber),
    ...say('ORDER WHAT LOOKS GOOD', C.amber)
  );

  const ring2 = new M.Circle({ radius: plateR + 0.16, color: C.violet, strokeWidth: 3.5 });
  ring2.moveTo([p2X, plateY, 0]);
  const cap2 = T('Try again?', P ? 16 : 17, C.violet, true); cap2.moveTo([p2X, plateY - plateR - 0.88, 0]);
  await until(S(15));
  await play(
    new M.FadeOut(ring1, { runTime: 0.4 }), new M.FadeOut(cap1, { runTime: 0.4 }),
    new M.Create(ring2, { runTime: 0.7 }), new M.FadeIn(cap2, { runTime: 0.5 }),
    ...fbox([['Option 2:', C.violet], ['try the other meal', C.ink], ['to learn more', C.ink]], C.violet),
    ...say('OR TRY AGAIN TO LEARN', C.violet)
  );
  mealObjs.push(ring2, cap2);

  // =========================================================================
  // BEATS 16–18: Back to study app — name Exploitation & Exploration
  // =========================================================================
  cardA = buildCard('A', AX, 'Prompt A', 'Quick quiz', C.cyan);
  cardB = buildCard('B', BX, 'Prompt B', 'Study reminder', ORANGE);
  const initA0 = rewardDot(1, cardA.slotPos(0));
  const initB0 = rewardDot(0, cardB.slotPos(0));
  cardA.dots.push(initA0); cardB.dots.push(initB0);
  cardA.bar = makeBarRect(cardA, 1);
  cardB.bar = makeBarRect(cardB, 0);
  cardA.statsT = T('1 / 1  =  100%', P ? 19 : 17, C.cyan, true, true); cardA.statsT.moveTo([cardA.x, cardA.statsY, 0]);
  cardB.statsT = T('0 / 1  =  0%', P ? 19 : 17, ORANGE, true, true); cardB.statsT.moveTo([cardB.x, cardB.statsY, 0]);
  cardA.infoT = T('1 choice', P ? 16 : 14, C.muted, true); cardA.infoT.moveTo([cardA.x, cardA.infoY, 0]);
  cardB.infoT = T('1 choice', P ? 16 : 14, C.muted, true); cardB.infoT.moveTo([cardB.x, cardB.infoY, 0]);

  await until(S(16));
  await play(
    ...mealObjs.map(o => new M.FadeOut(o, { runTime: 0.45 })),
    ...clearBox(),
    ...cardA.allLive().map(o => new M.FadeIn(o, { runTime: 0.65 })),
    ...cardB.allLive().map(o => new M.FadeIn(o, { runTime: 0.65 })),
    ...say('SAME CHOICE FOR OUR APP')
  );

  await until(S(17));
  await play(
    new M.Indicate(cardA.frame, { color: C.amber, runTime: 0.9 }),
    ...fbox([['Exploitation:', C.amber], ['choose what looks', C.ink], ['best right now', C.ink]], C.amber),
    ...say('EXPLOITATION = CHOOSE BEST NOW', C.amber)
  );

  await until(S(18));
  await play(
    new M.Indicate(cardB.frame, { color: C.violet, runTime: 0.9 }),
    ...fbox([['Exploitation:', C.amber], ['  use best now', C.muted], ['Exploration:', C.violet], ['  try to learn more', C.ink]], C.violet),
    ...say('EXPLORATION = TRY TO LEARN', C.violet)
  );

  // =========================================================================
  // BEATS 19–35: Exploitation only — step by step through fixed sequence A
  // =========================================================================
  await until(S(19));
  await play(
    ...fbox([['Rule: EXPLOIT ONLY', C.amber], ['A: 1/1 = 100%', C.cyan], ['B: 0/1 = 0%', ORANGE]], C.amber),
    ...say('EXPLOITATION ONLY', C.amber)
  );

  // Step 1 (Choice 2 of A): observe 0 -> 1/2 = 50%
  let qSlot = rewardDot(null, cardA.slotPos(1));
  activeLearner = learnerBadge(AX, LEARNER_Y, 'Choose A', C.amber);
  await until(S(20));
  await play(
    new M.FadeIn(activeLearner, { runTime: 0.5 }),
    new M.FadeIn(qSlot, { runTime: 0.5 }),
    new M.Indicate(cardA.frame, { color: C.cyan, runTime: 0.7 }),
    ...say('100% > 0% → CHOOSE A', C.cyan)
  );

  let newDot = rewardDot(0, cardA.slotPos(1));
  cardA.dots.push(newDot);
  await until(S(21));
  await play(
    new M.FadeOut(activeLearner, { runTime: 0.35 }),
    new M.FadeOut(qSlot, { runTime: 0.35 }),
    new M.FadeIn(newDot, { runTime: 0.55 }),
    ...say('NO RETURN → REWARD = 0', C.muted)
  );
  activeLearner = null;

  await until(S(22));
  await play(
    ...setStats(cardA, '1 / 2', C.cyan),
    ...setInfo(cardA, '2 choices', C.muted),
    ...fbox([['A: 1 return / 2', C.cyan], ['B: 0 returns / 1', ORANGE]]),
    ...say('A: 1 RETURN FROM 2', C.cyan)
  );

  await until(S(23));
  await play(
    ...updateBar(cardA, 0.5, 2),
    ...setStats(cardA, '1 / 2  =  50%', C.cyan),
    ...fbox([['A: 1 ÷ 2 = 50%', C.cyan], ['B: 0 ÷ 1 = 0%', ORANGE]]),
    ...say('A RATE FALLS TO 50%', C.cyan)
  );

  // Step 2 (Choice 3 of A): observe 0 -> 1/3 = 33.3%
  qSlot = rewardDot(null, cardA.slotPos(2));
  activeLearner = learnerBadge(AX, LEARNER_Y, 'Choose A', C.amber);
  await until(S(24));
  await play(
    new M.FadeIn(activeLearner, { runTime: 0.5 }),
    new M.FadeIn(qSlot, { runTime: 0.5 }),
    new M.Indicate(cardA.frame, { color: C.amber, runTime: 0.7 }),
    ...say('50% > 0% → CHOOSE A AGAIN', C.amber)
  );

  newDot = rewardDot(0, cardA.slotPos(2));
  cardA.dots.push(newDot);
  await until(S(25));
  await play(
    new M.FadeOut(activeLearner, { runTime: 0.35 }),
    new M.FadeOut(qSlot, { runTime: 0.35 }),
    new M.FadeIn(newDot, { runTime: 0.5 }),
    ...say('NO RETURN AGAIN (0)', C.muted)
  );
  activeLearner = null;

  await until(S(26));
  await play(
    ...setStats(cardA, '1 / 3', C.cyan),
    ...setInfo(cardA, '3 choices', C.muted),
    ...fbox([['A: 1 return / 3', C.cyan], ['B: 0 returns / 1', ORANGE]]),
    ...say('A: 1 RETURN FROM 3', C.cyan)
  );

  await until(S(27));
  await play(
    ...updateBar(cardA, 1 / 3, 3),
    ...setStats(cardA, '1 / 3  ≈  33.3%', C.cyan),
    ...fbox([['A: 1 ÷ 3 ≈ 33.3%', C.cyan], ['B: 0 ÷ 1 = 0%', ORANGE]]),
    ...say('A RATE FALLS TO ~33%', C.cyan)
  );

  // Step 3 (Choice 4 of A): observe 1 -> 2/4 = 50%
  qSlot = rewardDot(null, cardA.slotPos(3));
  activeLearner = learnerBadge(AX, LEARNER_Y, 'Choose A', C.amber);
  await until(S(28));
  await play(
    new M.FadeIn(activeLearner, { runTime: 0.5 }),
    new M.FadeIn(qSlot, { runTime: 0.5 }),
    new M.Indicate(cardA.frame, { color: C.amber, runTime: 0.7 }),
    ...say('33% > 0% → CHOOSE A AGAIN', C.amber)
  );

  newDot = rewardDot(1, cardA.slotPos(3));
  cardA.dots.push(newDot);
  await until(S(29));
  await play(
    new M.FadeOut(activeLearner, { runTime: 0.35 }),
    new M.FadeOut(qSlot, { runTime: 0.35 }),
    new M.FadeIn(newDot, { runTime: 0.5 }),
    new M.Flash(newDot, { color: C.green, runTime: 0.55 }),
    ...say('RETURNED! (+1)', C.green)
  );
  activeLearner = null;

  await until(S(30));
  await play(
    ...updateBar(cardA, 0.5, 4),
    ...setStats(cardA, '2 / 4  =  50%', C.cyan),
    ...setInfo(cardA, '4 choices', C.muted),
    ...fbox([['A: 2 ÷ 4 = 50%', C.cyan], ['B: 0 ÷ 1 = 0%', ORANGE]]),
    ...say('A: 2 FROM 4 → 50%', C.cyan)
  );

  // Choices 5..10 of A: fixed sequence indices 4..9 = [0, 1, 0, 1, 0, 1]
  const moreDotsA = [];
  for (let i = 4; i < 10; i++) {
    const d = rewardDot(SEQ_A[i], cardA.slotPos(i));
    cardA.dots.push(d);
    moreDotsA.push(d);
  }
  await until(S(31));
  await play(
    new M.LaggedStart(moreDotsA.map(d => new M.FadeIn(d)), { lagRatio: 0.25, runTime: 2.1 }),
    ...say('APP KEEPS CHOOSING A...', C.amber)
  );

  const greenDotsA = cardA.dots.filter((_, idx) => SEQ_A[idx] === 1);
  await until(S(32));
  await play(
    new M.LaggedStart(greenDotsA.map(d => new M.Indicate(d, { color: C.green })), { lagRatio: 0.14, runTime: 1.4 }),
    ...setStats(cardA, '5 / 10  =  50%', C.green),
    ...setInfo(cardA, '10 choices', C.muted),
    ...fbox([['A: 5 returns', C.green], ['   from 10 choices', C.ink], ['B: 0 returns / 1', ORANGE]]),
    ...say('10 CHOICES OF A → 5 RETURNS', C.green)
  );

  await until(S(33));
  await play(
    ...updateBar(cardA, 0.5, 10),
    ...setStats(cardA, '5 / 10  =  50%', C.cyan),
    ...fbox([['A estimate:', C.muted], ['5 ÷ 10 = 50%', C.cyan]], C.cyan),
    ...say('A ESTIMATE = 50%', C.cyan)
  );

  await until(S(34));
  await play(
    ...say('HOW WE FIND THE ESTIMATE', C.cyan)
  );

  await until(S(35));
  await play(
    ...fbox([
      ['estimated rate =', C.ink],
      ['  total reward ÷ choices', C.amber],
      ['A: 5 ÷ 10 = 50%', C.cyan]
    ], C.amber),
    ...say('RATE = TOTAL REWARD ÷ CHOICES', C.amber)
  );

  // =========================================================================
  // BEATS 36–37: B is stuck at 0%
  // =========================================================================
  await until(S(36));
  await play(
    new M.Indicate(cardB.dots[0], { color: ORANGE, runTime: 0.9 }),
    new M.Indicate(cardB.frame, { color: ORANGE, runTime: 0.9 }),
    ...say('B: STILL ONLY 1 RESULT', ORANGE)
  );

  await until(S(37));
  await play(
    new M.Indicate(cardB.bar, { color: C.pink, runTime: 0.9 }),
    ...setInfo(cardB, 'still 1 choice', C.pink),
    ...fbox([
      ['A: 5 ÷ 10 = 50%', C.cyan],
      ['B: 0 ÷ 1  = 0%', C.pink],
      ['B never tried again', C.muted]
    ], C.pink),
    ...say('B STUCK AT 0% — NEVER TRIED', C.pink)
  );

  // =========================================================================
  // BEATS 38–41: Reveal hidden true return rates (A = 50%, B = 70%)
  // =========================================================================
  await until(S(38));
  await play(
    ...setInfo(cardA, 'True rate: ?', C.violet),
    ...setInfo(cardB, 'True rate: ?', C.violet),
    ...fbox([['Hidden from app:', C.violet], ['true return rates', C.ink]], C.violet),
    ...say('HIDDEN FROM APP: TRUE RATES', C.violet)
  );

  const trueAX = cardA.barLeft + 0.50 * BW;
  const trueLineA = new M.DashedLine({
    start: [trueAX, cardA.barY - 0.30, 0.02],
    end: [trueAX, cardA.barY + 0.30, 0.02],
    color: C.cyan, strokeWidth: 3
  });
  cardA.extras.push(trueLineA);
  await until(S(39));
  await play(
    new M.Create(trueLineA, { runTime: 0.7 }),
    ...setInfo(cardA, 'True: 50 / 100 (50%)', C.cyan),
    ...fbox([['True rates (hidden):', C.violet], ['A: 50 / 100 = 50%', C.cyan]], C.cyan),
    ...say('TRUE A = 50 OUT OF 100', C.cyan)
  );

  const trueBX = cardB.barLeft + 0.70 * BW;
  const trueLineB = new M.DashedLine({
    start: [trueBX, cardB.barY - 0.30, 0.02],
    end: [trueBX, cardB.barY + 0.30, 0.02],
    color: C.green, strokeWidth: 3.2
  });
  const ghostW = 0.70 * BW;
  const ghostB = new M.Rectangle({ width: ghostW, height: BH, color: C.green, strokeWidth: 1.5 });
  ghostB.setFill(C.green, 0.24); ghostB.moveTo([cardB.barLeft + ghostW / 2, cardB.barY, 0]);
  cardB.extras.push(trueLineB, ghostB);
  await until(S(40));
  await play(
    new M.FadeIn(ghostB, { runTime: 0.7 }),
    new M.Create(trueLineB, { runTime: 0.7 }),
    ...setInfo(cardB, 'True: 70 / 100 (70%)', C.green),
    ...fbox([['True rates (hidden):', C.violet], ['A: 50 / 100 = 50%', C.cyan], ['B: 70 / 100 = 70%', C.green]], C.green),
    ...say('TRUE B = 70 OUT OF 100', C.green)
  );

  await until(S(41));
  await play(
    new M.Indicate(trueLineB, { color: C.green, runTime: 0.9 }),
    new M.Indicate(cardB.statsT, { color: C.pink, runTime: 0.9 }),
    ...say('B IS BETTER — NEVER FOUND!', C.pink)
  );

  // =========================================================================
  // BEATS 42–44: Exploring B improves its estimate; today vs tomorrow
  // =========================================================================
  const exploreDotsB = [1, 2, 3].map(idx => {
    const d = rewardDot(SEQ_B[idx], cardB.slotPos(idx));
    cardB.dots.push(d);
    return d;
  });
  await until(S(42));
  await play(
    new M.LaggedStart(exploreDotsB.map(d => new M.FadeIn(d)), { lagRatio: 0.25, runTime: 1.1 }),
    ...updateBar(cardB, 0.75, 4),
    ...setStats(cardB, '3 / 4  =  75%', C.green),
    ...fbox([['Try B again:', C.violet], ['B: 0/1 → 3/4 (75%)', C.green], ['better estimate!', C.ink]], C.green),
    ...say('EXPLORE B → ESTIMATE IMPROVES', C.green)
  );

  await until(S(43));
  await play(
    ...fbox([['Today:', C.pink], ['trying what looks worse', C.ink], ['may earn less now', C.ink]], C.pink),
    ...say('TODAY: RISK LOWER REWARD', C.pink)
  );

  const futureDots = [-0.8, 0, 0.8].map(dx => learnerBadge(BX + dx, LEARNER_Y, '', C.green));
  await until(S(44));
  await play(
    new M.LaggedStart(futureDots.map(g => new M.FadeIn(g)), { lagRatio: 0.2, runTime: 0.9 }),
    ...fbox([['Today:', C.pink], ['  small risk', C.muted], ['Future learners:', C.green], ['  better choices!', C.green]], C.green),
    ...say('TOMORROW: BETTER CHOICES', C.green)
  );

  // =========================================================================
  // BEATS 45–50: Summary cards + balance beam + recap
  // =========================================================================
  const sumW = P ? 6.2 : 3.85, sumH = P ? 1.9 : 1.95;
  function makeSummaryCard(x, title, line1, line2, color, isExplore) {
    const sumY = P ? (isExplore ? 2.55 : 0.4) : 0.15;
    if (P) x = 0;
    const r = new M.RoundedRectangle({ width: sumW, height: sumH, cornerRadius: 0.2, color, strokeWidth: 2.5 });
    r.setFill(C.card, 0.95); r.moveTo([x, sumY, -0.01]);
    const badge = isExplore ? rewardDot(null, [x - sumW / 2 + 0.45, sumY + 0.52, 0]) : rewardDot(1, [x - sumW / 2 + 0.45, sumY + 0.52, 0]);
    const t = T(title, P ? 22 : 20, color, true, true); t.moveTo([x + 0.22, sumY + 0.52, 0]);
    const l1 = T(line1, P ? 19 : 16, C.ink); l1.moveTo([x, sumY - 0.12, 0]);
    const l2 = T(line2, P ? 18 : 16, C.muted); l2.moveTo([x, sumY - 0.55, 0]);
    return [r, badge, t, l1, l2];
  }
  const exploreCard = makeSummaryCard(AX, 'EXPLORATION', 'Try less-known choices', 'Learn what works well', C.violet, true);
  const exploitCard = makeSummaryCard(BX, 'EXPLOITATION', 'Choose best-looking now', 'Use what you know', C.amber, false);

  await until(S(45));
  await play(
    ...cardA.allLive().map(o => new M.FadeOut(o, { runTime: 0.45 })),
    ...cardB.allLive().map(o => new M.FadeOut(o, { runTime: 0.45 })),
    ...futureDots.map(g => new M.FadeOut(g, { runTime: 0.45 })),
    ...fbox([['Exploration:', C.violet], ['learn which choices', C.ink], ['work well', C.ink]], C.violet),
    ...exploreCard.map(o => new M.FadeIn(o, { runTime: 0.65 })),
    ...say('EXPLORATION = LEARN', C.violet)
  );

  await until(S(46));
  await play(
    ...exploitCard.map(o => new M.FadeIn(o, { runTime: 0.65 })),
    ...fbox([['Exploitation:', C.amber], ['use what we know', C.ink], ['to earn rewards', C.ink]], C.amber),
    ...say('EXPLOITATION = EARN REWARDS', C.amber)
  );

  // Balance beam below summary cards
  const beamY = P ? -1.55 : -1.85, halfSpan = P ? 2.4 : 2.7;
  const fulcTop = [CX, beamY - 0.05, 0];
  const fulcL = [CX - 0.32, beamY - 0.52, 0], fulcR = [CX + 0.32, beamY - 0.52, 0];
  const fulcrum = new M.VGroup(
    new M.Line({ start: fulcTop, end: fulcL, color: C.muted, strokeWidth: 2.5 }),
    new M.Line({ start: fulcTop, end: fulcR, color: C.muted, strokeWidth: 2.5 }),
    new M.Line({ start: fulcL, end: fulcR, color: C.muted, strokeWidth: 2.5 })
  );
  function beamEnd(tilt, side) {
    return [CX + side * halfSpan, beamY + side * tilt, 0];
  }
  function makeBeamLine(tilt, col) {
    return new M.Line({ start: beamEnd(tilt, -1), end: beamEnd(tilt, 1), color: col, strokeWidth: 4 });
  }
  function makePan(tilt, side, col) {
    const p = beamEnd(tilt, side);
    const d = new M.Dot({ point: [p[0], p[1] + 0.16, 0], radius: 0.16, color: col });
    d.setFill(col, 0.9);
    return d;
  }

  let beam = makeBeamLine(-0.52, C.pink);
  let panL = makePan(-0.52, -1, C.violet);
  let panR = makePan(-0.52, 1, C.amber);
  let balText = T('Too little exploration → stuck on worse prompt', P ? 14 : 16, C.pink, true);
  balText.moveTo([CX, beamY - 0.92, 0]);

  await until(S(47));
  await play(
    new M.FadeIn(fulcrum, { runTime: 0.5 }),
    new M.Create(beam, { runTime: 0.6 }),
    new M.FadeIn(panL, { runTime: 0.5 }),
    new M.FadeIn(panR, { runTime: 0.5 }),
    ...(P ? fbox([['Too little exploration:', C.pink], ['stuck on a worse prompt', C.ink]], C.pink) : [new M.FadeIn(balText, { runTime: 0.5 }), ...clearBox()]),
    ...say('TOO LITTLE → STUCK ON WORSE', C.pink)
  );

  const balText2 = T('Too much exploration → waste choices', P ? 14 : 16, C.pink, true);
  balText2.moveTo([CX, beamY - 0.92, 0]);
  await until(S(48));
  await play(
    new M.Transform(beam, makeBeamLine(0.52, C.pink), { runTime: 0.8 }),
    new M.Transform(panL, makePan(0.52, -1, C.violet), { runTime: 0.8 }),
    new M.Transform(panR, makePan(0.52, 1, C.amber), { runTime: 0.8 }),
    ...(P ? fbox([['Too much exploration:', C.pink], ['choices wasted on', C.ink], ['weaker prompts', C.ink]], C.pink) : [new M.FadeOut(balText, { runTime: 0.35 }), new M.FadeIn(balText2, { runTime: 0.5 })]),
    ...say('TOO MUCH → WASTE CHOICES', C.pink)
  );
  balText = balText2;

  const balText3 = T('Next lesson: a rule to balance both', P ? 15 : 17, C.green, true);
  balText3.moveTo([CX, beamY - 0.92, 0]);
  await until(S(49));
  await play(
    new M.Transform(beam, makeBeamLine(0, C.green), { runTime: 0.8 }),
    new M.Transform(panL, makePan(0, -1, C.violet), { runTime: 0.8 }),
    new M.Transform(panR, makePan(0, 1, C.amber), { runTime: 0.8 }),
    ...(P ? fbox([['Next lesson:', C.green], ['a rule to balance both', C.ink]], C.green) : [new M.FadeOut(balText, { runTime: 0.35 }), new M.FadeIn(balText3, { runTime: 0.5 })]),
    ...say('NEXT: A RULE TO BALANCE BOTH', C.green)
  );

  await until(S(50));
  await play(
    new M.Indicate(exploreCard[0], { color: C.violet, runTime: 0.9 }),
    new M.Indicate(exploitCard[0], { color: C.amber, runTime: 0.9 }),
    ...fbox([
      ['Exploitation:', C.amber],
      ['  use what we know', C.ink],
      ['Exploration:', C.violet],
      ['  learn what we do not', C.ink]
    ], C.cyan),
    ...say('USE WHAT YOU KNOW · LEARN MORE', C.cyan)
  );
}
