#!/usr/bin/env node
/**
 * Host-side test suite for the 知微 / design-memory DSH plugin (../index.js).
 *
 * Dependency-free (Node builtins only, node >= 18). Each boot:
 *   - creates a fresh temp DSH_HOME and points process.env.DSH_HOME at it
 *   - imports the plugin with a cache-busting query
 *   - applies it against a mock ctx that captures the three tools and the
 *     webServer prefix handler
 *   - drives the handler through a fake req/res HTTP layer (GET + POST)
 *
 * Run: node tests/host-test.mjs
 * Set ZHIWEI_KEEP_TEMP=1 to keep the temp DSH_HOME dirs for inspection.
 */

import { Readable } from 'node:stream'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PLUGIN_PATH = path.resolve(HERE, '..', 'index.js')
const ROUTE = '/design-memory/api'
const STORE_VERSION = 5

const ENTRY_TYPES = ['decision', 'rule', 'assumption', 'question', 'proposal', 'reference', 'metric', 'retro', 'process']
const RELATION_TYPES = ['belongs_to', 'depends_on', 'affects', 'derived_from', 'references', 'conflicts_with', 'supersedes', 'refines']
const COLLECTION_COLORS = ['violet', 'blue', 'teal', 'amber', 'rose', 'lime']

// ---------------------------------------------------------------------------
// tiny assertion helpers
// ---------------------------------------------------------------------------

function fail(message) {
  throw new Error(message)
}

let workspaceChecks = 0
function check(condition, message) {
  workspaceChecks += 1
  ok(condition, message)
}

function ok(condition, message) {
  if (!condition) fail(message)
}

function show(value) {
  try {
    const text = JSON.stringify(value)
    return text === undefined ? String(value) : text
  } catch {
    return String(value)
  }
}

function brief(value, max = 200) {
  const text = String(value)
  return text.length > max ? text.slice(0, max) + '…' : text
}

function eq(actual, expected, what) {
  if (show(actual) !== show(expected)) {
    fail(what + ': expected ' + brief(show(expected)) + ', got ' + brief(show(actual)))
  }
}

function notEq(actual, expected, what) {
  if (show(actual) === show(expected)) fail(what + ': did not expect ' + brief(show(actual)))
}

function includes(haystack, needle, what) {
  if (!haystack.includes(needle)) fail(what + ': missing ' + brief(show(needle)) + ' in ' + brief(show(haystack)))
}

function typeOf(value, expected, what) {
  if (typeof value !== expected) fail(what + ': expected ' + expected + ', got ' + typeof value)
}

function isArray(value, what) {
  if (!Array.isArray(value)) fail(what + ': expected array, got ' + show(value))
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// per-test runner
// ---------------------------------------------------------------------------

let passed = 0
let failed = 0
const failedTests = []

async function test(name, fn) {
  try {
    await fn()
    passed += 1
    console.log('PASS  ' + name)
  } catch (error) {
    failed += 1
    const message = error && error.message ? error.message : String(error)
    failedTests.push({ name, message })
    console.log('FAIL  ' + name)
    console.log('      ' + message.replace(/\r?\n/g, '\n      '))
  }
}

// ---------------------------------------------------------------------------
// fake HTTP layer
// ---------------------------------------------------------------------------

function toBuffer(chunk) {
  return Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))
}

class Api {
  constructor(handler) {
    this.handler = handler
  }

  request(options = {}) {
    const method = options.method || 'GET'
    const url = options.url || ROUTE
    const headers = {}
    for (const [key, value] of Object.entries(options.headers || {})) {
      headers[String(key).toLowerCase()] = value
    }
    let body = options.body
    if (body !== undefined && typeof body !== 'string') {
      body = JSON.stringify(body)
      if (!Object.prototype.hasOwnProperty.call(headers, 'content-type')) {
        headers['content-type'] = 'application/json'
      }
    }

    return new Promise((resolve, reject) => {
      const chunks = []
      let settled = false
      const timer = setTimeout(() => {
        if (settled) return
        settled = true
        reject(new Error('handler timed out for ' + method + ' ' + url))
      }, 5000)
      if (typeof timer.unref === 'function') timer.unref()

      const res = {
        statusCode: 200,
        headers: {},
        setHeader(name, value) {
          this.headers[String(name).toLowerCase()] = value
        },
        getHeader(name) {
          return this.headers[String(name).toLowerCase()]
        },
        write(chunk) {
          if (chunk !== undefined && chunk !== null) chunks.push(toBuffer(chunk))
          return true
        },
        end(chunk) {
          if (chunk !== undefined && chunk !== null) chunks.push(toBuffer(chunk))
          if (settled) return
          settled = true
          clearTimeout(timer)
          const text = Buffer.concat(chunks).toString('utf8')
          let json = null
          try {
            json = text ? JSON.parse(text) : null
          } catch {
            json = null
          }
          resolve({ status: res.statusCode, headers: res.headers, text, json })
        }
      }

      const req = new Readable({ read() {} })
      req.method = method
      req.url = url
      req.headers = headers
      if (body !== undefined) req.push(Buffer.from(body, 'utf8'))
      req.push(null)

      Promise.resolve()
        .then(() => this.handler(req, res))
        .catch((error) => {
          if (settled) return
          settled = true
          clearTimeout(timer)
          reject(error)
        })
    })
  }

  get(extra = {}) {
    return this.request({ method: 'GET', ...extra })
  }

  post(body, extra = {}) {
    return this.request({ method: 'POST', body, ...extra })
  }
}

// ---------------------------------------------------------------------------
// plugin boot helper (one isolated DSH_HOME per boot)
// ---------------------------------------------------------------------------

const tempRoots = []
let importSeq = 0

async function makeHome(tag) {
  const root = await mkdtemp(path.join(tmpdir(), 'zhiwei-' + tag + '-'))
  tempRoots.push(root)
  return root
}

async function boot(dshHome) {
  process.env.DSH_HOME = dshHome

  importSeq += 1
  const href = pathToFileURL(PLUGIN_PATH).href + '?hostTest=' + importSeq + '_' + Date.now()
  const mod = await import(href)

  const toolDefs = []
  const promptSections = []
  let capturedRoute = null
  const mockCtx = {
    tools: {
      list: toolDefs,
      register(def) {
        this.list.push(def)
      }
    },
    effect(run) {
      run()
    },
    inject(services, callback) {
      if (!Array.isArray(services)) return
      if (services.includes('webServer')) {
        callback({
          effect(run) {
            run()
          },
          webServer: {
            register(def) {
              capturedRoute = def
            }
          }
        })
        return
      }
      if (services.includes('systemPrompt')) {
        callback({
          effect(run) {
            run()
          },
          systemPrompt: {
            section(section) {
              if (!section || typeof section.name !== 'string') throw new TypeError('section needs a name')
              if (!Number.isFinite(section.order)) throw new TypeError('section needs a finite order')
              promptSections.push(section)
              return () => {}
            }
          }
        })
      }
    }
  }

  await mod.apply(mockCtx)
  if (!capturedRoute || typeof capturedRoute.handler !== 'function') {
    throw new Error('plugin did not register the /design-memory prefix handler')
  }

  const api = new Api(capturedRoute.handler)
  const deadline = Date.now() + 5000
  let snapshot = null
  while (Date.now() < deadline) {
    const res = await api.get()
    if (res.status === 200 && res.json) {
      snapshot = res.json
      break
    }
    await delay(10)
  }
  if (!snapshot) throw new Error('store did not become ready within 5s')

  return {
    mod,
    mockCtx,
    toolDefs,
    promptSections,
    route: capturedRoute,
    api,
    snapshot,
    home: dshHome,
    storeFile: path.join(dshHome, 'design-memory', 'memories.json')
  }
}

// ---------------------------------------------------------------------------
// suite: fresh store
// ---------------------------------------------------------------------------

