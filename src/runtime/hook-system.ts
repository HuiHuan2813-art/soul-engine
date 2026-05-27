// ============================================================
// Hook System — 自動化觸發系統
// 監聽事件，當條件滿足時自動觸發對應 action。
// 對應 Hooks.md 的定義：條件 → 動作。
// ============================================================

import type { Hook, HookEvent, ExecutionError } from '../types.js';

export interface HookFireResult {
  fired: Hook[];
  errors: ExecutionError[];
}

/**
 * 根據事件類型，檢查並觸發所有匹配的 hooks。
 *
 * @param event 觸發的事件
 * @param context 當前情境描述（用於 condition 比對）
 * @param hooks 所有已定義的 hooks
 * @returns 觸發的 hooks 列表
 */
export function fireHooks(
  event: HookEvent,
  context: string,
  hooks: Hook[],
): HookFireResult {
  const contextLower = context.toLowerCase();
  const fired: Hook[] = [];
  const errors: ExecutionError[] = [];

  // 過濾出匹配此事件、且已啟用的 hooks
  const candidates = hooks.filter(
    h => h.enabled && h.trigger.event === event,
  );

  // 按 priority 排序：critical > high > medium > low
  const priorityOrder: Record<Hook['priority'], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  candidates.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  for (const hook of candidates) {
    // 若有 condition，檢查是否匹配
    if (hook.trigger.condition) {
      const condKeywords = hook.trigger.condition
        .toLowerCase()
        .split(/[,，、\s]+/)
        .filter(Boolean);

      const matches = condKeywords.length === 0 ||
        condKeywords.some(kw => contextLower.includes(kw));

      if (!matches) continue;
    }

    // 觸發 hook
    fired.push(hook);

    // block 類型的 action 會中止後續 hooks
    if (hook.action.type === 'block') {
      errors.push({
        source: 'hook',
        message: `Hook「${hook.name}」觸發了 block 動作：${JSON.stringify(hook.action.params)}`,
        severity: 'error',
      });
      break;
    }
  }

  return { fired, errors };
}
