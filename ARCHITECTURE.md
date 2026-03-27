# Annie's Cozy Day — Refactoring Architecture

## Current State

- **6,730 lines** in a single `<script>` tag inside one HTML file
- **94 top-level declarations** (functions, classes, constants) all scoped inside a single IIFE `(() => { ... })()`
- **9 scene classes** (Title, Hangout, 5 minigames, BaseScene, BaseMinigame)
- **HangoutScene alone is 1,807 lines** — larger than many entire games
- **~40 shared symbols** referenced across multiple files (W, H, COLORS, store, audio, game, clamp, drawAnnie, etc.)
- Assets: one 1.3MB sprite atlas (cozy-sprites-atlas.webp)

## The Core Problem

Everything runs inside a single IIFE. There are no modules, no imports. Every variable is a local binding in one giant closure. This works in production but makes development dangerous — any edit can see/break everything.

## Design Principles

1. **No ES modules.** The game must run from `file://` (double-click the HTML). ES modules require a web server. Instead, we use **concatenation** — all source files are plain JS that share scope within one IIFE at build time.

2. **No imports/exports in source files.** Each `.js` file is a fragment of the final script. It can reference any symbol defined in files that come before it in the concatenation order. This is exactly how the current single file works, just split across files.

3. **Scene registry to break circular dependencies.** Currently `TitleScene → new HangoutScene()`, `HangoutScene → new TitleScene()`, and `BaseMinigameScene → new HangoutScene()`. With separate files, these would create ordering problems. Solution: a `SceneRegistry` object where scenes register themselves, and navigation uses `transitionTo(SceneRegistry.create("hangout"))` instead of `transitionTo(new HangoutScene())`.

4. **Build produces a single HTML file + assets folder.** Annie's deliverable is always `annies-cozy-day/annies-cozy-day.html` + `annies-cozy-day/assets/`. Nothing changes about how she plays the game.

5. **Every source file must be safe to concatenate.** No file should wrap itself in an IIFE or declare `"use strict"` at the top level. No file should have side effects on load that depend on DOM readiness — only the final `main.js` does that (it runs inside the IIFE, which runs after the canvas element exists in the HTML).

---

## File Structure

```
annies-cozy-day/
├── assets/
│   └── cozy-sprites-atlas.webp          # sprite atlas (unchanged)
├── src/
│   ├── 01-constants.js                   #  ~80 lines
│   ├── 02-storage.js                     # ~120 lines
│   ├── 03-math-helpers.js                # ~120 lines
│   ├── 04-draw-helpers.js                # ~170 lines
│   ├── 05-audio.js                       # ~160 lines
│   ├── 06-game-state.js                  #  ~80 lines
│   ├── 07-particles.js                   #  ~80 lines
│   ├── 08-ui.js                          # ~170 lines
│   ├── 09-sprites.js                     # ~900 lines
│   ├── 10-backgrounds.js                 # ~700 lines
│   ├── 11-scene-base.js                  #  ~25 lines
│   ├── 12-scene-title.js                 # ~250 lines
│   ├── 13-scene-hangout.js               #  ~1,810 lines (will break down further later)
│   ├── 14-scene-minigame-base.js         # ~460 lines
│   ├── 15-scene-treat-toss.js            # ~255 lines
│   ├── 16-scene-laser-chase.js           # ~230 lines
│   ├── 17-scene-cuddle-pile.js           # ~360 lines
│   ├── 18-scene-obi-walk.js              # ~350 lines
│   ├── 19-scene-luna-nap.js              # ~270 lines
│   ├── 20-navigation.js                  #  ~50 lines
│   ├── 21-loop.js                        # ~100 lines
│   ├── 22-input.js                       #  ~100 lines
│   └── 23-main.js                        #  ~15 lines
├── template.html                         # HTML shell (head, CSS, canvas, script tags)
├── build.js                              # Node.js build script
└── ARCHITECTURE.md                       # this file
```

**Total: ~6,730 lines of JS across 23 files + HTML template + build script.**

---

## Concatenation Order and What Each File Contains

The numbering prefix (`01-`, `02-`, ...) defines the concatenation order. Each file can reference anything defined in files with a lower number.

### 01-constants.js (~80 lines)
```
canvas, ctx, W, H, STORE_PREFIX
COLORS object
ACHIEVEMENTS array
TITLE_SUBTITLES array
DECOR_ITEMS array
```
**Depends on:** nothing (except `document.getElementById("game")` which exists in the HTML above the script)
**Depended on by:** everything

