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
    description: "Работа с событиями клика, инкрементом значений, клавиатурой и сменой цветов.",
    html: `<div class="card">
  <div class="badge-header">Модуль 1: DOM & События</div>
  <h2>Счётчик значений</h2>
  <p class="subtitle">Изучение addEventListener, textContent и условий</p>

  <div class="display">
    <span id="counterValue">0</span>
  </div>

  <div class="step-selector">
    <span>Шаг:</span>
    <button class="step-btn active" data-step="1">1</button>
    <button class="step-btn" data-step="5">5</button>
    <button class="step-btn" data-step="10">10</button>
  </div>

  <div class="btn-group">
    <button id="decBtn" class="btn btn-outline">- Уменьшить</button>
    <button id="resetBtn" class="btn btn-ghost">Сброс</button>
    <button id="incBtn" class="btn btn-primary">+ Увеличить</button>
  </div>

  <div class="info" id="statusMessage">Используйте кнопки или клавиши Стрелка Вверх / Вниз</div>
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
  border-radius: 14px;
  padding: 24px;
  width: 100%;
  max-width: 380px;
  text-align: center;
}

.badge-header {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  padding: 3px 8px;
  border-radius: 6px;
  margin-bottom: 12px;
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
  margin-bottom: 16px;
}

#counterValue {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 3.5rem;
  font-weight: 700;
  color: #10b981;
  transition: color 0.2s ease, transform 0.12s ease;
  display: inline-block;
}

.step-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 0.8rem;
  color: #a1a1aa;
}

.step-btn {
  background: #27272a;
  border: 1px solid #3f3f46;
  color: #f4f4f5;
  padding: 3px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.15s ease;
}

.step-btn.active {
  background: #10b981;
  color: #042f2e;
  border-color: #10b981;
  font-weight: 600;
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
  min-height: 1.2em;
}`,
    js: `// Получаем элементы из DOM
const counterValueEl = document.getElementById("counterValue");
const incBtn = document.getElementById("incBtn");
const decBtn = document.getElementById("decBtn");
const resetBtn = document.getElementById("resetBtn");
const statusMessage = document.getElementById("statusMessage");
const stepButtons = document.querySelectorAll(".step-btn");

let count = 0;
let step = 1;

function updateDisplay() {
  counterValueEl.textContent = count;

  // Микро-анимация масштаба
  counterValueEl.style.transform = "scale(1.15)";
  setTimeout(() => {
    counterValueEl.style.transform = "scale(1)";
  }, 100);

  // Динамическая окраска значения
  if (count > 0) {
    counterValueEl.style.color = "#10b981"; // Зелёный
  } else if (count < 0) {
    counterValueEl.style.color = "#ef4444"; // Красный
  } else {
    counterValueEl.style.color = "#a1a1aa"; // Нейтральный
  }
}

// Переключение шага изменения
stepButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    stepButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    step = parseInt(btn.dataset.step, 10);
    console.log("Установлен шаг:", step);
  });
});

incBtn.addEventListener("click", () => {
  count += step;
  updateDisplay();
  statusMessage.textContent = "Значение увеличено: " + count;
  console.log("Увеличение (+ " + step + "):", count);
});

decBtn.addEventListener("click", () => {
  count -= step;
  updateDisplay();
  statusMessage.textContent = "Значение уменьшено: " + count;
  console.log("Уменьшение (- " + step + "):", count);
});

resetBtn.addEventListener("click", () => {
  count = 0;
  updateDisplay();
  statusMessage.textContent = "Счётчик сброшен в 0";
  console.info("Счётчик сброшен!");
});

// Управление с клавиатуры
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") {
    count += step;
    updateDisplay();
  } else if (e.key === "ArrowDown") {
    count -= step;
    updateDisplay();
  } else if (e.key.toLowerCase() === "r") {
    count = 0;
    updateDisplay();
  }
});

console.log("Интерактивный счётчик лицея готов к работе!");`,
  },
  {
    id: "todo",
    title: "Мои задачи на сегодня",
    category: "DOM API",
    description: "Менеджер дедлайнов с фильтрами (Все/Активные/Сделано) и подсчетом остатка.",
    html: `<div class="todo-app">
  <header>
    <div class="header-top">
      <h2>Мои задачи на сегодня</h2>
      <span id="taskCount" class="badge">0 задач</span>
    </div>
    <p class="subtitle">Организация учебного процесса лицея</p>
  </header>

  <form id="todoForm" class="todo-input-bar">
    <input
      type="text"
      id="todoInput"
      placeholder="Например: Сдать лабораторную по JS..."
      autocomplete="off"
    />
    <button type="submit" id="addBtn">+ Добавить</button>
  </form>

  <div class="filter-bar">
    <button type="button" class="filter-btn active" data-filter="all">Все</button>
    <button type="button" class="filter-btn" data-filter="active">Активные</button>
    <button type="button" class="filter-btn" data-filter="completed">Сделано</button>
  </div>

  <ul id="todoList" class="todo-list"></ul>

  <div class="footer-actions">
    <span id="pendingText" class="pending-info">Осталось: 0</span>
    <button type="button" id="clearCompletedBtn" class="clear-btn">Очистить выполненные</button>
  </div>
</div>`,
    css: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #09090b;
  color: #f4f4f5;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 16px;
}

