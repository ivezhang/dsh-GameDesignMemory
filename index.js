import { randomBytes } from 'node:crypto'
import { isIP } from 'node:net'
import { mkdir, readFile, writeFile, rename, copyFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'

export const name = 'design-memory'

export const inject = ['tools']

const ROUTE_PATH = '/design-memory'
const STORE_VERSION = 5
const MAX_BODY_BYTES = 2 * 1024 * 1024

const ENTRY_TYPES = [
  'decision',
  'rule',
  'assumption',
  'question',
  'proposal',
  'reference',
  'metric',
  'retro',
  'process',
  'habit',
  'convention',
  'context',
  'task'
]

const TYPE_LABEL = {
  decision: '设计决策',
  rule: '设计规则',
  assumption: '设计假设',
  question: '设计问题',
  proposal: '设计方案',
  reference: '参考案例',
  metric: '数值数据',
  retro: '复盘结论',
  process: '流程约定',
  habit: '用户习惯',
  convention: '通用约定',
  context: '项目背景',
  task: '临时上下文'
}

const TYPE_HINT = {
  decision: '经过讨论并确认的设计结论',
  rule: '当前生效的玩法、数值或系统规则',
  assumption: '尚未验证的判断和推测',
  question: '需要解决的设计问题或体验问题',
  proposal: '尚待选择或实施方案',
  reference: '竞品、行业案例与设计灵感',
  metric: '具体参数、数值配置、计算结果',
  retro: '测试、玩家反馈、运营结果与经验',
  process: '团队约定、交付流程与协作规范',
  habit: '长期稳定的工作方式与表达偏好',
  convention: '需要长期遵守的命名、术语与输出标准',
  context: '项目目标、背景、约束等不变的事实',
  task: '有期限的临时事项与阶段进度'
}

const MEMORY_SCOPES = ['global', 'project']

const SCOPE_LABEL = { global: '全局', project: '项目' }

const PROTECTION_LEVELS = ['normal', 'confirmed', 'protected']

const PROTECTION_LABEL = {
  normal: '普通记忆',
  confirmed: '已确认',
  protected: '固有约定'
}

const PROTECTION_HINT = {
  normal: '允许根据新证据补充和修订',
  confirmed: '修改会保留版本与依据，可回看',
  protected: '默认锁定，只有你明确要求才能改动'
}

const CHANGE_TYPES = ['create', 'refine', 'augment', 'correct', 'conflict', 'merge', 'protect', 'status', 'restore']

const CHANGE_LABEL = {
  create: '新建',
  refine: '细化',
  augment: '补充',
  correct: '更正',
  conflict: '冲突待判',
  merge: '合并',
  protect: '保护级别变更',
  status: '状态变更',
  restore: '回滚版本'
}

const PROPOSAL_STATUSES = ['pending', 'accepted', 'rejected', 'superseded']

const PROPOSAL_STATUS_LABEL = {
  pending: '待确认',
  accepted: '已接受',
  rejected: '已拒绝',
  superseded: '已失效'
}

const EVIDENCE_TYPES = ['statement', 'confirmation', 'behavior', 'inference', 'temporary']

const EVIDENCE_LABEL = {
  statement: '用户陈述',
  confirmation: '用户确认',
  behavior: '多次行为',
  inference: 'AI 推断',
  temporary: '临时要求'
}

const RECALL_OUTCOMES = ['served', 'ignored', 'conflict']


const DOMAINS = [
  'combat',
  'growth',
  'economy',
  'level',
  'event',
  'uiux',
  'monetization',
  'social',
  'operation',
  'tech'
]

const DOMAIN_LABEL = {
  combat: '战斗系统',
  growth: '成长系统',
  economy: '经济系统',
  level: '关卡设计',
  event: '活动设计',
  uiux: 'UI/UX',
  monetization: '商业化',
  social: '社交系统',
  operation: '运营',
  tech: '技术约束'
}

const STATUSES = ['draft', 'pending', 'review', 'active', 'deprecated', 'archived']

const STATUS_LABEL = {
  draft: '草稿',
  pending: '待确认',
  review: '待复核',
  active: '已生效',
  deprecated: '已废弃',
  archived: '已归档'
}

const STATUS_HINT = {
  draft: '还没整理完，先放着',
  pending: '等确认，还没生效',
  review: 'AI 觉得可能需要更新，等你复核',
  active: '已经生效，可以作为依据',
  deprecated: '被替代或不再适用',
  archived: '收起来，不参与日常检索'
}

const RELATION_TYPES = [
  'belongs_to',
  'depends_on',
  'affects',
  'derived_from',
  'references',
  'conflicts_with',
  'supersedes',
  'refines'
]

const RELATION_LABEL = {
  belongs_to: '归属于',
  depends_on: '依赖于',
  affects: '影响',
  derived_from: '来源于',
  references: '参考',
  conflicts_with: '冲突',
  supersedes: '替代',
  refines: '细化'
}

const RELATION_HINT = {
  belongs_to: '这条记忆属于另一条所描述的整体',
  depends_on: '这条记忆成立需要另一条先成立',
  affects: '改动这条会牵动另一条',
  derived_from: '这条结论是从另一条推出来的',
  references: '引用别人的做法或案例',
  conflicts_with: '和另一条互相矛盾，需要裁决',
  supersedes: '这条取代了旧的那条',
  refines: '这条是另一条的更细一层'
}

const RELATION_STATUS = ['suggested', 'confirmed', 'rejected']

const RELATION_STATUS_LABEL = {
  suggested: 'AI 建议',
  confirmed: '已确认',
  rejected: '已拒绝'
}

const SOURCE_KINDS = ['manual', 'conversation', 'import', 'ai']

const SOURCE_LABEL = {
  manual: '手动输入',
  conversation: '对话提取',
  import: '文件导入',
  ai: 'AI 整理'
}

const COLLECTION_SOURCES = ['manual', 'ai']

const COLLECTION_STATUS = ['suggested', 'confirmed']

const COLLECTION_COLORS = ['violet', 'blue', 'teal', 'amber', 'rose', 'lime']

const LEGACY_CATEGORY_TYPE = {
  system: 'rule',
  numbers: 'metric',
  workflow: 'process',
  other: 'reference'
}

const LEGACY_STATUS = {
  draft: 'draft',
  confirmed: 'active',
  deprecated: 'deprecated'
}

const LIMITS = {
  title: 160,
  summary: 600,
  body: 40000,
  source: 400,
  tag: 40,
  tags: 20,
  domains: 10,
  facts: 40,
  factLabel: 80,
  factValue: 400,
  relationNote: 500,
  relations: 240,
  collectionName: 80,
  collectionNote: 1000,
  collectionMembers: 400,
  collections: 120,
  projects: 40,
  projectName: 60,
  views: 40,
  viewName: 40,
  history: 30,
  versions: 40,
  versionNote: 500,
  evidence: 60,
  evidenceNote: 1200,
  evidenceType: 24,
  proposals: 300,
  proposalNote: 1200,
  recalls: 300,
  recallTask: 400,
  recallNote: 1600,
  mergeIds: 60,
  observeText: 20000,
  observeCandidates: 12,
  frames: 60,
  frameName: 60,
  frameNote: 600,
  frameMembers: 400,
  frameHue: 24,
  entries: 4000
}

const DEFAULT_PROJECT_ID = 'prj_default'
const DEFAULT_PROJECT_NAME = 'N2 · 猎星者'

const META = {
  version: STORE_VERSION,
  entryTypes: ENTRY_TYPES.map((id) => ({ id, label: TYPE_LABEL[id], hint: TYPE_HINT[id] })),
  domains: DOMAINS.map((id) => ({ id, label: DOMAIN_LABEL[id] })),
  statuses: STATUSES.map((id) => ({ id, label: STATUS_LABEL[id], hint: STATUS_HINT[id] })),
  relationTypes: RELATION_TYPES.map((id) => ({ id, label: RELATION_LABEL[id], hint: RELATION_HINT[id] })),
  relationStatuses: RELATION_STATUS.map((id) => ({ id, label: RELATION_STATUS_LABEL[id] })),
  sourceKinds: SOURCE_KINDS.map((id) => ({ id, label: SOURCE_LABEL[id] })),
  scopes: MEMORY_SCOPES.map((id) => ({ id, label: SCOPE_LABEL[id] })),
  protectionLevels: PROTECTION_LEVELS.map((id) => ({ id, label: PROTECTION_LABEL[id], hint: PROTECTION_HINT[id] })),
  changeTypes: CHANGE_TYPES.map((id) => ({ id, label: CHANGE_LABEL[id] })),
  proposalStatuses: PROPOSAL_STATUSES.map((id) => ({ id, label: PROPOSAL_STATUS_LABEL[id] })),
  evidenceTypes: EVIDENCE_TYPES.map((id) => ({ id, label: EVIDENCE_LABEL[id] })),
  collectionColors: COLLECTION_COLORS,
  collectionStatuses: COLLECTION_STATUS,
  frameColors: COLLECTION_COLORS,
  limits: LIMITS
}

function cleanText(value, limit) {
  if (typeof value !== 'string') return ''
  const text = value.replace(/\r\n/g, '\n').trim()
  if (!limit || text.length <= limit) return text
  return text.slice(0, limit)
}

function cleanLine(value, limit) {
  if (typeof value !== 'string') return ''
  const text = value.replace(/\s+/g, ' ').trim()
  if (!limit || text.length <= limit) return text
  return text.slice(0, limit)
}

function normalizeTags(raw, limit) {
  const source = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(/[,，#\s]+/) : []
  const seen = new Set()
  const tags = []
  for (const item of source) {
    const tag = cleanLine(typeof item === 'string' ? item.replace(/^#+/, '') : item, LIMITS.tag)
    if (!tag) continue
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    tags.push(tag)
    if (tags.length >= (limit || LIMITS.tags)) break
  }
  return tags
}

function normalizeDomains(raw) {
  const source = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(/[,，\s]+/) : []
  const seen = new Set()
  const domains = []
  for (const item of source) {
    if (typeof item !== 'string') continue
    const value = item.trim()
    if (!value) continue
    const id = DOMAINS.includes(value)
      ? value
      : DOMAINS.find((domain) => DOMAIN_LABEL[domain] === value)
    if (!id || seen.has(id)) continue
    seen.add(id)
    domains.push(id)
  }
  return domains
}

function normalizeFacts(raw) {
  const source = Array.isArray(raw) ? raw : []
  const facts = []
  const seen = new Set()
  for (const item of source) {
    if (!item || typeof item !== 'object') continue
    const label = cleanLine(item.label, LIMITS.factLabel)
    const value = cleanText(item.value, LIMITS.factValue)
    if (!label && !value) continue
    const key = (label + '\u0000' + value).toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    facts.push({ label, value })
    if (facts.length >= LIMITS.facts) break
  }
  return facts
}

function normalizeSource(raw) {
  if (!raw) return { kind: 'manual', label: '' }
  if (typeof raw === 'string') {
    const text = cleanText(raw, LIMITS.source)
    if (!text) return { kind: 'manual', label: '' }
    const kind = SOURCE_KINDS.includes(text) ? text : 'manual'
    return { kind, label: SOURCE_KINDS.includes(text) ? '' : text }
  }
  const kind = SOURCE_KINDS.includes(raw.kind) ? raw.kind : 'manual'
  return { kind, label: cleanText(raw.label || raw.text || raw.ref, LIMITS.source) }
}

function normalizeType(raw) {
  if (typeof raw !== 'string') return 'rule'
  const value = raw.trim()
  if (ENTRY_TYPES.includes(value)) return value
  const byLabel = ENTRY_TYPES.find((type) => TYPE_LABEL[type] === value)
  if (byLabel) return byLabel
  if (LEGACY_CATEGORY_TYPE[value]) return LEGACY_CATEGORY_TYPE[value]
  return 'rule'
}

function normalizeStatus(raw) {
  if (typeof raw !== 'string') return 'draft'
  const value = raw.trim()
  if (STATUSES.includes(value)) return value
  const byLabel = STATUSES.find((status) => STATUS_LABEL[status] === value)
  if (byLabel) return byLabel
  if (LEGACY_STATUS[value]) return LEGACY_STATUS[value]
  return 'draft'
}

function normalizeRelationType(raw) {
  if (typeof raw !== 'string') return 'references'
  const value = raw.trim()
  if (RELATION_TYPES.includes(value)) return value
  const byLabel = RELATION_TYPES.find((type) => RELATION_LABEL[type] === value)
  return byLabel || 'references'
}

function normalizeRelationStatus(raw) {
  if (typeof raw !== 'string') return 'suggested'
  const value = raw.trim()
  if (RELATION_STATUS.includes(value)) return value
  const byLabel = RELATION_STATUS.find((status) => RELATION_STATUS_LABEL[status] === value)
  return byLabel || 'suggested'
}

function normalizeCollectionColor(raw, index) {
  if (typeof raw === 'string' && COLLECTION_COLORS.includes(raw)) return raw
  return COLLECTION_COLORS[(index || 0) % COLLECTION_COLORS.length]
}

function isoNow() {
  return new Date().toISOString()
}

function isIsoDate(value) {
  if (typeof value !== 'string' || !value) return false
  const stamp = Date.parse(value)
  return Number.isFinite(stamp)
}

function newEntryId() {
  return 'mem_' + Date.now().toString(36) + '_' + randomBytes(3).toString('hex')
}

function newRelationId() {
  return 'rel_' + Date.now().toString(36) + '_' + randomBytes(3).toString('hex')
}

function newCollectionId() {
  return 'col_' + Date.now().toString(36) + '_' + randomBytes(3).toString('hex')
}

function newProjectId() {
  return 'prj_' + Date.now().toString(36) + '_' + randomBytes(2).toString('hex')
}

function newViewId() {
  return 'view_' + Date.now().toString(36) + '_' + randomBytes(2).toString('hex')
}

function newFrameId() {
  return 'frm_' + Date.now().toString(36) + '_' + randomBytes(2).toString('hex')
}

function newVersionId() {
  return 'ver_' + Date.now().toString(36) + '_' + randomBytes(2).toString('hex')
}

function newEvidenceId() {
  return 'evd_' + Date.now().toString(36) + '_' + randomBytes(2).toString('hex')
}

function newProposalId() {
  return 'prp_' + Date.now().toString(36) + '_' + randomBytes(2).toString('hex')
}

function newRecallId() {
  return 'rcl_' + Date.now().toString(36) + '_' + randomBytes(2).toString('hex')
}

function clamp01(value, fallback) {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  if (num < 0) return 0
  if (num > 1) return 1
  return num
}

function deriveSummary(content, fallback) {
  const text = cleanText(content, LIMITS.body)
  const base = text || fallback || ''
  const flat = base
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`>~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (flat.length <= 140) return flat
  return flat.slice(0, 138) + '…'
}

function normalizeHistory(raw) {
  const source = Array.isArray(raw) ? raw : []
  const history = []
  for (const item of source) {
    if (!item || typeof item !== 'object') continue
    history.push({
      at: isIsoDate(item.at) ? item.at : isoNow(),
      note: cleanText(item.note, LIMITS.source)
    })
  }
  return history.slice(0, LIMITS.history)
}

function normalizeScope(raw) {
  return MEMORY_SCOPES.includes(raw) ? raw : 'project'
}

function normalizeProtection(raw, status) {
  if (PROTECTION_LEVELS.includes(raw)) return raw
  if (status === 'active' || status === 'archived') return 'confirmed'
  return 'normal'
}

function normalizeChangeType(raw) {
  return CHANGE_TYPES.includes(raw) ? raw : 'refine'
}

function normalizeVersion(raw, memoryId, index, now) {
  if (!raw || typeof raw !== 'object') return null
  const content = cleanText(raw.content !== undefined ? raw.content : raw.body, LIMITS.body)
  if (!content) return null
  return {
    id: cleanLine(raw.id, 64) || newVersionId(),
    memoryId,
    version: Number.isFinite(Number(raw.version)) ? Math.max(1, Math.trunc(Number(raw.version))) : index + 1,
    title: cleanLine(raw.title, LIMITS.title),
    content,
    changeType: normalizeChangeType(raw.changeType),
    changeReason: cleanText(raw.changeReason || raw.reason, LIMITS.versionNote),
    evidenceIds: Array.isArray(raw.evidenceIds)
      ? raw.evidenceIds.map((item) => cleanLine(item, 64)).filter(Boolean).slice(0, 12)
      : [],
    sourceConversation: cleanLine(raw.sourceConversation, 120),
    createdAt: isIsoDate(raw.createdAt) ? raw.createdAt : now,
    createdBy: cleanLine(raw.createdBy, 40) || 'ai'
  }
}

function normalizeEvidence(raw, memoryId, now) {
  if (!raw || typeof raw !== 'object') return null
  const content = cleanText(raw.content || raw.evidenceContent, LIMITS.evidenceNote)
  if (!content) return null
  return {
    id: cleanLine(raw.id, 64) || newEvidenceId(),
    memoryId: cleanLine(raw.memoryId, 64) || memoryId,
    sourceConversation: cleanLine(raw.sourceConversation, 120),
    sourceMessage: cleanLine(raw.sourceMessage, 120),
    content,
    evidenceType: EVIDENCE_TYPES.includes(raw.evidenceType || raw.type) ? raw.evidenceType || raw.type : 'statement',
    confidence: clamp01(raw.confidence, 0.6),
    createdAt: isIsoDate(raw.createdAt) ? raw.createdAt : now
  }
}

function normalizeProposal(raw, entryIds, now) {
  if (!raw || typeof raw !== 'object') return null
  const memoryId = cleanLine(raw.memoryId, 64)
  if (!entryIds.has(memoryId)) return null
  const proposedContent = cleanText(raw.proposedContent, LIMITS.body)
  if (!proposedContent) return null
  return {
    id: cleanLine(raw.id, 64) || newProposalId(),
    memoryId,
    title: cleanLine(raw.title, LIMITS.title),
    oldContent: cleanText(raw.oldContent, LIMITS.body),
    proposedContent,
    changeType: normalizeChangeType(raw.changeType),
    reason: cleanText(raw.reason || raw.note, LIMITS.proposalNote),
    evidenceIds: Array.isArray(raw.evidenceIds)
      ? raw.evidenceIds.map((item) => cleanLine(item, 64)).filter(Boolean).slice(0, 12)
      : [],
    confidence: clamp01(raw.confidence, 0.6),
    status: PROPOSAL_STATUSES.includes(raw.status) ? raw.status : 'pending',
    createdAt: isIsoDate(raw.createdAt) ? raw.createdAt : now,
    decidedAt: isIsoDate(raw.decidedAt) ? raw.decidedAt : '',
    createdBy: cleanLine(raw.createdBy, 40) || 'ai'
  }
}

function normalizeRecall(raw, now) {
  if (!raw || typeof raw !== 'object') return null
  const task = cleanLine(raw.task, LIMITS.recallTask)
  if (!task) return null
  return {
    id: cleanLine(raw.id, 64) || newRecallId(),
    task,
    projectId: cleanLine(raw.projectId, 64),
    at: isIsoDate(raw.at || raw.createdAt) ? raw.at || raw.createdAt : now,
    ids: Array.isArray(raw.ids) ? raw.ids.map((item) => cleanLine(item, 64)).filter(Boolean).slice(0, 20) : [],
    outcome: RECALL_OUTCOMES.includes(raw.outcome) ? raw.outcome : 'served',
    note: cleanText(raw.note, LIMITS.recallNote),
    source: cleanLine(raw.source, 40) || 'agent'
  }
}


function normalizeProject(raw, fallbackId) {
  if (!raw || typeof raw !== 'object') return null
  const id = cleanLine(raw.id, 64) || fallbackId || newProjectId()
  const name = cleanLine(raw.name, LIMITS.projectName)
  if (!name) return null
  return {
    id,
    name,
    description: cleanText(raw.description, 600),
    color: cleanLine(raw.color, 24) || 'blue',
    order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : 0,
    createdAt: isIsoDate(raw.createdAt) ? raw.createdAt : isoNow()
  }
}

function normalizeFrameRect(raw) {
  if (!raw || typeof raw !== 'object') return null
  const num = (value) => {
    const n = Number(value)
    return Number.isFinite(n) ? Math.round(n) : null
  }
  const x = num(raw.x)
  const y = num(raw.y)
  const width = num(raw.w)
  const height = num(raw.h)
  if (x === null || y === null || width === null || height === null) return null
  if (Math.abs(width) < 4 || Math.abs(height) < 4) return null
  return {
    x: width < 0 ? x + width : x,
    y: height < 0 ? y + height : y,
    w: Math.abs(width),
    h: Math.abs(height)
  }
}

function normalizeFrame(raw, allowedIds, now) {
  if (!raw || typeof raw !== 'object') return null
  const name = cleanLine(raw.name, LIMITS.frameName)
  if (!name) return null
  const id = cleanLine(raw.id, 64) || newFrameId()
  const seen = new Set()
  const memberIds = []
  for (const member of Array.isArray(raw.memberIds) ? raw.memberIds : []) {
    const key = cleanLine(member, 64)
    if (!key || key === id || seen.has(key) || !allowedIds.has(key)) continue
    seen.add(key)
    memberIds.push(key)
    if (memberIds.length >= LIMITS.frameMembers) break
  }
  return {
    id,
    name,
    note: cleanText(raw.note, LIMITS.frameNote),
    color: normalizeCollectionColor(raw.color),
    rect: normalizeFrameRect(raw.rect),
    memberIds,
    createdAt: isIsoDate(raw.createdAt) ? raw.createdAt : now,
    updatedAt: isIsoDate(raw.updatedAt) ? raw.updatedAt : isIsoDate(raw.createdAt) ? raw.createdAt : now
  }
}

function normalizeLayout(raw, entryIds) {
  const source = raw && typeof raw === 'object' ? raw.positions || raw : {}
  const positions = {}
  let count = 0
  for (const key of Object.keys(source || {})) {
    if (!entryIds.has(key) || count >= 4000) continue
    const point = source[key]
    const x = Number(point && point.x)
    const y = Number(point && point.y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    positions[key] = { x: Math.round(x), y: Math.round(y) }
    count += 1
  }
  return {
    positions,
    updatedAt: raw && isIsoDate(raw.updatedAt) ? raw.updatedAt : ''
  }
}

function normalizeEntry(raw, projectIds, now) {
  if (!raw || typeof raw !== 'object') return null
  const id = cleanLine(raw.id, 64) || newEntryId()
  const legacySummary = cleanText(raw.summary, LIMITS.summary)
  const body = cleanText(raw.body !== undefined ? raw.body : raw.content, LIMITS.body)
  const title = cleanLine(raw.title, LIMITS.title) || cleanLine(legacySummary, 60) || '未命名记忆'
  const content = body || legacySummary
  const createdAt = isIsoDate(raw.createdAt) ? raw.createdAt : now
  const updatedAt = isIsoDate(raw.updatedAt) ? raw.updatedAt : createdAt
  const legacy =
    raw.legacy && typeof raw.legacy === 'object'
      ? {
          category: cleanLine(raw.legacy.category, 40),
          status: cleanLine(raw.legacy.status, 40),
          summary: cleanText(raw.legacy.summary, LIMITS.summary)
        }
      : null
  const projectId = projectIds.has(cleanLine(raw.projectId, 64))
    ? cleanLine(raw.projectId, 64)
    : projectIds.has(DEFAULT_PROJECT_ID)
      ? DEFAULT_PROJECT_ID
      : Array.from(projectIds)[0] || DEFAULT_PROJECT_ID
  const status = normalizeStatus(raw.status)
  const versions = []
  const versionIds = new Set()
  for (const item of Array.isArray(raw.versions) ? raw.versions : []) {
    const version = normalizeVersion(item, id, versions.length, now)
    if (!version || versionIds.has(version.id)) continue
    versionIds.add(version.id)
    versions.push(version)
    if (versions.length >= LIMITS.versions) break
  }
  if (!versions.length) {
    versions.push({
      id: newVersionId(),
      memoryId: id,
      version: 1,
      title,
      content,
      changeType: 'create',
      changeReason: '迁移自旧版本数据',
      evidenceIds: [],
      sourceConversation: '',
      createdAt,
      createdBy: 'system'
    })
  }
  const evidence = []
  const evidenceIds = new Set()
  for (const item of Array.isArray(raw.evidence) ? raw.evidence : []) {
    const record = normalizeEvidence(item, id, now)
    if (!record || evidenceIds.has(record.id)) continue
    evidenceIds.add(record.id)
    evidence.push(record)
    if (evidence.length >= LIMITS.evidence) break
  }
  const source = normalizeSource(raw.source)
  // 每条记忆都必须能说清「哪来的」：有来源标注就用标注，没有就明确记为
  // 迁移遗留（未标注来源），不当成凭空出现的知识。
  if (!evidence.length) {
    evidence.push({
      id: newEvidenceId(),
      memoryId: id,
      sourceConversation: cleanLine(raw.sourceConversation, 120),
      sourceMessage: '',
      content:
        cleanText(source.label, LIMITS.evidenceNote) ||
        '迁移自旧版本数据（人工录入，未标注来源）',
      evidenceType: raw.evidenceType && EVIDENCE_TYPES.includes(raw.evidenceType) ? raw.evidenceType : 'statement',
      confidence: cleanText(source.label, LIMITS.evidenceNote) ? 0.7 : 0.5,
      createdAt
    })
  }
  const versions2 = versions.slice(-LIMITS.versions)
  return {
    id,
    title,
    summary: legacySummary || deriveSummary(content, title),
    content,
    type: normalizeType(raw.type || raw.category),
    domains: normalizeDomains(raw.domains),
    tags: normalizeTags(raw.tags || raw.tag),
    status,
    scope: normalizeScope(raw.scope),
    projectId,
    confidence: clamp01(raw.confidence, status === 'active' ? 0.85 : 0.6),
    importance: clamp01(raw.importance, raw.pinned ? 0.9 : 0.5),
    protectionLevel: normalizeProtection(raw.protectionLevel || raw.protection, status),
    source,
    facts: normalizeFacts(raw.facts),
    pinned: Boolean(raw.pinned),
    favorite: Boolean(raw.favorite || raw.starred),
    usageCount: Number.isFinite(Number(raw.usageCount)) ? Math.max(0, Math.trunc(Number(raw.usageCount))) : 0,
    lastUsedAt: isIsoDate(raw.lastUsedAt) ? raw.lastUsedAt : '',
    evidenceCount: evidence.length,
    currentVersion: versions2.length,
    supersededBy: cleanLine(raw.supersededBy, 64),
    expiresAt: isIsoDate(raw.expiresAt) ? raw.expiresAt : '',
    versions: versions2,
    evidence,
    createdAt,
    updatedAt,
    history: normalizeHistory(raw.history),
    legacy: legacy && (legacy.category || legacy.status || legacy.summary) ? legacy : null
  }
}

function normalizeRelation(raw, entryIds, now) {
  if (!raw || typeof raw !== 'object') return null
  const sourceMemoryId = cleanLine(raw.sourceMemoryId || raw.from || raw.sourceId || raw.to, 64)
  const targetMemoryId = cleanLine(raw.targetMemoryId || raw.to || raw.targetId, 64)
  if (!entryIds.has(sourceMemoryId) || !entryIds.has(targetMemoryId)) return null
  if (sourceMemoryId === targetMemoryId) return null
  const status = normalizeRelationStatus(raw.status)
  return {
    id: cleanLine(raw.id, 64) || newRelationId(),
    sourceMemoryId,
    targetMemoryId,
    relationType: normalizeRelationType(raw.relationType || raw.type),
    description: cleanText(raw.description || raw.label || raw.note, LIMITS.relationNote),
    status,
    confidence: clamp01(raw.confidence, status === 'confirmed' ? 0.9 : 0.55),
    evidence: cleanText(raw.evidence, LIMITS.relationNote),
    source: raw.createdBy === 'ai' || raw.source === 'ai' ? 'ai' : raw.source === 'user' || raw.createdBy === 'user' ? 'user' : 'system',
    createdBy: cleanLine(raw.createdBy, 40) || 'user',
    createdAt: isIsoDate(raw.createdAt) ? raw.createdAt : now,
    updatedAt: isIsoDate(raw.updatedAt) ? raw.updatedAt : isIsoDate(raw.createdAt) ? raw.createdAt : now
  }
}

function normalizeCollection(raw, entryIds, projectIds, now, index) {
  if (!raw || typeof raw !== 'object') return null
  const members = []
  const seen = new Set()
  const rawMembers = Array.isArray(raw.memberIds) ? raw.memberIds : []
  for (const item of rawMembers) {
    const id = cleanLine(item, 64)
    if (!entryIds.has(id) || seen.has(id)) continue
    seen.add(id)
    members.push(id)
    if (members.length >= LIMITS.collectionMembers) break
  }
  const name = cleanLine(raw.name, LIMITS.collectionName)
  const legacy =
    raw.legacy && typeof raw.legacy === 'object'
      ? {
          category: cleanLine(raw.legacy.category, 40),
          status: cleanLine(raw.legacy.status, 40),
          summary: cleanText(raw.legacy.summary, LIMITS.summary)
        }
      : null
  const projectId = projectIds.has(cleanLine(raw.projectId, 64)) ? cleanLine(raw.projectId, 64) : DEFAULT_PROJECT_ID
  return {
    id: cleanLine(raw.id, 64) || newCollectionId(),
    name: name || '未命名集合',
    description: cleanText(raw.description || raw.note, LIMITS.collectionNote),
    projectId,
    tags: normalizeTags(raw.tags),
    memberIds: members,
    color: normalizeCollectionColor(raw.color, index),
    source: COLLECTION_SOURCES.includes(raw.source) ? raw.source : 'manual',
    status: COLLECTION_STATUS.includes(raw.status) ? raw.status : 'confirmed',
    reasons: Array.isArray(raw.reasons) ? raw.reasons.map((item) => cleanText(item, 200)).filter(Boolean).slice(0, 8) : [],
    createdAt: isIsoDate(raw.createdAt) ? raw.createdAt : now,
    updatedAt: isIsoDate(raw.updatedAt) ? raw.updatedAt : now
  }
}

function normalizeView(raw) {
  if (!raw || typeof raw !== 'object') return null
  const name = cleanLine(raw.name, LIMITS.viewName)
  if (!name) return null
  const filters = raw.filters && typeof raw.filters === 'object' ? raw.filters : {}
  return {
    id: cleanLine(raw.id, 64) || newViewId(),
    name,
    filters: {
      types: Array.isArray(filters.types) ? filters.types.filter((item) => ENTRY_TYPES.includes(item)) : [],
      domains: normalizeDomains(filters.domains),
      statuses: Array.isArray(filters.statuses) ? filters.statuses.filter((item) => STATUSES.includes(item)) : [],
      relationTypes: Array.isArray(filters.relationTypes)
        ? filters.relationTypes.filter((item) => RELATION_TYPES.includes(item))
        : [],
      collectionId: cleanLine(filters.collectionId, 64),
      projectId: cleanLine(filters.projectId, 64),
      showOffline: filters.showOffline !== false
    },
    createdAt: isIsoDate(raw.createdAt) ? raw.createdAt : isoNow()
  }
}

function migrateStore(parsed) {
  const now = isoNow()
  const rawProjects = Array.isArray(parsed.projects) ? parsed.projects : []
  const projects = []
  const projectIds = new Set()
  for (const item of rawProjects) {
    const project = normalizeProject(item)
    if (!project || projectIds.has(project.id)) continue
    projectIds.add(project.id)
    projects.push(project)
    if (projects.length >= LIMITS.projects) break
  }
  if (!projects.length) {
    projects.push({
      id: DEFAULT_PROJECT_ID,
      name: DEFAULT_PROJECT_NAME,
      description: '游戏策划工作中产生的系统规则、数值口径与设计结论。',
      color: 'blue',
      createdAt: now
    })
    projectIds.add(DEFAULT_PROJECT_ID)
  }

  const rawEntries = Array.isArray(parsed.entries) ? parsed.entries : []
  const entries = []
  const entryIds = new Set()
  for (const item of rawEntries) {
    if (item && typeof item === 'object' && !item.legacy && item.category) {
      item.legacy = { category: item.category, status: item.status, summary: item.summary }
    }
    const entry = normalizeEntry(item, projectIds, now)
    if (!entry || entryIds.has(entry.id)) continue
    entryIds.add(entry.id)
    entries.push(entry)
  }

  // 记忆框要先落库：关系两端允许是记忆框，校验关系时需要知道哪些框存在。
  const frames = []
  const frameIds = new Set()
  const rawFrames = Array.isArray(parsed.frames) ? parsed.frames : []
  // 记忆框可以互相嵌套，所以归一化成员时要知道「所有框」的 id，而不是只有条目。
  for (const item of rawFrames) {
    const rawId = cleanLine(item && item.id, 64)
    if (rawId) frameIds.add(rawId)
  }
  const frameMemberIds = new Set(entryIds)
  frameIds.forEach((id) => frameMemberIds.add(id))
  for (const item of rawFrames) {
    const frame = normalizeFrame(item, frameMemberIds, now)
    if (!frame || frames.some((existing) => existing.id === frame.id)) continue
    frames.push(frame)
    if (frames.length >= LIMITS.frames) break
  }
  frameIds.clear()
  frames.forEach((frame) => frameIds.add(frame.id))
  const nodeIds = new Set(entryIds)
  frameIds.forEach((id) => nodeIds.add(id))

  const relations = []
  const relationKeys = new Set()
  const rawRelations = Array.isArray(parsed.relations) ? parsed.relations : []
  for (const item of rawRelations) {
    const relation = normalizeRelation(item, nodeIds, now)
    if (!relation) continue
    const key = relation.sourceMemoryId + '\u0000' + relation.targetMemoryId + '\u0000' + relation.relationType
    if (relationKeys.has(key)) continue
    relationKeys.add(key)
    relations.push(relation)
    if (relations.length >= LIMITS.relations) break
  }

  if (!rawRelations.length) {
    for (const item of rawEntries) {
      if (!item || !Array.isArray(item.links)) continue
      for (const link of item.links) {
        const relation = normalizeRelation(
          {
            sourceMemoryId: item.id,
            targetMemoryId: link && (link.to || link.targetId),
            relationType: 'references',
            description: link && link.label,
            status: 'confirmed',
            createdBy: 'user',
            createdAt: item.updatedAt || item.createdAt
          },
          nodeIds,
          now
        )
        if (!relation) continue
        const key = relation.sourceMemoryId + '\u0000' + relation.targetMemoryId + '\u0000' + relation.relationType
        if (relationKeys.has(key)) continue
        relationKeys.add(key)
        relations.push(relation)
      }
    }
  }

  const collections = []
  const collectionIds = new Set()
  const rawCollections = Array.isArray(parsed.collections)
    ? parsed.collections
    : Array.isArray(parsed.regions)
      ? parsed.regions.map((region) => ({
          id: region.id,
          name: region.name,
          description: region.note,
          memberIds: region.memberIds,
          color: region.color,
          source: 'manual',
          status: 'confirmed',
          createdAt: region.createdAt,
          updatedAt: region.updatedAt
        }))
      : []
  for (const item of rawCollections) {
    const collection = normalizeCollection(item, entryIds, projectIds, now, collections.length)
    if (!collection || collectionIds.has(collection.id)) continue
    collectionIds.add(collection.id)
    collections.push(collection)
    if (collections.length >= LIMITS.collections) break
  }

  const views = []
  for (const item of Array.isArray(parsed.views) ? parsed.views : []) {
    const view = normalizeView(item)
    if (!view) continue
    views.push(view)
    if (views.length >= LIMITS.views) break
  }

  const proposals = []
  const proposalIds = new Set()
  for (const item of Array.isArray(parsed.proposals) ? parsed.proposals : []) {
    const proposal = normalizeProposal(item, entryIds, now)
    if (!proposal || proposalIds.has(proposal.id)) continue
    proposalIds.add(proposal.id)
    proposals.push(proposal)
    if (proposals.length >= LIMITS.proposals) break
  }

  const recalls = []
  for (const item of Array.isArray(parsed.recalls) ? parsed.recalls : []) {
    const recall = normalizeRecall(item, now)
    if (!recall) continue
    recalls.push(recall)
    if (recalls.length >= LIMITS.recalls) break
  }

  projects.sort((left, right) => (left.order || 0) - (right.order || 0) || String(left.createdAt).localeCompare(String(right.createdAt)))
  projects.forEach((project, index) => {
    project.order = index * 10
  })

  const layout = normalizeLayout(parsed.layout, nodeIds)

  return { version: STORE_VERSION, projects, entries, relations, collections, views, proposals, recalls, frames, layout }
}

function pruneStore(store) {
  const entryIds = new Set(store.entries.map((entry) => entry.id))
  const nodeIds = new Set(entryIds)
  ;(store.frames || []).forEach((frame) => nodeIds.add(frame.id))
  store.relations = store.relations.filter(
    (relation) => nodeIds.has(relation.sourceMemoryId) && nodeIds.has(relation.targetMemoryId)
  )
  for (const collection of store.collections) {
    const members = []
    const seen = new Set()
    for (const id of collection.memberIds) {
      if (!entryIds.has(id) || seen.has(id)) continue
      seen.add(id)
      members.push(id)
    }
    collection.memberIds = members
  }
  if (Array.isArray(store.proposals)) {
    store.proposals = store.proposals.filter((proposal) => entryIds.has(proposal.memoryId))
  }
  if (Array.isArray(store.recalls)) {
    for (const recall of store.recalls) {
      recall.ids = recall.ids.filter((id) => entryIds.has(id))
    }
    store.recalls = store.recalls.filter((recall) => recall.ids.length > 0 || recall.outcome !== 'served')
  }
  if (Array.isArray(store.frames)) {
    for (const frame of store.frames) {
      frame.memberIds = frame.memberIds.filter((id) => entryIds.has(id))
    }
  }
  if (store.layout && store.layout.positions) {
    const next = {}
    for (const key of Object.keys(store.layout.positions)) {
      if (nodeIds.has(key)) next[key] = store.layout.positions[key]
    }
    store.layout.positions = next
  }
  rebuildFrameMembers(store)
  return store
}

// 记忆框是「空间容器」：框里的节点自动属于这个框。
// 只要知道每个节点的坐标，成员就不该依赖用户手动维护。
function nodeCenters(store) {
  const centers = new Map()
  const positions = (store.layout && store.layout.positions) || {}
  ;(store.entries || []).forEach((entry) => {
    const point = positions[entry.id]
    if (point && Number.isFinite(point.x) && Number.isFinite(point.y)) {
      centers.set(entry.id, { x: point.x, y: point.y })
    }
  })
  ;(store.frames || []).forEach((frame) => {
    const point = positions[frame.id]
    if (point && Number.isFinite(point.x) && Number.isFinite(point.y)) {
      centers.set(frame.id, { x: point.x, y: point.y })
    }
  })
  return centers
}

function insideRect(rect, point) {
  if (!rect || !point) return false
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h
}

// 用坐标重算所有带 rect 的框的成员；没有 rect 的老框保留手动成员。
// 只有「真的保存过布局」时才重算，否则一次空布局会把成员洗掉。
function rebuildFrameMembers(store) {
  const centers = nodeCenters(store)
  const saved = Boolean(store.layout && store.layout.updatedAt) && centers.size > 0
  const known = new Set(store.entries.map((entry) => entry.id))
  ;(store.frames || []).forEach((frame) => known.add(frame.id))
  for (const frame of store.frames || []) {
    const members = []
    if (frame.rect && saved) {
      for (const [id, point] of centers) {
        if (id === frame.id) continue
        if (insideRect(frame.rect, point)) members.push(id)
      }
    } else {
      for (const id of frame.memberIds || []) {
        if (id !== frame.id && known.has(id)) members.push(id)
      }
    }
    members.sort()
    frame.memberIds = members.slice(0, LIMITS.frameMembers)
  }
  return store
}

function collectionIdsOf(store, entryId) {
  return store.collections.filter((collection) => collection.memberIds.includes(entryId)).map((collection) => collection.id)
}

const TYPE_KEYWORDS = {
  decision: ['决定', '定了', '确认', '结论', '拍板', '通过', '最终', '采用', '采纳', '统一', '敲定', '取舍'],
  rule: ['规则', '限制', '上限', '下限', '公式', '计算', '生效', '每日', '每次', '概率', '冷却', '必须', '不允许', '禁止', '只能'],
  assumption: ['假设', '推测', '猜测', '可能', '预计', '待验证', '不确定', '应该会', '预估', '怀疑'],
  question: ['问题', '疑问', '待解决', '怎么', '为什么', '是否', '要不要', '风险', '冲突', '卡点', '难点'],
  proposal: ['方案', '计划', '建议', '可选', '备选', '设计稿', '打算', '拟定', '初版', '尝试'],
  reference: ['竞品', '参考', '案例', '类似', '对标', '行业', '国外', '灵感', '复刻', '拆解'],
  metric: ['数值', '参数', '系数', '产出', '消耗', '时长', '倍率', '金币', '概率', '经验值', '掉落', '伤害'],
  retro: ['复盘', '测试', '反馈', '结果', '表现', '玩家', '留存', '转化', '数据', '经验总结', '问题在'],
  process: ['流程', '交付', '目录', '命名', '落位', '约定', '规范', '工作台', '提交', '备份', '索引', '版本库']
}

const DOMAIN_KEYWORDS = {
  combat: ['战斗', '技能', '伤害', '敌人', '能量', '释放', '冷却', '命中', '闪避', '护盾', 'buff', '增益', '减益', '怪物', '弹幕'],
  growth: ['成长', '等级', '升级', '经验', '属性', '天赋', '技能树', '卡牌', '抽卡', '养成', '战力', '突破', '升星'],
  economy: ['经济', '货币', '金币', '钻石', '产出', '消耗', '商店', '价格', '兑换', '通胀', '资源', '奖励', '掉落率'],
  level: ['关卡', '波次', '地图', '难度', '关卡设计', 'boss', '布局', '路径', '刷怪', '章节', '节奏'],
  event: ['活动', '限时', '赛季', '通行证', '任务', '签到', '运营日历', '节日', '联动'],
  uiux: ['ui', 'ux', '界面', '交互', '按钮', '视觉', '布局', '图标', '提示', '动效', '弹窗', '字体', '新手引导', '红点'],
  monetization: ['商业化', '付费', '内购', '充值', '礼包', '首充', '广告', '变现', '定价', '收入', '广告位', '礼包链'],
  social: ['社交', '好友', '公会', '组队', '聊天', '邀请', '师徒', '排行', '联盟', '世界频道'],
  operation: ['运营', '版本', '发布', '埋点', '留存', '转化', '公告', '客服', '数据看板', '活动排期', '复盘会'],
  tech: ['技术', '性能', '内存', '帧率', '兼容', '引擎', '服务器', '接口', '配置表', '构建', '包体', '热更', 'lua']
}

const TAG_STOPWORDS = new Set([
  '这个', '那个', '我们', '你们', '他们', '就是', '可以', '需要', '没有', '什么', '怎么', '因为', '所以',
  '但是', '如果', '然后', '现在', '目前', '已经', '还是', '一个', '一些', '这样', '那样', '这些', '那些',
  '规则', '设计', '玩家', '游戏', '问题', '方案', '记忆', '内容', '情况', '时候', '地方', '东西', '结果'
])

function lowerText(text) {
  return String(text || '').toLowerCase()
}

function countHits(text, keywords) {
  const haystack = lowerText(text)
  let score = 0
  const matched = []
  for (const keyword of keywords) {
    if (!keyword) continue
    if (haystack.includes(keyword.toLowerCase())) {
      score += Math.min(3, keyword.length)
      matched.push(keyword)
    }
  }
  return { score, matched }
}

function inferType(text) {
  let best = { type: 'assumption', score: 0, matched: [] }
  for (const type of ENTRY_TYPES) {
    const { score, matched } = countHits(text, TYPE_KEYWORDS[type] || [])
    if (score > best.score) best = { type, score, matched }
  }
  if (best.score === 0) return { type: 'assumption', score: 0, matched: [] }
  return best
}

function inferDomains(text) {
  const scored = []
  for (const domain of DOMAINS) {
    const { score, matched } = countHits(text, DOMAIN_KEYWORDS[domain] || [])
    if (score > 0) scored.push({ domain, score, matched })
  }
  scored.sort((left, right) => right.score - left.score)
  return scored.slice(0, 3)
}

function splitSentences(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .split(/\n+/)
    .map((line) => line.replace(/^#{1,6}\s+/, '').replace(/^[-*+]\s+/, '').trim())
    .filter(Boolean)
}

function suggestTitle(text) {
  const lines = splitSentences(text)
  if (!lines.length) return '未命名记忆'
  const first = lines[0]
  const sentence = first.split(/[。！？；;!?]/)[0] || first
  const title = sentence.replace(/\s+/g, ' ').trim()
  if (!title) return '未命名记忆'
  if (title.length <= 34) return title
  return title.slice(0, 32) + '…'
}

function tokenizeForTags(text) {
  const cleaned = String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[A-Za-z0-9_./\\:-]+/g, ' ')
    .replace(/[，。、；：！？（）【】《》""''…—–\-+*#>`~]/g, ' ')
  const chunks = cleaned.split(/\s+/).filter(Boolean)
  const counts = new Map()
  for (const chunk of chunks) {
    if (chunk.length < 2 || chunk.length > 8) continue
    if (TAG_STOPWORDS.has(chunk)) continue
    for (let size = 4; size >= 2; size -= 1) {
      for (let start = 0; start + size <= chunk.length; start += 1) {
        const token = chunk.slice(start, start + size)
        if (TAG_STOPWORDS.has(token)) continue
        counts.set(token, (counts.get(token) || 0) + size - 1)
      }
    }
  }
  return counts
}

function inferTags(text, corpusTags, limit) {
  const counts = new Map()
  const corpus = corpusTags || []
  const haystack = lowerText(text)
  for (const tag of corpus) {
    const key = lowerText(tag)
    if (!key || key.length < 2) continue
    const hits = haystack.split(key).length - 1
    if (hits > 0) counts.set(tag, (counts.get(tag) || 0) + hits * 6 + tag.length)
  }
  for (const [token, weight] of tokenizeForTags(text)) {
    if (counts.has(token)) {
      counts.set(token, counts.get(token) + weight)
    } else if (weight >= 3) {
      counts.set(token, weight)
    }
  }
  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || right[0].length - left[0].length)
    .slice(0, limit || 6)
    .map(([token]) => token)
}

function suggestEntry(input, store) {
  const text = cleanText(input && (input.text || input.content), LIMITS.body)
  const title = cleanLine(input && input.title, LIMITS.title) || suggestTitle(text)
  const typeGuess = inferType(text)
  const domainGuesses = inferDomains(text)
  const corpus = new Set()
  for (const entry of store.entries) {
    for (const tag of entry.tags) corpus.add(tag)
  }
  for (const collection of store.collections) {
    for (const tag of collection.tags) corpus.add(tag)
  }
  const tags = inferTags(text, Array.from(corpus), 6)
  const projectGuess = guessProject(text, store, input && input.projectId)
  return {
    title,
    summary: deriveSummary(text, title),
    type: typeGuess.type,
    typeReason: typeGuess.matched.length
      ? '出现「' + typeGuess.matched.slice(0, 3).join('、') + '」等表述'
      : '没有明显类型线索，先按「设计假设」存放',
    domains: domainGuesses.map((item) => item.domain),
    domainReason: domainGuesses.length
      ? domainGuesses.map((item) => DOMAIN_LABEL[item.domain] + '（' + item.matched.slice(0, 2).join('/') + '）').join('、')
      : '没有命中领域关键词',
    tags,
    projectId: projectGuess.projectId,
    projectReason: projectGuess.reason,
    confidence: Math.max(0.2, Math.min(0.95, (typeGuess.score + domainGuesses.reduce((sum, item) => sum + item.score, 0)) / 24))
  }
}

function guessProject(text, store, preferred) {
  if (preferred && store.projects.some((project) => project.id === preferred)) {
    return { projectId: preferred, reason: '使用当前选中的项目' }
  }
  const haystack = lowerText(text)
  let best = null
  for (const project of store.projects) {
    const name = lowerText(project.name)
    const key = name.replace(/[^\u4e00-\u9fa5a-z0-9]/g, '')
    let score = 0
    if (key && haystack.includes(key)) score += 6
    const words = name.split(/[^\u4e00-\u9fa5a-z0-9]+/).filter((word) => word.length >= 2)
    for (const word of words) {
      if (haystack.includes(word)) score += 3
    }
    for (const entry of store.entries) {
      if (entry.projectId !== project.id) continue
      for (const tag of entry.tags) {
        if (tag && haystack.includes(lowerText(tag))) score += 1
      }
    }
    if (!best || score > best.score) best = { projectId: project.id, score }
  }
  if (best && best.score > 0) return { projectId: best.projectId, reason: '内容与该项目的历史记忆较为接近' }
  return {
    projectId: store.projects[0] ? store.projects[0].id : DEFAULT_PROJECT_ID,
    reason: '没有明显项目线索，先放进默认项目'
  }
}

function entryText(entry) {
  return [entry.title, entry.summary, entry.content].concat(entry.tags).join('\n')
}

function shareTags(left, right) {
  const rightSet = new Set(right.tags.map((tag) => lowerText(tag)))
  return left.tags.filter((tag) => rightSet.has(lowerText(tag)))
}

function numbersIn(text) {
  const found = String(text || '').match(/\d+(?:\.\d+)?/g)
  return found ? found.slice(0, 12) : []
}

function suggestRelationsFor(entry, store) {
  const existing = new Set()
  for (const relation of store.relations) {
    if (relation.sourceMemoryId === entry.id) existing.add(relation.targetMemoryId)
    if (relation.targetMemoryId === entry.id) existing.add(relation.sourceMemoryId)
  }
  const candidates = []
  for (const other of store.entries) {
    if (other.id === entry.id) continue
    const shared = shareTags(entry, other)
    const domainOverlap = entry.domains.filter((domain) => other.domains.includes(domain))
    let score = shared.length * 3 + domainOverlap.length * 2
    if (score <= 0) continue
    const relationType = pickRelationType(entry, other, shared, domainOverlap)
    if (!relationType) continue
    const reasons = []
    if (shared.length) reasons.push('共同标签：' + shared.slice(0, 3).join('、'))
    if (domainOverlap.length) reasons.push('同属领域：' + domainOverlap.map((domain) => DOMAIN_LABEL[domain]).join('、'))
    candidates.push({
      targetMemoryId: other.id,
      relationType,
      score,
      confidence: Math.min(0.92, 0.34 + score * 0.06),
      description: reasons.join('；'),
      reasons,
      alreadyLinked: existing.has(other.id)
    })
  }
  candidates.sort((left, right) => right.score - left.score)
  return candidates.slice(0, 6)
}

function pickRelationType(entry, other, shared, domainOverlap) {
  if (other.status === 'deprecated' && entry.status === 'active' && shared.length >= 2) return 'supersedes'
  if (entry.type === 'metric' && other.type === 'metric' && shared.length >= 1) {
    const leftNumbers = numbersIn(entryText(entry))
    const rightNumbers = numbersIn(otherText(other))
    if (leftNumbers.length && rightNumbers.length && leftNumbers.join(',') !== rightNumbers.join(',')) {
      return 'conflicts_with'
    }
  }
  if (entry.type === 'retro' && ['decision', 'rule', 'metric'].includes(other.type)) return 'derived_from'
  if (entry.type === 'rule' && other.type === 'decision') return 'refines'
  if (entry.type === 'assumption' && other.type === 'rule') return 'depends_on'
  if (shared.length >= 2) return 'references'
  if (domainOverlap.length) return 'affects'
  return null
}

function otherText(entry) {
  return entryText(entry)
}

function suggestCollections(store, projectId) {
  const entries = store.entries.filter((entry) => entry.status !== 'archived' && (!projectId || entry.projectId === projectId))
  const byDomain = new Map()
  for (const entry of entries) {
    const domains = entry.domains.length ? entry.domains : ['_none']
    for (const domain of domains) {
      if (!byDomain.has(domain)) byDomain.set(domain, [])
      byDomain.get(domain).push(entry)
    }
  }
  const existingSets = store.collections.map((collection) => ({
    collection,
    keys: new Set(collection.memberIds)
  }))
  const proposals = []
  for (const [domain, group] of byDomain) {
    if (group.length < 3) continue
    const tagCounts = new Map()
    for (const entry of group) {
      for (const tag of entry.tags) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    }
    const topTags = Array.from(tagCounts.entries())
      .filter(([, count]) => count >= 2)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
    const label = domain === '_none' ? '未归类记忆' : DOMAIN_LABEL[domain]
    const pushProposal = (name, members, tags, reasons) => {
      if (members.length < 3) return
      const key = new Set(members.map((entry) => entry.id))
      const duplicated = existingSets.some(({ keys }) => {
        let overlap = 0
        for (const id of key) if (keys.has(id)) overlap += 1
        const union = key.size + keys.size - overlap
        return union > 0 && overlap / union >= 0.8
      })
      if (duplicated) return
      proposals.push({
        name,
        description:
          '围绕『' + label + '』整理的 ' + members.length + ' 条记忆' + (tags.length ? '，反复出现「' + tags.join('、') + '」' : '') + '。',
        memberIds: members.map((entry) => entry.id),
        tags,
        reasons,
        projectId: members[0].projectId,
        source: 'ai',
        status: 'suggested',
        color: COLLECTION_COLORS[proposals.length % COLLECTION_COLORS.length]
      })
    }
    if (topTags.length) {
      const primary = topTags[0][0]
      const primaryMembers = group.filter((entry) => entry.tags.some((tag) => lowerText(tag) === lowerText(primary)))
      pushProposal(label + ' · ' + primary, primaryMembers, [primary], [
        '共同领域：' + label,
        '共同标签：' + primary,
        '包含 ' + primaryMembers.filter((entry) => entry.status === 'active').length + ' 条已生效记忆'
      ])
    }
    pushProposal(label, group, topTags.map(([tag]) => tag), [
      '共同领域：' + label,
      '共 ' + group.length + ' 条记忆，其中 ' + group.filter((entry) => entry.status === 'pending').length + ' 条待确认'
    ])
    if (proposals.length >= 6) break
  }
  return proposals.slice(0, 6)
}

    // ---------------------------------------------------------------- assist
    // Deterministic "understanding" layer: every helper here is pure and works
    // off the local store, so the plugin can offer AI-style suggestions without
    // calling out to a model. Suggestions never mutate the store.

    function entryBody(entry) {
      return String((entry && (entry.content || entry.summary || entry.title)) || '')
    }

    function corpusOf(store) {
      const corpus = new Set()
      for (const entry of store.entries) {
        for (const tag of entry.tags) corpus.add(tag)
      }
      for (const collection of store.collections) {
        for (const tag of collection.tags) corpus.add(tag)
      }
      return corpus
    }

    function tokensOf(text) {
      return new Set(Array.from(tokenizeForTags(text).entries())
        .filter(([, weight]) => weight >= 3)
        .map(([token]) => token))
    }

    function overlapCount(left, right) {
      let hits = 0
      for (const value of left) {
        if (right.has(value)) hits += 1
      }
      return hits
    }

    // Split a note into atomic knowledge points. Conservative on purpose: a
    // single short note stays a single memory, and we never return more than
    // five pieces.
    function suggestSegments(text, store) {
      const raw = String(text || '').trim()
      if (raw.length < 60) return []
      const blocks = raw
        .split(/\n\s*\n/)
        .map((block) => block.trim())
        .filter((block) => block.length >= 12)
      let pieces = []
      if (blocks.length >= 2) {
        pieces = blocks
      } else {
        const lines = splitSentences(raw).filter((line) => line.length >= 8)
        if (lines.length < 3) return []
        pieces = lines
      }
      if (pieces.length < 2) return []

      // Greedy grouping: sentences that share tokens land in the same group.
      const groups = []
      for (const piece of pieces) {
        const tokens = tokensOf(piece)
        let target = null
        for (const group of groups) {
          if (overlapCount(tokens, group.tokens) >= 2) {
            target = group
            break
          }
        }
        if (!target) {
          target = { tokens: new Set(), pieces: [] }
          groups.push(target)
        }
        target.pieces.push(piece)
        for (const token of tokens) target.tokens.add(token)
      }
      const merged = groups
        .map((group) => group.pieces.join('\n'))
        .map((content) => content.trim())
        .filter((content) => content.length >= 24)
      if (merged.length < 2) return []

      const corpus = corpusOf(store)
      return merged.slice(0, 5).map((content) => {
        const typeGuess = inferType(content)
        const domains = inferDomains(content).map((item) => item.domain)
        return {
          title: suggestTitle(content),
          content,
          type: typeGuess.type,
          typeReason: typeGuess.matched.length
            ? '出现「' + typeGuess.matched.slice(0, 2).join('、') + '」'
            : '没有明显类型线索',
          domains,
          tags: inferTags(content, Array.from(corpus), 4),
          reason: '这段内容与其它段落的主题词重合度较低，可以单独成为一条记忆'
        }
      })
    }

    function collectionMatches(entry, store) {
      return store.collections
        .filter((collection) => collection.projectId === entry.projectId)
        .map((collection) => ({
          collection,
          shared: collection.tags.filter((tag) => entry.tags.includes(tag))
        }))
        .filter((item) => item.shared.length >= 2)
        .sort((left, right) => right.shared.length - left.shared.length)
        .slice(0, 3)
        .map((item) => ({
          collectionId: item.collection.id,
          name: item.collection.name,
          description: item.collection.description,
          shared: item.shared,
          reason: '共同主题词：' + item.shared.slice(0, 3).join('、')
        }))
    }

    function assistOrganize(entry, store) {
      const text = entryBody(entry)
      const corpus = corpusOf(store)
      const typeGuess = inferType(text)
      const domainGuesses = inferDomains(text)
      const tags = inferTags(text, Array.from(corpus), 6)
      return {
        kind: 'organize',
        entryId: entry.id,
        title: suggestTitle(text),
        summary: deriveSummary(text, entry.title),
        type: typeGuess.type,
        typeReason: typeGuess.matched.length
          ? '出现「' + typeGuess.matched.slice(0, 3).join('、') + '」等表述'
          : '没有明显类型线索',
        domains: domainGuesses.map((item) => item.domain),
        domainReason: domainGuesses.length
          ? domainGuesses
              .map((item) => DOMAIN_LABEL[item.domain] + '（' + item.matched.slice(0, 2).join('/') + '）')
              .join('、')
          : '没有命中领域关键词',
        tags,
        segments: suggestSegments(text, store),
        relations: suggestRelationsFor(entry, store).slice(0, 5),
        collections: collectionMatches(entry, store)
      }
    }

    function similarityOf(entry, other, tokens) {
      const shared = shareTags(entry, other)
      const domainOverlap = entry.domains.filter((domain) => other.domains.includes(domain))
      const tokenHits = overlapCount(tokens, tokensOf(entryText(other)))
      return {
        score: shared.length * 3 + domainOverlap.length * 2 + tokenHits,
        shared,
        domainOverlap,
        tokenHits
      }
    }

    function assistSimilar(entry, store, limit) {
      const tokens = tokensOf(entryBody(entry))
      const rows = []
      for (const other of store.entries) {
        if (other.id === entry.id || other.status === 'archived') continue
        const sim = similarityOf(entry, other, tokens)
        if (sim.score < 3) continue
        const reasons = []
        if (sim.shared.length) reasons.push('共同标签：' + sim.shared.slice(0, 3).join('、'))
        if (sim.domainOverlap.length) {
          reasons.push('同属领域：' + sim.domainOverlap.map((domain) => DOMAIN_LABEL[domain]).join('、'))
        }
        if (sim.tokenHits) reasons.push('正文主题词重合 ' + sim.tokenHits + ' 个')
        rows.push({
          entryId: other.id,
          title: other.title,
          type: other.type,
          status: other.status,
          score: sim.score,
          scoreLabel: Math.min(96, 40 + sim.score * 4),
          reasons
        })
      }
      rows.sort((left, right) => right.score - left.score)
      return { kind: 'similar', entryId: entry.id, items: rows.slice(0, limit || 5) }
    }

    function assistRelations(entry, store) {
      return {
        kind: 'relations',
        entryId: entry.id,
        items: suggestRelationsFor(entry, store).map((item) => {
          const target = store.entries.find((candidate) => candidate.id === item.targetMemoryId)
          return {
            targetMemoryId: item.targetMemoryId,
            title: target ? target.title : item.targetMemoryId,
            relationType: item.relationType,
            confidence: item.confidence,
            description: item.description,
            reasons: item.reasons,
            alreadyLinked: item.alreadyLinked
          }
        })
      }
    }

    function assistSummary(input, store) {
      let members = []
      let title = '知识总结'
      if (input && Array.isArray(input.ids) && input.ids.length) {
        const wanted = new Set(input.ids)
        members = store.entries.filter((entry) => wanted.has(entry.id))
        title = '选中 ' + members.length + ' 条记忆的主题总结'
      } else if (input && input.collectionId) {
        const collection = store.collections.find((item) => item.id === input.collectionId)
        if (!collection) throw httpError(404, 'not-found', '记忆集合不存在：' + input.collectionId)
        const wanted = new Set(collection.memberIds)
        members = store.entries.filter((entry) => wanted.has(entry.id))
        title = collection.name + '：主题总结'
      } else {
        const projectId = cleanLine(input && input.projectId, 64)
        members = store.entries.filter(
          (entry) => entry.status !== 'archived' && (!projectId || entry.projectId === projectId)
        )
        title = projectId ? '当前项目知识总结' : '全部记忆的知识总结'
      }
      if (!members.length) return { kind: 'summary', title, overview: '这里还没有可以总结的记忆。', bullets: [], themes: [], memberIds: [] }

      const byType = new Map()
      const byStatus = new Map()
      const domainCounts = new Map()
      for (const entry of members) {
        byType.set(entry.type, (byType.get(entry.type) || 0) + 1)
        byStatus.set(entry.status, (byStatus.get(entry.status) || 0) + 1)
        for (const domain of entry.domains) domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1)
      }
      const count = (map) =>
        Array.from(map.entries())
          .sort((left, right) => right[1] - left[1])
          .map(([key, value]) => key + ' ' + value)
      const labelCount = (map, labels) =>
        Array.from(map.entries())
          .sort((left, right) => right[1] - left[1])
          .map(([key, value]) => (labels[key] || key) + ' ' + value + ' 条')

      const decisions = members.filter((entry) => entry.type === 'decision' && entry.status !== 'deprecated').slice(0, 6)
      const openQuestions = members.filter(
        (entry) => entry.type === 'question' || entry.status === 'pending' || entry.status === 'draft'
      ).slice(0, 6)
      const activeRules = members.filter((entry) => entry.type === 'rule' && entry.status === 'active').slice(0, 6)

      const bullets = []
      if (activeRules.length) {
        bullets.push('已生效规则 ' + activeRules.length + ' 条：' + activeRules.map((entry) => entry.title).join(' / '))
      }
      if (decisions.length) {
        bullets.push('已确认决策 ' + decisions.length + ' 条：' + decisions.map((entry) => entry.title).join(' / '))
      }
      if (openQuestions.length) {
        bullets.push('待确认或待解决 ' + openQuestions.length + ' 条：' + openQuestions.map((entry) => entry.title).join(' / '))
      }
      const deprecated = members.filter((entry) => entry.status === 'deprecated')
      if (deprecated.length) {
        bullets.push('已废弃 ' + deprecated.length + ' 条，回顾时注意不要照旧方案执行')
      }

      return {
        kind: 'summary',
        title,
        overview: '共 ' + members.length + ' 条记忆 · ' + labelCount(byType, TYPE_LABEL).join(' · '),
        bullets,
        themes: Array.from(domainCounts.entries())
          .sort((left, right) => right[1] - left[1])
          .slice(0, 6)
          .map(([domain, value]) => ({ label: DOMAIN_LABEL[domain] || domain, count: value })),
        byStatus: count(byStatus),
        memberIds: members.map((entry) => entry.id)
      }
    }

    function assistConflicts(entry, store) {
      const numbers = numbersIn(entryBody(entry))
      const rows = []
      for (const other of store.entries) {
        if (other.id === entry.id || other.status === 'archived') continue
        const shared = shareTags(entry, other)
        const domainOverlap = entry.domains.filter((domain) => other.domains.includes(domain))
        if (!shared.length && !domainOverlap.length) continue
        const otherNumbers = numbersIn(entryBody(other))
        const numberMismatch =
          numbers.length >= 2 &&
          otherNumbers.length >= 2 &&
          numbers.slice(0, 3).join(',') !== otherNumbers.slice(0, 3).join(',')
        const sameTopic =
          shared.length >= 2 && entry.type === other.type && ['rule', 'metric', 'decision'].includes(entry.type)
        if (!numberMismatch && !sameTopic) continue
        const older = String(other.updatedAt || '') < String(entry.updatedAt || '')
        const kind = numberMismatch ? 'number-mismatch' : 'topic-overlap'
        const reasons = []
        if (numberMismatch) {
          reasons.push('数值不一致：本条 ' + numbers.slice(0, 3).join(' / ') + '，旧记忆 ' + otherNumbers.slice(0, 3).join(' / '))
        }
        if (shared.length) reasons.push('共同标签：' + shared.slice(0, 3).join('、'))
        if (domainOverlap.length) reasons.push('同属领域：' + domainOverlap.map((domain) => DOMAIN_LABEL[domain]).join('、'))
        reasons.push(older ? '旧记忆更新于 ' + formatDay(other.updatedAt) + '，可能已被本条替代' : '本条比旧记忆更早，可能是旧方案')
        rows.push({
          entryId: other.id,
          title: other.title,
          type: other.type,
          status: other.status,
          updatedAt: other.updatedAt,
          kind,
          reasons,
          suggestedRelation: older ? 'supersedes' : 'conflicts_with',
          note: '知识会随时间变化，先确认是「替代」还是「适用于不同场景」，再决定关系类型'
        })
      }
      rows.sort((left, right) => (left.kind === 'number-mismatch' ? -1 : 0) - (right.kind === 'number-mismatch' ? -1 : 0))
      return { kind: 'conflicts', entryId: entry.id, items: rows.slice(0, 5) }
    }

    function assistImpact(entry, store) {
      const relate = (relation, other) => ({
        entryId: other ? other.id : '',
        title: other ? other.title : '',
        type: other ? other.type : '',
        relationType: relation.relationType,
        relationLabel: RELATION_LABEL[relation.relationType] || relation.relationType,
        status: relation.status,
        depth: relation.__depth || 1
      })
      const outgoing = []
      const incoming = []
      const seen = new Set([entry.id])
      let frontier = [{ id: entry.id, depth: 0 }]
      while (frontier.length) {
        const next = []
        for (const node of frontier) {
          for (const relation of store.relations) {
            const forward = relation.sourceMemoryId === node.id
            const backward = relation.targetMemoryId === node.id
            if (!forward && !backward) continue
            const otherId = forward ? relation.targetMemoryId : relation.sourceMemoryId
            if (!otherId || seen.has(otherId)) continue
            const other = store.entries.find((candidate) => candidate.id === otherId)
            if (!other) continue
            seen.add(otherId)
            const row = relate(Object.assign({}, relation, { __depth: node.depth + 1 }), other)
            if (forward) outgoing.push(row)
            else incoming.push(row)
            if (node.depth < 1) next.push({ id: otherId, depth: node.depth + 1 })
          }
        }
        frontier = next
      }
      return {
        kind: 'impact',
        entryId: entry.id,
        outgoing,
        incoming,
        note: outgoing.length || incoming.length
          ? '箭头方向代表关系方向：指向本条的是来源/依赖，从本条出发的是影响/细化/替代。'
          : '这条记忆目前还没有和其他记忆建立关系。'
      }
    }

    function runAssist(input, store) {
      const action = cleanLine((input && (input.analysis || input.kind)) || (input && input.action), 24)
      if (action === 'organize' || action === 'similar' || action === 'relations' || action === 'conflicts' || action === 'impact') {
        const entry = mustEntry(store, cleanLine(input && input.id, 64))
        if (action === 'organize') return assistOrganize(entry, store)
        if (action === 'similar') return assistSimilar(entry, store, input && input.limit)
        if (action === 'relations') return assistRelations(entry, store)
        if (action === 'conflicts') return assistConflicts(entry, store)
        return assistImpact(entry, store)
      }
      if (action === 'summary') return assistSummary(input || {}, store)
      throw httpError(400, 'unknown-action', '分析类型必须是 organize / similar / relations / summary / conflicts / impact')
    }

    function formatAssistResult(result, store) {
      const nameOf = (id) => {
        const entry = store.entries.find((item) => item.id === id)
        return entry ? entry.title : id
      }
      if (!result) return '没有可用的分析结果。'
      if (result.kind === 'organize') {
        const lines = [
          '整理建议（不会自动写入）',
          '标题: ' + result.title,
          '摘要: ' + result.summary,
          '类型: ' + (TYPE_LABEL[result.type] || result.type) + '（' + result.typeReason + '）',
          '领域: ' +
            (result.domains.length ? result.domains.map((domain) => DOMAIN_LABEL[domain]).join('、') : '暂时无法判断') +
            '（' + result.domainReason + '）',
          '标签: ' + (result.tags.length ? result.tags.map((tag) => '#' + tag).join(' ') : '暂无')
        ]
        if (result.segments.length) {
          lines.push('', '可以拆成 ' + result.segments.length + ' 条独立记忆：')
          result.segments.forEach((segment, index) => {
            lines.push(
              '  ' + (index + 1) + '. ' + segment.title + ' [' + (TYPE_LABEL[segment.type] || segment.type) + ']',
              '     ' + segment.content.split('\n')[0].slice(0, 90)
            )
          })
        }
        if (result.relations.length) {
          lines.push('', '可能的关系：')
          result.relations.forEach((item) => {
            lines.push(
              '  → ' + nameOf(item.targetMemoryId) + ' · ' + (RELATION_LABEL[item.relationType] || item.relationType) +
                ' · 把握 ' + Math.round(item.confidence * 100) + '%'
            )
          })
        }
        if (result.collections.length) {
          lines.push('', '可能属于的集合：')
          result.collections.forEach((item) => lines.push('  ◈ ' + item.name + '（' + item.reason + '）'))
        }
        return lines.join('\n')
      }
      if (result.kind === 'similar') {
        if (!result.items.length) return '没有找到内容相近的记忆。'
        return (
          '相近记忆：\n' +
          result.items
            .map(
              (item, index) =>
                '  ' + (index + 1) + '. ' + item.title + ' · ' + item.scoreLabel + '%\n     ' + item.reasons.join('；')
            )
            .join('\n')
        )
      }
      if (result.kind === 'relations') {
        if (!result.items.length) return '没有找到可以推荐的关系。'
        return (
          '推荐关系：\n' +
          result.items
            .map(
              (item) =>
                '  → ' + item.title + ' · ' + (RELATION_LABEL[item.relationType] || item.relationType) +
                ' · 把握 ' + Math.round(item.confidence * 100) + '%' +
                (item.alreadyLinked ? '（已有关系）' : '') +
                '\n     理由: ' + item.description
            )
            .join('\n')
        )
      }
      if (result.kind === 'summary') {
        const lines = [result.title, result.overview]
        if (result.bullets.length) {
          lines.push('')
          result.bullets.forEach((bullet) => lines.push('· ' + bullet))
        }
        if (result.themes.length) {
          lines.push('', '主题分布: ' + result.themes.map((theme) => theme.label + ' ' + theme.count).join(' · '))
        }
        return lines.join('\n')
      }
      if (result.kind === 'conflicts') {
        if (!result.items.length) return '没有发现明显的冲突或替代关系。'
        return (
          '需要确认的记忆：\n' +
          result.items
            .map(
              (item) =>
                '  · ' + item.title + '（' + formatDay(item.updatedAt) + '）\n     ' +
                item.reasons.join('；') +
                '\n     可能的关系: ' + (RELATION_LABEL[item.suggestedRelation] || item.suggestedRelation)
            )
            .join('\n') +
          '\n' + result.note
        )
      }
      if (result.kind === 'impact') {
        const lines = ['上下游分析：' + nameOf(result.entryId)]
        if (result.incoming.length) {
          lines.push('', '来源 / 依赖这条记忆：')
          result.incoming.forEach((item) => {
            lines.push('  ← ' + item.title + ' · ' + item.relationLabel + ' · 第 ' + item.depth + ' 层')
          })
        }
        if (result.outgoing.length) {
          lines.push('', '受这条记忆影响：')
          result.outgoing.forEach((item) => {
            lines.push('  → ' + item.title + ' · ' + item.relationLabel + ' · 第 ' + item.depth + ' 层')
          })
        }
        if (!result.incoming.length && !result.outgoing.length) lines.push('', result.note)
        return lines.join('\n')
      }
      return '未知的分析结果。'
    }
// --------------------------------------------------------------- evolve
// Ratchet-style memory evolution: observe -> compare -> propose/revise ->
// version + evidence -> relations. Every mutation here is deterministic and
// keeps an audit trail; nothing is ever silently overwritten.

function unique(list) {
  return Array.from(new Set(Array.isArray(list) ? list : []))
}

function memoryText(entry) {
  return String((entry && (entry.content || entry.summary || entry.title)) || '')
}

function tokensForEntry(entry) {
  return tokensOf(memoryText(entry))
}

function relationKeyOf(sourceId, targetId, relationType) {
  return sourceId + '\u0000' + targetId + '\u0000' + relationType
}

function relationsTouching(store, entryId) {
  return store.relations.filter(
    (relation) => relation.sourceMemoryId === entryId || relation.targetMemoryId === entryId
  )
}

// A relation the user explicitly rejected must never be recreated by the
// engine: the rejected row stays in the store as a tombstone.
function relationTombstoned(store, sourceId, targetId, relationType) {
  return store.relations.some(
    (relation) =>
      relation.sourceMemoryId === sourceId &&
      relation.targetMemoryId === targetId &&
      relation.relationType === relationType &&
      relation.status === 'rejected'
  )
}

function hasRelation(store, sourceId, targetId, relationType) {
  return store.relations.some(
    (relation) =>
      relation.sourceMemoryId === sourceId &&
      relation.targetMemoryId === targetId &&
      (!relationType || relation.relationType === relationType) &&
      relation.status !== 'rejected'
  )
}

function storeEntry(store, id) {
  return store.entries.find((entry) => entry.id === id) || null
}

function pushVersion(entry, change) {
  const at = isIsoDate(change.at) ? change.at : isoNow()
  const version = {
    id: newVersionId(),
    memoryId: entry.id,
    version: entry.versions.length + 1,
    title: change.title !== undefined ? change.title : entry.title,
    content: change.content !== undefined ? change.content : entry.content,
    changeType: normalizeChangeType(change.changeType),
    changeReason: cleanText(change.changeReason, LIMITS.versionNote),
    evidenceIds: Array.isArray(change.evidenceIds) ? change.evidenceIds : [],
    sourceConversation: cleanLine(change.sourceConversation, 120),
    createdAt: at,
    createdBy: cleanLine(change.createdBy, 40) || 'ai'
  }
  entry.versions.push(version)
  if (entry.versions.length > LIMITS.versions) {
    entry.versions = entry.versions.slice(-LIMITS.versions)
  }
  entry.currentVersion = entry.versions.length
  entry.updatedAt = version.createdAt
  return version
}

function addEvidence(entry, input) {
  const record = normalizeEvidence(input, entry.id, isoNow())
  if (!record) return null
  const duplicate = entry.evidence.find(
    (item) => item.content === record.content && item.sourceConversation === record.sourceConversation
  )
  if (duplicate) return duplicate
  entry.evidence.push(record)
  if (entry.evidence.length > LIMITS.evidence) {
    entry.evidence = entry.evidence.slice(-LIMITS.evidence)
  }
  entry.evidenceCount = entry.evidence.length
  return record
}

function pendingProposalFor(store, memoryId, changeType) {
  return (
    store.proposals.find(
      (proposal) =>
        proposal.memoryId === memoryId &&
        proposal.status === 'pending' &&
        (!changeType || proposal.changeType === changeType)
    ) || null
  )
}

function createProposal(state, entry, change) {
  const proposed = cleanText(change.content, LIMITS.body)
  if (!proposed || proposed === entry.content) return null
  const existing = pendingProposalFor(state, entry.id, change.changeType)
  if (existing) {
    existing.oldContent = entry.content
    existing.proposedContent = proposed
    existing.title = change.title !== undefined ? cleanLine(change.title, LIMITS.title) : existing.title
    existing.reason = cleanText(change.reason, LIMITS.proposalNote)
    existing.evidenceIds = Array.isArray(change.evidenceIds) ? change.evidenceIds.slice(0, 12) : existing.evidenceIds
    existing.confidence = clamp01(change.confidence, existing.confidence)
    existing.createdAt = isoNow()
    return existing
  }
  const proposal = {
    id: newProposalId(),
    memoryId: entry.id,
    title: change.title !== undefined ? cleanLine(change.title, LIMITS.title) : entry.title,
    oldContent: entry.content,
    proposedContent: proposed,
    changeType: normalizeChangeType(change.changeType),
    reason: cleanText(change.reason, LIMITS.proposalNote),
    evidenceIds: Array.isArray(change.evidenceIds) ? change.evidenceIds.slice(0, 12) : [],
    confidence: clamp01(change.confidence, 0.6),
    status: 'pending',
    createdAt: isoNow(),
    decidedAt: '',
    createdBy: 'ai'
  }
  state.proposals.unshift(proposal)
  if (state.proposals.length > LIMITS.proposals) {
    state.proposals = state.proposals.slice(0, LIMITS.proposals)
  }
  return proposal
}

// Decide whether a change may be applied directly or must wait for the user.
function revisionMode(entry, change, options) {
  const force = Boolean(options && options.force)
  if (force) return 'apply'
  if (entry.protectionLevel === 'protected') return 'propose'
  if (change.changeType === 'conflict') return 'propose'
  if (entry.status === 'active' && entry.protectionLevel === 'confirmed' && change.changeType === 'correct') {
    return 'propose'
  }
  return 'apply'
}

// Apply one ratchet step. Returns { mode, entry, version, proposal, evidence }.
function reviseEntry(state, entry, change, options) {
  const evidence = change.evidence ? addEvidence(entry, change.evidence) : null
  const mode = revisionMode(entry, change, options)
  if (mode === 'propose') {
    const proposal = createProposal(state, entry, {
      title: change.title,
      content: change.content,
      changeType: change.changeType,
      reason: change.reason,
      evidenceIds: evidence ? [evidence.id] : change.evidenceIds,
      confidence: change.confidence
    })
    if (!proposal) {
      // 观察到的内容没有带来实际变化（只是重复确认），保留证据即可。
      return { mode: 'noop', entry, proposal: null, evidence }
    }
    if (entry.status === 'active' && entry.protectionLevel !== 'protected') {
      entry.status = 'review'
    }
    return { mode: 'proposed', entry, proposal, evidence }
  }
  if (change.title !== undefined && change.title !== entry.title) {
    entry.title = cleanLine(change.title, LIMITS.title) || entry.title
  }
  if (change.content !== undefined && change.content !== entry.content) {
    entry.content = cleanText(change.content, LIMITS.body)
  }
  if (change.summary !== undefined) {
    entry.summary = cleanText(change.summary, LIMITS.summary) || deriveSummary(entry.content, entry.title)
  } else if (change.content !== undefined) {
    entry.summary = deriveSummary(entry.content, entry.title)
  }
  if (Array.isArray(change.tags)) entry.tags = normalizeTags(change.tags.concat(entry.tags))
  if (Array.isArray(change.domains)) entry.domains = normalizeDomains(change.domains.concat(entry.domains))
  if (change.type) entry.type = normalizeType(change.type)
  if (change.confidence !== undefined) entry.confidence = clamp01(change.confidence, entry.confidence)
  if (change.status) entry.status = normalizeStatus(change.status)
  const version = pushVersion(entry, {
    title: entry.title,
    content: entry.content,
    changeType: change.changeType,
    changeReason: change.reason,
    evidenceIds: evidence ? [evidence.id] : change.evidenceIds,
    sourceConversation: change.sourceConversation,
    createdBy: change.createdBy || 'ai'
  })
  entry.evidenceCount = entry.evidence.length
  return { mode: 'applied', entry, version, evidence }
}

// Incremental relation suggestions: semantic overlap only, and never
// resurrect a relation the user rejected.
function autoRelate(state, entry, options) {
  const created = []
  if (!entry) return created
  const candidates = suggestRelationsFor(entry, state)
  const limit = (options && options.limit) || 4
  for (const item of candidates) {
    if (created.length >= limit) break
    if (item.alreadyLinked) continue
    if (relationTombstoned(state, entry.id, item.targetMemoryId, item.relationType)) continue
    if (relationTombstoned(state, item.targetMemoryId, entry.id, item.relationType)) continue
    if (hasRelation(state, entry.id, item.targetMemoryId, item.relationType)) continue
    if (item.confidence < 0.45) continue
    const relation = {
      id: newRelationId(),
      sourceMemoryId: entry.id,
      targetMemoryId: item.targetMemoryId,
      relationType: normalizeRelationType(item.relationType),
      description: cleanText(item.description, LIMITS.relationNote),
      status: 'suggested',
      confidence: clamp01(item.confidence, 0.5),
      evidence: item.reasons && item.reasons.length ? item.reasons.join('；') : '',
      source: 'ai',
      createdBy: 'ai',
      createdAt: isoNow(),
      updatedAt: isoNow()
    }
    state.relations.push(relation)
    created.push(relation)
    if (state.relations.length >= LIMITS.relations) {
      state.relations = state.relations.slice(-LIMITS.relations)
    }
  }
  return created
}

function splitObservations(text) {
  const raw = String(text || '').trim()
  if (!raw) return []
  const blocks = raw
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  const pieces = []
  for (const block of blocks) {
    const sentences = splitSentences(block).filter((line) => line.length >= 10)
    if (sentences.length >= 2) {
      for (const sentence of sentences) pieces.push(sentence)
    } else {
      pieces.push(block)
    }
  }
  const merged = []
  for (const piece of pieces) {
    const last = merged[merged.length - 1]
    if (last && last.length + piece.length <= 420) {
      merged[merged.length - 1] = last + ' ' + piece
    } else {
      merged.push(piece)
    }
  }
  return merged
    .map((piece) => cleanText(piece, 900))
    .filter((piece) => piece.length >= 12)
    .slice(0, LIMITS.observeCandidates)
}

function numbersSignature(text) {
  const found = String(text || '').match(/\d+(?:\.\d+)?/g) || []
  return new Set(found)
}

function pickChangeType(existing, candidate, seed) {
  const existingTokens = tokensForEntry(existing)
  const candidateTokens = tokensOf(candidate)
  const overlap = overlapCount(existingTokens, candidateTokens)
  const existingNumbers = numbersSignature(memoryText(existing))
  const candidateNumbers = numbersSignature(candidate)
  let sharedNumbers = 0
  for (const value of candidateNumbers) {
    if (existingNumbers.has(value)) sharedNumbers += 1
  }
  if (candidateNumbers.size && !sharedNumbers) return 'conflict'
  if (overlap <= 2) return 'conflict'
  if (candidate.length > memoryText(existing).length * 1.15) return 'augment'
  if (seed && seed.type && seed.type !== existing.type) return 'refine'
  return 'refine'
}

function composeContent(existing, candidate) {
  const base = String(existing || '').trim()
  const extra = String(candidate || '').trim()
  if (!base) return extra
  if (!extra) return base
  if (base.indexOf(extra) >= 0) return base
  // 新内容把整条旧内容包了进去：以新内容为准，别当成没变化。
  if (extra.indexOf(base) >= 0) return extra
  return base + '\n\n' + extra
}

// Automatic observation. Turns conversation text into memory candidates,
// merges into existing memories when they are clearly the same topic, and
// leaves uncertain changes as proposals or candidates for the user.
function observeMemories(state, input) {
  const text = cleanText(
    input && (input.text || (Array.isArray(input.messages) ? input.messages.join('\n') : '')),
    LIMITS.observeText
  )
  if (!text) throw httpError(400, 'empty-observation', '需要提供要观察的对话内容')
  const conversationId = cleanLine(input.conversationId, 120)
  const projectId = resolveProjectId(state, input.projectId)
  const autoCreate = input.autoCreate !== false
  const protectedOnly = Boolean(input.protectedOnly)
  const candidates = splitObservations(text)
  const result = { created: [], updated: [], proposed: [], reinforced: [], skipped: [], relations: [] }

  for (const candidate of candidates) {
    const seed = suggestEntry({ content: candidate, projectId, titleHint: input.titleHint }, state)
    let best = null
    let bestScore = 0
    const probe = { content: candidate, tags: seed.tags, domains: seed.domains, title: seed.title }
    const probeTokens = tokensOf(candidate)
    for (const entry of state.entries) {
      if (entry.status === 'archived') continue
      if (entry.projectId !== projectId && entry.scope !== 'global') continue
      const sim = similarityOf(probe, entry, probeTokens)
      if (sim.score > bestScore) {
        bestScore = sim.score
        best = entry
      }
    }

    const evidence = {
      memoryId: '',
      sourceConversation: conversationId || 'conversation',
      sourceMessage: '',
      content: candidate,
      evidenceType: input.evidenceType || 'statement',
      confidence: input.confidence === undefined ? 0.7 : clamp01(input.confidence, 0.7)
    }

    if (best && bestScore >= 5) {
      const matchTokens = tokensForEntry(best)
      const candidateTokens = tokensOf(candidate)
      const existingIsSubset = overlapCount(candidateTokens, matchTokens) >= candidateTokens.size * 0.8
      if (existingIsSubset) {
        addEvidence(best, evidence)
        result.reinforced.push({ id: best.id, title: best.title })
        continue
      }
      const changeType = pickChangeType(best, candidate, seed)
      if (protectedOnly && best.protectionLevel !== 'protected') {
        result.skipped.push({ id: best.id, title: best.title, reason: '仅观察固有约定' })
        continue
      }
      const revision = reviseEntry(
        state,
        best,
        {
          // 冲突时把「新说法」原样交给用户判断，不擅自把两段拼在一起。
          content: changeType === 'conflict' ? candidate : composeContent(best.content, candidate),
          changeType,
          reason:
            changeType === 'conflict'
              ? '新对话的说法与现有记忆不一致：接受会以新说法替换正文，拒绝则保留原约定。'
              : '从对话中补充了一条更具体的信息。',
          evidence,
          sourceConversation: conversationId,
          confidence: evidence.confidence * 0.95,
          tags: seed.tags,
          domains: seed.domains
        },
        {}
      )
      if (revision.mode === 'proposed') {
        result.proposed.push({ id: best.id, title: best.title, proposalId: revision.proposal && revision.proposal.id })
      } else if (revision.mode === 'noop') {
        result.reinforced.push({ id: best.id, title: best.title })
      } else {
        result.updated.push({ id: best.id, title: best.title, changeType })
        for (const relation of autoRelate(state, best, { limit: 2 })) {
          result.relations.push({ id: relation.id, from: relation.sourceMemoryId, to: relation.targetMemoryId })
        }
      }
      continue
    }

    if (!autoCreate) {
      result.skipped.push({ title: seed.title, reason: '没有匹配到已有记忆，且未开启自动新建' })
      continue
    }
    const now = isoNow()
    const entry = normalizeEntry(
      {
        title: seed.title,
        content: candidate,
        type: seed.type,
        domains: seed.domains,
        tags: seed.tags,
        status: 'pending',
        scope: 'project',
        projectId,
        source: { kind: 'ai', label: '自动观察' + (conversationId ? '：' + conversationId : '') },
        confidence: evidence.confidence,
        importance: 0.5,
        protectionLevel: 'normal',
        evidence: [evidence]
      },
      new Set(state.projects.map((project) => project.id)),
      now
    )
    entry.createdAt = now
    entry.sourceConversation = conversationId
    state.entries.unshift(entry)
    result.created.push({ id: entry.id, title: entry.title, type: entry.type })
    for (const relation of autoRelate(state, entry, { limit: 3 })) {
      result.relations.push({ id: relation.id, from: relation.sourceMemoryId, to: relation.targetMemoryId })
    }
  }
  return result
}

// Deterministic recall: rank by keyword overlap, protection, confidence,
// importance and recency. Frequency only nudges ranking, never deletes.
function rankRecall(state, input) {
  const task = cleanText(input && input.task, LIMITS.recallTask)
  if (!task) throw httpError(400, 'empty-task', '需要提供当前任务或问题')
  const projectId = cleanLine(input && input.projectId, 64) || ''
  const frameId = cleanLine(input && (input.frameId || input.frame), 64)
  // 指定记忆区时，先把它（含嵌套子框）范围的记忆圈出来，再在这个范围里排序。
  const scopeIds = frameId ? frameSubtree(state, frameId).entryIds : null
  const limit = Math.max(1, Math.min(20, Number(input && input.limit) || 6))
  const tokens = tokensOf(task)
  const rows = []
  for (const entry of state.entries) {
    if (entry.status === 'archived' || entry.status === 'deprecated') continue
    if (scopeIds && !scopeIds.has(entry.id)) continue
    const entryTokens = tokensForEntry(entry)
    let hits = overlapCount(tokens, entryTokens)
    for (const tag of entry.tags) {
      if (task.indexOf(tag) >= 0) hits += 2
    }
    if (!hits && entry.protectionLevel !== 'protected') continue
    let tier = 4
    if (entry.protectionLevel === 'protected' && (entry.projectId === projectId || entry.scope === 'global')) tier = 1
    else if (entry.projectId === projectId) tier = 2
    else if (entry.scope === 'global' || entry.type === 'habit') tier = 3
    const statusBonus = entry.status === 'active' ? 1.2 : entry.status === 'review' ? 0.4 : 0
    const protectionBonus = entry.protectionLevel === 'protected' ? 1.6 : entry.protectionLevel === 'confirmed' ? 0.8 : 0
    const recency = entry.updatedAt ? Math.max(0, 1 - (Date.now() - Date.parse(entry.updatedAt)) / (1000 * 60 * 60 * 24 * 365)) : 0
    const score = hits * 3 + (entry.importance || 0.5) * 2 + (entry.confidence || 0.5) + statusBonus + protectionBonus + recency
    const reasons = []
    if (hits) reasons.push('命中 ' + hits + ' 处任务相关词')
    if (entry.protectionLevel === 'protected') reasons.push('固有约定，需明确遵守')
    if (entry.status === 'active') reasons.push('当前生效')
    if (entry.type === 'habit') reasons.push('长期习惯')
    if (entry.lastUsedAt) reasons.push('最近调用过')
    rows.push({
      entryId: entry.id,
      title: entry.title,
      type: entry.type,
      status: entry.status,
      protectionLevel: entry.protectionLevel,
      projectId: entry.projectId,
      confidence: entry.confidence,
      importance: entry.importance,
      score: Number(score.toFixed(2)),
      tier,
      reasons,
      updatedAt: entry.updatedAt
    })
  }
  rows.sort((left, right) => left.tier - right.tier || right.score - left.score)
  return { kind: 'recall', task, projectId, items: rows.slice(0, limit), total: rows.length }
}

function recordRecall(state, input, ranked) {
  const ids = Array.isArray(input && input.ids) && input.ids.length
    ? input.ids.filter((id) => storeEntry(state, id))
    : (ranked ? ranked.items.map((item) => item.entryId) : [])
  const now = isoNow()
  for (const id of ids) {
    const entry = storeEntry(state, id)
    if (!entry) continue
    entry.usageCount = (entry.usageCount || 0) + 1
    entry.lastUsedAt = now
  }
  const recall = normalizeRecall(
    {
      task: (input && input.task) || (ranked && ranked.task) || '',
      projectId: (input && input.projectId) || (ranked && ranked.projectId) || '',
      ids,
      outcome: (input && input.outcome) || 'served',
      note: (input && input.note) || '',
      source: (input && input.source) || 'agent',
      at: now
    },
    now
  )
  if (recall) {
    state.recalls.unshift(recall)
    if (state.recalls.length > LIMITS.recalls) {
      state.recalls = state.recalls.slice(0, LIMITS.recalls)
    }
  }
  return { recall, updated: ids }
}

// Tidy-up payload for the management center: duplicates, orphans, conflicts,
// pending proposals. Read-only.
function tidyReport(state) {
  const duplicates = []
  const entries = state.entries.filter((entry) => entry.status !== 'archived')
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      const left = entries[i]
      const right = entries[j]
      if (left.type !== right.type) continue
      const shared = shareTags(left, right)
      const leftTokens = tokensForEntry(left)
      const sim = similarityOf(left, right, leftTokens)
      if (shared.length >= 2 && sim.score >= 8) {
        duplicates.push({
          a: { id: left.id, title: left.title },
          b: { id: right.id, title: right.title },
          score: sim.score,
          reason: '共同标签 ' + shared.length + ' 个，正文主题词重合 ' + sim.tokenHits + ' 个'
        })
      }
    }
  }
  const linked = new Set()
  for (const relation of state.relations) {
    if (relation.status === 'rejected') continue
    linked.add(relation.sourceMemoryId)
    linked.add(relation.targetMemoryId)
  }
  const orphans = entries
    .filter((entry) => !linked.has(entry.id))
    .map((entry) => ({ id: entry.id, title: entry.title, type: entry.type }))
  const pendingProposals = state.proposals
    .filter((proposal) => proposal.status === 'pending')
    .map((proposal) => {
      const entry = findEntry(state, proposal.memoryId)
      return {
        id: proposal.id,
        memoryId: proposal.memoryId,
        title: (entry && entry.title) || proposal.title,
        changeType: proposal.changeType,
        reason: proposal.reason,
        protected: Boolean(entry && entry.protectionLevel === 'protected'),
        createdAt: proposal.createdAt
      }
    })
  const suggestedRelations = state.relations
    .filter((relation) => relation.status === 'suggested')
    .map((relation) => {
      const source = findEntry(state, relation.sourceMemoryId)
      const target = findEntry(state, relation.targetMemoryId)
      return {
        id: relation.id,
        sourceMemoryId: relation.sourceMemoryId,
        targetMemoryId: relation.targetMemoryId,
        sourceTitle: source ? source.title : '',
        targetTitle: target ? target.title : '',
        relationType: relation.relationType,
        confidence: relation.confidence,
        source: relation.source
      }
    })
  return {
    kind: 'tidy',
    duplicates: duplicates.slice(0, 8),
    orphans: orphans.slice(0, 12),
    pendingProposals,
    suggestedRelations: suggestedRelations.slice(0, 30),
    pendingRelations: suggestedRelations.length,
    pendingMemories: state.entries.filter((entry) => entry.status === 'pending').length,
    reviewMemories: state.entries.filter((entry) => entry.status === 'review').length,
    protectedCount: state.entries.filter((entry) => entry.protectionLevel === 'protected').length
  }
}

