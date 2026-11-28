// Shared toolkit for "Try it" simulations. A lesson sim is site/sim/<id>.js:
//   export default function mount(root, kit) { ...; return () => {/* cleanup */} }
// The player opens it in a panel. Keep the course look: dark navy, glowing cyan data, pills, mono formula box.

export const C = { bg: '#0b1020', ink: '#eef2ff', muted: '#7d89b0', line: '#26305a', card: '#0f1630',
  cyan: '#5ad7e8', pink: '#f472b6', amber: '#fbbf24', green: '#86efac', violet: '#a78bfa' };

// h('div', {class: 'x', onclick: fn}, child, 'text') -> element
export function h(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}

// s('rect', {x, y, ...}) -> SVG element
export function s(tag, attrs = {}, ...kids) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) e.setAttribute(k, v);
  for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}

export const btn = (label, onclick, kind = '') => h('button', { class: 'sim-btn ' + kind, onclick }, label);
export const pill = (label, color = C.cyan) => h('span', { class: 'sim-pill', style: { color, borderColor: color } }, label);

// Formula box: lines = ['text', ['text', color], ...]
export function fbox(el, lines) {
  el.className = 'sim-fbox';
  el.replaceChildren(...lines.map(l => Array.isArray(l) ? h('div', { style: { color: l[1] } }, l[0]) : h('div', {}, l)));
}

export const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const fmt = x => Number.isInteger(x) ? String(x) : x.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');

// Challenges: list of {text, check(state) -> bool, why}. Call update(state) after every change.
export function challenges(el, list) {
  let i = 0, done = new Set();
  el.className = 'sim-ch';
  const head = h('div', { class: 'sim-ch-head' });
  const body = h('div', { class: 'sim-ch-text' });
  const why = h('div', { class: 'sim-ch-why' });
  const nav = h('div', { class: 'sim-ch-nav' });
  el.replaceChildren(head, body, why, nav);
  const draw = () => {
    head.replaceChildren(pill(`CHALLENGE ${i + 1} OF ${list.length}`, C.amber), done.has(i) ? pill('✓ DONE', C.green) : '');
    body.textContent = list[i].text;
    why.textContent = done.has(i) ? list[i].why : '';
    nav.replaceChildren(
      i > 0 ? btn('‹ Previous', () => { i--; draw(); }, 'ghost') : '',
      i < list.length - 1 ? btn('Next challenge ›', () => { i++; draw(); }, done.has(i) ? 'go' : 'ghost') : (done.size === list.length ? pill('ALL CHALLENGES DONE', C.green) : ''));
  };
  draw();
  return {
    update(state) { if (!done.has(i) && list[i].check(state)) { done.add(i); draw(); } },
    get index() { return i; }
  };
}

export const CSS = `
.sim { max-width: 980px; margin: 0 auto; color: ${C.ink}; font: 1rem/1.5 "Segoe UI", Inter, Arial, sans-serif; }
.sim h2 { margin: 0 0 .45rem; font-size: clamp(1.4rem, 3vw, 2rem); line-height: 1.16; text-wrap: balance; }
.sim .sub { max-width: 68ch; margin: 0 0 1.2rem; color: #b2bdd9; }
.sim-grid > * { min-width: 0; overflow-wrap: anywhere; }
.sim-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1rem; align-items: start; }
@media (min-width: 54rem) { .sim-grid { grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); } }
.sim-card { min-width: 0; background: ${C.card}; border: 1px solid #344264; border-radius: .9rem; padding: clamp(.7rem, 1.6vw, 1.1rem); }
.sim-card + .sim-card { margin-top: 1rem; }
.sim svg { width: 100%; height: auto; display: block; touch-action: none; }
.sim-pill { display: inline-block; max-width: 100%; overflow-wrap: anywhere; border: 1px solid; border-radius: 999px; padding: .2rem .65rem; font: 700 .8125rem/1.4 Consolas, monospace; letter-spacing: .04em; }
.sim-fbox { font: 1rem/1.55 Consolas, monospace; background: ${C.bg}; border: 1px solid ${C.cyan}; border-radius: .65rem; padding: .65rem .85rem; white-space: pre-wrap; overflow-wrap: anywhere; }
.sim-row, .sim-ch-nav, .sim-ch-head { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; }
.sim-row, .sim-ch-nav { margin-top: .8rem; }
.sim-btn { max-width: 100%; font: inherit; font-weight: 650; border: 1px solid #536485; background: #18213a; color: ${C.ink}; border-radius: .65rem; padding: .45rem .8rem; min-height: 44px; cursor: pointer; }
.sim-btn.go { background: ${C.cyan}; color: #06202a; border-color: ${C.cyan}; }
.sim-btn.ghost { background: transparent; }
.sim-btn:hover:enabled { border-color: ${C.cyan}; }
.sim-btn:active { transform: translateY(1px); }
.sim-btn:focus-visible { outline: 2px solid ${C.cyan}; outline-offset: 3px; }
.sim-ch-head { margin-bottom: .6rem; }
.sim-ch-text { font-size: 1.0625rem; font-weight: 650; line-height: 1.4; }
.sim-ch-why { color: ${C.green}; margin-top: .5rem; }
.sim-ch-why:empty, .sim-ch-nav:empty { display: none; }
.sim-note { color: #b2bdd9; font-size: .9375rem; margin-top: .65rem; line-height: 1.45; }
@media (max-width: 32rem) {
  .sim-row:not(:has(> :not(.sim-btn))) { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr)); }
  .sim-row .sim-btn { min-width: 0; }
  .sim-row input[type="range"] { min-width: 0; max-width: 100%; }
  .sim-ch-nav .sim-btn { flex: 1 1 auto; }
}
`;
