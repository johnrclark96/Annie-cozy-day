# Annie's Cozy Day — 47-Bug Implementation Prompt

You are fixing 47 bugs in `annies-cozy-day-test.html`, a single-file HTML5 Canvas game (~11,250 lines) with all JS inlined inside an IIFE. The canvas is 800×600. All localStorage keys are prefixed `anniesCozyDay_`. Three storage helpers exist: `saveJSON`/`loadJSON`, `saveNumber`/`loadNumber`, `saveBool`/`loadBool`. A shared `rr(ctx, x, y, w, h, r)` function draws rounded rectangles. A `clamp(val, min, max)` function exists. A `dist(x1, y1, x2, y2)` distance function exists. A `rand(min, max)` random range function exists. `W=800, H=600` are constants.

Work through these 7 phases IN ORDER. Each phase's fixes depend on earlier phases being complete. After ALL phases are done, do a single careful review pass to make sure no fix introduced syntax errors or broke adjacent code.

---

## PHASE 1: Core Utility Functions (5 bugs)

### BUG-006 — drawButton() hover gradient ignores fill parameter [CRITICAL]
**Line ~900.** The hover gradient hardcodes red instead of using the button's `fill` color:
```js
const grad = c.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
grad.addColorStop(0, hovered ? "#DE5544" : "#D24A3C");
grad.addColorStop(1, fill);
```
**Fix:** Add a `lightenColor(hex, pct)` helper nearby that parses a hex color and shifts each RGB channel toward 255 by `pct` (0–1). Then replace the hardcoded colors:
```js
grad.addColorStop(0, hovered ? lightenColor(fill, 0.2) : fill);
grad.addColorStop(1, hovered ? fill : darkenColor(fill, 0.1));
```
Where `darkenColor` shifts channels toward 0. This makes every button's hover state derive from its own fill color. All 7 HUD buttons, results screen buttons, and decor panel buttons use `drawButton()`.

### BUG-010 — drawTooltip() fixed 220×74 box regardless of content [HIGH]
**Lines ~922–923.** Hardcoded dimensions:
```js
const w = 220;
const h = 74;
```
**Fix:** Use `ctx.measureText()` on the title and body strings to compute dynamic width/height:
```js
c.font = "bold 14px Arial";
const titleW = c.measureText(title).width;
c.font = "12px Arial";
const bodyW = c.measureText(body).width;
const w = Math.max(Math.max(titleW, bodyW) + 40, 120);
const h = Math.max(30 + (body ? 18 : 0) + 16, 50);
```
Keep a minimum of w=120, h=50. Make sure the tooltip box positioning logic (centering on x) still uses the new `w`.

### BUG-041 — Tooltip pointer triangle misaligned at canvas edges [LOW]
**Lines ~945–950.** The pointer triangle doesn't follow the tooltip when the box is clamped to stay on-screen:
```js
c.beginPath();
c.moveTo(x - 8, y);
c.quadraticCurveTo(x, y + 12, x + 8, y);
c.closePath();
```
**Fix:** After computing the clamped tooltip box position, calculate the offset between the original anchor x and the clamped box center. Shift the pointer triangle's x coordinates by this offset so the pointer always points at the source element:
```js
const clampedX = clamp(x, w/2 + 10, 800 - w/2 - 10);
const pointerX = x; // original anchor position
// Draw pointer at pointerX, not clampedX
c.moveTo(pointerX - 8, tooltipBottom);
c.quadraticCurveTo(pointerX, tooltipBottom + 12, pointerX + 8, tooltipBottom);
```
Also clamp the pointer itself to stay within the tooltip box bounds.

### BUG-011 — Status bar text has no clipping boundary [HIGH]
**Line ~6190.** In HangoutScene's draw method:
```js
c.fillText(this.statusText, 400, 560);
```
**Fix:** Wrap in a clip region matching the white status bar background:
```js
c.save();
c.beginPath();
c.rect(122, 540, 556, 40);
c.clip();
c.fillText(this.statusText, 400, 560);
c.restore();
```

