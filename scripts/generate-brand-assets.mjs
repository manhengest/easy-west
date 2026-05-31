import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const logoDir = join(root, 'assets/images/logo')
const outOg = join(root, 'public/og')

const faviconSource = join(logoDir, 'favicon.png')
const ogSource = join(logoDir, 'logo-horizontal-white.png')

async function buildFavicon(iconPath, faviconPath) {
  await sharp(iconPath).resize(32, 32).png().toFile(faviconPath)
}

async function buildAppleTouch(iconPath, dest) {
  await sharp(iconPath).resize(180, 180).png().toFile(dest)
}

async function buildOg(sourcePath, dest) {
  mkdirSync(dirname(dest), { recursive: true })
  await sharp(sourcePath)
    .resize(1200, 630, { fit: 'contain', background: '#df202e' })
    .jpeg({ quality: 85 })
    .toFile(dest)
}

async function main() {
  if (!existsSync(faviconSource)) {
    console.error('brand: missing assets/images/logo/favicon.png')
    process.exit(1)
  }

  await buildFavicon(faviconSource, join(root, 'public/favicon.png'))
  await buildAppleTouch(faviconSource, join(root, 'public/apple-touch-icon.png'))
  console.log('brand: favicon.png → public/favicon.png, apple-touch-icon.png')

  if (!existsSync(ogSource)) {
    console.error('brand: missing assets/images/logo/logo-horizontal-white.png')
    process.exit(1)
  }

  await buildOg(ogSource, join(outOg, 'og-default.jpg'))
  console.log('brand: logo-horizontal-white.png → og/og-default.jpg')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
