// ============================================================
// Soul Engine — Public API
// ============================================================

// 核心引擎
export { SoulEngine, createEngine } from './engine.js';

// 型別
export type * from './types.js';

// 載入器
export { loadSoulConfig } from './loader/index.js';

// 五大原則
export {
  planFirst,
  roleBoundary,
  testFirst,
  stateReplace,
  safetyFirst,
  ALL_PRINCIPLES,
  runAllPrinciples,
} from './principles/index.js';

// Runtime 模組
export {
  checkRules,
  executeSkill,
  assignAgent,
  recordEmotion,
  fireHooks,
} from './runtime/index.js';
