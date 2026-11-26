#!/usr/bin/env node
/**
 * Migration guard for the real store.
 *
 * Copies the user's live v1 store (or a v1 fixture, when the live one is not
 * available) into a throwaway DSH_HOME, boots the plugin and verifies that the
 * migration preserves every memory, every manual link and every region, and
 * that the original file is backed up before it is rewritten.
 *
 * Run: node tests/migrate-live.mjs
 */

import { Readable } from 'node:stream'
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PLUGIN_PATH = path.resolve(HERE, '..', 'index.js')
const ROUTE = '/design-memory/api'
const LIVE_STORE = path.join('C:\\Users\\Administrator\\.dsh\\design-memory', 'memories.json')
const FALLBACK_STORE = path.join(HERE, 'fixture-v1.json')

const results = []
function check(ok, message) {
  results.push({ ok: Boolean(ok), message })
}

function toBuffer(chunk) {
  return Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), 'utf8')
}

function request(handler, options = {}) {
  const method = options.method || 'GET'
  const headers = { origin: 'http://127.0.0.1:10575', host: '127.0.0.1:10575' }
  let body = options.body
  if (body !== undefined) {
    body = JSON.stringify(body)
    headers['content-type'] = 'application/json'
  }
  return new Promise((resolve, reject) => {
    const chunks = []
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
        const text = Buffer.concat(chunks).toString('utf8')
        let json = null
        try {
          json = text ? JSON.parse(text) : null
        } catch {
          json = null
        }
        resolve({ status: res.statusCode, text, json })
      }
    }
    const req = new Readable({ read() {} })
    req.method = method
    req.url = ROUTE
    req.headers = headers
    if (body !== undefined) req.push(Buffer.from(body, 'utf8'))
    req.push(null)
    Promise.resolve()
      .then(() => handler(req, res))
      .catch(reject)
  })
}

