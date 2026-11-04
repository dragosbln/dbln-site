// The site-wide and home-page social cards (src/lib/urls.ts) exist under
// public/ and are the 1200×630 PNGs their metadata declares: a page that
// lists a missing or mis-sized card ships a broken preview on X, LinkedIn
// and Slack. Imports the TS module directly — Node strips types natively.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("../src/", import.meta.url));
const PUBLIC = fileURLToPath(new URL("../public", import.meta.url));

// urls.ts imports `@/content/site`: map the alias onto src/ and add the
// `.ts` Node's type stripping doesn't infer (hence the dynamic import).
registerHooks({
  resolve(specifier, context, next) {
    const target = specifier.startsWith("@/")
      ? path.join(SRC, specifier.slice(2))
      : specifier;
    try {
      return next(target, context);
    } catch (error) {
      if (!/\.[a-z]+$/.test(target) && (target !== specifier || specifier.startsWith("."))) {
        return next(`${target}.ts`, context);
      }
      throw error;
    }
  },
});

const { homeOgImage, siteOgImage } = await import("../src/lib/urls.ts");

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Width and height from the PNG header (IHDR follows the 8-byte signature). */
function pngSize(buffer) {
  assert.ok(buffer.subarray(0, 8).equals(PNG_SIGNATURE), "not a PNG");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

for (const [name, card] of Object.entries({ siteOgImage, homeOgImage })) {
  test(`${name} is a committed PNG of the declared size`, () => {
    const file = path.join(PUBLIC, card.url);
    assert.ok(existsSync(file), `card missing: public${card.url}`);
    assert.deepEqual(pngSize(readFileSync(file)), { width: card.width, height: card.height });
    assert.equal(card.width, 1200);
    assert.equal(card.height, 630);
    assert.ok(card.alt.length > 0, "card has no alt text");
  });
}

test("the home card is its own file, not the site card", () => {
  assert.notEqual(homeOgImage.url, siteOgImage.url);
});