// Merge several memories into one, keeping relations, collections and history.
function mergeMemories(state, input) {
  const ids = Array.isArray(input && input.ids) ? unique(input.ids.map((id) => cleanLine(id, 64))) : []
  if (ids.length < 2) throw httpError(400, 'need-two', '合并至少需要两条记忆')
  const targetId = cleanLine(input && input.targetId, 64) || ids[0]
  const target = mustEntry(state, targetId)
  if (target.protectionLevel === 'protected' && !(input && input.force)) {
    throw httpError(409, 'protected', '「' + target.title + '」是固有约定，请先解除保护再合并')
  }
  const removed = []
  const tags = new Set(target.tags)
  const domains = new Set(target.domains)
  const blocks = [target.content]
  for (const id of ids) {
    if (id === targetId) continue
    const entry = mustEntry(state, id)
    if (entry.protectionLevel === 'protected' && !(input && input.force)) {
      throw httpError(409, 'protected', '「' + entry.title + '」是固有约定，请先解除保护再合并')
    }
    for (const tag of entry.tags) tags.add(tag)
    for (const domain of entry.domains) domains.add(domain)
    blocks.push('## ' + entry.title + '\n' + entry.content)
    for (const relation of state.relations) {
      if (relation.sourceMemoryId === entry.id) relation.sourceMemoryId = targetId
      if (relation.targetMemoryId === entry.id) relation.targetMemoryId = targetId
    }
    for (const collection of state.collections) {
      const index = collection.memberIds.indexOf(entry.id)
      if (index >= 0) {
        collection.memberIds.splice(index, 1)
        if (collection.memberIds.indexOf(targetId) < 0) collection.memberIds.push(targetId)
      }
    }
    for (const proposal of state.proposals) {
      if (proposal.memoryId === entry.id) proposal.memoryId = targetId
    }
    target.evidence = target.evidence.concat(entry.evidence).slice(-LIMITS.evidence)
    target.evidenceCount = target.evidence.length
    removed.push(entry.id)
    state.entries = state.entries.filter((candidate) => candidate.id !== entry.id)
  }
  const deduped = []
  const seen = new Set()
  for (const relation of state.relations) {
    if (relation.sourceMemoryId === relation.targetMemoryId) continue
    const key = relationKeyOf(relation.sourceMemoryId, relation.targetMemoryId, relation.relationType)
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(relation)
  }
  state.relations = deduped
  target.tags = normalizeTags(Array.from(tags))
  target.domains = normalizeDomains(Array.from(domains))
  target.content = blocks.filter(Boolean).join('\n\n')
  target.summary = deriveSummary(target.content, target.title)
  pushVersion(target, {
    title: target.title,
    content: target.content,
    changeType: 'merge',
    changeReason: '合并了 ' + removed.length + ' 条重复记忆',
    createdBy: 'user'
  })
  return { entry: target, merged: removed, restored: false }
}


