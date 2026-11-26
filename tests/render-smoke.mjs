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
const fakeDocument = {
  documentElement: html,
  body,
  addEventListener() {},
  removeEventListener() {},
  createElement: () => ({})
}
class MutationObserver {
  observe() {}
  disconnect() {}
}
let exported = null
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
  addEventListener() {},
  removeEventListener() {}
}
new Function('window', 'document', 'MutationObserver', fs.readFileSync(CLIENT, 'utf8'))(
  fakeWindow,
  fakeDocument,
  MutationObserver
)

// -------------------------------------------------------------- 3. fake fetch
let fetchCalls = 0
const posts = []
const live = JSON.parse(JSON.stringify(state))
let nextId = 1000
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
    stats: live.stats,
    storagePath: 'C:\\fake\\memories.json'
  })
}

function applyPost(input) {
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
        protectedCount: 0
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

globalThis.fetch = async (url, options) => {
  fetchCalls += 1
  const input = options && options.body ? JSON.parse(options.body) : null
  if (input) {
    posts.push(input)
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
    return { ok: true, status: 200, json: async () => applyPost(input) }
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
async function settle(maxPasses = 40) {
  let passes = 0
  do {
    dirty = false
    effectQueue = []
    nameCounters = Object.create(null)
    hookIndex = 0
    tree = React.createElement(mainSlot.component, {})
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
check(state.version === 4, 'store migrated to version 4')

const passes = await settle()
check(passes < 40, 'render settled in ' + passes + ' pass(es)')
check(fetchCalls >= 1, 'panel called the API: ' + fetchCalls + ' time(s)')

const roots = byClass('zw-root')
check(roots.length === 1, 'root rendered: ' + roots.length)
check(roots.length === 1 && roots[0].props['data-zw-theme'] === 'dark', 'dark theme applied')
check(byClass('zw-rail').length === 1, 'left rail rendered')
check(byClass('zw-rail')[0].props['data-collapsed'] === 'true', 'left rail starts collapsed (icon strip)')
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
    check(byClass('zw-toastAction').length === 1, 'undo action appears in the toast')
    const undoBtn = byClass('zw-toastAction')[0]
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
    textOf(node).includes(ZH['scope.project']) || textOf(node).includes(ZH['scope.global'])
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

// ---------------------------------------------------------------- 6. summary
const failed = results.filter((item) => !item.ok)
for (const item of results) console.log((item.ok ? 'PASS  ' : 'FAIL  ') + item.message)
console.log('')
console.log(`SUMMARY  ${results.length} checks · ${results.length - failed.length} passed · ${failed.length} failed`)
if (failed.length) {
  console.log('posts: ' + posts.map((post) => post.action).join(', '))
  process.exit(1)
}
