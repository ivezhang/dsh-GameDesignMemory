// DSH 工具契约探针：验证知微 host 能以「当前 DSH 版本要求」的形状注册成立。
// 这个脚本模拟 DSH 的 tools.register 校验（output { schema, render }）与
// webServer.register（重复路由抛错、返回 disposer），并真的调用一次工具与接口，
// 目的是在没有重启 DSH 的情况下提前抓到「fiber failed」这类启动错误。
import { pathToFileURL } from 'node:url'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const results = []
function check(name, fn) {
  try {
    const detail = fn()
    results.push({ ok: true, name, detail })
  } catch (error) {
    results.push({ ok: false, name, detail: error && error.message })
  }
}

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'zw-contract-'))
process.env.DSH_HOME = home

const mod = await import(pathToFileURL('D:/Agent工作台/99_临时/zhiwei-v2/index.js').href)

const tools = new Map()
const routes = new Map()
const promptSections = []
let routeHandler = null

function assertSupportedSchema(schema, label) {
  if (schema === null || typeof schema !== 'object' || Array.isArray(schema)) {
    throw new TypeError(label + ' schema must be an object')
  }
  const allowed = new Set(['type', 'properties', 'items', 'enum', 'required', 'description', 'additionalProperties', 'minimum', 'maximum', 'minItems', 'maxItems', 'title', 'default', 'oneOf', 'anyOf', 'const', 'format', 'pattern'])
  for (const key of Object.keys(schema)) {
    if (!allowed.has(key)) throw new TypeError(label + ' schema has unsupported key ' + key)
  }
}

const ctx = {
  tools: {
    register(definition) {
      const name = definition && definition.name
      if (typeof name !== 'string') throw new TypeError('tool name required')
      if (tools.has(name)) throw new Error('tool "' + name + '" already registered')
      const output = definition.output
      if (output === undefined || typeof output !== 'object' || typeof output.render !== 'function') {
        throw new TypeError('tool "' + name + '" must declare output { schema, render, presentationMeta? }')
      }
      if (output.presentationMeta !== undefined && typeof output.presentationMeta !== 'function') {
        throw new TypeError('tool "' + name + '" presentationMeta must be a function')
      }
      assertSupportedSchema(output.schema, name + ' output')
      if (definition.parameters !== undefined) assertSupportedSchema(definition.parameters, name + ' parameters')
      if (typeof definition.execute !== 'function') throw new TypeError('tool "' + name + '" needs execute')
      tools.set(name, definition)
    }
  },
  effect(fn, label) {
    fn()
    return { label }
  },
  inject(_deps, callback) {
    callback({
      effect(fn, label) {
        fn()
        return { label }
      },
      systemPrompt: {
        section(section) {
          if (!section || typeof section.name !== 'string' || !section.name) throw new TypeError('section name required')
          if (typeof section.text !== 'string' || !section.text.trim()) throw new TypeError('section text required')
          if (typeof section.order !== 'number' || !Number.isFinite(section.order)) throw new TypeError('section order required')
          promptSections.push(section)
          return () => {
            const index = promptSections.indexOf(section)
            if (index >= 0) promptSections.splice(index, 1)
          }
        }
      },
      webServer: {
        register(route) {
          if (route.kind !== 'prefix' && route.kind !== 'exact') throw new Error('route kind invalid')
          const key = route.kind + ' ' + route.path
          if (routes.has(key)) throw new Error('webserver: duplicate ' + key)
          routes.set(key, route)
          routeHandler = route.handler
          return () => routes.delete(key)
        }
      }
    })
  }
}

let applyError = null
try {
  await mod.apply(ctx)
} catch (error) {
  applyError = error
}

