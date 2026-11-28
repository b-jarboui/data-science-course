// 1.2.4 The arithmetic mean: one fair share (live version of the approved Manim lesson, script.v8.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, sc, P, FW, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;
  const D1 = [10, 12, 15, 18, 25, 30, 30];
  const LY = P ? -3.3 : LINE_Y; // phone: number line sits low so the picture uses the whole height
  const CX = P ? 0 : -2.6, SP = 1.0, BW = P ? 0.7 : 0.62, PITCH = P ? 0.17 : 0.12, BASE = P ? -4.2 : -2.35;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const colx = k => CX + (k - 3) * SP, slot = (k, j) => [colx(k), BASE + (j + 0.5) * PITCH, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const lvlY = BASE + 20 * PITCH;

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
    const maxw = P ? FW - 1.2 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }

  // 0-1 seven students
  const icons = [];
  for (let k = 0; k < 7; k++) {
    const x = (k - 3) * (P ? 1.05 : 1.1), y = LY + 0.2;
    const ks = P ? 1.5 : 1;
    const head = new M.Circle({ radius: 0.14 * ks, color: C.ink }); head.setFill(C.ink, 1); head.moveTo([x, y + 0.36 * ks, 0]);
    const body = new M.Arc({ radius: 0.26 * ks, startAngle: 0, angle: Math.PI, color: C.ink }); body.setFill(C.ink, 1); body.moveTo([x, y + 0.02 * ks, 0]);
    icons.push(new M.VGroup(head, body));
  }
  await until(S(0)); await play(new M.LaggedStart(icons.map(i => new M.FadeIn(i)), { lagRatio: 0.12, runTime: 1.4 }), ...say('7 STUDENTS'));
  await until(S(1)); await play(...say('HOW MANY MINUTES TO CLASS?', C.amber));

  // 2-9 answers on a minutes line
  const L0 = FW - (P ? 1 : 2.6), x0 = -L0 / 2, n2x = v => x0 + v / 40 * L0;
  await until(S(2));
  const line = new M.Line({ start: [x0, LY, 0], end: [x0 + L0, LY, 0], color: C.muted, strokeWidth: 3 });
  const ticks = [0, 10, 20, 30, 40].map(v => new M.VGroup(
    new M.Line({ start: [n2x(v), LY - 0.07, 0], end: [n2x(v), LY + 0.07, 0], color: C.muted }),
    T(String(v), 19, C.muted, true).moveTo([n2x(v), LY - 0.35, 0])));
  const unit = T('minutes', 17, C.muted); unit.moveTo([x0 + L0 - 0.4, LY - 0.72, 0]);
  await play(new M.FadeOut(new M.VGroup(...icons)), new M.Create(line), new M.FadeIn(new M.VGroup(...ticks, unit)));
  const dots = [];
  for (let k = 0; k < 7; k++) {
    await until(S(3 + k));
    const v = D1[k], up = D1.slice(0, k).filter(x => x === v).length * 0.42, p = [n2x(v), LY + 0.3 + up, 0];
    const halo = new M.Dot({ point: p, radius: 0.3, color: C.cyan }); halo.setFill(C.cyan, 0.18);
    const d = new M.Dot({ point: p, radius: 0.13, color: C.cyan });
    const lab = T(String(v), P ? 15 : 19, C.cyan, true); lab.moveTo([p[0], p[1] + 0.42, 0]);
    dots.push(new M.VGroup(halo, d, lab));
    const extra = up ? [new M.FadeOut(dots[D1.indexOf(v)].submobjects[2])] : [];
    await play(new M.FadeIn(dots[k]), new M.Flash(d, { color: C.cyan }), ...extra);
  }

  // 10-14
  await until(S(10)); await play(...say('← SHORT TRIPS    LONG TRIPS →', C.muted));
  await until(S(11));
  const dbox = new M.RoundedRectangle({ width: n2x(30) - n2x(10) + 0.9, height: 1.75, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2 });
  dbox.moveTo([(n2x(10) + n2x(30)) / 2, LY + 0.85, 0]);
  await play(new M.Create(dbox), ...say('DATA = THE ANSWERS WE COLLECTED'));
  await until(S(12)); await play(new M.FadeOut(dbox), ...say('“HOW LONG IS THE TRIP?”', C.amber));
  await until(S(13)); await play(new M.LaggedStart(dots.map(g => new M.Indicate(g, { color: C.amber })), { lagRatio: 0.15, runTime: 2.2 }));
  await until(S(14)); await play(...say('ONE NUMBER: THE FAIR SHARE?', C.violet));

  // 15 trips become stacks of minute-blocks
  const block = (p, color = C.cyan, w = BW) => { const b = new M.Rectangle({ width: w, height: PITCH * 0.78, color, strokeWidth: 1 }); b.setFill(color, 0.82); b.moveTo(p); return b; };
  const stacks = D1.map((v, k) => Array.from({ length: v }, (_, j) => block(slot(k, j))));
  const labelRow = (vals, color) => vals.map((v, k) => { const t = T(String(v), 18, color, true); t.moveTo([colx(k), BASE - 0.25, 0]); return t; });
  let labels = new M.VGroup(...labelRow(D1, C.cyan));
  const floor = new M.Line({ start: [colx(0) - SP / 2, BASE, 0], end: [colx(6) + SP / 2, BASE, 0], color: C.muted, strokeWidth: 2 });
  const note = T('1 block = 1 minute', 16, C.muted); note.moveTo([colx(6) - 0.3, BASE - 0.65, 0]);
  await until(S(15));
  await play(new M.FadeOut(new M.VGroup(line, ...ticks, unit, ...dots)), ...say('EACH BLOCK = 1 MINUTE'));
  await play(new M.Create(floor), new M.FadeIn(labels), new M.FadeIn(note),
    new M.LaggedStart(stacks.map(st => new M.LaggedStart(st.map(b => new M.FadeIn(b)), { lagRatio: 0.08 })), { lagRatio: 0.12, runTime: 2.6 }));
  await until(S(16)); await play(...say('ONLY A PICTURE: NO REAL TRIP CHANGES', C.muted));

  // 17-18 move blocks from tall to short stacks until level
  const need = [[0, 10], [1, 8], [2, 5], [3, 2]], moves = [], fill = D1.slice();
  for (const [to, n] of need) for (let i = 0; i < n; i++) {
    const d = [6, 5, 4].find(k => stacks[k].length > 20); const b = stacks[d].pop(); stacks[to].push(b);
    moves.push({ b, from: d, to, target: slot(to, fill[to]++) });
  }
  await until(S(17)); await play(...say('MOVE BLOCKS: TALL → SHORT', C.amber));
  await play(new M.LaggedStart(moves.map(m => new M.Transform(m.b, block(m.target), { pathArc: -0.9 })), { lagRatio: 0.35, runTime: Math.max(4, E(18) - S(17) - 1.2) }));

  // 19 level at 20
  const level = new M.DashedLine({ start: [colx(0) - SP / 2, lvlY, 0], end: [colx(6) + SP / 2, lvlY, 0], color: C.amber });
  let tag20 = pill('20 EACH', C.amber, 17); tag20.moveTo([colx(3), lvlY + 0.45, 0]);
  const labels20 = new M.VGroup(...labelRow(D1.map(() => 20), C.amber));
  await until(S(19)); await play(new M.Create(level), new M.FadeIn(tag20), new M.FadeOut(labels), new M.FadeIn(labels20), ...say('FAIR SHARE = 20 MINUTES', C.amber));

  // 20-21 the name
  await until(S(20)); await play(...say('MEAN  =  AVERAGE', C.green));
  await until(S(21)); await play(new M.Indicate(labels20, { color: C.green }));

  // 22-25 why 20: no block lost, same total, seven equal stacks
  await until(S(22)); await play(...say('NOT ONE BLOCK LOST', C.violet));
  moves.forEach(m => { m.b.setFill(C.violet, 0.9); m.b.setColor(C.violet); });
  await until(S(22) + 1.8); moves.forEach(m => { m.b.setFill(C.cyan, 0.82); m.b.setColor(C.cyan); });
  const same = pill('SAME TOTAL OF BLOCKS', C.violet, 16); same.moveTo([CX, lvlY + 1.05, 0]);
  await until(S(23)); await play(new M.FadeOut(tag20), new M.FadeIn(same), ...say('TOTAL NEVER CHANGED', C.violet));
  const nums = D1.map((_, k) => { const t = T(String(k + 1), 16, C.violet, true); t.moveTo([colx(k), lvlY + 0.25, 0]); return t; });
  await until(S(24)); await play(new M.FadeOut(same), new M.LaggedStart(nums.map(n => new M.FadeIn(n)), { lagRatio: 0.12, runTime: 1.4 }));
  await until(S(25)); await play(...say('EACH STACK = TOTAL SPLIT INTO 7', C.violet));

  // 26 a faster way: blocks go back to the real trips
  await until(S(26));
  labels = new M.VGroup(...labelRow(D1, C.cyan));
  await play(new M.FadeOut(new M.VGroup(...nums, level, labels20)), new M.FadeIn(labels), ...say('A FASTER WAY', C.green));
  const back = [];
  for (const m of moves.slice().reverse()) { stacks[m.to].pop(); back.push(new M.Transform(m.b, block(slot(m.from, stacks[m.from].length)), { pathArc: 0.9 })); stacks[m.from].push(m.b); }
  await play(new M.LaggedStart(back, { lagRatio: 0.12, runTime: 2.4 }));

  // 27-33 step one: running total
  await until(S(27)); await play(...say('STEP 1: FIND THE TOTAL', C.amber), ...fbox(['total so far', ['0', C.amber]]));
  let tot = 0;
  for (let k = 0; k < 7; k++) {
    await until(S(28 + Math.max(0, k - 1)));
    const prev = tot; tot += D1[k];
    stacks[k].forEach(b => b.setFill(C.amber, 0.9));
    await play(...fbox(['total so far', [prev ? `${prev} + ${D1[k]} = ${tot}` : `${D1[k]}`, C.amber]]));
    stacks[k].forEach(b => b.setFill(C.cyan, 0.82));
  }
  // 34 the sum
  await until(S(34)); await play(...fbox(['total so far', '110 + 30 = 140', ['sum = 140', C.amber]], C.amber), ...say('SUM = THE TOTAL', C.amber));

  // 35 step two: gather all blocks into one heap
  const all = stacks.flat();
  const cols = P ? 10 : 14, cw = P ? 0.36 : 0.34, ch = P ? 0.17 : 0.13, rows = 140 / cols;
  const HEAP = P ? [0, -2.0, 0] : [CX, -0.7, 0];
  await until(S(35)); await play(new M.FadeOut(labels), ...say('STEP 2: SHARE EQUALLY', C.green));
  await play(new M.LaggedStart(all.map((b, i) => { const r = Math.floor(i / cols), c = i % cols;
    return new M.Transform(b, block([HEAP[0] + (c - (cols - 1) / 2) * cw, HEAP[1] + (r - (rows - 1) / 2) * ch, 0], C.cyan, cw * 0.86)); }), { lagRatio: 0.01, runTime: 2.0 }));
  const heapLabel = T('140 blocks', 18, C.amber); heapLabel.moveTo([HEAP[0], HEAP[1] + rows / 2 * ch + 0.3, 0]);
  await play(new M.FadeIn(heapLabel));

  // 36 count = 7: seven places
  const slots = D1.map((_, k) => { const t = T(String(k + 1), 18, C.green, true); t.moveTo([colx(k), BASE - 0.25, 0]); return t; });
  await until(S(36)); await play(new M.FadeIn(new M.VGroup(...slots)), ...fbox(['sum   = 140', ['count = 7', C.green]], C.green), ...say('COUNT = 7 STUDENTS', C.green));

  // 37-38 deal one block to each stack, again and again
  await until(S(37)); await play(new M.FadeOut(heapLabel), ...say('DEAL: ONE BLOCK TO EACH, AGAIN AND AGAIN', C.green));
  const order = all.slice().reverse();
  await play(new M.LaggedStart(order.map((b, i) => new M.Transform(b, block(slot(i % 7, Math.floor(i / 7))))), { lagRatio: 0.06, runTime: Math.max(5, E(38) - S(37) - 0.8) }));

  // 39-40 dividing
  const level2 = new M.DashedLine({ start: [colx(0) - SP / 2, lvlY, 0], end: [colx(6) + SP / 2, lvlY, 0], color: C.amber });
  tag20 = pill('20 EACH', C.amber, 17); tag20.moveTo([colx(3), lvlY + 0.45, 0]);
  await until(S(39)); await play(new M.Create(level2), new M.FadeIn(tag20), ...say('DIVIDING = EQUAL SHARING', C.green));
  await until(S(40)); await play(...fbox(['sum   = 140', 'count = 7', ['140 ÷ 7 = 20', C.amber]], C.green));

  // 41-43 the formula
  await until(S(41)); await play(...say('FORMULA = THE TWO STEPS IN ONE LINE', C.cyan));
  await until(S(42)); await play(...fbox([['mean = sum ÷ count', C.ink], ['     = 140 ÷ 7', C.muted], ['     = 20 minutes', C.amber]]));
  await until(S(43)); await play(...say('ADD EVERYTHING, THEN DIVIDE BY HOW MANY', C.amber));

  // 44-46 what it is for
  await until(S(44)); await play(...say('MEAN = ONE FAIR NUMBER FOR THE GROUP', C.green));
  await until(S(45)); await play(new M.Indicate(tag20, { color: C.amber }), ...say('“ON AVERAGE: 20 MINUTES”', C.amber));
}