### 02-storage.js (~120 lines)
```
sKey(), loadJSON(), saveJSON(), loadNumber(), saveNumber(), loadBool(), saveBool()
store object (all fields: muted, best_*, pet_*_joy, achievements, decor, firstVisit, etc.)
saveStats(), saveAchievements(), saveDecor(), setBest()
totalStarsEarned()
```
**Depends on:** `STORE_PREFIX`, `ACHIEVEMENTS` thresholds (from 01)
**Depended on by:** scenes, audio, game loop

### 03-math-helpers.js (~120 lines)
```
clamp(), lerp(), rand(), sign(), easeOutBack(), easeOutQuad()
dist(), pointInRect(), pointInCircle()
rr() (rounded rect path)
drawShadowEllipse()
```
**Depends on:** nothing
**Depended on by:** everything that draws

### 04-draw-helpers.js (~170 lines)
```
drawHeart(), drawStar(), drawBone(), drawGlowCircle()
wrapText()
```
**Depends on:** math helpers (03)
**Depended on by:** UI, sprites, scenes

### 05-audio.js (~160 lines)
```
class CozyAudio (all methods: menu, catch, miss, tinyChime, combo, etc.)
const audio = new CozyAudio()
const isMobile (navigator detection)
```
**Depends on:** `store.muted` (02)
**Depended on by:** scenes, input handlers

### 06-game-state.js (~80 lines)
```
const game = { time, last, scene, transition, mouse, keys, particles, ambient, etc. }
screenShake()
SceneRegistry object: { register(name, factory), create(name) }
```
**Depends on:** nothing
**Depended on by:** everything

**The SceneRegistry is the key architectural addition.** It looks like:
```js
const SceneRegistry = {
  _factories: {},
  register(name, factory) { this._factories[name] = factory; },
  create(name) {
    const factory = this._factories[name];
    if (!factory) throw new Error("Unknown scene: " + name);
    return factory();
  }
};
```
Scenes register themselves at the bottom of their file:
```js
// In 12-scene-title.js:
SceneRegistry.register("title", () => new TitleScene());
```
Navigation uses:
```js
transitionTo(SceneRegistry.create("hangout"));
```
This **completely eliminates circular dependencies** — no scene file needs to reference any other scene class directly.

### 07-particles.js (~80 lines)
```
spawnParticleBurst()
initAmbient()
updateSharedParticles()
drawSharedParticles()
```
**Depends on:** `game`, `W`, `H`, `COLORS`, `rand`, `clamp` (01, 03, 06)
**Depended on by:** scenes, loop

### 08-ui.js (~170 lines)
```
drawButton(), drawTooltip()
drawSpeakerIcon(), drawMuteIcon(), handleMuteClick()
drawBadgeIcon(), drawAchievementBanner()
```
**Depends on:** `W`, `H`, `COLORS`, `store`, `audio`, `game`, `rr`, `drawStar`, `drawHeart`, `drawBone`, `pointInRect` (01-06)
**Depended on by:** scenes

### 09-sprites.js (~900 lines)
```
SPRITE_ATLAS_URI, SPRITE_FRAME_BOXES, SPRITE_BASE_SCALE
const spriteArt = { ... }
makeBufferCanvas()
loadCozyArt()
drawZzz()
drawFrameImage(), drawUpperFrame()
drawAnnieSprite(), drawObiSprite(), drawLunaSprite()
normalizeState()
drawAnnie() — full function (procedural fallback + sprite dispatch)
drawObi() — full function
drawLuna() — full function
```
**Depends on:** `game`, `COLORS`, `W`, `H`, `rr`, `drawShadowEllipse`, `drawGlowCircle`, math helpers (01-04, 06)
**Depended on by:** backgrounds, all scenes

This is the largest non-scene file because each character's procedural fallback drawing is 150-300 lines. These could be split further in the future (e.g., `09a-sprite-system.js`, `09b-draw-annie.js`, `09c-draw-obi.js`, `09d-draw-luna.js`) but for the initial refactor, keeping them together avoids unnecessary file count.

### 10-backgrounds.js (~700 lines)
```
const sceneCache = Object.create(null)
buildStaticCaches() — builds titleBase, livingRoomBase, treatBase, laserBase
drawTitleBg()
drawLivingRoom() — including dynamic decoration rendering
drawTreatBackdrop(), drawLaserBackdrop()
drawAimPreview()
```
**Depends on:** `W`, `H`, `COLORS`, `store`, `game`, `rr`, `drawGlowCircle`, `makeBufferCanvas`, `sceneCache` (01-04, 09)
**Depended on by:** TitleScene, HangoutScene, CuddlePile, LunaNap, TreatToss, LaserChase

