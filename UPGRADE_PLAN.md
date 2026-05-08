# Upgrade Plan — Annie's Cozy Day

> **Source:** Single-file IIFE (`annies-cozy-day-test.html`, ~14,038 lines), GitHub Pages, solo-dev workflow. Q-tier (Q1–Q13) shipped 2026-05-07 — those items are NOT restated below.
>
> **Architecture is fixed.** Everything below stays inside the existing IIFE. "Unified components" mean shared draw helpers + constants in the same file.
>
> **Conventions for chunks:** each chunk is sized to ~30 min of solo work, leaves the build syntax-clean (per the node `Function(m[1])` syntax check in `CLAUDE.md`), and is committable on its own. Order within a phase is the recommended commit order. Phase 1 helpers are referenced (not reinvented) by all later phases.

---

## Phase 1: Foundation — shared helpers & constants

**Goal:** Add the small set of reusable draw helpers and constants that every later phase depends on. No visible behavioural change yet beyond fixing F-tier inconsistencies as the helpers are wired in.

**Audit findings addressed:** F1, F2, F5, F6, F7 (groundwork), L3 (groundwork)

**Lines/sections touched:**
- 76–105 (constants block)
- 900–1000 (UI functions)
- 1416–1465 (`HUD_MONO`, `drawHudTime`, `drawHudScore`, `drawHudChip`)
- New helpers added contiguously after 1465

**Dependencies:** none.

### Chunk 1.1 — Add HUD anchor grid constants and `placePill(side, slot)` helper

Audit anchor (quoted from `AUDIT.md`):
> **F1 · systemic [🔴 high] — The HUD has no grid.** Tab pills overflow at "Wardrobe." Pet status pills, coin/star counters, top-right buttons, and the bottom Goal pill all live at hand-placed pixel coordinates. Nothing is anchored to a safe area, and nothing shares a row.

What changes: Add a `HUD_GRID` constant block immediately after the `SAFE` / `INTRO_SCRIM` constants near line 83 (e.g. `HUD_GRID.row1 = SAFE`, `row2 = SAFE + 28 + 6`, `pillH = 22`, `pillGap = 6`, etc., derived from the existing inventory below). Add a `placePill(side, slot, w)` helper that returns `{x, y, w, h}` for `side ∈ {"tl","tr","bl","br"}`. Do **not** rewire any draws yet — just add the helper and the constants and run the syntax check.

Inventory of HUD pill positions today (from HUD audit):
- Hangout coin pill `(452, 59, 72×22)`, star `(527, 59, 68×22)`, streak `(527, 34, 68×20)`, daily-tasks `(600, 34, 60×20)`, weekly `(664, 34, 60×20)`, Obi pill `(14, 62, 140×38)`, Luna pill `(646, 62, 140×38)`, goal `(SAFE, 510, _, 22)`.
- Backyard coin `(452, 59, 72×22)`.
- BaseMinigameScene Time `(SAFE, 12, 130×46)`, Score `(W-SAFE-132, 12, 132×46)`, Combo subline at `(W-SAFE-66, 76)`, footer pills various.

DoD: New constants compile; `placePill("tr", 0, 130)` returns `{x: W - SAFE - 130, y: SAFE, w: 130, h: 46}` (or whatever values the constants encode). No call sites changed yet. Syntax check passes.

Risk: None — additive only.

### Chunk 1.2 — Migrate the BaseMinigameScene HUD to `placePill`

Audit anchor:
> **F6 · systemic [🔴 high] — The top-right action stack clips Score.** In every minigame, the Score pill on the right is partly hidden by the sound icon. Sound, camera, and (in hangout) scrapbook each have a different bevel/radius. The pause "‖" is yet another shape next to the rounded "Time:" pill.

What changes: In `drawTopHud` (line ~9997) and the Cuddle override (line 12362) and WildWand override (line 13272), replace the hard-coded `(SAFE, 12, 130, 46)` and `(W-SAFE-132, 12, 132, 72)` rects with `placePill("tl", 0, 130)` and `placePill("tr", 0, 132)`. Keep all visual output identical (visual diff = 0). Verify that the Score pill no longer collides with the mute chip at `(W-SAFE-28, SAFE)` by adjusting the row-0 width budget so `placePill("tr", 0)` ends at `W-SAFE-28-6` (i.e. 6px gutter from the mute chip stack).

DoD: All 12 minigames render Time/Score in the same canvas-relative position; mute chip and Score pill no longer overlap. Visual diff against pre-change screenshot is 0 except for ≤6px shift on Score. Syntax check passes.

Risk: low — pure positioning. Cuddle Pile balance meter must keep `(200, 12, 430, 46)` since it's not a Score pill; it only co-locates with the Time pill.

### Chunk 1.3 — Add `drawPanelFrame(opts)` and `drawPanelClose(panel, hovered)` helpers

Audit anchor:
> **F7 · systemic [🔴 high] — The four "modal" panels are inconsistent with each other.** Game Menu, Decor, Wardrobe, Scrapbook all use a different layout, a different close-button position, a different way of paginating, and a different tab style. They were built four times. They want to be one component.

What changes: Add two helpers near `drawButton` (line ~1466):
- `drawPanelFrame(c, {x, y, w, h, title})` — draws the dim layer (`rgba(40,28,18,0.55)` fillRect 0,0,W,H), the cream `rgba(255,248,240,0.97)` rounded-rect with brown stroke, and (optionally) the title text.
- `drawPanelClose(c, panel, hovered)` — draws the close-button circle at `panel.x + panel.w - 22, panel.y + 22` with the existing X glyph.

These helpers do **not** replace any existing panel draws yet. They are scaffolding for chunks 2.x and 3.x.

DoD: Helpers exist and are callable. No call sites yet. Syntax check passes.

Risk: None — additive.

### Chunk 1.4 — Add `drawPanelTabs(panel, tabs, activeKey, onClickFn)` helper

Audit anchor (continuation of F7 above; tabs specifically): the wardrobe panel uses three 80×26 tabs at `(80/170/260, 130)` (line 8017–8033), the scrapbook uses four tabs of varying widths at `(80/158/256/314, 110)` (line 8143–8160), the decor panel has none, and the game menu has none. Three different idioms.

What changes: Add a `drawPanelTabs(c, panel, tabs, activeKey)` helper that draws a segmented pill row anchored to `panel.x + 24, panel.y + 60` with equal widths. It also returns an array of `{key, rect}` for hit-testing. Add a companion `panelTabHit(panel, tabs, x, y)` that returns the matching key.

DoD: Helpers exist; one synthetic test call from a `__panelTabsTest` window hook returns the expected hit-key for known coords. No live panel uses them yet. Syntax check passes.

Risk: low.

### Chunk 1.5 — Add `drawIntroModal(c, {title, body, iconFn, bonusText})` unified intro

Audit anchor:
> **F5 · systemic [🔴 high] — Every minigame intro stacks five blocks at the same weight.** Title · body · pictogram · "Happy Pets Bonus" green text · Esc/Click footnote — all roughly the same size. Plus the dim-overlay strength varies per scene (Laser Chase is near-black; Window Watch is barely tinted).

What changes: Add `drawIntroModal` that draws (1) the unified `INTRO_SCRIM` (already constant), (2) the cream rounded card at `(145, 150, 510, 260)` matching today's `BaseMinigameScene.drawInstructionCard` line 10037, (3) eyebrow label (small grey caps "TIER 2 · 60s"), (4) display title at the existing y=198 location, (5) one body sentence at y=252, (6) optional bonus chip below the body (single chip — no separate line, no Steam-toast voice; uses the chip text from Q9), (7) a single thin meta line at the bottom (`Tap to start · Esc to cuddle instead`). The icon function stays the same callback signature so existing per-minigame icons still work.

This helper is **drop-in** to replace the existing `drawInstructionCard` in BaseMinigameScene. Do not rewire scenes yet — just add the helper next to the existing one and verify both compile.

DoD: Helper exists. `drawInstructionCard` is unchanged. Syntax check passes.

Risk: None — purely additive.

### Chunk 1.6 — Add `drawLabelStack(c, x, y, label, value, opts)` and font constants

Audit anchor:
> **F2 · systemic [🔴 high] — One typeface is doing seven jobs.** "Fredoka One" is set on every text element — title, body, Time/Score readouts, button labels, fine print. It's a beautiful display face, but as body text it's soft and as a HUD digit it's mushy.