function httpError(status, code, message) {
  const error = new Error(message || code)
  error.statusCode = status
  error.code = code
  return error
}

function findEntry(store, id) {
  const key = cleanLine(id, 64)
  return store.entries.find((entry) => entry.id === key) || null
}

function mustEntry(store, id) {
  const entry = findEntry(store, id)
  if (!entry) throw httpError(404, 'entry-not-found', '记忆不存在：' + id)
  return entry
}

function findCollection(store, id) {
  const key = cleanLine(id, 64)
  return store.collections.find((collection) => collection.id === key) || null
}

function mustCollection(store, id) {
  const collection = findCollection(store, id)
  if (!collection) throw httpError(404, 'collection-not-found', '记忆集合不存在：' + id)
  return collection
}

function touchEntry(entry, note) {
  const now = isoNow()
  entry.updatedAt = now
  if (note) {
    entry.history.unshift({ at: now, note: cleanText(note, 200) })
    entry.history = entry.history.slice(0, LIMITS.history)
  }
}

function resolveProjectId(store, raw) {
  const id = cleanLine(raw, 64)
  if (id && store.projects.some((project) => project.id === id)) return id
  return store.projects[0] ? store.projects[0].id : DEFAULT_PROJECT_ID
}

function saveEntry(store, input) {
  const isUpdate = Boolean(input && input.id)
  let entry = isUpdate ? mustEntry(store, input.id) : null
  const content = cleanText(input.content !== undefined ? input.content : input.body, LIMITS.body)
  const legacySummary = cleanText(input.summary, LIMITS.summary)
  const now = isoNow()
  if (!entry) {
    if (!content && !cleanLine(input.title, LIMITS.title)) {
      throw httpError(400, 'empty-entry', '至少需要标题或正文')
    }
    const status = normalizeStatus(input.status || 'draft')
    entry = {
      id: newEntryId(),
      title: cleanLine(input.title, LIMITS.title) || suggestTitle(content),
      summary: legacySummary || deriveSummary(content, ''),
      content,
      type: normalizeType(input.type),
      domains: normalizeDomains(input.domains),
      tags: normalizeTags(input.tags),
      status,
      scope: normalizeScope(input.scope),
      projectId: resolveProjectId(store, input.projectId),
      confidence: clamp01(input.confidence, status === 'active' ? 0.85 : 0.6),
      importance: clamp01(input.importance, 0.5),
      protectionLevel: normalizeProtection(input.protectionLevel, status),
      source: normalizeSource(input.source),
      facts: normalizeFacts(input.facts),
      pinned: Boolean(input.pinned),
      favorite: Boolean(input.favorite),
      usageCount: 0,
      lastUsedAt: '',
      evidenceCount: 0,
      currentVersion: 1,
      supersededBy: '',
      expiresAt: isIsoDate(input.expiresAt) ? input.expiresAt : '',
      versions: [],
      evidence: [],
      createdAt: now,
      updatedAt: now,
      history: [{ at: now, note: '创建' }]
    }
    pushVersion(entry, {
      title: entry.title,
      content: entry.content,
      changeType: 'create',
      changeReason: cleanText(input.note, LIMITS.versionNote) || '创建记忆',
      sourceConversation: cleanLine(input.sourceConversation, 120),
      createdBy: cleanLine(input.createdBy, 40) || 'user',
      at: now
    })
    if (input.source && input.source.label) {
      addEvidence(entry, {
        content: cleanText(input.evidence || input.source.label, LIMITS.evidenceNote),
        sourceConversation: cleanLine(input.sourceConversation, 120),
        evidenceType: EVIDENCE_TYPES.includes(input.evidenceType) ? input.evidenceType : 'statement',
        confidence: clamp01(input.confidence, 0.7)
      })
    }
    entry.evidenceCount = entry.evidence.length
    store.entries.unshift(entry)
    return { entry, created: true }
  }

  const contentChanged =
    (input.content !== undefined || input.body !== undefined) && content !== entry.content
  if (entry.protectionLevel === 'protected' && contentChanged && !input.force) {
    throw httpError(
      409,
      'protected',
      '「' + entry.title + '」是固有约定，需要先解除保护或明确要求修改才能改动正文'
    )
  }
  const snapshotOf = () =>
    JSON.stringify([
      entry.title,
      entry.content,
      entry.summary,
      entry.type,
      entry.status,
      entry.domains,
      entry.tags,
      entry.facts,
      entry.projectId,
      entry.source,
      entry.pinned,
      entry.favorite,
      entry.scope,
      entry.protectionLevel,
      entry.confidence,
      entry.importance
    ])
  const before = snapshotOf()
  const titleChanged = input.title !== undefined && cleanLine(input.title, LIMITS.title) !== entry.title
  if (titleChanged) entry.title = cleanLine(input.title, LIMITS.title) || entry.title
  if (contentChanged) {
    entry.content = content
    if (!legacySummary) entry.summary = deriveSummary(content, entry.title)
  }
  if (legacySummary) entry.summary = legacySummary
  if (input.type !== undefined) entry.type = normalizeType(input.type)
  if (input.domains !== undefined) entry.domains = normalizeDomains(input.domains)
  if (input.tags !== undefined) entry.tags = normalizeTags(input.tags)
  if (input.status !== undefined) entry.status = normalizeStatus(input.status)
  if (input.scope !== undefined) entry.scope = normalizeScope(input.scope)
  if (input.projectId !== undefined) entry.projectId = resolveProjectId(store, input.projectId)
  if (input.confidence !== undefined) entry.confidence = clamp01(input.confidence, entry.confidence)
  if (input.importance !== undefined) entry.importance = clamp01(input.importance, entry.importance)
  if (input.protectionLevel !== undefined) {
    entry.protectionLevel = normalizeProtection(input.protectionLevel, entry.status)
  }
  if (input.expiresAt !== undefined) entry.expiresAt = isIsoDate(input.expiresAt) ? input.expiresAt : ''
  if (input.source !== undefined) entry.source = normalizeSource(input.source)
  if (input.facts !== undefined) entry.facts = normalizeFacts(input.facts)
  if (input.pinned !== undefined) entry.pinned = Boolean(input.pinned)
  if (input.favorite !== undefined) entry.favorite = Boolean(input.favorite)
  const after = snapshotOf()
  if (after !== before) {
    if (titleChanged || contentChanged) {
      pushVersion(entry, {
        title: entry.title,
        content: entry.content,
        changeType: normalizeChangeType(input.changeType || 'refine'),
        changeReason: cleanText(input.note, LIMITS.versionNote) || '编辑内容',
        sourceConversation: cleanLine(input.sourceConversation, 120),
        createdBy: cleanLine(input.createdBy, 40) || 'user'
      })
      if (input.evidence) {
        addEvidence(entry, {
          content: cleanText(input.evidence, LIMITS.evidenceNote),
          sourceConversation: cleanLine(input.sourceConversation, 120),
          evidenceType: EVIDENCE_TYPES.includes(input.evidenceType) ? input.evidenceType : 'statement',
          confidence: clamp01(input.confidence, 0.7)
        })
      }
      entry.evidenceCount = entry.evidence.length
    }
    touchEntry(entry, cleanText(input.note, 200) || '编辑内容')
  }
  return { entry, created: false }
}

