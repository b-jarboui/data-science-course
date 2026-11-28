// 20.3.11 Speculative decoding: a small draft model guesses ahead, the large model checks in one pass (live lesson, script.v5.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const OR = '#fb923c';                                   // the draft model (chapter 20.3: orange)
  const LARGE = 20, DRAFT = 2;                            // milliseconds per step
  const CX = P ? 0 : -1.85;
  const PILL = P ? [0, 2.05, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.4, 0] : [4.75, 0.05, 0];
  const SW = P ? 2.1 : 1.6, SP = P ? 2.4 : 1.8, CH = 0.6, TS = P ? 24 : 22;
  const sx = i => (P ? 0 : -0.1) + (i - 1) * SP;
  const TOKY = P ? 0.2 : 0.9, MARKY = P ? -0.5 : 0.25, PICKY = P ? -1.2 : -0.4, PCTY = P ? -1.75 : -0.92;
  const XT = P ? -3.6 : -6.3, U = P ? 5.6 / 60 : 0.13, BH = 0.32;
  const AL = P ? -3.3 : -1.25, AY = P ? -3.75 : -1.62, BL = P ? -4.6 : -2.12, BY = P ? -5.05 : -2.48;
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.35, top = BOXP[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => { const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length); t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]); });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 3.9;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  function clearBox() { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; }

  // token cards, empty slots, time blocks, labels
  function card(s, color, i, y = TOKY) {
    const x = sx(i), r = new M.RoundedRectangle({ width: SW, height: CH, cornerRadius: 0.12, color, strokeWidth: 2 });
    r.setFill(color, 0.16); r.moveTo([x, y, 0]);
    const t = T(s, s === '.' ? TS * 1.8 : TS, C.ink, true, true);
    if (t.getWidth() > SW - 0.16) t.scale((SW - 0.16) / t.getWidth());
    t.moveTo([x, y, 0]);
    return new M.VGroup(r, t);
  }
  const slotBox = i => { const r = new M.RoundedRectangle({ width: SW, height: CH, cornerRadius: 0.12, color: C.muted, strokeWidth: 2 }); r.setStrokeOpacity(0.35); r.moveTo([sx(i), TOKY, 0]); return r; };
  function block(ms0, ms, color, y, label) {
    const x = XT + (ms0 + ms / 2) * U, r = new M.Rectangle({ width: ms * U - 0.04, height: BH, color, strokeWidth: 1 });
    r.setFill(color, 0.82); r.moveTo([x, y, 0]);
    if (!label) return r;
    const t = T(label, P ? 15 : 16, C.bg, true, true); t.moveTo([x, y, 0]);
    return new M.VGroup(r, t);
  }
  const left = (s, y, color = C.muted) => { const t = T(s, P ? 18 : 18, color); t.moveTo([XT + t.getWidth() / 2, y, 0]); return t; };
  const after = (s, ms, y, color) => { const t = T(s, 18, color, true, true); t.moveTo([XT + ms * U + 0.15 + t.getWidth() / 2, y, 0]); return t; };
  const mark = (ok, i) => { const t = T(ok ? '✓' : '✗', 28, ok ? C.green : C.pink, false, true); t.moveTo([sx(i), MARKY, 0]); return t; };

  // the prompt card
  const pre = (() => {
    const t = T('The library will open', TS, C.ink, true);
    const maxw = P ? FW - 1.4 : 3.0; if (t.getWidth() > maxw) t.scale(maxw / t.getWidth());
    const w = t.getWidth() + 0.35, x = P ? 0 : sx(0) - SW / 2 - 0.25 - w / 2, y = P ? 1.2 : TOKY;
    const r = new M.RoundedRectangle({ width: w, height: CH, cornerRadius: 0.12, color: C.muted, strokeWidth: 2 });
    r.setFill(C.card, 0.9); r.moveTo([x, y, 0]); t.moveTo([x, y, 0]);
    return new M.VGroup(r, t);
  })();

  // the two models, drawn by size
  const icon = (size, color, p) => { const r = new M.RoundedRectangle({ width: size, height: size, cornerRadius: 0.12, color, strokeWidth: 2 }); r.setFill(color, 0.25); r.moveTo(p); return r; };
  const LP = P ? [-2.4, 3.55, 0] : [3.9, 0.15, 0], SPP = P ? [1.8, 3.55, 0] : [6.0, 0.15, 0], labY = P ? 2.72 : -0.85;
  const bigM = icon(P ? 1.0 : 1.4, C.cyan, LP), smallM = icon(P ? 0.45 : 0.5, OR, SPP);
  const bigL = T('large · 20 ms', 17, C.cyan); bigL.moveTo([LP[0], labY, 0]);
  const smallL = T('small', 17, OR); smallL.moveTo([SPP[0], labY, 0]);

  // 0-1 the large model alone: one token per 20 ms step
  const slots = [0, 1, 2].map(slotBox);
  const labA = left('large model alone', AL);
  await until(S(0));
  await play(new M.FadeIn(pre), new M.FadeIn(new M.VGroup(...slots)), new M.FadeIn(bigM), new M.FadeIn(bigL), ...say('CAMPUS ASSISTANT = A LARGE MODEL'));
  const alone = ['at', 'nine', '.'].map((s, i) => card(s, C.cyan, i));
  const blocksA = [0, 1, 2].map(i => block(i * LARGE, LARGE, C.cyan, AY, '20 ms'));
  await until(S(0) + 2.4);
  await play(new M.FadeIn(labA), new M.FadeIn(alone[0]), new M.FadeIn(blocksA[0]), ...say('EACH STEP: 20 ms'));
  const totA = after('60 ms', 60, AY, C.cyan);
  await until(S(1));
  await play(new M.LaggedStart([alone[1], blocksA[1], alone[2], blocksA[2]].map(x => new M.FadeIn(x)), { lagRatio: 0.45, runTime: 2.4 }), ...say('3 TOKENS, ONE AFTER ANOTHER'));
  await play(new M.FadeIn(totA), ...say('3 × 20 ms = 60 ms', C.amber));

  // 2-5 a small model, and the idea
  await until(S(2)); await play(new M.FadeIn(smallM), new M.FadeIn(smallL), ...say('SMALLER MODEL: FASTER, LESS RELIABLE', OR));
  await until(S(3)); await play(new M.Indicate(smallM, { color: OR }), new M.Indicate(bigM, { color: C.cyan }), ...say('SPEED OF SMALL + ANSWERS OF LARGE?', C.violet));
  const arrow = new M.Arrow({ start: [SPP[0] - (P ? 0.35 : 0.35), SPP[1], 0], end: [LP[0] + (P ? 0.6 : 0.8), LP[1], 0], color: C.muted });
  await until(S(4)); await play(new M.Create(arrow), ...say('SMALL GUESSES AHEAD · LARGE CHECKS'));
  const draftL = T('draft · 2 ms', 17, OR); draftL.moveTo([SPP[0], labY, 0]);
  await until(S(5)); await play(new M.FadeOut(smallL), new M.FadeIn(draftL), ...say('DRAFT MODEL: 2 ms PER STEP', OR));

  // 6-8 start again; the draft writes three tokens
  const mini = T('→ at nine .', 17, C.cyan, true); mini.moveTo([XT + labA.getWidth() + 0.25 + mini.getWidth() / 2, AL, 0]);
  await until(S(6)); await play(new M.FadeOut(new M.VGroup(...alone)), new M.FadeIn(mini), new M.Indicate(pre, { color: C.ink }), ...say('START AGAIN: “THE LIBRARY WILL OPEN”'));
  const draft = ['at', 'nine', 'tomorrow'].map((s, i) => card(s, OR, i));
  const blocksB = [0, 1, 2].map(i => block(i * DRAFT, DRAFT, OR, BY));
  const labB = left('with a draft', BL, OR);
  await until(S(7));
  await play(new M.FadeIn(labB), new M.LaggedStart([0, 1, 2].flatMap(i => [new M.FadeIn(draft[i]), new M.FadeIn(blocksB[i])]), { lagRatio: 0.3, runTime: 1.6 }), ...say('DRAFT: at · nine · tomorrow', OR));
  const lab6 = after('6 ms', 6, BY, OR);
  await until(S(8)); await play(new M.FadeOut(new M.VGroup(bigM, bigL, smallM, draftL, arrow)), new M.FadeIn(lab6), ...fbox([['draft  3 × 2 ms = 6 ms', OR]], OR));

  // 9-12 one checking pass over all three guesses
  const scan = new M.RoundedRectangle({ width: 2 * SP + SW + 0.24, height: CH + 0.24, cornerRadius: 0.18, color: C.cyan, strokeWidth: 2 });
  scan.moveTo([sx(1), TOKY, 0]);
  await until(S(9)); await play(new M.Create(scan), ...say('LARGE MODEL CHECKS ALL 3 IN ONE PASS'));
  await until(S(10)); await play(new M.LaggedStart(draft.map(d => new M.Indicate(d, { color: OR })), { lagRatio: 0.2, runTime: 1.4 }), ...say('THE GUESSES ARE ALREADY WRITTEN DOWN', OR));
  await until(S(11)); await play(...say('CHECK A FINISHED PAGE, NOT WORD BY WORD', C.violet));
  const chk = block(6, LARGE, C.cyan, BY, '20 ms');
  await until(S(12)); await play(new M.FadeOut(lab6), new M.FadeIn(chk), ...fbox([['draft  3 × 2 ms = 6 ms', OR], ['check  1 pass   = 20 ms', C.cyan]], C.cyan), ...say('1 CHECK PASS ≈ 1 NORMAL STEP'));

  // 13-14 at each guess: what would the large model pick?
  const qs = [0, 1, 2].map(i => { const t = T('?', 26, C.cyan, true, true); t.moveTo([sx(i), PICKY, 0]); return t; });
  await until(S(13)); await play(new M.LaggedStart(qs.map(q => new M.FadeIn(q)), { lagRatio: 0.25, runTime: 1.2 }), ...say('AT EACH GUESS: WHAT WOULD I PICK?'));
  await until(S(14)); await play(...say('IT PICKS ITS MOST LIKELY TOKEN (GREEDY)'));

  // 15-17 compare guess by guess
  const picks = ['at', 'nine', '.'].map((s, i) => card(s, C.cyan, i, PICKY));
  const marks = [true, true, false].map((ok, i) => mark(ok, i));
  const words = ['at', 'nine'], before = ['“open”', '“at”'];
  for (const i of [0, 1]) {
    await until(S(15 + i));
    await play(new M.FadeOut(qs[i]), new M.FadeIn(picks[i]), ...say(`AFTER ${before[i]}: TOP = ${words[i]} · DRAFT = ${words[i]}`));
    await until(S(15 + i) + 3.4);
    const keep = card(words[i], C.cyan, i);
    await play(new M.FadeIn(marks[i]), new M.FadeOut(draft[i]), new M.FadeIn(keep), ...say('AGREE → KEEP IT', C.green));
    draft[i] = keep;
  }
  const pct = T('70%', 19, C.cyan, true); pct.moveTo([sx(2), PCTY, 0]);
  await until(S(17)); await play(new M.FadeOut(qs[2]), new M.FadeIn(picks[2]), new M.FadeIn(pct), ...say('AFTER “at nine”: TOP = “.” (70%)'));
  const badT = card('tomorrow', C.pink, 2);
  await until(S(17) + 4.4); await play(new M.FadeIn(marks[2]), new M.FadeOut(draft[2]), new M.FadeIn(badT), ...say('DRAFT = tomorrow → DISAGREE', C.pink));
  draft[2] = badT;

  // 18-20 throw away from the first disagreement, put the large model's own token
  await until(S(18)); await play(new M.FadeOut(draft[2], { shift: [0, -0.3, 0] }), ...say('THROW AWAY THAT GUESS + ALL AFTER IT', C.pink));
  const stop = card('.', C.cyan, 2);
  await until(S(19)); await play(new M.FadeOut(picks[2]), new M.FadeIn(stop), new M.FadeOut(pct), ...say('PUT ITS OWN CHOICE THERE: “.”'));
  const kept = [draft[0], draft[1], stop];
  await until(S(20)); await play(new M.FadeOut(new M.VGroup(scan, ...marks, picks[0], picks[1])), ...say('RESULT: at · nine · .  = 3 TOKENS', C.green));
  await play(new M.LaggedStart(kept.map(k => new M.Indicate(k, { color: C.green })), { lagRatio: 0.25, runTime: 1.4 }));

  // 21-25 time and answer
  const totB = after('26 ms', 26, BY, C.cyan);
  await until(S(21)); await play(new M.FadeIn(totB), ...fbox([['draft  3 × 2 ms = 6 ms', OR], ['check  1 pass   = 20 ms', C.cyan], ['total  6 + 20   = 26 ms', C.amber]], C.amber), ...say('3 TOKENS IN 26 ms', C.amber));
  await until(S(22)); await play(new M.LaggedStart([...blocksA, totA].map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.2, runTime: 1.4 }),
    ...fbox([['with draft: 3 tokens', C.amber], ['  in 26 ms', C.amber], ['alone: 3 in 60 ms', C.ink]], C.amber), ...say('WITHOUT THE DRAFT: 60 ms', C.muted));
  await until(S(23)); await play(new M.LaggedStart([pre, ...kept].map(k => new M.Indicate(k, { color: C.green })), { lagRatio: 0.2, runTime: 1.4 }), ...say('“THE LIBRARY WILL OPEN AT NINE.”', C.green));
  await until(S(24)); await play(new M.Indicate(mini, { color: C.green }), ...say('SAME AS THE LARGE MODEL ALONE (20.3.2)', C.green));
  await until(S(25)); await play(new M.Indicate(totB, { color: C.amber }), new M.Indicate(totA, { color: C.amber }), ...say('ONLY THE SPEED CHANGED, NOT THE ANSWER', C.green));

  // 26-31 the name and the method in words
  await until(S(26)); await play(...say('SPECULATIVE DECODING'));
  await until(S(27)); await play(new M.LaggedStart(blocksB.map(b => new M.Indicate(b, { color: OR })), { lagRatio: 0.2, runTime: 1.2 }), ...say('SPECULATIVE = GUESSING BEFORE YOU ARE SURE', C.violet));
  await until(S(28)); await play(...fbox([['1 draft proposes', OR], ['  a few tokens', OR], ['2 large checks all', C.cyan], ['  in one pass', C.cyan]], C.cyan), ...say('THE METHOD, IN WORDS'));
  await until(S(29)); await play(new M.Indicate(kept[2], { color: C.cyan }), ...fbox([['3 keep up to the first', C.green], ['  disagreement, put', C.green], ['  its own token there', C.green]], C.green));
  await until(S(30)); await play(new M.LaggedStart([pre, ...kept].map(k => new M.Indicate(k, { color: C.cyan })), { lagRatio: 0.2, runTime: 1.4 }),
    ...fbox([['draft → check → keep', C.cyan], '4 repeat from the', '  longer prefix']), ...say('THEN THE LOOP STARTS AGAIN'));
  await until(S(31)); await play(...say('DRAWING AT RANDOM: SAME PROBABILITIES KEPT', C.violet));

  // 32-35 what it is for
  await until(S(32)); await play(...say('WHAT IS IT FOR?', C.amber));
  await until(S(33)); await play(new M.Indicate(totB, { color: C.green }), ...say('FASTER ANSWERS, SAME WORDS', C.green));
  await until(S(34)); await play(new M.Indicate(kept[2], { color: C.green }), ...say('MANY TOKENS ARE EASY, LIKE “.”', C.green));
  await until(S(35)); await play(new M.Indicate(kept[0], { color: C.green }), new M.Indicate(kept[1], { color: C.green }), ...say('DRAFT: EASY ONES · LARGE: FIXES HARD', C.green));

  // 36-41 the trap: a wrong first guess
  await until(S(36)); await play(...clearBox(), ...say('NOW THE TRAP', C.pink));
  await until(S(37)); await play(...say('SPEED-UP = HOW OFTEN THE DRAFT IS RIGHT', C.amber));
  const labB2 = left('with a bad draft', BL, C.pink);
  const bad = [card('on', C.pink, 0), card('Monday', OR, 1), card('.', OR, 2)];
  const pickA = card('at', C.cyan, 0, PICKY), markX = mark(false, 0);
  await until(S(38));
  await play(new M.FadeOut(new M.VGroup(...kept, ...blocksB, chk, totB, labB)), new M.FadeIn(labB2), ...say('IF THE 1ST GUESS WERE WRONG…', C.pink));
  await play(new M.LaggedStart(bad.map(b => new M.FadeIn(b)), { lagRatio: 0.25, runTime: 1.0 }), new M.FadeIn(pickA), new M.FadeIn(markX));
  const blocksC = [0, 1, 2].map(i => block(i * DRAFT, DRAFT, OR, BY));
  const chk2 = block(6, LARGE, C.cyan, BY, '20 ms');
  await until(S(39));
  await play(new M.LaggedStart([...blocksC, chk2].map(b => new M.FadeIn(b)), { lagRatio: 0.4, runTime: 1.6 }),
    ...fbox([['draft  3 × 2 ms = 6 ms', OR], ['check  1 pass   = 20 ms', C.cyan]], C.cyan), ...say('6 ms DRAFTING + 20 ms CHECKING', C.amber));
  const tot1 = after('26 ms → 1 token', 26, BY, C.pink);
  await until(S(39) + 3.6);
  const fixA = card('at', C.cyan, 0);
  await play(new M.FadeOut(new M.VGroup(...bad, markX, pickA), { shift: [0, -0.3, 0] }), new M.FadeIn(fixA), new M.FadeIn(tot1), ...say('KEEP ONLY 1 TOKEN: THE CORRECTION', C.pink));
  await until(S(40)); await play(new M.Indicate(blocksA[0], { color: C.amber }), new M.Indicate(tot1, { color: C.pink }),
    ...fbox([['bad draft: 1 token in 26 ms', C.pink], ['plain:     1 token in 20 ms', C.muted]], C.pink), ...say('26 ms > 20 ms: SLOWER', C.pink));
  await until(S(41)); await play(new M.LaggedStart(blocksC.map(b => new M.Indicate(b, { color: C.pink })), { lagRatio: 0.2, runTime: 1.2 }), ...say('A POOR DRAFT WASTES TIME', C.pink));

  // 42 recap
  const fin = ['at', 'nine', '.'].map((w, i) => card(w, C.cyan, i));
  await until(S(42)); await play(new M.FadeOut(fixA), new M.LaggedStart(fin.map(c => new M.FadeIn(c)), { lagRatio: 0.25, runTime: 1.0 }),
    ...fbox([['good draft: 3 tokens', C.green], ['  in 26 ms', C.green], ['alone: 3 in 60 ms', C.ink], ['bad draft: 1 in 26 ms', C.pink]], C.green), ...say('SMALL MODEL DRAFTS · LARGE CHECKS ONCE', C.green));
  await until(S(42) + 6); await play(...say('SAME ANSWER, LESS TIME', C.green));
}
