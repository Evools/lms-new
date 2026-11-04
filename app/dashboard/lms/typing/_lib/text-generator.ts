/**
 * Text generator for typing speed trainer.
 * Includes Russian and English educational articles, quotes, words, and web code snippets.
 * Uses standard keyboard-friendly characters (hyphens, standard quotes).
 */

export type TypingLanguage = "RU" | "EN" | "CODE";
export type TypingContentType = "TEXT" | "WORDS";
export type TypingMode =
  | "FREE"
  | "TIME_15"
  | "TIME_30"
  | "TIME_60"
  | "TIME_120"
  | "WORDS_25"
  | "WORDS_50";

export const RU_ARTICLES = [
  "Программирование - это искусство превращать абстрактные мысли в работающие цифровые решения. Каждый алгоритм начинается с ясного понимания поставленной задачи.",
  "Навык быстрой слепой печати освобождает внимание разработчика. Когда пальцы находят нужные клавиши автоматически, мозг полностью сосредоточен на логике и структуре программы.",
  "Линус Торвальдс однажды сказал: Разговоры ничего не стоят, покажите мне код. Практический опыт и ежедневное написание программ важнее любых абстрактных рассуждений.",
  "Современный фронтенд сочетает строгую архитектуру и эстетику интерфейсов. Компонентный подход в React позволяет собирать сложные веб-приложения из надежных кирпичиков.",
  "Чистый код читается как хорошо написанная проза. Хороший программист пишет программы, которые понятны не только компилятору, но и коллегам по команде.",
  "Базы данных хранят ключевую ценность любого современного бизнеса - информацию. Умение проектировать правильные схемы данных и писать быстрые запросы отличает сильного инженера.",
  "Информационная безопасность начинается с дисциплины. Надежная валидация входных данных, безопасная авторизация и шифрование защищают пользователей от уязвимостей.",
  "Алгоритмы и структуры данных - это фундамент компьютерных наук. Понимание того, как работает двоичный поиск или хеш-таблица, помогает создавать эффективные масштабируемые системы.",
  "В истории компьютерных технологий операционная система Unix заложила ключевой принцип: делай одну вещь, но делай ее превосходно. Этот принцип актуален и сегодня.",
  "Ошибки и баги - неизбежные спутники разработки. Умение методично отлаживать код и писать автоматические тесты экономит сотни часов драгоценного времени всей команде.",
  "Интернет изменил мир благодаря открытым стандартам и протоколам. Протокол HTTP, стек TCP и язык разметки HTML создали глобальную информационную сеть для всего человечества.",
  "Дисциплина и постоянство бьют случайное вдохновение. Ежедневные тренировки скорости ввода и решение практических задач формируют настоящего мастера своего дела.",
  "Архитектура программного обеспечения определяет то, насколько легко проект сможет развиваться и масштабироваться через годы активной разработки и поддержки.",
  "Искусственный интеллект и нейронные сети открывают новую эпоху в разработке, но критическое мышление и фундаментальные инженерные знания остаются ключевыми навыками человека.",
  "Веб-разработчик должен понимать весь путь запроса: от клика пользователя в браузере до выполнения SQL-запроса в базе данных и отправки ответа обратно по сети.",
  "Качественный пользовательский интерфейс незаметен для пользователя. Он предсказуем, быстр и помогает человеку решать задачи без лишних кликов и задержек.",
  "Контроль версий с помощью Git позволяет разработчикам работать над общим кодом из любой точки мира, сохраняя полную историю изменений и возможность экспериментировать.",
  "Автоматизация рутины - главное стремление инженера. Если задачу приходится выполнять вручную более трех раз, для нее стоит написать скрипт или автоматический пайплайн.",
  "В лицее мы не просто учим синтаксису языков программирования, мы формируем системное мышление, инженерную культуру и умение работать в сплоченной команде над реальными задачами.",
  "Каждая строка кода должна иметь четкую цель. Избегайте преждевременной оптимизации и стремитесь к простоте, ведь простоту гораздо легче поддерживать и тестировать."
];

