#!/usr/bin/env node
// ============================================================
// Soul Engine CLI
//
// 指令：
//   soul-engine init [dir]        建立預設設定檔
//   soul-engine run <task>        執行任務
//   soul-engine check [dir]       驗證設定檔
//   soul-engine print [dir] [fmt] 輸出設定 (markdown|json|system-prompt)
//   soul-engine agents [dir]      列出 agent
//   soul-engine skills [dir]      列出 skill
// ============================================================

import { SoulEngine } from './engine.js';
import { loadSoulConfig } from './loader/index.js';
import { runAllPrinciples } from './principles/index.js';
import { assignAgent } from './runtime/agent-manager.js';
import { checkRules } from './runtime/rule-checker.js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SoulConfig } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    process.exit(0);
  }

  try {
    switch (command) {
      case 'init':
        await cmdInit(args[1] || '.');
        break;
      case 'run':
        await cmdRun(args.slice(1));
        break;
      case 'check':
        await cmdCheck(args[1] || '.');
        break;
      case 'print':
        await cmdPrint(args[1] || '.', args[2] || 'markdown');
        break;
      case 'agents':
        await cmdAgents(args[1] || '.');
        break;
      case 'skills':
        await cmdSkills(args[1] || '.');
        break;
      default:
        console.error(`❌ 未知指令：${command}`);
        console.error('使用 soul-engine help 查看可用指令。');
        process.exit(1);
    }
  } catch (err: any) {
    console.error(`❌ 錯誤：${err.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
╔══════════════════════════════════════════════════╗
║             Soul Engine v0.1.0                    ║
║  AI runtime — Rules/Skills/Agents/Hooks 驅動      ║
╚══════════════════════════════════════════════════╝

📋 可用指令：

  soul-engine init [dir]
      在指定目錄建立四個預設設定檔。

  soul-engine run <任務描述>
      載入設定檔，執行任務，顯示五大原則和規則檢查結果。
      選項：--agent=<name>  --skill=<name>

  soul-engine check [dir]
      驗證設定檔格式。

  soul-engine print [dir] [format]
      輸出設定。format: markdown | json | system-prompt
      system-prompt 格式可直接貼入 AI 的 system prompt。

  soul-engine agents [dir]
      列出所有 agent 及其職責、邊界。

  soul-engine skills [dir]
      列出所有 skill 及其工作流步驟。

🧠 五大原則：
  ① 先規劃再動手  ② 專業分工不越界  ③ 測試先行
  ④ 新狀態替換      ⑤ 安全是底線
`);
}

async function cmdInit(targetDir: string) {
  await mkdir(targetDir, { recursive: true });
  const defaultsDir = join(__dirname, '..', 'defaults');
  const files = ['Rules.md', 'Skills.md', 'Agents.md', 'Hooks.md'];

  for (const file of files) {
    const src = join(defaultsDir, file);
    const dest = join(targetDir, file);
    const content = await readFile(src, 'utf-8');
    await writeFile(dest, content, 'utf-8');
    console.log(`  ✅ 已建立 ${file}`);
  }

  console.log(`\n🎉 Soul Engine 設定檔已在「${targetDir}」初始化完成！`);
}

async function cmdRun(rawArgs: string[]) {
  let agentName: string | undefined;
  let skillName: string | undefined;
  let configDir = '.';
  const taskParts: string[] = [];

  for (const arg of rawArgs) {
    if (arg.startsWith('--agent=')) {
      agentName = arg.slice(8);
    } else if (arg.startsWith('--skill=')) {
      skillName = arg.slice(8);
    } else if (arg.startsWith('--dir=')) {
      configDir = arg.slice(6);
    } else {
      taskParts.push(arg);
    }
  }

  const task = taskParts.join(' ');
  if (!task) {
    console.error('❌ 請提供任務描述。');
    console.error('範例：soul-engine run --dir=/tmp/soul-test "修復登入 bug"');
    process.exit(1);
  }

  console.log(`\n🔍 Soul Engine 正在處理：「${task}」\n`);

  const engine = new SoulEngine();
  await engine.load(configDir);
  const config = engine.getConfig()!;

  console.log(`📁 已載入：${config.rules.length} 規則, ${config.skills.length} 技能, ${config.agents.length} agent, ${config.hooks.length} hook\n`);

  // Phase 1: 五大原則
  console.log('━'.repeat(50));
  console.log('Phase 1: 五大原則檢查');
  console.log('━'.repeat(50));
  const checks = runAllPrinciples({ task, assignedAgent: agentName, soul: config });
  for (const check of checks) {
    console.log(`  ${check.passed ? '✅' : '⚠️'} ${check.principle}: ${check.reason}`);
  }

  // Phase 2: Rules
  console.log('\n' + '━'.repeat(50));
  console.log('Phase 2: Rules 過濾');
  console.log('━'.repeat(50));
  const ruleResult = checkRules(task, config.rules);
  if (ruleResult.violations.length === 0) {
    console.log('  ✅ 所有規則通過');
  } else {
    for (const v of ruleResult.violations) {
      console.log(`  ${v.severity === 'error' ? '🛑' : '⚠️'} ${v.message}`);
    }
  }

  // Phase 3: Agent
  console.log('\n' + '━'.repeat(50));
  console.log('Phase 3: Agent 指派');
  console.log('━'.repeat(50));
  if (!agentName) {
    const assignment = assignAgent(task, config.agents);
    if (assignment.assignment) {
      agentName = assignment.assignment.agent.name;
      console.log(`  🤖 自動指派：${agentName}（${assignment.assignment.agent.role}）`);
    } else {
      console.log('  ⚠️ 無法自動指派 agent。');
    }
  } else {
    console.log(`  🤖 手動指派：${agentName}`);
  }

  // Phase 4: Execute
  console.log('\n' + '━'.repeat(50));
  console.log('Phase 4: 執行結果');
  console.log('━'.repeat(50));
  const result = engine.execute(task, { assignedAgent: agentName, skillName });
  if (result.success) {
    console.log('  ✅ 任務執行成功！');
  } else {
    console.log('  ❌ 任務執行受阻：');
    for (const err of result.errors) {
      console.log(`    [${err.severity}] ${err.message}`);
    }
  }
  console.log('');
}

