import { GitLesson } from "./types";

export const GIT_LESSONS: GitLesson[] = [
  {
    id: 1,
    slug: "first-commit",
    level: "Базовый",
    title: "Урок 1: Первый коммит в репозитории",
    shortDesc: "Научитесь фиксировать изменения и создавать точки сохранения в Git.",
    theory: {
      concept: "Что такое коммит (commit)?",
      explanation:
        "Коммит в Git — это снимок (snapshot) состояния вашего проекта в определённый момент времени. Представьте его как контрольную точку сохранения в игре. Каждый коммит имеет уникальный идентификатор и понятное сообщение, описывающее, что именно изменилось.",
      analogy: "Снимок проекта: если в коде появится ошибка, к этой контрольной точке всегда можно вернуться.",
      commandExample: 'git commit -m "Добавил главную страницу"',
    },
    task: {
      instruction: 'Создайте новый коммит с сообщением о первом изменении, выполнив команду git commit -m "Первый коммит"',
      hint: 'Введите в терминал: git commit -m "Первый коммит" (или просто git commit -m "init") и нажмите Enter.',
      solutionCommand: 'git commit -m "Первый коммит"',
    },
    initialState: {
      branches: { main: "c0" },
      head: { type: "branch", target: "main" },
      commits: [
        {
          id: "c0",
          message: "Инициализация репозитория (Initial commit)",
          parentIds: [],
          branchCreated: "main",
        },
      ],
    },
    validate: (state) => {
      // Must have at least 2 commits and main must point to c1 or newer
      const commitCount = Object.keys(state.commits).length;
      return commitCount >= 2 && state.branches["main"] !== "c0";
    },
  },
  {
    id: 2,
    slug: "create-branch",
    level: "Базовый",
    title: "Урок 2: Создание ветки (git branch)",
    shortDesc: "Изолируйте разработку новой функциональности с помощью веток.",
    theory: {
      concept: "Что такое ветка (branch)?",
      explanation:
        "Ветка в Git — это не копия всех файлов на диске, а всего лишь лёгкий указатель на конкретный коммит. Ветки позволяют безопасно разрабатывать новые фичи или исправлять баги, не рискуя сломать основной рабочий код в ветке main.",
      analogy: "Параллельная ветка реальности: вы можете экспериментировать, не боясь повредить стабильную версию.",
      commandExample: "git branch feature/login",
    },
    task: {
      instruction: 'Создайте новую ветку с именем "feature" с помощью команды git branch feature.',
      hint: "Введите: git branch feature и нажмите Enter. Обратите внимание, как на графе появится новый бейдж ветки!",
      solutionCommand: "git branch feature",
    },
    initialState: {
      branches: { main: "c1" },
      head: { type: "branch", target: "main" },
      commits: [
        { id: "c0", message: "Initial commit", parentIds: [] },
        { id: "c1", message: "Настройка проекта и структуры", parentIds: ["c0"] },
      ],
    },
    validate: (state) => {
      return Boolean(state.branches["feature"]);
    },
  },
  {
    id: 3,
    slug: "checkout-branch",
    level: "Базовый",
    title: "Урок 3: Переключение веток (git checkout)",
    shortDesc: "Поймите роль указателя HEAD и научитесь переключаться между ветками.",
    theory: {
      concept: "Что такое указатель HEAD?",
      explanation:
        "HEAD — это специальный указатель Git, который показывает, в какой ветке и на каком коммите вы сейчас находитесь. Когда вы переключаетесь командой checkout (или switch), HEAD перемещается на целевую ветку.",
      analogy: "Табличка «Вы находитесь здесь» на карте торгового центра.",
      commandExample: "git checkout feature  # или git switch feature",
    },
    task: {
      instruction: 'Переключитесь на ветку "feature" с помощью команды git checkout feature.',
      hint: "Введите git checkout feature или git switch feature. Указатель HEAD переместится на ветку feature.",
      solutionCommand: "git checkout feature",
    },
    initialState: {
      branches: { main: "c1", feature: "c1" },
      head: { type: "branch", target: "main" },
      commits: [
        { id: "c0", message: "Initial commit", parentIds: [] },
        { id: "c1", message: "Базовая разметка сайта", parentIds: ["c0"] },
      ],
    },
    validate: (state) => {
      return state.head.type === "branch" && state.head.target === "feature";
    },
  },
  {
    id: 4,
    slug: "commit-in-branch",
    level: "Базовый",
    title: "Урок 4: Разработка в ветке и движение истории",
    shortDesc: "Убедитесь, что новые коммиты двигают только текущую ветку.",
    theory: {
      concept: "Как коммиты продвигают ветку?",
      explanation:
        "Когда вы делаете коммит, Git создаёт новый узел истории и автоматически сдвигает активную ветку (на которую указывает HEAD) вперёд. Другие ветки при этом остаются на своих прежних местах.",
      analogy: "Два поезда на развилке: когда едет один, второй стоит на месте.",
      commandExample: 'git commit -m "Форма авторизации"',
    },
    task: {
      instruction: 'Находясь в ветке "feature", создайте коммит с сообщением git commit -m "Форма входа".',
      hint: 'Убедитесь, что HEAD указывает на feature, затем введите: git commit -m "Форма входа".',
      solutionCommand: 'git commit -m "Форма входа"',
    },
    initialState: {
      branches: { main: "c1", feature: "c1" },
      head: { type: "branch", target: "feature" },
      commits: [
        { id: "c0", message: "Initial commit", parentIds: [] },
        { id: "c1", message: "Базовая разметка сайта", parentIds: ["c0"] },
      ],
    },
    validate: (state) => {
      const featureCommitId = state.branches["feature"];
      const mainCommitId = state.branches["main"];
      // Feature should have advanced beyond c1, and main stays at c1
      return featureCommitId !== "c1" && mainCommitId === "c1";
    },
  },
  {
    id: 5,
    slug: "checkout-b",
    level: "Средний",
    title: "Урок 5: Создание и переход в один шаг (git checkout -b)",
    shortDesc: "Освойте самую популярную команду повседневной командной разработки.",
    theory: {
      concept: "Флаг -b (branch create and switch)",
      explanation:
        "В реальной разработке вместо двух последовательных команд (git branch name && git checkout name) разработчики всегда используют быструю комбинацию: git checkout -b name (или git switch -c name). Она создаёт ветку и тут же переключается на неё.",
      analogy: "Открыть новую вкладку в браузере и сразу перейти на неё.",
      commandExample: "git checkout -b bugfix/header",
    },
    task: {
      instruction: 'Создайте ветку "bugfix" и переключитесь на неё одной командой: git checkout -b bugfix.',
      hint: "Введите: git checkout -b bugfix. Появится ветка bugfix, и HEAD сразу станет указывать на неё.",
      solutionCommand: "git checkout -b bugfix",
    },
    initialState: {
      branches: { main: "c2" },
      head: { type: "branch", target: "main" },
      commits: [
        { id: "c0", message: "Initial commit", parentIds: [] },
        { id: "c1", message: "Каркас приложения", parentIds: ["c0"] },
        { id: "c2", message: "Подключение стилей", parentIds: ["c1"] },
      ],
    },
    validate: (state) => {
      return Boolean(state.branches["bugfix"]) && state.head.target === "bugfix";
    },
  },
  {
    id: 6,
    slug: "git-merge",
    level: "Средний",
    title: "Урок 6: Слияние веток (git merge)",
    shortDesc: "Объедините результаты разработки из фича-ветки обратно в main.",
    theory: {
      concept: "Что такое Merge?",
      explanation:
        "Merge объединяет историю двух веток. Если ветки разошлись, Git создаёт специальный коммит слияния (Merge Commit), у которого два родителя. Чтобы влить ветку feature в main, нужно сначала перейти в main, а затем выполнить git merge feature.",
      analogy: "Слияние двух рек в одно широкое русло.",
      commandExample: "git checkout main\ngit merge feature",
    },
    task: {
      instruction: 'Переключитесь на ветку main и влейте в неё наработки из ветки feature с помощью git merge feature.',
      hint: "Сначала перейдите на main: git checkout main. Затем объедините: git merge feature.",
      solutionCommand: "git checkout main && git merge feature",
    },
    initialState: {
      branches: { main: "c1", feature: "c2" },
      head: { type: "branch", target: "main" },
      commits: [
        { id: "c0", message: "Initial commit", parentIds: [] },
        { id: "c1", message: "Главная страница", parentIds: ["c0"] },
        { id: "c2", message: "Готовый профиль пользователя", parentIds: ["c1"] },
      ],
    },
    validate: (state) => {
      // Main must now include or point to feature's commit
      const mainCommit = state.branches["main"];
      const featureCommit = state.branches["feature"];
      return mainCommit === featureCommit || Boolean(state.commits[mainCommit]?.isMerge);
    },
  },
  {
    id: 7,
    slug: "git-rebase",
    level: "Продвинутый",
    title: "Урок 7: Перебазирование (git rebase)",
    shortDesc: "Научитесь делать чистую линейную историю без лишних мердж-коммитов.",
    theory: {
      concept: "Чем Rebase отличается от Merge?",
      explanation:
        "Rebase берёт коммиты вашей текущей ветки и «пересаживает» их на верхушку целевой ветки. В результате история выглядит так, будто вы начали работу только что, а история коммитов остаётся идеально ровной и читаемой.",
      analogy: "Переставить вагон в конец поезда.",
      commandExample: "git checkout feature\ngit rebase main",
    },
    task: {
      instruction: 'Находясь в ветке feature, перебазируйте её поверх ветки main командой git rebase main.',
      hint: "Выполните: git rebase main. Коммиты ветки feature перенесутся на верхушку main.",
      solutionCommand: "git rebase main",
    },
    initialState: {
      branches: { main: "c2", feature: "c3" },
      head: { type: "branch", target: "feature" },
      commits: [
        { id: "c0", message: "Initial commit", parentIds: [] },
        { id: "c1", message: "Базовая архитектура", parentIds: ["c0"] },
        { id: "c2", message: "Обновление API в main", parentIds: ["c1"] },
        { id: "c3", message: "Новая кнопка в feature", parentIds: ["c1"] },
      ],
    },
    validate: (state) => {
      const featureCommitId = state.branches["feature"];
      const featureCommit = state.commits[featureCommitId];
      // After rebase, feature commit's parent should be main's commit c2
      return Boolean(featureCommit && featureCommit.parentIds.includes("c2"));
    },
  },
  {
    id: 8,
    slug: "git-reset",
    level: "Продвинутый",
    title: "Урок 8: Отмена и откат коммитов (git reset)",
    shortDesc: "Исправляйте ошибки и возвращайтесь во времени назад.",
    theory: {
      concept: "Как работает git reset?",
      explanation:
        "Команда git reset перемещает указатель текущей ветки назад во времени на указанное количество шагов (например, HEAD~1 отменяет 1 последний коммит) или к конкретному хешу. Это спасает, когда коммит был сделан по ошибке.",
      analogy: "Машина времени: переместиться на один шаг назад до совершения ошибки.",
      commandExample: "git reset HEAD~1",
    },
    task: {
      instruction: "Откатите последний ошибочный коммит назад с помощью команды git reset HEAD~1.",
      hint: "Введите: git reset HEAD~1. Указатель ветки переместится на предыдущий коммит c1.",
      solutionCommand: "git reset HEAD~1",
    },
    initialState: {
      branches: { main: "c2" },
      head: { type: "branch", target: "main" },
      commits: [
        { id: "c0", message: "Initial commit", parentIds: [] },
        { id: "c1", message: "Стабильная версия каталога", parentIds: ["c0"] },
        { id: "c2", message: "ОШИБКА: сломанный код, который нужно откатить", parentIds: ["c1"] },
      ],
    },
    validate: (state) => {
      // Main should now point to c1 instead of c2
      return state.branches["main"] === "c1";
    },
  },
];

