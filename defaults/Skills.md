---
skills:
  - name: "code-review"
    description: "完整的程式碼審查流程 — 讀取變更、檢查規範、產出審查報告"
    allowedAgents:
      - "reviewer"
    workflow:
      - name: "讀取變更"
        description: "取得待審查的 diff 或 PR 內容"
        assignedTo: "reviewer"
        inputs:
          - "diff or PR link"
        outputs:
          - "變更內容摘要"
      - name: "靜態分析"
        description: "執行 linter / type-checker，確認無基本錯誤"
        assignedTo: "reviewer"
        inputs:
          - "變更程式碼"
        outputs:
          - "靜態分析報告"
      - name: "邏輯審查"
        description: "檢查商業邏輯、邊界條件、錯誤處理"
        assignedTo: "reviewer"
        inputs:
          - "程式碼 + 需求文件"
        outputs:
          - "邏輯審查意見"
      - name: "安全性檢查"
        description: "檢查是否有注入、洩漏、權限等安全問題"
        assignedTo: "security-guardian"
        inputs:
          - "程式碼"
        outputs:
          - "安全審查報告"
      - name: "產出審查報告"
        description: "彙整所有審查意見，產出最終報告"
        assignedTo: "reviewer"
        inputs:
          - "前述步驟產出"
        outputs:
          - "最終審查報告"
    preconditions:
      - "有可用的 diff 或 PR"
      - "專案已設定 linter"
    expectedOutput: "結構化的審查報告，包含通過/不通過項目與建議"
    tags:
      - "審查"
      - "品質"

  - name: "bug-fix"
    description: "標準的 bug 修復流程 — 重現、定位、修復、測試、合併"
    allowedAgents:
      - "developer"
      - "bug-hunter"
    workflow:
      - name: "重現問題"
        description: "根據 bug 報告重現問題，確認問題存在"
        assignedTo: "bug-hunter"
        inputs:
          - "bug 報告"
        outputs:
          - "重現步驟"
      - name: "撰寫失敗測試"
        description: "先寫一個測試來捕捉此 bug（紅燈）"
        assignedTo: "developer"
        inputs:
          - "重現步驟"
        outputs:
          - "失敗的測試案例"
      - name: "定位根因"
        description: "追蹤程式碼，找出 bug 的根本原因"
        assignedTo: "developer"
        inputs:
          - "失敗測試 + 原始碼"
        outputs:
          - "根因分析"
      - name: "實作修復"
        description: "在隔離分支中實作修復"
        assignedTo: "developer"
        inputs:
          - "根因分析"
        outputs:
          - "修復 commit"
      - name: "驗證修復"
        description: "執行測試，確認修復後測試通過（綠燈）"
        assignedTo: "developer"
        inputs:
          - "修復 commit + 測試"
        outputs:
          - "測試通過結果"
      - name: "程式碼審查"
        description: "提交修復給 reviewer 審查"
        assignedTo: "reviewer"
        inputs:
          - "修復 PR"
        outputs:
          - "審查意見"
    preconditions:
      - "有明確的 bug 報告"
      - "開發環境已就緒"
    expectedOutput: "已修復、已測試、已審查的 PR"
    tags:
      - "修復"
      - "品質"

  - name: "feature-development"
    description: "新功能開發的標準流程 — 設計、開發、測試、合併"
    allowedAgents:
      - "developer"
      - "architect"
    workflow:
      - name: "需求分析"
        description: "分析需求，產出功能規格"
        assignedTo: "architect"
        inputs:
          - "需求描述"
        outputs:
          - "功能規格文件"
      - name: "技術設計"
        description: "設計技術方案，包含資料結構、API、元件"
        assignedTo: "architect"
        inputs:
          - "功能規格"
        outputs:
          - "技術設計文件"
      - name: "撰寫測試"
        description: "先撰寫測試案例（紅燈）"
        assignedTo: "developer"
        inputs:
          - "技術設計"
        outputs:
          - "測試程式碼"
      - name: "實作功能"
        description: "在隔離分支中實作功能"
        assignedTo: "developer"
        inputs:
          - "技術設計 + 測試"
        outputs:
          - "功能實作"
      - name: "通過測試"
        description: "執行測試，確認綠燈"
        assignedTo: "developer"
        inputs:
          - "功能實作 + 測試"
        outputs:
          - "測試通過結果"
      - name: "合併與部署"
        description: "通過審查後合併到主分支"
        assignedTo: "developer"
        inputs:
          - "通過審查的 PR"
        outputs:
          - "已合併的程式碼"
    preconditions:
      - "需求已明確"
      - "開發環境已就緒"
    expectedOutput: "已開發、已測試、已合併的功能"
    tags:
      - "開發"
      - "功能"
---

# 技能庫（可復用工作流）

這些是可復用的工作流程，定義了「怎麼做事」。每個技能都有明確的步驟序列、
負責的 agent、前置條件和預期產出。

## 如何使用技能

1. 選擇適合的技能
2. 確認前置條件已滿足
3. 依照 workflow 逐步執行
4. 每個步驟交給正確的 agent
5. 完成後產出對照 expectedOutput
