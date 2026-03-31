# Changelog — Annie's Cozy Day

## 2026-03-30

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
