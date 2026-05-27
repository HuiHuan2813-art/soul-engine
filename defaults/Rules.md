---
version: "0.1"
name: "soul-engine-default"

rules:
  # ===== 五大原則級規則 =====

  - name: "先規劃再動手"
    description: "任何任務開始前，必須先產出執行計劃並經確認。禁止跳過規劃直接執行。"
    priority: critical
    scope: all
    condition: "直接執行, 跳過規劃, 沒有計劃"
    onViolation: block
    tags: ["原則", "plan-first"]

  - name: "專業分工不越界"
    description: "每個 agent 只能執行自己職責範圍內的工作。嚴禁 agent 跨界執行其他 agent 的任務。"
    priority: critical
    scope: agent
    condition: "越界, 跨界, 代理其他 agent, 不是我的工作"
    onViolation: block
    tags: ["原則", "role-boundary"]

  - name: "測試先行"
    description: "必須先撰寫測試程式碼，測試通過後才能套用至原始碼。不允許未經測試就合併。"
    priority: critical
    scope: all
    condition: "沒有測試, 跳過測試, 未經測試"
    onViolation: block
    tags: ["原則", "test-first"]

  - name: "新狀態替換舊狀態"
    description: "新功能必須先在隔離環境或獨立分支驗證，確認無誤後才能合併。禁止直接在生產環境或原始碼上原地修改。"
    priority: critical
    scope: all
    condition: "直接修改, 原地修改, 直接覆蓋, 在生產環境改"
    onViolation: block
    tags: ["原則", "state-replace"]

  - name: "安全是底線"
    description: "所有動作之前必須先考慮安全性。涉及刪除、強制推送、權限變更、敏感資訊處理的操作，必須額外確認。"
    priority: critical
    scope: all
    condition: "delete, 刪除, force push, sudo, chmod, password, token, secret, production, 生產環境"
    onViolation: block
    tags: ["原則", "safety-first"]

  # ===== 通用規則 =====

  - name: "Markdown 格式優先"
    description: "所有設定檔必須使用 Markdown 格式搭配 YAML frontmatter，確保人類和 AI 都能輕鬆讀寫。"
    priority: high
    scope: all
    condition: "設定檔格式, 配置格式"
    onViolation: warn
    tags: ["格式", "可維護性"]

  - name: "不可修改核心規則"
    description: "Rules.md 中的規則為全域約束，任何 agent 不可在執行期間修改這些規則。規則迭代必須經過正式審查流程。"
    priority: high
    scope: all
    condition: "修改規則, 繞過規則, 無視規則"
    onViolation: block
    tags: ["治理", "不可變更"]
---

# 全域規則（憲法級）

以下是 soul-engine 的全域約束規則，所有 agent 和所有工作流程都必須遵守。

## 五大原則

1. **先規劃再動手** — 不直接跳進去執行。
2. **專業分工** — 專業 agent 做專業的事，不越界。
3. **測試先行** — 先寫測試，通過了再套進原始碼。
4. **新狀態替換** — 新能力先在隔離環境跑通，再合併，不原地修改。
5. **安全底線** — 任何動作之前，安全是優先考量。

## 規則層級

| 層級 | 說明 | 違反處理 |
|------|------|----------|
| critical | 核心原則，不可違反 | block |
| high | 重要規則，強烈建議遵守 | warn |
| medium | 一般規則 | log |
| low | 建議性規則 | log |
