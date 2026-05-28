# Soul Engine

AI runtime 引擎 — 基於 Rules / Skills / Agents / Hooks 四個 Markdown 設定檔的 AI 行為約束框架。

## 專案結構

```
soul-engine/
├── defaults/          # 內建預設設定檔（init 指令的模板）
│   ├── Rules.md       #   全域規則（憲法級）
│   ├── Skills.md      #   可復用工作流（code-review / bug-fix / feature-dev）
│   ├── Agents.md      #   Agent 角色定義（角色/職責/邊界/情緒/習慣）
│   └── Hooks.md       #   事件觸發自動化
├── src/
│   ├── cli.ts         # CLI 入口（init/run/check/print/agents/skills）
│   ├── engine.ts      # 核心引擎（協調五大原則→規則→Agent→Skill→Hook）
│   ├── index.ts       # 公開 API
│   ├── types.ts       # 型別定義
│   ├── loader/        # Markdown + YAML frontmatter 設定檔載入器
│   ├── principles/    # 五大原則檢查器
│   └── runtime/       # 規則檢查 / Agent 管理 / Skill 執行 / Hook 系統
├── tests/             # Vitest 測試
├── .claude/skills/    # Claude Code 自定義 skill
├── defaults/          # init 指令產生的預設設定檔
└── dist/              # tsc 編譯輸出
```

## 開發指令

```bash
npm install          # 安裝依賴
npm run build        # tsc 編譯到 dist/
npm test             # vitest 執行測試
npm run dev          # tsc --watch 監聽模式
npm start            # node dist/index.js
```

## 全域安裝

```bash
npm install -g       # 全域安裝 soul-engine CLI
soul-engine --help   # 確認可用
```

## CLI 用法

| 指令 | 說明 |
|------|------|
| `soul-engine init [dir]` | 產生 Rules/Skills/Agents/Hooks.md |
| `soul-engine run <task>` | 執行任務（含五大原則+規則檢查+agent 指派） |
| `soul-engine check [dir]` | 驗證設定檔格式 |
| `soul-engine print [dir] [fmt]` | 輸出設定（markdown/json/system-prompt） |
| `soul-engine agents [dir]` | 列出所有 agent |
| `soul-engine skills [dir]` | 列出所有 skill |

## 技術棧

- TypeScript 5.7 + Node.js (ESM)
- 依賴：gray-matter (Markdown frontmatter 解析)、zod (schema 驗證)
- 測試：Vitest 2.x
- 無外部 API 依賴，純本地執行

## 程式庫用法

```typescript
import { SoulEngine } from 'soul-engine';

const engine = new SoulEngine();
await engine.load('./my-soul-config');
const result = engine.execute('你的任務描述');
```

## Claude Code 整合

專案內含 `.claude/skills/soul-engine.md`，使用者在 Claude Code 中可直接叫用 `/soul-engine` 指令來操作引擎。