### BUG-034 — Mute state not persisted across page reloads [LOW]
**Lines ~954–984 and ~11030–11031.**
NOTE: Upon code inspection, the mute toggle at line 11030 DOES already call `saveBool("muted", store.muted)`. However, verify that at audio initialization (early in the IIFE), the stored value is actually READ back:
```js
store.muted = loadBool("muted", false);
```
If this load call already exists and works, mark this as NOT A BUG. If the load is missing, add it near where `store.muted` is first initialized. Also ensure `audio.muted` is synced: `if (store.muted) { /* mute all audio channels */ }`.

---

## PHASE 2: Display Counters & Garland (5 bugs — 3 garland bugs are ONE coordinated change)

### BUG-001 — Decor panel shows "/21" but max stars is 33 [CRITICAL]
**Line ~6409:**
```js
c.fillText("Stars earned: " + stars + " / 21  •  Unlock items by earning stars in minigames!", W / 2, 130);
```
**Fix:** Replace `21` with the actual max. Count `Object.keys(GAME_CONFIGS).length * 3` if GAME_CONFIGS is in scope, or find the `gameCards` array and use `gameCards.length * 3`. If neither is accessible at this scope, hardcode `33` after verifying: the game has 11 minigames × 3 stars each = 33.

### BUG-002 — Scrapbook stats shows "/7" for accessories but total is 30 [CRITICAL]
**Line ~6755:**
```js
c.fillText("Accessories Owned: " + store.wardrobe.owned.length + " / 7", 120, sy);
```
**Fix:** Compute the real total dynamically: `Object.values(ACCESSORIES).reduce((sum, arr) => sum + arr.length, 0)`. If `ACCESSORIES` is not in scope, find where accessories are defined and count them. The correct total should be around 30.

### BUG-004 + BUG-013 + BUG-014 — Garland system (coordinated 3-bug fix) [CRITICAL+HIGH+HIGH]

These three bugs are ONE logical fix. The garland system stores values 0–3, but value 0 (Spring) renders as invisible because the guard is `if (d.garland > 0)`.

**Current code at line ~3176 (render):**
```js
if (d.garland > 0) {
  var gColors = [
    ["#FFB6C1", "#FFD700", "#87CEEB"],  // Spring
    ["#FF6347", "#FF4500", "#FFD700"],  // Summer
    ["#FF8C00", "#8B4513", "#DAA520"],  // Autumn
    ["#ADD8E6", "#B0C4DE", "#F0F8FF"],  // Winter
  ];
```

**Current code at line ~4162 (cycle):**
```js
store.decor[item.key] = (store.decor[item.key] + 1) % (item.max + 1);
```

**Current labels in decor panel (~6481):** The labels array likely is `["Spring", "Summer", "Autumn", "Winter"]`.

**Fix — shift the whole system so 0=Off, 1–4=seasons:**
1. Change the garland item's `max` from `3` to `4` (find where garland decor items are defined, likely in a decorItems array).
2. Change the render guard from `if (d.garland > 0)` to keep it as-is (0 means Off now, which correctly skips rendering).
3. Change the color array index from `gColors[d.garland]` or `gColors[d.garland - 1]` to `gColors[d.garland - 1]` (values 1–4 map to indices 0–3).
4. Change the labels array to `["Off", "Spring", "Summer", "Autumn", "Winter"]`.

This way cycling goes: Off → Spring → Summer → Autumn → Winter → Off. Existing saves with garland=0 now correctly mean "Off" (which is what they were showing anyway since Spring was invisible).

---

## PHASE 3: Panel Layout & Scrolling (4 bugs)

### BUG-003 — Wardrobe panel items cut off with no scroll [CRITICAL]
**Line ~6566:**
```js
if (wr.y + wr.h > 565) break;
```
**Fix:** Add a `wardrobeScrollOffset` property to HangoutScene (initialize to 0 in constructor or enter()). In the wardrobe draw loop, factor in the scroll offset when calculating each item's Y position. Add up/down scroll arrow buttons when content overflows (draw ▲ at top, ▼ at bottom of the panel). In the click handler, detect clicks on scroll arrows and adjust `wardrobeScrollOffset` (clamp to valid range). Reset `wardrobeScrollOffset = 0` when switching character tabs. Make sure click detection for wardrobe items also accounts for the scroll offset.