export const EN_ARTICLES = [
  "Any fool can write code that a computer can understand. Good programmers write code that humans can understand. Clean code always pays off.",
  "Touch typing is one of the highest leverage investments a software engineer can make. Speed and muscle memory allow you to think directly in code without keyboard distraction.",
  "Modern web development requires deep understanding of algorithms, responsive design principles, and distributed systems architecture.",
  "Simplicity is prerequisite for reliability. Complex architectures create unexpected failure modes, while simple components remain robust and testable.",
  "Continuous integration and automated testing ensure high software quality across distributed engineering teams and continuous delivery pipelines.",
  "The Unix philosophy emphasizes building small, modular programs that perform one task exceptionally well and communicate via universal text streams.",
  "Frontend engineering brings designs to life through declarative state management, accessible markup, and optimized rendering performance.",
  "Security is not a single feature but a continuous engineering mindset. Always validate user inputs, enforce strict authentication, and encrypt sensitive data.",
  "First make it work, then make it right, and only then make it fast. Premature optimization is the root of all evil in software engineering.",
  "Open source software powers the modern digital infrastructure. Collaboration between global developers drives rapid innovation and shared knowledge.",
  "Good software design balances present business requirements with future extensibility without over-engineering speculative abstractions.",
  "Consistent practice and deliberate learning separate amateur coders from elite engineers who can architect resilient web platforms.",
  "Understanding how the browser renders the document object model helps engineers build buttery smooth interfaces with sixty frames per second.",
  "Git branching models and pull request code reviews foster collective code ownership and continuous mentorship within high-performing teams.",
  "Asynchronous programming allows applications to remain responsive while waiting for network requests and input output operations to finish.",
  "Great developers care deeply about user experience, system latency, security boundaries, and maintainability across the entire software lifecycle."
];

export const RU_WORDS = [
  "лицей", "студент", "программа", "разработка", "алгоритм", "компьютер", "технологии",
  "интерфейс", "система", "память", "процессор", "функция", "переменная", "информация",
  "структура", "данные", "сервер", "клиент", "страница", "запрос", "ответ", "браузер",
  "дизайн", "верстка", "таблица", "стипендия", "учеба", "ведомость", "практика", "код",
  "модуль", "компонент", "задача", "решение", "проект", "успеваемость", "знания", "оценка",
  "занятие", "преподаватель", "мастер", "группа", "отличник", "ударник", "результат",
  "библиотека", "фреймворк", "интернет", "документ", "посещаемость", "дневник", "семестр",
  "работа", "скорость", "печать", "клавиатура", "навык", "точность", "тренировка", "успех",
  "создание", "будущее", "профессия", "обучение", "терминал", "команда", "файл", "каталог",
  "безопасность", "контроль", "проверка", "тестирование", "анализ", "логика", "внимание",
  "дисциплина", "введение", "индекс", "объект", "массив", "строка", "число", "логический",
  "платформа", "скрипт", "порядок", "правило", "уровень", "мастерство", "прогресс", "рекорд",
  "цель", "победа", "быстрота", "пальцы", "символ", "текст", "форма", "кнопка", "экран"
];

export const EN_WORDS = [
  "program", "developer", "student", "algorithm", "computer", "technology", "interface",
  "system", "memory", "function", "variable", "information", "database", "server", "client",
  "browser", "frontend", "backend", "component", "module", "project", "keyboard", "typing",
  "speed", "accuracy", "practice", "learning", "design", "layout", "element", "selector",
  "style", "script", "request", "response", "network", "security", "terminal", "command",
  "software", "hardware", "process", "result", "library", "framework", "performance",
  "future", "digital", "modern", "challenge", "syntax", "statement", "condition", "loop",
  "constant", "promise", "async", "await", "object", "array", "string", "number", "boolean",
  "render", "state", "effect", "import", "export", "return", "default", "button", "input",
  "screen", "window", "document", "create", "update", "delete", "action", "filter", "search",
  "method", "class", "value", "table", "record", "header", "footer", "content", "event",
  "handler", "status", "active", "source", "output", "stream", "target", "master", "public"
];

export const CODE_SNIPPETS = [
  "const [count, setCount] = useState(0);",
  "export default function Button({ children, onClick }) {",
  "return <div className=\"flex items-center justify-between p-4\">;",
  "const res = await fetch(\"/api/students\"); const data = await res.json();",
  "function calculateAverage(scores) { return scores.reduce((a, b) => a + b, 0) / scores.length; }",
  "interface StudentProfile { id: string; name: string; course: number; }",
  "display: flex; flex-direction: column; align-items: center; justify-content: center;",
  "<button type=\"button\" onClick={handleClick} className=\"px-4 py-2 bg-primary text-white rounded\">",
  "const filteredStudents = students.filter(s => s.attendanceRate >= 85);",
  "document.addEventListener(\"keydown\", (e) => { if (e.key === \"Enter\") handleSave(); });",
  "npm run build && next start -p 3000",
  "git commit -m \"feat: add interactive typing trainer with group leaderboard\""
];

