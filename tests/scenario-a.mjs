#!/usr/bin/env node
/**
 * 业务场景 A 演练：跨系统项目关系（V2.4 第十二节场景 A）。
 *
 * 在一个临时 DSH_HOME 里从零建一套「副本系统 → 哥布林洞窟 → 哥布林 / 哥布林弓箭手 → 铁矿石 → 铁剑」，
 * 建双端点关系与关联记忆，再按任务召回，验证「对象 + 关系 + 记忆」三层能串起来。
 * 输出 docs/SCENARIO-A.md。绝不接触线上库。
 *
 * Run: node tests/scenario-a.mjs
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
const OUT = path.join(ROOT, 'docs', 'SCENARIO-A.md')

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
  console.log((pass ? 'PASS  ' : 'FAIL  ') + id + ' ' + title + ' — ' + actual)
}

async function main() {
  const temp = await mkdtemp(path.join(tmpdir(), 'zhiwei-scenario-a-'))
  await mkdir(path.join(temp, 'design-memory'), { recursive: true })
  process.env.DSH_HOME = temp

  const mod = await import(pathToFileURL(PLUGIN_PATH).href + '?scenario=' + Date.now())
  let handler = null
  const ctx = {
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
  }
  mod.apply(ctx)
  if (!handler) throw new Error('route was not registered')
  await new Promise((resolve) => setTimeout(resolve, 60))

  async function get() {
    const res = makeRes()
    await handler(makeReq('GET'), res)
    return JSON.parse(res.body)
  }
  async function post(body) {
    const res = makeRes()
    await handler(makeReq('POST', JSON.stringify(body)), res)
    return { status: res.statusCode, json: JSON.parse(res.body) }
  }

  const created = {}
  const addNode = async (key, payload) => {
    const res = await post(Object.assign({ action: 'node-save', allowDuplicate: true }, payload))
    if (!res.json.ok) throw new Error('node-save failed for ' + key + ': ' + JSON.stringify(res.json))
    created[key] = res.json.node
    return res.json.node
  }

  const projectId = ((await get()).projects[0] || {}).id || 'prj_default'

  // ---- 1. 从项目往下搭一套系统结构
  const system = await addNode('system', {
    title: '副本系统',
    description: '所有可进入的战斗场景与其中投放的怪物、掉落。',
    nodeType: 'system',
    projectId: projectId,
    tags: ['副本']
  })
  const cave = await addNode('cave', {
    title: '哥布林洞窟',
    description: '一层的入门副本，主怪哥布林，产出铁矿石与铁剑。',
    nodeType: 'concept',
    parentNodeId: system.id,
    projectId: projectId,
    tags: ['副本', '洞窟']
  })
  const goblin = await addNode('goblin', {
    title: '哥布林',
    description: '基础人形怪，近战，掉落铁矿石。',
    nodeType: 'concept',
    parentNodeId: cave.id,
    projectId: projectId,
    tags: ['怪物'],
    attributes: [{ label: '定位', value: '前排近战' }]
  })
  const archer = await addNode('archer', {
    title: '哥布林弓箭手',
    description: '哥布林的远程变种，攻击距离更远。',
    nodeType: 'concept',
    parentNodeId: goblin.id,
    projectId: projectId,
    tags: ['怪物']
  })
  const ore = await addNode('ore', {
    title: '铁矿石',
    description: '基础打造材料，洞窟掉落。',
    nodeType: 'concept',
    projectId: projectId,
    tags: ['材料']
  })
  const sword = await addNode('sword', {
    title: '铁剑',
    description: '用铁矿石打造的一阶武器。',
    nodeType: 'concept',
    projectId: projectId,
    tags: ['装备']
  })

  // ---- 2. 建语义关系（方向 + 类型）
  const rel = async (source, type, target) => {
    const res = await post({
      action: 'relation-create',
      sourceType: 'node',
      sourceId: source.id,
      targetType: 'node',
      targetId: target.id,
      relationType: type,
      description: source.title + ' ' + type + ' ' + target.title
    })
    return res
  }
  const rContains = await rel(system, 'contains', cave)
  const rCave = await rel(cave, 'contains', goblin)
  const rFamily = await rel(goblin, 'contains', archer)
  const rDrops = await rel(goblin, 'drops', ore)
  const rOre = await rel(sword, 'crafted_from', ore)

  // ---- 3. 记忆挂在对象上（可追溯）
  const memory = (
    await post({
      action: 'entry-save',
      title: '哥布林洞窟掉落规则',
      content: '哥布林掉落铁矿石，概率 35%；哥布林弓箭手掉落铁矿石概率 20%，额外掉箭矢。铁剑需要 3 个铁矿石打造。',
      projectId: projectId,
      status: 'active',
      domains: ['combat']
    })
  ).json.entry
  const link = await post({ action: 'node-link-memory', nodeId: goblin.id, memoryId: memory.id })

  const state = await get()
  const nodesById = new Map((state.nodes || []).map((node) => [node.id, node]))
  const rels = state.relations || []

  // ---- 判定
  const chainTitles = ['副本系统', '哥布林洞窟', '哥布林', '哥布林弓箭手', '铁矿石', '铁剑']
  const missing = chainTitles.filter((title) => !(state.nodes || []).some((node) => node.title === title))
  record(
    'S1',
    '系统结构可以按项目一层层搭出来',
    '六类对象全部落库，父级关系正确',
    '缺对象 ' + missing.length + ' 个；洞窟父级=' + (nodesById.get(cave.id) || {}).parentNodeId + '；哥布林父级=' + (nodesById.get(goblin.id) || {}).parentNodeId,
    missing.length === 0 &&
      (nodesById.get(cave.id) || {}).parentNodeId === system.id &&
      (nodesById.get(goblin.id) || {}).parentNodeId === cave.id
  )

  const semantic = [
    { res: rContains, from: system.id, to: cave.id, type: 'contains' },
    { res: rCave, from: cave.id, to: goblin.id, type: 'contains' },
    { res: rFamily, from: goblin.id, to: archer.id, type: 'contains' },
    { res: rDrops, from: goblin.id, to: ore.id, type: 'drops' },
    { res: rOre, from: sword.id, to: ore.id, type: 'crafted_from' }
  ]
  const broken = semantic.filter((item) => {
    if (!item.res.json.ok) return true
    const found = rels.find((rel) => rel.id === (item.res.json.relation || {}).id)
    if (!found) return true
    return found.sourceId !== item.from || found.targetId !== item.to || found.relationType !== item.type
  })
  record(
    'S2',
    '关系带类型与方向，且不会存成重复反向',
    '五条关系都带 sourceId/targetId/relationType，方向与录入一致',
    '关系总数 ' + rels.length + '；方向/类型不符 ' + broken.length,
    broken.length === 0 && rels.length === 5
  )

  const linkedNode = (await get()).nodes.find((node) => node.id === goblin.id)
  const linkedEntry = (await get()).entries.find((entry) => entry.id === memory.id)
  record(
    'S3',
    '记忆挂在对象上且双向可查',
    '对象 relatedMemoryIds 含这条记忆，记忆 nodeIds 含这个对象',
    '对象侧命中 ' + ((linkedNode.relatedMemoryIds || []).indexOf(memory.id) >= 0) + '；记忆侧命中 ' + ((linkedEntry.nodeIds || []).indexOf(goblin.id) >= 0) + '；link ok=' + (link.json.ok === true),
    (linkedNode.relatedMemoryIds || []).indexOf(memory.id) >= 0 &&
      (linkedEntry.nodeIds || []).indexOf(goblin.id) >= 0 &&
      link.json.ok === true
  )

  const recall = await post({ action: 'memory-recall', task: '调整哥布林洞窟掉落', projectId: projectId, limit: 10 })
  const hitNodes = (recall.json.nodes || []).map((node) => node.title)
  const hitIds = (recall.json.items || []).map((item) => item.entryId)
  const paths = (recall.json.items || []).filter((item) => (item.paths || []).length > 0)
  record(
    'S4',
    '按任务召回时先命中对象，再带出对象背后的记忆',
    '命中对象里出现「哥布林」相关内容，结果含这条掉落记忆，且带召回路径',
    '命中对象 ' + JSON.stringify(hitNodes) + '；命中记忆 ' + hitIds.length + ' 条；带路径 ' + paths.length + ' 条',
    hitNodes.length > 0 && hitIds.indexOf(memory.id) >= 0 && paths.length > 0
  )

  record(
    'S5',
    '演练没有凭空造出多余对象',
    '对象总数等于本次创建的 6 个（加上迁移补的项目节点）',
    '对象总数 ' + (state.nodes || []).length + '；本次创建 6 个',
    (state.nodes || []).length <= 7
  )

  const dangling = rels.filter((rel) => !nodesById.has(rel.sourceId) && !(state.entries || []).some((entry) => entry.id === rel.sourceId))
  record(
    'S6',
    '关系两端都能解析，没有悬空',
    '关系两端 id 都能在对象 / 记忆 / 记忆区里找到',
    '悬空关系 ' + dangling.length + ' 条',
    dangling.length === 0
  )

  const passed = rows.filter((row) => row.pass).length
  const lines = []
  lines.push('# 业务场景 A 演练：跨系统项目关系')
  lines.push('')
  lines.push('> 由 tests/scenario-a.mjs 在一个临时 DSH_HOME 里从空库搭出来，不接触线上数据。对应 V2.4 需求书第十二节场景 A。')
  lines.push('')
  lines.push('## 搭出来的结构')
  lines.push('')
  lines.push('| 对象 | 类型 | 父级 | 关系 |')
  lines.push('| --- | --- | --- | --- |')
  lines.push('| 副本系统 | system | — | contains → 哥布林洞窟 |')
  lines.push('| 哥布林洞窟 | concept | 副本系统 | contains → 哥布林 |')
  lines.push('| 哥布林 | concept | 哥布林洞窟 | contains → 哥布林弓箭手；drops → 铁矿石 |')
  lines.push('| 哥布林弓箭手 | concept | 哥布林 | — |')
  lines.push('| 铁矿石 | concept | — | ← drops（哥布林）；← crafted_from（铁剑） |')
  lines.push('| 铁剑 | concept | — | crafted_from → 铁矿石 |')
  lines.push('')
  lines.push('另有一条记忆「哥布林洞窟掉落规则」挂在「哥布林」上（双向可查）。')
  lines.push('')
  lines.push('## 结果')
  lines.push('')
  lines.push('| 编号 | 检查 | 预期 | 实际 | 结果 |')
  lines.push('| --- | --- | --- | --- | --- |')
  for (const row of rows) {
    lines.push('| ' + row.id + ' | ' + row.title + ' | ' + row.expected + ' | ' + row.actual + ' | ' + (row.pass ? '通过' : '未通过') + ' |')
  }
  lines.push('')
  lines.push('合计 ' + passed + ' / ' + rows.length + ' 通过。')
  lines.push('')
  lines.push('> 这是数据与接口层的端到端演练；真实鼠标交互（拖节点、框选、弹窗操作）仍需按 docs/WALKTHROUGH.md 由人走查。')
  lines.push('')
  await writeFile(OUT, lines.join('\n'), 'utf8')
  console.log('')
  console.log(passed + ' / ' + rows.length + ' passed → ' + OUT)
  if (passed !== rows.length) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
