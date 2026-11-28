// lesson 16.2.1
// Batch and stream processing: two ways to work with incoming data.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Browser playback and narration seeking have not been runtime-tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data — fixed.
  //
  // Sale time and arrival time are deliberately separate.
  // Both shops use the same local clock.
  // Each ticket has a unique, persistent ID.
  // ------------------------------------------------------------

  const TICKETS = {
    A: {
      id: 'A',
      shop: 'North',
      day: 'Monday',
      time: '9 a.m.',
      amount: 4,
      arrivalDay: 'Monday',
      arrivalTime: '9 a.m.'
    },

    B: {
      id: 'B',
      shop: 'North',
      day: 'Monday',
      time: '11 a.m.',
      amount: 8,
      arrivalDay: 'Tuesday',
      arrivalTime: '8 a.m.'
    },

    C: {
      id: 'C',
      shop: 'South',
      day: 'Monday',
      time: '10 a.m.',
      amount: 6,
      arrivalDay: 'Monday',
      arrivalTime: '10 a.m.'
    },

    D: {
      id: 'D',
      shop: 'South',
      day: 'Monday',
      time: 'Noon',
      amount: 10,
      arrivalDay: 'Monday',
      arrivalTime: 'Noon'
    },

    E: {
      id: 'E',
      shop: 'South',
      day: 'Monday',
      time: '2 p.m.',
      amount: 14,
      arrivalDay: 'Monday',
      arrivalTime: '2 p.m.'
    },

    F: {
      id: 'F',
      shop: 'North',
      day: 'Tuesday',
      time: '10 a.m.',
      amount: 8,
      arrivalDay: 'Tuesday',
      arrivalTime: '10 a.m.'
    },

    G: {
      id: 'G',
      shop: 'South',
      day: 'Tuesday',
      time: '11 a.m.',
      amount: 12,
      arrivalDay: 'Tuesday',
      arrivalTime: '11 a.m.'
    }
  };

  const BATCH_IDS = ['A', 'C', 'D', 'E'];

  const STREAM_IDS = [
    'A', 'C', 'D', 'E', 'B', 'F', 'G'
  ];

  const amount = id => TICKETS[id].amount;

  const sum = ids =>
    ids.reduce((total, id) => total + amount(id), 0);

  const BATCH_TOTAL = sum(BATCH_IDS);

  // Checked facts:
  //
  // Monday arrivals:
  //   A — North, 9 a.m., $4.
  //   C — South, 10 a.m., $6.
  //   D — South, noon, $10.
  //   E — South, 2 p.m., $14.
  //
  // B is created Monday at 11 a.m.
  // North loses its internet connection.
  // B remains at North until Tuesday at 8 a.m.
  //
  // Tuesday 6 a.m. batch:
  //   A, C, D, E.
  //   4 + 6 + 10 + 14 = $34.
  //
  // Tuesday stream arrivals:
  //   B — 8 a.m., Monday sale, $8.
  //   F — 10 a.m., Tuesday sale, $8.
  //   G — 11 a.m., Tuesday sale, $12.
  //
  // The fixed batch ends after E.
  // The stream has no preset final ticket.
  //
  // The $34 batch is complete as a processing task.
  // It is not a complete account of all Monday sales.
  //
  // The duplicate retry and later revised publication belong
  // to subsequent lessons and are not introduced here.

  const NORTH = C.cyan;
  const SOUTH = C.amber;

  const RED = C.red || '#FF647C';

  const shopColor = shop =>
    shop === 'North' ? NORTH : SOUTH;

  // ------------------------------------------------------------
  // Responsive layout.
  //
  // Phone: 8 x 14.22
  // Content between y = -5.5 and y = 4.3.
  //
  // Laptop: 14.22 x 8
  // Content between y = -3.0 and y = 2.3.
  // ------------------------------------------------------------

  const PILL = P
    ? [0, 3.85, 0]
    : [0, 1.95, 0];

  const BOXP = P
    ? [0, -4.63, 0]
    : [0, -2.48, 0];

  const say = (s, color = C.cyan) =>
    showA(s, color, PILL);

  // ------------------------------------------------------------
  // Drawing helpers.
  // ------------------------------------------------------------

  function txt(
    s, size, color, p,
    mono = false,
    maxw = null
  ) {
    const t = T(String(s), size, color, mono);

    if (maxw !== null && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(p);

    return t;
  }

  function rect(
    w, h, p, color,
    fill = 0,
    stroke = 2,
    radius = 0.12
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: radius,
      color,
      strokeWidth: stroke
    });

    r.setFill(color, fill);
    r.moveTo(p);

    return r;
  }

  function solidRect(w, h, p, color, opacity = 0.85) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: 1
    });

    r.setFill(color, opacity);
    r.moveTo(p);

    return r;
  }

  function line(a, b, color = C.muted, strokeWidth = 2) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth
    });
  }

  function circle(radius, p, color, fill = 0, stroke = 2) {
    const c = new M.Circle({
      radius,
      color,
      strokeWidth: stroke
    });

    c.setFill(color, fill);
    c.moveTo(p);

    return c;
  }

  function arrow(a, b, color = C.cyan, strokeWidth = 2.5) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    const len = Math.hypot(dx, dy);
    const ux = dx / len;
    const uy = dy / len;

    const size = 0.14;

    const left = [
      b[0] - size * ux + size * 0.55 * uy,
      b[1] - size * uy - size * 0.55 * ux,
      0
    ];

    const right = [
      b[0] - size * ux - size * 0.55 * uy,
      b[1] - size * uy + size * 0.55 * ux,
      0
    ];

    return new M.VGroup(
      line(a, b, color, strokeWidth),
      line(left, b, color, strokeWidth),
      line(right, b, color, strokeWidth)
    );
  }

  const ins = objects =>
    objects.filter(Boolean).map(o => new M.FadeIn(o));

  const outs = objects =>
    objects.filter(Boolean).map(o => new M.FadeOut(o));

  function lagIn(objects, runTime = 1.0, lagRatio = 0.12) {
    return new M.LaggedStart(
      objects.map(o => new M.FadeIn(o)),
      { lagRatio, runTime }
    );
  }

  // ------------------------------------------------------------
  // Formula box — approved reference style.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 20;
    const lh = P ? 0.39 : 0.29;
    const padding = P ? 0.30 : 0.20;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) => {
      const s = rows[i][0];
      const indent = s.length - s.trimStart().length;

      return t.getWidth() + cw * indent;
    });

    const wd = Math.max(...widths) + 0.64;
    const ht = rows.length * lh + padding;

    const bg = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.16,
      color,
      strokeWidth: 2
    });

    bg.setFill(C.card, 0.96);
    bg.moveTo(BOXP);

    const left = BOXP[0] - wd / 2 + 0.32;
    const top = BOXP[1] + ht / 2 - padding / 2 - lh / 2;

    texts.forEach((t, i) => {
      const s = rows[i][0];
      const indent = cw * (s.length - s.trimStart().length);

      t.moveTo([
        left + indent + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(bg, ...texts);

    const maxw = P ? FW - 0.70 : FW - 1.60;
    const maxh = P ? 1.55 : 0.96;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
    }

    g.moveTo(BOXP);

    const a = [new M.FadeIn(g)];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return a;
  }

  function dropBox() {
    if (!boxNow) return [];

    const old = boxNow;
    boxNow = null;

    return [new M.FadeOut(old)];
  }

  // ------------------------------------------------------------
  // Glowing ticket slips.
  //
  // Every ticket carries:
  //   Unique ID
  //   Shop
  //   Time and day of sale
  //   Dollar amount
  //
  // Arrival time is shown separately on the receiving clock
  // or in an arrival-day slot.
  //
  // North is cyan; South is amber.
  // Shop names remain visible alongside the colors.
  // ------------------------------------------------------------

  function ticket(id, p, w, h) {
    const d = TICKETS[id];

    const x = p[0];
    const y = p[1];

    const color = shopColor(d.shop);

    const glow = rect(
      w + 0.08,
      h + 0.08,
      p,
      color,
      0.055,
      0.7,
      0.11
    );

    const bg = rect(
      w,
      h,
      p,
      color,
      0,
      1.6,
      0.09
    );

    bg.setFill(C.card, 0.98);

    const badgeW = w * 0.17;
    const badgeH = h * 0.73;

    const badge = rect(
      badgeW,
      badgeH,
      [
        x - w * 0.385,
        y,
        0
      ],
      color,
      0.17,
      1.2,
      0.055
    );

    const idText = txt(
      id,
      23,
      color,
      [
        x - w * 0.385,
        y,
        0
      ],
      true,
      badgeW - 0.06
    );

    const shopText = txt(
      d.shop,
      19,
      color,
      [
        x - w * 0.065,
        y + h * 0.19,
        0
      ],
      false,
      w * 0.43
    );

    const saleTime = txt(
      `${d.day} ${d.time}`,
      15,
      C.ink,
      [
        x - w * 0.065,
        y - h * 0.20,
        0
      ],
      false,
      w * 0.48
    );

    const divider = line(
      [
        x + w * 0.20,
        y - h * 0.33,
        0
      ],
      [
        x + w * 0.20,
        y + h * 0.33,
        0
      ],
      C.muted,
      1
    );

    const money = txt(
      `$${d.amount}`,
      23,
      color,
      [
        x + w * 0.35,
        y,
        0
      ],
      true,
      w * 0.25
    );

    return new M.VGroup(
      glow,
      bg,
      badge,
      idText,
      shopText,
      saleTime,
      divider,
      money
    );
  }

  // ------------------------------------------------------------
  // Bakery storefronts.
  // ------------------------------------------------------------

  function loaf(x, y, scale = 1) {
    const body = rect(
      0.76 * scale,
      0.39 * scale,
      [x, y, 0],
      C.amber,
      0.58,
      1.5,
      0.17 * scale
    );

    const cuts = [-0.18, 0.05, 0.27].map(dx =>
      line(
        [
          x + dx * scale - 0.07 * scale,
          y + 0.10 * scale,
          0
        ],
        [
          x + dx * scale + 0.04 * scale,
          y - 0.04 * scale,
          0
        ],
        C.ink,
        1.5
      )
    );

    return new M.VGroup(body, ...cuts);
  }

  function bakery(shop, x, y, scale = 1) {
    const color = shopColor(shop);

    const p = (dx, dy) => [
      x + dx * scale,
      y + dy * scale,
      0
    ];

    const building = rect(
      2.55 * scale,
      1.42 * scale,
      p(0, 0),
      color,
      0,
      2,
      0.08
    );

    building.setFill(C.card, 0.95);

    const sign = rect(
      2.55 * scale,
      0.38 * scale,
      p(0, 0.90),
      color,
      0.20,
      1.8,
      0.08
    );

    const title = txt(
      `${shop.toUpperCase()} SHOP`,
      20,
      color,
      p(0, 0.90),
      true,
      2.35 * scale
    );

    const awning = [];

    for (let k = 0; k < 8; k++) {
      awning.push(
        solidRect(
          0.31 * scale,
          0.26 * scale,
          p(-1.085 + k * 0.31, 0.49),
          k % 2 === 0 ? color : C.ink,
          k % 2 === 0 ? 0.80 : 0.65
        )
      );
    }

    const door = rect(
      0.60 * scale,
      0.86 * scale,
      p(0.77, -0.25),
      color,
      0.09,
      1.5,
      0.04
    );

    const window = rect(
      1.30 * scale,
      0.71 * scale,
      p(-0.42, -0.12),
      color,
      0.07,
      1.5,
      0.05
    );

    const bread = loaf(
      x - 0.42 * scale,
      y - 0.12 * scale,
      0.90 * scale
    );

    return new M.VGroup(
      building,
      sign,
      title,
      ...awning,
      door,
      window,
      bread
    );
  }

  function computer(x, y, scale = 1, label = 'MAIN COMPUTER') {
    const screenW = 1.80 * scale;
    const screenH = 1.08 * scale;

    const screen = rect(
      screenW,
      screenH,
      [x, y, 0],
      C.violet,
      0,
      2,
      0.10
    );

    screen.setFill(C.card, 0.96);

    const inset = rect(
      1.53 * scale,
      0.81 * scale,
      [x, y + 0.03 * scale, 0],
      C.cyan,
      0.10,
      1.2,
      0.06
    );

    const marks = [];

    for (let k = 0; k < 3; k++) {
      marks.push(
        line(
          [
            x - 0.56 * scale,
            y + (0.23 - k * 0.21) * scale,
            0
          ],
          [
            x + (0.48 - k * 0.10) * scale,
            y + (0.23 - k * 0.21) * scale,
            0
          ],
          C.cyan,
          2
        )
      );
    }

    const stand = line(
      [x, y - 0.54 * scale, 0],
      [x, y - 0.76 * scale, 0],
      C.violet,
      4
    );

    const base = line(
      [x - 0.48 * scale, y - 0.76 * scale, 0],
      [x + 0.48 * scale, y - 0.76 * scale, 0],
      C.violet,
      3
    );

    const title = txt(
      label,
      17,
      C.violet,
      [
        x,
        y - 1.05 * scale,
        0
      ],
      true,
      2.65 * scale
    );

    return new M.VGroup(
      screen,
      inset,
      ...marks,
      stand,
      base,
      title
    );
  }

  // ------------------------------------------------------------
  // Opening: one bakery, two shops.
  // ------------------------------------------------------------

  const SHOP_X = P
    ? [-1.82, 1.82]
    : [-4.85, -1.85];

  const SHOP_Y = P ? 2.02 : 0.23;

  const SHOP_SCALE = P ? 0.94 : 0.88;

  const northShop = bakery(
    'North',
    SHOP_X[0],
    SHOP_Y,
    SHOP_SCALE
  );

  const southShop = bakery(
    'South',
    SHOP_X[1],
    SHOP_Y,
    SHOP_SCALE
  );

  const FORECAST_POS = P
    ? [0, -0.45, 0]
    : [3.30, 0.03, 0];

  function forecastCard(value, named = false) {
    const x = FORECAST_POS[0];
    const y = FORECAST_POS[1];

    const w = P ? 4.65 : 4.35;
    const h = P ? 1.77 : 2.02;

    const bg = rect(
      w, h, FORECAST_POS,
      C.green, 0, 2, 0.15
    );

    bg.setFill(C.card, 0.96);

    const heading = txt(
      named ? 'DAILY FORECAST' : 'DAILY SALES',
      22,
      C.green,
      [x, y + h * 0.32, 0],
      true,
      w - 0.28
    );

    const money = txt(
      value,
      40,
      C.green,
      [x, y, 0],
      true,
      w - 0.30
    );

    const note = txt(
      'Expected dollars from sales',
      17,
      C.ink,
      [x, y - h * 0.33, 0],
      false,
      w - 0.30
    );

    return new M.VGroup(
      bg,
      heading,
      money,
      note
    );
  }

  let forecastNow = forecastCard('$?');

  // 0 — A small bakery with North and South shops.
  await until(S(0));
  await play(
    new M.FadeIn(northShop),
    new M.FadeIn(southShop),
    ...say('ONE BAKERY, TWO SHOPS')
  );

  // 1 — Predict the dollars received from sales each day.
  await until(S(1));
  await play(
    new M.FadeIn(forecastNow),
    ...say('HOW MANY DOLLARS WILL WE RECEIVE?', C.green)
  );

  // 2 — Define forecast.
  await until(S(2));
  await play(
    new M.Transform(
      forecastNow,
      forecastCard('$?', true)
    ),
    ...fbox([
      ['Forecast = a prediction of a future value', C.green],
      'Here: daily sales in dollars'
    ], C.green),
    ...say('A PREDICTION OF FUTURE SALES = FORECAST', C.green)
  );

  // ------------------------------------------------------------
  // Past sales records.
  // ------------------------------------------------------------

  const RECORD_POS = P
    ? [0, -0.60, 0]
    : [3.35, 0.02, 0];

  function pastRecords() {
    const x = RECORD_POS[0];
    const y = RECORD_POS[1];

    const parts = [];

    for (let k = 0; k < 3; k++) {
      const p = [
        x - 0.12 * k,
        y + 0.14 * k,
        0
      ];

      const slip = rect(
        P ? 3.60 : 3.55,
        P ? 1.52 : 1.65,
        p,
        C.muted,
        0,
        1.5,
        0.10
      );

      slip.setFill(C.card, 0.98);

      parts.push(slip);
    }

    parts.push(
      txt(
        'PAST SALES',
        23,
        C.ink,
        [x - 0.24, y + 0.47, 0],
        true
      )
    );

    for (let k = 0; k < 3; k++) {
      parts.push(
        line(
          [
            x - 1.29,
            y + 0.10 - k * 0.24,
            0
          ],
          [
            x + 0.81,
            y + 0.10 - k * 0.24,
            0
          ],
          C.muted,
          2
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const recordsPicture = pastRecords();

  // 3 — Forecasting requires records of past sales.
  await until(S(3));
  await play(
    new M.FadeOut(forecastNow),
    new M.FadeIn(recordsPicture),
    ...fbox([
      ['Past sales records', C.cyan],
      'Information used to make a forecast'
    ]),
    ...say('WE NEED RECORDS OF PAST SALES')
  );

  // ------------------------------------------------------------
  // Introduce the fields of a sales ticket.
  // ------------------------------------------------------------

  const SAMPLE_W = P ? 5.65 : 4.80;
  const SAMPLE_H = P ? 2.25 : 2.42;

  function sampleTicket() {
    const x = RECORD_POS[0];
    const y = RECORD_POS[1];

    const bg = rect(
      SAMPLE_W,
      SAMPLE_H,
      RECORD_POS,
      C.violet,
      0,
      2,
      0.12
    );

    bg.setFill(C.card, 0.96);

    const heading = txt(
      'SALES TICKET',
      23,
      C.violet,
      [x, y + SAMPLE_H * 0.35, 0],
      true,
      SAMPLE_W - 0.30
    );

    const fields = [
      ['Ticket ID', C.ink],
      ['Shop', C.cyan],
      ['Day and time of sale', C.ink],
      ['Amount in dollars', C.green]
    ];

    const texts = fields.map(([s, color], i) =>
      txt(
        s,
        19,
        color,
        [
          x,
          y + 0.29 - i * 0.37,
          0
        ],
        false,
        SAMPLE_W - 0.32
      )
    );

    return new M.VGroup(bg, heading, ...texts);
  }

  const sample = sampleTicket();

  // 4 — Each sale produces a small record called a ticket.
  await until(S(4));
  await play(
    new M.FadeOut(recordsPicture),
    new M.FadeIn(sample),
    ...fbox([
      ['One sale → one ticket', C.violet],
      'A small record describing that sale'
    ], C.violet),
    ...say('EACH SALE CREATES A TICKET', C.violet)
  );

  const sampleIDs = ['A', 'B', 'C'].map((id, i) => {
    const x = RECORD_POS[0] + (i - 1) * 0.93;
    const y = P ? -2.20 : -1.54;

    const bg = rect(
      0.74,
      0.49,
      [x, y, 0],
      C.cyan,
      0.12,
      1.5,
      0.08
    );

    const label = txt(
      id,
      23,
      C.cyan,
      [x, y, 0],
      true
    );

    return new M.VGroup(bg, label);
  });

  // 5 — Every ticket has a different identifying name.
  await until(S(5));
  await play(
    lagIn(sampleIDs, 0.90, 0.18),
    ...fbox([
      ['A, B, C, ...', C.cyan],
      'A unique ticket ID identifies each sale'
    ]),
    ...say('EACH TICKET HAS ITS OWN ID')
  );

  // ------------------------------------------------------------
  // Monday arrival picture.
  //
  // Shops produce tickets.
  // The main computer receives them.
  //
  // The received list is shown in arrival order:
  // A, C, D, E.
  //
  // B is physically held at North, outside the received list.
  // ------------------------------------------------------------

  const RECEIVER_X = P ? 0 : 3.30;

  const RECEIVER_W = P ? 6.40 : 5.60;
  const RECEIVER_H = P ? 3.42 : 2.95;

  const RECEIVER_Y = P ? -1.50 : -0.12;

  const ARRIVAL_TICKET_W = RECEIVER_W - 0.44;
  const ARRIVAL_TICKET_H = P ? 0.61 : 0.47;

  const ARRIVAL_TOP = P ? -0.56 : 0.55;
  const ARRIVAL_STEP = P ? 0.76 : 0.58;

  const arrivalSlot = i => [
    RECEIVER_X,
    ARRIVAL_TOP - i * ARRIVAL_STEP,
    0
  ];

  function receiverFrame() {
    const bg = rect(
      RECEIVER_W,
      RECEIVER_H,
      [RECEIVER_X, RECEIVER_Y, 0],
      C.violet,
      0,
      2,
      0.15
    );

    bg.setFill(C.card, 0.85);

    const title = txt(
      'MAIN COMPUTER — RECEIVED',
      P ? 19 : 20,
      C.violet,
      [
        RECEIVER_X,
        RECEIVER_Y + RECEIVER_H / 2 - 0.28,
        0
      ],
      true,
      RECEIVER_W - 0.28
    );

    const parts = [bg, title];

    // Open ledger lines, not a fixed-size batch.
    for (let i = 0; i < 4; i++) {
      const p = arrivalSlot(i);

      parts.push(
        line(
          [
            p[0] - ARRIVAL_TICKET_W / 2,
            p[1] - ARRIVAL_TICKET_H / 2 - 0.05,
            0
          ],
          [
            p[0] + ARRIVAL_TICKET_W / 2,
            p[1] - ARRIVAL_TICKET_H / 2 - 0.05,
            0
          ],
          C.muted,
          0.8
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const receiver = receiverFrame();

  const CLOCK_POS = P
    ? [0, 0.48, 0]
    : [3.30, 1.52, 0];

  function clockLabel(day, time, color = C.ink) {
    return txt(
      `${day.toUpperCase()} · ${time}`,
      P ? 20 : 19,
      color,
      CLOCK_POS,
      true,
      P ? 6.35 : 5.60
    );
  }

  let clockNow = clockLabel('Monday', 'morning');

  function changeClock(day, time, color = C.ink) {
    const next = clockLabel(day, time, color);

    const a = [
      new M.FadeOut(clockNow),
      new M.FadeIn(next)
    ];

    clockNow = next;

    return a;
  }

  const received = [];

  const HELD_POS = P
    ? [-1.82, 1.05, 0]
    : [-4.85, -0.99, 0];

  const HELD_W = P ? 3.05 : 2.83;
  const HELD_H = P ? 0.51 : 0.48;

  let heldB = null;
  let connectionMark = null;

  function receiveTicket(id) {
    const o = ticket(
      id,
      arrivalSlot(received.length),
      ARRIVAL_TICKET_W,
      ARRIVAL_TICKET_H
    );

    received.push(o);

    return new M.FadeIn(o);
  }

  function shopLink(shop) {
    const i = shop === 'North' ? 0 : 1;

    const color = shopColor(shop);

    if (P) {
      return arrow(
        [
          SHOP_X[i],
          SHOP_Y - 0.75 * SHOP_SCALE,
          0
        ],
        [
          i === 0 ? -0.90 : 0.90,
          RECEIVER_Y + RECEIVER_H / 2 + 0.06,
          0
        ],
        color,
        2.3
      );
    }

    return arrow(
      [
        SHOP_X[i] + 1.12 * SHOP_SCALE,
        SHOP_Y - 0.56,
        0
      ],
      [
        RECEIVER_X - RECEIVER_W / 2 - 0.08,
        i === 0 ? -0.60 : 0.45,
        0
      ],
      color,
      2.1
    );
  }

  const northLink = shopLink('North');
  const southLink = shopLink('South');

  // 6 — Watch Monday tickets arrive at the main computer.
  await until(S(6));
  await play(
    new M.FadeOut(sample),
    ...outs(sampleIDs),
    ...dropBox(),
    new M.FadeIn(receiver),
    new M.FadeIn(clockNow),
    ...say('WATCH MONDAY’S TICKETS ARRIVE')
  );

  // 7 — Monday 9 a.m.: A arrives from North, $4.
  await until(S(7));
  await play(
    ...changeClock('Monday', '9 a.m.'),
    new M.FadeIn(northLink),
    receiveTicket('A'),
    ...say('A ARRIVES: NORTH, $4', NORTH)
  );

  // 8 — Monday 10 a.m.: C arrives from South, $6.
  await until(S(8));
  await play(
    ...changeClock('Monday', '10 a.m.'),
    new M.FadeOut(northLink),
    new M.FadeIn(southLink),
    receiveTicket('C'),
    ...say('C ARRIVES: SOUTH, $6', SOUTH)
  );

  // 9 — Monday 11 a.m.: North makes another sale, $8.
  await until(S(9));

  heldB = ticket(
    'B',
    HELD_POS,
    HELD_W,
    HELD_H
  );

  await play(
    ...changeClock('Monday', '11 a.m.'),
    new M.FadeOut(southLink),
    new M.FadeIn(heldB),
    ...say('NORTH MAKES SALE B: $8', NORTH)
  );

  // 10 — North loses its internet connection.
  await until(S(10));

  function offlineIndicator() {
    const x = SHOP_X[0];
    const y = P ? 3.38 : -1.59;   // phone: above the North shop, not on it

    const w = P ? 2.55 : 2.58;
    const h = 0.34;

    const bg = rect(
      w,
      h,
      [x, y, 0],
      RED,
      0.16,
      1.5,
      0.07
    );

    const label = txt(
      '× CONNECTION LOST',
      15,
      RED,
      [x, y, 0],
      true,
      w - 0.12
    );

    return new M.VGroup(bg, label);
  }

  connectionMark = offlineIndicator();

  await play(
    new M.FadeIn(connectionMark),
    new M.Indicate(
      heldB,
      { color: RED }
    ),
    ...fbox([
      ['Ticket B exists at North', NORTH],
      ['But it has not reached the main computer', RED]
    ], RED),
    ...say('CONNECTION LOST: B STAYS AT NORTH', RED)
  );

  // 11 — Monday noon: D arrives from South, $10.
  await until(S(11));
  await play(
    ...changeClock('Monday', 'Noon'),
    new M.FadeIn(southLink),
    receiveTicket('D'),
    ...say('D ARRIVES: SOUTH, $10', SOUTH)
  );

  // 12 — Monday 2 p.m.: E arrives from South, $14.
  await until(S(12));
  await play(
    ...changeClock('Monday', '2 p.m.'),
    new M.Indicate(
      southLink,
      { color: SOUTH }
    ),
    receiveTicket('E'),
    ...say('E ARRIVES: SOUTH, $14', SOUTH)
  );

  // 13 — These tickets are our data.
  await until(S(13));
  await play(
    new M.FadeOut(southLink),
    new M.LaggedStart(
      received.map(o =>
        new M.Indicate(o, { color: C.green })
      ),
      { lagRatio: 0.14, runTime: 1.40 }
    ),
    ...fbox([
      ['Data = information we collect', C.green],
      'Here, records of the bakery’s sales'
    ], C.green),
    ...say('SALES TICKETS ARE OUR DATA', C.green)
  );

  // 14 — How should we work with the tickets?
  await until(S(14));
  await play(
    ...fbox([
      ['How should we work with these records?', C.cyan]
    ]),
    ...say('HOW SHOULD WE PROCESS THE TICKETS?')
  );

  // 15 — There are two ways of working.
  await until(S(15));
  await play(
    ...fbox([
      ['Collect a fixed group', C.violet],
      ['Or work with each new arrival', C.green]
    ]),
    ...say('TWO DIFFERENT WAYS OF WORKING')
  );

  // ------------------------------------------------------------
  // Batch processing.
  //
  // A tray holds a copied, fixed list of received tickets.
  //
  // The clock is Tuesday, 6 a.m.
  // The selected records describe Monday sales.
  //
  // B is NOT included in this copy.
  // ------------------------------------------------------------

  const TRAY_X = P ? 0 : -3.15;
  const TRAY_Y = P ? 1.06 : -0.02;

  const TRAY_W = P ? 5.70 : 5.45;
  const TRAY_H = P ? 3.78 : 2.96;

  const TRAY_TOP = TRAY_Y + TRAY_H / 2;
  const TRAY_BOTTOM = TRAY_Y - TRAY_H / 2;

  const BATCH_W = TRAY_W - 0.88;
  const BATCH_H = P ? 0.59 : 0.47;

  const BATCH_TOP = P ? 2.00 : 0.83;
  const BATCH_STEP = P ? 0.77 : 0.61;

  const batchSlot = i => [
    TRAY_X - 0.14,
    BATCH_TOP - i * BATCH_STEP,
    0
  ];

  function trayPicture() {
    const bg = rect(
      TRAY_W,
      TRAY_H,
      [TRAY_X, TRAY_Y, 0],
      C.violet,
      0,
      2,
      0.16
    );

    bg.setFill(C.card, 0.90);

    const back = line(
      [
        TRAY_X - TRAY_W / 2 + 0.11,
        TRAY_TOP - 0.08,
        0
      ],
      [
        TRAY_X + TRAY_W / 2 - 0.11,
        TRAY_TOP - 0.08,
        0
      ],
      C.violet,
      3
    );

    const lip = rect(
      TRAY_W - 0.08,
      P ? 0.15 : 0.12,
      [
        TRAY_X,
        TRAY_BOTTOM + 0.07,
        0
      ],
      C.violet,
      0.25,
      1.7,
      0.035
    );

    const title = txt(
      'MONDAY SALES — RECEIVED COPY',
      P ? 19 : 18,
      C.violet,
      [
        TRAY_X,
        TRAY_TOP - 0.32,
        0
      ],
      true,
      TRAY_W - 0.26
    );

    return new M.VGroup(
      bg,
      back,
      lip,
      title
    );
  }

  const tray = trayPicture();

  const BATCH_CLOCK_POS = P
    ? [0, 3.30, 0]
    : [-3.15, 1.57, 0];

  const batchClock = txt(
    'TUESDAY · 6 a.m.',
    20,
    C.ink,
    BATCH_CLOCK_POS,
    true,
    TRAY_W
  );

  const batchCards = BATCH_IDS.map((id, i) =>
    ticket(
      id,
      batchSlot(i),
      BATCH_W,
      BATCH_H
    )
  );

  const WORKER_POS = P
    ? [0, -2.02, 0]
    : [3.15, 0.15, 0];

  function workerPicture() {
    const x = WORKER_POS[0];
    const y = WORKER_POS[1];

    const head = circle(
      0.22,
      [x - 0.65, y + 0.49, 0],
      C.ink,
      0.88,
      1.5
    );

    const torso = line(
      [x - 0.65, y + 0.24, 0],
      [x - 0.65, y - 0.29, 0],
      C.ink,
      4
    );

    const arm = line(
      [x - 0.65, y + 0.12, 0],
      [x + 0.05, y - 0.05, 0],
      C.ink,
      3
    );

    const desk = rect(
      2.10,
      0.30,
      [x + 0.10, y - 0.38, 0],
      C.violet,
      0.18,
      1.6,
      0.06
    );

    const paper = rect(
      0.60,
      0.40,
      [x + 0.50, y - 0.06, 0],
      C.cyan,
      0.12,
      1.4,
      0.04
    );

    const title = txt(
      'Work through the tray',
      19,
      C.ink,
      [x, y - 0.78, 0],
      false,
      4.70
    );

    return new M.VGroup(
      head,
      torso,
      arm,
      desk,
      paper,
      title
    );
  }

  const worker = workerPicture();

  // 16 — Imagine collecting tickets in a tray each morning.
  await until(S(16));
  await play(
    ...outs([
      northShop,
      southShop,
      receiver,
      clockNow,
      heldB,
      connectionMark,
      ...received
    ]),
    new M.FadeIn(tray),
    new M.FadeIn(worker),
    ...fbox([
      ['Collect records first', C.violet],
      'Work through them together each morning'
    ], C.violet),
    ...say('COLLECT TICKETS IN A TRAY', C.violet)
  );

  // 17 — Copy received Monday tickets at Tuesday 6 a.m.
  await until(S(17));
  await play(
    new M.FadeIn(batchClock),
    lagIn(batchCards, 1.30, 0.16),
    ...fbox([
      ['Copy made: Tuesday, 6 a.m.', C.ink],
      ['Contains Monday tickets received by then', C.violet]
    ], C.violet),
    ...say('TUESDAY 6 A.M.: MAKE A FIXED COPY', C.violet)
  );

  // 18 — The fixed stack contains A, C, D and E.
  await until(S(18));
  await play(
    new M.LaggedStart(
      batchCards.map(o =>
        new M.Indicate(o, { color: C.violet })
      ),
      { lagRatio: 0.15, runTime: 1.55 }
    ),
    ...fbox([
      ['Four tickets in the copied stack', C.violet],
      'A, C, D, E'
    ], C.violet),
    ...say('FIXED STACK: A, C, D, E', C.violet)
  );

  // ------------------------------------------------------------
  // Explicit boundaries of the fixed list.
  // ------------------------------------------------------------

  const START_Y =
    batchSlot(0)[1] + BATCH_H / 2 + 0.08;

  const END_Y =
    batchSlot(3)[1] - BATCH_H / 2 - 0.08;

  function boundaryMark(s, y) {
    const left = TRAY_X - BATCH_W / 2 - 0.14;
    const right = TRAY_X + BATCH_W / 2 - 0.14;

    const mark = line(
      [left, y, 0],
      [right, y, 0],
      C.green,
      2.7
    );

    const label = txt(
      s,
      14,
      C.green,
      [
        TRAY_X + TRAY_W / 2 - 0.30,
        y,
        0
      ],
      true,
      0.54
    );

    return new M.VGroup(mark, label);
  }

  const startMark = boundaryMark('START', START_Y);
  const endMark = boundaryMark('END', END_Y);

  // 19 — The computer knows where the list starts and ends.
  await until(S(19));
  await play(
    new M.FadeIn(startMark),
    new M.FadeIn(endMark),
    ...fbox([
      ['Known first record: A', C.green],
      ['Known last record: E', C.green]
    ], C.green),
    ...say('A KNOWN START AND A KNOWN END', C.green)
  );

  const batchTag = pill(
    'BATCH',
    C.violet,
    21
  );

  batchTag.moveTo([
    WORKER_POS[0],
    P ? -3.38 : 1.18,
    0
  ]);

  // 20 — A fixed group of records is called a batch.
  await until(S(20));
  await play(
    new M.FadeIn(batchTag),
    ...fbox([
      ['Batch = a fixed group of records', C.violet]
    ], C.violet),
    ...say('FIXED GROUP OF RECORDS = BATCH', C.violet)
  );

  // 21 — Reading records and doing something is processing.
  await until(S(21));
  await play(
    new M.Indicate(
      worker,
      { color: C.green }
    ),
    ...fbox([
      ['Processing', C.green],
      'Read the records and do something with them'
    ], C.green),
    ...say('READ AND USE RECORDS = PROCESSING', C.green)
  );

  // 22 — Working through a batch is batch processing.
  await until(S(22));

  const batchProcessingTag = pill(
    'BATCH PROCESSING',
    C.violet,
    20
  );

  batchProcessingTag.moveTo([
    WORKER_POS[0],
    P ? -3.38 : 1.18,
    0
  ]);

  await play(
    new M.Transform(
      batchTag,
      batchProcessingTag
    ),
    ...fbox([
      ['Batch processing', C.violet],
      'Work through a fixed group of records'
    ], C.violet),
    ...say('WORK THROUGH A BATCH = BATCH PROCESSING', C.violet)
  );

  // ------------------------------------------------------------
  // Calculate Monday's received sales total.
  //
  // The tray stays fixed.
  // Check marks indicate records already processed.
  // The total changes as records are read.
  // ------------------------------------------------------------

  const TOTAL_POS = P
    ? [0, -2.35, 0]
    : [3.18, -0.18, 0];

  const TOTAL_W = P ? 5.65 : 4.70;
  const TOTAL_H = P ? 1.75 : 2.35;

  function totalCard(value, count, complete = false) {
    const x = TOTAL_POS[0];
    const y = TOTAL_POS[1];

    const color = complete ? C.green : C.cyan;

    const bg = rect(
      TOTAL_W,
      TOTAL_H,
      TOTAL_POS,
      color,
      0,
      2,
      0.16
    );

    bg.setFill(C.card, 0.96);

    const title = txt(
      'MONDAY TOTAL SO FAR',
      20,
      color,
      [
        x,
        y + TOTAL_H * 0.34,
        0
      ],
      true,
      TOTAL_W - 0.26
    );

    const money = txt(
      `$${value}`,
      P ? 38 : 43,
      color,
      [
        x,
        y + TOTAL_H * 0.01,
        0
      ],
      true,
      TOTAL_W - 0.30
    );

    const progress = txt(
      `${count} of ${BATCH_IDS.length} tickets processed`,
      17,
      C.ink,
      [
        x,
        y - TOTAL_H * 0.32,
        0
      ],
      false,
      TOTAL_W - 0.25
    );

    return new M.VGroup(
      bg,
      title,
      money,
      progress
    );
  }

  let totalNow = totalCard(0, 0);

  function readMark(i) {
    const p = batchSlot(i);

    return txt(
      '✓',
      23,
      C.green,
      [
        TRAY_X + TRAY_W / 2 - 0.30,
        p[1],
        0
      ],
      true
    );
  }

  const readMarks = BATCH_IDS.map((_, i) =>
    readMark(i)
  );

  function processedOutline(i) {
    const p = batchSlot(i);

    return rect(
      BATCH_W + 0.06,
      BATCH_H + 0.04,
      p,
      C.green,
      0,
      2,
      0.10
    );
  }

  const processedOutlines = BATCH_IDS.map((_, i) =>
    processedOutline(i)
  );

  // 23 — Use the batch to find Monday's total so far.
  await until(S(23));
  await play(
    new M.FadeOut(worker),
    new M.FadeOut(batchTag),
    new M.FadeIn(totalNow),
    ...fbox([
      ['Read each amount and add it to the total', C.cyan]
    ]),
    ...say('ADD THE AMOUNTS IN THE BATCH')
  );

  // 24 — Four plus six makes ten dollars.
  await until(S(24));
  await play(
    new M.FadeIn(processedOutlines[0]),
    new M.FadeIn(processedOutlines[1]),
    new M.FadeIn(readMarks[0]),
    new M.FadeIn(readMarks[1]),
    new M.Transform(
      totalNow,
      totalCard(sum(['A', 'C']), 2)
    ),
    ...fbox([
      ['$4 + $6 = $10', C.green]
    ], C.green),
    ...say('A + C = $10', C.green)
  );

  // 25 — Plus ten makes twenty dollars.
  await until(S(25));
  await play(
    new M.FadeIn(processedOutlines[2]),
    new M.FadeIn(readMarks[2]),
    new M.Transform(
      totalNow,
      totalCard(sum(['A', 'C', 'D']), 3)
    ),
    ...fbox([
      ['$10 + $10 = $20', C.green]
    ], C.green),
    ...say('ADD D: TOTAL = $20', C.green)
  );

  // 26 — Plus fourteen makes thirty-four dollars.
  await until(S(26));
  await play(
    new M.FadeIn(processedOutlines[3]),
    new M.FadeIn(readMarks[3]),
    new M.Transform(
      totalNow,
      totalCard(BATCH_TOTAL, 4)
    ),
    ...fbox([
      ['$20 + $14 = $34', C.green]
    ], C.green),
    ...say('ADD E: TOTAL = $34', C.green)
  );

  const finishedTag = pill(
    'BATCH FINISHED',
    C.green,
    20
  );

  finishedTag.moveTo([
    TOTAL_POS[0],
    P ? -3.53 : 1.32,
    0
  ]);

  // 27 — The computer reaches the end and finishes.
  await until(S(27));
  await play(
    new M.Transform(
      totalNow,
      totalCard(BATCH_TOTAL, 4, true)
    ),
    new M.Indicate(
      endMark,
      { color: C.green }
    ),
    new M.FadeIn(finishedTag),
    ...fbox([
      ['4 of 4 copied records processed', C.green],
      ['The fixed list has ended', C.green]
    ], C.green),
    ...say('REACH THE END AND FINISH', C.green)
  );

  // ------------------------------------------------------------
  // Stream processing.
  //
  // Replace the fixed tray with a moving conveyor belt.
  //
  // Every incoming ticket moves toward the reader.
  // Previously read tickets move into a received-record history.
  //
  // The history is grouped by ARRIVAL day, not sale day.
  // Ticket B retains Monday as its day of sale.
  //
  // The right end of the belt stays open for more records.
  // ------------------------------------------------------------

  function clearBatch() {
    return outs([
      tray,
      batchClock,
      ...batchCards,
      startMark,
      endMark,
      ...processedOutlines,
      ...readMarks,
      totalNow,
      finishedTag
    ]);
  }

  // 28 — Imagine a different way of working.
  await until(S(28));
  await play(
    ...clearBatch(),
    ...dropBox(),
    ...say('NOW TRY A DIFFERENT WAY OF WORKING')
  );

  const BELT_Y = P ? 1.89 : 0.95;
  const BELT_W = P ? 7.05 : 11.65;
  const BELT_H = P ? 0.68 : 0.56;

  const BELT_LEFT = -BELT_W / 2;
  const BELT_RIGHT = BELT_W / 2;

  function beltPicture() {
    const bg = rect(
      BELT_W,
      BELT_H,
      [0, BELT_Y - 0.16, 0],
      C.muted,
      0,
      2,
      BELT_H / 2
    );

    bg.setFill(C.card, 0.95);

    const upperRail = line(
      [
        BELT_LEFT + 0.19,
        BELT_Y + BELT_H * 0.29,
        0
      ],
      [
        BELT_RIGHT - 0.19,
        BELT_Y + BELT_H * 0.29,
        0
      ],
      C.violet,
      3
    );

    const lowerRail = line(
      [
        BELT_LEFT + 0.19,
        BELT_Y - BELT_H * 0.63,
        0
      ],
      [
        BELT_RIGHT - 0.19,
        BELT_Y - BELT_H * 0.63,
        0
      ],
      C.violet,
      3
    );

    const rollers = [];

    const n = P ? 12 : 19;

    for (let k = 0; k < n; k++) {
      const x =
        BELT_LEFT + 0.33 +
        k * (BELT_W - 0.66) / (n - 1);

      rollers.push(
        circle(
          P ? 0.115 : 0.105,
          [
            x,
            BELT_Y - 0.20,
            0
          ],
          C.muted,
          0.09,
          1.5
        )
      );
    }

    return new M.VGroup(
      bg,
      upperRail,
      lowerRail,
      ...rollers
    );
  }

  const belt = beltPicture();

  // Moving directional markings along the belt.

  function beltMarkings(phase) {
    const parts = [];

    const count = P ? 8 : 13;
    const spacing = (BELT_W - 0.56) / count;

    for (let i = 0; i < count; i++) {
      const x =
        BELT_LEFT + 0.28 +
        ((i + phase) % count) * spacing;

      const y = BELT_Y - BELT_H * 0.49;

      parts.push(
        line(
          [x - 0.08, y + 0.055, 0],
          [x + 0.04, y, 0],
          C.green,
          1.7
        ),
        line(
          [x + 0.04, y, 0],
          [x - 0.08, y - 0.055, 0],
          C.green,
          1.7
        )
      );
    }

    return new M.VGroup(...parts);
  }

  let beltPhase = 0;
  let motionMarks = beltMarkings(beltPhase);

  function advanceBelt() {
    beltPhase = (beltPhase + 0.45) % 1;

    return new M.Transform(
      motionMarks,
      beltMarkings(beltPhase)
    );
  }

  const readerX = P ? 1.65 : 3.85;

  const readerFrame = rect(
    P ? 3.18 : 3.85,
    P ? 1.08 : 0.89,
    [
      readerX,
      BELT_Y + 0.07,
      0
    ],
    C.green,
    0.025,
    2,
    0.12
  );

  const readerLabel = txt(
    'READ NEW TICKET',
    15,
    C.green,
    [
      readerX,
      BELT_Y + (P ? 0.72 : 0.53),
      0
    ],
    true,
    P ? 3.10 : 3.80
  );

  const beltLabel = txt(
    'INCOMING TICKETS →',
    17,
    C.violet,
    [
      P ? -1.65 : -3.85,
      BELT_Y + (P ? 0.72 : 0.53),
      0
    ],
    true,
    P ? 3.20 : 3.90
  );

  const openArrow = arrow(
    [
      BELT_RIGHT - 0.54,
      BELT_Y - 0.17,
      0
    ],
    [
      BELT_RIGHT + (P ? 0.13 : 0.31),
      BELT_Y - 0.17,
      0
    ],
    C.green,
    3
  );

  // 29 — Imagine a moving belt carrying each new ticket.
  await until(S(29));
  await play(
    new M.FadeIn(belt),
    new M.FadeIn(motionMarks),
    new M.FadeIn(beltLabel),
    new M.FadeIn(readerFrame),
    new M.FadeIn(readerLabel),
    new M.FadeIn(openArrow),
    ...fbox([
      ['A moving belt carries incoming records', C.violet],
      'The reader is ready for the next ticket'
    ], C.violet),
    ...say('A MOVING BELT FOR NEW TICKETS', C.violet)
  );

  // ------------------------------------------------------------
  // Arrival history below the belt.
  //
  // Monday and Tuesday are arrival-day headings.
  // Every individual slip retains its own SALE day.
  // ------------------------------------------------------------

  const HISTORY_X = P
    ? [-1.76, 1.76]
    : [-3.22, 3.22];

  const HISTORY_W = P ? 3.23 : 5.72;
  const HISTORY_H = P ? 0.62 : 0.45;

  const HISTORY_TOP = P ? 0.02 : -0.16;
  const HISTORY_STEP = P ? 0.78 : 0.50;

  const HISTORY_HEAD_Y = P ? 0.64 : 0.28;

  const HISTORY_CLOCK_POS = P
    ? [0, 3.22, 0]
    : [0, 1.51, 0];

  function streamClock(day, time, color = C.ink) {
    return txt(
      `${day.toUpperCase()} · ${time}`,
      P ? 20 : 18,
      color,
      HISTORY_CLOCK_POS,
      true,
      P ? 6.50 : 4.00
    );
  }

  let streamClockNow = streamClock(
    'Monday',
    'morning'
  );

  function updateStreamClock(day, time, color = C.ink) {
    const next = streamClock(day, time, color);

    const a = [
      new M.FadeOut(streamClockNow),
      new M.FadeIn(next)
    ];

    streamClockNow = next;

    return a;
  }

  function historyHeading(day, index) {
    return txt(
      `RECEIVED ${day.toUpperCase()}`,
      P ? 16 : 17,
      C.muted,
      [
        HISTORY_X[index],
        HISTORY_HEAD_Y,
        0
      ],
      true,
      HISTORY_W
    );
  }

  const mondayHeading = historyHeading('Monday', 0);
  const tuesdayHeading = historyHeading('Tuesday', 1);

  const historyDivider = line(
    [0, HISTORY_HEAD_Y + 0.15, 0],
    [
      0,
      HISTORY_TOP - 3 * HISTORY_STEP - HISTORY_H / 2,
      0
    ],
    C.muted,
    1.2
  );

  const streamHistory = [];

  let activeTickets = [];

  const historyCounts = [0, 0];

  function nextHistorySlot(id) {
    const group =
      TICKETS[id].arrivalDay === 'Monday' ? 0 : 1;

    const i = historyCounts[group]++;

    return [
      HISTORY_X[group],
      HISTORY_TOP - i * HISTORY_STEP,
      0
    ];
  }

  const BELT_TICKET_W = P ? 3.02 : 3.62;
  const BELT_TICKET_H = P ? 0.65 : 0.55;

  function archiveActive() {
    const a = [];

    activeTickets.forEach(({ id, object }) => {
      const destination = nextHistorySlot(id);

      a.push(
        new M.Transform(
          object,
          ticket(
            id,
            destination,
            HISTORY_W,
            HISTORY_H
          ),
          { pathArc: -0.20 }
        )
      );

      streamHistory.push(object);
    });

    activeTickets = [];

    return a;
  }

  function beltEntryPosition(i, n) {
    if (n === 1) {
      return [
        P ? -1.82 : -3.85,
        BELT_Y + 0.05,
        0
      ];
    }

    return [
      P
        ? [-1.84, 1.27][i]
        : [-4.00, -0.03][i],
      BELT_Y + 0.05,
      0
    ];
  }

  function beltReadPosition(i, n) {
    if (n === 1) {
      return [
        readerX,
        BELT_Y + 0.05,
        0
      ];
    }

    return [
      P
        ? [-1.50, 1.65][i]
        : [-0.15, 3.85][i],
      BELT_Y + 0.05,
      0
    ];
  }

  // A stream arrival uses two sequential plays:
  // 1. Put each incoming ticket on the belt.
  // 2. Move the ticket toward the reader.
  //
  // Both plays are awaited. They never overlap.
  // The caption begins with the first play at its narration beat.

  async function streamArrival(
    ids,
    day,
    time,
    caption,
    color = C.cyan,
    extra = []
  ) {
    const previous = archiveActive();

    const incoming = ids.map((id, i) => ({
      id,
      object: ticket(
        id,
        beltEntryPosition(i, ids.length),
        BELT_TICKET_W,
        BELT_TICKET_H
      )
    }));

    await play(
      ...previous,
      ...updateStreamClock(day, time),
      ...ins(incoming.map(o => o.object)),
      advanceBelt(),
      ...extra,
      ...say(caption, color)
    );

    activeTickets = incoming;

    await play(
      ...incoming.map(({ id, object }, i) =>
        new M.Transform(
          object,
          ticket(
            id,
            beltReadPosition(i, ids.length),
            BELT_TICKET_W,
            BELT_TICKET_H
          )
        )
      ),
      advanceBelt()
    );
  }

  // 30 — Return to Monday morning and replay the same arrivals.
  await until(S(30));
  await play(
    new M.FadeIn(streamClockNow),
    new M.FadeIn(mondayHeading),
    new M.Create(historyDivider),
    advanceBelt(),
    ...fbox([
      ['Return to Monday morning', C.ink],
      ['Replay the same incoming records']
    ]),
    ...say('REPLAY MONDAY’S ARRIVALS')
  );

  // 31 — A arrives Monday at 9 a.m. and can be read.
  await until(S(31));
  await streamArrival(
    ['A'],
    'Monday',
    '9 a.m.',
    'A ARRIVES AND CAN BE READ: $4',
    NORTH,
    fbox([
      ['Ticket A: North, $4', NORTH],
      'Read it when it arrives'
    ])
  );

  // 32 — C arrives Monday at 10 a.m.
  await until(S(32));
  await streamArrival(
    ['C'],
    'Monday',
    '10 a.m.',
    'NEXT ARRIVAL: C, $6',
    SOUTH,
    fbox([
      ['Ticket C: South, $6', SOUTH],
      'The computer can read the next record'
    ])
  );

  // 33 — D and E follow when they arrive.
  //
  // They occupy separate moving slips.
  // Their sale times remain noon and 2 p.m.
  await until(S(33));
  await streamArrival(
    ['D', 'E'],
    'Monday',
    'Noon → 2 p.m.',
    'D AND E FOLLOW WHEN THEY ARRIVE',
    SOUTH,
    fbox([
      ['Noon: D arrives, $10', SOUTH],
      ['2 p.m.: E arrives, $14', SOUTH]
    ], SOUTH)
  );

  // ------------------------------------------------------------
  // The stream continues into Tuesday.
  // No batch boundary stops the receiving process.
  // ------------------------------------------------------------

  const continuingTag = pill(
    'STILL READY',
    C.green,
    18
  );

  continuingTag.moveTo([
    P ? 1.75 : 3.22,
    P ? -0.88 : -0.88,
    0
  ]);

  // 34 — The belt continues into Tuesday morning.
  await until(S(34));
  await play(
    ...archiveActive(),
    ...updateStreamClock('Tuesday', 'morning'),
    new M.FadeIn(tuesdayHeading),
    new M.FadeIn(continuingTag),
    advanceBelt(),
    ...fbox([
      ['Monday has ended', C.ink],
      ['The receiving process stays ready', C.green]
    ], C.green),
    ...say('THE BELT CONTINUES INTO TUESDAY', C.green)
  );

  // ------------------------------------------------------------
  // Delayed ticket B.
  //
  // Arrives Tuesday, 8 a.m.
  // Its contents still say Monday, 11 a.m., North, $8.
  // ------------------------------------------------------------

  const lateBadge = pill(
    'LATE ARRIVAL',
    RED,
    17
  );

  lateBadge.moveTo([
    P ? 1.74 : 3.22,
    P ? -0.80 : -1.76,
    0
  ]);

  // 35 — B finally arrives Tuesday at 8 a.m.
  await until(S(35));
  await streamArrival(
    ['B'],
    'Tuesday',
    '8 a.m.',
    'B FINALLY ARRIVES: MONDAY’S $8 SALE',
    NORTH,
    [
      new M.FadeOut(continuingTag),
      new M.FadeIn(lateBadge),
      ...fbox([
        ['Sale: Monday, 11 a.m.', NORTH],
        ['Arrival: Tuesday, 8 a.m.', RED],
        'Same ticket B. Same $8 sale.'
      ], RED)
    ]
  );

  // 36 — F arrives Tuesday at 10 a.m., North, $8.
  await until(S(36));
  await streamArrival(
    ['F'],
    'Tuesday',
    '10 a.m.',
    'F ARRIVES: NORTH, $8',
    NORTH,
    [
      new M.FadeOut(lateBadge),
      ...fbox([
        ['Ticket F: Tuesday sale, $8', NORTH],
        'A new record is read when received'
      ])
    ]
  );

  // 37 — G arrives Tuesday at 11 a.m., South, $12.
  await until(S(37));
  await streamArrival(
    ['G'],
    'Tuesday',
    '11 a.m.',
    'G ARRIVES: SOUTH, $12',
    SOUTH,
    fbox([
      ['Ticket G: Tuesday sale, $12', SOUTH],
      'The next record travels along the belt'
    ], SOUTH)
  );

  // ------------------------------------------------------------
  // Open-ended receiving process.
  //
  // G is the last ticket shown in the example.
  // G is NOT a preset endpoint of the stream.
  //
  // An empty reader and an open arrow represent readiness
  // for future arrivals. No additional sales are invented.
  // ------------------------------------------------------------

  const moreDots = txt(
    '···',
    40,
    C.green,
    [
      P ? -1.80 : -3.65,
      BELT_Y + 0.05,
      0
    ],
    true
  );

  const nextTicketSlot = rect(
    BELT_TICKET_W,
    BELT_TICKET_H,
    [
      readerX,
      BELT_Y + 0.05,
      0
    ],
    C.green,
    0.045,
    1.3,
    0.09
  );

  const nextTicketText = txt(
    'READY FOR NEXT',
    19,
    C.green,
    [
      readerX,
      BELT_Y + 0.05,
      0
    ],
    true,
    BELT_TICKET_W - 0.20
  );

  // 38 — Unlike the stack, there is no planned last ticket.
  await until(S(38));
  await play(
    ...archiveActive(),
    new M.FadeIn(moreDots),
    new M.FadeIn(nextTicketSlot),
    new M.FadeIn(nextTicketText),
    new M.Indicate(
      openArrow,
      { color: C.green }
    ),
    advanceBelt(),
    ...fbox([
      ['G is only the last ticket we have shown', C.ink],
      ['More records may arrive later', C.green]
    ], C.green),
    ...say('THERE IS NO PLANNED LAST TICKET', C.green)
  );

  // 39 — Define a stream.
  await until(S(39));
  await play(
    advanceBelt(),
    ...fbox([
      ['Stream = a flow of records', C.green],
      'It can continue without a planned end'
    ], C.green),
    ...say('OPEN-ENDED FLOW OF RECORDS = STREAM', C.green)
  );

  // 40 — Working with records as they arrive is stream processing.
  await until(S(40));
  await play(
    advanceBelt(),
    new M.Indicate(
      readerFrame,
      { color: C.green }
    ),
    ...fbox([
      ['Stream processing', C.green],
      'Work with records as they arrive'
    ], C.green),
    ...say('READ RECORDS AS THEY ARRIVE', C.green)
  );

  // ------------------------------------------------------------
  // Side-by-side comparison.
  //
  // Batch: fixed list, known last record, finished.
  // Stream: incoming records, no preset last record, ready.
  //
  // Phone: panels stacked vertically.
  // Laptop: panels side by side.
  // ------------------------------------------------------------

  function clearStream() {
    return outs([
      belt,
      motionMarks,
      beltLabel,
      readerFrame,
      readerLabel,
      openArrow,
      streamClockNow,
      mondayHeading,
      tuesdayHeading,
      historyDivider,
      ...streamHistory,
      ...activeTickets.map(o => o.object),
      moreDots,
      nextTicketSlot,
      nextTicketText
    ]);
  }

  const PANEL_W = P ? 6.55 : 5.65;
  const PANEL_H = P ? 2.80 : 3.28;

  const BATCH_PANEL_POS = P
    ? [0, 1.91, 0]
    : [-3.10, -0.12, 0];

  const STREAM_PANEL_POS = P
    ? [0, -1.32, 0]
    : [3.10, -0.12, 0];

  function panelBackground(title, p, color) {
    const x = p[0];
    const y = p[1];

    const bg = rect(
      PANEL_W,
      PANEL_H,
      p,
      color,
      0,
      2,
      0.16
    );

    bg.setFill(C.card, 0.94);

    const heading = txt(
      title,
      P ? 22 : 23,
      color,
      [
        x,
        y + PANEL_H * 0.40,
        0
      ],
      true,
      PANEL_W - 0.28
    );

    return new M.VGroup(bg, heading);
  }

  const batchPanel = panelBackground(
    'BATCH PROCESSING',
    BATCH_PANEL_POS,
    C.violet
  );

  const streamPanel = panelBackground(
    'STREAM PROCESSING',
    STREAM_PANEL_POS,
    C.green
  );

  // Miniature fixed list in the batch panel.

  function miniTicket(id, x, y, w = 0.82, h = 0.58) {
    const d = TICKETS[id];
    const color = shopColor(d.shop);

    const bg = rect(
      w,
      h,
      [x, y, 0],
      color,
      0,
      1.5,
      0.07
    );

    bg.setFill(C.card, 0.98);

    const label = txt(
      id,
      18,
      color,
      [x, y + h * 0.25, 0],
      true,
      w - 0.08
    );

    const shop = txt(
      d.shop,
      12,
      color,
      [x, y, 0],
      false,
      w - 0.08
    );

    const money = txt(
      `$${d.amount}`,
      16,
      C.ink,
      [x, y - h * 0.25, 0],
      true,
      w - 0.08
    );

    return new M.VGroup(
      bg,
      label,
      shop,
      money
    );
  }

  function miniBatch() {
    const x = BATCH_PANEL_POS[0];
    const y = BATCH_PANEL_POS[1] + 0.12;

    const spacing = P ? 1.12 : 1.02;

    const cards = BATCH_IDS.map((id, i) =>
      miniTicket(
        id,
        x + (i - 1.5) * spacing,
        y,
        P ? 0.93 : 0.87,
        0.78
      )
    );

    const left =
      x - 1.5 * spacing - 0.58;

    const right =
      x + 1.5 * spacing + 0.58;

    const start = line(
      [left, y - 0.49, 0],
      [left, y + 0.49, 0],
      C.violet,
      3
    );

    const end = line(
      [right, y - 0.49, 0],
      [right, y + 0.49, 0],
      C.violet,
      3
    );

    const startText = txt(
      'START',
      13,
      C.violet,
      [left, y - 0.66, 0],
      true
    );

    const endText = txt(
      'END',
      13,
      C.violet,
      [right, y - 0.66, 0],
      true
    );

    const finished = txt(
      '✓ Fixed list finished',
      20,
      C.green,
      [
        x,
        BATCH_PANEL_POS[1] - PANEL_H * 0.38,
        0
      ],
      false,
      PANEL_W - 0.25
    );

    return new M.VGroup(
      ...cards,
      start,
      end,
      startText,
      endText,
      finished
    );
  }

  const miniBatchPicture = miniBatch();

  // Miniature stream with an open right-hand end.

  function miniStream() {
    const x = STREAM_PANEL_POS[0];
    const y = STREAM_PANEL_POS[1] + 0.12;

    const w = PANEL_W - 0.60;

    const bg = rect(
      w,
      0.42,
      [x, y - 0.31, 0],
      C.muted,
      0.08,
      1.5,
      0.16
    );

    const ids = ['B', 'F', 'G'];

    const spacing = P ? 1.17 : 1.05;

    const cards = ids.map((id, i) =>
      miniTicket(
        id,
        x - 0.44 + (i - 1) * spacing,
        y + 0.04,
        P ? 0.93 : 0.87,
        0.78
      )
    );

    const more = txt(
      '···',
      27,
      C.green,
      [
        x + w / 2 - 0.46,
        y + 0.05,
        0
      ],
      true
    );

    const direction = arrow(
      [
        x + w / 2 - 0.70,
        y - 0.31,
        0
      ],
      [
        x + w / 2 + 0.08,
        y - 0.31,
        0
      ],
      C.green,
      2.6
    );

    const ready = txt(
      '→ Ready for new records',
      20,
      C.green,
      [
        x,
        STREAM_PANEL_POS[1] - PANEL_H * 0.38,
        0
      ],
      false,
      PANEL_W - 0.25
    );

    return new M.VGroup(
      bg,
      ...cards,
      more,
      direction,
      ready
    );
  }

  const miniStreamPicture = miniStream();

  // 41 — Batch processing works through a fixed list and finishes.
  await until(S(41));
  await play(
    ...clearStream(),
    new M.FadeIn(batchPanel),
    new M.FadeIn(miniBatchPicture),
    ...fbox([
      ['Batch: read the fixed list', C.violet],
      ['Reach its end and finish', C.green]
    ], C.violet),
    ...say('BATCH: WORK THROUGH A FIXED LIST', C.violet)
  );

  // 42 — Stream processing stays ready for new records.
  await until(S(42));
  await play(
    new M.FadeIn(streamPanel),
    new M.FadeIn(miniStreamPicture),
    ...fbox([
      ['Stream: read incoming records', C.green],
      ['Stay ready for newly received records']
    ], C.green),
    ...say('STREAM: STAY READY FOR NEW RECORDS', C.green)
  );

  // ------------------------------------------------------------
  // Practical uses.
  // ------------------------------------------------------------

  function useCase(label, p, color) {
    const x = p[0];

    const y = P
      ? p[1] + 0.79
      : p[1] + 0.94;

    const w = PANEL_W - 0.40;

    const bg = rect(
      w,
      0.37,
      [x, y, 0],
      color,
      0.10,
      1.2,
      0.07
    );

    const text = txt(
      label,
      16,
      color,
      [x, y, 0],
      false,
      w - 0.20
    );

    return new M.VGroup(bg, text);
  }

  const batchUse = useCase(
    'Report at a set time each day',
    BATCH_PANEL_POS,
    C.violet
  );

  const streamUse = useCase(
    'Update as new records arrive',
    STREAM_PANEL_POS,
    C.green
  );

  // 43 — Batch is useful for a report at a fixed time each day.
  await until(S(43));
  await play(
    new M.FadeIn(batchUse),
    new M.Indicate(
      miniBatchPicture,
      { color: C.violet }
    ),
    ...fbox([
      ['Example: a daily 6 a.m. report', C.violet]
    ], C.violet),
    ...say('BATCH: REPORTS AT SET TIMES', C.violet)
  );

  // 44 — Stream is useful for updates as new records arrive.
  await until(S(44));
  await play(
    new M.FadeIn(streamUse),
    new M.Indicate(
      miniStreamPicture,
      { color: C.green }
    ),
    ...fbox([
      ['Example: update when each sale arrives', C.green]
    ], C.green),
    ...say('STREAM: UPDATES AS RECORDS ARRIVE', C.green)
  );

  // ------------------------------------------------------------
  // Important limitation.
  //
  // Return to the exact Tuesday 6 a.m. batch.
  //
  // The four received tickets add up to $34.
  // The processing job finished.
  // Ticket B had not arrived at that time.
  //
  // A fixed batch can be fully processed while the underlying
  // business day's data remains incomplete.
  // ------------------------------------------------------------

  const recallTray = trayPicture();

  const recallCards = BATCH_IDS.map((id, i) =>
    ticket(
      id,
      batchSlot(i),
      BATCH_W,
      BATCH_H
    )
  );

  const recallChecks = BATCH_IDS.map((_, i) =>
    readMark(i)
  );

  const recallClock = txt(
    'SNAPSHOT: TUESDAY · 6 a.m.',
    P ? 18 : 19,
    C.ink,
    BATCH_CLOCK_POS,
    true,
    TRAY_W
  );

  const RECALL_POS = P
    ? [0, -2.03, 0]
    : [3.22, 0.45, 0];

  function recallReport() {
    const x = RECALL_POS[0];
    const y = RECALL_POS[1];

    const w = P ? 5.40 : 4.65;
    const h = P ? 1.45 : 1.73;

    const bg = rect(
      w,
      h,
      RECALL_POS,
      C.green,
      0,
      2,
      0.13
    );

    bg.setFill(C.card, 0.96);

    const title = txt(
      'MORNING BATCH REPORT',
      18,
      C.green,
      [x, y + h * 0.34, 0],
      true,
      w - 0.22
    );

    const money = txt(
      `$${BATCH_TOTAL}`,
      36,
      C.green,
      [x, y, 0],
      true,
      w - 0.20
    );

    const count = txt(
      '✓ All four copied tickets processed',
      16,
      C.ink,
      [x, y - h * 0.34, 0],
      false,
      w - 0.25
    );

    return new M.VGroup(
      bg,
      title,
      money,
      count
    );
  }

  const recalledReport = recallReport();

  // 45 — Remember the thirty-four dollars from the morning batch.
  await until(S(45));
  await play(
    ...outs([
      batchPanel,
      streamPanel,
      miniBatchPicture,
      miniStreamPicture,
      batchUse,
      streamUse
    ]),
    new M.FadeIn(recallTray),
    new M.FadeIn(recallClock),
    ...ins(recallCards),
    ...ins(recallChecks),
    new M.FadeIn(recalledReport),
    ...fbox([
      ['$4 + $6 + $10 + $14 = $34', C.green]
    ], C.green),
    ...say('REMEMBER THE $34 MORNING BATCH', C.green)
  );

  const MISSING_POS = P
    ? [0, -3.27, 0]
    : [3.22, -0.97, 0];

  const MISSING_W = P ? 4.65 : 4.65;
  const MISSING_H = P ? 0.63 : 0.56;

  const missingB = ticket(
    'B',
    MISSING_POS,
    MISSING_W,
    MISSING_H
  );

  const missingOutline = rect(
    MISSING_W + 0.10,
    MISSING_H + 0.10,
    MISSING_POS,
    RED,
    0,
    2.3,
    0.10
  );

  const missingLabel = txt(
    'NOT RECEIVED AT 6 a.m.',
    17,
    RED,
    [
      MISSING_POS[0],
      MISSING_POS[1] - MISSING_H / 2 - 0.24,
      0
    ],
    true,
    MISSING_W + 0.25
  );

  // 46 — The fixed list is finished, but Monday's B is missing.
  await until(S(46));
  await play(
    new M.FadeIn(missingB),
    new M.Create(missingOutline),
    new M.FadeIn(missingLabel),
    ...fbox([
      ['All records in the batch were processed', C.green],
      ['But Monday’s ticket B was still missing', RED]
    ], RED),
    ...say('B WAS MISSING FROM THE FINISHED BATCH', RED)
  );

  // 47 — Finishing a batch does not mean every sale has arrived.
  await until(S(47));
  await play(
    new M.Indicate(
      recalledReport,
      { color: C.green }
    ),
    new M.Indicate(
      missingOutline,
      { color: RED }
    ),
    ...fbox([
      ['Finished processing the copied list', C.green],
      ['≠ received every sale', RED]
    ], C.amber),
    ...say('A FINISHED BATCH IS NOT NECESSARILY COMPLETE DATA', C.amber)
  );

  // ------------------------------------------------------------
  // Preview of the next lesson.
  //
  // Show the two times associated with ticket B.
  //
  // Timeline is chronological but schematic, not proportional
  // to elapsed hours.
  // Do not yet calculate the revised Monday sales total.
  // ------------------------------------------------------------

  const TIME_X = P
    ? [-2.45, 0, 2.45]
    : [-4.45, 0, 4.45];

  const TIME_Y = P ? 0.65 : 0.12;

  const timeLine = arrow(
    [
      TIME_X[0] - 0.62,
      TIME_Y,
      0
    ],
    [
      TIME_X[2] + 0.67,
      TIME_Y,
      0
    ],
    C.muted,
    2.5
  );

  function timePoint(i, day, time, label, color) {
    const x = TIME_X[i];

    const marker = circle(
      0.10,
      [x, TIME_Y, 0],
      color,
      1,
      1.6
    );

    const dayText = txt(
      day,
      P ? 18 : 20,
      color,
      [x, TIME_Y + 0.43, 0],
      false,
      P ? 2.10 : 3.20
    );

    const clock = txt(
      time,
      P ? 18 : 20,
      C.ink,
      [x, TIME_Y + 0.78, 0],
      true,
      P ? 2.10 : 3.20
    );

    const note = txt(
      label,
      P ? 17 : 19,
      color,
      [x, TIME_Y - 0.42, 0],
      false,
      P ? 2.13 : 3.25
    );

    return new M.VGroup(
      marker,
      dayText,
      clock,
      note
    );
  }

  const salePoint = timePoint(
    0,
    'Monday',
    '11 a.m.',
    'B sale happens',
    NORTH
  );

  const batchPoint = timePoint(
    1,
    'Tuesday',
    '6 a.m.',
    '$34 batch copy',
    C.violet
  );

  const arrivalPoint = timePoint(
    2,
    'Tuesday',
    '8 a.m.',
    'B arrives',
    NORTH
  );

  const previewTicket = ticket(
    'B',
    [
      0,
      P ? -1.08 : -1.12,
      0
    ],
    P ? 4.90 : 4.80,
    P ? 0.79 : 0.65
  );

  const schematicNote = txt(
    'Order of events — not to scale',
    14,
    C.muted,
    [
      0,
      P ? 2.42 : 1.40,
      0
    ],
    false,
    FW - 0.70
  );

  // 48 — Next lesson: give a late ticket to the correct day.
  await until(S(48));
  await play(
    ...outs([
      recallTray,
      recallClock,
      ...recallCards,
      ...recallChecks,
      recalledReport,
      missingB,
      missingOutline,
      missingLabel
    ]),
    new M.FadeIn(timeLine),
    new M.FadeIn(salePoint),
    new M.FadeIn(batchPoint),
    new M.FadeIn(arrivalPoint),
    new M.FadeIn(previewTicket),
    new M.FadeIn(schematicNote),
    ...fbox([
      ['Sale day and arrival day can differ', C.amber],
      'Next: give the late ticket to the correct day'
    ], C.amber),
    ...say('NEXT: WHICH DAY SHOULD RECEIVE THE LATE SALE?', C.amber)
  );

  // ------------------------------------------------------------
  // Final summary.
  //
  // Fixed tray: known end.
  // Moving belt: remains open.
  //
  // Keep the original ticket identities and dollar amounts.
  // ------------------------------------------------------------

  const finalBatchPanel = panelBackground(
    'BATCH',
    BATCH_PANEL_POS,
    C.violet
  );

  const finalStreamPanel = panelBackground(
    'STREAM',
    STREAM_PANEL_POS,
    C.green
  );

  const finalBatchPicture = miniBatch();
  const finalStreamPicture = miniStream();

  const finalBatchLabel = useCase(
    'Fixed end',
    BATCH_PANEL_POS,
    C.violet
  );

  const finalStreamLabel = useCase(
    'Open for new records',
    STREAM_PANEL_POS,
    C.green
  );

  // 49 — A batch has a fixed end, while a stream stays open.
  await until(S(49));
  await play(
    ...outs([
      timeLine,
      salePoint,
      batchPoint,
      arrivalPoint,
      previewTicket,
      schematicNote
    ]),
    new M.FadeIn(finalBatchPanel),
    new M.FadeIn(finalStreamPanel),
    new M.FadeIn(finalBatchPicture),
    new M.FadeIn(finalStreamPicture),
    new M.FadeIn(finalBatchLabel),
    new M.FadeIn(finalStreamLabel),
    ...fbox([
      ['Batch: a fixed group with a known end', C.violet],
      ['Stream: stays open for new records', C.green]
    ], C.green),
    ...say('BATCH HAS AN END. STREAM STAYS OPEN.', C.green)
  );
}
