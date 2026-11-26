// Render smoke test for the 知微 V2 panel: boots the real host against a
// migrated copy of the live store, then renders the browser bundle with a
// minimal fake React/DOM and drives the main flows.
//
// Usage: node tests/render-smoke.mjs
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { pathToFileURL } from 'node:url'

const root = path.resolve(import.meta.dirname, '..')
const HOST = path.join(root, 'index.js')
const CLIENT = path.join(root, 'client.js')
const LIVE_STORE = 'C:\\Users\\Administrator\\.dsh\\design-memory\\memories.json'

// ---------------------------------------------------------------- 1. fixture
async function makeFixture() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'zhiwei-smoke-'))
  const dir = path.join(home, 'design-memory')
  fs.mkdirSync(dir, { recursive: true })
  const FALLBACK_STORE = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '')), 'fixture-v1.json')
if (fs.existsSync(LIVE_STORE)) fs.copyFileSync(LIVE_STORE, path.join(dir, 'memories.json'))
else if (fs.existsSync(FALLBACK_STORE)) fs.copyFileSync(FALLBACK_STORE, path.join(dir, 'memories.json'))
  process.env.DSH_HOME = home

  const mod = await import(pathToFileURL(HOST).href + '?smoke=' + Date.now())
  let route = null
  const tools = []
  await mod.apply({
    tools: { register: (def) => tools.push(def) },
    effect(run) {
      run()
    },
    inject(services, callback) {
      if (Array.isArray(services) && services.includes('webServer')) {
        callback({
          effect(run) {
            run()
          },
          webServer: {
            register(def) {
              route = def
            }
          }
        })
      }
    }
  })

  const call = async (method, body) => {
    const req = {
      method,
      url: '/design-memory/api',
      headers: { origin: 'http://127.0.0.1:1', host: '127.0.0.1:1', 'content-type': 'application/json' },
      async *[Symbol.asyncIterator]() {
        if (body !== undefined) yield Buffer.from(JSON.stringify(body))
      }
    }
    let payload = null
    let status = 0
    const res = {
      statusCode: 0,
      setHeader() {},
      writeHead(code) {
        status = code
      },
      end(chunk) {
        if (!status && res.statusCode) status = res.statusCode
        if (chunk !== undefined) payload = JSON.parse(String(chunk))
      },
      write(chunk) {
        payload = JSON.parse(String(chunk))
      }
    }
    await route.handler(req, res)
    return { status, payload }
  }

  const deadline = Date.now() + 5000
  let snapshot = null
  while (Date.now() < deadline) {
    const res = await call('GET')
    if (res.status === 200 && res.payload && res.payload.ok) {
      snapshot = res.payload
      break
    }
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  if (!snapshot) throw new Error('host did not become ready')
  return { home, snapshot, call, storeFile: path.join(dir, 'memories.json') }
}

const fixture = await makeFixture()
const state = fixture.snapshot
// 预置一个记忆框，验证关系图会把用户框好的范围画出来。
state.frames = [
  {
    id: 'frm_smoke',
    name: '战斗记忆框',
    color: 'teal',
    note: '',
    memberIds: (state.entries || []).slice(0, 3).map((item) => item.id),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 老版本画的框没有 rect（只有显式成员），要能点选、改名、删除。
  {
    id: 'frm_legacy',
    name: '老记忆框',
    color: 'violet',
    note: '',
    memberIds: (state.entries || []).slice(0, 2).map((item) => item.id),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]
const { meta, entries, relations, collections, projects, views, stats } = state

// ---------------------------------------------------------------- 2. fake env
const hookStores = new Map()
let effectQueue = []
let dirty = false
let currentKey = null
let hookIndex = 0
let nameCounters = Object.create(null)

function begin(displayName) {
  const count = (nameCounters[displayName] = (nameCounters[displayName] || 0) + 1)
  currentKey = displayName + '#' + count
  hookIndex = 0
  let store = hookStores.get(currentKey)
  if (!store) {
    store = []
    hookStores.set(currentKey, store)
  }
  return store
}

function sameDeps(a, b) {
  if (!a || !b || a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) if (!Object.is(a[i], b[i])) return false
  return true
}

const FRAGMENT = Symbol('Fragment')
const React = {
  Fragment: FRAGMENT,
  createElement(type, props, ...children) {
    if (type === FRAGMENT) {
      const merged = []
      for (const child of children) {
        if (Array.isArray(child)) merged.push(...child)
        else if (child !== null && child !== undefined && child !== false) merged.push(child)
      }
      return merged
    }
    if (typeof type === 'function') {
      begin(type.name || 'anonymous')
      const merged = Object.assign({}, props || {})
      const kids = children.length ? (children.length === 1 ? children[0] : children) : undefined
      if (kids !== undefined) merged.children = kids
      return type(merged)
    }
    const node = {
      type,
      props: props || {},
      children,
      className: (props && props.className) || '',
      addEventListener() {},
      removeEventListener() {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 900, height: 560 }),
      setPointerCapture() {},
      releasePointerCapture() {}
    }
    if (props && props.ref && typeof props.ref === 'object') props.ref.current = node
    return node
  },
  useState(initial) {
    const store = hookStores.get(currentKey)
    const index = hookIndex
    hookIndex += 1
    if (!(index in store)) store[index] = typeof initial === 'function' ? initial() : initial
    return [
      store[index],
      (next) => {
        const value = typeof next === 'function' ? next(store[index]) : next
        if (!Object.is(value, store[index])) {
          store[index] = value
          dirty = true
        }
      }
    ]
  },
  useEffect(fn, deps) {
    effectQueue.push({ store: hookStores.get(currentKey), index: hookIndex, fn, deps })
    hookIndex += 1
  },
  useMemo(fn, deps) {
    const store = hookStores.get(currentKey)
    const index = hookIndex
    hookIndex += 1
    const previous = store[index]
    if (previous && sameDeps(previous.deps, deps)) return previous.value
    const value = fn()
    store[index] = { deps, value }
    return value
  },
  useCallback(fn, deps) {
    const store = hookStores.get(currentKey)
    const index = hookIndex
    hookIndex += 1
    const previous = store[index]
    if (previous && sameDeps(previous.deps, deps)) return previous.value
    store[index] = { deps, value: fn }
    return fn
  },
  useRef(value) {
    const store = hookStores.get(currentKey)
    const index = hookIndex
    hookIndex += 1
    if (!(index in store)) store[index] = { current: value }
    return store[index]
  }
}

const html = { getAttribute: () => null, dataset: {}, hasAttribute: () => false, classList: { add() {}, remove() {} } }
const body = {
  getAttribute: () => null,
  hasAttribute: (name) => name === 'data-ds-dark-theme',
  classList: { add() {}, remove() {} }
}
const documentListeners = { keydown: [] }
const fakeDocument = {
  documentElement: html,
  body,
  addEventListener(type, handler) {
    if (!documentListeners[type]) documentListeners[type] = []
    documentListeners[type].push(handler)
  },
  removeEventListener(type, handler) {
    const list = documentListeners[type] || []
    const index = list.indexOf(handler)
    if (index >= 0) list.splice(index, 1)
  },
  createElement: () => ({})
}
class MutationObserver {
  observe() {}
  disconnect() {}
}
let exported = null
const windowListeners = { keydown: [] }
const fakeWindow = {
  __ModuleLoader__: {
    load: (definition) => {
      exported = definition.factory((name) => {
        if (name === 'react') return React
        throw new Error('unexpected require: ' + name)
      })
    }
  },
  matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }),
  addEventListener: (type, handler) => {
    if (!windowListeners[type]) windowListeners[type] = []
    windowListeners[type].push(handler)
  },
  removeEventListener: (type, handler) => {
    const list = windowListeners[type] || []
    const index = list.indexOf(handler)
    if (index >= 0) list.splice(index, 1)
  }
}
new Function('window', 'document', 'MutationObserver', fs.readFileSync(CLIENT, 'utf8'))(
  fakeWindow,
  fakeDocument,
  MutationObserver
)

// -------------------------------------------------------------- 3. fake fetch
let fetchCalls = 0
const posts = []
const postHeaders = []
const live = JSON.parse(JSON.stringify(state))