function deleteEntry(store, id) {
  const entry = mustEntry(store, id)
  store.entries = store.entries.filter((item) => item.id !== entry.id)
  store.relations = store.relations.filter(
    (relation) => relation.sourceMemoryId !== entry.id && relation.targetMemoryId !== entry.id
  )
  for (const collection of store.collections) {
    collection.memberIds = collection.memberIds.filter((memberId) => memberId !== entry.id)
  }
  if (Array.isArray(store.frames)) {
    for (const frame of store.frames) {
      frame.memberIds = frame.memberIds.filter((memberId) => memberId !== entry.id)
    }
  }
  if (store.layout && store.layout.positions) delete store.layout.positions[entry.id]
  return { deleted: entry.id, title: entry.title }
}

function setEntryStatus(store, input) {
  const entry = mustEntry(store, input.id)
  const status = normalizeStatus(input.status)
  if (entry.status === status) return { entry }
  entry.status = status
  touchEntry(entry, '状态改为「' + STATUS_LABEL[status] + '」' + (cleanLine(input.note, 200) ? '：' + cleanLine(input.note, 200) : ''))
  return { entry }
}

function setEntryFlag(store, input, field) {
  const entry = mustEntry(store, input.id)
  if (input[field] === undefined) return { entry }
  entry[field] = Boolean(input[field])
  touchEntry(entry, (field === 'pinned' ? '置顶' : '收藏') + (entry[field] ? '' : '取消'))
  return { entry }
}

