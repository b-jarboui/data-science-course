// 15.1.3 Epsilon-greedy selection: leave room to explore
// Beat i = sentence i (0-based, 54 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const ORANGE = '#fb923c';

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) and phone (8 x 14.22, y in [-5.5, 4.3])
  const PILL = P ? [0, 4.25, 0] : [0, 2.02, 0];
  const BOXP = P ? [0, -4.45, 0] : [4.65, -0.55, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 18);

  const CARD_W = P ? 6.8 : 4.8;
  const CARD_H = P ? 1.75 : 1.62;
  const CA_POS = P ? [0, -0.05, 0] : [0, 0.45, 0];
  const CB_POS = P ? [0, -2.05, 0] : [0, -1.55, 0];
  const W1_POS = P ? [-1.45, 2.2, 0] : [-4.65, 0.15, 0];
  const W1_R = P ? 1.3 : 1.12;
  const W2_POS = P ? [2.1, 2.3, 0] : [-4.65, -1.98, 0];
  const W2_R = P ? 0.85 : 0.66;

  // Formula box: one box at a time; lines = ['text' | ['text', color]]
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 19, lh = P ? 0.43 : 0.39;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.62, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.31, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.0 : 3.7;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.55 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.45 }));
    boxNow = g;
    return a;
  }

  // Geometric primitives
  function makeLearner(pos, color = C.ink, labelText = '') {
    const halo = new M.Circle({ radius: 0.34, color, strokeWidth: 0 });
    halo.setFill(color, 0.16); halo.moveTo(pos);
    const core = new M.Circle({ radius: 0.19, color, strokeWidth: 2.5 });
    core.setFill(color, 0.85); core.moveTo(pos);
    const parts = [halo, core];
    if (labelText) {
      const lb = T(labelText, P ? 18 : 16, color);
      lb.moveTo([pos[0], pos[1] - 0.52, 0]);
      parts.push(lb);
    }
    return new M.VGroup(...parts);
  }

  function makeRewardDot(pos, val) {
    const [x, y] = pos, r = P ? 0.17 : 0.145;
    if (val === 1) {
      const c = new M.Circle({ radius: r, color: C.green, strokeWidth: 2 });
      c.setFill(C.green, 0.24); c.moveTo([x, y, 0]);
      const l1 = new M.Line({ start: [x - 0.065, y - 0.005, 0], end: [x - 0.015, y - 0.055, 0], color: C.green, strokeWidth: 2.5 });
      const l2 = new M.Line({ start: [x - 0.015, y - 0.055, 0], end: [x + 0.075, y + 0.06, 0], color: C.green, strokeWidth: 2.5 });
      return new M.VGroup(c, l1, l2);
    }
    if (val === 0) {
      const c = new M.Circle({ radius: r, color: C.muted, strokeWidth: 2 });
      c.setFill(C.muted, 0.16); c.moveTo([x, y, 0]);
      const l1 = new M.Line({ start: [x - 0.055, y - 0.055, 0], end: [x + 0.055, y + 0.055, 0], color: C.muted, strokeWidth: 2.2 });
      const l2 = new M.Line({ start: [x - 0.055, y + 0.055, 0], end: [x + 0.055, y - 0.055, 0], color: C.muted, strokeWidth: 2.2 });
      return new M.VGroup(c, l1, l2);
    }
    const c = new M.Circle({ radius: r + 0.03, color: C.muted, strokeWidth: 2 });
    c.setFill(C.bg, 0.95); c.moveTo([x, y, 0]);
    const q = T('?', 15, C.muted, true, true); q.moveTo([x, y, 0]);
    return new M.VGroup(c, q);
  }

  function makeWedge(cx, cy, r, a0, a1, color, fillOp = 0.36, steps = 20) {
    const pts = [[cx, cy, 0]];
    for (let k = 0; k <= steps; k++) {
      const a = a0 + (a1 - a0) * k / steps;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a), 0]);
    }
    const p = new M.Polygon({ vertices: pts, color, strokeWidth: 2 });
    p.setFill(color, fillOp);
    return p;
  }

  // Prompt card factory: static shell + mutable bar/count/rate + reward dots array
  function createCard(pos, name, sub, color, isQuiz) {
    const [cx, cy] = pos, w = CARD_W, h = CARD_H;
    const bg = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color, strokeWidth: 2.5 });
    bg.setFill(C.card, 0.94); bg.moveTo([cx, cy, 0]);

    const hy = cy + h * 0.30;
    const ix = cx - w / 2 + 0.36;
    let icon;
    if (isQuiz) {
      const sq = new M.RoundedRectangle({ width: 0.32, height: 0.32, cornerRadius: 0.06, color, strokeWidth: 2 });
      sq.setFill(color, 0.18); sq.moveTo([ix, hy, 0]);
      const qm = T('?', 16, color, true, true); qm.moveTo([ix, hy, 0]);
      icon = new M.VGroup(sq, qm);
    } else {
      const clk = new M.Circle({ radius: 0.16, color, strokeWidth: 2 });
      clk.setFill(color, 0.18); clk.moveTo([ix, hy, 0]);
      const h1 = new M.Line({ start: [ix, hy, 0], end: [ix, hy + 0.09, 0], color, strokeWidth: 2 });
      const h2 = new M.Line({ start: [ix, hy, 0], end: [ix + 0.08, hy - 0.02, 0], color, strokeWidth: 2 });
      icon = new M.VGroup(clk, h1, h2);
    }

    const title = T(name, P ? 21 : 17, color, false, true);
    title.moveTo([ix + 0.28 + title.getWidth() / 2, hy, 0]);
    const subT = T(sub, P ? 17 : 13, C.muted);
    subT.moveTo([ix + 0.28 + title.getWidth() + 0.18 + subT.getWidth() / 2, hy, 0]);

    const by = cy - h * 0.31;
    const barLeft = cx - w / 2 + 0.24;
    const barW = w - 1.38;
    const track = new M.RoundedRectangle({ width: barW, height: 0.24, cornerRadius: 0.08, color: C.line, strokeWidth: 1.5 });
    track.setFill(C.bg, 0.92); track.moveTo([barLeft + barW / 2, by, 0]);

    const shell = new M.VGroup(bg, icon, title, subT, track);

    const makeBar = rate => {
      const fw = Math.max(0.05, barW * rate);
      const b = new M.Rectangle({ width: fw, height: 0.19, color, strokeWidth: 0 });
      b.setFill(color, rate > 0 ? 0.85 : 0.25);
      b.moveTo([barLeft + fw / 2, by, 0]);
      return b;
    };
    const makeCount = s => { const t = T(s, P ? 18 : 15, C.muted, true); t.moveTo([cx + w / 2 - 0.56, hy, 0]); return t; };
    const makeRate = s => { const t = T(s, P ? 20 : 16, color, true, true); t.moveTo([cx + w / 2 - 0.54, by, 0]); return t; };

    const bar = makeBar(0);
    let countTxt = makeCount('0 / 0');
    let rateTxt = makeRate('—');
    const dots = [];
    const ry = cy + 0.01;
    const dotX0 = cx - w / 2 + 0.34;
    const dotStep = Math.min(0.42, (w - 0.68) / 10);

    return {
      pos, color, shell, bar, dots,
      get countTxt() { return countTxt; },
      get rateTxt() { return rateTxt; },
      dotPos(idx) { return [dotX0 + idx * dotStep, ry, 0]; },
      addDot(val) {
        const d = makeRewardDot(this.dotPos(dots.length), val);
        dots.push(d);
        return d;
      },
      setStats(wins, total, rateStr) {
        const newBar = makeBar(total ? wins / total : 0);
        const newCnt = makeCount(`${wins} / ${total}`);
        const newRate = makeRate(rateStr);
        const anims = [
          new M.Transform(bar, newBar, { runTime: 0.6 }),
          new M.FadeOut(countTxt, { runTime: 0.35 }), new M.FadeIn(newCnt, { runTime: 0.45 }),
          new M.FadeOut(rateTxt, { runTime: 0.35 }), new M.FadeIn(newRate, { runTime: 0.45 })
        ];
        countTxt = newCnt;
        rateTxt = newRate;
        return anims;
      },
      allObjects() { return [shell, bar, countTxt, rateTxt, ...dots]; }
    };
  }

  const cardA = createCard(CA_POS, 'Prompt A', 'Quiz', C.cyan, true);
  const cardB = createCard(CB_POS, 'Prompt B', 'Reminder', ORANGE, false);

  // =========================================================================
  // ACT 1: SETUP & INITIAL OBSERVATIONS (Sentences 0 - 9)
  // =========================================================================
  const learnerStart = P ? [0, 2.2, 0] : [-4.65, -0.55, 0];
  let learner = makeLearner(learnerStart, C.ink, 'new learner');

  // 0: Imagine your study app must choose a prompt for each new learner.
  await until(S(0));
  await play(new M.FadeIn(learner, { runTime: 0.8 }), ...(P ? fbox([['Each new learner', C.ink], ['gets one prompt:', C.ink], ['A or B', C.cyan]], C.cyan) : []), ...say('STUDY APP: CHOOSE A PROMPT', C.cyan));

  // 1: Prompt A invites the learner to try a quiz.
  await until(S(1));
  await play(
    new M.FadeIn(cardA.shell, { runTime: 0.7 }),
    new M.FadeIn(cardA.bar, { runTime: 0.7 }),
    new M.FadeIn(cardA.countTxt, { runTime: 0.7 }),
    new M.FadeIn(cardA.rateTxt, { runTime: 0.7 }),
    ...say('PROMPT A: TRY A QUIZ', C.cyan)
  );

  // 2: Prompt B reminds the learner to practise.
  await until(S(2));
  await play(
    new M.FadeIn(cardB.shell, { runTime: 0.7 }),
    new M.FadeIn(cardB.bar, { runTime: 0.7 }),
    new M.FadeIn(cardB.countTxt, { runTime: 0.7 }),
    new M.FadeIn(cardB.rateTxt, { runTime: 0.7 }),
    ...say('PROMPT B: REMIND TO PRACTISE', ORANGE)
  );

  // 3: The app wants as many learners as possible to return the next day.
  await until(S(3));
  await play(
    ...fbox([['returns next day  →  1', C.green], ['does not return   →  0', C.muted]], C.green),
    ...say('GOAL: MORE LEARNERS RETURN', C.green)
  );

  // 4: Our first learner receives A and returns.
  await until(S(4));
  const aDot0 = cardA.addDot(1);
  const aCnt1 = T('1 / 1', P ? 18 : 15, C.muted, true);
  aCnt1.moveTo([CA_POS[0] + CARD_W / 2 - 0.56, CA_POS[1] + CARD_H * 0.30, 0]);
  await play(
    new M.Transform(learner, makeLearner(cardA.dotPos(0), C.green), { runTime: 0.65 }),
    ...say('LEARNER 1 → A → RETURNS (+1)', C.green)
  );
  await play(
    new M.FadeOut(learner, { runTime: 0.35 }),
    new M.FadeIn(aDot0, { runTime: 0.45 }),
    new M.Flash(aDot0, { color: C.green, runTime: 0.55 }),
    ...cardA.setStats(1, 1, '100%')
  );

  // 5: Our second learner receives B and does not return.
  await until(S(5));
  learner = makeLearner(learnerStart, C.ink, 'learner 2');
  const bDot0 = cardB.addDot(0);
  await play(
    new M.FadeIn(learner, { runTime: 0.35 }),
    ...say('LEARNER 2 → B → NO RETURN (0)', C.muted)
  );
  await play(
    new M.Transform(learner, makeLearner(cardB.dotPos(0), C.muted), { runTime: 0.55 }),
  );
  await play(
    new M.FadeOut(learner, { runTime: 0.3 }),
    new M.FadeIn(bDot0, { runTime: 0.4 }),
    ...cardB.setStats(0, 1, '0%')
  );

  // 6: A has an estimated return rate of one hundred percent.
  await until(S(6));
  await play(
    new M.Indicate(cardA.bar, { color: C.cyan, runTime: 0.8 }),
    ...fbox([['A: 1 / 1 = 100%', C.cyan]], C.cyan),
    ...say('ESTIMATED RATE: A = 100%', C.cyan)
  );

  // 7: B has an estimated return rate of zero percent.
  await until(S(7));
  await play(
    new M.Indicate(cardB.rateTxt, { color: ORANGE, runTime: 0.8 }),
    ...fbox([['A: 1 / 1 = 100%', C.cyan], ['B: 0 / 1 = 0%', ORANGE]], ORANGE),
    ...say('ESTIMATED RATE: B = 0%', ORANGE)
  );

  // 8: But if we always choose A, we may never discover how well B works.
  await until(S(8));
  const unkB = [1, 2, 3].map(k => makeRewardDot(cardB.dotPos(k), null));
  await play(
    new M.Indicate(cardA.shell, { color: C.amber, runTime: 0.9 }),
    new M.LaggedStart(unkB.map(u => new M.FadeIn(u, { runTime: 0.45 })), { lagRatio: 0.25, runTime: 1.0 }),
    ...say('ALWAYS A → B STAYS UNKNOWN', C.pink)
  );

  // 9: How can we use what we know while continuing to learn?
  await until(S(9));
  await play(
    new M.FadeOut(new M.VGroup(...unkB), { runTime: 0.5 }),
    new M.Indicate(cardA.shell, { color: C.cyan, runTime: 0.7 }),
    new M.Indicate(cardB.shell, { color: ORANGE, runTime: 0.7 }),
    ...say('USE WHAT WE KNOW + KEEP LEARNING?', C.amber)
  );

  // =========================================================================
  // ACT 2: THE 4-SECTION WHEEL & NAMING EPSILON-GREEDY (Sentences 10 - 19)
  // =========================================================================
  const [wx, wy] = W1_POS, wr = W1_R;
  // 4 wedges: 0 = top-right (0..pi/2, RANDOM), 1..3 = remaining 3 quarters (BEST)
  const wSlices = [0, 1, 2, 3].map(k =>
    makeWedge(wx, wy, wr, k * Math.PI / 2, (k + 1) * Math.PI / 2, C.muted, 0.14)
  );
  const wRim = new M.Circle({ radius: wr, color: C.ink, strokeWidth: 2.5 });
  wRim.setFill(C.bg, 0); wRim.moveTo([wx, wy, 0]);
  const wHub = new M.Circle({ radius: 0.08, color: C.ink, strokeWidth: 0 });
  wHub.setFill(C.ink, 1); wHub.moveTo([wx, wy, 0]);

  // 10: Imagine a wheel with four equal sections.
  await until(S(10));
  await play(
    new M.LaggedStart(wSlices.map(w => new M.FadeIn(w, { runTime: 0.45 })), { lagRatio: 0.18, runTime: 1.1 }),
    new M.Create(wRim, { runTime: 0.8 }),
    new M.FadeIn(wHub, { runTime: 0.5 }),
    ...say('A WHEEL WITH 4 EQUAL SECTIONS', C.cyan)
  );

  // 11: Three sections tell the app to choose the prompt that looks best.
  await until(S(11));
  const bestLabels = [1, 2, 3].map(k => {
    const a = (k + 0.5) * Math.PI / 2;
    const lb = T('BEST', P ? 16 : 14, C.amber, true, true);
    lb.moveTo([wx + wr * 0.56 * Math.cos(a), wy + wr * 0.56 * Math.sin(a), 0]);
    return lb;
  });
  await play(
    ...[1, 2, 3].map(k => new M.Transform(wSlices[k], makeWedge(wx, wy, wr, k * Math.PI / 2, (k + 1) * Math.PI / 2, C.amber, 0.30), { runTime: 0.7 })),
    new M.LaggedStart(bestLabels.map(t => new M.FadeIn(t, { runTime: 0.4 })), { lagRatio: 0.15, runTime: 0.8 }),
    ...say('3 SECTIONS: CHOOSE WHAT LOOKS BEST', C.amber)
  );

  // 12: The fourth section tells the app to choose a prompt at random.
  await until(S(12));
  const randLabel = T('RAND', P ? 16 : 14, C.violet, true, true);
  randLabel.moveTo([wx + wr * 0.56 * Math.cos(Math.PI / 4), wy + wr * 0.56 * Math.sin(Math.PI / 4), 0]);
  await play(
    new M.Transform(wSlices[0], makeWedge(wx, wy, wr, 0, Math.PI / 2, C.violet, 0.44), { runTime: 0.7 }),
    new M.FadeIn(randLabel, { runTime: 0.6 }),
    ...say('1 SECTION: CHOOSE AT RANDOM', C.violet)
  );

  // 13: Choosing at random means giving A and B an equal chance of being chosen.
  await until(S(13));
  await play(
    ...fbox([['random choice:', C.violet], ['A: 50%  |  B: 50%', C.ink]], C.violet),
    new M.Indicate(cardA.shell, { color: C.cyan, runTime: 0.75 }),
    new M.Indicate(cardB.shell, { color: ORANGE, runTime: 0.75 }),
    ...say('RANDOM = EQUAL CHANCE FOR A & B', C.violet)
  );

  // Pointer needle + glowing tip for spinning the main wheel
  let curAng = Math.PI * 0.85;
  const makeNeedle = a => new M.Line({
    start: [wx, wy, 0],
    end: [wx + wr * 0.80 * Math.cos(a), wy + wr * 0.80 * Math.sin(a), 0],
    color: C.ink, strokeWidth: 4
  });
  const makeTip = a => {
    const d = new M.Dot({ point: [wx + wr * 0.82 * Math.cos(a), wy + wr * 0.82 * Math.sin(a), 0], radius: 0.08, color: C.ink });
    return d;
  };
  const needle = makeNeedle(curAng);
  const tipDot = makeTip(curAng);

  async function spinMain(targetAng, sliceIdx, sliceColor, pillText, pillColor) {
    const midAng = curAng + 2.2;
    await play(
      new M.Transform(needle, makeNeedle(midAng), { runTime: 0.34 }),
      new M.Transform(tipDot, makeTip(midAng), { pathArc: 1.9, runTime: 0.34 })
    );
    curAng = targetAng;
    const anims = [
      new M.Transform(needle, makeNeedle(targetAng), { runTime: 0.50 }),
      new M.Transform(tipDot, makeTip(targetAng), { pathArc: 1.7, runTime: 0.50 }),
      new M.Indicate(wSlices[sliceIdx], { color: sliceColor, runTime: 0.75 })
    ];
    if (pillText) anims.push(...say(pillText, pillColor));
    await play(...anims);
  }

  // 14: Before choosing a prompt, the app spins the wheel.
  await until(S(14));
  await play(new M.FadeIn(needle, { runTime: 0.4 }), new M.FadeIn(tipDot, { runTime: 0.4 }), ...say('SPIN BEFORE EACH CHOICE', C.cyan));
  await spinMain(Math.PI * 1.08, 2, C.amber, null, C.amber);

  // 15: Three sections out of four give us a seventy-five percent chance of choosing what looks best.
  await until(S(15));
  await play(
    ...[1, 2, 3].map(k => new M.Indicate(wSlices[k], { color: C.amber, runTime: 0.9 })),
    ...fbox([['3 / 4 = 75%  looks best', C.amber]], C.amber),
    ...say('3 OF 4 = 75% CHOOSE BEST', C.amber)
  );

  // 16: One section out of four gives us a twenty-five percent chance of choosing at random.
  await until(S(16));
  await play(
    new M.Indicate(wSlices[0], { color: C.violet, runTime: 0.9 }),
    ...fbox([['3 / 4 = 75%  looks best', C.amber], ['1 / 4 = 25%  at random', C.violet]], C.violet),
    ...say('1 OF 4 = 25% AT RANDOM', C.violet)
  );

  // 17: We call this chance of choosing at random epsilon.
  await until(S(17));
  const epsTag = T('ε = 25%', P ? 18 : 16, C.violet, true, true);
  epsTag.moveTo(P ? [wx + wr + 0.75, wy + wr - 0.1, 0] : [wx, wy + wr + 0.3, 0]);
  await play(
    new M.FadeIn(epsTag, { runTime: 0.6 }),
    new M.Indicate(wSlices[0], { color: C.violet, runTime: 0.8 }),
    ...fbox([['epsilon (ε) = 25%', C.violet], ['chance of random choice', C.muted]], C.violet),
    ...say('EPSILON (ε) = RANDOM CHANCE', C.violet)
  );

  // 18: Choosing what looks best now is also called greedy selection.
  await until(S(18));
  await play(
    ...[1, 2, 3].map(k => new M.Indicate(wSlices[k], { color: C.amber, runTime: 0.85 })),
    ...fbox([['greedy      = 75% (best)', C.amber], ['epsilon (ε) = 25% (rand)', C.violet]], C.amber),
    ...say('GREEDY = CHOOSE BEST NOW', C.amber)
  );

  // 19: The rule that combines these two choices is called epsilon-greedy selection.
  await until(S(19));
  await play(
    new M.Indicate(wRim, { color: C.green, runTime: 0.9 }),
    ...fbox([['epsilon-greedy (ε = 25%)', C.green], ['75% greedy + 25% random', C.ink]], C.green),
    ...say('EPSILON-GREEDY SELECTION', C.green)
  );

  // =========================================================================
  // ACT 3: WORKED EXAMPLE — NEXT 4 LEARNERS STEP BY STEP (Sentences 20 - 37)
  // =========================================================================

  // 20: Let's watch the app use this rule with our next four learners.
  await until(S(20));
  await play(
    ...fbox([['Next 4 learners (ε = 25%)', C.cyan], ['A: 1/1 (100%)', C.cyan], ['B: 0/1 (0%)', ORANGE]], C.cyan),
    ...say('WATCH THE NEXT 4 LEARNERS', C.cyan)
  );

  // --- Step 1 (Learner 3): greedy -> A -> reward 0 -> A = 1/2 (50%) ---
  // 21: The first spin tells us to choose what looks best.
  await until(S(21));
  await spinMain(Math.PI * 1.6, 3, C.amber, 'SPIN 1 → GREEDY (BEST)', C.amber);

  // 22: A looks best, so the app chooses A.
  await until(S(22));
  await play(
    new M.Indicate(cardA.shell, { color: C.cyan, runTime: 0.8 }),
    ...fbox([['Step 1: greedy', C.amber], ['A (100%) > B (0%)', C.ink], ['choose A', C.cyan]], C.cyan),
    ...say('A LOOKS BEST → CHOOSE A', C.cyan)
  );

  // 23: The learner does not return, and A receives a reward of zero.
  await until(S(23));
  const aDot1 = cardA.addDot(0);
  await play(
    new M.FadeIn(aDot1, { runTime: 0.55 }),
    new M.Flash(aDot1, { color: C.muted, runTime: 0.65 }),
    ...fbox([['Step 1: chose A', C.cyan], ['no return → reward = 0', C.muted]], C.muted),
    ...say('REWARD = 0 (NO RETURN)', C.muted)
  );

  // 24: A now has one return from two learners, giving fifty percent.
  await until(S(24));
  await play(
    ...cardA.setStats(1, 2, '50%'),
    ...fbox([['A: 1 / 2 = 50%', C.cyan], ['B: 0 / 1 = 0%', ORANGE]], C.cyan),
    ...say('A = 1 / 2 = 50%', C.cyan)
  );

  // --- Step 2 (Learner 4): random -> 2nd wheel -> B -> reward 1 -> B = 1/2 (50%) ---
  // 25: The second spin tells us to choose at random.
  await until(S(25));
  await spinMain(Math.PI * 0.1, 0, C.violet, 'SPIN 2 → RANDOM (ε)', C.violet);

  // 26: We use a second wheel with two equal sections, one for each prompt.
  const [w2x, w2y] = W2_POS, w2r = W2_R;
  const w2A = makeWedge(w2x, w2y, w2r, Math.PI / 2, 3 * Math.PI / 2, C.cyan, 0.34);
  const w2B = makeWedge(w2x, w2y, w2r, -Math.PI / 2, Math.PI / 2, ORANGE, 0.34);
  const w2Rim = new M.Circle({ radius: w2r, color: C.ink, strokeWidth: 2 });
  w2Rim.setFill(C.bg, 0); w2Rim.moveTo([w2x, w2y, 0]);
  const w2LA = T('A', P ? 20 : 17, C.cyan, true, true); w2LA.moveTo([w2x - w2r * 0.48, w2y, 0]);
  const w2LB = T('B', P ? 20 : 17, ORANGE, true, true); w2LB.moveTo([w2x + w2r * 0.48, w2y, 0]);
  const w2Hub = new M.Circle({ radius: 0.06, color: C.ink, strokeWidth: 0 });
  w2Hub.setFill(C.ink, 1); w2Hub.moveTo([w2x, w2y, 0]);
  const makeW2Needle = a => new M.Line({
    start: [w2x, w2y, 0],
    end: [w2x + w2r * 0.78 * Math.cos(a), w2y + w2r * 0.78 * Math.sin(a), 0],
    color: C.ink, strokeWidth: 3.5
  });
  const w2Needle = makeW2Needle(Math.PI * 0.5);
  const w2Title = T('A or B (50/50)', P ? 16 : 13, C.violet, true);
  w2Title.moveTo([w2x, w2y - w2r - 0.24, 0]);

  await until(S(26));
  await play(
    new M.FadeIn(w2A, { runTime: 0.55 }), new M.FadeIn(w2B, { runTime: 0.55 }),
    new M.Create(w2Rim, { runTime: 0.6 }), new M.FadeIn(w2LA, { runTime: 0.55 }),
    new M.FadeIn(w2LB, { runTime: 0.55 }), new M.FadeIn(w2Hub, { runTime: 0.5 }),
    new M.FadeIn(w2Needle, { runTime: 0.5 }), new M.FadeIn(w2Title, { runTime: 0.5 }),
    ...fbox([['Step 2: random', C.violet], ['2nd wheel: A 50% | B 50%', C.ink]], C.violet),
    ...say('SECOND WHEEL: A OR B (50/50)', C.violet)
  );

  // 27: The second wheel selects B.
  await until(S(27));
  await play(
    new M.Transform(w2Needle, makeW2Needle(0.08), { runTime: 0.65 }),
    new M.Indicate(w2B, { color: ORANGE, runTime: 0.7 }),
    new M.Indicate(cardB.shell, { color: ORANGE, runTime: 0.7 }),
    ...say('SECOND WHEEL → B', ORANGE)
  );

  // 28: This time, the learner returns, and B receives a reward of one.
  await until(S(28));
  const bDot1 = cardB.addDot(1);
  await play(
    new M.FadeIn(bDot1, { runTime: 0.55 }),
    new M.Flash(bDot1, { color: C.green, runTime: 0.65 }),
    ...fbox([['Step 2: random → B', ORANGE], ['returns → reward = 1', C.green]], C.green),
    ...say('REWARD = 1 (RETURNED)', C.green)
  );

  // 29: B now has one return from two learners, giving fifty percent.
  await until(S(29));
  await play(
    new M.FadeOut(new M.VGroup(w2A, w2B, w2Rim, w2LA, w2LB, w2Hub, w2Needle, w2Title), { runTime: 0.5 }),
    ...cardB.setStats(1, 2, '50%'),
    ...fbox([['A: 1 / 2 = 50%', C.cyan], ['B: 1 / 2 = 50%', ORANGE]], ORANGE),
    ...say('B = 1 / 2 = 50%', ORANGE)
  );

  // --- Step 3 (Learner 5): greedy -> tie -> A -> reward 0 -> A = 1/3 (33%) ---
  // 30: The third spin tells us to choose what looks best.
  await until(S(30));
  await spinMain(Math.PI * 0.6, 1, C.amber, 'SPIN 3 → GREEDY (BEST)', C.amber);

  // 31: Both prompts have the same estimate, so our rule chooses A.
  await until(S(31));
  await play(
    new M.Indicate(cardA.shell, { color: C.cyan, runTime: 0.8 }),
    ...fbox([['Step 3: greedy', C.amber], ['A = 50%, B = 50% (tie)', C.ink], ['tie rule → choose A', C.cyan]], C.cyan),
    ...say('TIE (50% = 50%) → CHOOSE A', C.cyan)
  );

  // 32: The learner does not return.
  await until(S(32));
  const aDot2 = cardA.addDot(0);
  await play(
    new M.FadeIn(aDot2, { runTime: 0.55 }),
    new M.Flash(aDot2, { color: C.muted, runTime: 0.6 }),
    ...say('REWARD = 0', C.muted)
  );

  // 33: A now has one return from three learners, giving about thirty-three percent.
  await until(S(33));
  await play(
    ...cardA.setStats(1, 3, '33%'),
    ...fbox([['A: 1 / 3 ≈ 33%', C.cyan], ['B: 1 / 2 = 50%', ORANGE]], C.cyan),
    ...say('A = 1 / 3 ≈ 33%', C.cyan)
  );

  // --- Step 4 (Learner 6): greedy -> B higher -> B -> reward 1 -> B = 2/3 (67%) ---
  // 34: The fourth spin tells us to choose what looks best again.
  await until(S(34));
  await spinMain(Math.PI * 1.1, 2, C.amber, 'SPIN 4 → GREEDY (BEST)', C.amber);

  // 35: This time, B has the higher estimate, so the app chooses B.
  await until(S(35));
  await play(
    new M.Indicate(cardB.shell, { color: ORANGE, runTime: 0.8 }),
    ...fbox([['Step 4: greedy', C.amber], ['B (50%) > A (33%)', C.ink], ['choose B', ORANGE]], ORANGE),
    ...say('B IS HIGHER → CHOOSE B', ORANGE)
  );

  // 36: The learner returns.
  await until(S(36));
  const bDot2 = cardB.addDot(1);
  await play(
    new M.FadeIn(bDot2, { runTime: 0.5 }),
    new M.Flash(bDot2, { color: C.green, runTime: 0.55 }),
    ...say('REWARD = 1', C.green)
  );

  // 37: B now has two returns from three learners, giving about sixty-seven percent.
  await until(S(37));
  await play(
    ...cardB.setStats(2, 3, '67%'),
    ...fbox([['A: 1 / 3 ≈ 33%', C.cyan], ['B: 2 / 3 ≈ 67%', ORANGE]], ORANGE),
    ...say('B = 2 / 3 ≈ 67%', ORANGE)
  );

  // =========================================================================
  // ACT 4: SPEED UP — MANY MORE LEARNERS & CONVERGENCE (Sentences 38 - 41)
  // =========================================================================
  // Replace wheel with an estimated-rate convergence chart (exact fixed sequences from 15.1.md)
  const chartBox = P ? { x0: -2.9, x1: 3.2, y0: 1.5, y1: 3.4 } : { x0: -6.15, x1: -3.05, y0: -1.75, y1: 0.85 };
  const cxOf = (step, maxS) => chartBox.x0 + (step / maxS) * (chartBox.x1 - chartBox.x0);
  const cyOf = rate => chartBox.y0 + rate * (chartBox.y1 - chartBox.y0);

  const axX = new M.Line({ start: [chartBox.x0, chartBox.y0, 0], end: [chartBox.x1, chartBox.y0, 0], color: C.muted, strokeWidth: 2 });
  const axY = new M.Line({ start: [chartBox.x0, chartBox.y0, 0], end: [chartBox.x0, chartBox.y1, 0], color: C.muted, strokeWidth: 2 });
  const axTitle = T('estimated rate', P ? 16 : 13, C.muted, true);
  axTitle.moveTo([(chartBox.x0 + chartBox.x1) / 2, chartBox.y1 + 0.20, 0]);
  const axXLab = T('more learners →', P ? 16 : 12, C.muted);
  axXLab.moveTo([(chartBox.x0 + chartBox.x1) / 2, chartBox.y0 - 0.24, 0]);

  // Exact cumulative rates from chapters/15.1.md fixed sequences:
  // A: [1, 0, 0, 1, 0, 1] -> 3/6 = 50%
  // B: [0, 1, 1, 1, 0, 1, 1, 1, 1, 0] -> 7/10 = 70%
  const aCurvePts = [[0, 1.0], [2, 0.5], [4, 0.333], [7, 0.5], [10, 0.4], [14, 0.5]];
  const bCurvePts = [[0, 0.0], [3, 0.5], [5, 0.667], [6, 0.75], [8, 0.60], [9, 0.667], [11, 0.714], [12, 0.75], [13, 0.778], [14, 0.70]];

  function makePathLines(pts, color) {
    const segs = [];
    for (let k = 0; k < pts.length - 1; k++) {
      segs.push(new M.Line({
        start: [cxOf(pts[k][0], 14), cyOf(pts[k][1]), 0],
        end: [cxOf(pts[k + 1][0], 14), cyOf(pts[k + 1][1]), 0],
        color, strokeWidth: 3
      }));
    }
    return segs;
  }
  const aSegs = makePathLines(aCurvePts, C.cyan);
  const bSegs = makePathLines(bCurvePts, ORANGE);

  // 38: Look at what happens as we continue with many more learners.
  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(...wSlices, wRim, wHub, ...bestLabels, randLabel, needle, tipDot, epsTag), { runTime: 0.55 }),
    new M.Create(axX, { runTime: 0.55 }), new M.Create(axY, { runTime: 0.55 }),
    new M.FadeIn(axTitle, { runTime: 0.5 }), new M.FadeIn(axXLab, { runTime: 0.5 }),
    new M.Create(aSegs[0], { runTime: 0.5 }), new M.Create(aSegs[1], { runTime: 0.5 }),
    new M.Create(bSegs[0], { runTime: 0.5 }), new M.Create(bSegs[1], { runTime: 0.5 }),
    ...say('CONTINUE WITH MANY LEARNERS', C.cyan)
  );

  // 39: Both prompts continue to receive new results.
  await until(S(39));
  const moreADots = [1, 0, 1].map(v => cardA.addDot(v));
  const moreBDots1 = [1, 0, 1, 1].map(v => cardB.addDot(v));
  await play(
    new M.LaggedStart([...moreADots, ...moreBDots1].map(d => new M.FadeIn(d, { runTime: 0.25 })), { lagRatio: 0.14, runTime: 1.1 }),
    ...cardA.setStats(3, 6, '50%'),
    ...cardB.setStats(5, 7, '71%'),
    ...fbox([['A: 3 / 6 = 50%', C.cyan], ['B: 5 / 7 ≈ 71%', ORANGE]], C.cyan),
    new M.LaggedStart([...aSegs.slice(2), ...bSegs.slice(2, 6)].map(s => new M.Create(s, { runTime: 0.3 })), { lagRatio: 0.15, runTime: 1.0 }),
    ...say('BOTH PROMPTS GET NEW RESULTS', C.cyan)
  );

  // 40: Their estimates tend to move closer to their true return rates.
  await until(S(40));
  const moreBDots2 = [1, 1, 0].map(v => cardB.addDot(v));
  const trueALine = new M.DashedLine({ start: [chartBox.x0, cyOf(0.50), 0], end: [chartBox.x1, cyOf(0.50), 0], color: C.cyan });
  const trueBLine = new M.DashedLine({ start: [chartBox.x0, cyOf(0.70), 0], end: [chartBox.x1, cyOf(0.70), 0], color: ORANGE });
  const tALab = T('50%', P ? 16 : 12, C.cyan, true); tALab.moveTo([chartBox.x0 - (P ? 0.4 : 0.30), cyOf(0.50), 0]);
  const tBLab = T('70%', P ? 16 : 12, ORANGE, true); tBLab.moveTo([chartBox.x0 - (P ? 0.4 : 0.30), cyOf(0.70), 0]);
  await play(
    new M.LaggedStart(moreBDots2.map(d => new M.FadeIn(d, { runTime: 0.25 })), { lagRatio: 0.18, runTime: 0.6 }),
    ...cardB.setStats(7, 10, '70%'),
    new M.LaggedStart(bSegs.slice(6).map(s => new M.Create(s, { runTime: 0.25 })), { lagRatio: 0.18, runTime: 0.6 }),
    new M.Create(trueALine, { runTime: 0.6 }), new M.Create(trueBLine, { runTime: 0.6 }),
    new M.FadeIn(tALab, { runTime: 0.5 }), new M.FadeIn(tBLab, { runTime: 0.5 }),
    ...fbox([['A est: 50% (true 50%)', C.cyan], ['B est: 70% (true 70%)', ORANGE]], C.green),
    ...say('ESTIMATES APPROACH TRUE RATES', C.green)
  );

  // 41: B begins to receive more choices as the app learns that B works better.
  await until(S(41));
  await play(
    new M.Indicate(cardB.shell, { color: ORANGE, runTime: 0.9 }),
    new M.Indicate(cardB.bar, { color: C.green, runTime: 0.9 }),
    ...fbox([['B gets more choices', ORANGE], ['A:  6 choices (50%)', C.cyan], ['B: 10 choices (70%)', ORANGE]], ORANGE),
    ...say('B RECEIVES MORE CHOICES', ORANGE)
  );

  // =========================================================================
  // ACT 5: THE MATH COMES LAST — FORMULA & VARYING EPSILON (Sentences 42 - 48)
  // =========================================================================
  const DW_POS = P ? [0, 1.35, 0] : [-2.2, -0.10, 0];
  const DW_R = P ? 1.85 : 1.48;
  const [dx, dy] = DW_POS;
  const SUB_POS = P ? [0, -1.75, 0] : [-2.2, -2.35, 0];

  const demoBase = new M.Circle({ radius: DW_R, color: C.amber, strokeWidth: 2.5 });
  demoBase.setFill(C.amber, 0.28); demoBase.moveTo(DW_POS);
  const demoRim = new M.Circle({ radius: DW_R, color: C.ink, strokeWidth: 2.5 });
  demoRim.setFill(C.bg, 0); demoRim.moveTo(DW_POS);
  let demoRand = makeWedge(dx, dy, DW_R, 0, Math.PI / 2, C.violet, 0.52, 24);
  let demoBestLbl = T('100% − ε', P ? 18 : 19, C.amber, true, true);
  demoBestLbl.moveTo([dx - DW_R * 0.28, dy - DW_R * 0.28, 0]);
  let demoRandLbl = T('ε', P ? 22 : 24, C.violet, true, true);
  demoRandLbl.moveTo([dx + DW_R * 0.48, dy + DW_R * 0.45, 0]);

  // 42: Now let's write our wheel rule as two short lines.
  await until(S(42));
  await play(
    new M.FadeOut(new M.VGroup(
      ...cardA.allObjects(), ...cardB.allObjects(),
      axX, axY, axTitle, axXLab, ...aSegs, ...bSegs, trueALine, trueBLine, tALab, tBLab
    ), { runTime: 0.6 }),
    new M.FadeIn(demoBase, { runTime: 0.7 }),
    new M.FadeIn(demoRand, { runTime: 0.7 }),
    new M.Create(demoRim, { runTime: 0.7 }),
    new M.FadeIn(demoBestLbl, { runTime: 0.6 }),
    new M.FadeIn(demoRandLbl, { runTime: 0.6 }),
    ...fbox([['wheel rule (ε = 25%)', C.cyan]], C.cyan),
    ...say('THE WHEEL RULE IN TWO LINES', C.cyan)
  );

  // 43: The chance of choosing at random equals epsilon.
  await until(S(43));
  await play(
    new M.Indicate(demoRand, { color: C.violet, runTime: 0.85 }),
    ...fbox([['random = ε', C.violet]], C.violet),
    ...say('RANDOM CHANCE = ε', C.violet)
  );

  // 44: The chance of choosing what looks best equals one hundred percent minus epsilon.
  await until(S(44));
  await play(
    new M.Indicate(demoBase, { color: C.amber, runTime: 0.85 }),
    ...fbox([['random = ε', C.violet], ['best   = 100% − ε', C.amber]], C.amber),
    ...say('BEST CHANCE = 100% − ε', C.amber)
  );

  // 45: If epsilon is zero percent, the app always chooses what looks best.
  await until(S(45));
  const best100Lbl = T('100% BEST', P ? 20 : 21, C.amber, true, true);
  best100Lbl.moveTo([dx, dy, 0]);
  await play(
    new M.FadeOut(demoRand, { runTime: 0.55 }),
    new M.FadeOut(demoRandLbl, { runTime: 0.45 }),
    new M.FadeOut(demoBestLbl, { runTime: 0.45 }),
    new M.FadeIn(best100Lbl, { runTime: 0.55 }),
    ...fbox([['ε = 0%', C.amber], ['random = 0%', C.muted], ['best   = 100% (greedy)', C.amber]], C.amber),
    ...say('ε = 0% → ALWAYS GREEDY', C.amber)
  );

  // 46: If epsilon is one hundred percent, the app always chooses at random.
  await until(S(46));
  const fullRand = new M.Circle({ radius: DW_R, color: C.violet, strokeWidth: 2.5 });
  fullRand.setFill(C.violet, 0.48); fullRand.moveTo(DW_POS);
  const rand100Lbl = T('100% RANDOM', P ? 19 : 20, C.violet, true, true);
  rand100Lbl.moveTo([dx, dy, 0]);
  await play(
    new M.FadeIn(fullRand, { runTime: 0.6 }),
    new M.FadeOut(best100Lbl, { runTime: 0.45 }),
    new M.FadeIn(rand100Lbl, { runTime: 0.55 }),
    ...fbox([['ε = 100%', C.violet], ['random = 100%', C.violet], ['best   = 0%', C.muted]], C.violet),
    ...say('ε = 100% → ALWAYS RANDOM', C.violet)
  );

  // 47: Changing epsilon lets us control how much the app explores.
  await until(S(47));
  demoRand = makeWedge(dx, dy, DW_R, 0, Math.PI / 2, C.violet, 0.52, 24);
  demoBestLbl = T('75% BEST', P ? 17 : 18, C.amber, true, true);
  demoBestLbl.moveTo([dx - DW_R * 0.28, dy - DW_R * 0.28, 0]);
  demoRandLbl = T('25%', P ? 18 : 19, C.violet, true, true);
  demoRandLbl.moveTo([dx + DW_R * 0.48, dy + DW_R * 0.45, 0]);

  const slW = P ? 5.2 : 4.4;
  const slTrack = new M.Line({ start: [SUB_POS[0] - slW / 2, SUB_POS[1], 0], end: [SUB_POS[0] + slW / 2, SUB_POS[1], 0], color: C.muted, strokeWidth: 4 });
  const sl0 = T('0%', 15, C.amber, true); sl0.moveTo([SUB_POS[0] - slW / 2, SUB_POS[1] - 0.34, 0]);
  const sl100 = T('100%', 15, C.violet, true); sl100.moveTo([SUB_POS[0] + slW / 2, SUB_POS[1] - 0.34, 0]);
  const knobX = SUB_POS[0] - slW / 2 + 0.25 * slW;
  const slKnob = new M.Dot({ point: [knobX, SUB_POS[1], 0], radius: 0.14, color: C.cyan });
  const slTag = T('ε = 25%', 16, C.cyan, true, true); slTag.moveTo([knobX, SUB_POS[1] + 0.34, 0]);
  const sliderGroup = new M.VGroup(slTrack, sl0, sl100, slKnob, slTag);

  await play(
    new M.FadeOut(fullRand, { runTime: 0.55 }),
    new M.FadeOut(rand100Lbl, { runTime: 0.45 }),
    new M.FadeIn(demoRand, { runTime: 0.6 }),
    new M.FadeIn(demoBestLbl, { runTime: 0.55 }),
    new M.FadeIn(demoRandLbl, { runTime: 0.55 }),
    new M.FadeIn(sliderGroup, { runTime: 0.65 }),
    ...fbox([['ε controls exploration', C.cyan], ['small ε → mostly best', C.amber], ['large ε → mostly random', C.violet]], C.cyan),
    ...say('ε CONTROLS EXPLORATION', C.cyan)
  );

  // 48: This is useful when the app needs to earn rewards while still learning which prompt works better.
  await until(S(48));
  await play(
    new M.Indicate(demoBase, { color: C.amber, runTime: 0.8 }),
    new M.Indicate(demoRand, { color: C.violet, runTime: 0.8 }),
    ...fbox([['75%: earn rewards now', C.amber], ['25%: keep learning', C.violet]], C.green),
    ...say('EARN REWARDS + KEEP LEARNING', C.green)
  );

  // =========================================================================
  // ACT 6: TRAPS, BRIDGE & RECAP (Sentences 49 - 53)
  // =========================================================================
  function makeSpinRow(items) {
    const bw = P ? 1.32 : 1.12, gap = 0.16;
    const totalW = items.length * bw + (items.length - 1) * gap;
    const parts = [];
    items.forEach(([label, col], idx) => {
      const bx = SUB_POS[0] - totalW / 2 + bw / 2 + idx * (bw + gap);
      const r = new M.RoundedRectangle({ width: bw, height: 0.54, cornerRadius: 0.1, color: col, strokeWidth: 2 });
      r.setFill(col, 0.18); r.moveTo([bx, SUB_POS[1], 0]);
      const t = T(label, P ? 17 : 14, col, true, true); t.moveTo([bx, SUB_POS[1], 0]);
      parts.push(r, t);
    });
    return new M.VGroup(...parts);
  }

  // 49: But twenty-five percent does not mean exactly one random choice in every four spins.
  await until(S(49));
  const rowNeat = makeSpinRow([['BEST', C.amber], ['BEST', C.amber], ['BEST', C.amber], ['RAND', C.violet]]);
  const cross1 = new M.Line({ start: [SUB_POS[0] - 2.3, SUB_POS[1] - 0.34, 0], end: [SUB_POS[0] + 2.3, SUB_POS[1] + 0.34, 0], color: C.pink, strokeWidth: 3.5 });
  await play(
    new M.FadeOut(sliderGroup, { runTime: 0.45 }),
    new M.FadeIn(rowNeat, { runTime: 0.55 }),
    new M.Create(cross1, { runTime: 0.65 }),
    ...fbox([['25% is a probability', C.pink], ['NOT 1 in every 4 spins', C.ink]], C.pink),
    ...say('CHANCE ≠ FIXED SCHEDULE', C.pink)
  );

  // 50: The wheel can select the same section several times in a row.
  await until(S(50));
  const rowStreak = makeSpinRow([['BEST', C.amber], ['BEST', C.amber], ['BEST', C.amber], ['BEST', C.amber]]);
  await play(
    new M.FadeOut(new M.VGroup(rowNeat, cross1), { runTime: 0.45 }),
    new M.FadeIn(rowStreak, { runTime: 0.55 }),
    new M.Indicate(rowStreak, { color: C.pink, runTime: 0.8 }),
    ...fbox([['same section can repeat', C.pink], ['e.g. BEST, BEST, BEST...', C.amber]], C.pink),
    ...say('STREAKS CAN HAPPEN', C.pink)
  );

  // 51: Another problem is that the app keeps exploring even when it knows both prompts well.
  await until(S(51));
  const knownTxt = T(P ? 'A: 500 tries · B: 500 tries' : 'A: 500 tries (50%)   ·   B: 500 tries (70%)', P ? 17 : 14, C.muted, true);
  knownTxt.moveTo([SUB_POS[0], SUB_POS[1], 0]);
  await play(
    new M.FadeOut(rowStreak, { runTime: 0.45 }),
    new M.FadeIn(knownTxt, { runTime: 0.55 }),
    new M.Indicate(demoRand, { color: C.pink, runTime: 0.9 }),
    ...fbox([['after 1,000 learners:', C.muted], ['still 25% random!', C.pink]], C.pink),
    ...say('STILL EXPLORES EVEN WHEN SURE', C.pink)
  );

  // 52: In the next lesson, we will explore more when we know less about a prompt.
  await until(S(52));
  const nAX = SUB_POS[0] - (P ? 1.95 : 1.35), nBX = SUB_POS[0] + (P ? 1.35 : 1.15);
  const nextBoxA = new M.RoundedRectangle({ width: P ? 2.4 : 1.5, height: P ? 0.6 : 0.48, cornerRadius: 0.1, color: C.cyan, strokeWidth: 2 });
  nextBoxA.setFill(C.card, 0.95); nextBoxA.moveTo([nAX, SUB_POS[1], 0]);
  const nextLabA = T('well tested', P ? 16 : 13, C.cyan, true); nextLabA.moveTo([nAX, SUB_POS[1], 0]);
  const nextBoxB = new M.RoundedRectangle({ width: P ? 3.4 : 2.3, height: P ? 0.7 : 0.62, cornerRadius: 0.1, color: ORANGE, strokeWidth: 2.5 });
  nextBoxB.setFill(C.card, 0.95); nextBoxB.moveTo([nBX, SUB_POS[1], 0]);
  const nextLabB = T('less tested: explore', P ? 16 : 13, ORANGE, true, true); nextLabB.moveTo([nBX, SUB_POS[1], 0]);
  const nextGroup = new M.VGroup(nextBoxA, nextLabA, nextBoxB, nextLabB);
  await play(
    new M.FadeOut(knownTxt, { runTime: 0.45 }),
    new M.FadeIn(nextGroup, { runTime: 0.65 }),
    ...fbox([['next lesson:', C.cyan], ['know less → explore more', ORANGE]], C.cyan),
    ...say('NEXT: EXPLORE WHEN LESS SURE', C.cyan)
  );

  // 53: Remember: epsilon-greedy selection usually chooses what looks best but leaves room to discover something better.
  await until(S(53));
  await play(
    new M.FadeOut(nextGroup, { runTime: 0.5 }),
    new M.Indicate(demoBase, { color: C.amber, runTime: 0.9 }),
    new M.Indicate(demoRand, { color: C.violet, runTime: 0.9 }),
    ...fbox([['epsilon-greedy', C.green], ['usually best (100% − ε)', C.amber], ['room to explore (ε)', C.violet]], C.green),
    ...say('USUALLY BEST · ROOM TO EXPLORE', C.green)
  );
}
