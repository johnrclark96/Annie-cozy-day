# Phase 2 Implementation Spec — Annie's Cozy Day

> **IMPORTANT: Read this entire document before writing any code.** This is a cozy browser-based HTML5 canvas game (800×600). It runs as a single HTML file from `file://` — no ES modules, no server. Source files in `src/` are plain JS fragments concatenated by `node build.js` into a single IIFE. Each file can reference symbols from files with lower numeric prefixes. After every set of changes, run `node build.js` to verify syntax.

---

## Architecture Quick Reference

- **Canvas:** 800×600, id="game", context `ctx`
- **Constants:** `W=800, H=600, COLORS, ACHIEVEMENTS, DECOR_ITEMS`
- **State:** `store` object with localStorage persistence via `loadJSON/saveJSON/loadNumber/saveNumber/loadBool/saveBool`
- **Game loop:** `game` object (time, mouse, particles, scene, transition), `loop()` in 21-loop.js
- **Scenes:** `BaseScene` → `TitleScene`, `HangoutScene`, `BaseMinigameScene` → 5 minigame scenes
- **Scene transitions:** `transitionTo(SceneRegistry.create("name"))` — 0.6s crossfade
- **Sprites:** Atlas at `assets/cozy-sprites-atlas.webp`, frame coords in `SPRITE_FRAME_BOXES`, rendered via `drawFrameImage()`. Procedural fallbacks if atlas fails.
- **No file should wrap itself in an IIFE or use `"use strict"`**
- **Build:** `node build.js` concatenates all `src/*.js` sorted alphabetically, validates syntax, writes `dist/annies-cozy-day.html`

### Existing Minigame Pattern

Every minigame extends `BaseMinigameScene` which handles:
- Constructor: `super(gameId, title, instruction, thresholds, duration)`
- Phase flow: instructions(3s) → countdown(4s) → play → ending(1.2s) → results
- Required overrides: `updatePlay(dt)`, `drawScene(c)`, `drawInstructionIcon(c,x,y)`, `drawResultCharacter(c)`
- Optional: `onGameClick(x,y)`, `extraInteractiveAt(x,y)`, `onKeyDown(key)`, `drawEndingOverlay(c)`
- HUD, pause, results, replay, achievements all handled by base class
- Registration: `SceneRegistry.register("gameId", () => new MyScene())`

### Key Helper Functions Available
- `clamp(v,lo,hi)`, `lerp(a,b,t)`, `rand(lo,hi)`, `dist(x1,y1,x2,y2)`, `pointInRect(px,py,rect)`
- `easeOutBack(t)`, `easeOutQuad(t)`
- `rr(c,x,y,w,h,r)` — creates rounded rect PATH (does NOT fill/stroke)
- `drawHeart(c,x,y,s,color)`, `drawStar(c,x,y,size,color)`, `drawBone(c,x,y,w,h,color)`
- `drawGlowCircle(c,x,y,r,colorTemplate,alpha)` — colorTemplate has "ALPHA" placeholder
- `drawButton(c,rect,label,hovered,fill,textColor)`
- `drawTooltip(c,x,y,title,body,alpha)`
- `spawnParticleBurst(x,y,colors,count,shapes)`
- `screenShake(intensity,duration)`
- `blinkSignal(t,offset)`, `earSignal(t)`
- `audio.menu()`, `audio.catch()`, `audio.miss()`, `audio.combo()`, `audio.tinyChime()`, `audio.pounce()`, `audio.targetHit()`, `audio.achievement()`
- `const isMobile` — true on mobile devices

### Sprite Frames Available (new, from atlas processing)
These frames exist in `SPRITE_FRAME_BOXES` but are NOT yet mapped in the `drawObiSprite`/`drawLunaSprite` pose-to-frame logic:
- `obi.eat`, `obi.drink`, `obi.carryToy`, `obi.bath`
- `luna.eat`, `luna.drink`, `luna.stretch`, `luna.bath`
- `items.foodBowl`, `items.waterBowl`, `items.giftBox`, `items.dogTreats`, `items.catTreats`

---

## PREREQUISITE: Phase 1 Assumed Complete

This spec assumes Phase 1 is already implemented. Phase 1 added:
- Food/water bowls (clickable room objects with fill state, time-based depletion)
- Reworked request system (tiered rewards: exact/related/unrelated/expired)
- Mood system (`petMood()` returns "hungry"/"thirsty"/"sleepy"/"playful"/"cuddly")
- Clickable lamp toggle + toy basket
- Daily gift system
- 3 room style presets (Cozy Neutral / Pastel Cute / Warm Cottage)
- Store keys: `pet_food_fill`, `pet_food_lastFill`, `pet_water_fill`, `pet_water_lastFill`, `lastVisitDate`
- Decor keys: `lampOn`, `roomPreset`
- `rewardPet()` accepts source types: `"pet"`, `"treat"`, `"toy"`, `"brush"`, `"feed"`, `"water"`
- Thought bubble wants include `"food"` and `"water"`

If Phase 1 is NOT complete when you start, implement Phase 1 first following PHASE-1-SPEC.md.

---

## Feature 1: New Idle Animations (Luna Stretch + Obi CarryToy)

### 1a. Sprite Mappings (09-sprites.js)

