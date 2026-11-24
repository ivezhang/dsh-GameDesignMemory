/**
 * Host half of the Design memory bundle.
 *
 * Owns one JSON store of planner memories, exposes it to the browser panel over a
 * same-origin HTTP route, and registers two agent tools so the assistant reads and
 * writes the same entries.
 */
import { randomBytes } from 'node:crypto'
import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

export const name = 'design-memory'
export const inject = ['tools']

const ROUTE_PATH = '/design-memory'
const CATEGORIES = ['system', 'numbers', 'other']
const STATUSES = ['draft', 'confirmed', 'deprecated']
const MAX_BODY_BYTES = 2 * 1024 * 1024
const LIMITS = {
  title: 160,
  summary: 600,
  body: 40000,
  source: 400,
  tag: 40,
  tags: 20,
  factLabel: 80,
  factValue: 400,
  facts: 40,
  note: 500,
  history: 30
}

const CATEGORY_LABEL = { system: '系统', numbers: '数值', other: '其他' }
const STATUS_LABEL = { draft: '待确认', confirmed: '已确认', deprecated: '已废弃' }

const SEARCH_PARAMETERS = {
  type: 'object',
  additionalProperties: false,
  properties: {
    query: {
      type: 'string',
      description: '关键词，匹配标题、摘要、正文、标签与要点。省略时按分类/状态列出最近条目。'
    },
    category: {
      type: 'string',
      enum: CATEGORIES,
      description: 'system=系统规则与模块机制；numbers=数值口径、产出消耗、概率阈值；other=流程、I18N、工具链等其他约定。'
    },
    status: {
      type: 'string',
      enum: STATUSES,
      description: 'draft=待确认；confirmed=已确认；deprecated=已废弃。'
    },
    id: {
      type: 'string',
      description: '传入条目 id 读取这一条的全文（此时忽略 query/category/status）。'
    },
    limit: {
      type: 'integer',
      description: '最多返回条数，默认 8，最大 30。'
    }
  }
}

const WRITE_PARAMETERS = {
  type: 'object',
  additionalProperties: false,
  properties: {
    action: {
      type: 'string',
      enum: ['save', 'update', 'delete'],
      description: 'save=新建；update=修改已有条目；delete=删除。'
    },
    id: {
      type: 'string',
      description: 'update / delete 必填：条目 id（来自 design_memory_search 的结果）。'
    },
    category: {
      type: 'string',
      enum: CATEGORIES,
      description: 'system=系统；numbers=数值；other=其他。save 时缺省为 other。'
    },
    title: {
      type: 'string',
      description: '标题，一句话说明这条记忆是什么。save 必填，update 省略则保持不变。'
    },
    summary: {
      type: 'string',
      description: '一句话摘要，说明它解决什么问题。'
    },
    body: {
      type: 'string',
      description: '详细说明：规则、口径、数值、代码位置、结论。纯文本，支持 - 列表与 ### 小标题。'
    },
    tags: {
      type: 'string',
      description: '标签，逗号分隔，例如「战令,奖励,数值」。'
    },
    facts: {
      type: 'string',
      description: '关键要点，每行「名称=值」，例如「随机皮肤放大器=20」；多行用换行分隔。'
    },
    status: {
      type: 'string',
      enum: STATUSES,
      description: 'draft=待确认；confirmed=已确认；deprecated=已废弃。save 缺省为 draft。'
    },
    pinned: {
      type: 'boolean',
      description: '是否置顶在列表最前。'
    },
    note: {
      type: 'string',
      description: '本次改动说明，写入改动记录（update 时建议填写）。'
    },
    source: {
      type: 'string',
      description: '来源：会话标题、文档路径或配置表名。'
    }
  },
  required: ['action']
}

const TEXT_OUTPUT = {
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: { text: { type: 'string' } },
    required: ['text']
  },
  render: (_args, value) => [{ type: 'text', text: String((value && value.text) || '') }]
}

/**
 * Register the store, HTTP route, and agent tools.
 * @param {object} ctx - plugin context providing `tools` and an optional `webServer`.
 */
