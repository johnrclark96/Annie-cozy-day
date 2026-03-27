const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const ROOT = __dirname;
const ATLAS_OUT = path.join(ROOT, "assets", "cozy-sprites-atlas.webp");
const EXISTING_ATLAS = path.join(ROOT, "cozy-sprites-atlas.webp");
const PADDING = 8;
const ATLAS_WIDTH = 1024;
const MAX_WEBP_HEIGHT = 16383;

// Max widths per category for size optimization
const MAX_WIDTH = {
  obi: 500,        // pet poses — moderate
  luna: 500,       // pet poses — moderate
  accessories: 250, // small items, drawn at tiny scale
  items: 400,      // misc game items
  backyard: 250    // scene objects, drawn procedurally
};

const SHEETS = [
  {
    file: "obi dig splash.png",
    sprites: [
      { category: "obi", key: "dig", yStart: 0, yEnd: 0.5 },
      { category: "obi", key: "splash", yStart: 0.5, yEnd: 1.0 }
    ]
  },
  {
    file: "luna sit stalk.png",
    sprites: [
      { category: "luna", key: "treeSit", yStart: 0, yEnd: 0.5 },
      { category: "luna", key: "stalk", yStart: 0.5, yEnd: 1.0 }
    ]
  },
  {
    file: "bandanas.png",
    sprites: [
      { category: "accessories", key: "bandanaRed", yStart: 0, yEnd: 0.333 },
      { category: "accessories", key: "bandanaPlaid", yStart: 0.333, yEnd: 0.666 },
      { category: "accessories", key: "bandanaCamo", yStart: 0.666, yEnd: 1.0 }
    ]
  },
  {
    file: "acessories1.png",
    sprites: [
      { category: "accessories", key: "bowPink", yStart: 0, yEnd: 0.333 },
      { category: "accessories", key: "flowerCrown", yStart: 0.333, yEnd: 0.666 },
      { category: "accessories", key: "starCollar", yStart: 0.666, yEnd: 1.0 }
    ]
  },
  {
    file: "sweater.png",
    sprites: [
      { category: "accessories", key: "sweaterRed", yStart: 0, yEnd: 1.0 }
    ]
  },
  {
    file: "accessories2.png",
    sprites: [
      { category: "backyard", key: "birdFeeder", yStart: 0, yEnd: 0.2 },
      { category: "backyard", key: "kiddiePool", yStart: 0.2, yEnd: 0.4 },
      { category: "backyard", key: "gardenPatch", yStart: 0.4, yEnd: 0.6 },
      { category: "backyard", key: "bench", yStart: 0.6, yEnd: 0.8 },
      { category: "backyard", key: "butterflyNet", yStart: 0.8, yEnd: 1.0 }
    ]
  },
  {
    file: "new obi sprites.png",
    sprites: [
      { category: "obi", key: "eat", yStart: 0, yEnd: 0.25 },
      { category: "obi", key: "drink", yStart: 0.25, yEnd: 0.5 },
      { category: "obi", key: "carryToy", yStart: 0.5, yEnd: 0.75 },
      { category: "obi", key: "bath", yStart: 0.75, yEnd: 1.0 }
    ]
  },
  {
    file: "new luna sprites.png",
    sprites: [
      { category: "luna", key: "eat", yStart: 0, yEnd: 0.25 },
      { category: "luna", key: "drink", yStart: 0.25, yEnd: 0.5 },
      { category: "luna", key: "stretch", yStart: 0.5, yEnd: 0.75 },
      { category: "luna", key: "bath", yStart: 0.75, yEnd: 1.0 }
    ]
  },
  {
    file: "new misc sprites.png",
    sprites: [
      { category: "items", key: "foodBowl", yStart: 0, yEnd: 0.2 },
      { category: "items", key: "waterBowl", yStart: 0.2, yEnd: 0.4 },
      { category: "items", key: "giftBox", yStart: 0.4, yEnd: 0.6 },
      { category: "items", key: "dogTreats", yStart: 0.6, yEnd: 0.8 },
      { category: "items", key: "catTreats", yStart: 0.8, yEnd: 1.0 }
    ]
  }
];