### BUG-021 — Scrapbook photo grid cuts off at row 3 [MEDIUM]
**Lines ~6684–6686:**
```js
var px = 80 + (pi % 4) * 170;
var py = 150 + Math.floor(pi / 4) * 140;
if (py > 510) break;
```
**Fix:** Add `scrapbookPhotoScroll` property. Instead of breaking when py > 510, render photos where `(py - scrollOffset)` is within visible range [150, 510]. Add scroll arrows when total photos > 12 (3 rows × 4 columns). In click handler, detect arrow clicks and adjust scroll. Photo click detection must also account for scroll offset.

### BUG-022 — Scrapbook milestones shows only last 8 [MEDIUM]
**Line ~6717:**
```js
var startIdx = Math.max(0, entries.length - 8);
```
**Fix:** Add `scrapbookMilestoneScroll` property. Replace the hard `entries.length - 8` with a scroll-based window. Show entries from `scrollOffset` to `scrollOffset + 8`. Add scroll arrows when entries.length > 8. Initialize scroll to show most recent entries (bottom of list).

### BUG-008 — Backyard scene missing status bar background [HIGH]
**Lines ~7364–7365.** BackyardScene draws status text directly with no background:
```js
c.globalAlpha = sAlpha;
c.fillText(this.statusText, 400, 560);
c.globalAlpha = 1;
```
**Fix:** Before the fillText, draw a white background bar matching the hangout scene style:
```js
c.globalAlpha = sAlpha;
c.fillStyle = "rgba(255,248,240,0.85)";
rr(c, 122, 540, 556, 36, 18);
c.fill();
c.fillStyle = "#5C4434";
c.textAlign = "center";
c.fillText(this.statusText, 400, 560);
c.globalAlpha = 1;
```

---

## PHASE 4: Minigame Mechanics (5 bugs)

### BUG-005 — Where's Luna hiding positions hardcoded [CRITICAL]
**Lines ~9135–9136:**
```js
const baseAX = [200, 400, 600][swap.a];
const baseBX = [200, 400, 600][swap.b];
```
**Fix:** Add randomization to the base positions. Instead of fixed `[200, 400, 600]`, generate positions with random offsets each round:
```js
const basePositions = [200, 400, 600].map(x => x + rand(-30, 30));
const baseAX = basePositions[swap.a];
const baseBX = basePositions[swap.b];
```
Also ensure the swap indices themselves are shuffled each game using Fisher-Yates. Verify Luna's reveal animation still works with the offset positions.

### BUG-028 — Window Watch flyer hitbox extends beyond visible window [MEDIUM]
**Line ~9346:**
```js
if (dist(x, y, f.x, f.y) < 36) {
```
**Fix:** Before the distance check, add a bounds check to ensure the flyer's center is within the visible window area. Find the window clipping rect coordinates (likely around x:42–210, y:52–204 based on the scene layout) and add:
```js
if (f.x < 72 || f.x > 192 || f.y < 52 || f.y > 204) continue;
if (dist(x, y, f.x, f.y) < 36) {
```

### BUG-007 — Cuddle Pile balance meter visually asymmetric [MEDIUM]
**Lines ~10167–10171:**
```js
rr(c, 270, 26, 152, 12, 6);  // left side: 152px
c.fill();
c.fillStyle = "#D39B6A";
rr(c, 422, 26, 160, 12, 6);  // right side: 160px
c.fill();
```
**Fix:** Make both sides equal width. Center at 426 (midpoint of 270–582 = 426):
```js
rr(c, 270, 26, 156, 12, 6);  // left side: 156px (270 to 426)
c.fill();
c.fillStyle = "#D39B6A";
rr(c, 426, 26, 156, 12, 6);  // right side: 156px (426 to 582)
c.fill();
```
Also update any balance marker lerp calculation that uses 422 as center — change to 426.

