import { NIGHT_ORDER } from '../game/roles';
import type { GameState, RoleDef, Team } from '../game/types';
import type { Lang } from '../i18n/I18nContext';

/** Text may contain **bold** markers. */
export interface RulesSection {
  icon: string;
  title: string;
  items: string[];
}

export interface RoleRow {
  name: string;
  count: number;
  team: Team;
  teamLabel: string;
  color: string;
  desc: string;
}

export interface GlanceItem {
  label: string;
  value: string;
}

export interface Rules {
  title: string;
  subtitle: string;
  glance: GlanceItem[];
  rolesTitle: string;
  roles: RoleRow[];
  sections: RulesSection[];
}

type Params = Record<string, string | number>;

const TEXT = {
  en: {
    title: 'Mafia — game rules',
    subtitle: 'Town against the Mafia. Talk, accuse, vote — and survive the night.',
    gPlayers: 'Players',
    gMafia: 'Mafia team',
    gDiscussion: 'Open discussion',
    gSpeech: 'Speech',
    gDefense: 'Defense',
    gLastWord: 'Last word',
    sec: '{n} s',
    goal: 'How to win',
    goalTown: '**Town** wins when every Mafia member{maniac} is out of the game.',
    goalManiacSuffix: ' and the Maniac',
    goalMafia: '**Mafia** wins when they equal or outnumber everyone else.',
    goalManiac: 'The **Maniac** plays alone and wins if only they and one other player are left.',
    roles: 'Roles ({n} players)',
    night: 'Night',
    nightZero: '**Night 0 (introduction):** each active role wakes up once to meet the host — the Mafia team together. No kills or checks.',
    night1: 'Everyone **closes their eyes** and stays silent.',
    night2: 'The host wakes roles one at a time: **{order}**.',
    night3: 'Open your eyes **only when your role is called**, and act silently with gestures.',
    night4: 'In the morning the host announces who was killed.',
    nightDoctor: 'A player **saved by the Doctor** survives the night.',
    day: 'Day',
    dayZero: '**Day 0** is for getting to know each other: discussion and speeches, but **no voting**. Night 1 follows.',
    day1: 'The day starts with an **open discussion ({sec} s)** — anyone can talk.',
    day2: 'Then every alive player gets a **{sec} s speech**, in seat order. The first speaker moves one seat each day.',
    day3: 'At the end of your speech you may **nominate one player** for the vote. A player who is already nominated cannot be nominated again.',
    voting: 'Voting',
    vote1: 'Only **nominated players** can be voted out. If nobody is nominated, nobody leaves that day.',
    vote2: '**Every alive player votes exactly once.** The host calls the nominees in order.',
    vote3: 'Votes not given to anyone earlier **go to the last nominee**.',
    vote4: 'The player with the most votes is out and gets a **{sec} s last word**.',
    vote5: '**Tie:** each tied player gets **{sec} s** to defend themselves, then everyone votes again. Still a tie? The host decides: all tied players leave, or nobody does.',
    conduct: 'Table rules',
    conduct1: 'Speak **only during your turn** or the open discussion. Talking out of turn earns a **foul**.',
    conduct2: '**No peeking** at night, no oaths, and never show your role card.',
    conduct3: 'Eliminated players **stay silent** and do not reveal their role.',
    conduct4: "The **host's decision is final**.",
  },
  uk: {
    title: 'Мафія — правила гри',
    subtitle: 'Місто проти мафії. Говоріть, звинувачуйте, голосуйте — і переживіть ніч.',
    gPlayers: 'Гравців',
    gMafia: 'Мафія',
    gDiscussion: 'Обговорення',
    gSpeech: 'Промова',
    gDefense: 'Захист',
    gLastWord: 'Останнє слово',
    sec: '{n} с',
    goal: 'Як перемогти',
    goalTown: '**Місто** перемагає, коли з гри вибувають усі мафіозі{maniac}.',
    goalManiacSuffix: ' та маніяк',
    goalMafia: '**Мафія** перемагає, коли її стає стільки ж або більше, ніж усіх інших.',
    goalManiac: '**Маніяк** грає сам за себе й перемагає, якщо в грі залишаються лише він та ще один гравець.',
    roles: 'Ролі ({n} гравців)',
    night: 'Ніч',
    nightZero: '**Ніч 0 (знайомство):** кожна активна роль прокидається один раз, щоб познайомитися з ведучим, — мафія разом. Без убивств і перевірок.',
    night1: 'Усі **заплющують очі** й мовчать.',
    night2: 'Ведучий будить ролі по черзі: **{order}**.',
    night3: 'Розплющуйте очі **лише тоді, коли назвали вашу роль**, і дійте мовчки, жестами.',
    night4: 'Вранці ведучий оголошує, кого вбили.',
    nightDoctor: 'Гравець, якого **врятував лікар**, переживає ніч.',
    day: 'День',
    dayZero: '**День 0** — для знайомства: обговорення та промови, але **без голосування**. Далі — перша ніч.',
    day1: 'День починається з **вільного обговорення ({sec} с)** — говорити може кожен.',
    day2: 'Потім кожен живий гравець має **промову {sec} с**, по черзі за місцями. Щодня перший промовець зсувається на одне місце.',
    day3: 'Наприкінці своєї промови можна **виставити одного гравця** на голосування. Того, кого вже виставили, вдруге виставити не можна.',
    voting: 'Голосування',
    vote1: 'Вигнати можна лише **виставлених гравців**. Якщо нікого не виставили, цього дня ніхто не вибуває.',
    vote2: '**Кожен живий гравець голосує рівно один раз.** Ведучий називає виставлених по черзі.',
    vote3: 'Голоси, не віддані нікому раніше, **йдуть останньому виставленому**.',
    vote4: 'Гравець з найбільшою кількістю голосів вибуває й отримує **останнє слово {sec} с**.',
    vote5: '**Нічия:** кожен із цих гравців має **{sec} с** на захист, після чого всі голосують знову. Знову нічия? Ведучий вирішує: вибувають усі або ніхто.',
    conduct: 'Правила за столом',
    conduct1: 'Говоріть **лише у свою чергу** або під час вільного обговорення. За розмову не в чергу — **фол**.',
    conduct2: '**Не підглядайте** вночі, не клянітеся й ніколи не показуйте свою карту.',
    conduct3: 'Гравці, що вибули, **мовчать** і не розкривають свою роль.',
    conduct4: '**Рішення ведучого остаточне.**',
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

/** Split "a **b** c" into parts for rendering bold text. */
export function boldParts(s: string): { text: string; bold: boolean }[] {
  return s.split('**').map((text, i) => ({ text, bold: i % 2 === 1 })).filter((p) => p.text);
}

const stripBold = (s: string) => s.replace(/\*\*/g, '');

export function buildRules(
  state: GameState,
  lang: Lang,
  roleName: (r: RoleDef | undefined) => string,
  tk: (key: string) => string,
): Rules {
  const T = TEXT[lang];
  const s = state.settings;
  const inPlay = state.roles.filter((r) => (state.roleCounts[r.id] ?? 0) > 0);
  const hasNeutralKiller = inPlay.some((r) => r.team === 'neutral' && r.nightAction === 'kill');
  const mafiaCount = inPlay.filter((r) => r.team === 'mafia').reduce((n, r) => n + state.roleCounts[r.id], 0);
  const sec = (n: number) => fill(T.sec, { n });

  const goal = [fill(T.goalTown, { maniac: hasNeutralKiller ? T.goalManiacSuffix : '' }), T.goalMafia];
  if (hasNeutralKiller) goal.push(T.goalManiac);

  const roles: RoleRow[] = inPlay.map((r) => ({
    name: roleName(r),
    count: state.roleCounts[r.id],
    team: r.team,
    teamLabel: tk(`team.${r.team}`),
    color: r.color,
    desc: ROLE_DESC[r.id]?.[lang] ?? `${tk(`team.${r.team}`)} · ${tk(`action.${r.nightAction}`)}`,
  }));

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

  const intro = state.settings.introRound;
  const night = [...(intro ? [T.nightZero] : []), T.night1, fill(T.night2, { order: order.join(' → ') }), T.night3, T.night4];
  if (inPlay.some((r) => r.nightAction === 'heal')) night.push(T.nightDoctor);

  return {
    title: T.title,
    subtitle: T.subtitle,
    glance: [
      { label: T.gPlayers, value: String(state.players.length) },
      { label: T.gMafia, value: String(mafiaCount) },
      { label: T.gDiscussion, value: sec(s.discussionSeconds) },
      { label: T.gSpeech, value: sec(s.speechSeconds) },
      { label: T.gDefense, value: sec(s.defenseSeconds) },
      { label: T.gLastWord, value: sec(s.lastWordSeconds) },
    ],
    rolesTitle: fill(T.roles, { n: state.players.length }),
    roles,
    sections: [
      { icon: '🎯', title: T.goal, items: goal },
      { icon: '🌙', title: T.night, items: night },
      {
        icon: '☀️',
        title: T.day,
        items: [...(intro ? [T.dayZero] : []), fill(T.day1, { sec: s.discussionSeconds }), fill(T.day2, { sec: s.speechSeconds }), T.day3],
      },
      {
        icon: '🗳️',
        title: T.voting,
        items: [T.vote1, T.vote2, T.vote3, fill(T.vote4, { sec: s.lastWordSeconds }), fill(T.vote5, { sec: s.defenseSeconds })],
      },
      { icon: '📋', title: T.conduct, items: [T.conduct1, T.conduct2, T.conduct3, T.conduct4] },
    ],
  };
}

/** Plain-text version for sharing in a chat. */
export function rulesToText(rules: Rules): string {
  const parts = [`🎩 ${rules.title}`, rules.subtitle, '', rules.glance.map((g) => `${g.label}: ${g.value}`).join(' · ')];
  const [goal, ...rest] = rules.sections;
  const block = (sec: RulesSection) => `\n${sec.icon} ${sec.title.toUpperCase()}\n${sec.items.map((i) => `• ${stripBold(i)}`).join('\n')}`;
  parts.push(block(goal));
  parts.push(`\n🎭 ${rules.rolesTitle.toUpperCase()}\n${rules.roles.map((r) => `• ${r.name}${r.count > 1 ? ` ×${r.count}` : ''} (${r.teamLabel}) — ${r.desc}`).join('\n')}`);
  for (const sec of rest) parts.push(block(sec));
  return parts.join('\n');
}