In `drawObiSprite()`, after the `else if (pose === "shake")` line, add:
```js
else if (pose === "eat") frame = frames.eat;
else if (pose === "drink") frame = frames.drink;
else if (pose === "carryToy") frame = frames.carryToy;
else if (pose === "bath") frame = frames.bath;
```

In `drawLunaSprite()`, after the `else if (pose === "bellyUp")` line, add:
```js
else if (pose === "stretch") frame = frames.stretch;
else if (pose === "eat") frame = frames.eat;
else if (pose === "drink") frame = frames.drink;
else if (pose === "bath") frame = frames.bath;
```

### 1b. Luna Stretch Behavior (13-scene-hangout.js)

Add `stretching: false` to Luna's constructor state.

In `updateLuna()`, inside the idle floor behavior timer block (where it picks groom/bellyUp/sit), add a stretch option:
```js
// After the bellyUp check (r < 0.55 block), add:
else if (r < 0.7 && !this.luna.stretching) {
  this.luna.stretching = true;
  this.luna.grooming = false;
  this.luna.bellyUp = false;
  this.luna.idleBehaviorTimer = rand(1.5, 3);
  const msgs = ["Luna does a big stretch.", "Luna stretches out. Very yoga.", "Luna reaches way out with a yawn."];
  this.statusText = msgs[Math.floor(Math.random() * msgs.length)];
}
```

Reset `stretching = false` wherever grooming/bellyUp are reset. In `petSpriteState` for Luna, add:
```js
const lunaPose = this.luna.stretching ? "stretch" : this.luna.bellyUp ? "bellyUp" : ...
```

### 1c. Obi CarryToy Behavior (13-scene-hangout.js)

Add `carryingToy: false, carryTimer: 0` to Obi's constructor state.

In `updateObi()`, when idle and not sniffing/sleeping/busy, add:
```js
if (this.obi.joy > 60 && !this.obi.carryingToy && !this.obi.sniffing && !this.obi.sleepy && Math.random() < dt * 0.015) {
  this.obi.carryingToy = true;
  this.obi.carryTimer = rand(3, 6);
  this.obi.targetX = rand(120, 360);
  this.obi.targetY = this.obi.homeY;
  this.statusText = "Obi picked up his favorite bone!";
}
if (this.obi.carryingToy) {
  this.obi.carryTimer -= dt;
  if (this.obi.carryTimer <= 0 || dist(this.obi.x, this.obi.y, this.obi.targetX, this.obi.homeY) < 14) {
    this.obi.carryingToy = false;
    this.obi.targetX = this.obi.homeX;
    this.obi.targetY = this.obi.homeY;
    this.statusText = "Obi dropped the bone and wagged his tail.";
    spawnParticleBurst(this.obi.x, this.obi.y - 20, [COLORS.softPink], 3, ["heart"]);
  }
}
```

In `petSpriteState` for Obi, add carryToy pose:
```js
if (this.obi.carryingToy) pose = "carryToy";
```
Place this BEFORE the existing shake/sleeping/sniff checks since carry takes visual priority during movement.

---

## Feature 2: Luna Furniture Perch Points (13-scene-hangout.js)

Replace `luna.onTower` boolean with `luna.perch` string. Values: `"floor"`, `"tower"`, `"couch"`, `"window"`.

### Perch Positions
```js
const LUNA_PERCHES = {
  tower:  { x: 694, y: 258 },
  couch:  { x: 402, y: 256 },
  window: { x: 126, y: 200 },
  floor:  { x: 598, y: 430 }
};
```

### Migration
Every reference to `this.luna.onTower` must be updated:
- `this.luna.onTower = true` → `this.luna.perch = "tower"` (or "couch" or "window")
- `this.luna.onTower = false` → `this.luna.perch = "floor"`
- `this.luna.onTower` (boolean check) → `this.luna.perch !== "floor"`
- `this.luna.perchX` / `this.luna.perchY` → `LUNA_PERCHES[this.luna.perch].x` / `.y`

### Perch Selection
In `updateLuna()`, when idle and retreating to a perch (currently always picks tower), randomize:
```js
const r = Math.random();
if (r < 0.5) this.luna.perch = "tower";
else if (r < 0.75) this.luna.perch = "couch";
else this.luna.perch = "window";
```

When an ambient event is active (butterfly/bird/rain at window), Luna prefers the window sill perch.

### Draw Y Adjustment
Luna's draw Y must use the active perch Y instead of hardcoded tower Y:
```js
// In draw():
const lunaDrawY = this.luna.perch !== "floor" ? LUNA_PERCHES[this.luna.perch].y : this.luna.y;
drawLuna(c, this.luna.x, lunaDrawY, ...);
```

Scale Luna slightly smaller on couch/window (0.92) vs tower (1.06) since those perches are smaller.

---

## Feature 3: Time-of-Day Toggle

### Storage
Add to decor defaults: `timeOfDay: 1` (0=morning, 1=daytime, 2=evening, 3=nighttime)

Add to DECOR_ITEMS:
```js
{ key: "timeOfDay", name: "Time of Day", desc: "Change the lighting and atmosphere", stars: 0, type: "cycle", max: 3, labels: ["Morning", "Daytime", "Evening", "Nighttime"] }
```

### Window Sky (10-backgrounds.js → drawLivingRoom)

