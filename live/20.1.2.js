// 20.1.2 Deduplication: removing repeated text.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const CX = P ? 0 : -2.4;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  // Laptop: 2 rows of 4 cards left of the box / network. Phone: 4 rows of 2 big cards, network below them.
  const SP = P ? 3.6 : 1.95;
  const CW = SP - 0.14;
  const CH = P ? 1.35 : 1.6;
  const slotX = slot => P ? (slot % 2 - 0.5) * SP : CX + (slot % 4 - 1.5) * SP;
  const slotY = slot => P ? 1.0 - Math.floor(slot / 2) * 1.55 : (slot < 4 ? 0.55 : -1.25);
  const WORDS = 100;
  const TITLES = ['Welcome week', 'Library', 'Pool', 'Exams', 'Clubs'];
  const TOPICS = [0, 0, 0, 0, 1, 2, 3, 4];
  const ALL = TOPICS.map((_, i) => i);
  const KEPT = [0, 4, 5, 6, 7];
  const EXACT = [0, 3, 4, 5, 6, 7];
  const say = (s, color = C.cyan) => showA(s, color, PILL, P ? 18 : 19);
  const fadeIn = item => new M.FadeIn(item, { runTime: 0.28 });
  const fadeOut = item => new M.FadeOut(item, { runTime: 0.24 });

  function text(s, x, y, size, color, maxWidth, mono = false) {
    const t = T(s, size, color, mono);
    const width = t.getWidth();
    t._k = 1;
    if (width > maxWidth) { t._k = maxWidth / width; t.scale(t._k); }
    t.moveTo([x, y, 0]);
    return t;
  }

  function rect(width, height, x, y, color, fill, opacity = 1) {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.09, color, strokeWidth: 2 });
    if (fill) r.setFill(fill, opacity);
    r.moveTo([x, y, 0]);
    return r;
  }

  let boxNow = null;
  function fbox(lines = [], color = C.cyan) {
    const animations = boxNow ? [fadeOut(boxNow)] : [];
    boxNow = null;
    if (!lines.length) return animations;

    const size = P ? 22 : 22;
    const lh = P ? 0.46 : 0.46;
    const maxWidth = P ? FW - 1.0 : 4.8;
    const rows = lines.map(line => Array.isArray(line) ? line : [line, C.ink]);
    const texts = rows.map(([s, c]) => text(s, 0, 0, size, c, maxWidth - 0.7, true));
    const tw = t => t.getWidth() * t._k;
    const width = Math.max(...texts.map(tw)) + 0.7;
    const height = rows.length * lh + 0.4;
    const [x, y] = BOXP;
    const background = rect(width, height, x, y, color, C.card, 0.95);
    texts.forEach((t, i) => {
      t.moveTo([x - width / 2 + 0.35 + tw(t) / 2, y + (rows.length - 1) * lh / 2 - i * lh, 0]);
    });
    boxNow = new M.VGroup(background, ...texts);
    animations.push(fadeIn(boxNow));
    return animations;
  }

  let noteNow = null;
  function note(s = '', color = C.ink) {
    const animations = noteNow ? [fadeOut(noteNow)] : [];
    noteNow = null;
    if (s) {
      noteNow = text(s, CX, P ? -5.2 : -2.75, P ? 24 : 22, color, 6.9);
      animations.push(fadeIn(noteNow));
    }
    return animations;
  }

  function card(spec, slot) {
    const wide = P && spec.wide;
    const x = wide ? 0 : slotX(slot);
    const y = wide ? 0.6 - slot * 1.6 : slotY(slot);
    const color = spec.color || C.muted;
    const paper = rect(wide ? 6.4 : CW, CH, x, y, color, color, 0.10);
    const heading = text(spec.top, x, y + (P ? 0.36 : 0.46), P ? 18 : 17, C.ink, CW - 0.17, true);
    const middle = spec.label ? [text(spec.label, x, y + 0.02, P ? 21 : 20, color, CW - 0.17)] : [];
    const footer = spec.footer ? [text(spec.footer, x, y - (P ? 0.34 : 0.46), P ? 18 : 16, C.ink, CW - 0.17)] : [];
    return { group: new M.VGroup(paper, heading, ...middle, ...footer), x, y, w: wide ? 6.4 : CW };
  }

  let displayed = new Map();
  function cards(specs) {
    const next = new Map();
    const animations = [];
    for (const spec of specs) {
      const key = JSON.stringify(spec);
      const old = displayed.get(spec.id);
      if (old?.key === key) {
        next.set(spec.id, old);
      } else {
        const entry = { ...card(spec, spec.slot), key };
        next.set(spec.id, entry);
        if (old) animations.push(fadeOut(old.group));
        animations.push(fadeIn(entry.group));
      }
    }
    for (const [id, entry] of displayed) {
      if (!next.has(id)) animations.push(fadeOut(entry.group));
    }
    displayed = next;
    return animations;
  }

  function files(ids = ALL, { reveal = 8, counts = true, tint = false, changed = false, compact = false } = {}) {
    return cards(ids.map((id, index) => {
      const topic = TOPICS[id];
      const visible = id < reveal;
      const edited = changed && id === 3;
      const color = edited ? C.amber : tint && visible ? (topic === 0 ? C.cyan : C.violet) : C.muted;
      return {
        id, slot: compact ? index : id, top: `FILE ${id + 1}`, wide: compact,
        label: visible ? (edited ? 'Tuesday' : TITLES[topic]) : '',
        footer: counts ? `${WORDS} words` : '', color,
      };
    }));
  }

  let outlines = [];
  function mark(ids = [], color = C.amber) {
    const animations = outlines.map(fadeOut);
    outlines = ids.map(id => {
      const { x, y, w } = displayed.get(id);
      return rect(w + 0.08, CH + 0.08, x, y, color);
    });
    return [...animations, ...outlines.map(fadeIn)];
  }

  const campus = [
    { id: 'campus-0', slot: 0, top: 'CAMPUS', label: 'Welcome week', color: C.cyan, wide: true },
    { id: 'campus-1', slot: 1, top: 'CAMPUS', label: 'Library', color: C.violet, wide: true },
    { id: 'campus-2', slot: 2, top: 'CAMPUS', label: 'Pool', color: C.violet, wide: true },
    { id: 'campus-3', slot: 3, top: 'CAMPUS', label: 'Exams', color: C.violet, wide: true },
  ];

  // 0–10 Collect newsletters and identify which files contain the same text.
  await until(S(0));
  await play(...cards(campus), ...say('CAMPUS NEWSLETTERS'),
    ...fbox(['Newsletters teach', ['a language model', C.cyan]]));
  await until(S(1));
  await play(...say('MANY DIFFERENT NEWSLETTERS'), ...note('Text about student life', C.violet));
  await until(S(2));
  await play(...cards(campus.map((entry, i) => ({
    ...entry, top: `WEB PAGE ${i + 1}`, label: 'Welcome week', color: C.cyan,
  }))), ...say('SAME NEWSLETTER, DIFFERENT PAGES', C.amber), ...note(), ...fbox());
  await until(S(3));
  await play(...files(ALL, { reveal: 0, counts: false }), ...say('8 NEWSLETTER FILES'));
  await until(S(4));
  await play(...files(ALL, { reveal: 0 }), ...say('100 WORDS IN EACH FILE'));
  await until(S(5));
  await play(...files(ALL, { reveal: 1 }), ...mark([0]), ...say('THE FIRST FILE'),
    ...fbox(['File 1 begins:', ['Welcome week starts Monday', C.cyan]]));
  await until(S(6));
  await play(...mark([1]), ...say('LOOK AT FILE 2'), ...fbox());
  await until(S(7));
  await play(...files(ALL, { reveal: 2 }), ...mark([0, 1], C.cyan), ...say('EVERY WORD MATCHES'),
    ...fbox(['1   Welcome week starts Monday', '2   Welcome week starts Monday']));
  await until(S(8));
  await play(...files(ALL, { reveal: 4 }), ...mark([2, 3], C.cyan), ...say('FILES 3 AND 4 MATCH TOO'), ...fbox());
  await until(S(9));
  await play(...files(), ...mark([4, 5, 6, 7], C.violet), ...say('FOUR OTHER NEWSLETTERS', C.violet));
  await until(S(10));
  await play(...mark(), ...note('8 files contain 5 different newsletters'), ...say('5 DIFFERENT NEWSLETTERS'));

  // 11–15 The files become equal word blocks.
  await until(S(11));
  await play(...cards(ALL.map(id => ({ id, slot: id, top: `${WORDS} words` }))),
    ...say('1 BLOCK = 100 WORDS'), ...note());
  await until(S(12));
  await play(...files(ALL, { tint: true }), ...say('4 WELCOME WEEK COPIES'));
  await until(S(13));
  await play(...mark([0, 1, 2, 3], C.cyan), ...say('WORDS IN THE FOUR COPIES'),
    ...fbox(['100 + 100 + 100 + 100', ['400 Welcome Week words', C.cyan]]));
  await until(S(14));
  await play(...mark(), ...say('WORDS IN ALL EIGHT FILES'),
    ...fbox(['8 × 100 words', ['800 words in all', C.violet]]));
  await until(S(15));
  await play(...say('HALF THE WORDS ARE WELCOME WEEK', C.amber),
    ...fbox(['400 of 800 words', ['One half', C.amber]], C.amber));

  const NX = P ? 0 : 4.25;
  const NY = P ? -5.45 : -0.45;
  const N = net({ layers: [2, 2, 1], center: [NX, NY, 0], width: P ? 4.65 : 3.75,
    height: P ? 1.1 : 1.85, r: P ? 0.27 : 0.28 });
  const values = [];
  let signalLabel = null;
  function signal(s = '', color = C.ink) {
    const animations = signalLabel ? [fadeOut(signalLabel)] : [];
    signalLabel = null;
    if (s) {
      signalLabel = text(s, NX, NY - (P ? 1.3 : 1.49), P ? 20 : 19, color, P ? 6.6 : 4.6);
      animations.push(fadeIn(signalLabel));
    }
    return animations;
  }
  const showNetwork = () => [fadeIn(N.group), ...values.map(fadeIn)];
  const hideNetwork = () => [fadeOut(N.group), ...values.map(fadeOut), ...signal()];

  // 16–20 Follow eight files through one reading of the collection.
  await until(S(16));
  await play(...fbox(), ...showNetwork(), ...say('NEURONS IN LAYERS, JOINED BY WEIGHTS'));
  await until(S(17));
  await play(...N.weight(0, 0, 0, 1), ...N.weight(0, 0, 1, -1),
    ...N.weight(0, 1, 0, 0.35), ...N.weight(0, 1, 1, 0.5),
    ...N.weight(1, 0, 0, 0.5), ...N.weight(1, 1, 0, 0.5),
    ...signal('Training changes the weights'), ...say('TRAINING CHANGES THE WEIGHTS'));

  await until(S(18));
  await play(...say('ONE FILE AT A TIME'));
  for (const id of ALL) {
    const color = id < 4 ? C.cyan : C.violet;
    await play(...mark([id], color), ...signal(`File ${id + 1} of 8`, color),
      new M.LaggedStart([...N.flow(0, color), ...N.flow(1, color)], { lagRatio: 0.8, runTime: 0.31 }));
  }
  await until(S(19));
  await play(...mark([0, 1, 2, 3], C.cyan), ...signal('Welcome Week read 4 times', C.cyan),
    ...say('ONE PASS THROUGH ALL THE FILES'));
  await until(S(20));
  await play(...mark([4, 5, 6, 7], C.violet), ...signal('Each other newsletter read once', C.violet),
    ...say('JUST ONE READ EACH', C.violet));

  // 21–24 Eight sheets of exam notes give a concrete comparison.
  await until(S(21));
  await play(...mark(), ...hideNetwork(), ...cards(ALL.map(id => ({
    id: `sheet-${id}`, slot: id, top: `SHEET ${id + 1}`, label: `Topic ${TOPICS[id] + 1}`,
    color: TOPICS[id] === 0 ? C.cyan : C.violet,
  }))), ...say('8 SHEETS OF EXAM NOTES'), ...fbox(['8 sheets of notes', ['for one exam', C.violet]], C.violet));
  await until(S(22));
  await play(...mark([0, 1, 2, 3].map(id => `sheet-${id}`), C.cyan),
    ...say('FOUR SHEETS REPEAT ONE TOPIC'), ...fbox(['4 of 8 sheets: Topic 1', ['Half the reading time', C.amber]], C.amber));
  await until(S(23));
  await play(...mark(), ...files(ALL, { tint: true }), ...showNetwork(), ...fbox(),
    ...signal('The model sees the same text again', C.cyan), ...note(), ...say('THE MODEL SEES REPEATED TEXT'));
  await until(S(24));
  await play(...mark([0, 1, 2, 3], C.cyan), ...signal('“Welcome week starts Monday”', C.cyan),
    ...say('REPEATED TEXT CAN BE MEMORIZED', C.amber));

  // 25–33 Name the operation, keep one copy, and calculate its new share.
  await until(S(25));
  await play(...hideNetwork(), ...mark([1, 2, 3], C.pink), ...say('DUPLICATE = REPEATED COPY', C.pink));
  await until(S(26));
  await play(...say('DEDUPLICATION REMOVES UNWANTED COPIES'), ...note('Files 2, 3 and 4 repeat File 1.'));
  await until(S(27));
  await play(...mark([0], C.cyan), ...say('KEEP FILE 1'), ...note());
  await until(S(28));
  await play(...mark([1, 2, 3], C.pink), ...say('REMOVE FILES 2, 3 AND 4', C.pink));
  await play(...mark(), ...files(KEPT, { tint: true }));
  await until(S(29));
  await play(...files(KEPT, { tint: true, compact: true }), ...say('5 FILES, 100 WORDS EACH'));
  await until(S(30));
  await play(...say('COUNT THE WORDS'), ...fbox(['5 × 100 words', ['500 words in all', C.violet]]));
  await until(S(31));
  await play(...mark([0], C.cyan), ...say('ONE WELCOME WEEK FILE'),
    ...fbox([['100 Welcome Week words', C.cyan], '500 words in all']));
  await until(S(32));
  await play(...say('DIVIDE BY THE TOTAL'), ...fbox(['Welcome Week ÷ all words', ['100 ÷ 500', C.cyan]]));
  await until(S(33));
  await play(...say('ONE FIFTH = 20%', C.amber), ...fbox(['100 ÷ 500 = one fifth', ['20%', C.amber]], C.amber));

  function shareBar(y, caption, topics) {
    const width = P ? 7.0 : 6.4;
    const gap = 0.06;
    const unit = width / topics.length;
    const bh = P ? 1.0 : 0.5;
    const blocks = topics.map((topic, i) => {
      const color = topic === 0 ? C.cyan : C.violet;
      return rect(unit - gap, bh, CX - width / 2 + (i + 0.5) * unit, y, color, color, 0.64);
    });
    return new M.VGroup(...blocks, text(caption, CX, y + bh / 2 + 0.32, P ? 24 : 21, C.ink, width));
  }

  const before = shareBar(P ? -2.2 : 0.5, 'Before: 50% Welcome Week', TOPICS);
  const after = shareBar(P ? -4.9 : -1.0, 'After: 20% Welcome Week', [0, 1, 2, 3, 4]);

  // 34–39 Compare shares, then state the general rule.
  await until(S(34));
  await play(...mark(), ...cards([]), fadeIn(before), ...say('BEFORE DEDUPLICATION', C.amber),
    ...fbox(['400 of 800 words', ['50%', C.amber]], C.amber));
  await until(S(35));
  await play(fadeIn(after), ...say('AFTER DEDUPLICATION'),
    ...fbox(['100 of 500 words', ['20%', C.cyan]]));
  await until(S(36));
  await play(fadeOut(before), fadeOut(after), ...files(KEPT, { tint: true, compact: true }),
    ...fbox(['100 words per newsletter', ['Equal reading time', C.green]], C.green), ...say('EQUAL READING TIME', C.green));
  await until(S(37));
  await play(...mark([0]), ...say('FIND ANY NEWSLETTER’S SHARE'),
    ...fbox(['Pick a newsletter', 'Count its words and copies']));
  await until(S(38));
  await play(...say('HOW TO FIND THE PERCENTAGE'),
    ...fbox(['Its words, all copies', '÷ all words', ['× 100 = percentage', C.amber]], C.amber));
  await until(S(39));
  await play(...mark(), ...fbox(), ...note(), ...files(KEPT, { tint: true }), ...showNetwork(), ...signal('Ready for the model', C.green),
    ...say('REMOVE UNWANTED COPIES BEFORE LEARNING', C.green));

  // 40–52 Change one word and compare exact matching with a near match.
  await until(S(40));
  await play(...hideNetwork(), ...say('SOME COPIES HAVE SMALL CHANGES', C.amber));
  await until(S(41));
  await play(...files(ALL, { tint: true }), ...mark([3]), ...say('CHANGE ONE WORD IN FILE 4'));
  await until(S(42));
  await play(...files(ALL, { tint: true, changed: true }), ...say('MONDAY BECOMES TUESDAY', C.amber),
    ...fbox(['File 1   starts Monday', ['File 4   starts Tuesday', C.amber]], C.amber));
  await until(S(43));
  await play(...say('ONLY ONE WORD CHANGED', C.amber),
    ...fbox([['99 of 100 words match', C.cyan], ['1 word differs', C.amber]], C.amber));
  await until(S(44));
  await play(...mark([0, 1, 2], C.cyan), ...say('EXACT MATCH FINDS THREE IDENTICAL FILES'),
    ...fbox());
  await until(S(45));
  await play(...mark([1, 2], C.pink), ...say('EXACT MATCH REMOVES TWO', C.pink));
  await play(...mark(), ...files(EXACT, { tint: true, changed: true }),
    ...fbox(['6 files × 100 words', ['600 words in all', C.violet]]));
  await until(S(46));
  await play(...mark([0, 3], C.cyan), ...say('TWO WELCOME WEEK VERSIONS'),
    ...fbox(['100 + 100 words', ['200 Welcome Week words', C.cyan]]));
  await until(S(47));
  await play(...say('FIND THEIR SHARE TOGETHER'),
    ...fbox(['200 ÷ 600', ['About 33%', C.amber]], C.amber));
  await until(S(48));
  await play(...say('ALMOST IDENTICAL COPIES ARE NEAR-DUPLICATES', C.amber),
    ...fbox(['File 1   starts Monday', ['File 4   starts Tuesday', C.amber]], C.amber));
  await until(S(49));
  await play(...say('COUNT THE WORDS THE FILES SHARE'),
    ...fbox([['99 words match', C.cyan], ['1 word differs', C.amber]], C.amber));
  await until(S(50));
  await play(...mark([3], C.pink), ...say('IF THE CHANGED COPY IS UNWANTED', C.pink));
  await play(...mark(), ...files(KEPT, { tint: true, compact: true }),
    ...fbox(['100 ÷ 500', ['Back to 20%', C.cyan]]));
  await until(S(51));
  await play(...files(EXACT, { tint: true, changed: true }), ...mark([3]), ...say('CHECK WHAT THE CHANGED WORD MEANS', C.amber),
    ...fbox(['Monday or Tuesday?', ['Did the start day change?', C.amber]], C.amber));
  await until(S(52));
  await play(...mark(), ...fbox(), ...showNetwork(), ...signal('Different newsletters reach the model', C.green),
    ...say('LESS UNWANTED REPETITION', C.green));
}
