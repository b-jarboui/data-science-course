// 3.2.5 Missingness mechanisms: why values go missing (live lesson).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Picture: three logs of one day, each a row of 24 hourly dots; a gap is a hollow dashed circle.
// Row 1 radio glitch (cyan), row 2 Wi-Fi box off at night (violet), row 3 sensor C overheating (amber).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  // layout: rows of 24 dots; labels on the left (laptop) or above the row (phone)
  const NH = 24;
  const X0 = P ? -3.45 : -3.4, X1 = P ? 3.45 : 4.0, STEP = (X1 - X0) / (NH - 1);
  const hx = hh => X0 + hh * STEP;
  const Y = P ? [2.7, 0, -2.7] : [1.0, -0.15, -1.3];
  const AX = P ? -3.9 : -2.1, TEMPY = Y[2] - (P ? 0.5 : 0.38), LEGY = P ? -4.9 : -2.65;
  const PILL = P ? [0, 4.15, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, -0.9, 0] : [0, -1.7, 0];
  const COIN = P ? [0, -6.0, 0] : [5.4, Y[0], 0];
  const ROWC = [C.cyan, C.violet, C.amber];
  const DR = P ? 0.075 : 0.07, GR = P ? 0.12 : 0.12;
  const SM = P ? 15 : 14;
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const at = (t, x, y) => { t.moveTo([x, y, 0]); return t; };
  const leftAt = (t, x, y) => at(t, x + t.getWidth() / 2, y);
  const rightAt = (t, x, y) => at(t, x - t.getWidth() / 2, y);

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
    const maxw = P ? FW - 1.2 : 6.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }

  // a glowing reading, and a gap (hollow dashed circle drawn from short lines)
  function dotAt(x, y, c) {
    const halo = new M.Dot({ point: [x, y, 0], radius: DR * 1.9, color: c }); halo.setFill(c, 0.18);
    const d = new M.Dot({ point: [x, y, 0], radius: DR, color: c });
    return new M.VGroup(halo, d);
  }
  function gapAt(x, y, c = C.ink) {
    const n = 8, parts = [];
    for (let k = 0; k < n; k++) {
      const a0 = k * 2 * Math.PI / n, a1 = a0 + Math.PI / n;
      parts.push(new M.Line({ start: [x + GR * Math.cos(a0), y + GR * Math.sin(a0), 0], end: [x + GR * Math.cos(a1), y + GR * Math.sin(a1), 0], color: c, strokeWidth: 2 }));
    }
    return new M.VGroup(...parts);
  }

  // row labels: reason, name, and "what decides"
  const mkLabel = (r, s) => { const t = T(s, 17, ROWC[r], false, true); return P ? leftAt(t, X0 + 0.35, Y[r] + 0.72) : rightAt(t, X0 - 0.75, Y[r] + 0.13); };
  const mkName = (r, s) => { const t = T(s, 15, C.green); return P ? leftAt(t, X0, Y[r] + 0.38) : rightAt(t, X0 - 0.75, Y[r] - 0.22); };
  const mkTag = (r, s) => { const t = T(s, 15, C.amber); return P ? rightAt(t, X1, Y[r] + 0.38) : leftAt(t, X1 + 0.35, Y[r]); };

  // 0-2 last lesson's night: 2, 0, 4, (gap), 6
  const IV = [2, 0, 4, null, 6], ISP = P ? 1.25 : 1.4, IY = P ? 1.6 : 0.2;
  const intro = [];
  let gap0 = null;
  IV.forEach((v, k) => {
    const x = (k - 2) * ISP;
    if (v === null) { gap0 = gapAt(x, IY); intro.push(gap0); }
    else { intro.push(dotAt(x, IY, C.cyan)); intro.push(at(T(String(v), 20, C.cyan, true), x, IY + 0.42)); }
    intro.push(at(T(`${k + 1}:00`, 16, C.muted, true), x, IY - 0.42));
  });
  await until(S(0)); await play(new M.LaggedStart(intro.map(o => new M.FadeIn(o)), { lagRatio: 0.1, runTime: 1.6 }), ...say('4:00 · NO READING ARRIVED', C.amber));
  await until(S(1)); await play(new M.Indicate(gap0, { color: C.amber }), new M.Flash(gap0, { color: C.amber }), ...say('WHY DID IT GO MISSING?', C.amber));
  await until(S(2)); await play(...fbox(['mean of the 4 readings', ['12 ÷ 4 = 3', C.amber], ['can we still trust it?', C.muted]]), ...say('THE REASON DECIDES', C.violet));

  // 3 three logs
  const bases = Y.map(y => new M.Line({ start: [hx(0) - 0.2, y, 0], end: [hx(NH - 1) + 0.2, y, 0], color: C.line, strokeWidth: 2 }));
  const nums = Y.map((y, r) => at(T(String(r + 1), 17, ROWC[r], true, true), P ? X0 + 0.08 : X0 - 0.45, P ? y + 0.72 : y + 0.13));
  const dots = Y.map((y, r) => Array.from({ length: NH }, (_, hh) => dotAt(hx(hh), y, ROWC[r])));
  await until(S(3));
  const out = [new M.FadeOut(new M.VGroup(...intro))];
  if (boxNow) { out.push(new M.FadeOut(boxNow)); boxNow = null; }
  await play(...out, ...bases.map(b => new M.Create(b)), ...nums.map(n => new M.FadeIn(n)),
    new M.LaggedStart(dots.flat().map(d => new M.FadeIn(d)), { lagRatio: 0.02, runTime: 1.6 }), ...say('3 KINDS OF GAPS IN THE LOG', C.violet));

  // 4 a row of dots along a day; a gap is a hollow dashed circle
  const hours = [0, 6, 12, 18, 23].map(hh => at(T(`${hh}:00`, SM, C.muted, true), hx(hh), AX));
  await until(S(4));
  await play(new M.LaggedStart(dots[0].map(d => new M.Indicate(d, { color: C.ink })), { lagRatio: 0.04, runTime: 2.0 }), ...hours.map(t => new M.FadeIn(t)), ...say('1 DOT = 1 HOURLY READING'));
  const LX = P ? [-3.2, -0.1] : [-2.6, 0.6];
  const legend = [dotAt(LX[0], LEGY, C.cyan), leftAt(T('a reading', 15, C.muted), LX[0] + 0.25, LEGY),
    gapAt(LX[1], LEGY), leftAt(T('a gap: no reading', 15, C.muted), LX[1] + 0.25, LEGY)];
  await until(S(4) + 3.0);
  await play(new M.LaggedStart(legend.map(o => new M.FadeIn(o)), { lagRatio: 0.3, runTime: 1.2 }), ...say('GAP = HOLLOW DASHED CIRCLE', C.ink));

  // dots become gaps, one after another
  const gaps = [[], [], []];
  function makeGaps(r, hrs, runTime = 1.6) {
    const gs = hrs.map(hh => gapAt(hx(hh), Y[r]));
    gaps[r].push(...gs);
    return [new M.LaggedStart(hrs.map(hh => new M.FadeOut(dots[r][hh])), { lagRatio: 0.3, runTime }),
      new M.LaggedStart(gs.map(g => new M.FadeIn(g)), { lagRatio: 0.3, runTime })];
  }
  const G1 = [2, 7, 12, 16, 21], G2 = [0, 1, 2, 3, 4, 5], G3 = [11, 12, 13];
  const lab = [mkLabel(0, 'Radio glitch'), mkLabel(1, 'Wi-Fi box'), mkLabel(2, 'Sensor C, roof')];
  const nam = [mkName(0, 'completely at random'), mkName(1, 'at random'), mkName(2, 'not at random')];

  // 5-10 gap 1: radio glitch
  await until(S(5)); await play(new M.FadeIn(lab[0]), ...say('GAP 1: A RADIO GLITCH'));
  await until(S(5) + 2.6); await play(...makeGaps(0, G1, 2.0));
  await until(S(6)); await play(new M.Indicate(gaps[0][0], { color: C.violet }), new M.Indicate(gaps[0][2], { color: C.amber }),
    new M.Flash(gaps[0][0], { color: C.violet }), new M.Flash(gaps[0][2], { color: C.amber }), ...say('ANY HOUR · HOT DAY OR COLD DAY', C.amber));
  await until(S(7)); await play(new M.LaggedStart(gaps[0].map(g => new M.Indicate(g, { color: C.cyan })), { lagRatio: 0.3, runTime: 2.0 }), ...say('SCATTERED · NO PATTERN', C.muted));

  const coinC = new M.Circle({ radius: 0.3, color: C.amber }); coinC.setFill(C.amber, 0.22); coinC.moveTo(COIN);
  const coinT = at(T('?', 20, C.amber, true, true), COIN[0], COIN[1]);
  const coinL = at(T('coin flip', SM, C.amber), COIN[0], COIN[1] - 0.52);
  await until(S(8)); await play(new M.FadeIn(coinC), new M.FadeIn(coinT), new M.FadeIn(coinL), ...say('A COIN FLIP BEFORE EACH READING', C.amber));
  await until(S(8) + 1.6); await play(new M.Indicate(coinC, { color: C.amber }), new M.LaggedStart(gaps[0].map(g => new M.Flash(g, { color: C.amber })), { lagRatio: 0.3, runTime: 2.0 }));
  await until(S(8) + 4.0); await play(...say('THE COIN KNOWS NOTHING ABOUT THE GREENHOUSE', C.muted));
  await until(S(9)); await play(new M.FadeOut(new M.VGroup(coinC, coinT, coinL)), new M.FadeIn(nam[0]), ...say('MISSING COMPLETELY AT RANDOM', C.green));
  const kept1 = dots[0].filter((_, hh) => !G1.includes(hh));
  await until(S(10)); await play(new M.LaggedStart(kept1.map(d => new M.Indicate(d, { color: C.green })), { lagRatio: 0.08, runTime: 2.2 }), ...say('KEPT READINGS = A FAIR, SMALLER HANDFUL', C.green));

  // 11-18 gap 2: Wi-Fi box off at night
  await until(S(11)); await play(new M.FadeIn(lab[1]), ...say('GAP 2: THE WI-FI BOX', C.violet));
  const by = Y[1] - 0.3, bl = hx(0) - 0.12, br = hx(5) + 0.12;
  const brk = [new M.Line({ start: [bl, by, 0], end: [br, by, 0], color: C.violet, strokeWidth: 3 }),
    new M.Line({ start: [bl, by, 0], end: [bl, by + 0.1, 0], color: C.violet, strokeWidth: 3 }),
    new M.Line({ start: [br, by, 0], end: [br, by + 0.1, 0], color: C.violet, strokeWidth: 3 })];
  const brkT = leftAt(T('Wi-Fi off', 15, C.violet), br + 0.2, by);
  await until(S(12)); await play(...brk.map(b => new M.Create(b)), new M.FadeIn(brkT), ...say('OFF EVERY NIGHT: 0:00 TO 6:00', C.violet));
  await until(S(13)); await play(...makeGaps(1, G2, 1.6), ...say('GAPS BUNCH AT NIGHT · DAY IS FULL', C.violet));
  await until(S(13) + 2.1); await play(new M.LaggedStart(dots[1].slice(6).map(d => new M.Indicate(d, { color: C.green })), { lagRatio: 0.05, runTime: 1.3 }));
  await until(S(14)); await play(...say('CHANCE OF A GAP DEPENDS ON THE TIME', C.violet));
  await until(S(14) + 2.4); await play(new M.LaggedStart(hours.map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.2, runTime: 1.2 }), ...say('THE TIME IS WRITTEN IN THE LOG', C.green));
  await until(S(15)); await play(new M.FadeIn(nam[1]), ...say('MISSING AT RANDOM', C.green));
  await until(S(15) + 2.6); await play(...say('CONFUSING NAME → IN PLAIN WORDS:', C.muted));
  await until(S(16)); await play(new M.Indicate(brkT, { color: C.green }), new M.Indicate(nam[1], { color: C.green }), ...say('SOMETHING WE RECORDED EXPLAINS THE GAPS', C.green));
  await until(S(17)); await play(new M.LaggedStart(gaps[1].map(g => new M.Indicate(g, { color: C.violet })), { lagRatio: 0.2, runTime: 1.6 }), ...say('KNOW THE TIME → TEMPERATURE ADDS NOTHING', C.violet));
  const box = (a, b) => { const r = new M.RoundedRectangle({ width: hx(b) - hx(a) + 0.24, height: 0.46, cornerRadius: 0.1, color: C.amber, strokeWidth: 2 }); r.moveTo([(hx(a) + hx(b)) / 2, Y[1], 0]); return r; };
  const nightBox = box(0, 5), dayBox = box(6, 23);
  const nightL = at(T('nights', 15, C.amber), (hx(0) + hx(5)) / 2, Y[1] - 0.42);
  const dayL = at(T('days', 15, C.amber), (hx(6) + hx(23)) / 2, Y[1] - 0.42);
  await until(S(18)); await play(...say('WE KNOW THE TIME, SO WE CAN HANDLE IT', C.green));
  await until(S(18) + 2.6); await play(new M.FadeOut(new M.VGroup(...brk, brkT)), new M.Create(nightBox), new M.Create(dayBox), new M.FadeIn(nightL), new M.FadeIn(dayL), ...say('NIGHTS WITH NIGHTS · DAYS WITH DAYS', C.green));

  // 19-24 gap 3: sensor C overheats
  await until(S(19)); await play(new M.FadeOut(new M.VGroup(nightBox, dayBox, nightL, dayL)), new M.FadeIn(lab[2]), ...say('GAP 3: SENSOR C OVERHEATS', C.amber));
  const TV = [18, 22, 28, 37, 40, 38, 32, 25];
  const temps = TV.map((v, k) => at(T(String(v), SM, v > 35 ? C.pink : C.ink, true), hx(8 + k), TEMPY));
  const tempL = leftAt(T('air °C', SM, C.muted), hx(15) + 0.3, TEMPY);
  await until(S(20)); await play(new M.LaggedStart(temps.map(t => new M.FadeIn(t)), { lagRatio: 0.15, runTime: 1.4 }), new M.FadeIn(tempL), ...say('ABOVE 35 °C → IT STOPS SENDING', C.pink));
  await until(S(21)); await play(...makeGaps(2, G3, 1.2), ...say('GAPS = THE HOTTEST HOURS, AROUND NOON', C.amber));
  await until(S(22)); await play(...say('CHANCE OF A GAP DEPENDS ON THE TEMPERATURE', C.amber));
  await until(S(22) + 3.0); await play(new M.LaggedStart(temps.slice(3, 6).map(t => new M.Indicate(t, { color: C.pink })), { lagRatio: 0.2, runTime: 1.2 }),
    new M.LaggedStart(gaps[2].map(g => new M.Indicate(g, { color: C.pink })), { lagRatio: 0.2, runTime: 1.2 }), ...say('…THE VERY VALUE THAT IS MISSING', C.pink));
  await until(S(23)); await play(new M.FadeIn(nam[2]), ...say('MISSING NOT AT RANDOM', C.green));
  const qs = G3.map(hh => at(T('?', SM, C.pink, true, true), hx(hh), TEMPY));
  await until(S(24)); await play(...say('THE HARDEST CASE', C.pink));
  await until(S(24) + 2.4); await play(...qs.map((q, i) => new M.ReplacementTransform(temps[3 + i], q)), ...say('THE LOG HIDES HOW HOT IT WAS', C.pink));

  // 25 the three mechanisms
  await until(S(25)); await play(new M.FadeOut(new M.VGroup(...temps.slice(0, 3), ...temps.slice(6), ...qs, tempL)), ...say('MISSINGNESS MECHANISMS', C.violet));
  await until(S(25) + 3.0); await play(new M.LaggedStart(lab.map(t => new M.Indicate(t, { color: C.violet })), { lagRatio: 0.3, runTime: 1.4 }), ...say('MECHANISM = THE REASON BEHIND THE GAP', C.violet));

  // 26-29 sort any gap: what decides the chance?
  const tag = [mkTag(0, '← nothing'), mkTag(1, '← the time (recorded)'), mkTag(2, '← the missing value')];
  await until(S(26)); await play(...say('ASK: WHAT DECIDES THE CHANCE OF A GAP?', C.amber));
  await until(S(27)); await play(new M.FadeIn(tag[0]), new M.Indicate(nam[0], { color: C.green }), ...say('NOTHING → COMPLETELY AT RANDOM', C.green));
  await until(S(28)); await play(new M.FadeIn(tag[1]), new M.Indicate(nam[1], { color: C.green }), ...say('SOMETHING RECORDED → AT RANDOM', C.green));
  await until(S(29)); await play(new M.FadeIn(tag[2]), new M.Indicate(nam[2], { color: C.green }), ...say('THE MISSING VALUE → NOT AT RANDOM', C.green));

  // 30-32 practice
  await until(S(30)); await play(...say('BATTERY FLAT ON A RANDOM TUESDAY', C.cyan));
  await until(S(30) + 3.2); await play(new M.Indicate(nam[0], { color: C.green }), new M.Indicate(tag[0], { color: C.green }), new M.Flash(nums[0], { color: C.green }));
  await until(S(31)); await play(...say('DOOR OPEN → GAP · THE DOOR IS RECORDED', C.violet));
  await until(S(31) + 2.8); await play(new M.Indicate(nam[1], { color: C.green }), new M.Indicate(tag[1], { color: C.green }), new M.Flash(nums[1], { color: C.green }));
  await until(S(32)); await play(...say('FROST SENSOR STOPS BELOW 0 °C', C.amber));
  await until(S(32) + 2.4); await play(new M.Indicate(nam[2], { color: C.green }), new M.Indicate(tag[2], { color: C.green }), new M.Flash(nums[2], { color: C.green }));

  // 33 what it is for
  await until(S(33)); await play(new M.LaggedStart(tag.map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.3, runTime: 1.4 }), ...say('MECHANISM → WHICH METHODS YOU CAN TRUST', C.green));

  // 34-35 the trap: the data alone does not carry the reason
  await until(S(34)); await play(new M.FadeOut(new M.VGroup(...lab, ...nam, ...tag)), ...say('TRAP: THE DATA ALONE CANNOT PROVE IT', C.pink));
  const lab2 = [mkLabel(0, 'Radio glitch'), mkLabel(1, 'Wi-Fi box'), mkLabel(2, 'Sensor C, roof')];
  const nam2 = [mkName(0, 'completely at random'), mkName(1, 'at random'), mkName(2, 'not at random')];
  await until(S(35)); await play(new M.LaggedStart([...lab2, ...nam2].map(t => new M.FadeIn(t)), { lagRatio: 0.2, runTime: 1.8 }), ...say('ASK HOW IT WAS COLLECTED · ASK THE EXPERTS', C.amber));

  // 36-37 next and recap
  await until(S(36)); await play(new M.Indicate(lab2[2], { color: C.amber }), new M.LaggedStart(gaps[2].map(g => new M.Indicate(g, { color: C.amber })), { lagRatio: 0.2, runTime: 1.4 }), ...say('NEXT: IGNORING SENSOR C’S GAPS', C.amber));
  await until(S(37)); await play(new M.LaggedStart(gaps.flat().map(g => new M.Indicate(g, { color: C.green })), { lagRatio: 0.08, runTime: 2.2 }), ...say('BEFORE FIXING GAPS, ASK WHAT MADE THEM', C.green));
}
