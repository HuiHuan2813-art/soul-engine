// ============================================================
// Soul Engine — 核心型別定義
// ============================================================

// --- Rules (憲法級全局約束) ---

/** 單條規則 */
export interface Rule {
  /** 規則名稱 */
  name: string;
  /** 規則說明 */
  description: string;
  /** 優先級：critical > high > medium > low */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** 適用範圍 */
  scope: RuleScope;
  /** 規則檢查的條件描述（人類可讀，供 AI 參照） */
  condition: string;
  /** 違反時的處理方式 */
  onViolation: 'block' | 'warn' | 'log';
  /** 額外的關聯標籤 */
  tags: string[];
}

export type RuleScope = 'all' | 'agent' | 'skill' | 'hook';

// --- Skills (法律條文級可復用工作流) ---

/** 技能工作流中的一個步驟 */
export interface SkillStep {
  /** 步驟名稱 */
  name: string;
  /** 步驟說明 */
  description: string;
  /** 此步驟只能由哪個 agent 執行（名稱對應 Agent.name） */
  assignedTo?: string;
  /** 步驟的輸入/輸出示意 */
  inputs?: string[];
  outputs?: string[];
}

/** 一個可復用的技能 */
export interface Skill {
  /** 技能名稱 */
  name: string;
  /** 技能說明 */
  description: string;
  /** 此技能限定哪些 agent 可執行（空陣列 = 不限） */
  allowedAgents: string[];
  /** 工作流步驟序列 */
  workflow: SkillStep[];
  /** 前置條件 */
  preconditions: string[];
  /** 預期產出 */
  expectedOutput: string;
  tags: string[];
}

// --- Agents (每個 agent 的個人檔案) ---

/** 單一 agent 定義 */
export interface Agent {
  /** agent 名稱 */
  name: string;
  /** agent 角色描述 */
  role: string;
  /** agent 的職責範圍 */
  responsibilities: string[];
  /** 不可越界的邊界（具體列舉禁止事項） */
  boundaries: string[];
  /** 情感記錄 — agent 在什麼情境下會觸發什麼情緒反應 */
  emotions: EmotionRecord[];
  /** 習慣記錄 — agent 的行為模式 */
  habits: HabitRecord[];
}

/** 情感記錄 */
export interface EmotionRecord {
  /** 觸發情境 */
  trigger: string;
  /** 情緒反應 */
  response: string;
  /** 此反應如何影響決策 */
  impact: string;
}

/** 習慣記錄 */
export interface HabitRecord {
  /** 習慣名稱 */
  name: string;
  /** 習慣描述 */
  description: string;
  /** 正向/負向 */
  type: 'positive' | 'negative' | 'neutral';
}

// --- Hooks (自動化觸發系統) ---

/** 自動化掛鉤 */
export interface Hook {
  /** 掛鉤名稱 */
  name: string;
  /** 觸發條件 */
  trigger: HookTrigger;
  /** 觸發後執行的動作 */
  action: HookAction;
  /** 優先級 */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** 是否啟用 */
  enabled: boolean;
}

export interface HookTrigger {
  /** 觸發事件類型 */
  event: HookEvent;
  /** 事件匹配條件 */
  condition?: string;
}

export type HookEvent =
  | 'task:start'
  | 'task:complete'
  | 'task:fail'
  | 'agent:assign'
  | 'agent:boundary_violation'
  | 'rule:violation'
  | 'skill:step_complete'
  | 'safety:check_fail'
  | 'state:before_change'
  | 'state:after_change';

export interface HookAction {
  /** 動作類型 */
  type: 'run_skill' | 'notify_agent' | 'enforce_rule' | 'log' | 'block';
  /** 動作參數 */
  params: Record<string, string>;
}

// --- Soul 設定頂層 — 彙整四個文件 ---

export interface SoulConfig {
  /** 設定版本 */
  version: string;
  /** 專案名稱 */
  name: string;
  /** 全域規則（來自 Rules.md） */
  rules: Rule[];
  /** 可復用技能（來自 Skills.md） */
  skills: Skill[];
  /** agent 定義（來自 Agents.md） */
  agents: Agent[];
  /** 自動化掛鉤（來自 Hooks.md） */
  hooks: Hook[];
}

// --- 引擎執行相關 ---

/** 五大原則的檢查結果 */
export interface PrincipleCheck {
  principle: PrincipleName;
  passed: boolean;
  reason?: string;
}

export type PrincipleName =
  | 'plan-first'
  | 'role-boundary'
  | 'test-first'
  | 'state-replace'
  | 'safety-first';

/** 引擎執行任務時的情境 */
export interface ExecutionContext {
  task: string;
  assignedAgent?: string;
  currentStep?: string;
  soul: SoulConfig;
}

/** 執行結果 */
export interface ExecutionResult {
  success: boolean;
  output?: string;
  errors: ExecutionError[];
  principleChecks: PrincipleCheck[];
}

export interface ExecutionError {
  source: 'rule' | 'principle' | 'agent' | 'skill' | 'hook';
  message: string;
  severity: 'error' | 'warning';
}