function bulkEntries(store, input) {
  const ids = Array.isArray(input.ids) ? input.ids.map((id) => cleanLine(id, 64)).filter(Boolean) : []
  const targets = store.entries.filter((entry) => ids.includes(entry.id))
  if (!targets.length) throw httpError(400, 'empty-selection', '没有选中任何记忆')
  const op = String(input.op || '')
  const idset = targets.map((entry) => entry.id)
  if (op === 'status') {
    const status = normalizeStatus(input.value)
    for (const entry of targets) {
      entry.status = status
      touchEntry(entry, '批量改为「' + STATUS_LABEL[status] + '」')
    }
    return { affected: idset.length, op, value: status }
  }
  if (op === 'project') {
    const projectId = resolveProjectId(store, input.value)
    for (const entry of targets) {
      entry.projectId = projectId
      touchEntry(entry, '批量移动到项目')
    }
    return { affected: idset.length, op, value: projectId }
  }
  if (op === 'favorite' || op === 'pin') {
    const field = op === 'favorite' ? 'favorite' : 'pinned'
    const value = input.value === undefined ? true : Boolean(input.value)
    for (const entry of targets) {
      entry[field] = value
      touchEntry(entry, (field === 'favorite' ? '收藏' : '置顶') + (value ? '' : '取消'))
    }
    return { affected: idset.length, op, value }
  }
  if (op === 'addCollection' || op === 'removeCollection') {
    const collection = mustCollection(store, input.value)
    const target = new Set(idset)
    if (op === 'addCollection') {
      for (const id of target) if (!collection.memberIds.includes(id)) collection.memberIds.push(id)
    } else {
      collection.memberIds = collection.memberIds.filter((id) => !target.has(id))
    }
    collection.updatedAt = isoNow()
    for (const entry of targets) touchEntry(entry, (op === 'addCollection' ? '加入集合「' : '移出集合「') + collection.name + '」')
    return { affected: idset.length, op, value: collection.id }
  }
  if (op === 'delete') {
    let removed = 0
    for (const entry of targets) {
      deleteEntry(store, entry.id)
      removed += 1
    }
    return { affected: removed, op }
  }
  throw httpError(400, 'unknown-bulk-op', '不支持的批量操作：' + op)
}

function isFrameId(store, id) {
  return store.frames.some((frame) => frame.id === id)
}

// 关系两端既可以是记忆，也可以是记忆框（框当超级节点用，用来串项目结构路径）。
function mustNode(store, id, label) {
  if (isFrameId(store, id)) return { kind: 'frame', id: id }
  const entry = store.entries.find((item) => item.id === id)
  if (entry) return { kind: 'entry', id: id, entry: entry }
  throw httpError(404, 'not-found', (label || '记忆') + '不存在：' + id)
}

function saveRelation(store, input) {
  const sourceMemoryId = cleanLine(input.sourceMemoryId || input.id, 64)
  const targetMemoryId = cleanLine(input.targetMemoryId, 64)
  const source = mustNode(store, sourceMemoryId, '起点')
  const target = mustNode(store, targetMemoryId, '终点')
  if (sourceMemoryId === targetMemoryId) throw httpError(400, 'self-relation', '不能把记忆连到自己身上')
  const relationType = normalizeRelationType(input.relationType)
  const existing = store.relations.find(
    (relation) =>
      relation.sourceMemoryId === sourceMemoryId &&
      relation.targetMemoryId === targetMemoryId &&
      relation.relationType === relationType
  )
  const status = normalizeRelationStatus(input.status)
  if (existing) {
    if (input.description !== undefined) existing.description = cleanText(input.description, LIMITS.relationNote)
    if (input.status !== undefined) existing.status = status
    return { relation: existing, created: false }
  }
  if (store.relations.length >= LIMITS.relations) {
    throw httpError(400, 'too-many-relations', '关联数量达到上限 ' + LIMITS.relations)
  }
  const relation = {
    id: newRelationId(),
    sourceMemoryId,
    targetMemoryId,
    relationType,
    description: cleanText(input.description, LIMITS.relationNote),
    status,
    createdBy: cleanLine(input.createdBy, 40) || 'user',
    createdAt: isoNow()
  }
  store.relations.push(relation)
  if (source.kind === 'entry') touchEntry(source.entry, '新增关联（' + RELATION_LABEL[relationType] + '）')
  if (target.kind === 'entry') touchEntry(target.entry, '新增关联（' + RELATION_LABEL[relationType] + '）')
  return { relation, created: true }
}

function updateRelation(store, input) {
  const relation = store.relations.find((item) => item.id === cleanLine(input.id, 64))
  if (!relation) throw httpError(404, 'relation-not-found', '关联不存在：' + input.id)
  if (input.relationType !== undefined) relation.relationType = normalizeRelationType(input.relationType)
  if (input.description !== undefined) relation.description = cleanText(input.description, LIMITS.relationNote)
  if (input.status !== undefined) relation.status = normalizeRelationStatus(input.status)
  if (input.targetMemoryId !== undefined) {
    const target = cleanLine(input.targetMemoryId, 64)
    mustNode(store, target, '终点')
    if (target !== relation.sourceMemoryId) relation.targetMemoryId = target
  }
  return { relation }
}

function deleteRelation(store, input) {
  const id = cleanLine(input.id, 64)
  const relation = store.relations.find((item) => item.id === id)
  if (!relation) throw httpError(404, 'relation-not-found', '关联不存在：' + id)
  store.relations = store.relations.filter((item) => item.id !== id)
  return { deleted: id }
}

function decideRelation(store, input) {
  const relation = store.relations.find((item) => item.id === cleanLine(input.id, 64))
  if (!relation) throw httpError(404, 'relation-not-found', '关联不存在：' + input.id)
  const status = normalizeRelationStatus(input.status)
  if (input.status !== undefined && status === 'rejected' && cleanLine(input.remove, 8) === 'true') {
    store.relations = store.relations.filter((item) => item.id !== relation.id)
    return { removed: relation.id, status }
  }
  if (input.status !== undefined) relation.status = status
  if (cleanLine(input.description, LIMITS.relationNote)) relation.description = cleanText(input.description, LIMITS.relationNote)
  return { relation }
}

function checkMembers(store, raw) {
  const list = Array.isArray(raw) ? raw : []
  const entryIds = new Set(store.entries.map((entry) => entry.id))
  const members = []
  const seen = new Set()
  for (const item of list) {
    const id = cleanLine(item, 64)
    if (!entryIds.has(id) || seen.has(id)) continue
    seen.add(id)
    members.push(id)
    if (members.length >= LIMITS.collectionMembers) break
  }
  return members
}

function saveCollection(store, input) {
  const isUpdate = Boolean(input && input.id) && Boolean(findCollection(store, input.id))
  const collection = isUpdate ? findCollection(store, input.id) : null
  if (!collection && store.collections.length >= LIMITS.collections) {
    throw httpError(400, 'too-many-collections', '记忆集合数量达到上限 ' + LIMITS.collections)
  }
  if (!collection) {
    const name = cleanLine(input.name, LIMITS.collectionName) || '新集合 ' + (store.collections.length + 1)
    const created = {
      id: newCollectionId(),
      name,
      description: cleanText(input.description, LIMITS.collectionNote),
      projectId: resolveProjectId(store, input.projectId),
      tags: normalizeTags(input.tags),
      memberIds: checkMembers(store, input.memberIds),
      color: normalizeCollectionColor(input.color, store.collections.length),
      source: COLLECTION_SOURCES.includes(input.source) ? input.source : 'manual',
      status: COLLECTION_STATUS.includes(input.status) ? input.status : 'confirmed',
      reasons: Array.isArray(input.reasons) ? input.reasons.map((item) => cleanText(item, 200)).filter(Boolean).slice(0, 8) : [],
      createdAt: isoNow(),
      updatedAt: isoNow()
    }
    store.collections.push(created)
    for (const id of created.memberIds) touchEntry(mustEntry(store, id), '加入集合「' + created.name + '」')
    return { collection: created, created: true }
  }
  if (input.name !== undefined) collection.name = cleanLine(input.name, LIMITS.collectionName) || collection.name
  if (input.description !== undefined) collection.description = cleanText(input.description, LIMITS.collectionNote)
  if (input.projectId !== undefined) collection.projectId = resolveProjectId(store, input.projectId)
  if (input.tags !== undefined) collection.tags = normalizeTags(input.tags)
  if (input.color !== undefined) collection.color = normalizeCollectionColor(input.color, store.collections.indexOf(collection))
  if (input.status !== undefined && COLLECTION_STATUS.includes(input.status)) collection.status = input.status
  if (input.memberIds !== undefined) {
    const next = checkMembers(store, input.memberIds)
    const before = new Set(collection.memberIds)
    for (const id of next) {
      if (!before.has(id)) touchEntry(mustEntry(store, id), '加入集合「' + collection.name + '」')
    }
    collection.memberIds = next
  }
  collection.updatedAt = isoNow()
  return { collection, created: false }
}

function deleteCollection(store, input) {
  const collection = mustCollection(store, input.id)
  store.collections = store.collections.filter((item) => item.id !== collection.id)
  return { deleted: collection.id, name: collection.name }
}

function collectionMembers(store, input) {
  const collection = mustCollection(store, input.id)
  const add = checkMembers(store, input.add)
  const remove = Array.isArray(input.remove) ? input.remove.map((id) => cleanLine(id, 64)) : []
  for (const id of add) {
    if (!collection.memberIds.includes(id)) {
      collection.memberIds.push(id)
      touchEntry(mustEntry(store, id), '加入集合「' + collection.name + '」')
    }
  }
  collection.memberIds = collection.memberIds.filter((id) => !remove.includes(id))
  collection.updatedAt = isoNow()
  return { collection }
}

function mergeCollections(store, input) {
  const source = mustCollection(store, input.id)
  const target = mustCollection(store, input.intoId)
  if (source.id === target.id) throw httpError(400, 'merge-self', '不能把集合合并到自己')
  for (const id of source.memberIds) {
    if (!target.memberIds.includes(id)) target.memberIds.push(id)
  }
  target.updatedAt = isoNow()
  store.collections = store.collections.filter((item) => item.id !== source.id)
  return { collection: target, mergedFrom: source.name }
}