.todo-app {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 14px;
  padding: 24px;
  width: 100%;
  max-width: 440px;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #fafafa;
}

.badge {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.subtitle {
  font-size: 0.8rem;
  color: #a1a1aa;
  margin-top: 4px;
  margin-bottom: 16px;
}

.todo-input-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

#todoInput {
  flex: 1;
  background: #09090b;
  border: 1px solid #27272a;
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 0.85rem;
  color: #f4f4f5;
  outline: none;
  transition: border-color 0.15s ease;
}

#todoInput:focus {
  border-color: #10b981;
}

#addBtn {
  background: #10b981;
  color: #042f2e;
  border: none;
  border-radius: 8px;
  padding: 0 14px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

#addBtn:hover {
  background: #059669;
}

.filter-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  border-bottom: 1px solid #27272a;
  padding-bottom: 10px;
}

.filter-btn {
  background: transparent;
  border: 1px solid transparent;
  color: #a1a1aa;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-btn.active {
  background: #27272a;
  color: #f4f4f5;
  border-color: #3f3f46;
}

.todo-list {
  list-style: none;
  max-height: 280px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #09090b;
  border: 1px solid #27272a;
  border-radius: 8px;
  font-size: 0.85rem;
  transition: all 0.15s ease;
}

.todo-item:hover {
  border-color: #3f3f46;
}

.todo-item.done .task-text {
  text-decoration: line-through;
  color: #71717a;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  cursor: pointer;
}

.checkbox-custom {
  width: 16px;
  height: 16px;
  border: 1.5px solid #52525b;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.todo-item.done .checkbox-custom {
  background: #10b981;
  border-color: #10b981;
}

.checkbox-custom::after {
  content: "";
  display: none;
  width: 4px;
  height: 8px;
  border: solid #042f2e;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  margin-bottom: 2px;
}

.todo-item.done .checkbox-custom::after {
  display: block;
}

.delete-btn {
  background: transparent;
  border: none;
  color: #71717a;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 4px;
  border-radius: 4px;
  line-height: 1;
}

.delete-btn:hover {
  color: #ef4444;
}

.footer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid #27272a;
  font-size: 0.75rem;
  color: #71717a;
}

.clear-btn {
  background: transparent;
  border: none;
  color: #a1a1aa;
  cursor: pointer;
  font-size: 0.75rem;
  text-decoration: underline;
}

.clear-btn:hover {
  color: #f4f4f5;
}`,
    js: `// Начальные демо-задачи
let tasks = [
  { id: 1, text: "Изучить основы Git и ветвление", done: true },
  { id: 2, text: "Решить 3 задачи на тренажере печати", done: false },
  { id: 3, text: "Сдать практическую работу по DOM API", done: false }
];

let currentFilter = "all";

// Получаем элементы интерфейса
const todoForm = document.getElementById("todoForm");
const todoInput = document.getElementById("todoInput") || document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn") || document.querySelector(".add-btn");
const todoList = document.getElementById("todoList") || document.getElementById("taskList");
const taskCountBadge = document.getElementById("taskCount");
const pendingText = document.getElementById("pendingText");
const clearCompletedBtn = document.getElementById("clearCompletedBtn") || document.getElementById("clearCompleted");
const filterButtons = document.querySelectorAll(".filter-btn");

function render() {
  if (!todoList) return;
  todoList.innerHTML = "";

  const filteredTasks = tasks.filter((t) => {
    if (currentFilter === "active") return !t.done;
    if (currentFilter === "completed") return t.done;
    return true;
  });

  if (filteredTasks.length === 0) {
    const emptyLi = document.createElement("li");
    emptyLi.style.textAlign = "center";
    emptyLi.style.padding = "20px";
    emptyLi.style.color = "#71717a";
    emptyLi.style.fontSize = "0.8rem";
    emptyLi.textContent = "Задач в этом списке нет";
    todoList.appendChild(emptyLi);
  } else {
    filteredTasks.forEach((task) => {
      const li = document.createElement("li");
      li.className = "todo-item" + (task.done ? " done" : "");

      const left = document.createElement("div");
      left.className = "item-left";
      left.onclick = () => toggleTask(task.id);

      const check = document.createElement("div");
      check.className = "checkbox-custom";

      const span = document.createElement("span");
      span.className = "task-text";
      span.textContent = task.text;

      left.appendChild(check);
      left.appendChild(span);

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "delete-btn";
      delBtn.textContent = "✕";
      delBtn.title = "Удалить задачу";
      delBtn.onclick = (e) => {
        e.stopPropagation();
        deleteTask(task.id);
      };

      li.appendChild(left);
      li.appendChild(delBtn);
      todoList.appendChild(li);
    });
  }

  const activeCount = tasks.filter((t) => !t.done).length;
  if (taskCountBadge) {
    taskCountBadge.textContent = tasks.length + " задач";
  }
  if (pendingText) {
    pendingText.textContent = "Осталось сделать: " + activeCount;
  }
}

