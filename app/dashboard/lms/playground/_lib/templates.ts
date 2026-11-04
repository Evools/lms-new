export interface PlaygroundTemplate {
  id: string;
  title: string;
  category: "JS Basics" | "CSS & Layout" | "DOM API" | "Starter";
  description: string;
  html: string;
  css: string;
  js: string;
}

export const PLAYGROUND_TEMPLATES: PlaygroundTemplate[] = [
  {
    id: "counter",
    title: "Интерактивный счётчик",
    category: "DOM API",
    description: "Работа с событиями клика, инкрементом значений и динамической сменой цвета.",
    html: `<div class="card">
  <h2>Интерактивный счётчик</h2>
  <p class="subtitle">Практика событий addEventListener</p>
  
  <div class="display">
    <span id="counterValue">0</span>
  </div>
  
  <div class="btn-group">
    <button id="decBtn" class="btn btn-outline">- Уменьшить</button>
    <button id="resetBtn" class="btn btn-ghost">Сброс</button>
    <button id="incBtn" class="btn btn-primary">+ Увеличить</button>
  </div>
  
  <div class="info" id="statusMessage">Нажмите кнопку для изменения</div>
</div>`,
    css: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: #09090b;
  color: #f4f4f5;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 16px;
}

.card {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 360px;
  text-align: center;
}

h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fafafa;
}

.subtitle {
  font-size: 0.8rem;
  color: #a1a1aa;
  margin-top: 4px;
  margin-bottom: 20px;
}

.display {
  background: #09090b;
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 24px 0;
  margin-bottom: 20px;
}

#counterValue {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 3rem;
  font-weight: 700;
  color: #10b981;
  transition: color 0.2s ease, transform 0.15s ease;
  display: inline-block;
}