### 11-scene-base.js (~25 lines)
```
class BaseScene { constructor, enter, update, draw, onClick, onKeyDown, onMouseMove, interactiveAt, hoveredLabel }
```
**Depends on:** nothing (pure interface)
**Depended on by:** all scenes

### 12-scene-title.js (~250 lines)
```
class TitleScene extends BaseScene { ... }
SceneRegistry.register("title", () => new TitleScene())
```
**Depends on:** `BaseScene`, `W`, `H`, `COLORS`, `game`, `isMobile`, drawing fns, `spriteArt`, `drawAnnie`, `drawObi`, `drawLuna`, `drawTitleBg`, `transitionTo`, `SceneRegistry`, `TITLE_SUBTITLES`
**No direct reference to any other scene class** (uses `SceneRegistry.create("hangout")`)

### 13-scene-hangout.js (~1,810 lines)
```
class HangoutScene extends BaseScene { ... }
SceneRegistry.register("hangout", () => new HangoutScene())
```
**Depends on:** `BaseScene`, all drawing fns, `store`, `audio`, `game`, `DECOR_ITEMS`, `ACHIEVEMENTS`, helpers
**No direct reference to any other scene class** (uses `SceneRegistry.create(key)` for minigame launches and title return)

This is the largest single file and will remain so. It contains:
- Pet state and behavior (Obi, Luna, Annie)
- All hangout interaction modes (pet, treat, play, brush)
- Pet-to-pet interactions
- Thought bubbles
- Zone-based petting
- Games menu overlay
- Decoration panel overlay
- Dedication screen overlay
- Floating text system
- Full draw method

In Phase 2, when we add food/water bowls, moods, and room objects, this file will grow further. At that point we may want to extract subsystems:
- `13a-hangout-core.js` — constructor, update, draw shell
- `13b-hangout-pets.js` — pet state, interactions, idle behaviors
- `13c-hangout-ui.js` — menus, overlays, status bar
- `13d-hangout-interactions.js` — modes, treats, toys, brushing

But for now, keeping HangoutScene as one file matches the current code structure and avoids premature splitting.

### 14-scene-minigame-base.js (~460 lines)
```
class BaseMinigameScene extends BaseScene { ... }
```
**Depends on:** `BaseScene`, `W`, `H`, `COLORS`, `store`, `audio`, `game`, `isMobile`, UI fns, `ACHIEVEMENTS`, `transitionTo`, `SceneRegistry`
**No direct reference to any scene class** (uses `SceneRegistry.create("hangout")` for back/quit, `SceneRegistry.create(this.gameId)` for replay)

**Key change:** The `createReplay()` method currently has a hardcoded map:
```js
const map = { treat: TreatTossScene, laser: LaserChaseScene, ... };
return new map[this.gameId]();
```
This becomes:
```js
return SceneRegistry.create(this.gameId);
```
No map needed — the registry handles it.

### 15-scene-treat-toss.js through 19-scene-luna-nap.js
Each minigame scene in its own file. Each ends with:
```js
SceneRegistry.register("treat", () => new TreatTossScene());
```
**Dependencies:** BaseMinigameScene, drawing functions, game state. **No cross-scene references.**

### 20-navigation.js (~50 lines)
```
transitionTo()
currentScene()
blinkSignal(), earSignal()
maybeSparkle(), spawnTrail()
```
**Depends on:** `game`, `clamp`, `rand`, `COLORS`, `spawnParticleBurst` (01-07)
**Depended on by:** scenes (via `transitionTo`), loop

**Why is `transitionTo` here and not in 06-game-state.js?** Because `transitionTo` calls `scene.enter()` which requires `BaseScene` to be defined. Keeping it in file 20 (after all scenes) avoids any ordering issue. However, scenes reference `transitionTo` — this works because scenes are only *instantiated* at runtime (via user clicks), not at file-load time. By the time any scene constructor runs, file 20 has already been concatenated and `transitionTo` exists.

**Wait — this is subtle and critical.** Let me verify: Do any scene constructors call `transitionTo` during construction? No — `transitionTo` is only called inside `onClick`, `onKeyDown`, and `finishGame` methods, which are invoked long after all files are loaded. So the ordering is safe.