const REPLACEMENT_KEYS = new Set([
  "obi.eat", "obi.drink", "obi.carryToy", "obi.bath",
  "luna.eat", "luna.drink", "luna.stretch", "luna.bath",
  "items.foodBowl", "items.waterBowl", "items.giftBox",
  "items.dogTreats", "items.catTreats"
]);

async function cropSprite(filePath, yStart, yEnd, category) {
  var meta = await sharp(filePath).metadata();
  var imgW = meta.width;
  var imgH = meta.height;
  var top = Math.max(0, Math.round(imgH * yStart));
  var bot = Math.min(imgH, Math.round(imgH * yEnd));
  var height = bot - top;
  if (height <= 0) throw new Error("Zero height");

  var regionBuf = await sharp(filePath)
    .extract({ left: 0, top: top, width: imgW, height: height })
    .png()
    .toBuffer();

  // Trim background
  var buf = regionBuf;
  var w, h;
  try {
    var trimmed = await sharp(regionBuf)
      .trim({ threshold: 40 })
      .toBuffer({ resolveWithObject: true });
    if (trimmed.info.width >= 20 && trimmed.info.height >= 20) {
      buf = trimmed.data;
      w = trimmed.info.width;
      h = trimmed.info.height;
    } else {
      var rawMeta = await sharp(regionBuf).metadata();
      w = rawMeta.width;
      h = rawMeta.height;
    }
  } catch (e) {
    var rawMeta2 = await sharp(regionBuf).metadata();
    w = rawMeta2.width;
    h = rawMeta2.height;
  }

  // Resize if wider than category max
  var maxW = MAX_WIDTH[category] || 400;
  if (w > maxW) {
    var scale = maxW / w;
    var newH = Math.round(h * scale);
    buf = await sharp(buf).resize(maxW, newH).png().toBuffer();
    w = maxW;
    h = newH;
  }

  return { buffer: buf, width: w, height: h };
}

function packRows(sprites, atlasWidth, startY) {
  var placements = [];
  var cursorX = PADDING;
  var cursorY = startY;
  var rowHeight = 0;

  var sorted = sprites.slice().sort(function(a, b) { return b.height - a.height; });

  for (var i = 0; i < sorted.length; i++) {
    var s = sorted[i];
    if (cursorX + s.width + PADDING > atlasWidth) {
      cursorY += rowHeight + PADDING;
      cursorX = PADDING;
      rowHeight = 0;
    }
    placements.push({ sprite: s, x: cursorX, y: cursorY });
    cursorX += s.width + PADDING;
    rowHeight = Math.max(rowHeight, s.height);
  }

  return { placements: placements, totalHeight: cursorY + rowHeight + PADDING };
}