.btn-group {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn {
  padding: 8px 14px;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}

.btn-primary {
  background: #10b981;
  color: #042f2e;
}
.btn-primary:hover {
  background: #059669;
}

.btn-outline {
  background: transparent;
  border-color: #3f3f46;
  color: #f4f4f5;
}
.btn-outline:hover {
  background: #27272a;
}

.btn-ghost {
  background: transparent;
  color: #a1a1aa;
}
.btn-ghost:hover {
  color: #f4f4f5;
  background: #27272a;
}

.info {
  margin-top: 16px;
  font-size: 0.75rem;
  color: #71717a;
}`,
    js: `// Получаем элементы из DOM
const counterValueEl = document.getElementById("counterValue");
const incBtn = document.getElementById("incBtn");
const decBtn = document.getElementById("decBtn");
const resetBtn = document.getElementById("resetBtn");
const statusMessage = document.getElementById("statusMessage");

let count = 0;

function updateDisplay() {
  counterValueEl.textContent = count;
  
  // Анимация микро-толчка
  counterValueEl.style.transform = "scale(1.15)";
  setTimeout(() => {
    counterValueEl.style.transform = "scale(1)";
  }, 100);

  // Динамический цвет
  if (count > 0) {
    counterValueEl.style.color = "#10b981"; // Зеленый
  } else if (count < 0) {
    counterValueEl.style.color = "#ef4444"; // Красный
  } else {
    counterValueEl.style.color = "#a1a1aa"; // Серый
  }
}

incBtn.addEventListener("click", () => {
  count++;
  updateDisplay();
  statusMessage.textContent = "Значение увеличено: " + count;
  console.log("Увеличение:", count);
});

decBtn.addEventListener("click", () => {
  count--;
  updateDisplay();
  statusMessage.textContent = "Значение уменьшено: " + count;
  console.log("Уменьшение:", count);
});

resetBtn.addEventListener("click", () => {
  count = 0;
  updateDisplay();
  statusMessage.textContent = "Счётчик сброшен в 0";
  console.warn("Счётчик сброшен!");
});

console.log("Скрипт счётчика успешно инициализирован!");`,
  },
  {
    id: "todo",
    title: "Список задач (Todo List)",
    category: "DOM API",
    description: "Динамическое добавление задач, отметка выполненных и удаление элементов.",
    html: `<div class="todo-app">
  <header>
    <h2>Мои задачи на сегодня</h2>
    <span id="taskCount" class="badge">0 задач</span>
  </header>
  
  <form id="todoForm" class="todo-input-bar">
    <input 
      type="text" 
      id="taskInput" 
      placeholder="Что нужно сделать?" 
      autocomplete="off"
    />
    <button type="submit" class="add-btn">Добавить</button>
  </form>
  
  <ul id="taskList" class="task-list">
    <!-- Задачи добавляются сюда динамически -->
  </ul>
  
  <footer class="app-footer">
    <button id="clearCompleted" class="text-btn">Очистить выполненные</button>
  </footer>
</div>`,
    css: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #0b0f19;
  color: #e2e8f0;
  display: flex;
  justify-content: center;
  padding: 32px 16px;
  min-height: 100vh;
}

.todo-app {
  width: 100%;
  max-width: 440px;
  background: #131b2e;
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #f8fafc;
}

.badge {
  background: #1e293b;
  color: #38bdf8;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 9999px;
  border: 1px solid #334155;
}

.todo-input-bar {
  display: flex;
  gap: 8px;
}

input[type="text"] {
  flex: 1;
  background: #0b0f19;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 8px 12px;
  color: #f8fafc;
  font-size: 0.85rem;
  outline: none;
}
input[type="text"]:focus {
  border-color: #38bdf8;
}

.add-btn {
  background: #0284c7;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.add-btn:hover {
  background: #0369a1;
}

.task-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
}

.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #0b0f19;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 0.85rem;
}

.task-left {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.task-left input[type="checkbox"] {
  cursor: pointer;
}

.completed-text {
  text-decoration: line-through;
  color: #64748b;
}

.del-btn {
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 2px 6px;
  border-radius: 4px;
}
.del-btn:hover {
  background: rgba(239, 68, 68, 0.15);
}

.app-footer {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #1e293b;
  padding-top: 12px;
}

.text-btn {
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 0.75rem;
  cursor: pointer;
}
.text-btn:hover {
  color: #94a3b8;
}`,
    js: `const form = document.getElementById("todoForm");
const input = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");
const clearCompletedBtn = document.getElementById("clearCompleted");

let tasks = [
  { id: 1, text: "Повторить основы Git и ветвление", done: true },
  { id: 2, text: "Решить 3 задачи в тренажере печати", done: false },
  { id: 3, text: "Сдать ДЗ по веб-программированию", done: false },
];

function renderTasks() {
  taskList.innerHTML = "";
  
  tasks.forEach((t) => {
    const li = document.createElement("li");
    li.className = "task-item";
    
    li.innerHTML = \`
      <div class="task-left">
        <input type="checkbox" \${t.done ? "checked" : ""} data-id="\${t.id}" />
        <span class="\${t.done ? "completed-text" : ""}">\${t.text}</span>
      </div>
      <button class="del-btn" data-del="\${t.id}">✕</button>
    \`;
    taskList.appendChild(li);
  });

  const activeCount = tasks.filter((t) => !t.done).length;
  taskCount.textContent = activeCount + " в работе";
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const val = input.value.trim();
  if (!val) return;

  const newTask = {
    id: Date.now(),
    text: val,
    done: false,
  };

  tasks.push(newTask);
  input.value = "";
  renderTasks();
  console.log("Добавлена новая задача:", val);
});

taskList.addEventListener("click", (e) => {
  if (e.target.matches("input[type='checkbox']")) {
    const id = Number(e.target.dataset.id);
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.done = !task.done;
      renderTasks();
      console.log("Статус задачи изменен:", task.text, "Выполнено:", task.done);
    }
  }

  if (e.target.matches(".del-btn")) {
    const id = Number(e.target.dataset.del);
    tasks = tasks.filter((t) => t.id !== id);
    renderTasks();
    console.warn("Задача удалена:", id);
  }
});

clearCompletedBtn.addEventListener("click", () => {
  const beforeCount = tasks.length;
  tasks = tasks.filter((t) => !t.done);
  renderTasks();
  console.log("Удалено выполненных задач:", beforeCount - tasks.length);
});

// Первоначальный рендер
renderTasks();`,
  },
  {
    id: "card",
    title: "Карточка профиля разработчика",
    category: "CSS & Layout",
    description: "Верстка карточки с Flexbox, современными бейджами, аватаром и кнопками соцсетей.",
    html: `<div class="card-container">
  <div class="profile-card">
    <div class="avatar-wrapper">
      <div class="avatar">👨‍💻</div>
      <span class="online-indicator"></span>
    </div>
    
    <h3 class="name">Александр Новиков</h3>
    <p class="role">Frontend Developer (IT Лицей)</p>
    
    <div class="tags">
      <span class="tag">HTML5</span>
      <span class="tag">CSS3</span>
      <span class="tag">JavaScript</span>
      <span class="tag">React</span>
      <span class="tag">Git</span>
    </div>
    
    <p class="bio">
      Студент группы П-21. Увлекаюсь созданием удобных веб-интерфейсов и реактивными веб-приложениями.
    </p>
    
    <div class="action-buttons">
      <button class="btn btn-contact" id="contactBtn">Написать</button>
      <button class="btn btn-github" id="githubBtn">GitHub</button>
    </div>
  </div>
</div>`,
    css: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: radial-gradient(circle at 50% 20%, #1e1b4b, #09090b);
  color: #f4f4f5;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 16px;
}

.profile-card {
  background: rgba(24, 24, 27, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 28px 24px;
  width: 100%;
  max-width: 320px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.profile-card:hover {
  transform: translateY(-4px);
  border-color: rgba(99, 102, 241, 0.4);
}

.avatar-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #312e81;
  border: 2px solid #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
}

.online-indicator {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 14px;
  height: 14px;
  background: #10b981;
  border: 2px solid #18181b;
  border-radius: 50%;
}

.name {
  font-size: 1.15rem;
  font-weight: 700;
  color: #ffffff;
}

.role {
  font-size: 0.8rem;
  color: #818cf8;
  margin-top: 2px;
  margin-bottom: 14px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-bottom: 16px;
}

.tag {
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.3);
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
}

.bio {
  font-size: 0.75rem;
  line-height: 1.5;
  color: #a1a1aa;
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn {
  flex: 1;
  padding: 8px 0;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}

.btn-contact {
  background: #6366f1;
  color: #ffffff;
}
.btn-contact:hover {
  background: #4f46e5;
}

.btn-github {
  background: #27272a;
  border-color: #3f3f46;
  color: #f4f4f5;
}
.btn-github:hover {
  background: #3f3f46;
}`,
    js: `const contactBtn = document.getElementById("contactBtn");
const githubBtn = document.getElementById("githubBtn");

contactBtn.addEventListener("click", () => {
  alert("Сообщение отправлено Александру!");
  console.log("Клик по кнопке 'Написать'");
});

githubBtn.addEventListener("click", () => {
  console.log("Переход в профиль GitHub");
  alert("Открываем портфолио...");
});

console.log("Карточка профиля успешно загружена!");`,
  },
  {
    id: "button_effects",
    title: "Интерактивные CSS-кнопки",
    category: "CSS & Layout",
    description: "Разбор стильных анимаций: градиентные обводки, свечение и эффекты наведения.",
    html: `<div class="container">
  <h2>Коллекция кнопок</h2>
  <p class="subtitle">Интерактивные эффекты на чистом CSS</p>
  
  <div class="grid">
    <button class="btn btn-glow">Glow Effect</button>
    <button class="btn btn-gradient">Gradient Border</button>
    <button class="btn btn-slide"><span>Slide Fill</span></button>
    <button class="btn btn-pulse">Pulsing Button</button>
  </div>
</div>`,
    css: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, sans-serif;
  background-color: #0c0a09;
  color: #f5f5f4;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.container {
  text-align: center;
  max-width: 400px;
}

h2 {
  font-size: 1.4rem;
  margin-bottom: 6px;
}

.subtitle {
  font-size: 0.85rem;
  color: #a8a29e;
  margin-bottom: 32px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.btn {
  padding: 12px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  border: none;
  position: relative;
  outline: none;
  transition: all 0.25s ease;
}

/* 1. Glow button */
.btn-glow {
  background: #14b8a6;
  color: #042f2e;
}
.btn-glow:hover {
  box-shadow: 0 0 20px #14b8a6;
  transform: translateY(-2px);
}

/* 2. Gradient Border */
.btn-gradient {
  background: #1c1917;
  color: #f5f5f4;
  border: 1px solid #06b6d4;
}
.btn-gradient:hover {
  background: #06b6d4;
  color: #083344;
}

/* 3. Slide Fill */
.btn-slide {
  background: transparent;
  color: #f5f5f4;
  border: 1px solid #ec4899;
  overflow: hidden;
}
.btn-slide::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: #ec4899;
  transition: left 0.3s ease;
  z-index: 0;
}
.btn-slide:hover::before {
  left: 0;
}
.btn-slide span {
  position: relative;
  z-index: 1;
}

/* 4. Pulse */
.btn-pulse {
  background: #8b5cf6;
  color: #ffffff;
}
.btn-pulse:hover {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}`,
    js: `// Логирование кликов по кнопкам
document.querySelectorAll(".btn").forEach((button) => {
  button.addEventListener("click", (e) => {
    const text = e.target.innerText.trim();
    console.log("Нажата кнопка:", text);
  });
});

console.log("CSS эффекты готовы к тестированию!");`,
  },
  {
    id: "color_picker",
    title: "Генератор случайных градиентов",
    category: "JS Basics",
    description: "Генерация HEX цветов с помощью Math.random() и копирование CSS кода.",
    html: `<div class="app-card">
  <h2>Генератор градиентов</h2>
  <p class="subtitle">Math.random() & CSS переменные</p>
  
  <div id="gradientBox" class="gradient-preview"></div>
  
  <div class="code-box">
    <code id="cssCode">background: linear-gradient(...);</code>
  </div>
  
  <div class="controls">
    <button id="generateBtn" class="btn btn-primary">Сгенерировать новый</button>
    <button id="copyBtn" class="btn btn-outline">Скопировать CSS</button>
  </div>
</div>`,
    css: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, sans-serif;
  background-color: #030712;
  color: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 16px;
}

.app-card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 380px;
  text-align: center;
}

