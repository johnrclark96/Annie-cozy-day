# Phase 2b Implementation Spec — Four New Minigames

> **IMPORTANT: Read this entire document before writing any code.** Same architecture rules as always: no modules, no IIFE wrappers, no "use strict", concatenated by `node build.js`, runs from `file://`. Phase 1 and Phase 2 must already be complete.

---

## Overview

Add 4 new minigames that require **zero new sprites** — they use existing character poses and procedural drawing. Each game has a distinct core mechanic not found in any of the existing 7 games.

| Game | Mechanic | Unique Feel |
|------|----------|-------------|
| Pillow Pop | Whack-a-mole reaction speed | Fast, punchy, funny |
| Where's Luna? | Shell game visual tracking | Calm, observant, satisfying |
| Window Watch | Click-to-catch with discrimination | Quick decision-making |
| Pawstep Patterns | Simon Says sequence memory | Rhythmic, progressively harder |

After this phase the game has **11 minigames**. Max stars rises from 21 to 33.

### New Files

```
src/15d-scene-pillow-pop.js
src/15e-scene-wheres-luna.js
src/15f-scene-window-watch.js
src/15g-scene-pawstep-patterns.js
```

These sort after the Phase 2 files (15b, 15c) and before 16-scene-laser-chase.js.

---

## Step 0: Storage & Constants Changes

### 02-storage.js

Add to store initialization:
```js
best_pillow: loadNumber("best_pillow", 0),
best_findluna: loadNumber("best_findluna", 0),
best_window: loadNumber("best_window", 0),
best_pawstep: loadNumber("best_pawstep", 0),
```

Add to `totalStarsEarned()` games array:
```js
{ best: store.best_pillow, thresholds: [100, 250, 500] },
{ best: store.best_findluna, thresholds: [80, 200, 400] },
{ best: store.best_window, thresholds: [120, 300, 600] },
{ best: store.best_pawstep, thresholds: [60, 150, 300] },
```

### 01-constants.js

Add to ACHIEVEMENTS array:
```js
{ key: "whackQueen", name: "Whack Queen", desc: "Score 250+ in Pillow Pop.", color: "#F48FB1", icon: "paw" },
{ key: "sharpEye", name: "Sharp Eye", desc: "Find Luna 8 times in a row in Where's Luna.", color: "#7CB342", icon: "catEye" },
{ key: "birdWatcher", name: "Bird Watcher", desc: "Score 300+ in Window Watch.", color: "#87CEEB", icon: "star" },
{ key: "goodMemory", name: "Good Memory", desc: "Repeat a 7-step sequence in Pawstep Patterns.", color: "#C39BD3", icon: "heart" },
```

Add to achievements defaults in store and backfill:
```js
whackQueen: false, sharpEye: false, birdWatcher: false, goodMemory: false,
```

### 13-scene-hangout.js

Add 4 new entries to `this.gameCards` array:
```js
{ key: "pillow", title: "Pillow Pop", desc: "Boop Luna before she hides again!", color: "#F48FB1", icon: "paw",
  best: () => { const s = store.best_pillow; const st = (s>=500?3:s>=250?2:s>=100?1:0); return "Best: " + s + "  " + "\u2605".repeat(st) + "\u2606".repeat(3-st); } },
{ key: "findluna", title: "Where's Luna?", desc: "Track Luna under the shuffling cushions!", color: "#7CB342", icon: "catEye",
  best: () => { const s = store.best_findluna; const st = (s>=400?3:s>=200?2:s>=80?1:0); return "Best: " + s + "  " + "\u2605".repeat(st) + "\u2606".repeat(3-st); } },
{ key: "window", title: "Window Watch", desc: "Help Luna catch birds and butterflies!", color: "#87CEEB", icon: "star",
  best: () => { const s = store.best_window; const st = (s>=600?3:s>=300?2:s>=120?1:0); return "Best: " + s + "  " + "\u2605".repeat(st) + "\u2606".repeat(3-st); } },
{ key: "pawstep", title: "Pawstep Patterns", desc: "Repeat the pet action sequences!", color: "#C39BD3", icon: "heart",
  best: () => { const s = store.best_pawstep; const st = (s>=300?3:s>=150?2:s>=60?1:0); return "Best: " + s + "  " + "\u2605".repeat(st) + "\u2606".repeat(3-st); } },
```

### Menu Layout Update

The menu now has **11 game cards**. The card layout needs to accommodate this. Options:

**Option A: Compact cards.** Reduce card height to 48px and spacing to 50px:
```js
getCardRect(i) {
  return { x: 90, y: 108 + i * 50, w: 620, h: 46 };
}
```
11 cards: bottom = 108 + 10×50 + 46 = 654. Panel needs height ~610:
```js
rr(c, 40, 50, 720, 540, 28);
```
Title font 14px, desc font 10px, icon circle radius 15px. This is tight but works.

**Option B: Scrollable menu with 6 visible + scroll arrows.** Show 6 cards at a time, with ▲/▼ arrows to scroll. Add `this.menuScroll` (0 to max) state:
```js
this.menuScroll = 0; // index of first visible card
const visibleCards = this.gameCards.slice(this.menuScroll, this.menuScroll + 6);
```
Draw ▲ if menuScroll > 0, ▼ if menuScroll + 6 < gameCards.length.

**Recommended: Option B (scrollable).** It preserves the existing card dimensions and readability, scales to any number of games, and the scroll arrows are trivial.

```js
// In constructor:
this.menuScroll = 0;

// getCardRect returns position for display slot 0-5:
getCardRect(displayIndex) {
  return { x: 90, y: 126 + displayIndex * 72, w: 620, h: 62 };
}

// In draw(), game cards section:
const visibleStart = this.menuScroll;
const visibleEnd = Math.min(visibleStart + 6, this.gameCards.length);
for (let vi = 0; vi < visibleEnd - visibleStart; vi++) {
  const i = visibleStart + vi;
  const card = this.gameCards[i];
  const cr = this.getCardRect(vi); // use display index, not card index
  const hover = this.menuHover === i; // hover tracks real index
  // ... draw card ...
}

// Scroll arrows:
if (this.menuScroll > 0) {
  // Draw ▲ at top of card area
  c.fillStyle = this.menuHover === "scrollUp" ? "#B84B3A" : "rgba(92,68,52,0.5)";
  c.font = '18px "Fredoka One", sans-serif';
  c.textAlign = "center";
  c.fillText("▲ more", W/2, 120);
}
if (visibleEnd < this.gameCards.length) {
  // Draw ▼ at bottom of card area
  c.fillStyle = this.menuHover === "scrollDown" ? "#B84B3A" : "rgba(92,68,52,0.5)";
  c.fillText("▼ more", W/2, 126 + 6 * 72 + 10);
}
```

**Scroll click handling** in `onClick()` menu section:
```js
if (this.menuHover === "scrollUp") { this.menuScroll = Math.max(0, this.menuScroll - 1); return; }
if (this.menuHover === "scrollDown") { this.menuScroll = Math.min(this.gameCards.length - 6, this.menuScroll + 1); return; }
```

