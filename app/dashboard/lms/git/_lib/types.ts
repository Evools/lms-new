export interface GitCommit {
  id: string; // e.g. "c0", "c1", "c2"
  hash: string; // e.g. "f4a1c2b"
  message: string;
  parentIds: string[];
  author: string;
  timestamp: number;
  branchCreated?: string;
  isMerge?: boolean;
}

export interface GitBranch {
  name: string;
  commitId: string;
  color: string;
}

export interface GitHead {
  type: "branch" | "detached";
  target: string; // branch name (e.g. "main") or commitId (e.g. "c1")
}

export interface GitRepoState {
  commits: Record<string, GitCommit>;
  branches: Record<string, string>; // branchName -> commitId
  head: GitHead;
  stagingArea: string[];
  workingDirectory: string[];
  nextCommitNum: number;
}

export interface TerminalEntry {
  id: string;
  type: "input" | "output" | "error" | "success" | "info";
  text: string;
  timestamp: number;
}

export interface GitLesson {
  id: number;
  slug: string;
  level: "Базовый" | "Средний" | "Продвинутый";
  title: string;
  shortDesc: string;
  theory: {
    concept: string;
    explanation: string;
    analogy?: string;
    commandExample: string;
  };
  task: {
    instruction: string;
    hint: string;
    solutionCommand: string;
  };
  initialState: {
    branches: Record<string, string>;
    head: GitHead;
    commits: Array<{
      id: string;
      message: string;
      parentIds: string[];
      branchCreated?: string;
    }>;
  };
  validate: (state: GitRepoState, history: string[]) => boolean;
}

