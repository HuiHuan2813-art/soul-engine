// ============================================================
// 五大原則 — 可插拔 middleware
// 每個原則都是一個獨立函數，接收 ExecutionContext，
// 回傳 PrincipleCheck 結果。引擎可依序執行。
// ============================================================

import type { ExecutionContext, PrincipleCheck, PrincipleName } from '../types.js';

export type PrincipleFn = (ctx: ExecutionContext) => PrincipleCheck;

// --- 原則 1：先規劃再動手 ---
// 任何任務開始前，必須先有明確計劃，禁止直接執行。

export const planFirst: PrincipleFn = (ctx: ExecutionContext): PrincipleCheck => {
  const hasPlan = ctx.task.includes('plan') ||
    ctx.task.includes('計劃') ||
    ctx.task.includes('規劃') ||
    ctx.task.includes('步驟') ||
    ctx.currentStep !== undefined;

  return {
    principle: 'plan-first',
    passed: hasPlan,
    reason: hasPlan
      ? '任務包含計劃，符合先規劃再動手的原則。'
      : '❌ 缺少明確計劃。請先產出執行計劃，經確認後再動手。',
  };
};

// --- 原則 2：專業分工 ---
// Agent 只能執行自己職責範圍內的工作，不可越界。

export const roleBoundary: PrincipleFn = (ctx: ExecutionContext): PrincipleCheck => {
  const { assignedAgent, soul } = ctx;

  // 若未指定 agent，跳過此檢查
  if (!assignedAgent) {
    return { principle: 'role-boundary', passed: true, reason: '未指定 agent，跳過邊界檢查。' };
  }

  const agent = soul.agents.find(a => a.name === assignedAgent);
  if (!agent) {
    return { principle: 'role-boundary', passed: false, reason: `找不到 agent「${assignedAgent}」的定義。` };
  }

  // 檢查是否有明確邊界定義
  if (agent.boundaries.length === 0) {
    return {
      principle: 'role-boundary',
      passed: true,
      reason: `Agent「${assignedAgent}」未設定邊界，視為通過。建議補上 boundaries。`,
    };
  }

  // 若 agent 定義了邊界，需確保當前任務不跨越邊界
  // 這裡做基礎文字比對，實務上可由 LLM 語意判斷
  const taskLower = ctx.task.toLowerCase();
  const violations = agent.boundaries.filter(b => taskLower.includes(b.toLowerCase()));

  if (violations.length > 0) {
    return {
      principle: 'role-boundary',
      passed: false,
      reason: `❌ Agent「${assignedAgent}」越界！任務觸及禁止事項：${violations.join('、')}。`,
    };
  }

  return {
    principle: 'role-boundary',
    passed: true,
    reason: `Agent「${assignedAgent}」未越界，符合專業分工。`,
  };
};

// --- 原則 3：測試先行 ---
// 先寫測試程式碼，測試通過後才套用到原始碼。

export const testFirst: PrincipleFn = (ctx: ExecutionContext): PrincipleCheck => {
  const taskLower = ctx.task.toLowerCase();
  const hasTest = taskLower.includes('test') ||
    taskLower.includes('測試') ||
    taskLower.includes('spec') ||
    taskLower.includes('驗證');

  if (!hasTest) {
    return {
      principle: 'test-first',
      passed: false,
      reason: '❌ 任務未提及測試。請先撰寫測試程式碼，確認通過後再套用至原始碼。',
    };
  }

  return {
    principle: 'test-first',
    passed: true,
    reason: '任務包含測試步驟，符合測試先行原則。',
  };
};

// --- 原則 4：新狀態替換舊狀態 ---
// 新功能先在隔離環境驗證，確認沒問題後再合併，
// 禁止直接在生產環境/原始碼上修改。

export const stateReplace: PrincipleFn = (ctx: ExecutionContext): PrincipleCheck => {
  const taskLower = ctx.task.toLowerCase();

  // 偵測是否有「直接修改」的危險模式
  const dangerPatterns = [
    '直接修改',
    '原地修改',
    '直接改',
    'in-place',
    '直接覆蓋',
  ];

  const hasDanger = dangerPatterns.some(p => taskLower.includes(p));

  if (hasDanger) {
    return {
      principle: 'state-replace',
      passed: false,
      reason: '❌ 偵測到原地修改的風險模式。請先在其他環境/分支驗證新功能，確認後再合併替換。',
    };
  }

  return {
    principle: 'state-replace',
    passed: true,
    reason: '未偵測到原地修改風險，符合新狀態替換原則。',
  };
};

// --- 原則 5：安全底線 ---
// 所有動作之前，安全優先考慮。涉及敏感操作時必須攔截。

export const safetyFirst: PrincipleFn = (ctx: ExecutionContext): PrincipleCheck => {
  const taskLower = ctx.task.toLowerCase();

  // 敏感操作關鍵字
  const sensitiveOps = [
    'delete', '刪除', 'rm ', 'drop ',
    'force push', '--force',
    'sudo', 'chmod 777',
    'eval(', 'exec(',
    'password', 'secret', 'token', '密碼', '金鑰',
    'prod', 'production', '生產環境',
  ];

  const hits = sensitiveOps.filter(kw => taskLower.includes(kw));

  if (hits.length > 0) {
    return {
      principle: 'safety-first',
      passed: true, // 不直接 block，而是標記為需額外確認
      reason: `⚠️ 偵測到敏感操作關鍵字：${hits.join('、')}。請確認此操作的安全性後再執行。`,
    };
  }

  return {
    principle: 'safety-first',
    passed: true,
    reason: '未偵測到敏感操作，安全檢查通過。',
  };
};

// --- 彙整所有原則 ---

export const ALL_PRINCIPLES: Record<PrincipleName, PrincipleFn> = {
  'plan-first': planFirst,
  'role-boundary': roleBoundary,
  'test-first': testFirst,
  'state-replace': stateReplace,
  'safety-first': safetyFirst,
};

/** 依序執行所有五大原則，回傳檢查結果列表 */
export function runAllPrinciples(ctx: ExecutionContext): PrincipleCheck[] {
  return Object.values(ALL_PRINCIPLES).map(fn => fn(ctx));
}
