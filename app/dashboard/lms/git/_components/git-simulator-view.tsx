"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  GitBranch,
  GitCommit as GitCommitIcon,
  GitPullRequest,
  GitFork,
  Terminal,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Play,
  CornerDownLeft,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Info,
  Maximize2,
  Copy,
  Check,
  Zap,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GIT_LESSONS } from "../_lib/lessons";
import { GitCommit, GitRepoState, TerminalEntry, GitLesson } from "../_lib/types";

// Helper to generate realistic git commit hashes
function generateHash(): string {
  return Math.random().toString(16).substring(2, 9);
}

// Initial state for sandbox
const DEFAULT_INITIAL_STATE: GitRepoState = {
  commits: {
    c0: {
      id: "c0",
      hash: "8a1b2c3",
      message: "Инициализация репозитория (Initial commit)",
      parentIds: [],
      author: "Student <student@lyceum.edu>",
      timestamp: Date.now() - 3600000,
      branchCreated: "main",
    },
    c1: {
      id: "c1",
      hash: "4e5f6a7",
      message: "Базовая структура проекта и index.html",
      parentIds: ["c0"],
      author: "Student <student@lyceum.edu>",
      timestamp: Date.now() - 1800000,
      branchCreated: "main",
    },
  },
  branches: {
    main: "c1",
  },
  head: {
    type: "branch",
    target: "main",
  },
  stagingArea: ["styles.css"],
  workingDirectory: ["script.js"],
  nextCommitNum: 2,
};

