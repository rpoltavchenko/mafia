/*
 * UI corner-case audit: finds text that spills out of buttons, chips, badges and
 * labels, and pages that scroll sideways.
 *
 * How to run: start the app (npm run dev), open it in Chrome, open DevTools →
 * Console and paste this file. Then run, for example:
 *
 *   await __auditRun({ sizes: [[1280, 800], [390, 844]], langs: ['en', 'uk'], themes: ['neon'] });
 *   __audit.issues   // [] means nothing overflows
 *
 * It loads the app in hidden frames with a worst-case game: 20 players, long
 * names (Latin and Cyrillic), a custom role with a long name, fouls, eliminated
 * players, and every player tile menu opened. Text deliberately cut with "…"
 * is not reported. Every scenario has an undo step, so Undo buttons show. Your saved
 * game, undo steps, language and theme are restored afterwards.
 */
/**
 * Worst-case game states, one per screen: { name: [state, hash?] }. Built on a saved game
 * (`base`). Also used by the Playwright screenshot tests (e2e/screens.spec.ts).
 */
window.__auditScenarios = function (base) {
  const names = ['Kateryna Shevchenko-Zakharchenko', 'Олександр Іваненко', 'Bo', '', 'Maximilian von Richthofen', 'Софія', 'Ivan', 'Anna-Maria', '', 'Yurii', 'Dmytro Kovalenko', 'Олена', 'Max', '', 'Taras Shevchenko', 'Ira', 'Bohdan Khmelnytskyi', 'Oksana', '', 'Pavlo'];
  const roleIds = ['mafia', 'mafia', 'mafia', 'don', 'sheriff', 'doctor', 'maniac', 'r_custom', ...Array(12).fill('civilian')];
  const players = names.map((n, i) => ({ id: 'q' + i, name: n || `#${i + 1}`, roleId: roleIds[i], alive: ![2, 9, 14].includes(i), fouls: [0, 1, 3, 4][i % 4], seen: i % 2 === 0, locked: false }));
  const roles = [...base.roles.filter((r) => !r.custom), { id: 'r_custom', name: 'Bodyguard of the Night Watch', team: 'town', nightAction: 'heal', color: 'var(--role-custom-1)', custom: true }];
  const roleCounts = { mafia: 3, don: 1, sheriff: 1, doctor: 1, maniac: 1, lover: 0, r_custom: 1, civilian: 12 };
  const alive = players.filter((p) => p.alive).map((p) => p.id);
  const big = {
    ...base, players, roles, roleCounts,
    log: [
      { round: 1, phase: 'night', key: 'log.killed', params: { name: '#3 Bo' } },
      { round: 1, phase: 'night', key: 'log.checkPositive', params: { role: 'sheriff', name: '#1 Kateryna Shevchenko-Zakharchenko' } },
      { round: 1, phase: 'voting', key: 'log.tie', params: { names: '#1 Kateryna Shevchenko-Zakharchenko, #5 Maximilian von Richthofen' } },
    ],
  };
  const nomin = [alive[0], alive[3], alive[5]];
  const v = (vote) => ({ stage: 'nominate', nominees: [], nominatedBy: {}, votes: {}, eliminated: [], ...vote });
  const scenarios = {
    setup: [{ ...big, phase: 'setup' }],
    assign: [{ ...big, phase: 'assign' }],
    reveal: [{ ...big, phase: 'reveal' }],
    night0: [{ ...big, phase: 'night', round: 0 }],
    night1: [{ ...big, phase: 'night', round: 1, night: { targets: { mafia: alive[2], sheriff: alive[0], don: alive[4], doctor: alive[2], r_custom: alive[1] } } }],
    dayTalk: [{ ...big, phase: 'day', round: 1, speech: { queue: alive, index: 0, discussionDone: false }, vote: v({}) }],
    daySpeech: [{ ...big, phase: 'day', round: 1, speech: { queue: alive, index: 2, discussionDone: true }, vote: v({ nominees: nomin, nominatedBy: { [nomin[0]]: alive[1], [nomin[1]]: alive[2] } }) }],
    voteNom: [{ ...big, phase: 'voting', round: 1, vote: v({ nominees: nomin }) }],
    voteVote: [{ ...big, phase: 'voting', round: 1, vote: v({ stage: 'vote', nominees: nomin, votes: { [nomin[0]]: 5, [nomin[1]]: 5 } }) }],
    voteDefense: [{ ...big, phase: 'voting', round: 1, vote: v({ stage: 'defense', nominees: nomin.slice(0, 2) }) }],
    voteTie: [{ ...big, phase: 'voting', round: 1, vote: v({ stage: 'tie', nominees: nomin.slice(0, 2) }) }],
    lastWord: [{ ...big, phase: 'voting', round: 1, vote: v({ stage: 'lastWord', nominees: nomin, eliminated: [nomin[0], nomin[1]] }) }],
    ended: [{ ...big, phase: 'ended', winner: 'neutral' }],
    rules: [{ ...big, phase: 'setup' }, 'rules'],
    host: [{ ...big, phase: 'setup' }, 'host'],
  };
  return scenarios;
};

