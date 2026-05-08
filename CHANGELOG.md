# Changelog — Annie's Cozy Day

## 2026-05-08

### Phase D · Remaining three panels
- D.6: Empty states for Wardrobe (per-character) and Game Menu. Wardrobe items column collapses to a centered hint when 0 accessories owned for the active character ("No items yet for Obi/Luna/Annie. Earn coins from minigames or unlock via care streaks and stars to shop here."). Mirrors the Photos / Milestones tab convention. Game Menu's "★ X / 36 stars earned" subtitle becomes "Pick a card below to start earning stars!" when totalStarsEarned() === 0.
- D.5: Migrated Scrapbook panel to `drawPanelFrame` + `drawPanelTabs` + `drawPanelClose`. New `SCRAPBOOK_PANEL = { x: 40, y: 50, w: 720, h: 530 }` const + `SCRAPBOOK_TABS` array of 4 tabs (Photos / Milestones / Stats / Goals). The panel.y=50 (vs. wardrobe's 60) is intentional: it puts `drawPanelTabs` (panel.y+60) at exactly y=110, where the original tab row sat — preserving every per-tab content y offset (photos clip rect y=140, milestones y=155, stats y=165, goals y=145+gy). Title font 28px stays the same; title y shifts 100 → 90 (10px up, matches the y=50 panel top). The four hand-coded tab pills with unequal widths (Photos 70, Milestones 90, Stats 50, Goals 55) collapse to four equal 163px segmented pills. Tab hover state removed (consistent with Decor and Wardrobe). Replaces ~38 LOC of hand-coded frame/tab/close in render plus three sets of per-tab rect literals in click/hover/interactiveAt.
- D.4: Wardrobe paper-doll — hero portrait + live preview. Left half of the panel (60-320, y=180-560) now renders a 1.7-2.0× hero portrait of the active character (Obi/Luna/Annie) with their currently-equipped accessories. Right half (340-740) holds the existing item list, narrowed from 640w to 400w. Hovering an *owned* item swaps the portrait to a preview with that item temporarily applied — `drawAccessoryOverlay` extended with an optional `equippedOverride` arg that takes a `{slot: itemKey}` map; the wardrobe builds the override from current `equippedSlots` with the hovered item swapped into its slot. `getWardrobeItemRect` x: 80 → 340, w: 640 → 400; first-y 175 → 190 (subtitle moved). `wardrobeMaxScroll` visibleH 565-175 → 555-190. Scroll arrows relocate to x=540, y=188 / 575 (centered in items column). Hover/click bounds and arrow rects updated to match.
- D.3: Migrated Wardrobe (Closet) panel to `drawPanelFrame` + `drawPanelTabs` + `drawPanelClose`. New `WARDROBE_PANEL = { x: 40, y: 60, w: 720, h: 520 }` const + `WARDROBE_TABS = [{key:"obi"}, {key:"luna"}, {key:"annie"}]`. The three small 80px-wide character tabs at (80/170/260, 130) collapse into the segmented pill row at panel.y+60 (full panel width minus 48px gutters, three equal pills ~220px wide). "Coins:" subtitle dropped — duplicated by HUD coin pill. "X / Y owned" subtitle re-rendered at y=165 below the tab row. Tab hover state removed (consistent with Decor — `drawPanelTabs` doesn't render hover). Click handler at line ~5466, hover handler ~line 5158, and `interactiveAt` at ~line 5247 now read tab hits via `panelTabHit(WARDROBE_PANEL, WARDROBE_TABS, x, y)` and close-rect via `panelClose(WARDROBE_PANEL)`. Replaces ~30 LOC of hand-coded frame/tab/close.
- D.2: Added "NEXT: N" hint to each Game Menu card when the player has < 3 stars on that minigame. Extracted the per-game thresholds into a top-level `STAR_THRESHOLDS` const so the menu render and `totalStarsEarned` share a single source of truth (was duplicated as inline ternaries on every gameCard `best()` getter and as a `t3Map` in three places — `t3Map` callers will migrate as those sites are touched). Hint sits right-aligned at the bottom-right of each card (above the play arrow), 10px grey caps, e.g. "NEXT: 700". 3-star cards get no hint. `totalStarsEarned` rewritten to read from STAR_THRESHOLDS via the same `store["best_" + key]` pattern.
- D.1: Migrated Game Menu render to `drawPanelFrame` + `drawPanelClose`. New `MENU_PANEL = { x: 40, y: 60, w: 720, h: 540 }` const sits next to `PANEL_STD` because the menu's 6-card layout needs the wider 720px frame. Replaces ~33 LOC of hand-coded scrim/panel/title/close. Visual changes: title font 30px → 28px, title y=110 → y=100 (matches Decor frame); close button moves from (618, 102) center to (738, 82) center — top-right corner of the panel — matching every other migrated panel. Subtitle "★ X / 36 stars earned" re-rendered at y=120 (was y=128). Click handler at the menu-open guard (~line 5363) and hover handler (~line 5131) now hit-test via `panelClose(MENU_PANEL)`.

### Phase C · Save-touching bug fixes
- C.B2: Bond migration (~line 560) now triggers on missing `luna` as well as missing `obi`. Previously a partial save with only `obi` would crash on first `awardBondXP("luna", ...)` because `store.bond.luna` was undefined. The migration writes the full default shape for both pets if either is missing. Pure migration fix; no impact on healthy saves.
- C.NEW.2: Backyard Esc cascade now closes the `byDecor` panel before exiting to hangout. Previously Esc on backyard with the decor panel open would skip the close step and transition straight to hangout, leaving the panel state dirty. The exit-to-hangout path is unchanged (already correct — hangout.enter sets lastVisitTimestamp, so the audit's N2 worry about lastVisitTimestamp going unset is not a real issue here). Verified: Esc on bare backyard → hangout; Esc with byDecor open → close panel; Esc again → hangout.
- C.NEW.1: CuddlePile `couchPotato` achievement was queued every frame from 30s onward (line 12809). `queueAchievement` is idempotent so no real bug, but wasteful and stylistically inconsistent — the win-state branch (12804) only queues once. New `this._couchPotatoQueued` instance flag short-circuits the per-frame `queueAchievement` call after the first queue. Flag starts undefined (falsy) on each fresh scene instance.
- C.B25: Backyard now plays the backyard music mood; returning to hangout switches back to the time-of-day mood. `audio.startAmbient(mood)` is a no-op when `ambientActive` is already true, so calling it from a scene transition never swapped moods. BackyardScene.enter now calls `audio.setMusicMood("backyard")`; HangoutScene.enter calls `audio.setMusicMood(["morning","day","evening","night"][tod])`. Mood is passed explicitly because `_getMusicMoodKey()` reads `game.scene.name` and at `enter()` time `game.scene` is still the previous scene. Crossfade is the existing 350ms gap from `setMusicMood`.
- C.B16: PawstepPatterns `this.round` now caps at 5 to match the 5-element sequence cap. The two `this.round++` sites in `updatePlay` (correct-result branch) and `onGameClick` (wrong-result rollover branch) now do `Math.min(5, this.round + 1)`. The counter wasn't displayed on screen so this was a low-impact bookkeeping bug — but it had been growing unbounded across long sessions.
- C.B4: Weekly challenge now resets on the local Monday at 00:00 instead of Thursday UTC. Old `Math.floor(Date.now() / 7days)` anchored to Thursday UTC because the unix epoch was a Thursday. Replaced with a Monday-anchored local-date calc: take today, back up `(getDay()+6)%7` days to Monday at midnight, divide by 86400000 for a stable weekId. Active players will see a one-time weekly-challenge reset on the first local Monday after this fix — acceptable per plan; flagged so a player who notices won't think it's a bug.
- C.B3: Daily-gift bond XP grants now run the level-up loop. New `applyBondXPRaw(pet, amount)` helper (right above `awardBondXP`) does the `b.xp += amount; while (level<10 && xp >= getBondXPForLevel(level+1)) level++` loop and saves. `awardBondXP` now delegates after its daily-cap check. Daily-gift `reward.bondXP` (Day-4 = 25 XP) and the +50 mystery now flow through `applyBondXPRaw` instead of doing `store.bond.X.xp += N; saveBond()` raw — previously a gift that crossed a level threshold left bond.xp past the threshold but bond.level unchanged. The level-up celebration banner (`_bondLevelUp`) now fires from these paths too.
- C.B1: `timeOfDay = 0` (Morning) no longer silently maps to "day". Eight occurrences of `store.decor.timeOfDay || 1` replaced with `(store.decor.timeOfDay == null ? 1 : store.decor.timeOfDay)` so the falsy-coerce on `0` no longer hides Morning. Affects `_getMusicMoodKey` (music swaps to "morning" mood), the room preset cycle (lines 3757, 9573, 9966, 10081 — covers hangout draw, backyard tint, decoration room render, and minigame ambient), 9005 (summer fireflies night gate — benign in practice but fixed for consistency), and 8938 / 5745. Default-init at line 536 (`if (timeOfDay === undefined) … = 1`) unchanged — saves with no key still default to Day.
- C.B7 + C.B8: Esc cascade now applies the away-story bonus and claims the daily gift instead of falling through to title; the daily-gift `lastVisitDate` set is deferred until claim. Two new HangoutScene helpers `_tryDismissAwayStory()` and `_tryClaimDailyGift()` extract the click-to-apply logic so onClick and onKeyDown share a single code path. Esc on a `dailyGift.collected = true` celebration now skips the 4s auto-dismiss timer. The daily-gift entry block at line ~4834 no longer sets `store.lastVisitDate = today` — that assignment moves into `_tryClaimDailyGift` so a player who enters hangout, sees the gift modal, then exits without claiming will see the gift again on next entry today (passive income still uses its own `lastPassiveIncomeDate` guard so it remains exactly-once).
- C.B5: Visitor double-joy on auto-apply + click. `spawnVisitorEvent` already auto-applies `joyEffect` for visitors without `coinReward`, but left `data.interacted = false`, so a curious click within the visitor window granted the joy bump a second time. Auto-apply branch now sets `data.interacted = true` so the click handler at the existing visitor-click guard short-circuits.
- C.B14: Visitor / ambient event no longer disappears on every scene round-trip. New module-level holder `persistedHangoutAmbient` (after `SceneRegistry`) snapshots `{event, cooldown, savedAt}` from the last `updateAmbientEvents` tick. New HangoutScene constructor restores the event with a wall-clock-elapsed decrement on the timer; if the event has expired during the away window, the cooldown is decremented instead so visitors don't re-roll instantly. New `_persistAmbient()` method is called at the end of both branches in `updateAmbientEvents`. Module-level holder rather than `store` keeps the change migration-free; persistence resets only on page reload, which is the correct semantic.

### Phase B · Hub HUD + Decor migration
- B.1: Refined `HUD_GRID` (row2=34, bottomY=510) and added `placePillStack` helper. Migrated 5 hub HUD pills (streak, dailyTasks, weekly, coin, star) to a single right-anchored stack on slot 1 (y=34) — fixes F1 audit finding (HUD has no grid). Goal pill migrated to `placePill("bl", 0, w)`. Folded in N5: coin popup y now relative to coin pill y. Pill order right→left: star, coin, weekly, dailyTasks, streak. Visual changes: coin/star shift up 25px and right ~150px to right-anchor; streak/dailyTasks/weekly shift right ~25px and h grows from 20 to 22; vertical gap to Luna pet pill is 6px; horizontal gap to chip column is 6px. Backyard scene's coin pill not migrated in this chunk (out of scope).
- B.2: Verified HangoutScene.draw button-fill scope: 0 matches for `warmRed` or `#9B59B6` (Q-tier 2026-05-07 already collapsed all hub buttons to `#C7A37B` neutral / `#A05A3C` active). No-op skip per refined plan. Backyard Decor button purple `#9B7DBD` (line 9631) is out of B.2 scope.
- B.3: Migrated Decor panel render to `drawPanelFrame` + `drawPanelClose`. Added `panelClose(panelKey?)` helper and `PANEL_STD` constant for the standard 600×480 hangout/backyard frame. Decor panel close button moves from (618, 102) to (678, 92) — top-right corner of the panel — matching the new drawPanelClose convention. Decor click handlers (hover at line 4998, click at line 5216) now hit-test via `panelClose("decor")`. Other panels (menu, wardrobe, scrapbook, backyard decor) keep their old positions until D.NEW.
- B.4: Added four-tab row to Decor panel — Room / Upgrades / Seasonal / Cozy Set. New consts `DECOR_GOLDEN_KEYS` (chandelier, goldenCurtains, silkPillows, antiqueMusicBox, royalThrone) and `DECOR_TABS`. New `filterDecorByTab` and `getDecorTabItems` filter the existing visible-decor list per tab. Pagination resets when tabs switch. Item rect first-y shifted from 150 to 170 to make room for the tab row at y=130-156. Subtitle "Stars earned: X / 33 ..." dropped — info already lives in HUD pills.
- B.5: Added lock-state chip on decor cards. New `decorLockState(item)` returns the priority-ordered gate (achievement → streak → stars → season → coins) or null when fully owned. New `drawLockChip(c, rect, kind, value, current?)` renders a small chip top-right of a card with kind-appropriate icon + label (e.g. "17 / 25 ★", "200 🟡", "30d streak"). Chip and toggle/cycle state are mutually exclusive: toggle only renders when `have && !lockState`. Replaces the old "Need X stars/streak" text and surfaces achievement / coin / season gates that were previously invisible. Achievement labels truncated to 12 chars per DoD.
- B.6: Hub coin/star pills are now clickable nav (refined-plan addition). Star pill → opens Game Menu (natural place to see X/33 stars). Coin pill → opens Decor panel (where coins are spent). Click handler reads from `this.hubHudRects` cached during the first hub draw, so it stays in sync with B.1's pill grid.

### Phase A · Foundation helpers
- A.1: Added `HUD_GRID` constants (row1, row2, pillH, pillGap, primaryH, chipCol, bottomY) and `placePill(side, slot, w, h?)` helper as single source of truth for HUD pill anchor points across hub, backyard, and minigames
- A.2: Migrated `BaseMinigameScene.drawTopHud`, `CuddlePileScene.drawTopHud`, `WildWandScene.drawTopHud` to `placePill`. Score pill now clears the right-edge chip column (sound/camera/scrapbook) with 6px gutter — fixes F6 chip-collision audit finding. Time/Score pills sit at y=16 (was y=12) for grid alignment.
- A.3: Added `drawPanelFrame(c, {x,y,w,h,title?,radius?})` and `drawPanelClose(c, panel, hovered)` helpers. Additive — panels still use their hand-coded frames; migration happens in B.3 / D.1 / D.3 / D.5.
- A.4: Added `drawPanelTabs(c, panel, tabs, activeKey)` segmented-pill row helper anchored to panel.x+24, panel.y+60, with companion `panelTabHit(panel, tabs, x, y)` for click handlers. Synthetic `__panelTabsTest` hook validates hit geometry. Additive — tabs migrate to this helper in 2.4 (Decor) / 3.3 (Wardrobe) / 3.5 (Scrapbook).
- A.5: Added `drawIntroModal(c, {eyebrow?, title, body, iconFn?, challengeText?, bonusText?, metaText?})` and `drawKeyGlyph(c, x, y, char, w?, h?)` helpers. Drop-in superset of `drawInstructionCard` with eyebrow + structured args + single thin meta line. Existing `drawInstructionCard` unchanged. Wired in G.1.a (Bath Time canary) and G.1.b (batch).
- A.6: Added `FONT_DISPLAY` / `FONT_BODY` / `FONT_MONO` role constants and `drawLabelStack(c, x, y, label, value, opts)` helper modeled on `drawHudTime`. No mass font rewrite — chunks that touch a specific HUD widget swap inline as part of their own DoD.
- A.7: Added `drawCharacterUnderModal(c)` framing-transform helper (scale 0.85 around canvas center, shift +60 down) so per-minigame characters drawn at normal y-coords compose below the intro modal at y=150-410. Wired in G.1+ as part of per-minigame intro polish.

## 2026-05-07

### Audit Q1–Q13 quick wins
- Hub tab row: renamed "Wardrobe" → "Closet" (storage key unchanged), trimmed button width 100→90, unified all panel/mode buttons to neutral `#C7A37B` with single `#A05A3C` active accent
- Added `SAFE = 16` canvas-edge gutter constant; goal pill, "Cleared:" pill, and "Longest:" text now respect the gutter
- Standardized top-right HUD buttons (sound, camera, scrapbook) to a single 28×28 cream chip stack at `x = W - SAFE - 28`, 6px vertical gap
- Backyard "← Go Inside" button moved top-left, cream pill on cocoa text, pill style; backyard Decor button shifted right to make room
- Unified minigame intro modal scrim to single `INTRO_SCRIM = "rgba(58,42,30,0.55)"` constant
- Time HUD now reads as `m:ss` (e.g. `0:42`); Time/Score labels use mono uppercase caps above the value, dark text on cream pill
- Removed "Made with love and way too much JavaScript" from title subtitle rotation
- Trimmed all 12 minigame instruction strings to ≤8 words per sentence (no isMobile branches except Cuddle Pile)
- Bonus chip rewritten: now reads "Obi & Luna are happy today. Bonus time." or "Pets are content. Small bonus." (numeric tail dropped)
- Where's Luna: round counter never displays "Round 0" (uses `Math.max(1, this.round)`)
- Hub: dropped the "Lv.X" bond badge under each pet's joy bar; pill heights shrunk 56→38; bond progression system itself untouched
- Esc on dedication card now respects the 1.5s phase gate (matches click behavior)
- Verified `roomPreset` cycle handler at line 4934: `(x+1) % (max+1)` — `max:4` with 5 labels yields all five reachable; no change needed

## 2026-03-30

### Procedural Music Engine
- Replaced two-note drone (A2+E3) with full 4-voice procedural music system
- Voices: sustained bass (sine), detuned pad pair with LFO, procedural melody (triangle, pentatonic random walk), arpeggio (sine)
- All through a shared lowpass filter for warmth
- 5 moods with different chord progressions, BPM, and filter settings:
  - Morning (76bpm, bright), Day (72bpm, warm), Evening (64bpm, mellow), Night (54bpm, lullaby), Backyard (80bpm, playful)
- Smooth crossfade on scene/time-of-day transitions
- Web Audio look-ahead scheduling for precise timing

### Pet Bond / Relationship Leveling
- New bond level 1-10 per pet, growing over days of varied care
- Bond XP from 8 action types (pet, brush, treat, toy, feed, water, game, visit) with daily caps
- Level curve: N*N*50 XP, reaching max in ~45 days of dedicated play
- Retroactive XP for veteran players based on existing stats
- Bond meter UI: pink heart bar + "Lv.X" badge in pet status pills
- Level-up celebration banner with particle burst
- Level 2+: door greeting (pets run to Annie on game open)
- Level 6+: affectionate thought bubbles ("Obi gazes at you with pure adoration")

### "While You Were Away" Stories
- 28 story templates shown on return after 2+ hours away
- Parchment-style overlay with word-wrapped story text and paw print decorations
- ~20% of stories include bonus coins or joy
- Stories reference pet personalities and game themes

### Daily Gift Calendar
- Replaced simple daily gift with 7-day rotating reward calendar
- Visual calendar grid showing past (checkmark), current (pulsing), and future days
- Escalating rewards: 10→50 coins, Day 4 bond XP treat, Day 7 mystery gift
- Streak multiplier: +0.5x per week of consecutive days (capped at 3x)
- Mystery gifts: bonus coins, bowl refill + joy, or 50 bond XP

### Seasonal Events
- Real-world season detection (Spring/Summer/Autumn/Winter)
- 12 seasonal decorations (3 per season), 8 seasonal accessories (2 per pet per season)
- 4 seasonal visitors: Spring bunny, Summer ice cream truck, Autumn scarecrow, Winter Santa's elf
- Visual effects: cherry blossoms (spring), fireflies (summer), falling leaves + orange tree (autumn), window frost (winter)
- Items only purchasable during their season but remain equipped year-round
- Shop filtering via getVisibleDecorItems() and getVisibleAccessories()

### Wild Wand Rebalance
- Rebalanced Luna's Wild Wand for playability: Luna follows lure tighter (chaseSpeed 350→420, chaseDamping 1.5→2.2), less gravity (200→120), wobble is occasional twitches not constant vibration
- Gaps wider (180 start, 110 floor), speed slower (100 start), spawn interval gentler
- Fixed elapsed timer bug (used 300 instead of duration=90)
- Removed combo-loss on boundary touch, reduced hitbox inset (12→8px)

### Minigame Improvements
- Snack Sort: added golden treats (3x points, 8% spawn) and rotten treats (-20 pts, 8% spawn), faster speed ramp
- Pawstep Patterns: capped sequence at 5 steps, wrong input deducts 10 pts instead of full reset

### Hangout Engagement Overhaul
- Bowl drain 2x faster, visible pet distress (pulsing red ring at joy < 30)
- Clickable ambient events: butterflies/birds +1 coin, rain +2 joy, package +5 coins
- Interactive bookshelf (story time, +3 joy, 30s cooldown) and rug (Luna kneads, +2 joy)
- "Next Goal" HUD indicator at bottom-left

### Progress Visibility
- Wardrobe: "X/30 owned" counter
- Minigame menu: "X/36 stars earned"
- Scrapbook Goals: "X/12 completed"

### Endgame Content
- 5 Golden Room decorations (200-500 coins, require 25 stars): Curtains, Chandelier, Silk Pillows, Music Box, Royal Throne

### Wild Wand Gameplay Overhaul
- Physics: wilder lure swing (springK 4.5→8→6, damping 3→1.4→1.8)
- Luna: faster chase but more damped, pounce mechanic, cat wobble
- Tighter gaps, faster speed, bobbing/narrowing obstacles
- Speed lines, obstacle preview silhouettes, screen shake on near-miss
- Milestone celebrations at 10/25/50 obstacles

### Luna's Wild Wand — New Minigame
- Flappy Bird-inspired side-scroller with indirect control via wand toy
- Physics-based lure on string, Luna chases with momentum
- 4 obstacle types: shelves, cushions, scratchers, blanket forts
- Full BaseMinigameScene integration, challenge mode, achievement

## 2026-03-29

### Backyard Overhaul
- Fetch with Obi: throw ball, Obi retrieves, +1-2 coins. Fixed stuck-in-returning bug with 6s timeout
- Water Sprinkler: toggle on for 15s, animated water arcs, Obi loves it, Luna avoids
- Bug Catching: ladybugs (3c), beetles (2c), ants (1c) spawn near garden
- Luna tree climbing: click tree to call her up/down
- Ambient status messages rotate every 8-14s
- Tooltips for pool, sprinkler, tree
- Birdhouse repositioned to tree, sundial moved, dog house repositioned with "OBI" nameplate
- Bug sizes increased 50%, sprinkler base enlarged with pulsing indicator

### Critical Bug Fixes
- Decor pages 3-7: canUnlockDecorItem() was a catch-22 blocking all coin-gated items
- Annie sideways on couch: facing reset to 1 when sitting
- Obi auto-nap: coordinates updated to new pet bed position (520, 468)
- Flower harvest: 30-second cooldown prevents infinite coin exploit

### Gameplay Fixes
- Pet bed redesigned as fancy sofa, moved to (520, 466) away from food bowl
- Minigame card text spacing adjusted
- Luna sunbeam game: pulsing "Click here!" indicator, clearer instructions
- Cache invalidation on ALL decoration toggles

## 2026-03-28

### 47 Original Bug Fixes (Phases 1-7)
- Core: drawButton gradient, dynamic tooltip sizing, tooltip pointer alignment, status bar clipping
- Display: star count /33, accessories count dynamic, garland Off/Spring/Summer/Autumn/Winter
- Scrolling: wardrobe, scrapbook photos, scrapbook milestones
- Minigames: Where's Luna positions, Window Watch hitbox, Cuddle Pile meter, accent bar radius
- Pet behaviors: Luna body slot, food/water filtering, Luna bubbles on perch, per-interaction timeouts, Obi bone visual, Luna jump arc
- Economy: dedication/daily gift overlay, care streak grace period, simultaneous eating, backyard coin pill
- Visual: title subtitle, wall clock second hand, music box sparkles, butterfly steering, garden harvest

### 9 Depth Features (3 Tiers)
- **Economy**: Scaled rewards, passive decoration income, Cozy Upgrades (5 items)
- **Pet Mood & Personality**: Daily moods per pet with joy multipliers
- **Challenge Stars**: 4th golden star per minigame with 11 unique modifiers
- **Care Effects**: Joy/food/water affect minigame bonuses
- **Dynamic Events**: 5 weather types, 4 visitor NPCs, snow particles
- **Scrapbook Goals**: 12 collection quests with Goals tab
- **Backyard Expansion**: Pond fishing, butterfly catching, picnic time
- **Room Reactions**: 7 decoration reactions
- **Pet Memory**: Session tracking, welcome-back messages

### Visual Polish (21 fixes from playtest)
- Backyard birdhouse/pool scale, Luna/Annie accessory sizes
- Sunbeams, bath background, laser obstacles, balance meter, cushion gradients
- Nighttime mode, fairy lights, wall clock, garland visibility
- Window Watch legend, menu scroll reset, tooltip persistence

### Input Fixes
- Canvas CSS aspect-ratio for web/mobile
- Touch/click double-fire prevention
- Petting hold exploit fixed (stroke interval 0.1→0.35s)
- Snack Sort drag grace period
