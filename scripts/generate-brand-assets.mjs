import { cpSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const faviconDir = join(root, 'assets/images/favicon')
const logoDir = join(root, 'assets/images/logo')
const publicDir = join(root, 'public')
const outOg = join(root, 'public/og')

const ogSource = join(logoDir, 'logo-horizontal-white.png')

const legacyPublicFavicons = ['favicon.png', 'apple-touch-icon.png']

function syncFavicons() {
  if (!existsSync(faviconDir)) {
    console.error('brand: missing assets/images/favicon/')
    process.exit(1)
  }

  mkdirSync(publicDir, { recursive: true })

  const files = readdirSync(faviconDir)
  for (const file of files) {
    cpSync(join(faviconDir, file), join(publicDir, file), { force: true })
  }

  for (const legacy of legacyPublicFavicons) {
    const legacyPath = join(publicDir, legacy)
    if (existsSync(legacyPath)) {
      unlinkSync(legacyPath)
    }
  }

  console.log(`brand: ${files.length} files from assets/images/favicon/ → public/`)
}

async function buildOg(sourcePath, dest) {
  mkdirSync(dirname(dest), { recursive: true })
  await sharp(sourcePath)
    .resize(1200, 630, { fit: 'contain', background: '#ffffff' })
    .jpeg({ quality: 85 })
    .toFile(dest)
}

async function main() {
  syncFavicons()

  if (!existsSync(ogSource)) {
    console.error('brand: missing assets/images/logo/logo-horizontal-white.png')
    process.exit(1)
  }

  await buildOg(ogSource, join(outOg, 'og-share.jpg'))
  console.log('brand: logo-horizontal-white.png → og/og-share.jpg')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
