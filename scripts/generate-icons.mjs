import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "..", "public", "icons");
const sizes = [16, 32, 48, 128];

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, "ascii");
  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

function createIcon(size) {
  const row = Buffer.alloc(1 + size * 4);
  row[0] = 0;

  for (let x = 0; x < size; x += 1) {
    const offset = 1 + x * 4;
    const edge = x === 0 || x === size - 1;
    const inset = Math.floor(size * 0.12);
    const inShape =
      x >= inset &&
      x < size - inset;

    if (edge) {
      row.writeUInt32BE(0xffc9a227, offset);
      continue;
    }

    if (inShape) {
      row.writeUInt32BE(0xff2f2418, offset);
      continue;
    }

    row.writeUInt32BE(0xfff5e6c8, offset);
  }

  const raw = Buffer.concat(Array.from({ length: size }, () => row));
  const compressed = deflateSync(raw);

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", (() => {
      const header = Buffer.alloc(13);
      header.writeUInt32BE(size, 0);
      header.writeUInt32BE(size, 4);
      header[8] = 8;
      header[9] = 6;
      header[10] = 0;
      header[11] = 0;
      header[12] = 0;
      return header;
    })()),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

await mkdir(iconsDir, { recursive: true });

for (const size of sizes) {
  const icon = createIcon(size);
  await writeFile(join(iconsDir, `icon${size}.png`), icon);
}

console.log(`Generated ${sizes.length} placeholder icons in public/icons/`);
