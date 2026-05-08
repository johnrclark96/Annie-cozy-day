# Phase B — Medium fixes for `annies-cozy-day-test.html`

You are picking up where a previous Claude session left off on a single-file canvas game called **Annie's Cozy Day** (a 2D pixel/painted "cozy" pet sim, all rendered to one HTML5 canvas, no framework). Phase A (the 13 "Quick win" patches Q1–Q13 from the visual audit) is already complete and merged. This phase B implements the **Medium** bucket from that same audit — M1 through M10 — which restructure several pieces of UI rather than just retouching them.

---

## Repo layout

The project contains:

- `annies-cozy-day-test.html` — **the only file you edit.** ~9–10k lines. Single `<script>` block, classic-style classes (`HangoutScene`, `BackyardScene`, `BaseMinigameScene`, twelve `…Scene` minigame subclasses, `WardrobePanel`-ish drawing methods inline on `HangoutScene`, etc.). All state lives on `store.*` and is persisted via `saveJSON` / `loadJSON` helpers near the top.
- `audit-v2.html` — **read this first.** It is the visual audit deck that defined the work. Sections 1–10 describe the problems; **Section 11 ("What to fix, in order") at line ~1307** lists every fix as a row with an ID (Q#, M#, H#), an effort tag, a description, and the area of code it touches. The M-rows are your scope.
- `claude-code-prompt.md` — the prompt that drove Phase A (Q1–Q13). Useful as a style guide for how to structure your patches and acceptance criteria; do not re-apply those fixes, they are already in.
- `audit/` — screenshots referenced by the audit deck.

Read `audit-v2.html` Section 11 first, then skim Sections 2 (Hangout HUD), 3 (Backyard), 5 (Minigame intros), 6 (Panels — Decor/Wardrobe/Scrapbook), and 10 (Heart moments) for the design rationale behind each Medium fix.

---

## Scope: M1 → M10

Implement these in order. Each one is self-contained enough to ship and visually verify before moving on.

### M1 · Rebuild the minigame intro modal
- Touches: `BaseMinigameScene.drawInstructions` plus each subclass's `enter()` / instructions string (12 scenes).
- New modal anatomy: **eyebrow** (small caps category — "MINIGAME · CARE", "MINIGAME · PLAY", etc.) → **title** (big serif/display) → **one** body sentence (already trimmed in Q8 — keep it) → **bonus chip** (the care-tier chip — Q9 fixed the label) → **Start** button → tiny meta line below ("Tap or press Space to begin").
- The gameplay scene must render **behind** the modal at full opacity, then a single unified scrim (`INTRO_SCRIM`, already added in Q5) on top, then the modal card. No character should be clipped by the modal frame.
- Modal card: cream fill `#FFF8F0`, 1px warm-brown stroke `rgba(58,42,30,0.18)`, 16px radius, soft drop-shadow, max-width ~440px, centered. Content padding 32px. Don't draw a separate sprite for each game — typography is enough.

### M2 · Rebuild the hangout HUD as one widget
- Touches: `HangoutScene.draw` and the cluster of `…Button` rects on the class.
- Goal: the top of the hangout reads as **one continuous safe-area band**, not five overlapping widgets. Order left→right: tab row (Pet / Care / Play / Decor / Closet) · pet-status pills (Obi joy / Luna joy) · coin pill · star pill · icon group (mute · camera · scrapbook).
- All elements share the same chip vocabulary established in Q3 (28×28 icons, pill heights 28–32px, 12px radius). Use the `drawHudChip` helper added in Q3 wherever you need a chip background.
- Status pills lose the `Lv.1` chip (already done in Q11). Coin and star pills get a label + value layout instead of a tight icon-and-number.
- `SAFE` (already declared) is the gutter on every side.
- The status pills must not overlap the tab row's drop shadow. If the band is too wide, shrink the icon group's gaps before shrinking type.

### M3 · Shared Panel component
- Touches: a new `drawPanel(c, opts)` helper at the top of the rendering layer; then refactor **Game Menu**, **Decor**, **Wardrobe**, **Scrapbook** to use it.
- The helper draws: outer card frame (cream, soft warm-brown stroke, 16px radius, drop-shadow) · header band (title + subtitle + close X) · optional tab row · content area (the caller draws into this) · optional empty-state slot · optional lock chip overlay for items the player hasn't unlocked.
- Signature suggestion:
  ```js
  drawPanel(c, {
    x, y, w, h,
    title, subtitle,
    tabs: [{key, label, locked}],
    activeTab,
    onClose,            // hover/hit handled by caller; helper just draws the X
    contentDraw,        // (c, innerRect) => void
    emptyState,         // optional {icon, headline, hint}
  })
  ```
- After this, the four panels (Game Menu, Decor, Wardrobe, Scrapbook) should look like siblings — same chrome, same paddings, same close button. Only the content inside changes.
- **Important:** keep `data-comment-anchor` attributes intact if any panel has them. (Probably none in this canvas-only file, but verify.)

### M4 · Surface daily tasks + weekly challenges
- Touches: `HangoutScene` HUD (chip) + Scrapbook panel (full view).
- HUD chip: small "Today 2/3" pill in the icon group (right side of the HUD band from M2). Tapping it opens Scrapbook on the **Tasks** tab.
- Inside Scrapbook, add a new tab: **Tasks**. Show:
  - "Today" section — the 3 daily tasks for `store.dailyTasks`. Done items get a check + strikethrough; pending items show their reward.
  - "This Week" section — the active weekly challenge (already tracked in `store.weeklyChallenge` or equivalent — search for `weeklyChallenge` to confirm the field name) with progress bar.
- Reuse the `drawPanel` helper from M3.

### M5 · Wardrobe = paper-doll
- Touches: the Wardrobe panel inside `HangoutScene`.
- Replace the current flat list with a **paper-doll** layout: left column shows a large hero portrait of the active character (Obi / Luna / Annie), with their currently-equipped accessories rendered live. Right column is the item grid (3 columns of 54px squares, scrollable, already wired in Q-fixes via `getWardrobeItemRect`).
- Three character tabs at the top of the panel — **painted** chips with the character's face on each, not text-only. (You can render the head sprite at small scale; reuse `drawAccessoryOverlay` logic for previewing.)
- Equipping an item swaps it on the hero portrait immediately so the player sees the change before closing the panel.
- Slot indicators: under the hero portrait, three rows ("head / neck / body" for Obi, "head / neck" for Luna, "head / wrist" for Annie) showing what's currently in each slot with an "Unequip" affordance.

### M6 · Tab the Decor panel
- Touches: the Decor panel inside `HangoutScene`.
- Add four tabs at the top of the panel: **Room · Comfy Upgrades · Seasonal · Cozy Set**.
- Filter `DECOR_ITEMS` (line ~155 of source) by category — add a `category` field to each entry if missing. Map:
  - `roomPreset`, `timeOfDay`, `wallArt2`, `rugColor`, `lampOn`, `petBed` → **Room**
  - `comfyBowls`, etc. (anything that's a multi-buy upgrade) → **Comfy Upgrades**
  - season-locked items → **Seasonal**
  - the curated 5-item collection → **Cozy Set**
- Add a **lock chip** overlay on items the player can't afford or that require unlock state (e.g. seasonal items locked outside their window). Lock chip = small dark pill with a key icon and required state ("Need 7 stars" / "Available in Spring").
- Use the `drawPanel` helper from M3.

### M7 · Repaint placeholder props
- Touches: `drawLivingRoom`, the cat-tower drawing path, and minigame prop drawing in `WindowWatchScene` and `WheresLunaScene`.
- Targets to repaint:
  - **Floor bowls** (food + water) — currently iconographic, should match the painted style of the pet sprites. Add rim highlights, soft shadow underneath, ceramic feel.
  - **Cat-tower toy** (the dangling ball/feather) — currently a placeholder shape. Replace with a small painted feather + string or yarn ball.
  - **Window-watch leaf icon** — the `🍃`-style leaf in the minigame is a placeholder; paint a small gradient leaf with a midrib line.
  - **Where's-Luna "?" question mark** — currently a flat glyph. Render as a hand-painted `?` with the same warm-brown stroke as the rest of the UI.
- All four should use `COLORS.brown` / `COLORS.softPink` / `COLORS.gold` from the existing palette — do not introduce new colors.

### M8 · Pawstep targets become circular pet faces
- Touches: `PawstepPatternsScene`.
- Replace the 2×2 grid of form-style buttons with **four circular pet-face medallions** — two Obi heads + two Luna heads, randomly arranged each round (or always the same layout, your call — match what the gameplay needs).
- Each medallion: 80px circle, painted face (reuse the head-drawing code for Obi/Luna), warm-brown ring, soft drop-shadow. Active/lit-up state: ring brightens to gold, gentle pulse.
- Hit areas stay the same size as today's buttons; only the visual changes.

### M9 · Streak surfacing
- Touches: `TitleScene` + the `careStreak` hook (search `careStreak` to find the existing field).
- On the title screen, below the subtitle rotation, show a small ribbon: **"🔥 7-day streak"** (or whatever the current count is). If streak is 0, hide entirely — never show "0-day streak."
- At streak milestones (7 / 14 / 30 days), trigger a **celebration**: the ribbon glows gold for 1.5s on title-screen entry, particles spawn (`spawnParticleBurst` already exists), and a chime plays (`audio.tinyChime()` or a richer chord).
- Persist a `lastStreakCelebrated` field so each milestone fires exactly once.

### M10 · Welcome banner rotation
- Touches: the welcome message logic in `HangoutScene` (search `Welcome home` to find it).
- Replace the static "Welcome home!" with a mood-aware rotation. Write **15+** lines in the existing **Decor-Reaction voice** — observational, gentle, second-person. Examples:
  - "Obi's been waiting by the window."
  - "Luna left a sunbeam unattended on the rug."
  - "The kettle's still warm from this morning."
  - "Soft afternoon. Nothing urgent."
- Pick a line based on:
  - Time of day (morning / day / evening / night — `store.decor.timeOfDay`)
  - Pet mood (high-joy / low-joy)
  - Streak state (first visit today vs returning)
- Show the line in the existing welcome slot for ~4s on entry, then fade. Don't repeat the same line twice in a row across sessions — store `lastWelcomeIndex` in `store`.

---

## Style + craft guidelines (carry-forward from Phase A)

- **One file, one canvas.** No new files, no DOM elements, no external dependencies.
- **Reuse existing helpers:** `drawHudChip`, `pointInRect`, `clamp`, `rand`, `spawnParticleBurst`, `audio.tinyChime`, `addScrapbookEntry`, `saveJSON`, the `COLORS` constants. If you need a new helper, add it near the top of the script (above the scene classes).
- **Persistence:** any new state goes through `saveJSON` / `loadNumber` / `loadBool` with the `STORE_PREFIX`. Add a migration block in the store-loading section (~line 540) if old saves need to be upgraded.
- **Type:** match the existing font stack (`"Fredoka One", "Comic Sans MS", cursive` for display; default sans for body; the new mono stack from Q6 for HUD numerics).
- **No emoji** in production strings unless the existing code already used them in the same context. (The streak ribbon's 🔥 in M9 is the one approved exception — but feel free to paint it instead.)
- **Acceptance criteria for each fix:** the screen described in the audit row is now visibly that shape. No console errors. No regressions in unrelated scenes. Save/reload preserves all new state.

---

## Workflow

1. Read `audit-v2.html` Section 11 (line 1307+), then skim Sections 2, 3, 5, 6, 10 for design rationale.
2. Open `annies-cozy-day-test.html` and locate each touched class/method by search before editing.
3. Implement M1 first (it's the most visible win). Verify by loading the file and entering a minigame.
4. Then M2 → M10 in order.
5. After each fix, do a quick mental pass: "If a player loaded the game right now and saw only this screen, would the audit row still describe it?" If no — done. If yes — keep working.
6. Don't refactor outside the listed scope. If you spot something else broken, write it down at the bottom of the file in a `<!-- TODO -->` comment for a future phase, but don't fix it now.

The Heart-tagged fixes (H1+) are intentionally **out of scope** — they're a separate phase the user wants to do hands-on.
