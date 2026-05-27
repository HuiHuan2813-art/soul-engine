// ============================================================
// Soul Engine — 核心引擎
//
// 協調流程：
//   1. 載入 Soul 設定（四個 Markdown 檔案）
//   2. 執行五大原則檢查
//   3. Rules 過濾
//   4. Agent 指派（專業分工）
//   5. Skill 執行
//   6. Hooks 觸發
//   7. 回傳 ExecutionResult
// ============================================================

import { loadSoulConfig } from './loader/index.js';
import { runAllPrinciples } from './principles/index.js';
import { checkRules } from './runtime/rule-checker.js';
import { assignAgent, recordEmotion } from './runtime/agent-manager.js';
import { executeSkill } from './runtime/skill-executor.js';
import { fireHooks } from './runtime/hook-system.js';
import type {
  SoulConfig,
  ExecutionContext,
  ExecutionResult,
  ExecutionError,
  PrincipleCheck,
} from './types.js';

// --- Engine 類別 ---

export class SoulEngine {
  private soul: SoulConfig | null = null;

  /**
   * 載入 Soul 設定檔（從包含 Rules.md / Skills.md / Agents.md / Hooks.md 的目錄）
   */
  async load(configDir: string): Promise<SoulConfig> {
    this.soul = await loadSoulConfig(configDir);
    return this.soul;
  }

  /**
   * 直接注入設定（不需讀取檔案系統時使用）
   */
  setConfig(config: SoulConfig): void {
    this.soul = config;
  }

  /**
   * 取得當前載入的設定
   */
  getConfig(): SoulConfig | null {
    return this.soul;
  }

  /**
   * 執行一個任務。
   * 完整流程：五大原則 → Rules → Agent 指派 → Skill 執行 → Hooks
   */
  execute(task: string, options?: {
    assignedAgent?: string;
    skillName?: string;
  }): ExecutionResult {
    if (!this.soul) {
      return {
        success: false,
        errors: [{ source: 'rule', message: '尚未載入 Soul 設定。請先呼叫 load() 或 setConfig()。', severity: 'error' }],
        principleChecks: [],
      };
    }

    const ctx: ExecutionContext = {
      task,
      assignedAgent: options?.assignedAgent,
      soul: this.soul,
    };

    const allErrors: ExecutionError[] = [];

    // === Phase 1: 五大原則 ===
    const principleChecks = runAllPrinciples(ctx);

    // 記錄未通過的原則（只記錄，不直接 block）
    for (const check of principleChecks) {
      if (!check.passed) {
        allErrors.push({
          source: 'principle',
          message: check.reason ?? `${check.principle} 檢查未通過`,
          severity: 'warning',
        });
      }
    }

    // === Phase 2: Rules 檢查 ===
    const ruleResult = checkRules(task, this.soul.rules);
    for (const v of ruleResult.violations) {
      allErrors.push(v);
    }
    if (!ruleResult.passed) {
      return this.buildResult(false, principleChecks, allErrors);
    }

    // === Phase 3: Hooks — task:start ===
    const startHooks = fireHooks('task:start', task, this.soul.hooks);
    for (const e of startHooks.errors) {
      allErrors.push(e);
      if (e.severity === 'error') {
        return this.buildResult(false, principleChecks, allErrors);
      }
    }

    // === Phase 4: Agent 指派 ===
    let assignedAgentName = options?.assignedAgent;
    if (!assignedAgentName) {
      const assignment = assignAgent(task, this.soul.agents);
      if (assignment.errors.length > 0) {
        allErrors.push(...assignment.errors);
      }
      if (assignment.assignment) {
        assignedAgentName = assignment.assignment.agent.name;

        // 記錄情緒
        const emotionLog = recordEmotion(assignment.assignment.agent, task);
        if (emotionLog) {
          // 情緒記錄作為 output 的一部分
        }
      } else {
        return this.buildResult(false, principleChecks, allErrors);
      }
    }

    // === Phase 5: Skill 執行 ===
    if (options?.skillName) {
      const skill = this.soul.skills.find(s => s.name === options.skillName);
      if (!skill) {
        allErrors.push({
          source: 'skill',
          message: `找不到技能「${options.skillName}」`,
          severity: 'error',
        });
        return this.buildResult(false, principleChecks, allErrors);
      }

      const skillResult = executeSkill(skill, this.soul.agents, assignedAgentName);
      if (!skillResult.success) {
        allErrors.push(...skillResult.errors);
        return this.buildResult(false, principleChecks, allErrors);
      }
    }

    // === Phase 6: Hooks — task:complete ===
    const completeHooks = fireHooks('task:complete', task, this.soul.hooks);
    for (const e of completeHooks.errors) {
      allErrors.push(e);
    }

    // === 組裝結果 ===
    const hasErrors = allErrors.some(e => e.severity === 'error');
    return this.buildResult(!hasErrors, principleChecks, allErrors);
  }

  private buildResult(
    success: boolean,
    principleChecks: PrincipleCheck[],
    errors: ExecutionResult['errors'],
  ): ExecutionResult {
    return {
      success,
      output: success
        ? '任務執行完成，所有檢查通過。'
        : '任務執行受阻，請參閱 errors 清單。',
      errors,
      principleChecks,
    };
  }
}

// --- 便捷函數 ---

/**
 * 快速建立並載入引擎。
 */
export async function createEngine(configDir: string): Promise<SoulEngine> {
  const engine = new SoulEngine();
  await engine.load(configDir);
  return engine;
}
