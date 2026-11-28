// 11.3.9 Try it: change this week's counts and see both forecasts.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = { north: 40, south: 30 };
  const MAX = 80;
  let north = START.north;
  let south = START.south;

  const svg = s('svg', {
    viewBox: '0 0 400 300', role: 'img',
    'aria-label': 'This week’s counts and next week’s forecasts'
  });
  const box = h('div', { 'aria-live': 'polite' });
  const challengeHost = h('div');
  const northReadout = h('span');
  const southReadout = h('span');
  const northSlider = h('input', { type: 'range', min: 0, max: MAX, step: 1, value: north, style: { width: '100%', accentColor: C.cyan } });
  const southSlider = h('input', { type: 'range', min: 0, max: MAX, step: 1, value: south, style: { width: '100%', accentColor: C.pink } });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: forecast two stores'),
    h('p', { class: 'sub' }, 'Change how many cases customers want this week and watch next week’s forecasts. The hollow dots show forecasts. The arrows show which counts each forecast uses.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('label', { style: { display: 'block', marginTop: '.6rem', color: C.cyan } }, northReadout, northSlider),
        h('label', { style: { display: 'block', marginTop: '.6rem', color: C.pink } }, southReadout, southSlider),
        h('div', { class: 'sim-row' },
          btn('New data', () => {
            // An offset from 1 to MAX changes each slider to a different valid count.
            setCounts((north + rnd(1, MAX)) % (MAX + 1), (south + rnd(1, MAX)) % (MAX + 1));
          }, 'go'),
          btn('Reset', () => setCounts(START.north, START.south)))),
      h('div', {},
        h('div', { class: 'sim-card' }, box),
        h('div', { class: 'sim-card' }, challengeHost)))));

  const checks = challenges(challengeHost, [
    {
      text: 'Keep South at 30 and raise its forecast from 30 to 35 by changing North.',
      check: state => state.south === 30 && state.southNext === 35,
      why: 'An extra 20 cases at North adds a quarter of 20, or 5 cases, to South’s forecast.'
    },
    {
      text: 'Keep North at 40 and lower South’s forecast to 25 by changing South.',
      check: state => state.north === 40 && state.southNext === 25,
      why: 'Ten fewer cases at South cuts its forecast by 5 cases, and North’s forecast stays at 40.'
    },
    {
      text: 'Change both stores’ counts and keep South’s forecast at 30.',
      check: state => state.north !== START.north && state.south !== START.south && state.southNext === 30,
      why: 'The change in half of South’s count balances the change in a quarter of North’s count.'
    }
  ]);

  northSlider.addEventListener('input', () => setCounts(northSlider.valueAsNumber, south));
  southSlider.addEventListener('input', () => setCounts(north, southSlider.valueAsNumber));
  challengeHost.addEventListener('click', () => {
    // The kit changes the active challenge before the click bubbles here.
    checks.update(forecasts());
  });

  function setCounts(northCount, southCount) {
    north = northCount;
    south = southCount;
    northSlider.value = north;
    southSlider.value = south;
    draw();
  }

  function forecasts() {
    const northOwn = 0.75 * north;
    const southOwn = 0.5 * south;
    const fromNorth = 0.25 * north;
    return {
      north, south, northOwn, southOwn, fromNorth,
      northNext: 10 + northOwn,
      southNext: 5 + southOwn + fromNorth
    };
  }

  const X_NOW = 108;
  const X_NEXT = 268;
  const y = value => 237 - value * 2.46;

  function label(value, x, yy, color = C.ink, anchor = 'middle', size = 15) {
    return s('text', {
      x, y: yy, fill: color, 'text-anchor': anchor,
      'font-family': 'Segoe UI, Arial, sans-serif', 'font-size': size
    }, value);
  }

  function point(x, yy, color, hollow) {
    return s('g', {},
      s('circle', { cx: x, cy: yy, r: 10, fill: color, 'fill-opacity': .15 }),
      s('circle', { cx: x, cy: yy, r: 5.6, fill: hollow ? C.bg : color, stroke: color, 'stroke-width': 2 }));
  }

  function path(fromY, toY, color, shared = false) {
    const start = `${X_NOW + 10} ${fromY}`;
    const end = `${X_NEXT - 12} ${toY}`;
    return s('path', {
      d: shared
        ? `M ${start} C 167 ${fromY + 24}, 209 ${toY + 24}, ${end}`
        : `M ${start} L ${end}`,
      fill: 'none', stroke: color, 'stroke-width': 2.1, 'stroke-opacity': .88,
      'stroke-dasharray': shared ? '5 4' : null
    });
  }

  function tip(fromY, toY, color, shared = false) {
    const x = X_NEXT - 10;
    const direction = Math.atan2(shared ? -24 : toY - fromY, shared ? X_NEXT - 12 - 209 : X_NEXT - X_NOW - 22);
    const wing = angle => `${x - 7 * Math.cos(angle)},${toY - 7 * Math.sin(angle)}`;
    return s('polygon', { points: `${x},${toY} ${wing(direction - 0.5)} ${wing(direction + 0.5)}`, fill: color });
  }

  function draw() {
    const state = forecasts();
    const { northOwn, southOwn, fromNorth, northNext, southNext } = state;
    const grid = [0, 20, 40, 60, 80].flatMap(value => [
      s('line', { x1: 34, x2: 375, y1: y(value), y2: y(value), stroke: C.line }),
      label(String(value), 28, y(value) + 5, C.muted, 'end', 14)
    ]);

    // Keep the exact heights on the scale and offset the stores horizontally.
    // Their labels sit on separate sides, so equal counts remain legible.
    const northY = y(north);
    const southY = y(south);
    const northNextY = y(northNext);
    const southNextY = y(southNext);
    const northX = X_NOW - 8;
    const southX = X_NOW + 8;
    const northNextX = X_NEXT - 8;
    const southNextX = X_NEXT + 8;
    const guide = (x1, x2, yy, color) => s('line', { x1, x2, y1: yy, y2: yy, stroke: color, 'stroke-width': 2 });

    svg.replaceChildren(
      label('Cases', 35, 21, C.muted, 'start', 14), ...grid,
      path(northY, northNextY, C.cyan),
      path(southY, southNextY, C.pink),
      path(northY, southNextY, C.cyan, true),
      tip(northY, northNextY, C.cyan),
      tip(southY, southNextY, C.pink),
      tip(northY, southNextY, C.cyan, true),
      guide(northX + 6, X_NOW + 11, northY, C.cyan),
      guide(X_NEXT - 10, southNextX - 6, southNextY, C.pink),
      point(northX, northY, C.cyan, false),
      point(southX, southY, C.pink, false),
      point(northNextX, northNextY, C.cyan, true),
      point(southNextX, southNextY, C.pink, true),
      label(fmt(north), northX - 11, northY + 5, C.cyan, 'end', 17),
      label(fmt(south), southX + 11, southY + 5, C.pink, 'start', 17),
      label(fmt(northNext), northNextX - 12, northNextY - 10, C.cyan, 'end', 17),
      label(fmt(southNext), southNextX + 12, southNextY + 5, C.pink, 'start', 17),
      label('This week', X_NOW, 264),
      label('Next week', X_NEXT, 264),
      label('North', 136, 291, C.cyan),
      label('South', 242, 291, C.pink)
    );
    svg.setAttribute('aria-label', `This week: North ${fmt(north)}, South ${fmt(south)}. Next week’s forecasts: North ${fmt(northNext)}, South ${fmt(southNext)} cases.`);
    northReadout.textContent = `North this week · ${north} cases`;
    southReadout.textContent = `South this week · ${south} cases`;
    fbox(box, [
      ['North next week', C.cyan],
      `¾ of ${north} = ${fmt(northOwn)}`,
      `10 + ${fmt(northOwn)} = ${fmt(northNext)} cases`,
      ['South next week', C.pink],
      `½ of ${south} = ${fmt(southOwn)}`,
      `¼ of ${north} = ${fmt(fromNorth)}`,
      `5 + ${fmt(southOwn)} + ${fmt(fromNorth)} = ${fmt(southNext)} cases`
    ]);
    checks.update(state);
  }

  draw();
}
