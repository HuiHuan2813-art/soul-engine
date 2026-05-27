// ============================================================
// Skill Executor — 技能執行器
// 依照 Skills.md 定義的工作流，逐步執行。
// 確保每個步驟由正確的 agent 執行，不越界。
// ============================================================

import type { Skill, SkillStep, Agent, ExecutionError } from '../types.js';

export interface SkillExecutionResult {
  success: boolean;
  completedSteps: string[];
  errors: ExecutionError[];
}

/**
 * 執行指定的技能工作流。
 * @param skill 要執行的技能定義
 * @param agents 可用 agent 列表
 * @param currentAgent 當前執行 agent 的名稱
 */
export function executeSkill(
  skill: Skill,
  agents: Agent[],
  currentAgent?: string,
): SkillExecutionResult {
  const completedSteps: string[] = [];
  const errors: ExecutionError[] = [];

  // 檢查 agent 權限
  if (skill.allowedAgents.length > 0 && currentAgent) {
    if (!skill.allowedAgents.includes(currentAgent)) {
      errors.push({
        source: 'skill',
        message: `Agent「${currentAgent}」不在技能「${skill.name}」的允許清單中。允許：${skill.allowedAgents.join('、')}`,
        severity: 'error',
      });
      return { success: false, completedSteps, errors };
    }
  }

  // 檢查前置條件
  for (const precondition of skill.preconditions) {
    // 前置條件由引擎傳入時一併驗證；此處為架構預留
    if (!precondition) continue;
  }

  // 逐步執行工作流
  for (const step of skill.workflow) {
    const stepResult = executeStep(step, agents, currentAgent);
    if (!stepResult.passed) {
      errors.push(...stepResult.errors);
      return { success: false, completedSteps, errors };
    }
    completedSteps.push(step.name);
  }

  return { success: true, completedSteps, errors };
}

function executeStep(
  step: SkillStep,
  agents: Agent[],
  currentAgent?: string,
): { passed: boolean; errors: ExecutionError[] } {
  const errors: ExecutionError[] = [];

  // 若步驟指定了 assignedTo，檢查當前 agent 是否匹配
  if (step.assignedTo && currentAgent && step.assignedTo !== currentAgent) {
    errors.push({
      source: 'skill',
      message: `步驟「${step.name}」只能由「${step.assignedTo}」執行，當前 agent 為「${currentAgent}」`,
      severity: 'error',
    });
  }

  // 檢查指派的 agent 是否存在
  if (step.assignedTo) {
    const agentExists = agents.some(a => a.name === step.assignedTo);
    if (!agentExists) {
      errors.push({
        source: 'skill',
        message: `步驟「${step.name}」指定的 agent「${step.assignedTo}」不存在。`,
        severity: 'warning',
      });
    }
  }

  return { passed: errors.length === 0, errors };
}