async function runFreshSuite() {
  const home = await makeHome('fresh')
  const { api, toolDefs, route, storeFile, promptSections } = await boot(home)

  const getBody = async () => {
    const res = await api.get()
    eq(res.status, 200, 'GET status')
    return res.json
  }

  const postOk = async (body, what) => {
    const res = await api.post(body)
    if (res.status !== 200 || !res.json || res.json.ok !== true) {
      fail((what || 'POST') + ' failed: HTTP ' + res.status + ' ' + brief(res.text, 400))
    }
    return res.json
  }

  await test('registers six tools and a prefix route at /design-memory', () => {
    eq(
      toolDefs.map((def) => def.name).sort(),
      [
        'design_memory_analyze',
        'design_memory_observe',
        'design_memory_recall',
        'design_memory_search',
        'design_memory_suggest',
        'design_memory_write'
      ],
      'registered tools'
    )
    eq(route.kind, 'prefix', 'route kind')
    eq(route.path, '/design-memory', 'route path')
    typeOf(route.handler, 'function', 'route handler')
  })

  await test('registers a zhiwei system prompt section that explains recall and observe', () => {
    eq(promptSections.length, 1, 'prompt section count')
    const section = promptSections[0]
    eq(section.name, 'design-memory:zhiwei', 'section name')
    ok(Number.isFinite(section.order), 'section order must be finite')
    ok(section.text.includes('design_memory_recall'), 'prompt should point at the recall tool')
    ok(section.text.includes('固有约定'), 'prompt should explain protected memories')
  })

  await test('fresh store: GET returns ok/version 5/full envelope', async () => {
    const body = await getBody()
    eq(body.ok, true, 'ok')
    eq(body.version, STORE_VERSION, 'version')
    for (const key of ['meta', 'projects', 'entries', 'relations', 'collections', 'views', 'stats', 'storagePath']) {
      ok(Object.prototype.hasOwnProperty.call(body, key), 'missing envelope key ' + key)
    }
    eq(body.storagePath, storeFile, 'storagePath')
    eq(body.projects.length, 1, 'default project count')
    eq(body.projects[0].id, 'prj_default', 'default project id')
    eq(body.entries.length, 0, 'entries')
    eq(body.relations.length, 0, 'relations')
    eq(body.collections.length, 0, 'collections')
    eq(body.views.length, 0, 'views')
    eq(body.stats.entries, 0, 'stats.entries')
    isArray(body.meta.entryTypes, 'meta.entryTypes')
  })

  await test('fresh store: memories.json created on disk with version 5', async () => {
    ok(existsSync(storeFile), 'store file was not created at ' + storeFile)
    const disk = JSON.parse(await readFile(storeFile, 'utf8'))
    eq(disk.version, STORE_VERSION, 'on-disk version')
    eq(disk.projects.length, 1, 'on-disk projects')
    eq(disk.entries.length, 0, 'on-disk entries')
  })

  await test('project-delete refuses to delete the last project (400 last-project)', async () => {
    const res = await api.post({ action: 'project-delete', id: 'prj_default' })
    eq(res.status, 400, 'HTTP status')
    eq(res.json.ok, false, 'ok')
    eq(res.json.error.code, 'last-project', 'error code')
    eq((await getBody()).projects.length, 1, 'project still present')
  })

  let idA = null
  await test('entry-save creates entry with derived summary and initial history', async () => {
    const body = await postOk(
      {
        action: 'entry-save',
        title: '技能冷却规则',
        content: '## 技能冷却\n每日技能释放上限为 5 次，冷却 8 秒。',
        type: 'rule',
        domains: ['combat'],
        tags: ['冷却', '技能'],
        status: 'active',
        facts: [{ label: '冷却', value: '8 秒' }],
        source: { kind: 'conversation', label: '组会' }
      },
      'entry-save create'
    )
    const entry = body.entry
    eq(body.created, true, 'created')
    ok(entry.id.startsWith('mem_'), 'entry id prefix, got ' + entry.id)
    eq(entry.title, '技能冷却规则', 'title')
    eq(entry.type, 'rule', 'type')
    eq(entry.status, 'active', 'status')
    eq(entry.domains, ['combat'], 'domains')
    eq(entry.tags, ['冷却', '技能'], 'tags')
    eq(entry.facts, [{ label: '冷却', value: '8 秒' }], 'facts')
    eq(entry.history.length, 1, 'history length')
    eq(entry.history[0].note, '创建', 'history note')
    eq(entry.updatedAt, entry.createdAt, 'updatedAt === createdAt on create')
    ok(entry.summary && entry.summary.includes('技能释放上限'), 'derived summary, got ' + show(entry.summary))
    ok(!entry.summary.includes('#'), 'summary should strip markdown heading, got ' + show(entry.summary))
    ok(entry.content.includes('每日技能释放上限'), 'content kept')
    idA = entry.id
  })

  await test('entry-save update bumps updatedAt, grows history and re-derives summary', async () => {
    const before = (await getBody()).entries.find((item) => item.id === idA)
    ok(before, 'entry A missing')
    await delay(10)
    const body = await postOk(
      {
        action: 'entry-save',
        id: idA,
        content: '冷却调整为 10 秒，每日上限保持 5 次。',
        note: '调整冷却'
      },
      'entry-save update'
    )
    const entry = body.entry
    eq(body.created, false, 'created flag')
    eq(entry.id, idA, 'id stable')
    eq(entry.title, '技能冷却规则', 'title preserved')
    ok(Date.parse(entry.updatedAt) > Date.parse(before.updatedAt), 'updatedAt should increase')
    eq(entry.history.length, 2, 'history length')
    eq(entry.history[0].note, '调整冷却', 'history note')
    eq(entry.content, '冷却调整为 10 秒，每日上限保持 5 次。', 'content')
    ok(entry.summary.includes('10 秒'), 'summary re-derived, got ' + show(entry.summary))
  })

  await test('[BUG] entry-save metadata-only update bumps updatedAt/history', async () => {
    const before = (await getBody()).entries.find((item) => item.id === idA)
    ok(before, 'entry A missing')
    await delay(10)
    const body = await postOk(
      { action: 'entry-save', id: idA, tags: ['冷却', '技能', '数值'], note: '补标签' },
      'entry-save metadata-only update'
    )
    const entry = body.entry
    eq(entry.tags, ['冷却', '技能', '数值'], 'tags updated')
    ok(
      Date.parse(entry.updatedAt) > Date.parse(before.updatedAt),
      'updatedAt should increase when tags change (serializeState sorts by updatedAt, index.js:1549)'
    )
    eq(entry.history.length, before.history.length + 1, 'history should record the edit')
  })

  await test('entry-status changes status and records history', async () => {
    await delay(5)
    const body = await postOk({ action: 'entry-status', id: idA, status: 'pending', note: '等确认' }, 'entry-status')
    eq(body.entry.status, 'pending', 'status')
    eq(body.entry.history[0].note.includes('待确认'), true, 'history note mentions new status: ' + show(body.entry.history[0].note))
  })

  await test('entry-flag sets favorite and pinned', async () => {
    const favorite = await postOk({ action: 'entry-flag', id: idA, field: 'favorite', favorite: true }, 'entry-flag favorite')
    eq(favorite.entry.favorite, true, 'favorite')
    const pinned = await postOk({ action: 'entry-flag', id: idA, field: 'pinned', pinned: true }, 'entry-flag pinned')
    eq(pinned.entry.pinned, true, 'pinned')
    eq(pinned.entry.favorite, true, 'favorite preserved')
  })

  let idB = null
  await test('entry-save creates a second (metric) entry', async () => {
    const body = await postOk(
      {
        action: 'entry-save',
        title: '伤害公式',
        content: '伤害 = 攻击 × 系数 - 防御。',
        type: 'metric',
        domains: ['combat', 'economy'],
        tags: ['冷却', '伤害'],
        status: 'draft'
      },
      'entry-save B'
    )
    idB = body.entry.id
    eq(body.entry.type, 'metric', 'type')
    eq(body.entry.domains, ['combat', 'economy'], 'domains')
    eq(body.entry.status, 'draft', 'status')
  })

  let relAB = null
  await test('relation-create forward direction', async () => {
    const body = await postOk(
      {
        action: 'relation-create',
        sourceMemoryId: idA,
        targetMemoryId: idB,
        relationType: 'references',
        description: '参考伤害公式',
        status: 'confirmed'
      },
      'relation-create A→B'
    )
    relAB = body.relation
    eq(body.created, true, 'created')
    eq(relAB.sourceMemoryId, idA, 'source')
    eq(relAB.targetMemoryId, idB, 'target')
    eq(relAB.relationType, 'references', 'relationType')
    eq(relAB.status, 'confirmed', 'status')
    eq(relAB.description, '参考伤害公式', 'description')
  })

  let relReverse = null
  await test('relation-create reverse direction is allowed', async () => {
    const body = await postOk(
      {
        action: 'relation-create',
        sourceMemoryId: idB,
        targetMemoryId: idA,
        relationType: 'depends_on'
      },
      'relation-create B→A'
    )
    relReverse = body.relation
    eq(body.created, true, 'created')
    eq(relReverse.relationType, 'depends_on', 'relationType')
    eq(relReverse.status, 'suggested', 'default status')
    eq((await getBody()).relations.length, 2, 'relation count')
  })

  await test('relation-create rejects self relations (400 self-relation)', async () => {
    const res = await api.post({
      action: 'relation-create',
      sourceMemoryId: idA,
      targetMemoryId: idA,
      relationType: 'references'
    })
    eq(res.status, 400, 'HTTP status')
    eq(res.json.ok, false, 'ok')
    eq(res.json.error.code, 'self-relation', 'error code')
  })

  await test('relation-create duplicate does not add a second row', async () => {
    const before = (await getBody()).relations.length
    const res = await api.post({
      action: 'relation-create',
      sourceMemoryId: idA,
      targetMemoryId: idB,
      relationType: 'references'
    })
    eq(res.status, 200, 'HTTP status')
    eq(res.json.created, false, 'created')
    eq((await getBody()).relations.length, before, 'relation count unchanged')
  })

  await test('[BUG] duplicate relation-create demotes a confirmed relation to suggested', async () => {
    const rel = (await getBody()).relations.find((item) => item.id === relAB.id)
    ok(rel, 'relation A→B vanished')
    eq(rel.status, 'confirmed', 'duplicate relation-create without status must not downgrade confirmed')
  })

  let relDecide = null
  await test('relation-decide suggested → confirmed', async () => {
    relDecide = (
      await postOk(
        {
          action: 'relation-create',
          sourceMemoryId: idA,
          targetMemoryId: idB,
          relationType: 'affects',
          description: 'AI 建议'
        },
        'relation-create affects'
      )
    ).relation
    eq(relDecide.status, 'suggested', 'initial status')
    const body = await postOk(
      { action: 'relation-decide', id: relDecide.id, relationStatus: 'confirmed' },
      'relation-decide confirm'
    )
    eq(body.relation.status, 'confirmed', 'status after decide')
  })

  await test('relation-decide rejected keeps the row; remove:true purges it', async () => {
    const created = (
      await postOk(
        {
          action: 'relation-create',
          sourceMemoryId: idA,
          targetMemoryId: idB,
          relationType: 'conflicts_with'
        },
        'relation-create conflicts'
      )
    ).relation
    const rejected = await postOk(
      { action: 'relation-decide', id: created.id, relationStatus: 'rejected' },
      'relation-decide reject'
    )
    eq(rejected.relation.status, 'rejected', 'status rejected')
    const body = await getBody()
    ok(body.relations.some((item) => item.id === created.id), 'rejected relation should persist as a record')
    const removed = await postOk(
      { action: 'relation-decide', id: created.id, relationStatus: 'rejected', remove: 'true' },
      'relation-decide purge'
    )
    eq(removed.removed, created.id, 'removed id')
    ok(!(await getBody()).relations.some((item) => item.id === created.id), 'purged relation still present')
  })

  await test('relation-update edits type/description/status', async () => {
    const body = await postOk(
      {
        action: 'relation-update',
        id: relReverse.id,
        relationType: 'supersedes',
        description: '新的说明',
        status: 'confirmed'
      },
      'relation-update'
    )
    eq(body.relation.relationType, 'supersedes', 'relationType')
    eq(body.relation.description, '新的说明', 'description')
    eq(body.relation.status, 'confirmed', 'status')
  })

  await test('relation-delete removes the relation', async () => {
    const before = (await getBody()).relations.length
    const body = await postOk({ action: 'relation-delete', id: relReverse.id }, 'relation-delete')
    eq(body.deleted, relReverse.id, 'deleted id')
    const after = (await getBody()).relations.length
    eq(after, before - 1, 'relation count')
    ok(!(await getBody()).relations.some((item) => item.id === relReverse.id), 'relation still present')
  })

  let coll1 = null
  await test('collection-save creates a collection', async () => {
    const body = await postOk(
      { action: 'collection-save', name: '冷却主题', description: '冷却相关记忆', memberIds: [idA, idB] },
      'collection-save create'
    )
    coll1 = body.collection
    eq(body.created, true, 'created')
    ok(coll1.id.startsWith('col_'), 'collection id prefix')
    eq(coll1.name, '冷却主题', 'name')
    eq(coll1.description, '冷却相关记忆', 'description')
    eq(coll1.memberIds, [idA, idB], 'memberIds')
    eq(coll1.status, 'confirmed', 'status')
    eq(coll1.source, 'manual', 'source')
    ok(COLLECTION_COLORS.includes(coll1.color), 'color, got ' + show(coll1.color))
  })

  await test('collection-save updates name/description without touching members', async () => {
    await delay(5)
    const body = await postOk(
      { action: 'collection-save', id: coll1.id, name: '冷却与伤害', description: '更新后的说明' },
      'collection-save update'
    )
    eq(body.created, false, 'created')
    eq(body.collection.name, '冷却与伤害', 'name')
    eq(body.collection.description, '更新后的说明', 'description')
    eq(body.collection.memberIds, [idA, idB], 'memberIds unchanged')
    ok(Date.parse(body.collection.updatedAt) > Date.parse(coll1.updatedAt), 'updatedAt bumped')
  })

  let coll2 = null
  await test('collection-members add/remove; an entry can belong to multiple collections', async () => {
    coll2 = (
      await postOk({ action: 'collection-save', name: '第二集合', memberIds: [idA] }, 'collection-save 2')
    ).collection
    const added = await postOk(
      { action: 'collection-members', id: coll2.id, add: [idB] },
      'collection-members add'
    )
    eq(added.collection.memberIds, [idA, idB], 'members after add')
    const removed = await postOk(
      { action: 'collection-members', id: coll1.id, remove: [idB] },
      'collection-members remove'
    )
    eq(removed.collection.memberIds, [idA], 'members after remove')
    const body = await getBody()
    const entryA = body.entries.find((item) => item.id === idA)
    ok(entryA.relatedCollectionIds.includes(coll1.id), 'A in coll1')
    ok(entryA.relatedCollectionIds.includes(coll2.id), 'A in coll2')
    eq(entryA.relatedCollectionIds.length, 2, 'A collection count')
  })

  await test('entry-delete removes relations and collection memberships', async () => {
    const e = (
      await postOk({ action: 'entry-save', title: '待删记忆', content: '临时内容，用于删除测试。' }, 'create temp entry')
    ).entry
    await postOk(
      { action: 'relation-create', sourceMemoryId: idA, targetMemoryId: e.id, relationType: 'affects' },
      'temp relation'
    )
    await postOk({ action: 'collection-members', id: coll1.id, add: [e.id] }, 'temp membership')
    const deleted = await postOk({ action: 'entry-delete', id: e.id }, 'entry-delete')
    eq(deleted.deleted, e.id, 'deleted id')
    const body = await getBody()
    ok(!body.entries.some((item) => item.id === e.id), 'entry still present')
    ok(
      !body.relations.some((item) => item.sourceMemoryId === e.id || item.targetMemoryId === e.id),
      'dangling relation still present'
    )
    const coll = body.collections.find((item) => item.id === coll1.id)
    ok(coll && !coll.memberIds.includes(e.id), 'collection membership not cleaned')
  })

  await test('entry-bulk addCollection/removeCollection/status/delete', async () => {
    const b1 = (await postOk({ action: 'entry-save', title: '批量甲', content: '批量甲正文。' }, 'bulk create 1')).entry
    const b2 = (await postOk({ action: 'entry-save', title: '批量乙', content: '批量乙正文。' }, 'bulk create 2')).entry
    const coll = (await postOk({ action: 'collection-save', name: '批量集合' }, 'bulk collection')).collection

    const added = await postOk(
      { action: 'entry-bulk', ids: [b1.id, b2.id], op: 'addCollection', value: coll.id },
      'bulk addCollection'
    )
    eq(added.affected, 2, 'affected after add')
    let body = await getBody()
    let stored = body.collections.find((item) => item.id === coll.id)
    eq(stored.memberIds.sort(), [b1.id, b2.id].sort(), 'members after bulk add')

    await postOk({ action: 'entry-bulk', ids: [b1.id], op: 'removeCollection', value: coll.id }, 'bulk removeCollection')
    body = await getBody()
    stored = body.collections.find((item) => item.id === coll.id)
    eq(stored.memberIds, [b2.id], 'members after bulk remove')

    await postOk({ action: 'entry-bulk', ids: [b2.id], op: 'status', value: 'active' }, 'bulk status')
    body = await getBody()
    eq(body.entries.find((item) => item.id === b2.id).status, 'active', 'bulk status applied')

    const deleted = await postOk({ action: 'entry-bulk', ids: [b2.id], op: 'delete' }, 'bulk delete')
    eq(deleted.affected, 1, 'affected after bulk delete')
    body = await getBody()
    ok(!body.entries.some((item) => item.id === b2.id), 'bulk-deleted entry still present')
  })

  await test('collection-merge moves members and removes the source', async () => {
    const c = (await postOk({ action: 'entry-save', title: '合并甲', content: '合并甲正文。' }, 'merge entry c')).entry
    const d = (await postOk({ action: 'entry-save', title: '合并乙', content: '合并乙正文。' }, 'merge entry d')).entry
    const source = (
      await postOk({ action: 'collection-save', name: '合并源', memberIds: [c.id] }, 'merge source')
    ).collection
    const target = (
      await postOk({ action: 'collection-save', name: '合并目标', memberIds: [d.id] }, 'merge target')
    ).collection
    const body = await postOk(
      { action: 'collection-merge', id: source.id, intoId: target.id },
      'collection-merge'
    )
    eq(body.mergedFrom, '合并源', 'mergedFrom')
    const state = await getBody()
    ok(!state.collections.some((item) => item.id === source.id), 'source collection still present')
    const merged = state.collections.find((item) => item.id === target.id)
    eq(merged.memberIds.sort(), [c.id, d.id].sort(), 'target members')
    ok(state.entries.some((item) => item.id === c.id), 'merged entry deleted')
  })

  await test('collection-split moves members into a new collection', async () => {
    const a = (await postOk({ action: 'entry-save', title: '拆分甲', content: '拆分甲正文。' }, 'split entry a')).entry
    const b = (await postOk({ action: 'entry-save', title: '拆分乙', content: '拆分乙正文。' }, 'split entry b')).entry
    const source = (
      await postOk({ action: 'collection-save', name: '拆分源', memberIds: [a.id, b.id] }, 'split source')
    ).collection
    const body = await postOk(
      { action: 'collection-split', id: source.id, memberIds: [a.id], name: '拆出集合' },
      'collection-split'
    )
    eq(body.collection.name, '拆出集合', 'new name')
    eq(body.collection.memberIds, [a.id], 'new members')
    eq(body.source.memberIds, [b.id], 'source members')
    const state = await getBody()
    ok(state.collections.some((item) => item.id === body.collection.id), 'new collection missing')
  })

  await test('collection-delete removes the collection but not its members', async () => {
    const temp = (
      await postOk({ action: 'collection-save', name: '临时集合', memberIds: [idA] }, 'temp collection')
    ).collection
    const body = await postOk({ action: 'collection-delete', id: temp.id }, 'collection-delete')
    eq(body.deleted, temp.id, 'deleted id')
    const state = await getBody()
    ok(!state.collections.some((item) => item.id === temp.id), 'collection still present')
    ok(state.entries.some((item) => item.id === idA), 'collection member entry was deleted')
  })

  await test('emptied collection is not auto-removed (empty collections persist)', async () => {
    await postOk({ action: 'collection-members', id: coll2.id, remove: [idA, idB] }, 'empty collection')
    const state = await getBody()
    const stored = state.collections.find((item) => item.id === coll2.id)
    ok(stored, 'empty collection disappeared')
    eq(stored.memberIds, [], 'memberIds should be empty')
  })

  let project2 = null
  await test('project-save creates a project', async () => {
    const body = await postOk(
      { action: 'project-save', name: '项目二', description: '第二个项目', color: 'teal' },
      'project-save'
    )
    project2 = body.project
    eq(body.created, true, 'created')
    ok(project2.id.startsWith('prj_'), 'project id prefix')
    eq(project2.name, '项目二', 'name')
    eq(project2.description, '第二个项目', 'description')
    eq(project2.color, 'teal', 'color')
  })

  await test('project-delete reassigns its entries/collections to a surviving project', async () => {
    const doomed = (await postOk({ action: 'project-save', name: '待删项目' }, 'project-save doomed')).project
    const entry = (
      await postOk(
        { action: 'entry-save', title: '项目三记忆', content: '属于待删项目的记忆。', projectId: doomed.id },
        'project entry'
      )
    ).entry
    const collection = (
      await postOk(
        { action: 'collection-save', name: '项目三集合', projectId: doomed.id },
        'project collection'
      )
    ).collection
    const body = await postOk({ action: 'project-delete', id: doomed.id }, 'project-delete')
    eq(body.deleted, doomed.id, 'deleted id')
    eq(body.movedTo, 'prj_default', 'movedTo')
    const state = await getBody()
    ok(!state.projects.some((item) => item.id === doomed.id), 'deleted project still present')
    eq(state.entries.find((item) => item.id === entry.id).projectId, 'prj_default', 'entry projectId')
    eq(state.collections.find((item) => item.id === collection.id).projectId, 'prj_default', 'collection projectId')
  })

  await test('suggest.entry returns a full suggestion object', async () => {
    const res = await api.post({
      action: 'suggest.entry',
      content: '战斗技能冷却决定：每日技能释放上限 5 次，最终采用 8 秒冷却。'
    })
    eq(res.status, 200, 'HTTP status')
    const suggestion = res.json.suggestion
    ok(suggestion && typeof suggestion === 'object', 'suggestion missing')
    typeOf(suggestion.title, 'string', 'suggestion.title')
    ok(suggestion.title.length > 0, 'suggestion.title empty')
    ok(ENTRY_TYPES.includes(suggestion.type), 'suggestion.type, got ' + show(suggestion.type))
    isArray(suggestion.domains, 'suggestion.domains')
    ok(suggestion.domains.includes('combat'), 'domains should include combat, got ' + show(suggestion.domains))
    isArray(suggestion.tags, 'suggestion.tags')
    const projectIds = (await getBody()).projects.map((item) => item.id)
    ok(projectIds.includes(suggestion.projectId), 'suggestion.projectId not a real project: ' + show(suggestion.projectId))
    typeOf(suggestion.confidence, 'number', 'suggestion.confidence')
    ok(suggestion.confidence >= 0.2 && suggestion.confidence <= 0.95, 'confidence range, got ' + suggestion.confidence)
  })

  await test('suggest.relations returns candidates with a relationType', async () => {
    const res = await api.post({ action: 'suggest.relations', id: idA })
    eq(res.status, 200, 'HTTP status')
    isArray(res.json.suggestions, 'suggestions')
    ok(res.json.suggestions.length >= 1, 'expected at least one candidate')
    const candidate = res.json.suggestions[0]
    ok(RELATION_TYPES.includes(candidate.relationType), 'candidate.relationType, got ' + show(candidate.relationType))
    notEq(candidate.targetMemoryId, idA, 'candidate target is self')
    typeOf(candidate.confidence, 'number', 'candidate.confidence')
  })

  await test('suggest.collections returns proposal objects with reasons', async () => {
    for (let index = 1; index <= 3; index += 1) {
      await postOk(
        {
          action: 'entry-save',
          title: '经济口径 ' + index,
          content: '金币产出口径第 ' + index + ' 条。',
          domains: ['economy'],
          tags: ['产出']
        },
        'economy entry ' + index
      )
    }
    const res = await api.post({ action: 'suggest.collections' })
    eq(res.status, 200, 'HTTP status')
    isArray(res.json.suggestions, 'suggestions')
    ok(res.json.suggestions.length >= 1, 'expected at least one collection proposal')
    const proposal = res.json.suggestions[0]
    typeOf(proposal.name, 'string', 'proposal.name')
    typeOf(proposal.description, 'string', 'proposal.description')
    isArray(proposal.memberIds, 'proposal.memberIds')
    ok(proposal.memberIds.length >= 3, 'proposal.memberIds too small')
    isArray(proposal.reasons, 'proposal.reasons')
    ok(proposal.reasons.length >= 1, 'proposal.reasons empty')
  })

  await test('unknown action → HTTP 400 { ok:false, error:{code,message} }', async () => {
    const res = await api.post({ action: 'definitely-not-an-action' })
    eq(res.status, 400, 'HTTP status')
    eq(res.json.ok, false, 'ok')
    typeOf(res.json.error, 'object', 'error')
    eq(res.json.error.code, 'unknown-action', 'error code')
    typeOf(res.json.error.message, 'string', 'error message')
  })

  await test('missing id → HTTP 404 entry-not-found', async () => {
    const res = await api.post({ action: 'entry-status', status: 'active' })
    eq(res.status, 404, 'HTTP status')
    eq(res.json.ok, false, 'ok')
    eq(res.json.error.code, 'entry-not-found', 'error code')
  })

  await test('non-JSON content-type → HTTP 415', async () => {
    const res = await api.post('{}', { headers: { 'content-type': 'text/plain' } })
    eq(res.status, 415, 'HTTP status')
    eq(res.json.ok, false, 'ok')
    eq(res.json.error.code, 'unsupported-media-type', 'error code')
  })

  await test('invalid JSON body → HTTP 400 invalid-json', async () => {
    const res = await api.post('{not json', { headers: { 'content-type': 'application/json' } })
    eq(res.status, 400, 'HTTP status')
    eq(res.json.ok, false, 'ok')
    eq(res.json.error.code, 'invalid-json', 'error code')
  })

  await test('non-loopback Origin → HTTP 403 forbidden-origin', async () => {
    const res = await api.get({ headers: { origin: 'https://evil.com' } })
    eq(res.status, 403, 'HTTP status')
    eq(res.json.ok, false, 'ok')
    eq(res.json.error.code, 'forbidden-origin', 'error code')
  })

  const tool = (name) => {
    const def = toolDefs.find((item) => item.name === name)
    ok(def, 'tool not registered: ' + name)
    return def
  }

  await test('design_memory_search by id returns full entry with id=', async () => {
    const text = await tool('design_memory_search').execute({ id: idA })
    typeOf(text, 'string', 'search result')
    includes(text, '技能冷却规则', 'full entry text')
    includes(text, 'id=' + idA, 'full entry text')
  })

  await test('design_memory_search by query returns the entry title', async () => {
    const text = await tool('design_memory_search').execute({ query: '技能冷却' })
    typeOf(text, 'string', 'search result')
    includes(text, '技能冷却规则', 'search list text')
  })

  await test('[BUG] design_memory_search list output omits ids (cannot follow "用 id 读取单条全文")', async () => {
    const text = await tool('design_memory_search').execute({ query: '技能冷却' })
    ok(text.includes('id='), 'search list output must expose entry ids; got: ' + brief(text, 500))
  })

  await test('design_memory_write rejects unknown actions with a thrown Error', async () => {
    let thrown = null
    try {
      await tool('design_memory_write').execute({ action: 'bogus-write-action' })
    } catch (error) {
      thrown = error
    }
    ok(thrown instanceof Error, 'expected the tool to throw')
    includes(thrown.message, '未知操作', 'thrown message')
  })

  await test('design_memory_write entry-save persists through the tool', async () => {
    const text = await tool('design_memory_write').execute({
      action: 'entry-save',
      title: '工具写入记忆',
      content: '通过工具创建的记忆内容。'
    })
    includes(text, '已保存记忆', 'tool result')
    includes(text, 'id=', 'tool result')
    const state = await getBody()
    ok(state.entries.some((item) => item.title === '工具写入记忆'), 'tool-created entry missing from store')
  })

  await test('design_memory_suggest returns suggestion text', async () => {
    const text = await tool('design_memory_suggest').execute({
      action: 'entry',
      text: '活动设计方案：限时赛季通行证，玩家完成任务获得奖励。'
    })
    typeOf(text, 'string', 'suggest result')
    includes(text, '建议标题', 'suggest text')
    includes(text, '置信度', 'suggest text')
    const relationsText = await tool('design_memory_suggest').execute({ action: 'relations', id: idA })
    typeOf(relationsText, 'string', 'suggest relations result')
    ok(relationsText.length > 0, 'suggest relations returned empty string')
  })

  await test('durability: on-disk JSON parses as version 5 and matches the API', async () => {
    const state = await getBody()
    const disk = JSON.parse(await readFile(storeFile, 'utf8'))
    eq(disk.version, STORE_VERSION, 'disk version')
    eq(disk.entries.length, state.entries.length, 'disk entries')
    eq(disk.relations.length, state.relations.length, 'disk relations')
    eq(disk.collections.length, state.collections.length, 'disk collections')
    ok(disk.entries.some((item) => item.id === idA), 'entry A missing from disk')
  })

  await test('entry-delete then entry-restore brings the memory back with its relations', async () => {
    const before = await getBody()
    const entry = before.entries.find((item) => item.id === idA)
    ok(entry, 'entry A missing')
    const snapshotRelations = before.relations.filter(
      (item) => item.sourceMemoryId === idA || item.targetMemoryId === idA
    )
    const snapshotCollections = before.collections
      .filter((item) => item.memberIds.includes(idA))
      .map((item) => item.id)

    await postOk({ action: 'entry-delete', id: idA }, 'entry-delete for restore')
    const gone = await getBody()
    ok(!gone.entries.some((item) => item.id === idA), 'entry A still present after delete')
    ok(
      !gone.relations.some((item) => item.sourceMemoryId === idA || item.targetMemoryId === idA),
      'relations of A survived the delete'
    )

    const restored = await postOk(
      {
        action: 'entry-restore',
        entry: entry,
        relations: snapshotRelations,
        collectionIds: snapshotCollections
      },
      'entry-restore'
    )
    eq(restored.restored, true, 'restored flag')
    eq(restored.entry.id, idA, 'restored id')
    eq(restored.entry.createdAt, entry.createdAt, 'createdAt preserved')
    eq(restored.restoredRelations.length, snapshotRelations.length, 'restored relation count')
    const after = await getBody()
    eq(after.entries.length, before.entries.length, 'entry count back to original')
    eq(after.relations.length, before.relations.length, 'relation count back to original')
  })

  await test('entry-restore refuses to duplicate an id that still exists', async () => {
    const body = await getBody()
    const entry = body.entries.find((item) => item.id === idA)
    const res = await api.post({ action: 'entry-restore', entry: entry })
    eq(res.status, 409, 'status for duplicate restore')
  })

  await test('collection-delete then collection-restore brings the collection back', async () => {
    const before = await getBody()
    const collection = before.collections.find((item) => item.name === '冷却与伤害')
    ok(collection, 'collection missing')
    await postOk({ action: 'collection-delete', id: collection.id }, 'collection-delete for restore')
    ok(!(await getBody()).collections.some((item) => item.id === collection.id), 'collection still present')
    const restored = await postOk({ action: 'collection-restore', collection: collection }, 'collection-restore')
    eq(restored.restored, true, 'restored flag')
    eq(restored.collection.id, collection.id, 'collection id kept')
    eq(restored.collection.memberIds, collection.memberIds, 'members kept')
  })

  await test('ai.analyze returns organize suggestions with reasons and segments', async () => {
    const res = await api.post({ action: 'ai.analyze', analysis: 'organize', id: idB })
    eq(res.status, 200, 'status')
    const result = res.json.result
    eq(result.kind, 'organize', 'kind')
    typeOf(result.title, 'string', 'title')
    typeOf(result.typeReason, 'string', 'typeReason')
    typeOf(result.domainReason, 'string', 'domainReason')
    isArray(result.segments, 'segments')
    isArray(result.relations, 'relations')
    isArray(result.collections, 'collections')
  })

  await test('ai.analyze covers similar / relations / conflicts / impact', async () => {
    for (const analysis of ['similar', 'relations', 'conflicts', 'impact']) {
      const res = await api.post({ action: 'ai.analyze', analysis: analysis, id: idA })
      eq(res.status, 200, analysis + ' status')
      eq(res.json.result.kind, analysis, analysis + ' kind')
    }
  })

  await test('ai.analyze summary works for a collection and for the whole project', async () => {
    const collection = (await getBody()).collections[0]
    const byCollection = await api.post({
      action: 'ai.analyze',
      analysis: 'summary',
      collectionId: collection.id
    })
    eq(byCollection.status, 200, 'collection summary status')
    eq(byCollection.json.result.kind, 'summary', 'collection summary kind')
    ok(byCollection.json.result.memberIds.length > 0, 'summary memberIds empty')
    const byProject = await api.post({ action: 'ai.analyze', analysis: 'summary' })
    eq(byProject.status, 200, 'project summary status')
    ok(byProject.json.result.overview.length > 0, 'summary overview empty')
  })

  await test('ai.analyze rejects unknown analysis types', async () => {
    const res = await api.post({ action: 'ai.analyze', analysis: 'nope', id: idA })
    eq(res.status, 400, 'status for unknown analysis')
  })

  await test('design_memory_analyze tool returns readable text', async () => {
    const text = await tool('design_memory_analyze').execute({ action: 'organize', id: idB })
    typeOf(text, 'string', 'analyze tool result')
    includes(text, '整理建议', 'analyze text')
  })
  await test('durability: a .bak snapshot exists after repeated saves', async () => {
    const bakFile = storeFile + '.bak'
    ok(existsSync(bakFile), '.bak file missing after repeated saves')
    const bak = JSON.parse(await readFile(bakFile, 'utf8'))
    eq(bak.version, STORE_VERSION, '.bak version')
    ok(Array.isArray(bak.entries), '.bak entries')
  })
}