function splitCollection(store, input) {
  const source = mustCollection(store, input.id)
  const members = checkMembers(store, input.memberIds)
  if (!members.length) throw httpError(400, 'empty-split', '请选择要拆出去的记忆')
  const created = {
    id: newCollectionId(),
    name: cleanLine(input.name, LIMITS.collectionName) || source.name + ' · 拆分',
    description: cleanText(input.description, LIMITS.collectionNote) || '从「' + source.name + '」拆出的子集合',
    projectId: source.projectId,
    tags: normalizeTags(input.tags || source.tags),
    memberIds: members,
    color: normalizeCollectionColor(input.color, store.collections.length),
    source: 'manual',
    status: 'confirmed',
    reasons: [],
    createdAt: isoNow(),
    updatedAt: isoNow()
  }
  source.memberIds = source.memberIds.filter((id) => !members.includes(id))
  source.updatedAt = isoNow()
  store.collections.push(created)
  return { collection: created, source: source }
}

function saveProject(store, input) {
  const existing = input && input.id ? store.projects.find((project) => project.id === cleanLine(input.id, 64)) : null
  if (!existing && store.projects.length >= LIMITS.projects) {
    throw httpError(400, 'too-many-projects', '项目数量达到上限 ' + LIMITS.projects)
  }
  if (!existing) {
    const name = cleanLine(input.name, LIMITS.projectName)
    if (!name) throw httpError(400, 'empty-name', '项目名称不能为空')
    const project = {
      id: newProjectId(),
      name,
      description: cleanText(input.description, 600),
      color: cleanLine(input.color, 24) || 'blue',
      order: store.projects.length * 10,
      createdAt: isoNow()
    }
    if (Number.isFinite(Number(input.order))) project.order = Number(input.order)
    store.projects.push(project)
    store.projects.sort((left, right) => (left.order || 0) - (right.order || 0))
    return { project, created: true }
  }
  if (input.name !== undefined) existing.name = cleanLine(input.name, LIMITS.projectName) || existing.name
  if (input.description !== undefined) existing.description = cleanText(input.description, 600)
  if (input.color !== undefined) existing.color = cleanLine(input.color, 24) || existing.color
  if (input.order !== undefined && Number.isFinite(Number(input.order))) {
    existing.order = Number(input.order)
    store.projects.sort((left, right) => (left.order || 0) - (right.order || 0))
  }
  return { project: existing, created: false }
}

function reorderProjects(store, input) {
  const ids = Array.isArray(input && input.ids) ? input.ids.map((id) => cleanLine(id, 64)).filter(Boolean) : []
  if (!ids.length) throw httpError(400, 'empty-order', '需要提供项目顺序')
  const known = new Map(store.projects.map((project) => [project.id, project]))
  const next = []
  for (const id of ids) {
    const project = known.get(id)
    if (!project) continue
    known.delete(id)
    next.push(project)
  }
  for (const project of known.values()) next.push(project)
  next.forEach((project, index) => {
    project.order = index * 10
  })
  store.projects = next
  return { projects: store.projects.map((project) => project.id) }
}

function saveFrame(store, input) {
  const nodeIds = new Set(store.entries.map((entry) => entry.id))
  store.frames.forEach((item) => nodeIds.add(item.id))
  const id = cleanLine(input && input.id, 64)
  const existing = id ? store.frames.find((frame) => frame.id === id) : null
  const name = cleanLine(input && input.name, LIMITS.frameName)
  let memberIds = null
  if (Array.isArray(input && input.memberIds)) {
    const seen = new Set()
    memberIds = []
    for (const raw of input.memberIds) {
      const key = cleanLine(raw, 64)
      if (!key || key === id || seen.has(key) || !nodeIds.has(key)) continue
      seen.add(key)
      memberIds.push(key)
      if (memberIds.length >= LIMITS.frameMembers) break
    }
  }
  const rect = normalizeFrameRect(input && input.rect)
  if (existing) {
    if (name) existing.name = name
    if (memberIds) existing.memberIds = memberIds
    if (input && input.rect !== undefined) existing.rect = rect
    if (input && input.color !== undefined) existing.color = normalizeCollectionColor(input.color)
    if (input && input.note !== undefined) existing.note = cleanText(input.note, LIMITS.frameNote)
    existing.updatedAt = isoNow()
    // 框挪了位置 / 改了大小，成员就要按新位置重算：框在哪，里面就属于谁。
    if (existing.rect) rebuildFrameMembers(store)
    return { frame: existing, created: false }
  }
  if (store.frames.length >= LIMITS.frames) throw httpError(400, 'too-many-frames', '记忆框数量达到上限 ' + LIMITS.frames)
  if (!name) throw httpError(400, 'empty-name', '记忆框名称不能为空')
  const frame = {
    id: id || newFrameId(),
    name,
    note: cleanText(input && input.note, LIMITS.frameNote),
    color: normalizeCollectionColor(input && input.color),
    rect,
    memberIds: memberIds || [],
    createdAt: isoNow(),
    updatedAt: isoNow()
  }
  store.frames.push(frame)
  return { frame, created: true }
}

function deleteFrame(store, input) {
  const id = cleanLine(input && input.id, 64)
  const frame = store.frames.find((item) => item.id === id)
  if (!frame) throw httpError(404, 'frame-not-found', '记忆框不存在：' + id)
  store.frames = store.frames.filter((item) => item.id !== id)
  // 框本身可能是关系的一端，删框时把挂在它身上的关系一起收掉，避免留下悬空线。
  store.relations = store.relations.filter(
    (relation) => relation.sourceMemoryId !== id && relation.targetMemoryId !== id
  )
  // 被删的框可能还挂在别的框里（嵌套），一并摘掉。
  for (const other of store.frames) {
    other.memberIds = (other.memberIds || []).filter((member) => member !== id)
  }
  if (store.layout && store.layout.positions) delete store.layout.positions[id]
  return { deleted: id, name: frame.name }
}

// 拖完节点后由前端调用：把「谁在哪个框里」按当前坐标重算并落库。
function syncFrames(store, input) {
  const incoming = Array.isArray(input && input.frames) ? input.frames : []
  const nodeIds = new Set(store.entries.map((entry) => entry.id))
  store.frames.forEach((frame) => nodeIds.add(frame.id))
  let updated = 0
  for (const patch of incoming) {
    const frame = store.frames.find((item) => item.id === cleanLine(patch && patch.id, 64))
    if (!frame) continue
    if (patch && patch.rect !== undefined) frame.rect = normalizeFrameRect(patch.rect)
    if (Array.isArray(patch && patch.memberIds)) {
      const seen = new Set()
      const members = []
      for (const raw of patch.memberIds) {
        const key = cleanLine(raw, 64)
        if (!key || key === frame.id || seen.has(key) || !nodeIds.has(key)) continue
        seen.add(key)
        members.push(key)
        if (members.length >= LIMITS.frameMembers) break
      }
      frame.memberIds = members
    }
    frame.updatedAt = isoNow()
    updated += 1
  }
  // 有 rect 的记忆区，成员永远由「框内的位置」决定，所以同步完顺手重算一遍，
  // 免得显式成员列表和画布上的框对不上。
  rebuildFrameMembers(store)
  return { frames: store.frames, updated }
}

function saveLayout(store, input) {
  const nodeIds = new Set(store.entries.map((entry) => entry.id))
  store.frames.forEach((frame) => nodeIds.add(frame.id))
  const source = (input && input.positions) || {}
  const positions = {}
  for (const key of Object.keys(source)) {
    if (!nodeIds.has(key)) continue
    const point = source[key]
    const x = Number(point && point.x)
    const y = Number(point && point.y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    positions[key] = { x: Math.round(x), y: Math.round(y) }
  }
  store.layout = { positions, updatedAt: isoNow() }
  // 坐标变了，框内的成员就跟着变——这是「框」作为空间容器的语义。
  rebuildFrameMembers(store)
  return { layout: store.layout, saved: Object.keys(positions).length, frames: store.frames }
}

function clearLayout(store) {
  store.layout = { positions: {}, updatedAt: '' }
  return { cleared: true }
}

function importStore(state, input) {
  const data = input && (input.data || input.payload)
  if (!data || typeof data !== 'object') throw httpError(400, 'empty-import', '导入内容为空')
  const mode = input && input.mode === 'replace' ? 'replace' : 'merge'
  let incoming = null
  try {
    incoming = migrateStore(data)
  } catch (error) {
    throw httpError(400, 'bad-import', '导入文件不是有效的知微数据：' + (error && error.message))
  }
  if (!incoming.entries.length) throw httpError(400, 'empty-import', '导入文件里没有记忆')
  const imported = { entries: 0, relations: 0, collections: 0, projects: 0, frames: 0, skipped: 0 }
  if (mode === 'replace') {
    state.projects = incoming.projects
    state.entries = incoming.entries
    state.relations = incoming.relations
    state.collections = incoming.collections
    state.views = incoming.views
    state.proposals = incoming.proposals || []
    state.recalls = incoming.recalls || []
    state.frames = incoming.frames || []
    state.layout = incoming.layout || { positions: {}, updatedAt: '' }
    imported.entries = incoming.entries.length
    imported.relations = incoming.relations.length
    imported.collections = incoming.collections.length
    imported.projects = incoming.projects.length
    imported.frames = (incoming.frames || []).length
    return { imported, mode }
  }
  const projectIds = new Set(state.projects.map((project) => project.id))
  const entryIds = new Set(state.entries.map((entry) => entry.id))
  const relationKeys = new Set(state.relations.map((relation) => relation.sourceMemoryId + '\u0000' + relation.targetMemoryId + '\u0000' + relation.relationType))
  const collectionIds = new Set(state.collections.map((collection) => collection.id))
  const frameIds = new Set(state.frames.map((frame) => frame.id))
  for (const project of incoming.projects) {
    if (projectIds.has(project.id) || state.projects.length >= LIMITS.projects) continue
    projectIds.add(project.id)
    state.projects.push(project)
    imported.projects += 1
  }
  for (const entry of incoming.entries) {
    if (entryIds.has(entry.id) || state.entries.length >= LIMITS.entries) {
      imported.skipped += 1
      continue
    }
    entryIds.add(entry.id)
    state.entries.push(entry)
    imported.entries += 1
  }
  for (const relation of incoming.relations) {
    const key = relation.sourceMemoryId + '\u0000' + relation.targetMemoryId + '\u0000' + relation.relationType
    if (relationKeys.has(key)) continue
    relationKeys.add(key)
    state.relations.push(relation)
    imported.relations += 1
  }
  for (const collection of incoming.collections) {
    if (collectionIds.has(collection.id)) continue
    collectionIds.add(collection.id)
    state.collections.push(collection)
    imported.collections += 1
  }
  for (const frame of incoming.frames || []) {
    if (frameIds.has(frame.id)) continue
    frameIds.add(frame.id)
    state.frames.push(frame)
    imported.frames += 1
  }
  return { imported, mode }
}

function deleteProject(store, input) {
  const id = cleanLine(input.id, 64)
  if (store.projects.length <= 1) throw httpError(400, 'last-project', '至少保留一个项目')
  const project = store.projects.find((item) => item.id === id)
  if (!project) throw httpError(404, 'project-not-found', '项目不存在：' + id)
  store.projects = store.projects.filter((item) => item.id !== id)
  const fallback = store.projects[0].id
  for (const entry of store.entries) if (entry.projectId === id) entry.projectId = fallback
  for (const collection of store.collections) if (collection.projectId === id) collection.projectId = fallback
  return { deleted: id, name: project.name, movedTo: fallback }
}

function saveView(store, input) {
  const name = cleanLine(input.name, LIMITS.viewName)
  if (!name) throw httpError(400, 'empty-name', '视图名称不能为空')
  const existing = input.id ? store.views.find((view) => view.id === cleanLine(input.id, 64)) : null
  if (existing) {
    existing.name = name
    existing.filters = normalizeView({ filters: input.filters, name }).filters
    return { view: existing, created: false }
  }
  if (store.views.length >= LIMITS.views) throw httpError(400, 'too-many-views', '保存的视图过多')
  const view = { id: newViewId(), name, filters: normalizeView({ filters: input.filters, name }).filters, createdAt: isoNow() }
  store.views.push(view)
  return { view, created: true }
}

function deleteView(store, input) {
  const id = cleanLine(input.id, 64)
  store.views = store.views.filter((view) => view.id !== id)
  return { deleted: id }
}

function serializeState(state) {
  const membership = new Map()
  for (const collection of state.collections) {
    for (const id of collection.memberIds) {
      if (!membership.has(id)) membership.set(id, [])
      membership.get(id).push(collection.id)
    }
  }
  const relationsByEntry = new Map()
  for (const relation of state.relations) {
    if (!relationsByEntry.has(relation.sourceMemoryId)) relationsByEntry.set(relation.sourceMemoryId, [])
    relationsByEntry.get(relation.sourceMemoryId).push(relation)
    if (!relationsByEntry.has(relation.targetMemoryId)) relationsByEntry.set(relation.targetMemoryId, [])
    relationsByEntry.get(relation.targetMemoryId).push(relation)
  }
  const entries = state.entries.map((entry) => ({
    ...entry,
    relatedCollectionIds: membership.get(entry.id) || [],
    relationIds: (relationsByEntry.get(entry.id) || []).map((relation) => relation.id)
  }))
  const pending = state.proposals.filter((proposal) => proposal.status === 'pending')
  const decided = state.proposals.filter((proposal) => proposal.status !== 'pending').slice(0, 30)
  return {
    version: STORE_VERSION,
    meta: META,
    projects: state.projects,
    entries,
    relations: state.relations,
    collections: state.collections,
    views: state.views,
    proposals: pending.concat(decided),
    recalls: state.recalls.slice(0, 30),
    frames: state.frames || [],
    layout: state.layout || { positions: {}, updatedAt: '' }
  }
}

function computeStats(state) {
  const byType = {}
  const byStatus = {}
  const byDomain = {}
  for (const entry of state.entries) {
    byType[entry.type] = (byType[entry.type] || 0) + 1
    byStatus[entry.status] = (byStatus[entry.status] || 0) + 1
    for (const domain of entry.domains) byDomain[domain] = (byDomain[domain] || 0) + 1
  }
  return {
    entries: state.entries.length,
    relations: state.relations.length,
    suggestedRelations: state.relations.filter((relation) => relation.status === 'suggested').length,
    confirmedRelations: state.relations.filter((relation) => relation.status === 'confirmed').length,
    proposedRelations: state.relations.filter((relation) => relation.source === 'ai' && relation.status === 'suggested').length,
    collections: state.collections.length,
    suggestedCollections: state.collections.filter((collection) => collection.status === 'suggested').length,
    projects: state.projects.length,
    inbox: state.entries.filter((entry) => entry.status === 'draft' || entry.status === 'pending').length,
    favorites: state.entries.filter((entry) => entry.favorite).length,
    pendingProposals: state.proposals.filter((proposal) => proposal.status === 'pending').length,
    review: state.entries.filter((entry) => entry.status === 'review').length,
    protected: state.entries.filter((entry) => entry.protectionLevel === 'protected').length,
    confirmed: state.entries.filter((entry) => entry.protectionLevel === 'confirmed').length,
    recalls: state.recalls.length,
    lastRecallAt: state.recalls.length ? state.recalls[0].at : '',
    frames: (state.frames || []).length,
    byType,
    byStatus,
    byDomain
  }
}

function setEntryProtection(state, input) {
  const entry = mustEntry(state, cleanLine(input && input.id, 64))
  const level = PROTECTION_LEVELS.includes(input && input.level) ? input.level : 'normal'
  if (entry.protectionLevel === level) return { entry, changed: false }
  const previous = entry.protectionLevel
  entry.protectionLevel = level
  pushVersion(entry, {
    title: entry.title,
    content: entry.content,
    changeType: 'protect',
    changeReason:
      cleanText(input && input.note, LIMITS.versionNote) ||
      '保护级别：' + PROTECTION_LABEL[previous] + ' → ' + PROTECTION_LABEL[level],
    createdBy: 'user'
  })
  touchEntry(entry, '保护级别改为' + PROTECTION_LABEL[level])
  return { entry, changed: true, previous }
}

function restoreVersion(state, input) {
  const entry = mustEntry(state, cleanLine(input && input.id, 64))
  const versionId = cleanLine(input && input.versionId, 64)
  const version = entry.versions.find((item) => item.id === versionId)
  if (!version) throw httpError(404, 'version-not-found', '这个版本不存在：' + versionId)
  if (entry.protectionLevel === 'protected' && !(input && input.force)) {
    throw httpError(409, 'protected', '「' + entry.title + '」是固有约定，请先解除保护再回滚版本')
  }
  const before = entry.content
  entry.content = version.content
  entry.title = version.title || entry.title
  entry.summary = deriveSummary(entry.content, entry.title)
  const created = pushVersion(entry, {
    title: entry.title,
    content: entry.content,
    changeType: 'restore',
    changeReason: '回滚到第 ' + version.version + ' 版（' + CHANGE_LABEL[version.changeType] + '）',
    evidenceIds: version.evidenceIds,
    createdBy: 'user'
  })
  touchEntry(entry, '回滚到第 ' + version.version + ' 版')
  return { entry, version: created, previousContent: before }
}

function addEntryEvidence(state, input) {
  const entry = mustEntry(state, cleanLine(input && input.id, 64))
  const record = addEvidence(entry, {
    content: input && (input.content || input.evidenceContent || input.evidence),
    sourceConversation: input && input.sourceConversation,
    sourceMessage: input && input.sourceMessage,
    evidenceType: input && input.evidenceType,
    confidence: input && input.confidence
  })
  if (!record) throw httpError(400, 'empty-evidence', '需要提供证据内容')
  entry.evidenceCount = entry.evidence.length
  touchEntry(entry, '新增证据')
  return { entry, evidence: record }
}

function decideProposal(state, input) {
  const proposal = state.proposals.find(
    (item) => item.id === cleanLine(input && (input.id || input.proposalId), 64)
  )
  if (!proposal) throw httpError(404, 'proposal-not-found', '更新建议不存在：' + (input && input.id))
  if (proposal.status !== 'pending') throw httpError(409, 'decided', '这条建议已经处理过了')
  const entry = mustEntry(state, proposal.memoryId)
  const decision = cleanLine(input && input.decision, 16)
  if (decision === 'reject') {
    proposal.status = 'rejected'
    proposal.decidedAt = isoNow()
    if (entry.status === 'review') entry.status = 'active'
    touchEntry(entry, '拒绝了一条更新建议')
    return { proposal, entry, accepted: false }
  }
  proposal.status = 'accepted'
  proposal.decidedAt = isoNow()
  const content = cleanText((input && input.content) || proposal.proposedContent, LIMITS.body)
  const title = cleanLine((input && input.title) || proposal.title, LIMITS.title) || entry.title
  entry.title = title
  entry.content = content
  entry.summary = deriveSummary(content, title)
  if (entry.status === 'review') entry.status = 'active'
  pushVersion(entry, {
    title,
    content,
    changeType: proposal.changeType === 'conflict' ? 'correct' : proposal.changeType,
    changeReason: proposal.reason || '接受更新建议',
    evidenceIds: proposal.evidenceIds,
    createdBy: 'user'
  })
  touchEntry(entry, '接受了更新建议（' + CHANGE_LABEL[proposal.changeType] + '）')
  return { proposal, entry, accepted: true }
}

    // Restore a snapshot that the browser kept before a destructive action.
    // Used by the "撤销" affordance; ids and timestamps are preserved so the
    // graph, collections and relations keep pointing at the same memory.
    async function restoreEntry(state, input) {
      const raw = input && input.entry
      if (!raw || typeof raw !== 'object') throw httpError(400, 'invalid-entry', '需要提供要恢复的记忆内容')
      const id = cleanLine(raw.id, 64)
      if (!id) throw httpError(400, 'invalid-entry', '要恢复的记忆缺少 id')
      if (findEntry(state, id)) throw httpError(409, 'already-exists', '这条记忆还在，不需要恢复')
      const projectIds = new Set(state.projects.map((project) => project.id))
      const entry = normalizeEntry(Object.assign({}, raw, { id: id }), projectIds, isoNow())
      if (!entry) throw httpError(400, 'invalid-entry', '无法恢复这条记忆')
      state.entries.unshift(entry)

      const entryIds = new Set(state.entries.map((item) => item.id))
      const restoredRelations = []
      const knownRelations = new Set(state.relations.map((relation) => relation.id))
      const rawRelations = Array.isArray(input.relations) ? input.relations.slice(0, LIMITS.relations) : []
      for (const item of rawRelations) {
        const relation = normalizeRelation(item, entryIds, isoNow())
        if (!relation || knownRelations.has(relation.id)) continue
        const duplicate = state.relations.some(
          (existing) =>
            existing.sourceMemoryId === relation.sourceMemoryId &&
            existing.targetMemoryId === relation.targetMemoryId &&
            existing.relationType === relation.relationType
        )
        if (duplicate) continue
        knownRelations.add(relation.id)
        state.relations.push(relation)
        restoredRelations.push(relation.id)
      }

      const restoredCollections = []
      const touched = Array.isArray(input.collectionIds) ? input.collectionIds : []
      for (const collectionId of touched) {
        const collection = findCollection(state, cleanLine(collectionId, 64))
        if (!collection) continue
        if (!collection.memberIds.includes(entry.id)) collection.memberIds.push(entry.id)
        restoredCollections.push(collection.id)
      }
      return { entry: entry, restored: true, restoredRelations: restoredRelations, restoredCollections: restoredCollections }
    }

    async function restoreCollection(state, input) {
      const raw = input && input.collection
      if (!raw || typeof raw !== 'object') throw httpError(400, 'invalid-collection', '需要提供要恢复的集合内容')
      const id = cleanLine(raw.id, 64)
      if (id && findCollection(state, id)) throw httpError(409, 'already-exists', '这个集合还在，不需要恢复')
      const entryIds = new Set(state.entries.map((entry) => entry.id))
      const projectIds = new Set(state.projects.map((project) => project.id))
      const collection = normalizeCollection(
        Object.assign({}, raw, { id: id || newCollectionId() }),
        entryIds,
        projectIds,
        isoNow(),
        state.collections.length
      )
      if (!collection) throw httpError(400, 'invalid-collection', '无法恢复这个集合')
      state.collections.unshift(collection)
      return { collection: collection, restored: true }
    }
function describeEntry(entry, state) {
  const parts = ['[' + TYPE_LABEL[entry.type] + ' / ' + STATUS_LABEL[entry.status] + '] ' + entry.title]
  parts.push('id=' + entry.id)
  if (entry.domains.length) parts.push('领域: ' + entry.domains.map((domain) => DOMAIN_LABEL[domain]).join('、'))
  if (entry.tags.length) parts.push('标签: ' + entry.tags.map((tag) => '#' + tag).join(' '))
  const project = state.projects.find((item) => item.id === entry.projectId)
  if (project) parts.push('项目: ' + project.name)
  if (entry.relatedCollectionIds && entry.relatedCollectionIds.length) {
    parts.push(
      '集合: ' +
        entry.relatedCollectionIds
          .map((id) => {
            const collection = state.collections.find((item) => item.id === id)
            return collection ? '「' + collection.name + '」' : ''
          })
          .filter(Boolean)
          .join('、')
    )
  }
  const relations = state.relations.filter(
    (relation) => relation.sourceMemoryId === entry.id || relation.targetMemoryId === entry.id
  )
  if (relations.length) parts.push('关联: ' + relations.length + ' 条')
  return parts.join('\n  ')
}

function describeEntryFull(entry, state) {
  const lines = []
  lines.push('【' + entry.title + '】')
  lines.push('id=' + entry.id + ' · ' + TYPE_LABEL[entry.type] + ' · ' + STATUS_LABEL[entry.status])
  const project = state.projects.find((item) => item.id === entry.projectId)
  if (project) lines.push('项目: ' + project.name)
  if (entry.domains.length) lines.push('领域: ' + entry.domains.map((domain) => DOMAIN_LABEL[domain]).join('、'))
  if (entry.tags.length) lines.push('标签: ' + entry.tags.map((tag) => '#' + tag).join(' '))
  if (entry.summary && entry.summary !== entry.content) lines.push('摘要: ' + entry.summary)
  if (entry.content) lines.push('正文:\n' + entry.content)
  if (entry.facts.length) {
    lines.push('要点:')
    for (const fact of entry.facts) lines.push('  - ' + fact.label + ' = ' + fact.value)
  }
  if (entry.source && (entry.source.kind !== 'manual' || entry.source.label)) {
    lines.push('来源: ' + SOURCE_LABEL[entry.source.kind] + (entry.source.label ? ' · ' + entry.source.label : ''))
  }
  const outgoing = state.relations.filter((relation) => relation.sourceMemoryId === entry.id)
  const incoming = state.relations.filter((relation) => relation.targetMemoryId === entry.id)
  if (outgoing.length) {
    lines.push('关联到:')
    for (const relation of outgoing) {
      const target = state.entries.find((item) => item.id === relation.targetMemoryId)
      lines.push(
        '  - [' + RELATION_LABEL[relation.relationType] + '] ' + (target ? target.title : relation.targetMemoryId) +
        ' (' + RELATION_STATUS_LABEL[relation.status] + ')' + (relation.description ? ' — ' + relation.description : '')
      )
    }
  }
  if (incoming.length) {
    lines.push('被关联:')
    for (const relation of incoming) {
      const source = state.entries.find((item) => item.id === relation.sourceMemoryId)
      lines.push(
        '  - [' + RELATION_LABEL[relation.relationType] + '] ' + (source ? source.title : relation.sourceMemoryId) +
        ' (' + RELATION_STATUS_LABEL[relation.status] + ')'
      )
    }
  }
  const collections = state.collections.filter((collection) => collection.memberIds.includes(entry.id))
  if (collections.length) {
    lines.push('所属集合: ' + collections.map((collection) => '「' + collection.name + '」(' + collection.memberIds.length + ')').join('、'))
  }
  if (entry.history.length) {
    lines.push('最近改动:')
    for (const item of entry.history.slice(0, 5)) lines.push('  - ' + item.at + ' ' + item.note)
  }
  return lines.join('\n')
}

function frameSubtree(state, frameId) {
  const byId = new Map(state.frames.map((frame) => [frame.id, frame]))
  const root = byId.get(frameId)
  if (!root) throw httpError(404, 'frame-not-found', '记忆框不存在：' + frameId)
  const seen = new Set()
  const entries = new Set()
  const walk = (frame) => {
    if (!frame || seen.has(frame.id)) return
    seen.add(frame.id)
    for (const member of frame.memberIds || []) {
      const nested = byId.get(member)
      if (nested) walk(nested)
      else entries.add(member)
    }
  }
  walk(root)
  return { frame: root, entryIds: entries, frameIds: seen }
}

function searchEntries(state, query) {
  const needle = cleanLine(query.query || query.q, 200).toLowerCase()
  const type = query.type ? normalizeType(query.type) : ''
  const domain = query.domain ? normalizeDomains(query.domain)[0] : ''
  const status = query.status ? normalizeStatus(query.status) : ''
  const projectId = cleanLine(query.projectId, 64)
  const collectionId = cleanLine(query.collectionId, 64)
  const frameId = cleanLine(query.frameId, 64)
  let collection = null
  if (collectionId) {
    collection = state.collections.find((item) => item.id === collectionId)
    if (!collection) throw httpError(404, 'collection-not-found', '记忆集合不存在：' + collectionId)
  }
  // 记忆框是空间容器：在框里找记忆时把嵌套的子框一起展开。
  const frameScope = frameId ? frameSubtree(state, frameId).entryIds : null
  return state.entries
    .filter((entry) => {
      if (type && entry.type !== type) return false
      if (domain && !entry.domains.includes(domain)) return false
      if (status && entry.status !== status) return false
      if (projectId && entry.projectId !== projectId) return false
      if (collection && !collection.memberIds.includes(entry.id)) return false
      if (frameScope && !frameScope.has(entry.id)) return false
      if (query.favorites === true && !entry.favorite) return false
      if (!needle) return true
      const haystack = [
        entry.title,
        entry.summary,
        entry.content,
        entry.tags.join(' '),
        entry.domains.map((id) => DOMAIN_LABEL[id]).join(' '),
        TYPE_LABEL[entry.type]
      ]
        .join('\n')
        .toLowerCase()
      return haystack.includes(needle)
    })
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
}

function searchToolDescription() {
  return [
    '检索「知微」记忆库。返回匹配记忆的标题、类型、状态、领域、标签、所属集合与关联数量。',
    'query 走全文检索（标题/摘要/正文/标签/领域/类型名）；id 用于精确读取一条记忆的完整内容。',
    'type: decision 设计决策 / rule 设计规则 / assumption 设计假设 / question 设计问题 / proposal 设计方案 / reference 参考案例 / metric 数值数据 / retro 复盘结论 / process 流程约定。',
    'domain: combat 战斗 / growth 成长 / economy 经济 / level 关卡 / event 活动 / uiux 界面交互 / monetization 商业化 / social 社交 / operation 运营 / tech 技术。',
    'status: draft 草稿 / pending 待确认 / active 已生效 / deprecated 已废弃 / archived 已归档。'
  ].join('\n')
}

function writeParameters() {
  return {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: [
          'entry-save',
          'entry-delete',
          'entry-status',
          'entry-flag',
          'entry-bulk',
          'entry-collections',
          'entry-restore',
          'entry-protect',
          'entry-version-restore',
          'evidence-add',
          'proposal-decide',
          'memory-merge',
          'memory-observe',
          'memory-recall',
          'memory-tidy',
          'collection-restore',
          'relation-create',
          'relation-update',
          'relation-decide',
          'relation-delete',
          'collection-save',
          'collection-delete',
          'collection-members',
          'collection-merge',
          'collection-split',
          'project-save',
          'project-delete',
          'project-reorder',
          'frame-save',
          'frame-delete',
          'frame-sync',
          'layout-save',
          'layout-clear',
          'import'
        ],
        description:
          'entry-save 新建或更新记忆（带 id 即更新，正文变化会记版本）；entry-delete 删除记忆；entry-status 改状态；entry-flag 切换收藏或置顶；entry-bulk 批量改状态/项目/收藏/集合；entry-collections 单条记忆增删所属集合（传 add / remove 数组）；entry-protect 设置保护级别（normal / confirmed / protected）；entry-version-restore 回滚到某个历史版本；evidence-add 给记忆补一条来源证据；proposal-decide 接受或拒绝 AI 修改建议（decision: accept / reject）；memory-merge 合并重复记忆；memory-observe 从对话观察沉淀记忆（自动对比、更新或生成建议）；memory-recall 按当前任务检索最该被调用的记忆；memory-tidy 返回整理中心数据；relation-create 建立带类型的关联；relation-update 改关联；relation-decide 确认或拒绝 AI 建议的关联；collection-save 新建或修改记忆集合；collection-members 增删集合成员；collection-merge / collection-split 合并或拆分集合；entry-restore / collection-restore 恢复刚被删除的记忆或集合（撤销用，保留原 id）；project-save / project-delete 管理项目空间；project-reorder 调整项目顺序（传 ids 数组）；frame-save / frame-delete 管理关系图上的记忆框（框住一组记忆，方便阅读）；layout-save 保存关系图的手动布局（positions: {记忆id: {x, y}}）；layout-clear 清空手动布局；import 导入外部 JSON（mode: merge / replace）。'
      },
      id: { type: 'string', description: '记忆 / 集合 / 关联 / 项目的 id（更新时必填）' },
      title: { type: 'string', description: '记忆标题，一句话说清是什么' },
      summary: { type: 'string', description: '一句话摘要，不填会从正文自动生成' },
      content: { type: 'string', description: '正文，支持 Markdown' },
      type: { type: 'string', enum: ENTRY_TYPES, description: '记忆类型' },
      domains: { type: 'array', items: { type: 'string', enum: DOMAINS }, description: '业务领域，可多选' },
      tags: { type: 'array', items: { type: 'string' }, description: '标签' },
      status: { type: 'string', enum: STATUSES, description: '状态' },
      projectId: { type: 'string', description: '所属项目 id' },
      source: {
        type: 'object',
        description: '来源：kind 取 manual / conversation / import / ai，label 记录出处',
        properties: {
          kind: { type: 'string', enum: SOURCE_KINDS },
          label: { type: 'string' }
        },
        additionalProperties: false
      },
      facts: {
        type: 'array',
        description: '关键要点，每项 {label, value}',
        items: {
          type: 'object',
          properties: { label: { type: 'string' }, value: { type: 'string' } },
          additionalProperties: false
        }
      },
      favorite: { type: 'boolean', description: '是否收藏' },
      pinned: { type: 'boolean', description: '是否置顶' },
      scope: { type: 'string', enum: MEMORY_SCOPES, description: '作用范围：project 项目内 / global 全局通用' },
      confidence: { type: 'number', description: '可信度 0–1' },
      importance: { type: 'number', description: '重要程度 0–1' },
      protectionLevel: {
        type: 'string',
        enum: PROTECTION_LEVELS,
        description: '保护级别：normal 普通 / confirmed 已确认 / protected 固有约定（默认锁定）'
      },
      level: { type: 'string', enum: PROTECTION_LEVELS, description: 'entry-protect: 目标保护级别' },
      versionId: { type: 'string', description: 'entry-version-restore: 要回滚到的版本 id' },
      decision: { type: 'string', description: 'proposal-decide: accept 或 reject' },
      evidence: { type: 'string', description: '新增证据内容（entry-save / evidence-add）' },
      evidenceType: { type: 'string', enum: EVIDENCE_TYPES, description: '证据类型' },
      sourceConversation: { type: 'string', description: '来源对话标识' },
      sourceMessage: { type: 'string', description: '来源消息标识' },
      text: { type: 'string', description: 'memory-observe: 要观察的对话或笔记原文' },
      messages: { type: 'array', items: { type: 'string' }, description: 'memory-observe: 对话片段数组' },
      conversationId: { type: 'string', description: 'memory-observe: 来源对话 id' },
      autoCreate: { type: 'boolean', description: 'memory-observe: 没有匹配到已有记忆时是否新建候选记忆（默认 true）' },
      task: { type: 'string', description: 'memory-recall: 当前任务或问题' },
      outcome: { type: 'string', enum: RECALL_OUTCOMES, description: 'memory-recall: 本次调用结果' },
      force: { type: 'boolean', description: '跳过固有约定保护（只在用户明确要求修改时使用）' },
      note: { type: 'string', description: '本次改动说明，写入改动记录' },
      ids: { type: 'array', items: { type: 'string' }, description: '批量操作的记忆 id 列表' },
      sourceMemoryId: { type: 'string', description: '关系起点记忆 id' },
      targetMemoryId: { type: 'string', description: '关系终点记忆 id' },
      targetId: { type: 'string', description: 'targetMemoryId 的别名' },
      relationType: { type: 'string', enum: RELATION_TYPES, description: '关系类型' },
      description: { type: 'string', description: '关系说明或集合简介' },
      relationStatus: { type: 'string', enum: RELATION_STATUS, description: '关系状态' },
      name: { type: 'string', description: '集合或项目名称' },
      color: { type: 'string', description: '集合或项目的颜色标识' },
      memberIds: { type: 'array', items: { type: 'string' }, description: '集合成员记忆 id / 记忆框成员记忆 id' },
      positions: {
        type: 'object',
        description: 'layout-save: 手动布局，键是记忆 id，值是 {x, y}',
        additionalProperties: true
      },
      data: { type: 'object', description: 'import: 要导入的知微 JSON 数据', additionalProperties: true },
      mode: { type: 'string', enum: ['merge', 'replace'], description: 'import: merge 按 id 合并（默认）/ replace 覆盖现有库' },
      order: { type: 'number', description: 'project-save: 项目排序值（越小越靠前）' },
      add: { type: 'array', items: { type: 'string' }, description: 'collection-members: 要加入的记忆 id' },
      remove: { type: 'array', items: { type: 'string' }, description: 'collection-members: 要移出的记忆 id' },
      intoId: { type: 'string', description: 'collection-merge: 合并进哪个集合 id' },
      field: { type: 'string', description: 'entry-flag: favorite 或 pinned' },
      op: { type: 'string', description: 'entry-bulk: status / project / favorite / pin / addCollection / removeCollection / delete' },
      collectionId: { type: 'string', description: 'entry-bulk: 目标集合 id' },
      kind: { type: 'string', description: 'view-save: 视图类型，目前为 graph' },
      config: { type: 'object', description: 'view-save: 视图配置（筛选与折叠状态）' },
      viewId: { type: 'string', description: 'view-delete: 视图 id' },
      entry: {
        type: 'object',
        description: 'entry-restore: 要恢复的记忆快照（保留 id / createdAt / updatedAt）',
        additionalProperties: true
      },
      relations: {
        type: 'array',
        description: 'entry-restore: 一并恢复的关联快照',
        items: { type: 'object', additionalProperties: true }
      },
      collection: {
        type: 'object',
        description: 'collection-restore: 要恢复的集合快照（保留 id）',
        additionalProperties: true
      },
      collectionIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'entry-restore: 恢复后重新加入这些集合'
      }
    },
    required: ['action'],
    additionalProperties: false
  }
}