### BUG-045 — Results screen Back button navigates to wrong scene [LOW]
**Line ~7841:**
```js
} else if (pointInRect(x, y, btns.back)) {
  audio.menu();
  transitionTo(SceneRegistry.create("hangout"));
}
```
This code actually looks correct (navigates to "hangout"). Investigate further: the bug report says it goes to the wrong scene. Check if there's ANOTHER back button handler elsewhere in BaseMinigameScene that overrides this. Check if `returnScene` is used anywhere. If the code at line 7841 is correct, verify the actual navigation works by checking `SceneRegistry.create("hangout")` returns the right scene. If this is NOT actually buggy, leave it alone.

### BUG-015 — Games menu card accent bar radius exceeds width [MEDIUM]
**Line ~6330:**
```js
rr(c, cr.x, cr.y, 8, cr.h, 14);
```
**Fix:** Border radius (14) exceeds half the width (8/2 = 4). Change to:
```js
rr(c, cr.x, cr.y, 8, cr.h, 4);
```

---

## PHASE 5: Pet Behaviors & Interactions (6 bugs)

### BUG-012 — Luna missing 'body' accessory slot handler [HIGH]
**Lines ~2178–2196.** In `getAccessoryOffset()`, Luna only has 'head' and 'neck' cases defined — no 'body' case.
**Fix:** Add a body case for Luna in the switch statement:
```js
case "body": return { dx: 0, dy: -42, size: 46, rot: 0 };
```
Add pose-specific adjustments if Luna has different poses (lounge, belly-up, perch). Check if any `ACCESSORIES.luna` items use the "body" slot — if none do, this is preventive but still correct.

### BUG-025 — Thought bubbles request food/water when bowls are full [MEDIUM]
**Lines ~5219–5220:**
```js
if (food < 25) return "food";
if (water < 25) return "water";
```
**Fix:** These are the LOW-bowl priority checks (correct). The bug is in the random pool below them — "food" and "water" remain in the random selection pool even when bowls are full. After the priority checks, before the random selection, filter the wants pool:
```js
let wants = ["food", "water", "pet", "play", "brush"];
if (this.foodBowl.fill > 80) wants = wants.filter(w => w !== "food");
if (this.waterBowl.fill > 80) wants = wants.filter(w => w !== "water");
// then pick randomly from wants
```

### BUG-047 — Thought bubbles blocked when Luna is on non-floor perch [LOW]
**Line ~5264:**
```js
const canLuna = !this.lunaBubble && this.luna.perch === "floor" && !lunaBusy;
```
**Fix:** Remove the floor-only restriction:
```js
const canLuna = !this.lunaBubble && !lunaBusy;
```
Then adjust the bubble Y position to follow Luna's current perch position. Where the bubble is drawn, use `LUNA_PERCHES[this.luna.perch].y - 50` instead of a hardcoded Y. Make sure bubble click detection also uses the perch-relative position.

### BUG-018 — Pet interaction 5s timeout cuts short slow animations [MEDIUM]
**Line ~5198:**
```js
if (pi.phase > 5) { pi.active = false; pi.timer = rand(8, 14); pi.phase = 0; this.obi.sniffing = false; }
```
**Fix:** Replace the hard 5-second timeout with per-interaction durations. Where pet interactions are defined/initiated, add a duration property. Then change:
```js
const interactionDurations = { sniff: 6, bat: 4, lieNear: 8, lookAtAnnie: 5 };
const duration = interactionDurations[pi.type] || 5;
if (pi.phase > duration) { ... }
```
If `pi.type` doesn't exist, look at how the interaction type is tracked and adapt accordingly.

### BUG-037 — Obi bone carry animation shows no bone [LOW]
**Lines ~4789–4804.** The `carryingToy` state exists but no bone is drawn.
**Fix:** In Obi's draw function (find `drawObi` or where Obi's sprite/shape is rendered), add after the main body draw:
```js
if (this.obi.carryingToy) {
  c.fillStyle = "#D4B896";
  const boneX = this.obi.x + (this.obi.facing > 0 ? 12 : -12);
  const boneY = this.obi.y - 30;
  rr(c, boneX - 8, boneY - 3, 16, 6, 3);
  c.fill();
  // bone knobs
  c.beginPath();
  c.arc(boneX - 8, boneY, 4, 0, Math.PI * 2);
  c.arc(boneX + 8, boneY, 4, 0, Math.PI * 2);
  c.fill();
}
```
Find Obi's facing direction property (might be `obi.dir`, `obi.facing`, or `obi.flip`).