// ---------------------------------------------------------------------------
// suite: legacy v1 migration
// ---------------------------------------------------------------------------

async function runLegacySuite() {
  const home = await makeHome('legacy')
  const storeDir = path.join(home, 'design-memory')
  const storeFile = path.join(storeDir, 'memories.json')
  await mkdir(storeDir, { recursive: true })

  const stamp = '2024-01-01T00:00:00.000Z'
  const fixture = {
    version: 1,
    projects: [{ id: 'prj_old', name: '老项目', description: 'v1 数据', color: 'amber', createdAt: stamp }],
    entries: [
      {
        id: 'mem_a',
        title: '系统规则甲',
        body: '甲正文',
        category: 'system',
        status: 'confirmed',
        tags: ['规则'],
        createdAt: stamp,
        updatedAt: '2024-01-02T00:00:00.000Z',
        links: [{ to: 'mem_b', label: '说明乙' }]
      },
      {
        id: 'mem_b',
        title: '数值乙',
        summary: '乙摘要',
        category: 'numbers',
        status: 'draft',
        createdAt: stamp,
        updatedAt: stamp
      },
      {
        id: 'mem_c',
        title: '流程丙',
        content: '丙正文',
        category: 'workflow',
        status: 'deprecated',
        createdAt: stamp,
        updatedAt: stamp
      },
      {
        id: 'mem_d',
        title: '其他丁',
        content: '丁正文',
        category: 'other',
        status: 'draft',
        createdAt: stamp,
        updatedAt: stamp
      }
    ],
    regions: [{ id: 'reg_1', name: '老集合', note: '区域说明', color: 'violet', memberIds: ['mem_a', 'mem_b'] }]
  }
  await writeFile(storeFile, JSON.stringify(fixture, null, 2), 'utf8')

  const { snapshot } = await boot(home)
  const byId = new Map(snapshot.entries.map((entry) => [entry.id, entry]))

  await test('legacy migration: categories map to entry types', () => {
    eq(snapshot.entries.length, 4, 'entry count')
    eq(byId.get('mem_a').type, 'rule', 'system → rule')
    eq(byId.get('mem_b').type, 'metric', 'numbers → metric')
    eq(byId.get('mem_c').type, 'process', 'workflow → process')
    eq(byId.get('mem_d').type, 'reference', 'other → reference')
  })

  await test('legacy migration: statuses map (confirmed → active)', () => {
    eq(byId.get('mem_a').status, 'active', 'confirmed → active')
    eq(byId.get('mem_b').status, 'draft', 'draft stays draft')
    eq(byId.get('mem_c').status, 'deprecated', 'deprecated stays deprecated')
    eq(byId.get('mem_d').status, 'draft', 'draft stays draft')
    eq(byId.get('mem_b').summary, '乙摘要', 'legacy summary preserved')
    eq(byId.get('mem_a').content, '甲正文', 'legacy body preserved')
  })

  await test('legacy migration: links become confirmed references relations with label as description', () => {
    eq(snapshot.relations.length, 1, 'relation count')
    const relation = snapshot.relations[0]
    eq(relation.sourceMemoryId, 'mem_a', 'source')
    eq(relation.targetMemoryId, 'mem_b', 'target')
    eq(relation.relationType, 'references', 'relationType')
    eq(relation.status, 'confirmed', 'status')
    eq(relation.description, '说明乙', 'description from link.label')
  })

  await test('legacy migration: regions become confirmed manual collections', () => {
    eq(snapshot.collections.length, 1, 'collection count')
    const collection = snapshot.collections[0]
    eq(collection.id, 'reg_1', 'id')
    eq(collection.name, '老集合', 'name')
    eq(collection.description, '区域说明', 'description from region.note')
    eq(collection.status, 'confirmed', 'status')
    eq(collection.source, 'manual', 'source')
    eq(collection.color, 'violet', 'color')
    eq(collection.memberIds, ['mem_a', 'mem_b'], 'memberIds')
  })

  await test('legacy migration: file rewritten as version 5', async () => {
    const disk = JSON.parse(await readFile(storeFile, 'utf8'))
    eq(disk.version, STORE_VERSION, 'on-disk version')
    eq(disk.entries.length, 4, 'on-disk entries')
    eq(disk.relations.length, 1, 'on-disk relations')
    eq(disk.collections.length, 1, 'on-disk collections')
    const projectIds = new Set(disk.projects.map((item) => item.id))
    ok(projectIds.has('prj_old'), 'legacy project lost')
    for (const entry of disk.entries) {
      ok(projectIds.has(entry.projectId), 'entry ' + entry.id + ' points at unknown project ' + entry.projectId)
    }
    ok(existsSync(storeFile + '.bak'), 'migration should snapshot the v1 file as .bak')
  })
}

