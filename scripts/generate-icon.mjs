import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const BUILD_DIR = path.resolve("build");
fs.mkdirSync(BUILD_DIR, { recursive: true });

const WIDTH = 256;
const HEIGHT = 256;

// CRC32 tablosu (PNG chunk doğrulaması için)
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function roundedRectAlpha(x, y, size, radius) {
  const cx = x < radius ? radius - x : x >= size - radius ? x - (size - radius - 1) : 0;
  const cy = y < radius ? radius - y : y >= size - radius ? y - (size - radius - 1) : 0;
  if (cx === 0 && cy === 0) return 255;
  const dist = Math.hypot(cx, cy);
  if (dist <= radius - 0.8) return 255;
  if (dist >= radius + 0.8) return 0;
  return Math.round(((radius + 0.8 - dist) / 1.6) * 255);
}

// 256x256 RGBA piksel tamponu (İndigo yuvarlatılmış kare + beyaz kep/yıldız simgesi)
const raw = Buffer.alloc((WIDTH * 4 + 1) * HEIGHT);

for (let y = 0; y < HEIGHT; y++) {
  const rowStart = y * (WIDTH * 4 + 1);
  raw[rowStart] = 0; // PNG filter type: None

  for (let x = 0; x < WIDTH; x++) {
    const idx = rowStart + 1 + x * 4;
    const alpha = roundedRectAlpha(x, y, WIDTH, 52);

    // İndigo -> Mor yumuşak gradyan arka plan
    const t = (x + y) / (WIDTH + HEIGHT);
    let r = Math.round(67 + t * 32); // #4338ca -> #6366f1
    let g = Math.round(56 + t * 46);
    let b = Math.round(202 + t * 39);

    // Ortada mezuniyet kepi (diamond + taban) ve sağ üstte AI parıltısı
    const dx = x - 128;
    const dy = y - 114;
    const inCapTop = Math.abs(dx) / 76 + Math.abs(dy) / 36 <= 1;
    const inCapBase =
      x >= 84 &&
      x <= 172 &&
      y >= 126 &&
      y <= 162 &&
      Math.abs(dx) <= 44 - (y - 126) * 0.12;
    const inTassel =
      (x >= 186 && x <= 194 && y >= 114 && y <= 168) ||
      Math.hypot(x - 190, y - 172) <= 8;

    // Sağ üst köşede 4 köşeli yıldız (AI simgesi)
    const sx = Math.abs(x - 190);
    const sy = Math.abs(y - 68);
    const inSparkle = (sx <= 18 && sy <= 3) || (sy <= 18 && sx <= 3) || sx + sy <= 10;

    if (inCapTop || inCapBase || inTassel) {
      r = 255;
      g = 255;
      b = 255;
    } else if (inSparkle) {
      r = 251;
      g = 191;
      b = 36;
    }

    raw[idx] = r;
    raw[idx + 1] = g;
    raw[idx + 2] = b;
    raw[idx + 3] = alpha;
  }
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(WIDTH, 0);
ihdr.writeUInt32BE(HEIGHT, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type: RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const idat = zlib.deflateSync(raw, { level: 9 });
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  makeChunk("IHDR", ihdr),
  makeChunk("IDAT", idat),
  makeChunk("IEND", Buffer.alloc(0)),
]);

fs.writeFileSync(path.join(BUILD_DIR, "icon.png"), png);

// PNG-in-ICO formatında Windows .ico dosyası oluştur
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // type: ICON
icoHeader.writeUInt16LE(1, 4); // count: 1

const icoEntry = Buffer.alloc(16);
icoEntry[0] = 0; // 0 => 256px
icoEntry[1] = 0; // 0 => 256px
icoEntry[2] = 0;
icoEntry[3] = 0;
icoEntry.writeUInt16LE(1, 4); // color planes
icoEntry.writeUInt16LE(32, 6); // bpp
icoEntry.writeUInt32LE(png.length, 8); // image size
icoEntry.writeUInt32LE(22, 12); // offset

const ico = Buffer.concat([icoHeader, icoEntry, png]);
fs.writeFileSync(path.join(BUILD_DIR, "icon.ico"), ico);

console.log("Masaüstü uygulama ikonları oluşturuldu: build/icon.png ve build/icon.ico");