### BUG-042 — Luna teleport-slides between perches [LOW]
**Lines ~4842–4848.** Luna's position is directly lerped to the new perch target, causing a linear slide.
**Fix:** Add a jump arc. When Luna changes perch, set a `luna.jumping = true` flag and `luna.jumpPhase = 0`. In update, while jumping:
```js
if (this.luna.jumping) {
  this.luna.jumpPhase += dt * 2; // 0.5s jump
  if (this.luna.jumpPhase >= 1) {
    this.luna.jumping = false;
    this.luna.x = this.luna.targetX;
    this.luna.y = this.luna.targetY;
  } else {
    const t = this.luna.jumpPhase;
    this.luna.x = lerp(this.luna.jumpStartX, this.luna.targetX, t);
    this.luna.y = lerp(this.luna.jumpStartY, this.luna.targetY, t) - Math.sin(t * Math.PI) * 80;
  }
}
```
Set `jumpStartX/Y` to current position when the jump begins.

---

## PHASE 6: Economy & First-Visit Flow (6 bugs)

### BUG-027 — Dedication overlay hidden behind Daily Gift [MEDIUM]
**Lines ~4066–4078.** Both overlays can render simultaneously, with Daily Gift on top.
**Fix:** In the draw method, enforce ordering: if dedication is active, draw it LAST (on top) and skip drawing Daily Gift. Or in the logic that triggers Daily Gift, add a guard:
```js
if (this.dedication) return; // don't show daily gift while dedication is showing
```
In the dedication dismiss handler, after setting `this.dedication = null`, allow the Daily Gift to proceed.

### BUG-035 — Dedication can be dismissed instantly [LOW]
**Line ~5053.** The dedication's alpha fades in over 1.5s but clicks are accepted immediately.
**Fix:** In the dedication click handler, add a minimum display time:
```js
if (this.dedication && this.dedication.phase < 1.5) return; // too soon to dismiss
```
This ensures the player sees the dedication for at least 1.5 seconds.

### BUG-044 — Star milestones award coins with no visual notification [LOW]
**Lines ~506–520.** `checkStarMilestones()` calls `addCoins()` but shows nothing to the player.
**Fix:** After the `addCoins()` call, add visual feedback:
```js
// After addCoins(m.coins):
this.statusText = "★ Star Milestone! +" + m.coins + " coins!";
this.statusPulse = 1;
if (typeof audio !== "undefined" && audio.combo) audio.combo();
```
If there's a floating text system (`addFloatingText` or similar), also use that.

### BUG-024 — Care streak breaks with no grace period [MEDIUM]
**Lines ~5628–5636:**
```js
if (streak.lastCareDate !== today) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (streak.lastCareDate === yesterday.toDateString()) {
    streak.count++;
  } else {
    streak.count = 1;
  }
```
**Fix:** Add a 1-day grace period. Instead of resetting on any non-yesterday date, check if it was within 2 days:
```js
if (streak.lastCareDate !== today) {
  const lastDate = new Date(streak.lastCareDate);
  const now = new Date();
  const daysDiff = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
  if (daysDiff <= 2) {
    streak.count++;
    if (daysDiff === 2) {
      this.statusText = "Your streak was saved! Don't forget to visit tomorrow!";
      this.statusPulse = 1;
    }
  } else {
    streak.count = 1;
  }
```

### BUG-019 — Obi and Luna can't eat from bowls simultaneously [MEDIUM]
**Lines ~4818 and ~4922.** Each pet's eat check blocks when the OTHER pet is eating anything:
```js
// Obi's check (~4818):
if (this.foodBowl.fill > 20 && !this.luna.eating && Math.random() < dt * 0.08) {
// Luna's check (~4922):
if (this.foodBowl.fill > 20 && !this.obi.eating && Math.random() < dt * 0.06) {
```
**Fix:** Change the mutual exclusion to be per-bowl, not global. Allow simultaneous eating from DIFFERENT bowls:
```js
// Obi's food check:
if (this.foodBowl.fill > 20 && !(this.luna.eating && this.luna.eatingFrom === "food") && ...) {
// Luna's water check:
if (this.waterBowl.fill > 20 && !(this.obi.eating && this.obi.eatingFrom === "water") && ...) {
```
You'll need to track what each pet is eating from. When a pet starts eating, set `pet.eatingFrom = "food"` or `"water"`. If `eatingFrom` doesn't exist yet, add it.

