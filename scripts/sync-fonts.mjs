/**
 * Copy Inter woff2 from @fontsource/inter into public/fonts/ with names
 * expected by @nuxt/fonts local provider: inter-{weight}-{style}-{subset}.woff2
 */
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public/fonts')

const subsets = ['latin', 'cyrillic', 'cyrillic-ext']
const weights = [400, 600]
const style = 'normal'

const pkgRoot = dirname(require.resolve('@fontsource/inter/package.json'))
const filesDir = join(pkgRoot, 'files')

function syncOne(subset, weight) {
  const srcName = `inter-${subset}-${weight}-${style}.woff2`
  const destName = `inter-${weight}-${style}-${subset}.woff2`
  const src = join(filesDir, srcName)
  const dest = join(outDir, destName)
  if (!existsSync(src)) {
    console.warn(`fonts:skip missing ${srcName}`)
    return false
  }
  cpSync(src, dest)
  console.log(`fonts: ${destName}`)
  return true
}

mkdirSync(outDir, { recursive: true })

let copied = 0
for (const weight of weights) {
  for (const subset of subsets) {
    if (syncOne(subset, weight)) {
      copied++
    }
  }
}

if (copied === 0) {
  console.error('fonts: no files copied — run pnpm install @fontsource/inter')
  process.exit(1)
}