Replace the current animated window sky section (the clip region drawing clouds) with time-aware rendering:

```js
const tod = store.decor.timeOfDay || 1;
c.save();
c.beginPath();
rr(c, 66, 52, 120, 152, 5);
c.clip();

if (tod === 0) {
  // Morning: pink-gold sunrise
  const skyG = c.createLinearGradient(66, 52, 66, 204);
  skyG.addColorStop(0, "#FFB088");
  skyG.addColorStop(0.5, "#FFCDA8");
  skyG.addColorStop(1, "#FFE8C8");
  c.fillStyle = skyG;
  c.fillRect(66, 52, 120, 152);
} else if (tod === 2) {
  // Evening: orange-purple sunset
  const skyG = c.createLinearGradient(66, 52, 66, 204);
  skyG.addColorStop(0, "#C87848");
  skyG.addColorStop(0.4, "#D89060");
  skyG.addColorStop(1, "#A87098");
  c.fillStyle = skyG;
  c.fillRect(66, 52, 120, 152);
} else if (tod === 3) {
  // Nighttime: dark blue with stars
  c.fillStyle = "#1A1E38";
  c.fillRect(66, 52, 120, 152);
  // Stars
  c.fillStyle = "#FFFFFF";
  const starPositions = [[82,68],[110,72],[140,60],[95,90],[160,80],[130,100],[75,110],[150,95],[108,118],[170,65]];
  for (const [sx,sy] of starPositions) {
    c.globalAlpha = 0.4 + Math.sin(game.time * 1.5 + sx * 0.1) * 0.3;
    c.beginPath(); c.arc(sx, sy, 1.2, 0, Math.PI * 2); c.fill();
  }
  c.globalAlpha = 1;
  // Moon
  c.fillStyle = "#E8E4D8";
  c.beginPath(); c.arc(155, 72, 12, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#1A1E38";
  c.beginPath(); c.arc(160, 68, 10, 0, Math.PI * 2); c.fill();
} else {
  // Daytime: keep existing animated sky + clouds code
  // (copy existing sky gradient + cloud drawing here)
}
c.restore();
```

### Room Lighting Overlay (10-backgrounds.js → drawLivingRoom)

After drawing the static cache and window, apply a room-wide tint based on time-of-day:

```js
if (tod === 0) {
  // Morning: warm golden wash
  c.save(); c.globalAlpha = 0.06;
  c.fillStyle = "#FFE0A0"; c.fillRect(0, 0, W, H);
  c.restore();
} else if (tod === 2) {
  // Evening: amber tint, brighter lamp
  c.save(); c.globalAlpha = 0.08;
  c.fillStyle = "#E8A050"; c.fillRect(0, 0, W, H);
  c.restore();
} else if (tod === 3) {
  // Nighttime: dark blue overlay, lamp is primary light
  c.save(); c.globalAlpha = 0.22;
  c.fillStyle = "#141828"; c.fillRect(0, 0, W, H);
  c.restore();
  // Stronger lamp glow if lamp is on
  if (store.decor.lampOn !== false) {
    drawGlowCircle(c, 126, 160, 180, "rgba(255,220,140,ALPHA)", 0.16);
  }
}
```

### Lamp Glow Adjustment
The existing lamp glow flicker should be stronger at evening/night and softer at morning:
```js
const todMult = tod === 3 ? 1.6 : tod === 2 ? 1.3 : tod === 0 ? 0.7 : 1.0;
const lampFlicker = (0.08 + 0.025 * Math.sin(game.time * 1.2) + ...) * todMult;
```

### Cache invalidation
When timeOfDay changes in the decor panel handler, no static cache invalidation needed since all time-of-day effects are dynamic overlays.

---

## Feature 4: Two More Room Presets

Update the existing `roomPreset` DECOR_ITEM (from Phase 1) — change `max: 2` to `max: 4` and update labels:
```js
{ key: "roomPreset", name: "Room Style", desc: "Change the room's color palette", stars: 0, type: "cycle", max: 4,
  labels: ["Cozy Neutral", "Pastel Cute", "Warm Cottage", "Moonlight Blue", "Bookish Cozy"] }
```

In `drawLivingRoom()`, add cases for presets 3 and 4 in the tint overlay:
```js
} else if (store.decor.roomPreset === 3) {
  // Moonlight Blue
  c.save(); c.globalCompositeOperation = "multiply";
  c.fillStyle = "rgba(200,215,240,0.15)"; c.fillRect(0, 0, W, 340);
  c.fillStyle = "rgba(190,200,220,0.12)"; c.fillRect(0, 340, W, H - 340);
  c.restore();
} else if (store.decor.roomPreset === 4) {
  // Bookish Cozy
  c.save(); c.globalCompositeOperation = "multiply";
  c.fillStyle = "rgba(230,215,195,0.16)"; c.fillRect(0, 0, W, 340);
  c.fillStyle = "rgba(220,200,175,0.12)"; c.fillRect(0, 340, W, H - 340);
  c.restore();
}
```

---

## Feature 5: Care Streaks

### Storage (02-storage.js)
Add to store:
```js
careStreak: loadJSON("careStreak", { count: 0, lastCareDate: null, todayActions: [], bestStreak: 0, milestonesClaimed: [] }),
```

Add helper:
```js
function saveCareStreak() { saveJSON("careStreak", store.careStreak); }
```