**Hover detection** in `updateHover()` menu section — adjust to check visible card rects and scroll buttons:
```js
if (this.menuOpen) {
  this.menuHover = null;
  // Scroll buttons
  if (this.menuScroll > 0 && pointInRect(x, y, { x: W/2 - 50, y: 106, w: 100, h: 20 })) {
    this.menuHover = "scrollUp";
  } else if (this.menuScroll + 6 < this.gameCards.length && pointInRect(x, y, { x: W/2 - 50, y: 126 + 6*72 + 2, w: 100, h: 20 })) {
    this.menuHover = "scrollDown";
  } else {
    for (let vi = 0; vi < Math.min(6, this.gameCards.length - this.menuScroll); vi++) {
      const cr = this.getCardRect(vi);
      if (pointInRect(x, y, cr)) { this.menuHover = this.menuScroll + vi; break; }
    }
  }
  // Close button check stays the same
  const closeBtn = { x: W / 2 + 200, y: 84, w: 36, h: 36 };
  if (pointInRect(x, y, closeBtn)) this.menuHover = "close";
  return;
}
```

### Star Counter

Update the hardcoded star denominator from `/21` to `/33` (11 games × 3 stars each).

### Menu Click Routing

If Phase 2 already simplified the menu click handler to `transitionTo(SceneRegistry.create(key))`, no change needed — the new game keys automatically work. If not, add the new keys to the routing.

---

## Game 1: Pillow Pop

### File: `src/15d-scene-pillow-pop.js`

### Specs
| Property | Value |
|----------|-------|
| gameId | `"pillow"` |
| Title | `"Pillow Pop"` |
| Duration | 45 seconds |
| Thresholds | `[100, 250, 500]` |

### Concept