export function GitSimulatorView() {
  // App Mode: Tutorial vs Free Sandbox
  const [activeTab, setActiveTab] = useState<"tutorial" | "sandbox" | "cheatsheet">("tutorial");

  // Lesson State
  const [currentLessonIdx, setCurrentLessonIdx] = useState<number>(0);
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);
  const [lessonSuccess, setLessonSuccess] = useState<boolean>(false);

  // Git State
  const [repoState, setRepoState] = useState<GitRepoState>(DEFAULT_INITIAL_STATE);
  const [historyCommands, setHistoryCommands] = useState<string[]>([]);
  const [selectedCommitId, setSelectedCommitId] = useState<string | null>(null);

  // Terminal State
  const [commandInput, setCommandInput] = useState<string>("");
  const [terminalHistory, setTerminalHistory] = useState<TerminalEntry[]>([
    {
      id: "init-1",
      type: "info",
      text: "Добро пожаловать в интерактивный Git-симулятор лицея!\nВведите 'git status' или 'help' для списка доступных команд.",
      timestamp: Date.now(),
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [copiedCheat, setCopiedCheat] = useState<string | null>(null);

  const terminalBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentLesson: GitLesson = GIT_LESSONS[currentLessonIdx] || GIT_LESSONS[0];

  // Load progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lms_git_completed_lessons_v1");
      if (saved) {
        setCompletedLessonIds(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Save progress
  const markLessonComplete = (lessonId: number) => {
    if (!completedLessonIds.includes(lessonId)) {
      const updated = [...completedLessonIds, lessonId];
      setCompletedLessonIds(updated);
      try {
        localStorage.setItem("lms_git_completed_lessons_v1", JSON.stringify(updated));
      } catch {}
    }
  };

  // Switch to specific lesson
  const loadLesson = (idx: number) => {
    const lesson = GIT_LESSONS[idx];
    if (!lesson) return;

    setCurrentLessonIdx(idx);
    setLessonSuccess(false);

    // Build state from lesson
    const commitsObj: Record<string, GitCommit> = {};
    lesson.initialState.commits.forEach((c, i) => {
      commitsObj[c.id] = {
        id: c.id,
        hash: generateHash(),
        message: c.message,
        parentIds: c.parentIds,
        author: "Student <student@lyceum.edu>",
        timestamp: Date.now() - (lesson.initialState.commits.length - i) * 600000,
        branchCreated: c.branchCreated || "main",
      };
    });

    const nextNum = lesson.initialState.commits.length;

    setRepoState({
      commits: commitsObj,
      branches: { ...lesson.initialState.branches },
      head: { ...lesson.initialState.head },
      stagingArea: ["app.js"],
      workingDirectory: [],
      nextCommitNum: nextNum,
    });

    setSelectedCommitId(null);
    setHistoryCommands([]);

    addTerminalOutput(
      "info",
      `=== Загружен ${lesson.title} ===\nЦель: ${lesson.task.instruction}\nВведите команду или нажмите на подсказку ниже.`
    );
  };

  // Auto-scroll terminal
  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalHistory]);

  const addTerminalOutput = (type: TerminalEntry["type"], text: string) => {
    setTerminalHistory((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        type,
        text,
        timestamp: Date.now(),
      },
    ]);
  };

  // Helper to get active commit ID
  const getActiveCommitId = (state: GitRepoState): string => {
    if (state.head.type === "branch") {
      return state.branches[state.head.target] || "c0";
    }
    return state.head.target;
  };

  // Helper to get active branch name if not detached
  const getActiveBranchName = (state: GitRepoState): string | null => {
    return state.head.type === "branch" ? state.head.target : null;
  };

  // Execute Git Command
  const executeCommand = (rawCommand: string) => {
    const trimmed = rawCommand.trim();
    if (!trimmed) return;

    // Log input in terminal
    const activeBranch = getActiveBranchName(repoState);
    const promptPrefix = activeBranch ? `(ветка: ${activeBranch})` : `(HEAD: detached)`;
    addTerminalOutput("input", `$ ${trimmed}`);

    const newHistory = [...historyCommands, trimmed];
    setHistoryCommands(newHistory);
    setCommandInput("");
    setHistoryIndex(-1);

    // Parse commands
    const tokens = trimmed.split(/\s+/);
    const mainCommand = tokens[0].toLowerCase();

    if (mainCommand === "clear") {
      setTerminalHistory([]);
      return;
    }

    if (mainCommand === "help") {
      addTerminalOutput(
        "output",
        `Поддерживаемые команды симулятора:
  git status                  - статус рабочей директории и активной ветки
  git commit -m "<сообщение>" - создать новый коммит
  git branch <имя>            - создать новую ветку
  git branch                  - список всех локальных веток
  git branch -d <имя>         - удалить ветку
  git checkout <ветка|коммит> - переключиться на ветку или коммит
  git checkout -b <имя>       - создать ветку и сразу перейти на неё
  git switch <ветка>          - переключить ветку (современный синтаксис)
  git switch -c <имя>         - создать ветку и перейти
  git merge <ветка>           - слить указанную ветку в текущую
  git rebase <ветка>          - перебазировать текущую ветку поверх целевой
  git reset HEAD~1            - откатить последний коммит назад
  git log                     - посмотреть историю коммитов
  git log --oneline --graph   - компактный граф коммитов в терминале
  clear                       - очистить терминал`
      );
      return;
    }

    if (mainCommand !== "git") {
      addTerminalOutput("error", `Команда не распознана: "${trimmed}". Доступные команды начинаются с "git" (или введите "help").`);
      return;
    }

    const sub = tokens[1]?.toLowerCase();

    // 1. git status
    if (sub === "status") {
      const activeBranchName = getActiveBranchName(repoState);
      const activeCommitId = getActiveCommitId(repoState);
      const currentCommit = repoState.commits[activeCommitId];

      let msg = "";
      if (activeBranchName) {
        msg += `На ветке ${activeBranchName}\n`;
        msg += `Ваша ветка актуальна с 'origin/${activeBranchName}'.\n\n`;
      } else {
        msg += `HEAD отделён на коммите ${currentCommit?.hash || activeCommitId}\n\n`;
      }

      if (repoState.stagingArea.length > 0) {
        msg += `Изменения, готовые к коммиту:\n  (используйте "git restore --staged <файл>..." для отмены)\n`;
        repoState.stagingArea.forEach((f) => {
          msg += `\tновые файлы:   ${f}\n`;
        });
      } else {
        msg += `нет изменений для коммита (рабочая директория чиста)\n`;
      }

      addTerminalOutput("output", msg);
      return;
    }

    // 2. git branch
    if (sub === "branch") {
      // Listing branches: git branch
      if (tokens.length === 2) {
        let msg = "";
        Object.keys(repoState.branches).forEach((b) => {
          const isCurrent = repoState.head.type === "branch" && repoState.head.target === b;
          msg += `${isCurrent ? "* " : "  "}${b}\n`;
        });
        addTerminalOutput("output", msg);
        return;
      }

      // Delete branch: git branch -d <name>
      if (tokens[2] === "-d" || tokens[2] === "-D") {
        const branchToDelete = tokens[3];
        if (!branchToDelete) {
          addTerminalOutput("error", "fatal: укажите имя ветки для удаления: git branch -d <имя>");
          return;
        }
        if (!repoState.branches[branchToDelete]) {
          addTerminalOutput("error", `error: ветка '${branchToDelete}' не найдена.`);
          return;
        }
        if (repoState.head.type === "branch" && repoState.head.target === branchToDelete) {
          addTerminalOutput("error", `error: невозможно удалить текущую активную ветку '${branchToDelete}'. Сначала переключитесь на другую.`);
          return;
        }

        const newBranches = { ...repoState.branches };
        delete newBranches[branchToDelete];
        const nextState = { ...repoState, branches: newBranches };
        setRepoState(nextState);
        addTerminalOutput("success", `Удалена ветка ${branchToDelete}.`);
        checkValidation(nextState, newHistory);
        return;
      }

      // Create branch: git branch <name>
      const newBranchName = tokens[2];
      if (!newBranchName) {
        addTerminalOutput("error", "fatal: укажите имя ветки: git branch <имя>");
        return;
      }
      if (repoState.branches[newBranchName]) {
        addTerminalOutput("error", `fatal: ветка '${newBranchName}' уже существует.`);
        return;
      }

      const activeCommitId = getActiveCommitId(repoState);
      const nextState: GitRepoState = {
        ...repoState,
        branches: {
          ...repoState.branches,
          [newBranchName]: activeCommitId,
        },
      };

      setRepoState(nextState);
      addTerminalOutput("success", `Создана ветка '${newBranchName}' на коммите ${activeCommitId}.`);
      checkValidation(nextState, newHistory);
      return;
    }

    // 3. git checkout / git switch
    if (sub === "checkout" || sub === "switch") {
      const isCreateFlag = tokens[2] === "-b" || tokens[2] === "-c";

      if (isCreateFlag) {
        // git checkout -b <name>
        const newBranchName = tokens[3];
        if (!newBranchName) {
          addTerminalOutput("error", "fatal: укажите имя создаваемой ветки: git checkout -b <имя>");
          return;
        }
        if (repoState.branches[newBranchName]) {
          addTerminalOutput("error", `fatal: ветка '${newBranchName}' уже существует.`);
          return;
        }

        const activeCommitId = getActiveCommitId(repoState);
        const nextState: GitRepoState = {
          ...repoState,
          branches: {
            ...repoState.branches,
            [newBranchName]: activeCommitId,
          },
          head: {
            type: "branch",
            target: newBranchName,
          },
        };

        setRepoState(nextState);
        addTerminalOutput("success", `Переключено на новую ветку '${newBranchName}'.`);
        checkValidation(nextState, newHistory);
        return;
      }

      // git checkout <target>
      const target = tokens[2];
      if (!target) {
        addTerminalOutput("error", "fatal: укажите имя ветки или коммит: git checkout <имя>");
        return;
      }

      // If switching to an existing branch
      if (repoState.branches[target]) {
        const nextState: GitRepoState = {
          ...repoState,
          head: {
            type: "branch",
            target,
          },
        };
        setRepoState(nextState);
        addTerminalOutput("success", `Переключено на ветку '${target}'.`);
        checkValidation(nextState, newHistory);
        return;
      }

      // If checking out a specific commit hash/ID (detached HEAD)
      const foundCommit = Object.values(repoState.commits).find(
        (c) => c.id.toLowerCase() === target.toLowerCase() || c.hash.toLowerCase() === target.toLowerCase()
      );

      if (foundCommit) {
        const nextState: GitRepoState = {
          ...repoState,
          head: {
            type: "detached",
            target: foundCommit.id,
          },
        };
        setRepoState(nextState);
        addTerminalOutput(
          "output",
          `Примечание: переключение на '${target}'.\nВы находитесь в состоянии «отделённого HEAD» (detached HEAD).\nВы можете осматривать коммит ${foundCommit.hash}.`
        );
        checkValidation(nextState, newHistory);
        return;
      }

      addTerminalOutput("error", `error: ветка или коммит '${target}' не найдены.`);
      return;
    }

    // 4. git commit
    if (sub === "commit") {
      let commitMessage = "Update";

      // Extract message from -m "..." or -m '...'
      const mIdx = tokens.indexOf("-m");
      if (mIdx !== -1 && tokens[mIdx + 1]) {
        const afterM = trimmed.slice(trimmed.indexOf("-m") + 2).trim();
        const match = afterM.match(/^["'](.*?)["']/);
        if (match) {
          commitMessage = match[1];
        } else {
          commitMessage = tokens.slice(mIdx + 1).join(" ").replace(/["']/g, "");
        }
      }

      const activeCommitId = getActiveCommitId(repoState);
      const nextId = `c${repoState.nextCommitNum}`;
      const hash = generateHash();
      const currentBranch = getActiveBranchName(repoState);

      const newCommit: GitCommit = {
        id: nextId,
        hash,
        message: commitMessage,
        parentIds: [activeCommitId],
        author: "Student <student@lyceum.edu>",
        timestamp: Date.now(),
        branchCreated: currentBranch || undefined,
      };

      const updatedBranches = { ...repoState.branches };
      let updatedHead = { ...repoState.head };

      if (currentBranch) {
        updatedBranches[currentBranch] = nextId;
      } else {
        // Detached head moves to the new commit
        updatedHead = { type: "detached", target: nextId };
      }

      const nextState: GitRepoState = {
        ...repoState,
        commits: {
          ...repoState.commits,
          [nextId]: newCommit,
        },
        branches: updatedBranches,
        head: updatedHead,
        nextCommitNum: repoState.nextCommitNum + 1,
      };

      setRepoState(nextState);
      addTerminalOutput(
        "success",
        `[${currentBranch || "HEAD (detached)"} ${hash}] ${commitMessage}\n 1 file changed, 12 insertions(+)`
      );
      checkValidation(nextState, newHistory);
      return;
    }

    // 5. git merge
    if (sub === "merge") {
      const targetBranch = tokens[2];
      if (!targetBranch) {
        addTerminalOutput("error", "fatal: укажите имя ветки для слияния: git merge <имя>");
        return;
      }

      if (!repoState.branches[targetBranch]) {
        addTerminalOutput("error", `merge: ${targetBranch} - ветка не найдена.`);
        return;
      }

      const currentBranch = getActiveBranchName(repoState);
      if (!currentBranch) {
        addTerminalOutput("error", "fatal: невозможно выполнить слияние в состоянии detached HEAD. Сначала переключитесь на ветку.");
        return;
      }

      if (currentBranch === targetBranch) {
        addTerminalOutput("output", "Ветка уже актуальна. Слияние с самой собой не требуется.");
        return;
      }

      const currentCommitId = repoState.branches[currentBranch];
      const targetCommitId = repoState.branches[targetBranch];

      // Check if target is already ancestor (already up to date)
      if (currentCommitId === targetCommitId) {
        addTerminalOutput("output", "Already up to date.");
        return;
      }

      // Check if fast-forward is possible (currentCommitId is an ancestor of targetCommitId)
      const isAncestor = (ancestorId: string, childId: string): boolean => {
        if (ancestorId === childId) return true;
        const child = repoState.commits[childId];
        if (!child) return false;
        return child.parentIds.some((p) => isAncestor(ancestorId, p));
      };

      if (isAncestor(currentCommitId, targetCommitId)) {
        // Fast-forward merge!
        const nextState: GitRepoState = {
          ...repoState,
          branches: {
            ...repoState.branches,
            [currentBranch]: targetCommitId,
          },
        };
        setRepoState(nextState);
        addTerminalOutput("success", `Обновление ${repoState.commits[currentCommitId]?.hash}..${repoState.commits[targetCommitId]?.hash}\nFast-forward слияние успешно.`);
        checkValidation(nextState, newHistory);
        return;
      }

      // True 3-way Merge Commit (two parents)
      const nextId = `c${repoState.nextCommitNum}`;
      const hash = generateHash();
      const mergeCommit: GitCommit = {
        id: nextId,
        hash,
        message: `Merge branch '${targetBranch}' into ${currentBranch}`,
        parentIds: [currentCommitId, targetCommitId],
        author: "Student <student@lyceum.edu>",
        timestamp: Date.now(),
        branchCreated: currentBranch,
        isMerge: true,
      };

      const nextState: GitRepoState = {
        ...repoState,
        commits: {
          ...repoState.commits,
          [nextId]: mergeCommit,
        },
        branches: {
          ...repoState.branches,
          [currentBranch]: nextId,
        },
        nextCommitNum: repoState.nextCommitNum + 1,
      };

      setRepoState(nextState);
      addTerminalOutput("success", `Merge made by the 'ort' strategy.\nСоздан коммит слияния: [${currentBranch} ${hash}] Merge branch '${targetBranch}'`);
      checkValidation(nextState, newHistory);
      return;
    }

    // 6. git rebase
    if (sub === "rebase") {
      const targetBranch = tokens[2];
      if (!targetBranch) {
        addTerminalOutput("error", "fatal: укажите ветку для перебазирования: git rebase <ветка>");
        return;
      }

      if (!repoState.branches[targetBranch]) {
        addTerminalOutput("error", `fatal: ветка '${targetBranch}' не существует.`);
        return;
      }

      const currentBranch = getActiveBranchName(repoState);
      if (!currentBranch) {
        addTerminalOutput("error", "fatal: невозможно выполнить rebase в состоянии detached HEAD.");
        return;
      }

      if (currentBranch === targetBranch) {
        addTerminalOutput("output", `Текущая ветка ${currentBranch} уже находится на верхушке ${targetBranch}.`);
        return;
      }

      const currentCommitId = repoState.branches[currentBranch];
      const targetCommitId = repoState.branches[targetBranch];

      // Rebase current branch's commit on top of targetCommitId
      const currentCommit = repoState.commits[currentCommitId];
      if (!currentCommit) return;

      const nextId = `c${repoState.nextCommitNum}`;
      const hash = generateHash();
      const rebasedCommit: GitCommit = {
        id: nextId,
        hash,
        message: `${currentCommit.message} (rebased)`,
        parentIds: [targetCommitId],
        author: currentCommit.author,
        timestamp: Date.now(),
        branchCreated: currentBranch,
      };

      const nextState: GitRepoState = {
        ...repoState,
        commits: {
          ...repoState.commits,
          [nextId]: rebasedCommit,
        },
        branches: {
          ...repoState.branches,
          [currentBranch]: nextId,
        },
        nextCommitNum: repoState.nextCommitNum + 1,
      };

      setRepoState(nextState);
      addTerminalOutput("success", `Успешно перебазирована ветка ${currentBranch} поверх ${targetBranch}.\nИстория стала идеально линейной.`);
      checkValidation(nextState, newHistory);
      return;
    }

    // 7. git reset
    if (sub === "reset") {
      const currentBranch = getActiveBranchName(repoState);
      if (!currentBranch) {
        addTerminalOutput("error", "fatal: невозможно выполнить reset в состоянии detached HEAD.");
        return;
      }

      const activeCommitId = repoState.branches[currentBranch];
      const activeCommit = repoState.commits[activeCommitId];

      if (!activeCommit || activeCommit.parentIds.length === 0) {
        addTerminalOutput("error", "fatal: невозможно откатиться дальше корневого коммита.");
        return;
      }

      const parentCommitId = activeCommit.parentIds[0];
      const parentCommit = repoState.commits[parentCommitId];

      const nextState: GitRepoState = {
        ...repoState,
        branches: {
          ...repoState.branches,
          [currentBranch]: parentCommitId,
        },
      };

      setRepoState(nextState);
      addTerminalOutput(
        "success",
        `HEAD сейчас указывает на ${parentCommit?.hash || parentCommitId} ${parentCommit?.message}\nОткат выполнен успешно.`
      );
      checkValidation(nextState, newHistory);
      return;
    }

    // 8. git log
    if (sub === "log") {
      let output = "";
      let currId: string | undefined = getActiveCommitId(repoState);

      const visited = new Set<string>();
      while (currId && !visited.has(currId)) {
        visited.add(currId);
        const c: GitCommit | undefined = repoState.commits[currId];
        if (!c) break;

        const branchNames = Object.entries(repoState.branches)
          .filter(([, id]) => id === c.id)
          .map(([name]) => name);

        const isHead = getActiveCommitId(repoState) === c.id;
        const branchTag = branchNames.length > 0 ? ` (${branchNames.join(", ")})` : "";
        const headTag = isHead ? ` -> HEAD` : "";

        output += `commit ${c.hash}${headTag}${branchTag}\n`;
        output += `Author: ${c.author}\n`;
        output += `Date:   ${new Date(c.timestamp).toLocaleTimeString()}\n\n`;
        output += `    ${c.message}\n\n`;

        currId = c.parentIds[0];
      }

      addTerminalOutput("output", output || "История коммитов пуста.");
      return;
    }

    addTerminalOutput("error", `git: '${sub}' не является встроенной командой Git. Введите 'help' для справки.`);
  };

  // Validation function for active lesson
  const checkValidation = (state: GitRepoState, history: string[]) => {
    if (activeTab !== "tutorial") return;
    const isPassing = currentLesson.validate(state, history);
    if (isPassing) {
      setLessonSuccess(true);
      markLessonComplete(currentLesson.id);
      addTerminalOutput(
        "success",
        `🎉 Поздравляем! Задание «${currentLesson.title}» успешно выполнено!`
      );
    }
  };

  // Handle Terminal Enter & History Navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      executeCommand(commandInput);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyCommands.length === 0) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx < historyCommands.length) {
        setHistoryIndex(nextIdx);
        setCommandInput(historyCommands[historyCommands.length - 1 - nextIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = historyIndex - 1;
      if (nextIdx >= 0) {
        setHistoryIndex(nextIdx);
        setCommandInput(historyCommands[historyCommands.length - 1 - nextIdx]);
      } else {
        setHistoryIndex(-1);
        setCommandInput("");
      }
    }
  };

  // Quick run chip from tutorial or helper
  const handleQuickRun = (cmd: string) => {
    setCommandInput(cmd);
    inputRef.current?.focus();
  };

  const handleQuickExecute = (cmd: string) => {
    executeCommand(cmd);
  };

  // Reset current lesson
  const resetCurrentLesson = () => {
    loadLesson(currentLessonIdx);
  };

  // Reset to clean sandbox
  const resetToSandbox = () => {
    setRepoState(DEFAULT_INITIAL_STATE);
    setHistoryCommands([]);
    setSelectedCommitId(null);
    addTerminalOutput("info", "Репозиторий сброшен к начальному состоянию.");
  };

  // Compute Layout for SVG Commit Tree
  const graphNodes = useMemo(() => {
    const commits = Object.values(repoState.commits);
    if (commits.length === 0) return [];

    // Lane assignment: main is lane 1, other branches get lane 0 or 2
    const branchLanes: Record<string, number> = {
      main: 1,
    };
    let nextAvailableLane = 0;

    Object.keys(repoState.branches).forEach((b) => {
      if (b !== "main") {
        branchLanes[b] = nextAvailableLane;
        nextAvailableLane = nextAvailableLane === 0 ? 2 : nextAvailableLane + 1;
      }
    });

    // Topological depth (x position)
    const depths: Record<string, number> = {};
    const getDepth = (id: string, visited = new Set<string>()): number => {
      if (visited.has(id)) return 0;
      visited.add(id);
      if (depths[id] !== undefined) return depths[id];
      const c = repoState.commits[id];
      if (!c || c.parentIds.length === 0) {
        depths[id] = 0;
        return 0;
      }
      const maxParent = Math.max(...c.parentIds.map((p) => getDepth(p, new Set(visited))));
      depths[id] = maxParent + 1;
      return depths[id];
    };

    commits.forEach((c) => getDepth(c.id));

    // Calculate (x, y) coordinates
    const startX = 60;
    const stepX = 110;
    const baseLaneY = 120;
    const laneHeight = 65;

    return commits.map((c) => {
      const depth = depths[c.id] || 0;
      const x = startX + depth * stepX;

      // Assign lane based on branchCreated or fallback
      let lane = 1;
      if (c.branchCreated && branchLanes[c.branchCreated] !== undefined) {
        lane = branchLanes[c.branchCreated];
      } else if (c.parentIds.length > 0) {
        // Inherit from parent
        const parent = repoState.commits[c.parentIds[0]];
        if (parent?.branchCreated && branchLanes[parent.branchCreated] !== undefined) {
          lane = branchLanes[parent.branchCreated];
        }
      }

      const y = baseLaneY + (lane - 1) * laneHeight;

      // Find branches pointing to this commit
      const branchesOnThis = Object.entries(repoState.branches)
        .filter(([, id]) => id === c.id)
        .map(([name]) => name);

      // Check if HEAD points here
      const isHeadOnBranch =
        repoState.head.type === "branch" && branchesOnThis.includes(repoState.head.target);
      const isHeadDetached = repoState.head.type === "detached" && repoState.head.target === c.id;

      return {
        ...c,
        x,
        y,
        lane,
        branches: branchesOnThis,
        isHead: isHeadOnBranch || isHeadDetached,
        headLabel: isHeadOnBranch
          ? `HEAD -> ${repoState.head.target}`
          : isHeadDetached
          ? "HEAD (detached)"
          : null,
      };
    });
  }, [repoState]);

  // Compute graph bounds for SVG viewBox
  const svgBounds = useMemo(() => {
    if (graphNodes.length === 0) return { width: 600, height: 260 };
    const maxX = Math.max(...graphNodes.map((n) => n.x)) + 120;
    const maxY = Math.max(...graphNodes.map((n) => n.y)) + 90;
    return {
      width: Math.max(maxX, 620),
      height: Math.max(maxY, 250),
    };
  }, [graphNodes]);

  // Selected commit details
  const selectedCommit = selectedCommitId ? repoState.commits[selectedCommitId] : null;

  return (
    <div className="space-y-3 pb-8">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-card text-card-foreground shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight flex items-center gap-2">
                <span>Git-симулятор: интерактивный тренажёр ветвления</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                  LMS Интерактив
                </span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Практикуйтесь в ветвлении, коммитах, слияниях и отмене в реальном времени с визуальным деревом графа.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border text-xs shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab("tutorial");
              loadLesson(currentLessonIdx);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
              activeTab === "tutorial"
                ? "bg-background text-foreground shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span>Учебный курс</span>
            <span className="text-[9px] px-1 py-0.2 rounded-full bg-primary/10 text-primary font-bold">
              {completedLessonIds.length}/{GIT_LESSONS.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sandbox")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
              activeTab === "sandbox"
                ? "bg-background text-foreground shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>Свободная песочница</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cheatsheet")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
              activeTab === "cheatsheet"
                ? "bg-background text-foreground shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5 text-blue-500" />
            <span>Шпаргалка</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* LEFT COLUMN: Lesson Guide OR Cheatsheet (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {activeTab === "tutorial" && (
            <>
              {/* Lesson Navigation Header */}
              <div className="p-3.5 rounded-xl border bg-card text-xs space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground">
                      Урок {currentLesson.id} из {GIT_LESSONS.length}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                        currentLesson.level === "Базовый"
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          : currentLesson.level === "Средний"
                          ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                          : "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                      }`}
                    >
                      {currentLesson.level}
                    </span>
                  </div>

                  {/* Navigation prev/next buttons */}
                  <div className="flex items-center gap-1">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => loadLesson(currentLessonIdx - 1)}
                      disabled={currentLessonIdx === 0}
                      className="h-6 w-6 p-0"
                      title="Предыдущий урок"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => loadLesson(currentLessonIdx + 1)}
                      disabled={currentLessonIdx === GIT_LESSONS.length - 1}
                      className="h-6 w-6 p-0"
                      title="Следующий урок"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Lesson Title & Concept */}
                <div>
                  <h2 className="text-sm font-bold text-foreground mb-1">{currentLesson.title}</h2>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    {currentLesson.theory.explanation}
                  </p>
                </div>

                {/* Life Analogy */}
                {currentLesson.theory.analogy && (
                  <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-foreground text-[11px] flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-primary">Аналогия из жизни: </span>
                      <span>{currentLesson.theory.analogy}</span>
                    </div>
                  </div>
                )}

                {/* Practical Goal & Solution Chip */}
                <div className="p-3 rounded-lg border bg-muted/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground flex items-center gap-1">
                      <Target className="h-3.5 w-3.5 text-primary" />
                      <span>Задание урока:</span>
                    </span>
                    {lessonSuccess && (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Выполнено</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-foreground font-medium leading-relaxed">
                    {currentLesson.task.instruction}
                  </p>

                  <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
                    <code className="font-mono text-[10px] px-2 py-1 rounded bg-card border font-semibold text-primary truncate max-w-[210px]">
                      {currentLesson.task.solutionCommand}
                    </code>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleQuickRun(currentLesson.task.solutionCommand)}
                        className="h-6 px-2 text-[10px] gap-1"
                        title="Вставить команду в поле ввода терминала"
                      >
                        <CornerDownLeft className="h-3 w-3" />
                        <span>Вставить</span>
                      </Button>
                      <Button
                        size="xs"
                        onClick={() => handleQuickExecute(currentLesson.task.solutionCommand)}
                        className="h-6 px-2.5 text-[10px] gap-1 bg-primary text-primary-foreground font-medium"
                        title="Сразу выполнить команду в терминале"
                      >
                        <Play className="h-2.5 w-2.5" />
                        <span>Выполнить</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Success Banner or Next Action */}
                {lessonSuccess ? (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-[11px]">
                        Отлично! Задание выполнено.
                      </span>
                    </div>
                    {currentLessonIdx < GIT_LESSONS.length - 1 && (
                      <Button
                        size="xs"
                        onClick={() => loadLesson(currentLessonIdx + 1)}
                        className="h-6 px-2.5 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1"
                      >
                        <span>Дальше</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1">
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={resetCurrentLesson}
                      className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground gap-1"
                    >
                      <RotateCcw className="h-2.5 w-2.5" />
                      <span>Сбросить шаг</span>
                    </Button>
                    <span className="text-[10px] text-muted-foreground italic">
                      Подсказка: {currentLesson.task.hint}
                    </span>
                  </div>
                )}
              </div>

              {/* Lesson Selector Drawer / List */}
              <div className="p-3 rounded-xl border bg-card text-xs space-y-2">
                <span className="font-bold text-foreground text-[11px]">Все уроки курса:</span>
                <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                  {GIT_LESSONS.map((les, idx) => {
                    const isCompleted = completedLessonIds.includes(les.id);
                    const isActive = idx === currentLessonIdx;

                    return (
                      <button
                        key={les.id}
                        type="button"
                        onClick={() => loadLesson(idx)}
                        className={`w-full text-left p-1.5 rounded-lg border transition-colors flex items-center justify-between text-[11px] ${
                          isActive
                            ? "bg-primary/10 border-primary text-primary font-medium"
                            : "border-border/60 hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {isCompleted ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 shrink-0" />
                          )}
                          <span className="truncate">{les.title}</span>
                        </div>
                        <span className="text-[9px] opacity-60 font-mono ml-2 shrink-0">{les.level}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === "sandbox" && (
            <div className="p-3.5 rounded-xl border bg-card text-xs space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="font-bold text-foreground">Свободная песочница</span>
                </div>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={resetToSandbox}
                  className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Сброс</span>
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                В режиме песочницы нет фиксированных заданий. Вы можете свободно создавать ветки, коммитить, сливать и откатывать изменения, наблюдая за поведением графа.
              </p>

              {/* Quick Actions Palette */}
              <div className="space-y-1.5 pt-1">
                <span className="font-semibold text-foreground text-[10px]">Быстрые действия в один клик:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: "+ git commit", cmd: 'git commit -m "Новое изменение"' },
                    { label: "+ ветка feature", cmd: "git branch feature" },
                    { label: "→ checkout feature", cmd: "git checkout feature" },
                    { label: "+ checkout -b bugfix", cmd: "git checkout -b bugfix" },
                    { label: "⇌ merge feature", cmd: "git merge feature" },
                    { label: "↶ reset HEAD~1", cmd: "git reset HEAD~1" },
                  ].map((act) => (
                    <button
                      key={act.label}
                      type="button"
                      onClick={() => handleQuickExecute(act.cmd)}
                      className="p-1.5 rounded-md border border-border/80 bg-muted/40 hover:bg-muted text-left font-mono text-[10px] text-foreground truncate transition-colors flex items-center justify-between"
                      title={act.cmd}
                    >
                      <span className="truncate">{act.label}</span>
                      <Play className="h-2.5 w-2.5 text-primary opacity-70" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "cheatsheet" && (
            <div className="p-3.5 rounded-xl border bg-card text-xs space-y-3">
              <div className="flex items-center gap-2 border-b pb-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
                <span className="font-bold text-foreground">Шпаргалка Git (Cheat Sheet)</span>
              </div>

              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {[
                  {
                    title: "Создание и переключение веток",
                    commands: [
                      { cmd: "git branch <имя>", desc: "Создать новую ветку от текущего коммита" },
                      { cmd: "git checkout <имя>", desc: "Переключиться на ветку" },
                      { cmd: "git checkout -b <имя>", desc: "Создать ветку и сразу переключиться" },
                      { cmd: "git branch -d <имя>", desc: "Удалить завершённую ветку" },
                    ],
                  },
                  {
                    title: "Фиксация изменений (Коммиты)",
                    commands: [
                      { cmd: 'git commit -m "текст"', desc: "Создать коммит с понятным описанием" },
                      { cmd: "git status", desc: "Проверить текущее состояние и файлы" },
                      { cmd: "git log --oneline --graph", desc: "Посмотреть компактную историю" },
                    ],
                  },
                  {
                    title: "Объединение и перебазирование",
                    commands: [
                      { cmd: "git merge <ветка>", desc: "Слить ветку в текущую (Merge commit)" },
                      { cmd: "git rebase <ветка>", desc: "Перенести коммиты поверх другой ветки" },
                      { cmd: "git reset HEAD~1", desc: "Откатить 1 последний коммит назад" },
                    ],
                  },
                ].map((sec, i) => (
                  <div key={i} className="p-2.5 rounded-lg border bg-muted/30 space-y-1.5">
                    <span className="font-semibold text-foreground text-[11px]">{sec.title}</span>
                    <div className="space-y-1">
                      {sec.commands.map((c, j) => (
                        <div
                          key={j}
                          onClick={() => handleQuickRun(c.cmd)}
                          className="flex items-center justify-between p-1 rounded hover:bg-background cursor-pointer group transition-colors"
                          title="Кликните для копирования в терминал"
                        >
                          <div className="font-mono text-[10px] text-primary font-medium">{c.cmd}</div>
                          <div className="text-[10px] text-muted-foreground">{c.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commit Inspector (if clicked on graph) */}
          {selectedCommit && (
            <div className="p-3 rounded-xl border bg-card text-xs space-y-2 border-primary/40 bg-primary/[0.02]">
              <div className="flex items-center justify-between border-b pb-1.5">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <GitCommitIcon className="h-3.5 w-3.5 text-primary" />
                  <span>Инспектор коммита #{selectedCommit.id.toUpperCase()}</span>
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">hash: {selectedCommit.hash}</span>
              </div>

              <div className="text-[11px] space-y-1">
                <div>
                  <span className="text-muted-foreground">Сообщение: </span>
                  <span className="font-semibold text-foreground">{selectedCommit.message}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Родители: </span>
                  <span className="font-mono text-[10px] text-foreground">
                    {selectedCommit.parentIds.length > 0
                      ? selectedCommit.parentIds.join(", ").toUpperCase()
                      : "нет (начальный коммит)"}
                  </span>
                </div>
                {selectedCommit.isMerge && (
                  <div className="text-purple-600 font-semibold text-[10px]">Коммит слияния (Merge Commit)</div>
                )}
              </div>

              <div className="pt-1 flex items-center gap-1">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => handleQuickExecute(`git checkout ${selectedCommit.id}`)}
                  className="h-6 px-2 text-[10px] gap-1 text-primary hover:bg-primary/10"
                >
                  <span>git checkout {selectedCommit.id}</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live SVG Commit Graph & Terminal (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Box 1: Visual Git Commit Tree (SVG) */}
          <div className="p-3.5 rounded-xl border bg-card text-xs space-y-2 shadow-xs flex flex-col">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <GitPullRequest className="h-3.5 w-3.5 text-primary" />
                <span>Живое дерево коммитов и веток</span>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                  <span>main</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                  <span>ветка</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-primary bg-background inline-block" />
                  <span>HEAD*</span>
                </div>
              </div>
            </div>

            {/* SVG Canvas Area */}
            <div className="w-full min-h-[220px] max-h-[300px] overflow-x-auto overflow-y-hidden rounded-lg border bg-slate-50 dark:bg-zinc-950 p-2 relative flex items-center justify-center">
              {/* Subtle background blueprint dot grid */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
                  backgroundSize: "20px 20px",
                }}
              />

              <svg
                width={svgBounds.width}
                height={svgBounds.height}
                viewBox={`0 0 ${svgBounds.width} ${svgBounds.height}`}
                className="relative z-1 select-none"
              >
                <defs>
                  {/* Clean Arrowhead marker */}
                  <marker
                    id="arrow"
                    viewBox="0 0 8 8"
                    refX="7"
                    refY="4"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 7 4 L 0 7 z" fill="#94a3b8" />
                  </marker>
                </defs>

                {/* Connecting Lines between Commits */}
                {graphNodes.map((node) => {
                  return node.parentIds.map((pId) => {
                    const parentNode = graphNodes.find((n) => n.id === pId);
                    if (!parentNode) return null;

                    const isStraight = parentNode.y === node.y;
                    const pathD = isStraight
                      ? `M ${parentNode.x + 16} ${parentNode.y} L ${node.x - 16} ${node.y}`
                      : `M ${parentNode.x + 16} ${parentNode.y} C ${parentNode.x + 48} ${parentNode.y}, ${
                          node.x - 48
                        } ${node.y}, ${node.x - 16} ${node.y}`;

                    return (
                      <path
                        key={`${pId}->${node.id}`}
                        d={pathD}
                        stroke="#94a3b8"
                        strokeWidth="2"
                        fill="none"
                        markerEnd="url(#arrow)"
                      />
                    );
                  });
                })}

                {/* Commit Nodes (No jitter, rock solid) */}
                {graphNodes.map((node) => {
                  const isSelected = selectedCommitId === node.id;
                  const isMain = node.branchCreated === "main" || node.lane === 1;
                  const nodeFill = isMain ? "#059669" : "#2563eb"; // emerald-600 or blue-600

                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedCommitId(node.id)}
                      className="cursor-pointer"
                    >
                      {/* Selected halo indicator */}
                      {isSelected && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r="21"
                          fill="none"
                          stroke="hsl(var(--primary))"
                          strokeWidth="2"
                          strokeDasharray="3 3"
                        />
                      )}

                      {/* Commit Node Body */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="16"
                        fill={nodeFill}
                        stroke="white"
                        strokeWidth="2"
                        className="transition-colors hover:brightness-110"
                      />

                      {/* Text inside node (e.g. C0, C1) */}
                      <text
                        x={node.x}
                        y={node.y + 4}
                        textAnchor="middle"
                        fill="white"
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="monospace"
                        className="pointer-events-none select-none"
                      >
                        {node.id.toUpperCase()}
                      </text>

                      {/* Commit Hash underneath */}
                      <text
                        x={node.x}
                        y={node.y + 26}
                        textAnchor="middle"
                        fill="currentColor"
                        className="text-muted-foreground opacity-60 pointer-events-none select-none"
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {node.hash}
                      </text>

                      {/* Unified Clean Branch & HEAD Badges */}
                      <g transform={`translate(${node.x}, ${node.y - 24})`}>
                        {node.branches.map((bName, bIdx) => {
                          const isHeadOnThisBranch =
                            repoState.head.type === "branch" && repoState.head.target === bName;
                          const badgeColor = bName === "main" ? "#059669" : "#2563eb";
                          const labelText = isHeadOnThisBranch ? `HEAD -> ${bName}` : bName;
                          const badgeWidth = isHeadOnThisBranch
                            ? Math.max(76, labelText.length * 7 + 16)
                            : Math.max(48, bName.length * 7.5 + 14);
                          const yOffset = -bIdx * 20;

                          return (
                            <g key={bName} transform={`translate(0, ${yOffset})`}>
                              <rect
                                x={-badgeWidth / 2}
                                y="-10"
                                width={badgeWidth}
                                height="18"
                                rx="4"
                                fill={badgeColor}
                                stroke="white"
                                strokeWidth="1.5"
                              />
                              <text
                                x="0"
                                y="2.5"
                                textAnchor="middle"
                                fill="white"
                                fontSize="9"
                                fontWeight="bold"
                                fontFamily="monospace"
                                className="pointer-events-none select-none"
                              >
                                {labelText}
                              </text>
                            </g>
                          );
                        })}

                        {/* Detached HEAD badge */}
                        {repoState.head.type === "detached" && repoState.head.target === node.id && (
                          <g transform={`translate(0, ${-node.branches.length * 20})`}>
                            <rect
                              x="-48"
                              y="-10"
                              width="96"
                              height="18"
                              rx="4"
                              fill="#d97706"
                              stroke="white"
                              strokeWidth="1.5"
                            />
                            <text
                              x="0"
                              y="2.5"
                              textAnchor="middle"
                              fill="white"
                              fontSize="9"
                              fontWeight="bold"
                              fontFamily="monospace"
                              className="pointer-events-none select-none"
                            >
                              HEAD (detached)
                            </text>
                          </g>
                        )}
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Box 2: Interactive Terminal Console */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 p-3 shadow-md flex flex-col min-h-[320px] font-mono text-xs">
            {/* Terminal Window Header Bar */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-[11px] text-zinc-400">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                </div>
                <span className="font-semibold text-zinc-300">bash — git terminal</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-[10px]">
                  ветка:{" "}
                  <span className="text-emerald-400 font-bold">
                    {getActiveBranchName(repoState) || "HEAD (detached)"}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setTerminalHistory([])}
                  className="text-zinc-400 hover:text-zinc-200 text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800"
                >
                  Очистить
                </button>
              </div>
            </div>

            {/* Terminal Scroll Log Area */}
            <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[260px] pr-1 leading-relaxed">
              {terminalHistory.map((item) => {
                if (item.type === "input") {
                  return (
                    <div key={item.id} className="text-emerald-400 font-semibold flex items-start gap-1">
                      <span>➜</span>
                      <span>{item.text}</span>
                    </div>
                  );
                }
                if (item.type === "error") {
                  return (
                    <div key={item.id} className="text-red-400 whitespace-pre-wrap">
                      {item.text}
                    </div>
                  );
                }
                if (item.type === "success") {
                  return (
                    <div key={item.id} className="text-emerald-300 whitespace-pre-wrap">
                      {item.text}
                    </div>
                  );
                }
                if (item.type === "info") {
                  return (
                    <div key={item.id} className="text-sky-300 whitespace-pre-wrap">
                      {item.text}
                    </div>
                  );
                }
                return (
                  <div key={item.id} className="text-zinc-300 whitespace-pre-wrap">
                    {item.text}
                  </div>
                );
              })}
              <div ref={terminalBottomRef} />
            </div>

            {/* Quick helper command chips */}
            <div className="pt-2 flex items-center gap-1.5 overflow-x-auto text-[10px] text-zinc-400 border-t border-zinc-800/80">
              <span className="shrink-0 text-zinc-500 text-[10px]">Быстро:</span>
              {[
                { label: "git status", cmd: "git status" },
                { label: "git log", cmd: "git log" },
                { label: "git branch", cmd: "git branch" },
                { label: "checkout main", cmd: "git checkout main" },
              ].map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => handleQuickExecute(c.cmd)}
                  className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800 shrink-0 transition-colors font-mono"
                  title={`Выполнить ${c.cmd}`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Prompt Input Line */}
            <div className="mt-1.5 pt-1.5 flex items-center gap-2">
              <span className="text-emerald-400 font-bold shrink-0">
                student@lyceum:~/project (
                <span className="text-yellow-400">{getActiveBranchName(repoState) || "detached"}</span>
                )$
              </span>
              <input
                ref={inputRef}
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="git commit -m '...'"
                className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder:text-zinc-600 text-xs font-mono"
                autoFocus
              />
              <Button
                size="xs"
                onClick={() => executeCommand(commandInput)}
                disabled={!commandInput.trim()}
                className="h-6 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
              >
                Ввод
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icon helper
function Target(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