### Recording Actions (13-scene-hangout.js)

Add method to HangoutScene:
```js
recordCareAction(actionType) {
  const today = new Date().toDateString();
  const streak = store.careStreak;
  if (streak.lastCareDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (streak.lastCareDate === yesterday.toDateString()) {
      streak.count++;
    } else {
      streak.count = streak.lastCareDate === null ? 1 : 1;
    }
    streak.lastCareDate = today;
    streak.todayActions = [];
    streak.bestStreak = Math.max(streak.bestStreak, streak.count);
  }
  if (!streak.todayActions.includes(actionType)) {
    streak.todayActions.push(actionType);
  }
  saveCareStreak();
}
```

Call `this.recordCareAction(source)` inside `rewardPet()` (for "pet", "treat", "toy", "brush", "feed", "water"). Also call `this.recordCareAction("game")` in `enter()` when returning from a minigame (detect by checking if the previous scene was a minigame).

### Milestones (13-scene-hangout.js → enter())

```js
// In enter(), after existing checks:
const streak = store.careStreak;
const milestones = [
  { days: 3, reward: () => { this.obi.joy = clamp(this.obi.joy + 10, 0, 100); this.luna.joy = clamp(this.luna.joy + 10, 0, 100); }, text: "3-day care streak! Both pets are thrilled!" },
  { days: 7, reward: () => { store.decor.cozyBlanket = true; saveDecor(); }, text: "7-day streak! You earned the Cozy Blanket!" },
  { days: 14, reward: () => { this.obi.joy = clamp(this.obi.joy + 15, 0, 100); this.luna.joy = clamp(this.luna.joy + 15, 0, 100); if (this.foodBowl) this.foodBowl.fill = 100; if (this.waterBowl) this.waterBowl.fill = 100; }, text: "2-week streak! You're an amazing pet parent!" },
  { days: 30, reward: () => { store.decor.photoWall = true; saveDecor(); }, text: "30-day streak! A whole month of care!" }
];
for (const m of milestones) {
  if (streak.count >= m.days && !streak.milestonesClaimed.includes(m.days)) {
    streak.milestonesClaimed.push(m.days);
    saveCareStreak();
    m.reward();
    this.decorNotification = { text: m.text, timer: 5 };
  }
}
```

### HUD Display (13-scene-hangout.js → draw())

After the existing star counter pill, draw a streak pill if count > 0:
```js
if (store.careStreak.count > 0) {
  const sk = store.careStreak;
  c.save();
  const streakColor = sk.count >= 7 ? "rgba(255,215,0,0.75)" : sk.count >= 3 ? "rgba(230,140,50,0.75)" : "rgba(180,160,140,0.65)";
  rr(c, 527, 34, 68, 20, 10);
  c.fillStyle = streakColor;
  c.fill();
  c.fillStyle = "#FFF8F0";
  c.font = '11px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
  c.textAlign = "center";
  // Draw tiny flame icon procedurally
  c.fillStyle = "#FF6B35";
  c.beginPath(); c.arc(541, 43, 4, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#FFD700";
  c.beginPath(); c.arc(541, 41, 2.5, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#FFF8F0";
  c.fillText(sk.count + "d", 571, 48);
  c.restore();
}
```

---

## Feature 6: Favorite Items System (13-scene-hangout.js)

### Favorite Selection
Add as a module-level function (or inside HangoutScene):
```js
function getCurrentFavorite(pet) {
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const seed = pet === "obi" ? weekNumber * 3 : weekNumber * 7 + 2;
  const favorites = pet === "obi"
    ? ["belly", "treats", "ball", "brushing"]
    : ["chin", "yarn", "brushing", "sunbeam"];
  return favorites[seed % favorites.length];
}
```

### Constructor State
```js
this.favDiscovered = { obi: false, luna: false };
```

### Detection in rewardPet()
After the base reward and existing bubble/milestone checks, add:
```js
const fav = getCurrentFavorite(key);
const isFavAction =
  (fav === "belly" && source === "pet") ||
  (fav === "treats" && source === "treat") ||
  (fav === "ball" && source === "toy") ||
  (fav === "brushing" && source === "brush") ||
  (fav === "chin" && source === "pet") ||
  (fav === "yarn" && source === "toy") ||
  (fav === "sunbeam"); // always true during sunbeam week

if (isFavAction) {
  const bonus = fav === "sunbeam" ? 3 : 5;
  pet.joy = clamp(pet.joy + bonus, 0, 100);
  if (!this.favDiscovered[key]) {
    this.favDiscovered[key] = true;
    this.addFloatingText("Favorite!", px, py - 20, "#FF69B4");
    spawnParticleBurst(px, py - 10, ["#FF69B4", COLORS.gold, "#FFF4C0"], 10, ["heart", "star"]);
    audio.combo();
    this.statusText = this.petName(key) + "'s favorite thing this week!";
  } else {
    spawnParticleBurst(px, py - 10, ["#FF69B4"], 3, ["heart"]);
  }
}
```

### Idle Hints
In `updateObi()` and `updateLuna()`, when idle > 5s, add subtle status messages based on current favorite. These should be infrequent (`Math.random() < dt * 0.02`).

---

## Feature 7: Bath Time Minigame

### New File: `src/15b-scene-bath-time.js`