function parseModelJson(raw) {
  const text = String(raw || '').trim()
  if (!text) return null
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  let parsed = null
  try {
    parsed = JSON.parse(text.slice(start, end + 1))
  } catch (error) {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null
  const out = {}
  if (typeof parsed.title === 'string' && parsed.title.trim()) out.title = cleanLine(parsed.title, LIMITS.title)
  if (typeof parsed.summary === 'string' && parsed.summary.trim()) out.summary = cleanText(parsed.summary, LIMITS.summary)
  if (parsed.type && ENTRY_TYPES.includes(parsed.type)) out.type = parsed.type
  if (Array.isArray(parsed.domains)) out.domains = normalizeDomains(parsed.domains)
  if (Array.isArray(parsed.tags)) out.tags = normalizeTags(parsed.tags)
  return Object.keys(out).length ? out : null
}

function applyAction(state, input) {
  const action = cleanLine(input.action, 40)
  switch (action) {
    case 'entry-save':
      return saveEntry(state, input)
    case 'entry-delete':
      return deleteEntry(state, input.id)
    case 'entry-restore':
      return restoreEntry(state, input)
    case 'collection-restore':
      return restoreCollection(state, input)
    case 'entry-status':
      return setEntryStatus(state, input)
    case 'entry-flag':
      return setEntryFlag(state, input, cleanLine(input.field, 20) === 'pinned' ? 'pinned' : 'favorite')
    case 'entry-bulk':
      return bulkEntries(state, input)
    case 'entry-collections': {
      const id = cleanLine(input.id, 64)
      mustEntry(state, id)
      const add = Array.isArray(input.add) ? input.add : []
      const remove = Array.isArray(input.remove) ? input.remove : []
      for (const collectionId of add) {
        bulkEntries(state, { ids: [id], op: 'addCollection', collectionId })
      }
      for (const collectionId of remove) {
        bulkEntries(state, { ids: [id], op: 'removeCollection', collectionId })
      }
      return { entry: findEntry(state, id), added: add.length, removed: remove.length }
    }
    case 'entry-protect':
      return setEntryProtection(state, input)
    case 'entry-version-restore':
      return restoreVersion(state, input)
    case 'evidence-add':
      return addEntryEvidence(state, input)
    case 'proposal-decide':
      return decideProposal(state, input)
    case 'memory-merge':
      return mergeMemories(state, input)
    case 'memory-observe':
      return observeMemories(state, input)
    case 'memory-recall': {
      const ranked = rankRecall(state, input)
      const logged = recordRecall(state, input, ranked)
      return Object.assign({}, ranked, { logged: logged.recall ? logged.recall.id : '', updated: logged.updated })
    }
    case 'memory-tidy':
      return tidyReport(state)
    case 'relation-create':
      return saveRelation(state, { ...input, targetMemoryId: input.targetMemoryId || input.targetId })
    case 'relation-update':
      return updateRelation(state, input)
    case 'relation-decide':
      return decideRelation(state, { ...input, status: input.relationStatus || input.status })
    case 'relation-delete':
      return deleteRelation(state, input)
    case 'collection-save':
      return saveCollection(state, input)
    case 'collection-delete':
      return deleteCollection(state, input)
    case 'collection-members':
      return collectionMembers(state, input)
    case 'collection-merge':
      return mergeCollections(state, input)
    case 'collection-split':
      return splitCollection(state, input)
    case 'project-save':
      return saveProject(state, input)
    case 'project-delete':
      return deleteProject(state, input)
    case 'view-save':
      return saveView(state, input)
    case 'view-delete':
      return deleteView(state, input)
    case 'project-reorder':
      return reorderProjects(state, input)
    case 'frame-save':
      return saveFrame(state, input)
    case 'frame-delete':
      return deleteFrame(state, input)
    case 'frame-sync':
      return syncFrames(state, input)
    case 'layout-save':
      return saveLayout(state, input)
    case 'layout-clear':
      return clearLayout(state)
    case 'import':
      return importStore(state, input)
    default:
      throw httpError(400, 'unknown-action', '未知操作：' + action)
  }
}

function formatWriteResult(result, state) {
  if (result.restored && result.entry) {
    return (
      '已恢复记忆：' + result.entry.title + '\nid=' + result.entry.id +
      (result.restoredRelations.length ? '\n恢复关联 ' + result.restoredRelations.length + ' 条' : '')
    )
  }
  if (result.restored && result.collection) {
    return '已恢复集合：' + result.collection.name + '\nid=' + result.collection.id
  }
  if (result.kind === 'recall') {
    const lines = ['按任务「' + result.task + '」召回 ' + result.items.length + ' 条记忆：']
    for (const item of result.items) {
      const entry = state.entries.find((candidate) => candidate.id === item.entryId)
      lines.push(
        '- [P' + item.tier + '] ' + (entry ? entry.title : item.title) +
        '（' + TYPE_LABEL[item.type] + ' · ' + STATUS_LABEL[item.status] +
        (item.protectionLevel === 'protected' ? ' · 固有约定' : '') + '）id=' + item.entryId
      )
      if (entry) {
        const body = String(entry.content || '').slice(0, 400)
        lines.push('  ' + body.replace(/\s+/g, ' '))
      }
    }
    if (!result.items.length) lines.push('- 没有相关记忆')
    return lines.join('\n')
  }
  if (result.kind === 'tidy') {
    return (
      '整理中心：待确认建议 ' + result.pendingProposals + ' 条 · 待确认关系 ' + result.pendingRelations +
      ' 条 · 候选记忆 ' + result.pendingMemories + ' 条 · 待复核 ' + result.reviewMemories + ' 条\n' +
      '疑似重复 ' + result.duplicates.length + ' 组 · 孤立记忆 ' + result.orphans.length + ' 条 · 固有约定 ' +
      result.protectedCount + ' 条'
    )
  }
  if (result.proposal) {
    return result.accepted
      ? '已接受更新建议并记入版本：' + result.entry.title + '\nid=' + result.entry.id
      : '已拒绝更新建议：' + result.entry.title + '\nid=' + result.entry.id
  }
  if (result.version) {
    return '已回滚版本：' + result.entry.title + ' → 第 ' + result.version.version + ' 版\nid=' + result.entry.id
  }
  if (result.evidence) {
    return '已补一条证据：' + result.entry.title + '\n证据 id=' + result.evidence.id
  }
  if (result.merged && result.merged.length) {
    return '已合并 ' + result.merged.length + ' 条记忆到「' + result.entry.title + '」\nid=' + result.entry.id
  }
  if (result.entry) {
    return (result.created ? '已保存记忆：' : '已更新记忆：') + result.entry.title + '\nid=' + result.entry.id
  }
  if (result.deleted) {
    return '已删除：' + result.deleted + (result.title ? '（' + result.title + '）' : '')
  }
  if (result.relation) {
    const source = state.entries.find((entry) => entry.id === result.relation.sourceMemoryId)
    const target = state.entries.find((entry) => entry.id === result.relation.targetMemoryId)
    return (
      (result.created ? '已建立关联：' : '已更新关联：') +
      (source ? source.title : result.relation.sourceMemoryId) +
      ' —[' + RELATION_LABEL[result.relation.relationType] + ']→ ' +
      (target ? target.title : result.relation.targetMemoryId) +
      '（' + RELATION_STATUS_LABEL[result.relation.status] + '）'
    )
  }
  if (result.mergedFrom) {
    return '已把「' + result.mergedFrom + '」合并进「' + result.collection.name + '」'
  }
  if (result.collection) {
    return (result.created ? '已创建集合「' : '已更新集合「') + result.collection.name + '」（' + result.collection.memberIds.length + ' 条记忆）'
  }
  if (result.project) {
    return (result.created ? '已创建项目「' : '已更新项目「') + result.project.name + '」'
  }
  if (result.view) {
    return '已保存视图「' + result.view.name + '」'
  }
  if (result.affected !== undefined) {
    return '已处理 ' + result.affected + ' 条记忆（' + result.op + '）'
  }
  return JSON.stringify(result)
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body)
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(payload)
}

function sendRaw(res, status, text, headOnly) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  if (headOnly) res.end()
  else res.end(text)
}

async function readJsonBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) throw httpError(413, 'payload-too-large', '请求体过大')
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim()
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object')
    return parsed
  } catch (error) {
    throw httpError(400, 'invalid-json', '请求体不是合法 JSON 对象')
  }
}

function isLoopbackOrigin(value) {
  if (value === undefined || value === null || value === '') return true
  try {
    const url = new URL(String(value))
    return (
      url.protocol === 'http:' &&
      (url.hostname === '127.0.0.1' || url.hostname === 'localhost' || url.hostname === '::1' || url.hostname === '[::1]')
    )
  } catch (error) {
    return false
  }
}