/**
 * Normalizes all typographic characters to standard keyboard equivalents:
 * - Em-dashes (—), En-dashes (–), and minus (−) -> standard hyphen (-)
 * - Typographic quotes («, », “, ”) -> standard quote (")
 * - Typographic apostrophes (’, ‘) -> standard single quote (')
 */
export function normalizeTypingChar(c: string | undefined): string {
  if (!c) return "";
  if (c === "—" || c === "–" || c === "−") return "-";
  if (c === "«" || c === "»" || c === "“" || c === "”") return '"';
  if (c === "‘" || c === "’" || c === "`") return "'";
  if (c === "ё") return "е";
  if (c === "Ё") return "Е";
  return c;
}

export function areTypingCharsEqual(typed: string | undefined, target: string | undefined, isCode = false): boolean {
  if (!typed || !target) return false;
  if (isCode) return typed === target;

  const nTyped = normalizeTypingChar(typed).toLowerCase();
  const nTarget = normalizeTypingChar(target).toLowerCase();
  return nTyped === nTarget;
}

/**
 * Generate randomized text or coherent paragraphs based on content type, language, and mode.
 */
export function generateTypingText(
  lang: TypingLanguage,
  mode: TypingMode,
  contentType: TypingContentType = "TEXT"
): string {
  if (lang === "CODE") {
    const shuffled = [...CODE_SNIPPETS].sort(() => 0.5 - Math.random());
    const count = mode === "TIME_30" || mode === "WORDS_25" ? 3 : 5;
    return shuffled.slice(0, count).join(" ");
  }

  // 1. Text mode: coherent paragraphs and educational quotes
  if (contentType === "TEXT") {
    const library = lang === "RU" ? RU_ARTICLES : EN_ARTICLES;
    const shuffled = [...library].sort(() => 0.5 - Math.random());

    let neededWords = 35;
    if (mode === "FREE") neededWords = 40;
    else if (mode === "WORDS_25") neededWords = 25;
    else if (mode === "WORDS_50") neededWords = 50;
    else if (mode === "TIME_15") neededWords = 30;
    else if (mode === "TIME_30") neededWords = 60;
    else if (mode === "TIME_60") neededWords = 110;
    else if (mode === "TIME_120") neededWords = 220;

    const collected: string[] = [];
    let wordCount = 0;

    for (const article of shuffled) {
      collected.push(article);
      wordCount += article.split(/\s+/).length;
      if (wordCount >= neededWords) break;
    }

    const fullText = collected.join(" ").replace(/[—–−]/g, "-");
    const words = fullText.split(/\s+/);

    if (mode === "WORDS_25") {
      return words.slice(0, 25).join(" ");
    }
    if (mode === "WORDS_50") {
      return words.slice(0, 50).join(" ");
    }

    return fullText;
  }

  // 2. Words mode: dictionary sprint
  const wordBank = lang === "RU" ? RU_WORDS : EN_WORDS;

  let targetCount = 30;
  if (mode === "FREE") targetCount = 35;
  else if (mode === "WORDS_25") targetCount = 25;
  else if (mode === "WORDS_50") targetCount = 50;
  else if (mode === "TIME_15") targetCount = 30;
  else if (mode === "TIME_30") targetCount = 60;
  else if (mode === "TIME_60") targetCount = 120;
  else if (mode === "TIME_120") targetCount = 240;

  const words: string[] = [];
  let prevWord = "";

  for (let i = 0; i < targetCount; i++) {
    let next = wordBank[Math.floor(Math.random() * wordBank.length)].toLowerCase();
    while (next === prevWord) {
      next = wordBank[Math.floor(Math.random() * wordBank.length)].toLowerCase();
    }
    words.push(next);
    prevWord = next;
  }

  return words.join(" ");
}

/**
 * Returns qualitative evaluation of CPM.
 */
export function getCpmVerdict(cpm: number): {
  label: string;
  badgeClass: string;
  grade: number;
} {
  if (cpm >= 300) {
    return {
      label: "Мастер (Эксперт)",
      badgeClass: "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300",
      grade: 5,
    };
  }
  if (cpm >= 230) {
    return {
      label: "Отлично (Профи)",
      badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      grade: 5,
    };
  }
  if (cpm >= 170) {
    return {
      label: "Хорошо (Уверенно)",
      badgeClass: "border-primary/30 bg-primary/10 text-primary",
      grade: 4,
    };
  }
  if (cpm >= 120) {
    return {
      label: "Базовый уровень",
      badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      grade: 3,
    };
  }
  return {
    label: "Начальный (Требуется практика)",
    badgeClass: "border-muted-foreground/30 bg-muted/40 text-muted-foreground",
    grade: 2,
  };
}