h2 {
  font-size: 1.25rem;
  font-weight: 700;
}

.subtitle {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-top: 4px;
  margin-bottom: 20px;
}

.gradient-preview {
  width: 100%;
  height: 140px;
  border-radius: 12px;
  border: 1px solid #374151;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.code-box {
  background: #030712;
  border: 1px solid #1f2937;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 20px;
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  color: #38bdf8;
  word-break: break-all;
}

.controls {
  display: flex;
  gap: 8px;
}

.btn {
  flex: 1;
  padding: 10px 0;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-primary {
  background: #3b82f6;
  color: #ffffff;
}
.btn-primary:hover {
  background: #2563eb;
}

.btn-outline {
  background: transparent;
  border-color: #374151;
  color: #e5e7eb;
}
.btn-outline:hover {
  background: #1f2937;
}`,
    js: `const gradientBox = document.getElementById("gradientBox");
const cssCode = document.getElementById("cssCode");
const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");

function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function getRandomAngle() {
  return Math.floor(Math.random() * 360);
}

function generateNewGradient() {
  const color1 = getRandomColor();
  const color2 = getRandomColor();
  const angle = getRandomAngle();
  
  const css = \`linear-gradient(\${angle}deg, \${color1}, \${color2})\`;
  gradientBox.style.background = css;
  cssCode.textContent = "background: " + css + ";";
  
  console.log("Сгенерирован градиент:", color1, "->", color2, "угол:", angle + "°");
}

generateBtn.addEventListener("click", generateNewGradient);

copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(cssCode.textContent);
  copyBtn.textContent = "Скопировано!";
  setTimeout(() => {
    copyBtn.textContent = "Скопировать CSS";
  }, 1500);
});

// Первый вызов
generateNewGradient();`,
  },
  {
    id: "blank",
    title: "Чистый лист (Стартовый скелет)",
    category: "Starter",
    description: "Минимальный чистый шаблон HTML/CSS/JS для реализации собственных идей.",
    html: `<div class="container">
  <h1>Привет, IT Лицей!</h1>
  <p>Редактируйте HTML, CSS и JavaScript во вкладках выше.</p>
  <button id="myBtn">Нажми на меня</button>
</div>`,
    css: `body {
  font-family: system-ui, sans-serif;
  background-color: #09090b;
  color: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  margin: 0;
}

.container {
  text-align: center;
  padding: 20px;
}

h1 {
  color: #10b981;
  font-size: 1.8rem;
  margin-bottom: 8px;
}

p {
  color: #a1a1aa;
  font-size: 0.9rem;
  margin-bottom: 20px;
}

button {
  background-color: #10b981;
  color: #042f2e;
  border: none;
  padding: 10px 18px;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
}

button:hover {
  background-color: #059669;
}`,
    js: `const btn = document.getElementById("myBtn");

btn.addEventListener("click", () => {
  console.log("Кнопка нажата в консоли!");
  alert("Код работает отлично!");
});`,
  },
];