export function apply(ctx) {
  const home = process.env.DSH_HOME || path.join(homedir(), '.dsh')
  const storageDir = path.join(home, 'design-memory')
  const storageFile = path.join(storageDir, 'memories.json')
  const state = { entries: [] }
  let chain = Promise.resolve()

  const ready = load()

  async function load() {
    try {
      const raw = await readFile(storageFile, 'utf8')
      const parsed = JSON.parse(raw)
      const list = Array.isArray(parsed && parsed.entries) ? parsed.entries : []
      state.entries = list
        .filter((item) => item && typeof item === 'object' && typeof item.title === 'string' && item.title.trim())
        .map(normalizeStored)
    } catch (error) {
      state.entries = []
      if (!error || error.code !== 'ENOENT') {
        console.warn('[design-memory] memories.json unreadable:', error && error.message)
        try {
          await rename(storageFile, storageFile + '.corrupt-' + Date.now())
        } catch {
          /* keep the unreadable file for the user to inspect */
        }
      }
    }
  }

  async function save() {
    await mkdir(storageDir, { recursive: true })
    const temp = storageFile + '.tmp'
    try {
      await copyFile(storageFile, storageFile + '.bak')
    } catch {
      /* the first write has no previous generation to keep */
    }
    await writeFile(temp, JSON.stringify({ version: 1, entries: state.entries }, null, 2), 'utf8')
    await rename(temp, storageFile)
  }

  function persist(mutate) {
    const run = chain.then(async () => {
      mutate(state.entries)
      await save()
    })
    chain = run.catch(() => {})
    return run
  }

  function stats() {
    const byCategory = { system: 0, numbers: 0, other: 0 }
    const byStatus = { draft: 0, confirmed: 0, deprecated: 0 }
    for (const entry of state.entries) {
      byCategory[entry.category] = (byCategory[entry.category] || 0) + 1
      byStatus[entry.status] = (byStatus[entry.status] || 0) + 1
    }
    return { total: state.entries.length, byCategory, byStatus }
  }

  async function createEntry(input) {
    const title = cleanText(input.title, LIMITS.title)
    if (!title) throw httpError(400, 'invalid-title', '标题不能为空')
    const now = new Date().toISOString()
    const entry = {
      id: newEntryId(),
      category: CATEGORIES.includes(input.category) ? input.category : 'other',
      title,
      summary: cleanText(input.summary, LIMITS.summary),
      body: cleanText(input.body, LIMITS.body),
      tags: normalizeTags(input.tags),
      facts: normalizeFacts(input.facts),
      status: STATUSES.includes(input.status) ? input.status : 'draft',
      pinned: input.pinned === true,
      source: cleanText(input.source, LIMITS.source),
      createdAt: now,
      updatedAt: now,
      history: []
    }
    await persist((entries) => {
      entries.unshift(entry)
    })
    return entry
  }

  async function updateEntry(input) {
    const id = typeof input.id === 'string' ? input.id.trim() : ''
    if (!id) throw httpError(400, 'missing-id', 'update 需要 id')
    const index = state.entries.findIndex((entry) => entry.id === id)
    if (index === -1) throw httpError(404, 'not-found', '记忆条目不存在：' + id)
    const current = state.entries[index]
    const next = {
      ...current,
      tags: current.tags.slice(),
      facts: current.facts.map((fact) => ({ ...fact })),
      history: current.history.slice()
    }
    if (input.category !== undefined) {
      if (!CATEGORIES.includes(input.category)) throw httpError(400, 'invalid-category', 'category 必须是 system / numbers / other')
      next.category = input.category
    }
    if (input.title !== undefined) {
      const title = cleanText(input.title, LIMITS.title)
      if (!title) throw httpError(400, 'invalid-title', '标题不能为空')
      next.title = title
    }
    if (input.summary !== undefined) next.summary = cleanText(input.summary, LIMITS.summary)
    if (input.body !== undefined) next.body = cleanText(input.body, LIMITS.body)
    if (input.tags !== undefined) next.tags = normalizeTags(input.tags)
    if (input.facts !== undefined) next.facts = normalizeFacts(input.facts)
    if (input.source !== undefined) next.source = cleanText(input.source, LIMITS.source)
    if (input.status !== undefined) {
      if (!STATUSES.includes(input.status)) throw httpError(400, 'invalid-status', 'status 必须是 draft / confirmed / deprecated')
      next.status = input.status
    }
    if (input.pinned !== undefined) next.pinned = input.pinned === true
    const note = cleanText(input.note, LIMITS.note)
    next.updatedAt = new Date().toISOString()
    next.history = current.history.concat([{ at: next.updatedAt, note }]).slice(-LIMITS.history)
    await persist((entries) => {
      const position = entries.findIndex((entry) => entry.id === id)
      if (position !== -1) entries[position] = next
    })
    return next
  }

  async function deleteEntry(rawId) {
    const id = typeof rawId === 'string' ? rawId.trim() : ''
    if (!id) throw httpError(400, 'missing-id', 'delete 需要 id')
    const index = state.entries.findIndex((entry) => entry.id === id)
    if (index === -1) throw httpError(404, 'not-found', '记忆条目不存在：' + id)
    const entry = state.entries[index]
    await persist((entries) => {
      const position = entries.findIndex((item) => item.id === id)
      if (position !== -1) entries.splice(position, 1)
    })
    return entry
  }

  function searchEntries(input) {
    const needle = typeof input.query === 'string' ? input.query.trim().toLowerCase() : ''
    return state.entries
      .filter((entry) => {
        if (input.category && entry.category !== input.category) return false
        if (input.status && entry.status !== input.status) return false
        if (!needle) return true
        return haystack(entry).includes(needle)
      })
      .sort(compareEntries)
  }

  function formatList(matches, limit) {
    const shown = matches.slice(0, limit)
    const lines = shown.map((entry, index) => {
      const summary = entry.summary ? '\n   ' + entry.summary : ''
      const tags = entry.tags.length ? ' · #' + entry.tags.join(' #') : ''
      return (
        `${index + 1}. [${labelCategory(entry.category)}/${labelStatus(entry.status)}] ${entry.title}${summary}` +
        `\n   id=${entry.id} · 更新 ${formatDay(entry.updatedAt)}${tags}`
      )
    })
    return (
      `找到 ${matches.length} 条（共 ${state.entries.length} 条），显示前 ${shown.length} 条：\n` +
      lines.join('\n') +
      '\n\n要看全文请把这个 id 传给 design_memory_search。'
    )
  }

  ctx.tools.register({
    name: 'design_memory_search',
    description:
      '查询「策划记忆」：该用户是游戏策划，这里长期沉淀了他的系统规则、数值口径与流程约定。改动某个系统、重新配数值，或回答「这个数为什么这么定 / 之前定的多少」之前先查这里。返回带 id 的摘要列表；传 id 读取全文。',
    parameters: SEARCH_PARAMETERS,
    output: TEXT_OUTPUT,
    async execute(args) {
      await ready
      const input = args && typeof args === 'object' ? args : {}
      if (typeof input.id === 'string' && input.id.trim()) {
        const entry = state.entries.find((item) => item.id === input.id.trim())
        if (!entry) return { text: `没有找到 id 为 ${input.id} 的记忆。可先不带 id 搜索候选。` }
        return { text: formatEntry(entry) }
      }
      const limit = Math.min(Math.max(Number.isInteger(input.limit) ? input.limit : 8, 1), 30)
      const matches = searchEntries(input)
      if (!matches.length) {
        if (!state.entries.length) {
          return { text: '策划记忆库目前是空的。用 design_memory_write 记录第一条规则或数值结论。' }
        }
        return { text: `没有匹配的策划记忆（共 ${state.entries.length} 条）。可放宽关键词或分类，或用 design_memory_write 记录新结论。` }
      }
      return { text: formatList(matches, limit) }
    }
  })

  ctx.tools.register({
    name: 'design_memory_write',
    description:
      '写入 / 修改 / 删除「策划记忆」条目（左侧栏同名面板读取同一份数据）。用户确认了新的系统规则、数值结论或流程约定之后调用，让结论跨会话保留。分类：system=系统规则与模块机制；numbers=数值口径、产出消耗、概率阈值；other=流程、I18N、工具链与跨部门约定。facts 每行「名称=值」；tags 逗号分隔；update 的 note 会写入改动记录。',
    parameters: WRITE_PARAMETERS,
    output: TEXT_OUTPUT,
    async execute(args) {
      await ready
      const input = args && typeof args === 'object' ? args : {}
      if (input.action === 'save') {
        const entry = await createEntry(input)
        return {
          text: `已保存【${labelCategory(entry.category)}】记忆：${entry.title}\nid=${entry.id} · 状态 ${labelStatus(entry.status)}`
        }
      }
      if (input.action === 'update') {
        const entry = await updateEntry(input)
        return {
          text:
            `已更新【${labelCategory(entry.category)}】记忆：${entry.title}\n` +
            `id=${entry.id} · 状态 ${labelStatus(entry.status)} · 改动记录 ${entry.history.length} 条`
        }
      }
      if (input.action === 'delete') {
        const entry = await deleteEntry(input.id)
        return { text: `已删除记忆：${entry.title}（id=${entry.id}）` }
      }
      throw new Error('action 必须是 save / update / delete')
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
        return sendJson(res, 404, { ok: false, error: { code: 'not-found', message: '未知的策划记忆接口' } })
      }
      await ready
      if (req.method === 'GET' || req.method === 'HEAD') {
        const body = JSON.stringify({ ok: true, entries: state.entries, stats: stats(), storagePath: storageFile })
        return sendRaw(res, 200, body, req.method === 'HEAD')
      }
      if (req.method !== 'POST') {
        return sendJson(res, 405, { ok: false, error: { code: 'method-not-allowed', message: '只支持 GET / POST' } })
      }
      const contentType = String(req.headers['content-type'] || '')
      if (!contentType.includes('application/json')) {
        return sendJson(res, 415, { ok: false, error: { code: 'unsupported-media-type', message: '请求需要 content-type: application/json' } })
      }
      const input = await readJsonBody(req)
      const result = await mutate(input)
      return sendJson(res, 200, {
        ok: true,
        ...result,
        entries: state.entries,
        stats: stats(),
        storagePath: storageFile
      })
    } catch (error) {
      const status = Number.isInteger(error && error.status) ? error.status : 500
      if (status >= 500) console.warn('[design-memory] api failure:', error)
      return sendJson(res, status, {
        ok: false,
        error: { code: (error && error.code) || 'internal-error', message: (error && error.message) || '未知错误' }
      })
    }
  }

  async function mutate(input) {
    if (!input || typeof input !== 'object') throw httpError(400, 'invalid-payload', '请求体必须是 JSON 对象')
    if (input.action === 'save') return { entry: await createEntry(input) }
    if (input.action === 'update') return { entry: await updateEntry(input) }
    if (input.action === 'delete') return { entry: await deleteEntry(input.id) }
    throw httpError(400, 'unknown-action', 'action 必须是 save / update / delete')
  }

  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(
      () => webCtx.webServer.register({ kind: 'prefix', path: ROUTE_PATH, handler }),
      'design-memory: same-origin memory api'
    )
  })
}

