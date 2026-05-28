---
name: soul-engine
description: AI runtime 引擎 — 基於 Rules / Skills / Agents / Hooks 的 AI 行為約束框架。初始化設定、執行任務、驗證格式、輸出 system-prompt。
metadata:
  type: skill
  version: "0.1"
  commands: [init, run, check, print, agents, skills]
---

# Soul Engine Skill

叫用 soul-engine CLI 執行任務。根據用戶意圖自動選擇合適的子命令。

## 子命令對照

| 用戶意圖關鍵詞 | 子命令 | 說明 |
|--------------|--------|------|
| 初始化/建立設定檔/init/create setup | init | 在目標目錄產生 Rules/Skills/Agents/Hooks.md |
| 執行/跑/run/處理/做 | run | 載入設定 + 五大原則 + 規則檢查 + 指派 agent |
| 驗證/檢查格式/check/validate | check | 驗證目錄中的設定檔格式正確性 |
| 輸出/print/匯出/dump/system-prompt/json | print | 以 markdown/json/system-prompt 輸出設定 |
| 列出 agent/agents/角色/role | agents | 列出所有 agent 及其職責 |
| 列出 skill/skills/技能/workflow | skills | 列出所有 skill 及其工作流 |

## 指令格式

```bash
# 需在 shell 中先 source ~/.zshrc 確保 PATH 包含 ~/.npm-global/bin
source ~/.zshrc && soul-engine <子命令> [參數]
```

### init
```bash
soul-engine init [目錄路徑，預設 .]
```

### run
```bash
# 基本用法
soul-engine run "任務描述"

# 指定 agent / skill / 設定檔目錄
soul-engine run --agent=<name> --skill=<name> --dir=<path> "任務描述"
```

### check
```bash
soul-engine check [目錄路徑，預設 .]
```

### print
```bash
soul-engine print [目錄路徑] [格式: markdown|json|system-prompt]
```

### agents
```bash
soul-engine agents [目錄路徑，預設 .]
```

### skills
```bash
soul-engine skills [目錄路徑，預設 .]
```

## 行為指引

1. **偵測意圖** — 從用戶輸入中判斷應使用哪個子命令
2. **預設目錄** — 若用戶未指定目錄，使用當前工作目錄的 `.soul/`（如有）或當前目錄
3. **格式化輸出** — 將 CLI 輸出原文展示給用戶，必要時加上簡短說明
4. **錯誤處理** — 若指令執行失敗，將錯誤訊息回報給用戶並建議修正方式

## 內建 Agent 角色

| Agent | 角色 | 禁止事項 |
|-------|------|---------|
| architect | 系統架構師 | 直接 commit、跳過審查決定架構 |
| developer | 開發者 | 決定最終架構、跳過測試 |
| reviewer | 審查者 | 直接修改他人程式碼、跳過安全檢查 |
| security-guardian | 安全守護者 | 無限期封鎖開發、不給替代方案 |
| bug-hunter | 問題獵人 | 直接修復 bug（需交給 developer） |

## 五大原則

1. 先規劃再動手
2. 專業分工不越界
3. 測試先行
4. 新狀態替換舊狀態
5. 安全是底線，不是選項