function toggleTask(id) {
  tasks = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
  render();
  console.log("Статус задачи изменен (ID " + id + ")");
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  render();
  console.warn("Задача удалена (ID " + id + ")");
}

function handleAddTask() {
  if (!todoInput) return;
  const text = todoInput.value.trim();
  if (!text) return;

  const newTask = {
    id: Date.now(),
    text: text,
    done: false
  };

  tasks.push(newTask);
  todoInput.value = "";
  todoInput.focus();
  render();
  console.log("Добавлена новая задача:", text);
}

if (todoForm) {
  todoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleAddTask();
  });
}

if (addBtn) {
  addBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleAddTask();
  });
}

if (todoInput) {
  todoInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTask();
    }
  });
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter || "all";
    render();
    console.log("Фильтр переключен на:", currentFilter);
  });
});

if (clearCompletedBtn) {
  clearCompletedBtn.addEventListener("click", () => {
    const beforeCount = tasks.length;
    tasks = tasks.filter((t) => !t.done);
    render();
    console.info("Очищено выполненных задач:", beforeCount - tasks.length);
  });
}

render();
console.log("Модуль 'Мои задачи на сегодня' успешно запущен!");`,
  },
  {
    id: "quiz",
    title: "Квиз по веб-разработке",
    category: "JS Basics",
    description: "Интерактивный тест по HTML/CSS/JS с прогресс-баром и подсчётом баллов.",
    html: `<div class="quiz-card">
  <div class="quiz-header">
    <div>
      <span class="quiz-badge">Практика JS</span>
      <h2>Тест по основам Веб-разработки</h2>
    </div>
    <div class="score-pill" id="scorePill">0 / 4</div>
  </div>

  <div class="progress-bar-bg">
    <div class="progress-fill" id="progressFill" style="width: 25%;"></div>
  </div>

  <div id="quizContainer">
    <p class="question-text" id="questionText">Вопрос загружается...</p>
    <div class="options-grid" id="optionsContainer"></div>
  </div>

  <div id="resultContainer" class="result-container" style="display: none;">
    <h3 id="resultTitle">Результат</h3>
    <p id="resultDesc">Описание результата</p>
    <button id="restartBtn" class="btn-restart">Пройти заново</button>
  </div>