### BUG-009 — Backyard coin pill Y-position inconsistent with hangout [HIGH]
**Line ~7335 (BackyardScene):**
```js
rr(c, 452, 12, 72, 22, 11);
```
**Fix:** Find the hangout scene's coin pill Y position (likely y=59 or similar — search for the coin pill draw in HangoutScene). Match the backyard's Y to the same value. If hangout uses `rr(c, 452, 56, 72, 22, 11)`, change backyard to match: `rr(c, 452, 56, 72, 22, 11)`. Update both the pill background AND the coin text Y coordinate.

---

## PHASE 7: Visual Polish & Cosmetic (12 bugs)

### BUG-030 — Title loading dots flash after art loads [LOW]
**Line ~3486:**
```js
const loadDots = ".".repeat(Math.floor(game.time * 2) % 4);
```
**Fix:** Guard dots with a loading check:
```js
if (!spriteArt || !spriteArt.ready) {
  const loadDots = ".".repeat(Math.floor(game.time * 2) % 4);
  c.fillText("Loading Cozy Art" + loadDots, W/2, y);
} else {
  c.fillText("Click to Start", W/2, y);
}
```
Find the actual readiness flag name (might be `assetsLoaded`, `imagesReady`, etc.).

### BUG-031 — Wall clock has no second hand [LOW]
**Lines ~3153–3166.** Only hour and minute hands.
**Fix:** After the minute hand, add a second hand:
```js
// Second hand
const secAngle = (game.time % 60) / 60 * Math.PI * 2 - Math.PI / 2;
c.strokeStyle = "#5C4434";
c.lineWidth = 1;
c.beginPath();
c.moveTo(clockCX, clockCY);
c.lineTo(clockCX + Math.cos(secAngle) * 14, clockCY + Math.sin(secAngle) * 14);
c.stroke();
```
Use the clock's center coordinates (find `clockCX`, `clockCY` or the equivalent in the existing code).

### BUG-032 — Music box sparkle too small [LOW]
**Line ~3201:**
```js
c.arc(257 + Math.sin(game.time * 3) * 5, 322 - Math.abs(Math.sin(game.time * 2)) * 6, 2, 0, Math.PI * 2);
```
**Fix:** Increase radius from 2 to 4. Increase alpha. Add 2–3 more sparkle particles at staggered phases:
```js
for (let si = 0; si < 3; si++) {
  const phase = game.time * 3 + si * 2.1;
  const sx = 257 + Math.sin(phase) * 8;
  const sy = 322 - Math.abs(Math.sin(game.time * 2 + si)) * 10;
  c.globalAlpha = 0.5 + Math.sin(phase) * 0.3;
  c.beginPath();
  c.arc(sx, sy, 3 + Math.sin(phase * 0.5), 0, Math.PI * 2);
  c.fillStyle = "#FFE4B5";
  c.fill();
}
c.globalAlpha = 1;
```

### BUG-036 — Package ambient event spawns partially offscreen [LOW]
**Line ~5709:**
```js
this.ambientEvent = { type: "package", timer: rand(10, 15), data: { x: 740, y: 458, alpha: 1 } };
```
**Fix:** Change `x: 740` to `x: 710` to keep the full package within the 800px canvas.

