import fs from "node:fs";
import path from "node:path";
import type { Element, Root } from "hast";

/**
 * Build-time rehype plugin for site-local raster images in article prose
 * (/blog/…/*.png|jpg|jpeg|webp): reads the intrinsic dimensions from the
 * file in public/ and sets width/height (reserves the layout box — no CLS)
 * plus loading="lazy" and decoding="async" (article images sit below the
 * fold). Dimensions are parsed from the file headers directly to keep the
 * dependency surface unchanged. A file that exists but can't be parsed
 * fails the build loudly, matching rehypeInlineSvg.
 */

const RASTER_RE = /^\/blog\/.+\.(png|jpe?g|webp)$/;

function pngSize(buf: Buffer): { width: number; height: number } | null {
  // 8-byte signature, IHDR length+type, then width/height as uint32 BE.
  if (buf.length < 24 || buf.readUInt32BE(12) !== 0x49484452) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function jpegSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.readUInt16BE(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) return null;
    const marker = buf[offset + 1];
    // SOF0–SOF15 minus DHT/JPG/DAC carry the frame dimensions.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return {
        height: buf.readUInt16BE(offset + 5),
        width: buf.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + buf.readUInt16BE(offset + 2);
  }
  return null;
}

function webpSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 30 || buf.toString("ascii", 0, 4) !== "RIFF") return null;
  const chunk = buf.toString("ascii", 12, 16);
  if (chunk === "VP8 ") {
    return {
      width: buf.readUInt16LE(26) & 0x3fff,
      height: buf.readUInt16LE(28) & 0x3fff,
    };
  }
  if (chunk === "VP8L") {
    const b = buf.subarray(21, 25);
    return {
      width: 1 + (((b[1] & 0x3f) << 8) | b[0]),
      height: 1 + (((b[3] & 0x0f) << 10) | (b[2] << 2) | (b[1] >> 6)),
    };
  }
  if (chunk === "VP8X") {
    return {
      width: 1 + buf.readUIntLE(24, 3),
      height: 1 + buf.readUIntLE(27, 3),
    };
  }
  return null;
}

function imageSize(file: string): { width: number; height: number } | null {
  const buf = fs.readFileSync(file);
  const ext = path.extname(file).toLowerCase();
  if (ext === ".png") return pngSize(buf);
  if (ext === ".jpg" || ext === ".jpeg") return jpegSize(buf);
  if (ext === ".webp") return webpSize(buf);
  return null;
}

export default function rehypeRasterImages() {
  return (tree: Root) => {
    const walk = (node: Root | Element) => {
      for (const child of node.children) {
        if (child.type !== "element") continue;
        if (
          child.tagName === "img" &&
          typeof child.properties?.src === "string" &&
          RASTER_RE.test(child.properties.src)
        ) {
          const src = child.properties.src;
          const file = path.join(process.cwd(), "public", src);
          if (!fs.existsSync(file)) {
            throw new Error(`rehypeRasterImages: ${src} not found at ${file}`);
          }
          const size = imageSize(file);
          if (!size) {
            throw new Error(`rehypeRasterImages: could not read dimensions of ${src}`);
          }
          child.properties.width = size.width;
          child.properties.height = size.height;
          child.properties.loading = "lazy";
          child.properties.decoding = "async";
        }
        walk(child);
      }
    };
    walk(tree);
  };
}