async function boot(dshDir) {
  process.env.DSH_HOME = dshDir
  const mod = await import(pathToFileURL(PLUGIN_PATH).href + '?migrateLive=' + Date.now())
  let route = null
  await mod.apply({
    tools: { list: [], register(def) { this.list.push(def) } },
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
  if (!route) throw new Error('handler not registered')
  const deadline = Date.now() + 8000
  while (Date.now() < deadline) {
    const res = await request(route.handler, { method: 'GET' })
    if (res.status === 200 && res.json && res.json.ok) return { route, snapshot: res.json }
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  throw new Error('plugin did not become ready')
}

const liveExists = existsSync(LIVE_STORE)
const live = liveExists ? JSON.parse(await readFile(LIVE_STORE, 'utf8')) : null
// 这个测试要验证的是「v1 → v3 迁移不丢数据」。live store 一旦被 DSH 正式启动
// 迁移过（version 3），再拿它当源就测不到迁移路径了，因此回落到 v1 fixture。
const useLiveSource = Boolean(live) && Number(live.version || 1) < 3
let original = null
let sourceKind = ''
if (useLiveSource) {
  original = live
  sourceKind = 'live store (v1)'
} else if (existsSync(FALLBACK_STORE)) {
  original = JSON.parse(await readFile(FALLBACK_STORE, 'utf8'))
  sourceKind = 'fixture-v1.json' + (liveExists ? ' — live store already migrated to v' + (live && live.version) : '')
} else {
  original = {
    version: 1,
    entries: [
      {
        id: 'mem_fixture_a',
        category: 'system',
        title: '能量回复上限',
        summary: '能量每秒回复 2 点，上限 100',
        body: '能量每秒回复 2 点，上限 100。',
        tags: ['能量'],
        facts: [{ label: '回复速度', value: '2/s' }],
        links: [{ to: 'mem_fixture_b', label: '参考' }],
        status: 'confirmed',
        pinned: false,
        source: 'manual',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
        history: []
      },
      {
        id: 'mem_fixture_b',
        category: 'workflow',
        title: '数值验收流程',
        summary: '先自测再评审',
        body: '先自测再评审。',
        tags: ['流程'],
        facts: [],
        links: [],
        status: 'draft',
        pinned: false,
        source: 'manual',
        createdAt: '2026-01-03T00:00:00.000Z',
        updatedAt: '2026-01-04T00:00:00.000Z',
        history: []
      }
    ],
    regions: [
      {
        id: 'reg_fixture',
        name: '能量主题',
        note: '',
        color: 'violet',
        memberIds: ['mem_fixture_a'],
        createdAt: '2026-01-05T00:00:00.000Z'
      }
    ]
  }
}

const dshDir = await mkdtemp(path.join(tmpdir(), 'zhiwei-migrate-'))
const storeDir = path.join(dshDir, 'design-memory')
await mkdir(storeDir, { recursive: true })
const storeFile = path.join(storeDir, 'memories.json')
await writeFile(storeFile, JSON.stringify(original, null, 2), 'utf8')

const { route, snapshot } = await boot(dshDir)

check(snapshot.version === 4, 'store migrated to version 4 (got ' + snapshot.version + ')')
check(
  snapshot.entries.length === original.entries.length,
  'no memory lost: ' + snapshot.entries.length + ' of ' + original.entries.length
)
const originalIds = original.entries.map((entry) => entry.id).sort()
const migratedIds = snapshot.entries.map((entry) => entry.id).sort()
check(JSON.stringify(originalIds) === JSON.stringify(migratedIds), 'every original id is still present')

const links = original.entries.reduce((sum, entry) => sum + (entry.links || []).length, 0)
check(
  snapshot.relations.length >= links,
  'manual links became relations: ' + snapshot.relations.length + ' >= ' + links
)
check(
  snapshot.relations.every((relation) => typeof relation.relationType === 'string' && relation.relationType),
  'every relation carries a relation type'
)
check(
  snapshot.relations.some((relation) => relation.status === 'confirmed'),
  'legacy links are kept as confirmed relations'
)

const regions = original.regions || []
check(
  snapshot.collections.length >= regions.length,
  'regions became collections: ' + snapshot.collections.length + ' >= ' + regions.length
)
check(
  snapshot.collections.every((collection) => Array.isArray(collection.memberIds)),
  'collections carry member ids'
)

const legacyByCategory = original.entries.filter((entry) => entry.category).length
const typed = snapshot.entries.filter((entry) => entry.type).length
check(typed === snapshot.entries.length, 'every memory has a type (' + typed + '/' + snapshot.entries.length + ')')
if (legacyByCategory) {
  check(
    snapshot.entries.every((entry) => entry.type !== 'reference' || entry.category !== 'system'),
    'system category did not collapse into reference'
  )
}
check(
  snapshot.entries.filter((entry) => entry.legacy).length === snapshot.entries.length,
  'legacy metadata preserved on every migrated entry'
)

const backups = (await readdir(storeDir)).filter((name) => name.includes('.bak'))
check(backups.length >= 1, 'a .bak backup was written before rewriting: ' + backups.join(', '))
const onDisk = JSON.parse(await readFile(storeFile, 'utf8'))
check(onDisk.version === 4, 'file on disk is version 4')
if (live) {
  check(
    Number(live.version) >= 3 && Array.isArray(live.entries) && live.entries.length > 0,
    'live store is readable on disk: v' + live.version + ' · ' + (live.entries || []).length + ' memories'
  )
}

// read paths still work against migrated data
const firstId = snapshot.entries[0].id
const detail = await request(route.handler, { method: 'POST', body: { action: 'entry-status', id: firstId, status: 'active' } })
check(detail.status === 200, 'write path works after migration (status ' + detail.status + ')')
const search = await request(route.handler, { method: 'POST', body: { action: 'suggest.collections' } })
check(search.status === 200 && Array.isArray(search.json.suggestions), 'AI clustering runs on migrated data')

const failed = results.filter((item) => !item.ok)
for (const item of results) console.log((item.ok ? 'PASS  ' : 'FAIL  ') + item.message)
console.log('')
console.log(
  'SUMMARY  ' + results.length + ' checks · ' + (results.length - failed.length) + ' passed · ' + failed.length + ' failed' +
    '  (source: ' + sourceKind + ')'
)
await rm(dshDir, { recursive: true, force: true })
if (failed.length) process.exit(1)
