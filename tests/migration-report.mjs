#!/usr/bin/env node
/**
 * Migration report for the 知微 plugin: takes a copy of a real store (default the
 * live one under %USERPROFILE%/.dsh/design-memory), boots the host on a temp
 * DSH_HOME, and writes docs/MIGRATION-REPORT.md comparing before / after.
 *
 * Read-only with respect to the live store: it is copied, never mutated.
 *
 * Run: node tests/migration-report.mjs [sourceStorePath]
 */

import { Readable } from 'node:stream'
import { mkdir, mkdtemp, readFile, writeFile, copyFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const PLUGIN_PATH = path.join(ROOT, 'index.js')
const ROUTE = '/design-memory/api'

const source =
  process.argv[2] ||
  path.join(homedir(), '.dsh', 'design-memory', 'memories.json')

async function sourceSummary(file) {
  const parsed = JSON.parse(await readFile(file, 'utf8'))
  const counts = { entries: 0, relations: 0, collections: 0, frames: 0, projects: 0 }
  counts.entries = Array.isArray(parsed.entries) ? parsed.entries.length : 0
  counts.relations = Array.isArray(parsed.relations)
    ? parsed.relations.length
    : (parsed.entries || []).reduce((sum, entry) => sum + (Array.isArray(entry.links) ? entry.links.length : 0), 0)
  counts.collections = Array.isArray(parsed.collections)
    ? parsed.collections.length
    : Array.isArray(parsed.regions)
      ? parsed.regions.length
      : 0
  counts.frames = Array.isArray(parsed.frames) ? parsed.frames.length : 0
  counts.projects = Array.isArray(parsed.projects) ? parsed.projects.length : 0
  return { version: Number(parsed.version) || 0, counts }
}

function makeReq(method, body) {
  const req = Readable.from(body ? [Buffer.from(body)] : [])
  req.method = method
  req.url = ROUTE
  req.headers = { origin: 'http://127.0.0.1:1', host: '127.0.0.1:1', 'content-type': 'application/json' }
  return req
}

function makeRes() {
  const chunks = []
  const res = {
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
  return res
}

async function main() {
  const temp = await mkdtemp(path.join(tmpdir(), 'zhiwei-migrate-'))
  const dir = path.join(temp, 'design-memory')
  await mkdir(dir, { recursive: true })
  await copyFile(source, path.join(dir, 'memories.json'))
  process.env.DSH_HOME = temp

  const mod = await import(pathToFileURL(PLUGIN_PATH).href + '?migrate=' + Date.now())
  let handler = null
  const ctx = {
    tools: { list: [], register(def) { this.list.push(def) } },
    effect(run) { run() },
    inject(services, callback) {
      if (Array.isArray(services) && services.includes('webServer')) {
        callback({
          effect(run) { run() },
          webServer: { register(def) { handler = def.handler } }
        })
      }
    }
  }
  mod.apply(ctx)
  if (!handler) throw new Error('route was not registered')
  await new Promise((resolve) => setTimeout(resolve, 50))

  const res = makeRes()
  await handler(makeReq('GET'), res)
  const payload = JSON.parse(res.body)
  const migratedFile = path.join(dir, 'memories.json')
  const onDisk = JSON.parse(await readFile(migratedFile, 'utf8'))

  // 真实数据冒烟：在迁移后的库上把新能力跑一遍（对象 → 关联记忆 → 召回）。
  async function post(body) {
    const res = makeRes()
    await handler(makeReq('POST', JSON.stringify(body)), res)
    return JSON.parse(res.body)
  }
  const sample = payload.entries.find((entry) => entry.status !== 'archived') || payload.entries[0]
  const smoke = []
  if (sample) {
    const nodeName = '迁移报告冒烟对象 ' + Date.now().toString(36)
    // 用一个只出现在对象上的词作为任务，逼召回走「对象 → 记忆」这条路径
    const alias = '别名' + Date.now().toString(36)
    const created = await post({
      action: 'node-save',
      title: nodeName,
      nodeType: 'concept',
      projectId: sample.projectId,
      aliases: [alias]
    })
    smoke.push(['建对象（node-save）', created.ok === true && Boolean(created.node && created.node.id)])
    const nodeId = created.node && created.node.id
    if (nodeId) {
      const linked = await post({ action: 'node-link-memory', nodeId, memoryId: sample.id })
      smoke.push(['关联真实记忆（node-link-memory）', linked.ok === true])
      const rel = await post({
        action: 'relation-create',
        sourceType: 'node',
        sourceId: nodeId,
        targetType: 'memory',
        targetId: sample.id,
        relationType: 'references'
      })
      smoke.push(['对象→记忆关系（双端点）', rel.ok === true && Boolean(rel.relation && rel.relation.id)])
      const task = alias + ' 这块怎么配'
      const recalled = await post({ action: 'memory-recall', task, limit: 6 })
      const served = (recalled.items || []).find((item) => item.entryId === sample.id)
      smoke.push(['按真实任务召回', recalled.ok === true && Boolean(served)])
      smoke.push(['召回带关系路径', Boolean(served && Array.isArray(served.paths) && served.paths.length > 0)])
      const logged = (recalled.recalls || []).find((row) => row.task === task)
      smoke.push(['调用记录持久化路径', Boolean(logged && Array.isArray(logged.paths) && logged.paths.length > 0)])
      const tidy = await post({ action: 'memory-tidy' })
      smoke.push(['整理中心可读', tidy.ok === true && Boolean(tidy.report || tidy.result)])
      const after = await post({ action: 'node-delete', nodeId, mode: 'hard' })
      smoke.push(['硬删除对象（冒烟收尾）', after.ok === true])
    }
  }

  const before = await sourceSummary(source)
  const after = {
    version: payload.version,
    entries: payload.entries.length,
    relations: payload.relations.length,
    collections: payload.collections.length,
    frames: payload.frames.length,
    projects: payload.projects.length,
    nodes: (payload.nodes || []).length,
    projectNodes: (payload.nodes || []).filter((node) => node.nodeType === 'project').length,
    entriesWithVersions: payload.entries.filter((entry) => (entry.versions || []).length > 0).length,
    entriesWithEvidence: payload.entries.filter((entry) => (entry.evidence || []).length > 0).length,
    relationsWithEnds: payload.relations.filter((rel) => rel.sourceType && rel.targetType).length,
    diskVersion: Number(onDisk.version)
  }

  const lines = [
    '# 迁移报告（v' + before.version + ' → v' + after.version + '）',
    '',
    '> 这份报告由 `tests/migration-report.mjs` 生成：拿一份真实库的副本在临时目录里跑一遍迁移，',
    '> 对比迁移前后，**不改动**线上文件。',
    '',
    '源文件：`' + source + '`',
    '',
    '## 迁移前后',
    '',
    '| 项目 | 迁移前 | 迁移后 |',
    '| --- | --- | --- |',
    '| 数据版本 | ' + before.version + ' | ' + after.version + ' |',
    '| 记忆 | ' + before.counts.entries + ' | ' + after.entries + ' |',
    '| 关系 | ' + before.counts.relations + ' | ' + after.relations + ' |',
    '| 集合 | ' + before.counts.collections + ' | ' + after.collections + ' |',
    '| 记忆区 | ' + before.counts.frames + ' | ' + after.frames + ' |',
    '| 项目 | ' + before.counts.projects + ' | ' + after.projects + ' |',
    '| 知识对象 | — | ' + after.nodes + '（其中项目自动节点 ' + after.projectNodes + '） |',
    '',
    '## 完整性核对',
    '',
    '- 记忆数量不变：' + (before.counts.entries === after.entries ? '是' : '**否**'),
    '- 关系数量不变：' + (before.counts.relations === after.relations ? '是' : '**否**'),
    '- 每条记忆都有版本历史：' + after.entriesWithVersions + ' / ' + after.entries,
    '- 每条记忆都有来源证据：' + after.entriesWithEvidence + ' / ' + after.entries,
    '- 关系都写成双端点（sourceType/targetType）：' + after.relationsWithEnds + ' / ' + after.relations,
    '- 落盘版本与内存一致：' + (after.diskVersion === after.version ? '是' : '**否**'),
    '',
    '## 迁移后真实数据冒烟',
    '',
    '在迁移后的库（真实记忆）上把新能力跑一遍，跑完删除冒烟对象：',
    '',
    '| 步骤 | 结果 |',
    '| --- | --- |',
    ...smoke.map(([name, pass]) => '| ' + name + ' | ' + (pass ? '通过' : '**失败**') + ' |'),
    ''
  ]


  const out = path.join(ROOT, 'docs', 'MIGRATION-REPORT.md')
  await writeFile(out, lines.join('\n'), 'utf8')
  console.log(lines.join('\n'))
  console.log('written: ' + out)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