### BUG-038 — Backyard decor pagination arrows not styled consistently [LOW]
**Lines ~7436–7437:**
```js
if (this.byDecorPage > 0) { c.fillText("◄", 318, 548); }
if (this.byDecorPage < this.byDecorPageCount() - 1) { c.fillText("►", 482, 548); }
```
**Fix:** Add hover detection. Track mouse position and change arrow color on hover:
```js
const leftHovered = this.byDecorPage > 0 && this.mouseX > 308 && this.mouseX < 328 && this.mouseY > 536 && this.mouseY < 560;
const rightHovered = this.byDecorPage < this.byDecorPageCount() - 1 && this.mouseX > 472 && this.mouseX < 492 && this.mouseY > 536 && this.mouseY < 560;
c.fillStyle = leftHovered ? "#8B6914" : "#6B5030";
if (this.byDecorPage > 0) c.fillText("◄", 318, 548);
c.fillStyle = rightHovered ? "#8B6914" : "#6B5030";
if (this.byDecorPage < this.byDecorPageCount() - 1) c.fillText("►", 482, 548);
```

### BUG-040 — Wardrobe tab highlight colors don't differentiate characters [LOW]
**Lines ~6543–6545:**
```js
{ key: "obi", label: "Obi", x: 80, color: "#8B6914" },
{ key: "luna", label: "Luna", x: 170, color: "#9B7D3C" },
{ key: "annie", label: "Annie", x: 260, color: "#C07850" }
```
**Fix:** Change to character-themed colors:
```js
{ key: "obi", label: "Obi", x: 80, color: "#4A90D9" },    // blue (collar)
{ key: "luna", label: "Luna", x: 170, color: "#7DB36C" },   // green (eyes)
{ key: "annie", label: "Annie", x: 260, color: "#E8A84C" }  // warm orange (hair)
```

### BUG-029 — Room preset multiply tint doesn't apply to all elements [MEDIUM]
**Lines ~2767–2797.** The multiply composite tint is applied too early, before all room elements are drawn.
**Fix:** Restructure the draw order:
1. Draw base room (walls, floor)
2. Draw ALL furniture and decorations
3. Apply multiply tint over the full room area
4. Reset to `c.globalCompositeOperation = "source-over"`
5. Draw pets, UI, overlays

Move the tint block (`c.globalCompositeOperation = "multiply"` section) to AFTER all static room elements. Be careful not to tint pets or UI.

### BUG-016 — Title screen fixed subtitle before cycle starts [MEDIUM]
**Line ~3479:**
```js
c.fillText("A Cozy Minigame Collection", W / 2, 128);
```
**Fix:** Replace the hardcoded string with the cycling subtitle. Find the `TITLE_SUBTITLES` array (or equivalent) and the `subtitleIndex` property. Use:
```js
c.fillText(TITLE_SUBTITLES[this.subtitleIndex || 0], W / 2, 128);
```
In the scene's `enter()` method, initialize `this.subtitleIndex = Math.floor(Math.random() * TITLE_SUBTITLES.length)` so the first subtitle is random.

### BUG-039 — Weekly challenge progress not visible in main UI [LOW]
**Line ~5945:**
```js
c.fillText(store.weeklyChallenge.progress + "/" + store.weeklyChallenge.target, 694, 48);
```
**Fix:** Add a tooltip on hover showing challenge details. Add a subtle pulse when progress >= 80% of target:
```js
if (store.weeklyChallenge.progress >= store.weeklyChallenge.target * 0.8) {
  c.globalAlpha = 0.5 + Math.sin(game.time * 4) * 0.3;
  // draw glow behind the pill
  c.globalAlpha = 1;
}
```
Also add hover detection to show a tooltip with challenge name and reward.

### BUG-020 — Camera photo capture fails silently on file:// [MEDIUM]
**Lines ~5400–5406:**
```js
try {
  dataURL = captureCanvas.toDataURL("image/png");
} catch (e) {
  this.statusText = "Couldn't capture photo (try opening from a web server).";
  this.statusPulse = 1;
  return;
}
```
**Fix:** This actually already has error handling. Enhance it:
1. Set `this.statusPulse = 1` to make the message more visible.
2. Add a brief camera flash animation even on failure (so the button feels responsive):
```js
this.cameraFlash = 0.5; // triggers white flash overlay
```
3. Improve the error message for file:// specifically:
```js
if (location.protocol === "file:") {
  this.statusText = "Photo saved to memory! (Open from web server for full capture)";
} else {
  this.statusText = "Couldn't capture photo.";
}
```