</div>`,
    css: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #09090b;
  color: #f4f4f5;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 16px;
}

.quiz-card {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 14px;
  padding: 24px;
  width: 100%;
  max-width: 460px;
}

.quiz-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.quiz-badge {
  font-size: 11px;
  font-weight: 600;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  padding: 2px 7px;
  border-radius: 5px;
  display: inline-block;
  margin-bottom: 6px;
}

h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #fafafa;
}

.score-pill {
  background: #27272a;
  border: 1px solid #3f3f46;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #f4f4f5;
}

.progress-bar-bg {
  width: 100%;
  height: 6px;
  background: #27272a;
  border-radius: 3px;
  margin-bottom: 20px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #10b981;
  transition: width 0.3s ease;
}

.question-text {
  font-size: 0.95rem;
  font-weight: 600;
  color: #fafafa;
  margin-bottom: 16px;
  line-height: 1.4;
}

.options-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-btn {
  background: #09090b;
  border: 1px solid #27272a;
  color: #f4f4f5;
  padding: 10px 14px;
  border-radius: 8px;
  text-align: left;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.option-btn:hover:not(:disabled) {
  border-color: #52525b;
  background: #18181b;
}

.option-btn.correct {
  background: rgba(16, 185, 129, 0.15);
  border-color: #10b981;
  color: #10b981;
  font-weight: 600;
}

.option-btn.incorrect {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
  color: #ef4444;
}

.result-container {
  text-align: center;
  padding: 20px 0 10px;
}

.result-container h3 {
  font-size: 1.3rem;
  margin-bottom: 8px;
}

.result-container p {
  font-size: 0.85rem;
  color: #a1a1aa;
  margin-bottom: 20px;
}

.btn-restart {
  background: #10b981;
  color: #042f2e;
  border: none;
  padding: 9px 20px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}`,
    js: `const questions = [
  {
    q: "Какой метод используется для поиска элемента по ID в DOM?",
    options: ["document.getElementById()", "document.queryId()", "document.find()", "document.selectId()"],
    correct: 0
  },
  {
    q: "Какой тип данных возвращает оператор typeof null в JavaScript?",
    options: ["null", "undefined", "object", "boolean"],
    correct: 2
  },
  {
    q: "Какое CSS-свойство выравнивает элементы по главной оси во Flexbox?",
    options: ["align-items", "justify-content", "align-content", "flex-direction"],
    correct: 1
  },
  {
    q: "Какое ключевое слово объявляет неизменяемую переменную?",
    options: ["var", "let", "const", "static"],
    correct: 2
  }
];

let currentIndex = 0;
let score = 0;

const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const scorePill = document.getElementById("scorePill");
const progressFill = document.getElementById("progressFill");
const quizContainer = document.getElementById("quizContainer");
const resultContainer = document.getElementById("resultContainer");
const resultTitle = document.getElementById("resultTitle");
const resultDesc = document.getElementById("resultDesc");
const restartBtn = document.getElementById("restartBtn");

function showQuestion() {
  const current = questions[currentIndex];
  questionText.textContent = (currentIndex + 1) + ". " + current.q;
  scorePill.textContent = score + " / " + questions.length;
  progressFill.style.width = ((currentIndex + 1) / questions.length * 100) + "%";

  optionsContainer.innerHTML = "";

  current.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.onclick = () => selectAnswer(idx);
    optionsContainer.appendChild(btn);
  });
}

function selectAnswer(selectedIdx) {
  const current = questions[currentIndex];
  const buttons = optionsContainer.querySelectorAll(".option-btn");

  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === current.correct) {
      btn.classList.add("correct");
    } else if (idx === selectedIdx) {
      btn.classList.add("incorrect");
    }
  });

  if (selectedIdx === current.correct) {
    score++;
    console.log("Верный ответ на вопрос " + (currentIndex + 1));
  } else {
    console.warn("Ошибка в вопросе " + (currentIndex + 1));
  }

  setTimeout(() => {
    currentIndex++;
    if (currentIndex < questions.length) {
      showQuestion();
    } else {
      showResult();
    }
  }, 1000);
}

function showResult() {
  quizContainer.style.display = "none";
  resultContainer.style.display = "block";
  progressFill.style.width = "100%";
  scorePill.textContent = score + " / " + questions.length;

  if (score === questions.length) {
    resultTitle.textContent = "Отличный результат!";
    resultTitle.style.color = "#10b981";
    resultDesc.textContent = "Вы правильно ответили на все вопросы квиза (" + score + " из " + questions.length + ").";
  } else if (score >= 2) {
    resultTitle.textContent = "Хороший результат";
    resultTitle.style.color = "#f4f4f5";
    resultDesc.textContent = "Правильных ответов: " + score + " из " + questions.length + ". Есть что повторить!";
  } else {
    resultTitle.textContent = "Нужно подучить теорию";
    resultTitle.style.color = "#ef4444";
    resultDesc.textContent = "Правильных ответов: " + score + " из " + questions.length + ". Попробуйте ещё раз!";
  }
}

restartBtn.addEventListener("click", () => {
  currentIndex = 0;
  score = 0;
  quizContainer.style.display = "block";
  resultContainer.style.display = "none";
  showQuestion();
  console.info("Тест перезапущен!");
});

showQuestion();
console.log("Квиз по веб-разработке инициализирован.");`,
  },
  {
    id: "grade_calc",
    title: "Калькулятор рейтинга и стипендии",
    category: "JS Basics",
    description: "Расчет средневзвешенного балла по формуле лицея (30% + 30% + 40%) и статуса стипендии.",
    html: `<div class="calc-card">
  <div class="badge-head">Учебный отдел лицея</div>
  <h2>Калькулятор итогового балла</h2>
  <p class="subtitle">Формула: Модуль 1 (30%) + Модуль 2 (30%) + Экзамен (40%)</p>

  <div class="form-group">
    <label for="m1Input">Оценка за 1-й модуль (макс 100):</label>
    <input type="number" id="m1Input" min="0" max="100" value="85" />
  </div>

  <div class="form-group">
    <label for="m2Input">Оценка за 2-й модуль (макс 100):</label>
    <input type="number" id="m2Input" min="0" max="100" value="90" />
  </div>

  <div class="form-group">
    <label for="examInput">Экзаменационная оценка (макс 100):</label>
    <input type="number" id="examInput" min="0" max="100" value="88" />
  </div>

  <div class="result-box">
    <div class="result-row">
      <span class="label">Итоговый балл:</span>
      <span class="value" id="finalScore">0</span>
    </div>
    <div class="result-row">
      <span class="label">Оценка:</span>
      <span class="value" id="finalGrade">-</span>
    </div>
    <div class="result-row">
      <span class="label">Статус стипендии:</span>
      <span class="value-highlight" id="scholarshipStatus">-</span>
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
  background-color: #09090b;
  color: #f4f4f5;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 16px;
}

.calc-card {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 14px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
}

.badge-head {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  padding: 2px 7px;
  border-radius: 5px;
  margin-bottom: 10px;
}

h2 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #fafafa;
}

.subtitle {
  font-size: 0.75rem;
  color: #a1a1aa;
  margin-top: 4px;
  margin-bottom: 18px;
}

.form-group {
  margin-bottom: 12px;
}

label {
  display: block;
  font-size: 0.75rem;
  color: #d4d4d8;
  margin-bottom: 6px;
  font-weight: 500;
}

input {
  width: 100%;
  background: #09090b;
  border: 1px solid #27272a;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.85rem;
  color: #f4f4f5;
  outline: none;
  font-family: ui-monospace, SFMono-Regular, monospace;
}

input:focus {
  border-color: #10b981;
}

.result-box {
  margin-top: 20px;
  padding: 16px;
  background: #09090b;
  border: 1px solid #27272a;
  border-radius: 10px;
}

.result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.8rem;
}

.result-row:last-child {
  margin-bottom: 0;
  padding-top: 8px;
  border-top: 1px solid #27272a;
}

.result-row .label {
  color: #a1a1aa;
}

.result-row .value {
  font-weight: 700;
  color: #f4f4f5;
  font-family: ui-monospace, SFMono-Regular, monospace;
}

.value-highlight {
  font-weight: 700;
  color: #10b981;
}`,
    js: `const m1Input = document.getElementById("m1Input");
const m2Input = document.getElementById("m2Input");
const examInput = document.getElementById("examInput");
const finalScoreEl = document.getElementById("finalScore");
const finalGradeEl = document.getElementById("finalGrade");
const scholarshipStatusEl = document.getElementById("scholarshipStatus");

function calculate() {
  const m1 = parseFloat(m1Input.value) || 0;
  const m2 = parseFloat(m2Input.value) || 0;
  const exam = parseFloat(examInput.value) || 0;

  // Формула: 30% модуль 1, 30% модуль 2, 40% экзамен
  const total = (m1 * 0.3) + (m2 * 0.3) + (exam * 0.4);
  const rounded = Math.round(total * 10) / 10;

  finalScoreEl.textContent = rounded + " / 100";

  let grade = "";
  let scholarship = "";

  if (rounded >= 90) {
    grade = "Отлично (5)";
    scholarship = "Повышенная стипендия";
    scholarshipStatusEl.style.color = "#10b981";
  } else if (rounded >= 75) {
    grade = "Хорошо (4)";
    scholarship = "Академическая стипендия";
    scholarshipStatusEl.style.color = "#38bdf8";
  } else if (rounded >= 60) {
    grade = "Удовлетворительно (3)";
    scholarship = "Без стипендии";
    scholarshipStatusEl.style.color = "#fbbf24";
  } else {
    grade = "Неудовлетворительно (2)";
    scholarship = "Академическая задолженность";
    scholarshipStatusEl.style.color = "#ef4444";
  }

  finalGradeEl.textContent = grade;
  scholarshipStatusEl.textContent = scholarship;

  console.log("Расчет рейтинга:", { m1, m2, exam, total: rounded, grade, scholarship });
}

[m1Input, m2Input, examInput].forEach((inp) => {
  inp.addEventListener("input", calculate);
});

calculate();
console.log("Калькулятор рейтинга лицея загружен!");`,
  },
  {
    id: "stopwatch",
    title: "Секундомер и кругомер",
    category: "DOM API",
    description: "Точный миллисекундный таймер на setInterval с записью кругов и отсечек.",
    html: `<div class="stopwatch-card">
  <h2>Секундомер лицея</h2>
  <p class="subtitle">Практика таймеров и интервалов setInterval</p>

  <div class="time-display" id="timeDisplay">00:00.00</div>

  <div class="btn-grid">
    <button id="startBtn" class="btn btn-start">Старт</button>
    <button id="lapBtn" class="btn btn-lap" disabled>Круг</button>
    <button id="resetBtn" class="btn btn-reset">Сброс</button>
  </div>

  <div class="laps-container">
    <div class="laps-header">
      <span>Круг</span>
      <span>Время</span>
    </div>
    <ul id="lapsList" class="laps-list"></ul>
  </div>
</div>`,
    css: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #09090b;
  color: #f4f4f5;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 16px;
}