Create this as a complete new scene file. Key specs:

- **gameId:** `"bath"`
- **Title:** `"Bath Time"`
- **Duration:** 45 seconds
- **Thresholds:** `[80, 200, 400]`
- **Instruction:** `"Scrub, rinse, and dry each pet! [Click/Tap] and drag to scrub!"`

### Gameplay Flow
1. Obi is in the tub first
2. Three wash phases per pet: **scrub** → **rinse** → **dry**
3. After completing all 3 phases for Obi, 1.5s transition, then Luna
4. Completing both pets within the time limit gives a combo bonus

### Phase Mechanics

**Scrub:** Player holds mouse button and drags over pet. A `cleanMeter` fills from 0→100. Rate: `+dt * 35` per frame while cursor is over pet hitbox and mouse is down. Spawn soap bubbles (local array, not global particles) at cursor position. When cleanMeter ≥ 100, phase completes.

**Rinse:** Player clicks on/near the tub area. Each click counts as a water pour. Need 5 pours. Each pour spawns blue particles from the top and removes some bubbles. Pet shakes briefly (shakeTimer = 0.3).

**Dry:** Player holds mouse button and drags over pet (like scrub). A `dryMeter` fills 0→100 at rate `+dt * 30`. When ≥ 100, phase completes.

### Scoring
```
Per phase completed: 35 base points
Speed bonus: max(0, round(15 - phaseTime * 1.5)) per phase
Continuous scrub scoring: +0.5 per frame while actively scrubbing (like Luna's Nap Spot)
Both-pets-done combo bonus: +40
Max theoretical: ~430+ (reachable with fast play)
```

### Background
Draw a bathroom scene procedurally:
- Light blue-gray tiled wall (top 60%), white tile floor (bottom 40%)
- Tile grid lines (subtle, `rgba(..., 0.3)`)
- Central metal tub at (400, 420) — ellipse with metallic gradient
- Water surface inside tub — semi-transparent blue ellipse
- Shelf with bottles on the wall (decorative)

### Pet Rendering
Use `drawObi(c, 400, 390, 1.1, { pose: "bath", ... })` or `drawLuna(...)` with bath pose. Add bounce when shaking.

### Bubbles (local, not global particles)
```js
this.bubbles = [];
// Each: { x, y, size: rand(4,10), life: rand(2,4), vy: rand(-8,-3) }
// Spawn at cursor when scrubbing
// Update: y += vy * dt, life -= dt, remove when life <= 0
// Draw: iridescent circles (radial gradient white→light blue→transparent)
// Remove proportionally during rinse clicks
```

### Achievement
```js
{ key: "squeakyClean", name: "Squeaky Clean", desc: "Score 200+ in Bath Time.", color: "#87CEEB", icon: "heart" }
```

### Results Character
Draw both Obi and Luna sitting side by side, both happy.

### Registration
```js
SceneRegistry.register("bath", () => new BathTimeScene());
```

---

## Feature 8: Snack Sort Minigame

### New File: `src/15c-scene-snack-sort.js`

- **gameId:** `"sort"`
- **Title:** `"Snack Sort"`
- **Duration:** 60 seconds
- **Thresholds:** `[150, 350, 700]`
- **Instruction:** `"Sort the treats! Drag dog treats LEFT to Obi, cat treats RIGHT to Luna!"`

### Gameplay
Treats fall from the top of the screen. Player clicks a treat to grab it, drags it left (Obi) or right (Luna), and releases. Dog treats go left, cat treats go right.

### Screen Layout
- Vertical center divider (dashed line)
- Obi sitting on left (x~150, y~480), Luna on right (x~650, y~470)
- Bowls at bottom: left bowl for dog treats, right bowl for cat treats
- Labels: "← Dog Treats" and "Cat Treats →"

### Treat Objects
```js
{
  x, y,                    // position
  vy: rand(40, 70),        // fall speed
  type: "dog" | "cat",     // determines correct side
  subtype: "bone"|"round"|"training"|"fish"|"roundCat"|"premium",
  points: 10 | 15,         // premium subtypes worth 15
  dragging: false,
  settled: false,
  settleTimer: 0.5
}
```

Spawn rate: starts at every 1.8s, decreases to every 0.6s by end. Fall speed multiplier increases with elapsed time.

### Drag-and-Drop

**Pick up:** `onGameClick(x,y)` — find nearest treat within 32px, set `dragging = true`, store reference.

**Move:** Override `onMouseMove(x,y)` — if dragging, update treat position to cursor.

**Drop:** In `updatePlay(dt)`, detect `!game.mouse.down` while dragging:
```js
if (this.dragging && !game.mouse.down) {
  this.dropTreat();
}
```