check('apply resolves without throwing', () => {
  if (applyError) throw applyError
  return 'ok'
})
check('registers six tools', () => {
  if (tools.size !== 6) throw new Error('expected 6 tools, got ' + tools.size)
  return [...tools.keys()].join(', ')
})
check('registers a system prompt section for recall + observe discipline', () => {
  if (promptSections.length !== 1) throw new Error('expected 1 prompt section, got ' + promptSections.length)
  const section = promptSections[0]
  if (!section.text.includes('design_memory_recall')) throw new Error('prompt section must mention design_memory_recall')
  if (!section.text.includes('固有约定')) throw new Error('prompt section must mention 固有约定')
  return section.name + ' order=' + section.order
})
check('each tool exposes schema + render', () => {
  for (const [name, tool] of tools) {
    const parts = tool.output.render({}, '样例文本')
    if (!Array.isArray(parts) || parts.length === 0) throw new Error(name + ' render returned no parts')
    if (parts[0].type !== 'text' || typeof parts[0].text !== 'string') throw new Error(name + ' render part shape wrong')
  }
  return 'ok'
})
check('registers the knowledge api route', () => {
  const key = 'prefix /design-memory'
  if (!routes.has(key)) throw new Error('missing route ' + key)
  return 'prefix /design-memory'
})

function fakeRes() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(key, value) {
      this.headers[key] = value
    },
    writeHead(status, headers) {
      this.statusCode = status
      Object.assign(this.headers, headers || {})
    },
    end(chunk) {
      if (chunk !== undefined) this.body += chunk
    }
  }
}

check('GET /design-memory/api returns v4 payload', async () => {
  const res = fakeRes()
  await routeHandler({ method: 'GET', url: '/design-memory/api', headers: { host: '127.0.0.1:1', origin: 'http://127.0.0.1:1' } }, res)
  if (res.statusCode !== 200) throw new Error('status ' + res.statusCode + ' body ' + res.body.slice(0, 200))
  const payload = JSON.parse(res.body)
  if (Number(payload.version) < 4) throw new Error('version ' + payload.version)
  if (!Array.isArray(payload.entries) || !Array.isArray(payload.relations) || !Array.isArray(payload.collections)) {
    throw new Error('payload missing collections arrays')
  }
  if (!Array.isArray(payload.proposals) || !Array.isArray(payload.recalls)) throw new Error('payload missing proposals/recalls')
  return 'entries=' + payload.entries.length + ' version=' + payload.version
})

const searchTool = tools.get('design_memory_search')
if (searchTool) {
  check('design_memory_search executes and renders text', async () => {
    const value = await searchTool.execute({ limit: 3 })
    const parts = searchTool.output.render({ limit: 3 }, value)
    if (typeof parts[0].text !== 'string' || parts[0].text.length === 0) throw new Error('empty text')
    return parts[0].text.slice(0, 60)
  })
}

// 上次「fiber failed → 面板 404」的教训：宿主契约一变，插件不该整体崩。
// 这里换一个 systemPrompt.section 直接抛错的宿主，验证工具与路由照样注册成立。
{
  const home2 = fs.mkdtempSync(path.join(os.tmpdir(), 'zw-contract-bad-'))
  const previous = process.env.DSH_HOME
  process.env.DSH_HOME = home2
  const mod2 = await import(pathToFileURL('D:/Agent工作台/99_临时/zhiwei-v2/index.js').href + '?broken-prompt=1')
  const tools2 = new Map()
  const routes2 = new Map()
  const ctx2 = {
    tools: {
      register(definition) {
        tools2.set(definition.name, definition)
      }
    },
    effect(fn) {
      fn()
      return {}
    },
    inject(_deps, callback) {
      callback({
        effect(fn) {
          fn()
          return {}
        },
        systemPrompt: {
          section() {
            throw new Error('section signature changed')
          }
        },
        webServer: {
          register(route) {
            routes2.set(route.kind + ' ' + route.path, route)
            return () => routes2.delete(route.kind + ' ' + route.path)
          }
        }
      })
    }
  }
  let error2 = null
  try {
    await mod2.apply(ctx2)
  } catch (error) {
    error2 = error
  }
  check('survives a broken systemPrompt service', () => {
    if (error2) throw error2
    if (tools2.size !== 6) throw new Error('expected 6 tools after prompt failure, got ' + tools2.size)
    if (!routes2.has('prefix /design-memory')) throw new Error('routes missing after prompt failure')
    return 'tools + route registered anyway'
  })
  process.env.DSH_HOME = previous
}

const failed = results.filter((item) => !item.ok)
for (const item of results) {
  console.log((item.ok ? 'PASS  ' : 'FAIL  ') + item.name + (item.ok ? '' : ' :: ' + item.detail))
}
console.log('SUMMARY  ' + results.length + ' checks, ' + (results.length - failed.length) + ' passed')
if (failed.length) process.exit(1)