.stopwatch-card {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 14px;
  padding: 24px;
  width: 100%;
  max-width: 380px;
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

.time-display {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 3rem;
  font-weight: 700;
  color: #10b981;
  background: #09090b;
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 20px 0;
  margin-bottom: 20px;
  letter-spacing: 1px;
}

.btn-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  margin-bottom: 20px;
}

.btn {
  padding: 9px 0;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-start {
  background: #10b981;
  color: #042f2e;
}
.btn-start.running {
  background: #ef4444;
  color: #ffffff;
}

.btn-lap {
  background: #27272a;
  color: #f4f4f5;
  border-color: #3f3f46;
}
.btn-lap:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-reset {
  background: transparent;
  color: #a1a1aa;
  border-color: #3f3f46;
}
.btn-reset:hover {
  background: #27272a;
  color: #f4f4f5;
}

.laps-container {
  border-top: 1px solid #27272a;
  padding-top: 12px;
  text-align: left;
}

.laps-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #71717a;
  margin-bottom: 8px;
  padding: 0 8px;
}

.laps-list {
  list-style: none;
  max-height: 160px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lap-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 8px;
  background: #09090b;
  border: 1px solid #27272a;
  border-radius: 6px;
  font-size: 0.8rem;
  font-family: ui-monospace, SFMono-Regular, monospace;
}`,
    js: `let timerInterval = null;
let startTime = 0;
let elapsedTime = 0;
let isRunning = false;
let laps = [];

const timeDisplay = document.getElementById("timeDisplay");
const startBtn = document.getElementById("startBtn");
const lapBtn = document.getElementById("lapBtn");
const resetBtn = document.getElementById("resetBtn");
const lapsList = document.getElementById("lapsList");

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  const cc = String(centiseconds).padStart(2, "0");

  return mm + ":" + ss + "." + cc;
}