**Drop logic:**
```js
dropTreat() {
  const t = this.dragging;
  t.dragging = false;
  this.dragging = null;
  
  if (t.y < 350) {
    // Dropped too high — return to falling
    t.vy = 60;
    return;
  }
  
  const obiSide = t.x < W / 2;
  const correct = (t.type === "dog" && obiSide) || (t.type === "cat" && !obiSide);
  
  if (correct) {
    this.addScore(t.points * this.combo);
    this.combo++;
    this.correctStreak++;
    t.settled = true; t.settleTimer = 0.5;
    spawnParticleBurst(obiSide ? 150 : 650, 450, [COLORS.gold, COLORS.softPink], 8, ["star", "heart"]);
    audio.catch();
    if (obiSide) this.obiHappy = 0.5; else this.lunaHappy = 0.5;
    if (this.correctStreak >= 10) this.queueAchievement("sortingPro");
  } else {
    // WRONG bowl
    this.addScore(-5);
    this.combo = 1;
    // NOTE: Do NOT reset correctStreak on wrong sort — only reset on wrong sort
    this.correctStreak = 0;
    this.wrongFlash = 1;
    t.settled = true; t.settleTimer = 0.3;
    audio.miss();
    screenShake(2, 0.1);
  }
}
```

**IMPORTANT:** When treats passively fall off the bottom, reset `this.combo = 1` but do NOT reset `this.correctStreak`. Only active wrong-sorts reset the streak (the achievement "10 correct in a row" should not be ruined by passively missed treats while the player is dragging).

### Treat Drawing
Draw treats procedurally:
- **bone:** `drawBone(c, 0, 0, 20, 10, "#D4A44C")`
- **round (dog):** brown circle 10px radius with lighter spot
- **training:** small tan rounded rect
- **fish:** salmon-pink ellipse with triangle tail
- **roundCat:** pink-brown circle 9px
- **premium:** salmon rounded rect with lighter spot

### Achievement
```js
{ key: "sortingPro", name: "Sorting Pro", desc: "Sort 10 treats correctly in a row.", color: "#E8A84C", icon: "star" }
```

### Registration
```js
SceneRegistry.register("sort", () => new SnackSortScene());
```

---

## Feature 9: Ambient Visitor Events (13-scene-hangout.js)

### State
```js
// In constructor:
this.ambientEvent = null;   // { type, timer, data }
this.ambientEventCooldown = rand(60, 180);
```

### Update (add call in update() method)
```js
updateAmbientEvents(dt) {
  if (this.ambientEvent) {
    this.ambientEvent.timer -= dt;
    // Type-specific updates...
    if (this.ambientEvent.timer <= 0) {
      this.ambientEvent = null;
      this.ambientEventCooldown = rand(120, 300);
    }
    return;
  }
  this.ambientEventCooldown -= dt;
  if (this.ambientEventCooldown <= 0) {
    const r = Math.random();
    if (r < 0.35) this.spawnButterflyEvent();
    else if (r < 0.6) this.spawnBirdEvent();
    else if (r < 0.85) this.spawnRainEvent();
    else this.spawnPackageEvent();
  }
}
```

### Event Types

**Butterflies** (12–18s): 1–3 butterflies flutter in the window area. Draw as two small ellipse wings that flap (sine wave on rotation). Luna perks up.

**Birds** (8–14s): 1–2 birds on the window sill (y≈206). Simple circle body + triangle beak, occasional head tilt + hop. Obi perks up.

**Rain** (30–60s): 25 raindrop streaks inside window clip region. Sky darkens. Both pets react — Obi lies down, Luna watches.

**Package Delivery** (10–15s): A small brown box appears at x~740, y~458. Doorbell sound (`audio.tone(440, 0.15)` then `audio.tone(330, 0.2, 0.12, "sine", null, 0.18)`). Both pets look toward it. Fades with sparkles.

### Drawing
Draw ambient events in `draw()` after `drawLivingRoom()` but before character sprites. Butterfly/bird/rain use the window clip region (`rr(c, 66, 52, 120, 152, 5); c.clip()`). Package is drawn at floor level.

---

## Feature 10: Expanded Decorations

### New DECOR_ITEMS (01-constants.js)
Add these after existing items:
```js
{ key: "wallArt2", name: "Wall Art", desc: "New artwork for the wall", stars: 7, type: "cycle", max: 3, labels: ["Landscape", "Floral", "Portraits", "Abstract"] },
{ key: "windowPlant", name: "Window Herbs", desc: "Fresh herbs on the window sill", stars: 6, type: "toggle" },
{ key: "cozyBlanket", name: "Cozy Blanket", desc: "A warm blanket on the couch", stars: 0, type: "toggle", streakUnlock: 7 },
{ key: "photoWall", name: "Photo Wall", desc: "Family photos on the wall", stars: 0, type: "toggle", streakUnlock: 30 },
```

### Decor Defaults (02-storage.js)
Add to decor default object: `wallArt2: 0, windowPlant: false, cozyBlanket: false, photoWall: false`

Backfill migration after loading:
```js
if (store.decor.wallArt2 === undefined) store.decor.wallArt2 = 0;
if (store.decor.windowPlant === undefined) store.decor.windowPlant = false;
if (store.decor.cozyBlanket === undefined) store.decor.cozyBlanket = false;
if (store.decor.photoWall === undefined) store.decor.photoWall = false;
```

### Decoration Rendering (10-backgrounds.js → drawLivingRoom)

**Cozy Blanket:** Draped over couch back at y≈268. Soft knit rectangle + hanging folds drawn with quadratic curves. Warm muted color.

**Window Herbs:** 3 small pots on window sill (x: 72, 110, 148, y: 196). Brown pot + green foliage ellipses + stem lines.

**Photo Wall:** 3 small frames near bookshelf (x≈548, y: 100/140/170). Brown frame + cream interior.

