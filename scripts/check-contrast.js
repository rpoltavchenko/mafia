/*
 * Colour contrast check for every theme × phase combination.
 *
 * How to run: start the app (npm run dev), open it in Chrome, open DevTools →
 * Console, paste this whole file and press Enter. It prints one line per
 * combination; every line should say "all pass".
 *
 * Targets (WCAG 2.2 AA): 4.5:1 for text, 3:1 for UI elements such as dots and
 * accent outlines. See-through surfaces are layered over a worst-case sky colour
 * for each phase (e.g. the bright orange part of the day sky).
 */
(() => {
  const root = document.documentElement;
  const probe = document.createElement('div');
  document.body.appendChild(probe);

  const parse = (c) => {
    let m = c.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
      return [p[0], p[1], p[2], p[3] ?? 1];
    }
    m = c.match(/color\(srgb ([^)]+)\)/);
    if (m) {
      const p = m[1].split(/[ /]+/).filter(Boolean).map(Number);
      return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1];
    }
    throw new Error(`Cannot parse colour: ${c}`);
  };
  const resolve = (v) => {
    probe.style.color = '';
    probe.style.color = v;
    return parse(getComputedStyle(probe).color);
  };
  const tok = (n) => getComputedStyle(root).getPropertyValue(n).trim();
  const over = (top, bottom) => [0, 1, 2].map((i) => top[i] * top[3] + bottom[i] * (1 - top[3])).concat(1);
  const lum = ([r, g, b]) => {
    const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };

  if (!tok('--surface-page')) throw new Error('Styles not loaded yet — wait a moment and try again.');

  // Worst-case sky colour behind see-through cards, per phase
  const backdrops = {
    neon: { none: null, night: '#081131', day: '#ff8a5b', voting: '#3a0a2e' },
    classic: { none: null, night: '#060a1c', day: '#3d2a22', voting: '#1d0a14' },
  };
  const roles = ['civilian', 'mafia', 'don', 'sheriff', 'doctor', 'maniac', 'lover'];
  const saved = [root.dataset.theme, root.dataset.phase];
  const lines = [];

  for (const theme of ['classic', 'neon']) {
    for (const phase of ['none', 'night', 'day', 'voting']) {
      root.dataset.theme = theme;
      root.dataset.phase = phase;
      const page = resolve(tok('--surface-page'));
      const bd = backdrops[theme][phase];
      const base = bd ? resolve(bd) : page;
      const card = over(resolve(tok('--surface-1')), base);
      const button = over(resolve(tok('--surface-2')), card);
      const inset = over(resolve(tok('--surface-inset')), card);
      const onCard = (n) => over(resolve(tok(n)), card);
      const checks = [];
      const add = (name, fg, bg, min) => checks.push({ name, v: +ratio(fg, bg).toFixed(2), min });

      add('text/card', onCard('--text'), card, 4.5);
      add('text/button', onCard('--text'), button, 4.5);
      add('text/inset', onCard('--text'), inset, 4.5);
      add('muted/card', onCard('--text-muted'), card, 4.5);
      add('muted/inset', onCard('--text-muted'), inset, 4.5);
      add('muted/button', onCard('--text-muted'), button, 4.5);
      add('heading/card', onCard('--text-heading'), card, 4.5);
      add('success/card', onCard('--success-text'), card, 4.5);
      add('danger/card', onCard('--danger-text'), card, 4.5);
      for (const t of ['town', 'mafia', 'neutral']) add(`team-${t}`, onCard(`--team-${t}`), card, 4.5);
      add('accent', onCard('--accent'), card, 3);
      add('highlight', onCard('--highlight'), card, 3);

      const fill = tok('--accent-fill');
      const stops = fill.includes('gradient')
        ? [...fill.matchAll(/(#[0-9a-f]{3,8}|rgba?\([^)]+\)|color\([^)]+\))/gi)].map((m) => m[0])
        : [fill];
      stops.forEach((s, i) => add(`on-accent/fill-stop-${i}`, resolve(tok('--on-accent')), over(resolve(s), card), 4.5));
      const primary = tok('--btn-primary-bg');
      if (!primary.includes('gradient')) add('primary button', resolve(tok('--btn-primary-text')), over(resolve(primary), card), 4.5);
      const cta = tok('--btn-cta-bg');
      add('cta button', resolve(tok('--btn-cta-text')), cta.includes('transparent') ? card : over(resolve(cta), card), 4.5);

      const insetTok = tok('--surface-inset');
      for (const r of roles) {
        const rv = tok(`--role-${r}`);
        add(`badge-${r}`, over(resolve(`color-mix(in srgb, ${rv} 55%, white)`), card), over(resolve(`color-mix(in srgb, ${rv} 18%, ${insetTok})`), card), 4.5);
        add(`selected-chip-${r}`, onCard('--text'), over(resolve(`color-mix(in srgb, ${rv} 32%, ${insetTok})`), card), 4.5);
        add(`dot-${r}`, over(resolve(rv), card), card, 3);
      }

      const fails = checks.filter((c) => c.v < c.min);
      const minText = Math.min(...checks.filter((c) => c.min === 4.5).map((c) => c.v));
      lines.push(`${theme}/${phase}: min text ${minText}:1 — ` + (fails.length ? 'FAIL ' + fails.map((f) => `${f.name} ${f.v}`).join(', ') : 'all pass'));
    }
  }

  probe.remove();
  root.dataset.theme = saved[0];
  root.dataset.phase = saved[1];
  console.log(lines.join('\n'));
  return lines;
})();