### BUG-017 — Butterfly movement jerky at edges [MEDIUM]
**Lines ~5664–5667:**
```js
bf.x += Math.sin(game.time * 2.5 + bf.phase) * 20 * dt;
bf.y += Math.cos(game.time * 1.8 + bf.phase) * 12 * dt;
bf.x = clamp(bf.x, 70, 180);
bf.y = clamp(bf.y, 56, 196);
```
**Fix:** Replace hard clamp with smooth boundary steering:
```js
bf.x += Math.sin(game.time * 2.5 + bf.phase) * 20 * dt;
bf.y += Math.cos(game.time * 1.8 + bf.phase) * 12 * dt;
// Smooth boundary avoidance instead of hard clamp
if (bf.x < 80) bf.x += (80 - bf.x) * 0.1;
if (bf.x > 170) bf.x -= (bf.x - 170) * 0.1;
if (bf.y < 62) bf.y += (62 - bf.y) * 0.1;
if (bf.y > 190) bf.y -= (bf.y - 190) * 0.1;
```

### BUG-026 — Backyard garden flowers cap at 6 with no removal [MEDIUM]
**Line ~7167:**
```js
if (store.backyardFlowers < 6) {
```
**Fix:** When garden is full, change click behavior to harvest:
```js
if (store.backyardFlowers < 6) {
  // existing plant logic
} else {
  // Harvest
  store.coins += 5;
  saveNumber("coins", store.coins);
  store.backyardFlowers = 0;
  saveNumber("backyardFlowers", 0);
  this.statusText = "Harvested flowers! +5 coins";
  this.statusPulse = 1;
  if (audio.combo) audio.combo();
}
```

---

## DESIGN DECISION FLAGS (4 bugs — implement with LIGHT touches)

These are behaviors that may be intentional. Implement conservative improvements that preserve the original intent while adding clarity:

### BUG-023 — Daily Tasks: ALL 3 required for bonus (line ~5650)
**Action:** Keep the ALL-3 requirement. Add a progress indicator:
```js
// In the daily tasks UI, show "1/3", "2/3", "3/3 ★"
c.fillText(store.dailyTasks.completed.length + "/3", ...);
```

### BUG-033 — Joy decay doubles when bowls low (lines ~4784–4787)
**Action:** Cap total decay rate at 1.0/s to keep the game cozy:
```js
var obiDecay = 0.5;
if (this.foodBowl.fill < 20) obiDecay += 0.8;
if (this.waterBowl.fill < 20) obiDecay += 0.6;
obiDecay = Math.min(obiDecay, 1.0); // cap for cozy feel
```

### BUG-043 — Tier 4 AND vs OR logic (line ~112)
**Action:** Keep AND logic (it's endgame content) but add a UI hint showing which requirements are met:
```js
// In tier display, show checkmarks for met conditions:
// ✓ 30 stars  ✗ 14 achievements  ✓ 30-day streak
```

### BUG-046 — Joy decay time-based is functionally inert
**Action:** Leave the decay formula as-is (cozy game = no punishment for absence). No code change needed. This is working as intended for the game's tone.

---

## IMPORTANT IMPLEMENTATION NOTES

1. **File:** All changes are in `annies-cozy-day-test.html`. Single file, all JS is inline inside an IIFE.
2. **Test after each phase** by opening the file in a browser and checking that the game loads without console errors.
3. **The file has JS hooks at lines 11114–11153** (`window.__getScene()`, `window.__getSceneDetails()`, `window.__modifyScene()`, `window.__goToScene()`) — do NOT modify these.
4. **Be careful with the IIFE scope** — new variables/functions must be declared inside the existing scope, not at global level.
5. **Preserve all existing function signatures** — other code depends on them.
6. **For scroll implementations (Phase 3):** Use a consistent pattern across all three panels. Each needs: a scroll offset property, draw-time offset calculation, click handler for arrows, and clamping.
7. **For the garland fix (Phase 2):** All three garland bugs MUST be fixed together as one coordinated change or the system will be inconsistent.
8. **BUG-034 and BUG-045** may already be fixed in the current code — verify before changing anything. If the code is already correct, skip them.
