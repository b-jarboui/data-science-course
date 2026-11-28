// lesson 5.2.6
// Gamma waiting times — live animation.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the approved reference engine API.
// Browser playback has not been tested against the actual engine.

export default async function (L) {
  const {
    M, sc, P, FW, C, S, E, T, pill,
    show, showA, until, play, LINE_Y
  } = L;

  const CX = P ? 0 : -2.6;
  const BASE = P ? -4.2 : -2.35;

  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.3, -0.3, 0];

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const SHAPE = 3;
  const SCALE = 10;
  const MEAN = SHAPE * SCALE;
  const SD = Math.sqrt(SHAPE) * SCALE;
  const MODE = (SHAPE - 1) * SCALE;

  const GAP_COLORS = [C.cyan, C.violet, C.green];

  const pt = (x, y) => [x, y, 0];

  // ------------------------------------------------------------
  // Shared drawing helpers
  // ------------------------------------------------------------

  function txt(s, x, y, size = 20, color = C.ink, mono = false) {
    const t = T(s, P && size < 18 ? 18 : size, color, mono);
    t.moveTo(pt(x, y));
    return t;
  }

  // phone only: enlarge a self-contained picture (capped to the frame width) and centre it lower
  function pfit(g, s, y) {
    if (P) {
      const k = Math.min(s, (FW - 0.8) / g.getWidth());
      if (k > 1) g.scale(k);
      g.moveTo(pt(0, y));
    }
    return g;
  }

  function fitText(s, x, y, size, color, maxw, mono = false) {
    const t = T(s, size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(pt(x, y));
    return t;
  }

  function line(x1, y1, x2, y2, color = C.muted, sw = 2) {
    return new M.Line({
      start: pt(x1, y1),
      end: pt(x2, y2),
      color,
      strokeWidth: sw
    });
  }

  function dashed(x1, y1, x2, y2, color = C.muted) {
    return new M.DashedLine({
      start: pt(x1, y1),
      end: pt(x2, y2),
      color
    });
  }

  function rect(x, y, w, h, color, opacity = 0.2, sw = 2) {
    const r = new M.Rectangle({
      width: Math.max(w, 0.001),
      height: Math.max(h, 0.001),
      color,
      strokeWidth: sw
    });

    r.setFill(color, opacity);
    r.moveTo(pt(x, y));

    return r;
  }

  function rounded(x, y, w, h, color, opacity = 0.15) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.12,
      color,
      strokeWidth: 2
    });

    r.setFill(color, opacity);
    r.moveTo(pt(x, y));

    return r;
  }

  function dot(x, y, radius = 0.1, color = C.cyan, opacity = 1) {
    const d = new M.Dot({
      point: pt(x, y),
      radius,
      color
    });

    d.setFill(color, opacity);

    return d;
  }

  function glow(x, y, radius = 0.1, color = C.cyan) {
    return new M.VGroup(
      dot(x, y, radius * 2.0, color, 0.16),
      dot(x, y, radius, color)
    );
  }

  function tag(s, x, y, color = C.cyan, size = 17) {
    const p = pill(s, color, size);

    const maxw = P ? FW - 1.3 : 5.9;

    if (p.getWidth() > maxw) {
      p.scale(maxw / p.getWidth());
    }

    p.moveTo(pt(x, y));

    return p;
  }

  function arrow(x1, y1, x2, y2, color = C.amber, sw = 3) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const h = 0.15;

    return new M.VGroup(
      line(x1, y1, x2, y2, color, sw),
      line(
        x2, y2,
        x2 - h * Math.cos(a - 0.55),
        y2 - h * Math.sin(a - 0.55),
        color, sw
      ),
      line(
        x2, y2,
        x2 - h * Math.cos(a + 0.55),
        y2 - h * Math.sin(a + 0.55),
        color, sw
      )
    );
  }

  function cross(x, y, size = 0.13, color = C.amber) {
    return new M.VGroup(
      line(x - size, y - size, x + size, y + size, color, 3),
      line(x - size, y + size, x + size, y - size, color, 3)
    );
  }

  function bracket(x1, x2, y, label, color = C.amber) {
    return new M.VGroup(
      line(x1, y, x2, y, color, 2),
      line(x1, y - 0.09, x1, y + 0.09, color, 2),
      line(x2, y - 0.09, x2, y + 0.09, color, 2),
      txt(label, (x1 + x2) / 2, y - 0.30, 18, color)
    );
  }

  // ------------------------------------------------------------
  // Formula box — same styling as the approved reference
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    if (!lines) {
      const a = boxNow ? [new M.FadeOut(boxNow)] : [];

      boxNow = null;

      return a;
    }

    const size = P ? 22 : 21;
    const lh = P ? 0.38 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      )
    );

    const wd = Math.max(...widths) + 0.7;
    const ht = rows.length * lh + 0.36;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);

    const left = BOXP[0] - wd / 2 + 0.35;
    const top = BOXP[1] + ht / 2 - 0.18 - lh / 2;

    texts.forEach((t, i) => {
      const ind = cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      );

      t.moveTo([
        left + ind + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);

    const maxw = P ? FW - 1.2 : 4.0;
    const maxh = P ? 1.32 : 3.4;

    const scale = Math.min(1, maxw / wd, maxh / ht);

    if (scale < 1) g.scale(scale);

    g.moveTo(BOXP);

    const a = [new M.FadeIn(g)];

    if (boxNow) a.push(new M.FadeOut(boxNow));

    boxNow = g;

    return a;
  }

  // ------------------------------------------------------------
  // Picture management
  // Never group objects that are already on screen.
  // ------------------------------------------------------------

  let picture = [];
  let overlays = [];

  function clearOverlays() {
    const a = overlays.map(o => new M.FadeOut(o));

    overlays = [];

    return a;
  }

  function clearPicture() {
    const a = [
      ...clearOverlays(),
      ...picture.map(o => new M.FadeOut(o))
    ];

    picture = [];

    return a;
  }

  function replacePicture(...objects) {
    const a = clearPicture();

    picture = objects;

    return [
      ...a,
      ...objects.map(o => new M.FadeIn(o))
    ];
  }

  function replaceOverlay(...objects) {
    const a = clearOverlays();

    overlays = objects;

    return [
      ...a,
      ...objects.map(o => new M.FadeIn(o))
    ];
  }

  // ------------------------------------------------------------
  // Sealing-head icon and spare-parts box
  // ------------------------------------------------------------

  function headIcon(x, y, color = C.cyan, failed = false) {
    const body = rounded(
      x, y + 0.25,
      0.91, 0.65,
      color, failed ? 0.08 : 0.20
    );

    const stem = rect(
      x, y - 0.20,
      0.20, 0.32,
      color, 0.35
    );

    const jaw = rounded(
      x, y - 0.43,
      1.13, 0.18,
      color, failed ? 0.12 : 0.82
    );

    const screws = [
      dot(x - 0.29, y + 0.39, 0.045, C.muted),
      dot(x + 0.29, y + 0.39, 0.045, C.muted)
    ];

    const status = failed
      ? cross(x, y + 0.25, 0.20, C.amber)
      : glow(x, y + 0.25, 0.075, color);

    return new M.VGroup(
      body,
      stem,
      jaw,
      ...screws,
      status
    );
  }

  function singleHeadPicture() {
    const y = P ? -1.45 : -0.45;

    const head = headIcon(CX, y, C.cyan);

    const baseline = y - 1.02;
    const left = CX - 2.4;
    const right = CX + 2.4;

    return new M.VGroup(
      head,
      txt(
        'ONE SEALING HEAD',
        CX, y + 1.06,
        21, C.ink
      ),
      line(left, baseline, right, baseline, C.cyan, 5),
      glow(left, baseline, 0.09, C.green),
      txt('new', left, baseline - 0.33, 17, C.green),
      txt(
        '10 weeks on average',
        CX, baseline + 0.33,
        19, C.cyan
      ),
      txt(
        'weeks →',
        right - 0.15, baseline - 0.33,
        17, C.muted
      )
    );
  }

  function boxOfHeads() {
    const y = P ? -1.55 : -0.55;

    const crate = rounded(
      CX, y - 0.15,
      5.2, 2.05,
      C.muted, 0.08
    );

    const heads = [-1.55, 0, 1.55].map((dx, i) =>
      headIcon(CX + dx, y, GAP_COLORS[i])
    );

    const labels = [-1.55, 0, 1.55].map((dx, i) =>
      txt(
        `HEAD ${i + 1}`,
        CX + dx, y - 0.79,
        16, GAP_COLORS[i]
      )
    );

    return new M.VGroup(
      crate,
      ...heads,
      ...labels,
      txt(
        'BOX OF THREE SPARES',
        CX, y + 1.27,
        22, C.ink
      )
    );
  }

  function replacementPicture(stage) {
    const y = P ? -1.55 : -0.55;
    const objects = [];

    for (let i = 0; i < 3; i++) {
      const x = CX + (i - 1) * 1.88;
      const failed = i < stage;

      const color = failed
        ? C.muted
        : GAP_COLORS[i];

      objects.push(
        headIcon(x, y, color, failed)
      );

      const status = failed
        ? 'FAILED'
        : i === stage
          ? 'WORKING'
          : 'SPARE';

      objects.push(
        txt(
          status,
          x, y - 0.91,
          17,
          failed ? C.amber : color
        )
      );

      objects.push(
        txt(
          String(i + 1),
          x, y + 0.92,
          18, color, true
        )
      );

      if (i < 2) {
        objects.push(
          arrow(
            x + 0.63, y - 0.08,
            x + 1.25, y - 0.08,
            C.muted, 2
          )
        );
      }
    }

    objects.push(
      txt(
        stage === 3
          ? 'ALL THREE HEADS USED'
          : 'REPLACE ONLY WHEN A HEAD FAILS',
        CX, y + 1.50,
        P ? 19 : 18,
        stage === 3 ? C.amber : C.ink
      )
    );

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // 0–3: the factory's spare-parts problem
  // ------------------------------------------------------------

  // 0 — one head: exponential, mean ten weeks

  await until(S(0));

  await play(
    ...replacePicture(pfit(singleHeadPicture(), 1.3, -2.6)),
    ...say('ONE HEAD: 10 WEEKS ON AVERAGE'),
    ...fbox([
      'Exponential lifetime',
      ['Mean = 10 weeks', C.cyan],
      'Constant failure rate'
    ])
  );

  // 1 — a box of three sealing heads

  await until(S(1));

  await play(
    ...replacePicture(pfit(boxOfHeads(), 1.3, -2.6)),
    ...say('THREE SEALING HEADS', C.green),
    ...fbox([
      '1 box',
      ['3 sealing heads', C.green]
    ], C.green)
  );

  // 2 — use them one after another

  await until(S(2));

  await play(
    ...replacePicture(pfit(replacementPicture(0), 1.25, -2.6)),
    ...say('ONE AFTER ANOTHER'),
    ...fbox([
      'First head fails',
      'Put in the next head',
      ['Continue until all 3 fail', C.amber]
    ], C.amber)
  );

  for (const stage of [1, 2, 3]) {
    await play(
      ...replacePicture(pfit(replacementPicture(stage), 1.25, -2.6))
    );
  }

  // 3 — the two questions

  await until(S(3));

  await play(
    ...replacePicture(pfit(boxOfHeads(), 1.3, -2.6)),
    ...say('HOW LONG WILL THE BOX LAST?', C.amber),
    ...fbox([
      'Question 1',
      'Average box lifetime?',
      'Question 2',
      ['Used up within 30 weeks?', C.amber]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // Lifetime timeline
  // Illustrative individual gaps, not measured factory records.
  // ------------------------------------------------------------

  const TLW = P ? Math.min(5.95, FW - 1.4) : 6.0;
  const TLX = CX - TLW / 2;
  const TLY = P ? -2.6 : -0.48;

  const tx = t => TLX + t / 40 * TLW;

  const GAPS = [8, 14, 9];

  function timelineAxes() {
    const objects = [
      line(tx(0), TLY, tx(40), TLY, C.muted, 3),
      txt(
        'Time in weeks',
        CX, TLY + 1.36,
        22, C.ink
      )
    ];

    for (let t = 0; t <= 40; t += 5) {
      objects.push(
        line(tx(t), TLY - 0.08, tx(t), TLY + 0.08, C.muted)
      );

      if (t % 10 === 0) {
        objects.push(
          txt(
            String(t),
            tx(t), TLY - 0.35,
            17, C.muted, true
          )
        );
      }
    }

    objects.push(
      txt('weeks', tx(40) - 0.15, TLY - 0.73, 16, C.muted)
    );

    return new M.VGroup(...objects);
  }

  function gapOnTimeline(index, start, length) {
    const color = GAP_COLORS[index];
    const end = start + length;
    const mid = (tx(start) + tx(end)) / 2;

    return new M.VGroup(
      line(
        tx(start), TLY,
        tx(end), TLY,
        color, 8
      ),
      glow(tx(start), TLY, 0.085, color),
      cross(tx(end), TLY, 0.105, C.amber),
      txt(
        `Head ${index + 1}`,
        mid, TLY + 0.40,
        17, color
      ),
      txt(
        `${length} weeks`,
        mid, TLY + 0.76,
        16, color, true
      )
    );
  }

  // 4 — draw a weeks line

  await until(S(4));

  const timeAxes = timelineAxes();

  await play(
    ...replacePicture(timeAxes),
    ...say('DRAW A WEEKS LINE'),
    ...fbox(null)
  );

  // 5 — first, second and third exponential gaps

  await until(S(5));

  let start5 = 0;

  const timeGaps = GAPS.map((g, i) => {
    const object = gapOnTimeline(i, start5, g);

    start5 += g;

    return object;
  });

  picture.push(...timeGaps);

  await play(
    new M.LaggedStart(
      timeGaps.map(g => new M.FadeIn(g)),
      {
        lagRatio: 0.85,
        runTime: 3.5
      }
    ),
    ...say('THREE WAITING GAPS'),
    ...fbox([
      ['Head 1:  8 weeks', C.cyan],
      ['Head 2: 14 weeks', C.violet],
      ['Head 3:  9 weeks', C.green],
      'Illustrative lifetimes'
    ])
  );

  // 6 — each gap has mean ten weeks

  await until(S(6));

  const independent6 = tag(
    'INDEPENDENT LIFETIMES',
    CX, TLY - 1.17,
    C.green, 17
  );

  await play(
    new M.LaggedStart(
      timeGaps.map(g =>
        new M.Indicate(g, { color: C.amber })
      ),
      {
        lagRatio: 0.3,
        runTime: 1.9
      }
    ),
    ...replaceOverlay(independent6),
    ...say('EACH GAP AVERAGES 10 WEEKS'),
    ...fbox([
      'Each gap: exponential',
      ['Mean = 10 weeks', C.cyan],
      'Independent of the others'
    ])
  );

  // 7 — total lifetime is the sum of the gaps

  await until(S(7));

  const sumBracket = bracket(
    tx(0), tx(31),
    TLY - 0.89,
    'Total = 31 weeks',
    C.amber
  );

  await play(
    ...replaceOverlay(sumBracket),
    ...say('ADD THE THREE GAPS', C.amber),
    ...fbox([
      'Box lifetime',
      '8 + 14 + 9',
      ['= 31 weeks', C.amber],
      'One illustrative box'
    ], C.amber)
  );

  // ------------------------------------------------------------
  // Simulation
  //
  // A fixed seed makes playback and seeking deterministic.
  // Each simulated box receives three independent exponential
  // lifetimes, each with mean ten weeks.
  // ------------------------------------------------------------

  let seed = 526;

  function uniform() {
    seed = (
      Math.imul(1664525, seed) + 1013904223
    ) >>> 0;

    return (seed + 0.5) / 4294967296;
  }

  function expGap() {
    return -SCALE * Math.log(uniform());
  }

  const N = 200;

  const simulated = Array.from({ length: N }, () => {
    const gaps = [expGap(), expGap(), expGap()];

    return {
      gaps,
      total: gaps.reduce((a, b) => a + b, 0)
    };
  });

  const BIN = 5;

  const SIM_MAX = Math.max(
    100,
    Math.ceil(
      Math.max(...simulated.map(s => s.total)) / 20
    ) * 20
  );

  const NBINS = SIM_MAX / BIN;

  const bins = Array(NBINS).fill(0);

  simulated.forEach(s => {
    const index = Math.min(
      NBINS - 1,
      Math.floor(s.total / BIN)
    );

    bins[index]++;
  });

  const MAX_COUNT = Math.max(...bins);

  const SIM_X = CX - (P ? 2.85 : 2.75);
  const SIM_Y = P ? -4.02 : -2.15;
  const SIM_W = P ? Math.min(5.85, FW - 1.6) : 5.95;
  const SIM_H = P ? 4.50 : 2.85;

  const sx = t => SIM_X + t / SIM_MAX * SIM_W;

  const countY = n =>
    SIM_Y + n / (MAX_COUNT * 1.13) * SIM_H;

  function simulationAxes(title = 'Simulated box lifetimes') {
    const objects = [
      line(
        sx(0), SIM_Y,
        sx(SIM_MAX), SIM_Y,
        C.muted, 3
      ),
      line(
        sx(0), SIM_Y,
        sx(0), SIM_Y + SIM_H,
        C.muted, 2
      ),
      txt(
        title,
        CX, SIM_Y + SIM_H + 0.44,
        21, C.ink
      )
    ];

    for (let t = 0; t <= SIM_MAX; t += 20) {
      objects.push(
        line(
          sx(t), SIM_Y - 0.07,
          sx(t), SIM_Y + 0.07,
          C.muted
        ),
        txt(
          String(t),
          sx(t), SIM_Y - 0.29,
          16, C.muted, true
        )
      );
    }

    objects.push(
      txt(
        'weeks',
        sx(SIM_MAX) - 0.12,
        SIM_Y - 0.64,
        16, C.muted
      )
    );

    return new M.VGroup(...objects);
  }

  function simulationDots() {
    const seen = Array(NBINS).fill(0);
    const bw = SIM_W / NBINS;
    const pitchY =
      SIM_H / (MAX_COUNT * 1.13) * 2;

    const radius = Math.min(
      P ? 0.052 : 0.048,
      bw * 0.19,
      pitchY * 0.38
    );

    return simulated.map(sample => {
      const bin = Math.min(
        NBINS - 1,
        Math.floor(sample.total / BIN)
      );

      const index = seen[bin]++;

      const row = Math.floor(index / 2);
      const col = index % 2;

      const x =
        sx(bin * BIN + BIN / 2) +
        (col - 0.5) * bw * 0.40;

      const y =
        SIM_Y + (row + 0.5) * pitchY;

      return dot(x, y, radius, C.cyan, 0.90);
    });
  }

  function histogram(highlight = null) {
    const bw = SIM_W / NBINS;

    const bars = [];

    for (let i = 0; i < NBINS; i++) {
      const n = bins[i];

      if (!n) continue;

      const a = i * BIN;
      const b = a + BIN;

      const highlighted =
        highlight && highlight(a, b);

      const color = highlighted
        ? C.amber
        : C.cyan;

      const h = countY(n) - SIM_Y;

      bars.push(
        rect(
          sx(a + BIN / 2),
          SIM_Y + h / 2,
          bw * 0.90,
          h,
          color,
          highlighted ? 0.75 : 0.48,
          1.5
        )
      );
    }

    return new M.VGroup(...bars);
  }

  function simulationPicture(highlight = null) {
    return new M.VGroup(
      simulationAxes(),
      histogram(highlight)
    );
  }

  // 8 — let a computer simulate many boxes

  await until(S(8));

  await play(
    ...replacePicture(pfit(boxOfHeads(), 1.3, -2.6)),
    ...say('SIMULATION: PLAY OUT MANY BOXES', C.green),
    ...fbox([
      'Let a computer draw',
      '3 random lifetimes',
      ['Repeat for 200 boxes', C.green]
    ], C.green)
  );

  // 9 — draw three gaps, add them, drop a dot

  await until(S(9));

  const sample9 = simulated[0];

  await play(
    ...say('THREE RANDOM GAPS → ONE TOTAL'),
    ...fbox([
      'One simulated box',
      [
        sample9.gaps.map(g => g.toFixed(2)).join(' + '),
        C.cyan
      ],
      [`≈ ${sample9.total.toFixed(2)} weeks`, C.amber],
      'Drop one dot at the total'
    ])
  );

  const simAxes9 = simulationAxes();
  const allDots9 = simulationDots();

  // Group small batches before displaying them.
  // Their order is the simulation order, not sorted by lifetime.

  const batches9 = [];

  for (let i = 0; i < allDots9.length; i += 10) {
    batches9.push(
      new M.VGroup(...allDots9.slice(i, i + 10))
    );
  }

  await play(
    ...clearPicture(),
    new M.FadeIn(simAxes9),
    new M.LaggedStart(
      batches9.map(g => new M.FadeIn(g)),
      {
        lagRatio: 0.13,
        runTime: 3.5
      }
    ),
    ...fbox([
      '200 simulated boxes',
      'Each dot = one total',
      ['Grouped in 5-week bins', C.cyan]
    ])
  );

  picture = [simAxes9, ...batches9];

  // 10 — the dots become a histogram

  await until(S(10));

  await play(
    ...replacePicture(simulationPicture()),
    ...say('THE DOTS FORM A HISTOGRAM'),
    ...fbox([
      'Histogram',
      'Group totals into bins',
      ['Height = number of boxes', C.cyan]
    ])
  );

  // 11 — almost nothing near zero

  await until(S(11));

  const nearZero11 = rounded(
    (sx(0) + sx(10)) / 2,
    SIM_Y + 0.45,
    sx(10) - sx(0) + 0.10,
    0.9,
    C.amber, 0.06
  );

  await play(
    ...replaceOverlay(nearZero11),
    ...say('HARDLY ANY BOXES END NEAR ZERO', C.amber),
    ...fbox([
      'Very short box lives',
      ['Unusual', C.amber]
    ], C.amber)
  );

  // 12 — all three would have to fail almost at once

  function shortGapsPicture() {
    const y = P ? -1.50 : -0.48;
    const left = CX - 2.75;
    const right = CX + 2.75;
    const w = right - left;

    const x = t => left + t / 30 * w;

    const gaps = [0.7, 1.1, 0.8];

    const objects = [
      txt(
        'All three fail very quickly',
        CX, y + 1.40,
        21, C.ink
      ),
      line(left, y, right, y, C.muted, 3)
    ];

    for (const t of [0, 10, 20, 30]) {
      objects.push(
        line(x(t), y - 0.08, x(t), y + 0.08, C.muted),
        txt(String(t), x(t), y - 0.32, 17, C.muted, true)
      );
    }

    let start = 0;

    gaps.forEach((g, i) => {
      const end = start + g;

      objects.push(
        line(
          x(start), y,
          x(end), y,
          GAP_COLORS[i], 9
        ),
        glow(x(end), y, 0.07, GAP_COLORS[i])
      );

      start = end;
    });

    const boxY = y - 1.23;

    objects.push(
      tag('VERY SHORT TOTAL', CX, boxY, C.amber, 18),
      arrow(
        CX - 1.15, boxY + 0.35,
        x(1.3), y - 0.12,
        C.amber, 2
      ),
      txt(
        'Possible, but rare',
        CX, boxY - 0.48,
        18, C.muted
      )
    );

    return new M.VGroup(...objects);
  }

  await until(S(12));

  await play(
    ...replacePicture(pfit(shortGapsPicture(), 1.2, -2.6)),
    ...say('THREE QUICK FAILURES ARE RARE', C.amber),
    ...fbox([
      'All 3 heads would need',
      'very short lifetimes',
      ['Rare combination', C.amber]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // Gamma density and probability helpers
  // Integer shape, scale ten weeks.
  // ------------------------------------------------------------

  function factorial(n) {
    let v = 1;

    for (let i = 2; i <= n; i++) {
      v *= i;
    }

    return v;
  }

  function gammaPDF(t, shape = SHAPE, scale = SCALE) {
    if (t < 0) return 0;

    return (
      Math.pow(t / scale, shape - 1) *
      Math.exp(-t / scale)
    ) / (
      factorial(shape - 1) * scale
    );
  }

  function gammaSurvival(t, shape = SHAPE, scale = SCALE) {
    if (t < 0) return 1;

    const z = t / scale;

    let sum = 0;

    for (let k = 0; k < shape; k++) {
      sum += Math.pow(z, k) / factorial(k);
    }

    return Math.exp(-z) * sum;
  }

  function gammaCDF(t, shape = SHAPE, scale = SCALE) {
    return 1 - gammaSurvival(t, shape, scale);
  }

  const P30 = gammaCDF(30);
  const Q30 = gammaSurvival(30);
  const Q60 = gammaSurvival(60);

  // ------------------------------------------------------------
  // Density graph
  // ------------------------------------------------------------

  const GX = CX - (P ? 2.85 : 2.75);
  const GY = P ? -4.02 : -2.15;
  const GW = P ? Math.min(5.85, FW - 1.6) : 5.95;
  const GH = P ? 4.50 : 2.85;

  function graphMap(maxT = 100, maxD = 0.032) {
    return {
      maxT,
      maxD,
      x: t => GX + GW * t / maxT,
      y: d => GY + GH * d / maxD
    };
  }

  const G = graphMap();

  const X = G.x;
  const Y = G.y;

  function graphAxes(
    g = G,
    title = 'Box lifetime',
    ticks = [0, 20, 40, 60, 80, 100]
  ) {
    const objects = [
      line(
        g.x(0), GY,
        g.x(g.maxT), GY,
        C.muted, 3
      ),
      line(
        g.x(0), GY,
        g.x(0), GY + GH,
        C.muted, 2
      ),
      txt(
        title,
        CX, GY + GH + 0.44,
        21, C.ink
      ),
      txt(
        'density',
        g.x(0) + 0.35,
        GY + GH - 0.10,
        15, C.muted
      )
    ];

    ticks.filter(t => t <= g.maxT).forEach(t => {
      objects.push(
        line(
          g.x(t), GY - 0.07,
          g.x(t), GY + 0.07,
          C.muted
        ),
        txt(
          String(t),
          g.x(t), GY - 0.29,
          16, C.muted, true
        )
      );
    });

    objects.push(
      txt(
        'weeks',
        g.x(g.maxT) - 0.12,
        GY - 0.64,
        16, C.muted
      )
    );

    return new M.VGroup(...objects);
  }

  function densityCurve(
    pdf,
    g = G,
    color = C.cyan,
    a = 0,
    b = g.maxT,
    n = 140,
    sw = 4
  ) {
    const segments = [];

    for (let i = 0; i < n; i++) {
      const t1 = a + (b - a) * i / n;
      const t2 = a + (b - a) * (i + 1) / n;

      segments.push(
        line(
          g.x(t1), g.y(pdf(t1)),
          g.x(t2), g.y(pdf(t2)),
          color, sw
        )
      );
    }

    return new M.VGroup(...segments);
  }

  function gammaCurve(
    shape = SHAPE,
    scale = SCALE,
    g = G,
    color = C.cyan
  ) {
    return densityCurve(
      t => gammaPDF(t, shape, scale),
      g,
      color
    );
  }

  function shadedArea(
    a,
    b,
    pdf = t => gammaPDF(t),
    g = G,
    color = C.amber,
    opacity = 0.38
  ) {
    a = Math.max(0, a);
    b = Math.min(b, g.maxT);

    const strips = [];

    const n = Math.max(
      8,
      Math.ceil((b - a) / g.maxT * 180)
    );

    const step = (b - a) / n;

    for (let i = 0; i < n; i++) {
      const left = a + i * step;
      const right = left + step;
      const mid = (left + right) / 2;

      const h = g.y(pdf(mid)) - GY;

      if (h <= 0.001) continue;

      strips.push(
        rect(
          (g.x(left) + g.x(right)) / 2,
          GY + h / 2,
          g.x(right) - g.x(left) + 0.001,
          h,
          color,
          opacity,
          0
        )
      );
    }

    return new M.VGroup(...strips);
  }

  function curveGuide(
    t,
    label,
    color = C.amber,
    pdf = x => gammaPDF(x),
    g = G,
    dx = 0,
    dy = 0.25
  ) {
    const x = g.x(t);
    const y = g.y(pdf(t));

    const objects = [
      dashed(x, GY, x, y, color),
      glow(x, y, 0.075, color)
    ];

    if (label) {
      objects.push(
        txt(
          label,
          x + dx,
          y + dy,
          17, color
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // 13–17: discover the gamma shape
  // ------------------------------------------------------------

  // 13 — histogram rises, peaks around twenty, falls slowly

  await until(S(13));

  const axes13 = graphAxes();

  const rise13 = densityCurve(
    t => gammaPDF(t),
    G, C.cyan,
    0, 20, 35
  );

  const fall13 = densityCurve(
    t => gammaPDF(t),
    G, C.cyan,
    20, 100, 105
  );

  const peak13 = curveGuide(
    20,
    'Peak ≈ 20',
    C.amber,
    t => gammaPDF(t),
    G,
    0.35,
    0.24
  );

  await play(
    ...replacePicture(
      axes13,
      rise13,
      fall13
    ),
    ...replaceOverlay(peak13),
    ...say('RISES, PEAKS, THEN FALLS'),
    ...fbox([
      'Hardly any near 0',
      ['Peak ≈ 20 weeks', C.amber],
      'Slow fall to the right'
    ])
  );

  // 14 — the long right tail; six in one hundred beyond sixty

  await until(S(14));

  const tail14 = shadedArea(
    60, 100,
    t => gammaPDF(t),
    G,
    C.violet,
    0.52
  );

  const tailLabel14 = new M.VGroup(
    dashed(
      X(60), GY,
      X(60), Y(gammaPDF(60)),
      C.violet
    ),
    txt(
      '60 weeks',
      X(60), GY + GH * 0.46,
      17, C.violet
    ),
    arrow(
      X(63), GY + GH * 0.37,
      X(71), Y(gammaPDF(71)) + 0.06,
      C.violet, 2
    ),
    tag(
      'ABOUT 6%',
      X(76), GY + GH * 0.63,
      C.violet, 17
    )
  );

  await play(
    ...replacePicture(
      graphAxes(),
      tail14,
      gammaCurve()
    ),
    ...replaceOverlay(tailLabel14),
    ...say('A LONG RIGHT TAIL', C.violet),
    ...fbox([
      'P(more than 60 weeks)',
      `= ${Q60.toFixed(3)}`,
      ['About 6 in 100 boxes', C.violet]
    ], C.violet)
  );

  // 15 — name the law

  await until(S(15));

  await play(
    ...replacePicture(
      graphAxes(),
      gammaCurve()
    ),
    ...say('THE GAMMA LAW', C.green),
    ...fbox([
      'Add exponential gaps',
      ['Result: gamma law', C.green]
    ], C.green)
  );

  // 16 — shape is the number of gaps

  function shapePicture() {
    const y = P ? -1.65 : -0.55;

    const objects = [
      txt(
        'How many gaps?',
        CX, y + 1.43,
        23, C.ink
      )
    ];

    for (let i = 0; i < 3; i++) {
      const x = CX + (i - 1) * 1.75;

      objects.push(
        headIcon(x, y, GAP_COLORS[i]),
        txt(
          String(i + 1),
          x, y - 0.88,
          21, GAP_COLORS[i], true
        )
      );
    }

    objects.push(
      bracket(
        CX - 2.25,
        CX + 2.25,
        y - 1.30,
        '3 independent gaps',
        C.amber
      )
    );

    return new M.VGroup(...objects);
  }

  await until(S(16));

  await play(
    ...replacePicture(pfit(shapePicture(), 1.25, -2.6)),
    ...say('SHAPE = HOW MANY GAPS', C.amber),
    ...fbox([
      'Shape',
      'Number of gaps added',
      ['Shape = 3', C.amber]
    ], C.amber)
  );

  // 17 — scale is the mean of one gap

  function scalePicture() {
    const y = P ? -1.65 : -0.50;

    const objects = [
      txt(
        'Average length of each gap',
        CX, y + 1.45,
        21, C.ink
      )
    ];

    for (let i = 0; i < 3; i++) {
      const x = CX + (i - 1) * 1.82;
      const color = GAP_COLORS[i];

      objects.push(
        headIcon(x, y + 0.15, color),
        line(
          x - 0.67, y - 0.67,
          x + 0.67, y - 0.67,
          color, 5
        ),
        txt(
          '10 weeks',
          x, y - 1.04,
          16, color, true
        )
      );
    }

    objects.push(
      txt(
        'Average, not a fixed lifetime',
        CX, y - 1.55,
        17, C.muted
      )
    );

    return new M.VGroup(...objects);
  }

  await until(S(17));

  await play(
    ...replacePicture(pfit(scalePicture(), 1.2, -2.6)),
    ...say('SCALE = MEAN OF ONE GAP'),
    ...fbox([
      ['Shape = 3', C.amber],
      ['Scale = 10 weeks', C.cyan],
      'Gamma(3, 10)'
    ])
  );

  // ------------------------------------------------------------
  // 18–23: mean, spread, peak and skew
  // ------------------------------------------------------------

  // 18 — compute the manager's answers

  await until(S(18));

  await play(
    ...replacePicture(
      graphAxes(),
      gammaCurve()
    ),
    ...say('ANSWER THE MANAGER', C.green),
    ...fbox([
      '1. Average box lifetime',
      '2. Spread of lifetimes',
      ['3. Chance within 30 weeks', C.amber]
    ], C.green)
  );

  // 19 — mean = three times ten weeks

  function meanBlocks() {
    const y = P ? -1.55 : -0.50;
    const width = 1.67;

    const objects = [
      txt(
        'Add the average lifetimes',
        CX, y + 1.38,
        22, C.ink
      )
    ];

    for (let i = 0; i < 3; i++) {
      const x = CX + (i - 1) * 1.84;

      objects.push(
        rounded(
          x, y,
          width, 0.90,
          GAP_COLORS[i], 0.30
        ),
        txt(
          '10',
          x, y + 0.08,
          28, GAP_COLORS[i], true
        ),
        txt(
          'weeks',
          x, y - 0.24,
          15, GAP_COLORS[i]
        ),
        txt(
          `Head ${i + 1}`,
          x, y + 0.75,
          17, GAP_COLORS[i]
        )
      );
    }

    objects.push(
      bracket(
        CX - 2.68,
        CX + 2.68,
        y - 0.80,
        'Mean total = 30 weeks',
        C.amber
      ),
      txt(
        'These are averages',
        CX, y - 1.51,
        17, C.muted
      )
    );

    return new M.VGroup(...objects);
  }

  await until(S(19));

  await play(
    ...replacePicture(pfit(meanBlocks(), 1.2, -2.6)),
    ...say('AVERAGE BOX LIFE = 30 WEEKS', C.amber),
    ...fbox([
      'Mean = shape × scale',
      '     = 3 × 10',
      ['     = 30 weeks', C.amber]
    ], C.amber)
  );

  // 20 — averages add up

  await until(S(20));

  await play(
    ...say('AVERAGES ADD UP', C.green),
    ...fbox([
      'Mean of the sum',
      '= sum of the means',
      '10 + 10 + 10',
      ['= 30 weeks', C.green]
    ], C.green)
  );

  // 21 — standard deviation approximately seventeen weeks

  await until(S(21));

  const spread21 = new M.VGroup(
    curveGuide(
      MEAN,
      'Mean = 30',
      C.amber,
      t => gammaPDF(t),
      G,
      0.58,
      0.30
    ),
    dashed(
      X(MEAN - SD), GY,
      X(MEAN - SD), GY + GH * 0.40,
      C.violet
    ),
    dashed(
      X(MEAN + SD), GY,
      X(MEAN + SD), GY + GH * 0.40,
      C.violet
    ),
    bracket(
      X(MEAN - SD),
      X(MEAN),
      GY + GH * 0.25,
      '17.3',
      C.violet
    ),
    bracket(
      X(MEAN),
      X(MEAN + SD),
      GY + GH * 0.25,
      '17.3',
      C.violet
    ),
    txt(
      'One SD on each side',
      X(65),
      GY + GH * 0.72,
      16, C.violet
    )
  );

  await play(
    ...replacePicture(
      graphAxes(),
      gammaCurve()
    ),
    ...replaceOverlay(spread21),
    ...say('BOX LIFETIMES VARY A LOT', C.violet),
    ...fbox([
      'Standard deviation',
      '= √3 × 10',
      ['≈ 17.3 weeks', C.violet]
    ], C.violet)
  );

  // 22 — peak is twenty, mean is thirty

  await until(S(22));

  const peakMean22 = new M.VGroup(
    curveGuide(
      MODE,
      null,
      C.cyan
    ),
    curveGuide(
      MEAN,
      null,
      C.amber
    ),
    txt(
      'Peak: 20',
      X(20) - 0.30,
      Y(gammaPDF(20)) + 0.25,
      17, C.cyan
    ),
    txt(
      'Mean: 30',
      X(30) + 0.78,
      Y(gammaPDF(30)) - 0.12,
      17, C.amber
    ),
    arrow(
      X(20), GY + GH * 0.21,
      X(30), GY + GH * 0.21,
      C.amber, 2
    )
  );

  await play(
    ...replaceOverlay(peakMean22),
    ...say('PEAK 20 — MEAN 30', C.amber),
    ...fbox([
      ['Peak = 20 weeks', C.cyan],
      'Most likely region',
      ['Mean = 30 weeks', C.amber]
    ], C.amber)
  );

  // 23 — long tail pulls the mean to the right

  await until(S(23));

  const tail23 = new M.VGroup(
    densityCurve(
      t => gammaPDF(t),
      G,
      C.violet,
      40, 100, 90, 5
    ),
    txt(
      'Long right tail',
      X(72),
      GY + GH * 0.62,
      18, C.violet
    ),
    arrow(
      X(70), GY + GH * 0.53,
      X(68), Y(gammaPDF(68)) + 0.07,
      C.violet, 2
    ),
    curveGuide(20, null, C.cyan),
    curveGuide(30, null, C.amber),
    txt(
      '20',
      X(20) - 0.24,
      Y(gammaPDF(20)) + 0.22,
      17, C.cyan, true
    ),
    txt(
      '30',
      X(30) + 0.37,
      Y(gammaPDF(30)) - 0.12,
      17, C.amber, true
    )
  );

  await play(
    ...replaceOverlay(tail23),
    ...say('THE TAIL PULLS THE MEAN RIGHT', C.violet),
    ...fbox([
      'A few very long lives',
      'pull the average up',
      ['Mean > peak', C.violet]
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 24–25: probability of using the box within thirty weeks
  // ------------------------------------------------------------

  // 24 — shade the area left of thirty

  await until(S(24));

  const area24 = shadedArea(
    0, 30,
    t => gammaPDF(t),
    G,
    C.amber,
    0.46
  );

  const limit24 = new M.VGroup(
    dashed(
      X(30), GY,
      X(30), Y(gammaPDF(30)),
      C.amber
    ),
    glow(
      X(30),
      Y(gammaPDF(30)),
      0.085,
      C.amber
    ),
    txt(
      '30 weeks',
      X(30) + 0.65,
      Y(gammaPDF(30)) + 0.21,
      18, C.amber
    )
  );

  await play(
    ...replacePicture(
      graphAxes(),
      area24,
      gammaCurve()
    ),
    ...replaceOverlay(limit24),
    ...say('SHADE THE AREA LEFT OF 30', C.amber),
    ...fbox([
      'P(box used up within',
      '30 weeks)',
      ['= area left of 30', C.amber]
    ], C.amber)
  );

  // 25 — probability 0.577, about fifty-eight percent

  await until(S(25));

  const answer25 = tag(
    '58%',
    X(18),
    GY + GH * 0.37,
    C.amber,
    25
  );

  const right25 = new M.VGroup(
    txt(
      '42% after 30 weeks',
      X(70),
      GY + GH * 0.47,
      17, C.muted
    ),
    arrow(
      X(70),
      GY + GH * 0.37,
      X(52),
      Y(gammaPDF(52)) + 0.10,
      C.muted, 2
    )
  );

  await play(
    ...replaceOverlay(
      new M.VGroup(
        dashed(
          X(30), GY,
          X(30), Y(gammaPDF(30)),
          C.amber
        ),
        answer25,
        right25
      )
    ),
    ...say('WITHIN 30 WEEKS: 58%', C.amber),
    ...fbox([
      'P(T ≤ 30)',
      `= ${P30.toFixed(3)}`,
      ['≈ 58 percent', C.amber],
      'P(T > 30) ≈ 42%'
    ], C.amber)
  );

  // ------------------------------------------------------------
  // 26–29: check the result with Poisson counts
  // ------------------------------------------------------------

  const PX = CX - 2.8;
  const PW = 5.6;
  const PY = P ? -1.70 : -0.50;

  const px = t => PX + t / 40 * PW;

  function poissonTimeline(count = 3) {
    const failures = count === 3
      ? [8, 17, 26]
      : [8, 21];

    const objects = [
      txt(
        'Count failures by week 30',
        CX, PY + 1.46,
        21, C.ink
      ),
      rect(
        (px(0) + px(30)) / 2,
        PY,
        px(30) - px(0),
        0.58,
        C.cyan, 0.08, 0
      ),
      line(px(0), PY, px(40), PY, C.muted, 3)
    ];

    for (const t of [0, 10, 20, 30, 40]) {
      objects.push(
        line(
          px(t), PY - 0.08,
          px(t), PY + 0.08,
          C.muted
        ),
        txt(
          String(t),
          px(t), PY - 0.35,
          17, C.muted, true
        )
      );
    }

    failures.forEach((t, i) => {
      objects.push(
        glow(px(t), PY, 0.105, C.amber),
        cross(px(t), PY, 0.11, C.amber),
        txt(
          `Failure ${i + 1}`,
          px(t), PY + 0.42,
          16, C.amber
        )
      );
    });

    objects.push(
      dashed(
        px(30), PY + 0.1,
        px(30), PY + 0.90,
        C.violet
      ),
      txt(
        'Deadline',
        px(30), PY + 1.03,
        16, C.violet
      ),
      tag(
        count === 3
          ? 'BOX USED UP'
          : 'BOX NOT YET USED UP',
        CX, PY - 1.14,
        count === 3 ? C.amber : C.green,
        18
      )
    );

    return new M.VGroup(...objects);
  }

  // 26 — check using counts instead of times

  await until(S(26));

  await play(
    ...replacePicture(pfit(poissonTimeline(3), 1.2, -2.6)),
    ...say('CHECK IT WITH COUNTS', C.violet),
    ...fbox([
      'Waiting times',
      '↔ event counts',
      ['Gamma ↔ Poisson', C.violet]
    ], C.violet)
  );

  // 27 — at least three failures within thirty weeks

  await until(S(27));

  await play(
    ...replacePicture(pfit(poissonTimeline(2), 1.2, -2.6)),
    ...say('TWO FAILURES: NOT ENOUGH', C.green),
    ...fbox([
      '2 failures by week 30',
      ['One head still working', C.green]
    ], C.green)
  );

  await until(S(27) + 2.4);

  await play(
    ...replacePicture(pfit(poissonTimeline(3), 1.2, -2.6)),
    ...say('AT LEAST 3 FAILURES: USED UP', C.amber),
    ...fbox([
      'Third failure by week 30',
      ['Box used up', C.amber],
      'T ≤ 30 ↔ count ≥ 3'
    ], C.amber)
  );

  // 28 — Poisson mean count of three

  await until(S(28));

  await play(
    ...say('30 WEEKS: 3 FAILURES ON AVERAGE'),
    ...fbox([
      'Rate = 1 per 10 weeks',
      '30 ÷ 10 = 3',
      ['Poisson mean = 3', C.cyan]
    ])
  );

  function poissonBars() {
    const y0 = P ? -3.80 : -2.08;
    const h = P ? 4.2 : 2.8;
    const dx = P ? 1.24 : 1.34;

    const p0 = Math.exp(-3);
    const p1 = Math.exp(-3) * 3;
    const p2 = Math.exp(-3) * 4.5;
    const p3plus = 1 - p0 - p1 - p2;

    const values = [p0, p1, p2, p3plus];
    const names = ['0', '1', '2', '3+'];

    const objects = [
      txt(
        'Poisson counts in 30 weeks',
        CX, y0 + h + 0.66,
        21, C.ink
      ),
      line(
        CX - 2.75, y0,
        CX + 2.75, y0,
        C.muted, 2
      )
    ];

    const by = p => y0 + p / 0.65 * h;

    values.forEach((p, i) => {
      const x = CX + (i - 1.5) * dx;
      const color = i < 3 ? C.violet : C.amber;
      const bh = by(p) - y0;

      objects.push(
        rect(
          x, y0 + bh / 2,
          dx * 0.75,
          bh,
          color,
          0.62
        ),
        txt(
          `${(100 * p).toFixed(1)}%`,
          x, y0 + bh + 0.25,
          16, color, true
        ),
        txt(
          names[i],
          x, y0 - 0.31,
          19, color, true
        )
      );
    });

    objects.push(
      txt(
        'Failures',
        CX, y0 - 0.67,
        17, C.muted
      ),
      tag(
        '0, 1 OR 2 = 42%',
        CX - dx * 0.50,
        y0 + h * 0.77,
        C.violet,
        16
      )
    );

    return new M.VGroup(...objects);
  }

  // 29 — complement: 42 percent versus 58 percent

  await until(S(29));

  await play(
    ...replacePicture(poissonBars()),
    ...say('42% NOT USED UP', C.violet),
    ...fbox([
      'P(count ≤ 2)',
      '= e^(−3)(1 + 3 + 4.5)',
      `= ${Q30.toFixed(3)}`,
      ['≈ 42 percent', C.violet]
    ], C.violet)
  );

  await until(S(29) + 4.0);

  await play(
    ...say('100% − 42% = 58%', C.amber),
    ...fbox([
      'P(count ≥ 3)',
      `= 1 − ${Q30.toFixed(3)}`,
      `= ${P30.toFixed(3)}`,
      ['58% — it matches!', C.amber]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // 30–35: the short mathematical version
  // ------------------------------------------------------------

  function formulaTimeline(
    gaps = GAPS,
    symbol = 'Total lifetime'
  ) {
    const y = P ? -2.7 : -0.48;
    const left = CX - (P ? 3.2 : 2.75);
    const right = CX + (P ? 3.2 : 2.75);

    const total = gaps.reduce((a, b) => a + b, 0);

    const x = t =>
      left + (right - left) * t / total;

    const objects = [
      txt(
        'Add independent waiting times',
        CX, y + 1.25,
        20, C.ink
      ),
      line(left, y, right, y, C.muted, 2)
    ];

    let start = 0;

    gaps.forEach((gap, i) => {
      const end = start + gap;
      const color = GAP_COLORS[i % GAP_COLORS.length];

      objects.push(
        line(
          x(start), y,
          x(end), y,
          color, 8
        ),
        glow(x(start), y, 0.085, color),
        txt(
          `Gap ${i + 1}`,
          (x(start) + x(end)) / 2,
          y + 0.38,
          17, color
        )
      );

      start = end;
    });

    objects.push(
      cross(right, y, 0.13, C.amber),
      bracket(
        left, right,
        y - 0.51,
        symbol,
        C.amber
      )
    );

    return new M.VGroup(...objects);
  }

  // 30 — the short version

  await until(S(30));

  await play(
    ...replacePicture(formulaTimeline()),
    ...say('THE SHORT VERSION'),
    ...fbox([
      'Total waiting time',
      'Sum of the gaps'
    ])
  );

  // 31 — define T

  await until(S(31));

  await play(
    ...replacePicture(
      formulaTimeline(GAPS, 'T = whole box lifetime')
    ),
    ...say('T = LIFE OF THE WHOLE BOX', C.amber),
    ...fbox([
      ['T = total lifetime', C.amber],
      'Measured in weeks'
    ], C.amber)
  );

  // 32 — sum of exponential gaps, gamma shape 3 scale 10

  await until(S(32));

  await play(
    ...say('T = GAP 1 + GAP 2 + GAP 3'),
    ...fbox([
      'T = gap1 + gap2 + gap3',
      ['T follows Gamma(3, 10)', C.cyan],
      ['Shape = 3', C.amber],
      ['Scale = 10 weeks', C.green]
    ])
  );

  // 33 — waiting for the third event

  await until(S(33));

  await play(
    ...say('WAITING FOR THE THIRD EVENT', C.green),
    ...fbox([
      'Wait for event 1',
      '+ wait for event 2',
      '+ wait for event 3',
      ['Total time to event 3', C.green]
    ], C.green)
  );

  // 34 — shape one is the exponential law itself

  await until(S(34));

  const G1 = graphMap(80, 0.112);

  const gammaOne = gammaCurve(
    1,
    SCALE,
    G1,
    C.cyan
  );

  const label34 = tag(
    'SHAPE = 1',
    G1.x(49),
    GY + GH * 0.65,
    C.cyan,
    18
  );

  await play(
    ...replacePicture(
      graphAxes(
        G1,
        'One exponential waiting gap',
        [0, 20, 40, 60, 80]
      ),
      gammaOne,
      label34
    ),
    ...say('GAMMA WITH SHAPE 1 = EXPONENTIAL'),
    ...fbox([
      'Shape = 1',
      'Scale = 10 weeks',
      ['Just one exponential gap', C.cyan]
    ])
  );

  // 35 — more gaps: farther right and less skewed

  await until(S(35));

  const G35 = graphMap(140, 0.032);

  const curve3 = gammaCurve(
    3, 10,
    G35,
    C.cyan
  );

  const curve6 = gammaCurve(
    6, 10,
    G35,
    C.violet
  );

  const shapes35 = new M.VGroup(
    txt(
      '3 gaps',
      G35.x(22) + 0.10,
      G35.y(gammaPDF(20, 3, 10)) + 0.25,
      18, C.cyan
    ),
    txt(
      '6 gaps',
      G35.x(57),
      G35.y(gammaPDF(50, 6, 10)) + 0.25,
      18, C.violet
    ),
    arrow(
      G35.x(25), GY + GH * 0.16,
      G35.x(55), GY + GH * 0.16,
      C.amber, 2
    )
  );

  await play(
    ...replacePicture(
      graphAxes(
        G35,
        'More independent gaps',
        [0, 20, 40, 60, 80, 100, 120, 140]
      ),
      curve3,
      curve6,
      shapes35
    ),
    ...say('MORE GAPS: MORE BALANCED', C.violet),
    ...fbox([
      ['Shape 3: mean 30 weeks', C.cyan],
      ['Shape 6: mean 60 weeks', C.violet],
      'Same scale: 10 weeks',
      'Less right-skewed'
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 36–37: applications
  // ------------------------------------------------------------

  function eventWaitPicture() {
    const y = P ? -1.55 : -0.50;

    const left = CX - 2.65;
    const right = CX + 2.65;

    const xs = [
      left,
      left + 1.06,
      left + 3.03,
      left + 4.55
    ];

    const objects = [
      txt(
        'Time until several events',
        CX, y + 1.26,
        22, C.ink
      ),
      line(left, y, right, y, C.muted, 3)
    ];

    for (let i = 0; i < 3; i++) {
      const color = GAP_COLORS[i];

      objects.push(
        line(
          xs[i], y,
          xs[i + 1], y,
          color, 7
        ),
        glow(xs[i + 1], y, 0.10, color),
        txt(
          `Event ${i + 1}`,
          xs[i + 1], y + 0.39,
          16, color
        )
      );
    }

    objects.push(
      bracket(
        xs[0],
        xs[3],
        y - 0.55,
        'Wait until event 3',
        C.amber
      )
    );

    return new M.VGroup(...objects);
  }

  // 36 — time until several events

  await until(S(36));

  await play(
    ...replacePicture(pfit(eventWaitPicture(), 1.2, -2.6)),
    ...say('TIME UNTIL SEVERAL EVENTS'),
    ...fbox([
      'Use gamma for',
      'total waiting times',
      ['Several events, steady rate', C.cyan]
    ])
  );

  function applicationRows() {
    const top = P ? 0.45 : 0.71;
    const dy = P ? 1.63 : 1.14;

    const names = [
      'SPARE-PART STOCK',
      'CUSTOMERS SERVED',
      'URGENT TICKETS'
    ];

    const colors = [
      C.cyan,
      C.green,
      C.violet
    ];

    const eventPositions = [
      [0.21, 0.49, 0.83],
      [0.15, 0.62, 0.86],
      [0.31, 0.46, 0.89]
    ];

    const left = CX - 2.55;
    const right = CX + 2.55;

    const objects = [];

    for (let i = 0; i < 3; i++) {
      const y = top - i * dy;
      const color = colors[i];

      objects.push(
        txt(
          names[i],
          CX, y + 0.42,
          18, color
        ),
        line(left, y, right, y, C.muted, 2)
      );

      const xs = eventPositions[i].map(
        t => left + t * (right - left)
      );

      let start = left;

      xs.forEach((x, j) => {
        objects.push(
          line(start, y, x, y, color, 4),
          glow(x, y, 0.085, color),
          txt(
            String(j + 1),
            x, y - 0.25,
            15, color, true
          )
        );

        start = x;
      });
    }

    return new M.VGroup(...objects);
  }

  // 37 — practical examples

  await until(S(37));

  await play(
    ...replacePicture(pfit(applicationRows(), 1.15, -2.6)),
    ...say('SEVERAL EVENTS — ONE TOTAL'),
    ...fbox([
      'Examples',
      'Spare-part stocks',
      'Several customers',
      ['Wait for the third ticket', C.violet]
    ])
  );

  // ------------------------------------------------------------
  // 38–41: common trap — three independent gaps versus
  // three copies of the same random gap
  // ------------------------------------------------------------

  function comparisonRows(
    independent = [8, 14, 9],
    repeated = [8, 8, 8],
    showTotals = false
  ) {
    const top = P ? 0.15 : 0.15;
    const bottom = P ? -2.65 : -1.65;

    const left = CX - 2.7;
    const right = CX + 2.7;

    const maxT = Math.max(
      40,
      independent.reduce((a, b) => a + b, 0),
      repeated.reduce((a, b) => a + b, 0)
    );

    const x = t =>
      left + t / maxT * (right - left);

    function row(gaps, y, title, repeat) {
      const objects = [
        fitText(
          title,
          CX, y + 0.77,
          20,
          repeat ? C.amber : C.green,
          5.8
        ),
        line(left, y, right, y, C.muted, 2)
      ];

      let start = 0;

      gaps.forEach((g, i) => {
        const end = start + g;

        const color = repeat
          ? C.amber
          : GAP_COLORS[i];

        const mid = (x(start) + x(end)) / 2;

        objects.push(
          line(
            x(start), y,
            x(end), y,
            color, 8
          ),
          glow(x(start), y, 0.07, color),
          txt(
            String(g),
            mid, y + 0.32,
            17, color, true
          )
        );

        start = end;
      });

      objects.push(
        cross(
          x(start), y, 0.12,
          repeat ? C.amber : C.green
        )
      );

      if (showTotals) {
        objects.push(
          txt(
            `Total = ${start} weeks`,
            CX, y - 0.39,
            18,
            repeat ? C.amber : C.green
          )
        );
      }

      return new M.VGroup(...objects);
    }

    return new M.VGroup(
      row(
        independent,
        top,
        'ADD THREE INDEPENDENT GAPS',
        false
      ),
      row(
        repeated,
        bottom,
        'REPEAT ONE RANDOM GAP 3 TIMES',
        true
      )
    );
  }

  // 38 — do not multiply one gap by three

  await until(S(38));

  await play(
    ...replacePicture(pfit(comparisonRows(), 1.15, -2.6)),
    ...say('TRAP: DO NOT TRIPLE ONE GAP', C.amber),
    ...fbox([
      ['Correct: gap1 + gap2 + gap3', C.green],
      ['Wrong: 3 × one random gap', C.amber],
      'Different distributions'
    ], C.amber)
  );

  // 39 — same mean, different spread

  const G39 = graphMap(120, 0.037);

  const repeatedPDF = t =>
    t < 0 ? 0 : Math.exp(-t / 30) / 30;

  function trapCurves() {
    const correct = gammaCurve(
      3, 10,
      G39,
      C.cyan
    );

    const repeated = densityCurve(
      repeatedPDF,
      G39,
      C.amber
    );

    const meanLine = dashed(
      G39.x(30), GY,
      G39.x(30), GY + GH * 0.86,
      C.green
    );

    const objects = [
      graphAxes(
        G39,
        'Same mean, different spread',
        [0, 20, 40, 60, 80, 100, 120]
      ),
      correct,
      repeated,
      meanLine,
      txt(
        'Mean = 30',
        G39.x(30) + 0.67,
        GY + GH * 0.93,
        17, C.green
      ),
      (() => {
        const t = txt('3 separate gaps', 0, 0, 16, C.cyan);
        t.moveTo(pt(G39.x(30) + 0.18 + t.getWidth() / 2, G39.y(gammaPDF(22)) + 0.16));
        return t;
      })(),
      txt(
        '3 × one gap',
        G39.x(79),
        GY + GH * 0.53,
        17, C.amber
      ),
      arrow(
        G39.x(79),
        GY + GH * 0.43,
        G39.x(90),
        G39.y(repeatedPDF(90)) + 0.06,
        C.amber, 2
      )
    ];

    return new M.VGroup(...objects);
  }

  await until(S(39));

  await play(
    ...replacePicture(trapCurves()),
    ...say('SAME MEAN — DIFFERENT SPREAD', C.amber),
    ...fbox([
      'Both mean lifetimes',
      ['= 30 weeks', C.green],
      'But tripling one gap',
      ['creates much more spread', C.amber]
    ], C.amber)
  );

  // 40 — standard deviations: seventeen versus thirty

  function sdComparison() {
    const y1 = P ? 0.12 : 0.32;
    const y2 = P ? -2.30 : -1.35;

    const wmax = 5.35;

    const values = [SD, 30];
    const colors = [C.cyan, C.amber];
    const ys = [y1, y2];

    const names = [
      '3 independent gaps',
      '3 × one random gap'
    ];

    const objects = [];

    for (let i = 0; i < 2; i++) {
      const y = ys[i];
      const w = wmax * values[i] / 30;
      const left = CX - wmax / 2;

      objects.push(
        txt(
          names[i],
          CX, y + 0.66,
          20, colors[i]
        ),
        rounded(
          CX, y,
          wmax, 0.47,
          C.muted, 0.06
        ),
        rect(
          left + w / 2,
          y,
          w, 0.40,
          colors[i], 0.72
        ),
        txt(
          i === 0
            ? 'SD ≈ 17.3 weeks'
            : 'SD = 30 weeks',
          CX, y - 0.50,
          20, colors[i], true
        )
      );
    }

    return new M.VGroup(...objects);
  }

  await until(S(40));

  await play(
    ...replacePicture(pfit(sdComparison(), 1.15, -2.6)),
    ...say('17 WEEKS, NOT 30', C.amber),
    ...fbox([
      ['Independent: √3 × 10', C.cyan],
      ['SD ≈ 17.3 weeks', C.cyan],
      ['Repeated: 3 × 10', C.amber],
      ['SD = 30 weeks', C.amber]
    ], C.amber)
  );

  // 41 — short and long independent gaps can partly cancel

  await until(S(41));

  await play(
    ...replacePicture(
      comparisonRows(
        [3, 10, 17],
        [3, 3, 3],
        true
      )
    ),
    ...say('SHORT AND LONG CAN BALANCE', C.green),
    ...fbox([
      'Illustrative example',
      ['3 + 10 + 17 = 30', C.green],
      ['3 × 3 = 9', C.amber],
      'Independent gaps can balance'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 42: preview beta proportions
  // ------------------------------------------------------------

  function proportionPreview() {
    const y = P ? -1.65 : -0.48;
    const left = CX - 2.7;
    const right = CX + 2.7;

    const x = p => left + p * (right - left);

    const objects = [
      txt(
        'A share of faulty seals',
        CX, y + 1.39,
        22, C.ink
      ),
      line(left, y, right, y, C.muted, 3)
    ];

    for (let i = 0; i <= 5; i++) {
      const p = i / 5;

      objects.push(
        line(
          x(p), y - 0.08,
          x(p), y + 0.08,
          C.muted
        ),
        txt(
          p === 0 || p === 1
            ? String(p)
            : p.toFixed(1),
          x(p), y - 0.32,
          17, C.muted, true
        )
      );
    }

    const sample = [
      0.07, 0.11, 0.13, 0.16, 0.18,
      0.20, 0.22, 0.25, 0.31, 0.43
    ];

    sample.forEach((p, i) => {
      objects.push(
        glow(
          x(p),
          y + 0.24 + (i % 3) * 0.23,
          0.065,
          C.cyan
        )
      );
    });

    objects.push(
      txt(
        'Nothing below 0 or above 1',
        CX, y - 0.99,
        18, C.green
      )
    );

    return new M.VGroup(...objects);
  }

  await until(S(42));

  await play(
    ...replacePicture(pfit(proportionPreview(), 1.2, -2.6)),
    ...say('NEXT: SHARES BETWEEN 0 AND 1', C.violet),
    ...fbox([
      'From waiting times',
      'to shares and proportions',
      ['Next: the beta law', C.violet]
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 43: final one-sentence recap
  // ------------------------------------------------------------

  await until(S(43));

  const finalAxes = graphAxes(
    G,
    'Gamma waiting times'
  );

  const finalCurve = gammaCurve();

  const finalArea = shadedArea(
    0, 30,
    t => gammaPDF(t),
    G,
    C.amber,
    0.24
  );

  const finalPeak = new M.VGroup(
    curveGuide(
      20, null,
      C.cyan
    ),
    txt(
      'Peak = 20',
      X(20) - 0.30,
      Y(gammaPDF(20)) + 0.22,
      17, C.cyan
    )
  );

  const finalMean = new M.VGroup(
    curveGuide(
      30, null,
      C.amber
    ),
    txt(
      'Mean = 30',
      X(30) + 0.78,
      Y(gammaPDF(30)) - 0.10,
      17, C.amber
    )
  );

  const finalShape = tag(
    '3 GAPS',
    X(77),
    GY + GH * 0.83,
    C.violet,
    17
  );

  const finalScale = tag(
    '10 WEEKS EACH',
    X(77),
    GY + GH * 0.67,
    C.green,
    16
  );

  const finalChance = tag(
    '58%',
    X(19),
    GY + GH * 0.35,
    C.amber,
    22
  );

  await play(
    ...replacePicture(
      finalAxes,
      finalArea,
      finalCurve,
      finalPeak,
      finalMean,
      finalShape,
      finalScale,
      finalChance
    ),
    ...say('ADD EXPONENTIAL GAPS → GAMMA', C.green),
    ...fbox([
      ['T follows Gamma(3, 10)', C.cyan],
      ['Shape = number of gaps', C.violet],
      ['Scale = mean gap', C.green],
      ['P(T ≤ 30) ≈ 58%', C.amber]
    ], C.green)
  );

  await until(S(43) + 2.3);

  await play(
    new M.Indicate(
      finalShape,
      { color: C.violet }
    ),
    ...say('SHAPE = NUMBER OF GAPS', C.violet)
  );

  await until(S(43) + 4.6);

  await play(
    new M.Indicate(
      finalScale,
      { color: C.green }
    ),
    ...say('SCALE = AVERAGE LENGTH OF ONE GAP', C.green)
  );

  await until(S(43) + 6.0);

  await play(
    ...say('SEVERAL WAITING GAPS: THE GAMMA LAW', C.cyan)
  );
}