### 21-loop.js (~100 lines)
```
function loop(ts) { ... }
```
Contains the main requestAnimationFrame loop, screen shake, transition rendering, vignette, particle drawing.
**Depends on:** `game`, `ctx`, `W`, `H`, `clamp`, `updateSharedParticles`, `drawSharedParticles`, `drawMuteIcon`, `handleMuteClick`, `pointInRect`

### 22-input.js (~100 lines)
```
Mouse, touch, and keyboard event listeners on canvas/window.
touchCoords() helper.
```
**Depends on:** `canvas`, `game`, `audio`, `handleMuteClick`, `currentScene`

### 23-main.js (~15 lines)
```
buildStaticCaches();
loadCozyArt();
game.scene = SceneRegistry.create("hangout");
game.scene.enter();
requestAnimationFrame(loop);
```
This is the only file with side effects on load. Everything before it is pure declarations.

---

## Circular Dependency Solution: Complete Trace

**Before (broken ordering):**
```
TitleScene.onClick → new HangoutScene()     // TitleScene needs HangoutScene
HangoutScene.onClick → new TitleScene()     // HangoutScene needs TitleScene
BaseMinigameScene.onClick → new HangoutScene()  // BaseMinigame needs HangoutScene
```

**After (no circular deps):**
```
TitleScene.onClick → SceneRegistry.create("hangout")      // only needs SceneRegistry
HangoutScene.onClick → SceneRegistry.create("title")      // only needs SceneRegistry
BaseMinigameScene.onClick → SceneRegistry.create("hangout") // only needs SceneRegistry
```

`SceneRegistry` is defined in `06-game-state.js`. Scene factories are registered at the bottom of each scene file (`12-scene-title.js` etc.). By the time `23-main.js` runs, all factories are registered.

**Runtime flow:**
1. Files 01-22 concatenate and execute: all classes defined, all factories registered
2. File 23 runs: creates initial HangoutScene, starts loop
3. User clicks "Games" → `SceneRegistry.create("treat")` → `TreatTossScene` instantiated
4. User finishes game → `SceneRegistry.create("hangout")` → fresh `HangoutScene` instantiated

---

## Build System

### template.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Annie's Cozy Day</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap" rel="stylesheet">
  <style>
    /* ... existing CSS exactly as-is ... */
  </style>
</head>
<body>
  <div id="wrap">
    <canvas id="game" width="800" height="600" aria-label="Annie's Cozy Day game canvas"></canvas>
  </div>
  <script>
(() => {
{{GAME_SCRIPT}}
})();
  </script>
</body>
</html>
```

The `{{GAME_SCRIPT}}` placeholder is replaced by the concatenated JS.

### build.js
```js
const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "src");
const TEMPLATE = path.join(__dirname, "template.html");
const OUT_DIR = path.join(__dirname, "dist");
const OUT_FILE = path.join(OUT_DIR, "annies-cozy-day.html");
const ASSETS_SRC = path.join(__dirname, "assets");
const ASSETS_DST = path.join(OUT_DIR, "assets");

// Read all .js files in src/, sorted by filename (numeric prefix ensures order)
const srcFiles = fs.readdirSync(SRC_DIR)
  .filter(f => f.endsWith(".js"))
  .sort();

console.log("Concatenating", srcFiles.length, "source files...");

let script = "";
for (const file of srcFiles) {
  const content = fs.readFileSync(path.join(SRC_DIR, file), "utf8");
  script += "\n    // ═══ " + file + " ═══\n";
  script += content;
  script += "\n";
}

// Validate syntax
try {
  new Function(script);
  console.log("✓ Syntax OK (" + script.split("\n").length + " lines)");
} catch (e) {
  console.error("✗ SYNTAX ERROR:", e.message);
  process.exit(1);
}

// Build HTML
const template = fs.readFileSync(TEMPLATE, "utf8");
const html = template.replace("{{GAME_SCRIPT}}", script);

// Write output
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, html);
console.log("✓ Written:", OUT_FILE, "(" + html.split("\n").length + " lines)");

// Copy assets
fs.mkdirSync(ASSETS_DST, { recursive: true });
const assets = fs.readdirSync(ASSETS_SRC);
for (const asset of assets) {
  fs.copyFileSync(path.join(ASSETS_SRC, asset), path.join(ASSETS_DST, asset));
  console.log("✓ Copied asset:", asset);
}

console.log("\nBuild complete! Open dist/annies-cozy-day.html to play.");
```

### Build command
```bash
node build.js
```

### Output structure
```
dist/
  annies-cozy-day.html     # the single deliverable file
  assets/
    cozy-sprites-atlas.webp
