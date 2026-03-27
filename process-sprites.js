const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const ROOT = __dirname;
const ATLAS_OUT = path.join(ROOT, "assets", "cozy-sprites-atlas.webp");
const EXISTING_ATLAS_BACKUP = path.join(ROOT, "cozy-sprites-atlas-original.webp");
const EXISTING_ATLAS = path.join(ROOT, "cozy-sprites-atlas.webp");
const PADDING = 8;
const ATLAS_WIDTH = 1024;

/* Background types:
   "dark"  = dark gradient bg (new obi/luna/misc sprites) — remove pixels with low brightness
   "white" = white/light bg (bandanas, accessories, sweater, dig/splash, treeSit/stalk, backyard items)
*/
const SHEETS = [
  { file: "obi dig splash.png", bg: "white", sprites: [
    { category: "obi", key: "dig", yStart: 0, yEnd: 0.5 },
    { category: "obi", key: "splash", yStart: 0.5, yEnd: 1.0 }
  ]},
  { file: "luna sit stalk.png", bg: "white", sprites: [
    { category: "luna", key: "treeSit", yStart: 0, yEnd: 0.5 },
    { category: "luna", key: "stalk", yStart: 0.5, yEnd: 1.0 }
  ]},
  { file: "bandanas.png", bg: "white", sprites: [
    { category: "accessories", key: "bandanaRed", yStart: 0, yEnd: 0.333 },
    { category: "accessories", key: "bandanaPlaid", yStart: 0.333, yEnd: 0.666 },
    { category: "accessories", key: "bandanaCamo", yStart: 0.666, yEnd: 1.0 }
  ]},
  { file: "acessories1.png", bg: "white", sprites: [
    { category: "accessories", key: "bowPink", yStart: 0, yEnd: 0.333 },
    { category: "accessories", key: "flowerCrown", yStart: 0.333, yEnd: 0.666 },
    { category: "accessories", key: "starCollar", yStart: 0.666, yEnd: 1.0 }
  ]},
  { file: "sweater.png", bg: "white", sprites: [
    { category: "accessories", key: "sweaterRed", yStart: 0, yEnd: 1.0 }
  ]},
  { file: "accessories2.png", bg: "white", sprites: [
    { category: "backyard", key: "birdFeeder", yStart: 0, yEnd: 0.2 },
    { category: "backyard", key: "kiddiePool", yStart: 0.2, yEnd: 0.4 },
    { category: "backyard", key: "gardenPatch", yStart: 0.4, yEnd: 0.6 },
    { category: "backyard", key: "bench", yStart: 0.6, yEnd: 0.8 },
    { category: "backyard", key: "butterflyNet", yStart: 0.8, yEnd: 1.0 }
  ]},
  { file: "new obi sprites.png", bg: "dark", sprites: [
    { category: "obi", key: "eat", yStart: 0, yEnd: 0.25 },
    { category: "obi", key: "drink", yStart: 0.25, yEnd: 0.5 },
    { category: "obi", key: "carryToy", yStart: 0.5, yEnd: 0.75 },
    { category: "obi", key: "bath", yStart: 0.75, yEnd: 1.0 }
  ]},
  { file: "new luna sprites.png", bg: "dark", sprites: [
    { category: "luna", key: "eat", yStart: 0, yEnd: 0.25 },
    { category: "luna", key: "drink", yStart: 0.25, yEnd: 0.5 },
    { category: "luna", key: "stretch", yStart: 0.5, yEnd: 0.75 },
    { category: "luna", key: "bath", yStart: 0.75, yEnd: 1.0 }
  ]},
  { file: "new misc sprites.png", bg: "dark", sprites: [
    { category: "items", key: "foodBowl", yStart: 0, yEnd: 0.2 },
    { category: "items", key: "waterBowl", yStart: 0.2, yEnd: 0.4 },
    { category: "items", key: "giftBox", yStart: 0.4, yEnd: 0.6 },
    { category: "items", key: "dogTreats", yStart: 0.6, yEnd: 0.8 },
    { category: "items", key: "catTreats", yStart: 0.8, yEnd: 1.0 }
  ]}
];

const REPLACEMENT_KEYS = new Set([
  "obi.eat", "obi.drink", "obi.carryToy", "obi.bath",
  "luna.eat", "luna.drink", "luna.stretch", "luna.bath",
  "items.foodBowl", "items.waterBowl", "items.giftBox",
  "items.dogTreats", "items.catTreats"
]);

// Target widths: pet poses match originals, accessories/backyard smaller
const TARGET_WIDTH = {
  obi: 580,        // match original pet sprite widths
  luna: 680,
  accessories: 300, // accessories need to be clear at small render size
  items: 550,
  backyard: 300
};

