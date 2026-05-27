// ============================================================
// Agent Manager — Agent 管理器
// 管理 agent 的指派、邊界檢查、情感/習慣記錄。
// 確保專業分工：專業 agent 做專業事，不越界。
// ============================================================

import type { Agent, ExecutionError } from '../types.js';

export interface AgentAssignment {
  agent: Agent;
  task: string;
}

export interface AssignmentResult {
  success: boolean;
  assignment?: AgentAssignment;
  errors: ExecutionError[];
}

/**
 * 根據任務內容，從可用 agent 中選擇最合適的一位。
 * 若任務內容觸及任何 agent 的 boundaries，排除該 agent。
 *
 * @param task 任務描述
 * @param agents 可用 agent 列表
 * @returns 指派的 agent 及結果
 */
export function assignAgent(task: string, agents: Agent[]): AssignmentResult {
  const taskLower = task.toLowerCase();
  const errors: ExecutionError[] = [];
  const eligible: Agent[] = [];

  for (const agent of agents) {
    // 檢查是否觸及此 agent 的邊界
    const boundaryViolations = agent.boundaries.filter(
      b => taskLower.includes(b.toLowerCase()),
    );

    if (boundaryViolations.length > 0) {
      errors.push({
        source: 'agent',
        message: `Agent「${agent.name}」無法執行此任務：觸及邊界「${boundaryViolations.join('、')}」`,
        severity: 'warning',
      });
      continue;
    }

    // 檢查任務是否在此 agent 的職責內
    const hasResponsibility = agent.responsibilities.some(
      r => taskLower.includes(r.toLowerCase()),
    );

    if (hasResponsibility) {
      eligible.push(agent);
    }
  }

  if (eligible.length === 0) {
    return {
      success: false,
      errors: [
        ...errors,
        {
          source: 'agent',
          message: `沒有 agent 可以處理此任務。請檢查 Agents.md 中 agent 的 responsibilities 設定。`,
          severity: 'error',
        },
      ],
    };
  }

  // 優先選擇職責匹配度最高的 agent
  const best = eligible.reduce((best, current) => {
    const bestMatches = best.responsibilities.filter(r => taskLower.includes(r.toLowerCase())).length;
    const currentMatches = current.responsibilities.filter(r => taskLower.includes(r.toLowerCase())).length;
    return currentMatches > bestMatches ? current : best;
  });

  return {
    success: true,
    assignment: { agent: best, task },
    errors,
  };
}

/**
 * 記錄 agent 的情緒反應。
 * @param agent agent 定義
 * @param situation 當前情境
 */
export function recordEmotion(agent: Agent, situation: string): string | null {
  const situationLower = situation.toLowerCase();
  for (const emotion of agent.emotions) {
    if (situationLower.includes(emotion.trigger.toLowerCase())) {
      return `[${agent.name} 情緒記錄] 觸發：${emotion.trigger} → 反應：${emotion.response}（影響：${emotion.impact}）`;
    }
  }
  return null;
}
