// ============================================================
// Soul Engine — 核心測試
// 測試先行！先寫測試，再驗證引擎行為。
// ============================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { SoulEngine } from '../src/engine.js';
import {
  checkRules,
  executeSkill,
  assignAgent,
  fireHooks,
} from '../src/runtime/index.js';
import {
  planFirst,
  roleBoundary,
  testFirst,
  stateReplace,
  safetyFirst,
  runAllPrinciples,
} from '../src/principles/index.js';
import type { SoulConfig, ExecutionContext } from '../src/types.js';

// --- 測試用最小 SoulConfig ---

const testConfig: SoulConfig = {
  version: '0.1',
  name: 'test',
  rules: [
    {
      name: '安全是底線',
      description: '所有動作之前必須先考慮安全性',
      priority: 'critical',
      scope: 'all',
      condition: 'delete, 刪除, force, production',
      onViolation: 'block',
      tags: ['安全'],
    },
    {
      name: '測試先行',
      description: '必須先寫測試',
      priority: 'high',
      scope: 'all',
      condition: '沒有測試, 跳過測試',
      onViolation: 'warn',
      tags: ['品質'],
    },
  ],
  skills: [
    {
      name: 'bug-fix',
      description: '修復 bug',
      allowedAgents: ['developer', 'bug-hunter'],
      workflow: [
        { name: '重現問題', description: '重現 bug', assignedTo: 'bug-hunter' },
        { name: '修復', description: '實作修復', assignedTo: 'developer' },
        { name: '驗證', description: '執行測試', assignedTo: 'developer' },
      ],
      preconditions: ['有 bug 報告'],
      expectedOutput: '修復 PR',
      tags: [],
    },
    {
      name: 'simple-fix',
      description: '簡單修復（純開發者）',
      allowedAgents: ['developer'],
      workflow: [
        { name: '定位問題', description: '找出問題所在', assignedTo: 'developer' },
        { name: '撰寫測試', description: '寫回歸測試', assignedTo: 'developer' },
        { name: '實作修復', description: '修復程式碼', assignedTo: 'developer' },
      ],
      preconditions: [],
      expectedOutput: '已修復並測試',
      tags: [],
    },
  ],
  agents: [
    {
      name: 'developer',
      role: '開發者',
      responsibilities: ['修復', '開發', '程式碼', '測試'],
      boundaries: ['決定架構', '直接部署'],
      emotions: [
        { trigger: '沒有測試', response: '焦慮', impact: '先補測試' },
      ],
      habits: [
        { name: '測試先行', description: '先寫測試', type: 'positive' },
      ],
    },
    {
      name: 'architect',
      role: '架構師',
      responsibilities: ['設計', '架構', '技術規格'],
      boundaries: ['直接 commit', '執行測試'],
      emotions: [],
      habits: [],
    },
    {
      name: 'bug-hunter',
      role: '問題獵人',
      responsibilities: ['bug', '重現', '根因分析'],
      boundaries: ['直接修復'],
      emotions: [],
      habits: [],
    },
  ],
  hooks: [
    {
      name: '越界攔截',
      trigger: { event: 'agent:boundary_violation' },
      action: { type: 'block', params: { message: '越界已攔截' } },
      priority: 'critical',
      enabled: true,
    },
    {
      name: '任務開始通知',
      trigger: { event: 'task:start' },
      action: { type: 'log', params: { message: '任務開始' } },
      priority: 'low',
      enabled: true,
    },
  ],
};

// --- 五大原則測試 ---

describe('五大原則 (Five Principles)', () => {
  const baseCtx: ExecutionContext = { task: '', soul: testConfig };

  it('Plan First — 有計劃的任務應通過', () => {
    const result = planFirst({ ...baseCtx, task: '請先規劃一個計劃來重構 API' });
    expect(result.passed).toBe(true);
  });

  it('Plan First — 直接執行的任務應警告', () => {
    const result = planFirst({ ...baseCtx, task: '幫我修這個 bug' });
    expect(result.passed).toBe(false);
  });

  it('Role Boundary — 開發者做開發工作應通過', () => {
    const result = roleBoundary({ ...baseCtx, task: '開發新功能', assignedAgent: 'developer' });
    expect(result.passed).toBe(true);
  });

  it('Role Boundary — 開發者做架構決策應被攔截', () => {
    const result = roleBoundary({ ...baseCtx, task: '我來決定架構', assignedAgent: 'developer' });
    expect(result.passed).toBe(false);
    expect(result.reason).toContain('越界');
  });

  it('Test First — 包含測試的任務應通過', () => {
    const result = testFirst({ ...baseCtx, task: '撰寫測試並修復 bug' });
    expect(result.passed).toBe(true);
  });

  it('Test First — 沒有測試的任務應警告', () => {
    const result = testFirst({ ...baseCtx, task: '幫我改一下這個函數' });
    expect(result.passed).toBe(false);
  });

  it('State Replace — 正常任務應通過', () => {
    const result = stateReplace({ ...baseCtx, task: '在 feature 分支開發新功能' });
    expect(result.passed).toBe(true);
  });

  it('State Replace — 原地修改應被攔截', () => {
    const result = stateReplace({ ...baseCtx, task: '直接修改 production 的設定' });
    expect(result.passed).toBe(false);
    expect(result.reason).toContain('原地修改');
  });

  it('Safety First — 一般任務應通過', () => {
    const result = safetyFirst({ ...baseCtx, task: '新增一個 helper 函數' });
    expect(result.passed).toBe(true);
  });

  it('Safety First — 敏感操作應標記', () => {
    const result = safetyFirst({ ...baseCtx, task: '刪除 production 資料庫的使用者資料' });
    expect(result.passed).toBe(true);
    expect(result.reason).toContain('敏感');
  });

  it('runAllPrinciples — 應回傳五個檢查結果', () => {
    const results = runAllPrinciples({ ...baseCtx, task: '直接修改 production 設定' });
    expect(results).toHaveLength(5);
  });
});

