#!/usr/bin/env node
/**
 * 数据层性能实测：数百节点、上千条记忆时，读、搜、召回、整理、存布局各要多久。
 *
 * 只在临时 DSH_HOME 里跑，不碰线上库。写 docs/PERF.md。
 * Run: node tests/perf.mjs
 */

import { Readable } from 'node:stream'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const PLUGIN_PATH = path.join(ROOT, 'index.js')
const ROUTE = '/design-memory/api'
const OUT = path.join(ROOT, 'docs', 'PERF.md')

const NODE_COUNT = 300
const MEMORY_COUNT = 1000
const RELATION_COUNT = 300

function makeReq(method, body) {
  const req = Readable.from(body ? [Buffer.from(body)] : [])
  req.method = method
  req.url = ROUTE
  req.headers = { origin: 'http://127.0.0.1:1', host: '127.0.0.1:1', 'content-type': 'application/json' }
  return req
}

function makeRes() {
  const chunks = []
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value
    },
    end(chunk) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
      this.body = Buffer.concat(chunks).toString('utf8')
    }
  }
}

function seed() {
  const iso = '2026-11-20T10:00:00.000Z'
  const project = { id: 'prj_perf', name: '性能压测项目', color: 'blue', order: 1, createdAt: iso, updatedAt: iso }
  const nodes = []
  for (let index = 0; index < NODE_COUNT; index += 1) {
    nodes.push({
      id: 'knd_perf_' + index,
      title: '压测对象 ' + index,
      description: '第 ' + index + ' 个压测知识对象，用来量读取与渲染的数据量。',
      nodeType: index % 5 === 0 ? 'system' : index % 3 === 0 ? 'concept' : 'mechanic',
      status: 'active',
      scope: index % 10 === 0 ? 'global' : 'project',
      projectId: 'prj_perf',
      parentNodeId: '',
      tags: ['压测', '对象' + (index % 20)],
      aliases: [],
      attributes: [{ label: '序号', value: String(index) }],
      steps: [],
      sourceMemoryIds: [],
      relatedMemoryIds: [],
      versions: [{ id: 'ver_' + index, version: 1, title: '压测对象 ' + index, changeType: 'create', createdAt: iso }],
      currentVersion: 1,
      confidence: 0.7,
      importance: 0.4,
      createdAt: iso,
      updatedAt: iso
    })
  }
  const entries = []
  for (let index = 0; index < MEMORY_COUNT; index += 1) {
    entries.push({
      id: 'mem_perf_' + index,
      title: '压测记忆 ' + index + ' 掉落与数值',
      content: '第 ' + index + ' 条压测记忆：哥布林掉落铁矿石，权重 ' + (index % 100) + '，用于量取搜索与召回的时间。',
      summary: '第 ' + index + ' 条压测记忆',
      type: 'knowledge',
      status: 'active',
      scope: 'project',
      projectId: 'prj_perf',
      domains: ['combat'],
      tags: ['压测', '掉落' + (index % 30)],
      nodeIds: ['knd_perf_' + (index % NODE_COUNT)],
      source: { kind: 'manual', label: 'perf seed' },
      createdAt: iso,
      updatedAt: iso,
      versions: [{ id: 'ever_' + index, version: 1, title: '压测记忆 ' + index, changeType: 'create', createdAt: iso }],
      currentVersion: 1,
      evidence: [{ id: 'ev_' + index, type: 'statement', content: '压测造数', createdAt: iso }],
      confidence: 0.7,
      importance: 0.4,
      protection: 'normal'
    })
  }
  const relations = []
  for (let index = 0; index < RELATION_COUNT; index += 1) {
    relations.push({
      id: 'rel_perf_' + index,
      sourceType: 'node',
      sourceId: 'knd_perf_' + index,
      targetType: 'node',
      targetId: 'knd_perf_' + ((index + 1) % NODE_COUNT),
      relationType: 'depends_on',
      status: 'confirmed',
      description: '压测关系 ' + index,
      source: { kind: 'manual', label: 'perf seed' },
      confidence: 0.7,
      createdAt: iso,
      updatedAt: iso
    })
  }
  const positions = {}
  for (let index = 0; index < NODE_COUNT; index += 1) {
    positions['knd_perf_' + index] = { x: (index % 30) * 220, y: Math.floor(index / 30) * 160 }
  }
  return {
    version: 6,
    projects: [project],
    entries,
    nodes,
    relations,
    collections: [],
    views: [],
    layout: { positions, hidden: [], updatedAt: iso },
    proposals: [],
    recalls: []
  }
}