// ---------------------------------------------------------------------------
// suite: v2.1 evolution (versions / evidence / protection / proposals / recall)
// ---------------------------------------------------------------------------

async function runEvolutionSuite() {
  const home = await makeHome('evolve')
  const { api } = await boot(home)

  const getBody = async () => {
    const res = await api.get()
    eq(res.status, 200, 'GET status')
    return res.json
  }

  const postOk = async (body, what) => {
    const res = await api.post(body)
    if (res.status !== 200 || !res.json || res.json.ok !== true) {
      fail((what || 'POST') + ' failed: HTTP ' + res.status + ' ' + brief(res.text, 400))
    }
    return res.json
  }

  const postFail = async (body, status, code, what) => {
    const res = await api.post(body)
    const label = what || 'POST'
    eq(res.status, status, label + ' status')
    ok(res.json && res.json.ok === false, label + ' should fail with ok:false')
    if (code) eq(res.json.error && res.json.error.code, code, label + ' error code')
    return res.json
  }

  const byId = async (id) => {
    const body = await getBody()
    return body.entries.find((item) => item.id === id)
  }

  let habitId = ''
  let conventionId = ''
  let numericId = ''
  let protectedMemoryId = ''

  await test('entry-save fills lifecycle fields, the first version and evidence', async () => {
    const body = await postOk({
      action: 'entry-save',
      title: '公告语气偏好',
      content: '公告语气要短句、平实，不用官腔，也不要堆感叹号。',
      type: 'habit',
      status: 'active',
      scope: 'global',
      confidence: 0.9,
      importance: 0.8,
      domains: ['operation'],
      tags: ['公告', '语气'],
      source: { kind: 'conversation', label: '和用户在 11 月确认过' }
    })
    const entry = body.entry
    habitId = entry.id
    eq(entry.scope, 'global', 'scope')
    eq(entry.status, 'active', 'status')
    eq(entry.protectionLevel, 'confirmed', 'active memory is confirmed by default')
    eq(entry.confidence, 0.9, 'confidence')
    eq(entry.currentVersion, 1, 'currentVersion')
    eq(entry.versions.length, 1, 'versions')
    eq(entry.versions[0].changeType, 'create', 'first version changeType')
    eq(entry.evidence.length, 1, 'source label becomes an evidence row')
    eq(entry.evidence[0].content.includes('确认过'), true, 'evidence keeps the source text')
  })

  await test('entry-save creates a project-scoped convention memory', async () => {
    const body = await postOk({
      action: 'entry-save',
      title: '活动规则术语规范',
      content: '活动规则里统一写「挑战券消耗」，不要写「挑战次数」。',
      type: 'convention',
      status: 'active',
      scope: 'project',
      domains: ['operation'],
      tags: ['公告', '术语'],
      source: { kind: 'conversation', label: '术语评审' }
    })
    conventionId = body.entry.id
    eq(body.entry.scope, 'project', 'scope')
    eq(body.entry.tags.includes('术语'), true, 'tags')
  })

  await test('entry-save creates a numeric rule used by the conflict path', async () => {
    const body = await postOk({
      action: 'entry-save',
      title: '金币产出规则',
      content: '金币产出每秒 12 个，单局上限 600。',
      type: 'rule',
      status: 'active',
      domains: ['economy'],
      tags: ['数值', '金币']
    })
    numericId = body.entry.id
    eq(body.entry.type, 'rule', 'type')
  })

  await test('entry-protect locks a memory and records a protect version', async () => {
    const before = await byId(habitId)
    const body = await postOk({ action: 'entry-protect', id: habitId, level: 'protected' }, 'protect')
    eq(body.entry.protectionLevel, 'protected', 'protectionLevel')
    eq(body.entry.versions.length, before.versions.length + 1, 'protect should append a version')
    eq(body.entry.versions[body.entry.versions.length - 1].changeType, 'protect', 'changeType')
  })

  await test('a protected memory refuses silent content edits with 409 protected', async () => {
    await postFail(
      { action: 'entry-save', id: habitId, content: '公告语气可以随便写。' },
      409,
      'protected',
      'protected edit'
    )
    const entry = await byId(habitId)
    eq(entry.content.includes('短句'), true, 'content must stay untouched')
  })

  await test('force edit applies and appends a version with a reason', async () => {
    const before = await byId(habitId)
    const body = await postOk({
      action: 'entry-save',
      id: habitId,
      content: '公告语气要短句、平实、对玩家友好，不用官腔。',
      force: true,
      changeType: 'correct',
      note: '用户明确要求改语气'
    })
    eq(body.entry.versions.length, before.versions.length + 1, 'force edit appends a version')
    const version = body.entry.versions[body.entry.versions.length - 1]
    eq(version.changeType, 'correct', 'changeType')
    eq(version.changeReason, '用户明确要求改语气', 'changeReason')
    eq(version.content.includes('对玩家友好'), true, 'version snapshots the new content')
  })

  await test('entry-version-restore rolls back and records a restore version', async () => {
    const entry = await byId(habitId)
    const first = entry.versions[0]
    const body = await postOk({ action: 'entry-version-restore', id: habitId, versionId: first.id, force: true })
    eq(body.entry.content, first.content, 'content rolled back')
    const last = body.entry.versions[body.entry.versions.length - 1]
    eq(last.changeType, 'restore', 'restore version changeType')
    eq(last.version, body.entry.currentVersion, 'currentVersion follows versions length')
  })

  await test('evidence-add appends an evidence row without touching content', async () => {
    const before = await byId(habitId)
    const body = await postOk({
      action: 'evidence-add',
      id: habitId,
      evidence: '11 月 20 日又说了一次不要官腔',
      evidenceType: 'confirmation',
      sourceConversation: 'conv-42'
    })
    eq(body.entry.evidence.length, before.evidence.length + 1, 'evidence grows')
    eq(body.entry.content, before.content, 'content untouched')
    eq(body.entry.evidence[body.entry.evidence.length - 1].sourceConversation, 'conv-42', 'sourceConversation')
  })

  await test('memory-observe creates pending candidates instead of dumping chat logs', async () => {
    const body = await postOk(
      {
        action: 'memory-observe',
        text: '每周三下午三点开项目同步会，会议纪要发到项目群。\n\n需求评审前一天要把原型发给主策。',
        conversationId: 'conv-obs'
      },
      'observe'
    )
    ok(body.created.length >= 1, 'observe should create at least one candidate')
    const created = body.created[0]
    const entry = await byId(created.id)
    ok(entry, 'candidate should exist in the store')
    eq(entry.status, 'pending', 'observations land as pending candidates')
    eq(entry.protectionLevel, 'normal', 'candidates are never protected automatically')
    eq(entry.source.kind, 'ai', 'source kind')
    ok(entry.evidence.length >= 1, 'candidate keeps its evidence')
    eq(entry.evidence[0].sourceConversation, 'conv-obs', 'evidence points at the conversation')
  })

  await test('memory-observe turns protected contradictions into proposals, not edits', async () => {
    const created = await postOk({
      action: 'entry-save',
      title: '秘境战斗节奏约定',
      content: '秘境战斗节奏：每波之间必须留 3 秒喘息，禁止连续刷怪。',
      type: 'convention',
      status: 'active',
      scope: 'project',
      domains: ['combat'],
      tags: ['秘境', '战斗节奏']
    })
    const protectedId = created.entry.id
    await postOk({ action: 'entry-protect', id: protectedId, level: 'protected' }, 'protect the pacing rule')
    const before = await byId(protectedId)

    const body = await postOk(
      {
        action: 'memory-observe',
        text: '秘境战斗节奏改成每波之间只留 1 秒，连续刷怪更刺激。',
        conversationId: 'conv-conflict'
      },
      'observe over a protected memory'
    )
    ok(body.proposed.length >= 1, 'protected memory change must become a proposal')
    const entry = await byId(protectedId)
    eq(entry.content, before.content, 'protected content must not change')
    const pending = body.proposals.filter((item) => item.memoryId === protectedId && item.status === 'pending')
    eq(pending.length >= 1, true, 'a pending proposal should exist')
    protectedMemoryId = protectedId
  })

  await test('proposal-decide accept applies the proposed content and keeps history', async () => {
    const snapshot = await getBody()
    const proposal = snapshot.proposals.find(
      (item) => item.memoryId === protectedMemoryId && item.status === 'pending'
    )
    ok(proposal, 'pending proposal missing')
    const before = snapshot.entries.find((item) => item.id === protectedMemoryId)
    const body = await postOk({ action: 'proposal-decide', proposalId: proposal.id, decision: 'accept' })
    eq(body.entry.content, proposal.proposedContent, 'accepted content applied')
    eq(body.entry.versions.length, before.versions.length + 1, 'accepted proposal appends a version')
    const decided = body.proposals.find((item) => item.id === proposal.id)
    eq(decided.status, 'accepted', 'proposal status')
  })

  await test('memory-recall ranks protected project rules first and records a real call', async () => {
    const body = await postOk({ action: 'memory-recall', task: '写活动公告，注意语气和术语' }, 'recall')
    ok(body.items && body.items.length >= 1, 'recall should serve at least one memory')
    for (const item of body.items) {
      ok(Number.isFinite(item.tier), 'every served item carries a tier')
    }
    const tiers = body.items.map((item) => item.tier)
    const sorted = tiers.slice().sort((left, right) => left - right)
    eq(tiers, sorted, 'recall items are ordered by tier')
    ok(typeof body.logged === 'string' && body.logged, 'recall should be logged')
    const recallLog = body.recalls[0]
    ok(recallLog && Array.isArray(recallLog.ids), 'recall log should keep the served ids')
    const served = body.items[0]
    const entry = await byId(served.entryId)
    ok(entry.usageCount >= 1, 'served memory counts a real usage')
    ok(entry.lastUsedAt, 'served memory remembers when it was used')
  })

  await test('memory-merge folds duplicates and re-points relations', async () => {
    const first = await postOk({
      action: 'entry-save',
      title: '公告长度',
      content: '公告标题控制在 12 个字以内。',
      type: 'rule',
      status: 'active',
      tags: ['公告']
    })
    const second = await postOk({
      action: 'entry-save',
      title: '公告标题长度限制',
      content: '标题超过 12 个字会换行，尽量压短。',
      type: 'rule',
      status: 'active',
      tags: ['公告']
    })
    await postOk({
      action: 'relation-create',
      sourceMemoryId: first.entry.id,
      targetMemoryId: conventionId,
      relationType: 'references'
    })
    const body = await postOk({ action: 'memory-merge', ids: [first.entry.id, second.entry.id], targetId: first.entry.id })
    eq(body.merged.includes(second.entry.id), true, 'merged ids reported')
    eq(body.entry.content.includes('标题超过 12 个字'), true, 'merged content keeps both blocks')
    const last = body.entry.versions[body.entry.versions.length - 1]
    eq(last.changeType, 'merge', 'merge version changeType')
    const snapshot = await getBody()
    const stillThere = snapshot.entries.some((item) => item.id === second.entry.id)
    eq(stillThere, false, 'merged memory removed')
    const relation = snapshot.relations.find(
      (item) => item.sourceMemoryId === first.entry.id && item.targetMemoryId === conventionId
    )
    ok(relation, 'relation should survive the merge')
  })

  await test('memory-tidy reports pending work without mutating the store', async () => {
    const before = await getBody()
    const body = await postOk({ action: 'memory-tidy' }, 'tidy')
    ok(body.report && Array.isArray(body.report.duplicates), 'tidy should return a report')
    ok(Array.isArray(body.report.pendingProposals), 'report.pendingProposals')
    ok(Array.isArray(body.report.orphans), 'report.orphans')
    ok(Number.isFinite(body.report.protectedCount), 'report.protectedCount')
    const after = await getBody()
    eq(after.entries.length, before.entries.length, 'tidy must not change the memory count')
  })
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  ok(existsSync(PLUGIN_PATH), 'plugin not found at ' + PLUGIN_PATH)
  await runFreshSuite()
  await runLegacySuite()
  await runEvolutionSuite()
  await runWorkspaceSuite()

  const total = passed + failed
  console.log('')
  console.log('SUMMARY  ' + total + ' tests · ' + passed + ' passed · ' + failed + ' failed')
  if (failed) {
    console.log('FAILED:')
    for (const item of failedTests) console.log('  - ' + item.name)
    process.exitCode = 1
  }
}

