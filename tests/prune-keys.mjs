// One-off hygiene tool: delete dictionary entries that no component ever asks for.
// Usage: node tests/prune-keys.mjs [--write]
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const write = process.argv.includes('--write')

const bundle = readFileSync(resolve(root, 'client.js'), 'utf8').replace(/\r\n/g, '\n')
const used = new Set()
for (const match of bundle.matchAll(/\bt\(\s*'([A-Za-z0-9_.-]+)'/g)) {
  if (!match[1].endsWith('.')) used.add(match[1])
}
const families = new Set()
for (const match of bundle.matchAll(/\b(?:labelOf|hintOf)\(\s*t\s*,\s*[^,]+,\s*[^,]+,\s*'([A-Za-z0-9_-]+)'/g)) {
  families.add(match[1])
}
const keep = (key) => used.has(key) || families.has(key.split('.')[0])

const head = resolve(root, 'parts/client/00-head.js')
const lines = readFileSync(head, 'utf8').replace(/\r\n/g, '\n').split('\n')
const removed = []
const out = []
let inDict = false
let seenFirstClose = false
for (const line of lines) {
  if (/^\s{4}const (ZH|EN) = \{/.test(line)) {
    inDict = true
    out.push(line)
    continue
  }
  if (inDict) {
    const match = line.match(/^\s+'([A-Za-z0-9_.-]+)':/)
    if (match && !keep(match[1])) {
      removed.push(match[1])
      continue
    }
    if (/^\s{4}\}/.test(line)) {
      inDict = false
      seenFirstClose = true
      out.push(line)
      continue
    }
  }
  out.push(line)
}
if (!seenFirstClose) throw new Error('dict boundary not found')
if (write) writeFileSync(head, out.join('\n'), 'utf8')
console.log(`removed ${removed.length} unused keys`)
console.log([...new Set(removed)].slice(0, 12).join(', ') + (removed.length > 12 ? ' …' : ''))
if (!write) console.log('dry run only — pass --write to apply')