What changes: Add three font-stack constants near `HUD_MONO` (line 1416):
- `FONT_DISPLAY = '"Fredoka One", "Comic Sans MS", cursive, sans-serif'` (today's default — keep for titles only)
- `FONT_BODY = 'system-ui, "Segoe UI", -apple-system, sans-serif'`
- `FONT_MONO = HUD_MONO`

Add `drawLabelStack(c, x, y, label, value, opts={size:22, side:"left"})` that uses `FONT_MONO` for the label (`10px ` + small caps) and `FONT_MONO` for the value (`600 ${size}px`) — modeled on the existing `drawHudTime` (line 1425). This is the HUD-digit pattern and stays mono.

Body text (welcome banner, panel descriptions, decor card subtitles) should switch to `FONT_BODY` in later phases. Display titles stay on `FONT_DISPLAY`. Do **not** mass-rewrite font calls in this chunk.

DoD: Constants and helper exist. Syntax check passes. Existing `drawHudTime/Score` calls unchanged. No visual change yet.

Risk: None — additive.

### Chunk 1.7 — Add `drawCharacterUnderModal(c, scene)` framing helper

Audit anchor:
> **F10 · systemic [🟡 mid] — The minigame backdrop is never authored for being behind a modal.** Annie's head pokes from above the Treat Toss modal. A sliver of Luna pokes from the side in Wild Wand and Window Watch. A floating window asset hovers in Wild Wand's preview. The room is rendered as if it's the foreground; then a modal lands on top of it.

What changes: Add a helper that, when called from `drawScene` during the `instructions` phase, applies a `c.translate(0, +60)` and `c.scale(0.85)` from the canvas center so characters drawn at their normal hangout y-coords end up below y=410 (clear of the modal frame at y=150–410). Do not call from any scene yet — just provide the helper.

DoD: Helper exists. No scene uses it. Syntax check passes.

Risk: None — additive.

**Assets needed (Phase 1):** none. All shipping-as-helpers; no art.

---

## Phase 2: Apply foundation to hub HUD and one reference panel

**Goal:** Prove the Phase 1 helpers work by rewiring the hub HUD and the Decor panel — the most-touched panel — to use them. Visible audit-finding fixes ship in this phase.

**Audit findings addressed:** F1 (hub specifically), F7 (decor specifically), M2, M3 (in part), M6 (Decor tabs)

**Lines/sections touched:** HangoutScene draw 7205–8323 (HUD region 7228–7405; decor panel 7859–7983); decor click handler 4926–4992.

**Dependencies:** Phase 1.

### Chunk 2.1 — Move all hub status pills onto the row-0 / row-1 grid

Audit anchor:
> **F1 · systemic [🔴 high] — The HUD has no grid.** Pet status pills, coin/star counters, top-right buttons, and the bottom Goal pill all live at hand-placed pixel coordinates. Nothing is anchored to a safe area, and nothing shares a row.

What changes: In `HangoutScene.draw` (line 7205+), replace every hand-coded `rr(c, …)` for coin pill (7240), star pill (7265), streak pill (7278), daily-tasks pill (7297), weekly-challenge pill (7318) with `placePill("tr", N, w)` calls. The pet status pills at (14, 62) and (646, 62) stay where they are (anchored to canvas edges, fine). The bottom goal pill at line 7640 already respects `SAFE`; switch it to `placePill("bl", 0, _)` for consistency.

DoD: All five row-1 pills line up on the same y. No pill overlaps the tab bar (16) or the mute-chip column (W-SAFE-28). Goal pill is fully on-canvas. Visual diff: pills shift slightly but remain readable.

Risk: medium — many call sites; verify nothing reads `coinPopup` y-coords absolutely. Coin popup at line 7259 uses `52 - …` from coin pill y; update relative to the new pill y.

### Chunk 2.2 — Replace the four hub button colors with one accent

Audit anchor:
> **F4 · systemic [🔴 high] — Tab colors are random.** Six brown tabs, "Pet" red, "Decor" purple. There's no semantic logic — Decor isn't a different category from Wardrobe. Reads as a bug, not a system.

What changes: CHANGELOG entry for 2026-05-07 already collapsed everything to neutral `#C7A37B` with `#A05A3C` active accent. Verify no remaining red/purple in `HangoutScene` button draws (line 7229–7235). If any survive, normalize. (This may be entirely no-op; if so, mark this chunk obsolete and skip to 2.3.)

DoD: A grep for `warmRed` or `#9B59B6` inside `HangoutScene.draw` scope returns 0 button-fill matches.

Risk: None.

### Chunk 2.3 — Migrate Decor panel to `drawPanelFrame` + `drawPanelClose`

Audit anchor (F7 quoted in 1.3 above): the four panels each open-code the dim layer, frame, and close button. The close button at `(W/2 + 218, 102, 36×36)` is identical across panels but each panel's surrounding frame differs.

What changes: In `HangoutScene.draw` decor section (line 7859–7983), replace the hand-coded `c.fillStyle = "rgba(40,28,18,0.55)"; c.fillRect(0,0,W,H)` + `rr(c, 100, 70, 600, 480, 28)` + close-button block (~7866–7900) with one call to `drawPanelFrame(c, {x:100, y:70, w:600, h:480, title:"Decor"})` and one call to `drawPanelClose(c, decorPanel, this.hoverKey === "decorClose")`. Update the click handler at line 4926 to read from the same panel-relative coords.

DoD: Decor panel renders identically to before. Close-button hit-rect unchanged from user POV. Lines saved: ~30. Syntax check passes.

Risk: low — verify the close-button rect in the click handler still works.

### Chunk 2.4 — Add the four-tab row to the Decor panel

Audit anchor:
> **M6 · medium — Tab the Decor panel** (Room / Comfy Upgrades / Seasonal / Cozy Set). Add lock chips with required state.

What changes: Use `drawPanelTabs` from chunk 1.4 to render the four tabs at the top of the Decor panel. Filter `DECOR_ITEMS` by tab in the existing pagination loop:
- "Room" — items where `!isUpgrade && !season && !inGoldenSet(item.key)`
- "Comfy Upgrades" — `isUpgrade === true`
- "Seasonal" — `season != null`
- "Cozy Set" — golden-room set keys (`goldenCurtains`, `goldenChandelier`, `silkPillows`, `royalThrone`, `musicBox` per CHANGELOG 2026-03-30)

Persist `decorTab` in scene state (no localStorage — resets each session is fine).

DoD: Switching tabs filters the list. Pagination resets when tab changes. Lock chips per item (next chunk) may be deferred. Syntax check passes.

Risk: low — purely a filter on the existing array.

### Chunk 2.5 — Add lock-state chip to decor cards

Audit anchor:
> **Section 05 · Decor — "Locked items show stars-required as a number" — better:** show the lock state with the star count so the player understands they're earning toward it ("17 / 25 stars").

What changes: For each card in the decor panel, render a small chip (top-right of the card rect) with the active lock kind. Reuse one helper `drawLockChip(c, rect, kind, value, current)` where `kind ∈ {stars, coins, achievement, season, streak}`. Pull data from the existing item object: `stars`, `price`, `achievementUnlock`, `season`, `streakUnlock`. For stars, render `current/required` (e.g. "17 / 25 ★").

DoD: Each card shows exactly one lock chip when locked, none when owned. Achievement unlocks display the achievement key truncated to 12 chars. Syntax check passes.

Risk: low.

**Assets needed (Phase 2):** none.

---

## Phase 3: Apply foundation to the remaining three panels

**Goal:** Game Menu, Wardrobe, and Scrapbook all migrate to `drawPanelFrame` + `drawPanelClose` + `drawPanelTabs`. Each gets its missing empty-state and its missing tab affordances.

**Audit findings addressed:** F7 (completion), M3 (completion), M5, plus Section 05 panel-specific notes.

**Lines/sections touched:** Game Menu 7700–7857; Wardrobe 7985–8115 (and click handler 4994–5040); Scrapbook 8117–8323.

**Dependencies:** Phase 1, Phase 2 (Decor as proven template).

### Chunk 3.1 — Migrate Game Menu to shared frame + close

Audit anchor (F7 quoted in 1.3): same finding.

What changes: In `HangoutScene.draw` line 7700–7857, replace the menu's hand-coded frame (line 7710–7715), dim, and close-button block (line 7729–7740) with `drawPanelFrame` + `drawPanelClose`. Click handler unchanged otherwise.

DoD: Menu renders identically. Lines saved: ~25.

Risk: low.

### Chunk 3.2 — Add "next-star threshold" hint to each Game Menu card

Audit anchor:
> **Section 05 · Game Menu — "Each card has a star count derived inline"** — `(s>=1400?3:s>=700?2:s>=300?1:0)` — fine, but the next threshold ("you need 700 for a 2nd star") isn't shown. The minigame menu is the natural place for "next goal" hints.

What changes: In `getCardRect` rendering loop (around line 7700+), look up the game's three thresholds (already in the per-game maps the codebase uses for `totalStarsEarned()`). Render a tiny grey caps line "NEXT: 700" below the existing star count when stars < 3.

DoD: Cards with 3 stars show no hint. Cards with <3 show their next threshold. Syntax check passes.

Risk: low — read-only.

### Chunk 3.3 — Migrate Wardrobe panel to shared frame + tabs

Audit anchor (F7); plus:
> **M5 · medium — Wardrobe = paper-doll.** Hero portrait of active character, item grid swaps live. Three painted character tabs at top.

What changes: Migrate the Wardrobe panel frame to `drawPanelFrame`. Replace the three small tabs at `(80/170/260, 130)` with `drawPanelTabs(c, wardrobePanel, [{key:"obi"}, {key:"luna"}, {key:"annie"}], this.wardrobeTab)`. Don't rebuild the paper-doll yet — that's chunk 3.4.

DoD: Tabs render in the new pill style. Click hits dispatch to existing `wardrobeTab` setter.

Risk: low.

### Chunk 3.4 — Wardrobe paper-doll: hero portrait + live preview

Audit anchor:
> **M5 · medium — Wardrobe = paper-doll.** Hero portrait of active character, item grid swaps live. Three painted character tabs at top.

What changes: In the wardrobe panel render, allocate the left half of the panel (e.g. `x: panel.x+20, y: panel.y+90, w: 260, h: 380`) to a hero portrait. Reuse `drawObi`, `drawLuna`, `drawAnnie` with the active wardrobe selections applied via the existing accessory rendering path. The right half holds the item grid (existing scroll list, narrowed). On hover over an item, render the portrait with the hovered item temporarily applied, so the player can preview before clicking.

DoD: Active character renders large in panel. Hover preview swaps live. Click still equips. Syntax check passes.

Risk: medium — accessory overlay path may not be set up to render outside the room context. Verify `drawAccessoryOverlay` accepts arbitrary `(x, y, scale)` args.

### Chunk 3.5 — Migrate Scrapbook panel to shared frame + tabs

Audit anchor (F7); plus per-tab paper styles deferred.

What changes: Migrate the scrapbook frame to `drawPanelFrame` and the four tabs (`Photos / Milestones / Stats / Goals`) to `drawPanelTabs`. Existing scroll-arrow paginators stay — they're per-tab and not yet shared.

DoD: Frame and tabs unified. Existing tab-switch logic works.

Risk: low.

### Chunk 3.6 — Add empty states to Wardrobe (Stats/Goals) and Game Menu

Audit anchor:
> **Section 05 · Empty state — every panel needs one.** "No photos yet — try the camera at top-right." "No achievements yet — play a minigame." Currently empty tabs render as empty blanks.

What changes: Existing empty-state strings exist for Photos and Milestones (line 8168, 8228). Add equivalents for: Wardrobe when no items owned for the active character; Game Menu when 0 minigames have been played (`totalStarsEarned() === 0` — render "Play your first minigame from the Games button.").

DoD: Each panel tab has an empty-state when there's truly no content. Syntax check passes.

Risk: low.

### Chunk 3.7 — Surface Scrapbook Goals as a checkable list

Audit anchor:
> **Section 05 · Scrapbook — Scrapbook Goals (Dreaming Obi, Grooming Session, Both 80+ Joy, Rainy Day, etc.) are not surfaced with hints.** The whole "wait for the right moment, take the photo" loop is invisible to the player. A "challenges" tab inside Scrapbook with checkbox progress would surface it.

What changes: The Goals tab already exists. Render each entry of `SCRAPBOOK_GOALS` (12 items per CLAUDE.md) with: a one-sentence "how to" hint (read from a new `goal.hint` field added to the array), a check/cross icon for completed/not, and the ⭐ reward count.

DoD: All 12 goals visible with hints. Completed goals show check + faded text. Syntax check passes.

Risk: low — additive data field.

**Assets needed (Phase 3):** none.

---

## Phase 4: Confirmed bug fixes (high + medium-severity from B-list)

**Goal:** Fix the bugs found by reading the code that have material gameplay or save-state impact. Skip cosmetic / very-low ones.

**Audit findings addressed:** none (these are bugs, not audit items).

**Lines/sections touched:** see per-chunk citations.

**Dependencies:** none.

### Chunk 4.1 — B1 timeOfDay = 0 silently mapped to "day"

Bug ref: B1 (verified independently). Citations: lines 1193, 3360, 5298, 8485, 8552, 9120, 9513, 9628.

What changes: Replace the eight occurrences of `store.decor.timeOfDay || 1` with `(store.decor.timeOfDay == null ? 1 : store.decor.timeOfDay)`. The `roomPreset` cycle and `MUSIC_MOODS.morning` become reachable.

DoD: Setting timeOfDay = 0 in localStorage (`anniesCozyDay_decor → timeOfDay: 0`) produces the morning lighting and "morning" music mood on next hangout entry. Syntax check passes.

Risk: low — pure logic fix.

### Chunk 4.2 — B2 Bond migration only checks `obi`, not `luna`

Bug ref: B2. Citations: lines 542–544.

What changes: Update the bond default-shape migration so it triggers if either `obi` or `luna` is missing. The condition becomes `if (!store.bond || !store.bond.obi || !store.bond.luna) { store.bond = {...full default...}; }`.

DoD: A save with `{obi: {...}}` and no luna no longer crashes on first `awardBondXP("luna", ...)`. Syntax check passes.

Risk: low — only triggers for malformed saves.

### Chunk 4.3 — B3 Daily-gift bond XP grants skip the level-up loop

Bug ref: B3. Citations: lines 4882, 4887.

What changes: After the raw `+= reward.bondXP` and `+= 50` adds, run the same level-up loop as `awardBondXP` (line ~616): `while (b.level < 10 && b.xp >= getBondXPForLevel(b.level + 1)) b.level++;`. Better — extract a small helper `applyBondXPRaw(pet, amount)` and call it from both sites.

DoD: A daily-gift Day-4 reward (25 bond XP) or mystery (50 XP) that crosses a level threshold actually levels the bond up. Verify by manual save edit setting `obi.xp` to one below the next threshold, claiming the gift, observing level + 1.

Risk: low.

### Chunk 4.4 — B4 Weekly challenge resets on Thursday UTC, not Monday

Bug ref: B4. Citations: lines 4486–4492.

What changes: Replace `weekId = Math.floor(Date.now() / 7days)` with a Monday-anchored weekId calculation:
```
var d = new Date();
var diff = (d.getDay() + 6) % 7; // 0=Mon
var monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
var weekId = Math.floor(monday.getTime() / 86400000);
```

DoD: Weekly challenge changes on local Monday at 00:00. Existing player loses up to 3 days of progress on the first Monday after the fix — acceptable.

Risk: medium — players get a one-time weekly-challenge reset on rollover. Note in commit message.

### Chunk 4.5 — B5 Visitor double-joy on auto-apply + click

Bug ref: B5. Citations: lines 5191–5208, 7026–7028.

What changes: When auto-applying joy at spawn (line 7026), also set `data.interacted = true` so the click path at 5191 short-circuits.

DoD: Click on an auto-applied visitor produces no joy bump. The "+joy" floating text fires only once.

Risk: low.

### Chunk 4.6 — B7 Esc bypasses away-story and daily-gift modals

Bug ref: B7. Citations: lines 5396–5406.

What changes: In `HangoutScene.onKeyDown` (line ~5396), add a branch that handles `_awayStory` first (apply its bonus and dismiss), then `dailyGift` (claim it), then panel cascade, then dedication (already gated).

DoD: Pressing Esc on the away story applies its bonus instead of dropping it. Pressing Esc on the daily gift claims its reward.

Risk: low.

### Chunk 4.7 — B8 Daily gift abandoned if player exits hangout without claiming

Bug ref: B8. Citations: lines 4298, 4426–4436.

What changes: Defer setting `lastVisitDate = today` until the gift is actually claimed (move the assignment from the date-mismatch block to inside the gift's click handler at line ~4896). Or persist `pendingDailyGift` separately.

DoD: Enter hangout → leave to title → re-enter same day → daily gift modal still appears. Once claimed, `lastVisitDate` is set and won't re-show.

Risk: low — verify the away-story path still triggers correctly.

### Chunk 4.8 — B14 Visitor lost on every scene change

Bug ref: B14. Citations: lines 4302, 7022.

What changes: Persist the active `ambientEvent` either to a module-level holder or to `store.ambientEvent` (with timer). On `HangoutScene.enter`, restore from there if the timer hasn't elapsed.

DoD: Visitor spawns in hangout → enter a minigame → return to hub within the visitor's window → visitor still on screen with reduced timer.

Risk: low — module-level holder is simplest.

### Chunk 4.9 — B16 Pawstep round counter increments after sequence cap

Bug ref: B16. Citations: lines 11744, 11796, 11842.

What changes: Once `sequence.length >= 5`, stop incrementing `this.round` (or alternatively let it grow but reshuffle the sequence each round so difficulty actually grows). Simplest fix: cap `round` at 5 too.

DoD: Past round 5, the displayed round stays at 5, sequence stays at length 5, score still accumulates per correct play.

Risk: low.

### Chunk 4.10 — B25 Backyard scene plays previous music mood

Bug ref: B25. Citations: lines 1192–1196, BackyardScene.enter.

What changes: At the end of `BackyardScene.enter()` add `audio.setMusicMood();` (no arg — it'll resolve to "backyard" via `_getMusicMoodKey`). Add the same at end of `HangoutScene.enter()` to switch back when re-entering hangout from backyard (it currently relies on a from-title path).

DoD: Toggling between hub and backyard switches music mood within ~350ms.

Risk: low.

**Deferred (low-severity B-list, not worth touching):** B6, B9, B10, B11, B12, B13, B15, B17, B18, B19, B20, B21, B22, B23, B24, B26, B27, B28, B29, B30. Re-triage in a future session if user complains.

**Assets needed (Phase 4):** none.

---

## Phase 5: Performance hotspots

**Goal:** Address measurable per-frame cost in the hot draw paths.

**Audit findings addressed:** none (engineering-driven).

**Dependencies:** none.

### Chunk 5.1 — Cache the dynamic-shadow radial gradient

Finding: `HangoutScene.draw` line 7390 creates a fresh `c.createRadialGradient` for each of three pets every frame (lines 7399–7402). At 60Hz that's 180 gradient allocations/sec, plus an `ellipse` path. Same shape, only `dx` and `alpha` change.

What changes: Build a single `c.createRadialGradient(0, 0, 0, 0, 0, 60)` once on scene enter, store on the scene instance, and translate before `c.fill()`. For alpha variation, just scale `c.globalAlpha`. This is shadow-only and visually equivalent.

DoD: Hangout idle frame profiles drop the per-frame `createRadialGradient` allocation count from 3 to 0 (verified in Chrome perf panel).

Risk: low — visual diff = 0.

### Chunk 5.2 — Move test-hook assignments out of `loop()` body

Bug ref: B15. Citations: lines 13822–13939.

What changes: The `window.__getScene = …`, `__getSceneDetails`, `__modifyScene`, `__goToScene` assignments live inside `loop()` (lines 13897–13936) so they execute at 60Hz. Move them out to module scope (right after `SceneRegistry` definition near line 1315).

DoD: A `console.count("hookReassign")` next to one assignment increments exactly once per page load (not 60Hz). Test hooks still functional via `window.__getScene()`.

Risk: low.

### Chunk 5.3 — Music scheduler resync after long tab-hide

Bug ref: B6. Citations: lines 1204–1249.

What changes: When `_musicNextTime < currentTime - 1.0` triggers the catch-up path (line 1210), also reset `_musicSubBeat = 0` and `_arpStep = 0` so chord progression realigns to a chord boundary instead of resuming mid-pattern.

DoD: Background tab for 30s, return — no audible mid-pattern wake; instead the next bar starts cleanly.

Risk: low.

### Chunk 5.4 — Sprite atlas decode confirmed once

Investigation only — verify `SPRITE_ATLAS_URI` is decoded into an `Image` element exactly once at startup and that `drawFrameImage` references that single image for every per-frame call. If anything in the per-frame path constructs a new `Image` or re-decodes, fix it. Read lines around 1500 (sprite section per ARCHITECTURE-REFERENCE).

DoD: Confirmed-or-fixed report committed as a comment in the sprite section. If a decode-per-frame is found, fix it.

Risk: none if confirmed; medium if a hidden re-decode is found and the fix needs care.

**Assets needed (Phase 5):** none.

---

## Phase 6: Heart tier (ship early per request)

**Goal:** Polish the dedication card, the cuddle-pile win moment, and the 30-day caretaker reveal — the emotional core of the project.

**Audit findings addressed:** H1, H2, H3.

**Dependencies:** Phase 1 (font constants, intro modal helper if reused).

### Chunk 6.1 — H1.a Three-line dedication reveal

Audit anchor:
> **H1 · medium [💙 heart] — Polish the dedication card.** Three-line reveal ("For Annie. For Obi. For Luna."), heart leaving Annie's hand, soft chord on entry, paper-card frame, anniversary re-trigger. (See §10.)

What changes: In `HangoutScene.draw` dedication path (line 8329+), replace "Made with Love / for Annie, Obi, and Luna" with three staggered fades: line "For Annie." at phase 0.5, "For Obi." at phase 0.8, "For Luna." at phase 1.1. Each character sprite gets a brief glow when their name appears.

DoD: Dedication shows three lines; characters glow in sequence. `firstVisit` flow still terminates correctly.

Risk: low — verify Esc-after-1.5s gate (Q12) still works.

### Chunk 6.2 — H1.b Soft chord on dedication entry + paper texture frame

Audit anchor: continuation of H1.

What changes: Replace `audio.menu()` (if currently called) with a new `audio.softChord()` (one chord, ~1.5s sustain, very low gain). Add a faint paper-texture overlay to the dedication card frame: render small `rgba(0,0,0,0.02)` random dots at fixed-seeded positions within the card rect.

DoD: Chord plays once on entry. Paper grain is visible but subtle.

Risk: low — `audio.softChord` is new, mute path must be respected.

### Chunk 6.3 — H1.c Heart leaves Annie's hand

Audit anchor: continuation of H1.

What changes: Replace the eight floating hearts with one heart spawned from Annie's hand position (computed from her sprite anchor) that rises past the title and fades. Spawn at phase 0.6 with `spawnParticleBurst` extended for a single-heart variant.

DoD: One pink heart visibly leaves Annie's hand and floats up.

Risk: low.

### Chunk 6.4 — H1.d Anniversary re-trigger of dedication

Audit anchor: continuation of H1; "Once a year — show this card again on the anniversary of first launch."

What changes: On boot, compare `store.firstVisitDate` (NEW key — needs migration default of "today" for existing players, or `null` → no re-trigger ever) with today. If month + day match and the year differs from `store.lastDedicationYear`, re-show the dedication and update `lastDedicationYear`.

DoD: Manually setting `firstVisitDate` to one year ago triggers the dedication again. Migration backfill: existing saves get `firstVisitDate = null` (no re-trigger until next first-visit).

Risk: low — store schema growth, must add to migration backfill section per CLAUDE.md convention.

### Chunk 6.5 — H2 "Maximum Cozy" 2-second hero shot in Cuddle Pile

Audit anchor:
> **H2 · small [💙 heart] — "Maximum Cozy" win-state hero shot.** 2-second pause on the all-three-asleep tableau in Cuddle Pile before results.

What changes: In `CuddlePileScene` win path, before transitioning to results, freeze input and render a 2-second pose: Annie + Obi + Luna asleep on the couch, soft fade-in of "Maximum Cozy" text, then crossfade to results.

DoD: On a successful 90s survive, the player sees the tableau for 2s before the results panel.

Risk: low.

### Chunk 6.6 — H3 30-day Dedicated Caretaker reveal

Audit anchor:
> **H3 · small [💙 heart] — "Dedicated Caretaker" reveal at 30 days.** Full-screen ribbon, character cheer pose, single chime, scrapbook entry written as a sentence not a log line.

What changes: In the care-streak milestone path, when `careStreak.count` first hits 30, queue a one-time celebration: full-screen cream ribbon at y=H/2, three-character cheer pose for 2.5s, single `audio.chord` chime. Write the scrapbook entry as: "Day 30. Annie has been here every day. Obi and Luna know."

DoD: Manually setting `careStreak.count = 29` and triggering one more recordCareAction with `lastCareDate` set to yesterday produces the reveal.

Risk: low.

**Assets needed (Phase 6):** ART-1 — paper-grain texture (can be procedural, no PNG needed). ART-2 — optional caretaker-ribbon SVG if procedural fillRect doesn't feel "ribbon-y" enough; default is procedural.

---

## Phase 7: Living-systems surfacing (audit Section 06)

**Goal:** Make the joy/mood/weather/visitor/streak/economy systems actually visible.

**Audit findings addressed:** Section 06 sub-items, M9, M10.

**Dependencies:** Phase 1 (HUD grid).

### Chunk 7.1 — Joy bar shows numeric on hover + 50/80 milestone marks

Audit anchor:
> **Section 06 · Pet Joy + Mood — "Joy is a 0–100 number"** — currently shown as a thin bar without numerals or thresholds. Add a tiny numeric readout on hover and milestone marks at 50/80.

What changes: Joy bars at lines 7341–7352 and 7367–7378. Add two 1px tick marks at the 50% and 80% positions on each bar. On hover (mouse over the pill), draw `joy / 100` as a tiny mono number to the right of the bar.

DoD: Bars show two ticks; hover shows the number; click does not change.

Risk: low.

### Chunk 7.2 — Mood multiplier hint on action chips

Audit anchor:
> **Section 06 · "Mood multipliers are real"** (e.g. cuddly Obi: pet ×1.5) — the player gets no signal that "now is a good time to brush." A small mood-icon next to the action chip ("brush is x1.4 for Obi today") would teach the system without a tutorial.

What changes: When hovering one of the four mode buttons (Pet / Treats / Play / Brush), show the multiplier for whichever pet is in scope ("×1.4 for Obi today") in a tooltip or beneath the button.

DoD: Hover tooltip shows the mood multiplier when it's >1.

Risk: low.

### Chunk 7.3 — Weather chip in HUD

Audit anchor:
> **Section 06 · Weather + Window Tint — "The "Rainy Day" Scrapbook goal is invisible until you happen to look at the window."** A tiny weather chip in the HUD ("☁ rainy") lets the player know to take a picture.

What changes: Add a small chip next to the daily-tasks pill (placePill row 1, slot N) showing the active weather as a 16px icon + label ("rainy", "snow", "golden hour", "sunny", "cloudy"). Reuse existing weather icons or render with `rr` + character.

DoD: Chip shows current weather; clicking opens the scrapbook Goals tab (subtle hint).

Risk: low.

### Chunk 7.4 — Streak count surfaced on title screen + 7/14/30 ribbons

Audit anchor:
> **M9 · medium — Streak surfacing.** Show streak count on the title screen; ribbon/celebrate at 7/14/30 day milestones.

What changes: On title screen (~line 4150), under the cycling subtitle, render "🔥 N day streak" if `careStreak.count >= 1`. At 7-day, 14-day, and 30-day first-time hits (track a `streakRibbonsClaimed` set), show a ribbon banner on the next hangout entry.

DoD: Title shows streak. Triggering each milestone produces a ribbon.

Risk: low — needs new store key `streakRibbonsClaimed` with migration backfill.

### Chunk 7.5 — Welcome banner mood-aware rotation

Audit anchor:
> **M10 · medium — Welcome banner rotation.** Replace the static "Welcome home!" with mood-aware rotation (15+ lines in the Decor-Reaction voice).

What changes: Add a `WELCOME_LINES` array of 15+ strings ("Obi is curious about you today.", "Luna is judging from the couch.", "It's quiet here.", etc.). Replace the static "Welcome home!" at the bottom banner with a draw from the array, weighted by the active mood.

DoD: Each hangout entry shows a different line; mood is reflected (cuddly → cuddle line, sleepy → quiet line).

Risk: low.

### Chunk 7.6 — Visitor banner + first-appearance beat

Audit anchor:
> **Section 06 · Visitors — "Spawn timing isn't telegraphed"** — a visitor walks on, gives a 12–16s window to interact, then leaves. The player needs to see they only have 14 seconds.

What changes: When a visitor spawns, show a one-line banner ("A robin is singing outside!") at the top-center for 2s, with a small countdown ring. On first-appearance per season for the seasonal four (bunny, ice cream, scarecrow, Santa elf), upgrade the banner to a 3s "first-appearance" beat with a small painted silhouette next to the text.

DoD: Banner appears with countdown. Tracking key `visitorsSeen` (set) prevents repeat first-appearance beats.

Risk: low — store key needs migration backfill.

### Chunk 7.7 — Surface daily tasks + weekly challenges

Audit anchor:
> **M4 · medium — Surface daily tasks + weekly challenges.** Tiny "Today: 2/3" chip on hub HUD; full panel inside Scrapbook.

What changes: The daily-tasks chip is already present (line 7297) per Phase 2.1 placement. Add a "Tasks" sub-tab inside the Scrapbook panel that lists today's 3 tasks with checks, plus the active weekly challenge with progress bar.

DoD: Tasks tab in Scrapbook shows today's tasks and current week.

Risk: low.

### Chunk 7.8 — Lucky Charm "+coin" floating-text shows the bonus

Audit anchor:
> **Section 06 · Coin / star / achievement economy — "Lucky Charm" upgrade gives +2 coins per minigame** — invisible to the player after they buy it. Show "+12 (Lucky Charm)" floating text instead of just "+10".

What changes: Where minigame-end coin grants happen, when `hasUpgrade("luckyCharm")`, append `(Lucky Charm)` to the floating text.

DoD: Lucky-Charm-active result screen shows the bonus origin.

Risk: low.

**Assets needed (Phase 7):** none. Visitor first-appearance silhouettes can be drawn procedurally (small simple shapes).

---

## Phase 8: Per-screen and per-minigame polish (audit Section 03 + 04)

**Goal:** Per-scene findings that aren't covered by the systemic helpers.

**Audit findings addressed:** Per-screen items in Section 03 (Title, Hangout, Backyard, intro modal patterns), per-minigame items in Section 04, M7, M8.

**Dependencies:** Phase 1 (intro modal helper).

### Chunk 8.1 — Wire all 12 minigames to `drawIntroModal`

Audit anchor (F5 quoted in 1.5).

What changes: In each minigame's `drawScene` during instruction phase, replace `this.drawInstructionCard(...)` with `drawIntroModal(c, {title, body, iconFn, bonusText})`. Once all 12 are migrated, delete the old `drawInstructionCard` from BaseMinigameScene.

DoD: All 12 intros render the same hierarchy. The old helper is gone.

Risk: medium — verify each minigame's icon callback still works.

### Chunk 8.2 — Frame characters under modal in instruction phase

Audit anchor (F10 quoted in 1.7).

What changes: Each minigame's `drawScene` during instruction phase calls `drawCharacterUnderModal(c, this)` to push character draws below y=410. For Treat Toss (Annie's head pokes), Wild Wand (Luna sliver), Window Watch (Luna in front of window) specifically, also adjust their sprite y so they land below the modal.

DoD: No character is sliced by the modal in any of the 12 minigames.

Risk: medium — verify the during-play frame is unaffected (helper is conditional on phase).

### Chunk 8.3 — Title screen polish

Audit anchor:
> **Section 03 · 01 Title — "Title vs. tagline weight mismatch"** [🟡 mid] — heavy display brown sits oddly above the thin grey "A Cozy Minigame Collection". Drop the tagline weight to the same family but tracked-out small caps.

What changes: In `TitleScene.draw` (~line 4061), tagline at line ~4160 area — convert to small caps, `FONT_BODY`, letter-spacing 0.18em, color `#807366`.

DoD: Tagline is small-caps and visually subordinate to the title.

Risk: low.

### Chunk 8.4 — Backyard HUD parity with hangout

Audit anchor:
> **Section 03 · 03 Backyard — "HUD doesn't carry over"** [🔴 high] — coin/star counters move to top-center, no pet status pills, no tab row. Reads like a different game. The tab bar should still be there (with a "Yard"-tinted active state) so the player understands they're in the same world.

What changes: In `BackyardScene.draw`, render the tab row (Games / Decor / Closet / Pet / Treats / Play / Brush) with a "Backyard" active-state styling — the active accent goes on a "Yard" pseudo-tab. Or simpler: render the same row as hangout but with all six mode-buttons greyed (mode is "yard"). Keep the existing Decor button on the row instead of as a free-floating item. Add the star pill alongside coin pill.

DoD: Hangout and backyard share the same row-0 tab bar visually.

Risk: medium — tab-row clicks must navigate back to hangout for non-yard modes.

### Chunk 8.5 — Backyard scrapbook chip (B-list extension of HUD audit)

Bug-derived: from Phase 1 HUD audit Task C — Backyard is missing the scrapbook chip from the top-right stack.

What changes: Add a `scrapbookButton` rect in `BackyardScene` at slot 3 of the chip stack (`(W-SAFE-28, SAFE+68, 28×28)`), drawn via `drawHudChip`. Click opens scrapbook (likely needs to transition to hangout first since scrapbook is a hangout panel; alternatively, expose scrapbook from backyard directly).

DoD: Scrapbook chip visible on backyard, click works.

Risk: low.

### Chunk 8.6 — Pawstep targets become circular pet faces

Audit anchor:
> **M8 · medium — Pawstep targets become circular pet faces.** Replace 2×2 form buttons with Obi/Luna head circles.

What changes: In `PawstepPatternsScene.drawScene`, replace the four rounded-rect buttons with four circular targets, each rendering a tiny Obi or Luna head sprite (reuse atlas frame) inside a paw-print frame.

DoD: Buttons are circular and identifiably pet-faced.

Risk: low — reuses existing sprite frames.

### Chunk 8.7 — Repaint placeholder props (M7)

Audit anchor:
> **M7 · medium — Repaint the floor bowls + cat-tower toy + window-watch leaf icon + Where's-Luna "?"** Replace iconographic placeholders with painted/atlas equivalents matching the pet sprites.

What changes: For each of the four icons, replace the existing draw with an atlas-frame rendering or a richer procedural shape. The "?" cushion in Where's Luna becomes a tiny tail twitch peeking out (matching the audit's suggestion).

DoD: Each named prop visibly matches the sprite art quality.

Risk: medium — depends on whether atlas frames exist for these props. **Asset flag below.**

**Assets needed (Phase 8):**
- ART-3: Painted dog-bowl + cat-bowl (two new atlas frames or hand-coded)
- ART-4: Painted leaf for Window Watch (atlas frame)
- ART-5: Cat-tail-twitch sprite for Where's Luna (atlas frame)
- ART-6: (optional) Painted dog-treat + cat-treat pair to replace Snack Sort and Treat Toss icon glyphs

---

## Phase 9: Audio + motion polish (audit Section 08)

**Goal:** Light polish on the existing audio and motion systems.

**Audit findings addressed:** Section 08 sub-items.

**Dependencies:** none.

### Chunk 9.1 — Crossfade hangout↔backyard, hangout→minigame→results

Audit anchor:
> **Section 08 · Mode transitions — "Backyard ↔ Hangout has no transition"** — a 200ms fade covers a multitude of art-style differences.

What changes: Wrap the `transitionTo` calls between hangout and backyard with a 200ms alpha crossfade through black/cream. Match the existing minigame→results path style.

DoD: All three transitions feel the same.

Risk: low.

### Chunk 9.2 — Score / combo / star spring animations

Audit anchor:
> **Section 08 · Score / combo feedback — "+10 coins" floating text exists. Make it spring out, not float linearly.** Combo numbers should pulse + scale up with combo count, not stay the same size.

What changes: Add an `easeOutBack` interpolation to the existing floating-text vy and a scale pulse to the combo digit. On the results screen, show stars sequentially (300ms apart) with a small bounce.

DoD: All three behaviors present.

Risk: low.

### Chunk 9.3 — Per-action chimes

Audit anchor:
> **Section 08 · Audio — "audio.tinyChime() is everywhere"** — different actions deserve different chimes. Currently the tab change, panel close, and milestone reach all sound similar.

What changes: Add `audio.panelOpen()`, `audio.panelClose()`, `audio.milestoneChime()` — three distinct short tones — and use them at the appropriate sites.

DoD: Closing a panel sounds different from opening one. Milestone reach sounds different from tab change.

Risk: low.

### Chunk 9.4 — Music Box decoration plays on activation

Audit anchor:
> **Section 08 · Audio — "Music Box decoration should actually play when activated"** — the name promises it, the audio system can deliver.

What changes: When the music box decor is on `store.decor.musicBox === 1`, occasionally (every 45s) play a 4-note pentatonic phrase using the existing `audio._playMusicNote` infrastructure, gated by mute and only when on hangout.

DoD: With music box on and not muted, a phrase plays roughly every 45s in hangout.

Risk: low.

### Chunk 9.5 — Pets occasionally look at the cursor

Audit anchor:
> **Section 08 · Pet idle — "Both pets should occasionally look at the cursor when it's near."** 30 minutes of work, huge personality dividend.

What changes: When `dist(mouse, pet) < 180` and pet is idle, ease the pet's `facing` toward the cursor for ~1s, then return to default. Throttle to one "look" per 6s per pet.

DoD: Hovering near Obi causes him to glance at the cursor; same for Luna.

Risk: low.

### Chunk 9.6 — Steam particles in Bath Time + sun-dust in Luna's Nap

Audit anchor:
> **Section 08 · Particles — "Steam from the tub in Bath Time"** — the water is there, the steam isn't. Two curved rising lines, ~30% alpha, low priority but huge ambiance.
> Plus: "Sun-dust motes during golden-hour weather and Luna's Nap — 'premium cozy' particles, worth the spend."

What changes: Add two new particle shapes (`steam`, `dust`) to the shared particle system. Spawn from the tub during Bath scrub/rinse phases; spawn at low rate from sunbeams in Luna's Nap.

DoD: Both particles visible.

Risk: low.

**Assets needed (Phase 9):** none.

---

## Phase 10: Writing & voice cleanup (audit Section 07)

**Goal:** Apply the cozy voice consistently. Most lines are one-line edits.

**Audit findings addressed:** Section 07 specific lines, F8.

**Dependencies:** Phase 1 (font helpers — for the goal pill rewrite).

### Chunk 10.1 — Modal footer rewrite

Audit anchor:
> **Section 07 · Specific lines to rewrite — "Modal footer"** — "Click to begin early • Esc to go back" → split into two: a real button row + a single line of meta. Or, even better: "Tap when you're ready · Esc to cuddle instead."

What changes: In the intro modal helper from chunk 1.5, set the meta line to "Tap when you're ready · Esc to cuddle instead."

DoD: All 12 minigames show the new copy.

Risk: low.

### Chunk 10.2 — Goal pill rewrite

Audit anchor:
> **Section 07 · "Goal pill"** — "Goal: Dreaming Obi (+10 coins)" → on the goal card itself: "Take a photo of Obi while he's napping." (This is what it actually means.) The "+10 coins" earn-back is fine in small print.

What changes: Add `goal.hint` text to each entry of `SCRAPBOOK_GOALS`. Render the hint as the main goal pill text; the coin reward goes in a tiny grey caps line.

DoD: Goal pill shows the in-character hint, not the goal name.

Risk: low.

### Chunk 10.3 — Trim 12 minigame instruction strings (already shipped per Q8, verify)

Audit anchor (Q8) shipped per CHANGELOG — verify and skip if all 12 already comply.

DoD: Each instruction body is ≤ 8 words per sentence.

Risk: none.

### Chunk 10.4 — Achievement reveal rewrites in cozy voice

Audit anchor:
> **Section 07 · "The voice you already have, that everything should sound like"** — apply to achievement reveals.

What changes: Review the 24 achievement names + descriptions. For any that read as "Steam toast" voice, rewrite in the Decor-Reaction style ("Obi caught his hundredth treat. Of course he did.").

DoD: All 24 achievement strings audited and rewritten where needed.

Risk: low.

### Chunk 10.5 — Drop debug-y labels

Audit anchor:
> **Section 07 · HUD readouts** — "Time: 63" → label-stack: "TIME / 1:03". (Already shipped via Q6.)
> "Round 0" → "Round 1" (Q10 shipped).
> "Lv.1" debug badge (Q11 shipped).

What changes: All shipped per CHANGELOG. Verify no leftover debug-style labels in any minigame ("Cleared:", "Longest:", "Round:") render with raw integers — they should use `drawLabelStack` with caps label + mono digit. Touch each remaining one.

DoD: Cleared, Longest, Round, Combo, all use `drawLabelStack`. No "Round 0" anywhere.

Risk: low.

**Assets needed (Phase 10):** none.

---

## Phase 11: Accessibility + edge cases (audit Section 09)

**Goal:** Make the game one-handed playable and forgiving on edge inputs.

**Audit findings addressed:** Section 09 sub-items.

**Dependencies:** Phase 1.

### Chunk 11.1 — Keyboard nav inside panels

Audit anchor:
> **Section 09 · Input — "No keyboard nav inside panels"** — a keyboard-only player can't browse the Decor list.

What changes: Inside any open panel, arrow keys move the highlight; Enter activates. Add a `panelHighlightIndex` per panel that the renderer uses to draw a focus ring.

DoD: Open Decor, press Down 3 times, press Enter → fourth item activates.

Risk: medium — needs per-panel index tracking.

### Chunk 11.2 — Esc soft-confirm in minigames

Audit anchor:
> **Section 09 · Input — "No 'are you sure' on quitting a minigame"** — Esc dumps progress immediately. Mid-run protection: a soft confirmation chip "Esc again to leave."

What changes: First Esc during play sets `this.escPrompt = 2.5` (sec) and shows "Esc again to leave" pill at top-center. Second Esc within 2.5s exits; otherwise the pill fades.

DoD: Escape mid-run shows confirmation. Two Escapes within 2.5s exits.

Risk: low.

### Chunk 11.3 — Cuddle Pile arrow-key glyphs

Audit anchor:
> **Section 09 · Input — "Cuddle Pile uses ← / → keys"** — modal says "Press LEFT and RIGHT" in words; show key glyphs.

What changes: Replace "Press ← / → to keep the pile balanced." with two key-glyph chips drawn as tiny rounded squares with `←` and `→` inside, inline with body text.

DoD: Cuddle Pile intro shows key glyphs.

Risk: low.

### Chunk 11.4 — Reduced-motion toggle (in upcoming Settings panel)

Audit anchor:
> **Section 09 · Reduced motion / sensitivity — "No prefers-reduced-motion branch."** Annie may be photo-sensitive after a long day. A toggle in a (currently nonexistent) Settings panel: dim the heart-particle confetti, slow the camera flash.

What changes: Add `store.reduceMotion` boolean (default off, with `prefers-reduced-motion` autodetect). When on, halve particle counts, replace camera flash with dim, slow the dedication heart pulse. Settings panel itself is built in Phase 12.

DoD: Toggling `store.reduceMotion = true` in console produces the muted behavior.

Risk: low — store key needs migration backfill.

**Assets needed (Phase 11):** none.

---

## Phase 12: New content — Settings, tutorial, content extension

**Goal:** Address Known Issues from CLAUDE.md and add new content under the constraints.

**Audit findings addressed:** none (new-content goals from task).

**Dependencies:** Phase 1, Phase 11 (reduced-motion key).

### Chunk 12.1 — Settings panel (new)

What changes: Add a fifth panel (Settings) accessed via a small gear chip in the top-right stack on hangout. Contents:
- Volume slider (master gain on `audio` instance)
- Music-only mute toggle (separate from SFX mute)
- Reduce motion toggle (from chunk 11.4)
- Reset save (with two-step confirm: "Type RESET to confirm")
- Version + first-visit date

Reuse `drawPanelFrame` + `drawPanelClose` (no tabs needed). Persist all to `store.settings` JSON object (with migration backfill).

DoD: Settings panel opens, volume slider audibly affects ambient, reset wipes localStorage and reloads.

Risk: medium — reset save is destructive; gate behind confirm.

### Chunk 12.2 — First-visit tutorial arrows

What changes: After dedication is dismissed (firstVisit was true), enter a 4-step tutorial state:
1. Arrow points to Pet button: "Pet Obi to start the day."
2. After pet: arrow points to Games: "Games are over here."
3. Arrow to Decor: "Buy decorations with coins."
4. Arrow to scrapbook chip: "Photos and goals live here."

Each step waits for the indicated click. Track `tutorialStep` in store. Skippable with Esc on any step.

DoD: New player (firstVisit=true) walks through 4 prompts.

Risk: low — `tutorialStep` is a new store key with migration backfill.

### Chunk 12.3 — Pet care loop deepening: brushing minigame mood gate

What changes: When a pet's mood is "groomy" (new mood added to PET_MOODS array — needs migration of `store.petPersonality`), brushing produces a +2 joy bonus and counts double toward bond XP. Surface via the multiplier hint from chunk 7.2.

DoD: Groomy mood appears in mood rotation; brush produces visible bigger reward.

Risk: low.

### Chunk 12.4 — Backyard expansion: vegetable patch (new mini-system)

What changes: Add a small vegetable patch to backyard (next to existing flowers). Click to plant a vegetable seed (5 coins), wait 3 game-days for harvest, harvest gives 12 coins. Visible growth stages. Track in `store.backyardVeggies` JSON (new key + migration default).

DoD: Plant → wait → harvest cycle works across day rollover.

Risk: medium — new persistent system; verify day-rollover hook.

### Chunk 12.5 — Coin-tier 4 wardrobe set (5 items per character)

What changes: Add 5 tier-4 items per character (priced 80–150 coins, gated on `canAccessTier(4)`). Reuse existing slot system (head/neck/body/wrist). Items only unlock once stars ≥ 30 and achievements ≥ 14 and streak ≥ 30 (current tier-4 gate).

DoD: 15 new accessory entries appear in wardrobe under tier-4 lock.

Risk: medium — accessory rendering must support all new keys. **Asset flag below.**

### Chunk 12.6 — New minigame: "Brush Time" (Tier 2)

What changes: Add a 13th minigame — Annie brushes Obi or Luna using mouse drag. Smooth strokes accumulate coverage; tangles slow progress. 60s, three thresholds, challenge modifier "Restless Pet" (pet wiggles more). Full integration per CLAUDE.md "Adding a New Minigame" checklist.

DoD: Minigame card appears, all 9 checklist items complete, challenge mode unlocks.

Risk: high — new minigame is the largest single-chunk piece. May need to split into sub-chunks (scaffold, gameplay, results, challenge mode).

### Chunk 12.7 — New minigame: "Tea Time" (Tier 3, idle-cozy)

What changes: Annie pours tea while Obi and Luna gather. 90s game. Tap each pet at the right rhythm to get them to settle on the rug. Bonus for reaching all three settled. Integration per checklist.

DoD: Same as 12.6.

Risk: high — same.

**Assets needed (Phase 12):**
- ART-7: 5 tier-4 accessory items × 3 characters = 15 accessory frames in atlas
- ART-8: Vegetable seed → seedling → grown sprite triplet
- ART-9: Brush Time bath-style room (likely reuse Bath Time room)
- ART-10: Tea Time tea pot + cups (atlas frames)
- ART-11: Settings gear icon (procedural is fine; SVG-equivalent shape)

---

## Phase 13: Larger repaints (audit L1)

**Goal:** Bring placeholder props up to the painted-character level — or pick a uniform low-fi cozy style and bring everything down. The system matters more than the level.

**Audit findings addressed:** L1, L2.

**Dependencies:** Phase 8 (per-screen polish first so we know what's still flat).

### Chunk 13.1 — Backyard tree repaint

Audit anchor:
> **Section 03 · 03 Backyard — "Tree is two flat green circles on a brown line"** [🔴 high] — strongest art-style mismatch in the game.

What changes: Replace the procedural tree with an atlas-frame painted tree, OR with a richer procedural tree (multi-tone leaf clusters, dappled shadow, branch detail). Recommend procedural to avoid asset dependency: 5 leaf clusters with 3 tone variations, branch with bark-noise stroke.

DoD: Tree visibly matches the bench's painted level.

Risk: low — drawing-only, no save impact.

### Chunk 13.2 — Backyard flat grass repaint

Audit anchor:
> **Section 03 · "Flat single-tone grass"** [🟡 mid] — no horizon shading, no variation. A subtle vertical gradient or low-density grass-blade noise unifies the scene.

What changes: Replace `fillRect` grass with a vertical gradient (cream-green to sage-green) and ~80 low-alpha grass blades drawn procedurally, seed-stable.

DoD: Grass visible has texture and horizon shading.

Risk: low.

### Chunk 13.3 — Hangout placeholder repaint pass

Audit anchor (L1): bookshelf, picture frame, fence, sky-window clouds, fairy-light dots are flat icon art.

What changes: For each prop, either upgrade to procedural rich rendering (gradients, shadow, highlights) or pull from atlas if frames exist. Specifically:
- Bookshelf: add varied book spines (10–14 spines, 4–6 tones)
- Picture frame: add inner painted scene (Annie + pets silhouette) instead of empty white
- Window clouds: add soft fluff with multiple ovals at varying alphas
- Fairy lights: replace dots with bulb shapes (small ellipse + glow halo)

DoD: Each prop visibly upgraded.

Risk: low — drawing only.

### Chunk 13.4 — ObiWalk neighborhood houses repaint

Audit anchor:
> **Section 04 · 04 Obi's Walk — "Houses behind the fence are flat color triangles"** [🟡 mid] — purple, blue, green, red roofs on identical beige boxes.

What changes: Replace each house with a varied facade (window count, door, chimney, paint tone). Add a lamppost and a mailbox between houses (audit specifically calls out the lone hydrant needing friends).

DoD: Walk neighborhood reads as a real street, not a placeholder.

Risk: low.

### Chunk 13.5 — Bath Time tile + tub repaint

Audit anchor:
> **Section 04 · 06 Bath Time — "Tiled wall + tub looks like icon art"** — the room asset needs a paint pass.

What changes: Add tile grout shading, tile highlights, tub rim, soap bubbles in the tub. Rubber duck gets a beak and eye dot.

DoD: Bath room looks painted, not iconographic.

Risk: low.

### Chunk 13.6 — Pillow Pop pillow variation

Audit anchor:
> **Section 04 · 08 Pillow Pop — "Pillows are six identical pastel ovals"** — vary slightly: one with stripes, one with a moon, one with a paw print.

What changes: Add three pattern variants to pillow rendering (stripes, moon, paw-print). Distribute across the six pillows.

DoD: Six pillows distinguishable.

Risk: low.

**Assets needed (Phase 13):** none required (all proposed as procedural). Optional ART-12: painted tree atlas frame as upgrade path.

---

## Phase 14: Type system rollout (audit L3)

**Goal:** Apply the FONT_BODY / FONT_DISPLAY / FONT_MONO division across all draw call sites.

**Audit findings addressed:** L3, F2 completion.

**Dependencies:** Phase 1.6 (font constants).

### Chunk 14.1 — Body-text font swap

Audit anchor:
> **L3 · large — Shared HUD type system.** Add a humanist sans for body and a mono for digits. Keep Fredoka for display only. Touches every scene.

What changes: Grep for `Fredoka One` in `c.font = …` strings (~40+ sites). Categorize by purpose:
- Display (titles, panel titles, dedication, achievement reveals) → keep `FONT_DISPLAY`
- Body (welcome banner, panel descriptions, item subtitles, status text, tooltips) → switch to `FONT_BODY`
- Digits (HUD digits, combo, score popups, coin counter, streak count) → already on `FONT_MONO` for HUD; switch coin/streak/star pill text to `FONT_MONO`
- Buttons → `FONT_DISPLAY` for play buttons (chunky friendly), `FONT_BODY` for chip labels

Apply in 4–5 sub-chunks (one per category) to keep diffs reviewable.

DoD: Each category is on its assigned font. Visual diff: body text reads sharper, digits read clearer, titles unchanged.

Risk: medium — large diff, but each sub-chunk is reversible. Do not migrate display titles on first pass — they're correct.

**Assets needed (Phase 14):** ART-13: optional Google Font import for `Inter` or `DM Sans` to replace `system-ui` fallback in `FONT_BODY`. Default is `system-ui` which is asset-free.

---

## Bug Findings (pre-triage, comprehensive)

Sourced from a deep-read pass over `annies-cozy-day-test.html`. All file paths are `annies-cozy-day-test.html`. **Bold** = scheduled in Phase 4. The remainder are deferred (low severity / very-low / cosmetic).

### B1: timeOfDay = 0 (Morning) silently maps to "day" — **scheduled (Phase 4.1)**
File:line: 1193, 3360, 5298, 8485, 8552, 9120, 9513, 9628.
Confidence: high. Severity: high.
Repro: cycle the Time of Day decor item to Morning (index 0). Lighting, music, and ambient never select the morning branch. `0 || 1` → 1.
Mitigation: replace `|| 1` with explicit `== null` guard.

### B2: Bond shape migration only checks `obi`, not `luna` — **scheduled (Phase 4.2)**
File:line: 542–544.
Confidence: high. Severity: high.
Repro: a partial save with `bond.obi` present but no `bond.luna` will not trigger the shape reset. First `awardBondXP("luna", …)` throws on `b.xp` of undefined.
Mitigation: extend condition to require both pets.

### B3: Daily-gift bond XP grants skip the level-up loop — **scheduled (Phase 4.3)**
File:line: 4882, 4887.
Confidence: high. Severity: medium-high.
Repro: place obi.xp one below the next level threshold; claim a Day-4 calendar gift (25 XP) or mystery (+50 XP). xp crosses threshold but level does not advance until next `awardBondXP` of any kind.
Mitigation: extract `applyBondXPRaw(pet, amount)` helper and call from both sites.

### B4: Weekly challenge resets on Thursday UTC, not Monday — **scheduled (Phase 4.4)**
File:line: 4486–4492.
Confidence: high. Severity: medium.
Repro: comment says Monday; impl uses `Math.floor(Date.now() / 7days)` — increments at 00:00 UTC every Thursday since Unix epoch was Thursday 1970-01-01.
Mitigation: anchor weekId to the local Monday.

### B5: Auto-applied visitors give double joy when clicked — **scheduled (Phase 4.5)**
File:line: 5191–5208 (click handler), 7026–7028 (auto-apply).
Confidence: high. Severity: medium.
Repro: wait for neighborCat / squirrel / robin to spawn; joy auto-applies. Click the visitor → joy applies again.
Mitigation: set `data.interacted = true` inside auto-apply branch.

### B6: Music scheduler keeps subBeat misaligned after long tab-hide — **scheduled (Phase 5.3)**
File:line: 1204–1249.
Confidence: medium. Severity: low-medium.
Repro: background tab > 10s. On return, `_musicNextTime` is reforwarded but `_musicSubBeat` and `_arpStep` keep stale values; chord/arp progression is now off by an arbitrary amount.
Mitigation: reset `_musicSubBeat = 0` and `_arpStep = 0` when the catch-up branch fires.

### B7: Esc bypasses away-story and daily-gift modals — **scheduled (Phase 4.6)**
File:line: 5396–5406.
Confidence: high. Severity: medium.
Repro: open hangout with daily gift active, press Esc. Handler matches the final `else` and transitions to title; the gift reward is forfeited.
Mitigation: add explicit branches for `_awayStory` and `dailyGift`.

### B8: Daily gift abandoned if player exits hangout without claiming — **scheduled (Phase 4.7)**
File:line: 4298, 4426–4436.
Confidence: high. Severity: medium.
Repro: enter hangout, leave without claiming; re-enter same day; gift never re-shows.
Mitigation: defer `lastVisitDate = today` until the gift is actually claimed.

### B9: Away-story prompt invisible during 100ms gap (deferred)
File:line: 6787, 4859.
Confidence: high. Severity: low.
Repro: click handler dismisses at phase>0.5; render shows prompt at phase>0.6. Cosmetic.
Mitigation: align thresholds.

### B10: Bond retroactive XP migration may overwrite valid luna xp (deferred)
File:line: 546–552.
Confidence: medium. Severity: low-medium.
Repro: a save where `bond.obi.xp === 0` but `bond.luna.xp > 0` legitimately. Migration overwrites luna.
Mitigation: per-pet retroactive grant or only run if both zero.

### B11: Mute-toggle within 500ms creates overlapping audio nodes (deferred)
File:line: 1176–1191, 13815.
Confidence: medium. Severity: low.
Mitigation: track pendingDisconnect and serialize.

### B12: Cuddle Pile completion forces score = 90, ignoring careBonus.scoreMultiplier (deferred)
File:line: 12265, 12340–12345.
Confidence: high. Severity: low.

### B13: timerBonus from careBonus inflates Cuddle Pile timeLeft → score window mismatch (deferred)
File:line: 9757, 12265, 12305.
Confidence: medium. Severity: low.

### B14: Visitor lost on every scene change — **scheduled (Phase 4.8)**
File:line: 4302, 7022.
Confidence: high. Severity: medium.
Repro: visitor spawns in hangout → enter minigame → return → visitor gone.
Mitigation: persist `ambientEvent` outside scene state.

### B15: Test hooks reassigned to window every frame — **scheduled (Phase 5.2)**
File:line: 13822–13939, 13897–13936.
Confidence: high. Severity: low (perf).
Mitigation: move out of `loop()` body.

### B16: PawstepPatterns round counter runs forever past sequence cap of 5 — **scheduled (Phase 4.9)**
File:line: 11744, 11796, 11842.
Confidence: high. Severity: low.

### B17: JSON.parse returns valid-but-wrong-shape values that crash later (deferred)
File:line: 403–410.
Confidence: low. Severity: low.

### B18: Clock manipulation grants unlimited daily bond XP and care streak (deferred)
File:line: 609–613, 6911–6926.
Confidence: medium. Severity: very low (single-player local).

### B19: weeklyChallenge.text may be undefined for old saves (deferred)
File:line: 496, 4491.
Confidence: medium. Severity: very low.

### B20: dailyTasks migration omits backfill for `completed` (deferred)
File:line: 491, 6933.
Confidence: low. Severity: very low.

### B21: audio.ambientActive not initialized in constructor (deferred — works due to undefined-as-falsy)
File:line: 1015–1026, 1118.
Confidence: high. Severity: very low.

### B22: SnackSort drag forces game.mouse.down = true from a click handler (deferred)
File:line: 10911.
Confidence: high. Severity: low.

### B23: Bath time game phase doesn't end early when both pets washed (deferred — design choice)
File:line: 10595–10609.

### B24: WindowWatch combo-reset logic is fragile but currently OK (deferred)
File:line: 11488–11493.

### B25: Backyard scene plays previous music mood — **scheduled (Phase 4.10)**
File:line: 1192–1196, BackyardScene.enter.

### B26: Streak care-action reset edge case under clock-fiddle (deferred)
File:line: 6914.

### B27: couchPotato achievement queued every frame past 30s in cuddle (deferred)
File:line: 12317.

### B28: Modal click cascade lets dailyGift overlay awayStory visually (deferred — addressed by 4.6/4.7 indirectly)
File:line: 8326.

### B29: lastVisitTimestamp updated unconditionally in HangoutScene.enter (deferred)
File:line: 4423–4424.

### B30: drawDailyGift past/current/future logic is contradictory at week wrap (deferred)
File:line: 6829–6834.

---

## Performance Findings

### P1: Per-frame radial-gradient allocation in HangoutScene shadow path — **scheduled (Phase 5.1)**
File:line: 7385–7402.
Confidence: high. Severity: low (cumulative).
`drawDynShadow` is called 3× per frame; each call does `c.createRadialGradient` + `c.ellipse`. At 60Hz that's 180 `createRadialGradient` allocations/sec.
Mitigation: build one gradient at scene enter, translate per pet, scale `globalAlpha`.

### P2: Test hooks reassigned every frame — **scheduled (Phase 5.2)**
Same as B15. The four hook assignments live inside `loop()` so they execute at 60Hz. Each is a string-keyed property write on `window`.
Mitigation: move out to module scope.

### P3: Music scheduler subBeat misalignment after long tab-hide — **scheduled (Phase 5.3)**
Same as B6. While the audio engine has a tab-hide guard, the catch-up jump leaves chord/arp state stale.
Mitigation: reset subBeat + arpStep on catch-up.

### P4: Sprite atlas decode confirmation — **scheduled (Phase 5.4)**
File:line: ~1400 (per ARCHITECTURE-REFERENCE).
Confidence: low (investigation needed).
Need to confirm `SPRITE_ATLAS_URI` decodes once and the `Image` is reused. If a per-frame `new Image()` exists, that's a serious perf bug.
Mitigation: investigate; fix if found.

### P5: Living room base cache only invalidated on hangout decor toggle (verified)
File:line: 4983.
Status: verified correct. Backyard decor toggles do NOT invalidate `livingRoomBase` because the backyard does not use that cache. The "all toggles invalidate" claim in CLAUDE.md is partially overstated but functionally fine.
Action: update CLAUDE.md note in a future doc-pass; no code change.

### P6: Particle splice-on-remove inside reverse loop — acceptable
File:line: ~1361.
The particle update uses `splice(i, 1)` inside a backwards-iterated loop, which is fine. No fix needed.

---

## Global Risk Register

### R1: Save-state migration regression
What could break: New store keys (`firstVisitDate`, `lastDedicationYear`, `streakRibbonsClaimed`, `visitorsSeen`, `tutorialStep`, `settings`, `backyardVeggies`, `goal.hint`) in Phases 6, 7, 11, 12 each need migration backfill. Forgetting one crashes existing saves on first read.
What it threatens: Anyone playing the game in production loses their save on the first session after the bug ships.
Detection: After every chunk that adds a key, manually load the live save URL with the key cleared from localStorage; observe a clean boot. Run the syntax check + a manual hangout open before pushing.
Mitigation: Append every new key to the `/* Backfill migrations */` block in the same commit. Treat the migration line as part of the chunk's DoD.

### R2: Dedication card flow regression
What could break: The dedication is the emotional core. Phase 6's three-line reveal, paper texture, heart-from-Annie, and anniversary re-trigger all touch the firstVisit path. A bad change could prevent the dedication from showing, double-show it, or skip the firstVisit flag.
What it threatens: First-time players never see the dedication card. Anniversary players see two cards. Esc dismissal could bypass the 1.5s gate again (regressing Q12).
Detection: Manually clear `firstVisit` and `firstVisitDate` from localStorage; reload; observe full dedication, three lines, heart, then dismissal. Then confirm `firstVisit` is now false. Then set `firstVisitDate` to one year ago and reload — observe re-trigger once. Verify Esc inside the 1.5s gate is silently ignored.
Mitigation: Wrap dedication changes in chunks with explicit before/after manual test paragraphs in the commit message.

### R3: Bond retroactive grant on save migration
What could break: Existing bond levels recalculated incorrectly if migration logic touches `BOND_XP_RATES` shape, or if Phase 4.3's level-up loop is added but accidentally runs against an already-leveled save.
What it threatens: Real existing bond progress with Obi and Luna for anyone who has been playing — emotional core of the game.
Detection: Before Phase 4.3 ships, log `store.bond.obi.level` and `store.bond.luna.level` on entry; run the change; verify levels are unchanged-or-higher (never lower). Add a one-time `applyBondXPRaw` call against a save with xp = (next-threshold - 1) and confirm exactly one level-up.
Mitigation: `applyBondXPRaw` should never overwrite xp — only add to it. Wrap retroactive logic in `if (!store.bond.retroDone) { ... store.bond.retroDone = true; }` so it cannot run twice.

### R4: Away-story / daily-calendar continuity
What could break: Phase 4.7 (deferred lastVisitDate) and 4.6 (Esc dismissal applies bonus) both touch the modal cascade. A regression could either re-trigger the away story every entry or never apply its bonus.
What it threatens: 28 hand-authored away stories are a love-letter feature. Players miss them, or see them too often.
Detection: Set `lastVisitTimestamp` to 3 hours ago and reload — away story shows once. Press Esc on it — bonus is applied (verify `coins` increment if story has coinReward), story does not re-appear on next enter.
Mitigation: Wrap the Esc-dismiss logic in defensive code that always applies the bonus before clearing the story state, and always sets `lastVisitTimestamp = Date.now()` on dismiss.

### R5: Phase 8.1 (intro modal migration) breaking icon callbacks
What could break: 12 minigames each pass a per-game icon function to `drawInstructionCard`. The new `drawIntroModal` uses the same callback signature, but a typo or order change breaks all 12 at once.
What it threatens: Every minigame's intro screen.
Detection: Open each of the 12 minigames after the migration; verify icon renders.
Mitigation: Migrate one minigame first as a canary, validate, then migrate the remaining 11 in a second commit.

### R6: Q-tier visual regression
What could break: Several Phase 1–3 chunks adjust the same sites Q-tier touched (HUD pill positions, panel close buttons, intro scrim). A poorly merged change could undo a Q-tier fix.
What it threatens: Re-introducing audit issues that are already fixed.
Detection: Each Phase 1–3 chunk's DoD should explicitly say "Q-N still visibly in effect" for any Q-tier item that overlaps. Visual diff against a screenshot from 2026-05-07.
Mitigation: When in doubt, search the diff for `wardrobe`, `Closet`, `INTRO_SCRIM`, `SAFE`, `0:42`, `Lv.` to confirm Q-tier survives.

### R7: New minigames (12.6, 12.7) breaking the 9-step integration checklist
What could break: A new minigame missed from any of: SceneRegistry, gameCards array, store.best_KEY, totalStarsEarned() entry, all 3 t3 threshold maps, CHALLENGE_MODIFIERS. Result: stars don't count, achievement tracking fails, or the game card doesn't appear.
What it threatens: Two new minigames invisible or non-counting.
Detection: After each new minigame ships, score it 3 stars manually; verify the star pill increments by 3 on the hub; verify it appears in the menu.
Mitigation: Treat the 9-step checklist as the chunk's DoD. Do not mark complete until each step is verified.

---

## Plan Summary

**Phase 1 → 14 ordering:** Foundation first (1), proof on hub + one panel (2), other panels (3), bug fixes (4), perf (5), heart-tier (6), system surfacing (7), per-screen polish (8), audio/motion (9), writing (10), accessibility (11), new content (12), repaints (13), type system (14).

**Hand-shippable in one evening:** Chunks 1.1 + 1.2 (place pill grid + minigame HUD migration) + 4.1 (timeOfDay bug) — three commits, all under 30 minutes each, all visibly improving the game.

**Hand-shippable in one weekend:** Phases 1 + 2 + 4 in full — foundation, hub HUD, one panel rebuilt, 10 bugs fixed.

**Heart-tier-only weekend:** Phase 6 alone — dedication polish, cuddle hero shot, caretaker reveal.
