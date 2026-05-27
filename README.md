# Soul Engine

> AI runtime 引擎 — 讓 AI 做事更靠譜、更可預測。

Soul Engine 是一個基於 **Rules / Skills / Agents / Hooks** 四個 Markdown 設定檔的 AI 行為框架。它不是另一個 LLM wrapper，而是一個**約束層** — 在 AI 執行任何動作之前，先過規則、原則、邊界、安全檢查。

---

## 核心概念

```
┌─────────────────────────────────────┐
│             Soul Engine              │
│                                      │
│   ┌─────────┐  ┌─────────┐          │
│   │ Rules   │  │ Skills  │          │
│   │ (憲法)  │  │ (法律)  │          │
│   └────┬────┘  └────┬────┘          │
│        │            │                │
│   ┌────┴────┐  ┌────┴────┐          │
│   │ Agents  │  │ Hooks   │          │
│   │ (個人)  │  │ (觸發)  │          │
│   └─────────┘  └─────────┘          │
│                                      │
│   五大原則：                          │
│   ① 先規劃  ② 專業分工  ③ 測試先行    │
│   ④ 新狀態替換  ⑤ 安全底線            │
└─────────────────────────────────────┘
```

### 四個文件

| 文件 | 比喻 | 內容 |
|------|------|------|
| **Rules.md** | 憲法 | 全局約束，所有 agent 必須遵守的鐵律 |
| **Skills.md** | 法律條文 | 可復用的工作流，定義「怎麼做事」 |
| **Agents.md** | 個人檔案 | 每個 agent 的角色、職責、邊界、情緒、習慣 |
| **Hooks.md** | 自動化觸發 | 什麼事件觸發什麼動作 |

### 五大原則

1. **先規劃再動手** — 不直接跳進去執行
2. **專業分工** — 專業 agent 做專業的事，不越界
3. **測試先行** — 先寫測試，通過了再套進原始碼
4. **新狀態替換舊狀態** — 新能力先在隔離環境跑通，再合併，不原地修改
5. **安全是底線，不是選項** — 任何動作之前安全優先

---

## 安裝

```bash
npm install -g soul-engine
```

或本地安裝：

```bash
npm install soul-engine
```

## CLI 使用

安裝後，在終端機可以使用 `soul-engine` 指令：

```bash
# 初始化設定檔（在目前目錄建立 Rules.md / Skills.md / Agents.md / Hooks.md）
soul-engine init

# 初始化到指定目錄
soul-engine init ./my-project

# 驗證設定檔格式
soul-engine check

# 查看所有 agent
soul-engine agents

# 查看所有 skill
soul-engine skills

# 執行任務（自動過五大原則、規則、指派 agent）
soul-engine run "修復登入頁面的 CSRF 漏洞"

# 指定 agent 和 skill
soul-engine run --agent=developer --skill=bug-fix "修復一個 XSS 漏洞"

# 指定設定檔目錄
soul-engine run --dir=./my-project "開發新功能"

# 輸出 system-prompt 格式（可直接貼入 AI 的 system prompt）
soul-engine print . system-prompt

# 輸出 JSON 格式
soul-engine print . json
```

## 程式庫使用

### 1. 建立你的 Soul 設定檔

在專案目錄下建立四個 Markdown 檔案：

```
my-project/
├── Rules.md      # 全域規則
├── Skills.md     # 可復用工作流
├── Agents.md     # Agent 定義
└── Hooks.md      # 自動化觸發
```

每個檔案使用 **YAML frontmatter** 定義結構化資料，Markdown 內文可以自由書寫（方便 AI 閱讀）。

### 2. 載入並執行

```typescript
import { SoulEngine } from 'soul-engine';

const engine = new SoulEngine();

// 載入設定
await engine.load('./my-project');

// 執行任務
const result = engine.execute('修復登入頁面的 CSRF 漏洞');

if (result.success) {
  console.log('✅', result.output);
} else {
  console.log('❌', result.errors);
}
```

### 3. 檢查五大原則

```typescript
import { runAllPrinciples } from 'soul-engine';

const checks = runAllPrinciples({
  task: '直接修改 production 設定',
  soul: config,
});

for (const check of checks) {
  if (!check.passed) {
    console.warn(`⚠️ ${check.principle}: ${check.reason}`);
  }
}
```

---

## 引擎執行流程

當你呼叫 `engine.execute(task)` 時，引擎依序執行：

```
使用者任務
    │
    ▼
Phase 1: 五大原則檢查  ─── 警告不合規的行為
    │
    ▼
Phase 2: Rules 過濾     ─── 違反 critical 規則 → 直接 block
    │
    ▼
Phase 3: Hook (task:start) ─ 觸發任務開始的自動化動作
    │
    ▼
Phase 4: Agent 指派     ─── 根據職責匹配最適合的 agent
    │
    ▼
Phase 5: Skill 執行     ─── 按工作流逐步執行
    │
    ▼
Phase 6: Hook (task:complete) ─ 觸發任務完成的自動化動作
    │
    ▼
ExecutionResult
```

---

## 預設 Agent 角色

| Agent | 角色 | 不可越界事項 |
|-------|------|-------------|
| architect | 系統架構師 | 直接 commit、跳過審查決定架構 |
| developer | 開發者 | 決定最終架構、跳過測試 |
| reviewer | 審查者 | 直接修改他人程式碼、跳過安全檢查 |
| security-guardian | 安全守護者 | 無限期封鎖開發、不給替代方案 |
| bug-hunter | 問題獵人 | 直接修復 bug（需交給 developer） |

---

## API 參考

### `SoulEngine`

```typescript
class SoulEngine {
  load(configDir: string): Promise<SoulConfig>;
  setConfig(config: SoulConfig): void;
  getConfig(): SoulConfig | null;
  execute(task: string, options?: {
    assignedAgent?: string;
    skillName?: string;
  }): ExecutionResult;
}
```

### 獨立模組

```typescript
// 載入器
import { loadSoulConfig } from 'soul-engine';

// 五大原則
import { planFirst, roleBoundary, testFirst, stateReplace, safetyFirst } from 'soul-engine';

// Runtime
import { checkRules, executeSkill, assignAgent, fireHooks } from 'soul-engine';

// 型別
import type { Rule, Skill, Agent, Hook, SoulConfig } from 'soul-engine';
```

---

## 設計哲學

- **Markdown 優先** — 設定檔是人類可讀、AI 可解析的 Markdown，方便持續迭代升級
- **約束而非控制** — Soul Engine 提供護欄，不代替 AI 做決策
- **可插拔** — 每個模組（原則、規則、技能、掛鉤）都可以獨立使用或替換
- **測試先行** — 這個專案本身也遵循五大原則

---

## 授權

MIT
