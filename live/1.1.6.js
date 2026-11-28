// lesson 1.1.6
// Units of measurement.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;

  const WAIT = [120, 90, 150, 60, 180, 60];
  const MINS = ["2", "1.5", "2.5", "1", "3", "1"];

  // ---------- Layout ----------
  const TC = P ? [0, -0.05, 0] : [-4.6, -0.5, 0];
  const RH = P ? 0.62 : 0.55;
  const HH = P ? 0.85 : 0.8;
  const TW = P ? 5.6 : 4.2;
  const CX = P ? [-1.9, 0.05, 1.9] : [-1.45, 0.05, 1.45];
  const FS = P ? 24 : 22;

  const DOTC = P ? [0, -4.0, 0] : [1.55, 0.25, 0];
  const SP = P ? 0.21 : 0.22;
  const GAP = P ? 0.25 : 0.32;
  const ROWS = 6;
  const DR = P ? 0.062 : 0.068;

  const PILL = P ? [0, -5.9, 0] : [0, 1.85, 0];
  // phone: the card sits low (under the table) until the dots arrive, then moves to the top
  let BOXP = P ? [0, -3.7, 0] : [1.55, -2.05, 0];

  const say = (s, color = C.cyan, size) =>
    showA(s, color, PILL, size);

  const txt = (s, size, color = C.ink, bold = true) =>
    T(s, size, color, bold);

  const at = (s, x, y, size = 18, color = C.ink, bold = true) => {
    const t = txt(s, size, color, bold);
    t.moveTo([x, y, 0]);
    return t;
  };

  const line = (x1, y1, x2, y2, color = C.muted, strokeWidth = 2) =>
    new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth,
    });

  // ---------- Formula box ----------
  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.44 : 0.42;

    const rows = lines.map(v => Array.isArray(v) ? v : [v, C.ink]);
    const texts = rows.map(([s, c]) => txt(s.trimStart(), size, c, true));

    const cw = txt("0000000000", size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (rows[i][0].length - rows[i][0].trimStart().length)
    );

    const wd = Math.max(...widths) + 0.7;
    const ht = rows.length * lh + 0.4;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2,
    });

    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);

    const left = BOXP[0] - wd / 2 + 0.35;
    const top = BOXP[1] + ht / 2 - 0.2 - lh / 2;

    texts.forEach((t, i) => {
      const indent =
        cw * (rows[i][0].length - rows[i][0].trimStart().length);

      t.moveTo([
        left + indent + t.getWidth() / 2,
        top - i * lh,
        0,
      ]);
    });

    const g = new M.VGroup(r, ...texts);

    const maxw = P ? FW - 1.2 : 5.6;
    if (wd > maxw) g.scale(maxw / wd);

    const animations = [new M.FadeIn(g)];

    if (boxNow) animations.push(new M.FadeOut(boxNow));

    boxNow = g;
    return animations;
  }

  // ---------- Table ----------
  const top = TC[1] + (HH + 6 * RH) / 2;

  const ry = i => top - HH - (i + 0.5) * RH;

  const card = new M.RoundedRectangle({
    width: TW,
    height: HH + 6 * RH + 0.12,
    cornerRadius: 0.16,
    color: C.cyan,
    strokeWidth: 2,
  });
  card.setFill(C.card, 0.95);
  card.moveTo([TC[0], TC[1] - 0.06, 0]);

  const hdr = new M.Rectangle({
    width: TW - 0.1,
    height: HH - 0.06,
    color: C.cyan,
    strokeWidth: 0,
  });
  hdr.setFill(C.cyan, 0.16);
  hdr.moveTo([TC[0], top - HH / 2, 0]);

  const h_ord = txt("order", FS - 3, C.cyan, true);
  h_ord.moveTo([TC[0] + CX[0], top - HH / 2, 0]);

  const h_wait = txt("wait", FS - 1, C.cyan, true);
  h_wait.moveTo([TC[0] + CX[1], top - HH * 0.3, 0]);

  const h_sec = txt("seconds", FS - 5, C.amber, true);
  h_sec.moveTo([TC[0] + CX[1], top - HH * 0.72, 0]);

  const h_min = txt("minutes", FS - 3, C.green, true);
  h_min.moveTo([TC[0] + CX[2], top - HH / 2, 0]);

  const lines = Array.from({ length: 5 }, (_, i) =>
    line(
      TC[0] - TW / 2 + 0.1,
      top - HH - (i + 1) * RH,
      TC[0] + TW / 2 - 0.1,
      top - HH - (i + 1) * RH,
      C.grid,
      1.2
    )
  );

  const ords = WAIT.map((_, i) => {
    const t = txt(String(i + 1), FS, C.muted, true);
    t.moveTo([TC[0] + CX[0], ry(i), 0]);
    return t;
  });

  const secs = WAIT.map((v, i) => {
    const t = txt(String(v), FS, C.ink, true);
    t.moveTo([TC[0] + CX[1], ry(i), 0]);
    return t;
  });

  const mins = MINS.map((v, i) => {
    const t = txt(v, FS, C.green, true);
    t.moveTo([TC[0] + CX[2], ry(i), 0]);
    return t;
  });

  const table = new M.VGroup(
    card, hdr, ...lines, h_ord, h_wait, ...ords, ...secs
  );

  function rowbox(i, color = C.amber) {
    const r = new M.Rectangle({
      width: TW - 0.14,
      height: RH - 0.04,
      color,
      strokeWidth: 2.5,
    });
    r.moveTo([TC[0], ry(i), 0]);
    return r;
  }

  // ---------- Dot layout ----------
  const GW = 10 * SP;
  const TOT = 3 * GW + 2 * GAP;
  const XL = DOTC[0] - TOT / 2 + SP / 2;
  const YT = DOTC[1] + (ROWS - 1) * SP / 2;

  function stripPos(k) {
    return [
      XL + Math.floor(k / ROWS) * SP,
      YT - (k % ROWS) * SP,
      0,
    ];
  }

  function groupPos(k) {
    const g = Math.floor(k / 60);
    const j = k % 60;

    return [
      XL + g * (GW + GAP) + Math.floor(j / ROWS) * SP,
      YT - (j % ROWS) * SP,
      0,
    ];
  }

  function groupCenter(g) {
    const x0 = XL - SP / 2 + g * (GW + GAP);
    return x0 + GW / 2;
  }

  function frame(g, color = C.amber) {
    const r = new M.Rectangle({
      width: GW,
      height: ROWS * SP,
      color,
      strokeWidth: 2,
    });

    r.moveTo([groupCenter(g), DOTC[1], 0]);
    return r;
  }

  function halfFrame(g) {
    const r = new M.Rectangle({
      width: GW / 2,
      height: ROWS * SP,
      color: C.amber,
      strokeWidth: 2.5,
    });

    r.moveTo([groupCenter(g) - GW / 4, DOTC[1], 0]);
    return r;
  }

  function flabel(g, s, color = C.amber) {
    return at(
      s,
      groupCenter(g),
      DOTC[1] - ROWS * SP / 2 - 0.35,
      P ? 19 : 18,
      color
    );
  }

  function cap(s, color = C.cyan) {
    return at(
      s,
      DOTC[0],
      DOTC[1] + ROWS * SP / 2 + 0.38,
      P ? 19 : 18,
      color
    );
  }

  function makeDots(n) {
    return Array.from({ length: n }, (_, k) =>
      new M.Dot({
        point: stripPos(k),
        radius: DR,
        color: C.cyan,
      })
    );
  }

  function makeGroupedDots(n) {
    return Array.from({ length: n }, (_, k) =>
      new M.Dot({
        point: groupPos(k),
        radius: DR,
        color: C.cyan,
      })
    );
  }

  function groupAnim(dots) {
    return dots.map((d, k) =>
      new M.Transform(
        d,
        new M.Dot({
          point: groupPos(k),
          radius: DR,
          color: C.cyan,
        })
      )
    );
  }

  // ==========================================================
  // 0-8: THE PROMISE AND THE UNITS
  // ==========================================================

  let r5 = null;

  // 0. The café notebook.
  await until(S(0));
  await play(
    new M.FadeIn(table),
    ...say("CAFE NOTEBOOK - 6 ORDERS")
  );

  // 1. The promise.
  await until(S(1));
  await play(
    ...fbox([
      "the promise:",
      "no wait over",
      ["3 minutes", C.amber],
    ], C.amber),
    ...say("THE PROMISE", C.amber)
  );

  // 2. Highlight the wait column.
  const colr = new M.Rectangle({
    width: P ? 1.5 : 1.3,
    height: 6 * RH + 0.1,
    color: C.cyan,
    strokeWidth: 2.5,
  });
  colr.moveTo([
    TC[0] + CX[1],
    top - HH - 3 * RH,
    0,
  ]);

  await until(S(2));
  await play(
    new M.Create(colr),
    ...say("DID SHE KEEP IT?")
  );

  // 3. Read the wait column.
  await until(S(3));
  await play(
    new M.LaggedStart(
      secs.map(s => new M.Indicate(s, { color: C.cyan })),
      { lagRatio: 0.15, runTime: 1.6 }
    )
  );

  // 4. Largest wait: 180.
  r5 = rowbox(4, C.pink);
  secs[4].setColor(C.pink);

  await until(S(4));
  await play(
    new M.FadeOut(colr),
    new M.Create(r5),
    ...say("THE LARGEST NUMBER: 180", C.pink)
  );

  // 5. Compare 180 with the promise.
  await until(S(5));
  await play(
    ...say("180: FAR MORE THAN 3?", C.pink),
    new M.Indicate(boxNow, { color: C.pink })
  );

  // 6. Reveal the unit.
  await until(S(6));
  await play(
    new M.FadeIn(h_sec),
    new M.Flash(h_sec, { color: C.amber }),
    ...say("LOOK: SECONDS", C.amber)
  );

  // 7. Minutes versus seconds.
  await until(S(7));
  await play(
    ...fbox([
      ["promise: minutes", C.amber],
      ["column: seconds", C.cyan],
    ], C.amber),
    ...say("MINUTES  vs  SECONDS", C.amber)
  );

  // 8. One minute equals sixty seconds.
  await until(S(8));
  secs[4].setColor(C.ink);

  await play(
    new M.FadeOut(r5),
    ...fbox([
      "1 second = 1 tick",
      ["1 minute = 60 seconds", C.amber],
    ], C.cyan),
    ...say("1 MINUTE = 60 TICKS")
  );

  // ==========================================================
  // 9-17: CUSTOMER 1 - 120 SECONDS
  // ==========================================================

  let rb = rowbox(0);
  let dots = [];
  let c = null;
  let f0 = null;
  let f1 = null;
  let l0 = null;
  let l1 = null;
  let half = null;
  let l2 = null;
  let f2 = null;
  let old = null;

  // 9. Customer 1.
  await until(S(9));
  const boxGone = [];
  if (P && boxNow) { boxGone.push(new M.FadeOut(boxNow)); boxNow = null; BOXP = [0, 3.35, 0]; }
  await play(
    ...boxGone,
    new M.Create(rb),
    ...say("CUSTOMER 1: 120 SECONDS")
  );

  // 10. Show 120 dots.
  dots = makeDots(120);
  c = cap("120 dots = 120 seconds");

  await until(S(10));
  await play(
    new M.LaggedStart(
      dots.map(d => new M.FadeIn(d)),
      { lagRatio: 0.02, runTime: 2.4 }
    ),
    new M.FadeIn(c)
  );

  // 11. Explain the groups.
  await until(S(11));
  await play(
    ...say("GROUP OF 60 DOTS = 1 MINUTE", C.amber)
  );

  // 12. Arrange two groups of sixty.
  f0 = frame(0);
  f1 = frame(1);
  l0 = flabel(0, "1 min");
  l1 = flabel(1, "1 min");

  await until(S(12));
  await play(
    ...groupAnim(dots)
  );

  await play(
    new M.Create(f0),
    new M.FadeIn(l0),
    new M.Create(f1),
    new M.FadeIn(l1)
  );

  // 13. Convert 120 seconds into two minutes.
  await until(S(13));
  await play(
    new M.FadeIn(h_min),
    new M.FadeIn(mins[0]),
    ...fbox([
      ["120 seconds", C.cyan],
      ["= 2 minutes", C.green],
    ], C.green),
    ...say("120 SECONDS = 2 MINUTES", C.green)
  );

  // 14. Nothing was added or removed.
  await until(S(14));
  await play(
    ...say("NO DOT ADDED OR REMOVED", C.violet)
  );

  dots.forEach(d => d.setColor(C.violet));
  await play(
    new M.Indicate(dots[0], { color: C.violet })
  );
  dots.forEach(d => d.setColor(C.cyan));

  // 15. The wait is unchanged.
  await until(S(15));
  await play(
    ...say("SAME WAIT, BIGGER PIECES", C.violet),
    new M.Indicate(f0, { color: C.violet }),
    new M.Indicate(f1, { color: C.violet })
  );

  // 16. Define a unit.
  await until(S(16));
  await play(
    ...fbox([
      ["unit seconds -> 120", C.cyan],
      ["unit minutes -> 2", C.green],
    ], C.green),
    ...say("UNIT = WHAT WE COUNT IN", C.green)
  );

  // 17. Smaller unit, bigger number.
  await until(S(17));
  await play(
    ...say("SMALLER UNIT -> BIGGER NUMBER", C.green, 17)
  );

  // ==========================================================
  // 18-23: CUSTOMER 2 - 90 SECONDS
  // ==========================================================

  old = [
    ...dots, f0, f1, l0, l1, c, rb
  ];

  rb = rowbox(1);
  dots = makeDots(90);
  c = cap("90 dots = 90 seconds");

  // 18. Customer 2.
  await until(S(18));
  await play(
    new M.FadeOut(new M.VGroup(...old)),
    new M.Create(rb),
    ...fbox([
      ["customer 2", C.muted],
      ["90 seconds", C.cyan],
    ]),
    ...say("CUSTOMER 2: 90 SECONDS")
  );

  await play(
    new M.LaggedStart(
      dots.map(d => new M.FadeIn(d)),
      { lagRatio: 0.02, runTime: 1.6 }
    ),
    new M.FadeIn(c)
  );

  // 19. One full group and thirty left over.
  f0 = frame(0);
  f1 = frame(1, C.muted);
  l0 = flabel(0, "1 min");
  l1 = flabel(1, "half group");

  await until(S(19));
  await play(
    ...groupAnim(dots)
  );

  await play(
    new M.Create(f0),
    new M.FadeIn(l0),
    new M.Create(f1),
    ...say("1 GROUP + 30 LEFT OVER", C.amber)
  );

  // 20. Half a group.
  half = halfFrame(1);

  await until(S(20));
  await play(
    new M.Create(half),
    new M.FadeIn(l1),
    ...say("30 = HALF OF 60", C.amber)
  );

  // 21. 90 seconds = 1.5 minutes.
  await until(S(21));
  await play(
    new M.FadeIn(mins[1]),
    ...fbox([
      ["90 seconds", C.cyan],
      ["= 1.5 minutes", C.green],
    ], C.green),
    ...say("ONE AND A HALF = 1.5", C.green)
  );

  // 22. Dividing by sixty.
  await until(S(22));
  await play(
    ...fbox([
      ["90 / 60 = 1.5", C.green],
    ], C.green),
    ...say("COUNT GROUPS OF 60 = DIVIDE BY 60", C.green, 17)
  );

  // 23. A part-full group counts as a part.
  await until(S(23));
  await play(
    new M.Indicate(half, { color: C.amber }),
    new M.Indicate(l1, { color: C.amber }),
    ...say("A PART GROUP COUNTS AS A PART", C.amber, 17)
  );

  // ==========================================================
  // 24-27: CUSTOMER 3 - 150 SECONDS
  // ==========================================================

  old = [
    ...dots, f0, f1, l0, l1, half, c, rb
  ];

  rb = rowbox(2);
  dots = makeDots(150);
  c = cap("150 dots = 150 seconds");

  // 24. Customer 3.
  await until(S(24));
  await play(
    new M.FadeOut(new M.VGroup(...old)),
    new M.Create(rb),
    ...fbox([
      ["customer 3", C.muted],
      ["150 seconds", C.cyan],
    ]),
    ...say("CUSTOMER 3: 150 SECONDS")
  );

  await play(
    new M.LaggedStart(
      dots.map(d => new M.FadeIn(d)),
      { lagRatio: 0.012, runTime: 1.6 }
    ),
    new M.FadeIn(c)
  );

  // 25. Two full groups.
  f0 = frame(0);
  f1 = frame(1);
  f2 = frame(2, C.muted);

  l0 = flabel(0, "1 min");
  l1 = flabel(1, "1 min");
  l2 = flabel(2, "half group");

  await until(S(25));
  await play(
    ...groupAnim(dots)
  );

  await play(
    new M.Create(f0),
    new M.FadeIn(l0),
    new M.Create(f1),
    new M.FadeIn(l1),
    ...say("2 GROUPS = 120 DOTS", C.amber)
  );

  // 26. Thirty dots make half a group.
  half = halfFrame(2);

  await until(S(26));
  await play(
    new M.Create(f2),
    new M.Create(half),
    new M.FadeIn(l2),
    ...say("30 LEFT = HALF A GROUP", C.amber)
  );

  // 27. 150 seconds = 2.5 minutes.
  await until(S(27));
  await play(
    new M.FadeIn(mins[2]),
    ...fbox([
      ["150 / 60 = 2.5", C.green],
    ], C.green),
    ...say("150 SECONDS = 2.5 MINUTES", C.green)
  );

  // ==========================================================
  // 28: CUSTOMERS 4 AND 6 - 60 SECONDS
  // ==========================================================

  old = [
    ...dots, f0, f1, f2, l0, l1, l2, half, c, rb
  ];

  const rb4 = rowbox(3);
  const rb6 = rowbox(5);

  dots = makeGroupedDots(60);
  f0 = frame(0);
  l0 = flabel(0, "1 min");
  c = cap("60 dots = 60 seconds");

  await until(S(28));
  await play(
    new M.FadeOut(new M.VGroup(...old)),
    new M.Create(rb4),
    new M.Create(rb6),
    ...say("CUSTOMERS 4 AND 6: 60 SECONDS")
  );

  await play(
    new M.LaggedStart(
      dots.map(d => new M.FadeIn(d)),
      { lagRatio: 0.02, runTime: 1.4 }
    ),
    new M.FadeIn(c),
    new M.Create(f0),
    new M.FadeIn(l0)
  );

  await play(
    new M.FadeIn(mins[3]),
    new M.FadeIn(mins[5]),
    ...fbox([
      ["60 / 60 = 1", C.green],
    ], C.green)
  );

  // ==========================================================
  // 29-30: CUSTOMER 5 - 180 SECONDS
  // ==========================================================

  old = [
    ...dots, f0, l0, c, rb4, rb6
  ];

  rb = rowbox(4);
  dots = makeDots(180);
  c = cap("180 dots = 180 seconds");

  // 29. Customer 5.
  await until(S(29));
  await play(
    new M.FadeOut(new M.VGroup(...old)),
    new M.Create(rb),
    ...fbox([
      ["customer 5", C.muted],
      ["180 seconds", C.cyan],
    ]),
    ...say("CUSTOMER 5: 180 SECONDS", C.pink)
  );

  await play(
    new M.LaggedStart(
      dots.map(d => new M.FadeIn(d)),
      { lagRatio: 0.01, runTime: 1.6 }
    ),
    new M.FadeIn(c)
  );

  // 30. Three full groups.
  const fr = [frame(0), frame(1), frame(2)];
  const lb = [
    flabel(0, "1 min"),
    flabel(1, "1 min"),
    flabel(2, "1 min"),
  ];

  await until(S(30));
  await play(
    ...groupAnim(dots)
  );

  for (let g = 0; g < 3; g++) {
    await play(
      new M.Create(fr[g]),
      new M.FadeIn(lb[g])
    );
  }

  await play(
    new M.FadeIn(mins[4]),
    ...fbox([
      ["180 / 60 = 3", C.green],
    ], C.green),
    ...say("180 SECONDS = 3 MINUTES", C.green)
  );

  // ==========================================================
  // 31-35: THE NEW COLUMN AND THE FORMULA
  // ==========================================================

  // 31. Change the unit at the top of the column.
  old = [
    ...dots, ...fr, ...lb, c, rb
  ];

  await until(S(31));
  await play(
    new M.FadeOut(new M.VGroup(...old)),
    new M.FadeIn(h_min),
    new M.Indicate(h_min, { color: C.green }),
    ...say("NEW UNIT: MINUTES", C.green)
  );

  await play(
    new M.Flash(h_min, { color: C.green })
  );

  // 32. Read the six converted waits.
  await until(S(32));
  await play(
    new M.LaggedStart(
      mins.map(m => new M.Indicate(m, {
        color: C.green,
        scale: 1.35,
      })),
      { lagRatio: 0.45, runTime: 4.0 }
    )
  );

  // 33. The promise was kept.
  const rk = rowbox(4, C.green);

  await until(S(33));
  await play(
    new M.Create(rk),
    ...fbox([
      "longest: 3 minutes",
      ["promise kept", C.green],
    ], C.green),
    ...say("EXACTLY 3, NOT MORE", C.green)
  );

  // 34. The conversion formula.
  await until(S(34));
  await play(
    new M.FadeOut(rk),
    ...fbox([
      ["minutes = seconds / 60", C.ink],
    ], C.cyan),
    ...say("FORMULA: A SHORT RULE")
  );

  // 35. Apply the formula.
  await until(S(35));
  await play(
    ...fbox([
      ["minutes = seconds / 60", C.ink],
      ["          = 180 / 60", C.muted],
      ["          = 3", C.amber],
    ], C.cyan),
    ...say("180 DIVIDED BY 60 = 3", C.green)
  );

  // ==========================================================
  // 36-40: WHY UNITS MATTER
  // ==========================================================

  // 36. Units tell us whether numbers measure in the same way.
  await until(S(36));
  await play(
    new M.Indicate(h_sec, { color: C.amber }),
    new M.Indicate(h_min, { color: C.amber }),
    ...say("UNITS: DO TWO NUMBERS MEASURE THE SAME WAY?", C.amber, 16)
  );

  // 37. Check units first.
  await until(S(37));
  await play(
    ...say("CHECK THE UNITS FIRST", C.amber)
  );

  // 38. The trap: 180 beside 3 without checking units.
  const rTrap = rowbox(4, C.pink);
  secs[4].setColor(C.pink);

  await until(S(38));
  await play(
    new M.Create(rTrap),
    ...fbox([
      ["180 vs 3: WRONG", C.pink],
      ["as if both were minutes", C.muted],
    ], C.pink),
    ...say("THE TRAP", C.pink)
  );

  // 39. Change all values to one unit, then compare.
  await until(S(39));
  await play(
    ...fbox([
      ["180 seconds = 3 minutes", C.green],
      ["3 minutes = 3 minutes", C.green],
      ["same wait: promise kept", C.muted],
    ], C.green),
    ...say("ONE UNIT, THEN COMPARE", C.green)
  );

  // 40. Recap.
  await until(S(40));
  secs[4].setColor(C.ink);

  await play(
    new M.FadeOut(rTrap),
    ...say("NEW UNIT, NEW NUMBER, SAME WAIT", C.amber)
  );
}
