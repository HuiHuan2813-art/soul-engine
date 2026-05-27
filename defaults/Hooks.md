---
hooks:
  # ===== 任務生命週期 =====

  - name: "任務開始前安全掃描"
    trigger:
      event: "task:start"
      condition: "安全, delete, 刪除, force, production"
    action:
      type: "enforce_rule"
      params:
        rule: "安全是底線"
        message: "⚠️ 此任務涉及敏感操作，請確認安全性後再繼續。"
    priority: critical
    enabled: true

  - name: "任務開始前檢查計劃"
    trigger:
      event: "task:start"
    action:
      type: "enforce_rule"
      params:
        rule: "先規劃再動手"
        message: "請確認已產出執行計劃。"
    priority: high
    enabled: true

  - name: "任務完成後更新記錄"
    trigger:
      event: "task:complete"
    action:
      type: "log"
      params:
        logLevel: "info"
        message: "任務完成，記錄執行歷程。"
    priority: low
    enabled: true

  # ===== Agent 相關 =====

  - name: "Agent 越界攔截"
    trigger:
      event: "agent:boundary_violation"
    action:
      type: "block"
      params:
        message: "❌ 此 agent 試圖越界執行不屬於其職責的工作。已攔截。"
    priority: critical
    enabled: true

  - name: "Agent 指派通知"
    trigger:
      event: "agent:assign"
    action:
      type: "notify_agent"
      params:
        message: "你已被指派執行此任務，請確認職責範圍。"
    priority: medium
    enabled: true

  # ===== 規則與安全 =====

  - name: "規則違反即時通知"
    trigger:
      event: "rule:violation"
    action:
      type: "notify_agent"
      params:
        message: "⚠️ 偵測到規則違反，請立即檢查。"
    priority: high
    enabled: true

  - name: "安全檢查失敗強制中止"
    trigger:
      event: "safety:check_fail"
    action:
      type: "block"
      params:
        message: "🛡️ 安全檢查未通過，任務已中止。請修正安全問題後重試。"
    priority: critical
    enabled: true

  # ===== 狀態變更 =====

  - name: "狀態變更前快照"
    trigger:
      event: "state:before_change"
    action:
      type: "log"
      params:
        logLevel: "info"
        message: "狀態即將變更，已建立變更前快照。"
    priority: medium
    enabled: true

  - name: "狀態變更後驗證"
    trigger:
      event: "state:after_change"
    action:
      type: "run_skill"
      params:
        skill: "code-review"
        message: "狀態已變更，請執行審查確認無誤。"
    priority: high
    enabled: true
---

# Hook 自動化觸發系統

Hook 定義了「什麼條件觸發什麼動作」，是 soul-engine 的自動化層。

## 事件類型

| 事件 | 說明 |
|------|------|
| task:start | 任務開始 |
| task:complete | 任務完成 |
| task:fail | 任務失敗 |
| agent:assign | agent 被指派 |
| agent:boundary_violation | agent 越界 |
| rule:violation | 規則違反 |
| skill:step_complete | 技能步驟完成 |
| safety:check_fail | 安全檢查失敗 |
| state:before_change | 狀態變更前 |
| state:after_change | 狀態變更後 |

## 動作類型

| 動作 | 說明 |
|------|------|
| run_skill | 執行指定的技能 |
| notify_agent | 通知 agent |
| enforce_rule | 強制執行規則 |
| log | 記錄日誌 |
| block | 阻止執行 |
