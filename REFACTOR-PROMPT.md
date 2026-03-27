Read ARCHITECTURE.md thoroughly before doing anything. It contains the complete refactoring plan, file structure, dependency map, concatenation order, build system design, and circular dependency solution.

## Goal

Refactor the single-file game `annies-cozy-day.html` (6,730 lines) into 23 separate source files + an HTML template + a build script, without changing ANY game behavior. The built output must be functionally identical to the current single file.

## Rules

1. This is a MECHANICAL SPLIT — do not rewrite, refactor, rename, or "improve" any game logic. Every line of game code must end up in exactly one source file, unchanged, except for the SceneRegistry changes described below.
2. Do NOT use ES modules (import/export). The source files are plain JS fragments that share scope when concatenated inside one IIFE.
3. Do NOT add "use strict" or IIFE wrappers to individual source files.
4. Follow the file numbering and concatenation order specified in ARCHITECTURE.md exactly.
5. The only logic changes allowed are replacing `new XyzScene()` calls with `SceneRegistry.create("xyz")` calls, and adding `SceneRegistry.register(...)` at the bottom of each scene file.

## Step-by-step procedure

### Step 1: Create project structure

    mkdir -p src dist

### Step 2: Create template.html

Extract the HTML shell from `annies-cozy-day.html` — everything outside the `<script>` tag contents. The template should have a `{{GAME_SCRIPT}}` placeholder where the concatenated JS will go. The structure is:

    <!DOCTYPE html>
    <html lang="en">
    <head>
      <!-- copy exact head content from current file including CSS -->
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

### Step 3: Create build.js