export function apply(ctx) {
  const home = process.env.DSH_HOME || path.join(homedir(), '.dsh')
  const defaultDir = path.join(home, 'design-memory')
  const configFile = path.join(defaultDir, 'config.json')
  let storageDir = defaultDir
  let storageFile = path.join(storageDir, 'memories.json')
  const state = {
    version: STORE_VERSION,
    projects: [],
    entries: [],
    relations: [],
    collections: [],
    views: [],
    proposals: [],
    recalls: [],
    frames: [],
    layout: { positions: {}, updatedAt: '' }
  }
  let chain = Promise.resolve()
  // 用户选择的整理模型：provider + model。留空表示只用本地启发式整理。
  let modelRoute = { provider: '', model: '', enabled: false }

  async function readConfig() {
    try {
      const raw = await readFile(configFile, 'utf8')
      const parsed = JSON.parse(raw)
      const custom = parsed && typeof parsed.storageFile === 'string' ? parsed.storageFile.trim() : ''
      if (custom && path.isAbsolute(custom)) {
        storageFile = custom
        storageDir = path.dirname(custom)
      }
      if (parsed && parsed.model && typeof parsed.model === 'object') {
        modelRoute = {
          provider: cleanLine(parsed.model.provider, 80),
          model: cleanLine(parsed.model.model, 120),
          enabled: parsed.model.enabled === true
        }
      }
    } catch (error) {
      // 没有配置文件就用默认位置
    }
  }

  async function writeConfig() {
    try {
      await mkdir(defaultDir, { recursive: true })
      await writeFile(
        configFile,
        JSON.stringify({ storageFile, model: modelRoute }, null, 2),
        'utf8'
      )
    } catch (error) {
      console.warn('[design-memory] 写入配置失败：', error && error.message)
    }
  }

  // 只有宿主真的注册了 llm 服务时才可用；没有就老老实实用本地启发式。
  function llmService() {
    try {
      const llm = ctx.llm
      return llm && typeof llm.stream === 'function' ? llm : null
    } catch (error) {
      return null
    }
  }

  async function listModelChoices() {
    const llm = llmService()
    if (!llm) return { available: false, providers: [], models: [] }
    const providers = []
    const models = []
    try {
      const routes = await llm.listProviders()
      for (const route of routes || []) {
        providers.push({ id: route.id, name: route.name || route.displayName || route.id })
        try {
          const list = await llm.listModels(route)
          for (const item of list || []) {
            models.push({ provider: route.id, id: item.id, name: item.name || item.id })
          }
        } catch (error) {
          // 某个 provider 查不到模型就跳过
        }
      }
    } catch (error) {
      return { available: false, providers: [], models: [] }
    }
    return { available: models.length > 0, providers, models }
  }

  // 用宿主模型跑一次文本生成；拿不到模型或出错都返回空字符串，由调用方回退。
  async function askModel(systemText, userText, maxTokens) {
    const llm = llmService()
    if (!llm || !modelRoute.enabled || !modelRoute.provider || !modelRoute.model) return ''
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 45000)
    try {
      const stream = llm.stream({
        provider: modelRoute.provider,
        model: modelRoute.model,
        sessionId: 'design-memory',
        purpose: 'zhiwei-organize',
        maxTokens: maxTokens || 1200,
        signal: controller.signal,
        system: systemText,
        messages: [
          { id: 'zw-' + Date.now().toString(36), role: 'user', content: [{ type: 'text', text: userText }] }
        ]
      })
      let text = ''
      for await (const chunk of stream) {
        const delta = chunk && (chunk.text || chunk.delta || (chunk.content && chunk.content.text))
        if (typeof delta === 'string') text += delta
        else if (chunk && Array.isArray(chunk.content)) {
          for (const part of chunk.content) if (part && part.type === 'text' && typeof part.text === 'string') text += part.text
        }
      }
      clearTimeout(timer)
      return text.trim()
    } catch (error) {
      clearTimeout(timer)
      console.warn('[design-memory] 模型整理失败，回退本地启发式：', error && error.message)
      return ''
    }
  }

  function modelStatus() {
    return {
      enabled: modelRoute.enabled,
      provider: modelRoute.provider,
      model: modelRoute.model,
      available: Boolean(llmService())
    }
  }

  async function load() {
    await readConfig()
    let parsed = null
    try {
      const raw = await readFile(storageFile, 'utf8')
      parsed = JSON.parse(raw)
    } catch (error) {
      if (error && error.code === 'ENOENT') {
        Object.assign(state, migrateStore({}))
        await save()
        return
      }
      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      try {
        await copyFile(storageFile, storageFile + '.corrupt-' + stamp)
      } catch (copyError) {
        // 备份失败不阻塞启动
      }
      console.warn('[design-memory] 读取记忆库失败，已重置：', error && error.message)
      Object.assign(state, migrateStore({}))
      return
    }
    const migrated = migrateStore(parsed || {})
    state.version = migrated.version
    state.projects = migrated.projects
    state.entries = migrated.entries
    state.relations = migrated.relations
    state.collections = migrated.collections
    state.views = migrated.views
    state.proposals = migrated.proposals || []
    state.recalls = migrated.recalls || []
    state.frames = migrated.frames || []
    state.layout = migrated.layout || { positions: {}, updatedAt: '' }
    pruneStore(state)
    if (!parsed || parsed.version !== STORE_VERSION) {
      await save()
    }
  }

  async function save() {
    await mkdir(storageDir, { recursive: true })
    if (existsSync(storageFile)) {
      try {
        await copyFile(storageFile, storageFile + '.bak')
      } catch (error) {
        // 备份失败继续写，避免丢数据
      }
    }
    const payload = JSON.stringify(state, null, 2)
    const temp = storageFile + '.tmp'
    await writeFile(temp, payload, 'utf8')
    await rename(temp, storageFile)
  }

  function persist(mutate) {
    const task = chain.then(async () => {
      const result = await mutate(state)
      pruneStore(state)
      await save()
      return result
    })
    chain = task.catch(() => {})
    return task
  }

  const ready = load()

  // 当前 DSH 的工具契约要求每个工具声明输出：schema + render（可选 presentationMeta）。
  // 知微的四个工具都直接产出给人和模型读的中文文本，因此统一按 string 输出渲染。
  const TEXT_OUTPUT = {
    schema: { type: 'string' },
    render: (_args, value) => [{ type: 'text', text: typeof value === 'string' ? value : String(value === undefined || value === null ? '' : value) }]
  }

  function stats() {
    return computeStats(state)
  }

  function payload() {
    return { ok: true, ...serializeState(state), stats: stats(), storagePath: storageFile }
  }

  ctx.tools.register({
    name: 'design_memory_search',
    description: searchToolDescription(),
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: '精确读取某条记忆的完整内容' },
        query: { type: 'string', description: '全文检索关键词' },
        type: { type: 'string', enum: ENTRY_TYPES, description: '按记忆类型过滤' },
        domain: { type: 'string', enum: DOMAINS, description: '按业务领域过滤' },
        status: { type: 'string', enum: STATUSES, description: '按状态过滤' },
        projectId: { type: 'string', description: '按项目过滤' },
        collectionId: { type: 'string', description: '只看某个集合里的记忆' },
        frameId: { type: 'string', description: '只看某个记忆区（关系图上的框，含嵌套子框）里的记忆' },
        favorites: { type: 'boolean', description: '只看收藏' },
        limit: { type: 'number', description: '返回条数，默认 12，最多 40' }
      },
      additionalProperties: false
    },
    output: TEXT_OUTPUT,
    async execute(params) {
      await ready
      const id = cleanLine(params && params.id, 64)
      if (id) {
        const entry = findEntry(state, id)
        if (!entry) throw httpError(404, 'entry-not-found', '记忆不存在：' + id)
        return describeEntryFull(entry, state)
      }
      const limit = Math.max(1, Math.min(40, Number(params && params.limit) || 12))
      const results = searchEntries(state, params || {})
      if (!results.length) return '没有找到匹配的记忆。'
      const head = '共 ' + results.length + ' 条，显示前 ' + Math.min(limit, results.length) + ' 条：\n'
      const body = results
        .slice(0, limit)
        .map((entry, index) => index + 1 + '. ' + describeEntry(entry, state))
        .join('\n\n')
      return head + body + '\n\n（用 id 读取单条全文）'
    }
  })

  ctx.tools.register({
    name: 'design_memory_write',
    description: [
      '写入「知微」记忆库：保存记忆、改状态、建立带类型的关系、维护记忆集合与项目空间。',
      '新建记忆只需 title + content，其余字段可省略，类型与领域会按内容兜底。',
      '关系类型: belongs_to 归属于 / depends_on 依赖于 / affects 影响 / derived_from 来源于 / references 参考 / conflicts_with 冲突 / supersedes 替代 / refines 细化。',
      '新建集合传 name + memberIds；改集合只传要变的字段。'
    ].join('\n'),
    parameters: writeParameters(),
    output: TEXT_OUTPUT,
    async execute(params) {
      await ready
      const result = await persist((current) => applyAction(current, params))
      return formatWriteResult(result, state)
    }
  })

  ctx.tools.register({
    name: 'design_memory_suggest',
    description: [
      '基于现有记忆库给出「知微」的整理建议：',
      'entry —— 传入一段原始笔记，返回建议的标题、类型、领域、标签、项目及判断理由；',
      'relations —— 传入记忆 id，返回它可能与其他记忆存在的关系（含关系类型与理由）；',
      'collections —— 返回可以把哪些记忆归成一个主题集合（含名称、简介、归类理由）。',
      '建议只是建议：确认前不会写入记忆库，需要用户确认后再用 design_memory_write 落库。'
    ].join('\n'),
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['entry', 'relations', 'collections'], description: '建议类型' },
        text: { type: 'string', description: 'entry: 待整理的原始笔记' },
        title: { type: 'string', description: 'entry: 已知标题（可选）' },
        id: { type: 'string', description: 'relations: 记忆 id' },
        projectId: { type: 'string', description: 'collections: 只在这个项目里聚类' }
      },
      required: ['action'],
      additionalProperties: false
    },
    output: TEXT_OUTPUT,
    async execute(params) {
      await ready
      const action = cleanLine(params && params.action, 20)
      if (action === 'entry') {
        const suggestion = suggestEntry(params, state)
        return [
          '建议标题: ' + suggestion.title,
          '建议类型: ' + TYPE_LABEL[suggestion.type] + '（' + suggestion.typeReason + '）',
          '建议领域: ' +
            (suggestion.domains.length ? suggestion.domains.map((domain) => DOMAIN_LABEL[domain]).join('、') : '暂时无法判断') +
            '（' + suggestion.domainReason + '）',
          '建议标签: ' + (suggestion.tags.length ? suggestion.tags.map((tag) => '#' + tag).join(' ') : '暂无'),
          '建议项目: ' + suggestion.projectId + '（' + suggestion.projectReason + '）',
          '置信度: ' + Math.round(suggestion.confidence * 100) + '%'
        ].join('\n')
      }
      if (action === 'relations') {
        const entry = mustEntry(state, params && params.id)
        const suggestions = suggestRelationsFor(entry, state)
        if (!suggestions.length) return '暂时没有找到可以推荐的关联。'
        return suggestions
          .map((item) => {
            const target = state.entries.find((candidate) => candidate.id === item.targetMemoryId)
            return (
              '→ ' + (target ? target.title : item.targetMemoryId) +
              '\n   关系: ' + RELATION_LABEL[item.relationType] +
              ' · 把握 ' + Math.round(item.confidence * 100) + '%' +
              '\n   理由: ' + item.description
            )
          })
          .join('\n\n')
      }
      if (action === 'collections') {
        const proposals = suggestCollections(state, cleanLine(params && params.projectId, 64))
        if (!proposals.length) return '暂时没有值得单独成团的记忆。'
        return proposals
          .map((proposal) => {
            return (
              '◈ ' + proposal.name + '（' + proposal.memberIds.length + ' 条）\n   ' +
              proposal.description + '\n   理由: ' + proposal.reasons.join('；') +
              '\n   成员: ' +
              proposal.memberIds
                .slice(0, 8)
                .map((id) => {
                  const entry = state.entries.find((item) => item.id === id)
                  return entry ? entry.title : id
                })
                .join(' / ')
            )
          })
          .join('\n\n')
      }
      throw httpError(400, 'unknown-action', '建议类型必须是 entry / relations / collections')
    }
  })

  ctx.tools.register({
    name: 'design_memory_analyze',
    description: [
      '对「知微」记忆库做一次只读分析，帮助 AI 在对话里给出更准确的整理和建议：',
      'organize —— 一条记忆的类型/领域/标签建议、可拆分的原子知识片段、推荐关联与所属集合；',
      'similar —— 找出与这条记忆内容相近的其它记忆（含相近理由）；',
      'relations —— 这条记忆与其他记忆可能存在的带类型关系；',
      'summary —— 对一个项目、一个集合或一组记忆生成主题总结；',
      'conflicts —— 检查可能冲突的记忆，并提示是「被替代」还是「适用不同场景」；',
      'impact —— 分析一条记忆的上下游：谁来源/依赖它，它影响/细化了谁。',
      '所有结果都是建议，不会修改任何数据。'
    ].join('\n'),
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['organize', 'similar', 'relations', 'summary', 'conflicts', 'impact'],
          description: '分析类型'
        },
        id: { type: 'string', description: 'organize/similar/relations/conflicts/impact: 记忆 id' },
        ids: { type: 'array', items: { type: 'string' }, description: 'summary: 指定一组记忆 id' },
        collectionId: { type: 'string', description: 'summary: 对这个记忆集合做总结' },
        projectId: { type: 'string', description: 'summary: 只总结这个项目' },
        limit: { type: 'number', description: 'similar: 返回条数（默认 5）' }
      },
      required: ['action'],
      additionalProperties: false
    },
    output: TEXT_OUTPUT,
    async execute(params) {
      await ready
      const result = runAssist(params, state)
      return formatAssistResult(result, state)
    }
  })

  ctx.tools.register({
    name: 'design_memory_observe',
    description: [
      '把一段对话或笔记交给「知微」自动观察、沉淀成长期记忆。',
      '它会先检索已有记忆：能整合的整合（会记版本与证据），不确定的给更新建议，全新的存成候选记忆（status=pending，等你确认）。',
      '默认不会覆盖任何已确认或固有约定的内容：固有约定的改动只会生成「待确认的修改建议」。',
      '适合在完成一次需求讨论、方案评审、问题排查后调用；不需要用户手动整理。'
    ].join('\n'),
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '要观察的对话或笔记原文（优先）' },
        messages: { type: 'array', items: { type: 'string' }, description: '对话片段数组（没有整段文本时使用）' },
        conversationId: { type: 'string', description: '来源对话标识，便于日后追溯' },
        projectId: { type: 'string', description: '归属项目 id' },
        autoCreate: { type: 'boolean', description: '没有匹配到已有记忆时是否新建候选记忆，默认 true' },
        protectedOnly: { type: 'boolean', description: '只观察固有约定相关内容' }
      },
      additionalProperties: false
    },
    output: TEXT_OUTPUT,
    async execute(params) {
      await ready
      const result = await persist((current) => observeMemories(current, params || {}))
      const lines = []
      if (result.created.length) {
        lines.push('新沉淀 ' + result.created.length + ' 条候选记忆：')
        for (const item of result.created) lines.push('  · ' + item.title + '（' + TYPE_LABEL[item.type] + '）id=' + item.id)
      }
      if (result.updated.length) {
        lines.push('已在原记忆上继续完善 ' + result.updated.length + ' 条：')
        for (const item of result.updated) lines.push('  · ' + item.title + '（' + CHANGE_LABEL[item.changeType] + '）')
      }
      if (result.proposed.length) {
        lines.push('生成 ' + result.proposed.length + ' 条待确认的修改建议（固有约定或存在冲突）：')
        for (const item of result.proposed) lines.push('  · ' + item.title + '（建议 id=' + item.proposalId + '）')
      }
      if (result.reinforced.length) lines.push('已有记忆再次被印证 ' + result.reinforced.length + ' 条（只补了证据，没有改内容）')
      if (result.skipped.length) lines.push('跳过 ' + result.skipped.length + ' 条（' + result.skipped.map((item) => item.reason).join('；') + '）')
      if (result.relations.length) lines.push('顺便发现 ' + result.relations.length + ' 条可能的关联，等你确认')
      return lines.length ? lines.join('\n') : '这次没有发现需要沉淀的新信息。'
    }
  })

  ctx.tools.register({
    name: 'design_memory_recall',
    description: [
      '按当前任务从「知微」里取回最该用的记忆，并记录一次真实调用。',
      '优先级：当前项目已生效且受保护的约定 → 当前项目相关记忆 → 全局用户习惯 → 其它。',
      '返回的每条都带优先级、类型、状态、保护级别和命中理由；固有约定会标明「固有约定，需明确遵守」。',
      '历史方案和已废弃记忆默认不会被当成当前有效规则。'
    ].join('\n'),
    parameters: {
      type: 'object',
      properties: {
        task: { type: 'string', description: '当前任务或问题，例如「写一版活动公告」' },
        projectId: { type: 'string', description: '当前项目 id' },
        frameId: { type: 'string', description: '只在这个记忆区里找（关系图上的框，含嵌套子框）' },
        limit: { type: 'number', description: '取回条数，默认 6，最多 20' }
      },
      required: ['task'],
      additionalProperties: false
    },
    output: TEXT_OUTPUT,
    async execute(params) {
      await ready
      const result = await persist((current) => {
        const ranked = rankRecall(current, params || {})
        recordRecall(current, params || {}, ranked)
        return ranked
      })
      return formatWriteResult(result, state)
    }
  })

  async function handler(req, res) {
    try {
      const requestOrigin = req.headers.origin
      if (requestOrigin !== undefined && !isLoopbackOrigin(requestOrigin)) {
        return sendJson(res, 403, { ok: false, error: { code: 'forbidden-origin', message: '只允许来自本机 DSH 页面的请求' } })
      }
      const url = new URL(req.url || '/', 'http://localhost')
      if (url.pathname !== ROUTE_PATH + '/api' && !url.pathname.startsWith(ROUTE_PATH + '/api/')) {
        return sendJson(res, 404, { ok: false, error: { code: 'not-found', message: '未知的知微接口' } })
      }
      await ready
      if (req.method === 'GET' || req.method === 'HEAD') {
        return sendRaw(res, 200, JSON.stringify(payload()), req.method === 'HEAD')
      }
      if (req.method !== 'POST') {
        res.setHeader('allow', 'GET, POST')
        return sendJson(res, 405, { ok: false, error: { code: 'method-not-allowed', message: '只支持 GET / POST' } })
      }
      const contentType = String(req.headers['content-type'] || '')
      if (!contentType.includes('application/json')) {
        return sendJson(res, 415, {
          ok: false,
          error: { code: 'unsupported-media-type', message: '请求需要 content-type: application/json' }
        })
      }
      const input = await readJsonBody(req)
      const action = cleanLine(input.action, 40)
      if (action === 'suggest.entry') {
        return sendJson(res, 200, { ok: true, suggestion: suggestEntry(input, state) })
      }
      if (action === 'suggest.entry.batch') {
        const items = Array.isArray(input.items) ? input.items.slice(0, 40) : []
        return sendJson(res, 200, {
          ok: true,
          suggestions: items.map((item) => suggestEntry(item, state))
        })
      }
      if (action === 'suggest.relations') {
        const entry = mustEntry(state, input.id)
        return sendJson(res, 200, { ok: true, suggestions: suggestRelationsFor(entry, state) })
      }
      if (action === 'suggest.collections') {
        return sendJson(res, 200, { ok: true, suggestions: suggestCollections(state, cleanLine(input.projectId, 64)) })
      }
      if (action === 'models.list' || action === 'models') {
        const choices = await listModelChoices()
        return sendJson(res, 200, { ok: true, model: modelStatus(), available: choices.available, providers: choices.providers, models: choices.models })
      }
      if (action === 'settings.model') {
        modelRoute = {
          provider: cleanLine(input.provider, 80),
          model: cleanLine(input.model, 120),
          enabled: input.enabled === true
        }
        await writeConfig()
        return sendJson(res, 200, { ok: true, model: modelStatus() })
      }
      if (action === 'ai.analyze') {
        const result = runAssist(input, state)
        const kind = cleanLine(input.analysis || input.kind, 24)
        if (result && (kind === 'organize' || kind === 'organize' === String(result.kind))) {
          const entry = findEntry(state, cleanLine(input.id, 64))
          if (entry) {
            const prompt = [
              '标题：' + entry.title,
              '正文：' + entry.content,
              '现有标签：' + entry.tags.join('、')
            ].join('\n')
            const raw = await askModel(
              '你是游戏策划知识库的整理助手。请只输出 JSON，字段：title(不超过40字)、summary(一句话摘要)、type(decision/rule/assumption/question/proposal/reference/metric/retro/process/habit/convention/context/task 之一)、domains(从 combat/growth/economy/level/event/uiux/monetization/social/operation/tech 里多选)、tags(3-6个短词)。不要输出解释。',
              prompt,
              900
            )
            const parsed = raw ? parseModelJson(raw) : null
            if (parsed) {
              result.model = parsed
              result.mode = 'model'
            } else {
              result.mode = 'heuristic'
              result.note = '模型没有返回可用结果，已使用本地整理'
            }
          }
        }
        return sendJson(res, 200, { ok: true, result })
      }
      if (action === 'memory-tidy' || action === 'tidy') {
        return sendJson(res, 200, { ok: true, report: tidyReport(state) })
      }
      if (action === 'settings.get' || action === 'settings') {
        return sendJson(res, 200, {
          ok: true,
          settings: {
            storagePath: storageFile,
            defaultPath: path.join(defaultDir, 'memories.json'),
            exists: existsSync(storageFile),
            model: modelStatus()
          },
          counts: stats()
        })
      }
      if (action === 'settings.storage') {
        const target = cleanLine(input.path, 400)
        if (!target) throw httpError(400, 'empty-path', '请填写存储文件路径')
        if (!path.isAbsolute(target)) throw httpError(400, 'bad-path', '请填写绝对路径')
        const file = /\.json$/i.test(target) ? target : path.join(target, 'memories.json')
        const dir = path.dirname(file)
        await mkdir(dir, { recursive: true })
        if (existsSync(file) && path.resolve(file) !== path.resolve(storageFile)) {
          await copyFile(file, file + '.before-switch')
        }
        storageFile = file
        storageDir = dir
        await persist(async () => ({}))
        await writeConfig()
        return sendJson(res, 200, { ok: true, storagePath: storageFile, ...serializeState(state), stats: stats() })
      }
      if (action === 'export') {
        return sendJson(res, 200, {
          ok: true,
          exportedAt: isoNow(),
          data: {
            version: STORE_VERSION,
            projects: state.projects,
            entries: state.entries,
            relations: state.relations,
            collections: state.collections,
            views: state.views,
            proposals: state.proposals,
            recalls: state.recalls,
            frames: state.frames,
            layout: state.layout
          }
        })
      }
      const result = await persist((current) => applyAction(current, input))
      return sendJson(res, 200, { ok: true, ...result, ...serializeState(state), stats: stats(), storagePath: storageFile })
    } catch (error) {
      const status = Number.isInteger(error && error.status)
        ? error.status
        : Number.isInteger(error && error.statusCode)
          ? error.statusCode
          : 500
      if (status >= 500) console.warn('[design-memory] api failure:', error)
      return sendJson(res, status, {
        ok: false,
        error: { code: (error && error.code) || 'internal-error', message: (error && error.message) || '未知错误' }
      })
    }
  }

  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(
      () => webCtx.webServer.register({ kind: 'prefix', path: ROUTE_PATH, handler }),
      'design-memory: 知微 knowledge api'
    )
  })

  // 静态提示：告诉模型「知微」存在，以及什么时候该召回、什么时候该沉淀。
  // 真实调用仍然通过 design_memory_recall / design_memory_observe 工具完成，
  // 不伪造自动注入，也不在用户不知情时改库。
  ctx.inject(['systemPrompt'], (promptCtx) => {
    promptCtx.systemPrompt.section({
      name: 'design-memory:zhiwei',
      order: 700,
      text: [
        '你有一个长期记忆库「知微」（工具：design_memory_recall / design_memory_observe / design_memory_search / design_memory_write / design_memory_suggest / design_memory_analyze）。',
        '开始一个设计任务前，先用 design_memory_recall 按任务取回相关记忆：项目当前生效的约定优先，其次项目记忆，再次全局习惯。',
        '取回的内容里，保护级别为「固有约定」的记忆必须遵守，除非用户明确要求改变；历史方案和已废弃记忆不能当作当前规则。',
        '完成一段讨论、评审、排期或排查后，用 design_memory_observe 把稳定的结论沉淀进去，而不是把聊天记录整段存下来。',
        '不要替用户确认新的约定，也不要在没有用户依据时修改固有约定；不确定的内容交给用户判断。'
      ].join('\n')
    })
  })
}

