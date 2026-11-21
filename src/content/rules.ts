import { NIGHT_ORDER } from '../game/roles';
import type { GameState, RoleDef } from '../game/types';
import type { Lang } from '../i18n/I18nContext';

export interface RulesSection {
  icon: string;
  title: string;
  items: string[];
}

type Params = Record<string, string | number>;

const TEXT = {
  en: {
    title: 'Mafia — game rules',
    goal: 'Goal',
    goalTown: 'Town wins when every Mafia member{maniac} is out of the game.',
    goalManiacSuffix: ' and the Maniac',
    goalMafia: 'Mafia wins when they equal or outnumber everyone else.',
    goalManiac: 'The Maniac plays alone and wins if only they and one other player are left.',
    roles: 'Roles in this game ({n} players)',
    night: 'Night',
    night1: 'Everyone closes their eyes and stays silent.',
    night2: 'The host wakes roles one at a time: {order}. Open your eyes only when your role is called, and act silently with gestures.',
    night3: 'In the morning the host announces who was killed.',
    nightDoctor: 'A player saved by the Doctor survives the night.',
    day: 'Day',
    day1: 'The day starts with an open discussion ({sec} s) — anyone can talk.',
    day2: 'Then every alive player speaks for {sec} s, in seat order. The first speaker moves one seat each day.',
    day3: 'At the end of your speech you may nominate one player for the vote. A player who is already nominated cannot be nominated again.',
    voting: 'Voting',
    vote1: 'Only nominated players can be voted out. If nobody is nominated, nobody leaves that day.',
    vote2: 'Every alive player votes exactly once. The host calls the nominees in order — votes not given to anyone earlier go to the last nominee.',
    vote3: 'The player with the most votes is out and gets {sec} s for a last word.',
    vote4: 'Tie: each tied player gets {sec} s to defend themselves, then everyone votes again. If it is still a tie, the host decides whether all tied players leave or nobody does.',
    conduct: 'Table rules',
    conduct1: 'Speak only during your turn or the open discussion. Talking out of turn earns a foul; the host decides penalties for repeated fouls.',
    conduct2: 'No peeking at night, no oaths, and never show your role card.',
    conduct3: 'Eliminated players stay silent and do not reveal their role.',
    conduct4: "The host's decision is final.",
    custom: '{team} · {action}',
  },
  uk: {
    title: 'Мафія — правила гри',
    goal: 'Мета',
    goalTown: 'Місто перемагає, коли з гри вибувають усі мафіозі{maniac}.',
    goalManiacSuffix: ' та маніяк',
    goalMafia: 'Мафія перемагає, коли її стає стільки ж або більше, ніж усіх інших.',
    goalManiac: 'Маніяк грає сам за себе й перемагає, якщо в грі залишаються лише він та ще один гравець.',
    roles: 'Ролі в цій грі ({n} гравців)',
    night: 'Ніч',
    night1: 'Усі заплющують очі й мовчать.',
    night2: 'Ведучий будить ролі по черзі: {order}. Розплющуйте очі лише тоді, коли назвали вашу роль, і дійте мовчки, жестами.',
    night3: 'Вранці ведучий оголошує, кого вбили.',
    nightDoctor: 'Гравець, якого врятував лікар, переживає ніч.',
    day: 'День',
    day1: 'День починається з вільного обговорення ({sec} с) — говорити може кожен.',
    day2: 'Потім кожен живий гравець має {sec} с на промову, по черзі за місцями. Щодня перший промовець зсувається на одне місце.',
    day3: 'Наприкінці своєї промови можна виставити на голосування одного гравця. Того, кого вже виставили, виставити вдруге не можна.',
    voting: 'Голосування',
    vote1: 'Вигнати можна лише виставлених гравців. Якщо нікого не виставили, цього дня ніхто не вибуває.',
    vote2: 'Кожен живий гравець голосує рівно один раз. Ведучий називає виставлених по черзі — голоси, не віддані нікому раніше, йдуть останньому виставленому.',
    vote3: 'Гравець з найбільшою кількістю голосів вибуває й отримує {sec} с на останнє слово.',
    vote4: 'Нічия: кожен із гравців, що мають однаково голосів, отримує {sec} с на захист, після чого всі голосують знову. Якщо знову нічия, ведучий вирішує, чи вибувають усі, чи ніхто.',
    conduct: 'Правила за столом',
    conduct1: 'Говоріть лише у свою чергу або під час вільного обговорення. За розмову не в чергу — фол; покарання за повторні фоли визначає ведучий.',
    conduct2: 'Не підглядайте вночі, не клянітеся й ніколи не показуйте свою карту.',
    conduct3: 'Гравці, що вибули, мовчать і не розкривають свою роль.',
    conduct4: 'Рішення ведучого остаточне.',
    custom: '{team} · {action}',
  },
};