function updateDisplay() {
  const currentMs = elapsedTime + (isRunning ? (Date.now() - startTime) : 0);
  timeDisplay.textContent = formatTime(currentMs);
}

startBtn.addEventListener("click", () => {
  if (!isRunning) {
    // Старт
    isRunning = true;
    startTime = Date.now();
    timerInterval = setInterval(updateDisplay, 30);
    startBtn.textContent = "Пауза";
    startBtn.classList.add("running");
    lapBtn.disabled = false;
    console.log("Секундомер запущен");
  } else {
    // Пауза
    isRunning = false;
    clearInterval(timerInterval);
    elapsedTime += Date.now() - startTime;
    startBtn.textContent = "Продолжить";
    startBtn.classList.remove("running");
    lapBtn.disabled = true;
    console.log("Секундомер на паузе. Время:", formatTime(elapsedTime));
  }
});

lapBtn.addEventListener("click", () => {
  if (!isRunning) return;
  const currentMs = elapsedTime + (Date.now() - startTime);
  const formatted = formatTime(currentMs);
  laps.unshift(formatted);

  const li = document.createElement("li");
  li.className = "lap-item";
  li.innerHTML = "<span>Круг " + laps.length + "</span><span>" + formatted + "</span>";
  lapsList.prepend(li);

  console.log("Зафиксирован круг " + laps.length + ":", formatted);
});

resetBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  isRunning = false;
  startTime = 0;
  elapsedTime = 0;
  laps = [];
  timeDisplay.textContent = "00:00.00";
  startBtn.textContent = "Старт";
  startBtn.classList.remove("running");
  lapBtn.disabled = true;
  lapsList.innerHTML = "";
  console.info("Секундомер сброшен!");
});

console.log("Секундомер лицея готов к запуску.");`,
  },
  {
    id: "color_picker",
    title: "Генератор градиентов и палитр",
    category: "CSS & Layout",
    description: "Генерация CSS linear-gradient со слайдером угла и безопасным копированием.",
    html: `<div class="card">
  <h2>Генератор градиентов</h2>
  <p class="subtitle">Изучение CSS background и линейных переходов</p>

  <div id="previewBox" class="preview-box"></div>

  <div class="controls">
    <div class="control-row">
      <label for="angleRange">Угол наклона: <span id="angleValue">135°</span></label>
      <input type="range" id="angleRange" min="0" max="360" value="135" />
    </div>

    <div class="code-box">
      <code id="cssCode">background: linear-gradient(...);</code>
    </div>

    <div class="btn-group">
      <button id="randomBtn" class="btn btn-primary">Случайный градиент</button>
      <button id="copyBtn" class="btn btn-outline">Скопировать CSS</button>
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
  border-radius: 14px;
  padding: 24px;
  width: 100%;
  max-width: 420px;
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
  margin-bottom: 18px;
}

.preview-box {
  width: 100%;
  height: 140px;
  border-radius: 12px;
  border: 1px solid #27272a;
  margin-bottom: 18px;
  transition: background 0.3s ease;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-row {
  text-align: left;
}

.control-row label {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #a1a1aa;
  margin-bottom: 6px;
}

input[type="range"] {
  width: 100%;
  accent-color: #10b981;
}

.code-box {
  background: #09090b;
  border: 1px solid #27272a;
  border-radius: 8px;
  padding: 10px 12px;
  text-align: left;
  overflow-x: auto;
}

.code-box code {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.75rem;
  color: #10b981;
  white-space: nowrap;
}

.btn-group {
  display: flex;
  gap: 8px;
}

.btn {
  flex: 1;
  padding: 9px 0;
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
}`,
    js: `const previewBox = document.getElementById("previewBox");
const angleRange = document.getElementById("angleRange");
const angleValue = document.getElementById("angleValue");
const cssCode = document.getElementById("cssCode");
const randomBtn = document.getElementById("randomBtn");
const copyBtn = document.getElementById("copyBtn");

const colorPresets = [
  ["#10b981", "#3b82f6"],
  ["#8b5cf6", "#ec4899"],
  ["#f59e0b", "#ef4444"],
  ["#06b6d4", "#8b5cf6"],
  ["#14b8a6", "#0284c7"],
  ["#6366f1", "#a855f7"]
];

let activeColors = colorPresets[0];

function updateGradient() {
  const angle = angleRange.value;
  angleValue.textContent = angle + "°";
  const css = "linear-gradient(" + angle + "deg, " + activeColors[0] + ", " + activeColors[1] + ")";
  previewBox.style.background = css;
  cssCode.textContent = "background: " + css + ";";
}

function randomize() {
  const randomIndex = Math.floor(Math.random() * colorPresets.length);
  activeColors = colorPresets[randomIndex];
  updateGradient();
  console.log("Выбран градиент:", activeColors);
}

randomBtn.addEventListener("click", randomize);
angleRange.addEventListener("input", updateGradient);

copyBtn.addEventListener("click", () => {
  const text = cssCode.textContent;
  
  // Безопасное копирование с фолбэком для sandboxed iframe
  if (window.__copyToClipboard) {
    window.__copyToClipboard(text);
  } else {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch (e) {}
  }

  copyBtn.textContent = "Скопировано!";
  console.info("CSS скопирован:", text);
  setTimeout(() => {
    copyBtn.textContent = "Скопировать CSS";
  }, 1500);
});

updateGradient();
console.log("Генератор градиентов инициализирован.");`,
  },
  {
    id: "card",
    title: "Профиль студента IT-Лицея",
    category: "CSS & Layout",
    description: "Адаптивная верстка профиля с Flexbox, переключаемыми вкладками и тегами навыков.",
    html: `<div class="card-container">
  <div class="profile-card">
    <div class="avatar-wrapper">
      <div class="avatar-initials">АН</div>
      <span class="online-indicator" title="В сети"></span>
    </div>

    <h3 class="name">Александр Новиков</h3>
    <p class="role">Frontend-разработчик (Группа П-21)</p>
    <div class="institution">IT Лицей №98</div>

    <div class="tabs-nav">
      <button class="tab-btn active" id="skillsTabBtn">Навыки</button>
      <button class="tab-btn" id="contactTabBtn">Контакты</button>
    </div>

    <div id="skillsView" class="tab-content">
      <div class="tags">
        <span class="tag">HTML5</span>
        <span class="tag">CSS3</span>
        <span class="tag">JavaScript</span>
        <span class="tag">TypeScript</span>
        <span class="tag">Git</span>
      </div>
      <p class="bio">
        Изучаю веб-технологии и алгоритмы. Разрабатываю интерфейсы и учебные проекты.
      </p>
    </div>

    <div id="contactView" class="tab-content" style="display: none;">
      <div class="contact-list">
        <div class="contact-item">
          <span class="contact-label">Email:</span>
          <span class="contact-val" id="emailVal">novikov.a@lyceum.edu</span>
        </div>
        <div class="contact-item">
          <span class="contact-label">GitHub:</span>
          <span class="contact-val">github.com/novikov-lyceum</span>
        </div>
      </div>
      <button class="btn btn-primary" id="copyEmailBtn">Скопировать Email</button>
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
  background-color: #09090b;
  color: #f4f4f5;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 16px;
}