function newEntryId() {
  return 'mem_' + Date.now().toString(36) + '_' + randomBytes(3).toString('hex')
}

function httpError(status, code, message) {
  const error = new Error(message)
  error.status = status
  error.code = code
  return error
}

function isLoopbackOrigin(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' && (url.hostname === '127.0.0.1' || url.hostname === 'localhost' || url.hostname === '::1' || url.hostname === '[::1]')
  } catch {
    return false
  }
}

function cleanText(value, max) {
  if (typeof value !== 'string') return ''
  return value.replace(/\r\n/g, '\n').trim().slice(0, max)
}

function normalizeTags(value) {
  const list = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[,，;；、]/) : []
  const seen = new Set()
  const tags = []
  for (const item of list) {
    if (typeof item !== 'string') continue
    const tag = item.trim().replace(/^#/, '').slice(0, LIMITS.tag)
    if (!tag) continue
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    tags.push(tag)
    if (tags.length >= LIMITS.tags) break
  }
  return tags
}

function normalizeFacts(value) {
  let rows = []
  if (Array.isArray(value)) {
    rows = value
  } else if (typeof value === 'string') {
    rows = value.split(/\r?\n/).map((line) => {
      const match = line.match(/^\s*[-*]?\s*([^=:：]+?)\s*[=:：]\s*(.*)$/)
      return match ? { label: match[1], value: match[2] } : { label: line, value: '' }
    })
  }
  const facts = []
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    const label = typeof row.label === 'string' ? row.label.trim().slice(0, LIMITS.factLabel) : ''
    const rawValue = row.value
    const value =
      typeof rawValue === 'string'
        ? rawValue.trim().slice(0, LIMITS.factValue)
        : rawValue === undefined || rawValue === null
          ? ''
          : String(rawValue).slice(0, LIMITS.factValue)
    if (!label && !value) continue
    facts.push({ label, value })
    if (facts.length >= LIMITS.facts) break
  }
  return facts
}

