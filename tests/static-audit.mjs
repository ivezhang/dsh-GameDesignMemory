// Static audit for the 知微 client bundle: i18n key coverage + CSS class coverage.
// Usage: node tests/static-audit.mjs
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const source = readFileSync(resolve(root, 'client.js'), 'utf8').replace(/\r\n/g, '\n')

const problems = { errors: [], warnings: [] }

// ---------- i18n ----------
function dictSlice(startMarker, endMarker) {
  const start = source.indexOf(startMarker)
  if (start < 0) throw new Error('missing marker: ' + startMarker)
  const end = source.indexOf(endMarker, start)
  if (end < 0) throw new Error('missing end marker: ' + endMarker)
  return source.slice(start + startMarker.length, end)
}

const zhBlock = dictSlice("const ZH = {", "\n\n    const EN = {")
const enBlock = dictSlice("const EN = {", "\n\n    const CSS = `")

function keysOf(block) {
  const keys = new Set()
  const re = /^\s*'([A-Za-z0-9_.-]+)':/gm
  let match
  while ((match = re.exec(block))) keys.add(match[1])
  return keys
}

const zhKeys = keysOf(zhBlock)
const enKeys = keysOf(enBlock)

for (const key of zhKeys) if (!enKeys.has(key)) problems.errors.push(`i18n: EN missing key "${key}"`)
for (const key of enKeys) if (!zhKeys.has(key)) problems.errors.push(`i18n: ZH missing key "${key}"`)

const used = new Set()
const useRe = /\bt\(\s*'([A-Za-z0-9_.-]+)'/g
let useMatch
while ((useMatch = useRe.exec(source))) {
  const key = useMatch[1]
  if (key.endsWith('.')) continue // t('sort.' + mode) — composed at runtime
  used.add(key)
}
const dynRe = /\bt\(\s*(?!')([A-Za-z_$][\w$]*)/g
const dynamicCalls = []
let dynMatch
while ((dynMatch = dynRe.exec(source))) dynamicCalls.push(dynMatch[1])

// labelOf(t, list, id, 'type') / hintOf(...) compose `${prefix}.${id}` and `${prefix}.${id}.hint`
const families = new Set()
const familyRe = /\b(?:labelOf|hintOf)\(\s*t\s*,\s*[^,]+,\s*[^,]+,\s*'([A-Za-z0-9_-]+)'/g
let familyMatch
while ((familyMatch = familyRe.exec(source))) families.add(familyMatch[1])

const isFamilyKey = (key) => {
  const prefix = key.split('.')[0]
  return families.has(prefix)
}

for (const key of used) if (!zhKeys.has(key)) problems.errors.push(`i18n: used but not defined "${key}"`)
for (const key of zhKeys) {
  if (used.has(key) || isFamilyKey(key)) continue
  problems.errors.push(`i18n: defined but never used "${key}"`)
}
// keys passed around as data (e.g. hintKey / labelKey) still count as used if found in a dict-ish position
if (dynamicCalls.length) problems.warnings.push(`i18n: dynamic t() with ${[...new Set(dynamicCalls)].join(', ')}`)

// ---------- CSS classes ----------
const cssStart = source.indexOf('const CSS = `')
const cssEnd = source.indexOf('\n`\n', cssStart)
const css = source.slice(cssStart, cssEnd)
const defined = new Set()
const defRe = /\.(zw-[A-Za-z0-9-]+)/g
let defMatch
while ((defMatch = defRe.exec(css))) defined.add(defMatch[1])

const usedClasses = new Set()
const classRe = /className:\s*(?:'([^']*)'|"([^"]*)"|([A-Za-z0-9_$]+))/g
let classMatch
while ((classMatch = classRe.exec(source))) {
  const literal = classMatch[1] || classMatch[2]
  if (literal !== undefined) {
    for (const token of literal.split(/\s+/)) if (token) usedClasses.add(token)
  }
}
// string-built classNames: pick every quoted zw-* token in the file
const tokenRe = /'([^']*\bzw-[A-Za-z0-9-]+[^']*)'/g
let tokenMatch
while ((tokenMatch = tokenRe.exec(source))) {
  for (const token of tokenMatch[1].split(/[\s'+()?:]+/)) {
    if (/^zw-[A-Za-z0-9-]+$/.test(token)) usedClasses.add(token)
  }
}

const allowUndefined = /^zw-(?:type|domain|status|source|reg)-/
for (const name of usedClasses) {
  if (defined.has(name) || allowUndefined.test(name)) continue
  problems.errors.push(`css: used but not defined ".${name}"`)
}
const allowUnused = /^zw-(?:legend|hull|gedge|gnode|graph|tool)/
for (const name of defined) {
  if (usedClasses.has(name) || allowUnused.test(name)) continue
  problems.warnings.push(`css: defined but never used ".${name}"`)
}

// ---------- misc hygiene ----------
const doubleSpace = /className:\s*'([^']*  [^']*)'/g
let ds
while ((ds = doubleSpace.exec(source))) problems.errors.push(`className literal contains double space: "${ds[1]}"`)

const report = []
report.push(`client.js ${(source.length / 1024).toFixed(1)} KB`)
report.push(`i18n keys: zh ${zhKeys.size} / en ${enKeys.size} / used ${used.size}`)
report.push(`css classes: defined ${defined.size} / used ${usedClasses.size}`)
for (const error of problems.errors) report.push('ERROR ' + error)
for (const warning of problems.warnings) report.push('warn  ' + warning)
report.push(
  problems.errors.length ? `FAILED: ${problems.errors.length} error(s)` : 'OK: static audit clean'
)
console.log(report.join('\n'))
process.exit(problems.errors.length ? 1 : 0)
