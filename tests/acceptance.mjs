#!/usr/bin/env node
/**
 * 数据层验收：在真实库的副本上把 V2.4 规格第 15 条的「核心验收 · 数据层」跑一遍，
 * 输出 docs/ACCEPTANCE.md。
 *
 * 只读对待线上库：复制到临时 DSH_HOME，绝不写回。
 * 注意：这里验证的是数据与接口层，真人鼠标交互仍需按 docs/WALKTHROUGH.md 走查。
 *
 * Run: node tests/acceptance.mjs [sourceStorePath]
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
const OUT = path.join(ROOT, 'docs', 'ACCEPTANCE.md')

const source = process.argv[2] || path.join(homedir(), '.dsh', 'design-memory', 'memories.json')

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

const rows = []
function record(id, title, expected, actual, pass) {
  rows.push({ id, title, expected, actual, pass })
  console.log((pass ? 'PASS  ' : 'FAIL  ') + title + ' — ' + actual)
}

async function main() {
  const before = JSON.parse(await readFile(source, 'utf8'))
  const temp = await mkdtemp(path.join(tmpdir(), 'zhiwei-accept-'))
  const dir = path.join(temp, 'design-memory')
  await mkdir(dir, { recursive: true })
  await copyFile(source, path.join(dir, 'memories.json'))
  process.env.DSH_HOME = temp

  const mod = await import(pathToFileURL(PLUGIN_PATH).href + '?accept=' + Date.now())
  let handler = null
  const toolList = []
  const ctx = {
    tools: {
      register(def) {
        toolList.push(def)
      }
    },
    effect(run) {
      run()
    },
    inject(services, callback) {
      if (!Array.isArray(services)) return
      if (services.includes('webServer')) {
        callback({ effect(run) { run() }, webServer: { register(def) { handler = def.handler } } })
      }
    }
  }
  mod.apply(ctx)
  if (!handler) throw new Error('route was not registered')
  await new Promise((resolve) => setTimeout(resolve, 60))

  async function get() {
    const res = makeRes()
    await handler(makeReq('GET'), res)
    return { status: res.statusCode, json: JSON.parse(res.body) }
  }
  async function post(body) {
    const res = makeRes()
    await handler(makeReq('POST', JSON.stringify(body)), res)
    return { status: res.statusCode, json: JSON.parse(res.body) }
  }

  const state = (await get()).json
  const entries = state.entries || []
  const relations = state.relations || []
  const nodes = state.nodes || []
  const entryIds = new Set(entries.map((entry) => entry.id))
  const nodeIds = new Set(nodes.map((node) => node.id))
  const frameIds = new Set((state.frames || []).map((frame) => frame.id))
  const allEnds = new Set([...entryIds, ...nodeIds, ...frameIds])

  // 1. 原有记忆的版本与证据完整
  const missingVersion = entries.filter((entry) => !Array.isArray(entry.versions) || entry.versions.length === 0)
  const missingEvidence = entries.filter((entry) => !Array.isArray(entry.evidence) || entry.evidence.length === 0)
  const badCurrent = entries.filter((entry) => {
    const versions = entry.versions || []
    const last = versions[versions.length - 1]
    return !last || entry.currentVersion !== last.version
  })
  record(
    'A1',
    '原有记忆都有版本历史与来源证据',
    '每条记忆至少 1 个版本、1 条证据，currentVersion 指向最新版本',
    `记忆 ${entries.length} 条；缺版本 ${missingVersion.length}；缺证据 ${missingEvidence.length}；版本号不一致 ${badCurrent.length}`,
    missingVersion.length === 0 && missingEvidence.length === 0 && badCurrent.length === 0
  )

  // 2. 固有约定不能被静默覆盖
  const protectedEntry =
    entries.find((entry) => entry.protectionLevel === 'protected') ||
    (await post({
      action: 'entry-save',
      title: '验收用固有约定',
      content: '这条是验收脚本造的固有约定：输出一律先说结论。',
      protectionLevel: 'protected'
    })).json.entry
  const originalContent = protectedEntry.content
  const silent = await post({ action: 'entry-save', id: protectedEntry.id, content: originalContent + '（被悄悄改掉）' })
  const afterSilent = (await get()).json.entries.find((entry) => entry.id === protectedEntry.id)
  const forced = await post({
    action: 'entry-save',
    id: protectedEntry.id,
    content: originalContent + '（用户明确修改）',
    force: true
  })
  const afterForced = (await get()).json.entries.find((entry) => entry.id === protectedEntry.id)
  record(
    'A2',
    '固有约定不会被静默改写，用户明确修改才生效',
    '静默修改被拒绝且内容不变；带 force 的修改成功并留下新版本',
    `静默修改返回 ${silent.status} ${(silent.json.error && silent.json.error.code) || ''}；内容是否保持原样 ${afterSilent && afterSilent.content === originalContent}；force 修改 ok=${forced.json.ok === true}；版本数 ${(afterForced.versions || []).length}`,
    silent.json.ok === false &&
      afterSilent &&
      afterSilent.content === originalContent &&
      forced.json.ok === true &&
      (afterForced.versions || []).length > (protectedEntry.versions || []).length
  )

  // 3. 跨项目误召回为 0
  const projectB = (await post({ action: 'project-save', name: '验收用另一个项目' })).json.project
  const otherEntry = (
    await post({
      action: 'entry-save',
      title: '验收：另一个项目的同名主题',
      content: '验收主题词 跨项目隔离 掉落表 另一套配置',
      projectId: projectB.id
    })
  ).json.entry
  const globalEntry = (
    await post({
      action: 'entry-save',
      title: '验收：全局约定',
      content: '验收主题词 跨项目隔离 掉落表 走全局默认',
      scope: 'global'
    })
  ).json.entry
  const projectA = (await get()).json.projects.find((project) => project.id !== projectB.id)
  const scoped = await post({ action: 'memory-recall', task: '验收主题词 跨项目隔离 掉落表', projectId: projectA.id, limit: 10 })
  const scopedIds = (scoped.json.items || []).map((item) => item.entryId)
  record(
    'A3',
    '指定项目召回不会带出其他项目的记忆',
    '结果不含另一个项目的记忆，全局记忆仍参与',
    `命中 ${scopedIds.length} 条；含他项目记忆 ${scopedIds.includes(otherEntry.id)}；含全局记忆 ${scopedIds.includes(globalEntry.id)}`,
    !scopedIds.includes(otherEntry.id) && scopedIds.includes(globalEntry.id)
  )

  // 4. 关系来源可追溯
  const badSource = relations.filter((relation) => !relation.source || !relation.confidence || relation.confidence <= 0)
  const dangling = relations.filter(
    (relation) => !allEnds.has(relation.sourceId) || !allEnds.has(relation.targetId)
  )
  record(
    'A4',
    '每条关系都有来源与置信度，两端都能解析',
    '关系的 source / confidence 完整，sourceId 与 targetId 都存在',
    `关系 ${relations.length} 条；缺来源或置信度 ${badSource.length}；端点悬空 ${dangling.length}`,
    badSource.length === 0 && dangling.length === 0
  )

  // 5. 对象重复率可控（整理中心给出的疑似重复对）
  const tidy = await post({ action: 'memory-tidy' })
  const report = tidy.json.report || tidy.json.result || {}
  const duplicates = report.duplicateNodes || []
  record(
    'A5',
    '对象重复率可控',
    '整理中心给出的疑似重复对象对为 0（真实库里没有需要合并的同义对象）',
    `知识对象 ${nodes.length} 个；疑似重复 ${duplicates.length} 对${duplicates.length ? '：' + duplicates.map((pair) => pair.a.title + ' / ' + pair.b.title).join('；') : ''}`,
    duplicates.length === 0
  )

  // 6. 启动迁移与读写不会静默丢数据
  const after = (await get()).json
  const count = (list) => (Array.isArray(list) ? list.length : 0)
  const createdEntries = 3
  const delta = {
    entries: count(after.entries) - (count(before.entries) + createdEntries),
    relations: count(after.relations) - count(before.relations),
    collections: count(after.collections) - count(before.collections),
    projects: count(after.projects) - (count(before.projects) || 1) - 1
  }
  record(
    'A6',
    '迁移与读写没有静默丢数据',
    '记忆增量正好等于脚本新建的 3 条，关系/集合/项目数量没有意外的减少',
    `增量 ${JSON.stringify(delta)}`,
    delta.entries === 0 && delta.relations >= 0 && delta.collections === 0 && delta.projects === 0
  )

  // 7. 六个工具与路由都在（宿主契约）
  const names = toolList.map((def) => def.name).sort()
  record(
    'A7',
    '宿主契约完整（工具 + 路由）',
    '6 个工具全部注册，/design-memory/api 可用',
    `工具 ${names.join(', ')}；路由 ${handler ? 'ok' : 'missing'}`,
    ['design_memory_analyze', 'design_memory_observe', 'design_memory_recall', 'design_memory_search', 'design_memory_suggest', 'design_memory_write'].every((name) => names.includes(name))
  )

  const passed = rows.filter((row) => row.pass).length
  const lines = [
    '# 数据层验收结果',
    '',
    `- 生成时间：${new Date().toISOString()}`,
    `- 数据来源：${source}（复制到临时目录后运行，线上库未被修改）`,
    `- 数据版本：迁移前 ${Number(before.version) || 0} → 迁移后 ${Number(state.version) || 0}`,
    `- 结果：**${passed} / ${rows.length} 通过**`,
    '',
    '> 这一页只覆盖「数据与接口层」的验收：数据的完整性、固有约定保护、跨项目召回隔离、关系可追溯性、重复率与契约。',
    '> 真人鼠标/键盘的交互走查仍需按 [WALKTHROUGH.md](WALKTHROUGH.md) 执行——这一页不能替代它。',
    '',
    '| 编号 | 验收项 | 预期 | 实际 | 结论 |',
    '| --- | --- | --- | --- | --- |',
    ...rows.map((row) => `| ${row.id} | ${row.title} | ${row.expected} | ${row.actual} | ${row.pass ? '通过' : '不通过'} |`),
    ''
  ]
  await writeFile(OUT, lines.join('\n'), 'utf8')
  console.log('\n' + passed + ' / ' + rows.length + ' passed → ' + OUT)
  if (passed !== rows.length) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
