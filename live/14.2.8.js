// 14.2.8 Anomaly thresholds: deciding which readings need attention (live version, script.v3.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Data (chapters/14.2.md): G (5 mm/s, 22 °C) score 0.413, H (10, 25) 0.643, I (12, 30) 0.729; time for 2 checks.
// Rule: flag when score >= threshold. 0.8 -> none, 0.7 -> I, 0.6 -> H and I, 0.4 -> G, H and I. Chosen cutoff 0.6.
// Purple diamonds = new readings; amber rings and outlines = selected for a check, never "confirmed fault".
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const NEW = [{ id: 'G', v: 5, t: 22, s: 0.413 }, { id: 'H', v: 10, t: 25, s: 0.643 }, { id: 'I', v: 12, t: 30, s: 0.729 }];
  const CAP = 2;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 1.6, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.15, 0] : [4.3, 0.2, 0];
  const Y = P ? 0.2 : 0.25, LX0 = P ? -3.3 : CX - 3.6, LW = P ? 6.6 : 7.2, sx = s => LX0 + s * LW;
  const CW = P ? 2.1 : 1.5, CH = P ? 0.95 : 0.7;
  const CARDY = P ? -2.25 : -1.4, cardx = k => CX + (k - 1) * (P ? 2.45 : 1.9);
  const QY = P ? -3.0 : -2.05;
  const SW = P ? 2.6 : 1.6, SH = P ? 0.8 : 0.6;
  const SLOTY = P ? -4.05 : -2.75, slotx = k => CX + (P ? -1.5 : -2.4) + k * (P ? 3.0 : 1.8);
  const OVER = P ? [0, SLOTY - 1.0, 0] : [CX + 1.55, SLOTY, 0];
  const COUNTP = P ? [0, -5.95, 0] : [4.3, -2.2, 0];
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
    const maxw = P ? FW - 1.0 : 4.9;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }

  // a new reading: purple diamond with a soft halo
  function diamond(p, r = 0.11, color = C.violet) {
    const halo = new M.Dot({ point: p, radius: r * 1.8, color }); halo.setFill(color, 0.16);
    const c = [[p[0], p[1] + r, 0], [p[0] + r, p[1], 0], [p[0], p[1] - r, 0], [p[0] - r, p[1], 0]];
    return new M.VGroup(halo, ...c.map((a, i) => new M.Line({ start: a, end: c[(i + 1) % 4], color, strokeWidth: 3 })),
      new M.Dot({ point: p, radius: r * 0.4, color }));
  }

  // table rows: columns line up under '    vib  temp  score'
  const HDR = ['    vib  temp', C.muted], HDRS = ['    vib  temp  score', C.muted];
  const row = (d, sc) => `${d.id}${String(d.v).padStart(6)}${String(d.t).padStart(6)}` + (sc === undefined ? '' : `  ${sc}`);
  const scoreTable = (filled, hi = -1) => fbox([HDRS, ...NEW.map((d, k) =>
    [row(d, k < filled ? d.s.toFixed(3) : '    ?'), k === hi ? C.amber : C.ink])]);
  const cmp = t => fbox([[`threshold = ${t}`, C.amber], ...NEW.map(d => d.s >= t
    ? [`${d.id}  ${d.s.toFixed(3)} ≥ ${t}  flag`, C.amber] : [`${d.id}  ${d.s.toFixed(3)} < ${t}`, C.muted])], C.amber);

  // 0 the technician and the machine
  const tx = P ? -1.6 : CX - 1.6, mx = P ? 1.4 : CX + 1.6;
  // phone: the scene starts large in the lower half, then moves up when the cards arrive
  function makeTech(yy, k) {
    const head = new M.Circle({ radius: 0.2, color: C.ink }); head.setFill(C.ink, 1); head.moveTo([tx, yy + 0.5, 0]);
    const body = new M.Arc({ radius: 0.36, startAngle: 0, angle: Math.PI, color: C.ink }); body.setFill(C.ink, 1); body.moveTo([tx, yy + 0.03, 0]);
    const techLab = T('you: the technician', 16, C.muted); techLab.moveTo([tx, yy - 0.5, 0]);
    const housing = new M.RoundedRectangle({ width: 1.9, height: 1.3, cornerRadius: 0.12, color: C.muted, strokeWidth: 2 });
    housing.setFill(C.card, 0.95); housing.moveTo([mx, yy + 0.15, 0]);
    const wheel = new M.Circle({ radius: 0.38, color: C.cyan, strokeWidth: 3 }); wheel.moveTo([mx - 0.4, yy + 0.15, 0]);
    const hub = new M.Dot({ point: [mx - 0.4, yy + 0.15, 0], radius: 0.09, color: C.cyan });
    const lamp = new M.Dot({ point: [mx + 0.55, yy + 0.52, 0], radius: 0.07, color: C.green });
    const vents = [0.1, -0.12].map(dy => new M.Line({ start: [mx + 0.25, yy + dy, 0], end: [mx + 0.75, yy + dy, 0], color: C.muted, strokeWidth: 2 }));
    const mLab = T('machine', 16, C.muted); mLab.moveTo([mx, yy - 0.75, 0]);
    const g = new M.VGroup(head, body, techLab, housing, wheel, hub, lamp, ...vents, mLab);
    if (k !== 1) g.scale(k);
    return g;
  }
  const techA = P ? makeTech(-2.75, 1.35) : makeTech(Y, 1);
  let techNow = techA;
  await until(S(0)); await play(new M.FadeIn(techA), ...say('YOU: THE TECHNICIAN'));

  // 1 three new readings arrive as cards
  const cards = NEW.map((d, k) => {
    const r = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.14, color: C.violet, strokeWidth: 2 });
    r.setFill(C.card, 0.9); r.moveTo([cardx(k), CARDY, 0]);
    const t = T(d.id, P ? 28 : 22, C.violet, true, true); t.moveTo([cardx(k) + 0.25, CARDY, 0]);
    return new M.VGroup(r, diamond([cardx(k) - (P ? 0.5 : 0.35), CARDY, 0], P ? 0.13 : 0.1), t);
  });
  const techMoves = [];
  if (P) { const techB = makeTech(Y + 0.2, 1.2); techMoves.push(new M.FadeOut(techA), new M.FadeIn(techB)); techNow = techB; }
  await until(S(1)); await play(...techMoves, new M.LaggedStart(cards.map(c => new M.FadeIn(c)), { lagRatio: 0.25, runTime: 1.4 }), ...say('3 NEW READINGS: WHICH TO CHECK?', C.violet));

  // 2 time for only two checks: two empty slots
  const slotBox = [0, 1].map(k => { const r = new M.RoundedRectangle({ width: SW, height: SH, cornerRadius: 0.12, color: C.cyan, strokeWidth: 2 }); r.setFill(C.card, 0.6); r.moveTo([slotx(k), SLOTY, 0]); return r; });
  const slotObj = [0, 1].map(k => { const t = T(`check ${k + 1}`, P ? 18 : 16, C.muted); t.moveTo([slotx(k), SLOTY, 0]); return t; });
  await until(S(2)); await play(new M.LaggedStart([...slotBox, ...slotObj].map(o => new M.FadeIn(o)), { lagRatio: 0.15, runTime: 1.2 }), ...say('TIME FOR ONLY 2 CHECKS', C.amber));

  // 3-6 the readings, row by row
  await until(S(3)); await play(new M.FadeOut(techNow), ...fbox([HDR]),
    new M.LaggedStart(cards.map(c => new M.Indicate(c, { color: C.violet })), { lagRatio: 0.2, runTime: 1.2 }), ...say('OUR 3 NEW READINGS', C.violet));
  for (let k = 0; k < 3; k++) {
    const d = NEW[k];
    await until(S(4 + k));
    await play(...fbox([HDR, ...NEW.slice(0, k + 1).map((e, j) => [row(e), j === k ? C.violet : C.ink])]),
      new M.Indicate(cards[k], { color: C.violet }), ...say(`${d.id}: ${d.v} mm/s · ${d.t} °C`, C.violet));
  }

  // 7-11 the isolation forest gave each one an anomaly score
  await until(S(7)); await play(...scoreTable(0), ...say('ISOLATION FOREST: ONE NUMBER EACH'));
  await until(S(8)); await play(...fbox([HDRS, ...NEW.map(d => row(d, '    ?')), ['score = how unusual', C.amber]]), ...say('ANOMALY SCORE = HOW UNUSUAL', C.amber));
  for (let k = 0; k < 3; k++) {
    await until(S(9 + k));
    await play(...scoreTable(k + 1, k), new M.Indicate(cards[k], { color: C.amber }), ...say(`${NEW[k].id}: SCORE ≈ ${NEW[k].s.toFixed(3)}`, C.amber));
  }

  // 12 the scores on a line from 0 to 1
  const axis = new M.Line({ start: [sx(0), Y, 0], end: [sx(1), Y, 0], color: C.muted, strokeWidth: 3 });
  const ticks = Array.from({ length: 11 }, (_, i) => new M.Line({ start: [sx(i / 10), Y - 0.07, 0], end: [sx(i / 10), Y + 0.07, 0], color: C.muted, strokeWidth: 2 }));
  const ends = [T('0', 18, C.muted, true).moveTo([sx(0) - 0.25, Y, 0]), T('1', 18, C.muted, true).moveTo([sx(1) + 0.25, Y, 0])];
  const axisLab = T('anomaly score', 16, C.muted); axisLab.moveTo([sx(0.15), Y - 0.38, 0]);
  const pts = NEW.map((d, k) => {
    const lt = T(d.id, 18, C.violet, true, true); lt.moveTo([sx(d.s), Y + 0.4, 0]);
    const sl = T(d.s.toFixed(3), P ? 16 : 17, C.violet, true); sl.moveTo([sx(d.s), Y + (k === 2 ? 1.0 : 0.7), 0]);
    return new M.VGroup(diamond([sx(d.s), Y, 0]), lt, sl);
  });
  await until(S(12)); await play(new M.Create(axis), new M.FadeIn(new M.VGroup(...ticks, ...ends, axisLab)), ...say('SCORES ON A LINE: 0 TO 1'));
  await play(new M.LaggedStart(pts.map(p => new M.FadeIn(p)), { lagRatio: 0.3, runTime: 1.4 }));

  // 13-14 further right = more unusual; but no decision yet
  const arrow = new M.Arrow({ start: [sx(0.05), Y - 0.6, 0], end: [sx(0.95), Y - 0.6, 0], color: C.cyan });
  const moreTxt = T('more unusual', 16, C.cyan); moreTxt.moveTo([sx(0.85), Y - 0.85, 0]);
  await until(S(13)); await play(new M.Create(arrow), new M.FadeIn(moreTxt),
    new M.LaggedStart(pts.map(p => new M.Indicate(p, { color: C.cyan })), { lagRatio: 0.3, runTime: 1.6 }), ...say('BIGGER SCORE = MORE UNUSUAL'));
  await until(S(14)); await play(new M.FadeOut(new M.VGroup(arrow, moreTxt)), ...say('SCORES ALONE: NO DECISION YET', C.muted));

  // the gate: an amber post under the line, an amber zone to its right, a tag with its value
  let post = null, zone = null, tag = null;
  const postL = t => new M.Line({ start: [sx(t), Y - 0.3, 0], end: [sx(t), Y - 0.68, 0], color: C.amber, strokeWidth: 5 });
  const zoneL = t => new M.Line({ start: [sx(t), Y - 0.3, 0], end: [sx(1), Y - 0.3, 0], color: C.amber, strokeWidth: 4 });
  function gate(t, name) {
    const g = pill(name, C.amber, P ? 15 : 16); g.moveTo([Math.max(sx(0) + 1.0, Math.min(sx(1) - 0.9, sx(t))), Y - 0.95, 0]);
    const a = [new M.FadeIn(g)]; if (tag) a.push(new M.FadeOut(tag)); tag = g;
    if (!post) { post = postL(t); zone = zoneL(t); a.push(new M.Create(post), new M.Create(zone)); }
    else a.push(new M.Transform(post, postL(t)), new M.Transform(zone, zoneL(t)));
    return a;
  }
  // markers: amber ring on the line + amber outline around the card, for every score >= t
  const ring = {}, outline = {};
  function marks(t) {
    const a = [];
    NEW.forEach((d, k) => {
      const on = d.s >= t;
      if (on && !ring[d.id]) {
        ring[d.id] = new M.Circle({ radius: 0.25, color: C.amber, strokeWidth: 3 }); ring[d.id].moveTo([sx(d.s), Y, 0]);
        outline[d.id] = new M.RoundedRectangle({ width: CW + 0.18, height: CH + 0.18, cornerRadius: 0.2, color: C.amber, strokeWidth: 3 }); outline[d.id].moveTo([cardx(k), CARDY, 0]);
        a.push(new M.Create(ring[d.id]), new M.Create(outline[d.id]));
      } else if (!on && ring[d.id]) {
        a.push(new M.FadeOut(ring[d.id]), new M.FadeOut(outline[d.id])); delete ring[d.id]; delete outline[d.id];
      }
    });
    return a;
  }
  // tally: flagged readings fill the two check slots (highest first); extra ones wait outside; a counter
  const slotKey = ['', '']; let over = null, overKey = '', count = null, countKey = '';
  function tally(t) {
    const f = NEW.filter(d => d.s >= t).sort((a, b) => b.s - a.s), a = [];
    [0, 1].forEach(k => {
      const key = f[k] ? f[k].id : '';
      if (key === slotKey[k]) return;
      const o = f[k] ? T(`${f[k].id}  ${f[k].s.toFixed(3)}`, P ? 20 : 17, C.amber, true, true) : T(`check ${k + 1}`, P ? 18 : 16, C.muted);
      o.moveTo([slotx(k), SLOTY, 0]);
      a.push(new M.FadeOut(slotObj[k]), new M.FadeIn(o)); slotObj[k] = o; slotKey[k] = key;
    });
    const oKey = f.slice(CAP).map(d => d.id).join(', ');
    if (oKey !== overKey) {
      if (over) a.push(new M.FadeOut(over));
      over = null;
      if (oKey) {
        const r = new M.RoundedRectangle({ width: P ? 3.0 : 2.2, height: SH, cornerRadius: 0.12, color: C.amber, strokeWidth: 2 }); r.setFill(C.card, 0.6); r.moveTo(OVER);
        const tt = T(`${oKey}: no time`, P ? 18 : 16, C.amber, true, true); tt.moveTo(OVER);
        over = new M.VGroup(r, tt); a.push(new M.FadeIn(over));
      }
      overKey = oKey;
    }
    const n = f.length, cKey = `${n} to check · time for ${CAP}`;
    if (cKey !== countKey) {
      const c = T(cKey, P ? 20 : 19, n > CAP ? C.amber : n === CAP ? C.green : C.cyan, true, true); c.moveTo(COUNTP);
      a.push(new M.FadeIn(c)); if (count) a.push(new M.FadeOut(count)); count = c; countKey = cKey;
    }
    return a;
  }
  const setAll = (t, name) => [...gate(t, name), ...marks(t), ...tally(t)];

  // 15-19 a movable gate
  await until(S(15)); await play(...gate(0.55, 'GATE'), ...say('A MOVABLE GATE', C.amber));
  await until(S(16)); await play(...marks(0.55), ...say('AT OR ABOVE THE GATE → MARKED', C.amber));
  await until(S(17)); await play(new M.Indicate(pts[0], { color: C.muted }), new M.Indicate(cards[0], { color: C.muted }), ...say('BELOW THE GATE → NOT MARKED', C.muted));
  await until(S(18)); await play(...gate(0.35, 'GATE'), ...marks(0.35), ...say('MOVE THE GATE → OTHER MARKS', C.amber));
  await until(S(18) + 2.2); await play(...gate(0.55, 'GATE'), ...marks(0.55));
  await until(S(19)); await play(...gate(0.55, 'THRESHOLD'), ...say('THE GATE = ANOMALY THRESHOLD', C.amber));

  // 20-22 threshold 0.8: nothing selected
  await until(S(20)); await play(...gate(0.8, 'THRESHOLD 0.8'), ...marks(0.8), ...tally(0.8), ...say('THRESHOLD = 0.8', C.amber));
  await until(S(21)); await play(...cmp(0.8), new M.LaggedStart(pts.map(p => new M.Indicate(p, { color: C.muted })), { lagRatio: 0.3, runTime: 1.4 }), ...say('ALL 3 SCORES BELOW 0.8', C.muted));
  await until(S(22)); await play(new M.Indicate(count, { color: C.muted }), ...say('NO READING SELECTED', C.muted));

  // 23-26 threshold 0.7: I only
  await until(S(23)); await play(...gate(0.7, 'THRESHOLD 0.7'), ...say('LOWER TO 0.7', C.amber));
  await until(S(24)); await play(...cmp(0.7), new M.Indicate(pts[2], { color: C.amber }), ...say('0.729 ≥ 0.7', C.amber));
  await until(S(25)); await play(...marks(0.7), ...tally(0.7), ...say('I MARKED · G AND H NOT', C.amber));
  await until(S(26)); await play(new M.Indicate(count, { color: C.cyan }), ...say('1 READING TO CHECK'));

  // 27-30 threshold 0.6: H and I, matches the time
  await until(S(27)); await play(...gate(0.6, 'THRESHOLD 0.6'), ...say('LOWER TO 0.6', C.amber));
  await until(S(28)); await play(...cmp(0.6), new M.Indicate(pts[1], { color: C.amber }), ...say('0.643 ≥ 0.6 TOO', C.amber));
  await until(S(29)); await play(...marks(0.6), ...tally(0.6), ...say('2 READINGS MARKED', C.amber));
  await until(S(30)); await play(new M.Indicate(count, { color: C.green }), ...say('2 CHECKS = TIME FOR 2', C.green));

  // 31-33 threshold 0.4: all three, too many
  await until(S(31)); await play(...gate(0.4, 'THRESHOLD 0.4'), ...say('LOWER TO 0.4?', C.amber));
  await until(S(32)); await play(...cmp(0.4), ...marks(0.4), ...tally(0.4), ...say('ALL 3 AT OR ABOVE 0.4', C.amber));
  await until(S(33)); await play(new M.Indicate(count, { color: C.amber }), ...say('3 TO CHECK · TIME FOR 2', C.amber));

  // 34-37 back to 0.6; flagging; exactly at the gate
  await until(S(34)); await play(...setAll(0.6, 'THRESHOLD 0.6'), ...cmp(0.6), ...say('BACK TO 0.6', C.green));
  await until(S(35)); await play(new M.LaggedStart(slotObj.map(o => new M.Indicate(o, { color: C.green })), { lagRatio: 0.3, runTime: 1.4 }), ...say('CHECK I AND H: THE 2 HIGHEST', C.green));
  await until(S(36)); await play(new M.LaggedStart([ring.I, ring.H].map(r => new M.Indicate(r, { color: C.amber })), { lagRatio: 0.3, runTime: 1.4 }), ...say('MARKED = FLAGGED', C.amber));
  await until(S(37)); await play(...fbox([['score exactly 0.6', C.ink], '0.6 ≥ 0.6  →  yes', ['→ flagged', C.amber]], C.amber), ...say('EXACTLY AT THE GATE → FLAGGED', C.amber));

  // 38-42 the decision rule; lower and raise
  await until(S(38)); await play(...fbox([['flag a reading if', C.ink], ['  score ... threshold', C.muted]], C.green), ...say('OUR DECISION RULE', C.green));
  await until(S(39)); await play(...fbox([['flag a reading if', C.ink], ['  score ≥ threshold', C.amber]], C.green), ...say('≥ : GREATER THAN OR EQUAL', C.green));
  await until(S(40)); await play(...setAll(0.4, 'THRESHOLD 0.4'), ...fbox([['lower: 0.6 → 0.4', C.amber], 'flagged: 2 → 3'], C.amber), ...say('LOWER → MORE FLAGS', C.amber));
  await until(S(41)); await play(...setAll(0.8, 'THRESHOLD 0.8'), ...fbox([['raise: 0.4 → 0.8', C.cyan], 'flagged: 3 → 0']), ...say('RAISE → FEWER FLAGS'));
  await until(S(42)); await play(...setAll(0.6, 'THRESHOLD 0.6'), ...fbox([['flag a reading if', C.ink], ['  score ≥ threshold', C.amber], ['threshold 0.6 → I, H', C.green]], C.green), ...say('SCORES → DECISIONS', C.green));

  // 43-46 a flag is not proof; what we cannot count
  const qs = NEW.map((d, k) => { const t = T('fault?', P ? 17 : 16, C.muted, true); t.moveTo([cardx(k), QY, 0]); return t; });
  await until(S(43)); await play(new M.FadeIn(qs[1]), new M.FadeIn(qs[2]), ...say('FLAG ≠ PROOF OF A FAULT', C.amber));
  await until(S(44)); await play(new M.FadeIn(qs[0]), new M.Indicate(cards[0], { color: C.muted }), ...say('BELOW ≠ SURELY FINE', C.muted));
  await until(S(45)); await play(...fbox([['missed faults  = ?', C.amber], ['needs real fault labels', C.muted]], C.amber), ...say('MISSED FAULTS: CANNOT COUNT', C.amber));
  await until(S(46)); await play(...fbox([['missed faults  = ?', C.amber], ['needless flags = ?', C.amber], ['needs real fault labels', C.muted]], C.amber), ...say('NEEDLESS FLAGS: CANNOT COUNT', C.amber));

  // 47-48 0.6 fits this batch and this time
  await until(S(47)); await play(new M.Indicate(tag, { color: C.green }), ...fbox([['threshold = 0.6', C.amber], 'flagged   = I, H', ['2 checks = time for 2', C.green]], C.green), ...say('0.6 FITS THIS BATCH AND OUR TIME', C.green));
  await until(S(48)); await play(new M.Indicate(tag, { color: C.muted }), ...fbox([['other readings or time', C.ink], ['→ maybe another threshold', C.muted]]), ...say('OTHER DATA → MAYBE ANOTHER THRESHOLD', C.muted));

  // 49-54 Try it
  await until(S(49)); await play(...setAll(0.75, 'THRESHOLD 0.75'), ...say('TRY IT: MOVE THE THRESHOLD'));
  await until(S(49) + 2.4); await play(...setAll(0.6, 'THRESHOLD 0.6'));
  await until(S(50)); await play(...setAll(0.7, 'THRESHOLD 0.7'), ...say('CHALLENGE 1: FLAG EXACTLY ONE', C.amber));
  await until(S(51)); await play(...setAll(0.6, 'THRESHOLD 0.6'), ...say('CHALLENGE 2: TOP 2, WITHIN TIME', C.amber));
  await until(S(52)); await play(...say('PREDICT: 0.6 → 0.4, THEN TEST', C.amber));
  await until(S(52) + 2.5); await play(...setAll(0.4, 'THRESHOLD 0.4'));
  await until(S(53)); await play(...setAll(0.6, 'THRESHOLD 0.6'), ...fbox([['New data:', C.violet], 'new scores, new time', 'find a threshold again'], C.violet), ...say('NEW DATA: NEW SCORES, NEW TIME'));
  await until(S(54)); await play(...fbox([['flag = needs attention', C.amber], 'not proof of a fault'], C.amber), new M.LaggedStart([outline.I, outline.H].map(o => new M.Indicate(o, { color: C.amber })), { lagRatio: 0.3, runTime: 1.4 }),
    ...say('THRESHOLD = ATTENTION, NOT PROOF', C.amber));
}
