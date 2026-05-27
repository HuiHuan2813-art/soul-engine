// ============================================================
// Rule Checker — 規則檢查器
// 每個 action 執行前，逐一檢查所有 Rules。
// 若遇到 onViolation='block' 的規則違反，直接拒絕執行。
// ============================================================

import type { Rule, ExecutionError } from '../types.js';

export interface RuleCheckResult {
  passed: boolean;
  violations: ExecutionError[];
}

/**
 * 檢查給定的 action 是否違反任何規則。
 * @param actionText 要執行的動作描述
 * @param rules 所有規則列表
 * @returns 檢查結果，包含違規清單
 */
export function checkRules(actionText: string, rules: Rule[]): RuleCheckResult {
  const actionLower = actionText.toLowerCase();
  const violations: ExecutionError[] = [];

  for (const rule of rules) {
    // 將規則條件轉為關鍵字比對（簡易版；實務上可由 LLM 判斷）
    const conditionKeywords = rule.condition
      .toLowerCase()
      .split(/[,，、\s]+/)
      .filter(Boolean);

    const isRelevant = conditionKeywords.length === 0 ||
      conditionKeywords.some(kw => actionLower.includes(kw));

    if (isRelevant) {
      const severity = rule.onViolation === 'block' ? 'error' as const : 'warning' as const;
      violations.push({
        source: 'rule',
        message: `[${rule.priority}] ${rule.name}: ${rule.description}`,
        severity,
      });
    }
  }

  // 若有任何 block 級違規 → 不通過
  const hasBlocking = violations.some(v => v.severity === 'error');
  const passed = !hasBlocking;

  return { passed, violations };
}
