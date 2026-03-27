# Phase 3 Implementation Spec — Annie's Cozy Day

> **IMPORTANT: Read this entire document before writing any code.** This builds on Phase 1, Phase 2, AND Phase 2b. All prior features must be working — that means 11 minigames, the scrollable games menu, care streaks, daily tasks, favorites, ambient events, time-of-day toggle, and all expanded decorations. Same architecture rules apply: no modules, no IIFE wrappers, no "use strict", concatenated by `node build.js`, runs from `file://`.

---

## Phase 3 Overview — Expansion & Polish

Phase 3 transforms the game from a single-room pet sim into a multi-room world with progression, customization, and collectibility. Five major features:

1. **Coin Currency System** — earned from all activities, spent on accessories and items
2. **Accessory/Wardrobe System** — equip bandanas on Obi, bows on Luna, visible on sprites
3. **Backyard Scene** — second explorable room with outdoor activities
4. **Photo Capture** — screenshot button, saved photo gallery
5. **Scrapbook/Journal** — collection of milestones, discoveries, and memories

**Estimated total:** ~1,600 new lines across 2 new files + modifications to ~8 existing files.

### Current State of the Game (Post Phase 2b)

- **11 minigames** (Treat Toss, Laser Chase, Cuddle Pile, Obi's Walk, Luna's Nap Spot, Bath Time, Snack Sort, Pillow Pop, Where's Luna?, Window Watch, Pawstep Patterns)
- **Max 33 stars** (11 games × 3)
- **Scrollable games menu** (shows 6 at a time with ▲/▼ arrows)
- **12 achievements**
- **HUD elements in hangout top bar:** Games button, mode buttons (Pet/Treats/Play/Brush), Decor button, star counter pill, streak pill (if active), mute icon (top-right)
- **Decor panel** with pagination (2 pages)
- **Care streaks, daily tasks, favorites, ambient events, time-of-day, 5 room presets**
- **Luna perch system** (tower/couch/window/floor)
- **Food/water bowls, mood system, lamp toggle, toy basket, pet bed, clickable window**

---

## Feature 1: Coin Currency System

### Storage (02-storage.js)

```js
// Add to store:
coins: loadNumber("coins", 50), // start with 50 as a welcome gift
```

Add helper:
```js
function addCoins(amount) {
  store.coins = Math.max(0, store.coins + amount);
  saveNumber("coins", store.coins);
  return store.coins;
}
```

### Earning Rates

| Source | Coins | When |
|--------|-------|------|
| Minigame completion | 5 + stars × 5 | On results screen (0-star=5, 1-star=10, 2-star=15, 3-star=20) |
| New personal best | +10 bonus | On results screen, stacks with above |
| Daily gift | +5 | On daily gift collection |
| Daily tasks (all 3 done) | +8 | On completion |
| Care streak milestone | +15 | On milestone claim |
| Fulfilling a pet wish (exact match) | +2 | In checkBubbleReward |
| First favorite discovery per session | +3 | In favorite detection |

### HUD Display (13-scene-hangout.js → draw)

Draw a coin counter pill. **Check the current positions of the star counter and streak pill in the actual code after Phase 2b** — these may have shifted. Place the coin pill adjacent to the star counter, adjusting x-positions so nothing overlaps. A good default:

```js
// Draw coin pill immediately LEFT of the star counter
// Approximate: { x: 448, y: 57, w: 72, h: 22 }
// But verify against actual star counter position in the current code
c.save();
c.fillStyle = "rgba(255,248,240,0.65)";
rr(c, coinPillX, coinPillY, 72, 22, 11);
c.fill();
// Coin icon (small gold circle with shine)
c.fillStyle = COLORS.gold;
c.beginPath(); c.arc(coinPillX + 14, coinPillY + 11, 7, 0, Math.PI * 2); c.fill();
c.fillStyle = "#FFF4C0";
c.beginPath(); c.arc(coinPillX + 12, coinPillY + 9, 3, 0, Math.PI * 2); c.fill();
// Amount
c.fillStyle = COLORS.gold;
c.font = '13px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
c.textAlign = "center";
c.fillText(store.coins, coinPillX + 51, coinPillY + 16);
c.restore();
```

### Coin Earn Animation

```js
// In HangoutScene constructor:
this.coinPopup = null; // { amount, timer }

// When earning coins, set:
this.coinPopup = { amount: earned, timer: 1.5 };

// In draw(), render floating "+X" near coin counter:
// In update(), tick: this.coinPopup.timer -= dt; clear when <= 0
```

### Minigame Coin Rewards (14-scene-minigame-base.js → finishGame)

After calculating stars and personal best, add:
```js
const coinReward = 5 + this.resultsStars * 5 + (this.newBest ? 10 : 0);
addCoins(coinReward);
this.coinReward = coinReward;
```

In `drawResults()`, show coin reward below personal best text:
```js
c.fillStyle = COLORS.gold;
c.font = '15px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
c.textAlign = "center";
c.fillText("+" + this.coinReward + " coins", W / 2, 228);
```

---

## Feature 2: Accessory/Wardrobe System

### Accessory Data (01-constants.js)

```js
const ACCESSORIES = {
  obi: [
    { key: "bandanaRed", name: "Red Bandana", price: 10, slot: "neck" },
    { key: "bandanaPlaid", name: "Plaid Bandana", price: 15, slot: "neck" },
    { key: "bandanaCamo", name: "Camo Bandana", price: 15, slot: "neck" },
    { key: "sweaterRed", name: "Red Sweater", price: 35, slot: "body" },
  ],
  luna: [
    { key: "bowPink", name: "Pink Bow", price: 10, slot: "head" },
    { key: "flowerCrown", name: "Flower Crown", price: 20, slot: "head" },
    { key: "starCollar", name: "Star Collar", price: 15, slot: "neck" },
  ]
};
```

### Storage

```js
wardrobe: loadJSON("wardrobe", {
  owned: [],
  equipped: { obi: null, luna: null }
}),
```

### Wardrobe Panel UI

Add a "Wardrobe" button to the hangout toolbar. **Check the actual current button positions in the code.** The existing toolbar has Games, 4 mode buttons, and Decor. Options:

**Option A:** Shrink Decor slightly and add Wardrobe next to it:
```js
this.decorButton = { x: 524, y: 16, w: 90, h: 40 };
this.wardrobeButton = { x: 620, y: 16, w: 100, h: 40 };
```

**Option B:** Move Wardrobe to a second row or make it a tab inside the Decor panel.

**Recommended: Option A** — but verify the Decor button's current position in the actual code and adjust so nothing overlaps.

The wardrobe panel opens as an overlay (same pattern as games/decor menus): dimmed background, cream panel, title, close button. Two columns: "Obi" (left) and "Luna" (right). Each accessory shown as a card with icon + name + price/owned + equip toggle. Coin balance shown in panel header.

### Accessory Rendering (09-sprites.js)

Add `drawAccessoryOverlay(c, pet, x, y, scale, pose, facing)` — called AFTER `drawObi`/`drawLuna` in hangout and backyard draw methods. This draws the equipped accessory atlas sprite at a position offset from the pet's anchor point.

Add `getAccessoryOffset(pet, key, pose)` — returns `{ dx, dy, scale, rot }` per accessory per pose. **These offsets WILL need manual tuning.** Start with reasonable defaults:

- Neck items (bandanas, collar): dy ≈ -50 to -55 (above foot anchor), small scale ~0.05
- Head items (bow, crown): dy ≈ -60 to -65, scale ~0.04
- Body items (sweater): dy ≈ -38 to -42, scale ~0.07, hidden during bath/sleep

Adjust per pose (sit, run, sleep, sniff, etc). Return `null` to hide the accessory for a given pose.

---

## Feature 3: Backyard Scene

### New File: `src/13b-scene-backyard.js`

A second room scene navigated to from the hangout. Shares pet state via the store. File sorts after 13-scene-hangout.js and before 14-scene-minigame-base.js.

### Navigation

Add a backyard door indicator in the hangout room — a subtle clickable area at the right edge:
```js
// Hitbox: { x: 740, y: 300, w: 60, h: 100 }
// Draw: translucent panel with "→ Backyard" text
```

On click: save pet joy to store, `transitionTo(SceneRegistry.create("backyard"))`.

The backyard has a "Go Inside" button/zone at the left edge. On click: save pet joy, `transitionTo(SceneRegistry.create("hangout"))`.

### Background

Procedural outdoor scene:
- Sky (respects time-of-day from Phase 2: morning=sunrise, day=blue, evening=sunset, night=dark+stars)
- Grass field (green gradients)
- Wooden picket fence along the back
- Tree on the right side with branch for Luna
- Garden patch (left-center), kiddie pool (center), bird feeder (right)

### Interactive Objects

**Bird Feeder (x: 620, y: 280):**
- Click: fills feeder. Birds arrive after 8–15s timer. Luna watches. +2 Luna joy per visit.
- Use `drawBird()` patterns from Phase 2 ambient events.

**Garden (x: 180, y: 460):**
- Click: plant a flower (costs 3 coins). Max 6 flowers.
- Obi occasionally digs up flowers when idle near garden. Uses `dig` pose. +4 Obi joy, loses a flower. "Obi dug up a tulip! Bad boy!"
- Flowers persist in `store.backyardFlowers`.

**Kiddie Pool (x: 420, y: 480):**
- Click: calls Obi over. On arrival, Obi uses `splash` pose for 3–5s. +6 joy. Water particles.
- Luna avoids the pool.

**Tree (x: 650, y: 200):**
- Not directly clickable. Luna naturally gravitates here when idle. Uses `treeSit` pose on the branch.

### Pet Behaviors

Similar to indoor updateObi/updateLuna but with outdoor activities:
- Obi: idle wander, dig in garden, splash in pool, sniff around yard
- Luna: climb tree (like tower retreat indoors), stalk bugs in grass (uses `stalk` pose), watch birds at feeder

### Sprite Pose Mappings (09-sprites.js)

These are NEW poses — add to drawObiSprite and drawLunaSprite:
```js
// In drawObiSprite:
else if (pose === "dig") frame = frames.dig;
else if (pose === "splash") frame = frames.splash;

// In drawLunaSprite:
else if (pose === "treeSit") frame = frames.treeSit;
else if (pose === "stalk") frame = frames.stalk;
```

**NOTE:** These frames (`obi.dig`, `obi.splash`, `luna.treeSit`, `luna.stalk`) come from the Phase 3 sprite batches (5a and 5b). If they haven't been processed into the atlas yet, the poses will fall through to default frames — this is fine for initial testing.

### Scene Registration
```js
SceneRegistry.register("backyard", () => new BackyardScene());
```

### Accessory Rendering
Call `drawAccessoryOverlay()` after each pet draw, same as in hangout.

---

## Feature 4: Photo Capture

### Camera Button

Add to both HangoutScene and BackyardScene. Position near the mute button area — **check actual mute button position in the code** (it's drawn at `W - 34, 32` in `drawSpeakerIcon`). Place camera to the left of it:
```js
this.cameraButton = { x: W - 98, y: 12, w: 40, h: 40 };
```

Draw as a procedural camera icon (rounded rect body + circle lens + flash rectangle).

### Capture Logic

```js
capturePhoto() {
  // 1. Render clean frame to offscreen canvas (background + characters, no HUD)
  const captureCanvas = makeBufferCanvas(W, H);
  const cc = captureCanvas.getContext("2d");
  // Draw scene background + characters at current positions
  // Include accessory overlays
  
  // 2. Subtle watermark
  cc.fillStyle = "rgba(122,78,54,0.3)";
  cc.font = '12px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
  cc.textAlign = "right";
  cc.fillText("Annie's Cozy Day", W - 12, H - 8);
  
  // 3. Download
  const dataURL = captureCanvas.toDataURL("image/png");
  if (isMobile) {
    window.open(dataURL, "_blank");
  } else {
    const link = document.createElement("a");
    link.download = "cozy-moment-" + Date.now() + ".png";
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  // 4. Flash effect + feedback
  this.cameraFlash = 0.4;
  audio.tinyChime();
  this.statusText = "Photo saved!";
  
  // 5. Save thumbnail for scrapbook (160×120 JPEG, ~3KB)
  const thumbCanvas = makeBufferCanvas(160, 120);
  thumbCanvas.getContext("2d").drawImage(captureCanvas, 0, 0, 160, 120);
  const thumbData = thumbCanvas.toDataURL("image/jpeg", 0.6);
  const photos = loadJSON("photos", []);
  photos.push({ data: thumbData, date: new Date().toDateString(), room: this.name });
  if (photos.length > 20) photos.shift();
  saveJSON("photos", photos);
}
```

### Camera Flash Effect
White fullscreen overlay at `globalAlpha = cameraFlash`, decaying at `dt * 2.5`.

---

## Feature 5: Scrapbook/Journal

### Storage

```js
scrapbook: loadJSON("scrapbook", { entries: [], photosViewed: 0 }),
```

### Entry System

```js
function addScrapbookEntry(type, text, icon) {
  const entry = { type, text, date: new Date().toDateString(), icon: icon || "star" };
  store.scrapbook.entries.push(entry);
  if (store.scrapbook.entries.length > 50) store.scrapbook.entries.shift();
  saveJSON("scrapbook", store.scrapbook);
}
```

**Auto-entries triggered by:**

| Event | Entry Text | Icon |
|-------|-----------|------|
| First game play | "Played Annie's Cozy Day for the first time!" | heart |
| First 3-star in any game | "Earned 3 stars in [game name]!" | star |
| Each achievement unlock | "[Achievement name] unlocked!" | star |
| Care streak 7 | "Reached a 7-day care streak!" | heart |
| Care streak 30 | "A whole month of daily care!" | heart |
| First accessory bought | "Bought [name] — first accessory!" | star |
| First backyard visit | "Explored the backyard for the first time!" | heart |
| First photo taken | "Took the first photo!" | star |
| Favorite discovered | "Discovered [pet]'s favorite: [action]!" | heart |
| Ambient event seen (first time per type) | "Saw [butterflies/birds/rain] outside!" | star |
| Obi digs a flower | "Obi dug up a flower in the garden!" | bone |

### Scrapbook Panel

Access via a "Scrapbook" button — a small book icon near the camera button:
```js
this.scrapbookButton = { x: W - 98, y: 56, w: 40, h: 40 };
```

Panel overlay with 3 tabs: **Photos** (thumbnail grid) / **Milestones** (entry list with icons + dates) / **Stats** (lifetime counters).

### Stats Tracking

Add to store.stats (with migration backfill for existing saves):
```js
totalSessions: 0,
totalJoyGiven: 0,
totalPhotos: 0,
totalCoinsEarned: 0,
```

---

## Storage Schema Changes

### New Keys
| Key | Type | Default |
|-----|------|---------|
| `coins` | number | 50 |
| `wardrobe` | JSON | `{owned:[], equipped:{obi:null, luna:null}}` |
| `backyardFlowers` | number | 0 |
| `photos` | JSON | `[]` |
| `scrapbook` | JSON | `{entries:[], photosViewed:0}` |

### Modified Keys
| Key | Change |
|-----|--------|
| `stats` | Add `totalSessions`, `totalJoyGiven`, `totalPhotos`, `totalCoinsEarned` |

---

## File-by-File Change Map

### `01-constants.js`
- Add `ACCESSORIES` object
- Add new title subtitles

### `02-storage.js`
- Add `coins`, `wardrobe`, `backyardFlowers`, `photos`, `scrapbook` to store
- Add `addCoins()`, `saveWardrobe()`, `addScrapbookEntry()` helpers
- Add stats fields + migration backfill

### `09-sprites.js`
- Add `drawAccessoryOverlay()` function (~25 lines)
- Add `getAccessoryOffset()` function (~40 lines)
- Add `dig`, `splash`, `treeSit`, `stalk` pose mappings in drawObiSprite/drawLunaSprite

### `13-scene-hangout.js`
- Add wardrobe button + panel + buy/equip logic
- Add camera button + capture logic + flash effect
- Add scrapbook button + panel (3 tabs)
- Add coin HUD display + earn animation
- Add backyard navigation door
- Add accessory overlay calls in draw()
- Add scrapbook entry triggers
- Add coin earning hooks (daily gift, bubble reward, favorites, streaks, daily tasks)

### `14-scene-minigame-base.js`
- Add coin reward in `finishGame()` + display in results

### NEW: `13b-scene-backyard.js` (~450 lines)
- Full outdoor scene with background, interactive objects, pet behaviors
- Bird feeder, garden, kiddie pool, tree mechanics
- Supports time-of-day, accessories, camera, joy persistence

---

## Implementation Order

1. **Storage + Constants** — coins, wardrobe, accessories data, scrapbook, new store keys. Build.
2. **Coin system** — addCoins helper, HUD display, earn animation. Build.
3. **Minigame coin rewards** — add to finishGame + results display. Build and test.
4. **Coin earning hooks** — daily gift, bubble reward, favorites, streak milestones, daily tasks. Build.
5. **Accessory rendering** — drawAccessoryOverlay + getAccessoryOffset in sprites.js. Build.
6. **Wardrobe UI** — button, panel, buy/equip flow. Build and test.
7. **Accessory offset tuning** — visual test each accessory per pose. Adjust values.
8. **Backyard sprite mappings** — dig, splash, treeSit, stalk poses. Build.
9. **Backyard scene** — create 13b-scene-backyard.js. Build.
10. **Backyard navigation** — door in hangout, "Go Inside" in backyard. Build and test.
11. **Photo capture** — camera button, clean render, download, thumbnail save. Build and test.
12. **Scrapbook storage + entries** — add auto-entry triggers throughout codebase. Build.
13. **Scrapbook panel UI** — photos/milestones/stats tabs. Build and test.
14. **Integration testing.**

After EVERY step, run `node build.js` and verify `✓ Syntax OK`.

---

## Testing Checklist

- [ ] Build passes with all new/modified files
- [ ] Coins display in HUD, earn animation works
- [ ] All 11 minigames award correct coins on completion
- [ ] Coin earning from daily gift, bubble rewards, favorites, streaks, daily tasks
- [ ] Wardrobe panel opens, shows accessories, correct owned/buyable state
- [ ] Buying deducts coins, equipping shows on pet
- [ ] Accessories render correctly on common poses (sit, run, sleep — visual check)
- [ ] Accessories visible in BOTH hangout and backyard
- [ ] Backyard door navigates hangout → backyard
- [ ] Backyard renders with correct time-of-day sky
- [ ] "Go Inside" navigates back, pet joy preserved
- [ ] Bird feeder, garden, kiddie pool, tree all functional
- [ ] Camera captures clean screenshot, triggers download
- [ ] Photo thumbnails saved to storage
- [ ] Scrapbook entries accumulate
- [ ] Scrapbook panel: photos/milestones/stats all render
- [ ] All 11 minigames still work
- [ ] All Phase 1 + 2 + 2b features still work
- [ ] localStorage stays under ~5MB