async function cmdCheck(configDir: string) {
  console.log(`\n🔍 驗證「${configDir}」的設定檔...\n`);
  const engine = new SoulEngine();
  const config = await engine.load(configDir);
  console.log(`  ✅ Rules:   ${config.rules.length} 條規則`);
  console.log(`  ✅ Skills:  ${config.skills.length} 個技能`);
  console.log(`  ✅ Agents:  ${config.agents.length} 個 agent`);
  console.log(`  ✅ Hooks:   ${config.hooks.length} 個 hook`);
  console.log('\n🎉 設定檔格式正確！');
}

async function cmdPrint(configDir: string, format: string) {
  const config = await loadSoulConfig(configDir);

  if (format === 'json') {
    console.log(JSON.stringify(config, null, 2));
  } else if (format === 'system-prompt') {
    printAsSystemPrompt(config);
  } else {
    // markdown: 直接 cat 原始檔案
    const files = ['Rules.md', 'Skills.md', 'Agents.md', 'Hooks.md'];
    for (const file of files) {
      const p = join(configDir, file);
      const content = await readFile(p, 'utf-8').catch(() => '(未找到)');
      console.log(`\n# ===== ${file} =====\n`);
      console.log(content);
    }
  }
}

function printAsSystemPrompt(config: SoulConfig) {
  const lines: string[] = [];

  lines.push('# 你的行為規則（Soul Engine）\n');
  lines.push('以下規則定義你的行為約束、工作流程、角色分工。你必須遵守。\n');

  // Rules
  lines.push('## 全域規則\n');
  for (const r of config.rules) {
    lines.push(`- **${r.name}** [${r.priority}]：${r.description}`);
  }

  // Skills
  lines.push('\n## 可用技能\n');
  for (const s of config.skills) {
    lines.push(`### ${s.name}`);
    lines.push(`${s.description}\n步驟：`);
    s.workflow.forEach((step, i) => {
      const assignee = step.assignedTo ? `（由 ${step.assignedTo} 執行）` : '';
      lines.push(`  ${i + 1}. ${step.name} ${assignee}`);
    });
    lines.push('');
  }

  // Agents
  lines.push('## Agent 角色\n');
  for (const a of config.agents) {
    lines.push(`### ${a.name} — ${a.role}`);
    lines.push(`職責：${a.responsibilities.join('、')}`);
    lines.push(`禁止：${a.boundaries.join('、')}`);
    lines.push('');
  }

  // Hooks
  lines.push('## 自動化觸發\n');
  for (const h of config.hooks) {
    if (!h.enabled) continue;
    lines.push(`- 當 **${h.trigger.event}** → ${h.action.type}：${h.action.params?.message || ''}`);
  }

  console.log(lines.join('\n'));
}

async function cmdAgents(configDir: string) {
  const config = await loadSoulConfig(configDir);
  console.log(`\n🤖 ${config.agents.length} 個 agent：\n`);
  for (const a of config.agents) {
    console.log(`  ${a.name}`);
    console.log(`    角色：${a.role}`);
    console.log(`    職責：${a.responsibilities.join('、')}`);
    console.log(`    禁止：${a.boundaries.join('、')}`);
    console.log('');
  }
}

async function cmdSkills(configDir: string) {
  const config = await loadSoulConfig(configDir);
  console.log(`\n📋 ${config.skills.length} 個技能：\n`);
  for (const s of config.skills) {
    console.log(`  ${s.name}`);
    console.log(`    說明：${s.description}`);
    console.log(`    允許 agent：${s.allowedAgents.join('、') || '不限'}`);
    console.log(`    步驟數：${s.workflow.length}`);
    console.log(`    預期產出：${s.expectedOutput}`);
    console.log('');
  }
}

main();