function normalizeStored(raw) {
  const now = new Date().toISOString()
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newEntryId(),
    category: CATEGORIES.includes(raw.category) ? raw.category : 'other',
    title: typeof raw.title === 'string' ? raw.title.slice(0, LIMITS.title) : '',
    summary: typeof raw.summary === 'string' ? raw.summary.slice(0, LIMITS.summary) : '',
    body: typeof raw.body === 'string' ? raw.body.slice(0, LIMITS.body) : '',
    tags: normalizeTags(raw.tags),
    facts: normalizeFacts(raw.facts),
    status: STATUSES.includes(raw.status) ? raw.status : 'draft',
    pinned: raw.pinned === true,
    source: typeof raw.source === 'string' ? raw.source.slice(0, LIMITS.source) : '',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
    history: Array.isArray(raw.history)
      ? raw.history
          .filter((item) => item && typeof item.at === 'string')
          .map((item) => ({ at: item.at, note: typeof item.note === 'string' ? item.note.slice(0, LIMITS.note) : '' }))
          .slice(-LIMITS.history)
      : []
  }
}

function haystack(entry) {
  return [
    entry.title,
    entry.summary,
    entry.body,
    entry.source,
    entry.tags.join(' '),
    entry.facts.map((fact) => fact.label + ' ' + fact.value).join(' ')
  ]
    .join(' ')
    .toLowerCase()
}