window.__auditRun = async function (opts) {
  const KEY = 'mafia-game-v1';
  const UNDO_KEY = 'mafia-undo-v1';
  const BACKUP = 'mafia-audit-backup';
  // If a previous run was interrupted (e.g. the page reloaded), put the real game back first
  const pending = sessionStorage.getItem(BACKUP);
  if (pending) {
    const b = JSON.parse(pending);
    b.game ? localStorage.setItem(KEY, b.game) : localStorage.removeItem(KEY);
    b.lang ? localStorage.setItem('mafia-lang', b.lang) : localStorage.removeItem('mafia-lang');
    b.theme ? localStorage.setItem('mafia-theme', b.theme) : localStorage.removeItem('mafia-theme');
    b.undo ? localStorage.setItem(UNDO_KEY, b.undo) : localStorage.removeItem(UNDO_KEY);
  }
  const saved = { game: localStorage.getItem(KEY), lang: localStorage.getItem('mafia-lang'), theme: localStorage.getItem('mafia-theme'), undo: localStorage.getItem(UNDO_KEY) };
  sessionStorage.setItem(BACKUP, JSON.stringify(saved));
  const base = JSON.parse(saved.game || 'null');
  if (!base) {
    sessionStorage.removeItem(BACKUP);
    throw new Error('Open the app once so there is a saved game to build on.');
  }

  const scenarios = window.__auditScenarios(base);

  const combos = [];
  for (const [w, h] of opts.sizes) for (const lang of opts.langs) for (const theme of opts.themes) for (const name of opts.only || Object.keys(scenarios)) combos.push({ w, h, lang, theme, name });
  window.__audit = { done: false, total: combos.length, n: 0, issues: [] };

  const checkSel = '.btn, .chip, .role-badge, .pl, .tag, .check-result, .nominee-pill, .stepper, .segmented button, .seat, .pl-num, .tile-status, .tile-fouls, .featured-cat, .banner, .timer-speaker, .reveal-btn, .rules-team, .curtain-title, h1, h2, h3, label, .tile-seat, .steps li, .news li, .log li, .intro-step-btn, .rules-glance > div, .end-title, .total, .queue-more';

  const audit = async (c) => {
    const [state, hash] = scenarios[c.name];
    localStorage.setItem(KEY, JSON.stringify(state));
    // One undo step (same signature as src/game/storage.ts) so the Undo button is enabled
    const sig = JSON.stringify([state.phase, state.round, state.log.length, state.players.map((p) => [p.id, p.alive])]);
    localStorage.setItem(UNDO_KEY, JSON.stringify({ for: sig, past: [{ state, action: { type: 'KILL_PLAYER', id: 'q0' } }] }));
    localStorage.setItem('mafia-lang', c.lang);
    localStorage.setItem('mafia-theme', c.theme);
    const f = document.createElement('iframe');
    f.style.cssText = `position:fixed;left:-6000px;top:0;width:${c.w}px;height:${c.h}px;border:0`;
    f.src = '/' + (hash ? '#' + hash : '');
    document.body.appendChild(f);
    await new Promise((r) => (f.onload = r));
    await new Promise((r) => setTimeout(r, 650));
    const d = f.contentDocument;
    const win = f.contentWindow;
    d.querySelectorAll('.tile-main').forEach((b) => b.click()); // open every tile menu
    await new Promise((r) => setTimeout(r, 150));

    const found = [];
    if (d.documentElement.scrollWidth > c.w + 1) found.push(`page scrolls sideways by ${d.documentElement.scrollWidth - c.w}px`);
    // visible part of a text node: clipped by any overflow:hidden / ellipsis ancestor up to the checked element
    const clipRect = (node, stop) => {
      let a = node.parentElement;
      let rect = null;
      while (a) {
        const cs = win.getComputedStyle(a);
        if (cs.overflow !== 'visible' || cs.textOverflow === 'ellipsis') {
          const r = a.getBoundingClientRect();
          rect = rect
            ? { left: Math.max(rect.left, r.left), right: Math.min(rect.right, r.right), top: Math.max(rect.top, r.top), bottom: Math.min(rect.bottom, r.bottom) }
            : { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
        }
        if (a === stop) break;
        a = a.parentElement;
      }
      return rect;
    };
    for (const el of d.querySelectorAll(checkSel)) {
      if (!el.offsetParent && win.getComputedStyle(el).position !== 'fixed') continue;
      const r = el.getBoundingClientRect();
      if (!r.width) continue;
      const walker = d.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let t;
      let bad = null;
      while ((t = walker.nextNode())) {
        if (!t.textContent.trim()) continue;
        const pcs = win.getComputedStyle(t.parentElement);
        if (pcs.display === 'none' || pcs.visibility === 'hidden' || t.parentElement.closest('[hidden]')) continue;
        // deliberately positioned overlays inside the element (e.g. corner badges) are by design
        let overlay = false;
        for (let a = t.parentElement; a && a !== el; a = a.parentElement) if (win.getComputedStyle(a).position === 'absolute') overlay = true;
        if (overlay) continue;
        const range = d.createRange();
        range.selectNodeContents(t);
        for (const tr of range.getClientRects()) {
          let box = { left: tr.left, right: tr.right, top: tr.top, bottom: tr.bottom };
          const clip = clipRect(t, el);
          if (clip) box = { left: Math.max(box.left, clip.left), right: Math.min(box.right, clip.right), top: Math.max(box.top, clip.top), bottom: Math.min(box.bottom, clip.bottom) };
          if (box.right <= box.left) continue;
          const over = Math.max(box.right - r.right, r.left - box.left, box.bottom - r.bottom - 2, r.top - box.top - 2);
          if (over > 1.5) {
            bad = `"${t.textContent.trim().slice(0, 26)}" +${Math.round(over)}px`;
            break;
          }
        }
        if (bad) break;
      }
      if (bad) found.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 2).join('.')}: ${bad}`);
    }
    f.remove();
    const uniq = [...new Set(found)];
    if (uniq.length) window.__audit.issues.push({ where: `${c.name} ${c.w}x${c.h} ${c.lang}/${c.theme}`, count: uniq.length, issues: uniq.slice(0, 6) });
  };

  try {
    for (const c of combos) {
      await audit(c);
      window.__audit.n++;
    }
  } finally {
    sessionStorage.removeItem(BACKUP);
    saved.game ? localStorage.setItem(KEY, saved.game) : localStorage.removeItem(KEY);
    saved.lang ? localStorage.setItem('mafia-lang', saved.lang) : localStorage.removeItem('mafia-lang');
    saved.theme ? localStorage.setItem('mafia-theme', saved.theme) : localStorage.removeItem('mafia-theme');
    saved.undo ? localStorage.setItem(UNDO_KEY, saved.undo) : localStorage.removeItem(UNDO_KEY);
    window.__audit.done = true;
  }
  return window.__audit.issues;
};
