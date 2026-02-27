#!/usr/bin/env node
// generate-icons.js — run once to regenerate icons if needed.
// Run from chrome-extension/ with:
//   node --input-type=commonjs < generate-icons.js
// (The --input-type flag is needed because the parent package.json has "type":"module".)
// Creates icons/icon{16,32,48,128}.png using only Node.js built-ins.
// Dark #0d1117 background, accent #58a6ff border + "A~" pixel art.

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// --- CRC32 ---
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  CRC_TABLE[n] = c;
}
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// --- PNG chunk builder ---
function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([lenBuf, t, data, crcBuf]);
}

// --- Pixel-art glyphs (5×7 "A" and 5×3 "~") ---
const GLYPH_A = [
  [0, 1, 1, 1, 0],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
];

const GLYPH_TILDE = [
  [0, 1, 0, 0, 1],
  [1, 0, 1, 1, 0],
  [0, 0, 0, 0, 0],
];

// --- Icon generator ---
function createIcon(size) {
  const BG = [0x0d, 0x11, 0x17];  // #0d1117
  const AC = [0x58, 0xa6, 0xff];  // #58a6ff

  // grid[y][x] = [r, g, b]
  const grid = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => BG.slice())
  );

  // Border
  const b = size >= 32 ? 2 : 1;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x < b || x >= size - b || y < b || y >= size - b) {
        grid[y][x] = AC.slice();
      }
    }
  }

  // Scale glyphs to fill ~80% of the inner area
  const inner = size - 2 * b;
  // "A" is 5w×7h, "~" is 5w×3h, gap between them = 1 unit
  // total width = 5+1+5 = 11, total height = 7
  // scale = floor(inner / max(11, 7)) but we prioritise width
  const scale = Math.max(1, Math.floor(inner / 12));

  const AW = 5 * scale, AH = 7 * scale;
  const TW = 5 * scale, TH = 3 * scale;
  const GAP = Math.max(1, scale);
  const totalW = AW + GAP + TW;
  const totalH = AH;

  const ox = b + Math.floor((inner - totalW) / 2);  // left edge of "A"
  const oy = b + Math.floor((inner - totalH) / 2);  // top edge of "A"

  function drawGlyph(glyph, rows, cols, startX, startY) {
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        if (!glyph[gy][gx]) continue;
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const px = startX + gx * scale + sx;
            const py = startY + gy * scale + sy;
            if (px >= 0 && px < size && py >= 0 && py < size) {
              grid[py][px] = AC.slice();
            }
          }
        }
      }
    }
  }

  drawGlyph(GLYPH_A, 7, 5, ox, oy);
  // Center "~" vertically relative to "A"
  const tildeOY = oy + Math.floor((AH - TH) / 2);
  drawGlyph(GLYPH_TILDE, 3, 5, ox + AW + GAP, tildeOY);

  // Build raw PNG scan lines (filter byte 0 = None + RGB pixels)
  const scanlines = [];
  for (let y = 0; y < size; y++) {
    scanlines.push(0);
    for (let x = 0; x < size; x++) {
      scanlines.push(grid[y][x][0], grid[y][x][1], grid[y][x][2]);
    }
  }

  const raw = Buffer.from(scanlines);
  const compressed = zlib.deflateSync(raw);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // colour type: RGB
  // bytes 10-12 remain 0: compression, filter, interlace

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- Write files ---
const iconsDir = path.join(__dirname, 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

for (const size of [16, 32, 48, 128]) {
  const outPath = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(outPath, createIcon(size));
  console.log(`Created ${outPath}`);
}

console.log('\nDone. Load chrome-extension/ as an unpacked extension in chrome://extensions.');