.profile-card {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 340px;
  text-align: center;
}

.avatar-wrapper {
  position: relative;
  width: 72px;
  height: 72px;
  margin: 0 auto 14px;
}

.avatar-initials {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #27272a;
  border: 2px solid #10b981;
  color: #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  background: #10b981;
  border: 2px solid #18181b;
  border-radius: 50%;
}

.name {
  font-size: 1.15rem;
  font-weight: 700;
  color: #fafafa;
}

.role {
  font-size: 0.8rem;
  color: #10b981;
  margin-top: 2px;
}

.institution {
  font-size: 0.75rem;
  color: #71717a;
  margin-top: 2px;
  margin-bottom: 16px;
}

.tabs-nav {
  display: flex;
  background: #09090b;
  padding: 3px;
  border-radius: 8px;
  border: 1px solid #27272a;
  margin-bottom: 16px;
}

.tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: #a1a1aa;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 6px 0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn.active {
  background: #27272a;
  color: #f4f4f5;
}

.tab-content {
  min-height: 120px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-bottom: 14px;
}

.tag {
  background: #27272a;
  border: 1px solid #3f3f46;
  color: #f4f4f5;
  font-size: 0.7rem;
  padding: 3px 8px;
  border-radius: 6px;
}

.bio {
  font-size: 0.75rem;
  color: #a1a1aa;
  line-height: 1.4;
}

.contact-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
  text-align: left;
}

.contact-item {
  background: #09090b;
  border: 1px solid #27272a;
  padding: 8px 10px;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
}

.contact-label {
  color: #71717a;
}

.contact-val {
  color: #f4f4f5;
  font-family: ui-monospace, SFMono-Regular, monospace;
}