function compareEntries(left, right) {
  const pinned = (right.pinned ? 1 : 0) - (left.pinned ? 1 : 0)
  if (pinned !== 0) return pinned
  return String(right.updatedAt).localeCompare(String(left.updatedAt))
}

function labelCategory(value) {
  return CATEGORY_LABEL[value] || value
}

function labelStatus(value) {
  return STATUS_LABEL[value] || value
}

function formatDay(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return String(iso || '')
  return date.toLocaleDateString('zh-CN')
}

function formatEntry(entry) {
  const lines = [
    `【${labelCategory(entry.category)} · ${labelStatus(entry.status)}】${entry.title}`,
    `id: ${entry.id} ｜ 更新: ${formatDay(entry.updatedAt)} ｜ 标签: ${entry.tags.length ? entry.tags.join('、') : '无'}`
  ]
  if (entry.summary) lines.push('摘要: ' + entry.summary)
  if (entry.facts.length) {
    lines.push('要点:')
    for (const fact of entry.facts) lines.push(`- ${fact.label || '（未命名）'}: ${fact.value}`)
  }
  if (entry.body) {
    lines.push('正文:')
    lines.push(entry.body)
  }
  if (entry.source) lines.push('来源: ' + entry.source)
  if (entry.history.length) {
    lines.push('改动记录:')
    for (const item of entry.history.slice(-5)) lines.push(`- ${formatDay(item.at)} ${item.note || '（未填写说明）'}`)
  }
  return lines.join('\n')
}

async function readJsonBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) throw httpError(413, 'payload-too-large', '请求体过大')
    chunks.push(chunk)
  }
  const text = Buffer.concat(chunks).toString('utf8')
  if (!text.trim()) return {}
  try {
    return JSON.parse(text)
  } catch {
    throw httpError(400, 'invalid-json', '请求体不是合法 JSON')
  }
}

function sendJson(res, status, payload) {
  sendRaw(res, status, JSON.stringify(payload))
}

function sendRaw(res, status, body, headOnly) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  })
  res.end(headOnly ? undefined : body)
}
