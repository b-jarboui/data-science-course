// lesson 21.3.6
// Multimodal grounding: check each claim against its sources.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the approved reference engine API and responsive layout.
// Building silhouettes and door markers are schematic within the
// fixed campus patches. The route distance and positions are exact.
// Browser playback has not been runtime-tested against engine.js.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Fixed chapter data
  // ------------------------------------------------------------

  const CAMPUS = {
    width: 300,
    height: 200,
    patchSize: 100,
    metresPerPatch: 100,
    columns: 3,
    rows: 2,
    north: 'up'
  };

  const PATCHES = [
    { id: 1, row: 0, col: 0, name: 'Pond' },
    { id: 2, row: 0, col: 1, name: 'Library' },
    { id: 3, row: 0, col: 2, name: 'Lab building' },
    { id: 4, row: 1, col: 0, name: 'Cafeteria' },
    { id: 5, row: 1, col: 1, name: 'Main gate' },
    { id: 6, row: 1, col: 2, name: 'Sports hall' }
  ];

  // Map coordinates are in pixels, with (0, 0) at top left.
  // Each pixel represents one metre in the chapter example.
  //
  // Gate:       (150, 200)
  // Front door: (150, 50)
  //
  // Straight north: 200 - 50 = 150 metres.
  //
  // The east-door marker is schematic. No alternative walking
  // distance or route to it is assumed.

  const GATE = [150, 200];
  const FRONT = [150, 50];
  const EAST = [185, 29];

  const ROUTE_METRES = GATE[1] - FRONT[1];

  const NOTICE = [
    'Front door closed for repairs.',
    'Please use the east side door.'
  ];

  const SPOKEN_QUESTION = 'Where is the library?';

  const CLAIMS = [
    'From the main gate, walk north.',
    'Walk straight for about 150 metres.',
    'The cafeteria is on your right.',
    'The library is straight ahead.',
    'Enter by the front door.'
  ];

  const STATUS = [
    'supported',
    'supported',
    'contradicted',
    'supported',
    'contradicted'
  ];

  const EVIDENCE = [
    'Map: the route goes north.',
    'Map: 1.5 squares = 150 m.',
    'Map: the cafeteria is on the left.',
    'Map: the library is straight ahead.',
    'Notice: the front door is closed.'
  ];

  const EXTRA_CLAIM = 'The library opens at eight.';

  const SUPPORTED = STATUS.filter(
    s => s === 'supported'
  ).length;

  const CONTRADICTED = STATUS.filter(
    s => s === 'contradicted'
  ).length;

  const UNSUPPORTED = STATUS.filter(
    s => s === 'unsupported'
  ).length;

  const TOTAL = CLAIMS.length;

  const GROUNDED_SHARE = SUPPORTED / TOTAL;
  const GROUNDED_PERCENT = GROUNDED_SHARE * 100;

  // Checked chapter facts:
  //
  // 1. North from gate          SUPPORTED
  // 2. Straight for 150 m       SUPPORTED
  // 3. Cafeteria on right       CONTRADICTED
  // 4. Library straight ahead   SUPPORTED
  // 5. Enter by front door      CONTRADICTED
  //
  // Original answer:
  //   3 supported, 2 contradicted, 0 unsupported.
  //   Grounded share = 3 / 5 = 0.6 = 60%.
  //
  // Additional hypothetical opening-hours claim:
  //   UNSUPPORTED, not necessarily false.
  //
  // It is not part of the original five-claim calculation.

  const PINK = C.pink || '#F472B6';
  const ORANGE = '#FB923C';
  const YELLOW = '#FDE047';
  const WHITE = '#F8FAFC';
  const MAP_BG = '#101B2B';
  const WATER = '#38BDF8';

  const COLORS = {
    supported: C.green,
    contradicted: PINK,
    unsupported: C.amber
  };

  const SYMBOLS = {
    supported: '✓',
    contradicted: '×',
    unsupported: '?'
  };

  // ------------------------------------------------------------
  // Responsive layout
  //
  // Phone: 8 x 14.22, content from -5.5 to 4.3.
  // Laptop: 14.22 x 8, content from -3.0 to 2.3.
  //
  // Laptop: main picture left, formula box right.
  // Phone: formula box above, main picture below.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const MAIN_W = P ? 6.85 : 7.40;

  const PILL = P
    ? [0, 2.42, 0]
    : [CX, 2.07, 0];

  const BOXP = P
    ? [0, 3.53, 0]
    : [4.3, -0.3, 0];

  const MAP_CY = P ? -0.10 : -0.20;
  const MAP_UNIT = P ? 1.74 : 1.40;

  const CHECK_Y = P ? -3.05 : -2.20;

  const p3 = (x, y) => [x, y, 0];

  const at = (x, y) =>
    p3(CX + x, y);

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  // ------------------------------------------------------------
  // Common visual helpers
  // ------------------------------------------------------------

  function fitText(s, size, color, mono, maxw, p) {
    const t = T(s, size, color, mono);

    const w = t.getWidth();

    if (w > maxw) {
      t.scale(maxw / w);
    }

    t.moveTo(p);

    return t;
  }

  function label(
    s,
    x,
    y,
    color = C.ink,
    size = 19,
    maxw = MAIN_W,
    mono = false
  ) {
    return fitText(
      s, size, color, mono, maxw,
      at(x, y)
    );
  }

  function rounded(
    w, h, p, color,
    fill = C.card,
    opacity = 1,
    sw = 2
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: Math.min(0.15, h / 4),
      color,
      strokeWidth: sw
    });

    r.setFill(fill, opacity);
    r.moveTo(p);

    return r;
  }

  function rect(w, h, p, color, opacity = 1, sw = 1) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: sw
    });

    r.setFill(color, opacity);
    r.moveTo(p);

    return r;
  }

  function line(a, b, color = C.muted, sw = 2) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: sw
    });
  }

  function dot(p, radius, color, opacity = 1) {
    const d = new M.Dot({
      point: p,
      radius,
      color
    });

    d.setFill(color, opacity);

    return d;
  }

  function outline(w, h, p, color = C.amber) {
    return rounded(
      w, h, p,
      color, color, 0, 2.7
    );
  }

  function tag(s, color, p, size = 18, maxw = MAIN_W) {
    const t = pill(s, color, size);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(p);

    return t;
  }

  function arrow(a, b, color = C.amber, sw = 2.8, head = 0.16) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    const len = Math.sqrt(dx * dx + dy * dy);

    if (len < 0.0001) {
      return new M.VGroup();
    }

    const ux = dx / len;
    const uy = dy / len;
    const aw = head * 0.55;

    return new M.VGroup(
      line(a, b, color, sw),

      line(
        b,
        [
          b[0] - ux * head - uy * aw,
          b[1] - uy * head + ux * aw,
          0
        ],
        color,
        sw
      ),

      line(
        b,
        [
          b[0] - ux * head + uy * aw,
          b[1] - uy * head - ux * aw,
          0
        ],
        color,
        sw
      )
    );
  }

  function lag(animations, duration = 1.15, ratio = 0.10) {
    return new M.LaggedStart(
      animations,
      {
        lagRatio: ratio,
        runTime: duration
      }
    );
  }

  // ------------------------------------------------------------
  // Scene-object management
  //
  // Objects are grouped before entering the scene.
  // Already-visible objects are never placed in a new VGroup.
  //
  // Every beat has one awaited play() call, including its pill
  // update and formula-box update.
  // ------------------------------------------------------------

  let active = [];

  function view(next, duration = 0.85) {
    const old = active.filter(o =>
      !next.includes(o)
    );

    const incoming = next.filter(o =>
      !active.includes(o)
    );

    const animations = old.map(o =>
      new M.FadeOut(o)
    );

    if (incoming.length === 1) {
      animations.push(
        new M.FadeIn(incoming[0], {
          runTime: duration
        })
      );
    }

    if (incoming.length > 1) {
      animations.push(
        lag(
          incoming.map(o => new M.FadeIn(o)),
          duration,
          0.08
        )
      );
    }

    active = next.slice();

    return animations;
  }

  // ------------------------------------------------------------
  // Formula / explanation box
  // Reference lesson style, with a height limit for the phone.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 21;
    const lh = P ? 0.35 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw = T(
      '0000000000',
      size,
      C.ink,
      true
    ).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      )
    );

    const wd = Math.max(...widths) + 0.70;
    const ht = rows.length * lh + 0.34;

    const body = rounded(
      wd,
      ht,
      BOXP,
      color,
      C.card,
      0.96,
      2
    );

    const left = BOXP[0] - wd / 2 + 0.35;
    const top = BOXP[1] + ht / 2 - 0.17 - lh / 2;

    texts.forEach((t, i) => {
      const indent = cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      );

      t.moveTo([
        left + indent + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(body, ...texts);

    const maxw = P ? FW - 1.2 : 4.0;
    const maxh = P ? 1.35 : 2.70;

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

  // ------------------------------------------------------------
  // General information panel
  // ------------------------------------------------------------

  function panel(
    p,
    w,
    h,
    title,
    rows,
    accent = C.cyan,
    size = 20,
    centered = true
  ) {
    const parts = [
      rounded(
        w + 0.07,
        h + 0.07,
        p,
        accent,
        accent,
        0.065,
        1
      ),

      rounded(
        w,
        h,
        p,
        accent,
        C.card,
        0.98,
        2
      ),

      fitText(
        title,
        17,
        accent,
        true,
        w - 0.34,
        p3(p[0], p[1] + h / 2 - 0.24)
      )
    ];

    const upper = p[1] + h / 2 - 0.53;
    const lower = p[1] - h / 2 + 0.25;

    rows.forEach((row, k) => {
      const [s, color] = Array.isArray(row)
        ? row
        : [row, C.ink];

      const y = rows.length === 1
        ? (upper + lower) / 2
        : upper -
          k * (upper - lower) / (rows.length - 1);

      const text = T(s, size, color);

      if (text.getWidth() > w - 0.40) {
        text.scale((w - 0.40) / text.getWidth());
      }

      const x = centered
        ? p[0]
        : p[0] - w / 2 + 0.20 + text.getWidth() / 2;

      text.moveTo(p3(x, y));

      parts.push(text);
    });

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Person icon
  // ------------------------------------------------------------

  function person(p, scale = 1, color = WHITE) {
    const head = new M.Circle({
      radius: 0.13 * scale,
      color,
      strokeWidth: 1
    });

    head.setFill(color, 0.95);

    head.moveTo([
      p[0],
      p[1] + 0.22 * scale,
      0
    ]);

    const body = new M.Arc({
      radius: 0.25 * scale,
      startAngle: 0,
      angle: Math.PI,
      color
    });

    body.setFill(color, 0.85);
    body.moveTo(p);

    return new M.VGroup(head, body);
  }

  // ------------------------------------------------------------
  // Campus map
  //
  // Exact patch arrangement:
  //
  //       NORTH
  //         ↑
  //
  //   ┌──────────┬──────────┬──────────┐
  //   │ Pond     │ Library  │ Lab      │
  //   │          │    ●     │ building │
  //   ├──────────┼────│─────┼──────────┤
  //   │ Cafeteria│    │     │ Sports   │
  //   │          │    │     │ hall     │
  //   └──────────┴────●─────┴──────────┘
  //                 Gate
  //
  // Each square is 100 x 100 metres.
  //
  // Map construction preserves its 3:2 aspect ratio.
  // ------------------------------------------------------------

  function makeMap(center, unit, compact = false) {
    const s = unit / 100;

    const w = 300 * s;
    const h = 200 * s;

    const xy = (x, y) => [
      center[0] + (x - 150) * s,
      center[1] + (100 - y) * s,
      0
    ];

    const parts = [];

    const mapBody = new M.Rectangle({
      width: w,
      height: h,
      color: C.muted,
      strokeWidth: 2
    });

    mapBody.setFill(MAP_BG, 1);
    mapBody.moveTo(center);

    parts.push(mapBody);

    // Six equal patches.

    PATCHES.forEach(p => {
      const pp = xy(
        p.col * 100 + 50,
        p.row * 100 + 50
      );

      const patch = new M.Rectangle({
        width: unit,
        height: unit,
        color: C.muted,
        strokeWidth: 1.15
      });

      patch.setFill(
        p.id % 2 ? '#152237' : '#122034',
        0.45
      );

      patch.moveTo(pp);

      parts.push(patch);

      if (!compact) {
        const number = fitText(
          String(p.id),
          11,
          C.muted,
          true,
          0.20,
          xy(
            p.col * 100 + 9,
            p.row * 100 + 9
          )
        );

        parts.push(number);
      }
    });

    function building(
      x,
      y,
      bw,
      bh,
      color,
      name,
      fontSize = 16
    ) {
      const p = xy(x, y);

      const glow = rounded(
        (bw + 5) * s,
        (bh + 5) * s,
        p,
        color,
        color,
        0.13,
        1
      );

      const body = rounded(
        bw * s,
        bh * s,
        p,
        color,
        color,
        0.19,
        compact ? 1.5 : 2.1
      );

      const lines = Array.isArray(name)
        ? name
        : [name];

      const texts = lines.map((v, k) =>
        fitText(
          v,
          fontSize,
          color,
          false,
          bw * s - 0.10,
          [
            p[0],
            p[1] +
              ((lines.length - 1) / 2 - k) *
              Math.min(0.19, bh * s / 3),
            0
          ]
        )
      );

      return new M.VGroup(
        glow,
        body,
        ...texts
      );
    }

    // Patch 1: pond.

    const pondCenter = xy(50, 49);

    const pond = new M.Circle({
      radius: 28 * s,
      color: WATER,
      strokeWidth: 1.7
    });

    pond.setFill(WATER, 0.16);
    pond.moveTo(pondCenter);

    const pondRipple = new M.Circle({
      radius: 19 * s,
      color: WATER,
      strokeWidth: 1
    });

    pondRipple.setFill(WATER, 0.04);
    pondRipple.moveTo(pondCenter);

    const pondLabel = fitText(
      'Pond',
      compact ? 14 : 16,
      WATER,
      false,
      0.70 * unit,
      pondCenter
    );

    parts.push(
      pond,
      pondRipple,
      pondLabel
    );

    // Patch 2: library.
    //
    // Building extends from y = 8 to y = 50.
    // The front-door marker is exactly at y = 50.

    const library = building(
      150, 29,
      70, 42,
      C.cyan,
      'Library',
      compact ? 14 : 17
    );

    library.submobjects[library.submobjects.length - 1].shift([-7 * s, 3.5 * s, 0]);

    parts.push(library);

    const frontDoor = rect(
      12 * s,
      5 * s,
      xy(...FRONT),
      WHITE,
      1,
      1
    );

    const eastDoor = rect(
      5 * s,
      12 * s,
      xy(...EAST),
      WHITE,
      0.86,
      1
    );

    parts.push(frontDoor, eastDoor);

    // Patch 3: lab building.

    parts.push(
      building(
        250, 49,
        74, 48,
        C.violet,
        ['Lab', 'building'],
        compact ? 13 : 16
      )
    );

    // Patch 4: cafeteria, left of the main gate.

    parts.push(
      building(
        50, 149,
        78, 49,
        ORANGE,
        'Cafeteria',
        compact ? 13 : 16
      )
    );

    // Patch 6: sports hall.

    parts.push(
      building(
        250, 149,
        76, 48,
        C.green,
        ['Sports', 'hall'],
        compact ? 13 : 16
      )
    );

    // Patch 5: gate, at the bottom edge of the map.

    const gateLeft = xy(138, 200);
    const gateRight = xy(162, 200);

    const gateBar = line(
      gateLeft,
      gateRight,
      WHITE,
      3
    );

    const gatePillar1 = rect(
      5 * s,
      12 * s,
      xy(138, 194),
      WHITE,
      0.95,
      1
    );

    const gatePillar2 = rect(
      5 * s,
      12 * s,
      xy(162, 194),
      WHITE,
      0.95,
      1
    );

    const gateLabel = fitText(
      'Main gate',
      compact ? 13 : 16,
      WHITE,
      false,
      unit * 0.87,
      xy(150, 180)
    );

    parts.push(
      gateBar,
      gatePillar1,
      gatePillar2,
      gateLabel
    );

    // The map base and the yellow route are separate objects.
    // Both are constructed before being displayed.

    const route = new M.VGroup(
      line(
        xy(...GATE),
        xy(...FRONT),
        '#786A1C',
        compact ? 5 : 8
      ),

      line(
        xy(...GATE),
        xy(...FRONT),
        YELLOW,
        compact ? 2.2 : 3.8
      ),

      dot(
        xy(...GATE),
        compact ? 0.035 : 0.055,
        YELLOW
      ),

      dot(
        xy(...FRONT),
        compact ? 0.035 : 0.060,
        YELLOW
      )
    );

    const base = new M.VGroup(...parts);

    return {
      base,
      route,
      xy,
      center,
      unit,
      width: w,
      height: h
    };
  }

  function completeMap(center, unit, compact = false) {
    // These are fresh objects, not objects already on screen.

    const m = makeMap(center, unit, compact);

    return new M.VGroup(
      m.base,
      m.route
    );
  }

  const campus = makeMap(
    at(0, MAP_CY),
    MAP_UNIT
  );

  const mp = campus.xy;

  const mapLeft = CX - campus.width / 2;
  const mapRight = CX + campus.width / 2;

  const mapTop = MAP_CY + campus.height / 2;
  const mapBottom = MAP_CY - campus.height / 2;

  // North arrow, outside the map.

  const northX = mapLeft - 0.36;

  const northArrow = new M.VGroup(
    arrow(
      p3(northX, mapTop - 0.80),
      p3(northX, mapTop - 0.16),
      WHITE,
      2.5,
      0.13
    ),

    fitText(
      'N',
      18,
      WHITE,
      true,
      0.30,
      p3(northX, mapTop + 0.05)
    )
  );

  // One-square scale marker, exactly 100 metres.

  const scaleX = mapRight + 0.34;

  const scaleMarker = new M.VGroup(
    line(
      p3(scaleX, mapTop),
      p3(scaleX, mapTop - MAP_UNIT),
      C.ink,
      1.6
    ),

    line(
      p3(scaleX - 0.09, mapTop),
      p3(scaleX + 0.09, mapTop),
      C.ink,
      1.6
    ),

    line(
      p3(scaleX - 0.09, mapTop - MAP_UNIT),
      p3(scaleX + 0.09, mapTop - MAP_UNIT),
      C.ink,
      1.6
    ),

    fitText(
      '100',
      14,
      C.ink,
      true,
      0.38,
      p3(scaleX + 0.29, mapTop - MAP_UNIT / 2 + 0.09)
    ),

    fitText(
      'm',
      13,
      C.ink,
      true,
      0.25,
      p3(scaleX + 0.29, mapTop - MAP_UNIT / 2 - 0.12)
    )
  );

  const mapDimension = label(
    'Each square = 100 m × 100 m',
    0,
    P ? -2.10 : -1.89,
    C.muted,
    17
  );

  const routeDistance = new M.VGroup(
    line(
      mp(198, 50),
      mp(198, 200),
      YELLOW,
      1.7
    ),

    line(
      mp(193, 50),
      mp(203, 50),
      YELLOW,
      1.7
    ),

    line(
      mp(193, 200),
      mp(203, 200),
      YELLOW,
      1.7
    ),

    tag(
      '150 m',
      YELLOW,
      mp(205, 126),
      15,
      0.88
    )
  );

  // A separate overlay shows one complete square and half
  // another square along the yellow route.

  const squareMeasure = new M.VGroup(
    rounded(
      0.22,
      MAP_UNIT,
      mp(174, 150),
      YELLOW,
      YELLOW,
      0.12,
      1.5
    ),

    rounded(
      0.22,
      MAP_UNIT * 0.5,
      mp(174, 75),
      YELLOW,
      YELLOW,
      0.12,
      1.5
    ),

    fitText(
      '100 m',
      14,
      YELLOW,
      true,
      0.80,
      mp(188, 150)
    ),

    fitText(
      '50 m',
      14,
      YELLOW,
      true,
      0.72,
      mp(188, 75)
    )
  );

  const MAP_OBJECTS = [
    campus.base,
    campus.route,
    northArrow
  ];

  // ------------------------------------------------------------
  // Notice photo representation
  //
  // The posted text is reproduced word for word.
  // The frame depicts a photo of the notice on the library door.
  // ------------------------------------------------------------

  function noticePhoto(p, w, h, highlight = null, compact = false) {
    const photo = rounded(
      w,
      h,
      p,
      C.muted,
      '#263344',
      1,
      2
    );

    const door = rounded(
      w * 0.86,
      h * 0.84,
      p3(p[0], p[1] - h * 0.025),
      '#53657B',
      '#1B293B',
      0.95,
      1.5
    );

    const photoTitle = fitText(
      'PHOTO OF DOOR NOTICE',
      compact ? 14 : 17,
      C.ink,
      true,
      w - 0.35,
      p3(
        p[0],
        p[1] + h / 2 - (compact ? 0.16 : 0.25)
      )
    );

    const paperW = w * 0.80;
    const paperH = h * 0.51;

    const paperP = p3(
      p[0],
      p[1] + h * 0.025
    );

    const paper = rounded(
      paperW,
      paperH,
      paperP,
      '#D5DEE7',
      '#F1F5F9',
      1,
      1
    );

    const textColor = '#182435';

    const y1 = paperP[1] + paperH * 0.20;
    const y2 = paperP[1] - paperH * 0.20;

    const first = fitText(
      NOTICE[0],
      compact ? 17 : 23,
      textColor,
      false,
      paperW - 0.24,
      p3(p[0], y1)
    );

    const second = fitText(
      NOTICE[1],
      compact ? 17 : 23,
      textColor,
      false,
      paperW - 0.24,
      p3(p[0], y2)
    );

    const handle = rect(
      w * 0.08,
      h * 0.035,
      p3(
        p[0] + w * 0.32,
        p[1] - h * 0.35
      ),
      '#9CAFC5',
      0.85,
      1
    );

    const parts = [
      photo,
      door,
      photoTitle,
      paper
    ];

    if (highlight === 0 || highlight === 'both') {
      parts.push(
        rounded(
          paperW - 0.13,
          paperH * 0.32,
          p3(p[0], y1),
          '#DC2626',
          '#FCA5A5',
          0.48,
          1.4
        )
      );
    }

    if (highlight === 1 || highlight === 'both') {
      parts.push(
        rounded(
          paperW - 0.13,
          paperH * 0.32,
          p3(p[0], y2),
          '#15803D',
          '#86EFAC',
          0.48,
          1.4
        )
      );
    }

    parts.push(
      first,
      second,
      handle
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Compact source pair
  //
  // All miniatures are newly constructed before grouping.
  // Map source = cyan.
  // Notice source = amber.
  // ------------------------------------------------------------

  function sourcePair(y = -0.20, scale = 1) {
    const x1 = CX - 1.76;
    const x2 = CX + 1.76;

    const w = 3.17 * scale;
    const h = (P ? 2.65 : 2.45) * scale;

    const mapP = p3(x1, y);
    const noticeP = p3(x2, y);

    const mapPanel = rounded(
      w, h, mapP,
      C.cyan, C.card, 0.96, 2
    );

    const photoPanel = rounded(
      w, h, noticeP,
      C.amber, C.card, 0.96, 2
    );

    const mapTitle = fitText(
      'SOURCE 1 · MAP',
      16,
      C.cyan,
      true,
      w - 0.23,
      p3(x1, y + h / 2 - 0.25)
    );

    const photoTitle = fitText(
      'SOURCE 2 · NOTICE',
      16,
      C.amber,
      true,
      w - 0.23,
      p3(x2, y + h / 2 - 0.25)
    );

    const miniMap = completeMap(
      p3(x1, y - 0.10),
      0.85 * scale,
      true
    );

    const miniNotice = noticePhoto(
      p3(x2, y - 0.10),
      w - 0.24,
      h - 0.68,
      null,
      true
    );

    const mapSource = new M.VGroup(
      mapPanel,
      mapTitle,
      miniMap
    );

    const noticeSource = new M.VGroup(
      photoPanel,
      photoTitle,
      miniNotice
    );

    return {
      map: mapSource,
      notice: noticeSource,
      objects: [mapSource, noticeSource]
    };
  }

  // ------------------------------------------------------------
  // Claim checking panels
  // ------------------------------------------------------------

  function checkStrip(
    index,
    verdict = null,
    corrected = null,
    y = CHECK_Y
  ) {
    const h = P ? 0.98 : 0.76;
    const w = MAIN_W;

    const p = at(0, y);

    const color = verdict
      ? COLORS[verdict]
      : C.cyan;

    const body = rounded(
      w, h, p,
      color, C.card, 0.98, 2
    );

    const n = fitText(
      String(index + 1),
      20,
      color,
      true,
      0.30,
      p3(
        p[0] - w / 2 + 0.30,
        p[1] + (P ? 0.22 : 0.15)
      )
    );

    const claimText = fitText(
      corrected || CLAIMS[index],
      P ? 21 : 19,
      C.ink,
      false,
      w - 0.95,
      p3(
        p[0] + 0.18,
        p[1] + (P ? 0.22 : 0.15)
      )
    );

    const statusText = fitText(
      verdict
        ? `${SYMBOLS[verdict]}  ${verdict.toUpperCase()}`
        : 'CHECK AGAINST THE SOURCE',
      16,
      color,
      true,
      w - 0.45,
      p3(
        p[0],
        p[1] - (P ? 0.26 : 0.20)
      )
    );

    return new M.VGroup(
      body,
      n,
      claimText,
      statusText
    );
  }

  function claimRow(index, mode = 'plain', corrected = null) {
    const w = MAIN_W - 0.08;

    const h = P ? 0.75 : 0.52;
    const sp = P ? 0.92 : 0.65;

    const top = P ? 1.13 : 0.99;

    const y = top - index * sp;
    const p = at(0, y);

    const status = STATUS[index];

    const marked = mode === 'checked' || mode === 'corrected';

    const color = mode === 'corrected'
      ? C.green
      : marked
        ? COLORS[status]
        : C.muted;

    const body = rounded(
      w,
      h,
      p,
      color,
      C.card,
      mode === 'empty' ? 0.32 : 0.97,
      marked ? 2 : 1.2
    );

    const num = fitText(
      String(index + 1),
      18,
      marked ? color : C.cyan,
      true,
      0.28,
      p3(p[0] - w / 2 + 0.29, y)
    );

    const parts = [body, num];

    if (mode === 'empty') {
      parts.push(
        rect(
          w - 1.20,
          0.035,
          p3(p[0] + 0.15, y),
          C.muted,
          0.23,
          0
        )
      );

      return new M.VGroup(...parts);
    }

    const s = corrected || CLAIMS[index];

    const text = T(
      s,
      P ? 20 : 19,
      C.ink
    );

    const available = marked
      ? w - 1.50
      : w - 0.80;

    if (text.getWidth() > available) {
      text.scale(available / text.getWidth());
    }

    const left = p[0] - w / 2 + 0.58;

    text.moveTo([
      left + text.getWidth() / 2,
      y,
      0
    ]);

    parts.push(text);

    if (marked) {
      const glyph = mode === 'corrected'
        ? '✓'
        : SYMBOLS[status];

      const mark = fitText(
        glyph,
        24,
        color,
        false,
        0.45,
        p3(
          p[0] + w / 2 - 0.34,
          y
        )
      );

      parts.push(mark);
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // 0. Visitor at the main gate asks for the library.
  // ------------------------------------------------------------

  const questionPanel = panel(
    at(0, P ? -3.20 : -2.19),
    MAIN_W,
    P ? 1.13 : 0.83,
    'VISITOR',
    ['How do I get to the library?'],
    C.cyan,
    23
  );

  const visitor = person(
    mp(150, 150),
    P ? 0.76 : 0.66,
    WHITE
  );

  const visitorHalo = new M.Circle({
    radius: P ? 0.29 : 0.23,
    color: WHITE,
    strokeWidth: 2
  });

  visitorHalo.setFill(WHITE, 0.07);
  visitorHalo.moveTo(mp(150, 147));

  await until(S(0));

  await play(
    ...view([
      campus.base,
      visitorHalo,
      visitor,
      questionPanel
    ], 1.55),

    ...fbox([
      ['Start: main gate', C.ink],
      ['Destination: library', C.cyan]
    ]),

    ...say('HOW DO I GET TO THE LIBRARY?')
  );

  // ------------------------------------------------------------
  // 1-3. Introduce the two sources.
  // ------------------------------------------------------------

  const sources = sourcePair(
    P ? -0.52 : -0.22
  );

  const sourceDefinition = label(
    'A source is where information comes from.',
    0,
    P ? -2.70 : -1.92,
    C.ink,
    20
  );

  // 1. The guide has two sources.

  await until(S(1));

  await play(
    ...view([
      ...sources.objects,
      sourceDefinition
    ], 1.30),

    ...fbox([
      ['SOURCE', C.amber],
      ['Where information', C.ink],
      ['comes from.', C.ink]
    ], C.amber),

    ...say('THE GUIDE HAS TWO SOURCES', C.amber)
  );

  // 2. Source one is the campus map.

  const mapSourceOutline = outline(
    3.27,
    P ? 2.77 : 2.57,
    at(-1.76, P ? -0.52 : -0.22),
    C.cyan
  );

  await until(S(2));

  await play(
    ...view([
      ...sources.objects,
      sourceDefinition,
      mapSourceOutline
    ]),

    ...fbox([
      ['SOURCE 1', C.cyan],
      ['Campus map', C.ink],
      ['Yellow marked route', YELLOW]
    ], C.cyan),

    ...say('SOURCE ONE: THE CAMPUS MAP', C.cyan)
  );

  // 3. Source two is a photo of the notice.

  const noticeSourceOutline = outline(
    3.27,
    P ? 2.77 : 2.57,
    at(1.76, P ? -0.52 : -0.22),
    C.amber
  );

  await until(S(3));

  await play(
    ...view([
      ...sources.objects,
      sourceDefinition,
      noticeSourceOutline
    ]),

    ...fbox([
      ['SOURCE 2', C.amber],
      ['A photo of the notice', C.ink],
      ['on the library door.', C.ink]
    ], C.amber),

    ...say('SOURCE TWO: THE POSTED NOTICE', C.amber)
  );

  // ------------------------------------------------------------
  // 4-6. Inspect the actual evidence.
  // ------------------------------------------------------------

  // 4. North is up. Each square is 100 metres wide.

  const onePatch = outline(
    MAP_UNIT - 0.025,
    MAP_UNIT - 0.025,
    mp(250, 150),
    C.amber
  );

  await until(S(4));

  await play(
    ...view([
      campus.base,
      northArrow,
      scaleMarker,
      mapDimension,
      onePatch
    ], 1.20),

    ...fbox([
      ['North = up', C.ink],
      ['1 square = 100 m', C.amber]
    ], C.amber),

    ...say('NORTH IS UP · ONE SQUARE IS 100 METRES', C.amber)
  );

  // 5. The yellow route goes straight north for 150 metres.

  const routeNorth = arrow(
    mp(150, 155),
    mp(150, 115),
    YELLOW,
    3.5,
    0.20
  );

  const frontDoorLabel = fitText(
    'Front door',
    15,
    YELLOW,
    false,
    1.40,
    mp(119, 65)
  );

  await until(S(5));

  await play(
    ...view([
      ...MAP_OBJECTS,
      routeNorth,
      routeDistance,
      frontDoorLabel,
      mapDimension
    ], 1.75),

    ...fbox([
      ['Gate → library', YELLOW],
      ['Straight north', C.ink],
      [`Distance = ${ROUTE_METRES} m`, C.amber]
    ], C.amber),

    ...say('THE YELLOW ROUTE IS 150 METRES NORTH', YELLOW)
  );

  // 6. Read the notice exactly.

  const fullNotice = noticePhoto(
    at(0, P ? -0.48 : -0.16),
    P ? 6.55 : 6.60,
    P ? 4.15 : 3.00,
    'both'
  );

  const noticeMeaning = tag(
    'FRONT CLOSED · USE EAST SIDE',
    C.green,
    at(0, P ? -3.04 : -1.98),
    18
  );

  await until(S(6));

  await play(
    ...view([
      fullNotice,
      noticeMeaning
    ], 1.35),

    ...fbox([
      ['Front door: CLOSED', PINK],
      ['East side door: USE', C.green]
    ], C.amber),

    ...say('READ THE NOTICE ON THE LIBRARY DOOR', C.amber)
  );

  // ------------------------------------------------------------
  // 7-14. Reveal the guide's five claims, line by line.
  //
  // Do not mark any claim as correct or incorrect until the
  // evidence-checking stage.
  // ------------------------------------------------------------

  const answerHeading = label(
    'THE CAMPUS GUIDE’S ANSWER',
    0,
    P ? 1.83 : 1.50,
    C.cyan,
    21
  );

  const emptyRows = CLAIMS.map((_, i) =>
    claimRow(i, 'empty')
  );

  const plainRows = CLAIMS.map((_, i) =>
    claimRow(i, 'plain')
  );

  function answerObjects(revealedCount) {
    return [
      answerHeading,

      ...CLAIMS.map((_, i) =>
        i < revealedCount
          ? plainRows[i]
          : emptyRows[i]
      )
    ];
  }

  // 7. The guide's answer sounds smooth and friendly.

  await until(S(7));

  await play(
    ...view(
      answerObjects(0),
      1.10
    ),

    ...fbox([
      ['A friendly answer', C.cyan],
      ['Five statements', C.ink]
    ]),

    ...say('HERE IS THE GUIDE’S ANSWER')
  );

  // 8. Claim one.

  await until(S(8));

  await play(
    ...view(answerObjects(1)),

    ...fbox([
      ['Claim 1', C.cyan],
      ['Walk north.', C.ink]
    ]),

    ...say('1 · WALK NORTH')
  );

  // 9. Claim two.

  await until(S(9));

  await play(
    ...view(answerObjects(2)),

    ...fbox([
      ['Claim 2', C.cyan],
      ['Straight for 150 m.', C.ink]
    ]),

    ...say('2 · WALK STRAIGHT FOR 150 METRES')
  );

  // 10. Claim three.

  await until(S(10));

  await play(
    ...view(answerObjects(3)),

    ...fbox([
      ['Claim 3', C.cyan],
      ['Cafeteria on right.', C.ink]
    ]),

    ...say('3 · THE CAFETERIA IS ON YOUR RIGHT')
  );

  // 11. Claim four.

  await until(S(11));

  await play(
    ...view(answerObjects(4)),

    ...fbox([
      ['Claim 4', C.cyan],
      ['Library straight ahead.', C.ink]
    ]),

    ...say('4 · THE LIBRARY IS STRAIGHT AHEAD')
  );

  // 12. Claim five.

  await until(S(12));

  await play(
    ...view(answerObjects(5)),

    ...fbox([
      ['Claim 5', C.cyan],
      ['Enter the front door.', C.ink]
    ]),

    ...say('5 · ENTER BY THE FRONT DOOR')
  );

  // 13. Would you follow the answer?

  const checkFirstTag = tag(
    'CHECK IT FIRST',
    C.amber,
    at(0, P ? -4.02 : -2.07),
    21
  );

  await until(S(13));

  await play(
    ...view([
      ...answerObjects(5),
      checkFirstTag
    ]),

    ...fbox([
      ['Sounds reasonable.', C.ink],
      ['But is it correct?', C.amber]
    ], C.amber),

    ...say('WOULD YOU FOLLOW THESE DIRECTIONS?', C.amber)
  );

  // 14. Each line is a claim that can be checked.

  const claimHighlights = CLAIMS.map((_, i) =>
    outline(
      MAIN_W + 0.015,
      P ? 0.80 : 0.57,
      at(
        0,
        (P ? 1.13 : 0.99) -
          i * (P ? 0.92 : 0.65)
      ),
      C.amber
    )
  );

  const claimDefinition = label(
    'One claim = one checkable statement',
    0,
    P ? -4.20 : -2.03,
    C.amber,
    19
  );

  await until(S(14));

  await play(
    ...view([
      ...answerObjects(5),
      claimDefinition,
      ...claimHighlights
    ], 1.50),

    ...fbox([
      ['CLAIM', C.amber],
      ['One small statement', C.ink],
      ['that can be checked.', C.ink]
    ], C.amber),

    ...say('EACH LINE IS ONE CLAIM', C.amber)
  );

  // ------------------------------------------------------------
  // 15-18. Three possible evidence-checking labels.
  //
  // Supported: evidence agrees.
  // Contradicted: evidence shows the opposite.
  // Unsupported: evidence does not answer the claim.
  // ------------------------------------------------------------

  const VERDICTS = [
    'supported',
    'contradicted',
    'unsupported'
  ];

  function verdictCard(k, revealed = false) {
    const status = VERDICTS[k];

    const color = revealed
      ? COLORS[status]
      : C.muted;

    const p = P
      ? at(0, 0.98 - k * 1.83)
      : at((k - 1) * 2.43, -0.10);

    const w = P ? 6.25 : 2.24;
    const h = P ? 1.52 : 2.88;

    const body = rounded(
      w, h, p,
      color, C.card, 0.98, 2
    );

    const symbol = fitText(
      revealed ? SYMBOLS[status] : String(k + 1),
      42,
      color,
      false,
      P ? 0.72 : 0.85,

      P
        ? p3(p[0] - 2.40, p[1])
        : p3(p[0], p[1] + 0.85)
    );

    const title = fitText(
      status.toUpperCase(),
      P ? 22 : 19,
      color,
      true,
      P ? 4.65 : w - 0.20,

      P
        ? p3(p[0] + 0.35, p[1] + 0.40)
        : p3(p[0], p[1] + 0.18)
    );

    const desc = [
      ['A source shows it.'],
      ['A source shows', 'the opposite.'],
      ['No source says', 'anything about it.']
    ][k];

    const parts = [
      body,
      symbol,
      title
    ];

    if (revealed) {
      desc.forEach((s, j) => {
        const text = fitText(
          s,
          18,
          C.ink,
          false,
          P ? 4.65 : w - 0.22,

          P
            ? p3(
                p[0] + 0.35,
                p[1] - 0.11 - j * 0.33
              )
            : p3(
                p[0],
                p[1] - 0.40 - j * 0.32
              )
        );

        parts.push(text);
      });
    }

    return new M.VGroup(...parts);
  }

  const verdictEmpty = VERDICTS.map((_, k) =>
    verdictCard(k, false)
  );

  const verdictFull = VERDICTS.map((_, k) =>
    verdictCard(k, true)
  );

  function verdictObjects(n) {
    return VERDICTS.map((_, k) =>
      k < n ? verdictFull[k] : verdictEmpty[k]
    );
  }

  // 15. Give each claim one of three labels.

  await until(S(15));

  await play(
    ...view(
      verdictObjects(0),
      1.00
    ),

    ...fbox([
      ['Check each claim.', C.ink],
      ['Assign one label.', C.amber]
    ], C.amber),

    ...say('THREE POSSIBLE LABELS', C.amber)
  );

  // 16. Supported.

  await until(S(16));

  await play(
    ...view(verdictObjects(1)),

    ...fbox([
      ['SUPPORTED ✓', C.green],
      ['A source shows it.', C.ink]
    ], C.green),

    ...say('SUPPORTED: THE EVIDENCE AGREES', C.green)
  );

  // 17. Contradicted.

  await until(S(17));

  await play(
    ...view(verdictObjects(2)),

    ...fbox([
      ['CONTRADICTED ×', PINK],
      ['A source shows', C.ink],
      ['the opposite.', C.ink]
    ], PINK),

    ...say('CONTRADICTED: THE EVIDENCE DISAGREES', PINK)
  );

  // 18. Unsupported.

  await until(S(18));

  await play(
    ...view(verdictObjects(3)),

    ...fbox([
      ['UNSUPPORTED ?', C.amber],
      ['No source answers', C.ink],
      ['this claim.', C.ink]
    ], C.amber),

    ...say('UNSUPPORTED: NO EVIDENCE GIVEN', C.amber)
  );

  // ------------------------------------------------------------
  // 19-26. Check all five original claims against the sources.
  // ------------------------------------------------------------

  // 19. Claim one: walk north.
  //
  // Highlight the northward direction directly on the map.

  const northwardEvidence = arrow(
    mp(150, 169),
    mp(150, 112),
    C.green,
    4,
    0.19
  );

  const gateFocus = new M.Circle({
    radius: P ? 0.24 : 0.20,
    color: C.green,
    strokeWidth: 2.6
  });

  gateFocus.setFill(C.green, 0);
  gateFocus.moveTo(mp(...GATE));

  const claim1Check = checkStrip(
    0,
    'supported'
  );

  await until(S(19));

  await play(
    ...view([
      ...MAP_OBJECTS,
      northwardEvidence,
      gateFocus,
      claim1Check
    ], 1.45),

    ...fbox([
      ['Claim 1', C.ink],
      ['Up on map = north', C.cyan],
      ['Route goes up', YELLOW],
      ['SUPPORTED ✓', C.green]
    ], C.green),

    ...say('CLAIM ONE: WALK NORTH — SUPPORTED', C.green)
  );

  // 20. Claim two: one and a half squares = 150 metres.

  const claim2Check = checkStrip(
    1,
    'supported'
  );

  await until(S(20));

  await play(
    ...view([
      ...MAP_OBJECTS,
      squareMeasure,
      scaleMarker,
      claim2Check
    ], 1.50),

    ...fbox([
      ['1 square = 100 m', C.ink],
      ['½ square = 50 m', C.ink],
      ['100 + 50 = 150 m', YELLOW],
      ['SUPPORTED ✓', C.green]
    ], C.green),

    ...say('CLAIM TWO: 150 METRES — SUPPORTED', C.green)
  );

  // ------------------------------------------------------------
  // 21-23. Work out left and right from the visitor's viewpoint.
  // ------------------------------------------------------------

  const facingP = mp(150, 171);

  function facingNorth(p) {
    const scale = P ? 1 : 0.85;

    const head = new M.Circle({
      radius: 0.095 * scale,
      color: WHITE,
      strokeWidth: 1
    });

    head.setFill(WHITE, 1);

    head.moveTo([
      p[0],
      p[1] + 0.17 * scale,
      0
    ]);

    const body = line(
      p3(p[0], p[1] + 0.07 * scale),
      p3(p[0], p[1] - 0.20 * scale),
      WHITE,
      4
    );

    const arms = line(
      p3(p[0] - 0.26 * scale, p[1]),
      p3(p[0] + 0.26 * scale, p[1]),
      WHITE,
      3
    );

    const leftLeg = line(
      p3(p[0], p[1] - 0.18 * scale),
      p3(
        p[0] - 0.11 * scale,
        p[1] - 0.33 * scale
      ),
      WHITE,
      3
    );

    const rightLeg = line(
      p3(p[0], p[1] - 0.18 * scale),
      p3(
        p[0] + 0.11 * scale,
        p[1] - 0.33 * scale
      ),
      WHITE,
      3
    );

    const forward = arrow(
      p3(p[0], p[1] + 0.31 * scale),
      p3(p[0], p[1] + 0.76 * scale),
      C.cyan,
      3,
      0.13
    );

    return new M.VGroup(
      head,
      body,
      arms,
      leftLeg,
      rightLeg,
      forward
    );
  }

  const facingVisitor = facingNorth(facingP);

  const facingTag = tag(
    'FACING NORTH',
    C.cyan,
    mp(150, 111),
    15,
    1.35
  );

  const claim3Question = checkStrip(
    2
  );

  // 21. Imagine yourself at the gate, facing north.

  await until(S(21));

  await play(
    ...view([
      ...MAP_OBJECTS,
      facingVisitor,
      facingTag,
      claim3Question
    ], 1.25),

    ...fbox([
      ['Stand at the gate.', C.ink],
      ['Face north.', C.cyan],
      ['Now check left/right.', C.amber]
    ], C.amber),

    ...say('CLAIM THREE: FACE NORTH FIRST', C.amber)
  );

  // 22. The right hand points to the right of the map.

  const rightHandArrow = arrow(
    mp(167, 171),
    mp(225, 171),
    PINK,
    3.6,
    0.18
  );

  const rightHandLabel = fitText(
    'RIGHT',
    17,
    PINK,
    true,
    0.90,
    mp(217, 190)
  );

  await until(S(22));

  await play(
    ...view([
      ...MAP_OBJECTS,
      facingVisitor,
      facingTag,
      rightHandArrow,
      rightHandLabel,
      claim3Question
    ]),

    ...fbox([
      ['Facing north:', C.cyan],
      ['Right hand → east', PINK],
      ['Right side of map', C.ink]
    ], C.amber),

    ...say('YOUR RIGHT HAND POINTS RIGHT ON THE MAP', C.amber)
  );

  // 23. The cafeteria is actually on the left.

  const leftHandArrow = arrow(
    mp(133, 171),
    mp(75, 171),
    ORANGE,
    3.6,
    0.18
  );

  const leftHandLabel = fitText(
    'LEFT',
    17,
    ORANGE,
    true,
    0.90,
    mp(83, 190)
  );

  const cafeteriaFocus = outline(
    MAP_UNIT - 0.055,
    MAP_UNIT - 0.055,
    mp(50, 150),
    ORANGE
  );

  const claim3Check = checkStrip(
    2,
    'contradicted'
  );

  await until(S(23));

  await play(
    ...view([
      ...MAP_OBJECTS,
      facingVisitor,
      rightHandArrow,
      rightHandLabel,
      leftHandArrow,
      leftHandLabel,
      cafeteriaFocus,
      claim3Check
    ], 1.25),

    ...fbox([
      ['Claim: cafeteria RIGHT', PINK],
      ['Map: cafeteria LEFT', ORANGE],
      ['CONTRADICTED ×', PINK]
    ], PINK),

    ...say('THE CAFETERIA IS ON YOUR LEFT', PINK)
  );

  // 24. Claim four: the library is straight ahead.

  const libraryFocus = outline(
    0.88 * MAP_UNIT,
    0.64 * MAP_UNIT,
    mp(150, 29),
    C.cyan
  );

  const straightAhead = arrow(
    mp(150, 150),
    mp(150, 70),
    C.green,
    3.8,
    0.19
  );

  const claim4Check = checkStrip(
    3,
    'supported'
  );

  await until(S(24));

  await play(
    ...view([
      ...MAP_OBJECTS,
      libraryFocus,
      straightAhead,
      claim4Check
    ], 1.10),

    ...fbox([
      ['Claim 4', C.ink],
      ['Library straight ahead.', C.cyan],
      ['Map agrees.', C.ink],
      ['SUPPORTED ✓', C.green]
    ], C.green),

    ...say('CLAIM FOUR: LIBRARY AHEAD — SUPPORTED', C.green)
  );

  // ------------------------------------------------------------
  // 25-26. Check the door claim against the second source.
  //
  // A visible door on a map does not prove it is usable.
  // The posted notice explicitly contradicts the advice.
  // ------------------------------------------------------------

  function doorMapPicture(p, corrected = false) {
    const unit = P ? 0.89 : 0.92;

    const m = makeMap(
      p,
      unit,
      true
    );

    const fp = m.xy(...FRONT);
    const ep = m.xy(...EAST);

    const frontRing = new M.Circle({
      radius: 0.105,
      color: PINK,
      strokeWidth: 2.2
    });

    frontRing.setFill(PINK, 0.10);
    frontRing.moveTo(fp);

    const cross = new M.VGroup(
      line(
        p3(fp[0] - 0.08, fp[1] - 0.08),
        p3(fp[0] + 0.08, fp[1] + 0.08),
        PINK,
        2.5
      ),

      line(
        p3(fp[0] - 0.08, fp[1] + 0.08),
        p3(fp[0] + 0.08, fp[1] - 0.08),
        PINK,
        2.5
      )
    );

    const parts = [
      m.base,
      m.route,
      frontRing,
      cross
    ];

    if (corrected) {
      const eastRing = new M.Circle({
        radius: 0.12,
        color: C.green,
        strokeWidth: 2.4
      });

      eastRing.setFill(C.green, 0.14);
      eastRing.moveTo(ep);

      const eastPointer = arrow(
        p3(ep[0] + 0.59, ep[1] + 0.30),
        p3(ep[0] + 0.12, ep[1] + 0.06),
        C.green,
        2.5,
        0.10
      );

      parts.push(
        eastRing,
        eastPointer
      );
    }

    const note = fitText(
      corrected ? 'Use east side door' : 'Front door exists',
      15,
      corrected ? C.green : C.ink,
      false,
      3.0,
      p3(p[0], p[1] - unit - 0.28)
    );

    parts.push(note);

    return new M.VGroup(...parts);
  }

  const DOOR_Y = P ? 0.15 : 0.15;

  const doorMap = doorMapPicture(
    at(-1.76, DOOR_Y),
    false
  );

  const closedNotice = noticePhoto(
    at(1.76, DOOR_Y),
    P ? 3.15 : 3.26,
    P ? 2.80 : 2.55,
    0,
    true
  );

  const mapDoorHeading = label(
    'MAP',
    -1.76,
    P ? 1.80 : 1.53,
    C.cyan,
    17,
    2.80
  );

  const noticeDoorHeading = label(
    'NOTICE',
    1.76,
    P ? 1.80 : 1.53,
    C.amber,
    17,
    2.80
  );

  const claim5Check = checkStrip(
    4,
    'contradicted'
  );

  // 25. The map shows a front door, but the notice says closed.

  await until(S(25));

  await play(
    ...view([
      mapDoorHeading,
      noticeDoorHeading,
      doorMap,
      closedNotice,
      claim5Check
    ], 1.45),

    ...fbox([
      ['Claim: enter front door.', C.ink],
      ['Notice: front CLOSED.', PINK],
      ['CONTRADICTED ×', PINK]
    ], PINK),

    ...say('CLAIM FIVE: FRONT DOOR — CONTRADICTED', PINK)
  );

  // 26. Correct advice: use the east side door.

  const correctedDoorMap = doorMapPicture(
    at(-1.76, DOOR_Y),
    true
  );

  const useEastNotice = noticePhoto(
    at(1.76, DOOR_Y),
    P ? 3.15 : 3.26,
    P ? 2.80 : 2.55,
    1,
    true
  );

  const correctedDoorStrip = checkStrip(
    4,
    'supported',
    'Use the east side door.'
  );

  await until(S(26));

  await play(
    ...view([
      mapDoorHeading,
      noticeDoorHeading,
      correctedDoorMap,
      useEastNotice,
      correctedDoorStrip
    ]),

    ...fbox([
      ['Front door: closed', PINK],
      ['Use east side door.', C.green]
    ], C.green),

    ...say('CORRECT ADVICE: USE THE EAST SIDE DOOR', C.green)
  );

  // ------------------------------------------------------------
  // 27-28. Count the checked claims.
  //
  // Show five equally sized cells before calculating the share.
  // Their order remains the original claim order.
  // ------------------------------------------------------------

  const checkedRows = CLAIMS.map((_, i) =>
    claimRow(i, 'checked')
  );

  const resultHeading = label(
    'THE FIVE CHECKED CLAIMS',
    0,
    P ? 1.83 : 1.50,
    C.ink,
    21
  );

  const resultCount = tag(
    '3 SUPPORTED · 2 CONTRADICTED',
    C.green,
    at(0, P ? -4.05 : -2.07),
    18
  );

  // 27. Three supported and two contradicted.

  await until(S(27));

  await play(
    ...view([
      resultHeading,
      ...checkedRows,
      resultCount
    ], 1.25),

    ...fbox([
      [`Supported    = ${SUPPORTED}`, C.green],
      [`Contradicted = ${CONTRADICTED}`, PINK],
      [`Unsupported  = ${UNSUPPORTED}`, C.amber]
    ], C.green),

    ...say('COUNT: THREE SUPPORTED, TWO CONTRADICTED', C.green)
  );

  const SHARE_Y = P ? -0.02 : 0.15;

  const SHARE_SP = P ? 1.27 : 1.37;
  const SHARE_W = P ? 1.10 : 1.18;
  const SHARE_H = P ? 1.35 : 1.30;

  function shareCell(k, sorted = false, y = SHARE_Y) {
    // In the original picture, cells follow claim order.
    // In the share picture, supported claims may be grouped
    // together while retaining their actual claim numbers.

    const order = sorted
      ? [0, 1, 3, 2, 4]
      : [0, 1, 2, 3, 4];

    const i = order[k];

    const status = STATUS[i];
    const color = COLORS[status];

    const p = at(
      (k - 2) * SHARE_SP,
      y
    );

    const halo = rounded(
      SHARE_W + 0.08,
      SHARE_H + 0.08,
      p,
      color,
      color,
      0.12,
      1
    );

    const body = rounded(
      SHARE_W,
      SHARE_H,
      p,
      color,
      C.card,
      0.98,
      2.4
    );

    const number = fitText(
      `CLAIM ${i + 1}`,
      13,
      color,
      true,
      SHARE_W - 0.13,
      p3(p[0], p[1] + 0.43)
    );

    const glyph = fitText(
      SYMBOLS[status],
      39,
      color,
      false,
      SHARE_W - 0.24,
      p3(p[0], p[1] - 0.08)
    );

    const statusText = fitText(
      status === 'supported' ? 'SUPPORTED' : 'CONTRADICTED',
      12,
      color,
      true,
      SHARE_W - 0.13,
      p3(p[0], p[1] - 0.47)
    );

    return new M.VGroup(
      halo,
      body,
      number,
      glyph,
      statusText
    );
  }

  const originalCells = CLAIMS.map((_, i) =>
    shareCell(i)
  );

  const shareHeading = label(
    'ALL FIVE CLAIMS',
    0,
    P ? 1.31 : 1.24,
    C.ink,
    22
  );

  const shareTotal = tag(
    '3 / 5 = 60%',
    C.green,
    at(0, P ? -1.65 : -1.22),
    25
  );

  // 28. Three out of five is sixty percent.

  await until(S(28));

  await play(
    ...view([
      shareHeading,
      ...originalCells,
      shareTotal
    ], 1.15),

    ...fbox([
      ['3 out of 5', C.green],
      ['3 ÷ 5 = 60%', C.green]
    ], C.green),

    ...say('THREE OUT OF FIVE = SIXTY PERCENT', C.green)
  );

  // ------------------------------------------------------------
  // 29. Name the process: multimodal grounding.
  //
  // Visually connect checked claims to their actual sources.
  // Claims 1-4 use the map.
  // Claim 5 uses the notice.
  // ------------------------------------------------------------

  const GROUND_SOURCE_Y = P ? 0.77 : 0.48;

  function groundingPicture() {
    const mapP = at(-1.76, GROUND_SOURCE_Y);
    const noticeP = at(1.76, GROUND_SOURCE_Y);

    const mapPic = completeMap(
      mapP,
      P ? 0.88 : 0.78,
      true
    );

    const noticePic = noticePhoto(
      noticeP,
      2.85,
      P ? 1.84 : 1.65,
      null,
      true
    );

    const mapLabel = label(
      'MAP EVIDENCE',
      -1.76,
      GROUND_SOURCE_Y + (P ? 1.19 : 1.06),
      C.cyan,
      16,
      2.80
    );

    const photoLabel = label(
      'PHOTO EVIDENCE',
      1.76,
      GROUND_SOURCE_Y + (P ? 1.19 : 1.06),
      C.amber,
      16,
      2.80
    );

    const y = P ? -2.38 : -1.60;
    const sp = P ? 1.26 : 1.33;

    const parts = [
      mapPic,
      noticePic,
      mapLabel,
      photoLabel
    ];

    const claimNodes = [];
    const evidenceLinks = [];

    CLAIMS.forEach((_, k) => {
      const p = at(
        (k - 2) * sp,
        y
      );

      const color = COLORS[STATUS[k]];

      const body = rounded(
        1.08,
        0.70,
        p,
        color,
        C.card,
        0.98,
        2
      );

      const number = fitText(
        `${k + 1}`,
        16,
        C.ink,
        true,
        0.30,
        p3(p[0] - 0.24, p[1])
      );

      const mark = fitText(
        SYMBOLS[STATUS[k]],
        25,
        color,
        false,
        0.45,
        p3(p[0] + 0.18, p[1])
      );

      claimNodes.push(
        new M.VGroup(body, number, mark)
      );

      const sourceX = k === 4
        ? noticeP[0]
        : mapP[0] + (k - 1.5) * 0.40;

      const sourceY = GROUND_SOURCE_Y -
        (P ? 0.99 : 0.85);

      evidenceLinks.push(
        arrow(
          p3(sourceX, sourceY),
          p3(p[0], p[1] + 0.39),
          k === 4 ? C.amber : C.cyan,
          1.8,
          0.10
        )
      );
    });

    return [
      ...parts,
      ...evidenceLinks,
      ...claimNodes
    ];
  }

  const groundingObjects = groundingPicture();

  await until(S(29));

  await play(
    ...view(
      groundingObjects,
      1.85
    ),

    ...fbox([
      ['MULTIMODAL', C.violet],
      ['GROUNDING', C.green],
      ['Check every claim', C.ink],
      ['against its sources.', C.ink]
    ], C.green),

    ...say('THIS IS MULTIMODAL GROUNDING', C.green)
  );

  // ------------------------------------------------------------
  // 30. Grounding analogy: a tent tied to the ground.
  // ------------------------------------------------------------

  const TENT_Y = P ? -0.65 : -0.15;

  const groundY = TENT_Y - 1.15;

  const tentRoof = at(0, TENT_Y + 1.16);
  const tentLeft = at(-1.28, groundY + 0.14);
  const tentRight = at(1.28, groundY + 0.14);

  const leftPeg = at(-2.55, groundY);
  const rightPeg = at(2.55, groundY);

  const tent = new M.VGroup(
    line(
      tentLeft,
      tentRoof,
      C.cyan,
      4
    ),

    line(
      tentRoof,
      tentRight,
      C.cyan,
      4
    ),

    line(
      tentLeft,
      tentRight,
      C.cyan,
      3
    ),

    line(
      tentRoof,
      at(0, groundY + 0.14),
      C.cyan,
      1.5
    ),

    line(
      at(-0.48, groundY + 0.14),
      at(0, TENT_Y + 0.14),
      C.muted,
      2
    ),

    line(
      at(0, TENT_Y + 0.14),
      at(0.48, groundY + 0.14),
      C.muted,
      2
    )
  );

  const ground = line(
    at(-3.0, groundY),
    at(3.0, groundY),
    C.muted,
    2
  );

  const ropes = new M.VGroup(
    line(
      tentRoof,
      leftPeg,
      C.amber,
      2.6
    ),

    line(
      tentRoof,
      rightPeg,
      C.amber,
      2.6
    ),

    line(
      p3(leftPeg[0] - 0.08, leftPeg[1] + 0.18),
      p3(leftPeg[0] + 0.05, leftPeg[1] - 0.09),
      C.green,
      3
    ),

    line(
      p3(rightPeg[0] + 0.08, rightPeg[1] + 0.18),
      p3(rightPeg[0] - 0.05, rightPeg[1] - 0.09),
      C.green,
      3
    ),

    dot(leftPeg, 0.075, C.green),
    dot(rightPeg, 0.075, C.green)
  );

  const tentAnswer = tag(
    'ANSWER',
    C.cyan,
    at(0, TENT_Y + 0.24),
    19,
    1.80
  );

  const groundSources = label(
    'SOURCES',
    0,
    groundY - 0.37,
    C.green,
    20
  );

  const tetherLabel = label(
    'Evidence ties the answer down.',
    0,
    P ? -3.40 : -2.18,
    C.amber,
    20
  );

  await until(S(30));

  await play(
    ...view([
      ground,
      tent,
      ropes,
      tentAnswer,
      groundSources,
      tetherLabel
    ], 1.60),

    ...fbox([
      ['Grounded = tied down', C.green],
      ['Answer tied to', C.cyan],
      ['its evidence.', C.amber]
    ], C.green),

    ...say('LIKE A TENT TIED TO THE GROUND', C.green)
  );

  // ------------------------------------------------------------
  // 31. Text grounding and multimodal grounding.
  //
  // Earlier: check text against text passages.
  // Here: also check text against map and photo evidence.
  // ------------------------------------------------------------

  function documentIcon(p, w, h, color = C.amber) {
    const body = rounded(
      w, h, p,
      color, C.card, 0.98, 2
    );

    const title = fitText(
      'TEXT PASSAGE',
      15,
      color,
      true,
      w - 0.20,
      p3(p[0], p[1] + h * 0.33)
    );

    const parts = [
      body,
      title
    ];

    for (let k = 0; k < 5; k++) {
      const yy = p[1] + h * 0.12 -
        k * h * 0.12;

      const lineW = w * (
        k === 4 ? 0.52 : 0.76
      );

      parts.push(
        rect(
          lineW,
          0.040,
          p3(p[0], yy),
          k === 2 ? C.green : C.muted,
          k === 2 ? 1 : 0.55,
          0
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const MODAL_Y = P ? 0.42 : 0.38;

  const textSource = documentIcon(
    at(-2.31, MODAL_Y),
    1.90,
    P ? 2.03 : 1.77,
    C.amber
  );

  const mapModality = completeMap(
    at(0, MODAL_Y),
    P ? 0.64 : 0.68,
    true
  );

  const photoModality = noticePhoto(
    at(2.31, MODAL_Y),
    1.97,
    P ? 2.03 : 1.77,
    null,
    true
  );

  const modalityNames = [
    label(
      'TEXT',
      -2.31,
      MODAL_Y - (P ? 1.29 : 1.11),
      C.amber,
      17,
      2.0
    ),

    label(
      'MAP',
      0,
      MODAL_Y - (P ? 1.29 : 1.11),
      C.cyan,
      17,
      2.0
    ),

    label(
      'PHOTO',
      2.31,
      MODAL_Y - (P ? 1.29 : 1.11),
      C.violet,
      17,
      2.0
    )
  ];

  const modalAnswerY = P ? -3.22 : -1.86;

  const modalAnswer = tag(
    'CHECK THE ANSWER',
    C.green,
    at(0, modalAnswerY),
    19
  );

  const modalLinks = [
    -2.31, 0, 2.31
  ].map((x, i) =>
    arrow(
      at(x, MODAL_Y - (P ? 1.53 : 1.32)),
      at(
        (i - 1) * 0.65,
        modalAnswerY + 0.26
      ),
      [C.amber, C.cyan, C.violet][i],
      1.8,
      0.11
    )
  );

  await until(S(31));

  await play(
    ...view([
      textSource,
      mapModality,
      photoModality,
      ...modalityNames,
      ...modalLinks,
      modalAnswer
    ], 1.65),

    ...fbox([
      ['Earlier: text → text', C.amber],
      ['Here: map + photo', C.cyan],
      ['Check the same answer', C.green]
    ], C.green),

    ...say('GROUND ANSWERS IN TEXT AND PICTURES', C.green)
  );

  // ------------------------------------------------------------
  // 32-33. Grounded share
  //
  // Show the supported part of the whole before the formula.
  // ------------------------------------------------------------

  const SORTED_Y = P ? 0.30 : 0.28;

  const sortedCells = CLAIMS.map((_, i) =>
    shareCell(i, true, SORTED_Y)
  );

  const allWidth = 4 * SHARE_SP + SHARE_W;

  const supportedWidth = 2 * SHARE_SP + SHARE_W;

  const supportedOutline = outline(
    supportedWidth + 0.13,
    SHARE_H + 0.14,
    at(-SHARE_SP, SORTED_Y),
    C.green
  );

  const supportedLabel = label(
    '3 SUPPORTED CLAIMS',
    -SHARE_SP,
    SORTED_Y + SHARE_H / 2 + 0.35,
    C.green,
    17,
    supportedWidth
  );

  const allBracketY = SORTED_Y -
    SHARE_H / 2 - 0.35;

  const allBracket = new M.VGroup(
    line(
      at(-allWidth / 2, allBracketY),
      at(allWidth / 2, allBracketY),
      C.ink,
      1.7
    ),

    line(
      at(-allWidth / 2, allBracketY),
      at(-allWidth / 2, allBracketY + 0.14),
      C.ink,
      1.7
    ),

    line(
      at(allWidth / 2, allBracketY),
      at(allWidth / 2, allBracketY + 0.14),
      C.ink,
      1.7
    ),

    label(
      'ALL 5 CLAIMS',
      0,
      allBracketY - 0.28,
      C.ink,
      17
    )
  );

  // 32. Grounded share = supported claims / all claims.

  await until(S(32));

  await play(
    ...view([
      ...sortedCells,
      supportedOutline,
      supportedLabel,
      allBracket
    ], 1.50),

    ...fbox([
      ['grounded share =', C.ink],
      ['supported claims', C.green],
      ['÷ all claims', C.ink]
    ], C.green),

    ...say('GROUNDED SHARE = SUPPORTED ÷ ALL', C.green)
  );

  // 33. Three divided by five is 0.6, or 60%.
  //
  // Five equal bar cells represent all claims.
  // Three of them form the supported share.

  const BAR_Y = P ? -2.72 : -2.13;
  const BAR_W = P ? 5.90 : 5.70;

  const shareBarCells = CLAIMS.map((_, k) => {
    const cw = BAR_W / TOTAL;

    const color = k < SUPPORTED
      ? C.green
      : PINK;

    return rect(
      cw * 0.93,
      P ? 0.41 : 0.25,
      at(
        -BAR_W / 2 + (k + 0.5) * cw,
        BAR_Y
      ),
      color,
      0.87,
      1
    );
  });

  const sharePercentLabel = label(
    `${GROUNDED_PERCENT}% SUPPORTED`,
    0,
    BAR_Y - (P ? 0.56 : 0.35),
    C.green,
    P ? 29 : 22
  );

  await until(S(33));

  await play(
    ...view([
      ...sortedCells,
      supportedOutline,
      supportedLabel,
      allBracket,
      ...shareBarCells,
      sharePercentLabel
    ], 1.35),

    ...fbox([
      ['grounded share', C.ink],
      ['= 3 ÷ 5', C.ink],
      [`= ${GROUNDED_SHARE}`, C.amber],
      [`= ${GROUNDED_PERCENT}%`, C.green]
    ], C.green),

    ...say('THREE FIFTHS = 0.6 = 60 PERCENT', C.green)
  );

  // ------------------------------------------------------------
  // 34-35. What multimodal grounding is for.
  //
  // Catch the bad advice before it is used.
  // Identify and repair the individual wrong claims.
  // ------------------------------------------------------------

  const safeLeftArrow = arrow(
    mp(142, 165),
    mp(74, 165),
    ORANGE,
    3.4,
    0.16
  );

  const safeLeftText = fitText(
    'LEFT',
    17,
    ORANGE,
    true,
    0.88,
    mp(85, 184)
  );

  const closedDoorRing = new M.Circle({
    radius: P ? 0.14 : 0.12,
    color: PINK,
    strokeWidth: 2.7
  });

  closedDoorRing.setFill(PINK, 0.14);
  closedDoorRing.moveTo(mp(...FRONT));

  const closedDoorCross = new M.VGroup(
    line(
      p3(mp(...FRONT)[0] - 0.10, mp(...FRONT)[1] - 0.10),
      p3(mp(...FRONT)[0] + 0.10, mp(...FRONT)[1] + 0.10),
      PINK,
      3
    ),

    line(
      p3(mp(...FRONT)[0] - 0.10, mp(...FRONT)[1] + 0.10),
      p3(mp(...FRONT)[0] + 0.10, mp(...FRONT)[1] - 0.10),
      PINK,
      3
    )
  );

  const eastDoorRing = new M.Circle({
    radius: P ? 0.14 : 0.12,
    color: C.green,
    strokeWidth: 2.7
  });

  eastDoorRing.setFill(C.green, 0.12);
  eastDoorRing.moveTo(mp(...EAST));

  const eastDoorPointer = arrow(
    mp(224, 17),
    mp(192, 27),
    C.green,
    2.5,
    0.12
  );

  const eastDoorText = fitText(
    'East door',
    18,
    C.green,
    false,
    1.3,
    mp(250, 8)
  );

  const safetyTag = tag(
    'CHECK DIRECTIONS BEFORE WALKING',
    C.green,
    at(0, CHECK_Y),
    18
  );

  // 34. Catch the wrong directions before the visitor follows them.
  //
  // Keep the original route visible as the route marked on
  // the map, but mark its front-door endpoint as closed.
  // Do not invent a replacement path to the east side door.

  await until(S(34));

  await play(
    ...view([
      ...MAP_OBJECTS,
      safeLeftArrow,
      safeLeftText,
      closedDoorRing,
      closedDoorCross,
      eastDoorRing,
      eastDoorPointer,
      eastDoorText,
      safetyTag
    ], 1.30),

    ...fbox([
      ['Catch wrong directions.', C.green],
      ['Check before walking.', C.ink]
    ], C.green),

    ...say('CATCH ERRORS BEFORE THE VISITOR FOLLOWS THEM', C.green)
  );

  // 35. Identify exactly which lines need repair.

  const REPAIRED = CLAIMS.slice();

  REPAIRED[2] = 'The cafeteria is on your left.';
  REPAIRED[4] = 'Use the east side door.';

  const repairedRows = CLAIMS.map((_, i) =>
    claimRow(
      i,
      STATUS[i] === 'contradicted'
        ? 'corrected'
        : 'checked',
      REPAIRED[i]
    )
  );

  const repairHeading = label(
    'REPAIR THE WRONG LINES',
    0,
    P ? 1.83 : 1.50,
    C.green,
    21
  );

  const fixedLine3 = outline(
    MAIN_W + 0.01,
    P ? 0.80 : 0.57,
    at(
      0,
      (P ? 1.13 : 0.99) -
        2 * (P ? 0.92 : 0.65)
    ),
    C.green
  );

  const fixedLine5 = outline(
    MAIN_W + 0.01,
    P ? 0.80 : 0.57,
    at(
      0,
      (P ? 1.13 : 0.99) -
        4 * (P ? 0.92 : 0.65)
    ),
    C.green
  );

  const repairNote = tag(
    'FIX CLAIMS 3 AND 5',
    C.green,
    at(0, P ? -4.07 : -2.08),
    19
  );

  await until(S(35));

  await play(
    ...view([
      repairHeading,
      ...repairedRows,
      fixedLine3,
      fixedLine5,
      repairNote
    ], 1.30),

    ...fbox([
      ['Repair claim 3:', PINK],
      ['RIGHT → LEFT', C.green],
      ['Repair claim 5:', PINK],
      ['FRONT → EAST SIDE', C.green]
    ], C.green),

    ...say('GROUNDING SHOWS EXACTLY WHICH CLAIMS TO FIX', C.green)
  );

  // ------------------------------------------------------------
  // 36. Reminder: spatial relationships can be difficult
  // for multimodal models.
  //
  // The model may identify the correct buildings but get
  // their arrangement wrong.
  // ------------------------------------------------------------

  const arrangementLeft = outline(
    MAP_UNIT - 0.055,
    MAP_UNIT - 0.055,
    mp(50, 150),
    ORANGE
  );

  const arrangementGate = outline(
    MAP_UNIT - 0.055,
    MAP_UNIT - 0.055,
    mp(150, 150),
    WHITE
  );

  const arrangementArrow = arrow(
    mp(145, 122),
    mp(55, 122),
    ORANGE,
    3,
    0.17
  );

  const arrangementLabel = fitText(
    'LEFT OF',
    16,
    ORANGE,
    true,
    1.08,
    mp(100, 109)
  );

  const spatialNote = tag(
    'RECOGNISING THINGS ≠ KNOWING THEIR ARRANGEMENT',
    C.amber,
    at(0, CHECK_Y),
    17
  );

  await until(S(36));

  await play(
    ...view([
      ...MAP_OBJECTS,
      arrangementLeft,
      arrangementGate,
      arrangementArrow,
      arrangementLabel,
      spatialNote
    ], 1.35),

    ...fbox([
      ['Recognise cafeteria ✓', C.green],
      ['Recognise gate ✓', C.green],
      ['Right instead of left ×', PINK]
    ], C.amber),

    ...say('MODELS CAN STRUGGLE WITH SPATIAL RELATIONSHIPS', C.amber)
  );

  // ------------------------------------------------------------
  // 37-41. Common trap: unsupported is not the same as false.
  //
  // The additional opening-hours claim appears in neither
  // of the two supplied sources.
  //
  // Do not invent an opening time or declare the claim false.
  // ------------------------------------------------------------

  const extraHeading = label(
    'IMAGINE ONE EXTRA CLAIM',
    0,
    P ? 1.48 : 1.40,
    C.amber,
    22
  );

  function extraClaimPanel(
    status = null,
    y = P ? -0.48 : -0.17
  ) {
    const color = status
      ? COLORS[status]
      : C.violet;

    const p = at(0, y);

    const w = MAIN_W - 0.20;
    const h = P ? 2.30 : 1.85;

    const body = rounded(
      w,
      h,
      p,
      color,
      C.card,
      0.98,
      2.2
    );

    const heading = fitText(
      'ADDITIONAL CLAIM',
      17,
      color,
      true,
      w - 0.32,
      p3(p[0], p[1] + h * 0.33)
    );

    const claim = fitText(
      EXTRA_CLAIM,
      26,
      C.ink,
      false,
      w - 0.40,
      p3(p[0], p[1] + 0.03)
    );

    const statusText = fitText(
      status
        ? `${SYMBOLS[status]}  ${status.toUpperCase()}`
        : 'Can we check it?',
      20,
      color,
      true,
      w - 0.40,
      p3(p[0], p[1] - h * 0.32)
    );

    return new M.VGroup(
      body,
      heading,
      claim,
      statusText
    );
  }

  // 37. Hypothetical addition: the library opens at eight.

  const extraUnmarked = extraClaimPanel();

  const extraQuestionTag = tag(
    'WHERE DID THAT INFORMATION COME FROM?',
    C.amber,
    at(0, P ? -2.52 : -1.61),
    18
  );

  await until(S(37));

  await play(
    ...view([
      extraHeading,
      extraUnmarked,
      extraQuestionTag
    ], 1.20),

    ...fbox([
      ['Extra claim:', C.amber],
      ['Library opens at eight.', C.ink],
      ['Evidence?', C.violet]
    ], C.amber),

    ...say('TRAP: ADDING AN UNCHECKED FACT', C.amber)
  );

  // 38. Neither the map nor the notice gives opening hours.

  const hoursSources = sourcePair(
    P ? 0.22 : 0.20
  );

  const noHoursMap = tag(
    'NO OPENING HOURS',
    C.amber,
    at(
      -1.76,
      P ? -1.45 : -1.34
    ),
    15,
    3.10
  );

  const noHoursNotice = tag(
    'NO OPENING HOURS',
    C.amber,
    at(
      1.76,
      P ? -1.45 : -1.34
    ),
    15,
    3.10
  );

  const hoursQuestion = label(
    '“The library opens at eight.”',
    0,
    P ? -3.02 : -2.02,
    C.ink,
    21
  );

  await until(S(38));

  await play(
    ...view([
      ...hoursSources.objects,
      noHoursMap,
      noHoursNotice,
      hoursQuestion
    ], 1.35),

    ...fbox([
      ['Map: no hours', C.cyan],
      ['Notice: no hours', C.amber],
      ['No source answers it.', C.ink]
    ], C.amber),

    ...say('NEITHER SOURCE GIVES OPENING HOURS', C.amber)
  );

  // 39. Unsupported does not mean false.

  const extraUnsupported = extraClaimPanel(
    'unsupported'
  );

  const notFalseTag = tag(
    'UNSUPPORTED DOES NOT MEAN FALSE',
    C.amber,
    at(0, P ? -2.65 : -1.68),
    19
  );

  const mayBeTrue = label(
    'It may be true. These sources cannot tell us.',
    0,
    P ? -3.48 : -2.16,
    C.ink,
    19
  );

  await until(S(39));

  await play(
    ...view([
      extraHeading,
      extraUnsupported,
      notFalseTag,
      mayBeTrue
    ], 1.20),

    ...fbox([
      ['UNSUPPORTED ?', C.amber],
      ['Not proven true.', C.ink],
      ['Not proven false.', C.ink]
    ], C.amber),

    ...say('UNSUPPORTED IS NOT THE SAME AS FALSE', C.amber)
  );

  // 40. Without evidence, do not rely on the claim.

  const trustWarning = tag(
    'DO NOT RELY ON IT YET',
    PINK,
    at(0, P ? -2.65 : -1.68),
    20
  );

  await until(S(40));

  await play(
    ...view([
      extraHeading,
      extraUnsupported,
      trustWarning,
      mayBeTrue
    ]),

    ...fbox([
      ['Cannot verify it.', C.amber],
      ['Do not assume it.', PINK]
    ], C.amber),

    ...say('DO NOT TRUST AN UNVERIFIED CLAIM', C.amber)
  );

  // 41. Flag the claim and check another appropriate source.
  //
  // An official opening-hours source is shown as a possible
  // place to verify, not as a retrieved or confirmed fact.

  const lookupY = P ? -0.36 : -0.10;

  const flagNode = panel(
    at(-1.84, lookupY),
    3.06,
    P ? 2.20 : 2.05,
    'FLAG THE CLAIM',
    [
      ['Opening time?', C.ink],
      ['Not verified', C.amber]
    ],
    C.amber,
    20
  );

  const lookupNode = panel(
    at(1.84, lookupY),
    3.06,
    P ? 2.20 : 2.05,
    'CHECK ELSEWHERE',
    [
      ['Official opening hours', C.cyan],
      ['Verify before relying', C.ink]
    ],
    C.cyan,
    19
  );

  const lookupArrow = arrow(
    at(-0.26, lookupY),
    at(0.26, lookupY),
    C.amber,
    2.7,
    0.12
  );

  const lookupNote = tag(
    'FLAG → VERIFY → THEN RELY',
    C.green,
    at(0, P ? -2.70 : -1.65),
    19
  );

  await until(S(41));

  await play(
    ...view([
      flagNode,
      lookupArrow,
      lookupNode,
      lookupNote
    ], 1.15),

    ...fbox([
      ['Flag unsupported facts.', C.amber],
      ['Find another source.', C.cyan],
      ['Verify before relying.', C.green]
    ], C.green),

    ...say('FLAG IT AND CHECK IT SOMEWHERE ELSE', C.green)
  );

  // ------------------------------------------------------------
  // 42. Final one-sentence takeaway.
  //
  // Rebuild the source-to-claim picture using the original
  // five claims and their correct verdicts.
  //
  // Keep the hypothetical opening-hours claim outside
  // the original grounded-share calculation.
  // ------------------------------------------------------------

  const FINAL_SOURCE_Y = P ? 0.73 : 0.56;

  const finalMap = completeMap(
    at(-2.32, FINAL_SOURCE_Y),
    P ? 0.65 : 0.68,
    true
  );

  const finalPhoto = noticePhoto(
    at(0, FINAL_SOURCE_Y),
    2.03,
    P ? 1.80 : 1.60,
    null,
    true
  );

  const finalText = documentIcon(
    at(2.32, FINAL_SOURCE_Y),
    1.90,
    P ? 1.80 : 1.60,
    C.amber
  );

  const finalSourceLabels = [
    label(
      'MAP',
      -2.32,
      FINAL_SOURCE_Y + (P ? 1.16 : 0.98),
      C.cyan,
      17,
      2.0
    ),

    label(
      'PHOTO',
      0,
      FINAL_SOURCE_Y + (P ? 1.16 : 0.98),
      C.violet,
      17,
      2.0
    ),

    label(
      'TEXT',
      2.32,
      FINAL_SOURCE_Y + (P ? 1.16 : 0.98),
      C.amber,
      17,
      2.0
    )
  ];

  const CHECK_NODE_Y = P ? -1.27 : -0.69;

  const finalCheckNode = tag(
    'CHECK EACH CLAIM',
    C.green,
    at(0, CHECK_NODE_Y),
    18,
    3.8
  );

  const finalSourceArrows = [
    -2.32, 0, 2.32
  ].map((x, i) =>
    arrow(
      at(
        x,
        FINAL_SOURCE_Y -
          (P ? 0.97 : 0.86)
      ),
      at(
        (i - 1) * 0.75,
        CHECK_NODE_Y + 0.26
      ),
      [C.cyan, C.violet, C.amber][i],
      1.9,
      0.10
    )
  );

  // Final verdict cells preserve the original claim order.

  const finalCellY = P ? -2.65 : -1.65;

  const finalVerdictCells = CLAIMS.map((_, i) => {
    const color = COLORS[STATUS[i]];

    const p = at(
      (i - 2) * (P ? 1.23 : 1.29),
      finalCellY
    );

    const w = P ? 1.07 : 1.12;
    const h = P ? 0.94 : 0.72;

    const body = rounded(
      w, h, p,
      color, C.card, 0.98, 2
    );

    const num = fitText(
      `${i + 1}`,
      16,
      C.ink,
      true,
      0.28,
      p3(
        p[0] - w * 0.22,
        p[1]
      )
    );

    const glyph = fitText(
      SYMBOLS[STATUS[i]],
      28,
      color,
      false,
      0.49,
      p3(
        p[0] + w * 0.19,
        p[1]
      )
    );

    return new M.VGroup(
      body,
      num,
      glyph
    );
  });

  const finalShare = tag(
    '3 SUPPORTED / 5 CLAIMS = 60%',
    C.green,
    at(0, P ? -4.07 : -2.49),
    20
  );

  const finalObjects = [
    finalMap,
    finalPhoto,
    finalText,
    ...finalSourceLabels,
    ...finalSourceArrows,
    finalCheckNode,
    ...finalVerdictCells,
    finalShare
  ];

  await until(S(42));

  await play(
    ...view(
      finalObjects,
      2.20
    ),

    ...fbox([
      ['Multimodal grounding', C.green],
      ['Check every claim', C.ink],
      ['against map, photo', C.cyan],
      ['or text evidence.', C.amber]
    ], C.green),

    ...say('CHECK EVERY CLAIM AGAINST ITS SOURCES', C.green)
  );

  await until(S(42) + 3.50);

  await play(
    new M.Indicate(
      finalCheckNode,
      { color: C.green }
    ),

    new M.Indicate(
      finalShare,
      { color: C.green }
    ),

    ...fbox([
      ['grounded share =', C.ink],
      ['supported ÷ all claims', C.green],
      ['= 3 ÷ 5 = 60%', C.green]
    ], C.green),

    ...say('MULTIMODAL GROUNDING = CHECK CLAIMS AGAINST EVIDENCE', C.green)
  );

  await until(E(42));
}
