/**
 * Genera le icone PNG della PWA senza dipendenze esterne.
 * Uso: node scripts/genera-icone.mjs
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const PUBLIC = resolve(QUI, '..', 'public')

/** Fulmine in coordinate normalizzate 0..1. */
const FULMINE = [
  [0.56, 0.08], [0.28, 0.55], [0.46, 0.55], [0.40, 0.92], [0.72, 0.42], [0.53, 0.42],
]

function dentroPoligono(x, y, poly) {
  let dentro = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    const interseca = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (interseca) dentro = !dentro
  }
  return dentro
}

function mescola(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

function crc32(buf) {
  let c
  const tabella = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    tabella[n] = c >>> 0
  }
  let crc = 0xffffffff
  for (const b of buf) crc = tabella[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(tipo, dati) {
  const lunghezza = Buffer.alloc(4)
  lunghezza.writeUInt32BE(dati.length)
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dati])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(corpo))
  return Buffer.concat([lunghezza, corpo, crc])
}

function png(width, height, rgba) {
  const righe = []
  for (let y = 0; y < height; y++) {
    righe.push(Buffer.from([0]))
    righe.push(rgba.subarray(y * width * 4, (y + 1) * width * 4))
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8      // bit depth
  ihdr[9] = 6      // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(righe), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function disegna(dimensione) {
  const rgba = Buffer.alloc(dimensione * dimensione * 4)
  const viola = [124, 92, 255]
  const ciano = [34, 211, 238]
  const rosa = [168, 85, 247]
  for (let y = 0; y < dimensione; y++) {
    for (let x = 0; x < dimensione; x++) {
      const u = x / (dimensione - 1)
      const v = y / (dimensione - 1)
      const t = Math.min(1, (u + v) / 2)
      const base = t < 0.5 ? mescola(viola, rosa, t * 2) : mescola(rosa, ciano, (t - 0.5) * 2)
      let [r, g, b] = base
      // Alone luminoso in alto a sinistra.
      const alone = Math.max(0, 1 - Math.hypot(u - 0.25, v - 0.2) * 1.8)
      r = Math.min(255, r + alone * 45)
      g = Math.min(255, g + alone * 45)
      b = Math.min(255, b + alone * 45)
      if (dentroPoligono(u, v, FULMINE)) { r = 255; g = 255; b = 255 }
      const i = (y * dimensione + x) * 4
      rgba[i] = r
      rgba[i + 1] = g
      rgba[i + 2] = b
      rgba[i + 3] = 255
    }
  }
  return png(dimensione, dimensione, rgba)
}

mkdirSync(PUBLIC, { recursive: true })
for (const dimensione of [192, 512, 180]) {
  const nome = dimensione === 180 ? 'apple-touch-icon.png' : `icon-${dimensione}.png`
  writeFileSync(resolve(PUBLIC, nome), disegna(dimensione))
  console.log(`✓ ${nome} (${dimensione}x${dimensione})`)
}
