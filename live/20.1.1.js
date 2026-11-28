// 20.1.1 Corpus curation: choosing what a language model reads.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, C, S, T, showA, until, play } = L;
  // Laptop: centred pictures, except the block stacks (23-42) which sit left of the formula box.
  // Phone: pictures stacked tall, formula box below the picture, so the whole height is used.
  let CX = 0;
  let BOX = P ? [0, -5.7, 0] : [0, -2.75, 0];
  let MID = P ? -2.0 : -0.45;
  const BASE = P ? -6.1 : -2.6;
  const PITCH = P ? 1.3 : 0.84;
  const PW = P ? 3.1 : 1.85, PH = P ? 2.2 : 1.7;
  const BLK = P ? 1.5 : 1.7;
  const names = ['Newsletters', 'Club notices', 'Menus', 'Ads'];
  const counts = [4, 2, 2, 2];
  const x = i => CX + (i - 1.5) * (P ? 1.85 : 2.2);
  // phone: the four source cards form a 2 x 2 grid
  const gx = i => P ? (i % 2 ? 1.75 : -1.75) : x(i);
  const gy = i => P ? (i < 2 ? -0.1 : -3.3) : MID + 0.3;
  const words = n => n.toLocaleString('en-US');
  const say = (label, color = C.cyan) => showA(label, color, P ? [0, 2.25, 0] : [CX, 1.85, 0]);
  const fade = m => new M.FadeIn(m, { runTime: 0.45 });
  const out = m => new M.FadeOut(m, { runTime: 0.35 });
  const reveal = ms => new M.LaggedStart(ms.map(fade), { lagRatio: 0.18, runTime: 1.15 });

  function text(label, px, py, size = 20, color = C.ink, mono = false, maxWidth = 6.8) {
    const t = T(label, size, color, mono);
    if (t.getWidth() > maxWidth) t.scale(maxWidth / t.getWidth());
    return t.moveTo([px, py, 0]);
  }

  function rect(px, py, width, height, color, fill = C.card, opacity = 0.94) {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.09, color, strokeWidth: 2 });
    r.setFill(fill, opacity);
    return r.moveTo([px, py, 0]);
  }

  function page(px, py, label, color = C.cyan, width = PW, height = PH) {
    const paper = rect(px, py, width, height, color);
    const title = text(label, px, py + height * 0.22, 20, color, false, width - 0.18);
    const lines = [0, 1, 2].map(i => {
      const y = py - i * height * 0.15;
      return new M.Line({
        start: [px - width * 0.36, y, 0],
        end: [px + width * (i === 2 ? 0.16 : 0.36), y, 0],
        color: C.muted, strokeWidth: 2,
      });
    });
    return new M.VGroup(paper, title, ...lines);
  }

  let picture = [];
  function replace(next) {
    const animations = [...picture.map(out), ...next.map(fade)];
    picture = next;
    return animations;
  }
  function add(...objects) {
    picture.push(...objects);
    return objects.map(fade);
  }
  function remove(...objects) {
    picture = picture.filter(o => !objects.includes(o));
    return objects.map(out);
  }

  let boxNow;
  function formula(lines, color = C.cyan, at = BOX) {
    const animations = boxNow ? [out(boxNow)] : [];
    boxNow = null;
    if (!lines.length) return animations;
    const BOX = at;
    const width = P ? 6.9 : (CX < 0 ? 4.8 : 6.4);
    const pitch = P ? 0.5 : 0.42;
    const height = lines.length * pitch + 0.18;
    const frame = rect(BOX[0], BOX[1], width, height, color);
    const rows = lines.map((line, i) => {
      const [label, ink] = Array.isArray(line) ? line : [line, C.ink];
      return text(label, BOX[0], BOX[1] + ((lines.length - 1) / 2 - i) * pitch,
        P ? 22 : 24, ink, true, width - 0.34);
    });
    boxNow = new M.VGroup(frame, ...rows);
    return [...animations, fade(boxNow)];
  }

  function rowCards(labels, colors, y, width = PW) {
    return labels.map((label, i) => page(
      CX + (i - (labels.length - 1) / 2) * (width + 0.24), y, label, colors[i], width,
    ));
  }

  // 0–10. A campus question, the pages, then the running word count.
  await until(S(0));
  const k0 = P ? 1.8 : 1;
  const student = new M.VGroup(
    new M.Circle({ radius: 0.45 * k0, color: C.cyan }).setFill(C.cyan, 0.85).moveTo([CX, MID + 0.8 * k0, 0]),
    rect(CX, MID - 0.15 * k0, 1.5 * k0, 1.1 * k0, C.cyan, C.cyan, 0.22),
    text('Campus information', CX, MID - 1.2 * k0, P ? 34 : 30),
  );
  await play(...replace([student]), ...say('HELP STUDENTS FIND CAMPUS INFORMATION'));

  await until(S(1));
  const qs = ['Library hours?', 'Which clubs?', 'Lunch today?'];
  await play(...replace(P
    ? qs.map((q, i) => page(0, -0.2 - i * 2.25, q, C.cyan, 5.2, 1.9))
    : rowCards(qs, [C.cyan, C.cyan, C.cyan], MID, 1.95)), ...say('CAMPUS QUESTIONS'));

  await until(S(2));
  await play(...say('WHERE CAN THE PROGRAM LEARN?', C.amber));

  await until(S(3));
  await play(...replace(P ? [
    rect(0, -2.3, 7.5, 8.2, C.muted),
    text('Campus website', 0, 1.2, 30),
    ...['News', 'Clubs', 'Food', 'Ads'].map((s, i) => page(gx(i), i < 2 ? -0.7 : -4.0, s, i === 3 ? C.pink : C.cyan, 3.1, 2.6)),
  ] : [
    rect(CX, MID, 7.6, 3.3, C.muted),
    text('Campus website', CX, MID + 1.4, 26),
    ...rowCards(['News', 'Clubs', 'Food', 'Ads'], [C.cyan, C.cyan, C.cyan, C.pink], MID - 0.2, 1.6),
  ]), ...say('COLLECT WRITTEN PAGES'));

  await until(S(4));
  const sources = names.map((name, i) => page(gx(i), gy(i), name, i === 3 ? C.pink : C.cyan));
  await play(...replace(sources), ...say('FOUR GROUPS OF PAGES'));

  const totals = [];
  for (let i = 0; i < counts.length; i++) {
    await until(S(5 + i));
    const color = i === 3 ? C.pink : C.cyan;
    totals.push(text(words(counts[i] * 10000), gx(i), gy(i) - PH / 2 - (P ? 0.4 : 0.35 + 0.3), P ? 28 : 24, color, true, P ? 2.8 : 1.6));
    await play(...add(totals[i]), ...say(names[i].toUpperCase(), color));
  }

  await until(S(9));
  await play(...formula(['40,000 + 20,000 + 20,000 + 20,000', ['100,000 words', C.amber]], C.cyan,
    P ? [0, -6.1, 0] : [0, -2.75, 0]), ...say('100,000 WORDS IN ALL', C.amber));

  await until(S(10));
  await play(...say('CORPUS = COLLECTION OF TEXT', C.green));

  // 11–17. A repeated phrase, a word prediction, and a signal through the model.
  const example = (label, y, color = C.cyan) => new M.VGroup(
    rect(CX, y, P ? 7 : 5.6, P ? 1.1 : 0.9, color),
    text(label, CX, y, P ? 28 : 26, color, true, P ? 6.6 : 5.2),
  );
  // a probability for each possible next token (chapter data: nine 50%, ten 25%, noon 25%)
  function probBars(y0) {
    const rows = [['nine', 50], ['ten', 25], ['noon', 25]];
    const pitch = P ? 1.25 : 0.75, full = P ? 4.4 : 5.0, left = CX - (P ? 1.6 : 1.9);
    return rows.flatMap(([w, p], i) => {
      const y = y0 - i * pitch, len = full * p / 100;
      const bar = rect(left + len / 2, y, len, P ? 0.6 : 0.45, C.amber, C.amber, 0.75);
      return [text(w, left - (P ? 0.9 : 0.8), y, P ? 26 : 24, C.ink, true),
        bar, text(p + '%', left + len + (P ? 0.75 : 0.6), y, P ? 26 : 22, C.amber, true)];
    });
  }

  await until(S(11));
  await play(...replace([
    example('Library opens at …', P ? 0.2 : MID + 1.0),
    ...probBars(P ? -1.8 : MID - 0.2),
  ]), ...formula([]), ...say('A PROBABILITY FOR EACH NEXT TOKEN', C.amber));

  await until(S(12));
  await play(...replace([
    example('Library opens at nine', P ? -0.4 : MID + 1.2),
    example('Library opens at ten', P ? -2.2 : MID),
    example('Library opens at noon', P ? -4.0 : MID - 1.2),
  ]), ...say('READ EXAMPLES, PRACTISE PREDICTING', C.amber));

  await until(S(13));
  await play(...say('FIRST STAGE OF LEARNING = PRETRAINING', C.green));

  await until(S(14));
  const netY = P ? -3.0 : -0.75;
  const NW = P ? 5.2 : 5.8;
  const N = L.net({ layers: [2, 3, 1], center: [CX, netY, 0],
    width: NW, height: P ? 4.4 : 3.3, r: P ? 0.45 : 0.4 });
  await play(...replace([N.group]), ...say('NEURONS IN LAYERS, JOINED BY WEIGHTS'));
  const [nx, ny] = N.pos(1, 0);
  const neuronRing = new M.Circle({ radius: P ? 0.58 : 0.52, color: C.amber, strokeWidth: 2 });
  neuronRing.moveTo([nx, ny, 0]);
  await play(...add(neuronRing));

  await until(S(15));
  const input = text('Library opens at', CX, netY - (P ? 3.25 : 2.5), P ? 26 : 22, C.violet, true, 4.6);
  const prediction = text('nine', CX + NW / 2 + (P ? -0.45 : 1.05), netY + (P ? -1.2 : 0), P ? 30 : 28, C.amber, true);
  await play(...remove(neuronRing), ...add(input), ...say('THE WORDS ENTER AS NUMBERS', C.violet));

  await until(S(16));
  await play(...N.flow(0), ...say('NUMBERS TRAVEL LEFT TO RIGHT'));
  await play(...N.flow(1));
  await play(...add(prediction));

  await until(S(17));
  await play(...say('THE CHOSEN TEXT SHAPES WHAT THE MODEL LEARNS', C.green));

  // 18–22. The bookshelf makes the choice of reading material visible.
  function books(labels) {
    const shelfY = P ? -4.6 : MID - 1.3;
    const pitch = P ? 1.05 : 1.2, bw = P ? 0.95 : 1.1;
    const shelf = rect(CX, shelfY, P ? 7.6 : 8.8, 0.16, C.muted, C.muted, 0.55);
    const items = labels.map(([label, color], i) => {
      const h = (P ? 3.6 : 2.2) + (i % 3) * 0.25;
      const px = CX + (i - (labels.length - 1) / 2) * pitch;
      const py = shelfY + 0.08 + h / 2;
      const t = T(label, P ? 20 : 22, color, false, true);
      if (P) t.rotate(Math.PI / 2);
      t.moveTo([px, py, 0]);
      return new M.VGroup(rect(px, py, bw, h, color, color, 0.2), t);
    });
    return [shelf, ...items];
  }
  const campusBooks = [['News', C.cyan], ['Clubs', C.cyan], ['Menus', C.cyan]];

  await until(S(18));
  await play(...replace(books(campusBooks)), ...say('FILL A CAMPUS BOOKSHELF'));

  await until(S(19));
  await play(...replace(books([...campusBooks, ...Array.from({ length: 4 }, () => ['Ad', C.pink])])),
    ...say('MORE ADS ON THE SHELF, MORE ADS TO READ', C.pink));

  await until(S(20));
  const picks = ['Campus news', 'Club notices', 'Ads'], pickC = [C.cyan, C.cyan, C.pink];
  await play(...replace(P
    ? picks.map((s, i) => page(0, -0.2 - i * 2.25, s, pickC[i], 5.2, 1.9))
    : rowCards(picks, pickC, MID, 2.6)),
    ...say('THE MODEL READS THE TEXT WE PICK'));

  await until(S(21));
  await play(...remove(picture[2]), ...say('CHOOSE USEFUL TEXT FIRST', C.green));

  await until(S(22));
  await play(...say('CHOOSING AND PREPARING TEXT = CORPUS CURATION', C.green));

  // 23–42. Keep the stacks in place while the total and shares change.
  CX = P ? 0 : -2.2; BOX = P ? [0, 0.6, 0] : [4.5, -0.3, 0];
  const blockY = j => BASE + (j + 0.5) * PITCH;
  const stacks = counts.map((n, i) => Array.from({ length: n }, (_, j) => {
    const color = i === 3 ? C.pink : C.cyan;
    return rect(x(i), blockY(j), BLK, PITCH * 0.8, color, color, 0.73);
  }));
  const captions = names.map((name, i) =>
    text(name, x(i), BASE - 0.4, 22, i === 3 ? C.pink : C.ink, false, 1.8));

  let outline;
  function focus(i, length = counts[i], color = C.amber) {
    const next = rect(x(i), BASE + length * PITCH / 2, BLK + 0.25, length * PITCH + 0.11, color, C.bg, 0);
    const animations = outline ? remove(outline) : [];
    outline = next;
    return [...animations, ...add(next)];
  }
  const clearFocus = () => {
    if (!outline) return [];
    const animations = remove(outline);
    outline = null;
    return animations;
  };

  await until(S(23));
  await play(...replace(captions), reveal(stacks.flat()), ...say('MAKE ONE STACK FOR EACH GROUP'));
  picture.push(...stacks.flat());

  await until(S(24));
  await play(...formula([['1 block = 10,000 words', C.amber]]), ...say('EACH BLOCK IS 10,000 WORDS', C.amber));

  await until(S(25));
  await play(...focus(0), ...formula(['Newsletters', ['4 of 10 blocks', C.amber]]), ...say('FOUR OF TEN BLOCKS'));

  await until(S(26));
  await play(...formula(['Newsletters', ['4 of 10 blocks = 40%', C.amber]]), ...say('NEWSLETTERS MAKE UP 40%', C.amber));

  await until(S(27));
  await play(...clearFocus(), ...formula(['Each of the other three groups', ['2 of 10 blocks = 20%', C.amber]]),
    ...say('20% EACH'));

  await until(S(28));
  await play(...focus(3, 2, C.pink), ...formula([]), ...say('SET ASIDE THE ADVERTISING PAGES', C.pink));

  await until(S(29));
  await play(...clearFocus(), ...remove(...stacks[3], captions[3]), ...say('REMOVE TWO AD BLOCKS', C.pink));

  await until(S(30));
  await play(...formula(['8 blocks remain', ['80,000 words', C.amber]]), ...say('EIGHT BLOCKS REMAIN', C.amber));

  await until(S(31));
  await play(...focus(0), ...formula(['Newsletter words', ['40,000 before · 40,000 now', C.cyan]]),
    ...say('NEWSLETTERS STILL HAVE 40,000 WORDS'));

  await until(S(32));
  await play(...formula(['Newsletters', ['4 of 8 blocks', C.amber]]), ...say('FOUR OF THE EIGHT REMAINING BLOCKS'));

  await until(S(33));
  await play(...formula(['Newsletters', ['4 ÷ 8 = ½', C.amber]]), ...say('FOUR DIVIDED BY EIGHT IS ONE HALF', C.amber));

  await until(S(34));
  await play(...formula(['Newsletters', ['½ = 50%', C.amber]]), ...say('NEWSLETTERS NOW MAKE UP 50%', C.amber));

  await until(S(35));
  await play(...focus(1), ...formula(['Club notices', ['2 of 8 blocks', C.amber]]), ...say('TWO OF EIGHT BLOCKS'));

  await until(S(36));
  await play(...formula(['Club notices', ['2 ÷ 8 = ¼ = 25%', C.amber]]), ...say('ONE QUARTER IS 25%', C.amber));

  await until(S(37));
  await play(...focus(2), ...formula(['Cafeteria menus', ['2 ÷ 8 = ¼ = 25%', C.amber]]), ...say('MENUS ALSO MAKE UP 25%', C.amber));

  await until(S(38));
  await play(...focus(0), ...formula(['Newsletter words', ['40,000 → 40,000', C.cyan]]), ...say('THE NEWSLETTER WORD COUNT STAYS THE SAME'));

  await until(S(39));
  await play(...formula(['Newsletter share', ['40% → 50%', C.amber]]), ...say('NEWSLETTERS ARE A LARGER SHARE', C.amber));

  await until(S(40));
  await play(...clearFocus(), ...say('ONE FORMULA FOR EACH GROUP’S SHARE'));

  await until(S(41));
  await play(...formula(['Percentage =', ['group words ÷ total words × 100', C.amber]]),
    ...say('DIVIDE BY THE TOTAL, THEN MULTIPLY BY 100', C.amber));

  await until(S(42));
  await play(...formula(['Newsletters 40,000 ÷ 80,000 = 50%', 'Club notices 20,000 ÷ 80,000 = 25%',
    ['Menus        20,000 ÷ 80,000 = 25%', C.cyan]]), ...say('CHECK THE MIXTURE BEFORE LEARNING', C.green));

  // 43–53. The filter catches a useful notice, then the cost is counted.
  await until(S(43));
  CX = 0; BOX = P ? [0, -5.8, 0] : [0, -2.85, 0]; MID = P ? -2.6 : -0.45;
  await play(...replace([
    page(CX - 1.95, MID, 'Advertising page', C.pink, 3.6, 2.5),
    page(CX + 1.95, MID, 'Club notice', C.cyan, 3.6, 2.5),
  ]), ...formula([]), ...say('CHECK WHAT A FILTER REMOVES', C.amber));

  function notice(px, title, suffix, color) {
    const width = 3.6;
    return new M.VGroup(
      rect(px, MID, width, 2.5, color),
      text(title, px, MID + 0.8, 22, color, false, 3.3),
      text('FREE', px, MID + 0.05, 30, C.amber, true),
      text(suffix, px, MID - 0.75, 21, C.ink, false, 3.3),
    );
  }

  await until(S(44));
  const ad = notice(CX - 1.95, 'Advertising page', 'with purchase', C.pink);
  const clubCover = page(CX + 1.95, MID, 'Club notice', C.cyan, 3.6, 2.5);
  await play(...replace([ad, clubCover]), ...formula([['Remove any page with “free”', C.pink]], C.pink),
    ...say('FILTER ON THE WORD “FREE”', C.pink));

  await until(S(45));
  const tutoring = notice(CX + 1.95, 'Club notice', 'tutoring for students', C.cyan);
  await play(...remove(clubCover), ...add(tutoring), ...say('THE CLUB OFFERS FREE TUTORING'));

  await until(S(46));
  const empty = rect(CX + 1.95, MID, 3.6, 2.5, C.pink, C.bg, 0);
  const removed = text('Tutoring notice removed', CX + 1.95, MID, 22, C.pink, false, 3.3);
  await play(...remove(ad, tutoring), ...add(empty, removed), ...say('THE RULE REMOVES THE CLUB NOTICE TOO', C.pink));

  await until(S(47));
  const chunkX = i => CX + (i - 2) * (P ? 1.5 : 1.45);
  const chunks = Array.from({ length: 5 }, (_, i) => {
    const color = i === 4 ? C.pink : C.cyan;
    return new M.VGroup(
      rect(chunkX(i), MID, P ? 1.35 : 1.3, 1.2, color, color, i === 4 ? 0.12 : 0.3),
      text('4,000', chunkX(i), MID, P ? 20 : 22, color, true, 1.2),
    );
  });
  const clubLabel = text('Original club notices: 20,000 words', CX, MID + 1.2, P ? 24 : 26, C.ink, false, P ? 7.4 : 7.2);
  const lossLabel = text('Removed', chunkX(4), MID - 0.9, 22, C.pink);
  await play(...replace([clubLabel, ...chunks, lossLabel]),
    ...formula(['Club words removed', ['4,000 words', C.pink]], C.pink), ...say('THE FILTER REMOVES 4,000 CLUB WORDS', C.pink));

  await until(S(48));
  await play(...formula(['Removed ÷ original club words', ['4,000 ÷ 20,000 = ⅕', C.pink]], C.pink),
    ...say('ONE FIFTH OF THE CLUB TEXT', C.pink));

  await until(S(49));
  await play(...formula(['Share of club text removed', ['⅕ = 20%', C.pink]], C.pink),
    ...say('20% OF THE CLUB TEXT IS GONE', C.pink));

  await until(S(50));
  await play(...replace([
    page(CX - 1.95, MID, 'Club notices kept', C.cyan, 3.6, 2.5),
    notice(CX + 1.95, 'Removed club notice', 'tutoring for students', C.pink),
  ]), ...formula([]), ...say('THE MODEL SEES FEWER EXAMPLES OF STUDENT SERVICES', C.pink));

  await until(S(51));
  await play(...formula(['Club words kept: 16,000', ['A tutoring notice is missing', C.pink]], C.pink),
    ...say('A SMALLER CORPUS CAN LOSE USEFUL TEXT', C.amber));

  await until(S(52));
  await play(...say('REVIEW THE PAGES YOUR FILTER REMOVES', C.green));

  await until(S(53));
  const recap = L.net({ layers: [2, 3, 1], center: P ? [0, -3.6, 0] : [CX + 1.5, MID, 0],
    width: P ? 5.0 : 4.2, height: P ? 3.6 : 3.0, r: P ? 0.42 : 0.36 });
  await play(...replace([
    page(P ? 0 : CX - 3.2, P ? 0.3 : MID, 'Campus text', C.cyan, P ? 3.6 : 2.0, P ? 1.9 : 2.0),
    recap.group,
  ]), ...formula([]), ...say('CORPUS CURATION SHAPES WHAT THE MODEL LEARNS', C.green));
  await play(...recap.flow(0));
  await play(...recap.flow(1));
}