async function main() {
  const temp = await mkdtemp(path.join(tmpdir(), 'zhiwei-perf-'))
  await mkdir(path.join(temp, 'design-memory'), { recursive: true })
  process.env.DSH_HOME = temp
  const storePath = path.join(temp, 'design-memory', 'memories.json')
  await writeFile(storePath, JSON.stringify(seed()), 'utf8')

  const mod = await import(pathToFileURL(PLUGIN_PATH).href + '?perf=' + Date.now())
  let handler = null
  mod.apply({
    tools: { register() {} },
    effect(run) {
      run()
    },
    inject(services, callback) {
      if (!Array.isArray(services)) return
      if (services.includes('webServer')) {
        callback({ effect(run) { run() }, webServer: { register(def) { handler = def.handler } } })
      }
    }
  })
  if (!handler) throw new Error('route was not registered')

  const get = async () => {
    const res = makeRes()
    await handler(makeReq('GET'), res)
    return res.body
  }
  const post = async (body) => {
    const res = makeRes()
    await handler(makeReq('POST', JSON.stringify(body)), res)
    return { status: res.statusCode, body: res.body }
  }

  const rows = []
  const measure = async (label, expected, run) => {
    const started = process.hrtime.bigint()
    const output = await run()
    const ms = Number(process.hrtime.bigint() - started) / 1e6
    rows.push({ label, ms, limit: expected })
    console.log((ms <= expected ? 'OK   ' : 'SLOW ') + label + ' ' + ms.toFixed(1) + 'ms (limit ' + expected + 'ms)')
    return output
  }

  // 首次读：包含加载、迁移与规范化
  const firstBody = await measure('首次读取整库（加载 + 规范化）', 800, get)
  const state = JSON.parse(firstBody)
  const nodeCount = (state.nodes || []).length
  const memoryCount = (state.entries || []).length

  await measure('再次读取整库', 200, get)
  await measure('搜索「掉落」', 150, () => post({ action: 'search', query: '掉落' }))
  await measure('按任务召回（10 条）', 250, () => post({ action: 'memory-recall', task: '哥布林掉落掉落权重', projectId: 'prj_perf', limit: 10 }))
  await measure('整理中心报告', 300, () => post({ action: 'memory-tidy' }))
  await measure('按记忆区检索（无框，走全库）', 200, () => post({ action: 'search', query: '压测', projectId: 'prj_perf' }))

  const layout = {}
  for (let index = 0; index < NODE_COUNT; index += 1) {
    layout['knd_perf_' + index] = { x: (index % 30) * 220 + 1, y: Math.floor(index / 30) * 160 }
  }
  await measure('保存 ' + NODE_COUNT + ' 个节点的布局', 400, () => post({ action: 'layout-save', positions: layout }))

  const passed = rows.filter((row) => row.ms <= row.limit).length
  const slow = rows.filter((row) => row.ms > row.limit)

  const lines = []
  lines.push('# 数据层性能实测')
  lines.push('')
  lines.push('> 由 tests/perf.mjs 在临时 DSH_HOME 里生成 ' + nodeCount + ' 个知识对象、' + memoryCount + ' 条记忆、' + RELATION_COUNT + ' 条关系的库，然后逐个量接口耗时。只覆盖数据层与接口层，**不代表浏览器里的帧率与绘制耗时**。')
  lines.push('')
  lines.push('## 结果')
  lines.push('')
  lines.push('| 场景 | 耗时 | 预算 | 结果 |')
  lines.push('| --- | --- | --- | --- |')
  for (const row of rows) {
    lines.push('| ' + row.label + ' | ' + row.ms.toFixed(1) + ' ms | ' + row.limit + ' ms | ' + (row.ms <= row.limit ? '达标' : '超出') + ' |')
  }
  lines.push('')
  lines.push('合计 ' + passed + ' / ' + rows.length + ' 达标。')
  if (slow.length > 0) {
    lines.push('')
    lines.push('超预算的项：' + slow.map((row) => row.label + '（' + row.ms.toFixed(1) + 'ms）').join('、') + '。')
  }
  lines.push('')
  lines.push('## 怎么读这组数字')
  lines.push('')
  lines.push('- 预算按「一个人在界面上操作不会觉得卡」定的：一次读整库、一次搜索、一次召回都在 200–300ms 以内。')
  lines.push('- 首次读取包含读取文件、迁移与规范化，所以最慢；之后每次请求都会重新读盘（当前实现不缓存），所以「再次读取」的数字是常态成本。')
  lines.push('- 节点拖动是 700ms 防抖后一次性保存，不是每帧存盘，所以拖动过程中不会触发这里的写盘。')
  lines.push('- 真正的浏览器绘制耗时要在 DevTools Performance 里看，见 docs/WALKTHROUGH.md 的走查项。')
  lines.push('')
  await writeFile(OUT, lines.join('\n'), 'utf8')
  console.log('')
  console.log(passed + ' / ' + rows.length + ' within budget → ' + OUT)
  if (passed !== rows.length) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
