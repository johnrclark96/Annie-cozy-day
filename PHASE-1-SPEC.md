# Phase 1 Specification — Make the Home Screen Feel Alive

**Status:** Architecture & spec complete, ready for implementation  
**Scope:** 6 features that transform the hangout screen from a static hub into a living pet-care sim  
**Constraint:** All changes must work in the existing build system (concatenated IIFE, no modules, `file://` compatible)

---

## Table of Contents

1. [Overview & Design Philosophy](#1-overview--design-philosophy)
2. [Feature 1: Food & Water Bowls](#2-feature-1-food--water-bowls)
3. [Feature 2: Reworked Request System](#3-feature-2-reworked-request-system)
4. [Feature 3: Mood System](#4-feature-3-mood-system)
5. [Feature 4: Clickable Room Objects](#5-feature-4-clickable-room-objects)
6. [Feature 5: Daily Gift](#6-feature-5-daily-gift)
7. [Feature 6: Room Style Presets](#7-feature-6-room-style-presets)
8. [Storage Schema Changes](#8-storage-schema-changes)
9. [File-by-File Change Map](#9-file-by-file-change-map)
10. [Implementation Order](#10-implementation-order)
11. [New Sprites Required](#11-new-sprites-required)
12. [Risk Notes](#12-risk-notes)

---

## 1. Overview & Design Philosophy

Phase 1 shifts the hangout screen from "hub with minigame launcher" to "living space where pets have needs." The player should feel that Obi and Luna are real pets who get hungry, thirsty, sleepy, and playful — and that paying attention to their needs matters.

**Core principle:** Reward attentiveness, not grinding. The player who checks in twice a day and fulfills a few requests should see happier pets than someone who rapidly clicks without reading the bubbles.

**Aesthetic:** Everything follows the existing warm-earth-tone palette, Fredoka One font, soft particle effects. New interactive objects get the same hover glow + tooltip pattern as existing buttons. No new external dependencies.

---

## 2. Feature 1: Food & Water Bowls

### Concept

Two persistent interactive objects placed in the living room: a food bowl (near Obi's home position) and a water bowl (between the two pets). They have a fill level (0–100) that depletes over time. Clicking a bowl refills it. When a bowl is full, pets may walk over and eat/drink (using the new `eat`/`drink` sprite frames). Empty bowls affect mood and trigger request bubbles.

### Visual Design

**Positions (in room coordinates):**
- Food bowl: `{ x: 130, y: 462 }` — on the floor near Obi's mat (matX=262, matY=446), slightly to the left
- Water bowl: `{ x: 430, y: 466 }` — on the floor near the rug center, accessible to both pets

**Rendering:** Use the new `items.foodBowl` and `items.waterBowl` sprite atlas frames. Render at scale ~0.08 (these are large item sprites, ~616×404 → renders to ~49×32px in-game). Draw at floor level, behind characters but in front of the rug.

**Fill state visual:** Draw a fill level indicator on hover: a small semi-transparent bar beneath the bowl (similar to the pet joy bars in the status pills). Full = green, medium = yellow, low = red. The bowl sprite itself doesn't change (we only have one frame per bowl), but we add a subtle darkening overlay at `globalAlpha = 0.3 * (1 - fill/100)` over the bowl when low to suggest emptiness.

**Hover glow:** Same `drawGlowCircle()` pattern used for pet hover highlighting. Gold glow at `alpha=0.25` on hover.

### State

```js
// In HangoutScene constructor:
this.foodBowl = { x: 130, y: 462, fill: store.pet_food_fill, lastFill: store.pet_food_lastFill };
this.waterBowl = { x: 430, y: 466, fill: store.pet_water_fill, lastFill: store.pet_water_lastFill };
```

### Fill Depletion

Bowls deplete based on **real elapsed time**, not just in-game dt. On scene construction:

```js
const now = Date.now();
const foodElapsed = (now - store.pet_food_lastFill) / 1000; // seconds since last fill
const waterElapsed = (now - store.pet_water_lastFill) / 1000;

// Food depletes over ~4 hours, water over ~3 hours
this.foodBowl.fill = clamp(store.pet_food_fill - foodElapsed / 144, 0, 100);
this.waterBowl.fill = clamp(store.pet_water_fill - waterElapsed / 108, 0, 100);
```

Rates: food loses ~25 per hour (empty in 4h), water loses ~33 per hour (empty in 3h). These are gentle rates — the game is a gift, not a chore.

During active play, bowls also deplete at a visible-but-slow rate:
- Food: `-dt * 0.4` per second (visible depletion during a session)
- Water: `-dt * 0.55` per second

### Refill Interaction

**Click:** If `pointInRect(x, y, bowlHitbox)` and not in a menu, refill the bowl to 100. Play `audio.tinyChime()`, spawn food/water-colored particles, set status text.

**Hitboxes:**
- Food: `{ x: foodBowl.x - 28, y: foodBowl.y - 20, w: 56, h: 36 }`
- Water: `{ x: waterBowl.x - 28, y: waterBowl.y - 20, w: 56, h: 36 }`

**On refill:**
```
fill = 100
lastFill = Date.now()
save to localStorage
statusText = "Annie filled the food bowl!" / "Annie refilled the water!"
statusPulse = 0.6
spawnParticleBurst(bowl.x, bowl.y - 10, [bowlColor], 6, ["star"])
audio.tinyChime()
```

### Pet Eating/Drinking Animations

When a bowl has fill > 20, pets will periodically walk to it and use the `eat`/`drink` poses:

**Trigger conditions:**
- Pet is idle (not busy with treats, toys, interactions, or sleeping)
- Pet is not currently eating/drinking
- `idleTime > 4` (some idle time before auto-feeding)
- Bowl fill > 20
- Random chance: `Math.random() < dt * 0.08` (~once per 12 seconds of eligibility)

**Behavior:**
1. Set pet `targetX` / `targetY` toward the bowl
2. When within 30px of bowl, set a new pet state: `eating: true` / `drinking: true` for `rand(2, 4)` seconds
3. During eating/drinking, pet sprite state returns `{ pose: "eat" }` or `{ pose: "drink" }`
4. Bowl fill decreases by 8–12 per eat/drink event
5. Pet joy increases by 3–5 per event (small passive boost)
6. On completion, return pet to home position

**Important:** Only ONE pet eats at a time. If Obi is at the food bowl, Luna won't try to go to it simultaneously (but she could go to the water bowl).

### Draw Order

In `draw()`, bowls are rendered:
- After the living room background
- After dynamic shadows
- Before character sprites
- With a small floor shadow ellipse beneath each

### New Sprites Used

- `items.foodBowl` — the filled food bowl
- `items.waterBowl` — the filled water bowl
- `obi.eat` — Obi eating from bowl
- `obi.drink` — Obi drinking from bowl
- `luna.eat` — Luna eating from bowl
- `luna.drink` — Luna drinking from bowl

---

## 3. Feature 2: Reworked Request System

### Concept

Replace the current binary "match or miss" thought bubble system with a tiered reward system. When a pet shows a thought bubble requesting something specific, the player's response quality determines the reward.

### Current System (Being Replaced)

Currently: bubble appears with a `want` (pet/treat/toy/brush). If the player does the exact matching action, `checkBubbleReward()` gives +8 joy bonus. If they do anything else, nothing happens. If the bubble expires, a sad message appears 50% of the time.

### New Tiered System

**Reward tiers:**

| Response | Joy Bonus | Visual Feedback | Sound |
|----------|-----------|-----------------|-------|
| **Exact match** | +10 | Gold star burst (12 particles), screen shake, "Got exactly what they wanted!" | `audio.combo()` |
| **Related action** | +3 | Small sparkle (4 particles), "That helped a little!" | `audio.tinyChime()` |
| **Unrelated action** | 0 | None (no penalty, bubble stays) | — |
| **Ignored (expired)** | -3 | Small sad particles (3 gray hearts), sad status message | `audio.miss()` |

**Related action mapping:**

| Want | Exact Match | Related |
|------|-------------|---------|
| `pet` | Pet mode click/stroke | Brush mode (close enough) |
| `treat` | Treat toss | Feed bowl refill |
| `toy` | Play mode throw | Pet mode click (attention) |
| `brush` | Brush mode | Pet mode click |
| `food` | Refill food bowl | Treat toss (it's food-adjacent) |
| `water` | Refill water bowl | — (nothing is water-related) |

### New Want Types

The want pool expands from `["pet", "treat", "toy", "brush"]` to `["pet", "treat", "toy", "brush", "food", "water"]`.

**Want selection logic (replaces current):**

```js
pickWant(pet, joy, foodFill, waterFill) {
  // Urgent needs override personality
  if (foodFill < 25) return "food";   // hungry!
  if (waterFill < 25) return "water"; // thirsty!
  
  // Mood-driven wants (see §4 Mood System)
  const mood = this.petMood(pet);
  
  if (pet === "obi") {
    if (mood === "hungry") return Math.random() < 0.7 ? "food" : "treat";
    if (mood === "sleepy") return Math.random() < 0.6 ? "pet" : "brush";
    if (mood === "playful") return Math.random() < 0.5 ? "toy" : "treat";
    // cuddly
    return Math.random() < 0.5 ? "pet" : "brush";
  } else { // luna
    if (mood === "hungry") return Math.random() < 0.6 ? "food" : "treat";
    if (mood === "sleepy") return Math.random() < 0.5 ? "pet" : "brush";
    if (mood === "playful") return Math.random() < 0.6 ? "toy" : "treat";
    // cuddly - luna still prefers toys/brush even when cuddly
    return Math.random() < 0.4 ? "toy" : (Math.random() < 0.5 ? "brush" : "pet");
  }
}
```

### Thought Bubble Visual Changes

**New bubble icons for food/water:**
- `food`: Draw the `items.foodBowl` sprite tiny (scale ~0.035) inside the bubble
- `water`: Draw the `items.waterBowl` sprite tiny (scale ~0.035) inside the bubble

**Bubble labels expand:**
```js
const labels = { pet: "Pets!", treat: "Treat!", toy: "Play!", brush: "Brush!", food: "Food!", water: "Water!" };
```

### Implementation: `checkBubbleReward()` Replacement

```js
checkBubbleReward(key, source) {
  const bubble = key === "obi" ? this.obiBubble : this.lunaBubble;
  if (!bubble) return;
  
  const want = bubble.want;
  const isExact = (want === source) || 
                  (want === "food" && source === "feed") || 
                  (want === "water" && source === "water");
  
  const relatedMap = {
    pet: ["brush"],
    treat: ["feed"],
    toy: ["pet"],
    brush: ["pet"],
    food: ["treat"],
    water: []
  };
  const isRelated = (relatedMap[want] || []).includes(source);
  
  const pet = key === "obi" ? this.obi : this.luna;
  const px = key === "obi" ? this.obi.x : this.luna.x;
  const py = (key === "obi" ? this.obi.y : (this.luna.onTower ? this.luna.perchY : this.luna.y)) - 50;
  
  if (isExact) {
    pet.joy = clamp(pet.joy + 10, 0, 100);
    this.sessionJoy += 10;
    spawnParticleBurst(px, py, [COLORS.gold, "#FFF4C0"], 12, ["star"]);
    this.statusText = this.petName(key) + " got exactly what they wanted!";
    this.statusPulse = 1;
    audio.combo();
    screenShake(3, 0.2);
    this.addFloatingText("Perfect!", px, py, COLORS.gold);
    if (key === "obi") this.obiBubble = null;
    else this.lunaBubble = null;
  } else if (isRelated) {
    pet.joy = clamp(pet.joy + 3, 0, 100);
    this.sessionJoy += 3;
    spawnParticleBurst(px, py, [COLORS.softPink], 4, ["star"]);
    this.statusText = "That helped a little, but " + this.petName(key) + " wanted something else...";
    this.addFloatingText("Close!", px, py, COLORS.softPink);
    audio.tinyChime();
    // Bubble stays — player can still try the exact match
  }
  // Unrelated: nothing happens, bubble stays
}
```

### Expiry Penalty

When a bubble expires (timer hits 0), the **new** behavior:

```js
// In updateThoughtBubbles, when timer <= 0:
const pet = key === "obi" ? this.obi : this.luna;
pet.joy = clamp(pet.joy - 3, 0, 100);
const px = key === "obi" ? this.obi.x : this.luna.x;
const py = key === "obi" ? this.obi.y - 40 : /* luna y */ - 40;
spawnParticleBurst(px, py, ["rgba(160,140,120,0.6)"], 3, ["heart"]);
this.statusText = key === "obi" 
  ? "Obi's wish went unanswered..." 
  : "Luna lost interest. Typical cat.";
audio.miss();
```

---

## 4. Feature 3: Mood System

### Concept

Replace the current joy-threshold-only mood display with a richer system where pets have a **dominant mood** derived from multiple inputs. Mood drives idle behavior, want selection, expressions, and the mood label shown in the UI pill.

### Mood Types

| Mood | Meaning | Trigger |
|------|---------|---------|
| `hungry` | Pet needs food | foodBowl.fill < 30 OR >45min since last eat event |
| `thirsty` | Pet needs water | waterBowl.fill < 30 OR >30min since last drink event |
| `sleepy` | Pet wants rest | joy > 70 AND idleTime > 12, OR time since scene enter > 600s with minimal interaction |
| `playful` | Pet wants stimulation | joy 35–70 AND recent interaction (last 30s) |
| `cuddly` | Pet wants attention | joy < 35 OR long idle without interaction |

### Mood Resolution

Moods are evaluated every frame in priority order. The first matching condition wins:

```js
petMood(key) {
  const pet = key === "obi" ? this.obi : this.luna;
  const joy = pet.joy;
  const food = this.foodBowl.fill;
  const water = this.waterBowl.fill;
  
  // Priority 1: Physical needs
  if (food < 30) return "hungry";
  if (water < 30) return "thirsty";
  
  // Priority 2: Sleepy (high joy + long idle)
  if (pet.sleepy) return "sleepy";
  if (joy > 70 && this.idleTime > 12) return "sleepy";
  
  // Priority 3: Playful (medium joy, recent engagement)
  if (joy >= 35 && joy <= 70 && this.idleTime < 30) return "playful";
  
  // Priority 4: Cuddly (default / low joy)
  return "cuddly";
}
```

### Mood Display

The existing compact pet status pills change from:

**Current:** `"Obi: waggy"` (joy-based label)

**New:** `"Obi: playful 🎾"` (mood-based label with emoji icon)

Mood label mapping:
```js
const moodLabels = {
  hungry:  { obi: "hungry",  luna: "hungry",  icon: "🍖" },
  thirsty: { obi: "thirsty", luna: "thirsty", icon: "💧" },
  sleepy:  { obi: "sleepy",  luna: "drowsy",  icon: "💤" },
  playful: { obi: "waggy",   luna: "curious",  icon: "🎾" },
  cuddly:  { obi: "cuddly",  luna: "aloof",   icon: "💕" }
};
```

**Note on emojis:** The game uses `Fredoka One` and canvas text rendering. Emoji rendering in canvas varies across systems. As a fallback, we can use text symbols instead: `hungry → "♥"` in food color, `thirsty → "~"`, etc. Or use `drawBone()` / `drawHeart()` / `drawStar()` inline. **Decision: use the existing draw helper icons** (drawBone for hungry, a water droplet path for thirsty, Zzz text for sleepy, drawStar for playful, drawHeart for cuddly) rendered at 8px scale next to the mood text. This avoids emoji cross-platform issues entirely.

### Mood Effects on Behavior

**Idle animations (in `updateObi` / `updateLuna`):**

| Mood | Obi Behavior | Luna Behavior |
|------|-------------|---------------|
| `hungry` | Walks toward food bowl, sniffs it, sits near it | Sits near food bowl, looks at it, occasional paw tap |
| `thirsty` | Walks toward water bowl, sits near it | Same as hungry but toward water bowl |
| `sleepy` | Current nap behavior (unchanged) | Current groom→bellyUp→tower behavior (unchanged) |
| `playful` | More frequent sniffing, approaches Annie more, tail wags faster | More wiggle, occasional pounce, stays on floor |
| `cuddly` | Stays near home position, slow movements | Stays on tower, occasional slow blink |

### Mood Effects on Expressions

In `petSpriteState()`:

```js
// Hungry/thirsty: sad expression for Obi, alert for Luna
if (mood === "hungry" || mood === "thirsty") {
  expression = key === "obi" ? "sad" : "alert"; // Obi droops, Luna stares
}
// Playful: excited
if (mood === "playful") {
  expression = "excited"; // faster tail, more bounce
}
```

---

## 5. Feature 4: Clickable Room Objects

### Concept

Two existing room objects become interactive: the **lamp** (toggle on/off) and a new **toy basket** near the couch. These add life to the room and give the player small interactions beyond the mode system.

### 5a. Lamp Toggle

**Position:** The lamp is drawn in the static cache at approximately x=102–148, y=138–292. The clickable hitbox covers the shade area.

**Hitbox:** `{ x: 96, y: 128, w: 58, h: 62 }`

**State:** `store.decor.lampOn` (default: `true`)

**Behavior:**
- Click toggles `lampOn` between true/false
- `audio.tinyChime()` on click
- Status text: "Annie turned the lamp off." / "Annie turned the lamp on."
- The lamp glow effect in `drawLivingRoom()` scales with lamp state:
  - `lampOn = true`: current behavior (warm glow, flicker)
  - `lampOn = false`: glow reduced to `alpha * 0.05` (faint ambient only), lamp shade darkened with `globalAlpha = 0.35` overlay
- When lamp is off, the room gets a subtle overall darkening: `globalAlpha = 0.06` dark overlay on the left half (the window still provides light on the right)

**Hover:** Gold glow around lamp shade. Tooltip: `{ title: "Lamp", body: "Click to toggle the lamp." }`

**Visual detail:** When off, the warm wall glow from the lamp disappears (it's drawn dynamically, not in the static cache, so this is just a conditional check in `drawLivingRoom()`).

### 5b. Toy Basket

**Position:** On the floor next to the couch's left armrest: `{ x: 265, y: 388 }`

**Rendering:** Drawn procedurally (no sprite needed — it's a simple wicker basket shape):
```
- Brown rounded rect body (30×20px)
- Darker brown rim
- 2–3 small colored circles visible inside (representing toys)
- Tiny bone shape and yarn ball peeking out
```

**Hitbox:** `{ x: 248, y: 375, w: 38, h: 30 }`

**Behavior:** Clicking the basket is a **shortcut** — it throws a toy toward the nearest pet, equivalent to clicking in Play mode. This means players who discover it can toss toys without switching to Play mode.
- Pick nearest pet (Obi if click is left half, Luna if right — same as `pickPetForPoint`)
- Call `this.throwToy(petX, petY)` with the pet's position
- Status text: "Annie grabbed a toy from the basket!"
- Small particle burst from basket position

**Hover:** Gold glow. Tooltip: `{ title: "Toy Basket", body: "Click to toss a toy!" }`

### Draw Order

Both are drawn as part of `drawLivingRoom()` dynamic elements (after the static cache, alongside fairy lights and flower pot).

### Hover Detection

Add to `updateHover()`:
```js
if (pointInRect(x, y, this.lampHitbox)) this.hoverKey = "lamp";
else if (pointInRect(x, y, this.toyBasketHitbox)) this.hoverKey = "toyBasket";
```

Add to `interactiveAt()`:
```js
if (pointInRect(x, y, this.lampHitbox)) return true;
if (pointInRect(x, y, this.toyBasketHitbox)) return true;
```

---

## 6. Feature 5: Daily Gift

### Concept

When the player opens the game on a new calendar day, they're greeted with a gift box animation and a small reward. This encourages daily check-ins without punishing missed days.

### Detection

```js
// In HangoutScene.enter():
const today = new Date().toDateString();
const lastVisit = store.lastVisitDate; // stored as date string like "Thu Mar 27 2026"

if (lastVisit !== today) {
  this.dailyGift = { phase: 0, collected: false };
  store.lastVisitDate = today;
  saveJSON("lastVisitDate", today);
}
```

### Gift Overlay

Displayed before the dedication screen check (or after, if dedication is already dismissed). It's a simple centered overlay:

**Layout (similar to dedication screen):**
1. Semi-transparent backdrop (`rgba(60,40,28,0.5)`)
2. Centered panel (400×280, rounded corners, cream background)
3. Gift box sprite (`items.giftBox`) rendered at scale ~0.18, centered, with gentle bob animation
4. Title: "Daily Gift!" in 28px Fredoka One
5. Subtitle: "Welcome back! Here's something for Obi and Luna."
6. Reward text: "+5 joy for both pets" (or random small reward)
7. "Open!" button (or "Click anywhere to collect")

**Animation:**
- Phase 0–1s: gift box scales in with `easeOutBack`
- Phase 1–1.5s: box shakes/wiggles
- On click: box "opens" (scale to 0 + particle burst), joy applied, overlay fades

**Rewards (random daily):**
```js
const gifts = [
  { text: "+5 joy for Obi and Luna!", effect: () => { obi.joy += 5; luna.joy += 5; } },
  { text: "Bowls refilled!",          effect: () => { foodBowl.fill = 100; waterBowl.fill = 100; } },
  { text: "+8 joy for Obi!",          effect: () => { obi.joy += 8; } },
  { text: "+8 joy for Luna!",         effect: () => { luna.joy += 8; } },
  { text: "Both pets are happy to see you!", effect: () => { obi.joy += 3; luna.joy += 3; } }
];
```

### Flow

```
enter() →  check lastVisitDate → if new day → set this.dailyGift
update() → if this.dailyGift → animate phase, block other updates
onClick() → if this.dailyGift && phase > 0.5 → apply reward, clear dailyGift
draw() → if this.dailyGift → draw overlay on top of everything
```

The daily gift displays BEFORE the dedication screen (first visit) so returning players see it immediately. First-time players see dedication instead (they have no lastVisitDate yet).

---

## 7. Feature 6: Room Style Presets

### Concept

Let the player choose from 3 room color palettes that change the wall color, floor tone, and ambient lighting. This is a palette swap on the static living room cache — not a full redraw of furniture.

### Presets

| Preset | Name | Wall | Floor | Accent | Ambient Glow |
|--------|------|------|-------|--------|-------------|
| 0 | Cozy Neutral | `#F5E6D3` | `#EFD8BE` | current browns | warm gold |
| 1 | Pastel Cute | `#F0E0EE` | `#F0E0D4` | soft pinks/lavenders | rose-pink |
| 2 | Warm Cottage | `#F5E2CC` | `#E8D0B0` | deeper amber/orange | amber |

### Implementation

**Storage:** `store.decor.roomPreset` (integer 0–2, default 0)

**Approach:** After drawing the static `livingRoomBase` cache, apply a tinted overlay for non-default presets:

```js
// In drawLivingRoom(), after c.drawImage(sceneCache.livingRoomBase, 0, 0):
if (store.decor.roomPreset === 1) {
  // Pastel Cute: pink-lavender tint
  c.save();
  c.globalCompositeOperation = "multiply";
  c.fillStyle = "rgba(245,225,238,0.15)";
  c.fillRect(0, 0, W, 340); // wall area
  c.fillStyle = "rgba(240,225,215,0.12)";
  c.fillRect(0, 340, W, H - 340); // floor area
  c.restore();
} else if (store.decor.roomPreset === 2) {
  // Warm Cottage: amber tint
  c.save();
  c.globalCompositeOperation = "multiply";
  c.fillStyle = "rgba(245,228,200,0.18)";
  c.fillRect(0, 0, W, 340);
  c.fillStyle = "rgba(235,210,180,0.14)";
  c.fillRect(0, 340, W, H - 340);
  c.restore();
}
```

**Ambient glow adjustment:** The lamp glow and window light colors shift slightly per preset:
- Preset 0: current warm gold
- Preset 1: `rgba(255,210,230,ALPHA)` (rose-tinted light)
- Preset 2: `rgba(255,200,140,ALPHA)` (deeper amber)

### UI Access

Add a **"Style" button** to the decoration panel (existing `decorOpen` overlay). This is the simplest path — no new UI needed. Add a new entry to `DECOR_ITEMS`:

```js
{ key: "roomPreset", name: "Room Style", desc: "Change the room's color palette", stars: 0, type: "cycle", max: 2, labels: ["Cozy Neutral", "Pastel Cute", "Warm Cottage"] }
```

Setting `stars: 0` means it's always unlocked (free cosmetic). The existing cycle-type decor handler already supports this.

**Cache invalidation:** When roomPreset changes, set `sceneCache.livingRoomBase = null` to force rebuild on next frame (same pattern as rugColor).

---

## 8. Storage Schema Changes

### New localStorage Keys

All prefixed with `anniesCozyDay_` as per existing convention.

| Key | Type | Default | Purpose |
|-----|------|---------|---------|
| `pet_food_fill` | number | 80 | Food bowl fill level (0–100) |
| `pet_food_lastFill` | number | Date.now() | Timestamp of last food fill |
| `pet_water_fill` | number | 80 | Water bowl fill level (0–100) |
| `pet_water_lastFill` | number | Date.now() | Timestamp of last water fill |
| `lastVisitDate` | JSON string | null | Date string of last daily gift claim |

### Modified Store Object

Add to `store` initialization in `02-storage.js`:

```js
pet_food_fill: loadNumber("pet_food_fill", 80),
pet_food_lastFill: loadNumber("pet_food_lastFill", Date.now()),
pet_water_fill: loadNumber("pet_water_fill", 80),
pet_water_lastFill: loadNumber("pet_water_lastFill", Date.now()),
lastVisitDate: loadJSON("lastVisitDate", null),
```

### Modified Decor Object

Add to the `decor` default in `02-storage.js`:

```js
decor: loadJSON("decor", {
  fairyLights: false,
  plant2: false,
  petBed: false,
  rugColor: 0,
  wallArt: 0,
  lampOn: true,        // NEW
  roomPreset: 0        // NEW
}),
```

### Modified DECOR_ITEMS

Add to `01-constants.js`:

```js
{ key: "roomPreset", name: "Room Style", desc: "Change the room's color palette", stars: 0, type: "cycle", max: 2, labels: ["Cozy Neutral", "Pastel Cute", "Warm Cottage"] }
```

---

## 9. File-by-File Change Map

### `01-constants.js` — Minor
- Add `roomPreset` to `DECOR_ITEMS` array

### `02-storage.js` — Minor
- Add new keys to `store` initialization
- Add `lampOn` and `roomPreset` to `decor` defaults

### `05-audio.js` — No changes

### `06-game-state.js` — No changes

### `07-particles.js` — No changes

### `08-ui.js` — Minor
- Add mood icon draw helpers (small `drawWaterDrop()` function, ~10 lines)

### `09-sprites.js` — Moderate
- Add frame mappings in `drawObiSprite()` for `eat`, `drink` poses
- Add frame mappings in `drawLunaSprite()` for `eat`, `drink`, `stretch` poses
- These are just new `else if` branches in the pose-to-frame switch logic

### `10-backgrounds.js` — Moderate
- In `drawLivingRoom()`:
  - Add room preset tint overlay (after static cache draw)
  - Add lamp off visual (conditional glow reduction)
  - Add toy basket procedural draw
  - Add food/water bowl sprite draws
  - Adjust lamp glow colors per room preset

### `13-scene-hangout.js` — Major (largest changes)
- **Constructor:** Add food/water bowl state, lamp/toyBasket hitboxes, dailyGift state, eat/drink tracking per pet
- **`enter()`:** Add daily gift detection, bowl time-decay calculation
- **`petMood()`:** Complete rewrite from joy-threshold to multi-factor mood
- **`petSpriteState()`:** Add eat/drink/stretch pose mappings based on pet behavior state
- **`rewardPet()`:** Add `"feed"` and `"water"` source types
- **`checkBubbleReward()`:** Complete rewrite for tiered rewards
- **`updateThoughtBubbles()`:** Expand want pool, mood-driven selection, food/water wants
- **`updateObi()`:** Add hungry/thirsty idle behaviors (walk to bowl), eating/drinking state machine
- **`updateLuna()`:** Same as Obi — hungry/thirsty behaviors, eating/drinking
- **`updateHover()`:** Add bowl, lamp, toyBasket hover detection
- **`interactiveAt()`:** Add bowl, lamp, toyBasket hit testing
- **`onClick()`:** Add bowl refill, lamp toggle, toy basket click handlers
- **`update()`:** Add bowl depletion tick, daily gift animation, bowl save timer
- **`draw()`:** Add daily gift overlay, mood icons in pet pills, bowl fill indicators on hover
- **Mood pill rendering:** Change mood label from joy-string to mood-string with icon

### `20-navigation.js` — No changes
### `21-loop.js` — No changes
### `22-input.js` — No changes
### `23-main.js` — No changes

### Estimated Delta

| File | Current Lines | Added Lines | Modified Lines |
|------|--------------|-------------|----------------|
| 01-constants.js | 51 | 2 | 0 |
| 02-storage.js | 102 | 8 | 2 |
| 08-ui.js | 165 | 12 | 0 |
| 09-sprites.js | 1,064 | 20 | 6 |
| 10-backgrounds.js | 684 | 80 | 15 |
| 13-scene-hangout.js | 1,808 | 350 | 120 |
| **Total** | | **~470 new** | **~143 modified** |

---

## 10. Implementation Order

Features should be implemented in this order to minimize conflicts and allow incremental testing:

### Step 1: Storage & Constants (~15 min)
- Add new store keys, decor defaults, DECOR_ITEMS entry
- Build, verify syntax passes

### Step 2: Mood System (~30 min)
- Rewrite `petMood()` (keep it returning strings — same interface)
- Add mood icons to pet pill rendering
- This is a self-contained change with no new dependencies
- Needs food/water bowl state to exist but can default to "full" temporarily

### Step 3: Food & Water Bowls (~60 min)
- Add bowl state, time-based depletion, refill click handler
- Add bowl sprite rendering in `drawLivingRoom()` / hangout `draw()`
- Add hover/tooltip/interactiveAt for bowls
- Add pet eat/drink behavior in updateObi/updateLuna
- Add eat/drink sprite frame mappings in 09-sprites.js

### Step 4: Reworked Request System (~30 min)
- Rewrite `updateThoughtBubbles()` want selection (now mood-driven + food/water)
- Rewrite `checkBubbleReward()` for tiered rewards
- Add expiry penalty
- Add food/water bubble icons

### Step 5: Clickable Room Objects (~20 min)
- Lamp toggle: hitbox, handler, visual conditional
- Toy basket: procedural draw, hitbox, handler

### Step 6: Daily Gift (~25 min)
- Add date check in `enter()`
- Add gift overlay draw, animation, click handler
- Add reward application

### Step 7: Room Style Presets (~15 min)
- Add tint overlay in `drawLivingRoom()`
- Add preset-aware lamp glow colors
- Add cache invalidation on preset change
- Already accessible via decor panel (DECOR_ITEMS added in Step 1)

### Step 8: Integration Testing
- Verify build passes
- Test: bowls deplete and refill
- Test: mood changes based on bowl state
- Test: thought bubbles request food/water
- Test: tiered bubble rewards work
- Test: lamp toggles, toy basket works
- Test: daily gift shows on fresh day
- Test: room presets cycle and render
- Test: all existing features still work (minigames, decor, achievements)

---

## 11. New Sprites Required

All of these should exist in the atlas after processing the 3 uploaded sprite sheets:

| Category | Frame Name | Used For |
|----------|-----------|----------|
| `obi` | `eat` | Obi eating from food bowl (idle behavior + mood) |
| `obi` | `drink` | Obi drinking from water bowl |
| `luna` | `eat` | Luna eating from food bowl |
| `luna` | `drink` | Luna drinking from water bowl |
| `luna` | `stretch` | Luna stretching (new idle animation at mood=playful) |
| `items` | `foodBowl` | Rendered as room object, thought bubble icon |
| `items` | `waterBowl` | Rendered as room object, thought bubble icon |
| `items` | `giftBox` | Daily gift overlay |

**Not used in Phase 1 but now in atlas for Phase 2:**
| `obi` | `carryToy` | Future: Obi carrying bone |
| `obi` | `bath` | Phase 2: Bath Time minigame |
| `luna` | `bath` | Phase 2: Bath Time minigame |
| `items` | `dogTreats` | Phase 2: Snack Sort minigame |
| `items` | `catTreats` | Phase 2: Snack Sort minigame |

---

## 12. Risk Notes

### Save Data Migration
Players with existing save data won't have the new `decor.lampOn` or `decor.roomPreset` keys. The `loadJSON("decor", defaults)` pattern means the entire decor object gets the full defaults on first load. BUT if a player already has saved decor (e.g., fairyLights=true), `loadJSON` returns their saved object — which won't have `lampOn` or `roomPreset`.

**Fix:** In `02-storage.js`, after loading decor, backfill missing keys:
```js
if (store.decor.lampOn === undefined) store.decor.lampOn = true;
if (store.decor.roomPreset === undefined) store.decor.roomPreset = 0;
```

### Bowl Depletion While Offline
Bowl fill depletes based on real time elapsed. A player who hasn't opened the game in 2 days will see empty bowls and hungry pets. This is **intentional** — the game should feel like the pets missed them. But the daily gift on return provides an immediate positive ("Welcome back! Bowls refilled!").

### HangoutScene Constructor Size
The constructor is already heavy (70 lines). Phase 1 adds ~20 more lines. This is manageable but worth noting — Phase 3 may warrant splitting HangoutScene state into sub-objects.

### Performance
Bowl depletion, mood calculation, and bowl sprite rendering add minimal per-frame cost. The only concern is the room preset tint overlay (a `fillRect` with `globalCompositeOperation = "multiply"` every frame). This is a single fill call and should be negligible.

### Sprite Frame Naming Collision
The new `obi.eat` frame name doesn't collide with anything. `luna.stretch` is also unique. All 13 new frame names are distinct from the existing 23.

---

## Appendix A: Phase 2 & 3 Context (Not In Scope)

For reference, these are the planned future phases that Phase 1 should not block:

**Phase 2 — Depth and Replayability:**
- Care streaks (track daily actions, small rewards)
- Favorite items system (pets prefer certain things)
- 2 new minigames: Bath Time (uses obi.bath, luna.bath sprites), Snack Sort (uses dogTreats, catTreats sprites)
- Ambient visitor events (butterflies at window, birds, rain)
- Expanded decoration unlocks

**Phase 3 — If It Becomes a Bigger Project:**
- Accessory system (bandanas for Obi, bows for Luna)
- Simple currency from minigames/streaks
- Photo capture (canvas.toDataURL snapshot button)
- Additional rooms (backyard as second scene)
