import type { Lang } from '../i18n/I18nContext';

export interface HostLine {
  en: string;
  uk: string;
  /** Author / source for quotes */
  by?: { en: string; uk: string };
}

export type LineCategory = 'nightFalls' | 'morning' | 'discussion' | 'voting' | 'elimination' | 'quotes' | 'facts';

export const CATEGORY_ORDER: LineCategory[] = ['nightFalls', 'morning', 'discussion', 'voting', 'elimination', 'quotes', 'facts'];

export const CATEGORY_ICON: Record<LineCategory, string> = {
  nightFalls: '🌙',
  morning: '☀️',
  discussion: '🕵️',
  voting: '🗳️',
  elimination: '⚰️',
  quotes: '📜',
  facts: '💡',
};

export const HOST_LINES: Record<LineCategory, HostLine[]> = {
  nightFalls: [
    { en: 'The city falls asleep. Close your eyes — and trust no one, not even your dreams.', uk: 'Місто засинає. Заплющте очі — і не довіряйте нікому, навіть своїм снам.' },
    { en: 'Night has come. Somewhere among you, someone is smiling in the dark.', uk: 'Настала ніч. Десь серед вас хтось усміхається в темряві.' },
    { en: 'Heads down. Hands still. The streets belong to the Mafia now.', uk: 'Голови вниз. Руки нерухомо. Тепер вулиці належать мафії.' },
    { en: 'Listen carefully… that silence is the sound of someone deciding your fate.', uk: 'Прислухайтеся… ця тиша — звук того, як хтось вирішує вашу долю.' },
    { en: 'Lock your doors. Not that it will help.', uk: 'Замкніть двері. Хоча це не допоможе.' },
    { en: 'The lights go out. Not everyone will see the morning.', uk: 'Світло гасне. Не всі побачать ранок.' },
    { en: 'Sleep well, citizens. Some of you for the last time.', uk: 'Добраніч, громадяни. Декому з вас — востаннє.' },
  ],
  morning: [
    { en: 'The sun rises over a city that is one secret smaller.', uk: 'Сонце сходить над містом, у якому стало на один секрет менше.' },
    { en: 'Good morning. Look around — count the faces. Is anyone missing?', uk: 'Доброго ранку. Роззирніться — порахуйте обличчя. Когось бракує?' },
    { en: "The city wakes up… but someone in this room didn't sleep at all.", uk: 'Місто прокидається… але хтось у цій кімнаті не спав зовсім.' },
    { en: 'Last night was quiet. Too quiet. Ask yourselves why.', uk: 'Минула ніч була тихою. Надто тихою. Запитайте себе чому.' },
    { en: 'Coffee is served. So are lies.', uk: 'Каву подано. Брехню — теж.' },
    { en: 'The Mafia did their work. Now it is your turn.', uk: 'Мафія зробила свою справу. Тепер ваша черга.' },
  ],
  discussion: [
    { en: 'Someone at this table already knows how this game ends.', uk: 'Хтось за цим столом уже знає, чим закінчиться гра.' },
    { en: 'Silence is also an answer. Who has been quiet today?', uk: 'Мовчання — теж відповідь. Хто сьогодні мовчав?' },
    { en: 'Watch the hands, not the words.', uk: 'Стежте за руками, а не за словами.' },
    { en: 'The loudest voice is not always the most honest one.', uk: 'Найгучніший голос не завжди найчесніший.' },
    { en: 'Every alibi sounds perfect — until someone checks it.', uk: 'Кожне алібі звучить ідеально — доки хтось його не перевірить.' },
    { en: "The Mafia doesn't need to win the argument. They only need you to doubt.", uk: 'Мафії не треба вигравати суперечку. Їй достатньо, щоб ви засумнівалися.' },
    { en: 'Remember who defended whom. Loyalty leaves fingerprints.', uk: 'Запам’ятайте, хто кого захищав. Вірність залишає відбитки.' },
    { en: 'Time is running out — for the city, or for the Mafia?', uk: 'Час спливає — для міста чи для мафії?' },
  ],
  voting: [
    { en: 'Raise your hands — and your doubts.', uk: 'Піднімайте руки — і свої сумніви.' },
    { en: 'One vote can save an innocent. One vote can free a killer.', uk: 'Один голос може врятувати невинного. Один голос може відпустити вбивцю.' },
    { en: "The city is about to make a decision it can't take back.", uk: 'Місто ось-ось ухвалить рішення, яке не можна скасувати.' },
    { en: 'Vote with your head, not with your friends.', uk: 'Голосуйте головою, а не дружбою.' },
    { en: 'Look the accused in the eyes before you raise your hand.', uk: 'Подивіться обвинуваченому в очі, перш ніж піднімати руку.' },
    { en: "Undecided votes don't disappear. They fall on the last name called.", uk: 'Голоси нерішучих не зникають. Вони падають на останнього названого.' },
  ],
  elimination: [
    { en: 'The city has spoken. Was it justice — or exactly what the Mafia wanted?', uk: 'Місто сказало своє слово. Це справедливість — чи саме те, чого хотіла мафія?' },
    { en: 'Say your last words. Make them count.', uk: 'Скажіть останнє слово. Нехай воно буде вагомим.' },
    { en: 'Another chair is empty. The circle grows smaller.', uk: 'Ще один стілець порожній. Коло стає тіснішим.' },
    { en: 'If they were innocent, every raised hand carries the weight.', uk: 'Якщо гравець був невинним, ця вага лягає на кожну підняту руку.' },
    { en: 'Some leave as heroes. Some as villains. All leave in silence.', uk: 'Хтось іде героєм. Хтось — лиходієм. Усі йдуть мовчки.' },
  ],
  quotes: [
    { en: "There's daggers in men's smiles.", uk: 'У людських усмішках — кинджали.', by: { en: 'Shakespeare, Macbeth', uk: 'Шекспір, «Макбет»' } },
    { en: 'Look like the innocent flower, but be the serpent under it.', uk: 'Будь схожим на невинну квітку, але будь змією під нею.', by: { en: 'Shakespeare, Macbeth', uk: 'Шекспір, «Макбет»' } },
    { en: 'The lady doth protest too much, methinks.', uk: 'Мені здається, ця пані надто палко клянеться.', by: { en: 'Shakespeare, Hamlet', uk: 'Шекспір, «Гамлет»' } },
    { en: 'Et tu, Brute?', uk: 'І ти, Бруте?', by: { en: 'Shakespeare, Julius Caesar', uk: 'Шекспір, «Юлій Цезар»' } },
    { en: 'Truth will come to light; murder cannot be hid long.', uk: 'Правда вийде на світло; вбивство довго не сховаєш.', by: { en: 'Shakespeare, The Merchant of Venice', uk: 'Шекспір, «Венеціанський купець»' } },
    { en: 'Oh, what a tangled web we weave, when first we practise to deceive!', uk: 'О, яку заплутану павутину ми плетемо, коли вперше беремося обманювати!', by: { en: 'Walter Scott', uk: 'Вальтер Скотт' } },
    { en: 'Three may keep a secret, if two of them are dead.', uk: 'Троє можуть зберегти таємницю, якщо двоє з них мертві.', by: { en: 'Benjamin Franklin', uk: 'Бенджамін Франклін' } },
    { en: 'Half a truth is often a great lie.', uk: 'Півправди часто буває великою брехнею.', by: { en: 'Benjamin Franklin', uk: 'Бенджамін Франклін' } },
    { en: 'All warfare is based on deception.', uk: 'Уся війна ґрунтується на обмані.', by: { en: 'Sun Tzu, The Art of War', uk: 'Сунь-цзи, «Мистецтво війни»' } },
    { en: 'Trust, but verify.', uk: 'Довіряй, але перевіряй.', by: { en: 'Proverb', uk: 'Прислів’я' } },
  ],
  facts: [
    { en: 'Mafia was invented in 1986 by Dimitry Davidoff, a psychology student at Moscow State University.', uk: 'Мафію вигадав 1986 року Дмитро Давидов, студент-психолог Московського державного університету.' },
    { en: 'Davidoff designed the game as a contest between an informed minority and an uninformed majority — exactly what you see at this table.', uk: 'Давидов задумав гру як змагання поінформованої меншості з непоінформованою більшістю — саме те, що відбувається за цим столом.' },
    { en: 'In 1997 Andrew Plotkin swapped the mobsters for werewolves, and "Werewolf" spread around the world.', uk: 'У 1997 році Ендрю Плоткін замінив мафіозі на перевертнів, і гра «Вовкулаки» розлетілася світом.' },
    { en: 'Research shows people spot lies only about 54% of the time — barely better than flipping a coin.', uk: 'Дослідження показують, що люди розпізнають брехню лише приблизно в 54% випадків — ледь краще, ніж підкинути монетку.' },
    { en: 'Avoiding eye contact is a myth as a lie detector: studies find it is barely related to lying.', uk: 'Відведений погляд — міф, а не детектор брехні: дослідження майже не знаходять зв’язку між ним і обманом.' },
    { en: 'Al Capone, the most famous gangster of all, was convicted in 1931 not for murder — but for tax evasion.', uk: 'Аль Капоне, найвідомішого гангстера в історії, засудили 1931 року не за вбивство, а за ухилення від податків.' },
    { en: '"Omertà" is the Sicilian Mafia\'s code of silence: never talk to the authorities.', uk: '«Омерта» — кодекс мовчання сицилійської мафії: ніколи не співпрацювати з владою.' },
    { en: '"Cosa Nostra", the Sicilian Mafia\'s own name for itself, simply means "our thing".', uk: '«Коза ностра» — так сицилійська мафія називає себе сама — означає просто «наша справа».' },
    { en: 'From Soviet university dorms, the game spread across Europe and beyond; today there are Mafia clubs and tournaments in many countries.', uk: 'Із радянських студентських гуртожитків гра поширилася Європою та світом; сьогодні у багатьох країнах є клуби й турніри з мафії.' },
  ],
};

export function lineText(line: HostLine, lang: Lang) {
  return line[lang];
}

/** Categories that fit the current game phase, for the in-game suggestion card. */
export function categoriesForPhase(phase: string, voteStage?: string): LineCategory[] {
  if (phase === 'night') return ['nightFalls'];
  if (phase === 'day') return ['morning', 'discussion', 'facts', 'quotes'];
  if (phase === 'voting') return voteStage === 'lastWord' ? ['elimination', 'quotes'] : ['voting', 'quotes'];
  return CATEGORY_ORDER;
}

/** Pick a random line from the categories, avoiding the line shown last. */
export function randomLine(categories: LineCategory[], avoid?: HostLine): { line: HostLine; category: LineCategory } {
  const pool = categories.flatMap((c) => HOST_LINES[c].map((line) => ({ line, category: c })));
  const choices = pool.length > 1 ? pool.filter((x) => x.line !== avoid) : pool;
  return choices[Math.floor(Math.random() * choices.length)];
}