Create the build script that concatenates all src/*.js files in alphabetical order (numeric prefixes control order), validates syntax, wraps in the HTML template, and copies assets to dist/. See ARCHITECTURE.md for the full build.js source. Key behaviors:

- Read all .js files from src/ sorted alphabetically
- Concatenate with comment headers between files
- Validate syntax with `new Function(script)`
- Replace `{{GAME_SCRIPT}}` in template.html with the concatenated script
- Write to dist/annies-cozy-day.html
- Copy assets/ to dist/assets/

### Step 4: Extract source files

Open `annies-cozy-day.html`, find the script tag content. The script is wrapped in `(() => { ... })();`. The IIFE wrapper is handled by template.html — do NOT include the IIFE wrapper in any source file. Extract only the code INSIDE the IIFE.

Use the declaration boundaries to split. Here is each file and what it contains:

**01-constants.js**: From `const canvas = document.getElementById("game")` through the closing `];` of `const DECOR_ITEMS`. This includes: canvas, ctx, W, H, STORE_PREFIX, COLORS, ACHIEVEMENTS, TITLE_SUBTITLES, DECOR_ITEMS.

**02-storage.js**: From `function sKey` through the closing `}` of `function totalStarsEarned`. This includes: sKey, loadJSON, saveJSON, loadNumber, saveNumber, loadBool, saveBool, the entire `const store = { ... }` object, saveStats, saveAchievements, saveDecor, setBest, totalStarsEarned.

**03-math-helpers.js**: From `function clamp` through the closing `}` of `function drawShadowEllipse`. This includes: clamp, lerp, rand, sign, easeOutBack, easeOutQuad, dist, pointInRect, pointInCircle, rr, drawShadowEllipse.

**04-draw-helpers.js**: From `function drawHeart` through the closing `}` of `function wrapText`. This includes: drawHeart, drawStar, drawBone, drawGlowCircle, wrapText.

**05-audio.js**: From `class CozyAudio` through `const isMobile = ...;`. This includes the entire CozyAudio class, `const audio = new CozyAudio()`, and `const isMobile`.

**06-game-state.js**: From `const game = {` through the closing `}` of `function screenShake`. PLUS add the SceneRegistry object at the end (see Step 5).

**07-particles.js**: From `function spawnParticleBurst` through the closing `}` of `function drawSharedParticles`. This includes: spawnParticleBurst, initAmbient, updateSharedParticles, drawSharedParticles.

**08-ui.js**: From `function drawButton` through the closing `}` of `function drawAchievementBanner`. This includes: drawButton, drawTooltip, drawSpeakerIcon, drawBadgeIcon, drawAchievementBanner.

**09-sprites.js**: From `const SPRITE_ATLAS_URI` through the closing `}` of `function drawLuna`. This is the largest non-scene file. It includes: SPRITE_ATLAS_URI, SPRITE_FRAME_BOXES, SPRITE_BASE_SCALE, spriteArt object, makeBufferCanvas, loadCozyArt, drawZzz, drawFrameImage, drawUpperFrame, drawAnnieSprite, drawObiSprite, drawLunaSprite, normalizeState, drawAnnie, drawObi, drawLuna.

**10-backgrounds.js**: From `const sceneCache` through the closing `}` of `function drawAimPreview`. This includes: sceneCache, buildStaticCaches, drawTitleBg, drawLivingRoom (with decoration rendering), drawTreatBackdrop, drawLaserBackdrop, drawAimPreview.

**11-scene-base.js**: The entire `class BaseScene { ... }` block.

**12-scene-title.js**: The entire `class TitleScene extends BaseScene { ... }` block. Add at the end: `SceneRegistry.register("title", () => new TitleScene());`

**13-scene-hangout.js**: The entire `class HangoutScene extends BaseScene { ... }` block. Add at the end: `SceneRegistry.register("hangout", () => new HangoutScene());`

**14-scene-minigame-base.js**: The entire `class BaseMinigameScene extends BaseScene { ... }` block.

**15-scene-treat-toss.js**: The entire `class TreatTossScene extends BaseMinigameScene { ... }` block. Add at the end: `SceneRegistry.register("treat", () => new TreatTossScene());`

**16-scene-laser-chase.js**: The entire `class LaserChaseScene extends BaseMinigameScene { ... }` block. Add at the end: `SceneRegistry.register("laser", () => new LaserChaseScene());`

**17-scene-cuddle-pile.js**: The entire `class CuddlePileScene extends BaseMinigameScene { ... }` block. Add at the end: `SceneRegistry.register("cuddle", () => new CuddlePileScene());`

**18-scene-obi-walk.js**: The entire `class ObiWalkScene extends BaseMinigameScene { ... }` block. Add at the end: `SceneRegistry.register("walk", () => new ObiWalkScene());`

**19-scene-luna-nap.js**: The entire `class LunaNapScene extends BaseMinigameScene { ... }` block. Add at the end: `SceneRegistry.register("nap", () => new LunaNapScene());`

**20-navigation.js**: The functions: transitionTo, currentScene, blinkSignal, earSignal, maybeSparkle, spawnTrail.

**21-loop.js**: The functions: drawMuteIcon, handleMuteClick, and the entire `function loop` (the main game loop including vignette rendering and screen shake).

**22-input.js**: All event listeners — the canvas.addEventListener and window.addEventListener calls for mousemove, mousedown, mouseup, mouseleave, click, touchstart, touchmove, touchend, keydown, keyup, and the document visibilitychange listener. Also the touchCoords helper function.

**23-main.js**: The startup code only:

    buildStaticCaches();
    loadCozyArt();
    game.scene = SceneRegistry.create("hangout");
    game.scene.enter();
    requestAnimationFrame(loop);

### Step 5: Add SceneRegistry to 06-game-state.js

At the end of 06-game-state.js, after the screenShake function, add:

    const SceneRegistry = {
      _factories: {},
      register(name, factory) { this._factories[name] = factory; },
      create(name) {
        const f = this._factories[name];
        if (!f) throw new Error("Unknown scene: " + name);
        return f();
      }
    };

### Step 6: Replace all direct scene instantiation

Search ALL source files for these patterns and replace them:

- `new TitleScene()` → `SceneRegistry.create("title")`
- `new HangoutScene()` → `SceneRegistry.create("hangout")`
- `new TreatTossScene()` → `SceneRegistry.create("treat")`
- `new LaserChaseScene()` → `SceneRegistry.create("laser")`
- `new CuddlePileScene()` → `SceneRegistry.create("cuddle")`
- `new ObiWalkScene()` → `SceneRegistry.create("walk")`
- `new LunaNapScene()` → `SceneRegistry.create("nap")`

IMPORTANT: Only replace instantiations inside scene methods (onClick, onKeyDown, createReplay, finishGame, etc.) and in 23-main.js. Do NOT replace:
- The class definition lines themselves (e.g., `class TitleScene extends BaseScene`)
- The factory functions inside SceneRegistry.register() calls (those MUST use `new`)

Also in 14-scene-minigame-base.js, replace the createReplay() method. The old version has a hardcoded map object — replace the entire method body with:

    createReplay() {
      return SceneRegistry.create(this.gameId);
    }

### Step 7: Build and validate

Run:

    node build.js

This must:
1. Report syntax OK with a line count close to the original (~6,700 lines of JS)
2. Copy the atlas to dist/assets/
3. Exit without errors

### Step 8: Runtime validation

Run this command to verify the built game initializes without errors:

    node -e "global.window={addEventListener:()=>{}};global.document={getElementById:()=>({getContext:()=>{const h={get:(t,p)=>{if(p==='canvas')return{width:800,height:600};if(p==='createLinearGradient'||p==='createRadialGradient')return(...a)=>({addColorStop:()=>{}});if(p==='measureText')return()=>({width:50});if(p==='setLineDash')return()=>{};return(...a)=>{};}};return new Proxy({},h);},width:800,height:600,style:{},addEventListener:()=>{},getBoundingClientRect:()=>({left:0,top:0,width:800,height:600})}),addEventListener:()=>{},hidden:false,createElement:()=>({width:0,height:0,getContext:()=>{const h={get:(t,p)=>{if(p==='canvas')return{width:800,height:600};if(p==='createLinearGradient'||p==='createRadialGradient')return(...a)=>({addColorStop:()=>{}});if(p==='measureText')return()=>({width:50});if(p==='setLineDash')return()=>{};return(...a)=>{};}};return new Proxy({},h);}})};global.navigator={userAgent:'node'};global.localStorage={getItem:()=>null,setItem:()=>{}};global.requestAnimationFrame=()=>{};global.Image=class{set src(v){}};global.AudioContext=class{createOscillator(){return{connect:()=>{},start:()=>{},stop:()=>{},frequency:{setValueAtTime:()=>{},exponentialRampToValueAtTime:()=>{}}}}createGain(){return{connect:()=>{},gain:{setValueAtTime:()=>{},linearRampToValueAtTime:()=>{},exponentialRampToValueAtTime:()=>{}}}}get destination(){return{}}get currentTime(){return 0}};global.webkitAudioContext=global.AudioContext;const fs=require('fs');const html=fs.readFileSync('dist/annies-cozy-day.html','utf8');const s=html.match(/<script>([\s\S]*?)<\/script>/);try{eval(s[1]);console.log('RUNTIME OK');}catch(e){console.log('RUNTIME ERROR:',e.message);console.log(e.stack.split('\n').slice(0,5).join('\n'));}"

### Step 9: Verify SceneRegistry completeness

Run:

    grep -r "SceneRegistry.register" src/ | sort

Expected: 7 registrations (title, hangout, treat, laser, cuddle, walk, nap).

Then run:

    grep -rn "new.*Scene()" src/ | grep -v "SceneRegistry\|class \|register"

This MUST return NO results. Any remaining `new XyzScene()` calls outside of register() factories need to be converted to SceneRegistry.create() calls.

### Step 10: Verify no code was lost

Run:

    node -e "const orig=require('fs').readFileSync('annies-cozy-day.html','utf8');const built=require('fs').readFileSync('dist/annies-cozy-day.html','utf8');const c=s=>{const f=(s.match(/function \w+/g)||[]).length;const cl=(s.match(/class \w+/g)||[]).length;return{functions:f,classes:cl}};console.log('Original:',c(orig));console.log('Built:',c(built));"

Function and class counts must match exactly (the built version will have the same count since SceneRegistry is an object, not a class).

## Summary

After all steps complete successfully, the repo should contain:
- src/ with 23 .js files
- template.html
- build.js
- assets/cozy-sprites-atlas.webp
- dist/annies-cozy-day.html (built output)
- dist/assets/cozy-sprites-atlas.webp (copied)
- ARCHITECTURE.md (reference documentation)

The dist/ output is the deliverable. It must work identically to the original annies-cozy-day.html when opened in a browser with the assets/ folder alongside it.
