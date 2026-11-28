// 10.3.8 Mixed-effects models. Beat i = sentence i. Log 3: waiting minutes at four branches.
// North 40 patients mean 20, South 40 mean 30, East 4 mean 40, West 4 mean 10; shared 2200 ÷ 88 = 25.
// Partial pooling: w = n ÷ (n + 4); East/West w = 0.5 → 32.5 / 17.5; North/South w = 40/44 → about 20.5 / 29.5.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const TEAL = '#40D9C2', RED = '#F87181';
  const CX = P ? 0 : -2.55;
  const PILL = P ? [0, 2.05, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 3.35, 0] : [4.25, -0.15, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // ---------- helpers ----------
  const tx = (s, size, color, pos, mono = false, maxW = 0) => { const t = T(s, size, color, mono); if (maxW && t.getWidth() > maxW) t.scale(maxW / t.getWidth()); t.moveTo(pos); return t; };
  const ln = (a, b, color = C.muted, w = 2) => new M.Line({ start: a, end: b, color, strokeWidth: w });
  const dl = (a, b, color = C.muted) => new M.DashedLine({ start: a, end: b, color });
  const dot = (p, color = TEAL, r = 0.09) => { const d = new M.Dot({ point: p, radius: r, color }); d.setFill(color, 1); return d; };
  const ring = (p, r, color, w = 3) => { const c = new M.Circle({ radius: r, color, strokeWidth: w }); c.setFill(C.bg, 0.9); c.moveTo(p); return c; };
  const outline = (w, h, p, color) => { const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.12, color, strokeWidth: 2 }); r.setFill(color, 0.04); r.moveTo(p); return r; };
  const tag = (s, color, p, size = 15) => { const t = pill(s, color, size); t.moveTo(p); return t; };
  const arrow = (a, b, color = C.amber, w = 3) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, h = Math.min(0.16, l * 0.35), q = h * 0.6;
    return new M.VGroup(ln(a, b, color, w), ln(b, [b[0] - h * ux - q * uy, b[1] - h * uy + q * ux, 0], color, w), ln(b, [b[0] - h * ux + q * uy, b[1] - h * uy - q * ux, 0], color, w));
  };
  const fin = (...o) => o.filter(Boolean).map(x => new M.FadeIn(x));
  const fout = (...o) => o.filter(Boolean).map(x => new M.FadeOut(x));
  let pic = [], mk = [];
  const add = (...o) => { const n = o.filter(Boolean); pic.push(...n); return fin(...n); };
  const addLag = (arr, rt = 1.2, lr = 0.12) => { pic.push(...arr); return [new M.LaggedStart(arr.map(x => new M.FadeIn(x)), { lagRatio: lr, runTime: rt })]; };
  const drop = (...o) => { pic = pic.filter(x => !o.includes(x)); return fout(...o); };
  const marks = (...o) => { const n = o.filter(Boolean); const a = [...fout(...mk), ...fin(...n)]; mk = n; return a; };
  const band = (w, h, p, color) => { const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.12, color, strokeWidth: 0 }); r.setFill(color, 0.13); r.moveTo(p); return r; };
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const a = boxNow ? [new M.FadeOut(boxNow)] : [];
    if (!lines) { boxNow = null; return a; }
    const size = P ? 21 : 20, lh = P ? 0.39 : 0.43;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.64, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const sc = Math.min(1, (P ? FW - 1.1 : 4.35) / wd, (P ? 1.75 : 3.6) / ht);
    if (sc < 1) g.scale(sc);
    g.moveTo(BOXP);
    a.push(new M.FadeIn(g)); boxNow = g; return a;
  }

  // ---------- data (Log 3) ----------
  const B = [
    { name: 'North', n: 40, m: 20, est: 20.5, estS: '≈20.5', col: C.cyan },
    { name: 'South', n: 40, m: 30, est: 29.5, estS: '≈29.5', col: C.amber },
    { name: 'East', n: 4, m: 40, est: 32.5, estS: '32.5', col: C.pink },
    { name: 'West', n: 4, m: 10, est: 17.5, estS: '17.5', col: C.violet }];
  const SHARED = 25;

  // ---------- layout ----------
  const ROWY = P ? [0.6, -1.0, -2.6, -4.2] : [0.95, 0.1, -0.75, -1.6];
  const NAMEX = P ? -3.55 : -6.35, GX0 = P ? -3.55 : -5.75, GP = P ? 0.2 : 0.19, GR = P ? 0.065 : 0.06;
  const MX0 = P ? -0.75 : -3.3, MX1 = P ? 3.55 : 1.35;
  const mx = v => MX0 + v / 45 * (MX1 - MX0);
  const AY = ROWY[3] - (P ? 0.6 : 0.55);
  const grid = (b, k, extra = 0, color = b.col) => Array.from({ length: extra || b.n }, (_, i) => {
    const j = i + (extra ? b.n : 0), c = j % 10, r = Math.floor(j / 10);
    return dot([GX0 + c * GP, ROWY[k] + 0.2 - r * GP * 0.9, 0], color, GR);
  });
  const names = B.map((b, k) => { const t = T(b.name, P ? 18 : 16, b.col); t.moveTo(P ? [NAMEX + t.getWidth() / 2, ROWY[k] + 0.5, 0] : [NAMEX, ROWY[k], 0]); return t; });
  const counts = B.map((b, k) => tx(`${b.n}`, P ? 17 : 15, C.ink, [GX0 + 10 * GP + 0.18, ROWY[k] + 0.2, 0], true));
  const grids = B.map((b, k) => grid(b, k));
  const rowLines = B.map((b, k) => ln([MX0, ROWY[k], 0], [MX1, ROWY[k], 0], C.line, 1.5));
  const axis = new M.VGroup(ln([MX0, AY, 0], [MX1, AY, 0], C.muted, 2),
    ...[0, 10, 20, 30, 40].map(v => tx(String(v), 15, C.muted, [mx(v), AY - 0.26, 0], true)),
    tx('minutes waiting', 15, C.muted, [(MX0 + MX1) / 2, AY - 0.55, 0]));
  const avgDot = B.map((b, k) => dot([mx(b.m), ROWY[k], 0], b.col, 0.12));
  const avgLab = B.map((b, k) => tx(String(b.m), 17, b.col, [mx(b.m), ROWY[k] + 0.3, 0], true));

  // 0
  await until(S(0)); await play(...say('WHICH BRANCH WAITS LONGEST?', C.amber));
  // 1 North and South rows, 40 each
  await until(S(1)); await play(...add(axis, names[0], names[1], counts[0], counts[1], rowLines[0], rowLines[1]), ...addLag([...grids[0], ...grids[1]], 1.5, 0.01), ...say('NORTH & SOUTH: 40 PATIENTS EACH', C.cyan));
  await until(S(2)); await play(...add(avgDot[0], avgLab[0]), ...fbox(['North', ['average 20 min', C.cyan]], C.cyan), ...say('NORTH: 20 MINUTES', C.cyan));
  await until(S(3)); await play(...add(avgDot[1], avgLab[1]), ...fbox(['South', ['average 30 min', C.amber]], C.amber), ...say('SOUTH: 30 MINUTES', C.amber));
  await until(S(4)); await play(...add(names[2], names[3], counts[2], counts[3], rowLines[2], rowLines[3]), ...addLag([...grids[2], ...grids[3]], 1.0, 0.1), ...fbox(null), ...say('EAST & WEST: ONLY 4 EACH', C.pink));
  await until(S(5)); await play(...add(avgDot[2], avgLab[2]), ...fbox(['East', ['average 40 min', C.pink]], C.pink), ...say('EAST: 40 MINUTES', C.pink));
  await until(S(6)); await play(...add(avgDot[3], avgLab[3]), ...fbox(['West', ['average 10 min', C.violet]], C.violet), ...say('WEST: 10 MINUTES', C.violet));
  await until(S(7)); await play(new M.LaggedStart(avgDot.map(d => new M.Indicate(d, { color: C.ink })), { lagRatio: 0.25, runTime: 1.6 }), ...fbox(['one minutes line', 'one dot per branch'], C.cyan), ...say('FOUR AVERAGES, ONE LINE', C.cyan));
  // 8 East few patients
  const eastBox = outline(10 * GP + 0.25, 0.42, [GX0 + 4.5 * GP, ROWY[2] + 0.2, 0], C.pink);
  await until(S(8)); await play(...marks(eastBox, tag('ONLY 4', C.pink, [mx(40), ROWY[2] - 0.4, 0], 15)), ...fbox(['East looks longest', ['but only 4 patients', C.pink]], C.pink), ...say('EAST: LONGEST, BUT ONLY 4', C.pink));
  await until(S(9)); await play(new M.Indicate(avgDot[2], { color: RED }), ...fbox(['few patients:', ['one long wait', RED], 'moves the average', 'a lot'], RED), ...say('ONE LONG WAIT MOVES IT A LOT', RED));
  await until(S(10)); await play(...fbox([['RANDOM VARIATION', C.violet], 'change caused by', 'who happens to visit'], C.violet), ...say('RANDOM VARIATION', C.violet));
  // 11 separate
  await until(S(11)); await play(...marks(tag('SEPARATE: 40', C.pink, [mx(40) - 0.9, ROWY[2] - 0.4, 0], 15)), ...fbox(['keep each branch', 'separate:', ['East stays 40', C.pink]], C.pink), ...say('SEPARATE: EAST STAYS AT 40', C.pink));
  // 12 all together 25
  await until(S(12)); await play(...marks(), ...fbox(['all 88 together', '(800+1200+160+40)', '÷ 88 = 2200 ÷ 88', ['= 25 minutes', C.green]], C.green), ...say('ALL 88 TOGETHER: 25 MINUTES', C.green));
  const shared = dl([mx(SHARED), AY + 0.1, 0], [mx(SHARED), ROWY[0] + 0.45, 0], C.green);
  const sharedTag = tag('SHARED 25', C.green, P ? [mx(SHARED), ROWY[0] + 0.66, 0] : [mx(SHARED) + 0.62, ROWY[0] + 0.5, 0], 15);
  await until(S(13)); await play(...add(shared, sharedTag), ...say('MARK 25: THE SHARED AVERAGE', C.green));
  await until(S(14)); await play(...fbox(['blend:', 'branch average', ['+ shared average', C.green]], C.green), ...say('BLEND BRANCH AND SHARED', C.green));
  // 15 lines joining
  const joins = B.map((b, k) => ln([mx(b.m), ROWY[k], 0], [mx(SHARED), ROWY[k], 0], b.col, 3));
  await until(S(15)); await play(...add(...joins), ...say('A LINE FROM EACH DOT TO 25', C.green));
  await until(S(16)); await play(...fbox([['PARTIAL POOLING', C.green], 'move partway', 'along the line'], C.green), ...say('PARTWAY = PARTIAL POOLING', C.green));
  await until(S(17)); await play(...fbox([['WEIGHT', C.amber], 'how much a number', 'counts in the blend'], C.amber), ...say('WEIGHT = HOW MUCH IT COUNTS', C.amber));
  await until(S(18)); await play(...fbox(['shared average', ['counts like', C.green], ['4 more patients', C.green]], C.green), ...say('SHARED = 4 MORE PATIENTS', C.green));
  // 19-24 East
  const eastRow = band(MX1 - MX0 + 0.4, P ? 1.1 : 0.84, [(MX0 + MX1) / 2, ROWY[2] + 0.06, 0], C.pink);
  await until(S(19)); await play(...marks(eastRow), ...say('LOOK AT EAST: 4 PATIENTS', C.pink));
  const ghosts = grid(B[2], 2, 4, C.green);
  await until(S(20)); await play(...add(...ghosts), ...fbox(['East: 4 patients', ['+ 4 from shared', C.green], ['= 8 parts', C.amber]], C.amber), ...say('4 + 4 = 8', C.amber));
  await until(S(21)); await play(...fbox(['East’s own weight', ['4 ÷ 8 = half', C.amber]], C.amber), ...say('EAST GETS HALF THE WEIGHT', C.amber));
  const gapE = new M.VGroup(ln([mx(25), ROWY[2] + 0.28, 0], [mx(40), ROWY[2] + 0.28, 0], C.ink, 2), tx('15', 17, C.ink, [mx(32.5), ROWY[2] + 0.5, 0], true));
  await until(S(22)); await play(...marks(eastRow, gapE), ...fbox(['40 − 25 = 15', 'minutes above shared'], C.pink), ...say('EAST: 15 ABOVE 25', C.pink));
  await until(S(23)); await play(...fbox(['keep half the gap', ['15 ÷ 2 = 7.5', C.amber]], C.amber), ...say('KEEP HALF: 7.5 MINUTES', C.amber));
  const estRing = B.map((b, k) => ring([mx(b.est), ROWY[k], 0], 0.13, b.col, 3.5));
  const shrink = k => new M.Transform(avgDot[k], dot([mx(B[k].m), ROWY[k], 0], B[k].col, 0.06));
  const estLab = B.map((b, k) => tx(b.estS, 17, b.col, [mx(b.est) + (k === 0 ? -0.32 : k === 1 ? 0.32 : 0), ROWY[k] - 0.34, 0], true));
  await until(S(24)); await play(shrink(2), ...add(estRing[2], estLab[2]), ...fbox(['25 + 7.5', ['= 32.5 minutes', C.pink]], C.pink), ...say('EAST MOVES TO 32.5', C.pink));
  // 25-27 West
  const gapW = new M.VGroup(ln([mx(10), ROWY[3] + 0.28, 0], [mx(25), ROWY[3] + 0.28, 0], C.ink, 2), tx('15', 17, C.ink, [mx(17.5), ROWY[3] + 0.5, 0], true));
  const westRow = band(MX1 - MX0 + 0.4, P ? 1.1 : 0.84, [(MX0 + MX1) / 2, ROWY[3] + 0.06, 0], C.violet);
  await until(S(25)); await play(...marks(westRow, gapW), ...fbox(['25 − 10 = 15', 'minutes below shared'], C.violet), ...say('WEST: 15 BELOW 25', C.violet));
  await until(S(26)); await play(...fbox(['4 patients + 4', 'weight = half', ['15 ÷ 2 = 7.5', C.amber]], C.amber), ...say('WEST ALSO KEEPS HALF', C.violet));
  await until(S(27)); await play(shrink(3), ...add(estRing[3], estLab[3]), ...fbox(['25 − 7.5', ['= 17.5 minutes', C.violet]], C.violet), ...say('WEST MOVES TO 17.5', C.violet));
  // 28-30 North and South
  const northRow = band(MX1 - MX0 + 0.4, P ? 1.1 : 0.84, [(MX0 + MX1) / 2, ROWY[0] + 0.06, 0], C.cyan);
  await until(S(28)); await play(...marks(northRow), ...fbox(['North: 40 patients', '40 + 4 = 44 parts', ['weight 40 ÷ 44 ≈ 0.91', C.cyan]], C.cyan), ...say('NORTH: 40 OUT OF 44 PARTS', C.cyan));
  await until(S(29)); await play(shrink(0), ...add(estRing[0], estLab[0]), ...fbox(['North moves a little', ['20 → about 20.5', C.cyan]], C.cyan), ...say('NORTH: ABOUT 20.5', C.cyan));
  const southRow = band(MX1 - MX0 + 0.4, P ? 1.1 : 0.84, [(MX0 + MX1) / 2, ROWY[1] + 0.06, 0], C.amber);
  await until(S(30)); await play(...marks(southRow), shrink(1), ...add(estRing[1], estLab[1]), ...fbox(['South: weight ≈ 0.91', ['30 → about 29.5', C.amber]], C.amber), ...say('SOUTH: ABOUT 29.5', C.amber));
  // 31 East still largest, gap smaller
  await until(S(31)); await play(...marks(), ...drop(...joins, ...ghosts), ...fbox(['East − South', 'before: 40 − 30 = 10', ['after: 32.5 − 29.5 = 3', C.green]], C.green), ...say('EAST STILL LARGEST · GAP SMALLER', C.pink));
  // 32-35 fixed and random effects
  await until(S(32)); await play(new M.Indicate(sharedTag.submobjects[1], { color: C.green }), ...fbox([['FIXED EFFECT', C.green], 'shared starting value', '= 25 minutes'], C.green), ...say('SHARED 25 = FIXED EFFECT', C.green));
  const shifts = B.map((b, k) => arrow([mx(SHARED), ROWY[k] + 0.0, 0], [mx(b.est), ROWY[k], 0], b.col, 3));
  await until(S(33)); await play(...marks(...shifts), ...fbox(['each branch:', ['its own shift', C.violet], 'from 25'], C.violet), ...say('EACH BRANCH: ITS OWN SHIFT', C.violet));
  await until(S(34)); await play(new M.LaggedStart(shifts.map(s => new M.Indicate(s)), { lagRatio: 0.2, runTime: 1.4 }), ...fbox([['RANDOM EFFECT', C.violet], 'a branch shift,', 'drawn from a', 'shared spread'], C.violet), ...say('BRANCH SHIFT = RANDOM EFFECT', C.violet));
  await until(S(35)); await play(...fbox(['fixed + random', ['= MIXED-EFFECTS', C.amber], ['   MODEL', C.amber]], C.amber), ...say('BOTH = MIXED-EFFECTS MODEL', C.amber));
  // 36-40 recipe
  await until(S(36)); await play(...marks(), ...fbox([['RECIPE', C.amber], 'branch weight w'], C.amber), ...say('THE RECIPE FOR THE WEIGHT', C.amber));
  await until(S(37)); await play(...fbox([['w = n ÷ (n + 4)', C.amber], 'East: 4 ÷ 8 = 0.5', 'North: 40 ÷ 44 ≈ 0.91'], C.amber), ...say('WEIGHT = COUNT ÷ (COUNT + 4)', C.amber));
  await until(S(38)); await play(...fbox(['w = n ÷ (n + 4)', ['w × branch average', C.pink], 'East: 0.5 × 40 = 20'], C.pink), ...say('WEIGHT × BRANCH AVERAGE', C.pink));
  await until(S(39)); await play(...fbox(['w × branch average', ['(1 − w) × 25', C.green], 'East: 0.5 × 25 = 12.5'], C.green), ...say('WEIGHT LEFT × SHARED AVERAGE', C.green));
  await until(S(40)); await play(...fbox(['estimate =', 'w × branch average', '+ (1 − w) × 25', ['East: 20 + 12.5 = 32.5', C.amber]], C.amber), new M.Indicate(estRing[2], { color: C.amber }), ...say('ADD THE TWO PARTS', C.amber));
  // 41-45 where the 4 comes from
  await until(S(41)); await play(...fbox(['spread of waits', ['inside a branch:', C.cyan], ['10 minutes', C.cyan]], C.cyan), ...say('WAITS INSIDE A BRANCH: SPREAD 10', C.cyan));
  await until(S(42)); await play(...fbox(['spread between', ['branches:', C.violet], ['5 minutes', C.violet]], C.violet), ...say('BRANCH DIFFERENCES: SPREAD 5', C.violet));
  await until(S(43)); await play(...fbox(['10 ÷ 5', ['= 2', C.amber]], C.amber), ...say('10 ÷ 5 = 2', C.amber));
  await until(S(44)); await play(...fbox(['2 × 2', ['= 4', C.amber], 'the 4 in n ÷ (n + 4)'], C.amber), ...say('2 × 2 = 4', C.amber));
  await until(S(45)); await play(...fbox(['more spread inside', 'a branch', ['→ shared average', C.green], ['  gets more weight', C.green]], C.green), ...say('MORE SPREAD INSIDE → MORE SHARED', C.green));
  // 46 use
  await until(S(46)); await play(new M.LaggedStart(names.map(n => new M.Indicate(n)), { lagRatio: 0.2, runTime: 1.4 }), ...fbox(['use it when records', ['come in groups', C.green], 'e.g. patients', 'at the same branch'], C.green), ...say('RECORDS IN GROUPS → USE IT', C.green));
  // 47 trap
  await until(S(47)); await play(...marks(arrow([mx(40), ROWY[2] + 0.35, 0], [mx(33), ROWY[2] + 0.35, 0], RED, 3)), ...fbox([['TRAP', RED], 'a truly unusual', 'small branch is', 'pulled too far'], RED), ...say('TRAP: TOO MUCH PULL ON EAST', RED));
  // 48 more waits
  const more = grid(B[2], 2, 36, C.pink);
  await until(S(48)); await play(...marks(), ...addLag(more, 1.2, 0.02), ...fbox(['East with 40 waits:', ['40 ÷ 44 ≈ 0.91', C.pink], 'its own average', 'counts more'], C.pink), ...say('MORE WAITS → MORE OWN WEIGHT', C.pink));
  // 49 summary
  await until(S(49)); await play(...drop(...more), new M.LaggedStart(estRing.map(r => new M.Indicate(r)), { lagRatio: 0.2, runTime: 1.4 }),
    ...fbox(['share information', 'across branches', ['small groups pulled', C.green], ['more toward 25', C.green]], C.green), ...say('SMALL GROUPS PULLED MORE TO 25', C.green));
}
