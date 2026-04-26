// Generates tray-grey.png and tray-green.png as 32×32 PNGs from a
// minimal sage circle. Avoids needing an image editor.
//
// Run once: node assets/build-tray-icons.cjs

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

function makePng(rgba, w, h) {
  // Tiny PNG encoder — single IDAT, no filter byte per row.
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const t = Buffer.from(type);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0;                      // filter: none
    rgba.subarray(y * w * 4, (y + 1) * w * 4)
        .copy(raw, y * (1 + w * 4) + 1);
  }
  const idat = zlib.deflateSync(raw);

  return Buffer.concat([
    header,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = (CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8)) >>> 0;
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function drawCircle({ size = 32, fill, ring }) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2, cy = size / 2;
  const rOuter = size / 2 - 1;
  const rInner = rOuter - 6;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      const off = (y * size + x) * 4;
      if (d <= rOuter) {
        const c = (d > rInner) ? ring : fill;
        // soft anti-alias on edge
        const edge = Math.max(0, 1 - Math.max(0, d - (rOuter - 1)));
        buf[off]     = c[0];
        buf[off + 1] = c[1];
        buf[off + 2] = c[2];
        buf[off + 3] = Math.round(c[3] * edge);
      }
    }
  }
  return buf;
}

const SAGE  = [127, 163, 142, 255]; // brand
const STONE = [138, 138, 146, 255]; // ink-dim

const grey  = makePng(drawCircle({ fill: STONE, ring: STONE }), 32, 32);
const green = makePng(drawCircle({ fill: SAGE,  ring: SAGE  }), 32, 32);

fs.writeFileSync(path.join(__dirname, 'tray-grey.png'),  grey);
fs.writeFileSync(path.join(__dirname, 'tray-green.png'), green);
console.log('tray icons written to', __dirname);