```

---

## Validation Strategy

### During development (per-file)
Each source file can be syntax-checked individually:
```bash
node -e "new Function(require('fs').readFileSync('src/15-scene-treat-toss.js','utf8'))"
```
This won't catch reference errors (since files depend on each other) but catches syntax errors instantly.

### During build
The build script validates the concatenated JS with `new Function(script)` before writing the HTML. If any file has a syntax error, the build fails with a message.

### Post-build runtime test
```bash
node -e "
  // Mock browser globals
  global.window = { addEventListener: () => {} };
  global.document = { getElementById: () => ({ ... }), addEventListener: () => {}, hidden: false, createElement: () => ({ ... }) };
  // ... (same mock setup we've been using)
  const html = require('fs').readFileSync('dist/annies-cozy-day.html', 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  eval(script);
  console.log('RUNTIME OK');
"
```

---

## Migration Plan

### Step 1: Create project structure
Create `src/`, `template.html`, `build.js`. Copy `assets/`.

### Step 2: Extract files in dependency order
Starting from the current single-file game, extract each section into its numbered file. **Do not rewrite any logic** — this is a pure mechanical split. Every line of code goes into exactly one file, unchanged.

The extraction order matches the concatenation order:
1. Extract `01-constants.js` (lines 5-158 of the script)
2. Extract `02-storage.js` (lines 39-140)
3. Continue through all 23 files

### Step 3: Add SceneRegistry
Add the `SceneRegistry` object to `06-game-state.js`. Add `SceneRegistry.register(...)` calls to the bottom of each scene file. Replace all `new XyzScene()` calls in scene methods with `SceneRegistry.create("xyz")`.

### Step 4: Build and validate
Run `node build.js`. Verify the output HTML is functionally identical to the current single file by:
- Syntax check passes
- Runtime mock test passes
- Manual play test in browser (all 5 minigames, hangout interactions, decorations, dedication screen)

### Step 5: Verify asset reference
Confirm `dist/assets/cozy-sprites-atlas.webp` is copied and the relative path `assets/cozy-sprites-atlas.webp` in `SPRITE_ATLAS_URI` resolves correctly from `dist/annies-cozy-day.html`.

---

## Future Considerations

### Phase 1 additions (food/water, moods, room objects)
These will primarily touch `13-scene-hangout.js` and `02-storage.js`. When HangoutScene grows past ~2,500 lines, we split it into sub-files:
- `13a-hangout-core.js` — class shell, constructor, update/draw dispatch
- `13b-hangout-pets.js` — pet state machines, idle behaviors, interactions
- `13c-hangout-overlays.js` — games menu, decor panel, dedication screen
- `13d-hangout-care.js` — food/water bowls, mood system, room objects

These sub-files would use a mixin or prototype-extension pattern:
```js
// In 13a: define the class with core methods
class HangoutScene extends BaseScene { constructor() { ... } update(dt) { ... } draw(c) { ... } }

// In 13b: extend the prototype
HangoutScene.prototype.updateObi = function(dt) { ... };
HangoutScene.prototype.updateLuna = function(dt) { ... };
```

### New minigames
Each new minigame is a single new file (e.g., `24-scene-bath-time.js`) with its own `SceneRegistry.register()` call. No existing files need to change except adding a game card to the HangoutScene menu.

### New rooms (backyard, etc.)
Each room would be a new scene file + a new background in `10-backgrounds.js`. Navigation between rooms uses `SceneRegistry.create("backyard")`.

### Asset growth
If the game eventually needs multiple sprite atlases or additional image assets, `loadCozyArt()` in `09-sprites.js` can be extended to load multiple images. The `assets/` folder can hold any number of files.

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Accidentally missing a line during extraction | Diff the concatenated output against the original script; they must be byte-identical (minus comment headers) |
| Breaking the IIFE scope | Build script wraps everything in `(() => { ... })()` — same as current |
| SceneRegistry not having all scenes registered | Build script can grep for `SceneRegistry.register` calls and verify all expected scene names are present |
| Asset path changing | `SPRITE_ATLAS_URI` remains `"assets/cozy-sprites-atlas.webp"` — same relative path from HTML file |
| Concatenation order wrong | Numeric prefixes make order explicit and alphabetical sorting matches dependency order |
| Someone edits `dist/` directly instead of `src/` | Add a comment at the top of the built HTML: `<!-- GENERATED FILE — edit src/ files and run build.js -->` |