const ROLE_DESC: Record<string, { en: string; uk: string }> = {
  civilian: {
    en: 'No night action. Finds the Mafia by talking and voting.',
    uk: 'Без нічної дії. Шукає мафію через обговорення та голосування.',
  },
  mafia: {
    en: 'Wakes up with the Mafia team at night and chooses a victim together.',
    uk: 'Прокидається вночі разом з мафією й спільно обирає жертву.',
  },
  don: {
    en: 'Head of the Mafia. Kills with the team and also searches for the Sheriff each night.',
    uk: 'Голова мафії. Вбиває разом з командою й щоночі шукає шерифа.',
  },
  sheriff: {
    en: 'Each night checks one player — the host shows whether they are Mafia.',
    uk: 'Щоночі перевіряє одного гравця — ведучий показує, чи він мафія.',
  },
  doctor: {
    en: 'Each night chooses one player to save from being killed.',
    uk: 'Щоночі обирає одного гравця, якого рятує від смерті.',
  },
  maniac: {
    en: 'Plays alone and kills one player each night.',
    uk: 'Грає сам за себе й щоночі вбиває одного гравця.',
  },
  lover: {
    en: 'A town role with no night action; the host may add house rules for it.',
    uk: 'Роль міста без нічної дії; ведучий може додати для неї власні правила.',
  },
};

function fill(s: string, p?: Params) {
  return p ? s.replace(/\{(\w+)\}/g, (_, k) => String(p[k] ?? '')) : s;
}

export function buildRules(
  state: GameState,
  lang: Lang,
  roleName: (r: RoleDef | undefined) => string,
  tk: (key: string) => string,
): { title: string; sections: RulesSection[] } {
  const T = TEXT[lang];
  const s = state.settings;
  const inPlay = state.roles.filter((r) => (state.roleCounts[r.id] ?? 0) > 0);
  const has = (id: string) => inPlay.some((r) => r.id === id);
  const hasNeutralKiller = inPlay.some((r) => r.team === 'neutral' && r.nightAction === 'kill');

  const goal = [fill(T.goalTown, { maniac: hasNeutralKiller ? T.goalManiacSuffix : '' }), T.goalMafia];
  if (hasNeutralKiller) goal.push(T.goalManiac);

  const roles = inPlay.map((r) => {
    const count = state.roleCounts[r.id];
    const desc = ROLE_DESC[r.id]?.[lang] ?? fill(T.custom, { team: tk(`team.${r.team}`), action: tk(`action.${r.nightAction}`) });
    return `${roleName(r)}${count > 1 ? ` ×${count}` : ''} — ${desc}`;
  });

  // Wake-up order: Mafia team first, then roles with night actions
  const order: string[] = [];
  if (inPlay.some((r) => r.team === 'mafia')) order.push(tk('role.mafia'));
  const actors = inPlay
    .filter((r) => r.nightAction !== 'none' && !(r.team === 'mafia' && r.nightAction === 'kill'))
    .sort((a, b) => {
      const ia = NIGHT_ORDER.indexOf(a.id);
      const ib = NIGHT_ORDER.indexOf(b.id);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  for (const r of actors) order.push(roleName(r));

  const night = [T.night1, fill(T.night2, { order: order.join(' → ') }), T.night3];
  if (has('doctor') || inPlay.some((r) => r.nightAction === 'heal')) night.push(T.nightDoctor);

  return {
    title: T.title,
    sections: [
      { icon: '🎯', title: T.goal, items: goal },
      { icon: '🎭', title: fill(T.roles, { n: state.players.length }), items: roles },
      { icon: '🌙', title: T.night, items: night },
      {
        icon: '☀️',
        title: T.day,
        items: [fill(T.day1, { sec: s.discussionSeconds }), fill(T.day2, { sec: s.speechSeconds }), T.day3],
      },
      {
        icon: '🗳️',
        title: T.voting,
        items: [T.vote1, T.vote2, fill(T.vote3, { sec: s.lastWordSeconds }), fill(T.vote4, { sec: s.defenseSeconds })],
      },
      { icon: '🤝', title: T.conduct, items: [T.conduct1, T.conduct2, T.conduct3, T.conduct4] },
    ],
  };
}

/** Plain-text version for sharing in a chat. */
export function rulesToText(rules: { title: string; sections: RulesSection[] }): string {
  const parts = [`🎩 ${rules.title}`];
  for (const sec of rules.sections) {
    parts.push(`\n${sec.icon} ${sec.title}\n${sec.items.map((i) => `• ${i}`).join('\n')}`);
  }
  return parts.join('\n');
}
