import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, existsSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const plugin = 'D:\\unity code\\N2-main\\project-n2\\.dsh-plugins\\design-memory'
const live = join(process.env.USERPROFILE, '.dsh', 'design-memory', 'memories.json')

const home = mkdtempSync(join(tmpdir(), 'zhiwei-v3-'))
mkdirSync(join(home, 'design-memory'), { recursive: true })
copyFileSync(live, join(home, 'design-memory', 'memories.json'))
process.env.DSH_HOME = home

const before = JSON.parse(readFileSync(join(home, 'design-memory', 'memories.json'), 'utf8'))
const beforeTitles = before.entries.map((e) => e.title).sort()

const mod = await import(pathToFileURL(join(plugin, 'index.js')).href)

let handler = null
const promptSections = []
const tools = new Map()
const ctx = {
  effect(fn) { const d = fn(); return () => { if (typeof d === 'function') d() } },
  inject(deps, cb) {
    const sub = { effect(fn) { const d = fn(); return () => { if (typeof d === 'function') d() } } }
    if (deps.includes('webServer')) sub.webServer = { register(route) { handler = route.handler; return () => {} } }
    if (deps.includes('systemPrompt')) sub.systemPrompt = { section(s) { promptSections.push(s); return () => {} } }
    cb(sub)
  },
  tools: { register(t) { tools.set(t.name, t); return () => tools.delete(t.name) } }
}

mod.apply(ctx)
await new Promise((r) => setTimeout(r, 400))

function call(method, body) {
  return new Promise((resolve, reject) => {
    const req = { method, url: '/design-memory/api', headers: { origin: 'http://127.0.0.1:9885', host: '127.0.0.1:9885', 'content-type': 'application/json' }, on(ev, fn) { if (ev === 'data' && body) fn(Buffer.from(JSON.stringify(body))); if (ev === 'end') fn() }, resume() {} }
    const res = { statusCode: 0, headers: {}, setHeader() {}, writeHead(s) { this.statusCode = s }, end(text) { resolve({ status: this.statusCode, text }) } }
    handler(req, res).catch(reject)
  })
}

const get = await call('GET')
const payload = JSON.parse(get.text)
const onDisk = JSON.parse(readFileSync(join(home, 'design-memory', 'memories.json'), 'utf8'))
const afterTitles = payload.entries.map((e) => e.title).sort()
const losses = beforeTitles.filter((t) => !afterTitles.includes(t))
const withVersions = payload.entries.filter((e) => Array.isArray(e.versions) && e.versions.length >= 1).length
const withEvidence = payload.entries.filter((e) => Array.isArray(e.evidence) && e.evidence.length >= 1).length
const withProtection = payload.entries.filter((e) => typeof e.protectionLevel === 'string').length
const backups = readdirSync(join(home, 'design-memory')).filter((f) => f.includes('.bak'))

const checks = []
const check = (ok, label) => checks.push({ ok: Boolean(ok), label })
check(get.status === 200, 'GET 200 (' + get.status + ')')
check(payload.version === 4, 'API version 4 (got ' + payload.version + ')')
check(onDisk.version === 4, 'on-disk version 4 (got ' + onDisk.version + ')')
check(payload.entries.length === before.entries.length, 'entry count preserved ' + before.entries.length + ' -> ' + payload.entries.length)
check(losses.length === 0, 'no title lost (' + losses.length + ')')
check(payload.relations.length === before.relations.length, 'relation count preserved ' + before.relations.length + ' -> ' + payload.relations.length)
check(withVersions === payload.entries.length, 'every entry has v1 history (' + withVersions + '/' + payload.entries.length + ')')
check(withEvidence === payload.entries.length, 'every entry has evidence (' + withEvidence + '/' + payload.entries.length + ')')
check(withProtection === payload.entries.length, 'every entry has protection level')
check(Array.isArray(payload.proposals) && Array.isArray(payload.recalls), 'payload exposes proposals + recalls')
check(backups.length >= 1, 'backup written before migration (' + backups.join(',') + ')')
check(tools.size === 6, 'six tools registered (' + tools.size + ')')
check(promptSections.length === 1 && /固有约定/.test(promptSections[0].text), 'system prompt section injected')

const failed = checks.filter((c) => !c.ok)
for (const c of checks) console.log((c.ok ? 'PASS  ' : 'FAIL  ') + c.label)
console.log('\nSUMMARY  ' + checks.length + ' checks · ' + (checks.length - failed.length) + ' passed · ' + failed.length + ' failed')
process.exit(failed.length === 0 ? 0 : 1)