main()
  .catch((error) => {
    console.error('SUITE CRASH: ' + (error && error.stack ? error.stack : error))
    process.exitCode = 2
  })
  .finally(async () => {
    if (process.env.ZHIWEI_KEEP_TEMP) return
    for (const root of tempRoots) {
      await rm(root, { recursive: true, force: true }).catch(() => {})
    }
  })

// ---------------------------------------------------------------------------
// 2.2.0 workspace suite: frames, layout, project order, import, settings, model
// ---------------------------------------------------------------------------

async function runWorkspaceSuite() {
  const dshHome = await makeHome('workspace')
  const app = await boot(dshHome)
  const api = app.api

  await api.post({ action: 'entry-save', title: '第一条', content: '战斗数值：暴击率 12%。', status: 'active' })
  await api.post({ action: 'entry-save', title: '第二条', content: '战斗数值：暴击率 15%。', status: 'active' })
  let state = (await api.get()).json
  const idA = state.entries[0].id
  const idB = state.entries[1].id

  const frame = await api.post({ action: 'frame-save', name: '战斗框', memberIds: [idA, idB], color: 'teal' })
  check(frame.json.ok === true, 'frame-save creates a frame')
  check(frame.json.frame.memberIds.length === 2, 'frame keeps its members')
  state = (await api.get()).json
  check(state.frames.length === 1, 'frames are serialized to the client')

  const renamed = await api.post({ action: 'frame-save', id: state.frames[0].id, name: '战斗框（改）' })
  check(renamed.json.frame.name === '战斗框（改）', 'frame-save can rename an existing frame')

  const removed = await api.post({ action: 'frame-delete', id: state.frames[0].id })
  check(removed.json.ok === true, 'frame-delete removes the frame')
  state = (await api.get()).json
  check(state.frames.length === 0, 'deleted frame is gone')

  const layout = await api.post({ action: 'layout-save', positions: { [idA]: { x: 120, y: 80 }, [idB]: { x: -40, y: 33 }, ghost: { x: 1, y: 2 } } })
  check(layout.json.ok === true, 'layout-save accepts positions')
  state = (await api.get()).json
  check(Boolean(state.layout.positions[idA]), 'saved layout keeps a real entry')
  check(!state.layout.positions.ghost, 'layout drops positions for unknown entries')

  const cleared = await api.post({ action: 'layout-clear' })
  check(cleared.json.ok === true, 'layout-clear resets the layout')
  state = (await api.get()).json
  check(Object.keys(state.layout.positions).length === 0, 'layout is empty after clearing')

  const second = await api.post({ action: 'project-save', name: '第二项目' })
  const third = await api.post({ action: 'project-save', name: '第三项目' })
  const ids = [third.json.project.id, second.json.project.id, state.projects[0].id]
  const reordered = await api.post({ action: 'project-reorder', ids: ids })
  check(reordered.json.ok === true, 'project-reorder accepts an id list')
  state = (await api.get()).json
  check(state.projects[0].id === ids[0], 'project order is persisted')

  const exported = await api.post({ action: 'export' })
  check(exported.json.data && exported.json.data.entries.length === 2, 'export returns a full snapshot')
  check(Array.isArray(exported.json.data.frames), 'export includes frames')

  const merged = await api.post({ action: 'import', mode: 'merge', data: { entries: [{ id: 'mem_imported', title: '导入的', content: '导入内容', type: 'rule' }], projects: [], collections: [] } })
  check(merged.json.ok === true, 'import merge works')
  state = (await api.get()).json
  check(state.entries.some((entry) => entry.id === 'mem_imported'), 'import merge adds missing memories')

  const info = await api.post({ action: 'settings.get' })
  check(Boolean(info.json.settings && info.json.settings.storagePath), 'settings.get reveals the storage path')
  check(info.json.settings.model && info.json.settings.model.enabled === false, 'settings.get exposes the model route')

  const models = await api.post({ action: 'models.list' })
  check(models.json.ok === true, 'models.list answers without throwing')
  check(typeof models.json.available === 'boolean', 'models.list reports availability')

  const picked = await api.post({ action: 'settings.model', provider: 'demo', model: 'demo-1', enabled: true })
  check(picked.json.model.enabled === true, 'settings.model stores the choice')
  check(picked.json.model.provider === 'demo', 'settings.model keeps the provider')

  console.log('WORKSPACE ' + workspaceChecks + ' checks · 0 failed')
  rm(dshHome, { recursive: true, force: true })
}