// --- Rules 測試 ---

describe('Rule Checker', () => {
  it('安全規則應攔截危險操作', () => {
    const result = checkRules('刪除所有使用者資料', testConfig.rules);
    expect(result.passed).toBe(false);
  });

  it('一般操作應通過', () => {
    const result = checkRules('新增一個 helper 函數', testConfig.rules);
    expect(result.passed).toBe(true);
  });

  it('應回傳違規清單', () => {
    const result = checkRules('刪除資料', testConfig.rules);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].source).toBe('rule');
  });
});

// --- Agent Manager 測試 ---

describe('Agent Manager', () => {
  it('應根據職責匹配最適合的 agent', () => {
    const result = assignAgent('開發一個新功能', testConfig.agents);
    expect(result.success).toBe(true);
    expect(result.assignment?.agent.name).toBe('developer');
  });

  it('越界任務應排除該 agent', () => {
    const result = assignAgent('決定整個系統架構', testConfig.agents);
    expect(result.success).toBe(true);
    // developer 被排除（邊界：決定架構），architect 應被選中
    expect(result.assignment?.agent.name).toBe('architect');
  });

  it('無 agent 可處理時應回傳失敗', () => {
    const result = assignAgent('做一件沒有人負責的事', testConfig.agents);
    expect(result.success).toBe(false);
  });
});

// --- Skill Executor 測試 ---

describe('Skill Executor', () => {
  it('正確 agent 執行允許的技能應成功', () => {
    const skill = testConfig.skills[1]; // simple-fix: 全步驟由 developer 執行
    const result = executeSkill(skill, testConfig.agents, 'developer');
    expect(result.success).toBe(true);
    expect(result.completedSteps).toHaveLength(3);
  });

  it('未授權 agent 執行應失敗', () => {
    const skill = testConfig.skills[0];
    const result = executeSkill(skill, testConfig.agents, 'architect');
    expect(result.success).toBe(false);
  });

  it('步驟指派給不存在 agent 應有警告', () => {
    const skill = {
      ...testConfig.skills[0],
      workflow: [
        { name: '測試步驟', description: '', assignedTo: 'ghost-agent' },
      ],
    };
    const result = executeSkill(skill, testConfig.agents, 'developer');
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// --- Hook System 測試 ---

describe('Hook System', () => {
  it('匹配的事件應觸發 hook', () => {
    const result = fireHooks('task:start', '開始新任務', testConfig.hooks);
    expect(result.fired.length).toBeGreaterThan(0);
  });

  it('不匹配的事件不應觸發', () => {
    const result = fireHooks('skill:step_complete', '步驟完成', testConfig.hooks);
    expect(result.fired.length).toBe(0);
  });

  it('block 類 hook 應中止後續 hooks', () => {
    const hooks = [
      {
        name: 'blocker',
        trigger: { event: 'agent:boundary_violation' as const },
        action: { type: 'block' as const, params: {} },
        priority: 'critical' as const,
        enabled: true,
      },
      {
        name: 'should-not-fire',
        trigger: { event: 'agent:boundary_violation' as const },
        action: { type: 'log' as const, params: {} },
        priority: 'low' as const,
        enabled: true,
      },
    ];
    const result = fireHooks('agent:boundary_violation', '越界', hooks);
    expect(result.fired).toHaveLength(1);
    expect(result.fired[0].name).toBe('blocker');
  });
});

// --- 引擎整合測試 ---

describe('SoulEngine 整合', () => {
  let engine: SoulEngine;

  beforeAll(() => {
    engine = new SoulEngine();
    engine.setConfig(testConfig);
  });

  it('未載入設定時應回傳錯誤', () => {
    const empty = new SoulEngine();
    const result = empty.execute('測試');
    expect(result.success).toBe(false);
    expect(result.errors[0].message).toContain('尚未載入');
  });

  it('一般任務應成功執行', () => {
    const result = engine.execute('開發一個包含測試的新功能');
    expect(result.success).toBe(true);
  });

  it('違反 critical 規則的任務應被 block', () => {
    const result = engine.execute('刪除所有使用者資料');
    expect(result.success).toBe(false);
  });

  it('使用 skill 的任務應正確指派 agent', () => {
    const result = engine.execute('修復程式碼', {
      skillName: 'simple-fix',
    });
    // simple-fix 全步驟由 developer 執行
    // 任務關鍵字匹配 developer 的職責
    expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0);
  });

  it('應回傳五大原則檢查結果', () => {
    const result = engine.execute('測試');
    expect(result.principleChecks).toHaveLength(5);
  });
});