async function removeBackground(buf, bgType) {
  // Get raw pixel data
  var img = sharp(buf).ensureAlpha();
  var { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  var w = info.width, h = info.height;
  var pixels = Buffer.from(data); // RGBA

  if (bgType === "dark") {
    // Remove dark pixels: if brightness < threshold, make transparent
    // Also remove glow halos by checking if pixel is dim
    for (var i = 0; i < pixels.length; i += 4) {
      var r = pixels[i], g = pixels[i+1], b = pixels[i+2];
      var brightness = (r * 0.299 + g * 0.587 + b * 0.114);
      if (brightness < 85) {
        pixels[i+3] = 0; // fully transparent
      } else if (brightness < 120) {
        // partial fade for the glow halo
        var fade = (brightness - 85) / 35;
        pixels[i+3] = Math.round(pixels[i+3] * fade);
      }
    }
  } else {
    // Remove white/light pixels
    for (var i = 0; i < pixels.length; i += 4) {
      var r = pixels[i], g = pixels[i+1], b = pixels[i+2];
      var brightness = (r * 0.299 + g * 0.587 + b * 0.114);
      if (brightness > 240 && r > 230 && g > 230 && b > 230) {
        pixels[i+3] = 0;
      } else if (brightness > 220 && r > 210 && g > 210 && b > 210) {
        var fade = (240 - brightness) / 20;
        pixels[i+3] = Math.round(pixels[i+3] * Math.max(0, Math.min(1, fade)));
      }
    }
  }

  return sharp(pixels, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

async function cropSprite(filePath, yStart, yEnd, bgType, category) {
  var meta = await sharp(filePath).metadata();
  var imgW = meta.width, imgH = meta.height;
  var top = Math.max(0, Math.round(imgH * yStart));
  var bot = Math.min(imgH, Math.round(imgH * yEnd));
  var height = bot - top;

  // Extract sub-region
  var regionBuf = await sharp(filePath)
    .extract({ left: 0, top: top, width: imgW, height: height })
    .png()
    .toBuffer();

  // Remove background
  var cleanBuf = await removeBackground(regionBuf, bgType);

  // Trim transparent edges
  try {
    var trimResult = await sharp(cleanBuf).trim().toBuffer({ resolveWithObject: true });
    if (trimResult.info.width >= 20 && trimResult.info.height >= 20) {
      cleanBuf = trimResult.data;
    }
  } catch(e) { /* keep as-is */ }

  var finalMeta = await sharp(cleanBuf).metadata();
  var w = finalMeta.width, h = finalMeta.height;

  // Resize to target width if larger
  var maxW = TARGET_WIDTH[category] || 400;
  if (w > maxW) {
    var scale = maxW / w;
    var newH = Math.round(h * scale);
    cleanBuf = await sharp(cleanBuf).resize(maxW, newH).png().toBuffer();
    w = maxW; h = newH;
  }

  return { buffer: cleanBuf, width: w, height: h };
}

function packRows(sprites, atlasWidth, startY) {
  var placements = [];
  var curX = PADDING, curY = startY, rowH = 0;
  var sorted = sprites.slice().sort(function(a,b){ return b.height - a.height; });
  for (var i = 0; i < sorted.length; i++) {
    var s = sorted[i];
    if (curX + s.width + PADDING > atlasWidth) {
      curY += rowH + PADDING;
      curX = PADDING; rowH = 0;
    }
    placements.push({ sprite: s, x: curX, y: curY });
    curX += s.width + PADDING;
    rowH = Math.max(rowH, s.height);
  }
  return { placements: placements, totalHeight: curY + rowH + PADDING };
}

async function main() {
  console.log("=== Sprite Atlas Processor v2 ===\n");

  // Use the original atlas (before our edits) if available, otherwise current
  var atlasPath = fs.existsSync(EXISTING_ATLAS_BACKUP) ? EXISTING_ATLAS_BACKUP : EXISTING_ATLAS;
  console.log("Source atlas: " + path.basename(atlasPath));
  var existingMeta = await sharp(atlasPath).metadata();
  console.log("  Size: " + existingMeta.width + " x " + existingMeta.height);

  // Parse existing frame boxes from the JS
  var spriteJS = fs.readFileSync(path.join(ROOT, "src", "09-sprites.js"), "utf8");
  var boxMatch = spriteJS.match(/const SPRITE_FRAME_BOXES = (\{[\s\S]*?\n\s*\});/);
  if (!boxMatch) throw new Error("Could not find SPRITE_FRAME_BOXES");
  var boxJSON = boxMatch[1].replace(/,(\s*[\}\]])/g, "$1");
  var existingBoxes = JSON.parse(boxJSON);

  // Keep the entire original atlas (all original frames are in there)
  var keepMaxY = existingMeta.height;
  console.log("  Keeping entire original atlas: height=" + keepMaxY);

  // Extract the kept portion
  var keptBuf = await sharp(atlasPath)
    .extract({ left: 0, top: 0, width: existingMeta.width, height: keepMaxY })
    .png().toBuffer();

  // Process all new sprites
  console.log("\nProcessing sprites with background removal...");
  var newSprites = [];

  for (var si = 0; si < SHEETS.length; si++) {
    var sheet = SHEETS[si];
    var filePath = path.join(ROOT, sheet.file);
    if (!fs.existsSync(filePath)) { console.log("  SKIP: " + sheet.file); continue; }
    console.log("  " + sheet.file + " (bg: " + sheet.bg + ")");

    for (var spi = 0; spi < sheet.sprites.length; spi++) {
      var sprite = sheet.sprites[spi];
      try {
        var cropped = await cropSprite(filePath, sprite.yStart, sprite.yEnd, sheet.bg, sprite.category);
        console.log("    " + sprite.category + "." + sprite.key + ": " + cropped.width + "x" + cropped.height);
        newSprites.push({
          category: sprite.category, key: sprite.key,
          buffer: cropped.buffer, width: cropped.width, height: cropped.height
        });
      } catch(e) {
        console.log("    ERROR " + sprite.category + "." + sprite.key + ": " + e.message);
      }
    }
  }

  // Pack
  console.log("\nPacking " + newSprites.length + " sprites...");
  var packed = packRows(newSprites, ATLAS_WIDTH, keepMaxY + PADDING);
  console.log("  Total: " + ATLAS_WIDTH + " x " + packed.totalHeight);

  if (packed.totalHeight > 16383) {
    console.log("  ERROR: Too tall for WebP (" + packed.totalHeight + ")");
    process.exit(1);
  }

  // Build frame map — start with original frames from the pre-Phase3 atlas
  var ORIGINAL_FRAMES = {
    annie: {
      stand: {x:8,y:8,w:462,h:974}, sit: {x:472,y:990,w:515,h:957},
      cheer: {x:478,y:8,w:514,h:970}, laugh: {x:8,y:990,w:456,h:970},
      kneel: {x:8,y:7467,w:730,h:745}, walkSide: {x:8,y:8220,w:633,h:970},
      walkFront: {x:8,y:9198,w:613,h:984}
    },
    items: {
      yarnBall: {x:8,y:10190,w:352,h:257}, brush: {x:8,y:10455,w:381,h:294}
    },
    obi: {
      sitHappy: {x:8,y:2558,w:360,h:512}, run: {x:8,y:3907,w:564,h:379},
      leap: {x:8,y:3517,w:485,h:382}, sitSad: {x:376,y:2558,w:367,h:471},
      sleep: {x:8,y:4666,w:653,h:342}, sniff: {x:8,y:5016,w:757,h:509},
      shake: {x:8,y:5533,w:644,h:520}
    },
    luna: {
      sit: {x:8,y:1968,w:428,h:582}, crouch: {x:8,y:4294,w:524,h:356},
      pounce: {x:8,y:3078,w:680,h:431}, paw: {x:444,y:1968,w:353,h:533},
      sleep: {x:8,y:6069,w:719,h:372}, groom: {x:8,y:6449,w:581,h:576},
      bellyUp: {x:8,y:7033,w:868,h:418}
    }
  };
  var updatedBoxes = JSON.parse(JSON.stringify(ORIGINAL_FRAMES));
  updatedBoxes.accessories = {};
  updatedBoxes.backyard = {};

  var compositeOps = [];
  for (var pi = 0; pi < packed.placements.length; pi++) {
    var p = packed.placements[pi];
    var sp = p.sprite;
    updatedBoxes[sp.category][sp.key] = { x: p.x, y: p.y, w: sp.width, h: sp.height };
    compositeOps.push({ input: sp.buffer, left: p.x, top: p.y });
  }

  // Composite
  console.log("\nCompositing...");
  var allOps = [{ input: keptBuf, left: 0, top: 0 }].concat(compositeOps);
  var result = await sharp({
    create: { width: ATLAS_WIDTH, height: packed.totalHeight, channels: 4, background: { r:0, g:0, b:0, alpha:0 } }
  }).composite(allOps).webp({ quality: 92 }).toBuffer();

  fs.writeFileSync(ATLAS_OUT, result);
  fs.writeFileSync(EXISTING_ATLAS, result);
  console.log("Atlas: " + ATLAS_WIDTH + "x" + packed.totalHeight + " (" + (result.length/1024).toFixed(1) + " KB)");

  var distAtlas = path.join(ROOT, "dist", "assets", "cozy-sprites-atlas.webp");
  if (fs.existsSync(path.dirname(distAtlas))) {
    fs.writeFileSync(distAtlas, result);
    console.log("Copied to dist/assets/");
  }

  // Output frame map
  var output = JSON.stringify(updatedBoxes, null, 6);
  fs.writeFileSync(path.join(ROOT, "sprite-frames-output.json"), output);
  console.log("\n=== FRAME MAP ===");
  for (var cc in updatedBoxes) {
    for (var kk in updatedBoxes[cc]) {
      var ff = updatedBoxes[cc][kk];
      console.log("  " + cc + "." + kk + ": " + ff.w + "x" + ff.h + " @(" + ff.x + "," + ff.y + ")");
    }
  }
  console.log("\nDone! " + newSprites.length + " sprites.");
}

main().catch(function(e) { console.error("FATAL:", e); process.exit(1); });