**Wall Art cycle:** When `wallArt2 > 0`, replace the static landscape painting (drawn in `buildStaticCaches` at x=350, y=60) with alternatives. Set `sceneCache.livingRoomBase = null` on change to force rebuild.

### Streak-Locked Items
Items with `streakUnlock` property show "🔥 X-day streak" instead of star cost, and are locked until `store.careStreak.count >= streakUnlock`. Handle in the existing decor panel click handler:
```js
if (item.streakUnlock && store.careStreak.count < item.streakUnlock) {
  audio.miss();
  this.statusText = "Need a " + item.streakUnlock + "-day care streak to unlock!";
  return;
}
```

### Decor Panel Pagination
With 8+ items, use pagination instead of cramming. Two pages of 4 items each:
```js
// In constructor:
this.decorPage = 0;

// getDecorItemRect returns positions for items 0-3 only (current page)
getDecorItemRect(i) {
  return { x: 130, y: 150 + i * 88, w: 540, h: 78 };
}

// In draw, only render items for current page:
const pageItems = DECOR_ITEMS.slice(this.decorPage * 4, this.decorPage * 4 + 4);
// Draw page indicator: "Page 1/2" with ◄ ► buttons
```

Add page navigation buttons at the bottom of the decor panel. Handle their click in the decorOpen click handler.

---

## Feature 11: Clickable Window + Pet Bed (13-scene-hangout.js)

### Window
**Hitbox:** `{ x: 62, y: 48, w: 128, h: 160 }`

**onClick:** Context-sensitive status message:
- If ambient event butterfly: "Luna is fascinated by the butterflies!"
- If rain: "Listen to the rain... so cozy."
- If nighttime: "The stars are beautiful tonight."
- If morning: "What a lovely sunrise."
- Default: "Nice view today."
- Spawn small sparkle at window. `audio.tinyChime()`.

### Pet Bed
**Only active when `store.decor.petBed` is true** (decoration unlocked and toggled on).

**Hitbox:** `{ x: 142, y: 448, w: 76, h: 28 }` (matches petBed draw position in drawLivingRoom)

**onClick:** Call nearest idle pet over to nap. Set their target to bed position, set sleepy state on arrival. Small joy bonus (+3). Status: "Obi curled up in his bed!" / "Luna claimed the pet bed."

### Hover/Tooltip
Add these to `updateHover()` and `interactiveAt()`. Tooltips:
- Window: `{ title: "Window", body: "Click to look outside." }`
- Pet Bed: `{ title: "Pet Bed", body: "Click to call a pet to nap." }`

---

## Feature 12: Daily Task Board (13-scene-hangout.js)

### Storage
Add to store:
```js
dailyTasks: loadJSON("dailyTasks", { date: null, tasks: [], completed: [] }),
```

### Task Pool
```js
const DAILY_TASK_POOL = [
  { id: "pet", text: "Pet Obi or Luna" },
  { id: "feed", text: "Fill the food bowl" },
  { id: "water", text: "Fill the water bowl" },
  { id: "brush", text: "Brush a pet" },
  { id: "toy", text: "Throw a toy" },
  { id: "treat", text: "Toss a treat" },
  { id: "game", text: "Play a minigame" },
];
```

### Daily Generation
In `enter()`, check if tasks need refreshing:
```js
const today = new Date().toDateString();
if (store.dailyTasks.date !== today) {
  // Pick 3 random tasks, seeded by date for determinism
  const seed = today.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const shuffled = [...DAILY_TASK_POOL].sort((a, b) => ((a.id.charCodeAt(0) * seed) % 97) - ((b.id.charCodeAt(0) * seed) % 97));
  store.dailyTasks = { date: today, tasks: shuffled.slice(0, 3).map(t => t.id), completed: [] };
  saveJSON("dailyTasks", store.dailyTasks);
}
```

### Completion Detection
In `recordCareAction(actionType)`, also check daily tasks:
```js
if (store.dailyTasks.tasks.includes(actionType) && !store.dailyTasks.completed.includes(actionType)) {
  store.dailyTasks.completed.push(actionType);
  saveJSON("dailyTasks", store.dailyTasks);
  this.addFloatingText("Task done!", 400, 100, COLORS.gold);
  audio.tinyChime();
  
  // All 3 complete?
  if (store.dailyTasks.completed.length >= 3) {
    this.obi.joy = clamp(this.obi.joy + 5, 0, 100);
    this.luna.joy = clamp(this.luna.joy + 5, 0, 100);
    this.decorNotification = { text: "All daily tasks complete! +5 joy for both pets!", timer: 4 };
    audio.combo();
  }
}
```

### UI Display
Add a small "Tasks" indicator in the HUD. Show as compact checklist popup when hovered or clicked:
- 3 task items with checkmark (✓) or empty circle (○)
- "Daily Tasks" header
- Position near the top-left, below the games button
- Draw as a floating tooltip-style card (reuse `drawTooltip` pattern)

This can also be shown as a small counter badge: `"Tasks: 2/3"` next to the streak pill.

---

## Minigame Menu Changes (13-scene-hangout.js)