Luna pops up from behind cozy cushions arranged on a couch. The player clicks her to "boop" her before she ducks back down. She appears in random positions, stays visible for a decreasing amount of time, and occasionally fakes by showing just ear tips. Obi sometimes pops up too — clicking him is a miss (he's just being nosy).

### Layout

The couch from the living room background, centered. 5 cushion positions arranged across it:

```js
const CUSHION_POSITIONS = [
  { x: 160, y: 420, color: "#E8B8A0" },  // far left
  { x: 290, y: 410, color: "#A8C686" },  // left-center
  { x: 400, y: 400, color: "#FFB6C1" },  // center (slightly higher)
  { x: 510, y: 410, color: "#7FB3D5" },  // right-center
  { x: 640, y: 420, color: "#C39BD3" },  // far right
];
```

### State

```js
class PillowPopScene extends BaseMinigameScene {
  constructor() {
    super("pillow", "Pillow Pop",
      isMobile ? "Tap Luna when she pops up! Don't tap Obi!" 
               : "Click Luna when she pops up! Don't click Obi!",
      [100, 250, 500], 45);
    this.popups = [];        // active pop-up targets
    this.spawnTimer = 0;
    this.spawnRate = 1.4;    // seconds between spawns, decreases
    this.boopEffects = [];   // visual feedback at boop location
    this.missEffects = [];   // miss feedback
    this.streak = 0;         // consecutive hits
    this.obiAppearChance = 0.15; // increases over time
  }
}
```

### Popup Object

```js
{
  slot: 0-4,                // which cushion position
  type: "luna" | "obi" | "earFake",  // what appears
  riseT: 0,                 // 0→1 animation of rising above cushion
  holdT: 0,                 // how long at full visibility
  holdDuration: 1.2,        // total hold time (decreases with difficulty)
  fallT: 0,                 // 0→1 animation of ducking back
  phase: "rise" | "hold" | "fall",
  hit: false,               // has been clicked
}
```

### Update Logic

```js
updatePlay(dt) {
  const elapsed = this.duration - this.timeLeft;
  
  // Difficulty ramp
  this.spawnRate = Math.max(0.5, 1.4 - elapsed * 0.018);
  const holdDuration = Math.max(0.4, 1.2 - elapsed * 0.015);
  this.obiAppearChance = Math.min(0.3, 0.15 + elapsed * 0.003);
  
  // Spawn new popups
  this.spawnTimer -= dt;
  if (this.spawnTimer <= 0 && this.popups.filter(p => !p.hit).length < 2) {
    this.spawnPopup(holdDuration);
    this.spawnTimer = this.spawnRate;
  }
  
  // Update existing popups
  for (let i = this.popups.length - 1; i >= 0; i--) {
    const p = this.popups[i];
    if (p.phase === "rise") {
      p.riseT += dt * 4; // fast rise
      if (p.riseT >= 1) { p.riseT = 1; p.phase = "hold"; }
    } else if (p.phase === "hold") {
      p.holdT += dt;
      if (p.holdT >= p.holdDuration) { p.phase = "fall"; }
    } else if (p.phase === "fall") {
      p.fallT += dt * 3;
      if (p.fallT >= 1) {
        // Missed luna = combo reset
        if (p.type === "luna" && !p.hit) {
          this.combo = 1;
          this.streak = 0;
        }
        this.popups.splice(i, 1);
      }
    }
  }
  
  // Update effects
  for (let i = this.boopEffects.length - 1; i >= 0; i--) {
    this.boopEffects[i].life -= dt;
    if (this.boopEffects[i].life <= 0) this.boopEffects.splice(i, 1);
  }
  for (let i = this.missEffects.length - 1; i >= 0; i--) {
    this.missEffects[i].life -= dt;
    if (this.missEffects[i].life <= 0) this.missEffects.splice(i, 1);
  }
  
  if (this.score >= 250) this.queueAchievement("whackQueen");
}

spawnPopup(holdDuration) {
  // Pick a slot not currently in use
  const usedSlots = this.popups.map(p => p.slot);
  const available = [0,1,2,3,4].filter(s => !usedSlots.includes(s));
  if (available.length === 0) return;
  const slot = available[Math.floor(Math.random() * available.length)];
  
  let type = "luna";
  const r = Math.random();
  if (r < this.obiAppearChance) type = "obi";
  else if (r < this.obiAppearChance + 0.08) type = "earFake"; // just ears, no points but no penalty
  
  this.popups.push({
    slot, type,
    riseT: 0, holdT: 0, holdDuration,
    fallT: 0, phase: "rise", hit: false
  });
}
```

### Click Handling

```js
onGameClick(x, y) {
  for (const p of this.popups) {
    if (p.hit || p.phase === "fall") continue;
    const pos = CUSHION_POSITIONS[p.slot];
    // Visible height depends on rise/fall phase
    const visibility = p.phase === "rise" ? p.riseT : p.phase === "hold" ? 1 : 1 - p.fallT;
    if (visibility < 0.3) continue; // not visible enough to click
    
    const hitbox = { x: pos.x - 40, y: pos.y - 80 * visibility, w: 80, h: 80 * visibility };
    if (pointInRect(x, y, hitbox)) {
      if (p.type === "luna") {
        // Hit!
        const pts = 15 * this.combo;
        this.addScore(pts);
        this.combo++;
        this.streak++;
        p.hit = true;
        p.phase = "fall"; p.fallT = 0.3; // quick duck
        this.boopEffects.push({ x: pos.x, y: pos.y - 50, life: 0.6, text: "+" + pts });
        spawnParticleBurst(pos.x, pos.y - 50, [COLORS.softPink, COLORS.gold], 8, ["heart", "star"]);
        audio.catch();
        if (this.combo >= 5) screenShake(2, 0.1);
        if (this.combo > 1 && this.combo % 5 === 0) audio.combo();
        return;
      } else if (p.type === "obi") {
        // Wrong! Hit Obi by mistake
        this.addScore(-10);
        this.combo = 1;
        this.streak = 0;
        p.hit = true;
        p.phase = "fall";
        this.missEffects.push({ x: pos.x, y: pos.y - 50, life: 0.7 });
        audio.miss();
        screenShake(3, 0.15);
        return;
      }
      // earFake: clicking does nothing (no penalty, no reward)
      return;
    }
  }
}
```

### Drawing

```js
drawScene(c) {
  // Living room background
  drawLivingRoom(c);
  
  // Darken slightly for focus
  c.fillStyle = "rgba(40,28,18,0.15)";
  c.fillRect(0, 0, W, H);
  
  // Draw cushions with popups
  for (let i = 0; i < CUSHION_POSITIONS.length; i++) {
    const pos = CUSHION_POSITIONS[i];
    
    // Check if there's a popup at this slot
    const popup = this.popups.find(p => p.slot === i);
    
    if (popup && !popup.hit) {
      const visibility = popup.phase === "rise" ? popup.riseT 
                       : popup.phase === "hold" ? 1 
                       : 1 - popup.fallT;
      
      // Draw character peeking above cushion
      c.save();
      // Clip to only show the part above the cushion
      c.beginPath();
      c.rect(pos.x - 60, pos.y - 120, 120, 80 * visibility + 5);
      c.clip();
      
      if (popup.type === "luna") {
        drawLuna(c, pos.x, pos.y - 10, 0.85, {
          pose: "sit",
          tail: Math.sin(game.time * 3),
          earTwitch: earSignal(game.time + i),
          blink: blinkSignal(game.time + i * 0.7, 0.5),
          facing: Math.random() < 0.5 ? 1 : -1
        });
      } else if (popup.type === "obi") {
        drawObi(c, pos.x, pos.y - 5, 0.8, {
          pose: "sit",
          expression: "happy",
          tail: Math.sin(game.time * 8),
          bounce: 0.03,
          facing: i < 2 ? 1 : -1
        });
      } else if (popup.type === "earFake") {
        // Just draw two small triangles (ear tips) above cushion
        c.fillStyle = "#B8956A";
        const earY = pos.y - 10 - 20 * visibility;
        c.beginPath(); c.moveTo(pos.x - 12, earY + 14); c.lineTo(pos.x - 6, earY); c.lineTo(pos.x, earY + 14); c.fill();
        c.beginPath(); c.moveTo(pos.x + 6, earY + 14); c.lineTo(pos.x + 12, earY); c.lineTo(pos.x + 18, earY + 14); c.fill();
      }
      c.restore();
    }
    
    // Draw cushion on top (hides lower body)
    c.save();
    c.fillStyle = pos.color;
    c.beginPath();
    c.ellipse(pos.x, pos.y, 52, 28, 0, 0, Math.PI * 2);
    c.fill();
    // Cushion highlight
    c.fillStyle = "rgba(255,255,255,0.2)";
    c.beginPath();
    c.ellipse(pos.x - 8, pos.y - 6, 30, 14, -0.2, 0, Math.PI * 2);
    c.fill();
    // Cushion shadow
    c.fillStyle = "rgba(0,0,0,0.08)";
    c.beginPath();
    c.ellipse(pos.x, pos.y + 16, 48, 10, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  
  // Boop effects
  for (const e of this.boopEffects) {
    c.save();
    c.globalAlpha = clamp(e.life / 0.3, 0, 1);
    c.fillStyle = COLORS.gold;
    c.font = '20px "Fredoka One", sans-serif';
    c.textAlign = "center";
    c.strokeStyle = "rgba(255,255,255,0.7)";
    c.lineWidth = 3;
    c.strokeText(e.text, e.x, e.y - (0.6 - e.life) * 30);
    c.fillText(e.text, e.x, e.y - (0.6 - e.life) * 30);
    c.restore();
  }
  
  // Miss effects
  for (const e of this.missEffects) {
    c.save();
    c.globalAlpha = clamp(e.life / 0.3, 0, 1);
    c.fillStyle = COLORS.warmRed;
    c.font = '18px "Fredoka One", sans-serif';
    c.textAlign = "center";
    c.strokeStyle = "rgba(255,255,255,0.6)";
    c.lineWidth = 3;
    c.strokeText("Obi! No!", e.x, e.y - (0.7 - e.life) * 25);
    c.fillText("Obi! No!", e.x, e.y - (0.7 - e.life) * 25);
    c.restore();
  }
  
  // Streak display
  if (this.streak >= 3) {
    c.fillStyle = "rgba(255,248,240,0.7)";
    c.font = '14px "Fredoka One", sans-serif';
    c.textAlign = "center";
    c.fillText("Streak: " + this.streak + " boops!", W/2, 86);
  }
}

drawInstructionIcon(c, x, y) {
  // Luna ears peeking over a cushion
  c.save(); c.translate(x, y);
  c.fillStyle = "#FFB6C1";
  c.beginPath(); c.ellipse(0, 8, 30, 16, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#B8956A";
  c.beginPath(); c.moveTo(-10, 4); c.lineTo(-5, -12); c.lineTo(0, 4); c.fill();
  c.beginPath(); c.moveTo(6, 4); c.lineTo(11, -12); c.lineTo(16, 4); c.fill();
  c.restore();
}

drawResultCharacter(c) {
  drawLuna(c, 400, 405, 1.45, {
    pose: "sit", tail: Math.sin(game.time * 2.2),
    earTwitch: earSignal(game.time), blink: blinkSignal(game.time + 1.5, 0.45)
  });
}
```

### Registration
```js
SceneRegistry.register("pillow", () => new PillowPopScene());
```

---

## Game 2: Where's Luna?

### File: `src/15e-scene-wheres-luna.js`

### Specs
| Property | Value |
|----------|-------|
| gameId | `"findluna"` |
| Title | `"Where's Luna?"` |
| Duration | 60 seconds |
| Thresholds | `[80, 200, 400]` |

### Concept

Three large cushions on the floor. Luna hides under one (shown briefly), then the cushions shuffle. Player picks the correct cushion. Rounds get faster with more shuffles. Score based on correct picks with a speed bonus.

### State

```js
class WheresLunaScene extends BaseMinigameScene {
  constructor() {
    super("findluna", "Where's Luna?",
      isMobile ? "Watch where Luna hides, then tap the right cushion!" 
               : "Watch where Luna hides, then click the right cushion!",
      [80, 200, 400], 60);
    this.cushions = [
      { x: 200, y: 380, targetX: 200 },
      { x: 400, y: 380, targetX: 400 },
      { x: 600, y: 380, targetX: 600 }
    ];
    this.lunaSlot = 0;       // which cushion Luna is under (0-2)
    this.roundPhase = "show"; // "show" → "shuffle" → "pick" → "reveal"
    this.roundTimer = 0;
    this.shuffleMoves = [];  // planned swaps: [{a, b}]
    this.shuffleIndex = 0;
    this.shuffleT = 0;       // animation progress for current swap
    this.shuffleSpeed = 1.5; // seconds per swap, decreases
    this.numShuffles = 2;    // increases with rounds
    this.round = 0;
    this.consecutiveCorrect = 0;
    this.revealResult = null; // "correct" | "wrong"
    this.resultTimer = 0;
    this.pickable = false;   // true during pick phase
  }
}
```

### Round Flow

```js
startRound() {
  this.round++;
  // Difficulty ramp
  this.numShuffles = Math.min(8, 2 + Math.floor(this.round / 2));
  this.shuffleSpeed = Math.max(0.2, 1.2 - this.round * 0.08);
  
  // Luna hides under a random cushion
  this.lunaSlot = Math.floor(Math.random() * 3);
  this.roundPhase = "show";
  this.roundTimer = 0;
  this.pickable = false;
  this.revealResult = null;
  
  // Reset cushion positions
  this.cushions[0].x = 200; this.cushions[0].targetX = 200;
  this.cushions[1].x = 400; this.cushions[1].targetX = 400;
  this.cushions[2].x = 600; this.cushions[2].targetX = 600;
  
  // Plan shuffles
  this.shuffleMoves = [];
  for (let i = 0; i < this.numShuffles; i++) {
    const a = Math.floor(Math.random() * 3);
    let b = (a + 1 + Math.floor(Math.random() * 2)) % 3;
    this.shuffleMoves.push({ a, b });
  }
  this.shuffleIndex = 0;
  this.shuffleT = 0;
}
```

### Update Logic

```js
enter() {
  super.enter();
  this.round = 0;
  this.consecutiveCorrect = 0;
  // Don't start round here — startPlay triggers it
}

startPlay() {
  super.startPlay();
  this.startRound();
}

updatePlay(dt) {
  this.roundTimer += dt;
  
  if (this.roundPhase === "show") {
    // Show Luna peeking out for 1.2s
    if (this.roundTimer >= 1.2) {
      this.roundPhase = "shuffle";
      this.roundTimer = 0;
      this.shuffleIndex = 0;
      this.shuffleT = 0;
    }
  } else if (this.roundPhase === "shuffle") {
    if (this.shuffleIndex >= this.shuffleMoves.length) {
      // Done shuffling
      this.roundPhase = "pick";
      this.roundTimer = 0;
      this.pickable = true;
      return;
    }
    
    const swap = this.shuffleMoves[this.shuffleIndex];
    this.shuffleT += dt / this.shuffleSpeed;
    
    // Animate cushion swap
    const ca = this.cushions[swap.a];
    const cb = this.cushions[swap.b];
    const t = easeOutQuad(clamp(this.shuffleT, 0, 1));
    
    // Swap via arc (one goes high, one goes low)
    const baseAX = [200, 400, 600][swap.a];
    const baseBX = [200, 400, 600][swap.b];
    ca.x = lerp(baseAX, baseBX, t);
    cb.x = lerp(baseBX, baseAX, t);
    
    if (this.shuffleT >= 1) {
      // Commit the swap
      ca.x = baseBX; ca.targetX = baseBX;
      cb.x = baseAX; cb.targetX = baseAX;
      
      // Swap the actual cushion objects in the array
      [this.cushions[swap.a], this.cushions[swap.b]] = [this.cushions[swap.b], this.cushions[swap.a]];
      
      // Track where Luna went
      if (this.lunaSlot === swap.a) this.lunaSlot = swap.b;
      else if (this.lunaSlot === swap.b) this.lunaSlot = swap.a;
      
      this.shuffleIndex++;
      this.shuffleT = 0;
      
      // Reset positions for next swap
      this.cushions[0].x = this.cushions[0].targetX;
      this.cushions[1].x = this.cushions[1].targetX;
      this.cushions[2].x = this.cushions[2].targetX;
      
      audio.menu();
    }
  } else if (this.roundPhase === "pick") {
    // Waiting for player click — timeout after 4s
    if (this.roundTimer >= 4) {
      this.revealResult = "wrong";
      this.roundPhase = "reveal";
      this.roundTimer = 0;
      this.combo = 1;
      this.consecutiveCorrect = 0;
      audio.miss();
    }
  } else if (this.roundPhase === "reveal") {
    if (this.roundTimer >= 1.5) {
      this.startRound();
    }
  }
}
```

### Click Handling

```js
onGameClick(x, y) {
  if (!this.pickable) return;
  
  for (let i = 0; i < 3; i++) {
    const cx = this.cushions[i].x;
    if (Math.abs(x - cx) < 70 && Math.abs(y - 380) < 50) {
      this.pickable = false;
      this.roundPhase = "reveal";
      this.roundTimer = 0;
      
      if (i === this.lunaSlot) {
        // Correct!
        const speedBonus = Math.max(0, Math.round(20 - this.roundTimer * 5));
        const pts = (20 + speedBonus) * this.combo;
        this.addScore(pts);
        this.combo++;
        this.consecutiveCorrect++;
        this.revealResult = "correct";
        spawnParticleBurst(cx, 340, [COLORS.gold, COLORS.softPink], 12, ["star", "heart"]);
        audio.catch();
        if (this.consecutiveCorrect >= 8) this.queueAchievement("sharpEye");
        if (this.combo > 1 && this.combo % 5 === 0) audio.combo();
      } else {
        // Wrong!
        this.revealResult = "wrong";
        this.combo = 1;
        this.consecutiveCorrect = 0;
        audio.miss();
        screenShake(2, 0.12);
      }
      return;
    }
  }
}
```

### Drawing

```js
drawScene(c) {
  // Simple room background
  drawLivingRoom(c);
  c.fillStyle = "rgba(40,28,18,0.2)";
  c.fillRect(0, 0, W, H);
  
  // Draw cushions
  const cushionColors = ["#E8B8A0", "#A8C686", "#C39BD3"];
  for (let i = 0; i < 3; i++) {
    const cx = this.cushions[i].x;
    const cy = 380;
    
    // Luna peeking during "show" phase
    if (i === this.lunaSlot && this.roundPhase === "show") {
      drawLuna(c, cx, cy - 30, 0.7, {
        pose: "sit", tail: Math.sin(game.time * 3),
        blink: blinkSignal(game.time, 0.5), facing: 1
      });
    }
    
    // Luna revealed during "reveal" phase
    if (i === this.lunaSlot && this.roundPhase === "reveal") {
      drawLuna(c, cx, cy - 30, 0.7, {
        pose: "sit", tail: Math.sin(game.time * 4),
        earTwitch: earSignal(game.time), facing: 1
      });
    }
    
    // Cushion (drawn on top to hide Luna)
    if (!(this.roundPhase === "reveal" && i === this.lunaSlot)) {
      c.save();
      const hover = this.pickable && pointInRect(game.mouse.x, game.mouse.y, { x: cx - 70, y: cy - 50, w: 140, h: 100 });
      if (hover) drawGlowCircle(c, cx, cy, 70, "rgba(255,215,0,ALPHA)", 0.15);
      c.fillStyle = cushionColors[i % 3];
      c.beginPath(); c.ellipse(cx, cy, 60, 35, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "rgba(255,255,255,0.15)";
      c.beginPath(); c.ellipse(cx - 10, cy - 8, 35, 18, -0.15, 0, Math.PI * 2); c.fill();
      // Question mark during pick phase
      if (this.roundPhase === "pick") {
        c.fillStyle = "rgba(92,68,52,0.5)";
        c.font = '28px "Fredoka One", sans-serif';
        c.textAlign = "center";
        c.fillText("?", cx, cy + 10);
      }
      c.restore();
    }
  }
  
  // Result feedback
  if (this.roundPhase === "reveal" && this.revealResult) {
    c.save();
    c.globalAlpha = clamp(1 - this.roundTimer / 1.2, 0, 1);
    c.font = '32px "Fredoka One", sans-serif';
    c.textAlign = "center";
    if (this.revealResult === "correct") {
      c.fillStyle = COLORS.gold;
      c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 4;
      c.strokeText("Found her!", W/2, 200);
      c.fillText("Found her!", W/2, 200);
    } else {
      c.fillStyle = COLORS.warmRed;
      c.strokeStyle = "rgba(255,255,255,0.6)"; c.lineWidth = 4;
      c.strokeText("Not there!", W/2, 200);
      c.fillText("Not there!", W/2, 200);
    }
    c.restore();
  }
  
  // Shuffle count indicator
  if (this.roundPhase === "shuffle") {
    c.fillStyle = "rgba(92,68,52,0.4)";
    c.font = '14px "Fredoka One", sans-serif';
    c.textAlign = "center";
    c.fillText("Shuffling... " + (this.shuffleIndex + 1) + "/" + this.shuffleMoves.length, W/2, 300);
  }
  
  // Round indicator
  c.fillStyle = "rgba(92,68,52,0.4)";
  c.font = '13px "Fredoka One", sans-serif';
  c.textAlign = "center";
  c.fillText("Round " + this.round, W/2, 86);
}

drawInstructionIcon(c, x, y) {
  c.save(); c.translate(x, y);
  // Three cushions with a question mark
  for (let i = -1; i <= 1; i++) {
    c.fillStyle = ["#E8B8A0", "#A8C686", "#C39BD3"][i + 1];
    c.beginPath(); c.ellipse(i * 30, 0, 22, 14, 0, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = "#7A4E36";
  c.font = '16px "Fredoka One", sans-serif';
  c.textAlign = "center";
  c.fillText("?", 0, 6);
  c.restore();
}

drawResultCharacter(c) {
  drawLuna(c, 400, 405, 1.5, {
    pose: "sit", tail: Math.sin(game.time * 2.4),
    earTwitch: earSignal(game.time), blink: blinkSignal(game.time + 1, 0.4)
  });
}
```

### Registration
```js
SceneRegistry.register("findluna", () => new WheresLunaScene());
```

---

## Game 3: Window Watch

### File: `src/15f-scene-window-watch.js`

### Specs
| Property | Value |
|----------|-------|
| gameId | `"window"` |
| Title | `"Window Watch"` |
| Duration | 60 seconds |
| Thresholds | `[120, 300, 600]` |

### Concept

Luna sits at the window watching things fly by. Birds (15 pts) and butterflies (25 pts) are targets — click them to swat. Leaves (decoys) cost -10 if clicked. Golden butterflies (rare, 50 pts) appear after combos. Speed and frequency ramp up.

### Layout

The living room window area is the active play zone. Luna sits at the bottom of the window sill. Flying objects cross horizontally through the window frame. The rest of the room is dimmed.

### State

```js
class WindowWatchScene extends BaseMinigameScene {
  constructor() {
    super("window", "Window Watch",
      isMobile ? "Tap birds and butterflies! Don't tap the leaves!" 
               : "Click birds and butterflies! Don't click the leaves!",
      [120, 300, 600], 60);
    this.flyers = [];        // things flying across
    this.spawnTimer = 0;
    this.spawnRate = 1.2;
    this.lunaReact = 0;      // Luna reaction timer after catch
    this.scorePopups = [];
    this.leafWarning = 0;    // flash when leaf is clicked
    this.goldenReady = false;
  }
}
```

### Flyer Object

```js
{
  type: "bird" | "butterfly" | "leaf" | "golden",
  x: -30 or W+30,   // start off-screen
  y: rand(80, 190),  // within window area
  vx: rand(40, 80) * direction, // speed
  vy: 0,             // slight sine wave applied in update
  phase: rand(0, 6.28), // for sine wave + wing flap
  wingPhase: rand(0, 6.28),
  alive: true
}
```

### Points
- Bird: 15 × combo
- Butterfly: 25 × combo
- Golden butterfly: 50 × combo
- Leaf: -10 (and resets combo)

### Update Logic

```js
updatePlay(dt) {
  const elapsed = this.duration - this.timeLeft;
  this.spawnRate = Math.max(0.3, 1.2 - elapsed * 0.012);
  this.lunaReact = Math.max(0, this.lunaReact - dt);
  this.leafWarning = Math.max(0, this.leafWarning - dt * 3);
  
  // Spawn flyers
  this.spawnTimer -= dt;
  if (this.spawnTimer <= 0) {
    this.spawnFlyer(elapsed);
    this.spawnTimer = this.spawnRate;
  }
  
  // Update flyers
  for (let i = this.flyers.length - 1; i >= 0; i--) {
    const f = this.flyers[i];
    f.x += f.vx * dt;
    f.y += Math.sin(game.time * 2 + f.phase) * (f.type === "leaf" ? 30 : 15) * dt;
    f.wingPhase += dt * (f.type === "butterfly" || f.type === "golden" ? 16 : 10);
    
    // Remove if off screen
    if ((f.vx > 0 && f.x > W + 40) || (f.vx < 0 && f.x < -40)) {
      if (f.alive && (f.type === "bird" || f.type === "butterfly" || f.type === "golden")) {
        // Missed a target — reset combo for birds/butterflies only
        this.combo = 1;
      }
      this.flyers.splice(i, 1);
    }
  }
  
  // Score popups
  for (let i = this.scorePopups.length - 1; i >= 0; i--) {
    this.scorePopups[i].life -= dt;
    this.scorePopups[i].y -= 35 * dt;
    if (this.scorePopups[i].life <= 0) this.scorePopups.splice(i, 1);
  }
  
  // Golden butterfly after 5+ combo
  if (this.combo >= 5 && !this.goldenReady) {
    this.goldenReady = true;
  }
  
  if (this.score >= 300) this.queueAchievement("birdWatcher");
}

spawnFlyer(elapsed) {
  const fromLeft = Math.random() < 0.5;
  const x = fromLeft ? -30 : W + 30;
  const dir = fromLeft ? 1 : -1;
  const speed = rand(40, 80) + elapsed * 0.5;
  
  let type;
  const r = Math.random();
  if (this.goldenReady && r < 0.15) {
    type = "golden";
    this.goldenReady = false;
  } else if (r < 0.35) type = "bird";
  else if (r < 0.65) type = "butterfly";
  else type = "leaf";
  
  this.flyers.push({
    type, x, y: rand(80, 190),
    vx: speed * dir, vy: 0,
    phase: rand(0, 6.28), wingPhase: rand(0, 6.28),
    alive: true
  });
}
```

### Click Handling

```js
extraInteractiveAt() { return true; }

onGameClick(x, y) {
  // Only clickable within the window-ish area
  for (let i = this.flyers.length - 1; i >= 0; i--) {
    const f = this.flyers[i];
    if (!f.alive) continue;
    if (dist(x, y, f.x, f.y) < 36) {
      f.alive = false;
      
      if (f.type === "leaf") {
        this.addScore(-10);
        this.combo = 1;
        this.leafWarning = 1;
        audio.miss();
        this.scorePopups.push({ x: f.x, y: f.y, text: "-10", color: COLORS.warmRed, life: 0.8 });
        screenShake(2, 0.1);
      } else {
        const base = f.type === "golden" ? 50 : f.type === "butterfly" ? 25 : 15;
        const pts = base * this.combo;
        this.addScore(pts);
        this.combo++;
        this.lunaReact = 0.4;
        this.scorePopups.push({ x: f.x, y: f.y, text: "+" + pts, color: COLORS.gold, life: 1 });
        spawnParticleBurst(f.x, f.y, f.type === "golden" ? [COLORS.gold, "#FFF4C0"] : [COLORS.softPink, COLORS.gold], f.type === "golden" ? 14 : 8, ["star", "heart"]);
        audio.catch();
        if (this.combo > 1 && this.combo % 5 === 0) audio.combo();
      }
      this.flyers.splice(i, 1);
      return;
    }
  }
}
```

### Drawing

Use the butterfly/bird/leaf drawing from Phase 2 ambient events (or similar procedural drawing). Luna sits at the window sill watching.

```js
drawScene(c) {
  drawLivingRoom(c);
  
  // Dim everything except window area
  c.fillStyle = "rgba(40,28,18,0.35)";
  c.fillRect(0, 0, W, H);
  // Bright window cutout
  c.save();
  c.globalCompositeOperation = "destination-out";
  c.fillStyle = "rgba(0,0,0,1)";
  rr(c, 42, 28, 168, 210, 12);
  c.fill();
  c.restore();
  // Redraw window area bright
  c.save();
  c.beginPath();
  rr(c, 42, 28, 168, 210, 12);
  c.clip();
  // Sky
  c.fillStyle = "#B8E0F0";
  c.fillRect(42, 28, 168, 210);
  
  // Draw flyers
  for (const f of this.flyers) {
    if (!f.alive) continue;
    c.save();
    c.translate(f.x, f.y);
    
    if (f.type === "bird") {
      this.drawBirdFlyer(c, f);
    } else if (f.type === "butterfly" || f.type === "golden") {
      this.drawButterflyFlyer(c, f);
    } else if (f.type === "leaf") {
      this.drawLeafFlyer(c, f);
    }
    c.restore();
  }
  c.restore();
  
  // Window frame on top
  c.strokeStyle = "#C8A882";
  c.lineWidth = 6;
  rr(c, 42, 28, 168, 210, 12);
  c.stroke();
  
  // Luna at window sill
  drawLuna(c, 126, 260, 0.9, {
    pose: "sit",
    tail: Math.sin(game.time * 3),
    earTwitch: this.lunaReact > 0 ? 1 : earSignal(game.time),
    pawBat: this.lunaReact > 0 ? 0.6 : 0,
    blink: blinkSignal(game.time + 1, 0.5),
    facing: 1
  });
  
  // Legend
  c.save();
  c.fillStyle = "rgba(255,248,240,0.85)";
  rr(c, 260, 80, 200, 100, 12);
  c.fill();
  c.font = '12px "Fredoka One", sans-serif';
  c.fillStyle = "#5A3E2B";
  c.textAlign = "left";
  c.fillText("🐦  Bird = 15 pts", 275, 105);
  c.fillText("🦋  Butterfly = 25 pts", 275, 125);
  c.fillText("✨  Golden = 50 pts", 275, 145);
  c.fillStyle = COLORS.warmRed;
  c.fillText("🍃  Leaf = -10 pts!", 275, 165);
  c.restore();
  
  // Score popups
  for (const sp of this.scorePopups) {
    c.save();
    c.globalAlpha = clamp(sp.life, 0, 1);
    c.font = '18px "Fredoka One", sans-serif';
    c.textAlign = "center";
    c.strokeStyle = "rgba(60,40,20,0.7)"; c.lineWidth = 3;
    c.strokeText(sp.text, sp.x, sp.y);
    c.fillStyle = sp.color || COLORS.gold;
    c.fillText(sp.text, sp.x, sp.y);
    c.restore();
  }
  
  // Leaf warning flash
  if (this.leafWarning > 0) {
    c.save();
    c.globalAlpha = this.leafWarning * 0.12;
    c.fillStyle = COLORS.warmRed;
    c.fillRect(0, 0, W, H);
    c.restore();
  }
}

drawBirdFlyer(c, f) {
  const dir = f.vx > 0 ? 1 : -1;
  c.scale(dir, 1);
  c.fillStyle = "#6B4A2A";
  c.beginPath(); c.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#5A3A2A";
  c.beginPath(); c.arc(8, -5, 5, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#E8A84C";
  c.beginPath(); c.moveTo(12, -5); c.lineTo(18, -4); c.lineTo(12, -3); c.closePath(); c.fill();
  c.fillStyle = "#1A1A1A";
  c.beginPath(); c.arc(10, -6, 1.2, 0, Math.PI * 2); c.fill();
  // Wing flap
  const wingY = Math.sin(f.wingPhase) * 6;
  c.fillStyle = "#8B6B4A";
  c.beginPath(); c.ellipse(-2, wingY - 5, 10, 4, -0.3, 0, Math.PI * 2); c.fill();
}

drawButterflyFlyer(c, f) {
  const wingAngle = Math.sin(f.wingPhase) * 0.6;
  const color = f.type === "golden" ? COLORS.gold : ["#E88090", "#87CEEB", "#C39BD3"][Math.floor(f.phase) % 3];
  
  if (f.type === "golden") {
    drawGlowCircle(c, 0, 0, 18, "rgba(255,215,0,ALPHA)", 0.2);
  }
  
  c.fillStyle = color;
  c.save(); c.rotate(-wingAngle);
  c.beginPath(); c.ellipse(-6, 0, 9, 5, -0.3, 0, Math.PI * 2); c.fill();
  c.restore();
  c.save(); c.rotate(wingAngle);
  c.beginPath(); c.ellipse(6, 0, 9, 5, 0.3, 0, Math.PI * 2); c.fill();
  c.restore();
  c.fillStyle = "#3E2723";
  c.fillRect(-1, -4, 2, 8);
}

drawLeafFlyer(c, f) {
  c.save();
  c.rotate(Math.sin(game.time * 2 + f.phase) * 0.5); // tumbling
  c.fillStyle = "#8BC860";
  c.beginPath(); c.ellipse(0, 0, 10, 6, 0.3, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#6BAA48";
  c.lineWidth = 1;
  c.beginPath(); c.moveTo(-8, 0); c.lineTo(8, 0); c.stroke();
  c.restore();
}

drawInstructionIcon(c, x, y) {
  c.save(); c.translate(x, y);
  // Window frame with butterfly
  c.strokeStyle = "#7A4E36"; c.lineWidth = 3;
  rr(c, -20, -16, 40, 32, 4); c.stroke();
  c.fillStyle = "#E88090";
  c.beginPath(); c.ellipse(6, -2, 6, 3, 0.3, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(-2, -2, 6, 3, -0.3, 0, Math.PI * 2); c.fill();
  c.restore();
}

drawResultCharacter(c) {
  drawLuna(c, 400, 405, 1.5, {
    pose: "sit", tail: Math.sin(game.time * 2.2),
    earTwitch: earSignal(game.time), blink: blinkSignal(game.time + 1.5, 0.45)
  });
}
```

### Registration
```js
SceneRegistry.register("window", () => new WindowWatchScene());
```

---

## Game 4: Pawstep Patterns

### File: `src/15g-scene-pawstep-patterns.js`

### Specs
| Property | Value |
|----------|-------|
| gameId | `"pawstep"` |
| Title | `"Pawstep Patterns"` |
| Duration | 90 seconds |
| Thresholds | `[60, 150, 300]` |

### Concept

Simon Says with pets. The game shows a sequence of pet actions (Obi sits, Luna paws, Obi shakes, etc.), then the player repeats it by clicking buttons. Each successful repetition extends the sequence by one. Failed repetition resets the sequence. Score based on sequence length completed × combo.

### Actions

4 possible actions, each tied to a pet doing something visible:

```js
const PAWSTEP_ACTIONS = [
  { key: "sit", label: "Sit", pet: "obi", pose: "sit", expression: "happy", color: "#4A90D9" },
  { key: "paw", label: "Paw", pet: "luna", pose: "pounce", expression: null, color: "#A8C686" },
  { key: "shake", label: "Shake", pet: "obi", pose: "shake", expression: "excited", color: "#E8A84C" },
  { key: "groom", label: "Groom", pet: "luna", pose: "groom", expression: null, color: "#C39BD3" },
];
```

### Layout

Obi on the left, Luna on the right, both large and centered. 4 action buttons across the bottom half of the screen in a 2×2 grid:

```js
const ACTION_BUTTONS = [
  { x: 200, y: 440, w: 150, h: 60 }, // Sit (Obi)
  { x: 450, y: 440, w: 150, h: 60 }, // Paw (Luna)
  { x: 200, y: 510, w: 150, h: 60 }, // Shake (Obi)
  { x: 450, y: 510, w: 150, h: 60 }, // Groom (Luna)
];
```

### State

```js
class PawstepPatternsScene extends BaseMinigameScene {
  constructor() {
    super("pawstep", "Pawstep Patterns",
      isMobile ? "Watch the pets, then tap the actions in the same order!" 
               : "Watch the pets, then click the actions in the same order!",
      [60, 150, 300], 90);
    this.sequence = [];       // array of action keys: ["sit", "paw", "shake", ...]
    this.playbackIndex = 0;   // current index during "show" phase
    this.inputIndex = 0;      // current index during "input" phase
    this.roundPhase = "generate"; // "generate" → "show" → "input" → "result"
    this.showTimer = 0;
    this.showDuration = 0.8;  // time per action during show, decreases
    this.activeAction = null; // currently displayed action { key, timer }
    this.resultTimer = 0;
    this.resultType = null;   // "correct" | "wrong"
    this.buttonFlash = {};    // { key: timer } for button press feedback
    this.longestSequence = 0;
    this.round = 0;
  }
}
```

### Round Flow

```js
startNewSequence() {
  this.sequence = [];
  this.addToSequence();
  this.addToSequence(); // start with length 2
  this.round = 0;
  this.beginShowPhase();
}

addToSequence() {
  const keys = PAWSTEP_ACTIONS.map(a => a.key);
  // Avoid repeating the last action
  let next;
  do {
    next = keys[Math.floor(Math.random() * keys.length)];
  } while (this.sequence.length > 0 && next === this.sequence[this.sequence.length - 1]);
  this.sequence.push(next);
}

beginShowPhase() {
  this.roundPhase = "show";
  this.playbackIndex = 0;
  this.showTimer = 0;
  this.showDuration = Math.max(0.35, 0.8 - this.sequence.length * 0.04);
  this.activeAction = null;
}

beginInputPhase() {
  this.roundPhase = "input";
  this.inputIndex = 0;
  this.activeAction = null;
}
```

### Update Logic

```js
enter() {
  super.enter();
  this.sequence = [];
  this.longestSequence = 0;
  this.round = 0;
  this.buttonFlash = {};
}

startPlay() {
  super.startPlay();
  this.startNewSequence();
}

updatePlay(dt) {
  // Update button flashes
  for (const key in this.buttonFlash) {
    this.buttonFlash[key] -= dt;
    if (this.buttonFlash[key] <= 0) delete this.buttonFlash[key];
  }
  
  if (this.activeAction) {
    this.activeAction.timer -= dt;
    if (this.activeAction.timer <= 0) this.activeAction = null;
  }
  
  if (this.roundPhase === "show") {
    this.showTimer += dt;
    
    if (this.showTimer >= this.showDuration) {
      this.showTimer = 0;
      
      if (this.playbackIndex < this.sequence.length) {
        // Show next action
        const actionKey = this.sequence[this.playbackIndex];
        const action = PAWSTEP_ACTIONS.find(a => a.key === actionKey);
        this.activeAction = { key: actionKey, timer: this.showDuration * 0.7 };
        this.buttonFlash[actionKey] = this.showDuration * 0.7;
        audio.tinyChime();
        this.playbackIndex++;
      } else {
        // Done showing — player's turn
        this.beginInputPhase();
      }
    }
  } else if (this.roundPhase === "result") {
    this.resultTimer += dt;
    if (this.resultTimer >= 1.2) {
      if (this.resultType === "correct") {
        // Extend sequence and show again
        this.round++;
        this.addToSequence();
        this.beginShowPhase();
      } else {
        // Reset sequence
        this.startNewSequence();
      }
    }
  }
}
```

### Click Handling

```js
extraInteractiveAt(x, y) {
  if (this.roundPhase !== "input") return false;
  return ACTION_BUTTONS.some(b => pointInRect(x, y, b));
}

onGameClick(x, y) {
  if (this.roundPhase !== "input") return;
  
  for (let i = 0; i < ACTION_BUTTONS.length; i++) {
    if (pointInRect(x, y, ACTION_BUTTONS[i])) {
      const clickedKey = PAWSTEP_ACTIONS[i].key;
      const expectedKey = this.sequence[this.inputIndex];
      
      this.buttonFlash[clickedKey] = 0.3;
      this.activeAction = { key: clickedKey, timer: 0.4 };
      
      if (clickedKey === expectedKey) {
        // Correct!
        audio.tinyChime();
        this.inputIndex++;
        
        if (this.inputIndex >= this.sequence.length) {
          // Completed the sequence!
          this.longestSequence = Math.max(this.longestSequence, this.sequence.length);
          const pts = this.sequence.length * 10 * this.combo;
          this.addScore(pts);
          this.combo++;
          this.roundPhase = "result";
          this.resultTimer = 0;
          this.resultType = "correct";
          spawnParticleBurst(400, 300, [COLORS.gold, COLORS.softPink], 12, ["star", "heart"]);
          audio.catch();
          if (this.combo > 1 && this.combo % 3 === 0) audio.combo();
          if (this.sequence.length >= 7) this.queueAchievement("goodMemory");
        }
      } else {
        // Wrong!
        this.roundPhase = "result";
        this.resultTimer = 0;
        this.resultType = "wrong";
        this.combo = 1;
        audio.miss();
        screenShake(3, 0.15);
      }
      return;
    }
  }
}
```

### Drawing

```js
drawScene(c) {
  // Soft background
  const bg = c.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#FFF8F0");
  bg.addColorStop(1, "#F5E6D3");
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);
  
  // Warm spotlight
  drawGlowCircle(c, 400, 300, 250, "rgba(255,240,210,ALPHA)", 0.08);
  
  // Pets
  const obiPose = this.activeAction && PAWSTEP_ACTIONS.find(a => a.key === this.activeAction.key)?.pet === "obi"
    ? PAWSTEP_ACTIONS.find(a => a.key === this.activeAction.key).pose : "sit";
  const lunaPose = this.activeAction && PAWSTEP_ACTIONS.find(a => a.key === this.activeAction.key)?.pet === "luna"
    ? PAWSTEP_ACTIONS.find(a => a.key === this.activeAction.key).pose : "sit";
  
  drawObi(c, 280, 370, 1.3, {
    pose: obiPose,
    expression: obiPose === "shake" ? "excited" : "happy",
    tail: Math.sin(game.time * (obiPose === "shake" ? 12 : 6)),
    bounce: obiPose !== "sit" ? 0.06 : 0.02,
    facing: 1
  });
  
  drawLuna(c, 520, 360, 1.2, {
    pose: lunaPose === "pounce" ? "pounce" : lunaPose === "groom" ? "groom" : "sit",
    tail: Math.sin(game.time * 2.4),
    earTwitch: earSignal(game.time),
    pounceStretch: lunaPose === "pounce" ? 0.7 : 0,
    facing: -1
  });
  
  // Action buttons
  for (let i = 0; i < 4; i++) {
    const btn = ACTION_BUTTONS[i];
    const action = PAWSTEP_ACTIONS[i];
    const flash = this.buttonFlash[action.key] || 0;
    const hover = this.roundPhase === "input" && pointInRect(game.mouse.x, game.mouse.y, btn);
    const isInputPhase = this.roundPhase === "input";
    
    c.save();
    // Button glow on flash
    if (flash > 0) {
      drawGlowCircle(c, btn.x + btn.w/2, btn.y + btn.h/2, btn.w * 0.7, "rgba(255,215,0,ALPHA)", flash * 0.3);
    }
    // Button background
    rr(c, btn.x, btn.y, btn.w, btn.h, 14);
    c.fillStyle = flash > 0 ? action.color : hover ? "rgba(255,255,255,1)" : "rgba(255,252,245,0.9)";
    c.fill();
    c.strokeStyle = flash > 0 ? COLORS.gold : hover ? action.color : "rgba(146,104,72,0.2)";
    c.lineWidth = flash > 0 ? 3 : 2;
    c.stroke();
    // Button label
    c.fillStyle = flash > 0 ? "#FFF8F0" : isInputPhase ? "#5C3D2E" : "rgba(92,61,46,0.4)";
    c.font = '18px "Fredoka One", sans-serif';
    c.textAlign = "center";
    c.fillText(action.label, btn.x + btn.w/2, btn.y + btn.h/2 + 7);
    // Pet label
    c.font = '11px "Fredoka One", sans-serif';
    c.fillStyle = flash > 0 ? "rgba(255,248,240,0.7)" : "rgba(92,61,46,0.4)";
    c.fillText(action.pet === "obi" ? "Obi" : "Luna", btn.x + btn.w/2, btn.y + 18);
    c.restore();
  }
  
  // Phase indicator
  c.save();
  c.fillStyle = "rgba(92,68,52,0.5)";
  c.font = '16px "Fredoka One", sans-serif';
  c.textAlign = "center";
  if (this.roundPhase === "show") {
    c.fillText("Watch carefully...", W/2, 80);
    // Progress dots
    for (let i = 0; i < this.sequence.length; i++) {
      c.fillStyle = i < this.playbackIndex ? COLORS.gold : "rgba(200,180,160,0.5)";
      c.beginPath(); c.arc(W/2 - (this.sequence.length - 1) * 10 + i * 20, 100, 5, 0, Math.PI * 2); c.fill();
    }
  } else if (this.roundPhase === "input") {
    c.fillText("Your turn! Repeat the pattern", W/2, 80);
    // Progress dots
    for (let i = 0; i < this.sequence.length; i++) {
      c.fillStyle = i < this.inputIndex ? COLORS.gold : "rgba(200,180,160,0.5)";
      c.beginPath(); c.arc(W/2 - (this.sequence.length - 1) * 10 + i * 20, 100, 5, 0, Math.PI * 2); c.fill();
    }
  }
  c.restore();
  
  // Result overlay
  if (this.roundPhase === "result") {
    c.save();
    c.globalAlpha = clamp(1 - this.resultTimer / 1, 0, 1);
    c.font = '28px "Fredoka One", sans-serif';
    c.textAlign = "center";
    if (this.resultType === "correct") {
      c.fillStyle = COLORS.gold;
      c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 4;
      c.strokeText("Sequence length: " + this.sequence.length + "!", W/2, 200);
      c.fillText("Sequence length: " + this.sequence.length + "!", W/2, 200);
    } else {
      c.fillStyle = COLORS.warmRed;
      c.strokeStyle = "rgba(255,255,255,0.6)"; c.lineWidth = 4;
      c.strokeText("Wrong! Starting over...", W/2, 200);
      c.fillText("Wrong! Starting over...", W/2, 200);
    }
    c.restore();
  }
  
  // Sequence length display
  c.fillStyle = "rgba(92,68,52,0.4)";
  c.font = '13px "Fredoka One", sans-serif';
  c.textAlign = "center";
  c.fillText("Longest: " + this.longestSequence + " steps", W/2, H - 10);
}

drawInstructionIcon(c, x, y) {
  c.save(); c.translate(x, y);
  // Paw prints in a row
  for (let i = -1; i <= 1; i++) {
    c.fillStyle = ["#4A90D9", "#A8C686", "#C39BD3"][i + 1];
    c.beginPath(); c.arc(i * 18, 0, 7, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}

drawResultCharacter(c) {
  drawObi(c, 340, 405, 1.2, {
    pose: "sit", expression: "excited",
    tail: Math.sin(game.time * 10), bounce: 0.06
  });
  drawLuna(c, 460, 400, 1.1, {
    pose: "sit", tail: Math.sin(game.time * 2.2),
    earTwitch: earSignal(game.time)
  });
}
```

### Registration
```js
SceneRegistry.register("pawstep", () => new PawstepPatternsScene());
```

---

## Implementation Order

1. **Storage + Constants** — 4 new best scores, 4 new achievements, backfill migration. `node build.js`.
2. **totalStarsEarned update** — add 4 new game entries. Star counter → `/33`. `node build.js`.
3. **Menu scroll system** — `menuScroll` state, scroll arrows, adjusted hover/click detection, 4 new gameCards entries. `node build.js` and test menu.
4. **Pillow Pop** — create `15d-scene-pillow-pop.js`. `node build.js` and test.
5. **Where's Luna?** — create `15e-scene-wheres-luna.js`. `node build.js` and test.
6. **Window Watch** — create `15f-scene-window-watch.js`. `node build.js` and test.
7. **Pawstep Patterns** — create `15g-scene-pawstep-patterns.js`. `node build.js` and test.
8. **Integration testing** — all 11 games launch, play, score, return to hub correctly.

Run `node build.js` after EVERY step.

---

## Testing Checklist

- [ ] Build passes with all 4 new scene files
- [ ] Menu shows 11 games with scroll arrows working
- [ ] Star counter displays /33
- [ ] Pillow Pop: Luna pops up, clicking her scores, clicking Obi penalizes, speed ramps
- [ ] Where's Luna?: cushions shuffle correctly, Luna tracking is accurate, speed bonus works
- [ ] Window Watch: flyers spawn and cross window, clicking birds/butterflies scores, clicking leaves penalizes, golden butterfly appears after combo
- [ ] Pawstep Patterns: sequence shows correctly, buttons map to correct pet poses, wrong press resets, sequence extends on success
- [ ] All 4 achievements trigger at correct thresholds
- [ ] Pause/resume works in all 4 games
- [ ] Results screen shows correct stars for all 4 games
- [ ] Play Again / Back buttons work
- [ ] All existing 7 games still work
- [ ] Mobile touch works for all 4 games
