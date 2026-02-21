import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Simple PNG generator for placeholder icons
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = join(process.cwd(), 'public', 'icons');
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

// Minimal valid PNG with gradient-like appearance
function createSimplePNG(size) {
  const width = size;
  const height = size;
  
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(2, 9); // color type (RGB)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  
  const ihdrCrc = crc32(Buffer.concat([Buffer.from('IHDR'), ihdrData]));
  const ihdrLength = Buffer.alloc(4);
  ihdrLength.writeUInt32BE(13);
  const ihdrChunk = Buffer.concat([ihdrLength, Buffer.from('IHDR'), ihdrData, ihdrCrc]);
  
  // Create simple image data (dark background with gradient elements)
  const rawData = Buffer.alloc(width * height * 3 + height);
  let idx = 0;
  
  for (let y = 0; y < height; y++) {
    rawData[idx++] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      // Dark background (#0a101e)
      let r = 10, g = 16, b = 30;
      
      // Add gradient circle effect
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const maxDist = width / 2;
      
      if (dist < maxDist * 0.4) {
        // Inner glow - cyan to purple gradient
        const t = dist / (maxDist * 0.4);
        r = Math.floor(0 + t * 124);
        g = Math.floor(212 - t * 148);
        b = Math.floor(255 - t * 103);
      }
      
      rawData[idx++] = r;
      rawData[idx++] = g;
      rawData[idx++] = b;
    }
  }
  
  // Compress with zlib
  const compressed = zlib.deflateSync(rawData);
  
  // IDAT chunk
  const idatCrc = crc32(Buffer.concat([Buffer.from('IDAT'), compressed]));
  const idatLength = Buffer.alloc(4);
  idatLength.writeUInt32BE(compressed.length);
  const idatChunk = Buffer.concat([idatLength, Buffer.from('IDAT'), compressed, idatCrc]);
  
  // IEND chunk
  const iendCrc = crc32(Buffer.from('IEND'));
  const iendLength = Buffer.alloc(4);
  iendLength.writeUInt32BE(0);
  const iendChunk = Buffer.concat([iendLength, Buffer.from('IEND'), iendCrc]);
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 implementation
function crc32(data) {
  let crc = 0xffffffff;
  const table = makeCrcTable();
  
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff];
  }
  
  crc = (crc ^ 0xffffffff) >>> 0;
  const result = Buffer.alloc(4);
  result.writeUInt32BE(crc, 0);
  return result;
}

function makeCrcTable() {
  const table = Buffer.alloc(256 * 4);
  const polynomial = 0xedb88320;
  
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (polynomial ^ (c >>> 1)) : (c >>> 1);
    }
    table.writeUInt32LE(c >>> 0, i * 4);
  }
  
  return table;
}

// Generate icons
sizes.forEach(size => {
  const png = createSimplePNG(size);
  const filename = size === 512 ? 'icon-512x512.png' : `icon-${size}x${size}.png`;
  writeFileSync(join(iconsDir, filename), png);
  console.log(`Created ${filename}`);
});

console.log('✅ All icons generated successfully!');
