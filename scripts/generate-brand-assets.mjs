import { existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sources = [
  join(root, 'assets/brand-src'),
  join(root, 'doc/logos'),
]

const outBrand = join(root, 'public/brand')
const outOg = join(root, 'public/og')

const mappings = [
  { src: 'logo-square.png', dest: join(outBrand, 'logo-square.png'), resize: { height: 96 } },
  { src: 'logo.png', dest: join(outBrand, 'icon.png'), resize: { width: 512, height: 512 } },
  { src: 'logo-horizontal.png', dest: join(outBrand, 'logo-horizontal.png'), resize: { width: 640 } },
  { src: 'logo-squre-text.png', dest: join(outBrand, 'logo-square-text.png') },
]

function findSource(filename) {
  for (const dir of sources) {
    const path = join(dir, filename)
    if (existsSync(path)) {
      return path
    }
  }
  return null
}

async function writePlaceholderPng(dest, width, height, label) {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#df202e"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#fcfcfc" font-family="sans-serif" font-size="24">${label}</text>
  </svg>`
  await sharp(Buffer.from(svg)).png().toFile(dest)
}

async function processImage(srcPath, dest, resize) {
  mkdirSync(dirname(dest), { recursive: true })
  let pipeline = sharp(srcPath)
  if (resize?.width || resize?.height) {
    pipeline = pipeline.resize(resize)
  }
  await pipeline.png({ compressionLevel: 9 }).toFile(dest)
}

async function buildFavicon(iconPath, faviconPath) {
  await sharp(iconPath).resize(32, 32).png().toFile(faviconPath)
}

async function buildAppleTouch(iconPath, dest) {
  await sharp(iconPath).resize(180, 180).png().toFile(dest)
}

async function buildOg(horizontalPath, dest) {
  await sharp(horizontalPath)
    .resize(1200, 630, { fit: 'contain', background: '#ffffff' })
    .jpeg({ quality: 85 })
    .toFile(dest)
}

async function main() {
  mkdirSync(outBrand, { recursive: true })
  mkdirSync(outOg, { recursive: true })

  let anySource = false
  for (const { src, dest, resize } of mappings) {
    const sourcePath = findSource(src)
    if (sourcePath) {
      anySource = true
      await processImage(sourcePath, dest, resize)
      console.log(`brand: ${src} → ${dest}`)
    }
    else {
      await writePlaceholderPng(dest, resize?.width ?? 256, resize?.height ?? 96, 'EW')
      console.warn(`brand: missing ${src}, wrote placeholder → ${dest}`)
    }
  }

  const iconPath = findSource('logo.png') ?? join(outBrand, 'icon.png')
  if (!existsSync(iconPath)) {
    await writePlaceholderPng(iconPath, 512, 512, 'EW')
  }
  await buildFavicon(iconPath, join(root, 'public/favicon.ico'))
  await buildAppleTouch(iconPath, join(root, 'public/apple-touch-icon.png'))

  const horizontal = join(outBrand, 'logo-horizontal.png')
  const ogDest = join(outOg, 'og-default.jpg')
  if (existsSync(horizontal)) {
    await buildOg(horizontal, ogDest)
  }
  else {
    const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#df202e" font-family="sans-serif" font-size="48">EASY WEST</text>
    </svg>`
    await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toFile(ogDest)
  }

  const docImages = [
    { src: 'doc/map.jpg', dest: 'public/images/geography/map.jpg' },
    { src: 'doc/van.jpg', dest: 'public/images/hero/van.jpg' },
  ]
  for (const { src, dest } of docImages) {
    const sourcePath = join(root, src)
    const destPath = join(root, dest)
    if (existsSync(sourcePath)) {
      mkdirSync(dirname(destPath), { recursive: true })
      copyFileSync(sourcePath, destPath)
    }
  }

  if (!anySource) {
    console.warn('brand: add PNGs to doc/logos/ or assets/brand-src/ to replace placeholders')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