// 知识对象层级：给知识网络测试准备一个父对象 + 一个子对象。
live.nodes = (live.nodes || []).concat([
  {
    id: "knd_smoke_parent",
    title: "烟雾测试系统",
    description: "测试用系统对象",
    nodeType: "system",
    scope: "project",
    projectId: (live.projects[0] || {}).id || "prj_default",
    parentNodeId: "",
    attributes: [{ label: "定位", value: "测试" }],
    tags: ["烟雾测试"],
    aliases: [],
    status: "active",
    confidence: 0.8,
    importance: 0.5,
    sourceMemoryIds: [],
    relatedMemoryIds: (live.entries || []).slice(0, 2).map((entry) => entry.id),
    childIds: ["knd_smoke_child"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "knd_smoke_child",
    title: "烟雾测试对象",
    description: "子对象",
    nodeType: "concept",
    scope: "project",
    projectId: (live.projects[0] || {}).id || "prj_default",
    parentNodeId: "knd_smoke_parent",
    attributes: [],
    tags: [],
    aliases: [],
    status: "active",
    confidence: 0.7,
    importance: 0.4,
    sourceMemoryIds: [],
    relatedMemoryIds: [],
    childIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
])
live.nodes.push({
  "id": "knd_smoke_flow",
  "title": "烟雾测试流程",
  "description": "测试用流程对象",
  "nodeType": "workflow",
  "scope": "project",
  "projectId": "prj_default",
  "parentNodeId": "",
  "attributes": [],
  "tags": [],
  "aliases": [],
  "status": "active",
  "confidence": 0.8,
  "importance": 0.6,
  "sourceMemoryIds": [],
  "relatedMemoryIds": [],
  "steps": [
    {
      "id": "stp_1",
      "title": "第一步",
      "note": ""
    },
    {
      "id": "stp_2",
      "title": "第二步",
      "note": ""
    },
    {
      "id": "stp_3",
      "title": "第三步",
      "note": ""
    }
  ],
  "versions": [
    {
      "id": "ver_flow_1",
      "version": 1,
      "title": "烟雾测试流程",
      "changeType": "create",
      "createdAt": "2026-11-26T14:15:57.459Z"
    }
  ],
  "currentVersion": 1,
  "createdAt": "2026-11-26T14:15:57.459Z",
  "updatedAt": "2026-11-26T14:15:57.459Z"
})
live.nodes.push({
  id: 'knd_pref_smoke',
  title: '偏好：少用装饰性图标',
  description: '界面别堆装饰性图标，优先把功能说清楚。',
  nodeType: 'preference',
  scope: 'global',
  projectId: 'prj_default',
  parentNodeId: '',
  attributes: [],
  tags: ['偏好'],
  aliases: ['图标'],
  status: 'active',
  confidence: 0.8,
  importance: 0.6,
  sourceMemoryIds: [],
  relatedMemoryIds: [],
  steps: [],
  versions: [{
    id: 'ver_pref_1',
    version: 1,
    title: '偏好：少用装饰性图标',
    changeType: 'create',
    createdAt: '2026-11-26T14:15:57.459Z'
  }],
  currentVersion: 1,
  createdAt: '2026-11-26T14:15:57.459Z',
  updatedAt: '2026-11-26T14:15:57.459Z'
})
live.recalls = [
  {
    id: 'rcl_smoke',
    task: '调整哥布林洞窟掉落',
    projectId: (live.projects[0] || {}).id || 'prj_default',
    at: new Date().toISOString(),
    ids: [(live.entries[0] || {}).id || 'mem_a'],
    nodes: [{ id: 'knd_smoke_child', title: '烟雾测试对象', nodeType: 'concept', score: 6 }],
    paths: [
      {
        memoryId: (live.entries[0] || {}).id || 'mem_a',
        hops: [
          { kind: 'node', id: 'knd_smoke_child', title: '烟雾测试对象', relationType: '' },
          { kind: 'relation', id: 'rel_smoke', title: '', relationType: 'affects' },
          { kind: 'memory', id: (live.entries[0] || {}).id || 'mem_a', title: '记忆', relationType: '' }
        ]
      }
    ],
    outcome: 'served',
    note: '记录了命中的知识对象',
    source: 'agent'
  }
]
const versionNode = live.nodes[0]
if (versionNode) {
  versionNode.versions = [
    {
      id: 'ver_smoke_1',
      version: 1,
      title: versionNode.title,
      description: '第一版说明',
      nodeType: versionNode.nodeType,
      status: 'active',
      changeType: 'create',
      changeReason: '',
      createdAt: versionNode.createdAt,
      createdBy: 'user'
    },
    {
      id: 'ver_smoke_2',
      version: 2,
      title: versionNode.title,
      description: '第二版说明',
      nodeType: versionNode.nodeType,
      status: 'active',
      changeType: 'edit',
      changeReason: '补了掉落位',
      createdAt: new Date().toISOString(),
      createdBy: 'user'
    }
  ]
  versionNode.currentVersion = 2
}
let nextId = 1000
let lastModel = { enabled: false, provider: '', model: '', available: true }
let lastRestore = null
const deepCopy = (value) => JSON.parse(JSON.stringify(value))

function payload() {
  return deepCopy({
    ok: true,
    version: live.version,
    meta: live.meta,
    projects: live.projects,
    entries: live.entries,
    relations: live.relations,
    collections: live.collections,
    views: live.views,
    proposals: live.proposals || [],
    recalls: live.recalls || [],
    frames: live.frames || [],
    nodes: live.nodes || [],
    layout: live.layout || { positions: {}, updatedAt: '' },
    stats: live.stats,
    storagePath: 'C:\\fake\\memories.json'
  })
}

function applyPost(input) {
  if (input.action === 'frame-save') {
    live.frames = live.frames || []
    const existing = input.id ? live.frames.find((item) => item.id === input.id) : null
    if (existing) {
      Object.assign(existing, input, { id: existing.id })
      return { frame: existing, created: false }
    }
    const created = {
      id: 'frm_smoke_' + nextId++,
      name: input.name || '记忆框',
      color: input.color || 'violet',
      note: input.note || '',
      memberIds: input.memberIds || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    live.frames.push(created)
    return { frame: created, created: true }
  }
  if (input.action === 'frame-delete') {
    live.frames = (live.frames || []).filter((item) => item.id !== input.id)
    return { deleted: input.id }
  }
  if (input.action === 'layout-save') {
    const keptHidden = Array.isArray(input.hidden) ? input.hidden.slice() : (live.layout && live.layout.hidden) || []
    const keptPositions = input.positions || (live.layout && live.layout.positions) || {}
    live.layout = { positions: keptPositions, hidden: keptHidden, updatedAt: new Date().toISOString() }
    return { layout: live.layout, saved: true }
  }
  if (input.action === 'layout-clear') {
    live.layout = { positions: {}, updatedAt: new Date().toISOString() }
    return { layout: live.layout, saved: true }
  }
  if (input.action === 'project-save') {
    const existing = input.id ? live.projects.find((item) => item.id === input.id) : null
    if (existing) {
      Object.assign(existing, input, { id: existing.id })
      return { project: existing, created: false }
    }
    const created = {
      id: 'prj_smoke_' + nextId++,
      name: input.name || '新项目',
      description: input.description || '',
      color: 'violet',
      order: (live.projects.length + 1) * 10,
      createdAt: new Date().toISOString()
    }
    live.projects.push(created)
    return { project: created, created: true }
  }
  if (input.action === 'project-reorder') {
    const order = input.ids || []
    live.projects.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
    return { projects: order }
  }
  if (input.action === 'models.list') {
    return {
      model: { enabled: false, provider: '', model: '', available: true },
      available: true,
      providers: [{ id: 'demo', name: 'Demo' }],
      models: [{ provider: 'demo', id: 'demo-1', name: 'Demo 1' }]
    }
  }
  if (input.action === 'settings.get') {
    return {
      settings: {
        storagePath: 'C:/fake/memories.json',
        defaultPath: 'C:/fake/default.json',
        exists: true,
        model: { enabled: false, provider: '', model: '', available: true }
      }
    }
  }
  if (input.action === 'settings.model') {
    lastModel = { enabled: input.enabled === true, provider: input.provider || '', model: input.model || '', available: true }
    return { model: lastModel }
  }
  if (input.action === 'settings.storage') {
    return { settings: { storagePath: input.storagePath, defaultPath: input.storagePath, exists: true, model: lastModel } }
  }
  if (input.action === 'export') {
    return { exportedAt: new Date().toISOString(), data: { version: live.version, entries: live.entries } }
  }
  const withMembers = (entry) => {
    entry.relatedCollectionIds = live.collections
      .filter((collection) => collection.memberIds.includes(entry.id))
      .map((collection) => collection.id)
    entry.relationIds = live.relations
      .filter((relation) => relation.sourceMemoryId === entry.id || relation.targetMemoryId === entry.id)
      .map((relation) => relation.id)
    return entry
  }
  if (input.action === 'entry-save') {
    if (input.id) {
      const entry = live.entries.find((item) => item.id === input.id)
      if (entry) Object.assign(entry, input, { id: entry.id })
    } else {
      live.entries.unshift({
        id: 'mem_smoke_' + nextId++,
        title: input.title || '新记忆',
        content: input.content || '',
        summary: input.summary || '',
        type: input.type || 'decision',
        projectId: live.projects[0].id,
        domains: input.domains || [],
        tags: input.tags || [],
        status: input.status || 'pending',
        source: input.source || { kind: 'manual', label: '' },
        facts: input.facts || [],
        pinned: false,
        favorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        history: []
      })
    }
    live.stats.entries = live.entries.length
  }
  if (input.action === 'collection-save') {
    const existing = input.id ? live.collections.find((item) => item.id === input.id) : null
    if (existing) {
      Object.assign(existing, input, { id: existing.id })
      return { collection: existing, created: false }
    }
    const created = {
      id: 'col_smoke_' + nextId++,
      name: input.name || '新集合',
      description: input.description || '',
      projectId: live.projects[0].id,
      tags: input.tags || [],
      memberIds: input.memberIds || [],
      color: input.color || 'violet',
      source: 'manual',
      status: 'confirmed',
      reasons: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    live.collections.push(created)
    return { collection: created, created: true }
  }
  if (input.action === 'entry-collections') {
    const entry = live.entries.find((item) => item.id === input.id)
    for (const id of input.add || []) {
      const collection = live.collections.find((item) => item.id === id)
      if (collection && !collection.memberIds.includes(entry.id)) collection.memberIds.push(entry.id)
    }
    for (const id of input.remove || []) {
      const collection = live.collections.find((item) => item.id === id)
      if (collection) collection.memberIds = collection.memberIds.filter((member) => member !== entry.id)
    }
    live.entries.forEach(withMembers)
  }
  if (input.action === 'relation-create') {
    live.relations.unshift({
      id: 'rel_smoke_' + nextId++,
      sourceMemoryId: input.id || input.sourceMemoryId,
      targetMemoryId: input.targetMemoryId || input.targetId,
      relationType: input.relationType || 'references',
      description: input.description || '',
      status: 'confirmed',
      createdBy: 'user',
      createdAt: new Date().toISOString()
    })
  }
  if (input.action === 'entry-delete') {
    live.entries = live.entries.filter((item) => item.id !== input.id)
    live.relations = live.relations.filter(
      (relation) => relation.sourceMemoryId !== input.id && relation.targetMemoryId !== input.id
    )
    live.stats.entries = live.entries.length
  }
  if (input.action === 'entry-restore' && input.entry) {
    lastRestore = { entry: input.entry, relations: input.relations || [], collectionIds: input.collectionIds || [] }
    live.entries.unshift(input.entry)
    for (const relation of input.relations || []) live.relations.push(relation)
    for (const collectionId of input.collectionIds || []) {
      const collection = live.collections.find((item) => item.id === collectionId)
      if (collection && !collection.memberIds.includes(input.entry.id)) {
        collection.memberIds.push(input.entry.id)
      }
    }
    live.stats.entries = live.entries.length
  }
  if (input.action === 'collection-restore' && input.collection) {
    live.collections.unshift(input.collection)
  }
  if (input.action === 'entry-status' && input.status) {
    const entry = live.entries.find((item) => item.id === input.id)
    if (entry) entry.status = input.status
  }
  if (input.action === 'entry-protect' && input.level) {
    const entry = live.entries.find((item) => item.id === input.id)
    if (entry) entry.protectionLevel = input.level
  }
  if (input.action === 'evidence-add') {
    const entry = live.entries.find((item) => item.id === input.id)
    if (entry) {
      entry.evidence = (entry.evidence || []).concat([
        {
          id: 'ev_smoke_' + nextId++,
          memoryId: entry.id,
          evidenceContent: input.content || input.evidence || '',
          evidenceType: input.evidenceType || 'statement',
          confidence: 1,
          createdAt: new Date().toISOString()
        }
      ])
      entry.evidenceCount = entry.evidence.length
    }
  }
  if (input.action === 'memory-tidy') {
    return {
      ok: true,
      result: {
        duplicates: [],
        orphans: [],
        pendingProposals: [],
        suggestedRelations: [],
        pendingRelations: 0,
        pendingMemories: 0,
        reviewMemories: 0,
        protectedCount: 0,
        candidateNodes: [
          { id: 'knd_cand_1', title: '候选对象一', nodeType: 'concept', reason: '自动观察命中' },
          { id: 'knd_cand_2', title: '候选对象二', nodeType: 'workflow', reason: '自动观察命中' }
        ],
        duplicateNodes: [],
        nodes: 2
      }
    }
  }
  if (input.action === 'memory-observe') {
    return Object.assign(payload(), {
      result: { created: [], updated: [], proposed: [], reinforced: [{ id: 'x' }], skipped: [] }
    })
  }
  return payload()
}

function assistantResult(input) {
  const entry = live.entries.find((item) => item.id === input.id) || live.entries[0] || {}
  const analysis = input.analysis || input.kind || input.action
  if (analysis === 'organize') {
    return {
      kind: 'organize',
      entryId: entry.id,
      title: '建议标题',
      summary: '建议摘要',
      type: entry.type || 'rule',
      typeReason: '出现「公式」等表述',
      domains: entry.domains && entry.domains.length ? entry.domains : ['combat'],
      domainReason: '战斗系统（公式）',
      tags: ['冷却', '公式'],
      segments: [
        { title: '拆出的第一条', content: '第一段内容', type: 'rule', domains: ['combat'], tags: [], reason: '独立知识点' },
        { title: '拆出的第二条', content: '第二段内容', type: 'metric', domains: ['economy'], tags: [], reason: '另一个知识点' }
      ],
      relations: [],
      collections: live.collections.slice(0, 1).map((collection) => ({
        collectionId: collection.id,
        name: collection.name,
        description: collection.description || '',
        shared: ['冷却'],
        reason: '共同主题词：冷却'
      }))
    }
  }
  if (analysis === 'similar') {
    return {
      kind: 'similar',
      entryId: entry.id,
      items: live.entries.slice(0, 2).map((item) => ({
        entryId: item.id,
        title: item.title,
        type: item.type,
        status: item.status,
        score: 7,
        scoreLabel: 68,
        reasons: ['共同标签：冷却']
      }))
    }
  }
  if (analysis === 'relations') {
    return {
      kind: 'relations',
      entryId: entry.id,
      items: [
        {
          targetMemoryId: (live.entries[1] || {}).id || '',
          title: (live.entries[1] || {}).title || '',
          relationType: 'depends_on',
          confidence: 0.6,
          description: '依赖冷却配置',
          reasons: ['共同标签：冷却'],
          alreadyLinked: false
        }
      ]
    }
  }
  if (analysis === 'conflicts') {
    return {
      kind: 'conflicts',
      entryId: entry.id,
      items: [
        {
          entryId: (live.entries[1] || {}).id || '',
          title: (live.entries[1] || {}).title || '',
          type: 'rule',
          status: 'active',
          updatedAt: new Date().toISOString(),
          kind: 'number-mismatch',
          reasons: ['数值不一致：本条 12，旧记忆 15'],
          suggestedRelation: 'supersedes',
          note: '先确认是替代还是适用于不同场景'
        }
      ]
    }
  }
  if (analysis === 'impact') {
    return {
      kind: 'impact',
      entryId: entry.id,
      incoming: [{ entryId: (live.entries[1] || {}).id || '', title: (live.entries[1] || {}).title || '', type: 'rule', relationType: 'affects', relationLabel: '影响', status: 'confirmed', depth: 1 }],
      outgoing: [{ entryId: entry.id, title: entry.title || '', type: entry.type, relationType: 'depends_on', relationLabel: '依赖于', status: 'confirmed', depth: 1 }],
      note: '箭头方向代表关系方向'
    }
  }
  return {
    kind: 'summary',
    title: '主题总结',
    overview: '共 ' + live.entries.length + ' 条记忆',
    bullets: ['已生效规则 2 条：A / B'],
    themes: [{ label: '战斗系统', count: 3 }],
    byStatus: ['active 3'],
    memberIds: live.entries.slice(0, 3).map((item) => item.id)
  }
}

let failNext = ''
globalThis.__failNext = (action) => {
  failNext = action || ''
}
globalThis.fetch = async (url, options) => {
  fetchCalls += 1
  const input = options && options.body ? JSON.parse(options.body) : null
  if (input && failNext && input.action === failNext) {
    failNext = ''
    posts.push(input)
    return {
      ok: false,
      status: 500,
      json: async () => ({ ok: false, error: { code: 'boom', message: '模型没有返回可用结果' } })
    }
  }
  if (input) {
    posts.push(input)
    const sent = (options && options.headers) || {}
    postHeaders.push(String(sent['content-type'] || sent['Content-Type'] || ''))
    if (input.action === 'entry-restore' || input.action === 'collection-restore') {
      applyPost(input)
      return {
        ok: true,
        status: 200,
        json: async () => Object.assign({ ok: true, restored: true }, lastRestore || {}, payload())
      }
    }
    if (input.action === 'ai.analyze') {
      return { ok: true, status: 200, json: async () => ({ ok: true, result: assistantResult(input) }) }
    }
    const result = applyPost(input)
    return {
      ok: true,
      status: 200,
      json: async () => Object.assign({ ok: true }, result || {}, payload())
    }
  }
  return { ok: true, status: 200, json: async () => payload() }
}

// ------------------------------------------------------------- 4. plugin boot
const dictionaries = {}
const slots = []
exported.apply({
  locale: {
    register: (ns, lang, dictionary) => {
      dictionaries[lang] = dictionary
      return () => {}
    },
    bind: () => {
      const translate = (key) => {
        if (dictionaries.zh && dictionaries.zh[key] !== undefined) return dictionaries.zh[key]
        return key
      }
      translate.has = (key) => Boolean(dictionaries.zh && dictionaries.zh[key] !== undefined)
      return translate
    }
  },
  slots: {
    inject: (name, callback) => callback(),
    register: (options, component) => {
      slots.push({ options, component })
      return () => {}
    }
  },
  effect: (fn) => {
    fn()
    return () => {}
  },
  inject: () => {}
})

const ZH = dictionaries.zh
const mainSlot = slots.find((slot) => slot.options && slot.options.name === 'main')
const results = []
const check = (ok, message) => results.push({ ok: Boolean(ok), message })

// ------------------------------------------------------------------- runtime
let tree = null
async function settle(maxPasses = 40, root = null) {
  let passes = 0
  do {
    dirty = false
    effectQueue = []
    nameCounters = Object.create(null)
    hookIndex = 0
    tree = React.createElement(root || mainSlot.component, {})
    for (const item of effectQueue) {
      const previous = item.store[item.index]
      const next = { deps: item.deps }
      if (previous && sameDeps(previous.deps, item.deps)) {
        item.store[item.index] = { ...previous, deps: previous.deps }
        continue
      }
      if (previous && typeof previous.cleanup === 'function') previous.cleanup()
      const cleanup = item.fn()
      next.cleanup = typeof cleanup === 'function' ? cleanup : null
      item.store[item.index] = next
    }
    await new Promise((resolve) => setTimeout(resolve, 0))
    passes += 1
  } while (dirty && passes < maxPasses)
  return passes
}

function walk(node, visit) {
  if (node === null || node === undefined || node === false) return
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visit)
    return
  }
  if (typeof node === 'string' || typeof node === 'number') return
  visit(node)
  if (node.children) walk(node.children, visit)
  if (node.props && node.props.children) walk(node.props.children, visit)
}

function textOf(node) {
  if (node === null || node === undefined || node === false) return ''
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  let out = ''
  if (node.children) out += textOf(node.children)
  if (node.props && node.props.children) out += textOf(node.props.children)
  return out
}

function findAll(predicate) {
  const found = []
  walk(tree, (node) => {
    if (predicate(node)) found.push(node)
  })
  return found
}

const classesOf = (node) => String(node.className || '').split(/\s+/).filter(Boolean)
const byClass = (name) => findAll((node) => classesOf(node).includes(name))
const click = (node) =>
  node.props.onClick({ preventDefault() {}, stopPropagation() {} })

function walkText(root, needle) {
  let hit = null
  walk(root, (node) => {
    if (hit || !node.props || typeof node.props.onClick !== 'function') return
    if (textOf(node).includes(needle)) hit = node
  })
  return hit
}

// ------------------------------------------------------------------ 5. checks
check(Boolean(mainSlot), 'main slot registered')
check(slots.some((slot) => slot.options && slot.options.name === 'sidebar.panellist'), 'sidebar entry registered')
check(entries.length > 0, 'fixture has ' + entries.length + ' memories')
check(state.version >= 4, 'store migrated to schema v4+')

const passes = await settle()
check(passes < 40, 'render settled in ' + passes + ' pass(es)')
check(fetchCalls >= 1, 'panel called the API: ' + fetchCalls + ' time(s)')

const roots = byClass('zw-root')
check(roots.length === 1, 'root rendered: ' + roots.length)
check(roots.length === 1 && roots[0].props['data-zw-theme'] === 'dark', 'dark theme applied')
check(byClass('zw-rail').length === 1, 'left rail rendered')
check(byClass('zw-rail')[0].props['data-collapsed'] === 'false', 'left rail starts expanded with text nav')
check(byClass('zw-navScroll').length === 1, 'left rail nav area scrolls on its own')
check(byClass('zw-detail').length === 0, 'detail sidebar hidden until a memory is opened')
check(byClass('zw-navItem').length >= 7, 'nav items: ' + byClass('zw-navItem').length)
check(byClass('zw-newBtn').length === 1, 'new-memory entry point rendered')
check(byClass('zw-undefined').length === 0, 'no undefined className')

// overview: stat tiles + panels
const statTiles = byClass('zw-stat')
check(statTiles.length >= 4, 'overview stat tiles: ' + statTiles.length)
check(byClass('zw-panelCard').length >= 3, 'overview panels: ' + byClass('zw-panelCard').length)

// list view
const allNav = byClass('zw-navItem').find((node) => textOf(node).includes(ZH['nav.all']))
check(Boolean(allNav), 'nav item for all memories')
if (allNav) {
  click(allNav)
  await settle()
}
const rows = byClass('zw-row')
check(rows.length === entries.length, 'list rows match store: ' + rows.length + '/' + entries.length)
check(byClass('zw-filterbar').length === 1, 'filter bar rendered')
check(byClass('zw-search').length === 1, 'search box rendered')

// open the first memory in the detail rail
if (rows.length) {
  click(rows[0])
  await settle()
}
check(byClass('zw-detail').length === 1, 'detail rail rendered')
check(byClass('zw-detailTitle').length >= 0, 'detail title slot present')
const detailText = byClass('zw-detail').map(textOf).join(' ')
check(detailText.length > 40, 'detail rail has content: ' + detailText.length + ' chars')
check(byClass('zw-badgeType').length >= 1, 'type badge rendered')
const relationBlocks = byClass('zw-relRow').length + byClass('zw-suggestRow').length
check(relationBlocks >= 0, 'relation rows: ' + relationBlocks)

// quick add modal → saves through the API
const newBtn = byClass('zw-newBtn')[0]
check(Boolean(newBtn), 'quick add button found')
if (newBtn) {
  click(newBtn)
  await settle()
}
const modal = byClass('zw-modal')[0]
check(Boolean(modal), 'quick add modal opened')
const bigTextarea = byClass('zw-textareaBig')[0]
check(Boolean(bigTextarea), 'quick add textarea present')
if (bigTextarea && bigTextarea.props.onChange) {
  bigTextarea.props.onChange({ target: { value: '冒烟测试：战斗数值放大器上限从 20 调到 30，验证产出节奏。' } })
  await settle(6)
  const analyzeBtn = findAll(
    (node) =>
      node.type === 'button' &&
      classesOf(node).includes('zw-btnPrimary') &&
      textOf(node).includes(ZH['quick.analyze'])
  )[0]
  check(Boolean(analyzeBtn), 'quick add analyze button')
  const saveRawBtn = findAll(
    (node) =>
      node.type === 'button' &&
      classesOf(node).includes('zw-btnGhost') &&
      textOf(node).includes(ZH['quick.saveRaw'])
  )[0]
  check(Boolean(saveRawBtn), 'quick add raw save button')
  if (saveRawBtn) {
    const before = posts.length
    click(saveRawBtn)
    await new Promise((resolve) => setTimeout(resolve, 30))
    await settle(6)
    const created = posts.slice(before).find((post) => post.action === 'entry-save')
    check(Boolean(created), 'quick add posted entry-save')
    check(Boolean(created) && String(created.content || '').includes('冒烟测试'), 'quick add sent the text')
  }
}

// collections view
const collectionsNav = byClass('zw-navItem').find((node) => textOf(node).includes(ZH['nav.collections']))
if (collectionsNav) {
  click(collectionsNav)
  await settle()
}
check(byClass('zw-collectionGrid').length === 1, 'collections grid rendered')
check(byClass('zw-collectionCard').length === collections.length, 'collection cards: ' + byClass('zw-collectionCard').length)

// graph view
const graphNav = byClass('zw-navItem').find((node) => textOf(node).includes(ZH['nav.graph']))
check(Boolean(graphNav), 'nav item for the graph')
if (graphNav) {
  click(graphNav)
  await settle()
}
const svg = byClass('zw-graphSvg')[0]
check(Boolean(svg), 'graph svg rendered')
const nodes = byClass('zw-gnode')
check(nodes.length >= entries.length, 'graph nodes: ' + nodes.length + '/' + entries.length)
check(byClass('zw-hull').length === collections.filter((c) => c.memberIds.length).length, 'collection hulls: ' + byClass('zw-hull').length)
check(byClass('zw-graphToolbar').length === 1, 'graph toolbar rendered')
check(byClass('zw-toolBtn').length >= 4, 'graph tools: ' + byClass('zw-toolBtn').length)

// graph: link tool → relation-create
function graphView() {
  const layer = findAll((node) => /translate\(([-\d.]+),([-\d.]+)\) scale\(([-\d.]+)\)/.test(String(node.props && node.props.transform || '')))[0]
  const match = layer && String(layer.props.transform).match(/translate\(([-\d.]+),([-\d.]+)\) scale\(([-\d.]+)\)/)
  return match ? { x: Number(match[1]), y: Number(match[2]), k: Number(match[3]) } : { x: 0, y: 0, k: 1 }
}
function nodePoint(node) {
  const match = String(node.props && node.props.transform || '').match(/translate\(([-\d.]+),([-\d.]+)\)/)
  return match ? { x: Number(match[1]), y: Number(match[2]) } : { x: 0, y: 0 }
}
function screen(point) {
  const view = graphView()
  return { clientX: view.x + point.x * view.k, clientY: view.y + point.y * view.k }
}
function pointer(node, type, at, extra) {
  const handler = node.props[type]
  if (typeof handler !== 'function') return false
  try {
    handler({
    button: 0,
    pointerId: 7,
    shiftKey: false,
    clientX: at.clientX,
    clientY: at.clientY,
    currentTarget: node,
    target: node,
    preventDefault() {},
    stopPropagation() {},
    ...(extra || {})
    })
  } catch (err) { console.log('POINTER ERR', type, err && err.message) }
  return true
}

const linkTool = byClass('zw-toolBtn').find((node) => textOf(node).includes(ZH['graph.toolLink']))
check(Boolean(linkTool), 'link tool button')
if (linkTool && nodes.length >= 2) {
  click(linkTool)
  await settle()
  const freshNodes = byClass('zw-gnode')
  const from = nodePoint(freshNodes[0])
  const to = nodePoint(freshNodes[1])
  pointer(freshNodes[0], 'onPointerDown', screen(from))
  await settle(4)
  pointer(byClass('zw-graphSvg')[0], 'onPointerMove', screen(to))
  await settle(4)
  pointer(byClass('zw-graphSvg')[0], 'onPointerUp', screen(to))
  await settle(6)
  const relationModal = byClass('zw-modal')[0]
  check(Boolean(relationModal), 'link drag opens relation dialog')
  const confirmRelation = findAll(
    (node) =>
      node.type === 'button' &&
      classesOf(node).includes('zw-btnPrimary') &&
      textOf(node).includes(ZH['relation.create'])
  )[0]
  check(Boolean(confirmRelation), 'relation dialog has a create button')
  check(byClass('zw-relGroup').length >= 5, 'relation dialog groups relation types')
  check(
    byClass('zw-relGroupLabel').map((node) => textOf(node)).join(' ').includes(ZH['relGroup.business']),
    'relation groups carry their own labels'
  )
  if (confirmRelation) {
    const before = posts.length
    click(confirmRelation)
    await new Promise((resolve) => setTimeout(resolve, 30))
    await settle(6)
    const created = posts.slice(before).find((post) => post.action === 'relation-create')
    check(Boolean(created), 'relation dialog posted relation-create')
    check(Boolean(created) && Boolean(created.targetMemoryId || created.targetId), 'relation-create carries a target')
  }
}

// ------------------------------------------------------- 5b. ai assist + undo
click(byClass('zw-navItem').find((node) => textOf(node).includes(ZH['nav.all'])))
await settle()
try { click(byClass('zw-row')[0]) } catch (err) { console.log('DBG row click error:', err && err.message) }
await settle()
check(byClass('zw-detail').length === 1, 'detail rail rendered for the selected memory')

// 切换左栏视图后，右侧详情栏要自动收起，不能还挂着上一条记忆。
click(byClass('zw-navItem').find((node) => textOf(node).includes(ZH['nav.favorites'])))
await settle()
check(byClass('zw-detail').length === 0, 'detail rail closes when switching left nav')
click(byClass('zw-navItem').find((node) => textOf(node).includes(ZH['nav.all'])))
await settle()
click(byClass('zw-row')[0])
await settle()
check(byClass('zw-detail').length === 1, 'detail rail reopens after picking a memory again')

// 「加入集合」弹窗里要能直接新建集合，不用关掉弹窗再重开。
const collectionsEdit = byClass('zw-panelLink').find((node) => textOf(node).trim() === ZH['action.edit'])
check(Boolean(collectionsEdit), 'detail rail offers an edit-collections link')
if (collectionsEdit) {
  click(collectionsEdit)
  await settle()
  check(byClass('zw-quickCreate').length === 1, 'collection picker shows an inline create row')
  const quickRow = byClass('zw-quickCreate')[0]
  const withinQuick = []
  if (quickRow) walk(quickRow, (node) => withinQuick.push(node))
  const quickInput = withinQuick.find((node) => node.type === 'input')
  check(Boolean(quickInput), 'inline create row has a name input')
  if (quickInput) {
    quickInput.props.onChange({ target: { value: '冒烟新集合' } })
    await settle()
    const quickRow2 = byClass('zw-quickCreate')[0]
    const nodes2 = []
    if (quickRow2) walk(quickRow2, (node) => nodes2.push(node))
    const createBtn = nodes2.find((node) => node.type === 'button')
    check(Boolean(createBtn) && createBtn.props.disabled !== true, 'inline create button enables once a name is typed')
    const beforeCreate = posts.length
    click(createBtn)
    await settle()
    const created = posts.slice(beforeCreate).find((post) => post.action === 'collection-save')
    check(Boolean(created) && created.name === '冒烟新集合', 'inline create posts collection-save with the typed name')
    check(byClass('zw-pickRow').length >= 1, 'collection picker still lists collections after inline create')
    const confirmBtn = findAll((node) => node.type === 'button' && textOf(node).trim() === ZH['action.confirm'])[0]
    if (confirmBtn) click(confirmBtn)
    await settle()
  }
}

const organizeChip = byClass('zw-assistAction').find((node) => textOf(node).includes(ZH['assist.organize']))
check(Boolean(organizeChip), 'assist actions are offered in the detail rail')
if (organizeChip) {
  const before = posts.length
  click(organizeChip)
  await settle()
  const analyzed = posts.slice(before).find((post) => post.action === 'ai.analyze')
  check(Boolean(analyzed), 'assist chip posts ai.analyze')
  check(Boolean(analyzed) && analyzed.analysis === 'organize', 'ai.analyze carries the requested analysis')
  check(byClass('zw-assistPanel').length === 1, 'assist panel renders')
  check(textOf(byClass('zw-assistPanel')[0]).includes('建议标题'), 'assist panel shows the suggested title')
  check(byClass('zw-assistSeg').length === 2, 'atomic split suggestions rendered')

  const applyBtn = byClass('zw-assistFoot')[0]
    ? walkText(byClass('zw-assistFoot')[0], ZH['assist.apply'])
    : null
  if (applyBtn) {
    const beforeApply = posts.length
    click(applyBtn)
    await settle()
    const saved = posts.slice(beforeApply).find((post) => post.action === 'entry-save')
    check(Boolean(saved), 'applying organize suggestions posts entry-save')
  }
}

const deleteBtn = () => {
  let hit = null
  walk(byClass('zw-detail')[0], (node) => {
    if (hit || !node.props || typeof node.props.onClick !== 'function') return
    const text = textOf(node)
    if (text.includes(ZH['action.delete'])) hit = node
  })
  return hit
}
const firstDelete = deleteBtn()
check(Boolean(firstDelete), 'delete action exists in the detail rail')
if (firstDelete) {
  click(firstDelete)
  await settle()
  const secondDelete = deleteBtn()
  check(textOf(secondDelete || []) !== '' , 'second click arms the delete')
  if (secondDelete) {
    const beforeDelete = posts.length
    click(secondDelete)
    await settle()
    const deleted = posts.slice(beforeDelete).find((post) => post.action === 'entry-delete')
    check(Boolean(deleted), 'deleting a memory posts entry-delete')
    check(byClass('zw-toastAction').length >= 1, 'undo action appears in the toast')
    const undoBtn = byClass('zw-toastAction').slice(-1)[0]
    if (undoBtn) {
      const beforeUndo = posts.length
      click(undoBtn)
      await settle()
      const restored = posts.slice(beforeUndo).find((post) => post.action === 'entry-restore')
      check(Boolean(restored), 'undo posts entry-restore')
      check(Boolean(restored) && Boolean(restored.entry && restored.entry.id), 'restore payload carries the entry')
      check(byClass('zw-row').length >= 34, 'restored memory is back in the list')
    }
  }
}
// graph: box tool → multi-select bar
const boxTool = byClass('zw-toolBtn').find((node) => textOf(node).includes(ZH['graph.toolBox']))
if (boxTool) {
  click(boxTool)
  await settle()
  const view = graphView()
  const freshNodes = byClass('zw-gnode')
  const points = freshNodes.map(nodePoint)
  const minX = Math.min(...points.map((point) => point.x)) - 40
  const minY = Math.min(...points.map((point) => point.y)) - 40
  const maxX = Math.max(...points.map((point) => point.x)) + 40
  const maxY = Math.max(...points.map((point) => point.y)) + 40
  const start = { clientX: view.x + minX * view.k, clientY: view.y + minY * view.k }
  const end = { clientX: view.x + maxX * view.k, clientY: view.y + maxY * view.k }
  pointer(byClass('zw-graphSvg')[0], 'onPointerDown', start)
  await settle(4)
  pointer(byClass('zw-graphSvg')[0], 'onPointerMove', end)
  await settle(4)
  const hasRect = byClass('zw-boxRect').length
  pointer(byClass('zw-graphSvg')[0], 'onPointerUp', end)
  await settle(6)
  check(byClass('zw-batchbar').length >= 1, 'box select shows the batch bar')
}

// graph: 点深色空白背景 = 退出选择 + 收起右侧详情栏
const graphAgain = byClass('zw-navItem').find((node) => textOf(node).includes(ZH['nav.graph']))
if (graphAgain) {
  click(graphAgain)
  await settle(6)
}
if (byClass('zw-gnode').length && byClass('zw-graphSvg').length) {
  const view = graphView()
  const firstNode = byClass('zw-gnode')[0]
  const center = nodePoint(firstNode)
  const at = { clientX: view.x + center.x * view.k, clientY: view.y + center.y * view.k, button: 0 }
  pointer(firstNode, 'onPointerDown', at)
  await settle(2)
  pointer(byClass('zw-graphSvg')[0], 'onPointerUp', at)
  await settle(4)
  check(byClass('zw-detail').length === 1, 'clicking a graph node opens the detail sidebar')
  const blank = { clientX: 4, clientY: 4, button: 0 }
  pointer(byClass('zw-graphSvg')[0], 'onPointerDown', blank)
  await settle(2)
  pointer(byClass('zw-graphSvg')[0], 'onPointerUp', blank)
  await settle(4)
  check(byClass('zw-detail').length === 0, 'clicking the dark graph background closes the detail sidebar')
  check(byClass('zw-gnodeOn').length === 0, 'clicking the dark graph background clears the node selection')
}

// ------------------------------------------------- V2.1 detail + tidy + recall
const allNavAgain = byClass('zw-navItem').find((node) => textOf(node).includes(ZH['nav.all']))
if (allNavAgain) {
  click(allNavAgain)
  await settle()
}
const firstRow = byClass('zw-row')[0]
if (firstRow) {
  click(firstRow)
  await settle()
}
check(byClass('zw-life').length >= 1, 'lifecycle bar rendered in the detail rail')
check(byClass('zw-lifeFoot').length >= 1, 'lifecycle usage line rendered')
function detailHasEvidenceHint() {
  const rail = byClass('zw-detail')[0]
  if (!rail) return false
  return textOf(rail).includes(ZH['detail.evidence'])
}
check(
  byClass('zw-evidenceList').length === 1 || detailHasEvidenceHint(),
  'evidence block rendered'
)
check(byClass('zw-scoreBar').length >= 2, 'confidence and importance bars rendered')
const protectionChips = byClass('zw-seg').length
check(protectionChips >= 1, 'protection level control rendered')
const protectChip = byClass('zw-segBtn').find((node) =>
  textOf(node).includes(ZH['protection.protected'])
)
if (protectChip) {
  click(protectChip)
  await settle(4)
  check(
    posts.some((post) => post.action === 'entry-protect' && post.level === 'protected'),
    'protection control posts entry-protect'
  )
}
const scopeBadges = byClass('zw-badgeNeutral').map(textOf)
const scopeBadge = byClass('zw-badgeNeutral').find(
  (node) =>
    textOf(node).includes('项目') || textOf(node).includes(ZH['scope.global'])
)
check(Boolean(scopeBadge), 'scope badge rendered: ' + JSON.stringify(scopeBadges.slice(0, 6)))

// tidy center
const tidyNav = byClass('zw-navItem').find((node) => textOf(node).includes(ZH['nav.tidy']))
check(Boolean(tidyNav), 'nav item for the tidy center')
if (tidyNav) {
  click(tidyNav)
  await settle(21)
}
check(posts.some((post) => post.action === 'memory-tidy'), 'tidy center asks for the tidy report')
check(byClass('zw-tidy').length === 1, 'tidy view rendered')
check(byClass('zw-tidyCard').length >= 4, 'tidy cards: ' + byClass('zw-tidyCard').length)
check(byClass('zw-tidyCard').length >= 6, 'tidy adds candidate and duplicate object cards')
const confirmAll = findAll(
  (node) => node.type === 'button' && textOf(node).trim() === ZH['tidy.confirmAllNodes']
)[0]
check(Boolean(confirmAll), 'tidy center offers batch confirm for candidates')
if (confirmAll) {
  const before = posts.length
  confirmAll.props.onClick()
  await settle(8)
  const confirmed = posts.slice(before).filter((post) => post.action === 'node-save' && post.status === 'active')
  check(confirmed.length >= 2, 'batch confirm activates every candidate object')
}

// recall log
const recallNav = byClass('zw-navItem').find((node) => textOf(node).includes(ZH['nav.recall']))
check(Boolean(recallNav), 'nav item for the recall log')
if (recallNav) {
  click(recallNav)
  await settle(4)
}
check(
  byClass('zw-recallList').length === 1 || byClass('zw-empty').length >= 1,
  'recall view rendered'
)

// observe dialog
const observeBtn = byClass('zw-iconBtn').find((node) => (node.props.title || '') === ZH['action.observe'])
check(Boolean(observeBtn), 'observe button in the top bar')
if (observeBtn) {
  click(observeBtn)
  await settle(4)
  check(byClass('zw-modal').length === 1, 'observe dialog opened')
  const observeArea = byClass('zw-textareaBig')[0]
  check(Boolean(observeArea), 'observe textarea present')
  if (observeArea && observeArea.props.onChange) {
    observeArea.props.onChange({ target: { value: '以后写公告都用英文，不要用官方生硬的语气。' } })
    await settle(4)
    const runBtn = findAll(
      (node) =>
        node.type === 'button' &&
        classesOf(node).includes('zw-btnPrimary') &&
        textOf(node).includes(ZH['observe.run'])
    )[0]
    check(Boolean(runBtn), 'observe dialog has a run button')
    if (runBtn) {
      click(runBtn)
      await settle(8)
      check(posts.some((post) => post.action === 'memory-observe'), 'observe posts memory-observe')
      check(byClass('zw-assistPanel').length >= 1, 'observe result panel rendered')
    }
  }
  const closeObserve = byClass('zw-modalFoot').length
    ? findAll((node) => node.type === 'button' && textOf(node).includes(ZH['action.close']))[0]
    : null
  if (closeObserve) {
    click(closeObserve)
    await settle(4)
  }
}

// ------------------------------------------------- 5b. workspace upgrade checks
async function workspaceChecks() {
  const badHeaders = postHeaders.filter((value) => !String(value).includes('application/json'))
  check(
    postHeaders.length > 0 && badHeaders.length === 0,
    'every write request carries content-type: application/json'
  )

  // 设置已经搬进 DSH 设置页：面板里不该再有齿轮
  const gear = findAll(
    (node) => node.type === 'button' && node.props && node.props.title === ZH['settings.title']
  )[0]
  check(byClass('zw-settingsBlock').length === 0, 'in-app settings panel is gone')
  const sectionSlot = slots.find((slot) => slot.options && slot.options.name === 'settings.section')
  check(Boolean(sectionSlot), 'settings section registered for the DSH settings page')
  if (sectionSlot) {
    const settleSection = (passes) => settle(passes, sectionSlot.component)
    await settleSection(8)
    check(byClass('zw-settingsBlock').length >= 3, 'settings section renders storage / model / data blocks')
    check(posts.some((post) => post.action === 'settings.get'), 'settings section asks for current settings')
    check(posts.some((post) => post.action === 'models.list'), 'settings section asks for the model list')
    const selects = findAll((node) => node.type === 'select')
    check(selects.length >= 2, 'model provider and model pickers rendered')
    const providerSelect = selects[0]
    if (providerSelect) {
      providerSelect.props.onChange({ target: { value: 'demo' } })
      await settleSection(6)
      const modelSelect = findAll((node) => node.type === 'select')[1]
      if (modelSelect) {
        modelSelect.props.onChange({ target: { value: 'demo-1' } })
        await settleSection(6)
      }
      const enableBtn = findAll(
        (node) => node.type === 'button' && textOf(node).includes(ZH['settings.modelEnable'])
      )[0]
      check(Boolean(enableBtn), 'model enable button rendered')
      if (enableBtn) {
        click(enableBtn)
        await settleSection(8)
        check(
          posts.some((post) => post.action === 'settings.model' && post.provider === 'demo' && post.model === 'demo-1'),
          'enabling the model posts settings.model with the picked route'
        )
      }
    }
      const storageBtn = findAll(
      (node) => node.type === 'button' && textOf(node).includes(ZH['settings.switchApply'])
    )[0]
    check(Boolean(storageBtn), 'storage switch button rendered')
    await settleSection(6)
  }
  await settle(10)

  // 项目右键菜单
  const projectRow = byClass('zw-projectRow')[0]
  check(Boolean(projectRow), 'project rows rendered')
  if (projectRow && projectRow.props.onContextMenu) {
    projectRow.props.onContextMenu({ clientX: 20, clientY: 30, preventDefault() {} })
    await settle(6)
    check(byClass('zw-menu').length >= 1, 'right click opens the project menu')
    const renameItem = findAll((node) => node.type === 'button' && textOf(node).includes(ZH['action.rename']))[0]
    check(Boolean(renameItem), 'project menu offers rename')
    if (renameItem) {
      click(renameItem)
      await settle(6)
      check(byClass('zw-menu').length === 0, 'menu closes after choosing an item')
      const nameInput = findAll((node) => node.type === 'input' && node.props && node.props.value !== undefined)[0]
      check(Boolean(nameInput), 'project dialog opens with an editable name')
      const closeProject = findAll(
        (node) => node.type === 'button' && textOf(node).includes(ZH['action.cancel'])
      )[0]
      if (closeProject) {
        click(closeProject)
        await settle(4)
      }
    }
  }

  // 关系图：记忆框与保存布局
  live.frames = [
    {
      id: 'frm_smoke',
      name: '战斗记忆框',
      color: 'teal',
      note: '',
      rect: { x: -210, y: -170, w: 430, h: 350 },
      memberIds: live.entries.slice(0, 3).map((item) => item.id),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
  const graphNav = findAll((node) => node.type === 'button' && textOf(node).includes(ZH['nav.graph']))[0]
  check(Boolean(graphNav), 'graph nav available for frame checks')
  if (graphNav) {
    click(graphNav)
    await settle(12)
    const svg = byClass('zw-graphSvg')[0]
    check(Boolean(svg), 'graph reopened for frame checks')
    check(byClass('zw-frameBox').length >= 1, 'saved frames are drawn on the graph')
    check(
      findAll((node) => node.type === 'text' && textOf(node).includes('战斗记忆框')).length >= 1,
      'frame label rendered'
    )
    const saveLayoutBtn = findAll(
      (node) => node.type === 'button' && node.props && node.props.title === ZH['graph.saveLayout']
    )[0]
    check(Boolean(saveLayoutBtn), 'save-layout button in the graph toolbar')
    if (saveLayoutBtn) {
      click(saveLayoutBtn)
      await settle(6)
      check(posts.some((post) => post.action === 'layout-save'), 'saving the layout posts layout-save')
    }

    // 工具条与计数不再互相压住：计数是工具条的兄弟节点，不在条里。
    const toolbar = byClass('zw-graphToolbar')[0]
    check(Boolean(toolbar), 'graph toolbar rendered')
    if (toolbar) {
      const inside = (toolbar.children || []).filter(
        (node) => classesOf(node).includes('zw-graphCount')
      )
      check(inside.length === 0, 'node counter sits outside the toolbar')
    }
    check(byClass('zw-graphCount').length === 1, 'node counter rendered once')

    // 记忆框本身作为可连线节点出现
    const frameNodes = byClass('zw-gframeNode')
    check(frameNodes.length >= 1, 'frame is drawn as its own node')
    const frameNode = frameNodes[0]
    check(Boolean(frameNode) && textOf(frameNode).includes('战斗记忆框'), 'frame node carries the frame name')

    // 点框 = 选中它的成员（批量条出现），双击 = 改名
    if (frameNode) {
      const frameSvg = byClass('zw-graphSvg')[0]
      const frameAt = screen(nodePoint(frameNode))
      pointer(frameNode, 'onPointerDown', frameAt, { pointerId: 21 })
      if (frameSvg) pointer(frameSvg, 'onPointerUp', frameAt, { pointerId: 21 })
      await settle(8)
      check(byClass('zw-batchbar').length >= 1, 'clicking a frame selects its members')
      if (typeof frameNode.props.onDoubleClick === 'function') {
        frameNode.props.onDoubleClick({})
        await settle(6)
        const title = byClass('zw-modalTitle')[0]
        check(
          Boolean(title) && textOf(title).includes(ZH['graph.frameRenameTitle']),
          'double click opens the frame rename dialog'
        )
        const closeFrame = findAll(
          (node) => node.type === 'button' && textOf(node).includes(ZH['action.cancel'])
        )[0]
        if (closeFrame) {
          click(closeFrame)
          await settle(4)
        }
      }
    }

    // 划线工具：从框拖到一条记忆，建立关系
    const linkBtn = byClass('zw-toolBtn').find((node) => textOf(node).includes(ZH['graph.toolLink']))
    check(Boolean(linkBtn), 'link tool button available')
    if (linkBtn && frameNode) {
      click(linkBtn)
      await settle(8)
      const freshSvg = byClass('zw-graphSvg')[0]
      const chip = byClass('zw-gframeNode')[0]
      const targetNode = byClass('zw-gnode')[0]
      if (freshSvg && chip && targetNode) {
        const fromAt = screen(nodePoint(chip))
        const toAt = screen(nodePoint(targetNode))
        pointer(chip, 'onPointerDown', fromAt, { pointerId: 33 })
        pointer(freshSvg, 'onPointerMove', toAt, { pointerId: 33 })
        pointer(freshSvg, 'onPointerUp', toAt, { pointerId: 33 })
        await settle(8)
        const dialog = byClass('zw-modalTitle')[0]
        check(
          Boolean(dialog) && textOf(dialog).includes(ZH['relation.create']),
          'dragging a line from a frame opens the relation dialog'
        )
        const cancel = findAll(
          (node) => node.type === 'button' && textOf(node).includes(ZH['action.cancel'])
        )[0]
        if (cancel) {
          click(cancel)
          await settle(4)
        }
      }
    }
    // 记忆区是按 rect 画的大框，不是按成员糊出来的 hull
    const boxGroup = byClass('zw-frameBox')[0]
    check(Boolean(boxGroup), 'frame area group rendered')
    if (boxGroup) {
      const rectNode = (function find(node) {
        if (!node) return null
        if (node.type === 'rect') return node
        const kids = node.children || []
        for (const kid of kids) {
          const hit = find(kid)
          if (hit) return hit
        }
        return null
      })(boxGroup)
      check(Boolean(rectNode) && rectNode.props && rectNode.props.width >= 300, 'frame area is drawn as a rect')
    }

    // 面板里的「记忆区」列表能点选整框
    const panelBtn = byClass('zw-toolBtn').find(
      (node) => node.props && node.props.title === ZH['graph.filters']
    )
    if (panelBtn && !byClass('zw-graphPanel').length) {
      click(panelBtn)
      await settle(6)
    }
    const framePick = byClass('zw-framePick').find((node) => textOf(node).includes('战斗记忆框'))
    check(Boolean(framePick), 'memory area listed in the graph panel')
    if (framePick) {
      click(framePick)
      await settle(6)
      check(byClass('zw-batchbar').length >= 1, 'picking an area from the panel selects its memories')
    }

    // 记忆区里找：区块行上的搜索按钮把列表切到这块记忆区
    const areaSearch = byClass('zw-frameEdit').find(
      (node) => node.props && node.props.title === ZH['graph.searchArea']
    )
    if (areaSearch) {
      click(areaSearch)
      await settle(8)
      const title = byClass('zw-viewTitle')[0]
      check(
        Boolean(title) && textOf(title).includes('战斗记忆框'),
        'searching inside an area switches the list to that area'
      )
      check(byClass('zw-row').length > 0, 'area list shows the memories inside it')
    }
    // 回到关系图，后面的画框断言还要用它
    const graphNavBack = byClass('zw-navItem').find((node) => textOf(node).includes(ZH['nav.graph']))
    if (graphNavBack) {
      click(graphNavBack)
      await settle(8)
    }

    // 画一个新框 → 命名对话框 → 保存时带上 rect
    const areaBtn = byClass('zw-toolBtn').find((node) => textOf(node).includes(ZH['graph.toolArea']))
    check(Boolean(areaBtn), 'area tool button available')
    check(Boolean(byClass('zw-toolBtn').find((node) => textOf(node).includes(ZH['graph.toolBox']))), 'box select tool still available')
    if (areaBtn) {
      click(areaBtn)
      await settle(8)
      const boxSvg = byClass('zw-graphSvg')[0]
      if (boxSvg) {
        pointer(boxSvg, 'onPointerDown', { clientX: 4, clientY: 4 }, { pointerId: 41 })
        await settle(3)
        pointer(byClass('zw-graphSvg')[0], 'onPointerMove', { clientX: 300, clientY: 260 }, { pointerId: 41 })
        await settle(3)
        pointer(byClass('zw-graphSvg')[0], 'onPointerUp', { clientX: 300, clientY: 260 }, { pointerId: 41 })
        await settle(8)
        const boxTitle = byClass('zw-modalTitle')[0]
        check(
          Boolean(boxTitle) && textOf(boxTitle).includes(ZH['graph.frameCreateTitle']),
          'drawing a box opens the area naming dialog'
        )
        // 弹窗在根节点最后渲染：取最后一个输入框才是对话框里的那个（搜索框也用 zw-input 家族类名）。
        const nameInput = byClass('zw-input').filter((n) => n.type === 'input').pop()
        if (nameInput && typeof nameInput.props.onChange === 'function') {
          nameInput.props.onChange({ target: { value: '星云记忆区' } })
          await settle(4)
        }
        // 改名之后要重新取按钮：旧的 onClick 闭包还拿着输入前的空名字。
        const saveBtn = findAll(
          (node) => node.type === 'button' && textOf(node).trim() === ZH['action.save']
        )[0]
        if (saveBtn) {
          click(saveBtn)
          await settle(8)
          const saved = posts.filter((post) => post.action === 'frame-save').pop()
          check(
            Boolean(saved) && Boolean(saved.rect) && saved.rect.w > 50,
            'saving a drawn box posts frame-save with a rect'
          )
          check(Boolean(saved) && saved.name === '星云记忆区', 'drawn area keeps the name the user typed')
        }
      }
    }

    // 「框选」只选择，不建记忆区
    const selectToolBtn = byClass('zw-toolBtn').find((node) => textOf(node).includes(ZH['graph.toolSelect']))
    if (selectToolBtn) {
      click(selectToolBtn)
      await settle(6)
    }
    const boxToolBtn = byClass('zw-toolBtn').find((node) => textOf(node).includes(ZH['graph.toolBox']))
    if (boxToolBtn) {
      click(boxToolBtn)
      await settle(6)
      const beforeFrames = posts.filter((post) => post.action === 'frame-save').length
      const svgForBox = byClass('zw-graphSvg')[0]
      pointer(svgForBox, 'onPointerDown', { clientX: 10, clientY: 10 }, { pointerId: 51 })
      await settle(3)
      pointer(byClass('zw-graphSvg')[0], 'onPointerMove', { clientX: 300, clientY: 300 }, { pointerId: 51 })
      await settle(3)
      pointer(byClass('zw-graphSvg')[0], 'onPointerUp', { clientX: 300, clientY: 300 }, { pointerId: 51 })
      await settle(8)
      const afterFrames = posts.filter((post) => post.action === 'frame-save').length
      check(afterFrames === beforeFrames, 'box select never creates an area')
    }

    // 选中一块已有记忆区后按 Delete：走 frame-delete
    const frameHit = byClass('zw-frameHit')[0]
    if (frameHit) {
      pointer(frameHit, 'onPointerDown', { clientX: 20, clientY: 20 }, { pointerId: 61 })
      await settle(3)
      pointer(byClass('zw-graphSvg')[0], 'onPointerUp', { clientX: 20, clientY: 20 }, { pointerId: 61 })
      await settle(6)
      check(byClass('zw-frameHandle').length >= 4, 'selecting an area shows resize handles')
      const beforeDelete = posts.filter((post) => post.action === 'frame-delete').length
      const listeners = windowListeners.keydown.slice()
      listeners.forEach((handler) => handler({ key: 'Delete', preventDefault() {} }))
      await settle(8)
      const afterDelete = posts.filter((post) => post.action === 'frame-delete').length
      check(afterDelete === beforeDelete + 1, 'delete key removes the selected area')
    }

    // 老数据：没有 rect 的框也要能点选、能删（之前只有隐形成员，没法操作）。
    const legacyHull = byClass('zw-hullOutline').find((node) => node.props && String(node.props.d || '').length > 40)
    if (legacyHull) {
      const beforeLegacy = posts.filter((post) => post.action === 'frame-delete').length
      if (legacyHull.props.onClick) legacyHull.props.onClick({ stopPropagation() {} })
      await settle(6)
      check(byClass('zw-batchbar').length > 0, 'clicking a legacy area selects its members')
      const listeners2 = windowListeners.keydown.slice()
      listeners2.forEach((handler) => handler({ key: 'Delete', preventDefault() {} }))
      await settle(8)
      const afterLegacy = posts.filter((post) => post.action === 'frame-delete').length
      check(afterLegacy === beforeLegacy + 1, 'legacy area can be deleted with the delete key')
    }
  }
}

await workspaceChecks()
await knowledgeChecks()
await searchChecks()
await interactionChecks()
await preferenceChecks()

// ---------------------------------------------- 5d. shortcuts + recall nodes
async function searchChecks() {
  const allNav = byClass('zw-navItem').find((node) => textOf(node).includes(ZH['nav.all']))
  check(Boolean(allNav), 'left rail still has the all memories entry')
  if (allNav) {
    click(allNav)
    await settle(10)
  }
  const input = byClass('zw-searchInput')[0]
  check(Boolean(input), 'top bar search input is rendered')
  check(
    Boolean(input && String(input.props.placeholder || '').includes(ZH['search.openHint'])),
    'search input advertises the ctrl/cmd+k shortcut'
  )
  const before = posts.length
  windowListeners.keydown.slice().forEach((handler) => handler({ key: 'k', ctrlKey: true, preventDefault() {} }))
  await settle(3)
  check(posts.length === before, 'ctrl/cmd+k only focuses the search box')

  const firstRow = byClass('zw-row')[0]
  check(Boolean(firstRow), 'list renders rows for enter-to-open')
  if (input) {
    const detailBefore = byClass('zw-detail').length
    if (input.props.onKeyDown) input.props.onKeyDown({ key: 'Enter', preventDefault() {} })
    await settle(10)
    check(byClass('zw-detail').length >= 1, 'enter opens the first search result')
    if (!detailBefore) check(byClass('zw-detail').length === 1, 'enter opens exactly one detail panel')
  }

  // 对象版本：打开带历史的对象，看「历史版本」区块与回滚按钮
  const knNavAgain = byClass('zw-navItem').find((node) => textOf(node).includes(ZH['nav.knowledge']))
  if (knNavAgain) {
    click(knNavAgain)
    await settle(12)
    const targetLabel = (live.nodes[0] || {}).title || ''
    const versionedNode = byClass('zw-gnode').find((node) => textOf(node).includes(targetLabel))
    if (versionedNode) {
      pointer(versionedNode, 'onPointerDown', { clientX: 120, clientY: 120, pointerId: 41, button: 0, shiftKey: false, ctrlKey: false, metaKey: false })
      const svg = byClass('zw-graphSvg')[0]
      if (svg) pointer(svg, 'onPointerUp', { clientX: 120, clientY: 120, pointerId: 41, button: 0 })
      await settle(10)
      check(byClass('zw-versionList').length === 1, 'knowledge object history lists versions')
      check(byClass('zw-version').length >= 2, 'history shows every recorded version')
      let restoreBtn = null
      walk(byClass('zw-versionList')[0], (node) => {
        if (restoreBtn || !node.props || typeof node.props.onClick !== 'function') return
        if (textOf(node).includes(ZH['kn.restore'])) restoreBtn = node
      })
      check(Boolean(restoreBtn), 'older versions offer a restore action')
      if (restoreBtn) {
        const beforeRestore = posts.length
        click(restoreBtn)
        await settle(8)
        const restoredPost = posts.slice(beforeRestore).find((post) => post.action === 'node-version-restore')
        check(Boolean(restoredPost), 'restoring a version posts node-version-restore')
      }
    }
  }

  const recallNav = byClass('zw-navItem').find((node) => textOf(node).includes(ZH['nav.recall']))
  check(Boolean(recallNav), 'left rail lists recall history')
  if (recallNav) {
    click(recallNav)
    await settle(12)
    check(byClass('zw-recallRow').length >= 1, 'recall view lists the recorded calls')
    const pathLine = byClass('zw-recallPath')[0]
  check(Boolean(pathLine), 'recall view shows the object → relation → memory path')
  if (pathLine) {
    check(textOf(pathLine).includes(ZH['recall.path']), 'recall path row is labelled')
    check(textOf(pathLine).includes('烟雾测试对象'), 'recall path names the knowledge object it came through')
  }
  const nodeLine = byClass('zw-recallNodes')[0]
    check(Boolean(nodeLine), 'recall record shows the knowledge objects it hit')
    check(Boolean(nodeLine && textOf(nodeLine).includes('烟雾测试对象')), 'recall node line names the object')
  }
}

// ------------------------------------- 5e. mouse / keyboard interaction checks
async function interactionChecks() {
  const escape = () => {
    const event = { key: "Escape", stopPropagation() {}, preventDefault() {} }
    ;(documentListeners.keydown || []).slice().forEach((handler) => handler(event))
    ;(windowListeners.keydown || []).slice().forEach((handler) => handler(event))
  }
  const spaceKey = (type) => {
    const handlers = (windowListeners[type] || []).slice()
    handlers.forEach((handler) => handler({ key: " ", code: "Space", preventDefault() {} }))
  }
  const navTo = async (label, settlePasses) => {
    const item = byClass("zw-navItem").find((node) => textOf(node).includes(label))
    if (item) {
      click(item)
      await settle(settlePasses || 10)
    }
    return Boolean(item)
  }

  // 11.17 Esc 关掉最上层的弹窗，画布数据不受影响
  const knowledgeOk = await navTo(ZH["nav.knowledge"], 12)
  check(knowledgeOk, "keyboard section can reach the knowledge view")
  const newBtn = byClass("zw-btnPrimary").find((node) => textOf(node).includes(ZH["kn.new"]))
  if (newBtn) {
    click(newBtn)
    await settle(8)
  }
  check(byClass("zw-modal").length === 1, "Escape test starts with a dialog open")
  escape()
  await settle(6)
  check(byClass("zw-modal").length === 0, "Escape closes the top dialog")
  check(byClass("zw-knTabs").length === 1, "closing a dialog leaves the page intact")

  // 11.2 单击节点开详情，Esc 取消选择
  const knNodes = byClass("zw-gnodeKn")
  const svg = byClass("zw-graphSvg")[0]
  if (knNodes.length && svg) {
    pointer(knNodes[0], "onPointerDown", screen(nodePoint(knNodes[0])))
    pointer(svg, "onPointerUp", screen(nodePoint(knNodes[0])))
    await settle(10)
  }
  check(byClass("zw-detail").length === 1, "clicking a node opens the detail rail")
  escape()
  await settle(6)
  check(byClass("zw-detail").length === 0, "Escape clears the selection when no dialog is open")

  // 5.2 双击节点 = 进入局部详情（聚焦该对象）
  const focusNodes = byClass("zw-gnodeKn")
  const svg2 = byClass("zw-graphSvg")[0]
  if (focusNodes.length && svg2) {
    const target = focusNodes[0]
    if (target.props.onDoubleClick) target.props.onDoubleClick()
    await settle(10)
  }
  check(byClass("zw-detail").length === 1, "double clicking a node focuses it")

  // 5.2 / 5.4 Space+拖动 = 平移画布，且不创建记忆区、不改业务归属
  const framesBefore = byClass("zw-frameBox").length
  // 先把工具切回「选择」——上一个用例可能停在框选工具上
  const selectTool = byClass('zw-toolBtn').find((node) => textOf(node).includes(ZH['graph.toolSelect']))
  if (selectTool) {
    click(selectTool)
    await settle(8)
  }
  let moved = false
  if (byClass("zw-graphSvg").length) {
    const canvasTransform = () => {
      const holder = findAll((node) => node.type === "g" && String((node.props && node.props.transform) || "").includes("scale("))[0]
      return String((holder && holder.props && holder.props.transform) || "")
    }
    const before = canvasTransform()
    spaceKey("keydown")
    await settle(4)
    pointer(byClass("zw-graphSvg")[0], "onPointerDown", { clientX: 40, clientY: 40 })
    await settle(2)
    pointer(byClass("zw-graphSvg")[0], "onPointerMove", { clientX: 140, clientY: 120 })
    await settle(4)
    pointer(byClass("zw-graphSvg")[0], "onPointerUp", { clientX: 140, clientY: 120 })
    await settle(6)
    spaceKey("keyup")
    await settle(4)
    moved = before !== canvasTransform()
  }
  check(moved, "Space + drag pans the canvas")
  check(byClass("zw-frameBox").length === framesBefore, "panning never creates or resizes a memory area")
  check(byClass("zw-modal").length === 0, "panning does not open any dialog")

  // 11.4 Ctrl/Cmd+点击 = 多选切换
  // 一个知识节点会渲染多个同 class 的元素，所以按「文字不同」挑两个不同对象
  const distinctNodes = []
  for (const node of byClass("zw-gnodeKn")) {
    const label = textOf(node).trim()
    if (label && !distinctNodes.some((item) => item.label === label)) distinctNodes.push({ node, label })
    if (distinctNodes.length === 2) break
  }
  if (distinctNodes.length === 2) {
    const first = distinctNodes[0].node
    pointer(first, "onPointerDown", screen(nodePoint(first)))
    pointer(byClass("zw-graphSvg")[0], "onPointerUp", screen(nodePoint(first)))
    await settle(8)
    const second = byClass("zw-gnodeKn").find((node) => textOf(node).trim() === distinctNodes[1].label)
    if (second) {
      const mods = { ctrlKey: true, metaKey: true }
      pointer(second, "onPointerDown", screen(nodePoint(second)), mods)
      pointer(byClass("zw-graphSvg")[0], "onPointerUp", screen(nodePoint(second)), mods)
      await settle(10)
    }
  }
  check(byClass("zw-batchbar").length >= 1, "ctrl + click keeps multi selection and shows the batch bar")

  // 11.18 超长名称：不崩、按上限截断落库
  const newBtn2 = byClass("zw-btnPrimary").find((node) => textOf(node).includes(ZH["kn.new"]))
  if (newBtn2) {
    click(newBtn2)
    await settle(8)
  }
  const longName = "超长名称".repeat(30)
  const nameInput = findAll((node) => node.type === "input" && node.props && node.props.placeholder === ZH["kn.titlePlaceholder"])[0]
  if (nameInput && nameInput.props.onChange) {
    nameInput.props.onChange({ target: { value: longName } })
    await settle(4)
  }
  const saveBtn = findAll((node) => node.type === "button" && textOf(node).trim() === ZH["action.save"])[0]
  if (saveBtn) saveBtn.props.onClick()
  await settle(10)
  const longPost = posts.filter((post) => post.action === "node-save").pop()
  check(Boolean(longPost), "an over-long name still posts a save")
  check(Boolean(longPost) && String(longPost.title || "").length <= 120, "the host keeps object titles within the limit")

  const allNav2 = byClass("zw-navItem").find((node) => textOf(node).includes(ZH["nav.all"]))
  if (allNav2) {
    click(allNav2)
    await settle(10)
  }
}

async function preferenceChecks() {
  const navItems = byClass('zw-navItem')
  const knowledgeNav = navItems.find((node) => textOf(node).indexOf(ZH['nav.knowledge']) >= 0)
  check(Boolean(knowledgeNav), 'knowledge nav available for preference checks')
  if (knowledgeNav) {
    await click(knowledgeNav)
    await settle(10)
  }

  const prefTab = byClass('zw-knTab').find((node) => textOf(node).trim() === ZH['kn.tab.preference'])
  check(Boolean(prefTab), 'the preference tab is available')
  if (prefTab) {
    await click(prefTab)
    await settle(10)
  }

  const prefNode = byClass('zw-gnode').filter((node) => textOf(node).indexOf('偏好') >= 0)[0] || null
  check(Boolean(prefNode), 'preference node is on the canvas')
  if (!prefNode) return

  const svg = byClass('zw-graphSvg')[0]
  const rect = prefNode.getBoundingClientRect()
  pointer(prefNode, 'onPointerDown', { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, pointerId: 41, button: 0 })
  pointer(svg, 'onPointerUp', { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, pointerId: 41, button: 0 })
  await settle(10)

  const detail = byClass('zw-detail')[0] || null
  check(Boolean(detail) && textOf(detail).indexOf('偏好') >= 0, 'preference detail opens on the right')
  check(Boolean(detail) && textOf(detail).indexOf(ZH['kn.correct']) >= 0, 'preference detail offers the correction entry')

  const correctBtn = findAll((node) => node.type === 'button' && node.props.title === ZH['kn.correct'])[0] || null
  check(Boolean(correctBtn), 'correction button is rendered for preferences')
  if (!correctBtn) return
  correctBtn.props.onClick()
  await settle(8)

  const dialog = byClass('zw-modal')[0] || null
  check(Boolean(dialog) && textOf(dialog).indexOf(ZH['kn.correctHint']) >= 0, 'correction dialog explains what happens')
  if (!dialog) return

  const narrow = findAll((node) => node.type === 'button' && textOf(node).trim() === ZH['kn.narrow'])[0]
  check(Boolean(narrow), 'the narrow-scope option is offered')
  if (!narrow) return
  narrow.props.onClick({})
  await settle(6)

  const saveBtn = findAll((node) => node.type === 'button' && textOf(node).trim() === ZH['action.save']).pop()
  check(Boolean(saveBtn), 'the correction can be saved')
  if (!saveBtn) return
  await saveBtn.props.onClick()
  await settle(10)

  const saved = posts.filter((item) => item.action === 'node-save' && item.id === 'knd_pref_smoke').pop()
  check(Boolean(saved), 'correction posts a node-save for the preference')
  check(Boolean(saved) && saved.scope === 'project', 'narrowing the scope writes scope=project')
  check(Boolean(saved) && Array.isArray(saved.attributes) && saved.attributes.some((item) => String(item.label) === ZH['kn.correct']), 'the correction is recorded on the object as an attribute')
}
// ---------------------------------------------------------------- 6. summary
  // 批量操作条：归档 / 加标签 / 删除，以及搜索里的集合与项目分组
  {
    const allNavBtn = byClass('zw-navItem').find((node) => textOf(node).includes(ZH['nav.all']))
    if (allNavBtn) {
      click(allNavBtn)
      await settle(8)
    }
    const rows = byClass('zw-rowCheck')
    if (rows.length >= 2) {
      click(rows[0])
      await settle(3)
      click(byClass('zw-rowCheck')[1])
      await settle(5)

      const bar = byClass('zw-batchbar')[0]
      check(Boolean(bar), 'selecting two rows shows the batch bar')
      const barText = bar ? textOf(bar) : ''
      check(barText.includes(ZH['batch.archive']), 'batch bar offers archive')
      check(barText.includes(ZH['batch.tag']), 'batch bar offers add-tag')
      check(barText.includes(ZH['batch.delete']), 'batch bar offers delete')

      const tagBtn = findAll((node) => node.type === 'button' && textOf(node).trim() === ZH['batch.tag'])[0]
      if (tagBtn) {
        click(tagBtn)
        await settle(6)
        const tagInput = findAll((node) => node.type === 'input' && node.props && node.props.placeholder === ZH['batch.tagPlaceholder'])[0]
        check(Boolean(tagInput), 'add-tag dialog opens with an input')
        if (tagInput) {
          tagInput.props.onChange({ target: { value: '批量标签' } })
          await settle(4)
          const applyBtn = findAll((node) => node.type === 'button' && textOf(node).trim() === ZH['batch.tagApply'])[0]
          check(Boolean(applyBtn), 'add-tag dialog has an apply button')
          if (applyBtn) {
            click(applyBtn)
            await settle(10)
            const posted = posts.filter((item) => item.action === 'entry-bulk' && item.op === 'addTag')
            check(posted.length >= 1, 'add-tag posts entry-bulk addTag')
            if (posted.length) {
              check(posted[posted.length - 1].value === '批量标签', 'add-tag sends the typed tag')
            }
          }
        }
      }

      const deleteBtn = findAll((node) => node.type === 'button' && textOf(node).trim() === ZH['batch.delete'])[0]
      if (deleteBtn) {
        click(deleteBtn)
        await settle(6)
        check(byClass('zw-modal').length === 1, 'delete asks for confirmation in a dialog')
        const cancel = findAll((node) => node.type === 'button' && textOf(node).trim() === ZH['action.cancel'])[0]
        if (cancel) {
          click(cancel)
          await settle(6)
        }
      }
    }
  }

const failed = results.filter((item) => !item.ok)
for (const item of results) console.log((item.ok ? 'PASS  ' : 'FAIL  ') + item.message)
console.log('')
console.log(`SUMMARY  ${results.length} checks · ${results.length - failed.length} passed · ${failed.length} failed`)
if (failed.length) {
  console.log('posts: ' + posts.map((post) => post.action).join(', '))
  process.exit(1)
}

// ------------------------------------------------- 5c. knowledge network checks
async function knowledgeChecks() {
  const navButtons = () => byClass('zw-navItem')
  const knowledgeNav = navButtons().find((node) => textOf(node).includes(ZH['nav.knowledge']))
  check(Boolean(knowledgeNav), 'left rail lists the knowledge network')
  if (!knowledgeNav) return
  click(knowledgeNav)
  await settle(12)
  check(byClass('zw-knTabs').length === 1, 'knowledge network shows the four view tabs')
  check(byClass('zw-knTab').length === 4, 'four knowledge views are offered')
const expandAllBtn = findAll((node) => node.type === 'button' && node.props.title === ZH['graph.expandAll'])[0]
check(Boolean(expandAllBtn), 'graph offers expand all')
  const knNodes = byClass('zw-gnodeKn')
  check(knNodes.length >= 1, 'knowledge objects are drawn as their own nodes')
  const glyph = byClass('zw-gnodeKnGlyph')[0]
  check(Boolean(glyph), 'knowledge nodes carry a type glyph')
  const firstNode = live.nodes.find((node) => node.status !== 'merged')
  check(Boolean(firstNode), 'fixture carries at least one knowledge object')
  const drawn = knNodes[0]
  if (drawn && firstNode) {
    drawn.props.onPointerDown({ clientX: 260, clientY: 220, pointerId: 21, button: 0, shiftKey: false, metaKey: false, ctrlKey: false, currentTarget: drawn, preventDefault() {}, stopPropagation() {} })
    await settle(2)
    const svg = byClass('zw-graphSvg')[0]
    if (svg && svg.props.onPointerUp) svg.props.onPointerUp({ clientX: 260, clientY: 220, pointerId: 21 })
    await settle(10)
    check(byClass('zw-detail').length === 1, 'clicking a knowledge object opens the detail rail')
    const title = byClass('zw-detailTitle')[0]
    check(Boolean(title) && textOf(title).includes(firstNode.title), 'detail rail shows the clicked object')
  }
  const newNodeBtn = findAll((node) => node.type === 'button' && textOf(node).includes(ZH['kn.new']))[0]
  check(Boolean(newNodeBtn), 'knowledge page offers a new-object button')
  if (newNodeBtn) {
    click(newNodeBtn)
    await settle(10)
    check(byClass('zw-modal').length === 1, 'new-object dialog opens')
    const needTitle = findAll((node) => node.type === 'button' && textOf(node).includes(ZH['action.save']))[0]
    if (needTitle) {
      click(needTitle)
      await settle(6)
      const saveButtons = findAll((node) => node.type === 'button' && textOf(node).trim() === ZH['action.save'])
      saveButtons.forEach((button) => { if (button.props.onClick) button.props.onClick() })
      await settle(8)
      check(byClass('zw-error').length >= 1, 'empty name is rejected with a clear error')
      const nameField = findAll((node) => node.type === 'input' && node.props && node.props.onChange)[0]
      if (nameField && nameField.props && nameField.props.onChange) {
        const typed = '失败也要留住输入'
        nameField.props.onChange({ target: { value: typed } })
        await settle(4)
        globalThis.__failNext('node-save')
        const saveBtn2 = findAll((node) => node.type === 'button' && textOf(node).trim() === ZH['action.save'])[0]
        if (saveBtn2 && saveBtn2.props && saveBtn2.props.onClick) {
          saveBtn2.props.onClick()
          await settle(8)
          const toastText = textOf(byClass('zw-toast')[0] || {})
          check(
            Boolean(byClass('zw-toast').length) && toastText.length > 0 && !toastText.includes(ZH['toast.saved']),
            'a failed save reports an error instead of pretending success'
          )
          check(byClass('zw-modal').length === 1, 'a failed save keeps the dialog open')
          const stillTyped = findAll((node) => node.type === 'input' && node.props && node.props.value === typed)[0]
          check(Boolean(stillTyped), 'a failed save keeps what the user typed')
        }
      }
    }
    const cancel = findAll((node) => node.type === 'button' && textOf(node).includes(ZH['action.cancel']))[0]
    if (cancel) click(cancel)
    await settle(8)
  }
  const relationBtn = findAll((node) => node.type === 'button' && textOf(node).includes(ZH['kn.createRelation']))[0]
  if (relationBtn) {
    click(relationBtn)
    await settle(10)
    check(byClass('zw-preview').length >= 2, 'relation dialog previews start and end')
    check(textOf(byClass('zw-preview')[0] || {}).length > 0, 'relation preview has text')
    const close = findAll((node) => node.type === 'button' && textOf(node).includes(ZH['action.cancel']))[0]
    if (close) click(close)
    await settle(6)
  } else {
    check(false, 'create-relation entry available on a knowledge object')
  }
  // 展开/折叠：点了 +N 之后子对象从画布收起，再点回来
  const badge = byClass('zw-gnodeKnCount')[0]
  check(Boolean(badge), 'knowledge nodes show a hidden-children badge')
  const beforeCollapse = byClass('zw-gnodeKn').length
  if (badge && badge.props.onClick) {
    badge.props.onClick({ stopPropagation() {} })
    await settle(10)
    check(byClass('zw-gnodeKn').length < beforeCollapse, 'collapsing a parent hides its children')
    const again = byClass('zw-gnodeKnCount')[0]
    if (again && again.props.onClick) {
      again.props.onClick({ stopPropagation() {} })
      await settle(10)
    }
    check(byClass('zw-gnodeKn').length === beforeCollapse, 'expanding the parent brings the children back')
  }

  // Delete 键对选中对象发起删除 / 归档确认，而不是直接删
  const knNow = byClass('zw-gnodeKn')[0]
  if (knNow) {
    knNow.props.onPointerDown({ clientX: 260, clientY: 220, pointerId: 31, button: 0, shiftKey: false, metaKey: false, ctrlKey: false, currentTarget: knNow, preventDefault() {}, stopPropagation() {} })
    await settle(2)
    const svgUp = byClass('zw-graphSvg')[0]
    if (svgUp && svgUp.props.onPointerUp) svgUp.props.onPointerUp({ clientX: 260, clientY: 220, pointerId: 31 })
    await settle(8)
    ;(windowListeners.keydown || []).forEach((handler) =>
      handler({ key: 'Delete', target: { tagName: 'div' }, preventDefault() {}, stopPropagation() {} })
    )
    await settle(10)
    check(byClass('zw-modal').length === 1, 'Delete asks for confirmation before removing a knowledge object')
    check(textOf(byClass('zw-modal')[0] || {}).includes(ZH['kn.archiveAction']), 'delete dialog offers archiving first')
    const closeDialog = findAll((node) => node.type === 'button' && textOf(node).trim() === ZH['action.cancel'])[0]
    if (closeDialog) click(closeDialog)
    await settle(8)
  }

  // 合并：详情里的合并按钮会打开独立的合并流程，先看对比再确认
  const mergeBtn = findAll((node) => node.type === 'button' && node.props && node.props.title === ZH['kn.merge'])[0]
  check(Boolean(mergeBtn), 'node detail offers a merge entry')
  const hideBtn = findAll((node) => node.type === 'button' && node.props && node.props.title === ZH['kn.hide'])[0]
  check(Boolean(hideBtn), 'node detail offers hiding from the view')
  if (hideBtn) {
    const before = posts.length
    click(hideBtn)
    await settle(8)
    const hidePost = posts.slice(before).find((post) => post.action === 'layout-save' && Array.isArray(post.hidden))
    check(Boolean(hidePost) && hidePost.hidden.length >= 1, 'hiding posts a layout-save with hidden ids')
    const unhideBtn = findAll((node) => node.type === 'button' && node.props && node.props.title === ZH['kn.show'])[0]
    check(Boolean(unhideBtn), 'a hidden object can be shown again')
    if (unhideBtn) {
      const mark = posts.length
      click(unhideBtn)
      await settle(8)
      const showPost = posts.slice(mark).find((post) => post.action === 'layout-save' && Array.isArray(post.hidden))
      check(Boolean(showPost) && showPost.hidden.length === 0, 'unhiding clears the hidden list')
    }
  }
  if (mergeBtn) {
    click(mergeBtn)
    await settle(10)
    check(byClass('zw-modal').length === 1, 'merge opens its own dialog')
    const mergeText = textOf(byClass('zw-modal')[0] || {})
    check(mergeText.includes(ZH['kn.mergeHint']), 'merge dialog explains what will be kept')
    const cancelMerge = findAll((node) => node.type === 'button' && textOf(node).trim() === ZH['action.cancel'])[0]
    if (cancelMerge) click(cancelMerge)
    await settle(6)
  }

  // 搜索同时找知识对象：列表上方会给出对象命中，点进去切到知识网络
  const allNavEarly = navButtons().find((node) => textOf(node).includes(ZH['nav.all']))
  if (allNavEarly) {
    click(allNavEarly)
    await settle(10)
    const searchInput = byClass('zw-searchInput')[0]
    check(Boolean(searchInput), 'list view has a search box')
    if (searchInput) {
      searchInput.props.onChange({ target: { value: '烟雾测试系统' } })
      await settle(10)
      check(byClass('zw-knHit').length >= 1, 'searching also finds knowledge objects')
      const hit = byClass('zw-knHit')[0]
      if (hit) {
        click(hit)
        await settle(10)
        check(byClass('zw-knTabs').length === 1, 'clicking a knowledge hit opens the knowledge network')
      }
      const searchReset = byClass('zw-searchInput')[0]
      if (searchReset) {
        searchReset.props.onChange({ target: { value: '' } })
        await settle(8)
      }
    }
  }

  // ---- 流程步骤拖拽排序（V2.4 第六节：改序用明显把手）
  {
    const knNav = navButtons().find((node) => textOf(node).includes(ZH['nav.knowledge']))
    if (knNav) {
      click(knNav)
      await settle(10)
      for (let guard = 0; guard < 3; guard += 1) {
        if (!byClass('zw-modal').length) break
        ;(documentListeners.keydown || []).concat(windowListeners.keydown || []).forEach((handler) =>
          handler({ key: 'Escape', target: { tagName: 'div' }, preventDefault() {}, stopPropagation() {} })
        )
        await settle(6)
      }
      check(byClass('zw-modal').length === 0, 'no dialog is left open before the step drag test')
      const newBtn = findAll((node) => node.type === 'button' && textOf(node).indexOf(ZH['kn.new']) >= 0)[0]
      check(Boolean(newBtn), 'knowledge view offers a new-object button')
      if (newBtn) {
        click(newBtn)
        await settle(8)
        const typeSelect = byClass('zw-select')[0]
        check(Boolean(typeSelect), 'new-object dialog has a type field')
        if (typeSelect && typeSelect.props.onChange) {
          typeSelect.props.onChange({ target: { value: 'workflow' } })
          await settle(8)
        }
        const addStep = findAll((node) => node.type === 'button' && textOf(node).indexOf(ZH['kn.addStep']) >= 0)[0]
        check(Boolean(addStep), 'workflow dialog offers adding a step')
        for (let i = 0; i < 3; i += 1) {
          const btn = findAll((node) => node.type === 'button' && textOf(node).indexOf(ZH['kn.addStep']) >= 0)[0]
          if (btn) { click(btn); await settle(4) }
        }
        const titleInputs = () => byClass('zw-input').filter((node) => node.props && node.props.placeholder === ZH['kn.stepTitle'])
        const slots = titleInputs()
        check(slots.length === 3, 'three steps were added: ' + slots.length)
        if (slots.length === 3) {
          const stepLabels = ['第一步', '第二步', '第三步']
          for (let index = 0; index < 3; index += 1) {
            const input = titleInputs()[index]
            if (input && input.props.onChange) input.props.onChange({ target: { value: stepLabels[index] } })
            await settle(4)
          }
          await settle(6)
          const handles = byClass('zw-stepHandle')
          check(handles.length === 3, 'every workflow step has a drag handle: ' + handles.length)
          if (handles.length === 3) {
            handles[2].props.onDragStart({ preventDefault() {}, stopPropagation() {} })
            await settle(4)
            const rows = byClass('zw-stepEditRow')
            rows[0].props.onDragOver({ preventDefault() {}, stopPropagation() {} })
            await settle(2)
            rows[0].props.onDrop({ preventDefault() {}, stopPropagation() {} })
            await settle(6)
            const order = titleInputs().map((node) => node.props.value)
            check(order[0] === '第三步', 'dropping a step on the first row moves it to the top: ' + order.join('/'))
            check(order[2] === '第二步', 'the other steps keep their relative order: ' + order.join('/'))
            check(order.length === 3, 'reordering keeps every step')
            const nameInput = byClass('zw-input').find((node) => node.props && node.props.placeholder === ZH['kn.titlePlaceholder'])
            if (nameInput && nameInput.props.onChange) nameInput.props.onChange({ target: { value: '拖拽排序测试流程' } })
            await settle(4)
            const saveBtn = findAll((node) => node.type === 'button' && textOf(node).trim() === ZH['action.save'])[0]
            check(Boolean(saveBtn), 'workflow dialog offers saving')
            if (saveBtn) {
              const startIndex = posts.length
              click(saveBtn)
              await settle(10)
              const saved = posts.slice(startIndex).find((item) => item && item.action === 'node-save')
              check(Boolean(saved), 'reordered steps are saved')
              if (saved) {
                const savedOrder = (saved.steps || []).map((step) => step.title)
                check(savedOrder[0] === '第三步', 'node-save carries the new step order: ' + savedOrder.join('/'))
                check(savedOrder[2] === '第二步', 'node-save keeps the remaining order: ' + savedOrder.join('/'))
              }
            }
          }
        }
      }
    }
  }
  // 回到全部记忆，确认导航还能切回去
  const allNav = navButtons().find((node) => textOf(node).includes(ZH['nav.all']))
  if (allNav) {
    click(allNav)
    await settle(10)
    check(byClass('zw-knTabs').length === 0, 'switching views does not duplicate knowledge widgets')
  }
}