### Game Cards Array
Add two new entries to `this.gameCards`:
```js
{ key: "bath", title: "Bath Time", desc: "Scrub, rinse, and dry Obi and Luna!", color: "#87CEEB", icon: "heart",
  best: () => { const s = store.best_bath; const st = (s>=400?3:s>=200?2:s>=80?1:0); return "Best: " + s + "  " + "\u2605".repeat(st) + "\u2606".repeat(3-st); } },
{ key: "sort", title: "Snack Sort", desc: "Sort treats into the right bowls!", color: "#E8A84C", icon: "bone",
  best: () => { const s = store.best_sort; const st = (s>=700?3:s>=350?2:s>=150?1:0); return "Best: " + s + "  " + "\u2605".repeat(st) + "\u2606".repeat(3-st); } },
```

### Compact Card Layout
Change `getCardRect(i)`:
```js
getCardRect(i) {
  return { x: 90, y: 114 + i * 64, w: 620, h: 56 };
}
```

Adjust panel height: `rr(c, 60, 60, 680, 530, 28)`. Reduce card title font to 16px, description to 11px.

### Menu Click Handler
Replace the hardcoded if/else chain with generic routing:
```js
// Replace the 5 if/else lines with:
transitionTo(SceneRegistry.create(key));
```
This works because all game card keys match their SceneRegistry names.

### Star Counter
Update hardcoded `/15` to `/21`:
```js
c.fillText("\u2605 " + totalStarsEarned() + "/21", 561, 73);
```

### totalStarsEarned (02-storage.js)
Add the two new games:
```js
{ best: store.best_bath, thresholds: [80, 200, 400] },
{ best: store.best_sort, thresholds: [150, 350, 700] }
```

### Store
Add: `best_bath: loadNumber("best_bath", 0)`, `best_sort: loadNumber("best_sort", 0)`

### Achievements
Add to ACHIEVEMENTS array:
```js
{ key: "squeakyClean", name: "Squeaky Clean", desc: "Score 200+ in Bath Time.", color: "#87CEEB", icon: "heart" },
{ key: "sortingPro", name: "Sorting Pro", desc: "Sort 10 treats correctly in a row.", color: "#E8A84C", icon: "star" }
```

Add to achievements defaults: `squeakyClean: false, sortingPro: false`

Backfill:
```js
if (store.achievements.squeakyClean === undefined) store.achievements.squeakyClean = false;
if (store.achievements.sortingPro === undefined) store.achievements.sortingPro = false;
```

---

## Implementation Order

1. **Storage + Constants** — add all new store keys, achievements, decor items. Build and verify.
2. **Sprite mappings** — add eat/drink/carryToy/bath/stretch pose→frame in drawObiSprite/drawLunaSprite. Build.
3. **Luna idle: stretch** — wire into updateLuna + petSpriteState. Build and test.
4. **Obi idle: carryToy** — wire into updateObi + petSpriteState. Build and test.
5. **Luna perch points** — refactor onTower→perch, add couch/window positions. Build carefully — many references to update.
6. **Time-of-day** — decor item + drawLivingRoom window sky + room overlay. Build and test.
7. **Room presets 3+4** — trivial overlay additions. Build.
8. **Menu redesign** — compact cards, 7 slots, generic click routing, star counter /21. Build.
9. **Bath Time scene** — create 15b-scene-bath-time.js. Build and test.
10. **Snack Sort scene** — create 15c-scene-snack-sort.js. Build and test.
11. **Care streaks** — recordCareAction, milestones, HUD pill. Build.
12. **Daily task board** — generation, completion detection, UI. Build.
13. **Favorites** — getCurrentFavorite, detection in rewardPet, idle hints. Build.
14. **Ambient events** — all 4 types, pet reactions, drawing. Build.
15. **Expanded decorations** — new renders, pagination, streak-locked items. Build.
16. **Clickable window + pet bed** — hitboxes, handlers, tooltips. Build.
17. **Final build + full test.**

After EVERY step, run `node build.js` and verify `✓ Syntax OK`.

---

## Testing Checklist

- [ ] Build passes with all new files
- [ ] All 7 minigames launch from menu and complete correctly
- [ ] Bath Time: scrub/rinse/dry flow works, scoring is reasonable, 3 stars are achievable
- [ ] Snack Sort: drag-and-drop works on desktop AND mobile (touch), correct/wrong sorting, streak achievement
- [ ] Luna uses stretch pose during idle
- [ ] Obi picks up bone and trots around during idle
- [ ] Luna perches on couch back and window sill (not just tower)
- [ ] Time-of-day cycles through all 4 settings with correct visuals
- [ ] All 5 room presets work
- [ ] Care streak increments on daily care actions, resets on missed day
- [ ] Streak milestones fire correctly (3/7/14/30 day rewards)
- [ ] Favorites: bonus joy + "Favorite!" text on correct action
- [ ] Ambient events trigger after cooldown, pet reactions work
- [ ] All 4 ambient event types render correctly in window area (or floor for package)
- [ ] Decor panel pagination works (page 1/2 navigation)
- [ ] Streak-locked decorations show correct lock state
- [ ] New decoration renders appear when toggled (blanket, herbs, photos, wall art)
- [ ] Clickable window produces context-sensitive messages
- [ ] Clickable pet bed calls pet to nap
- [ ] Daily tasks generate, complete, and reward correctly
- [ ] Star counter shows /21
- [ ] All existing Phase 1 features still work
- [ ] All 5 original minigames still work