.btn-primary {
  width: 100%;
  background: #10b981;
  color: #042f2e;
  border: none;
  padding: 8px 0;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-primary:hover {
  background: #059669;
}`,
    js: `const skillsTabBtn = document.getElementById("skillsTabBtn");
const contactTabBtn = document.getElementById("contactTabBtn");
const skillsView = document.getElementById("skillsView");
const contactView = document.getElementById("contactView");
const copyEmailBtn = document.getElementById("copyEmailBtn");
const emailVal = document.getElementById("emailVal");

skillsTabBtn.addEventListener("click", () => {
  skillsTabBtn.classList.add("active");
  contactTabBtn.classList.remove("active");
  skillsView.style.display = "block";
  contactView.style.display = "none";
  console.log("Открыта вкладка 'Навыки'");
});

contactTabBtn.addEventListener("click", () => {
  contactTabBtn.classList.add("active");
  skillsTabBtn.classList.remove("active");
  contactView.style.display = "block";
  skillsView.style.display = "none";
  console.log("Открыта вкладка 'Контакты'");
});

copyEmailBtn.addEventListener("click", () => {
  const email = emailVal.textContent;
  if (window.__copyToClipboard) {
    window.__copyToClipboard(email);
  } else {
    try {
      const ta = document.createElement("textarea");
      ta.value = email;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch(e) {}
  }

  copyEmailBtn.textContent = "Email скопирован!";
  console.info("Скопирован email:", email);
  setTimeout(() => {
    copyEmailBtn.textContent = "Скопировать Email";
  }, 1500);
});

console.log("Профиль студента лицея успешно загружен!");`,
  },
  {
    id: "button_effects",
    title: "Интерактивные CSS-кнопки",
    category: "CSS & Layout",
    description: "Разбор стильных анимаций: свечение, переходы, 3D-нажатие и счетчик кликов.",
    html: `<div class="container">
  <h2>Коллекция CSS-кнопок</h2>
  <p class="subtitle">Практика псевдоэлементов, градиентов и transitions</p>

  <div class="grid">
    <div class="button-card">
      <button class="btn btn-glow" id="btn1">Свечение (Glow)</button>
      <span class="btn-stat" id="stat1">Кликов: 0</span>
    </div>

    <div class="button-card">
      <button class="btn btn-gradient" id="btn2">Градиентная рамка</button>
      <span class="btn-stat" id="stat2">Кликов: 0</span>
    </div>

    <div class="button-card">
      <button class="btn btn-push" id="btn3">3D Нажатие</button>
      <span class="btn-stat" id="stat3">Кликов: 0</span>
    </div>

    <div class="button-card">
      <button class="btn btn-slide" id="btn4">Сдвиг фона</button>
      <span class="btn-stat" id="stat4">Кликов: 0</span>
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
  background-color: #09090b;
  color: #f4f4f5;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 16px;
}

.container {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 14px;
  padding: 24px;
  width: 100%;
  max-width: 440px;
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
  margin-bottom: 24px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.button-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.btn-stat {
  font-size: 0.7rem;
  color: #71717a;
}

.btn {
  width: 100%;
  padding: 10px 14px;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  border: none;
  position: relative;
  transition: all 0.2s ease;
}

/* 1. Glow button */
.btn-glow {
  background: #10b981;
  color: #042f2e;
}
.btn-glow:hover {
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.6);
  transform: translateY(-2px);
}

/* 2. Gradient border */
.btn-gradient {
  background: #09090b;
  color: #f4f4f5;
  border: 1px solid #3b82f6;
}
.btn-gradient:hover {
  background: #1e3a8a;
  border-color: #60a5fa;
}

/* 3. 3D Push button */
.btn-push {
  background: #27272a;
  color: #f4f4f5;
  border-bottom: 3px solid #18181b;
}
.btn-push:active {
  transform: translateY(2px);
  border-bottom-width: 1px;
}

/* 4. Slide background */
.btn-slide {
  background: transparent;
  color: #f4f4f5;
  border: 1px solid #3f3f46;
  overflow: hidden;
  z-index: 1;
}
.btn-slide::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: #6366f1;
  transition: left 0.25s ease;
  z-index: -1;
}
.btn-slide:hover::before {
  left: 0;
}`,
    js: `const counts = { btn1: 0, btn2: 0, btn3: 0, btn4: 0 };

function registerClick(btnId, statId) {
  const btn = document.getElementById(btnId);
  const stat = document.getElementById(statId);

  btn.addEventListener("click", () => {
    counts[btnId]++;
    stat.textContent = "Кликов: " + counts[btnId];
    console.log("Клик по кнопке [" + btn.textContent.trim() + "]: всего " + counts[btnId]);
  });
}

registerClick("btn1", "stat1");
registerClick("btn2", "stat2");
registerClick("btn3", "stat3");
registerClick("btn4", "stat4");

console.log("Коллекция кнопок готова к интерактиву!");`,
  },
  {
    id: "blank",
    title: "Чистый лист (Стартовый скелет)",
    category: "Starter",
    description: "Минимальный семантический шаблон HTML5/CSS3/JS для создания любого проекта с нуля.",
    html: `<div class="container">
  <header>
    <h1>Новый проект</h1>
    <p>Начните писать свой HTML, CSS и JavaScript код</p>
  </header>

  <main>
    <div class="box">
      <p>Здесь появится ваш интерактивный интерфейс.</p>
      <button id="demoBtn">Нажми на меня</button>
    </div>
  </main>
</div>`,
    css: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #09090b;
  color: #f4f4f5;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.container {
  text-align: center;
  max-width: 440px;
  width: 100%;
}

header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fafafa;
  margin-bottom: 6px;
}

header p {
  font-size: 0.85rem;
  color: #a1a1aa;
  margin-bottom: 24px;
}

.box {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 24px;
}

.box p {
  font-size: 0.85rem;
  color: #d4d4d8;
  margin-bottom: 16px;
}

button {
  background: #10b981;
  color: #042f2e;
  border: none;
  padding: 9px 18px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

button:hover {
  background: #059669;
}`,
    js: `const demoBtn = document.getElementById("demoBtn");

demoBtn.addEventListener("click", () => {
  console.log("Кнопка нажата! Время:", new Date().toLocaleTimeString());
});

console.log("Стартовый шаблон готов к разработке!");`,
  },
];