async function main() {
  console.log("=== Sprite Atlas Processor ===\n");

  console.log("Loading existing atlas...");
  var existingMeta = await sharp(EXISTING_ATLAS).metadata();
  console.log("  Size: " + existingMeta.width + " x " + existingMeta.height);

  var spriteJS = fs.readFileSync(path.join(ROOT, "src", "09-sprites.js"), "utf8");
  var boxMatch = spriteJS.match(/const SPRITE_FRAME_BOXES = (\{[\s\S]*?\n\s*\});/);
  if (!boxMatch) throw new Error("Could not parse SPRITE_FRAME_BOXES");
  var boxJSON = boxMatch[1].replace(/,(\s*[\}\]])/g, "$1");
  var existingBoxes = JSON.parse(boxJSON);

  var keepMaxY = 0;
  for (var cat of Object.keys(existingBoxes)) {
    for (var key of Object.keys(existingBoxes[cat])) {
      if (REPLACEMENT_KEYS.has(cat + "." + key)) continue;
      var fr = existingBoxes[cat][key];
      keepMaxY = Math.max(keepMaxY, fr.y + fr.h);
    }
  }
  console.log("  Keeping existing frames up to y=" + keepMaxY);

  var existingKeptBuf = await sharp(EXISTING_ATLAS)
    .extract({ left: 0, top: 0, width: existingMeta.width, height: keepMaxY })
    .png()
    .toBuffer();

  console.log("\nCropping & resizing new sprites...");
  var newSprites = [];

  for (var si = 0; si < SHEETS.length; si++) {
    var sheet = SHEETS[si];
    var filePath = path.join(ROOT, sheet.file);
    if (!fs.existsSync(filePath)) { console.log("  SKIP: " + sheet.file); continue; }
    console.log("  " + sheet.file);

    for (var spi = 0; spi < sheet.sprites.length; spi++) {
      var sprite = sheet.sprites[spi];
      try {
        var cropped = await cropSprite(filePath, sprite.yStart, sprite.yEnd, sprite.category);
        console.log("    " + sprite.category + "." + sprite.key + ": " + cropped.width + "x" + cropped.height);
        newSprites.push({
          category: sprite.category, key: sprite.key,
          buffer: cropped.buffer, width: cropped.width, height: cropped.height
        });
      } catch (e) {
        console.log("    ERROR " + sprite.category + "." + sprite.key + ": " + e.message);
      }
    }
  }

  console.log("\nPacking " + newSprites.length + " sprites...");
  var packed = packRows(newSprites, ATLAS_WIDTH, keepMaxY + PADDING);
  console.log("  Packed: " + ATLAS_WIDTH + " x " + packed.totalHeight);

  if (packed.totalHeight > MAX_WEBP_HEIGHT) {
    console.log("  ERROR: Atlas still too tall (" + packed.totalHeight + " > " + MAX_WEBP_HEIGHT + ")");
    process.exit(1);
  }

  var updatedBoxes = JSON.parse(JSON.stringify(existingBoxes));
  for (var c of Object.keys(updatedBoxes)) {
    for (var k of Object.keys(updatedBoxes[c])) {
      if (REPLACEMENT_KEYS.has(c + "." + k)) delete updatedBoxes[c][k];
    }
  }
  if (!updatedBoxes.accessories) updatedBoxes.accessories = {};
  if (!updatedBoxes.backyard) updatedBoxes.backyard = {};

  var compositeOps = [];
  for (var pi = 0; pi < packed.placements.length; pi++) {
    var p = packed.placements[pi];
    var sp = p.sprite;
    updatedBoxes[sp.category][sp.key] = { x: p.x, y: p.y, w: sp.width, h: sp.height };
    compositeOps.push({ input: sp.buffer, left: p.x, top: p.y });
  }

  console.log("\nCompositing atlas...");
  var allOps = [{ input: existingKeptBuf, left: 0, top: 0 }].concat(compositeOps);

  var result = await sharp({
    create: { width: ATLAS_WIDTH, height: packed.totalHeight, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  }).composite(allOps).webp({ quality: 88 }).toBuffer();

  fs.writeFileSync(ATLAS_OUT, result);
  fs.writeFileSync(path.join(ROOT, "cozy-sprites-atlas.webp"), result);
  console.log("Atlas written: " + ATLAS_WIDTH + "x" + packed.totalHeight + " (" + (result.length / 1024).toFixed(1) + " KB)");

  var distAtlas = path.join(ROOT, "dist", "assets", "cozy-sprites-atlas.webp");
  if (fs.existsSync(path.dirname(distAtlas))) {
    fs.writeFileSync(distAtlas, result);
    console.log("Copied to dist/assets/");
  }

  // Output
  var output = JSON.stringify(updatedBoxes, null, 6);
  fs.writeFileSync(path.join(ROOT, "sprite-frames-output.json"), output);

  console.log("\n=== FRAME MAP ===");
  for (var cc of Object.keys(updatedBoxes)) {
    for (var kk of Object.keys(updatedBoxes[cc])) {
      var ff = updatedBoxes[cc][kk];
      console.log("  " + cc + "." + kk + ": {x:" + ff.x + ", y:" + ff.y + ", w:" + ff.w + ", h:" + ff.h + "}");
    }
  }

  console.log("\nDone! " + newSprites.length + " sprites processed into atlas.");
}

main().catch(function(e) { console.error("FATAL:", e); process.exit(1); });
