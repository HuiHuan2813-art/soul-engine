// ============================================================
// Markdown 設定檔解析器
// 使用 gray-matter 解析 YAML frontmatter + Markdown 內文
// ============================================================

import matter from 'gray-matter';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  Rule,
  Skill,
  Agent,
  Hook,
  SoulConfig,
} from '../types.js';

// --- 各檔案 frontmatter 的原始形狀 ---

interface RulesFrontmatter {
  version?: string;
  name?: string;
  rules?: Partial<Rule>[];
}

interface SkillsFrontmatter {
  skills?: Partial<Skill>[];
}

interface AgentsFrontmatter {
  agents?: Partial<Agent>[];
}

interface HooksFrontmatter {
  hooks?: Partial<Hook>[];
}

// --- 預設值填補 ---

function normalizeRule(raw: Partial<Rule>, index: number): Rule {
  return {
    name: raw.name ?? `rule-${index}`,
    description: raw.description ?? '',
    priority: raw.priority ?? 'medium',
    scope: raw.scope ?? 'all',
    condition: raw.condition ?? '',
    onViolation: raw.onViolation ?? 'warn',
    tags: raw.tags ?? [],
  };
}

function normalizeSkill(raw: Partial<Skill>, index: number): Skill {
  return {
    name: raw.name ?? `skill-${index}`,
    description: raw.description ?? '',
    allowedAgents: raw.allowedAgents ?? [],
    workflow: (raw.workflow ?? []).map((step, si) => ({
      name: step.name ?? `step-${si}`,
      description: step.description ?? '',
      assignedTo: step.assignedTo,
      inputs: step.inputs ?? [],
      outputs: step.outputs ?? [],
    })),
    preconditions: raw.preconditions ?? [],
    expectedOutput: raw.expectedOutput ?? '',
    tags: raw.tags ?? [],
  };
}

function normalizeAgent(raw: Partial<Agent>, index: number): Agent {
  return {
    name: raw.name ?? `agent-${index}`,
    role: raw.role ?? '',
    responsibilities: raw.responsibilities ?? [],
    boundaries: raw.boundaries ?? [],
    emotions: raw.emotions ?? [],
    habits: raw.habits ?? [],
  };
}

function normalizeHook(raw: Partial<Hook>, index: number): Hook {
  return {
    name: raw.name ?? `hook-${index}`,
    trigger: {
      event: raw.trigger?.event ?? 'task:start',
      condition: raw.trigger?.condition,
    },
    action: {
      type: raw.action?.type ?? 'log',
      params: raw.action?.params ?? {},
    },
    priority: raw.priority ?? 'medium',
    enabled: raw.enabled ?? true,
  };
}

// --- 單檔解析 ---

async function parseMarkdownFile<T>(filePath: string): Promise<{
  frontmatter: T;
  content: string;
}> {
  const raw = await readFile(filePath, 'utf-8');
  const parsed = matter(raw);
  return {
    frontmatter: parsed.data as T,
    content: parsed.content,
  };
}

// --- 主要載入函數 ---

export async function loadSoulConfig(configDir: string): Promise<SoulConfig> {
  const rulesPath = join(configDir, 'Rules.md');
  const skillsPath = join(configDir, 'Skills.md');
  const agentsPath = join(configDir, 'Agents.md');
  const hooksPath = join(configDir, 'Hooks.md');

  // 並行讀取四個檔案
  const [rulesFile, skillsFile, agentsFile, hooksFile] = await Promise.all([
    parseMarkdownFile<RulesFrontmatter>(rulesPath).catch(() => null),
    parseMarkdownFile<SkillsFrontmatter>(skillsPath).catch(() => null),
    parseMarkdownFile<AgentsFrontmatter>(agentsPath).catch(() => null),
    parseMarkdownFile<HooksFrontmatter>(hooksPath).catch(() => null),
  ]);

  const rules: Rule[] = (rulesFile?.frontmatter.rules ?? []).map(normalizeRule);
  const skills: Skill[] = (skillsFile?.frontmatter.skills ?? []).map(normalizeSkill);
  const agents: Agent[] = (agentsFile?.frontmatter.agents ?? []).map(normalizeAgent);
  const hooks: Hook[] = (hooksFile?.frontmatter.hooks ?? []).map(normalizeHook);

  return {
    version: rulesFile?.frontmatter.version ?? '0.1',
    name: rulesFile?.frontmatter.name ?? 'unnamed',
    rules,
    skills,
    agents,
    hooks,
  };
}
